const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');
const crypto = require('crypto');

const ApiKey = sequelize.define('ApiKey', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'User',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  key_hash: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  key_prefix: {
    type: DataTypes.STRING,
    allowNull: false
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: ['read', 'write']
  },
  last_used: {
    type: DataTypes.DATE,
    allowNull: true
  },
  usage_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  rate_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 1000 // requests per minute
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

// Static methods
ApiKey.generateKey = function() {
  const prefix = 'eai_';
  const key = crypto.randomBytes(32).toString('hex');
  const fullKey = prefix + key;
  const hash = crypto.createHash('sha256').update(fullKey).digest('hex');
  
  return {
    key: fullKey,
    hash: hash,
    prefix: prefix + key.substring(0, 8) + '...'
  };
};

ApiKey.validateKey = function(key) {
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  return hash;
};

module.exports = ApiKey;