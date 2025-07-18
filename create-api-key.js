#!/usr/bin/env node

const { User, ApiKey } = require('./src/models');
const crypto = require('crypto');

async function createApiKey() {
  try {
    // Find or create a test user
    let user = await User.findOne({ where: { email: 'test@example.com' } });
    
    if (!user) {
      user = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        is_active: true,
        is_verified: true
      });
      console.log('Created test user:', user.id);
    } else {
      console.log('Found existing user:', user.id);
    }

    // Create API key
    const apiKey = 'easyai_49nyper78py';
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // Check if API key already exists
    const existingKey = await ApiKey.findOne({ where: { key_hash: hash } });
    
    if (existingKey) {
      console.log('API key already exists:', existingKey.id);
      return;
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

    console.log('Created API key:', {
      id: apiKeyRecord.id,
      name: apiKeyRecord.name,
      key_prefix: apiKeyRecord.key_prefix,
      is_active: apiKeyRecord.is_active,
      user_email: user.email
    });

    console.log('API key created successfully! You can now use: easyai_49nyper78py');
    
  } catch (error) {
    console.error('Error creating API key:', error);
  }
}

// Run the function
createApiKey().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});