const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();

// Middleware to authenticate and track API usage
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }
    
    const { ApiKey, User } = require('../models');
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const apiKeyRecord = await ApiKey.findOne({ where: { key_hash: hash } });
    
    if (!apiKeyRecord || !apiKeyRecord.is_active) {
      return res.status(401).json({ error: 'Invalid or inactive API key' });
    }
    
    const user = await User.findByPk(apiKeyRecord.user_id);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid user account' });
    }
    
    req.user = user;
    req.apiKey = apiKeyRecord;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// OpenAI Proxy - intercepts calls from Claude Code/Cursor
router.all('/openai/*', authenticateApiKey, async (req, res) => {
  try {
    const user = req.user;
    const settings = user.settings || {};
    
    // Extract OpenAI API key from user settings
    const openaiKey = settings.openai_key ? decrypt(settings.openai_key) : null;
    
    if (!openaiKey) {
      return res.status(400).json({ 
        error: 'OpenAI API key not configured. Please add it in your EasyAI dashboard settings.' 
      });
    }
    
    // Extract the path after /proxy/openai/
    const targetPath = req.path.replace('/openai/', '/');
    const targetUrl = `https://api.openai.com${targetPath}`;
    
    // Log the request for analytics
    const requestLog = {
      user_id: user.id,
      provider: 'openai',
      endpoint: targetPath,
      method: req.method,
      timestamp: new Date(),
      source: 'ide_proxy'
    };
    
    // Forward request to OpenAI
    const forwardedHeaders = {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'EasyAI-Proxy/1.0'
    };
    
    console.log(`🔄 Proxying ${req.method} ${targetUrl} for user ${user.email}`);
    
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: forwardedHeaders,
      data: req.body,
      timeout: 30000
    });
    
    // Calculate cost estimation
    const cost = calculateOpenAICost(req.body, response.data);
    requestLog.estimated_cost = cost;
    requestLog.tokens_used = response.data.usage?.total_tokens || 0;
    requestLog.status = 'success';
    
    // Save request log
    await saveRequestLog(requestLog);
    
    // Emit real-time update via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('api_call', {
        user_id: user.id,
        provider: 'openai',
        cost: cost,
        tokens: response.data.usage?.total_tokens || 0,
        timestamp: new Date()
      });
    }
    
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('OpenAI proxy error:', error);
    
    // Log failed request
    await saveRequestLog({
      user_id: req.user.id,
      provider: 'openai',
      endpoint: req.path,
      method: req.method,
      timestamp: new Date(),
      status: 'error',
      error: error.message,
      source: 'ide_proxy'
    });
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: 'Proxy request failed',
        message: error.message 
      });
    }
  }
});

// Anthropic Proxy - intercepts calls to Claude
router.all('/anthropic/*', authenticateApiKey, async (req, res) => {
  try {
    const user = req.user;
    const settings = user.settings || {};
    
    const anthropicKey = settings.anthropic_key ? decrypt(settings.anthropic_key) : null;
    
    if (!anthropicKey) {
      return res.status(400).json({ 
        error: 'Anthropic API key not configured. Please add it in your EasyAI dashboard settings.' 
      });
    }
    
    const targetPath = req.path.replace('/anthropic/', '/');
    const targetUrl = `https://api.anthropic.com${targetPath}`;
    
    const requestLog = {
      user_id: user.id,
      provider: 'anthropic',
      endpoint: targetPath,
      method: req.method,
      timestamp: new Date(),
      source: 'ide_proxy'
    };
    
    const forwardedHeaders = {
      'x-api-key': anthropicKey,
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
      'User-Agent': 'EasyAI-Proxy/1.0'
    };
    
    console.log(`🔄 Proxying ${req.method} ${targetUrl} for user ${user.email}`);
    
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: forwardedHeaders,
      data: req.body,
      timeout: 30000
    });
    
    const cost = calculateAnthropicCost(req.body, response.data);
    requestLog.estimated_cost = cost;
    requestLog.tokens_used = response.data.usage?.total_tokens || 0;
    requestLog.status = 'success';
    
    await saveRequestLog(requestLog);
    
    const io = req.app.get('io');
    if (io) {
      io.emit('api_call', {
        user_id: user.id,
        provider: 'anthropic',
        cost: cost,
        tokens: response.data.usage?.total_tokens || 0,
        timestamp: new Date()
      });
    }
    
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('Anthropic proxy error:', error);
    
    await saveRequestLog({
      user_id: req.user.id,
      provider: 'anthropic',
      endpoint: req.path,
      method: req.method,
      timestamp: new Date(),
      status: 'error',
      error: error.message,
      source: 'ide_proxy'
    });
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Proxy request failed' });
    }
  }
});

// Google AI Proxy
router.all('/google/*', authenticateApiKey, async (req, res) => {
  try {
    const user = req.user;
    const settings = user.settings || {};
    
    const googleKey = settings.google_key ? decrypt(settings.google_key) : null;
    
    if (!googleKey) {
      return res.status(400).json({ 
        error: 'Google AI API key not configured. Please add it in your EasyAI dashboard settings.' 
      });
    }
    
    const targetPath = req.path.replace('/google/', '/');
    const targetUrl = `https://generativelanguage.googleapis.com${targetPath}?key=${googleKey}`;
    
    const requestLog = {
      user_id: user.id,
      provider: 'google',
      endpoint: targetPath,
      method: req.method,
      timestamp: new Date(),
      source: 'ide_proxy'
    };
    
    console.log(`🔄 Proxying ${req.method} ${targetUrl} for user ${user.email}`);
    
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EasyAI-Proxy/1.0'
      },
      data: req.body,
      timeout: 30000
    });
    
    const cost = calculateGoogleCost(req.body, response.data);
    requestLog.estimated_cost = cost;
    requestLog.status = 'success';
    
    await saveRequestLog(requestLog);
    
    const io = req.app.get('io');
    if (io) {
      io.emit('api_call', {
        user_id: user.id,
        provider: 'google',
        cost: cost,
        timestamp: new Date()
      });
    }
    
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('Google AI proxy error:', error);
    
    await saveRequestLog({
      user_id: req.user.id,
      provider: 'google',
      endpoint: req.path,
      method: req.method,
      timestamp: new Date(),
      status: 'error',
      error: error.message,
      source: 'ide_proxy'
    });
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Proxy request failed' });
    }
  }
});

// Proxy statistics endpoint
router.get('/stats', authenticateApiKey, async (req, res) => {
  try {
    const { RequestLog } = require('../models');
    const user = req.user;
    const { period = '24h' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const since = new Date();
    switch (period) {
      case '1h':
        since.setHours(now.getHours() - 1);
        break;
      case '24h':
        since.setDate(now.getDate() - 1);
        break;
      case '7d':
        since.setDate(now.getDate() - 7);
        break;
      case '30d':
        since.setDate(now.getDate() - 30);
        break;
      default:
        since.setDate(now.getDate() - 1);
    }
    
    const stats = await RequestLog.findAll({
      where: {
        user_id: user.id,
        timestamp: {
          [require('sequelize').Op.gte]: since
        }
      },
      attributes: [
        'provider',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'request_count'],
        [require('sequelize').fn('SUM', require('sequelize').col('estimated_cost')), 'total_cost'],
        [require('sequelize').fn('SUM', require('sequelize').col('tokens_used')), 'total_tokens']
      ],
      group: ['provider']
    });
    
    res.json({
      period,
      since: since.toISOString(),
      stats: stats.map(stat => ({
        provider: stat.provider,
        requests: parseInt(stat.dataValues.request_count),
        cost: parseFloat(stat.dataValues.total_cost || 0),
        tokens: parseInt(stat.dataValues.total_tokens || 0)
      }))
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Helper functions
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

function calculateOpenAICost(requestData, responseData) {
  const model = requestData?.model || 'gpt-3.5-turbo';
  const usage = responseData?.usage;
  
  if (!usage) return 0;
  
  // OpenAI pricing (as of 2024)
  const pricing = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 }
  };
  
  const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
  const inputCost = (usage.prompt_tokens / 1000) * modelPricing.input;
  const outputCost = (usage.completion_tokens / 1000) * modelPricing.output;
  
  return inputCost + outputCost;
}

function calculateAnthropicCost(requestData, responseData) {
  const model = requestData?.model || 'claude-3-sonnet-20240229';
  const usage = responseData?.usage;
  
  if (!usage) return 0;
  
  // Anthropic pricing
  const pricing = {
    'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
    'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 }
  };
  
  const modelPricing = pricing[model] || pricing['claude-3-sonnet-20240229'];
  const inputCost = (usage.input_tokens / 1000) * modelPricing.input;
  const outputCost = (usage.output_tokens / 1000) * modelPricing.output;
  
  return inputCost + outputCost;
}

function calculateGoogleCost(requestData, responseData) {
  // Google AI pricing is typically per character
  const model = requestData?.model || 'gemini-pro';
  
  // Simplified cost calculation - you'd need to implement proper character counting
  return 0.001; // Placeholder
}

async function saveRequestLog(logData) {
  try {
    const { RequestLog } = require('../models');
    await RequestLog.create(logData);
  } catch (error) {
    console.error('Failed to save request log:', error);
  }
}

module.exports = router;