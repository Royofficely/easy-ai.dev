const express = require('express');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Serve dashboard static files
router.use('/static', express.static(path.join(__dirname, '../../public')));

// Dashboard main page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/dashboard.html'));
});

// Dashboard API endpoints
router.get('/api/user', authenticateToken, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,
    is_verified: req.user.is_verified
  });
});

module.exports = router;