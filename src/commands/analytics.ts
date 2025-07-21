import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { checkEasyAIExists } from '../utils/helpers';

interface AnalyticsOptions {
  period?: string;
  provider?: string;
  model?: string;
  export?: string;
  detailed?: boolean;
}

interface LogEntry {
  timestamp: string;
  model: string;
  prompt: string;
  success: boolean;
  tokens?: number;
  duration: number;
  cost?: number;
  error?: string;
}

interface Analytics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalTokens: number;
  totalCost: number;
  avgDuration: number;
  modelStats: Record<string, {
    calls: number;
    tokens: number;
    cost: number;
    avgDuration: number;
  }>;
  providerStats: Record<string, {
    calls: number;
    tokens: number;
    cost: number;
    successRate: number;
  }>;
  timeStats: Record<string, number>;
}

export async function showAnalytics(options: AnalyticsOptions): Promise<void> {
  const projectDir = process.cwd();
  
  if (!await checkEasyAIExists(projectDir)) {
    throw new Error('EasyAI not initialized. Run "easyai init" first.');
  }

  const logs = await loadLogs(projectDir);
  
  if (logs.length === 0) {
    console.log(chalk.yellow('📊 No API call logs found'));
    return;
  }

  // Apply filters
  const filteredLogs = applyFilters(logs, options);
  
  if (filteredLogs.length === 0) {
    console.log(chalk.yellow('📊 No logs match the specified filters'));
    return;
  }

  const analytics = calculateAnalytics(filteredLogs);

  if (options.export) {
    await exportAnalytics(projectDir, analytics, options.export);
    console.log(chalk.green(`✅ Analytics exported to ${options.export}`));
    return;
  }

  displayAnalytics(analytics, options);
}

async function loadLogs(projectDir: string): Promise<LogEntry[]> {
  const logPath = path.join(projectDir, 'easyai', 'logs', 'calls.jsonl');
  
  if (!await fs.pathExists(logPath)) {
    return [];
  }

  const logContent = await fs.readFile(logPath, 'utf-8');
  const lines = logContent.trim().split('\n').filter(line => line.trim());
  
  return lines.map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

function applyFilters(logs: LogEntry[], options: AnalyticsOptions): LogEntry[] {
  let filtered = logs;

  // Time period filter
  if (options.period) {
    const now = new Date();
    let cutoff: Date;

    switch (options.period.toLowerCase()) {
      case 'today':
      case '1d':
        cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
      case '7d':
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
      case '30d':
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
      case '365d':
        cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        // Try parsing as number of days
        const days = parseInt(options.period);
        if (!isNaN(days)) {
          cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        } else {
          cutoff = new Date(0);
        }
    }

    filtered = filtered.filter(log => new Date(log.timestamp) >= cutoff);
  }

  // Provider filter
  if (options.provider) {
    filtered = filtered.filter(log => {
      const provider = getProviderFromModel(log.model);
      return provider.toLowerCase().includes(options.provider!.toLowerCase());
    });
  }

  // Model filter
  if (options.model) {
    filtered = filtered.filter(log => 
      log.model.toLowerCase().includes(options.model!.toLowerCase())
    );
  }

  return filtered;
}

function calculateAnalytics(logs: LogEntry[]): Analytics {
  const analytics: Analytics = {
    totalCalls: logs.length,
    successfulCalls: logs.filter(l => l.success).length,
    failedCalls: logs.filter(l => !l.success).length,
    totalTokens: logs.reduce((sum, l) => sum + (l.tokens || 0), 0),
    totalCost: logs.reduce((sum, l) => sum + (l.cost || 0), 0),
    avgDuration: logs.reduce((sum, l) => sum + l.duration, 0) / logs.length,
    modelStats: {},
    providerStats: {},
    timeStats: {}
  };

  // Calculate model stats
  logs.forEach(log => {
    if (!analytics.modelStats[log.model]) {
      analytics.modelStats[log.model] = {
        calls: 0,
        tokens: 0,
        cost: 0,
        avgDuration: 0
      };
    }
    
    const stats = analytics.modelStats[log.model];
    stats.calls++;
    stats.tokens += log.tokens || 0;
    stats.cost += log.cost || 0;
    stats.avgDuration = (stats.avgDuration * (stats.calls - 1) + log.duration) / stats.calls;
  });

  // Calculate provider stats
  logs.forEach(log => {
    const provider = getProviderFromModel(log.model);
    
    if (!analytics.providerStats[provider]) {
      analytics.providerStats[provider] = {
        calls: 0,
        tokens: 0,
        cost: 0,
        successRate: 0
      };
    }
    
    const stats = analytics.providerStats[provider];
    stats.calls++;
    stats.tokens += log.tokens || 0;
    stats.cost += log.cost || 0;
  });

  // Calculate success rates
  Object.keys(analytics.providerStats).forEach(provider => {
    const providerLogs = logs.filter(l => getProviderFromModel(l.model) === provider);
    const successfulCalls = providerLogs.filter(l => l.success).length;
    analytics.providerStats[provider].successRate = successfulCalls / providerLogs.length;
  });

  // Calculate time-based stats (calls per hour of day)
  logs.forEach(log => {
    const hour = new Date(log.timestamp).getHours();
    analytics.timeStats[hour] = (analytics.timeStats[hour] || 0) + 1;
  });

  return analytics;
}

function displayAnalytics(analytics: Analytics, options: AnalyticsOptions): void {
  console.log(chalk.blue('📊 EasyAI Analytics Dashboard'));
  console.log('═'.repeat(80));

  // Overview stats
  console.log(chalk.green('\n📈 Overview'));
  console.log('─'.repeat(40));
  console.log(`Total API Calls: ${chalk.cyan(analytics.totalCalls.toLocaleString())}`);
  console.log(`Successful: ${chalk.green(analytics.successfulCalls.toLocaleString())} (${((analytics.successfulCalls / analytics.totalCalls) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${chalk.red(analytics.failedCalls.toLocaleString())} (${((analytics.failedCalls / analytics.totalCalls) * 100).toFixed(1)}%)`);
  console.log(`Total Tokens: ${chalk.yellow(analytics.totalTokens.toLocaleString())}`);
  
  if (analytics.totalCost > 0) {
    console.log(`Total Cost: ${chalk.green('$' + analytics.totalCost.toFixed(4))}`);
  }
  
  console.log(`Avg Duration: ${chalk.blue(Math.round(analytics.avgDuration))}ms`);

  // Provider stats
  console.log(chalk.green('\n🏢 By Provider'));
  console.log('─'.repeat(40));
  Object.entries(analytics.providerStats)
    .sort(([,a], [,b]) => b.calls - a.calls)
    .forEach(([provider, stats]) => {
      const successRate = (stats.successRate * 100).toFixed(1);
      console.log(`${chalk.cyan(provider.padEnd(15))} ${stats.calls.toString().padStart(6)} calls | ${stats.tokens.toString().padStart(8)} tokens | ${successRate}% success`);
    });

  // Model stats (top 10)
  console.log(chalk.green('\n🤖 Top Models'));
  console.log('─'.repeat(40));
  Object.entries(analytics.modelStats)
    .sort(([,a], [,b]) => b.calls - a.calls)
    .slice(0, 10)
    .forEach(([model, stats]) => {
      const shortModel = model.length > 25 ? model.substring(0, 22) + '...' : model;
      console.log(`${chalk.yellow(shortModel.padEnd(25))} ${stats.calls.toString().padStart(6)} calls | ${Math.round(stats.avgDuration).toString().padStart(6)}ms avg`);
    });

  if (options.detailed) {
    displayDetailedStats(analytics);
  }

  console.log('\n' + '═'.repeat(80));
}

function displayDetailedStats(analytics: Analytics): void {
  // Hourly distribution
  console.log(chalk.green('\n⏰ Usage by Hour'));
  console.log('─'.repeat(40));
  
  const hours = Object.keys(analytics.timeStats).map(Number).sort((a, b) => a - b);
  hours.forEach(hour => {
    const count = analytics.timeStats[hour];
    const bar = '█'.repeat(Math.round(count / Math.max(...Object.values(analytics.timeStats)) * 20));
    console.log(`${hour.toString().padStart(2)}:00 ${chalk.cyan(bar)} ${count}`);
  });

  // All model stats
  console.log(chalk.green('\n🤖 All Models'));
  console.log('─'.repeat(60));
  Object.entries(analytics.modelStats)
    .sort(([,a], [,b]) => b.calls - a.calls)
    .forEach(([model, stats]) => {
      console.log(`\n${chalk.yellow.bold(model)}`);
      console.log(`  Calls: ${stats.calls} | Tokens: ${stats.tokens.toLocaleString()} | Avg Duration: ${Math.round(stats.avgDuration)}ms`);
      if (stats.cost > 0) {
        console.log(`  Cost: $${stats.cost.toFixed(4)}`);
      }
    });
}

async function exportAnalytics(projectDir: string, analytics: Analytics, format: string): Promise<void> {
  const exportDir = path.join(projectDir, 'easyai', 'exports');
  await fs.ensureDir(exportDir);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `analytics-${timestamp}`;

  let content: string;
  let filepath: string;

  switch (format.toLowerCase()) {
    case 'json':
      filepath = path.join(exportDir, `${filename}.json`);
      content = JSON.stringify(analytics, null, 2);
      break;
      
    case 'csv':
      filepath = path.join(exportDir, `${filename}.csv`);
      content = convertToCSV(analytics);
      break;
      
    default:
      throw new Error(`Unsupported export format: ${format}. Use 'json' or 'csv'`);
  }

  await fs.writeFile(filepath, content);
}

function convertToCSV(analytics: Analytics): string {
  const lines = [];
  
  // Header
  lines.push('Type,Name,Calls,Tokens,Cost,Success_Rate,Avg_Duration');
  
  // Provider stats
  Object.entries(analytics.providerStats).forEach(([provider, stats]) => {
    lines.push(`Provider,${provider},${stats.calls},${stats.tokens},${stats.cost.toFixed(4)},${(stats.successRate * 100).toFixed(1)}%,`);
  });
  
  // Model stats
  Object.entries(analytics.modelStats).forEach(([model, stats]) => {
    lines.push(`Model,${model},${stats.calls},${stats.tokens},${stats.cost.toFixed(4)},,${Math.round(stats.avgDuration)}`);
  });
  
  return lines.join('\n');
}

function getProviderFromModel(model: string): string {
  if (model.includes('gpt') || model.includes('o1')) return 'OpenAI';
  if (model.includes('claude')) return 'Anthropic';
  if (model.includes('/')) return 'OpenRouter';
  return 'Unknown';
}