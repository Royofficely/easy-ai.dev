import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { checkEasyAIExists, loadConfig, saveConfig, loadEnv } from '../utils/helpers';

interface ConfigOptions {
  set?: string;
  get?: string;
  list?: boolean;
}

export async function manageConfig(options: ConfigOptions): Promise<void> {
  const projectDir = process.cwd();
  
  if (!await checkEasyAIExists(projectDir)) {
    throw new Error('EasyAI not initialized. Run "easyai init" first.');
  }

  if (options.list) {
    await listConfiguration(projectDir);
  } else if (options.get) {
    await getConfiguration(projectDir, options.get);
  } else if (options.set) {
    await setConfiguration(projectDir, options.set);
  } else {
    console.log(chalk.yellow('Please specify an action: --list, --get <key>, or --set <key=value>'));
  }
}

async function listConfiguration(projectDir: string): Promise<void> {
  try {
    const config = await loadConfig(projectDir);
    const env = await loadEnv(projectDir);
    
    console.log(chalk.blue('⚙️  EasyAI Configuration'));
    console.log('─'.repeat(50));
    
    console.log(chalk.green('\n📱 UI Settings:'));
    console.log(`  Theme: ${config.ui?.theme || 'dark'}`);
    console.log(`  Default Model: ${config.ui?.defaultModel || 'gpt-4'}`);
    console.log(`  Auto Save: ${config.ui?.autoSave || true}`);
    
    console.log(chalk.green('\n📊 Logging Settings:'));
    console.log(`  Enabled: ${config.logging?.enabled || true}`);
    console.log(`  Include Responses: ${config.logging?.includeResponses || true}`);
    console.log(`  Retention: ${config.logging?.retention || '30d'}`);
    
    console.log(chalk.green('\n🔑 API Configuration:'));
    console.log(`  OpenAI Model: ${env.OPENAI_MODEL || 'not set'}`);
    console.log(`  OpenAI Key: ${env.OPENAI_API_KEY ? '***configured***' : 'not set'}`);
    console.log(`  Anthropic Model: ${env.ANTHROPIC_MODEL || 'not set'}`);
    console.log(`  Anthropic Key: ${env.ANTHROPIC_API_KEY ? '***configured***' : 'not set'}`);
    
    console.log('─'.repeat(50));
    
  } catch (error: any) {
    throw new Error(`Failed to load configuration: ${error.message}`);
  }
}

async function getConfiguration(projectDir: string, key: string): Promise<void> {
  try {
    const config = await loadConfig(projectDir);
    const env = await loadEnv(projectDir);
    
    // Check if it's an env variable
    if (env[key]) {
      console.log(key.includes('KEY') ? '***configured***' : env[key]);
      return;
    }
    
    // Navigate nested config object
    const value = getNestedValue(config, key);
    if (value !== undefined) {
      console.log(value);
    } else {
      console.log(chalk.red(`Configuration key "${key}" not found`));
    }
    
  } catch (error: any) {
    throw new Error(`Failed to get configuration: ${error.message}`);
  }
}

async function setConfiguration(projectDir: string, keyValue: string): Promise<void> {
  const [key, ...valueParts] = keyValue.split('=');
  const value = valueParts.join('=');
  
  if (!key || !value) {
    throw new Error('Invalid format. Use: key=value');
  }
  
  try {
    // Check if it's an environment variable
    const envPath = path.join(projectDir, 'easyai', 'config', 'easyai.env');
    const envContent = await fs.readFile(envPath, 'utf-8');
    
    if (envContent.includes(`${key}=`)) {
      // Update env file
      const updatedEnv = envContent.replace(
        new RegExp(`${key}=.*`),
        `${key}=${value}`
      );
      await fs.writeFile(envPath, updatedEnv);
      console.log(chalk.green(`✅ Updated ${key} in environment configuration`));
      return;
    }
    
    // Update JSON config
    const config = await loadConfig(projectDir);
    setNestedValue(config, key, value);
    await saveConfig(projectDir, config);
    console.log(chalk.green(`✅ Updated ${key} in configuration`));
    
  } catch (error: any) {
    throw new Error(`Failed to set configuration: ${error.message}`);
  }
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  
  // Try to parse as JSON, number, or boolean
  try {
    target[lastKey] = JSON.parse(value);
  } catch {
    target[lastKey] = value;
  }
}