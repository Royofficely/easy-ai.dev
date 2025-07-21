import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { checkEasyAIExists } from '../utils/helpers';

interface ExportOptions {
  format?: string;
  filter?: string;
  output?: string;
  period?: string;
  type?: string;
}

interface LogEntry {
  timestamp: string;
  model: string;
  prompt: string;
  response?: string;
  success: boolean;
  tokens?: number;
  duration: number;
  cost?: number;
  error?: string;
}

export async function exportData(options: ExportOptions): Promise<void> {
  const projectDir = process.cwd();
  
  if (!await checkEasyAIExists(projectDir)) {
    throw new Error('EasyAI not initialized. Run "easyai init" first.');
  }

  const exportType = options.type || 'logs';
  const format = options.format || 'json';
  
  switch (exportType.toLowerCase()) {
    case 'logs':
      await exportLogs(projectDir, options, format);
      break;
    case 'prompts':
      await exportPrompts(projectDir, options, format);
      break;
    case 'config':
      await exportConfig(projectDir, options, format);
      break;
    default:
      throw new Error(`Unsupported export type: ${exportType}. Use 'logs', 'prompts', or 'config'`);
  }
}

async function exportLogs(projectDir: string, options: ExportOptions, format: string): Promise<void> {
  const logPath = path.join(projectDir, 'easyai', 'logs', 'calls.jsonl');
  
  if (!await fs.pathExists(logPath)) {
    throw new Error('No logs found to export');
  }

  // Load and parse logs
  const logContent = await fs.readFile(logPath, 'utf-8');
  const lines = logContent.trim().split('\n').filter(line => line.trim());
  
  let logs: LogEntry[] = lines.map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);

  if (logs.length === 0) {
    throw new Error('No valid logs found to export');
  }

  // Apply filters
  logs = applyLogFilters(logs, options);

  if (logs.length === 0) {
    throw new Error('No logs match the specified filters');
  }

  // Generate export
  const exportData = await generateExport(logs, format, 'logs');
  const filename = await saveExport(projectDir, exportData, format, 'logs', options.output);
  
  console.log(chalk.green(`✅ Exported ${logs.length} log entries to ${filename}`));
}

async function exportPrompts(projectDir: string, options: ExportOptions, format: string): Promise<void> {
  const promptsDir = path.join(projectDir, 'easyai', 'prompts');
  
  if (!await fs.pathExists(promptsDir)) {
    throw new Error('No prompts found to export');
  }

  const prompts = await loadAllPrompts(promptsDir);
  
  if (prompts.length === 0) {
    throw new Error('No prompts found to export');
  }

  // Apply filters
  let filteredPrompts = prompts;
  if (options.filter) {
    filteredPrompts = prompts.filter(p => 
      p.name.toLowerCase().includes(options.filter!.toLowerCase()) ||
      p.category.toLowerCase().includes(options.filter!.toLowerCase()) ||
      p.content.toLowerCase().includes(options.filter!.toLowerCase())
    );
  }

  const exportData = await generateExport(filteredPrompts, format, 'prompts');
  const filename = await saveExport(projectDir, exportData, format, 'prompts', options.output);
  
  console.log(chalk.green(`✅ Exported ${filteredPrompts.length} prompts to ${filename}`));
}

async function exportConfig(projectDir: string, options: ExportOptions, format: string): Promise<void> {
  const configPath = path.join(projectDir, 'easyai', 'config', 'settings.json');
  const envPath = path.join(projectDir, 'easyai', 'config', 'easyai.env');
  
  const config: any = {
    settings: {},
    environment: {}
  };

  // Load settings
  if (await fs.pathExists(configPath)) {
    config.settings = await fs.readJson(configPath);
  }

  // Load environment (sanitized)
  if (await fs.pathExists(envPath)) {
    const envContent = await fs.readFile(envPath, 'utf-8');
    const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    envLines.forEach(line => {
      const [key, value] = line.split('=', 2);
      if (key && value) {
        // Sanitize API keys
        if (key.includes('KEY')) {
          config.environment[key] = '***configured***';
        } else {
          config.environment[key] = value;
        }
      }
    });
  }

  const exportData = await generateExport(config, format, 'config');
  const filename = await saveExport(projectDir, exportData, format, 'config', options.output);
  
  console.log(chalk.green(`✅ Exported configuration to ${filename}`));
}

function applyLogFilters(logs: LogEntry[], options: ExportOptions): LogEntry[] {
  let filtered = logs;

  // Period filter
  if (options.period) {
    const now = new Date();
    let cutoff: Date;

    switch (options.period.toLowerCase()) {
      case 'today':
        cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        const days = parseInt(options.period);
        if (!isNaN(days)) {
          cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        } else {
          cutoff = new Date(0);
        }
    }

    filtered = filtered.filter(log => new Date(log.timestamp) >= cutoff);
  }

  // General filter
  if (options.filter) {
    filtered = filtered.filter(log =>
      log.model.toLowerCase().includes(options.filter!.toLowerCase()) ||
      log.prompt.toLowerCase().includes(options.filter!.toLowerCase()) ||
      (options.filter!.toLowerCase() === 'error' && !log.success) ||
      (options.filter!.toLowerCase() === 'success' && log.success)
    );
  }

  return filtered;
}

async function loadAllPrompts(promptsDir: string): Promise<any[]> {
  const prompts: any[] = [];
  
  const categories = await fs.readdir(promptsDir);
  
  for (const category of categories) {
    const categoryPath = path.join(promptsDir, category);
    const stat = await fs.stat(categoryPath);
    
    if (stat.isDirectory()) {
      const files = await fs.readdir(categoryPath);
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(categoryPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          
          // Parse prompt
          const prompt: any = {
            name: path.basename(file, '.md'),
            category,
            content,
            filename: file,
            filepath: path.relative(process.cwd(), filePath)
          };
          
          // Extract description from content if it starts with #
          const lines = content.split('\n');
          if (lines[0].startsWith('# ')) {
            prompt.description = lines[0].substring(2).trim();
          }
          
          prompts.push(prompt);
        }
      }
    }
  }

  return prompts;
}

async function generateExport(data: any, format: string, type: string): Promise<string> {
  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(data, null, 2);
      
    case 'csv':
      return convertToCSV(data, type);
      
    case 'jsonl':
      if (Array.isArray(data)) {
        return data.map(item => JSON.stringify(item)).join('\n');
      } else {
        return JSON.stringify(data);
      }
      
    default:
      throw new Error(`Unsupported export format: ${format}. Use 'json', 'csv', or 'jsonl'`);
  }
}

function convertToCSV(data: any, type: string): string {
  if (!Array.isArray(data)) {
    data = [data];
  }

  if (data.length === 0) {
    return '';
  }

  let headers: string[];
  let rows: string[][];

  switch (type) {
    case 'logs':
      headers = ['Timestamp', 'Model', 'Prompt', 'Success', 'Tokens', 'Duration', 'Cost', 'Error'];
      rows = data.map((log: LogEntry) => [
        log.timestamp,
        log.model,
        `"${log.prompt.replace(/"/g, '""')}"`,
        log.success.toString(),
        (log.tokens || '').toString(),
        log.duration.toString(),
        (log.cost || '').toString(),
        `"${(log.error || '').replace(/"/g, '""')}"`
      ]);
      break;
      
    case 'prompts':
      headers = ['Name', 'Category', 'Description', 'Filepath', 'Content'];
      rows = data.map((prompt: any) => [
        prompt.name,
        prompt.category,
        `"${(prompt.description || '').replace(/"/g, '""')}"`,
        prompt.filepath,
        `"${prompt.content.replace(/"/g, '""')}"`
      ]);
      break;
      
    default:
      // Generic object to CSV
      headers = Object.keys(data[0]);
      rows = data.map((item: any) =>
        headers.map(header => {
          const value = item[header];
          if (typeof value === 'string') {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value || '');
        })
      );
  }

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

async function saveExport(
  projectDir: string, 
  content: string, 
  format: string, 
  type: string, 
  customPath?: string
): Promise<string> {
  const exportDir = path.join(projectDir, 'easyai', 'exports');
  await fs.ensureDir(exportDir);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const extension = format.toLowerCase();
  
  let filename: string;
  if (customPath) {
    filename = customPath.endsWith(`.${extension}`) ? customPath : `${customPath}.${extension}`;
  } else {
    filename = `${type}-export-${timestamp}.${extension}`;
  }
  
  const filepath = path.isAbsolute(filename) ? filename : path.join(exportDir, filename);
  
  await fs.writeFile(filepath, content);
  return path.relative(process.cwd(), filepath);
}