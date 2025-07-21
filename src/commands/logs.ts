import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { checkEasyAIExists } from '../utils/helpers';

interface LogOptions {
  number?: string;
  filter?: string;
}

export async function showLogs(options: LogOptions): Promise<void> {
  const projectDir = process.cwd();
  
  if (!await checkEasyAIExists(projectDir)) {
    throw new Error('EasyAI not initialized. Run "easyai init" first.');
  }

  const logPath = path.join(projectDir, 'easyai', 'logs', 'calls.jsonl');
  
  if (!await fs.pathExists(logPath)) {
    console.log(chalk.yellow('📝 No logs found'));
    return;
  }

  const logContent = await fs.readFile(logPath, 'utf-8');
  const lines = logContent.trim().split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    console.log(chalk.yellow('📝 No API calls logged yet'));
    return;
  }

  let logs = lines.map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);

  // Apply filters
  if (options.filter) {
    logs = logs.filter(log => 
      log.model?.includes(options.filter) || 
      log.prompt?.includes(options.filter) ||
      (log.success === false && options.filter === 'error')
    );
  }

  // Limit number of logs
  const count = parseInt(options.number || '10');
  logs = logs.slice(-count).reverse();

  console.log(chalk.blue(`📋 Recent API Calls (${logs.length} entries)`));
  console.log('─'.repeat(80));

  logs.forEach((log, index) => {
    const status = log.success ? chalk.green('✅') : chalk.red('❌');
    const timestamp = new Date(log.timestamp).toLocaleString();
    const model = chalk.cyan(log.model || 'unknown');
    const prompt = chalk.yellow(log.prompt || 'unknown');
    
    console.log(`${status} ${timestamp} | ${model} | ${prompt}`);
    
    if (log.tokens) {
      console.log(chalk.gray(`   Tokens: ${log.tokens} | Duration: ${log.duration}ms`));
    }
    
    if (log.error) {
      console.log(chalk.red(`   Error: ${log.error}`));
    }
    
    if (index < logs.length - 1) {
      console.log('');
    }
  });
  
  console.log('─'.repeat(80));
}