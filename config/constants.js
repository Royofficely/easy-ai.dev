// Configuration constants for EasyAI Platform
// Centralized location for all hardcoded values

const API_ENDPOINTS = {
  OPENAI: 'https://api.openai.com/v1',
  ANTHROPIC: 'https://api.anthropic.com/v1',
  GOOGLE: 'https://generativelanguage.googleapis.com/v1beta',
  DEEPSEEK: 'https://api.deepseek.com/v1'
};

const DEFAULT_CONFIG = {
  PORT: 4000,
  DATABASE_PATH: '/tmp/easyai.sqlite',
  CORS_ORIGIN: '*',
  REQUEST_TIMEOUT: 30000,
  MAX_REQUEST_SIZE: '10mb'
};

const HEALTH_CHECK_CONFIG = {
  SERVICE_NAME: 'easyai-backend',
  VERSION: '1.8.16'
};

const WORKSPACE_CONFIG = {
  DEFAULT_WORKSPACE_PATH: process.cwd(),
  PROMPTS_DIR: 'prompts',
  CONFIG_DIR: 'config',
  DATA_DIR: 'data',
  LOGS_DIR: 'logs'
};

const SECURITY_CONFIG = {
  HELMET_CSP: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://cdn.tailwindcss.com", 
        "https://unpkg.com", 
        "https://*.clerk.accounts.dev", 
        "https://clerk.accounts.dev", 
        "https://tolerant-ladybug-16.clerk.accounts.dev"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:", 
        "https://*.clerk.accounts.dev", 
        "https://clerk.accounts.dev", 
        "https://tolerant-ladybug-16.clerk.accounts.dev"
      ],
      fontSrc: [
        "'self'", 
        "https:", 
        "https://*.clerk.accounts.dev", 
        "https://clerk.accounts.dev", 
        "https://tolerant-ladybug-16.clerk.accounts.dev"
      ],
      connectSrc: [
        "'self'", 
        "http://localhost:4001", 
        "https://easy-aidev-production.up.railway.app", 
        "https://*.clerk.accounts.dev", 
        "https://clerk.accounts.dev", 
        "https://api.clerk.com", 
        "https://*.clerk.com", 
        "https://tolerant-ladybug-16.clerk.accounts.dev"
      ],
      frameSrc: [
        "'self'", 
        "https://*.clerk.accounts.dev", 
        "https://clerk.accounts.dev", 
        "https://tolerant-ladybug-16.clerk.accounts.dev"
      ],
      upgradeInsecureRequests: null
    }
  }
};

module.exports = {
  API_ENDPOINTS,
  DEFAULT_CONFIG,
  HEALTH_CHECK_CONFIG,
  WORKSPACE_CONFIG,
  SECURITY_CONFIG
};