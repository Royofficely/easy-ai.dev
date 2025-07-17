const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuthEvent = sequelize.define('AuthEvent', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    event_type: {
      type: DataTypes.ENUM('signup', 'email_verification', 'login', 'logout', 'failed_login', 'webhook_sent'),
      allowNull: false
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'web'
    },
    success: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'auth_events',
    timestamps: true,
    indexes: [
      {
        fields: ['email']
      },
      {
        fields: ['event_type']
      },
      {
        fields: ['timestamp']
      },
      {
        fields: ['user_id']
      }
    ]
  });

  AuthEvent.associate = (models) => {
    AuthEvent.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  // Helper methods
  AuthEvent.logEvent = async (eventData) => {
    try {
      return await AuthEvent.create({
        user_id: eventData.user_id || null,
        email: eventData.email,
        event_type: eventData.event_type,
        ip_address: eventData.ip_address || null,
        user_agent: eventData.user_agent || null,
        source: eventData.source || 'web',
        success: eventData.success !== undefined ? eventData.success : true,
        error_message: eventData.error_message || null,
        metadata: eventData.metadata || null
      });
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }
  };

  AuthEvent.getEventStats = async (days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await AuthEvent.findAll({
      where: {
        timestamp: {
          [sequelize.Sequelize.Op.gte]: startDate
        }
      },
      attributes: [
        'event_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('DATE', sequelize.col('timestamp')), 'date']
      ],
      group: ['event_type', sequelize.fn('DATE', sequelize.col('timestamp'))],
      order: [['date', 'DESC']]
    });

    return stats;
  };

  return AuthEvent;
};