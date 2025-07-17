const jwt = require('jsonwebtoken');
const { User, ApiKey } = require('../models');

// JWT token authentication
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findByPk(decoded.user_id);
    
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// API key authentication
const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    const keyHash = ApiKey.validateKey(apiKey);
    const apiKeyRecord = await ApiKey.findOne({ 
      where: { key_hash: keyHash, is_active: true },
      include: [{ model: User, as: 'user' }]
    });

    if (!apiKeyRecord) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Check if API key is expired
    if (apiKeyRecord.expires_at && apiKeyRecord.expires_at < new Date()) {
      return res.status(401).json({ error: 'API key expired' });
    }

    // Update usage
    apiKeyRecord.last_used = new Date();
    apiKeyRecord.usage_count += 1;
    await apiKeyRecord.save();

    req.user = apiKeyRecord.user;
    req.apiKey = apiKeyRecord;
    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(401).json({ error: 'Invalid API key' });
  }
};

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Permission checker
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return next(); // Skip permission check for JWT tokens
    }

    if (!req.apiKey.permissions.includes(permission)) {
      return res.status(403).json({ error: `Permission '${permission}' required` });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authenticateApiKey,
  requireRole,
  checkPermission
};