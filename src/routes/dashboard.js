const express = require('express');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const { ApiKey } = require('../models');

const router = express.Router();

// Serve dashboard static files
router.use('/static', express.static(path.join(__dirname, '../../public')));

// Dashboard main page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/dashboard.html'));
});

// Dashboard API endpoints
router.get('/api/user', authenticateToken, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,
    is_verified: req.user.is_verified
  });
});

// Create API key using JWT token
router.post('/api/api-keys', authenticateToken, async (req, res) => {
  try {
    const { name = 'Dashboard Key' } = req.body;
    
    const keyData = ApiKey.generateKey();
    
    const apiKey = await ApiKey.create({
      user_id: req.user.id,
      name,
      key_hash: keyData.hash,
      key_prefix: keyData.prefix,
      permissions: ['read', 'write'],
      expires_at: null
    });

    res.status(201).json({
      message: 'API key created successfully',
      api_key: keyData.key,
      id: apiKey.id,
      name: apiKey.name,
      permissions: apiKey.permissions
    });
  } catch (error) {
    console.error('API key creation error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// List API keys using JWT token
router.get('/api/api-keys', authenticateToken, async (req, res) => {
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

module.exports = router;