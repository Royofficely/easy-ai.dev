const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
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
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:"],
      connectSrc: ["'self'", "http://localhost:4001", "https://easy-aidev-production.up.railway.app"],
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

// API key creation endpoint - creates unique user for each API key
app.get('/create-api-key/:key', async (req, res) => {
  try {
    const apiKey = req.params.key;
    console.log('Creating API key:', apiKey);
    
    const { User, ApiKey } = require('./models');
    const crypto = require('crypto');
    
    // Create API key hash
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // Check if API key already exists
    const existingKey = await ApiKey.findOne({ where: { key_hash: hash } });
    
    if (existingKey) {
      const existingUser = await User.findByPk(existingKey.user_id);
      return res.json({ 
        message: 'API key already exists', 
        key: apiKey,
        user_email: existingUser.email,
        user_id: existingUser.id
      });
    }

    // Create a unique user for this API key
    const userEmail = `user_${apiKey.slice(-8)}@easyai.local`;
    const userName = `EasyAI User ${apiKey.slice(-8)}`;
    
    const user = await User.create({
      email: userEmail,
      name: userName,
      is_active: true,
      is_verified: true
    });

    // Create new API key linked to the unique user
    const apiKeyRecord = await ApiKey.create({
      user_id: user.id,
      name: 'Website API Key',
      key_hash: hash,
      key_prefix: apiKey.substring(0, 20),
      is_active: true,
      permissions: ['read', 'write']
    });

    console.log(`✅ Created user ${user.email} (ID: ${user.id}) with API key ${apiKey}`);

    res.json({ 
      message: 'API key created successfully',
      key: apiKey,
      user_email: user.email,
      user_id: user.id
    });
    
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Delete API key endpoint (for testing/migration)
app.delete('/delete-api-key/:key', async (req, res) => {
  try {
    const apiKey = req.params.key;
    console.log('Deleting API key:', apiKey);
    
    const { User, ApiKey } = require('./models');
    const crypto = require('crypto');
    
    // Create API key hash
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // Find and delete the API key
    const existingKey = await ApiKey.findOne({ where: { key_hash: hash } });
    
    if (!existingKey) {
      return res.json({ message: 'API key not found', key: apiKey });
    }

    await existingKey.destroy();
    console.log(`🗑️ Deleted API key ${apiKey}`);

    res.json({ 
      message: 'API key deleted successfully',
      key: apiKey
    });
    
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// Website API key creation endpoint
app.get('/create-website-api-key', async (req, res) => {
  try {
    console.log('Creating website API key...');
    const { User, ApiKey } = require('./models');
    const crypto = require('crypto');
    
    // Create unique user for website API key
    const apiKey = 'easyai_7665c7976651405d';
    const userEmail = `user_${apiKey.slice(-8)}@easyai.local`;
    const userName = `EasyAI User ${apiKey.slice(-8)}`;
    
    // Check if user already exists
    let user = await User.findOne({ where: { email: userEmail } });
    
    if (!user) {
      user = await User.create({
        email: userEmail,
        name: userName,
        is_active: true,
        is_verified: true
      });
    }

    // Create API key hash
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // Check if API key already exists
    const existingKey = await ApiKey.findOne({ where: { key_hash: hash } });
    
    if (existingKey) {
      return res.json({ 
        message: 'API key already exists', 
        key: apiKey,
        user_email: user.email,
        user_id: user.id
      });
    }

    // Create new API key
    const apiKeyRecord = await ApiKey.create({
      user_id: user.id,
      name: 'Website API Key',
      key_hash: hash,
      key_prefix: apiKey.substring(0, 20),
      is_active: true,
      permissions: ['read', 'write']
    });

    console.log(`✅ Created user ${user.email} (ID: ${user.id}) with API key ${apiKey}`);

    res.json({ 
      message: 'API key created successfully',
      key: apiKey,
      user_email: user.email,
      user_id: user.id
    });
    
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
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

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('🔗 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
  
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`👥 Client ${socket.id} joined room: ${room}`);
  });
});

// Make io available to routes
app.set('io', io);

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
app.use('/static', express.static(path.join(__dirname, '../dashboard/build/static')));

// Dashboard route - serve React app for any dashboard routes
app.get('/dashboard*', (req, res) => {
  try {
    console.log('🔍 Dashboard route accessed:', req.path);
    // Read the .env file to get API key
    const fs = require('fs');
    const envPath = path.join(process.cwd(), '.env');
    let apiKey = '';
    
    console.log('📁 .env path:', envPath);
    console.log('📁 .env exists:', fs.existsSync(envPath));
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/EASYAI_API_KEY=(.+)/);
      if (match) {
        apiKey = match[1].trim();
        console.log('🔑 API Key found:', apiKey ? 'Yes' : 'No');
      }
    }
    
    // Read React dashboard index.html
    const dashboardPath = path.join(__dirname, '../dashboard/build/index.html');
    let dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');
    
    // Inject API key and API base URL into the dashboard
    if (apiKey) {
      dashboardHtml = dashboardHtml.replace(
        '</head>',
        `<script>
          window.EASYAI_API_KEY = '${apiKey}';
          window.EASYAI_BASE_URL = 'http://localhost:4000';
          
          // Store in localStorage for the React app
          if (window.localStorage) {
            localStorage.setItem('easyai_api_key', '${apiKey}');
          }
          
          console.log('API Key injected for dashboard:', '${apiKey}' ? 'Yes' : 'No');
        </script></head>`
      );
    }
    
    res.send(dashboardHtml);
  } catch (error) {
    console.error('Error serving dashboard:', error);
    res.sendFile(path.join(__dirname, '../dashboard/build/index.html'));
  }
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
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`EasyAI Platform running on port ${PORT}`);
      console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
      console.log(`API: http://localhost:${PORT}/api/v1`);
      console.log(`WebSocket: Ready for real-time updates`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;