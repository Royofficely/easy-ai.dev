const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticateApiKey } = require('../middleware/auth');

const router = express.Router();

// Get current environment settings
router.get('/env', authenticateApiKey, async (req, res) => {
  try {
    // Use workspace-specific .env if in workspace mode
    const workspacePath = process.env.EASYAI_WORKSPACE_PATH || process.cwd();
    const envPath = path.join(workspacePath, '.env');
    const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    
    // Parse .env content safely
    const settings = {};
    const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      
      // Only return non-sensitive settings
      if (key && !key.includes('SECRET') && !key.includes('PASSWORD')) {
        settings[key.trim()] = value.trim().replace(/['"]/g, '');
      }
    });
    
    res.json({ settings });
  } catch (error) {
    console.error('Error reading .env:', error);
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

// Update environment settings
router.put('/env', authenticateApiKey, async (req, res) => {
  try {
    const { settings } = req.body;
    // Use workspace-specific .env if in workspace mode
    const workspacePath = process.env.EASYAI_WORKSPACE_PATH || process.cwd();
    const envPath = path.join(workspacePath, '.env');
    
    // Read existing .env
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    let lines = envContent.split('\n');
    
    // Update or add settings
    Object.entries(settings).forEach(([key, value]) => {
      // Skip sensitive keys
      if (key.includes('SECRET') || key.includes('PASSWORD')) {
        return;
      }
      
      const lineIndex = lines.findIndex(line => line.startsWith(key + '='));
      const newLine = `${key}=${value}`;
      
      if (lineIndex !== -1) {
        lines[lineIndex] = newLine;
      } else {
        lines.push(newLine);
      }
    });
    
    // Write back to .env
    fs.writeFileSync(envPath, lines.join('\n'));
    
    // Reload process.env (note: this won't restart the server)
    require('dotenv').config();
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating .env:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get current API keys (masked for security)
router.get('/api-keys', authenticateApiKey, async (req, res) => {
  try {
    // Use workspace-specific .env if in workspace mode
    const workspacePath = process.env.EASYAI_WORKSPACE_PATH || process.cwd();
    const envPath = path.join(workspacePath, '.env');
    const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    
    // Parse .env content for API keys
    const apiKeys = {};
    const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim().replace(/['"]/g, '');
      
      // Look for common API key patterns
      if (key && value) {
        if (key.trim() === 'OPENAI_API_KEY') {
          apiKeys.openai = value ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}` : '';
        } else if (key.trim() === 'ANTHROPIC_API_KEY') {
          apiKeys.anthropic = value ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}` : '';
        } else if (key.trim() === 'GOOGLE_AI_API_KEY') {
          apiKeys.google = value ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}` : '';
        }
      }
    });
    
    res.json({ apiKeys });
  } catch (error) {
    console.error('Error reading API keys:', error);
    res.status(500).json({ error: 'Failed to read API keys' });
  }
});

// Update API keys
router.put('/api-keys', authenticateApiKey, async (req, res) => {
  try {
    const { apiKeys } = req.body;
    // Use workspace-specific .env if in workspace mode
    const workspacePath = process.env.EASYAI_WORKSPACE_PATH || process.cwd();
    const envPath = path.join(workspacePath, '.env');
    
    // Read existing .env
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    let lines = envContent.split('\n');
    
    // Map UI keys to env var names
    const keyMapping = {
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      google: 'GOOGLE_AI_API_KEY'
    };
    
    // Update or add API keys
    Object.entries(apiKeys).forEach(([provider, value]) => {
      if (keyMapping[provider] && value && value.trim()) {
        const envKey = keyMapping[provider];
        const lineIndex = lines.findIndex(line => line.startsWith(envKey + '='));
        const newLine = `${envKey}=${value.trim()}`;
        
        if (lineIndex !== -1) {
          lines[lineIndex] = newLine;
        } else {
          lines.push(newLine);
        }
      }
    });
    
    // Write back to .env
    fs.writeFileSync(envPath, lines.join('\n'));
    
    // Reload process.env
    require('dotenv').config();
    
    console.log('✅ API keys updated successfully');
    res.json({ message: 'API keys updated successfully' });
  } catch (error) {
    console.error('Error updating API keys:', error);
    res.status(500).json({ error: 'Failed to update API keys' });
  }
});

// Get available models based on configured API keys
router.get('/models', authenticateApiKey, async (req, res) => {
  try {
    const models = [];
    
    if (process.env.OPENAI_API_KEY) {
      models.push(
        { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' }
      );
    }
    
    if (process.env.ANTHROPIC_API_KEY) {
      models.push(
        { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'anthropic' },
        { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'anthropic' }
      );
    }
    
    if (process.env.GOOGLE_AI_API_KEY) {
      models.push(
        { id: 'gemini-pro', name: 'Gemini Pro', provider: 'google' }
      );
    }
    
    res.json({ models });
  } catch (error) {
    console.error('Error getting models:', error);
    res.status(500).json({ error: 'Failed to get models' });
  }
});

// Get all prompts organized by categories
router.get('/prompts', authenticateApiKey, async (req, res) => {
  try {
    const promptsPath = path.join(process.cwd(), 'src/prompts');
    
    if (!fs.existsSync(promptsPath)) {
      fs.mkdirSync(promptsPath, { recursive: true });
    }
    
    const categories = {};
    const files = fs.readdirSync(promptsPath);
    
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const filePath = path.join(promptsPath, file);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        const category = content.category || 'general';
        if (!categories[category]) {
          categories[category] = [];
        }
        
        categories[category].push({
          id: file.replace('.json', ''),
          name: content.name || file.replace('.json', ''),
          description: content.description || '',
          template: content.template || content.prompt || '',
          parameters: content.parameters || {},
          model: content.model || 'gpt-4',
          lastModified: fs.statSync(filePath).mtime
        });
      }
    });
    
    res.json({ categories });
  } catch (error) {
    console.error('Error reading prompts:', error);
    res.status(500).json({ error: 'Failed to read prompts' });
  }
});

// Create or update prompt
router.post('/prompts', authenticateApiKey, async (req, res) => {
  try {
    const { id, name, description, template, parameters, model, category } = req.body;
    
    const promptsPath = path.join(process.cwd(), 'src/prompts');
    if (!fs.existsSync(promptsPath)) {
      fs.mkdirSync(promptsPath, { recursive: true });
    }
    
    const promptData = {
      name,
      description,
      template,
      parameters: parameters || {},
      model: model || 'gpt-4',
      category: category || 'general',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };
    
    const fileName = id || name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const filePath = path.join(promptsPath, `${fileName}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(promptData, null, 2));
    
    res.json({ message: 'Prompt saved successfully', id: fileName });
  } catch (error) {
    console.error('Error saving prompt:', error);
    res.status(500).json({ error: 'Failed to save prompt' });
  }
});

// Delete prompt
router.delete('/prompts/:id', authenticateApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const promptsPath = path.join(process.cwd(), 'src/prompts');
    const filePath = path.join(promptsPath, `${id}.json`);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Prompt deleted successfully' });
    } else {
      res.status(404).json({ error: 'Prompt not found' });
    }
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({ error: 'Failed to delete prompt' });
  }
});

module.exports = router;