const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get current environment settings
router.get('/env', authenticateToken, async (req, res) => {
  try {
    const envPath = path.join(process.cwd(), '.env');
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
router.put('/env', authenticateToken, async (req, res) => {
  try {
    const { settings } = req.body;
    const envPath = path.join(process.cwd(), '.env');
    
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

// Get all prompts organized by categories
router.get('/prompts', authenticateToken, async (req, res) => {
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
router.post('/prompts', authenticateToken, async (req, res) => {
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
router.delete('/prompts/:id', authenticateToken, async (req, res) => {
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