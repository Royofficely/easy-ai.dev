import chalk from 'chalk';
import { createInterface } from 'readline';
import { checkEasyAIExists, loadEnv } from '../utils/helpers';
import { manageModels } from './models';
import { managePrompts } from './prompts';
import { runPlayground } from './playground';
import { showAnalytics } from './analytics';
import { exportData } from './export';
import { showLogs } from './logs';
import { manageConfig } from './config';
import { startUI } from './ui';

interface Command {
  name: string;
  description: string;
  aliases: string[];
  handler: (args: string[]) => Promise<void>;
}

export async function startInteractiveMode(): Promise<void> {
  const projectDir = process.cwd();
  
  // Check if EasyAI is initialized
  const isInitialized = await checkEasyAIExists(projectDir);
  
  console.log(chalk.blue.bold('🤖 EasyAI Interactive Terminal'));
  console.log('═'.repeat(60));
  
  if (!isInitialized) {
    console.log(chalk.yellow('⚠️  EasyAI not initialized in this project.'));
    console.log(chalk.gray('   Run "init" to set up EasyAI here.'));
  } else {
    console.log(chalk.green('✅ EasyAI initialized'));
    
    // Show quick status
    try {
      const env = await loadEnv(projectDir);
      const providers = [];
      if (env.OPENAI_API_KEY && env.OPENAI_API_KEY !== 'your_openai_api_key_here') providers.push('OpenAI');
      if (env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') providers.push('Anthropic');
      if (env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here') providers.push('OpenRouter');
      
      if (providers.length > 0) {
        console.log(chalk.gray(`   Configured providers: ${providers.join(', ')}`));
      } else {
        console.log(chalk.yellow('   No API keys configured'));
      }
    } catch (error) {
      // Ignore error
    }
  }
  
  console.log(chalk.gray('\nType "help" for commands, "exit" to quit'));
  console.log('─'.repeat(60));

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.cyan('easyai> ')
  });

  const commands = createCommands(projectDir, rl);

  rl.prompt();

  rl.on('line', async (input) => {
    const trimmed = input.trim();
    
    if (!trimmed) {
      rl.prompt();
      return;
    }

    const [commandName, ...args] = trimmed.split(' ');
    const command = findCommand(commands, commandName);

    if (command) {
      try {
        await command.handler(args);
      } catch (error: any) {
        console.log(chalk.red(`❌ Error: ${error.message}`));
      }
    } else if (commandName === 'exit' || commandName === 'quit') {
      console.log(chalk.blue('👋 Goodbye!'));
      rl.close();
      return;
    } else if (commandName === 'clear' || commandName === 'cls') {
      console.clear();
      console.log(chalk.blue.bold('🤖 EasyAI Interactive Terminal'));
      console.log('═'.repeat(60));
    } else {
      console.log(chalk.red(`❌ Unknown command: ${commandName}`));
      console.log(chalk.gray('   Type "help" to see available commands'));
    }

    console.log(); // Empty line for spacing
    rl.prompt();
  });

  rl.on('close', () => {
    console.log(chalk.blue('\n👋 Goodbye!'));
    process.exit(0);
  });

  // Handle Ctrl+C
  rl.on('SIGINT', () => {
    console.log(chalk.yellow('\n\nUse "exit" or "quit" to leave the interactive terminal'));
    rl.prompt();
  });
}

function createCommands(projectDir: string, rl: any): Command[] {
  return [
    {
      name: 'help',
      description: 'Show available commands',
      aliases: ['h', '?'],
      handler: async (args) => {
        if (args.length > 0) {
          showCommandHelp(args[0]);
        } else {
          showAllCommands();
        }
      }
    },
    {
      name: 'init',
      description: 'Initialize EasyAI in current project',
      aliases: [],
      handler: async (args) => {
        const { initializeProject } = await import('./init');
        await initializeProject(args[0]);
        console.log(chalk.green('✅ EasyAI initialized successfully!'));
      }
    },
    {
      name: 'ui',
      description: 'Launch dashboard UI',
      aliases: ['dashboard', 'web'],
      handler: async (args) => {
        const port = args[0] ? parseInt(args[0]) : 3000;
        await startUI(port);
      }
    },
    {
      name: 'models',
      description: 'Browse and manage AI models',
      aliases: ['m'],
      handler: async (args) => {
        const options: any = { list: true };
        
        // Parse simple arguments
        for (let i = 0; i < args.length; i++) {
          const arg = args[i];
          if (arg === '--provider' || arg === '-p') {
            options.provider = args[i + 1];
            i++;
          } else if (arg === '--search' || arg === '-s') {
            options.search = args[i + 1];
            i++;
          } else if (arg === '--detailed' || arg === '-d') {
            options.detailed = true;
          } else if (arg === '--test' || arg === '-t') {
            options.test = true;
          }
        }
        
        await manageModels(options);
      }
    },
    {
      name: 'prompts',
      description: 'Manage AI prompts',
      aliases: ['p'],
      handler: async (args) => {
        const options: any = {};
        
        if (args.length === 0) {
          options.list = true;
        } else {
          const command = args[0];
          switch (command) {
            case 'list':
            case 'ls':
              options.list = true;
              break;
            case 'create':
            case 'new':
              options.create = true;
              break;
            case 'edit':
              options.edit = args[1];
              break;
            case 'delete':
            case 'del':
            case 'rm':
              options.delete = args[1];
              break;
            default:
              // Try to run the prompt
              const { runPrompt } = await import('./prompt');
              await runPrompt(command, { model: args[1], input: args.slice(2).join(' ') });
              return;
          }
        }
        
        await managePrompts(options);
      }
    },
    {
      name: 'playground',
      description: 'Test prompts against multiple models',
      aliases: ['play', 'test'],
      handler: async (args) => {
        console.log(chalk.blue('🎮 Starting interactive playground...'));
        await runPlayground({});
      }
    },
    {
      name: 'analytics',
      description: 'View usage analytics',
      aliases: ['stats', 'a'],
      handler: async (args) => {
        const options: any = {};
        
        // Parse arguments
        for (let i = 0; i < args.length; i++) {
          const arg = args[i];
          if (arg === '--period') {
            options.period = args[i + 1];
            i++;
          } else if (arg === '--detailed' || arg === '-d') {
            options.detailed = true;
          }
        }
        
        await showAnalytics(options);
      }
    },
    {
      name: 'logs',
      description: 'View recent API call logs',
      aliases: ['l'],
      handler: async (args) => {
        const options: any = {};
        
        if (args[0] && !args[0].startsWith('-')) {
          options.number = args[0];
        }
        
        await showLogs(options);
      }
    },
    {
      name: 'export',
      description: 'Export data (logs, prompts, config)',
      aliases: ['exp'],
      handler: async (args) => {
        const options: any = { type: 'logs', format: 'json' };
        
        if (args[0]) {
          options.type = args[0];
        }
        if (args[1]) {
          options.format = args[1];
        }
        
        await exportData(options);
      }
    },
    {
      name: 'config',
      description: 'Manage configuration',
      aliases: ['cfg', 'settings'],
      handler: async (args) => {
        const options: any = {};
        
        if (args.length === 0) {
          options.list = true;
        } else if (args[0] === 'get') {
          options.get = args[1];
        } else if (args[0] === 'set' && args[1]) {
          options.set = args.slice(1).join(' ');
        } else {
          options.list = true;
        }
        
        await manageConfig(options);
      }
    },
    {
      name: 'chat',
      description: 'Start a chat session with AI',
      aliases: ['c'],
      handler: async (args) => {
        await startChatMode(rl, projectDir);
      }
    },
    {
      name: 'status',
      description: 'Show current project status',
      aliases: ['info'],
      handler: async (args) => {
        await showStatus(projectDir);
      }
    }
  ];
}

function findCommand(commands: Command[], name: string): Command | undefined {
  return commands.find(cmd => 
    cmd.name === name || cmd.aliases.includes(name)
  );
}

function showAllCommands(): void {
  console.log(chalk.blue.bold('\n📚 Available Commands:'));
  console.log('─'.repeat(50));
  
  const commandGroups = [
    {
      title: 'Core Commands',
      commands: ['init', 'ui', 'config', 'status']
    },
    {
      title: 'AI Operations',
      commands: ['models', 'prompts', 'playground', 'chat']
    },
    {
      title: 'Data & Analytics',
      commands: ['logs', 'analytics', 'export']
    },
    {
      title: 'Terminal',
      commands: ['help', 'clear', 'exit']
    }
  ];

  commandGroups.forEach(group => {
    console.log(chalk.cyan.bold(`\n${group.title}:`));
    group.commands.forEach(cmdName => {
      const cmd = findCommand(createCommands('', null as any), cmdName);
      if (cmd) {
        const aliases = cmd.aliases.length > 0 ? ` (${cmd.aliases.join(', ')})` : '';
        console.log(`  ${chalk.green(cmd.name.padEnd(12))}${aliases} - ${cmd.description}`);
      }
    });
  });

  console.log(chalk.gray('\nExamples:'));
  console.log(chalk.gray('  models --provider openai'));
  console.log(chalk.gray('  prompts create'));
  console.log(chalk.gray('  playground'));
  console.log(chalk.gray('  analytics --period week'));
  console.log(chalk.gray('  help <command> - Get help for specific command'));
}

function showCommandHelp(command: string): void {
  const helpText: Record<string, string> = {
    models: `
${chalk.blue.bold('models')} - Browse and manage AI models

Usage:
  models                    List all available models
  models --provider openai  Filter by provider
  models --search gpt       Search for models
  models --detailed         Show detailed information
  models --test             Test connectivity

Aliases: m`,
    
    prompts: `
${chalk.blue.bold('prompts')} - Manage AI prompts

Usage:
  prompts                   List all prompts
  prompts create            Create new prompt interactively
  prompts edit <name>       Edit existing prompt
  prompts delete <name>     Delete a prompt
  prompts <name>            Run a prompt

Aliases: p`,

    playground: `
${chalk.blue.bold('playground')} - Test prompts against multiple models

Usage:
  playground                Start interactive playground
  
The playground allows you to test prompts against multiple AI models
simultaneously and compare their responses side-by-side.

Aliases: play, test`,

    chat: `
${chalk.blue.bold('chat')} - Start a chat session with AI

Usage:
  chat                      Start interactive chat
  
This opens a conversational interface where you can chat directly
with your configured AI models.

Aliases: c`
  };

  if (helpText[command]) {
    console.log(helpText[command]);
  } else {
    console.log(chalk.yellow(`No detailed help available for: ${command}`));
    console.log(chalk.gray('Use "help" to see all available commands'));
  }
}

async function startChatMode(rl: any, projectDir: string): Promise<void> {
  console.log(chalk.blue('💬 Chat Mode - Type your messages, "exit" to return'));
  console.log('─'.repeat(50));
  
  const env = await loadEnv(projectDir);
  
  // Simple chat implementation - you can enhance this
  const chatRl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.green('You> ')
  });
  
  chatRl.prompt();
  
  chatRl.on('line', async (input) => {
    const trimmed = input.trim();
    
    if (trimmed === 'exit') {
      chatRl.close();
      console.log(chalk.blue('Returned to main terminal'));
      return;
    }
    
    if (trimmed) {
      console.log(chalk.yellow('AI> ') + 'Chat functionality coming soon! This will integrate with your configured AI models.');
    }
    
    chatRl.prompt();
  });
  
  return new Promise((resolve) => {
    chatRl.on('close', resolve);
  });
}

async function showStatus(projectDir: string): Promise<void> {
  console.log(chalk.blue.bold('📊 Project Status'));
  console.log('─'.repeat(40));
  
  try {
    const isInitialized = await checkEasyAIExists(projectDir);
    
    if (!isInitialized) {
      console.log(chalk.red('❌ EasyAI not initialized'));
      console.log(chalk.gray('   Run "init" to set up EasyAI'));
      return;
    }
    
    console.log(chalk.green('✅ EasyAI initialized'));
    
    const env = await loadEnv(projectDir);
    
    // Check API keys
    const apiKeys = [
      { name: 'OpenAI', key: env.OPENAI_API_KEY },
      { name: 'Anthropic', key: env.ANTHROPIC_API_KEY },
      { name: 'OpenRouter', key: env.OPENROUTER_API_KEY }
    ];
    
    console.log(chalk.cyan('\n🔑 API Keys:'));
    apiKeys.forEach(({ name, key }) => {
      const status = key && key !== `your_${name.toLowerCase()}_api_key_here` 
        ? chalk.green('✅ Configured') 
        : chalk.yellow('⚠️  Not set');
      console.log(`  ${name.padEnd(12)} ${status}`);
    });
    
    // Check for prompts
    try {
      const fs = await import('fs-extra');
      const path = await import('path');
      const promptsDir = path.join(projectDir, 'easyai', 'prompts');
      
      if (await fs.pathExists(promptsDir)) {
        const categories = await fs.readdir(promptsDir);
        let totalPrompts = 0;
        
        for (const category of categories) {
          const categoryPath = path.join(promptsDir, category);
          const stat = await fs.stat(categoryPath);
          if (stat.isDirectory()) {
            const files = await fs.readdir(categoryPath);
            totalPrompts += files.filter(f => f.endsWith('.md')).length;
          }
        }
        
        console.log(chalk.cyan(`\n📝 Prompts: ${totalPrompts} total`));
      }
    } catch (error) {
      // Ignore
    }
    
    // Check logs
    try {
      const fs = await import('fs-extra');
      const path = await import('path');
      const logPath = path.join(projectDir, 'easyai', 'logs', 'calls.jsonl');
      
      if (await fs.pathExists(logPath)) {
        const content = await fs.readFile(logPath, 'utf-8');
        const lines = content.trim().split('\n').filter(l => l.trim());
        console.log(chalk.cyan(`📊 API Calls: ${lines.length} logged`));
      }
    } catch (error) {
      // Ignore
    }
    
  } catch (error: any) {
    console.log(chalk.red(`❌ Error checking status: ${error.message}`));
  }
}