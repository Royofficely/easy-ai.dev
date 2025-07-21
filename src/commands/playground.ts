import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';
import { createInterface } from 'readline';
import { checkEasyAIExists, loadEnv, loadConfig } from '../utils/helpers';

interface PlaygroundOptions {
  prompt?: string;
  models?: string;
  file?: string;
  temperature?: string;
  maxTokens?: string;
  compare?: boolean;
}

interface Model {
  id: string;
  name: string;
  provider: string;
}

interface ModelResponse {
  model: string;
  response: string;
  tokens?: number;
  duration: number;
  success: boolean;
  error?: string;
}

export async function runPlayground(options: PlaygroundOptions): Promise<void> {
  const projectDir = process.cwd();
  
  if (!await checkEasyAIExists(projectDir)) {
    throw new Error('EasyAI not initialized. Run "easyai init" first.');
  }

  let prompt = options.prompt;
  let selectedModels: Model[] = [];

  // Get prompt input
  if (options.file) {
    const filePath = path.resolve(options.file);
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File not found: ${options.file}`);
    }
    prompt = await fs.readFile(filePath, 'utf-8');
  } else if (!prompt) {
    prompt = await getPromptInteractively();
  }

  if (!prompt?.trim()) {
    throw new Error('Prompt is required');
  }

  // Get model selection
  if (options.models) {
    selectedModels = await parseModelsFromString(projectDir, options.models);
  } else {
    selectedModels = await selectModelsInteractively(projectDir);
  }

  if (selectedModels.length === 0) {
    throw new Error('No models selected');
  }

  // Parse options
  const temperature = options.temperature ? parseFloat(options.temperature) : 0.7;
  const maxTokens = options.maxTokens ? parseInt(options.maxTokens) : 1000;

  console.log(chalk.blue('🎮 EasyAI Playground'));
  console.log('═'.repeat(80));
  console.log(chalk.gray(`Prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`));
  console.log(chalk.gray(`Models: ${selectedModels.map(m => m.name).join(', ')}`));
  console.log(chalk.gray(`Temperature: ${temperature} | Max Tokens: ${maxTokens}`));
  console.log('─'.repeat(80));

  // Run tests
  const responses = await Promise.all(
    selectedModels.map(model => 
      testModel(projectDir, model, prompt, { temperature, maxTokens })
    )
  );

  // Display results
  if (options.compare) {
    displayComparison(responses);
  } else {
    displaySequential(responses);
  }

  // Log to file
  await logPlaygroundSession(projectDir, {
    prompt,
    models: selectedModels,
    responses,
    timestamp: new Date().toISOString(),
    options: { temperature, maxTokens }
  });
}

async function getPromptInteractively(): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(chalk.yellow('📝 Enter your prompt (press Ctrl+D when finished):'));
  
  try {
    return await readMultilineInput(rl);
  } finally {
    rl.close();
  }
}

async function selectModelsInteractively(projectDir: string): Promise<Model[]> {
  const availableModels = await getAvailableModels(projectDir);
  
  if (availableModels.length === 0) {
    throw new Error('No models available. Configure API keys in settings.');
  }

  console.log(chalk.blue('\n🤖 Available Models:'));
  console.log('─'.repeat(50));

  availableModels.forEach((model, index) => {
    console.log(`${index + 1}. ${chalk.green(model.name)} (${chalk.cyan(model.provider)})`);
  });

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const selection = await askQuestion(
      rl, 
      '\nSelect models (comma-separated numbers, e.g., 1,3,5): '
    );

    const indices = selection
      .split(',')
      .map(s => parseInt(s.trim()) - 1)
      .filter(i => i >= 0 && i < availableModels.length);

    if (indices.length === 0) {
      throw new Error('No valid models selected');
    }

    return indices.map(i => availableModels[i]);
  } finally {
    rl.close();
  }
}

async function parseModelsFromString(projectDir: string, modelsStr: string): Promise<Model[]> {
  const availableModels = await getAvailableModels(projectDir);
  const requestedModels = modelsStr.split(',').map(s => s.trim());
  
  return requestedModels.map(modelStr => {
    // Try exact match first
    let model = availableModels.find(m => m.id === modelStr || m.name === modelStr);
    
    // Try partial match
    if (!model) {
      model = availableModels.find(m => 
        m.id.toLowerCase().includes(modelStr.toLowerCase()) ||
        m.name.toLowerCase().includes(modelStr.toLowerCase())
      );
    }
    
    if (!model) {
      throw new Error(`Model not found: ${modelStr}`);
    }
    
    return model;
  });
}

async function getAvailableModels(projectDir: string): Promise<Model[]> {
  const env = await loadEnv(projectDir);
  const models: Model[] = [];

  // Add OpenAI models
  if (env.OPENAI_API_KEY && env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    models.push(
      { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' }
    );
  }

  // Add Anthropic models
  if (env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
    models.push(
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'Anthropic' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'Anthropic' }
    );
  }

  return models;
}

async function testModel(
  projectDir: string,
  model: Model,
  prompt: string,
  options: { temperature: number; maxTokens: number }
): Promise<ModelResponse> {
  const startTime = Date.now();
  const env = await loadEnv(projectDir);

  try {
    let response: string;
    let tokens: number | undefined;

    if (model.provider === 'OpenAI') {
      const result = await callOpenAI(env.OPENAI_API_KEY, model.id, prompt, options);
      response = result.response;
      tokens = result.tokens;
    } else if (model.provider === 'Anthropic') {
      const result = await callAnthropic(env.ANTHROPIC_API_KEY, model.id, prompt, options);
      response = result.response;
      tokens = result.tokens;
    } else {
      throw new Error(`Unsupported provider: ${model.provider}`);
    }

    return {
      model: model.name,
      response,
      tokens,
      duration: Date.now() - startTime,
      success: true
    };

  } catch (error: any) {
    return {
      model: model.name,
      response: '',
      duration: Date.now() - startTime,
      success: false,
      error: error.message
    };
  }
}

async function callOpenAI(
  apiKey: string,
  model: string,
  prompt: string,
  options: { temperature: number; maxTokens: number }
): Promise<{ response: string; tokens: number }> {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature,
      max_tokens: options.maxTokens
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return {
    response: response.data.choices[0].message.content,
    tokens: response.data.usage.total_tokens
  };
}

async function callAnthropic(
  apiKey: string,
  model: string,
  prompt: string,
  options: { temperature: number; maxTokens: number }
): Promise<{ response: string; tokens: number }> {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      messages: [{ role: 'user', content: prompt }]
    },
    {
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    }
  );

  return {
    response: response.data.content[0].text,
    tokens: response.data.usage.input_tokens + response.data.usage.output_tokens
  };
}

function displaySequential(responses: ModelResponse[]): void {
  console.log('\n📊 Results:');
  console.log('═'.repeat(80));

  responses.forEach((result, index) => {
    const status = result.success ? chalk.green('✅') : chalk.red('❌');
    console.log(`\n${status} ${chalk.bold.cyan(result.model)}`);
    console.log('─'.repeat(60));
    
    if (result.success) {
      console.log(result.response);
      if (result.tokens) {
        console.log(chalk.gray(`\n💰 ${result.tokens} tokens | ⏱️  ${result.duration}ms`));
      }
    } else {
      console.log(chalk.red(`Error: ${result.error}`));
    }
    
    if (index < responses.length - 1) {
      console.log('\n' + '─'.repeat(80));
    }
  });
}

function displayComparison(responses: ModelResponse[]): void {
  console.log('\n📊 Side-by-Side Comparison:');
  console.log('═'.repeat(120));

  const successful = responses.filter(r => r.success);
  const failed = responses.filter(r => !r.success);

  if (successful.length > 0) {
    // Display successful responses in columns
    const maxWidth = Math.floor((120 - successful.length + 1) / successful.length);
    
    // Headers
    const headers = successful.map(r => 
      chalk.bold.cyan(r.model.substring(0, maxWidth - 2))
    );
    console.log(headers.join(' | '));
    console.log(successful.map(() => '─'.repeat(maxWidth - 2)).join(' | '));

    // Split responses into lines and display side by side
    const responseSets = successful.map(r => {
      const lines = r.response.split('\n');
      const wrapped = [];
      for (const line of lines) {
        if (line.length <= maxWidth - 2) {
          wrapped.push(line);
        } else {
          // Simple word wrapping
          const words = line.split(' ');
          let currentLine = '';
          for (const word of words) {
            if ((currentLine + word).length <= maxWidth - 2) {
              currentLine += (currentLine ? ' ' : '') + word;
            } else {
              if (currentLine) wrapped.push(currentLine);
              currentLine = word;
            }
          }
          if (currentLine) wrapped.push(currentLine);
        }
      }
      return wrapped;
    });

    const maxLines = Math.max(...responseSets.map(rs => rs.length));
    
    for (let i = 0; i < maxLines; i++) {
      const row = responseSets.map(rs => {
        const line = rs[i] || '';
        return line.padEnd(maxWidth - 2).substring(0, maxWidth - 2);
      });
      console.log(row.join(' | '));
    }

    // Stats
    console.log('\n' + '─'.repeat(120));
    const stats = successful.map(r => {
      const tokensStr = r.tokens ? `${r.tokens}t` : 'N/A';
      const timeStr = `${r.duration}ms`;
      return `${tokensStr} | ${timeStr}`.padEnd(maxWidth - 2);
    });
    console.log(chalk.gray(stats.join(' | ')));
  }

  // Display failed responses
  if (failed.length > 0) {
    console.log('\n❌ Failed Models:');
    failed.forEach(result => {
      console.log(`  ${chalk.red(result.model)}: ${result.error}`);
    });
  }
}

async function logPlaygroundSession(projectDir: string, session: any): Promise<void> {
  const logDir = path.join(projectDir, 'easyai', 'logs');
  await fs.ensureDir(logDir);
  
  const logFile = path.join(logDir, 'playground.jsonl');
  const logEntry = JSON.stringify(session) + '\n';
  
  await fs.appendFile(logFile, logEntry);
}

function askQuestion(rl: any, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      resolve(answer.trim());
    });
  });
}

function readMultilineInput(rl: any): Promise<string> {
  return new Promise((resolve) => {
    const lines: string[] = [];
    
    rl.on('line', (line: string) => {
      lines.push(line);
    });
    
    rl.on('close', () => {
      resolve(lines.join('\n'));
    });
  });
}