const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const promptRoutes = require('./routes/prompts');
const apiRoutes = require('./routes/api');
const dashboardRoutes = require('./routes/dashboard');
const gatewayRoutes = require('./routes/gateway');
const settingsRoutes = require('./routes/settings');
const playgroundRoutes = require('./routes/playground');
const monitoringRoutes = require('./routes/monitoring');

// Initialize database
const { initializeDatabase } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:"],
      connectSrc: ["'self'", "https://easy-aidev-production.up.railway.app"],
      upgradeInsecureRequests: null
    }
  }
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/public', express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'easyai-backend'
  });
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working!' });
});

// Temporary API key creation endpoint (for testing)
app.get('/create-test-api-key', async (req, res) => {
  try {
    console.log('Creating test API key...');
    const { User, ApiKey } = require('./models');
    const crypto = require('crypto');
    
    // Find or create a test user
    let user = await User.findOne({ where: { email: 'test@example.com' } });
    
    if (!user) {
      user = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        is_active: true,
        is_verified: true
      });
    }

    // Create API key
    const apiKey = 'easyai_49nyper78py';
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // Check if API key already exists
    const existingKey = await ApiKey.findOne({ where: { key_hash: hash } });
    
    if (existingKey) {
      return res.json({ message: 'API key already exists', key: 'easyai_49nyper78py' });
    }

    // Create new API key
    const apiKeyRecord = await ApiKey.create({
      user_id: user.id,
      name: 'CLI Test Key',
      key_hash: hash,
      key_prefix: 'easyai_49nyper78py',
      is_active: true,
      permissions: ['read', 'write']
    });

    res.json({ 
      message: 'API key created successfully',
      key: 'easyai_49nyper78py',
      user_email: user.email
    });
    
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/v1', apiRoutes);
app.use('/gateway', gatewayRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/playground', playgroundRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Serve dashboard static files
app.use('/dashboard', express.static(path.join(__dirname, '../dashboard/build')));

// Dashboard route - serve React app for any dashboard routes
app.get('/dashboard*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard/build/index.html'));
});

// Root route - serve landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`EasyAI Platform running on port ${PORT}`);
      console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
      console.log(`API: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;