const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3003;

// Enable CORS
app.use(cors());

// Serve static files from dashboard directory
app.use(express.static(path.join(__dirname, 'dist/dashboard')));

// API routes (mock for now)
app.get('/api/*', (req, res) => {
  res.json({ message: 'API endpoint', path: req.path });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/dashboard/index.html'));
});

app.listen(port, () => {
  console.log(`🎯 Test Dashboard running at http://localhost:${port}`);
  console.log('📝 This is just for testing CSS loading');
});