const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Get workspace info
router.get('/info', (req, res) => {
  try {
    const workspacePath = path.join(process.cwd(), 'easyai');
    
    if (!fs.existsSync(workspacePath)) {
      return res.status(404).json({ 
        error: 'Workspace not found',
        message: 'No easyai workspace directory found in current directory'
      });
    }
    
    // Check workspace structure
    const structure = {
      hasPrompts: fs.existsSync(path.join(workspacePath, 'prompts')),
      hasConfig: fs.existsSync(path.join(workspacePath, 'config')),
      hasData: fs.existsSync(path.join(workspacePath, 'data')),
      hasEnv: fs.existsSync(path.join(workspacePath, '.env')),
    };
    
    res.json({
      path: workspacePath,
      structure,
      exists: true,
      createdAt: fs.statSync(workspacePath).birthtime,
      lastModified: fs.statSync(workspacePath).mtime
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get workspace info',
      message: error.message 
    });
  }
});

// Get prompts from workspace
router.get('/prompts', async (req, res) => {
  try {
    // Try to get prompts from workspace sync first
    const workspaceSync = req.app.get('workspaceSync');
    
    if (workspaceSync) {
      console.log('🔄 Loading prompts via workspace sync');
      const prompts = await workspaceSync.loadPrompts();
      const categories = [...new Set(prompts.map(p => p.category).filter(Boolean))];
      
      return res.json({ 
        prompts,
        categories,
        version: "1.0.0",
        lastSync: new Date().toISOString(),
        source: 'workspace_sync'
      });
    }
    
    // Fallback to direct file system access
    const workspacePath = path.join(process.cwd(), 'easyai');
    const promptsIndexPath = path.join(workspacePath, 'prompts', 'index.json');
    
    if (!fs.existsSync(promptsIndexPath)) {
      return res.json({ prompts: [], categories: [], source: 'filesystem_fallback' });
    }
    
    const promptsIndex = JSON.parse(fs.readFileSync(promptsIndexPath, 'utf8'));
    res.json({ ...promptsIndex, source: 'filesystem_fallback' });
  } catch (error) {
    console.error('Error loading workspace prompts:', error);
    res.status(500).json({ 
      error: 'Failed to load workspace prompts',
      message: error.message 
    });
  }
});

// Save prompts to workspace
router.post('/prompts', (req, res) => {
  try {
    const { prompts } = req.body;
    const workspacePath = path.join(process.cwd(), 'easyai');
    const promptsPath = path.join(workspacePath, 'prompts');
    
    // Ensure prompts directory exists
    if (!fs.existsSync(promptsPath)) {
      fs.mkdirSync(promptsPath, { recursive: true });
    }
    
    // Save prompts index
    const promptsIndex = {
      version: "1.0.0",
      prompts: prompts || [],
      categories: [...new Set((prompts || []).map(p => p.category).filter(Boolean))],
      lastSync: new Date().toISOString()
    };
    
    const promptsIndexPath = path.join(promptsPath, 'index.json');
    fs.writeFileSync(promptsIndexPath, JSON.stringify(promptsIndex, null, 2));
    
    // Save individual prompt files
    for (const prompt of prompts || []) {
      const promptFile = path.join(promptsPath, `${prompt.prompt_id}.json`);
      fs.writeFileSync(promptFile, JSON.stringify(prompt, null, 2));
    }
    
    res.json({ 
      success: true,
      message: 'Prompts saved to workspace',
      count: (prompts || []).length 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to save workspace prompts',
      message: error.message 
    });
  }
});

// Get workspace config
router.get('/config', (req, res) => {
  try {
    const workspacePath = path.join(process.cwd(), 'easyai');
    const configPath = path.join(workspacePath, 'config', 'settings.json');
    
    if (!fs.existsSync(configPath)) {
      return res.json({});
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    res.json(config);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to load workspace config',
      message: error.message 
    });
  }
});

// Save workspace config
router.post('/config', (req, res) => {
  try {
    const config = req.body;
    const workspacePath = path.join(process.cwd(), 'easyai');
    const configDir = path.join(workspacePath, 'config');
    const configPath = path.join(configDir, 'settings.json');
    
    // Ensure config directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    const updatedConfig = {
      ...config,
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
    
    res.json({ 
      success: true,
      message: 'Config saved to workspace',
      config: updatedConfig
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to save workspace config',
      message: error.message 
    });
  }
});

// Sync workspace (force reload all data)
router.post('/sync', (req, res) => {
  try {
    const workspacePath = path.join(process.cwd(), 'easyai');
    
    if (!fs.existsSync(workspacePath)) {
      return res.status(404).json({ 
        error: 'Workspace not found',
        message: 'No easyai workspace directory found'
      });
    }
    
    // Load all workspace data
    const promptsIndexPath = path.join(workspacePath, 'prompts', 'index.json');
    const configPath = path.join(workspacePath, 'config', 'settings.json');
    
    const data = {
      prompts: fs.existsSync(promptsIndexPath) ? 
        JSON.parse(fs.readFileSync(promptsIndexPath, 'utf8')) : 
        { prompts: [], categories: [] },
      config: fs.existsSync(configPath) ? 
        JSON.parse(fs.readFileSync(configPath, 'utf8')) : 
        {}
    };
    
    res.json({
      success: true,
      message: 'Workspace synced successfully',
      data,
      syncTime: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to sync workspace',
      message: error.message 
    });
  }
});

module.exports = router;