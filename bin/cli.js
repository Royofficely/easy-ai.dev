#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

program
  .name('easyai')
  .description('EasyAI CLI tool for managing AI prompts and projects')
  .version('1.0.0');

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
          base_url: "http://localhost:3000",
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
EASYAI_BASE_URL=http://localhost:3000
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
  .command('create')
  .description('Create a new prompt')
  .option('-n, --name <name>', 'Prompt name')
  .option('-t, --template <template>', 'Prompt template')
  .option('-m, --model <model>', 'Model to use')
  .action(async (options) => {
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

program.parse();