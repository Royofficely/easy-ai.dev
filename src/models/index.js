const { sequelize, testConnection, initializeDatabase } = require('./database');
const User = require('./User');
const ApiKey = require('./ApiKey');
const Prompt = require('./Prompt');
const RequestLog = require('./RequestLog');
const AuthEvent = require('./AuthEvent')(sequelize);

// Define associations
User.hasMany(ApiKey, { foreignKey: 'user_id', as: 'apiKeys' });
ApiKey.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Prompt, { foreignKey: 'user_id', as: 'prompts' });
Prompt.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(RequestLog, { foreignKey: 'user_id', as: 'requestLogs' });
RequestLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

ApiKey.hasMany(RequestLog, { foreignKey: 'api_key_id', as: 'requestLogs' });
RequestLog.belongsTo(ApiKey, { foreignKey: 'api_key_id', as: 'apiKey' });

User.hasMany(AuthEvent, { foreignKey: 'user_id', as: 'authEvents' });
AuthEvent.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  testConnection,
  initializeDatabase,
  User,
  ApiKey,
  Prompt,
  RequestLog,
  AuthEvent
};