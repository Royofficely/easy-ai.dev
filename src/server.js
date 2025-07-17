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

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/public', express.static(path.join(__dirname, '../public')));

// Routes
app.use('/auth', authRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/v1', apiRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/gateway', gatewayRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/playground', playgroundRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'EasyAI Platform API',
    version: '1.0.0',
    documentation: 'https://docs.easyai.dev',
    status: 'running'
  });
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

app.listen(PORT, () => {
  console.log(`EasyAI Platform running on port ${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`API: http://localhost:${PORT}/api/v1`);
});

module.exports = app;