const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'developer', 'prompt_engineer', 'viewer'),
    defaultValue: 'developer'
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verification_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  verification_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  api_keys: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  usage_stats: {
    type: DataTypes.JSON,
    defaultValue: {
      requests: 0,
      tokens: 0,
      cost: 0
    }
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

// Instance methods
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.generateVerificationCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.verification_code = code;
  this.verification_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return code;
};

module.exports = User;