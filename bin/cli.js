#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
// Simple spinner replacement - no external dependencies
const ora = (text) => ({
  start: () => {
    console.log(chalk.blue(text));
    return {
      succeed: (msg) => console.log(chalk.green(msg)),
      fail: (msg) => console.log(chalk.red(msg)),
      text: text
    };
  }
});
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const express = require('express');

program
  .name('easyai')
  .description('EasyAI CLI tool for managing AI prompts and projects')
  .version('1.3.14');

// Initialize project
program
  .command('init')
  .description('Initialize a new EasyAI project')
  .option('-n, --name <name>', 'Project name')
  .action(async (options) => {
    const spinner = ora('Initializing EasyAI project...').start();
    
    try {
      // Create directory structure
      const projectName = options.name || 'easyai-project';
      const projectPath = path.join(process.cwd(), projectName);
      
      if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true });
      }
      
      // Create config file
      const config = {
        project_name: projectName,
        api: {
          base_url: "http://localhost:4001",
          timeout: 30000
        },
        models: {
          default: "gpt-4o-mini",
          fallback_chain: ["gpt-4o-mini", "claude-3-haiku", "gemini-pro"]
        },
        prompts: {
          categories: ["general", "development", "email", "analysis"]
        }
      };
      
      fs.writeFileSync(
        path.join(projectPath, 'easyai.config.json'),
        JSON.stringify(config, null, 2)
      );
      
      // Create prompts directory
      const promptsDir = path.join(projectPath, 'easyai', 'prompts');
      fs.mkdirSync(promptsDir, { recursive: true });
      
      // Create example prompt
      const examplePrompt = [{
        name: "greeting",
        description: "Simple greeting prompt",
        category: "general",
        template: "Say hello to {{name}} in a friendly way.",
        variables: ["name"],
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 100
      }];
      
      fs.writeFileSync(
        path.join(promptsDir, 'example.json'),
        JSON.stringify(examplePrompt, null, 2)
      );
      
      // Create .env.example
      const envExample = `# EasyAI Configuration
EASYAI_API_KEY=your_api_key_here
EASYAI_BASE_URL=http://localhost:4001
EASYAI_USER_ID=your_user_id

# Optional: Direct provider keys for fallback
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
DEEPSEEK_API_KEY=your_deepseek_key
`;
      
      fs.writeFileSync(path.join(projectPath, '.env.example'), envExample);
      
      spinner.succeed(`Project initialized successfully at ${projectPath}`);
      
      console.log(chalk.green('\n✅ Next steps:'));
      console.log(chalk.yellow('1. Get your API key from https://easy-ai.dev'));
      console.log(chalk.yellow('2. Copy .env.example to .env and add your API key'));
      console.log(chalk.yellow('3. Run: easyai prompts list'));
      
    } catch (error) {
      spinner.fail(`Failed to initialize project: ${error.message}`);
    }
  });

// Prompt management
const promptsCommand = program.command('prompts').description('Manage prompts');

promptsCommand
  .command('list')
  .description('List all prompts')
  .option('-c, --category <category>', 'Filter by category')
  .action(async (options) => {
    const spinner = ora('Loading prompts...').start();
    
    try {
      const config = loadConfig();
      const response = await axios.get(`${config.api.base_url}/api/prompts`, {
        headers: getAuthHeaders(),
        params: options.category ? { category: options.category } : {}
      });
      
      spinner.succeed('Prompts loaded');
      
      const prompts = response.data.prompts;
      if (prompts.length === 0) {
        console.log(chalk.yellow('No prompts found'));
        return;
      }
      
      console.log(chalk.green(`\n📝 Found ${prompts.length} prompts:\n`));
      
      prompts.forEach(prompt => {
        console.log(chalk.blue(`• ${prompt.name}`));
        console.log(chalk.gray(`  ID: ${prompt.prompt_id}`));
        console.log(chalk.gray(`  Category: ${prompt.category}`));
        console.log(chalk.gray(`  Model: ${prompt.model_config.primary}`));
        console.log();
      });
      
    } catch (error) {
      spinner.fail(`Failed to load prompts: ${error.message}`);
    }
  });

promptsCommand
  .command('add')
  .alias('create')
  .description('Add a new prompt (opens UI if available)')
  .option('-n, --name <name>', 'Prompt name')
  .option('-t, --template <template>', 'Prompt template')
  .option('-m, --model <model>', 'Model to use')
  .option('--ui', 'Open in UI instead of CLI')
  .action(async (options) => {
    if (options.ui) {
      return openInUI('prompts/new');
    }
    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Prompt name:',
          when: !options.name
        },
        {
          type: 'input',
          name: 'prompt_id',
          message: 'Prompt ID (unique identifier):',
          default: (answers) => (options.name || answers.name).toLowerCase().replace(/\s+/g, '_')
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description (optional):'
        },
        {
          type: 'input',
          name: 'category',
          message: 'Category:',
          default: 'general'
        },
        {
          type: 'editor',
          name: 'template',
          message: 'Template (use {{variable}} for parameters):',
          when: !options.template
        },
        {
          type: 'input',
          name: 'model',
          message: 'Model:',
          default: 'gpt-4o-mini',
          when: !options.model
        }
      ]);
      
      const promptData = {
        name: options.name || answers.name,
        prompt_id: answers.prompt_id,
        description: answers.description,
        category: answers.category,
        template: options.template || answers.template,
        model_config: {
          primary: options.model || answers.model,
          fallbacks: ['gpt-4o-mini', 'claude-3-haiku']
        }
      };
      
      const spinner = ora('Creating prompt...').start();
      const config = loadConfig();
      
      await axios.post(`${config.api.base_url}/api/prompts`, promptData, {
        headers: getAuthHeaders()
      });
      
      spinner.succeed('Prompt created successfully');
      
    } catch (error) {
      console.error(chalk.red(`Failed to create prompt: ${error.message}`));
    }
  });

promptsCommand
  .command('edit <prompt_id>')
  .description('Edit an existing prompt (opens UI if available)')
  .option('--ui', 'Open in UI instead of CLI')
  .action(async (promptId, options) => {
    if (options.ui) {
      return openInUI(`prompts/${promptId}/edit`);
    }
    
    try {
      const config = loadConfig();
      const spinner = ora('Loading prompt...').start();
      
      const response = await axios.get(`${config.api.base_url}/api/prompts/${promptId}`, {
        headers: getAuthHeaders()
      });
      
      spinner.succeed('Prompt loaded');
      const prompt = response.data;
      
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Prompt name:',
          default: prompt.name
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description:',
          default: prompt.description
        },
        {
          type: 'input',
          name: 'category',
          message: 'Category:',
          default: prompt.category
        },
        {
          type: 'editor',
          name: 'template',
          message: 'Template:',
          default: prompt.template
        },
        {
          type: 'input',
          name: 'model',
          message: 'Model:',
          default: prompt.model_config.primary
        }
      ]);
      
      const updatedPrompt = {
        name: answers.name,
        description: answers.description,
        category: answers.category,
        template: answers.template,
        model_config: {
          primary: answers.model,
          fallbacks: ['gpt-4o-mini', 'claude-3-haiku']
        }
      };
      
      const updateSpinner = ora('Updating prompt...').start();
      await axios.put(`${config.api.base_url}/api/prompts/${promptId}`, updatedPrompt, {
        headers: getAuthHeaders()
      });
      
      updateSpinner.succeed('Prompt updated successfully');
      
    } catch (error) {
      console.error(chalk.red(`Failed to edit prompt: ${error.message}`));
    }
  });

promptsCommand
  .command('test <prompt_id>')
  .description('Test a prompt')
  .option('-p, --params <params>', 'Parameters as JSON string')
  .action(async (promptId, options) => {
    try {
      const config = loadConfig();
      let parameters = {};
      
      if (options.params) {
        parameters = JSON.parse(options.params);
      } else {
        // Get prompt details to know what parameters are needed
        const promptResponse = await axios.get(`${config.api.base_url}/api/prompts/${promptId}`, {
          headers: getAuthHeaders()
        });
        
        const prompt = promptResponse.data;
        const templateVars = extractTemplateVariables(prompt.template);
        
        if (templateVars.length > 0) {
          const answers = await inquirer.prompt(
            templateVars.map(variable => ({
              type: 'input',
              name: variable,
              message: `Enter value for ${variable}:`
            }))
          );
          parameters = answers;
        }
      }
      
      const spinner = ora('Testing prompt...').start();
      
      const response = await axios.post(`${config.api.base_url}/gateway/v1/completions`, {
        prompt_id: promptId,
        parameters: parameters
      }, {
        headers: getAuthHeaders()
      });
      
      spinner.succeed('Prompt tested successfully');
      
      console.log(chalk.green('\n📝 Response:'));
      console.log(chalk.white(response.data.content));
      console.log(chalk.gray(`\nModel: ${response.data.model}`));
      console.log(chalk.gray(`Tokens: ${response.data.tokens_used}`));
      console.log(chalk.gray(`Cost: $${response.data.cost.toFixed(6)}`));
      
    } catch (error) {
      console.error(chalk.red(`Failed to test prompt: ${error.message}`));
    }
  });

// Utility functions
function loadConfig() {
  const configPath = path.join(process.cwd(), 'easyai.config.json');
  
  if (!fs.existsSync(configPath)) {
    throw new Error('No easyai.config.json found. Run "easyai init" first.');
  }
  
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function getAuthHeaders() {
  const apiKey = process.env.EASYAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('EASYAI_API_KEY environment variable not set');
  }
  
  return {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  };
}

function extractTemplateVariables(template) {
  const matches = template.match(/{{([^}]+)}}/g) || [];
  return matches.map(match => match.replace(/[{}]/g, '').trim());
}

// Function to open UI (if available)
function openInUI(route) {
  const url = `http://localhost:4001/${route}`;
  
  const command = process.platform === 'win32' ? 'start' : 
                  process.platform === 'darwin' ? 'open' : 
                  'xdg-open';
  
  exec(`${command} ${url}`, (error) => {
    if (error) {
      console.log(chalk.yellow(`Could not open UI. Please visit: ${url}`));
      console.log(chalk.gray('Make sure the server is running with: npm start'));
    } else {
      console.log(chalk.green(`Opening ${route} in your browser...`));
    }
  });
}

// Setup command - create .env file with API key
program
  .command('setup')
  .description('Setup EasyAI with your API key')
  .option('--api-key <apiKey>', 'Your EasyAI API key')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Setting up EasyAI...'));
    
    let apiKey = options.apiKey;
    
    // If no API key provided, prompt for it
    if (!apiKey) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'apiKey',
          message: 'Enter your EasyAI API key (from https://easy-ai.dev):',
          validate: (input) => input.length > 0 || 'API key is required'
        }
      ]);
      apiKey = answers.apiKey;
    }
    
    const setupSpinner = ora('Creating configuration...').start();
    
    try {
      // Create .env file
      const envContent = `EASYAI_API_KEY=${apiKey}
EASYAI_BASE_URL=https://easy-aidev-production.up.railway.app
JWT_SECRET=your-jwt-secret-key-${Math.random().toString(36).substring(2, 15)}
DATABASE_URL=sqlite:./database.sqlite
PORT=4001

# Provider API Keys (optional - for fallback)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
DEEPSEEK_API_KEY=
`;
      
      fs.writeFileSync('.env', envContent);
      
      // Create database directory
      if (!fs.existsSync('./database')) {
        fs.mkdirSync('./database');
      }
      
      // Create basic SQLite database
      const dbPath = './database/easyai.sqlite';
      if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, '');
      }
      
      setupSpinner.succeed('EasyAI setup completed successfully!');
      
      console.log(chalk.green('\n🎉 EasyAI is configured and ready!'));
      console.log(chalk.yellow('\n📊 Next steps:'));
      console.log(chalk.gray('  1. Run: easyai ui'));
      console.log(chalk.gray('  2. Your dashboard will open at http://localhost:4001'));
      console.log(chalk.gray('  3. Start building with AI!'));
      
    } catch (error) {
      setupSpinner.fail(`Setup failed: ${error.message}`);
      console.log(chalk.red('\n❌ Setup failed. Please check the error above.'));
      console.log(chalk.yellow('💡 Make sure you have Node.js installed and try again'));
    }
  });

// Settings management
const settingsCommand = program.command('settings').description('Manage EasyAI settings');

settingsCommand
  .command('show')
  .description('Show current settings')
  .action(async () => {
    try {
      const config = loadConfig();
      const response = await axios.get(`${config.api.base_url}/api/settings`, {
        headers: getAuthHeaders()
      });
      
      console.log(chalk.green('\n⚙️ Current Settings:\n'));
      Object.entries(response.data).forEach(([key, value]) => {
        console.log(chalk.blue(`${key}: `) + chalk.white(value));
      });
    } catch (error) {
      console.error(chalk.red(`Failed to load settings: ${error.message}`));
    }
  });

settingsCommand
  .command('set <key> <value>')
  .description('Set a configuration value')
  .action(async (key, value) => {
    try {
      const config = loadConfig();
      await axios.put(`${config.api.base_url}/api/settings`, {
        [key]: value
      }, {
        headers: getAuthHeaders()
      });
      
      console.log(chalk.green(`✅ ${key} set to ${value}`));
    } catch (error) {
      console.error(chalk.red(`Failed to update setting: ${error.message}`));
    }
  });

settingsCommand
  .command('open')
  .description('Open settings in UI')
  .action(() => {
    openInUI('settings');
  });

// Playground commands
const playgroundCommand = program.command('playground').description('Test prompts across multiple models');

playgroundCommand
  .command('test <prompt>')
  .description('Test a prompt across multiple models')
  .option('-m, --models <models>', 'Comma-separated list of models to test')
  .action(async (prompt, options) => {
    const models = options.models ? options.models.split(',') : ['gpt-4o-mini', 'claude-3-haiku', 'gemini-pro'];
    
    console.log(chalk.blue(`\n🧪 Testing prompt across ${models.length} models...\n`));
    
    for (const model of models) {
      const spinner = ora(`Testing with ${model}...`).start();
      
      try {
        const config = loadConfig();
        const response = await axios.post(`${config.api.base_url}/api/playground/test`, {
          prompt: prompt,
          model: model
        }, {
          headers: getAuthHeaders()
        });
        
        spinner.succeed(`${model} (${response.data.cost} - ${response.data.tokens} tokens)`);
        console.log(chalk.gray(`  ${response.data.content.substring(0, 100)}...\n`));
      } catch (error) {
        spinner.fail(`${model} failed: ${error.message}`);
      }
    }
  });

playgroundCommand
  .command('open')
  .description('Open playground in UI')
  .action(() => {
    openInUI('playground');
  });

// Analytics commands
const analyticsCommand = program.command('analytics').description('View usage analytics');

analyticsCommand
  .command('usage')
  .description('Show usage statistics')
  .option('-d, --days <days>', 'Number of days to show', '7')
  .action(async (options) => {
    try {
      const config = loadConfig();
      const response = await axios.get(`${config.api.base_url}/api/analytics/usage`, {
        headers: getAuthHeaders(),
        params: { days: options.days }
      });
      
      const stats = response.data;
      
      console.log(chalk.green(`\n📊 Usage Analytics (Last ${options.days} days):\n`));
      console.log(chalk.blue('Total Requests: ') + chalk.white(stats.total_requests));
      console.log(chalk.blue('Total Cost: ') + chalk.white(`$${stats.total_cost.toFixed(4)}`));
      console.log(chalk.blue('Total Tokens: ') + chalk.white(stats.total_tokens));
      
      if (stats.by_model) {
        console.log(chalk.blue('\nBy Model:'));
        Object.entries(stats.by_model).forEach(([model, count]) => {
          console.log(chalk.gray(`  ${model}: ${count} requests`));
        });
      }
    } catch (error) {
      console.error(chalk.red(`Failed to load analytics: ${error.message}`));
    }
  });

analyticsCommand
  .command('costs')
  .description('Show cost breakdown')
  .action(async () => {
    try {
      const config = loadConfig();
      const response = await axios.get(`${config.api.base_url}/api/analytics/costs`, {
        headers: getAuthHeaders()
      });
      
      console.log(chalk.green('\n💰 Cost Breakdown:\n'));
      Object.entries(response.data).forEach(([provider, cost]) => {
        console.log(chalk.blue(`${provider}: `) + chalk.white(`$${cost.toFixed(6)}`));
      });
    } catch (error) {
      console.error(chalk.red(`Failed to load costs: ${error.message}`));
    }
  });

analyticsCommand
  .command('open')
  .description('Open analytics in UI')
  .action(() => {
    openInUI('analytics');
  });

// Dashboard command
program
  .command('dashboard')
  .description('Open EasyAI dashboard')
  .action(() => {
    console.log(chalk.blue('Opening EasyAI dashboard...'));
    openInUI('');
  });

// Server command - start the web UI server
program
  .command('server')
  .description('Start the EasyAI web server')
  .option('-p, --port <port>', 'Port to run server on', '3001')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Starting EasyAI web server...'));
    console.log(chalk.yellow('📝 Make sure to run this from your EasyAI project directory'));
    
    try {
      // Check if we're in the right directory
      if (!fs.existsSync('./src/server.js')) {
        console.error(chalk.red('❌ Error: src/server.js not found'));
        console.log(chalk.yellow('💡 Please run this command from your EasyAI project directory'));
        console.log(chalk.gray('   Or run: npm start'));
        return;
      }
      
      // Start the server
      const serverPath = './src/server.js';
      const env = { ...process.env, PORT: options.port };
      
      const server = exec(`node ${serverPath}`, { env }, (error, stdout, stderr) => {
        if (error) {
          console.error(chalk.red(`Server error: ${error.message}`));
          return;
        }
        if (stderr) {
          console.error(chalk.red(`Server stderr: ${stderr}`));
          return;
        }
        console.log(stdout);
      });
      
      // Wait a moment for server to start
      setTimeout(() => {
        console.log(chalk.green(`✅ Server started on http://localhost:${options.port}`));
        console.log(chalk.yellow(`📊 Dashboard: http://localhost:${options.port}/dashboard`));
        console.log(chalk.gray('Press Ctrl+C to stop'));
        
        // Open dashboard
        openInUI('dashboard');
      }, 2000);
      
    } catch (error) {
      console.error(chalk.red(`Failed to start server: ${error.message}`));
    }
  });

// Simple UI command for easy access
program
  .command('ui')
  .description('Open EasyAI web interface')
  .action(async () => {
    console.log(chalk.blue('🚀 Starting EasyAI web interface...'));
    
    try {
      // Check if server is already running
      try {
        await axios.get('http://localhost:4001/health', { timeout: 2000 });
        console.log(chalk.green('✅ Server is already running'));
        openInUI('dashboard');
        return;
      } catch (error) {
        // Server not running, start it automatically
        console.log(chalk.yellow('⚠️  Server not running, starting automatically...'));
      }
      
      // Kill any existing process on port 3001
      try {
        console.log(chalk.gray('🔍 Checking for existing processes on port 3001...'));
        const killCommand = process.platform === 'win32' ? 
          'netstat -ano | findstr :3001' : 
          'lsof -ti:3001';
        
        const { stdout } = await execAsync(killCommand);
        if (stdout.trim()) {
          console.log(chalk.yellow('🔄 Killing existing process on port 3001...'));
          const killCmd = process.platform === 'win32' ? 
            `taskkill /F /PID ${stdout.trim().split(/\s+/).pop()}` : 
            'lsof -ti:3001 | xargs kill -9';
          await execAsync(killCmd);
          console.log(chalk.green('✅ Existing process killed'));
        }
      } catch (error) {
        // No existing process, continue
        console.log(chalk.gray('📝 No existing process found on port 3001'));
      }
      
      // Check if .env file exists
      if (!fs.existsSync('.env')) {
        console.log(chalk.red('❌ No configuration found.'));
        console.log(chalk.yellow('💡 Please run: easyai setup --api-key YOUR_API_KEY'));
        return;
      }
      
      // Start the dashboard server
      console.log(chalk.blue('🚀 Starting EasyAI dashboard...'));
      const app = express();
      const port = 4001;
      
      // Add body parsing middleware
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      
      // API proxy to cloud backend
      app.use('/api', async (req, res) => {
        try {
          // Get API key from .env file
          const envPath = path.join(process.cwd(), '.env');
          let apiKey = '';
          
          if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/EASYAI_API_KEY=(.+)/);
            if (match) {
              apiKey = match[1].trim();
            }
          }
          
          // Use env API key if header is null, undefined, or 'null' string
          const headerApiKey = req.headers['x-api-key'];
          const finalApiKey = (headerApiKey && headerApiKey !== 'null' && headerApiKey !== 'undefined') ? headerApiKey : apiKey;
          
          // Debug logging
          console.log('API Proxy Debug:', {
            path: req.path,
            method: req.method,
            envApiKey: apiKey.slice(0, 10) + '...',
            headerApiKey: req.headers['x-api-key'] ? req.headers['x-api-key'].slice(0, 10) + '...' : 'none',
            finalApiKey: finalApiKey ? finalApiKey.slice(0, 10) + '...' : 'none'
          });
          
          const filteredHeaders = {
            'Content-Type': req.headers['content-type'] || 'application/json',
            'User-Agent': 'EasyAI-CLI/1.3.10'
          };
          
          if (finalApiKey) {
            filteredHeaders['X-API-Key'] = finalApiKey;
          }
          
          // Fix the API paths - add /api prefix if not present
          let targetPath = req.path;
          if (!targetPath.startsWith('/api')) {
            targetPath = '/api' + targetPath;
          }
          
          const response = await axios({
            method: req.method,
            url: `http://localhost:4000${targetPath}`,
            data: req.body,
            headers: filteredHeaders
          });
          res.json(response.data);
        } catch (error) {
          res.status(error.response?.status || 500).json({
            error: error.response?.data || error.message
          });
        }
      });
      
      // Serve static files from React build
      app.use('/static', express.static(path.join(__dirname, '../dashboard-build/static')));
      // Don't serve the full directory to avoid serving index.html directly
      app.use('/favicon.ico', express.static(path.join(__dirname, '../dashboard-build/favicon.ico')));
      app.use('/logo192.png', express.static(path.join(__dirname, '../dashboard-build/logo192.png')));
      app.use('/logo512.png', express.static(path.join(__dirname, '../dashboard-build/logo512.png')));
      app.use('/manifest.json', express.static(path.join(__dirname, '../dashboard-build/manifest.json')));
      app.use('/robots.txt', express.static(path.join(__dirname, '../dashboard-build/robots.txt')));
      
      // Main route - serve React dashboard
      app.get('*', (req, res) => {
        try {
          // Read the .env file to get API key
          const envPath = path.join(process.cwd(), '.env');
          let apiKey = '';
          
          if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/EASYAI_API_KEY=(.+)/);
            if (match) {
              apiKey = match[1].trim();
            }
          }
          
          // Read React dashboard index.html
          const dashboardPath = path.join(__dirname, '../dashboard-build/index.html');
          let dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');
          
          // Fix relative paths to absolute paths
          dashboardHtml = dashboardHtml.replace(/\.\/(static\/)/g, '/$1');
          dashboardHtml = dashboardHtml.replace(/\.\/(favicon\.ico|logo192\.png|logo512\.png|manifest\.json)/g, '/$1');
          
          // Inject API key and API base URL into the dashboard - use localStorage
          dashboardHtml = dashboardHtml.replace(
            '<head>',
            `<head>
            <script>
              localStorage.setItem('easyai_api_key', '${apiKey}');
              window.EASYAI_API_KEY = '${apiKey}';
              window.EASYAI_BASE_URL = 'http://localhost:4001';
              console.log('API Key set in localStorage:', localStorage.getItem('easyai_api_key'));
            </script>`
          );
          
          res.send(dashboardHtml);
        } catch (error) {
          console.error('Error serving dashboard:', error);
          res.status(500).send('Error loading dashboard');
        }
      });
      
      app.listen(port, () => {
        console.log(chalk.green(`✅ Dashboard running at http://localhost:${port}`));
        
        // Open browser
        const command = process.platform === 'win32' ? 'start' : 
                        process.platform === 'darwin' ? 'open' : 
                        'xdg-open';
        
        exec(`${command} http://localhost:${port}`, (error) => {
          if (error) {
            console.log(chalk.yellow(`Could not open browser automatically.`));
            console.log(chalk.blue(`Please visit: http://localhost:${port}`));
          }
        });
      });
      
    } catch (error) {
      console.error(chalk.red(`Failed to start server: ${error.message}`));
      console.log(chalk.yellow('💡 Try running: npm start'));
    }
  });

// Status command
program
  .command('status')
  .description('Check EasyAI service status')
  .action(async () => {
    console.log(chalk.blue('🔍 Checking EasyAI status...\n'));
    
    const checks = [
      { name: 'Backend Server', url: 'http://localhost:4001/health' },
      { name: 'Dashboard', url: 'http://localhost:4000' },
      { name: 'Proxy Server', url: 'http://localhost:8888' }
    ];
    
    for (const check of checks) {
      try {
        await axios.get(check.url, { timeout: 2000 });
        console.log(chalk.green(`✅ ${check.name} - Running`));
      } catch (error) {
        console.log(chalk.red(`❌ ${check.name} - Not running`));
      }
    }
  });

// Setup command - create .env file with API key
program
  .command('setup')
  .description('Setup EasyAI with your API key')
  .option('--api-key <apiKey>', 'Your EasyAI API key')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Setting up EasyAI...'));
    
    let apiKey = options.apiKey;
    
    // If no API key provided, prompt for it
    if (!apiKey) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'apiKey',
          message: 'Enter your EasyAI API key (from https://easy-ai.dev):',
          validate: (input) => input.length > 0 || 'API key is required'
        }
      ]);
      apiKey = answers.apiKey;
    }
    
    const setupSpinner = ora('Creating configuration...').start();
    
    try {
      // Create .env file
      const envContent = `EASYAI_API_KEY=${apiKey}
EASYAI_BASE_URL=https://easy-aidev-production.up.railway.app
JWT_SECRET=your-jwt-secret-key-${Math.random().toString(36).substring(2, 15)}
DATABASE_URL=sqlite:./database.sqlite
PORT=4001

# Provider API Keys (optional - for fallback)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
DEEPSEEK_API_KEY=
`;
      
      fs.writeFileSync('.env', envContent);
      
      // Create database directory
      if (!fs.existsSync('./database')) {
        fs.mkdirSync('./database');
      }
      
      // Create basic SQLite database
      const dbPath = './database/easyai.sqlite';
      if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, '');
      }
      
      setupSpinner.succeed('EasyAI setup completed successfully!');
      
      console.log(chalk.green('\n🎉 EasyAI is configured and ready!'));
      console.log(chalk.yellow('\n📊 Next steps:'));
      console.log(chalk.gray('  1. Run: easyai ui'));
      console.log(chalk.gray('  2. Your dashboard will open at http://localhost:4001'));
      console.log(chalk.gray('  3. Start building with AI!'));
      
    } catch (error) {
      setupSpinner.fail(`Setup failed: ${error.message}`);
      console.log(chalk.red('\n❌ Setup failed. Please check the error above.'));
      console.log(chalk.yellow('💡 Make sure you have Node.js installed and try again'));
    }
  });

// UI command - start local dashboard
program
  .command('ui')
  .description('Start EasyAI local dashboard')
  .action(async () => {
    console.log(chalk.blue('🚀 Starting EasyAI dashboard...'));
    
    try {
      // Check if .env file exists
      if (!fs.existsSync('.env')) {
        console.log(chalk.red('❌ No configuration found.'));
        console.log(chalk.yellow('💡 Please run: easyai setup --api-key YOUR_API_KEY'));
        return;
      }
      
      // Start the dashboard server
      const app = express();
      const port = 4001;
      
      // Add body parsing middleware
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      
                // Set permissive CSP headers to allow API calls and disable caching
          app.use((req, res, next) => {
            res.setHeader('Content-Security-Policy', 
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "connect-src 'self' http://localhost:4001 http://localhost:4000; " +
              "img-src 'self' data: https:; " +
              "font-src 'self' data:;"
            );
            
            // Disable caching for all responses
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            
            next();
          });
      
      // API proxy to cloud backend
      app.use('/api', async (req, res) => {
        try {
          // Get API key from .env file
          const envPath = path.join(process.cwd(), '.env');
          let apiKey = '';
          
          if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/EASYAI_API_KEY=(.+)/);
            if (match) {
              apiKey = match[1].trim();
            }
          }
          
          const finalApiKey = req.headers['x-api-key'] || apiKey;
          
          const filteredHeaders = {
            'Content-Type': req.headers['content-type'] || 'application/json',
            'User-Agent': 'EasyAI-CLI/1.3.0'
          };
          
          if (finalApiKey) {
            filteredHeaders['X-API-Key'] = finalApiKey;
          }
          
          // Fix the API paths - add /api prefix if not present
          let targetPath = req.path;
          if (!targetPath.startsWith('/api')) {
            targetPath = '/api' + targetPath;
          }
          
          const response = await axios({
            method: req.method,
            url: `http://localhost:4000${targetPath}`,
            data: req.body,
            headers: filteredHeaders
          });
          res.json(response.data);
        } catch (error) {
          res.status(error.response?.status || 500).json({
            error: error.response?.data || error.message
          });
        }
      });
      
      // Serve static files from React build
      app.use('/static', express.static(path.join(__dirname, '../dashboard/build/static')));
      app.use(express.static(path.join(__dirname, '../dashboard/build')));
      
      // Main route - serve React dashboard
      app.get('*', (req, res) => {
        try {
          // Read the .env file to get API key
          const envPath = path.join(process.cwd(), '.env');
          let apiKey = '';
          
          if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/EASYAI_API_KEY=(.+)/);
            if (match) {
              apiKey = match[1].trim();
            }
          }
          
          console.log('🔑 API Key for injection:', apiKey ? 'Found' : 'Not found');
          if (!apiKey) {
            console.log('⚠️  .env path:', envPath);
            console.log('⚠️  .env exists:', fs.existsSync(envPath));
          }
          
          // Read React dashboard index.html
          const dashboardPath = path.join(__dirname, '../dashboard/build/index.html');
          let dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');
          
          // Fix relative paths to absolute paths
          dashboardHtml = dashboardHtml.replace(/\.\/(static\/)/g, '/$1');
          dashboardHtml = dashboardHtml.replace(/\.\/(favicon\.ico|logo192\.png|logo512\.png|manifest\.json)/g, '/$1');
          
          // Add cache-busting to CSS and JS files
          const timestamp = Date.now();
          dashboardHtml = dashboardHtml.replace(/href="\/static\/css\/([^"]+)"/g, `href="/static/css/$1?v=${timestamp}"`);
          dashboardHtml = dashboardHtml.replace(/src="\/static\/js\/([^"]+)"/g, `src="/static/js/$1?v=${timestamp}"`);
          
          // Inject API key and API base URL into the dashboard
          dashboardHtml = dashboardHtml.replace(
            '</head>',
            `<script>
              window.EASYAI_API_KEY = '${apiKey}';
              window.EASYAI_BASE_URL = 'http://localhost:4001';
              
              // Also store in localStorage for the React app
              if (window.localStorage && '${apiKey}') {
                localStorage.setItem('easyai_api_key', '${apiKey}');
              }
              
              console.log('API Key available:', '${apiKey}' ? 'Yes' : 'No');
              console.log('API Key value:', '${apiKey}');
            </script></head>`
          );
          
          res.send(dashboardHtml);
        } catch (error) {
          console.error('Error serving dashboard:', error);
          res.status(500).send('Error loading dashboard');
        }
      });
      
      app.listen(port, () => {
        console.log(chalk.green(`✅ Dashboard running at http://localhost:${port}`));
        
        // Open browser
        const command = process.platform === 'win32' ? 'start' : 
                        process.platform === 'darwin' ? 'open' : 
                        'xdg-open';
        
        exec(`${command} http://localhost:${port}`, (error) => {
          if (error) {
            console.log(chalk.yellow(`Could not open browser automatically.`));
            console.log(chalk.blue(`Please visit: http://localhost:${port}`));
          }
        });
      });
      
    } catch (error) {
      console.error(chalk.red(`Failed to start dashboard: ${error.message}`));
    }
  });

program.parse();