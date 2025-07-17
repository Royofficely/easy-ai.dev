const crypto = require('crypto');

/**
 * Generate a secure API key
 */
function generateApiKey() {
  // Generate a random 32-character string
  const randomBytes = crypto.randomBytes(24);
  const apiKey = 'easyai_' + randomBytes.toString('hex');
  return apiKey;
}

/**
 * Validate API key format
 */
function validateApiKeyFormat(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // Check if it starts with 'easyai_' and has the correct length
  return apiKey.startsWith('easyai_') && apiKey.length === 55;
}

/**
 * Hash API key for storage
 */
function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Generate API key with metadata
 */
function generateApiKeyWithMetadata(name, permissions = []) {
  const apiKey = generateApiKey();
  const hashedKey = hashApiKey(apiKey);
  
  return {
    key: apiKey,
    hashedKey: hashedKey,
    name: name,
    permissions: permissions,
    createdAt: new Date()
  };
}

module.exports = {
  generateApiKey,
  validateApiKeyFormat,
  hashApiKey,
  generateApiKeyWithMetadata
};