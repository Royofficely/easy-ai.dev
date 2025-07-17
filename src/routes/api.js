const express = require('express');
const { authenticateApiKey, checkPermission } = require('../middleware/auth');
const { validateInput } = require('../middleware/validation');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { User, ApiKey, Prompt, RequestLog } = require('../models');
const { generateApiKey } = require('../utils/apiKeyUtils');

const router = express.Router();

// Create API key
router.post('/api-keys', authenticateApiKey, checkPermission('write'), validateInput('createApiKey'), async (req, res) => {
  try {
    const { name, permissions = ['read', 'write'], expires_at } = req.body;
    
    const keyData = ApiKey.generateKey();
    
    const apiKey = await ApiKey.create({
      user_id: req.user.id,
      name,
      key_hash: keyData.hash,
      key_prefix: keyData.prefix,
      permissions,
      expires_at: expires_at ? new Date(expires_at) : null
    });

    res.status(201).json({
      message: 'API key created successfully',
      api_key: keyData.key,
      id: apiKey.id,
      name: apiKey.name,
      permissions: apiKey.permissions,
      expires_at: apiKey.expires_at
    });
  } catch (error) {
    console.error('API key creation error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// List API keys
router.get('/api-keys', authenticateApiKey, async (req, res) => {
  try {
    const apiKeys = await ApiKey.findAll({
      where: { user_id: req.user.id, is_active: true },
      attributes: ['id', 'name', 'key_prefix', 'permissions', 'last_used', 'usage_count', 'expires_at', 'created_at']
    });

    res.json({ api_keys: apiKeys });
  } catch (error) {
    console.error('API keys list error:', error);
    res.status(500).json({ error: 'Failed to retrieve API keys' });
  }
});

// Delete API key
router.delete('/api-keys/:id', authenticateApiKey, checkPermission('write'), async (req, res) => {
  try {
    const apiKey = await ApiKey.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    apiKey.is_active = false;
    await apiKey.save();

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('API key deletion error:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// Get user analytics
router.get('/analytics', authenticateApiKey, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const logs = await RequestLog.findAll({
      where: {
        user_id: req.user.id,
        created_at: { $gte: since }
      },
      order: [['created_at', 'DESC']]
    });

    const analytics = {
      total_requests: logs.length,
      successful_requests: logs.filter(log => log.status === 'success').length,
      failed_requests: logs.filter(log => log.status === 'error').length,
      total_tokens: logs.reduce((sum, log) => sum + log.tokens_used, 0),
      total_cost: logs.reduce((sum, log) => sum + parseFloat(log.cost), 0),
      average_duration: logs.length > 0 ? logs.reduce((sum, log) => sum + log.duration_ms, 0) / logs.length : 0,
      models_used: [...new Set(logs.map(log => log.model_used))],
      recent_requests: logs.slice(0, 10)
    };

    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;