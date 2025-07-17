const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { User } = require('../models');
const { validateInput } = require('../middleware/validation');
const { rateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Register new user
router.post('/register', rateLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user with temporary password
    const user = await User.create({
      email,
      password: verificationCode, // Temporary password
      name: email.split('@')[0], // Use email prefix as name
      role: 'developer',
      verification_code: verificationCode,
      verification_expires: verificationExpires,
      is_verified: false
    });

    // Send verification email via Make.com webhook
    try {
      await axios.post('https://hook.eu1.make.com/ggrd1nilwumpay2envc5k8lqhwqtxlm7', {
        email: user.email,
        verification_code: verificationCode
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(201).json({
      message: 'Verification code sent to your email.',
      user_id: user.id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Verify email
router.post('/verify', rateLimiter, async (req, res) => {
  try {
    const { email, verification_code } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.verification_code !== verification_code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (user.verification_expires < new Date()) {
      return res.status(400).json({ error: 'Verification code expired' });
    }

    // Mark user as verified and set the verification code as password
    user.is_verified = true;
    user.password = verification_code; // Set verification code as password
    user.verification_code = null;
    user.verification_expires = null;
    await user.save();

    // Generate JWT token for immediate login
    const token = jwt.sign(
      { 
        user_id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ 
      message: 'Email verified successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Login with verification code
router.post('/login', rateLimiter, async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If user is not verified, treat as registration
    if (!user.is_verified) {
      if (!code) {
        // Generate new verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.verification_code = verificationCode;
        user.verification_expires = verificationExpires;
        await user.save();

        // Send verification email
        try {
          await axios.post('https://hook.eu1.make.com/ggrd1nilwumpay2envc5k8lqhwqtxlm7', {
            email: user.email,
            verification_code: verificationCode
          });
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
        }

        return res.json({ message: 'Verification code sent to your email.' });
      } else {
        // Verify the code
        if (user.verification_code !== code) {
          return res.status(400).json({ error: 'Invalid verification code' });
        }

        if (user.verification_expires < new Date()) {
          return res.status(400).json({ error: 'Verification code expired' });
        }

        // Mark user as verified
        user.is_verified = true;
        user.password = code; // Set verification code as password
        user.verification_code = null;
        user.verification_expires = null;
        user.last_login = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
          { 
            user_id: user.id, 
            email: user.email, 
            role: user.role 
          },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '24h' }
        );

        return res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        });
      }
    }

    // For verified users, login with last verification code
    if (code) {
      const isValidPassword = await user.validatePassword(code);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid code' });
      }

      // Update last login
      user.last_login = new Date();
      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { 
          user_id: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } else {
      // Generate new verification code for login
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      user.verification_code = verificationCode;
      user.verification_expires = verificationExpires;
      await user.save();

      // Send verification email
      try {
        await axios.post('https://hook.eu1.make.com/ggrd1nilwumpay2envc5k8lqhwqtxlm7', {
          email: user.email,
          verification_code: verificationCode
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }

      return res.json({ message: 'Verification code sent to your email.' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Resend verification code
router.post('/resend-verification', rateLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verification_code = verificationCode;
    user.verification_expires = verificationExpires;
    await user.save();

    // Send verification email
    try {
      await axios.post('https://hook.eu1.make.com/ggrd1nilwumpay2envc5k8lqhwqtxlm7', {
        email: user.email,
        verification_code: verificationCode
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.json({ message: 'Verification code sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

module.exports = router;