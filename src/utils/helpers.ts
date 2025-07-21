import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

export function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function checkEasyAIExists(projectDir: string): Promise<boolean> {
  const easyaiDir = path.join(projectDir, 'easyai');
  return await fs.pathExists(easyaiDir);
}

export async function loadConfig(projectDir: string): Promise<any> {
  const configPath = path.join(projectDir, 'easyai', 'config', 'settings.json');
  try {
    return await fs.readJSON(configPath);
  } catch (error) {
    throw new Error('Failed to load configuration. Is EasyAI initialized?');
  }
}

export async function saveConfig(projectDir: string, config: any): Promise<void> {
  const configPath = path.join(projectDir, 'easyai', 'config', 'settings.json');
  await fs.writeJSON(configPath, config, { spaces: 2 });
}

export async function loadEnv(projectDir: string): Promise<Record<string, string>> {
  const envPath = path.join(projectDir, 'easyai', 'easyai.env');
  const envContent = await fs.readFile(envPath, 'utf-8');
  
  const env: Record<string, string> = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

export async function logAPICall(projectDir: string, logData: any): Promise<void> {
  const logPath = path.join(projectDir, 'easyai', 'logs', 'calls.jsonl');
  const logEntry = JSON.stringify({
    ...logData,
    timestamp: new Date().toISOString()
  }) + '\n';
  
  await fs.appendFile(logPath, logEntry);
  
  // Note: analytics are now calculated directly from log files, no separate tracking needed
}

// updateAnalytics function removed - analytics are now calculated directly from log files