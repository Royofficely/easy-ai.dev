#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer').default;
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const os = require('os');

program
  .name('easyai')
  .description('EasyAI CLI tool for managing AI prompts and projects')
  .version('1.7.2');

// Helper functions
function getApiKey() {
  // Check global config first
  const globalConfigPath = path.join(os.homedir(), '.easyai', 'config.json');
  if (fs.existsSync(globalConfigPath)) {
    const config = JSON.parse(fs.readFileSync(globalConfigPath, 'utf8'));
    if (config.apiKey) return config.apiKey;
  }
  
  // Check local easyai.env file
  if (fs.existsSync('easyai.env')) {
    const envContent = fs.readFileSync('easyai.env', 'utf8');
    const match = envContent.match(/EASYAI_API_KEY=(.+)/);
    if (match) return match[1].trim();
  }
  
  // Check environment variable
  if (process.env.EASYAI_API_KEY) {
    return process.env.EASYAI_API_KEY;
  }
  
  return null;
}

function saveApiKey(apiKey, userEmail = null, userName = null) {
  const configDir = path.join(os.homedir(), '.easyai');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  const configPath = path.join(configDir, 'config.json');
  const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  
  config.apiKey = apiKey;
  config.lastUpdated = new Date().toISOString();
  
  // Save user info if provided
  if (userEmail) {
    config.userEmail = userEmail;
  }
  if (userName) {
    config.userName = userName;
  }
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

async function makeRequest(endpoint, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey && !options.noAuth) {
    console.log(chalk.red('❌ No API key found. Please run: easyai setup --api-key YOUR_KEY'));
    process.exit(1);
  }
  
  const config = {
    headers: options.noAuth ? {} : { 'x-api-key': apiKey },
    ...options
  };
  
  try {
    const response = await axios(`http://localhost:4000${endpoint}`, config);
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' && !options.noAutoExit) {
      console.log(chalk.red('❌ Cannot connect to EasyAI server'));
      console.log(chalk.yellow('💡 Make sure the EasyAI server is running'));
      process.exit(1);
    }
    throw error;
  }
}

function formatTable(data, columns) {
  if (!data || data.length === 0) return '';
  
  const columnWidths = columns.map(col => {
    const maxWidth = Math.max(
      col.header.length,
      ...data.map(row => String(row[col.key] || '').length)
    );
    return Math.min(maxWidth, col.maxWidth || 50);
  });
  
  // Header
  let result = columns.map((col, i) => 
    col.header.padEnd(columnWidths[i])
  ).join(' | ') + '\n';
  
  // Separator
  result += columnWidths.map(w => '-'.repeat(w)).join('-|-') + '\n';
  
  // Data rows
  data.forEach(row => {
    result += columns.map((col, i) => {
      let value = String(row[col.key] || '');
      if (value.length > columnWidths[i]) {
        value = value.substring(0, columnWidths[i] - 3) + '...';
      }
      return value.padEnd(columnWidths[i]);
    }).join(' | ') + '\n';
  });
  
  return result;
}

// Init command - Initialize project with EasyAI
program
  .command('init')
  .description('Initialize a new EasyAI project')
  .option('--name <name>', 'Project name')
  .option('--template <template>', 'Project template (basic, chatbot, assistant)')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Initializing EasyAI project...'));
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Project name:',
        default: options.name || path.basename(process.cwd()),
        validate: (input) => input.length > 0 || 'Project name is required'
      },
      {
        type: 'list',
        name: 'template',
        message: 'Project template:',
        choices: [
          { name: 'Basic - Simple prompt management', value: 'basic' },
          { name: 'Chatbot - Conversational AI', value: 'chatbot' },
          { name: 'Assistant - Advanced AI assistant', value: 'assistant' }
        ],
        default: options.template || 'basic'
      }
    ]);
    
    // Create project structure
    const projectDir = answers.name;
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    
    // Create prompts directory
    const promptsDir = path.join(projectDir, 'prompts');
    if (!fs.existsSync(promptsDir)) {
      fs.mkdirSync(promptsDir, { recursive: true });
    }
    
    // Create easyai.json config file
    const config = {
      name: answers.name,
      template: answers.template,
      version: '1.0.0',
      created: new Date().toISOString(),
      prompts: {},
      models: {
        default: 'gpt-4',
        fallback: 'gpt-3.5-turbo'
      },
      settings: {
        temperature: 0.7,
        max_tokens: 1000
      }
    };
    
    fs.writeFileSync(
      path.join(projectDir, 'easyai.json'), 
      JSON.stringify(config, null, 2)
    );
    
    // Create sample prompts based on template
    const samplePrompts = {
      basic: {
        'hello-world': {
          name: 'Hello World',
          description: 'A simple greeting prompt',
          content: 'Say hello to {name} in a friendly way.',
          category: 'general'
        }
      },
      chatbot: {
        'system-prompt': {
          name: 'System Prompt',
          description: 'Main system prompt for chatbot',
          content: 'You are a helpful AI assistant. Answer questions clearly and concisely.',
          category: 'system'
        },
        'user-greeting': {
          name: 'User Greeting',
          description: 'Greet new users',
          content: 'Welcome {username}! How can I help you today?',
          category: 'greeting'
        }
      },
      assistant: {
        'analysis-prompt': {
          name: 'Analysis Prompt',
          description: 'Analyze data and provide insights',
          content: 'Analyze the following data and provide key insights:\n\n{data}\n\nFocus on trends, patterns, and actionable recommendations.',
          category: 'analysis'
        },
        'code-review': {
          name: 'Code Review',
          description: 'Review code for quality and best practices',
          content: 'Review this {language} code for:\n\n{code}\n\n1. Code quality\n2. Best practices\n3. Potential bugs\n4. Performance improvements',
          category: 'development'
        }
      }
    };
    
    const prompts = samplePrompts[answers.template];
    for (const [key, prompt] of Object.entries(prompts)) {
      const promptFile = path.join(promptsDir, `${key}.json`);
      fs.writeFileSync(promptFile, JSON.stringify(prompt, null, 2));
    }
    
    // Create README
    const readme = `# ${answers.name}

EasyAI project initialized with ${answers.template} template.

## Getting Started

\`\`\`bash
# List all prompts
easyai prompt list

# Edit a prompt
easyai prompt edit hello-world

# Test a prompt
easyai prompt test hello-world

# Open dashboard
easyai ui
\`\`\`

## Project Structure

- \`prompts/\` - Your prompt templates
- \`easyai.json\` - Project configuration
- \`README.md\` - This file
`;
    
    fs.writeFileSync(path.join(projectDir, 'README.md'), readme);
    
    console.log(chalk.green(`✅ Project "${answers.name}" initialized successfully!`));
    console.log(chalk.blue(`📁 Project created in: ${projectDir}`));
    console.log(chalk.yellow('\n📋 Next steps:'));
    console.log(chalk.gray(`   cd ${projectDir}`));
    console.log(chalk.gray('   easyai prompt list'));
    console.log(chalk.gray('   easyai ui'));
  });

// Setup command
program
  .command('setup')
  .description('Setup EasyAI with your API key')
  .option('--api-key <apiKey>', 'Your EasyAI API key')
  .option('--email <email>', 'Your email address (from easy-ai.dev signup)')
  .option('--name <name>', 'Your full name')
  .option('--integrate', 'Automatically integrate with IDEs')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Setting up EasyAI...'));
    
    let apiKey = options.apiKey;
    let userEmail = options.email;
    let userName = options.name;
    
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
    
    // Auto-fetch user info from backend using API key (try after server starts)
    if (!userEmail || !userName) {
      try {
        console.log(chalk.blue('🔍 Retrieving your account information...'));
        
        // First check if server is running
        let serverRunning = false;
        try {
          await makeRequest('/health', { noAuth: true, noAutoExit: true });
          serverRunning = true;
        } catch (healthError) {
          console.log(chalk.yellow('⚠️  Server not running, will fetch user info later'));
        }
        
        if (serverRunning) {
          const userInfo = await makeRequest('/api/setup/user-info', {
            method: 'POST',
            body: { apiKey },
            noAuth: true
          });
          
          if (userInfo.found && userInfo.user) {
            userEmail = userInfo.user.email;
            userName = userInfo.user.name;
            console.log(chalk.green(`✅ Found account: ${userEmail}`));
          } else {
            console.log(chalk.yellow('⚠️  API key not found in database, using generic user info'));
          }
        }
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Could not retrieve account info: ${error.message}`));
        console.log(chalk.gray('   Continuing with setup using generic user info...'));
      }
    }
    
    // Save API key globally with user info
    saveApiKey(apiKey, userEmail, userName);
    
    // Also create local easyai.env file
    const envContent = `EASYAI_API_KEY=${apiKey}\n`;
    fs.writeFileSync('easyai.env', envContent);
    
    // Register user with backend if email/name provided
    if (userEmail || userName) {
      try {
        console.log(chalk.blue('🔄 Registering user with backend...'));
        await makeRequest('/api/setup/complete', {
          method: 'POST',
          body: {
            apiKey,
            userEmail,
            userName
          }
        });
        console.log(chalk.green('✅ User registered successfully!'));
      } catch (error) {
        console.log(chalk.yellow(`⚠️ Warning: Could not register user with backend: ${error.message}`));
        console.log(chalk.gray('   Your setup is still valid, but your email may not appear in the dashboard.'));
      }
    }
    
    // Initialize workspace structure for better compatibility with UI command
    try {
      console.log(chalk.blue('📁 Initializing workspace structure...'));
      await initializeWorkspace();
      console.log(chalk.green('✅ Workspace structure ready'));
    } catch (workspaceError) {
      console.log(chalk.yellow('⚠️  Warning: Could not initialize workspace structure'));
      console.log(chalk.gray(`   This won't affect basic functionality: ${workspaceError.message}`));
    }
    
    console.log(chalk.green('✅ EasyAI setup completed successfully!'));
    
    // Auto-integrate with IDEs if requested
    if (options.integrate) {
      console.log(chalk.blue('\n🔧 Setting up IDE integrations...'));
      await setupIDEIntegrations();
    }
    
    console.log(chalk.blue('\n🎉 You can now use:'));
    console.log(chalk.gray('   easyai init my-project'));
    console.log(chalk.gray('   easyai prompt list'));
    console.log(chalk.gray('   easyai ui'));
  });

// Prompt management commands
const promptCommand = program
  .command('prompt')
  .description('Manage AI prompts');

// List prompts
promptCommand
  .command('list')
  .description('List all prompts')
  .option('--category <category>', 'Filter by category')
  .option('--format <format>', 'Output format (table, json)', 'table')
  .action(async (options) => {
    try {
      console.log(chalk.blue('📋 Fetching prompts...'));
      
      let endpoint = '/api/prompts';
      if (options.category) {
        endpoint += `?category=${options.category}`;
      }
      
      const prompts = await makeRequest(endpoint);
      
      if (prompts.length === 0) {
        console.log(chalk.yellow('📝 No prompts found'));
        return;
      }
      
      if (options.format === 'json') {
        console.log(JSON.stringify(prompts, null, 2));
        return;
      }
      
      console.log(chalk.green(`\n📋 Found ${prompts.length} prompt${prompts.length > 1 ? 's' : ''}:`));
      
      const table = formatTable(prompts, [
        { key: 'name', header: 'Name', maxWidth: 25 },
        { key: 'category', header: 'Category', maxWidth: 15 },
        { key: 'description', header: 'Description', maxWidth: 40 },
        { key: 'updated_at', header: 'Updated', maxWidth: 20 }
      ]);
      
      console.log(table);
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to fetch prompts: ${error.response?.data?.error || error.message}`));
    }
  });

// Edit prompt
promptCommand
  .command('edit <name>')
  .description('Edit a prompt in your default editor')
  .action(async (name) => {
    try {
      console.log(chalk.blue(`📝 Editing prompt: ${name}`));
      
      // Get prompt details
      const prompts = await makeRequest('/api/prompts');
      const prompt = prompts.find(p => p.name === name);
      
      if (!prompt) {
        console.log(chalk.red(`❌ Prompt "${name}" not found`));
        return;
      }
      
      // Create temporary file
      const tempFile = path.join(os.tmpdir(), `easyai-${name}-${Date.now()}.md`);
      
      const content = `# ${prompt.name}

**Category:** ${prompt.category}
**Description:** ${prompt.description}

## Content
${prompt.content}

## Variables
${prompt.variables ? prompt.variables.join(', ') : 'None'}

---
Edit the content above and save to update the prompt.
`;
      
      fs.writeFileSync(tempFile, content);
      
      // Open in editor
      const editor = process.env.EDITOR || 'nano';
      const { spawn } = require('child_process');
      
      const child = spawn(editor, [tempFile], { stdio: 'inherit' });
      
      child.on('exit', async (code) => {
        if (code === 0) {
          // Read updated content
          const updatedContent = fs.readFileSync(tempFile, 'utf8');
          
          // Parse the content (simple parsing for now)
          const contentMatch = updatedContent.match(/## Content\n([\s\S]*?)\n## Variables/);
          if (contentMatch) {
            const newContent = contentMatch[1].trim();
            
            // Update prompt via API
            await makeRequest(`/api/prompts/${prompt.prompt_id}`, {
              method: 'PUT',
              data: {
                ...prompt,
                content: newContent
              }
            });
            
            console.log(chalk.green(`✅ Prompt "${name}" updated successfully`));
          }
        }
        
        // Clean up temp file
        fs.unlinkSync(tempFile);
      });
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to edit prompt: ${error.response?.data?.error || error.message}`));
    }
  });

// Test prompt
promptCommand
  .command('test <name>')
  .description('Test a prompt with sample data')
  .option('--model <model>', 'Model to use for testing', 'gpt-4')
  .option('--vars <vars>', 'Variables in JSON format')
  .action(async (name, options) => {
    try {
      console.log(chalk.blue(`🧪 Testing prompt: ${name}`));
      
      // Get prompt details
      const prompts = await makeRequest('/api/prompts');
      const prompt = prompts.find(p => p.name === name);
      
      if (!prompt) {
        console.log(chalk.red(`❌ Prompt "${name}" not found`));
        return;
      }
      
      // Get variables from prompt content
      const variableMatches = prompt.content.match(/{([^}]+)}/g);
      const variables = variableMatches ? variableMatches.map(v => v.slice(1, -1)) : [];
      
      let varValues = {};
      
      if (options.vars) {
        try {
          varValues = JSON.parse(options.vars);
        } catch (error) {
          console.log(chalk.red('❌ Invalid JSON format for variables'));
          return;
        }
      } else if (variables.length > 0) {
        // Interactive variable input
        const questions = variables.map(variable => ({
          type: 'input',
          name: variable,
          message: `Enter value for {${variable}}:`
        }));
        
        varValues = await inquirer.prompt(questions);
      }
      
      // Replace variables in content
      let testContent = prompt.content;
      for (const [key, value] of Object.entries(varValues)) {
        testContent = testContent.replace(new RegExp(`{${key}}`, 'g'), value);
      }
      
      console.log(chalk.blue('\n📝 Testing with content:'));
      console.log(chalk.gray(testContent));
      console.log(chalk.blue(`\n🤖 Using model: ${options.model}`));
      
      // Make API call
      const response = await makeRequest('/api/v1/generate', {
        method: 'POST',
        data: {
          prompt: testContent,
          model: options.model
        }
      });
      
      console.log(chalk.green('\n✅ Response:'));
      console.log(response.response);
      
    } catch (error) {
      console.log(chalk.red(`❌ Test failed: ${error.response?.data?.error || error.message}`));
    }
  });

// Add prompt
promptCommand
  .command('add <name>')
  .description('Add a new prompt template')
  .option('--category <category>', 'Prompt category', 'general')
  .option('--description <description>', 'Prompt description')
  .option('--content <content>', 'Prompt content')
  .action(async (name, options) => {
    console.log(chalk.blue(`→ Creating prompt: ${name}`));
    
    try {
      let { category, description, content } = options;
      
      // Interactive input if options not provided
      if (!description || !content) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'category',
            message: 'Category:',
            default: category || 'general'
          },
          {
            type: 'input',
            name: 'description',
            message: 'Description:',
            default: description
          },
          {
            type: 'editor',
            name: 'content',
            message: 'Content (use {variable_name} for variables):',
            default: content
          }
        ]);
        
        category = answers.category;
        description = answers.description;
        content = answers.content;
      }
      
      // Create prompt via API
      await makeRequest('/api/prompts', {
        method: 'POST',
        data: {
          name,
          category,
          description,
          content
        }
      });
      
      console.log(chalk.green(`✅ Prompt "${name}" created successfully`));
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to create prompt: ${error.response?.data?.error || error.message}`));
    }
  });

// Delete prompt
promptCommand
  .command('delete <name>')
  .description('Delete a prompt')
  .option('--force', 'Skip confirmation')
  .action(async (name, options) => {
    try {
      if (!options.force) {
        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: `Are you sure you want to delete prompt "${name}"?`,
            default: false
          }
        ]);
        
        if (!confirmed) {
          console.log(chalk.yellow('❌ Deletion cancelled'));
          return;
        }
      }
      
      // Find prompt
      const prompts = await makeRequest('/api/prompts');
      const prompt = prompts.find(p => p.name === name);
      
      if (!prompt) {
        console.log(chalk.red(`❌ Prompt "${name}" not found`));
        return;
      }
      
      // Delete prompt
      await makeRequest(`/api/prompts/${prompt.prompt_id}`, {
        method: 'DELETE'
      });
      
      console.log(chalk.green(`✅ Prompt "${name}" deleted successfully`));
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to delete prompt: ${error.response?.data?.error || error.message}`));
    }
  });

// Models compare command
program
  .command('models')
  .description('Compare AI models side-by-side')
  .argument('<prompt>', 'Prompt to test across models')
  .option('--models <models>', 'Comma-separated list of models', 'gpt-4,gpt-3.5-turbo,claude-3-sonnet')
  .option('--format <format>', 'Output format (table, json)', 'table')
  .action(async (prompt, options) => {
    try {
      const models = options.models.split(',').map(m => m.trim());
      
      console.log(chalk.blue(`🔬 Testing prompt across ${models.length} models...`));
      console.log(chalk.gray(`Prompt: ${prompt}`));
      
      const results = [];
      
      for (const model of models) {
        console.log(chalk.blue(`\n🤖 Testing with ${model}...`));
        
        try {
          const startTime = Date.now();
          
          const response = await makeRequest('/api/v1/generate', {
            method: 'POST',
            data: {
              prompt,
              model
            }
          });
          
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          results.push({
            model,
            response: response.response,
            duration: `${duration}ms`,
            tokens: response.tokens || 'N/A',
            cost: response.cost || 'N/A',
            status: 'success'
          });
          
          console.log(chalk.green(`✅ ${model} completed in ${duration}ms`));
          
        } catch (error) {
          results.push({
            model,
            response: 'Error',
            duration: 'N/A',
            tokens: 'N/A',
            cost: 'N/A',
            status: 'failed',
            error: error.message
          });
          
          console.log(chalk.red(`❌ ${model} failed: ${error.message}`));
        }
      }
      
      console.log(chalk.blue('\n📊 Results Comparison:'));
      
      if (options.format === 'json') {
        console.log(JSON.stringify(results, null, 2));
        return;
      }
      
      // Display results in table format
      const table = formatTable(results, [
        { key: 'model', header: 'Model', maxWidth: 20 },
        { key: 'status', header: 'Status', maxWidth: 10 },
        { key: 'duration', header: 'Duration', maxWidth: 10 },
        { key: 'tokens', header: 'Tokens', maxWidth: 10 },
        { key: 'cost', header: 'Cost', maxWidth: 10 },
        { key: 'response', header: 'Response', maxWidth: 60 }
      ]);
      
      console.log(table);
      
    } catch (error) {
      console.log(chalk.red(`❌ Model comparison failed: ${error.message}`));
    }
  });

// Costs analyze command
program
  .command('costs')
  .description('Analyze AI usage costs and patterns')
  .option('--period <period>', 'Time period (1h, 24h, 7d, 30d)', '24h')
  .option('--format <format>', 'Output format (table, json)', 'table')
  .option('--breakdown <breakdown>', 'Breakdown by (model, provider, day)', 'provider')
  .action(async (options) => {
    try {
      console.log(chalk.blue(`💰 Analyzing costs for last ${options.period}...`));
      
      const stats = await makeRequest(`/api/proxy/stats?period=${options.period}`);
      
      if (!stats.stats || stats.stats.length === 0) {
        console.log(chalk.yellow('📊 No usage data found for the selected period'));
        return;
      }
      
      const totalCost = stats.stats.reduce((sum, stat) => sum + stat.cost, 0);
      const totalRequests = stats.stats.reduce((sum, stat) => sum + stat.requests, 0);
      const totalTokens = stats.stats.reduce((sum, stat) => sum + stat.tokens, 0);
      
      console.log(chalk.green(`\n📈 Cost Analysis (${options.period}):`));
      console.log(chalk.white(`Total Cost: $${totalCost.toFixed(4)}`));
      console.log(chalk.white(`Total Requests: ${totalRequests.toLocaleString()}`));
      console.log(chalk.white(`Total Tokens: ${totalTokens.toLocaleString()}`));
      console.log(chalk.white(`Average Cost/Request: $${(totalCost / totalRequests).toFixed(6)}`));
      console.log(chalk.white(`Average Cost/Token: $${(totalCost / totalTokens).toFixed(8)}`));
      
      if (options.format === 'json') {
        console.log(JSON.stringify(stats, null, 2));
        return;
      }
      
      console.log(chalk.blue('\n📊 Breakdown by Provider:'));
      
      const table = formatTable(stats.stats, [
        { key: 'provider', header: 'Provider', maxWidth: 15 },
        { key: 'requests', header: 'Requests', maxWidth: 10 },
        { key: 'tokens', header: 'Tokens', maxWidth: 12 },
        { key: 'cost', header: 'Cost ($)', maxWidth: 10 },
        { key: 'avg_cost', header: 'Avg/Req ($)', maxWidth: 12 }
      ]);
      
      // Add calculated fields
      const enrichedStats = stats.stats.map(stat => ({
        ...stat,
        cost: stat.cost.toFixed(4),
        avg_cost: (stat.cost / stat.requests).toFixed(6),
        tokens: stat.tokens.toLocaleString(),
        requests: stat.requests.toLocaleString()
      }));
      
      console.log(formatTable(enrichedStats, [
        { key: 'provider', header: 'Provider', maxWidth: 15 },
        { key: 'requests', header: 'Requests', maxWidth: 10 },
        { key: 'tokens', header: 'Tokens', maxWidth: 12 },
        { key: 'cost', header: 'Cost ($)', maxWidth: 10 },
        { key: 'avg_cost', header: 'Avg/Req ($)', maxWidth: 12 }
      ]));
      
      // Cost optimization suggestions
      console.log(chalk.yellow('\n💡 Cost Optimization Suggestions:'));
      
      const mostExpensive = stats.stats.reduce((max, stat) => 
        stat.cost > max.cost ? stat : max
      );
      
      const cheapestAlternative = stats.stats.reduce((min, stat) => 
        stat.cost < min.cost ? stat : min
      );
      
      if (mostExpensive.provider !== cheapestAlternative.provider) {
        const savings = mostExpensive.cost - cheapestAlternative.cost;
        console.log(chalk.gray(`   • Consider using ${cheapestAlternative.provider} instead of ${mostExpensive.provider}`));
        console.log(chalk.gray(`   • Potential savings: $${savings.toFixed(4)} for this period`));
      }
      
      if (totalCost > 1) {
        console.log(chalk.gray('   • Consider implementing response caching for repeated queries'));
        console.log(chalk.gray('   • Review prompt lengths to optimize token usage'));
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Cost analysis failed: ${error.message}`));
    }
  });

// Team management commands
const teamCommand = program
  .command('team')
  .description('Manage team collaboration');

teamCommand
  .command('invite <email>')
  .description('Invite a team member')
  .option('--role <role>', 'Role (admin, editor, viewer)', 'editor')
  .action(async (email, options) => {
    try {
      console.log(chalk.blue(`📧 Inviting ${email} as ${options.role}...`));
      
      const result = await makeRequest('/api/team/invite', {
        method: 'POST',
        data: {
          email,
          role: options.role
        }
      });
      
      console.log(chalk.green(`✅ Invitation sent to ${email}`));
      console.log(chalk.gray(`   Role: ${options.role}`));
      console.log(chalk.gray(`   Invitation ID: ${result.invitationId}`));
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to invite user: ${error.response?.data?.error || error.message}`));
    }
  });

teamCommand
  .command('list')
  .description('List team members')
  .action(async () => {
    try {
      console.log(chalk.blue('👥 Fetching team members...'));
      
      const team = await makeRequest('/api/team/members');
      
      if (team.length === 0) {
        console.log(chalk.yellow('👤 No team members found'));
        return;
      }
      
      console.log(chalk.green(`\n👥 Team Members (${team.length}):`));
      
      const table = formatTable(team, [
        { key: 'email', header: 'Email', maxWidth: 30 },
        { key: 'role', header: 'Role', maxWidth: 10 },
        { key: 'status', header: 'Status', maxWidth: 10 },
        { key: 'joined', header: 'Joined', maxWidth: 15 }
      ]);
      
      console.log(table);
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to fetch team: ${error.response?.data?.error || error.message}`));
    }
  });

// Generate command
program
  .command('generate')
  .description('Direct AI generation')
  .argument('<prompt>', 'Prompt to generate')
  .option('--model <model>', 'AI model to use', 'gpt-4')
  .action(async (prompt, options) => {
    console.log(chalk.blue('→ Generating response...'));
    
    try {
      const response = await makeRequest('/api/v1/generate', {
        method: 'POST',
        data: {
          prompt,
          model: options.model
        }
      });
      
      console.log(chalk.green('\n✅ Response:'));
      console.log(response.response);
      
    } catch (error) {
      console.log(chalk.red(`❌ Generation failed: ${error.response?.data?.error || error.message}`));
    }
  });

// UI command
program
  .command('ui')
  .description('Open EasyAI web interface')
  .option('--port <port>', 'Port number', '4000')
  .option('--no-auto-start', 'Disable automatic server startup')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Opening EasyAI web interface...'));
    
    // Initialize workspace first
    let workspaceDir;
    try {
      workspaceDir = await initializeWorkspace();
    } catch (workspaceError) {
      console.log(chalk.red('❌ Failed to initialize workspace'));
      console.log(chalk.red(`Error: ${workspaceError.message}`));
      return;
    }
    
    try {
      // Check if server is running
      await makeRequest('/api/setup/health', { noAutoExit: true, noAuth: true });
      
      const url = `http://localhost:${options.port}/dashboard`;
      console.log(chalk.green(`✅ Server is running`));
      console.log(chalk.yellow(`📱 Dashboard: ${url}`));
      
      await openBrowser(url);
      
    } catch (error) {
      if (options.autoStart !== false) {
        console.log(chalk.yellow('🔄 Server not running, starting automatically...'));
        
        // Clean port before starting to handle any stale processes
        console.log(chalk.blue(`🧹 Cleaning port ${options.port} before startup...`));
        try {
          await killPort(options.port);
          console.log(chalk.green(`✅ Port ${options.port} cleaned`));
        } catch (killError) {
          console.log(chalk.yellow(`⚠️  Warning: Could not clean port ${options.port}: ${killError.message}`));
        }
        
        try {
          await startServer(options.port, workspaceDir);
        } catch (serverStartError) {
          console.log(chalk.red('❌ Failed to start server automatically'));
          console.log(chalk.red(`Error: ${serverStartError.message}`));
          console.log(chalk.yellow('💡 Please check the easyai directory and try again'));
          return;
        }
        
        // Wait for server to start with progressive checking
        console.log(chalk.blue('⏳ Waiting for server to start...'));
        let serverReady = false;
        let attempts = 0;
        const maxAttempts = 10; // 10 attempts with 1s intervals = 10s total
        
        while (!serverReady && attempts < maxAttempts) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            await makeRequest('/api/setup/health', { noAutoExit: true, noAuth: true });
            serverReady = true;
            break;
          } catch (healthCheckError) {
            console.log(chalk.gray(`   • Attempt ${attempts}/${maxAttempts}...`));
          }
        }
        
        if (serverReady) {
          const url = `http://localhost:${options.port}/dashboard`;
          console.log(chalk.green(`✅ Server started successfully`));
          console.log(chalk.yellow(`📱 Dashboard: ${url}`));
          console.log(chalk.gray(`💼 Workspace: ${workspaceDir}`));
          await openBrowser(url);
        } else {
          console.log(chalk.red('❌ Server failed to start within timeout'));
          console.log(chalk.yellow('💡 Try running the command again or check logs'));
        }
      } else {
        console.log(chalk.red('❌ Cannot connect to EasyAI server'));
        console.log(chalk.yellow('💡 Make sure the server is running with: npm start'));
      }
    }
  });

// IDE Integration commands
const integrateCommand = program
  .command('integrate')
  .description('Integrate EasyAI with IDEs and tools');

integrateCommand
  .command('auto')
  .description('Automatically detect and integrate with installed IDEs')
  .action(async () => {
    console.log(chalk.blue('🔍 Auto-detecting installed IDEs...'));
    await setupIDEIntegrations();
  });

integrateCommand
  .command('claude-code')
  .description('Integrate with Claude Code')
  .action(async () => {
    console.log(chalk.blue('🤖 Setting up Claude Code integration...'));
    await setupClaudeCodeIntegration();
  });

integrateCommand
  .command('cursor')
  .description('Integrate with Cursor')
  .action(async () => {
    console.log(chalk.blue('🖱️ Setting up Cursor integration...'));
    await setupCursorIntegration();
  });

integrateCommand
  .command('status')
  .description('Show IDE integration status')
  .action(async () => {
    console.log(chalk.blue('🔧 Checking IDE integration status...'));
    await checkIntegrationStatus();
  });

integrateCommand
  .command('remove')
  .description('Remove IDE integrations')
  .action(async () => {
    console.log(chalk.blue('🗑️ Removing IDE integrations...'));
    await removeIntegrations();
  });

// Status command - check health and show stats
program
  .command('status')
  .description('Show EasyAI status and statistics')
  .action(async () => {
    try {
      console.log(chalk.blue('📊 EasyAI Status'));
      console.log('─'.repeat(40));
      
      // Check server health
      const health = await makeRequest('/api/setup/cli-health');
      
      console.log(chalk.green('✅ Server: Connected'));
      console.log(chalk.gray(`   User: ${health.user.email}`));
      console.log(chalk.gray(`   Setup: ${health.user.setup_completed ? 'Complete' : 'Incomplete'}`));
      console.log(chalk.gray(`   API Key: ${getApiKey()?.slice(-8) || 'Not set'}`));
      
      // Get proxy statistics
      try {
        const stats = await makeRequest('/api/proxy/stats?period=24h');
        
        console.log(chalk.blue('\n📈 Last 24 Hours:'));
        
        if (stats.stats.length === 0) {
          console.log(chalk.gray('   No API calls yet'));
        } else {
          stats.stats.forEach(stat => {
            console.log(chalk.white(`   ${stat.provider}: ${stat.requests} calls, $${stat.cost.toFixed(4)}, ${stat.tokens} tokens`));
          });
        }
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not fetch statistics'));
      }
      
      console.log(chalk.blue('\n🔗 Endpoints:'));
      console.log(chalk.gray('   Dashboard: http://localhost:4000/dashboard'));
      console.log(chalk.gray('   OpenAI Proxy: http://localhost:4000/api/proxy/openai/v1/'));
      console.log(chalk.gray('   Anthropic Proxy: http://localhost:4000/api/proxy/anthropic/v1/'));
      
    } catch (error) {
      console.log(chalk.red(`❌ Status check failed: ${error.message}`));
      if (error.code === 'ECONNREFUSED') {
        console.log(chalk.yellow('💡 Make sure the EasyAI server is running'));
      }
    }
  });

// Kill port command
program
  .command('kill-port <port>')
  .description('Kill any process running on the specified port')
  .action(async (port) => {
    console.log(chalk.blue(`🧹 Killing processes on port ${port}...`));
    
    try {
      await killPort(port);
      console.log(chalk.green(`✅ Port ${port} cleared`));
    } catch (error) {
      console.log(chalk.red(`❌ Error clearing port ${port}: ${error.message}`));
    }
  });

program.parse();

// IDE Integration Functions
async function setupIDEIntegrations() {
  console.log(chalk.blue('🔍 Detecting installed IDEs...'));
  
  const detected = await detectInstalledIDEs();
  
  if (detected.length === 0) {
    console.log(chalk.yellow('❌ No supported IDEs found'));
    console.log(chalk.gray('Supported IDEs: Claude Code, Cursor, VS Code'));
    return;
  }
  
  console.log(chalk.green(`✅ Found ${detected.length} IDE${detected.length > 1 ? 's' : ''}:`));
  detected.forEach(ide => {
    console.log(chalk.gray(`   • ${ide}`));
  });
  
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'Integrate with all detected IDEs?',
      default: true
    }
  ]);
  
  if (!confirmed) {
    console.log(chalk.yellow('❌ Integration cancelled'));
    return;
  }
  
  console.log(chalk.blue('\n🔧 Setting up integrations...'));
  
  const results = {};
  
  for (const ide of detected) {
    try {
      console.log(chalk.blue(`\n🔧 Integrating with ${ide}...`));
      
      let result;
      switch (ide.toLowerCase()) {
        case 'claude-code':
          result = await setupClaudeCodeIntegration();
          break;
        case 'cursor':
          result = await setupCursorIntegration();
          break;
        case 'vscode':
          result = await setupVSCodeIntegration();
          break;
        default:
          throw new Error(`Unknown IDE: ${ide}`);
      }
      
      results[ide] = { status: 'success', ...result };
      console.log(chalk.green(`✅ ${ide} integration completed`));
      
    } catch (error) {
      results[ide] = { status: 'failed', error: error.message };
      console.log(chalk.red(`❌ ${ide} integration failed: ${error.message}`));
    }
  }
  
  console.log(chalk.blue('\n📊 Integration Summary:'));
  Object.entries(results).forEach(([ide, result]) => {
    if (result.status === 'success') {
      console.log(chalk.green(`✅ ${ide}`));
    } else {
      console.log(chalk.red(`❌ ${ide}: ${result.error}`));
    }
  });
  
  console.log(chalk.blue('\n🎉 Integration complete!'));
  console.log(chalk.gray('   • Restart your IDEs to apply changes'));
  console.log(chalk.gray('   • Check status with: easyai integrate status'));
  console.log(chalk.gray('   • View dashboard: easyai ui'));
}

async function detectInstalledIDEs() {
  const detected = [];
  const platform = os.platform();
  
  const detectionPaths = {
    darwin: {
      'claude-code': [
        '/Applications/Claude.app',
        path.join(os.homedir(), 'Library/Application Support/Claude')
      ],
      'cursor': [
        '/Applications/Cursor.app',
        path.join(os.homedir(), 'Library/Application Support/Cursor')
      ],
      'vscode': [
        '/Applications/Visual Studio Code.app',
        path.join(os.homedir(), 'Library/Application Support/Code')
      ]
    },
    win32: {
      'claude-code': [
        path.join(os.homedir(), 'AppData\\Roaming\\Claude'),
        path.join(os.homedir(), 'AppData\\Local\\Programs\\Claude')
      ],
      'cursor': [
        path.join(os.homedir(), 'AppData\\Roaming\\Cursor'),
        path.join(os.homedir(), 'AppData\\Local\\Programs\\Cursor')
      ],
      'vscode': [
        path.join(os.homedir(), 'AppData\\Roaming\\Code'),
        path.join(os.homedir(), 'AppData\\Local\\Programs\\Microsoft VS Code')
      ]
    },
    linux: {
      'claude-code': [
        path.join(os.homedir(), '.config/Claude'),
        '/opt/Claude'
      ],
      'cursor': [
        path.join(os.homedir(), '.config/Cursor'),
        '/opt/Cursor'
      ],
      'vscode': [
        path.join(os.homedir(), '.config/Code'),
        '/usr/share/code'
      ]
    }
  };
  
  const paths = detectionPaths[platform] || detectionPaths.linux;
  
  for (const [ide, checkPaths] of Object.entries(paths)) {
    for (const checkPath of checkPaths) {
      try {
        if (fs.existsSync(checkPath)) {
          detected.push(ide);
          break;
        }
      } catch (error) {
        // Ignore errors and continue
      }
    }
  }
  
  return [...new Set(detected)]; // Remove duplicates
}

async function setupClaudeCodeIntegration() {
  console.log(chalk.blue('🤖 Setting up Claude Code integration...'));
  
  const configPath = path.join(os.homedir(), 'Library/Application Support/Claude/claude_desktop_config.json');
  
  if (!fs.existsSync(path.dirname(configPath))) {
    throw new Error('Claude Code not found. Please install Claude Code first.');
  }
  
  // Read existing configuration
  let config = { mcpServers: {} };
  try {
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(configContent);
    }
  } catch (error) {
    console.log(chalk.yellow('⚠️  Creating new Claude configuration'));
    config = { mcpServers: {} };
  }
  
  // Add EasyAI integration
  config.anthropic = {
    base_url: "http://localhost:4000/api/proxy/anthropic",
    api_key_env_var: "EASYAI_API_KEY"
  };
  
  config.openai = {
    base_url: "http://localhost:4000/api/proxy/openai",
    api_key_env_var: "EASYAI_API_KEY"
  };
  
  config.easyai = {
    integrated: true,
    proxy_url: "http://localhost:4000/api/proxy",
    dashboard_url: "http://localhost:4000/dashboard",
    integration_date: new Date().toISOString()
  };
  
  // Backup original configuration
  const backupPath = `${configPath}.backup.${Date.now()}`;
  if (fs.existsSync(configPath)) {
    fs.copyFileSync(configPath, backupPath);
  }
  
  // Ensure directory exists
  if (!fs.existsSync(path.dirname(configPath))) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
  }
  
  // Write new configuration
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log(chalk.green('✅ Claude Code configuration updated'));
  console.log(chalk.blue(`📁 Configuration file: ${configPath}`));
  if (fs.existsSync(backupPath)) {
    console.log(chalk.gray(`💾 Backup saved: ${backupPath}`));
  }
  
  return {
    configPath,
    backupPath: fs.existsSync(backupPath) ? backupPath : null,
    message: 'Claude Code integration completed successfully'
  };
}

async function setupCursorIntegration() {
  console.log(chalk.blue('🖱️  Setting up Cursor integration...'));
  
  const configPath = path.join(os.homedir(), 'Library/Application Support/Cursor/User/settings.json');
  
  if (!fs.existsSync(path.dirname(configPath))) {
    throw new Error('Cursor not found. Please install Cursor first.');
  }
  
  // Read existing configuration
  let config = {};
  try {
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(configContent);
    }
  } catch (error) {
    console.log(chalk.yellow('⚠️  Creating new Cursor configuration'));
    config = {};
  }
  
  // Add EasyAI integration settings
  const easyaiSettings = {
    "cursor.chat.openaiApiKey": "${EASYAI_API_KEY}",
    "cursor.chat.anthropicApiKey": "${EASYAI_API_KEY}",
    "cursor.chat.openaiBaseUrl": "http://localhost:4000/api/proxy/openai/v1",
    "cursor.chat.anthropicBaseUrl": "http://localhost:4000/api/proxy/anthropic/v1",
    "cursor.easyai.integrated": true,
    "cursor.easyai.proxyUrl": "http://localhost:4000/api/proxy",
    "cursor.easyai.dashboardUrl": "http://localhost:4000/dashboard",
    "cursor.easyai.integrationDate": new Date().toISOString()
  };
  
  // Merge with existing settings
  Object.assign(config, easyaiSettings);
  
  // Backup original configuration
  const backupPath = `${configPath}.backup.${Date.now()}`;
  if (fs.existsSync(configPath)) {
    fs.copyFileSync(configPath, backupPath);
  }
  
  // Ensure directory exists
  if (!fs.existsSync(path.dirname(configPath))) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
  }
  
  // Write new configuration
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log(chalk.green('✅ Cursor configuration updated'));
  console.log(chalk.blue(`📁 Configuration file: ${configPath}`));
  if (fs.existsSync(backupPath)) {
    console.log(chalk.gray(`💾 Backup saved: ${backupPath}`));
  }
  
  return {
    configPath,
    backupPath: fs.existsSync(backupPath) ? backupPath : null,
    message: 'Cursor integration completed successfully'
  };
}

async function setupVSCodeIntegration() {
  console.log(chalk.blue('📝 Setting up VS Code integration...'));
  
  // This is a placeholder - VS Code integration would depend on specific extensions
  console.log(chalk.yellow('💡 VS Code integration depends on specific AI extensions'));
  console.log(chalk.gray('Common extensions that can be configured:'));
  console.log(chalk.gray('   • GitHub Copilot'));
  console.log(chalk.gray('   • Continue'));
  console.log(chalk.gray('   • Codeium'));
  
  const vscodeConfig = {
    "ai.proxy.enabled": true,
    "ai.proxy.url": "http://localhost:4000/api/proxy",
    "ai.api.key": "${EASYAI_API_KEY}"
  };
  
  console.log(chalk.blue('📝 Add these settings to your VS Code settings.json:'));
  console.log(chalk.gray(JSON.stringify(vscodeConfig, null, 2)));
  
  return {
    message: 'VS Code integration guidance provided'
  };
}

async function checkIntegrationStatus() {
  console.log(chalk.blue('🔧 Checking IDE integration status...'));
  
  const detectedIDEs = await detectInstalledIDEs();
  
  if (detectedIDEs.length === 0) {
    console.log(chalk.yellow('❌ No supported IDEs found'));
    return;
  }
  
  console.log(chalk.green(`\n📋 Detected IDEs (${detectedIDEs.length}):`));
  
  for (const ide of detectedIDEs) {
    console.log(chalk.blue(`\n🔍 Checking ${ide}...`));
    
    try {
      let configPath;
      let integrated = false;
      
      switch (ide.toLowerCase()) {
        case 'claude-code':
          configPath = path.join(os.homedir(), 'Library/Application Support/Claude/claude_desktop_config.json');
          if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            integrated = !!config.easyai?.integrated;
          }
          break;
        case 'cursor':
          configPath = path.join(os.homedir(), 'Library/Application Support/Cursor/User/settings.json');
          if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            integrated = !!config['cursor.easyai.integrated'];
          }
          break;
      }
      
      if (integrated) {
        console.log(chalk.green(`✅ ${ide} - Integrated`));
        console.log(chalk.gray(`   Config: ${configPath}`));
      } else {
        console.log(chalk.yellow(`⚠️  ${ide} - Not integrated`));
        console.log(chalk.gray(`   Run: easyai integrate ${ide.toLowerCase().replace('-', '-')}`));
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ ${ide} - Error: ${error.message}`));
    }
  }
  
  console.log(chalk.blue('\n🔗 Quick Actions:'));
  console.log(chalk.gray('   • Integrate all: easyai integrate auto'));
  console.log(chalk.gray('   • Remove all: easyai integrate remove'));
  console.log(chalk.gray('   • View dashboard: easyai ui'));
}

async function removeIntegrations() {
  console.log(chalk.blue('🗑️  Removing IDE integrations...'));
  
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'Are you sure you want to remove all IDE integrations?',
      default: false
    }
  ]);
  
  if (!confirmed) {
    console.log(chalk.yellow('❌ Removal cancelled'));
    return;
  }
  
  const detectedIDEs = await detectInstalledIDEs();
  
  for (const ide of detectedIDEs) {
    try {
      console.log(chalk.blue(`🗑️  Removing ${ide} integration...`));
      
      let configPath;
      let backupFound = false;
      
      switch (ide.toLowerCase()) {
        case 'claude-code':
          configPath = path.join(os.homedir(), 'Library/Application Support/Claude/claude_desktop_config.json');
          break;
        case 'cursor':
          configPath = path.join(os.homedir(), 'Library/Application Support/Cursor/User/settings.json');
          break;
        default:
          continue;
      }
      
      if (fs.existsSync(configPath)) {
        // Look for backup files
        const backupPattern = `${configPath}.backup.`;
        const dir = path.dirname(configPath);
        const files = fs.readdirSync(dir);
        const backupFiles = files.filter(f => f.startsWith(path.basename(configPath) + '.backup.'));
        
        if (backupFiles.length > 0) {
          const latestBackup = backupFiles.sort().reverse()[0];
          const backupPath = path.join(dir, latestBackup);
          
          fs.copyFileSync(backupPath, configPath);
          console.log(chalk.green(`✅ ${ide} - Restored from backup`));
          backupFound = true;
        } else {
          // Remove EasyAI specific settings manually
          if (ide.toLowerCase() === 'claude-code') {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            delete config.anthropic;
            delete config.openai;
            delete config.easyai;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
          } else if (ide.toLowerCase() === 'cursor') {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            delete config['cursor.chat.openaiApiKey'];
            delete config['cursor.chat.anthropicApiKey'];
            delete config['cursor.chat.openaiBaseUrl'];
            delete config['cursor.chat.anthropicBaseUrl'];
            delete config['cursor.easyai.integrated'];
            delete config['cursor.easyai.proxyUrl'];
            delete config['cursor.easyai.dashboardUrl'];
            delete config['cursor.easyai.integrationDate'];
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
          }
          console.log(chalk.green(`✅ ${ide} - Removed EasyAI settings`));
        }
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ ${ide} - Error: ${error.message}`));
    }
  }
  
  console.log(chalk.green('\n✅ Integration removal complete'));
  console.log(chalk.gray('   • Restart your IDEs to apply changes'));
  console.log(chalk.gray('   • Re-integrate with: easyai integrate auto'));
}

// Helper function to kill processes on a specific port
async function killPort(port) {
  const { spawn } = require('child_process');
  
  return new Promise((resolve) => {
    try {
      if (process.platform === 'win32') {
        // Windows
        const netstat = spawn('netstat', ['-ano']);
        const findstr = spawn('findstr', [`:${port}`]);
        
        netstat.stdout.pipe(findstr.stdin);
        
        let output = '';
        findstr.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        findstr.on('close', () => {
          try {
            const lines = output.split('\n');
            const pids = [];
            
            lines.forEach(line => {
              const parts = line.trim().split(/\s+/);
              if (parts.length > 4) {
                const pid = parts[parts.length - 1];
                if (pid && !isNaN(pid) && pid !== process.pid.toString()) {
                  pids.push(pid);
                }
              }
            });
            
            // Kill all PIDs except current process
            pids.forEach(pid => {
              try {
                spawn('taskkill', ['/PID', pid, '/F'], { detached: true });
              } catch (error) {
                // Ignore errors
              }
            });
          } catch (error) {
            // Ignore errors
          }
          
          resolve();
        });
        
        findstr.on('error', () => resolve());
        netstat.on('error', () => resolve());
      } else {
        // macOS/Linux
        const lsof = spawn('lsof', ['-ti', `:${port}`]);
        
        let pids = '';
        lsof.stdout.on('data', (data) => {
          pids += data.toString();
        });
        
        lsof.on('close', () => {
          try {
            if (pids.trim()) {
              const pidArray = pids.trim().split('\n');
              pidArray.forEach(pid => {
                if (pid.trim() && pid.trim() !== process.pid.toString()) {
                  try {
                    spawn('kill', ['-9', pid.trim()], { detached: true });
                  } catch (error) {
                    // Ignore errors
                  }
                }
              });
            }
          } catch (error) {
            // Ignore errors
          }
          
          resolve();
        });
        
        lsof.on('error', () => {
          resolve(); // Port might not be in use
        });
      }
    } catch (error) {
      // If anything fails, just resolve
      resolve();
    }
  });
}

// Helper function to initialize local easyai workspace
async function initializeWorkspace() {
  const fs = require('fs');
  const workspaceDir = process.cwd(); // Use current directory as workspace
  
  console.log(chalk.blue('📁 Initializing EasyAI workspace...'));
  console.log(chalk.gray(`📂 Workspace location: ${workspaceDir}`));
  
  // No need to create main directory - use current directory
  
  // Create subdirectories
  const subdirs = ['prompts', 'data', 'config', 'logs'];
  for (const subdir of subdirs) {
    const dirPath = path.join(workspaceDir, subdir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(chalk.gray(`   • Created ${subdir}/ directory`));
    }
  }
  
  // Create easyai.env file with API key
  const envPath = path.join(workspaceDir, 'easyai.env');
  const apiKey = getApiKey();
  
  if (!fs.existsSync(envPath) && apiKey) {
    const envContent = `# EasyAI Configuration
EASYAI_API_KEY=${apiKey}
PORT=4000

# Add your API keys here
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
DEEPSEEK_API_KEY=

# Server Configuration
NODE_ENV=development
DB_PATH=./data/easyai.db
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log(chalk.green('✅ Created easyai.env file with API configuration'));
  }
  
  // Create initial prompts structure and copy template prompts
  const promptsIndexPath = path.join(workspaceDir, 'prompts', 'index.json');
  const shouldCreateTemplates = !fs.existsSync(promptsIndexPath);
  
  if (shouldCreateTemplates) {
    // Copy template prompts from the CLI package
    try {
      const packagePath = path.dirname(__dirname);
      const templatesPath = path.join(packagePath, 'templates', 'prompts');
      const promptsDir = path.join(workspaceDir, 'prompts');
      
      console.log(chalk.blue('📋 Installing template prompts...'));
      
      if (fs.existsSync(templatesPath)) {
        const templateFiles = fs.readdirSync(templatesPath);
        const templatePrompts = [];
        
        for (const file of templateFiles) {
          if (file.endsWith('.json')) {
            try {
              const templatePath = path.join(templatesPath, file);
              const destinationPath = path.join(promptsDir, file);
              
              // Read and copy template
              const templateContent = fs.readFileSync(templatePath, 'utf8');
              fs.writeFileSync(destinationPath, templateContent);
              
              // Add to prompts array for index
              const promptData = JSON.parse(templateContent);
              templatePrompts.push(promptData);
              
              console.log(chalk.gray(`   • Added template: ${promptData.name}`));
            } catch (error) {
              console.log(chalk.yellow(`   ⚠️  Warning: Could not copy template ${file}`));
            }
          }
        }
        
        // Create index with template prompts
        const promptsIndex = {
          version: "1.0.0",
          prompts: templatePrompts,
          categories: [...new Set(templatePrompts.map(p => p.category).filter(Boolean))],
          lastSync: new Date().toISOString()
        };
        
        fs.writeFileSync(promptsIndexPath, JSON.stringify(promptsIndex, null, 2));
        console.log(chalk.green(`✅ Created prompts index with ${templatePrompts.length} templates`));
        
      } else {
        // Fallback: create basic index if templates not found
        const promptsIndex = {
          version: "1.0.0",
          prompts: [],
          categories: ["general", "development", "communication", "analysis", "creativity"],
          lastSync: new Date().toISOString()
        };
        
        fs.writeFileSync(promptsIndexPath, JSON.stringify(promptsIndex, null, 2));
        console.log(chalk.gray('   • Created basic prompts index (templates not found)'));
      }
      
    } catch (error) {
      console.log(chalk.yellow('   ⚠️  Warning: Could not install template prompts, creating basic index'));
      
      // Fallback: create basic index
      const promptsIndex = {
        version: "1.0.0",
        prompts: [],
        categories: ["general", "development", "communication", "analysis", "creativity"],
        lastSync: new Date().toISOString()
      };
      
      fs.writeFileSync(promptsIndexPath, JSON.stringify(promptsIndex, null, 2));
      console.log(chalk.gray('   • Created basic prompts index'));
    }
  }
  
  // Create config file
  const configPath = path.join(workspaceDir, 'config', 'settings.json');
  if (!fs.existsSync(configPath)) {
    const config = {
      version: "1.4.8",
      workspace: workspaceDir,
      server: {
        port: 4000,
        autoStart: true
      },
      ui: {
        theme: "light",
        autoSync: true
      },
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.gray('   • Created settings configuration'));
  }
  
  console.log(chalk.green(`✅ Workspace ready at: ${workspaceDir}`));
  return workspaceDir;
}

// Helper function to start the server
async function startServer(port = 4000, workspaceDir = null) {
  const { spawn } = require('child_process');
  const fs = require('fs');
  
  console.log(chalk.blue(`🧹 Cleaning port ${port}...`));
  
  // Kill any existing processes on the port before starting
  try {
    await killPort(port);
    console.log(chalk.green(`✅ Port ${port} cleaned`));
  } catch (error) {
    console.log(chalk.yellow(`⚠️  Warning: Could not clean port ${port}: ${error.message}`));
  }
  
  // Wait a moment for cleanup to complete
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(chalk.blue('🚀 Starting EasyAI server...'));
  
  return new Promise((resolve, reject) => {
    try {
      // When installed globally, we need to use the package directory for server files
      const packagePath = path.dirname(__dirname);
      const serverPath = path.join(packagePath, 'src', 'server.js');
      
      // But use workspace directory as working directory for .env and data
      const cwd = workspaceDir || packagePath;
      
      console.log(chalk.gray(`📁 Package path: ${packagePath}`));
      console.log(chalk.gray(`🔍 Server path: ${serverPath}`));
      console.log(chalk.gray(`💼 Working directory: ${cwd}`));
      console.log(chalk.blue('🎬 Starting server process with workspace path...' ));
      
      // Check if server file exists
      if (!fs.existsSync(serverPath)) {
        reject(new Error(`Server file not found at ${serverPath}`));
        return;
      }
      
      // Start server with workspace as working directory
      const serverProcess = spawn('node', [serverPath], {
        cwd: cwd,
        detached: false, // Don't run in background for debugging
        stdio: 'inherit', // Show server output for debugging
        env: { 
          ...process.env, 
          PORT: port,
          EASYAI_WORKSPACE_PATH: cwd, // Explicitly pass workspace path
          NODE_ENV: 'development' // Enable development logging
        }
      });
      
      serverProcess.unref();
      
      // Give the server time to start
      setTimeout(() => {
        resolve(serverProcess);
      }, 3000);
      
      serverProcess.on('error', (error) => {
        reject(error);
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

// Helper function to open browser
async function openBrowser(url) {
  const { spawn } = require('child_process');
  
  try {
    let command;
    let args;
    
    if (process.platform === 'darwin') {
      command = 'open';
      args = [url];
    } else if (process.platform === 'win32') {
      command = 'start';
      args = ['', url];
    } else {
      command = 'xdg-open';
      args = [url];
    }
    
    const browserProcess = spawn(command, args, {
      detached: true,
      stdio: 'ignore'
    });
    
    browserProcess.unref();
    console.log(chalk.green('🌐 Browser opened'));
    
  } catch (error) {
    console.log(chalk.yellow(`⚠️  Could not open browser automatically`));
    console.log(chalk.yellow(`   Please open: ${url}`));
  }
}