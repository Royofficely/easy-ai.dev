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
const setupRoutes = require('./routes/setup');
const proxyRoutes = require('./routes/proxy');
const workspaceRoutes = require('./routes/workspace');

// Initialize database
const { initializeDatabase } = require('./models');

// Try to load WorkspaceSync, fallback if dependencies missing
let WorkspaceSync = null;
try {
  WorkspaceSync = require('./utils/workspaceSync');
} catch (error) {
  console.log('📦 Workspace sync dependencies not available, running without file watching');
  console.log('   Install chokidar for full workspace sync: npm install chokidar');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 4000;

// Global workspace sync instance
let workspaceSync = null;

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
// Enhanced WebSocket handling with user rooms and better error handling
io.on('connection', (socket) => {
  console.log('🔗 Client connected:', socket.id);
  
  // Store user info on socket for easy access
  socket.userData = {};
  
  // Send current client count to all clients
  const clientCount = io.engine.clientsCount;
  io.emit('client_count', clientCount);
  
  // Send welcome message
  socket.emit('server_message', {
    type: 'welcome',
    message: 'Connected to EasyAI real-time system',
    timestamp: new Date().toISOString()
  });
  
  // Handle user room joining (for targeted updates)
  socket.on('join_user_room', async (data) => {
    try {
      const { apiKey } = data;
      if (!apiKey) return;
      
      // Validate API key and get user info
      const { ApiKey, User } = require('./models');
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      const apiKeyRecord = await ApiKey.findOne({ where: { key_hash: hash } });
      if (apiKeyRecord) {
        const user = await User.findByPk(apiKeyRecord.user_id);
        if (user) {
          const userRoom = `user_${user.id}`;
          socket.join(userRoom);
          socket.userData = { userId: user.id, userEmail: user.email, apiKey };
          
          console.log(`👥 User ${user.email} joined room: ${userRoom}`);
          
          // Send personalized welcome
          socket.emit('server_message', {
            type: 'user_authenticated',
            message: `Welcome back, ${user.name || user.email}!`,
            user: { id: user.id, email: user.email },
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error joining user room:', error);
      socket.emit('server_message', {
        type: 'error',
        message: 'Failed to authenticate user',
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Handle generic room joining
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`👥 Client ${socket.id} joined room: ${room}`);
  });
  
  // Handle ping/pong for connection health
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });
  
  // Handle user activity tracking
  socket.on('user_activity', (data) => {
    if (socket.userData.userId) {
      // Broadcast user activity to other clients in same user room
      socket.to(`user_${socket.userData.userId}`).emit('user_activity', {
        type: data.type,
        user: socket.userData.userEmail,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
    socket.emit('server_message', {
      type: 'error',
      message: 'Connection error occurred',
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);
    
    // If user was authenticated, log their disconnection
    if (socket.userData.userEmail) {
      console.log(`👤 User ${socket.userData.userEmail} disconnected`);
    }
    
    // Update client count after disconnect
    setTimeout(() => {
      const clientCount = io.engine.clientsCount;
      io.emit('client_count', clientCount);
    }, 100);
  });

  // Workspace sync events
  if (workspaceSync) {
    // Send workspace info to new client
    socket.emit('workspace:info', workspaceSync.getWorkspaceInfo());
    
    // Send current prompts and config
    workspaceSync.syncPrompts();
    workspaceSync.syncConfig();
    
    // Handle workspace sync requests
    socket.on('workspace:sync:request', () => {
      if (workspaceSync) {
        workspaceSync.syncPrompts();
        workspaceSync.syncConfig();
      }
    });
    
    // Handle prompt operations from UI
    socket.on('workspace:prompt:created', async (data) => {
      try {
        // Save the new prompt to workspace
        await workspaceSync.savePrompt(data);
        
        // Sync all prompts back to UI
        await workspaceSync.syncPrompts();
        
        console.log(`📝 Created prompt: ${data.name}`);
      } catch (error) {
        console.error('Failed to create prompt:', error);
        socket.emit('workspace:error', { message: 'Failed to create prompt', error: error.message });
      }
    });
    
    socket.on('workspace:prompt:updated', async (data) => {
      try {
        // Save the updated prompt to workspace
        await workspaceSync.savePrompt(data);
        
        // Sync all prompts back to UI
        await workspaceSync.syncPrompts();
        
        console.log(`📝 Updated prompt: ${data.name}`);
      } catch (error) {
        console.error('Failed to update prompt:', error);
        socket.emit('workspace:error', { message: 'Failed to update prompt', error: error.message });
      }
    });
    
    socket.on('workspace:prompt:deleted', async (data) => {
      try {
        // Delete the prompt from workspace
        await workspaceSync.deletePrompt(data.prompt_id);
        
        // Sync all prompts back to UI
        await workspaceSync.syncPrompts();
        
        console.log(`🗑️ Deleted prompt: ${data.prompt_id}`);
      } catch (error) {
        console.error('Failed to delete prompt:', error);
        socket.emit('workspace:error', { message: 'Failed to delete prompt', error: error.message });
      }
    });
  }
  
  // Handle connection errors
  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
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
app.use('/api/setup', setupRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/workspace', workspaceRoutes);

// Dashboard route - serve React app for any dashboard routes (MUST come before static middleware)
app.get('/dashboard*', (req, res) => {
  try {
    console.log('🔍 Dashboard route accessed:', req.path);
    // Try to get API key from environment or .env file
    const fs = require('fs');
    let apiKey = process.env.EASYAI_API_KEY || '';
    
    if (!apiKey) {
      const envPath = path.join(process.cwd(), '.env');
      console.log('📁 .env path:', envPath);
      console.log('📁 .env exists:', fs.existsSync(envPath));
      
      try {
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          const match = envContent.match(/EASYAI_API_KEY=(.+)/);
          if (match) {
            apiKey = match[1].trim();
            console.log('🔑 API Key found:', apiKey ? 'Yes' : 'No');
          }
        }
      } catch (error) {
        console.log('No .env file found, dashboard will work without pre-filled API key');
      }
    }
    
    // Read React dashboard index.html
    const dashboardPath = path.join(__dirname, '../dashboard-build/index.html');
    console.log('📄 Looking for dashboard at:', dashboardPath);
    console.log('📄 Dashboard exists:', fs.existsSync(dashboardPath));
    
    if (!fs.existsSync(dashboardPath)) {
      throw new Error(`Dashboard file not found at ${dashboardPath}`);
    }
    
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
    try {
      res.sendFile(path.join(__dirname, '../dashboard-build/index.html'));
    } catch (fallbackError) {
      console.error('Fallback dashboard also failed:', fallbackError);
      res.status(500).json({ 
        error: 'Dashboard not available', 
        message: 'Dashboard build files not found' 
      });
    }
  }
});

// Serve dashboard static files AFTER dynamic route
const dashboardBuildPath = path.join(__dirname, '../dashboard-build');
app.use('/dashboard/assets', express.static(dashboardBuildPath));
app.use('/static', express.static(path.join(dashboardBuildPath, 'static')));

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
    
    // Initialize workspace sync if workspace exists
    const fs = require('fs');
    const workspacePath = path.join(process.cwd(), 'easyai');
    
    if (fs.existsSync(workspacePath)) {
      console.log('🏢 Workspace detected, initializing sync...');
      
      if (WorkspaceSync) {
        try {
          workspaceSync = new WorkspaceSync(workspacePath, io);
          workspaceSync.startWatching();
          console.log(`✅ Workspace sync initialized: ${workspacePath}`);
        } catch (error) {
          console.log('⚠️  Workspace sync failed to initialize, continuing without file watching');
          console.log(`   Error: ${error.message}`);
          workspaceSync = null;
        }
      } else {
        console.log('💼 Workspace detected but sync dependencies missing, running in basic mode');
      }
    } else {
      console.log('💼 No workspace detected, running in standard mode');
    }
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`EasyAI Platform running on port ${PORT}`);
      console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
      console.log(`API: http://localhost:${PORT}/api/v1`);
      console.log(`WebSocket: Ready for real-time updates`);
      if (workspaceSync) {
        console.log(`Workspace: ${workspacePath}`);
      }
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;