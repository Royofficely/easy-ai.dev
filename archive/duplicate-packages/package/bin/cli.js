#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer').default;
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

program
  .name('easyai')
  .description('EasyAI CLI tool for managing AI prompts and projects')
  .version('1.3.17');

// Setup command
program
  .command('setup')
  .description('Setup EasyAI with your API key')
  .option('--api-key <apiKey>', 'Your EasyAI API key')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Setting up EasyAI...'));
    
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
    
    // Create .env file
    const envContent = `EASYAI_API_KEY=${apiKey}\n`;
    fs.writeFileSync('.env', envContent);
    
    console.log(chalk.green('✅ EasyAI setup completed successfully!'));
    console.log(chalk.blue('🎉 You can now use: easyai add prompt <name>'));
  });

// Add prompt command
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
      
      // Get API key from .env
      let apiKey = '';
      if (fs.existsSync('.env')) {
        const envContent = fs.readFileSync('.env', 'utf8');
        const match = envContent.match(/EASYAI_API_KEY=(.+)/);
        if (match) {
          apiKey = match[1].trim();
        }
      }
      
      if (!apiKey) {
        console.log(chalk.red('❌ No API key found. Please run: easyai setup --api-key YOUR_KEY'));
        return;
      }
      
      // Create prompt via API
      const response = await axios.post('http://localhost:4000/api/prompts', {
        name,
        category: answers.category,
        description: answers.description,
        content: answers.content
      }, {
        headers: {
          'x-api-key': apiKey
        }
      });
      
      console.log(chalk.green(`✅ Prompt "${name}" created successfully`));
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to create prompt: ${error.response?.data?.error || error.message}`));
    }
  });

// List prompts command
program
  .command('list')
  .description('List all prompt templates')
  .argument('[type]', 'Type of items to list (e.g., "prompts")')
  .action(async (type) => {
    if (type && type !== 'prompts') {
      console.log(chalk.red('❌ Only "prompts" type is supported'));
      return;
    }
    
    console.log(chalk.blue('→ Fetching prompts...'));
    
    try {
      // Get API key from .env
      let apiKey = '';
      if (fs.existsSync('.env')) {
        const envContent = fs.readFileSync('.env', 'utf8');
        const match = envContent.match(/EASYAI_API_KEY=(.+)/);
        if (match) {
          apiKey = match[1].trim();
        }
      }
      
      if (!apiKey) {
        console.log(chalk.red('❌ No API key found. Please run: easyai setup --api-key YOUR_KEY'));
        return;
      }
      
      const response = await axios.get('http://localhost:4000/api/prompts', {
        headers: {
          'x-api-key': apiKey
        }
      });
      
      const prompts = response.data;
      
      if (prompts.length === 0) {
        console.log(chalk.yellow('📝 No prompts found'));
        return;
      }
      
      console.log(chalk.green(`\n📋 Found ${prompts.length} prompts:`));
      
      prompts.forEach(prompt => {
        console.log(`\n${chalk.bold(prompt.name)} (${prompt.category})`);
        console.log(`  ${chalk.gray(prompt.description)}`);
      });
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to fetch prompts: ${error.response?.data?.error || error.message}`));
    }
  });

// Generate command
program
  .command('generate')
  .description('Direct AI generation')
  .argument('<prompt>', 'Prompt to generate')
  .action(async (prompt) => {
    console.log(chalk.blue('→ Generating response...'));
    
    try {
      // Get API key from .env
      let apiKey = '';
      if (fs.existsSync('.env')) {
        const envContent = fs.readFileSync('.env', 'utf8');
        const match = envContent.match(/EASYAI_API_KEY=(.+)/);
        if (match) {
          apiKey = match[1].trim();
        }
      }
      
      if (!apiKey) {
        console.log(chalk.red('❌ No API key found. Please run: easyai setup --api-key YOUR_KEY'));
        return;
      }
      
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'model',
          message: 'Model:',
          choices: ['gpt-4', 'gpt-3.5-turbo', 'claude-3-sonnet'],
          default: 'gpt-4'
        }
      ]);
      
      const response = await axios.post('http://localhost:4000/api/v1/generate', {
        prompt,
        model: answers.model
      }, {
        headers: {
          'x-api-key': apiKey
        }
      });
      
      console.log(chalk.green('\n✅ Response:'));
      console.log(response.data.response);
      
    } catch (error) {
      console.log(chalk.red(`❌ Generation failed: ${error.response?.data?.error || error.message}`));
    }
  });

// UI command
program
  .command('ui')
  .description('Start EasyAI web interface')
  .action(() => {
    console.log(chalk.blue('🚀 Starting EasyAI web interface...'));
    console.log(chalk.yellow('Please visit: http://localhost:4000/dashboard'));
    console.log(chalk.gray('Make sure your EasyAI server is running'));
  });

program.parse();