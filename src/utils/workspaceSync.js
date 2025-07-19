const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Try to load chokidar, fallback if not available
let chokidar = null;
try {
  chokidar = require('chokidar');
} catch (error) {
  console.log('⚠️  chokidar not available, file watching disabled');
}

class WorkspaceSync {
  constructor(workspacePath, io) {
    this.workspacePath = workspacePath;
    this.io = io;
    this.watchers = new Map();
    this.isWatching = false;
    this.isSyncing = false; // Flag to prevent infinite loops
    this.workspaceUserId = null; // Will be set when we get/create the workspace user
  }

  // Ensure workspace user exists in database
  async ensureWorkspaceUser() {
    try {
      // Dynamically import models to avoid circular dependencies
      const { User } = require('../models');
      
      const workspaceUserId = '550e8400-e29b-41d4-a716-446655440000'; // Fixed UUID for workspace user
      
      let user = await User.findByPk(workspaceUserId);
      
      if (!user) {
        console.log('👤 Creating workspace user in database...');
        user = await User.create({
          id: workspaceUserId,
          email: 'workspace@easyai.local',
          name: 'Workspace User',
          role: 'developer',
          is_verified: true,
          is_active: true
        });
        console.log('✅ Workspace user created');
      } else {
        console.log('👤 Workspace user exists in database');
      }
      
      this.workspaceUserId = workspaceUserId;
      return user;
    } catch (error) {
      console.error('Error ensuring workspace user:', error);
      // Fallback to workspace-user string for compatibility
      this.workspaceUserId = 'workspace-user';
      return null;
    }
  }

  // Initialize workspace watching
  startWatching() {
    if (this.isWatching) return;
    
    if (!chokidar) {
      console.log('📁 File watching not available (chokidar missing), using basic sync mode');
      this.isWatching = false;
      return;
    }
    
    console.log('🔍 Starting workspace file watching...');
    
    // Watch prompts directory
    const promptsPath = path.join(this.workspacePath, 'prompts');
    const promptsWatcher = chokidar.watch(promptsPath, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true
    });

    promptsWatcher
      .on('add', (filePath) => this.handleFileChange('prompts', 'add', filePath))
      .on('change', (filePath) => this.handleFileChange('prompts', 'change', filePath))
      .on('unlink', (filePath) => this.handleFileChange('prompts', 'delete', filePath));

    this.watchers.set('prompts', promptsWatcher);

    // Watch config directory
    const configPath = path.join(this.workspacePath, 'config');
    const configWatcher = chokidar.watch(configPath, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true
    });

    configWatcher
      .on('change', (filePath) => this.handleFileChange('config', 'change', filePath));

    this.watchers.set('config', configWatcher);

    this.isWatching = true;
    console.log('✅ Workspace watching started');
  }

  // Handle file system changes
  async handleFileChange(type, action, filePath) {
    try {
      console.log(`📁 File ${action}: ${filePath}`);
      
      // Prevent infinite loop - ignore ALL changes to index.json
      if (filePath.endsWith('index.json')) {
        console.log(`🔄 Ignoring index.json change to prevent infinite loop`);
        return;
      }
      
      // Only process .json files for prompts (except index.json)
      if (type === 'prompts' && !filePath.endsWith('.json')) {
        console.log(`🔄 Ignoring non-JSON file: ${filePath}`);
        return;
      }
      
      // Prevent rapid-fire changes
      if (this.isSyncing) {
        console.log(`🔄 Sync already in progress, skipping: ${path.basename(filePath)}`);
        return;
      }
      
      if (type === 'prompts') {
        // Set sync flag to prevent overlapping syncs
        this.isSyncing = true;
        
        try {
          console.log(`🔄 Processing ${action} for prompt file: ${path.basename(filePath)}`);
          
          // Load all prompts from individual files (NOT from index)
          const prompts = await this.loadPromptsFromFiles();
          
          // Update the index file with current prompts
          await this.updatePromptsIndex(prompts);
          
          // Emit comprehensive workspace prompts data to UI
          this.io.emit('workspace:prompts:sync', { 
            prompts,
            categories: [...new Set(prompts.map(p => p.category).filter(Boolean))],
            version: "1.0.0",
            lastSync: new Date().toISOString(),
            source: 'file_change',
            action: action,
            count: prompts.length
          });
          
          // Also emit specific file change event for real-time UI updates
          this.io.emit('workspace:file:changed', {
            type: 'prompts',
            action,
            filePath,
            promptCount: prompts.length,
            timestamp: new Date().toISOString()
          });
          
          console.log(`✅ Synced ${prompts.length} prompts after ${action} of ${path.basename(filePath)}`);
          
          // Also emit to specific workspace room if any clients are there
          this.io.to('workspace').emit('workspace:prompts:updated', {
            prompts,
            categories: [...new Set(prompts.map(p => p.category).filter(Boolean))],
            timestamp: new Date().toISOString(),
            source: 'file_change'
          });
          
          // Add a delay before allowing next sync
          setTimeout(() => {
            this.isSyncing = false;
          }, 1000);
          
        } catch (error) {
          this.isSyncing = false;
          throw error;
        }
      } else if (type === 'config') {
        // Immediately sync config to all connected clients
        await this.syncConfig();
        
        // Also emit specific file change event for real-time UI updates
        this.io.emit('workspace:file:changed', {
          type: 'config',
          action,
          filePath,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`✅ Real-time sync completed for ${type}`);
    } catch (error) {
      console.error('Error handling file change:', error);
      
      // Reset sync flag on error
      this.isSyncing = false;
      
      // Emit error to UI
      this.io.emit('workspace:error', {
        message: 'File sync failed',
        error: error.message,
        type,
        action,
        filePath,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Sync a single prompt to database
  async syncPromptToDatabase(prompt) {
    try {
      if (!this.workspaceUserId) {
        await this.ensureWorkspaceUser();
      }
      
      if (!this.workspaceUserId) {
        console.log('❌ Cannot sync to database - no workspace user');
        return false;
      }
      
      // Dynamically import models to avoid circular dependencies
      const { Prompt } = require('../models');
      
      // Check if prompt already exists in database
      let dbPrompt = await Prompt.findOne({
        where: {
          prompt_id: prompt.prompt_id,
          user_id: this.workspaceUserId
        }
      });
      
      const promptData = {
        user_id: this.workspaceUserId,
        name: prompt.name,
        prompt_id: prompt.prompt_id,
        description: prompt.description || '',
        category: prompt.category || 'general',
        tags: prompt.tags || [],
        content: prompt.content || '',
        template: prompt.template || prompt.content || '',
        variables: prompt.variables || [],
        parameters: prompt.parameters || {},
        model_config: prompt.model_config || {
          primary: 'gpt-4',
          fallbacks: ['gpt-3.5-turbo']
        },
        options: prompt.options || {
          temperature: 0.7,
          max_tokens: 1000
        },
        environments: prompt.environments || {
          development: {},
          staging: {},
          production: {}
        },
        version: prompt.version || 1,
        is_active: true
      };
      
      if (dbPrompt) {
        // Update existing prompt
        await dbPrompt.update(promptData);
        console.log(`📝 Updated prompt in database: ${prompt.name}`);
      } else {
        // Create new prompt
        dbPrompt = await Prompt.create(promptData);
        console.log(`✅ Created prompt in database: ${prompt.name}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error syncing prompt ${prompt.name} to database:`, error);
      return false;
    }
  }

  // Sync all workspace prompts to database
  async syncPromptsToDatabase(prompts) {
    if (!prompts || prompts.length === 0) {
      console.log('📋 No prompts to sync to database');
      return;
    }
    
    console.log(`🔄 Syncing ${prompts.length} prompts to database...`);
    let synced = 0;
    
    for (const prompt of prompts) {
      try {
        const success = await this.syncPromptToDatabase(prompt);
        if (success) synced++;
      } catch (error) {
        console.error(`Error syncing prompt ${prompt.name}:`, error);
      }
    }
    
    console.log(`✅ Synced ${synced}/${prompts.length} prompts to database`);
  }

  // Sync prompts with frontend and database
  async syncPrompts() {
    try {
      const prompts = await this.loadPrompts();
      const categories = [...new Set(prompts.map(p => p.category).filter(Boolean))];
      
      console.log(`🔄 Syncing ${prompts.length} prompts to UI and database`);
      
      // Sync to database first
      await this.syncPromptsToDatabase(prompts);
      
      // Emit comprehensive workspace prompts data to UI
      this.io.emit('workspace:prompts:sync', { 
        prompts,
        categories,
        version: "1.0.0",
        lastSync: new Date().toISOString(),
        source: 'workspace_sync',
        count: prompts.length
      });
      
      // Also emit to specific workspace room if any clients are there
      this.io.to('workspace').emit('workspace:prompts:updated', {
        prompts,
        categories,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error syncing prompts:', error);
      this.io.emit('workspace:error', {
        message: 'Failed to sync prompts',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Sync config with frontend
  async syncConfig() {
    try {
      const config = await this.getConfig();
      this.io.emit('workspace:config:sync', config);
    } catch (error) {
      console.error('Error syncing config:', error);
    }
  }

  // Get prompts index
  async getPromptsIndex() {
    const indexPath = path.join(this.workspacePath, 'prompts', 'index.json');
    if (fs.existsSync(indexPath)) {
      return JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    }
    return { prompts: [], categories: [], lastSync: new Date().toISOString() };
  }

  // Get config
  async getConfig() {
    const configPath = path.join(this.workspacePath, 'config', 'settings.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return {};
  }

  // Save prompts to workspace
  async savePrompts(prompts) {
    try {
      // Save individual prompt files
      for (const prompt of prompts) {
        await this.savePrompt(prompt);
      }

      // Update index
      await this.updatePromptsIndex(prompts);

      console.log(`✅ Saved ${prompts.length} prompts to workspace`);
      return true;
    } catch (error) {
      console.error('Error saving prompts to workspace:', error);
      return false;
    }
  }

  // Save a single prompt to workspace
  async savePrompt(prompt) {
    try {
      const promptsDir = path.join(this.workspacePath, 'prompts');
      
      // Ensure prompts directory exists
      if (!fs.existsSync(promptsDir)) {
        fs.mkdirSync(promptsDir, { recursive: true });
      }
      
      // Generate filename from name, fallback to prompt_id
      const safeName = prompt.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled';
      const filename = safeName || prompt.prompt_id;
      const promptFile = path.join(promptsDir, `${filename}.json`);
      
      // Add timestamp if not present
      const promptWithTimestamp = {
        ...prompt,
        updated_at: prompt.updated_at || new Date().toISOString()
      };
      
      fs.writeFileSync(promptFile, JSON.stringify(promptWithTimestamp, null, 2));
      console.log(`💾 Saved prompt: ${filename}.json`);
      return true;
    } catch (error) {
      console.error('Error saving prompt to workspace:', error);
      return false;
    }
  }

  // Delete a prompt from workspace
  async deletePrompt(promptId) {
    try {
      const promptsDir = path.join(this.workspacePath, 'prompts');
      const files = fs.readdirSync(promptsDir);
      
      // Find and delete the prompt file
      for (const file of files) {
        if (file.endsWith('.json') && file !== 'index.json') {
          const filePath = path.join(promptsDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const prompt = JSON.parse(content);
          
          if (prompt.prompt_id === promptId) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Deleted prompt file: ${file}`);
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting prompt from workspace:', error);
      return false;
    }
  }

  // Load prompts from individual files only (no index update)
  async loadPromptsFromFiles() {
    try {
      const promptsDir = path.join(this.workspacePath, 'prompts');
      const prompts = [];
      
      if (!fs.existsSync(promptsDir)) {
        return [];
      }
      
      // Read all .json files in prompts directory (except index.json)
      const files = fs.readdirSync(promptsDir);
      const promptFiles = files.filter(file => file.endsWith('.json') && file !== 'index.json');
      
      for (const file of promptFiles) {
        try {
          const filePath = path.join(promptsDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const prompt = JSON.parse(content);
          
          // Ensure prompt has required fields
          if (prompt.prompt_id && prompt.name) {
            prompts.push(prompt);
          }
        } catch (error) {
          console.error(`Error loading prompt file ${file}:`, error);
        }
      }
      
      console.log(`📋 Loaded ${prompts.length} prompts from files`);
      return prompts;
    } catch (error) {
      console.error('Error loading prompts from files:', error);
      return [];
    }
  }

  // Load prompts from workspace (load from individual files AND index)
  async loadPrompts() {
    // Use the file-only loader to prevent infinite loops
    return await this.loadPromptsFromFiles();
  }

  // Update prompts index
  async updatePromptsIndex(prompts) {
    try {
      const indexPath = path.join(this.workspacePath, 'prompts', 'index.json');
      const promptsIndex = {
        version: "1.0.0",
        prompts: prompts,
        categories: [...new Set(prompts.map(p => p.category).filter(Boolean))],
        lastSync: new Date().toISOString()
      };

      fs.writeFileSync(indexPath, JSON.stringify(promptsIndex, null, 2));
      return true;
    } catch (error) {
      console.error('Error updating prompts index:', error);
      return false;
    }
  }

  // Save config to workspace
  async saveConfig(config) {
    try {
      const configPath = path.join(this.workspacePath, 'config', 'settings.json');
      const updatedConfig = {
        ...config,
        lastUpdated: new Date().toISOString()
      };

      fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
      console.log('✅ Config saved to workspace');
      return true;
    } catch (error) {
      console.error('Error saving config to workspace:', error);
      return false;
    }
  }

  // Stop watching
  stopWatching() {
    console.log('🔍 Stopping workspace file watching...');
    
    this.watchers.forEach((watcher, key) => {
      watcher.close();
      console.log(`   • Stopped watching ${key}`);
    });
    
    this.watchers.clear();
    this.isWatching = false;
    console.log('✅ Workspace watching stopped');
  }

  // Get workspace info
  getWorkspaceInfo() {
    return {
      path: this.workspacePath,
      isWatching: this.isWatching,
      watchers: Array.from(this.watchers.keys())
    };
  }
}

module.exports = WorkspaceSync;