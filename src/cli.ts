#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initializeProject } from './commands/init';
import { startUI } from './commands/ui';
import { runPrompt } from './commands/prompt';
import { showLogs } from './commands/logs';
import { manageConfig } from './commands/config';
import { manageModels } from './commands/models';
import { managePrompts } from './commands/prompts';
import { runPlayground } from './commands/playground';
import { showAnalytics } from './commands/analytics';
import { exportData } from './commands/export';
import { startInteractiveMode } from './commands/interactive';

// Read version from package.json
const packageJson = require('../package.json');

const program = new Command();

program
  .name('easyai')
  .description('AI development tool with CLI and dashboard')
  .version(packageJson.version);

program
  .command('init')
  .description('Initialize EasyAI in current project')
  .option('-u, --user-id <id>', 'User ID from registration')
  .option('-k, --key <apiKey>', 'API key (OpenAI or Anthropic)')
  .option('--ui', 'Open dashboard automatically after initialization')
  .action(async (options) => {
    try {
      await initializeProject(options.userId, options.key);
      console.log(chalk.green('✅ EasyAI initialized successfully!'));
      
      // If --ui flag is provided, start the UI automatically
      if (options.ui) {
        console.log(chalk.blue('🚀 Starting dashboard...'));
        await startUI();
      }
    } catch (error) {
      console.error(chalk.red('❌ Initialization failed:'), error);
      process.exit(1);
    }
  });

program
  .command('ui')
  .description('Open EasyAI dashboard')
  .option('-p, --port <port>', 'Port for dashboard', '7542')
  .action(async (options) => {
    try {
      await startUI(parseInt(options.port));
    } catch (error) {
      console.error(chalk.red('❌ Failed to start UI:'), error);
      process.exit(1);
    }
  });

program
  .command('prompt <name>')
  .description('Run a prompt')
  .option('-m, --model <model>', 'AI model to use')
  .option('-i, --input <input>', 'Input text or file path')
  .action(async (name, options) => {
    try {
      await runPrompt(name, options);
    } catch (error) {
      console.error(chalk.red('❌ Prompt execution failed:'), error);
      process.exit(1);
    }
  });

program
  .command('logs')
  .description('View recent API call logs')
  .option('-n, --number <count>', 'Number of logs to show', '10')
  .option('-f, --filter <filter>', 'Filter logs by model or status')
  .action(async (options) => {
    try {
      await showLogs(options);
    } catch (error) {
      console.error(chalk.red('❌ Failed to show logs:'), error);
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Manage configuration')
  .option('-s, --set <key=value>', 'Set configuration value')
  .option('-g, --get <key>', 'Get configuration value')
  .option('-l, --list', 'List all configuration')
  .action(async (options) => {
    try {
      await manageConfig(options);
    } catch (error) {
      console.error(chalk.red('❌ Configuration failed:'), error);
      process.exit(1);
    }
  });

program
  .command('models')
  .description('Browse and manage AI models')
  .option('-p, --provider <provider>', 'Filter by provider (openai, anthropic, openrouter)')
  .option('-s, --search <term>', 'Search models by name or ID')
  .option('-d, --detailed', 'Show detailed model information')
  .option('-t, --test', 'Test connectivity to all providers')
  .action(async (options) => {
    try {
      await manageModels(options);
    } catch (error) {
      console.error(chalk.red('❌ Models command failed:'), error);
      process.exit(1);
    }
  });

program
  .command('prompts')
  .description('Manage AI prompts')
  .option('-l, --list', 'List all prompts')
  .option('-c, --create', 'Create a new prompt interactively')
  .option('-e, --edit <name>', 'Edit an existing prompt')
  .option('-d, --delete <name>', 'Delete a prompt')
  .option('--category <category>', 'Filter by category')
  .option('-s, --search <term>', 'Search prompts by name or content')
  .action(async (options) => {
    try {
      await managePrompts(options);
    } catch (error) {
      console.error(chalk.red('❌ Prompts command failed:'), error);
      process.exit(1);
    }
  });

program
  .command('playground')
  .description('Test prompts against multiple AI models')
  .option('-p, --prompt <text>', 'Prompt to test')
  .option('-m, --models <models>', 'Comma-separated list of model names/IDs')
  .option('-f, --file <path>', 'Read prompt from file')
  .option('-t, --temperature <temp>', 'Temperature setting (0.0-1.0)', '0.7')
  .option('--max-tokens <tokens>', 'Maximum tokens to generate', '1000')
  .option('-c, --compare', 'Display results side-by-side for comparison')
  .action(async (options) => {
    try {
      await runPlayground(options);
    } catch (error) {
      console.error(chalk.red('❌ Playground command failed:'), error);
      process.exit(1);
    }
  });

program
  .command('analytics')
  .description('View API usage analytics and statistics')
  .option('--period <period>', 'Time period (today, week, month, year, or number of days)')
  .option('--provider <provider>', 'Filter by provider (openai, anthropic, openrouter)')
  .option('--model <model>', 'Filter by model name or ID')
  .option('--export <format>', 'Export analytics (json, csv)')
  .option('-d, --detailed', 'Show detailed analytics with hourly distribution')
  .action(async (options) => {
    try {
      await showAnalytics(options);
    } catch (error) {
      console.error(chalk.red('❌ Analytics command failed:'), error);
      process.exit(1);
    }
  });

program
  .command('export')
  .description('Export data (logs, prompts, config)')
  .option('-t, --type <type>', 'Data type to export (logs, prompts, config)', 'logs')
  .option('-f, --format <format>', 'Export format (json, csv, jsonl)', 'json')
  .option('--filter <term>', 'Filter data to export')
  .option('--period <period>', 'Time period for logs (today, week, month, year)')
  .option('-o, --output <path>', 'Output file path')
  .action(async (options) => {
    try {
      await exportData(options);
    } catch (error) {
      console.error(chalk.red('❌ Export command failed:'), error);
      process.exit(1);
    }
  });

// Check if no command was provided (only "easyai" was run)
if (process.argv.length <= 2) {
  startInteractiveMode().catch(error => {
    console.error(chalk.red('❌ Interactive mode failed:'), error);
    process.exit(1);
  });
} else {
  program.parse(process.argv);
}