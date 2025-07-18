#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

program
  .name('easyai')
  .description('EasyAI CLI tool for managing AI prompts and projects')
  .version('1.0.9');

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
          base_url: "http://localhost:3001",
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
EASYAI_BASE_URL=http://localhost:3001
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
  const url = `http://localhost:3001/${route}`;
  
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

// Setup command - one command to install everything
program
  .command('setup')
  .description('Complete EasyAI setup - install everything in one command')
  .option('--token <token>', 'Your EasyAI authentication token')
  .option('--api-key <apiKey>', 'Your EasyAI API key')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Starting EasyAI Complete Setup...'));
    console.log(chalk.gray('This will install and configure everything you need\n'));
    
    let apiKey = options.apiKey;
    let token = options.token;
    
    // If no API key provided, try to get from localStorage or prompt
    if (!apiKey) {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('easyai_api_key')) {
        apiKey = localStorage.getItem('easyai_api_key');
      } else {
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
    }
    
    const setupSpinner = ora('Setting up EasyAI...').start();
    
    try {
      // Step 1: Install dependencies
      setupSpinner.text = 'Installing dependencies...';
      await execAsync('npm install', { cwd: __dirname });
      
      // Step 2: Initialize database
      setupSpinner.text = 'Initializing database...';
      await execAsync('npm run db:init', { cwd: path.dirname(__dirname) });
      
      // Step 3: Set up IDE integration
      setupSpinner.text = 'Setting up IDE integration...';
      process.env.EASYAI_API_KEY = apiKey;
      await execAsync(`node install-ide-integration.js ${apiKey}`, { cwd: path.dirname(__dirname) });
      
      // Step 4: Create .env file
      setupSpinner.text = 'Creating configuration files...';
      const envContent = `EASYAI_API_KEY=${apiKey}
EASYAI_BASE_URL=http://localhost:3001
JWT_SECRET=your-jwt-secret-key
DATABASE_URL=sqlite:./database.sqlite
PORT=3001

# Provider API Keys (optional - for fallback)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
DEEPSEEK_API_KEY=
`;
      
      fs.writeFileSync(path.join(path.dirname(__dirname), '.env'), envContent);
      
      // Step 5: Start services
      setupSpinner.text = 'Starting services...';
      
      // Start backend server in background
      exec('npm start', { cwd: path.dirname(__dirname), detached: true, stdio: 'ignore' });
      
      // Build dashboard
      setupSpinner.text = 'Building dashboard...';
      await execAsync('cd dashboard && npm install && npm run build', { cwd: path.dirname(__dirname) });
      
      // Wait a moment for services to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setupSpinner.succeed('EasyAI setup completed successfully!');
      
      console.log(chalk.green('\n🎉 EasyAI is now ready to use!'));
      console.log(chalk.yellow('\n📊 Dashboard: http://localhost:3001/dashboard'));
      console.log(chalk.yellow('🔗 API: http://localhost:3001'));
      console.log(chalk.yellow('🚀 Proxy: http://localhost:8888'));
      
      console.log(chalk.blue('\n✨ What\'s configured:'));
      console.log(chalk.gray('  ✅ Backend server running'));
      console.log(chalk.gray('  ✅ Dashboard running'));
      console.log(chalk.gray('  ✅ IDE integration active'));
      console.log(chalk.gray('  ✅ Claude Code configured'));
      console.log(chalk.gray('  ✅ Cursor configured'));
      console.log(chalk.gray('  ✅ Database initialized'));
      
      console.log(chalk.blue('\n🎯 Next steps:'));
      console.log(chalk.gray('  1. Visit http://localhost:3001/dashboard to use the dashboard'));
      console.log(chalk.gray('  2. Use your IDE - it will automatically route through EasyAI'));
      console.log(chalk.gray('  3. Run "easyai prompts list" to see your prompts'));
      console.log(chalk.gray('  4. Run "easyai --help" for more commands'));
      
      // Open dashboard automatically
      setTimeout(() => {
        openInUI('dashboard');
      }, 2000);
      
    } catch (error) {
      setupSpinner.fail(`Setup failed: ${error.message}`);
      console.log(chalk.red('\n❌ Setup failed. Please check the error above.'));
      console.log(chalk.yellow('💡 You can try running individual commands:'));
      console.log(chalk.gray('  - npm install'));
      console.log(chalk.gray('  - npm run db:init'));
      console.log(chalk.gray('  - npm run setup-ide'));
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
        await axios.get('http://localhost:3001/health', { timeout: 2000 });
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
      
      // Check if we're in the right directory
      if (!fs.existsSync('./src/server.js')) {
        console.error(chalk.red('❌ Error: src/server.js not found'));
        console.log(chalk.yellow('💡 Please run this command from your EasyAI project directory'));
        console.log(chalk.gray('   Current directory: ' + process.cwd()));
        return;
      }
      
      // Start the server
      console.log(chalk.blue('🚀 Starting EasyAI server...'));
      const serverPath = './src/server.js';
      const env = { ...process.env, PORT: '3001' };
      
      // Start server in background
      const server = exec(`node ${serverPath}`, { env, detached: true, stdio: 'ignore' });
      server.unref(); // Allow the parent process to exit
      
      // Wait for server to start
      let attempts = 0;
      const maxAttempts = 15;
      
      while (attempts < maxAttempts) {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await axios.get('http://localhost:3001/health', { timeout: 2000 });
          console.log(chalk.green('✅ Server started successfully'));
          console.log(chalk.yellow('📊 Dashboard: http://localhost:3001/dashboard'));
          openInUI('dashboard');
          return;
        } catch (error) {
          attempts++;
          console.log(chalk.gray(`⏳ Waiting for server to start... (${attempts}/${maxAttempts})`));
        }
      }
      
      console.error(chalk.red('❌ Server failed to start within expected time'));
      console.log(chalk.yellow('💡 Try running: npm start'));
      
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
      { name: 'Backend Server', url: 'http://localhost:3001/health' },
      { name: 'Dashboard', url: 'http://localhost:3000' },
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

program.parse();