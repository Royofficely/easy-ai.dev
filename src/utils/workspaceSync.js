const fs = require('fs');
const path = require('path');

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
  handleFileChange(type, action, filePath) {
    try {
      console.log(`📁 File ${action}: ${filePath}`);
      
      if (type === 'prompts') {
        this.syncPrompts();
      } else if (type === 'config') {
        this.syncConfig();
      }
    } catch (error) {
      console.error('Error handling file change:', error);
    }
  }

  // Sync prompts with frontend
  async syncPrompts() {
    try {
      const promptsIndex = await this.getPromptsIndex();
      this.io.emit('workspace:prompts:sync', promptsIndex);
    } catch (error) {
      console.error('Error syncing prompts:', error);
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
      const indexPath = path.join(this.workspacePath, 'prompts', 'index.json');
      const promptsIndex = {
        version: "1.0.0",
        prompts: prompts,
        categories: [...new Set(prompts.map(p => p.category).filter(Boolean))],
        lastSync: new Date().toISOString()
      };

      fs.writeFileSync(indexPath, JSON.stringify(promptsIndex, null, 2));

      // Save individual prompt files
      for (const prompt of prompts) {
        const promptFile = path.join(this.workspacePath, 'prompts', `${prompt.prompt_id}.json`);
        fs.writeFileSync(promptFile, JSON.stringify(prompt, null, 2));
      }

      console.log('✅ Prompts saved to workspace');
      return true;
    } catch (error) {
      console.error('Error saving prompts to workspace:', error);
      return false;
    }
  }

  // Load prompts from workspace
  async loadPrompts() {
    try {
      const promptsIndex = await this.getPromptsIndex();
      return promptsIndex.prompts || [];
    } catch (error) {
      console.error('Error loading prompts from workspace:', error);
      return [];
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