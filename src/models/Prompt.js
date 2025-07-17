const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const Prompt = sequelize.define('Prompt', {
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
  prompt_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'general'
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  template: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  parameters: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  model_config: {
    type: DataTypes.JSON,
    defaultValue: {
      primary: 'gpt-4',
      fallbacks: ['gpt-3.5-turbo']
    }
  },
  options: {
    type: DataTypes.JSON,
    defaultValue: {
      temperature: 0.7,
      max_tokens: 1000
    }
  },
  environments: {
    type: DataTypes.JSON,
    defaultValue: {
      development: {},
      staging: {},
      production: {}
    }
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  usage_stats: {
    type: DataTypes.JSON,
    defaultValue: {
      total_requests: 0,
      total_tokens: 0,
      total_cost: 0,
      last_used: null
    }
  }
});

// Instance methods
Prompt.prototype.incrementUsage = function(tokens, cost) {
  this.usage_stats.total_requests += 1;
  this.usage_stats.total_tokens += tokens;
  this.usage_stats.total_cost += cost;
  this.usage_stats.last_used = new Date();
  return this.save();
};

module.exports = Prompt;