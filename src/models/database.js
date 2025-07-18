const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Database configuration - use temp directory for Railway
const isRailway = process.env.RAILWAY_ENVIRONMENT;
let dbPath;

if (isRailway) {
  // Use /tmp directory for Railway deployment
  dbPath = '/tmp/easyai.sqlite';
} else {
  // Use local database directory for development
  const dbDir = path.join(__dirname, '../../database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  dbPath = path.join(dbDir, 'easyai.sqlite');
}

console.log('Database path:', dbPath);

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to database:', error);
  }
};

// Initialize database
const initializeDatabase = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Database synchronization failed:', error);
  }
};

module.exports = {
  sequelize,
  testConnection,
  initializeDatabase
};