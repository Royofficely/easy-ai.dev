const { User, ApiKey, initializeDatabase } = require('./src/models');

async function migrateApiKey() {
  try {
    console.log('🔄 Initializing database...');
    await initializeDatabase();
    
    console.log('🔄 Migrating API key to database...');
    
    const apiKey = 'easyai_112deb01f582f9bd';
    const email = 'roy.nativs@gmail.com';
    
    // Find user by email or create one
    let user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('👤 Creating user with email:', email);
      user = await User.create({
        clerk_id: 'user_306J98D9WCY2EkrNMxPGToIZVQx', // From Clerk logs
        email: email,
        name: 'Roy N',
        is_verified: true,
        role: 'developer',
        plan: 'free'
      });
      console.log('✅ User created:', user.email);
    }
    
    console.log('✅ Found user:', user.email);
    
    // Check if API key already exists
    const existingKey = await ApiKey.findByKey(apiKey);
    if (existingKey) {
      console.log('✅ API key already exists in database');
      return;
    }
    
    // Generate hash for the API key
    const keyData = {
      key: apiKey,
      hash: require('crypto').createHash('sha256').update(apiKey).digest('hex'),
      prefix: apiKey.substring(0, 12) + '...'
    };
    
    // Create API key record
    await ApiKey.create({
      user_id: user.id,
      name: 'Clerk Generated Key',
      key_hash: keyData.hash,
      key_prefix: keyData.prefix,
      permissions: ['read', 'write'],
      expires_at: null
    });
    
    console.log('✅ API key migrated successfully!');
    console.log('🔑 API Key:', apiKey);
    console.log('🧑 User:', user.email);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
  
  process.exit(0);
}

migrateApiKey();