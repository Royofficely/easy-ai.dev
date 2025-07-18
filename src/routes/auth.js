const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { User, AuthEvent } = require('../models');
const { validateInput } = require('../middleware/validation');
const { rateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Helper function to verify codes consistently
function verifyCode(storedCode, providedCode, expirationTime) {
  console.log('verifyCode called with:', { storedCode, providedCode, expirationTime });
  
  // Normalize codes
  const normalizedStored = String(storedCode || '').trim();
  const normalizedProvided = String(providedCode || '').trim();
  
  console.log('Normalized codes:', { normalizedStored, normalizedProvided });
  
  // Check if codes match
  if (normalizedStored !== normalizedProvided) {
    console.log('Code mismatch');
    return { success: false, error: 'Invalid verification code' };
  }
  
  // Check expiration
  if (expirationTime && expirationTime < new Date()) {
    console.log('Code expired');
    return { success: false, error: 'Verification code expired' };
  }
  
  console.log('Code verification successful');
  return { success: true };
}

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

    console.log('Generated verification code:', { email, verificationCode, verificationExpires });

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
      const webhookPayload = {
        email: user.email,
        verification_code: verificationCode,
        action: 'register',
        source: 'easy-ai.dev',
        timestamp: new Date().toISOString()
      };
      
      console.log('Sending webhook payload:', webhookPayload);
      
      const webhookResponse = await axios.post('https://hook.eu1.make.com/ggrd1nilwumpay2envc5k8lqhwqtxlm7', webhookPayload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('Webhook response:', webhookResponse.status, webhookResponse.data);
    } catch (emailError) {
      console.error('Email sending failed:', emailError.response?.data || emailError.message);
    }

    // Log the signup event to database
    await AuthEvent.logEvent({
      user_id: user.id,
      email: email,
      event_type: 'signup',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      source: 'web',
      metadata: {
        verification_code_sent: true,
        webhook_called: true
      }
    });
    
    console.log(`📝 SIGNUP EVENT: ${email} registered at ${new Date().toISOString()}`);
    
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

    console.log('Verification attempt:', { email, verification_code });

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('User not found:', email);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User verification data:', {
      stored_code: user.verification_code,
      provided_code: verification_code,
      expires: user.verification_expires,
      current_time: new Date()
    });

    // Use unified verification function
    const verificationResult = verifyCode(user.verification_code, verification_code, user.verification_expires);
    
    if (!verificationResult.success) {
      return res.status(400).json({ error: verificationResult.error });
    }

    // Mark user as verified and set the verification code as password
    user.is_verified = true;
    user.password = verification_code; // Set verification code as password
    user.verification_code = null;
    user.verification_expires = null;
    user.last_login = new Date();
    await user.save();
    
    // Log the email verification event to database
    await AuthEvent.logEvent({
      user_id: user.id,
      email: email,
      event_type: 'email_verification',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      source: 'web',
      metadata: {
        verification_code: verification_code
      }
    });
    
    console.log(`✅ EMAIL VERIFIED: ${email} verified at ${new Date().toISOString()}`);

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
          const webhookPayload = {
            email: user.email,
            verification_code: verificationCode,
            action: 'login',
            source: 'easy-ai.dev',
            timestamp: new Date().toISOString()
          };
          
          console.log('Sending login webhook payload:', webhookPayload);
          
          await axios.post('https://hook.eu1.make.com/ggrd1nilwumpay2envc5k8lqhwqtxlm7', webhookPayload, {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 10000
          });
        } catch (emailError) {
          console.error('Email sending failed:', emailError.response?.data || emailError.message);
        }

        return res.json({ message: 'Verification code sent to your email.' });
      } else {
        // Verify the code
        console.log('Login verification attempt:', { email, code });
        console.log('User verification data:', {
          stored_code: user.verification_code,
          provided_code: code,
          expires: user.verification_expires,
          current_time: new Date()
        });

        // Use unified verification function
        const verificationResult = verifyCode(user.verification_code, code, user.verification_expires);
        
        if (!verificationResult.success) {
          return res.status(400).json({ error: verificationResult.error });
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

        // Log the login event to database
        await AuthEvent.logEvent({
          user_id: user.id,
          email: email,
          event_type: 'login',
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          source: 'web',
          metadata: {
            login_method: 'verification_code',
            unverified_user: true
          }
        });
        
        console.log(`🔐 LOGIN EVENT: ${email} logged in at ${new Date().toISOString()}`);
        
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
      console.log('Verified user login attempt:', { email, code });
      console.log('User verification data:', {
        stored_code: user.verification_code,
        provided_code: code,
        expires: user.verification_expires,
        current_time: new Date()
      });

      // Use unified verification function
      const verificationResult = verifyCode(user.verification_code, code, user.verification_expires);
      
      if (!verificationResult.success) {
        return res.status(401).json({ error: verificationResult.error });
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
        const webhookPayload = {
          email: user.email,
          verification_code: verificationCode,
          action: 'login_verified',
          source: 'easy-ai.dev',
          timestamp: new Date().toISOString()
        };
        
        console.log('Sending verified login webhook payload:', webhookPayload);
        
        await axios.post('https://hook.eu1.make.com/ggrd1nilwumpay2envc5k8lqhwqtxlm7', webhookPayload, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError.response?.data || emailError.message);
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
      const webhookPayload = {
        email: user.email,
        verification_code: verificationCode,
        action: 'resend_verification',
        source: 'easy-ai.dev',
        timestamp: new Date().toISOString()
      };
      
      console.log('Sending resend webhook payload:', webhookPayload);
      
      await axios.post('https://hook.eu1.make.com/ggrd1nilwumpay2envc5k8lqhwqtxlm7', webhookPayload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError.response?.data || emailError.message);
    }

    res.json({ message: 'Verification code sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

// Debug endpoint to check user verification state
router.post('/debug-user', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.json({ 
        found: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      found: true,
      user: {
        id: user.id,
        email: user.email,
        is_verified: user.is_verified,
        verification_code: user.verification_code,
        verification_expires: user.verification_expires,
        current_time: new Date(),
        is_expired: user.verification_expires ? user.verification_expires < new Date() : null
      }
    });
  } catch (error) {
    console.error('Debug user error:', error);
    res.status(500).json({ error: 'Debug failed' });
  }
});

// Test webhook endpoint
router.post('/test-webhook', async (req, res) => {
  try {
    const testPayload = {
      email: 'test@example.com',
      verification_code: '123456',
      action: 'test',
      source: 'easy-ai.dev',
      timestamp: new Date().toISOString()
    };
    
    console.log('Testing webhook with payload:', testPayload);
    
    const response = await axios.post('https://hook.eu1.make.com/ggrd1nilwumpay2envc5k8lqhwqtxlm7', testPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('Webhook test response:', response.status, response.data);
    
    res.json({ 
      success: true, 
      webhook_response: response.data,
      status: response.status
    });
  } catch (error) {
    console.error('Webhook test failed:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data || error.message 
    });
  }
});

module.exports = router;