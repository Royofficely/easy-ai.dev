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

  console.log('=== API Key Auth Debug ===');
  console.log('Received API Key:', apiKey);
  console.log('Headers:', req.headers);

  if (!apiKey) {
    console.log('No API key provided');
    return res.status(401).json({ error: 'API key required' });
  }

  // Check if we're in workspace mode
  const workspaceSync = req.app.get('workspaceSync');
  console.log('🔍 Workspace check - workspaceSync:', workspaceSync ? 'AVAILABLE' : 'NULL');
  
  if (workspaceSync) {
    console.log('🏢 Workspace mode detected - using config-based authentication');
    
    // In workspace mode, check against config files and environment
    try {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      
      // First check CLI config
      let validApiKey = null;
      try {
        const configPath = path.join(os.homedir(), '.easyai', 'config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.apiKey === apiKey) {
            validApiKey = config.apiKey;
            console.log('✅ API key validated from CLI config');
          }
        }
      } catch (error) {
        console.log('Could not read CLI config:', error.message);
      }
      
      // Check environment variable
      if (!validApiKey && process.env.EASYAI_API_KEY === apiKey) {
        validApiKey = process.env.EASYAI_API_KEY;
        console.log('✅ API key validated from environment');
      }
      
      // Check easyai.env file in workspace
      if (!validApiKey) {
        try {
          const workspacePath = process.env.EASYAI_WORKSPACE_PATH || process.cwd();
          const envPath = path.join(workspacePath, 'easyai.env');
          console.log('🔍 Checking workspace easyai.env at:', envPath);
          console.log('🔍 easyai.env file exists:', fs.existsSync(envPath));
          
          if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            console.log('🔍 easyai.env file content:', envContent.substring(0, 100) + '...');
            const match = envContent.match(/EASYAI_API_KEY=(.+)/);
            console.log('🔍 Regex match:', match);
            console.log('🔍 Provided API key:', apiKey);
            console.log('🔍 easyai.env API key:', match ? match[1].trim() : 'NOT_FOUND');
            
            if (match && match[1].trim() === apiKey) {
              validApiKey = apiKey;
              console.log('✅ API key validated from workspace easyai.env');
            } else {
              console.log('❌ API key mismatch or not found in easyai.env');
            }
          } else {
            console.log('❌ easyai.env file does not exist at:', envPath);
          }
        } catch (error) {
          console.log('Could not read workspace easyai.env:', error.message);
        }
      }
      
      if (validApiKey) {
        // Create a mock user for workspace mode using the same UUID as in WorkspaceSync
        req.user = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'workspace@easyai.local',
          name: 'Workspace User',
          role: 'developer',
          is_verified: true,
          workspace_mode: true
        };
        req.apiKey = {
          id: 'workspace-api-key',
          name: 'Workspace API Key',
          permissions: ['read', 'write'],
          is_active: true,
          workspace_mode: true
        };
        console.log('✅ Workspace authentication successful');
        return next();
      } else {
        console.log('❌ API key not found in workspace config');
        return res.status(401).json({ error: 'Invalid API key for workspace mode' });
      }
    } catch (error) {
      console.error('Workspace authentication error:', error);
      return res.status(401).json({ error: 'Authentication error in workspace mode' });
    }
  }

  // Database mode (original logic)
  try {
    const keyHash = ApiKey.validateKey(apiKey);
    console.log('Generated Hash:', keyHash);
    
    const apiKeyRecord = await ApiKey.findOne({ 
      where: { key_hash: keyHash, is_active: true },
      include: [{ model: User, as: 'user' }]
    });

    console.log('Database lookup result:', apiKeyRecord ? 'Found' : 'Not found');
    if (apiKeyRecord) {
      console.log('API Key details:', {
        id: apiKeyRecord.id,
        name: apiKeyRecord.name,
        is_active: apiKeyRecord.is_active,
        expires_at: apiKeyRecord.expires_at
      });
    }

    if (!apiKeyRecord) {
      console.log('API key not found in database');
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
  checkPermission,
  authMiddleware: authenticateToken // Alias for compatibility
};