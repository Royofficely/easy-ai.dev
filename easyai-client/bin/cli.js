#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');

// Try to import ora, fallback to console.log if not available
let ora;
try {
  ora = require('ora');
} catch (e) {
  // Fallback spinner implementation
  ora = (text) => ({
    start: () => {
      console.log(chalk.blue(text));
      return {
        succeed: (msg) => console.log(chalk.green(msg)),
        fail: (msg) => console.log(chalk.red(msg))
      };
    }
  });
}

program
  .name('easyai')
  .description('EasyAI Client - Local development tools for AI prompt management')
  .version('1.0.0');

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
PORT=3001

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
      console.log(chalk.gray('  2. Your dashboard will open at http://localhost:3001'));
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
      const express = require('express');
      const app = express();
      const port = 3001;
      
      // Add body parsing middleware
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      
      // API proxy to cloud backend
      app.use('/api', async (req, res) => {
        try {
          // Get API key from .env file as fallback
          const envPath = path.join(process.cwd(), '.env');
          let fallbackApiKey = '';
          
          if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/EASYAI_API_KEY=(.+)/);
            if (match) {
              fallbackApiKey = match[1];
            }
          }
          
          // Extract API key from headers or use fallback
          const apiKey = req.headers['x-api-key'] || 
                        req.headers['authorization']?.replace('Bearer ', '') ||
                        fallbackApiKey;
          
          // Debug logging (remove in production)
          // console.log('API Request:', req.method, req.path);
          // console.log('API Key from headers:', req.headers['x-api-key']);
          // console.log('Fallback API Key:', fallbackApiKey);
          // console.log('Final API Key:', apiKey);
          
          // Filter out problematic headers and add proper headers
          const filteredHeaders = {
            'Content-Type': req.headers['content-type'] || 'application/json',
            'User-Agent': 'EasyAI-Client/1.0.11'
          };
          
          // Add API key if available
          if (apiKey) {
            filteredHeaders['X-API-Key'] = apiKey;
          }
          
          // Remove undefined values
          Object.keys(filteredHeaders).forEach(key => {
            if (filteredHeaders[key] === undefined) {
              delete filteredHeaders[key];
            }
          });
          
          const response = await axios({
            method: req.method,
            url: `https://easy-aidev-production.up.railway.app/api${req.path}`,
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
      app.use('/static', express.static(path.join(__dirname, '../static')));
      app.use(express.static(path.join(__dirname, '..')));
      
      // Main route - serve React dashboard
      app.get('/', (req, res) => {
        try {
          // Read the .env file to get API key
          const envPath = path.join(process.cwd(), '.env');
          let apiKey = '';
          
          if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/EASYAI_API_KEY=(.+)/);
            if (match) {
              apiKey = match[1];
            }
          }
          
          // Read React dashboard index.html
          const dashboardPath = path.join(__dirname, '../index.html');
          let dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');
          
          // Inject API key into the dashboard
          dashboardHtml = dashboardHtml.replace(
            '</head>',
            `<script>window.EASYAI_API_KEY = '${apiKey}';</script></head>`
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

// Prompts command
program
  .command('prompts')
  .description('List all prompts')
  .action(async () => {
    try {
      const apiKey = process.env.EASYAI_API_KEY;
      if (!apiKey) {
        console.log(chalk.red('❌ No API key found. Run: easyai setup --api-key YOUR_KEY'));
        return;
      }

      const response = await axios.get('https://easy-aidev-production.up.railway.app/api/prompts', {
        headers: { 'X-API-Key': apiKey }
      });

      const prompts = response.data.prompts || [];
      
      if (prompts.length === 0) {
        console.log(chalk.yellow('No prompts found. Create one with: easyai add'));
        return;
      }

      console.log(chalk.blue('📝 Your Prompts:'));
      prompts.forEach(prompt => {
        console.log(`  ${chalk.green(prompt.prompt_id)} - ${prompt.name}`);
        console.log(`    Category: ${prompt.category} | Model: ${prompt.model_config?.primary || 'N/A'}`);
      });
    } catch (error) {
      console.error(chalk.red('Failed to load prompts:', error.message));
    }
  });

// Add prompt command
program
  .command('add')
  .description('Add a new prompt')
  .argument('[name]', 'Prompt name')
  .action(async (name) => {
    try {
      const apiKey = process.env.EASYAI_API_KEY;
      if (!apiKey) {
        console.log(chalk.red('❌ No API key found. Run: easyai setup --api-key YOUR_KEY'));
        return;
      }

      if (!name) {
        const answers = await inquirer.prompt([
          { type: 'input', name: 'name', message: 'Prompt name:', validate: input => input.length > 0 },
          { type: 'input', name: 'prompt_id', message: 'Prompt ID (unique):', validate: input => input.length > 0 },
          { type: 'input', name: 'template', message: 'Template (use {{variable}} for parameters):', validate: input => input.length > 0 },
          { type: 'list', name: 'category', message: 'Category:', choices: ['general', 'code', 'writing', 'education', 'business'] },
          { type: 'list', name: 'model', message: 'Primary model:', choices: ['gpt-4', 'gpt-3.5-turbo', 'claude-3-sonnet', 'gemini-pro'] }
        ]);

        const response = await axios.post('https://easy-aidev-production.up.railway.app/api/prompts', {
          name: answers.name,
          prompt_id: answers.prompt_id,
          template: answers.template,
          category: answers.category,
          model_config: { primary: answers.model }
        }, {
          headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' }
        });

        console.log(chalk.green('✅ Prompt created successfully!'));
        console.log(chalk.blue(`Test it with: easyai test ${answers.prompt_id}`));
      }
    } catch (error) {
      console.error(chalk.red('Failed to create prompt:', error.response?.data?.error || error.message));
    }
  });

// Test prompt command
program
  .command('test')
  .description('Test a prompt')
  .argument('<prompt_id>', 'Prompt ID to test')
  .action(async (promptId) => {
    try {
      const apiKey = process.env.EASYAI_API_KEY;
      if (!apiKey) {
        console.log(chalk.red('❌ No API key found. Run: easyai setup --api-key YOUR_KEY'));
        return;
      }

      const answers = await inquirer.prompt([
        { type: 'input', name: 'params', message: 'Parameters (JSON format, e.g. {"name": "John"}):' }
      ]);

      let parameters = {};
      if (answers.params) {
        try {
          parameters = JSON.parse(answers.params);
        } catch (e) {
          console.log(chalk.red('Invalid JSON format'));
          return;
        }
      }

      const spinner = ora('Testing prompt...').start();

      const response = await axios.post('https://easy-aidev-production.up.railway.app/gateway/v1/completions', {
        prompt_id: promptId,
        parameters
      }, {
        headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' }
      });

      spinner.succeed('Test completed!');
      
      console.log(chalk.blue('\n📝 Response:'));
      console.log(response.data.content);
      console.log(chalk.gray(`\nTokens: ${response.data.tokens_used} | Cost: $${response.data.cost.toFixed(6)} | Duration: ${response.data.duration_ms}ms`));
    } catch (error) {
      console.error(chalk.red('Test failed:', error.response?.data?.error || error.message));
    }
  });

// Edit prompt command
program
  .command('edit')
  .description('Edit a prompt')
  .argument('<prompt_id>', 'Prompt ID to edit')
  .action(async (promptId) => {
    console.log(chalk.blue(`🔧 Editing prompt: ${promptId}`));
    console.log(chalk.yellow('💡 Use the web dashboard for full editing: easyai ui'));
  });

program.parse();