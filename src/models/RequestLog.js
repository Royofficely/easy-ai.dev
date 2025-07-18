const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const RequestLog = sequelize.define('RequestLog', {
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
  api_key_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'ApiKey',
      key: 'id'
    }
  },
  prompt_id: {
    type: DataTypes.STRING,
    allowNull: true // Allow null for proxy requests that don't use prompts
  },
  provider: {
    type: DataTypes.STRING,
    allowNull: true // 'openai', 'anthropic', 'google', etc.
  },
  endpoint: {
    type: DataTypes.STRING,
    allowNull: true // '/v1/chat/completions', '/v1/messages', etc.
  },
  method: {
    type: DataTypes.STRING,
    allowNull: true // 'GET', 'POST', etc.
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'api' // 'api', 'cli', 'ide_proxy', 'dashboard'
  },
  model_used: {
    type: DataTypes.STRING,
    allowNull: false
  },
  request_data: {
    type: DataTypes.JSON,
    allowNull: false
  },
  response_data: {
    type: DataTypes.JSON,
    allowNull: true
  },
  parameters: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  tokens_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  cost: {
    type: DataTypes.DECIMAL(10, 6),
    defaultValue: 0
  },
  duration_ms: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('success', 'error', 'timeout'),
    allowNull: false
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  user_agent: {
    type: DataTypes.STRING,
    allowNull: true
  },
  environment: {
    type: DataTypes.STRING,
    defaultValue: 'development'
  }
});

module.exports = RequestLog;