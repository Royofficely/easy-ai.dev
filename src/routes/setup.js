const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const { User, ApiKey } = require('../models');

// Setup wizard - step 1: API key validation and user info retrieval
router.post('/validate-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey || !apiKey.startsWith('easyai_')) {
      return res.status(400).json({ 
        error: 'Invalid API key format. API key should start with "easyai_"' 
      });
    }
    
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const existingKey = await ApiKey.findOne({ where: { key_hash: hash } });
    
    if (existingKey) {
      const user = await User.findByPk(existingKey.user_id);
      return res.json({
        valid: true,
        exists: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    }
    
    res.json({ valid: true, exists: false });
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({ error: 'Failed to validate API key' });
  }
});

// Get user info by API key (for CLI setup)
router.post('/user-info', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey || !apiKey.startsWith('easyai_')) {
      return res.status(400).json({ 
        error: 'Invalid API key format' 
      });
    }
    
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const existingKey = await ApiKey.findOne({ where: { key_hash: hash } });
    
    if (existingKey) {
      const user = await User.findByPk(existingKey.user_id);
      console.log(`🔍 Found user for API key: ${user.email} (${user.name})`);
      
      return res.json({
        found: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          setup_completed: user.settings?.setup_completed || false
        }
      });
    }
    
    res.json({ found: false });
  } catch (error) {
    console.error('User info retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve user info' });
  }
});

// Setup wizard - step 2: Provider API key validation
router.post('/validate-provider-keys', async (req, res) => {
  try {
    const { openaiKey, anthropicKey, googleKey } = req.body;
    const results = {};
    
    // Validate OpenAI key
    if (openaiKey) {
      try {
        const response = await axios.get('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${openaiKey}` },
          timeout: 10000
        });
        results.openai = { valid: true, models: response.data.data.length };
      } catch (error) {
        results.openai = { valid: false, error: 'Invalid OpenAI API key' };
      }
    }
    
    // Validate Anthropic key
    if (anthropicKey) {
      try {
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        }, {
          headers: { 
            'x-api-key': anthropicKey,
            'content-type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          timeout: 10000
        });
        results.anthropic = { valid: true };
      } catch (error) {
        if (error.response?.status === 400) {
          results.anthropic = { valid: true }; // Key is valid, just bad request format
        } else {
          results.anthropic = { valid: false, error: 'Invalid Anthropic API key' };
        }
      }
    }
    
    // Validate Google AI key
    if (googleKey) {
      try {
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${googleKey}`, {
          timeout: 10000
        });
        results.google = { valid: true, models: response.data.models?.length || 0 };
      } catch (error) {
        results.google = { valid: false, error: 'Invalid Google AI API key' };
      }
    }
    
    res.json({ results });
  } catch (error) {
    console.error('Provider key validation error:', error);
    res.status(500).json({ error: 'Failed to validate provider keys' });
  }
});

// Setup wizard - step 3: Complete setup
router.post('/complete', async (req, res) => {
  try {
    const { 
      apiKey, 
      openaiKey, 
      anthropicKey, 
      googleKey,
      defaultModel,
      temperature,
      maxTokens,
      userEmail,
      userName
    } = req.body;
    
    // Create or update user and API key
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
    let user, apiKeyRecord;
    
    const existingKey = await ApiKey.findOne({ where: { key_hash: hash } });
    
    if (existingKey) {
      user = await User.findByPk(existingKey.user_id);
      apiKeyRecord = existingKey;
      
      // Update user info if provided and different
      if (userEmail && user.email !== userEmail) {
        await user.update({ email: userEmail });
        console.log(`📧 Updated user email to: ${userEmail}`);
      }
      if (userName && user.name !== userName) {
        await user.update({ name: userName });
        console.log(`👤 Updated user name to: ${userName}`);
      }
    } else {
      // Create new user - use provided email/name or fallback to generated ones
      const finalUserEmail = userEmail || `user_${apiKey.slice(-8)}@easyai.local`;
      const finalUserName = userName || `EasyAI User ${apiKey.slice(-8)}`;
      
      console.log(`🔑 Creating new user: ${finalUserEmail} (${finalUserName})`);
      
      user = await User.create({
        email: finalUserEmail,
        name: finalUserName,
        is_active: true,
        is_verified: true
      });
      
      // Create API key
      apiKeyRecord = await ApiKey.create({
        user_id: user.id,
        key_hash: hash,
        name: `CLI Key ${apiKey.slice(-8)}`,
        permissions: ['read', 'write'],
        is_active: true,
        last_used: new Date()
      });
    }
    
    // Update user settings with provider keys and preferences
    const encryptedSettings = {
      openai_key: openaiKey ? encrypt(openaiKey) : null,
      anthropic_key: anthropicKey ? encrypt(anthropicKey) : null,
      google_key: googleKey ? encrypt(googleKey) : null,
      default_model: defaultModel || 'gpt-4',
      temperature: temperature || 0.7,
      max_tokens: maxTokens || 1000,
      setup_completed: true,
      setup_date: new Date().toISOString()
    };
    
    await user.update({ settings: encryptedSettings });
    
    // Create welcome prompts
    await createWelcomePrompts(user.id);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      message: 'Setup completed successfully! Welcome to EasyAI!'
    });
    
  } catch (error) {
    console.error('Setup completion error:', error);
    res.status(500).json({ error: 'Failed to complete setup' });
  }
});

// CLI health check
router.get('/cli-health', async (req, res) => {
  try {
    const { 'x-api-key': apiKey } = req.headers;
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }
    
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const apiKeyRecord = await ApiKey.findOne({ where: { key_hash: hash } });
    
    if (!apiKeyRecord) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    const user = await User.findByPk(apiKeyRecord.user_id);
    const settings = user.settings || {};
    
    res.json({
      status: 'healthy',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        setup_completed: settings.setup_completed || false
      },
      server_time: new Date().toISOString(),
      dashboard_url: 'http://localhost:4000/dashboard'
    });
    
  } catch (error) {
    console.error('CLI health check error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Helper function to encrypt sensitive data
function encrypt(text) {
  if (!process.env.ENCRYPTION_KEY) {
    console.warn('No encryption key found, storing data unencrypted');
    return text;
  }
  
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Helper function to decrypt sensitive data
function decrypt(encryptedText) {
  if (!process.env.ENCRYPTION_KEY) {
    return encryptedText;
  }
  
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.warn('Failed to decrypt data:', error);
    return encryptedText;
  }
}

// Create welcome prompts for new users
async function createWelcomePrompts(userId) {
  const { Prompt } = require('../models');
  
  const welcomePrompts = [
    {
      name: 'Code Review Assistant',
      prompt_id: `code-review-${Date.now()}`,
      category: 'development',
      description: 'Helps review code for best practices, bugs, and improvements',
      content: 'Please review the following code and provide feedback on:\n1. Code quality and best practices\n2. Potential bugs or issues\n3. Performance improvements\n4. Security considerations\n\nCode:\n{code}',
      variables: ['code'],
      user_id: userId,
      template: 'Please review the following code and provide feedback on:\n1. Code quality and best practices\n2. Potential bugs or issues\n3. Performance improvements\n4. Security considerations\n\nCode:\n{code}'
    },
    {
      name: 'API Documentation Generator',
      prompt_id: `api-docs-${Date.now()}`,
      category: 'development',
      description: 'Generates comprehensive API documentation from code',
      content: 'Generate comprehensive API documentation for the following endpoint:\n\nEndpoint: {endpoint}\nMethod: {method}\nCode:\n{code}\n\nInclude:\n- Description\n- Parameters\n- Request/Response examples\n- Error codes\n- Authentication requirements',
      variables: ['endpoint', 'method', 'code'],
      user_id: userId,
      template: 'Generate comprehensive API documentation for the following endpoint:\n\nEndpoint: {endpoint}\nMethod: {method}\nCode:\n{code}\n\nInclude:\n- Description\n- Parameters\n- Request/Response examples\n- Error codes\n- Authentication requirements'
    },
    {
      name: 'Debug Helper',
      prompt_id: `debug-helper-${Date.now()}`,
      category: 'debugging',
      description: 'Helps debug issues and provides solutions',
      content: 'I\'m experiencing the following issue:\n\nError: {error}\nCode: {code}\nExpected behavior: {expected}\n\nPlease help me:\n1. Identify the root cause\n2. Provide a solution\n3. Suggest prevention strategies',
      variables: ['error', 'code', 'expected'],
      user_id: userId,
      template: 'I\'m experiencing the following issue:\n\nError: {error}\nCode: {code}\nExpected behavior: {expected}\n\nPlease help me:\n1. Identify the root cause\n2. Provide a solution\n3. Suggest prevention strategies'
    }
  ];
  
  for (const promptData of welcomePrompts) {
    try {
      await Prompt.create(promptData);
    } catch (error) {
      console.error('Failed to create welcome prompt:', error);
    }
  }
}

// Simple health check for server startup (no authentication required)
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

module.exports = router;