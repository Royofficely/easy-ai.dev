#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');

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
      
      // Serve static files
      app.use(express.static(path.join(__dirname, '../dashboard')));
      
      // API proxy to cloud backend
      app.use('/api', async (req, res) => {
        try {
          const response = await axios({
            method: req.method,
            url: `https://easy-aidev-production.up.railway.app/api${req.path}`,
            data: req.body,
            headers: req.headers
          });
          res.json(response.data);
        } catch (error) {
          res.status(error.response?.status || 500).json({
            error: error.response?.data || error.message
          });
        }
      });
      
      // Main route
      app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../dashboard/index.html'));
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
  .description('Manage prompts')
  .action(() => {
    console.log(chalk.blue('📝 Prompt management coming soon...'));
    console.log(chalk.yellow('💡 Use the web dashboard: easyai ui'));
  });

program.parse();