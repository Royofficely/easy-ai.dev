const express = require('express');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const { ApiKey } = require('../models');

const router = express.Router();

// Serve dashboard static files
router.use('/static', express.static(path.join(__dirname, '../../public')));

// Dashboard main page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/dashboard.html'));
});


module.exports = router;