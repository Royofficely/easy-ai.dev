#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer').default;
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const os = require('os');

// Configuration
const EASYAI_API_BASE = process.env.EASYAI_API_BASE || 'https://api.easy-ai.dev';
const EASYAI_WORKSPACE = path.join(os.homedir(), '.easyai');
const CONFIG_FILE = path.join(EASYAI_WORKSPACE, 'config.json');
const PROMPTS_DIR = path.join(EASYAI_WORKSPACE, 'prompts');
const MODELS_FILE = path.join(EASYAI_WORKSPACE, 'models.json');

program
  .name('easyai')
  .description('EasyAI CLI - Unified AI development platform')
  .version('1.3.23');

// Ensure workspace exists
function ensureWorkspace() {
  if (!fs.existsSync(EASYAI_WORKSPACE)) {
    fs.mkdirSync(EASYAI_WORKSPACE, { recursive: true });
    console.log(chalk.green(`✅ Created EasyAI workspace: ${EASYAI_WORKSPACE}`));
  }
  
  if (!fs.existsSync(PROMPTS_DIR)) {
    fs.mkdirSync(PROMPTS_DIR, { recursive: true });
  }
  
  // Create default config if it doesn't exist
  if (!fs.existsSync(CONFIG_FILE)) {
    const defaultConfig = {
      apiKey: null,
      defaultModel: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      providers: {
        openai: { apiKey: null, models: ['gpt-4', 'gpt-3.5-turbo'] },
        anthropic: { apiKey: null, models: ['claude-3-sonnet', 'claude-3-opus'] },
        google: { apiKey: null, models: ['gemini-pro', 'gemini-pro-vision'] }
      },
      workspace: EASYAI_WORKSPACE,
      createdAt: new Date().toISOString()
    };
    
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    console.log(chalk.green('✅ Created default configuration'));
  }
}

// Load configuration
function loadConfig() {
  ensureWorkspace();
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch (error) {
    console.error(chalk.red('❌ Failed to load configuration'));
    process.exit(1);
  }
}

// Save configuration
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(chalk.red('❌ Failed to save configuration'));
    process.exit(1);
  }
}

// Make authenticated API request
async function apiRequest(endpoint, options = {}) {
  const config = loadConfig();
  if (!config.apiKey) {
    console.log(chalk.red('❌ No API key configured. Please run: easyai setup --api-key YOUR_KEY'));
    process.exit(1);
  }
  
  const url = `${EASYAI_API_BASE}${endpoint}`;
  const requestOptions = {
    ...options,
    headers: {
      'x-api-key': config.apiKey,
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  try {
    const response = await axios(url, requestOptions);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.data?.error || error.response.statusText}`);
    } else {
      throw new Error(`Network Error: ${error.message}`);
    }
  }
}

// Setup command
program
  .command('setup')
  .description('Setup EasyAI with your API key')
  .option('--api-key <apiKey>', 'Your EasyAI API key')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Setting up EasyAI...'));
    
    ensureWorkspace();
    
    let apiKey = options.apiKey;
    
    if (!apiKey) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'apiKey',
          message: 'Enter your EasyAI API key:',
          validate: (input) => input.length > 0 || 'API key is required'
        }
      ]);
      apiKey = answers.apiKey;
    }
    
    // Validate API key with server
    try {
      await axios.get(`${EASYAI_API_BASE}/api/setup/validate-key`, {
        headers: { 'x-api-key': apiKey }
      });
      
      // Save API key to config
      const config = loadConfig();
      config.apiKey = apiKey;
      config.setupCompletedAt = new Date().toISOString();
      saveConfig(config);
      
      console.log(chalk.green('✅ EasyAI setup completed successfully!'));
      console.log(chalk.blue('🎉 You can now use: easyai add prompt <name>'));
      console.log(chalk.gray(`📁 Workspace: ${EASYAI_WORKSPACE}`));
      
    } catch (error) {
      console.log(chalk.red(`❌ Setup failed: ${error.message}`));
      process.exit(1);
    }
  });

// Add prompt command - saves locally and syncs to server
program
  .command('add')
  .description('Add a new prompt template')
  .argument('<type>', 'Type of item to add (e.g., "prompt")')
  .argument('<name>', 'Name of the prompt')
  .action(async (type, name) => {
    if (type !== 'prompt') {
      console.log(chalk.red('❌ Only "prompt" type is supported'));
      return;
    }
    
    console.log(chalk.blue(`→ Creating prompt template: ${name}`));
    
    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'category',
          message: 'Category (development/testing/debugging/etc):',
          default: 'development'
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description:'
        },
        {
          type: 'input',
          name: 'content',
          message: 'Content (use {variable_name} for variables):'
        }
      ]);
      
      const promptData = {
        name,
        category: answers.category,
        description: answers.description,
        content: answers.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save prompt locally
      const promptFile = path.join(PROMPTS_DIR, `${name.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
      fs.writeFileSync(promptFile, JSON.stringify(promptData, null, 2));
      
      // Sync to server
      await apiRequest('/api/prompts', {
        method: 'POST',
        data: promptData
      });
      
      console.log(chalk.green(`✅ Prompt "${name}" created successfully`));
      console.log(chalk.gray(`📄 Local file: ${promptFile}`));
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to create prompt: ${error.message}`));
    }
  });

// List prompts command
program
  .command('list')
  .description('List all prompt templates')
  .argument('[type]', 'Type of items to list (e.g., "prompts")')
  .option('--local', 'Show only local prompts')
  .action(async (type, options) => {
    if (type && type !== 'prompts') {
      console.log(chalk.red('❌ Only "prompts" type is supported'));
      return;
    }
    
    try {
      if (options.local) {
        // List local prompts
        const promptFiles = fs.readdirSync(PROMPTS_DIR).filter(f => f.endsWith('.json'));
        
        if (promptFiles.length === 0) {
          console.log(chalk.yellow('📝 No local prompts found'));
          return;
        }
        
        console.log(chalk.green(`\n📋 Found ${promptFiles.length} local prompts:`));
        
        promptFiles.forEach(file => {
          try {
            const promptData = JSON.parse(fs.readFileSync(path.join(PROMPTS_DIR, file), 'utf8'));
            console.log(`\n${chalk.bold(promptData.name)} (${promptData.category})`);
            console.log(`  ${chalk.gray(promptData.description)}`);
            console.log(`  ${chalk.gray('File: ' + file)}`);
          } catch (error) {
            console.log(chalk.red(`  Error reading ${file}: ${error.message}`));
          }
        });
        
      } else {
        // List server prompts
        const response = await apiRequest('/api/prompts');
        const prompts = response.prompts || response;
        
        if (prompts.length === 0) {
          console.log(chalk.yellow('📝 No prompts found'));
          return;
        }
        
        console.log(chalk.green(`\n📋 Found ${prompts.length} prompts:`));
        
        prompts.forEach(prompt => {
          console.log(`\n${chalk.bold(prompt.name)} (${prompt.category})`);
          console.log(`  ${chalk.gray(prompt.description)}`);
        });
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to fetch prompts: ${error.message}`));
    }
  });

// Status command - check health and show configuration
program
  .command('status')
  .description('Show EasyAI status and configuration')
  .action(async () => {
    try {
      const config = loadConfig();
      
      console.log(chalk.blue('📊 EasyAI Status'));
      console.log('─'.repeat(50));
      
      // Configuration info
      console.log(chalk.white('Configuration:'));
      console.log(chalk.gray(`  Workspace: ${config.workspace}`));
      console.log(chalk.gray(`  API Key: ${config.apiKey ? '***' + config.apiKey.slice(-8) : 'Not configured'}`));
      console.log(chalk.gray(`  Default Model: ${config.defaultModel}`));
      
      if (config.apiKey) {
        // Check server connection
        try {
          const health = await apiRequest('/api/setup/cli-health');
          console.log(chalk.green('\n✅ Server: Connected'));
          console.log(chalk.gray(`   User: ${health.user.email}`));
          console.log(chalk.gray(`   Setup: ${health.user.setup_completed ? 'Complete' : 'Incomplete'}`));
          
          // Get statistics
          try {
            const stats = await apiRequest('/api/proxy/stats?period=24h');
            console.log(chalk.blue('\n📈 Last 24 Hours:'));
            
            if (stats.stats.length === 0) {
              console.log(chalk.gray('   No API calls yet'));
            } else {
              stats.stats.forEach(stat => {
                console.log(chalk.white(`   ${stat.provider}: ${stat.requests} calls, $${stat.cost.toFixed(4)}`));
              });
            }
          } catch (error) {
            console.log(chalk.yellow('⚠️  Could not fetch statistics'));
          }
          
        } catch (error) {
          console.log(chalk.red('❌ Server: Disconnected'));
          console.log(chalk.gray(`   Error: ${error.message}`));
        }
      }
      
      // Local workspace info
      const promptFiles = fs.existsSync(PROMPTS_DIR) ? fs.readdirSync(PROMPTS_DIR).filter(f => f.endsWith('.json')) : [];
      console.log(chalk.blue('\n📁 Local Workspace:'));
      console.log(chalk.gray(`   Prompts: ${promptFiles.length} files`));
      console.log(chalk.gray(`   Location: ${PROMPTS_DIR}`));
      
    } catch (error) {
      console.log(chalk.red(`❌ Status check failed: ${error.message}`));
    }
  });

// Config command - manage configuration
program
  .command('config')
  .description('Manage EasyAI configuration')
  .option('--set <key=value>', 'Set configuration value')
  .option('--get <key>', 'Get configuration value')
  .option('--list', 'List all configuration')
  .action(async (options) => {
    const config = loadConfig();
    
    if (options.set) {
      const [key, value] = options.set.split('=');
      if (!key || value === undefined) {
        console.log(chalk.red('❌ Invalid format. Use: --set key=value'));
        return;
      }
      
      // Handle nested keys like 'providers.openai.apiKey'
      const keys = key.split('.');
      let target = config;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) target[keys[i]] = {};
        target = target[keys[i]];
      }
      target[keys[keys.length - 1]] = value;
      
      saveConfig(config);
      console.log(chalk.green(`✅ Set ${key} = ${value}`));
      
    } else if (options.get) {
      const keys = options.get.split('.');
      let value = config;
      for (const key of keys) {
        value = value?.[key];
      }
      console.log(value !== undefined ? value : chalk.gray('(not set)'));
      
    } else if (options.list) {
      console.log(chalk.blue('📋 EasyAI Configuration:'));
      console.log(JSON.stringify(config, null, 2));
      
    } else {
      console.log(chalk.yellow('Use --set, --get, or --list'));
    }
  });

// UI command
program
  .command('ui')
  .description('Open EasyAI dashboard')
  .action(async () => {
    const config = loadConfig();
    
    if (!config.apiKey) {
      console.log(chalk.red('❌ No API key configured. Please run: easyai setup --api-key YOUR_KEY'));
      return;
    }
    
    console.log(chalk.blue('🚀 Opening EasyAI dashboard...'));
    
    // Try to open the dashboard URL
    const dashboardUrl = `${EASYAI_API_BASE.replace('api.', '')}/dashboard?token=${config.apiKey}`;
    console.log(chalk.yellow(`📱 Dashboard: ${dashboardUrl}`));
    
    // Try to open in browser
    const open = await import('open');
    try {
      await open.default(dashboardUrl);
      console.log(chalk.green('✅ Dashboard opened in browser'));
    } catch (error) {
      console.log(chalk.gray('💡 Please open the URL manually in your browser'));
    }
  });

program.parse();

// Helper function to show first-time setup tips
if (process.argv.length === 2) {
  console.log(chalk.blue('👋 Welcome to EasyAI!'));
  console.log('');
  console.log(chalk.white('Quick start:'));
  console.log(chalk.gray('  easyai setup --api-key YOUR_KEY    Setup your API key'));
  console.log(chalk.gray('  easyai add prompt "my-prompt"      Create a new prompt'));
  console.log(chalk.gray('  easyai list prompts                List all prompts'));
  console.log(chalk.gray('  easyai ui                          Open dashboard'));
  console.log(chalk.gray('  easyai status                      Check status'));
  console.log('');
  console.log(chalk.blue('Get your API key at: https://easy-ai.dev'));
}