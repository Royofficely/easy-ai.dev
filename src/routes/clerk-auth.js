const express = require('express');
const jwt = require('jsonwebtoken');
const { Webhook } = require('svix');
const { User, ApiKey } = require('../models');

const router = express.Router();

// Clerk webhook endpoint to handle user events
router.post('/webhook', async (req, res) => {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!WEBHOOK_SECRET) {
      console.error('CLERK_WEBHOOK_SECRET not set');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Verify the webhook signature
    const svix_id = req.headers['svix-id'];
    const svix_timestamp = req.headers['svix-timestamp'];
    const svix_signature = req.headers['svix-signature'];

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ error: 'Missing svix headers' });
    }

    const webhook = new Webhook(WEBHOOK_SECRET);
    let event;

    try {
      event = webhook.verify(JSON.stringify(req.body), {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      console.error('Webhook verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    // Handle different event types
    switch (event.type) {
      case 'user.created':
      case 'user.updated':
        await handleUserEvent(event);
        break;
      case 'user.deleted':
        await handleUserDeleted(event);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle user created/updated events
async function handleUserEvent(event) {
  const clerkUser = event.data;
  const email = clerkUser.email_addresses[0]?.email_address;
  
  if (!email) {
    console.error('No email found in Clerk user data');
    return;
  }

  try {
    // Check if user exists
    let user = await User.findOne({ 
      where: { clerk_id: clerkUser.id } 
    });

    if (!user) {
      // Check by email as fallback
      user = await User.findOne({ where: { email } });
      
      if (user) {
        // Update existing user with Clerk ID
        user.clerk_id = clerkUser.id;
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          clerk_id: clerkUser.id,
          email: email,
          name: clerkUser.first_name && clerkUser.last_name 
            ? `${clerkUser.first_name} ${clerkUser.last_name}`.trim()
            : clerkUser.username || email.split('@')[0],
          is_verified: true,
          role: 'developer',
          plan: 'free'
        });

        // Create default API key for new user
        const keyData = ApiKey.generateKey();
        await ApiKey.create({
          user_id: user.id,
          name: 'Default API Key',
          key_hash: keyData.hash,
          key_prefix: keyData.prefix,
          permissions: ['read', 'write'],
          expires_at: null
        });
      }
    } else {
      // Update existing user
      user.email = email;
      user.name = clerkUser.first_name && clerkUser.last_name 
        ? `${clerkUser.first_name} ${clerkUser.last_name}`.trim()
        : clerkUser.username || user.name;
      user.is_verified = true;
      await user.save();
    }
  } catch (error) {
    console.error('Error handling user event:', error);
  }
}

// Handle user deleted event
async function handleUserDeleted(event) {
  const clerkUserId = event.data.id;
  
  try {
    const user = await User.findOne({ where: { clerk_id: clerkUserId } });
    
    if (user) {
      // Soft delete - just mark as inactive
      user.is_active = false;
      await user.save();
    }
  } catch (error) {
    console.error('Error handling user deletion:', error);
  }
}

// Update user workspace path (called from CLI setup)
router.post('/update-workspace', async (req, res) => {
  try {
    const { apiKey, workspacePath } = req.body;
    
    if (!apiKey || !workspacePath) {
      return res.status(400).json({ error: 'API key and workspace path required' });
    }
    
    // Find user by API key
    const apiKeyRecord = await ApiKey.findByKey(apiKey);
    if (!apiKeyRecord) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    const user = await User.findByPk(apiKeyRecord.user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update workspace path
    user.workspace_path = workspacePath;
    await user.save();
    
    res.json({ 
      success: true,
      message: 'Workspace path updated',
      workspacePath 
    });
    
  } catch (error) {
    console.error('Update workspace error:', error);
    res.status(500).json({ error: 'Failed to update workspace path' });
  }
});

// Sync user data from Clerk (called from frontend after sign in)
router.post('/sync', async (req, res) => {
  try {
    console.log('=== CLERK SYNC REQUEST ===');
    console.log('Request body:', req.body);
    
    const { clerkId, email, name } = req.body;
    
    if (!clerkId || !email) {
      console.log('Missing required fields:', { clerkId, email });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Looking for user with clerk_id:', clerkId);
    
    // Find or create user
    let user = await User.findOne({ where: { clerk_id: clerkId } });
    console.log('User found by clerk_id:', !!user);
    
    if (!user) {
      console.log('Checking by email:', email);
      // Check by email as fallback
      user = await User.findOne({ where: { email } });
      console.log('User found by email:', !!user);
      
      if (user) {
        console.log('Updating existing user with Clerk ID');
        // Update existing user with Clerk ID
        user.clerk_id = clerkId;
        user.is_verified = true;
        await user.save();
        console.log('User updated successfully');
      } else {
        console.log('Creating new user');
        // Create new user
        user = await User.create({
          clerk_id: clerkId,
          email: email,
          name: name || email.split('@')[0],
          is_verified: true,
          role: 'developer',
          plan: 'free'
        });
        console.log('New user created:', user.id);
      }
    } else {
      console.log('User exists, updating info');
      user.email = email;
      user.name = name || user.name;
      user.is_verified = true;
      await user.save();
      console.log('Existing user updated');
    }

    console.log('Looking for API key for user:', user.id);
    
    // Get or create API key
    let apiKey = await ApiKey.findOne({ 
      where: { user_id: user.id },
      order: [['created_at', 'DESC']]
    });
    
    console.log('Existing API key found:', !!apiKey);

    if (!apiKey) {
      console.log('Creating new API key');
      const keyData = ApiKey.generateKey();
      console.log('Generated key data:', { prefix: keyData.prefix });
      
      apiKey = await ApiKey.create({
        user_id: user.id,
        name: 'Default API Key',
        key_hash: keyData.hash,
        key_prefix: keyData.prefix,
        permissions: ['read', 'write'],
        expires_at: null
      });
      
      console.log('API key created successfully');
      
      // Return the actual key only on creation
      const response = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          plan: user.plan
        },
        api_key: keyData.key,
        new_key: true
      };
      
      console.log('Returning response for new user:', response);
      return res.json(response);
    }

    // For existing keys, generate a new API key if user doesn't have one yet
    let actualApiKey = await ApiKey.findOne({ 
      where: { user_id: user.id },
      order: [['created_at', 'DESC']]
    });
    
    let fullApiKey = null;
    
    // Check if this user has a valid modern API key
    if (actualApiKey && actualApiKey.key_hash) {
      // If they have the old migrated key, create a new one
      const knownKeyHash = require('crypto').createHash('sha256').update('easyai_112deb01f582f9bd').digest('hex');
      if (actualApiKey.key_hash === knownKeyHash) {
        console.log('User has old migrated key, creating new Clerk API key');
        
        // Generate new API key
        const newKeyData = ApiKey.generateKey();
        const newApiKey = await ApiKey.create({
          user_id: user.id,
          name: 'Clerk Generated Key',
          key_hash: newKeyData.hash,
          key_prefix: newKeyData.prefix,
          permissions: ['read', 'write'],
          expires_at: null
        });
        
        fullApiKey = newKeyData.key;
        actualApiKey = newApiKey;
        
        console.log('New API key created:', newKeyData.prefix);
      } else {
        // They have a modern key, but we can't retrieve the original
        fullApiKey = null; // For security, don't expose existing keys
      }
    }
    
    const response = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan
      },
      api_key_prefix: actualApiKey.key_prefix,
      api_key_for_setup: fullApiKey, // Full key for setup commands
      new_key: fullApiKey !== null, // True if we generated a new key
      api_key: fullApiKey // Include full key if new
    };
    
    console.log('Returning response for existing user:', response);
    res.json(response);
  } catch (error) {
    console.error('=== SYNC ERROR ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Failed to sync user data', details: error.message });
  }
});

// Validate API key and check domain permissions
router.post('/validate', async (req, res) => {
  try {
    const { apiKey, domain } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key required' });
    }

    // Find the API key
    const apiKeyRecord = await ApiKey.findByKey(apiKey);
    
    if (!apiKeyRecord) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Get the user
    const user = await User.findByPk(apiKeyRecord.user_id);
    
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Check plan restrictions
    if (user.plan === 'free' && domain && domain !== 'localhost' && !domain.includes('localhost')) {
      return res.status(403).json({ 
        error: 'Upgrade to Pro plan for production use',
        upgrade_url: 'https://easy-ai.dev/pricing'
      });
    }

    // Log the validation for usage tracking
    if (user.plan === 'pro') {
      // Here you would track usage for billing
      console.log(`API validation for ${user.email} from ${domain}`);
    }

    res.json({
      valid: true,
      plan: user.plan,
      user: {
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

module.exports = router;