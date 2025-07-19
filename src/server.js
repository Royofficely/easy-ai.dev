const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const clerkAuthRoutes = require('./routes/clerk-auth');
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
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 4000;

// Store server instance for graceful shutdown
let server = null;

// Production environment handling
const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT_NAME;

// Graceful shutdown handling for Railway
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  if (server) {
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  if (server) {
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Global workspace sync instance
let workspaceSync = null;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://unpkg.com", "https://*.clerk.accounts.dev", "https://clerk.accounts.dev", "https://tolerant-ladybug-16.clerk.accounts.dev"],
      imgSrc: ["'self'", "data:", "https:", "https://*.clerk.accounts.dev", "https://clerk.accounts.dev", "https://tolerant-ladybug-16.clerk.accounts.dev"],
      fontSrc: ["'self'", "https:", "https://*.clerk.accounts.dev", "https://clerk.accounts.dev", "https://tolerant-ladybug-16.clerk.accounts.dev"],
      connectSrc: ["'self'", "http://localhost:4001", "https://easy-aidev-production.up.railway.app", "https://*.clerk.accounts.dev", "https://clerk.accounts.dev", "https://api.clerk.com", "https://*.clerk.com", "https://tolerant-ladybug-16.clerk.accounts.dev"],
      frameSrc: ["'self'", "https://*.clerk.accounts.dev", "https://clerk.accounts.dev", "https://tolerant-ladybug-16.clerk.accounts.dev"],
      upgradeInsecureRequests: null
    }
  }
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.originalUrl}`);
  console.log(`📡 Headers: ${JSON.stringify(req.headers, null, 2)}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📦 Body: ${JSON.stringify(req.body, null, 2)}`);
  }
  next();
});

// Static files
app.use('/public', express.static(path.join(__dirname, '../public')));

// Health check endpoint for Railway - should respond immediately
app.get('/health', (req, res) => {
  try {
    console.log('🌐 GET /health');
    
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'easyai-backend',
      version: '1.8.10',
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      railway: !!process.env.RAILWAY_ENVIRONMENT_NAME,
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working!' });
});

// Serve the landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
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
    console.log('🔗 New client connected, syncing workspace...');
    
    // Send workspace info to new client
    socket.emit('workspace:info', workspaceSync.getWorkspaceInfo());
    
    // Immediately load and send current prompts to this specific client
    setTimeout(async () => {
      try {
        const prompts = await workspaceSync.loadPrompts();
        const categories = [...new Set(prompts.map(p => p.category).filter(Boolean))];
        
        // Send workspace data directly to this client
        socket.emit('workspace:prompts:sync', { 
          prompts,
          categories,
          version: "1.0.0",
          lastSync: new Date().toISOString(),
          source: 'workspace_sync',
          count: prompts.length
        });
        
        // Also sync config
        const config = await workspaceSync.getConfig();
        socket.emit('workspace:config:sync', config);
        
        console.log(`✅ Workspace synced to new client: ${prompts.length} prompts`);
      } catch (error) {
        console.error('Error syncing workspace to new client:', error);
        socket.emit('workspace:error', {
          message: 'Failed to sync workspace on connection',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }, 500);
    
    // Handle workspace sync requests
    socket.on('workspace:sync:request', async () => {
      if (workspaceSync) {
        try {
          await workspaceSync.syncPrompts();
          await workspaceSync.syncConfig();
          console.log('🔄 Manual workspace sync requested and completed');
        } catch (error) {
          console.error('Error in manual workspace sync:', error);
          socket.emit('workspace:error', {
            message: 'Manual sync failed',
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
    
    // Handle workspace room joining for better targeted updates
    socket.on('workspace:join', () => {
      socket.join('workspace');
      console.log(`👥 Client ${socket.id} joined workspace room`);
      
      // Send welcome message to workspace
      socket.emit('workspace:joined', {
        message: 'Connected to workspace real-time sync',
        timestamp: new Date().toISOString()
      });
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

// Make workspaceSync available to routes (will be set after initialization)
app.set('workspaceSync', null);

// Workspace fallback routes for UI compatibility (MUST be before regular routes)
app.get('/api/v1/user', async (req, res, next) => {
  const workspaceSync = req.app.get('workspaceSync');
  console.log(`🔍 /api/v1/user request - workspaceSync: ${workspaceSync ? 'AVAILABLE' : 'NULL'}`);
  
  if (workspaceSync) {
    console.log('🔄 Serving workspace user info');
    
    // Try to get user email from config if available
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    let userEmail = 'workspace@easyai.local';
    let userName = 'Workspace User';
    let apiKey = null;
    
    // First try to get from CLI config
    try {
      const configPath = path.join(os.homedir(), '.easyai', 'config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.userEmail) {
          userEmail = config.userEmail;
        }
        if (config.userName) {
          userName = config.userName;
        }
        if (config.apiKey) {
          apiKey = config.apiKey;
        }
      }
    } catch (error) {
      console.log('Could not read user config, using defaults');
    }
    
    // Try to get API key from request headers
    const requestApiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    console.log(`🔍 Request API key: ${requestApiKey}`);
    
    // If we have an API key from the request, use it to find the real user
    if (requestApiKey) {
      try {
        const { User, ApiKey } = require('./models');
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(requestApiKey).digest('hex');
        const apiKeyRecord = await ApiKey.findOne({ where: { key_hash: hash } });
        
        if (apiKeyRecord) {
          const user = await User.findByPk(apiKeyRecord.user_id);
          if (user && !user.email.includes('@easyai.local')) {
            userEmail = user.email;
            userName = user.name;
            console.log(`🔍 Found real user from API key: ${userEmail}`);
          }
        }
      } catch (error) {
        console.log('Could not fetch user from API key:', error.message);
      }
    }
    
    // If we still don't have user info, try to fetch from config API key
    if ((userEmail === 'workspace@easyai.local' || userEmail.includes('cli@user.com')) && apiKey) {
      try {
        const { User, ApiKey } = require('./models');
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
        const apiKeyRecord = await ApiKey.findOne({ where: { key_hash: hash } });
        
        if (apiKeyRecord) {
          const user = await User.findByPk(apiKeyRecord.user_id);
          if (user && !user.email.includes('@easyai.local')) {
            userEmail = user.email;
            userName = user.name;
            console.log(`🔍 Found real user from config API key: ${userEmail}`);
          }
        }
      } catch (error) {
        console.log('Could not fetch user from config API key:', error.message);
      }
    }
    
    return res.json({
      id: 'workspace-user',
      email: userEmail,
      name: userName,
      role: 'user',
      is_verified: true,
      workspace_mode: true,
      setup_completed: true
    });
  }
  
  console.log('🔄 No workspace sync available, continuing to authenticated route');
  next(); // Continue to normal auth route
});

// Workspace prompts routes (GET, POST, PUT, DELETE)
app.get('/api/prompts', async (req, res, next) => {
  const workspaceSync = req.app.get('workspaceSync');
  console.log(`🔍 /api/prompts request - workspaceSync: ${workspaceSync ? 'AVAILABLE' : 'NULL'}`);
  
  if (workspaceSync) {
    // Handle workspace prompts directly
    try {
      console.log('🔄 Loading prompts via workspace sync for UI');
      const prompts = await workspaceSync.loadPrompts();
      const categories = [...new Set(prompts.map(p => p.category).filter(Boolean))];
      
      return res.json({ 
        prompts,
        categories,
        version: "1.0.0",
        lastSync: new Date().toISOString(),
        source: 'workspace_sync'
      });
    } catch (error) {
      console.error('Error loading workspace prompts for UI:', error);
      return res.status(500).json({ 
        error: 'Failed to load workspace prompts',
        message: error.message 
      });
    }
  }
  
  console.log('🔄 No workspace sync available, continuing to authenticated route');
  next(); // Continue to normal prompts route
});

// Handle POST /api/prompts for workspace mode
app.post('/api/prompts', async (req, res, next) => {
  console.log('🚨🚨🚨 WORKSPACE ROUTE HIT - POST /api/prompts 🚨🚨🚨');
  const workspaceSync = req.app.get('workspaceSync');
  console.log(`🔍 POST /api/prompts request - workspaceSync: ${workspaceSync ? 'AVAILABLE' : 'NULL'}`);
  console.log(`🔑 Authorization header: ${req.headers.authorization ? 'PRESENT' : 'MISSING'}`);
  console.log(`🏠 User-Agent: ${req.headers['user-agent']}`);
  console.log(`📁 Workspace path env: ${process.env.EASYAI_WORKSPACE_PATH || 'NOT SET'}`);
  console.log(`📁 Current working directory: ${process.cwd()}`);
  
  // Check if workspace structure exists even if workspaceSync is null
  const fs = require('fs');
  const workspacePath = process.env.EASYAI_WORKSPACE_PATH || process.cwd();
  const hasPrompts = fs.existsSync(path.join(workspacePath, 'prompts'));
  const hasConfig = fs.existsSync(path.join(workspacePath, 'config'));
  console.log(`📁 Workspace structure check - prompts: ${hasPrompts}, config: ${hasConfig}`);
  
  if (workspaceSync || (hasPrompts && hasConfig)) {
    try {
      console.log('📝 Creating prompt via workspace sync');
      console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
      
      // Validate required fields
      if (!req.body.name || !req.body.content) {
        console.error('❌ Missing required fields: name or content');
        return res.status(400).json({ 
          error: 'Missing required fields: name and content are required',
          received: Object.keys(req.body)
        });
      }
      
      // Generate a unique prompt_id if not provided
      const promptId = req.body.prompt_id || `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const promptData = {
        name: req.body.name,
        prompt_id: promptId,
        description: req.body.description || '',
        category: req.body.category || 'general',
        content: req.body.content,
        template: req.body.content,
        model: req.body.model || 'gpt-4', // Add model field with default
        variables: req.body.variables || [],
        tags: req.body.tags || [],
        parameters: req.body.parameters || {},
        model_config: req.body.model_config || {},
        options: req.body.options || {},
        environments: req.body.environments || {},
        user_id: 'workspace-user',
        is_active: true,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('💾 Saving prompt data:', JSON.stringify(promptData, null, 2));

      // Save to workspace - try workspaceSync first, fallback to manual save
      let success = false;
      
      if (workspaceSync) {
        console.log('📝 Using workspaceSync to save prompt');
        success = await workspaceSync.savePrompt(promptData);
      } else {
        console.log('📝 Using manual file save (no workspaceSync)');
        // Manual save if workspaceSync is not available
        try {
          const promptsDir = path.join(workspacePath, 'prompts');
          if (!fs.existsSync(promptsDir)) {
            fs.mkdirSync(promptsDir, { recursive: true });
          }
          
          // Use prompt name for filename, fallback to prompt_id
          const safeName = promptData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled';
          const filename = safeName || promptData.prompt_id;
          const promptFile = path.join(promptsDir, `${filename}.json`);
          
          fs.writeFileSync(promptFile, JSON.stringify(promptData, null, 2));
          console.log(`💾 Manually saved prompt: ${filename}.json`);
          success = true;
        } catch (manualError) {
          console.error('❌ Manual save failed:', manualError);
          success = false;
        }
      }
      
      if (success) {
        // Trigger sync to UI if workspaceSync is available
        if (workspaceSync) {
          await workspaceSync.syncPrompts();
        }
        
        // Emit WebSocket event for real-time updates
        const io = req.app.get('io');
        if (io) {
          io.emit('prompt_created', {
            prompt: promptData,
            user_id: 'workspace-user',
            timestamp: new Date().toISOString()
          });
          console.log('📡 WebSocket: Prompt created event emitted');
        }
        
        console.log('✅ Prompt created successfully:', promptData.name);
        return res.status(201).json(promptData);
      } else {
        console.error('❌ Failed to save prompt to workspace');
        return res.status(500).json({ error: 'Failed to save prompt to workspace' });
      }
    } catch (error) {
      console.error('❌ Error creating workspace prompt:', error);
      return res.status(500).json({ 
        error: 'Failed to create workspace prompt',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
  
  console.log('🔄 No workspace sync available, continuing to authenticated route');
  next(); // Continue to normal prompts route
});

// Handle PUT /api/prompts/:id for workspace mode
app.put('/api/prompts/:prompt_id', async (req, res, next) => {
  const workspaceSync = req.app.get('workspaceSync');
  console.log(`🔍 PUT /api/prompts/${req.params.prompt_id} request - workspaceSync: ${workspaceSync ? 'AVAILABLE' : 'NULL'}`);
  
  if (workspaceSync) {
    try {
      console.log('📝 Updating prompt via workspace sync');
      
      // Load existing prompts to find the one to update
      const prompts = await workspaceSync.loadPrompts();
      const existingPrompt = prompts.find(p => p.prompt_id === req.params.prompt_id);
      
      if (!existingPrompt) {
        return res.status(404).json({ error: 'Prompt not found' });
      }
      
      // Merge updates with existing prompt
      const updatedPrompt = {
        ...existingPrompt,
        ...req.body,
        prompt_id: req.params.prompt_id, // Ensure ID doesn't change
        updated_at: new Date().toISOString(),
        version: (existingPrompt.version || 1) + 1
      };

      // Save to workspace
      const success = await workspaceSync.savePrompt(updatedPrompt);
      
      if (success) {
        // Trigger sync to UI
        await workspaceSync.syncPrompts();
        
        // Emit WebSocket event for real-time updates
        const io = req.app.get('io');
        if (io) {
          io.emit('prompt_updated', {
            prompt: updatedPrompt,
            user_id: 'workspace-user',
            timestamp: new Date().toISOString()
          });
          console.log('📡 WebSocket: Prompt updated event emitted');
        }
        
        return res.json(updatedPrompt);
      } else {
        return res.status(500).json({ error: 'Failed to update prompt in workspace' });
      }
    } catch (error) {
      console.error('Error updating workspace prompt:', error);
      return res.status(500).json({ 
        error: 'Failed to update workspace prompt',
        message: error.message 
      });
    }
  }
  
  console.log('🔄 No workspace sync available, continuing to authenticated route');
  next(); // Continue to normal prompts route
});

// Handle DELETE /api/prompts/:id for workspace mode
app.delete('/api/prompts/:prompt_id', async (req, res, next) => {
  const workspaceSync = req.app.get('workspaceSync');
  console.log(`🔍 DELETE /api/prompts/${req.params.prompt_id} request - workspaceSync: ${workspaceSync ? 'AVAILABLE' : 'NULL'}`);
  
  if (workspaceSync) {
    try {
      console.log('🗑️ Deleting prompt via workspace sync');
      
      // Delete from workspace
      const success = await workspaceSync.deletePrompt(req.params.prompt_id);
      
      if (success) {
        // Trigger sync to UI
        await workspaceSync.syncPrompts();
        
        // Emit WebSocket event for real-time updates
        const io = req.app.get('io');
        if (io) {
          io.emit('prompt_deleted', {
            prompt_id: req.params.prompt_id,
            user_id: 'workspace-user',
            timestamp: new Date().toISOString()
          });
          console.log('📡 WebSocket: Prompt deleted event emitted');
        }
        
        return res.json({ message: 'Prompt deleted successfully' });
      } else {
        return res.status(404).json({ error: 'Prompt not found' });
      }
    } catch (error) {
      console.error('Error deleting workspace prompt:', error);
      return res.status(500).json({ 
        error: 'Failed to delete workspace prompt',
        message: error.message 
      });
    }
  }
  
  console.log('🔄 No workspace sync available, continuing to authenticated route');
  next(); // Continue to normal prompts route
});

// Routes - mount non-conflicting routes first
app.use('/auth', authRoutes);
app.use('/clerk', clerkAuthRoutes);
app.use('/api/v1', apiRoutes);
app.use('/gateway', gatewayRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/playground', playgroundRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/workspace', workspaceRoutes);

// CRITICAL: Mount prompts router ONLY when NOT in workspace mode
// This ensures workspace fallback routes are processed first
app.use('/api/prompts', (req, res, next) => {
  const workspaceSync = req.app.get('workspaceSync');
  console.log(`🔀 Router decision - workspaceSync: ${workspaceSync ? 'AVAILABLE (skipping auth router)' : 'NULL (using auth router)'}`);
  
  if (workspaceSync) {
    // Workspace mode is active, skip the authenticated router
    // The workspace fallback routes above will handle the request
    console.log('⚠️ Workspace mode active - request should have been handled by fallback routes above');
    return res.status(500).json({ 
      error: 'Route conflict - workspace routes should have handled this request',
      debug: 'This indicates a routing configuration issue'
    });
  }
  
  // No workspace mode, use authenticated router
  console.log('✅ Using authenticated prompts router');
  next();
}, promptRoutes);

// Dashboard route - serve React app for any dashboard routes (MUST come before static middleware)
app.get('/dashboard*', (req, res) => {
  try {
    console.log('🔍 Dashboard route accessed:', req.path);
    // Try to get API key from environment or .env file
    const fs = require('fs');
    let apiKey = process.env.EASYAI_API_KEY || '';
    
    if (!apiKey) {
      // Try multiple locations for API key, prioritizing workspace
      const workspacePath = process.env.EASYAI_WORKSPACE_PATH || workspaceDirectory;
      const envPaths = [
        // First try workspace directory (highest priority)
        ...(workspacePath ? [
          path.join(workspacePath, 'easyai.env'),
          path.join(workspacePath, '.env')
        ] : []),
        // Then try current working directory
        path.join(process.cwd(), 'easyai.env'),
        path.join(process.cwd(), '.env'),
        // Finally try package directory
        path.join(__dirname, '../easyai.env'),
        path.join(__dirname, '../.env')
      ];
      
      console.log('🔍 Workspace path from env:', process.env.EASYAI_WORKSPACE_PATH);
      console.log('🔍 Workspace directory variable:', workspaceDirectory);
      console.log('📁 Searching for API key in:', envPaths);
      
      for (const envPath of envPaths) {
        try {
          if (fs.existsSync(envPath)) {
            console.log('📁 Found config file:', envPath);
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/EASYAI_API_KEY=(.+)/);
            if (match) {
              apiKey = match[1].trim();
              console.log('🔑 API Key found in:', envPath);
              console.log('🔑 API Key value:', apiKey);
              break;
            }
          }
        } catch (error) {
          console.log('Error reading:', envPath, error.message);
        }
      }
      
      if (!apiKey) {
        console.log('💡 No API key found - dashboard will use authentication from API requests');
        // Don't inject any API key, let the dashboard handle authentication
        apiKey = '';
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
app.use('/static', express.static(path.join(dashboardBuildPath, 'static')));

// Handle specific static files that the dashboard needs
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(dashboardBuildPath, 'manifest.json'));
});

app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(dashboardBuildPath, 'favicon.ico'));
});

// Serve dashboard assets
app.use('/dashboard', express.static(dashboardBuildPath));

// Root route - serve landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
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
    console.log('🚀 Starting EasyAI server...');
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🏭 Railway: ${process.env.RAILWAY_ENVIRONMENT_NAME || 'Not detected'}`);
    console.log(`💾 Database path: ${process.env.DATABASE_PATH || '/tmp/easyai.sqlite'}`);
    
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
    
    // Initialize workspace sync - skip in production/Railway for faster startup
    // Also start the server immediately and do workspace sync after
    
    // Start server first for health check
    server = httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 EasyAI Platform running on port ${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
      console.log(`🔗 API: http://localhost:${PORT}/api/v1`);
      console.log(`⚡ WebSocket: Ready for real-time updates`);
      if (isProduction) {
        console.log(`🌐 Production mode: ${process.env.RAILWAY_ENVIRONMENT_NAME || 'Unknown'}`);
      }
    });
    
    if (!isProduction) {
      const fs = require('fs');
      const workspacePath = process.env.EASYAI_WORKSPACE_PATH || process.cwd();
      
      console.log(`🏢 Using workspace directory: ${workspacePath}`);
      console.log(`📍 Current working directory: ${process.cwd()}`);
      if (process.env.EASYAI_WORKSPACE_PATH) {
        console.log(`🔧 Using environment workspace path: ${process.env.EASYAI_WORKSPACE_PATH}`);
      }
      
      // Check if workspace has the required structure
      const hasPrompts = fs.existsSync(path.join(workspacePath, 'prompts'));
      const hasConfig = fs.existsSync(path.join(workspacePath, 'config'));
      
      console.log(`📁 Workspace structure - prompts: ${hasPrompts}, config: ${hasConfig}`);
      
      if (hasPrompts && hasConfig) {
        console.log('🏢 Workspace detected, initializing sync...');
        console.log(`📁 Workspace path: ${workspacePath}`);
        
        if (WorkspaceSync) {
          try {
            workspaceSync = new WorkspaceSync(workspacePath, io);
            workspaceSync.startWatching();
            
            // Make workspaceSync available to routes
            app.set('workspaceSync', workspaceSync);
            console.log('✅ workspaceSync set in app context');
            
            // Initial sync to UI on startup
            setTimeout(async () => {
              console.log('🔄 Performing initial workspace sync to UI...');
              try {
                await workspaceSync.syncPrompts();
                await workspaceSync.syncConfig();
                console.log('✅ Initial workspace sync completed');
              } catch (error) {
                console.error('❌ Initial workspace sync failed:', error);
              }
            }, 1000);
            
            console.log(`✅ Workspace sync initialized: ${workspacePath}`);
          } catch (error) {
            console.log('⚠️  Workspace sync failed to initialize, continuing without file watching');
            console.log(`   Error: ${error.message}`);
            workspaceSync = null;
            app.set('workspaceSync', null);
          }
        } else {
          console.log('💼 Workspace detected but sync dependencies missing, running in basic mode');
        }
      } else {
        console.log('💼 No workspace detected, running in standard mode');
      }
    } else {
      console.log('🏭 Production mode: Skipping workspace sync for faster startup');
      workspaceSync = null;
      app.set('workspaceSync', null);
    }
    
    // Log workspace info if available
    if (workspaceSync) {
      console.log(`📁 Workspace: ${process.env.EASYAI_WORKSPACE_PATH || process.cwd()}`);
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;