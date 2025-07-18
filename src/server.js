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
app.use('/dashboard', express.static(path.join(__dirname, '../dashboard/build')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'easyai-backend'
  });
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/v1', apiRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/gateway', gatewayRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/playground', playgroundRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Dashboard route - serve React app
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