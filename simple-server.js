const express = require('express');
const path = require('path');

const app = express();
const port = 7543;

console.log('Dashboard path:', path.join(__dirname, 'dist/dashboard'));
console.log('CSS path:', path.join(__dirname, 'dist/dashboard/_next/static/css'));

// Enable detailed logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Serve Next.js static assets with specific routing
app.use('/_next/static', express.static(path.join(__dirname, 'dist/dashboard/_next/static')));

// Serve all static files
app.use(express.static(path.join(__dirname, 'dist/dashboard')));

// API mocks
app.get('/api/analytics', (req, res) => {
  res.json({ 
    totalCalls: 0,
    totalTokens: 0,
    modelUsage: {},
    lastUpdated: new Date().toISOString()
  });
});

app.get('/api/logs', (req, res) => {
  res.json([]); // Return empty array instead of undefined
});

app.get('/api/prompts', (req, res) => {
  res.json([
    {
      name: 'code-review',
      category: 'examples', 
      content: '# Code Review Prompt\n\nReview this code...'
    }
  ]);
});

app.get('/api/config', (req, res) => {
  res.json({
    config: {
      ui: { theme: 'dark', defaultModel: 'gpt-4', autoSave: true },
      logging: { enabled: true, includeResponses: true, retention: '30d' }
    },
    env: {
      OPENAI_API_KEY: '***configured***',
      ANTHROPIC_API_KEY: '***configured***'
    }
  });
});

// Catch all other API routes
app.get('/api/*', (req, res) => {
  res.json({ message: 'API endpoint', path: req.path });
});

// Serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/dashboard/index.html'));
});

app.listen(port, () => {
  console.log(`🎯 Simple server running at http://localhost:${port}`);
  console.log('📁 Serving from:', path.join(__dirname, 'dist/dashboard'));
});