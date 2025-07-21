import { Express, Request, Response } from 'express';
import fs from 'fs-extra';
import path from 'path';
import chokidar from 'chokidar';
import { loadConfig, saveConfig, loadEnv, logAPICall } from '../utils/helpers';
import { callOpenAI } from '../services/openai';
import { callAnthropic } from '../services/anthropic';

export function setupAPIRoutes(app: Express, projectDir: string): void {
  const easyaiDir = path.join(projectDir, 'easyai');

  // Get analytics data - calculated directly from log files
  app.get('/api/analytics', async (req: Request, res: Response) => {
    try {
      const logsPath = path.join(easyaiDir, 'logs', 'calls.jsonl');
      
      if (!await fs.pathExists(logsPath)) {
        // Return default analytics if no logs exist
        return res.json({
          totalCalls: 0,
          totalTokens: 0,
          modelUsage: {},
          lastUpdated: new Date().toISOString()
        });
      }

      const logsContent = await fs.readFile(logsPath, 'utf-8');
      const lines = logsContent.trim().split('\n').filter(line => line.trim());
      
      let totalCalls = 0;
      let totalTokens = 0;
      const modelUsage: Record<string, number> = {};
      let lastUpdated = new Date('1970-01-01').toISOString();

      // Calculate analytics from actual log entries
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          totalCalls++;
          
          // Count tokens if available
          if (entry.usage && entry.usage.total_tokens) {
            totalTokens += entry.usage.total_tokens;
          }
          
          // Count model usage
          if (entry.model) {
            modelUsage[entry.model] = (modelUsage[entry.model] || 0) + 1;
          }
          
          // Track latest timestamp
          if (entry.timestamp && entry.timestamp > lastUpdated) {
            lastUpdated = entry.timestamp;
          }
        } catch (parseError) {
          // Skip malformed log entries
          continue;
        }
      }

      res.json({
        totalCalls,
        totalTokens,
        modelUsage,
        lastUpdated: lastUpdated || new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to calculate analytics from logs' });
    }
  });

  // Get recent logs
  app.get('/api/logs', async (req: Request, res: Response) => {
    try {
      const { limit = 50, filter } = req.query;
      const logsPath = path.join(easyaiDir, 'logs', 'calls.jsonl');
      
      if (!await fs.pathExists(logsPath)) {
        return res.json([]);
      }

      const content = await fs.readFile(logsPath, 'utf-8');
      let logs = content.trim().split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      if (filter) {
        logs = logs.filter(log => 
          log.model?.includes(filter) || 
          log.prompt?.includes(filter) ||
          (log.success === false && filter === 'error')
        );
      }

      logs = logs.slice(-Number(limit)).reverse();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load logs' });
    }
  });

  // Get all prompts
  app.get('/api/prompts', async (req: Request, res: Response) => {
    try {
      const promptsDir = path.join(easyaiDir, 'prompts');
      const prompts = await getAllPrompts(promptsDir);
      res.json(prompts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load prompts' });
    }
  });

  // Get specific prompt
  app.get('/api/prompts/:category/:name', async (req: Request, res: Response) => {
    try {
      const { category, name } = req.params;
      const promptPath = path.join(easyaiDir, 'prompts', category, `${name}.md`);
      
      if (!await fs.pathExists(promptPath)) {
        return res.status(404).json({ error: 'Prompt not found' });
      }

      const content = await fs.readFile(promptPath, 'utf-8');
      res.json({ name, category, content });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load prompt' });
    }
  });

  // Save prompt
  app.post('/api/prompts/:category/:name', async (req: Request, res: Response) => {
    try {
      const { category, name } = req.params;
      const { content } = req.body;
      
      const promptPath = path.join(easyaiDir, 'prompts', category, `${name}.md`);
      await fs.ensureDir(path.dirname(promptPath));
      await fs.writeFile(promptPath, content);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save prompt' });
    }
  });

  // Delete prompt
  app.delete('/api/prompts/:category/:name', async (req: Request, res: Response) => {
    try {
      const { category, name } = req.params;
      const promptPath = path.join(easyaiDir, 'prompts', category, `${name}.md`);
      
      if (await fs.pathExists(promptPath)) {
        await fs.unlink(promptPath);
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete prompt' });
    }
  });

  // Get configuration
  app.get('/api/config', async (req: Request, res: Response) => {
    try {
      const config = await loadConfig(projectDir);
      const env = await loadEnv(projectDir);
      
      // Don't send actual API keys
      const safeEnv = { ...env };
      Object.keys(safeEnv).forEach(key => {
        if (key.includes('KEY')) {
          safeEnv[key] = safeEnv[key] ? '***configured***' : '';
        }
      });
      
      res.json({ config, env: safeEnv });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load configuration' });
    }
  });

  // Update configuration
  app.post('/api/config', async (req: Request, res: Response) => {
    try {
      const { config, env } = req.body;
      
      if (config) {
        await saveConfig(projectDir, config);
      }
      
      if (env) {
        await updateEnvFile(projectDir, env);
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save configuration' });
    }
  });

  // Test prompt in playground
  app.post('/api/playground/test', async (req: Request, res: Response) => {
    try {
      const { prompt, model, variables } = req.body;
      
      const env = await loadEnv(projectDir);
      let processedPrompt = prompt;
      
      // Process variables
      if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
          processedPrompt = processedPrompt.replace(
            new RegExp(`\\{\\{${key}\\}\\}`, 'g'), 
            String(value)
          );
        });
      }

      const startTime = Date.now();
      let response;

      if (model.startsWith('gpt') || model.startsWith('o1')) {
        response = await callOpenAI(env.OPENAI_API_KEY, model, processedPrompt);
      } else if (model.startsWith('claude')) {
        response = await callAnthropic(env.ANTHROPIC_API_KEY, model, processedPrompt);
      } else {
        throw new Error(`Unsupported model: ${model}`);
      }

      const duration = Date.now() - startTime;

      // Log the playground test
      await logAPICall(projectDir, {
        prompt: 'playground-test',
        model,
        input: processedPrompt.substring(0, 200) + '...',
        response: response.content.substring(0, 200) + '...',
        tokens: response.tokens,
        duration,
        cost: response.cost,
        success: true
      });

      res.json({
        response: response.content,
        tokens: response.tokens,
        cost: response.cost,
        duration
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}

async function getAllPrompts(promptsDir: string): Promise<any[]> {
  const prompts: any[] = [];
  
  try {
    const categories = await fs.readdir(promptsDir);
    
    for (const category of categories) {
      const categoryPath = path.join(promptsDir, category);
      if ((await fs.stat(categoryPath)).isDirectory()) {
        const files = await fs.readdir(categoryPath);
        
        for (const file of files) {
          if (file.endsWith('.md')) {
            const name = file.replace('.md', '');
            const filePath = path.join(categoryPath, file);
            const content = await fs.readFile(filePath, 'utf-8');
            
            prompts.push({
              name,
              category,
              content: content.substring(0, 200) + '...',
              fullContent: content
            });
          }
        }
      }
    }
  } catch (error) {
    // Directory might not exist yet
  }
  
  return prompts;
}

async function updateEnvFile(projectDir: string, envUpdates: Record<string, string>): Promise<void> {
  const envPath = path.join(projectDir, 'easyai', 'easyai.env');
  let envContent = await fs.readFile(envPath, 'utf-8');
  
  Object.entries(envUpdates).forEach(([key, value]) => {
    if (value && value !== '***configured***') {
      const regex = new RegExp(`${key}=.*`);
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    }
  });
  
  await fs.writeFile(envPath, envContent);
}