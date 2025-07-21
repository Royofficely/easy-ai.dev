import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';
import { checkEasyAIExists, loadEnv } from '../utils/helpers';

interface Model {
  id: string;
  name: string;
  provider: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

interface ModelsOptions {
  provider?: string;
  search?: string;
  detailed?: boolean;
  test?: boolean;
}

export async function manageModels(options: ModelsOptions): Promise<void> {
  const projectDir = process.cwd();
  
  if (!await checkEasyAIExists(projectDir)) {
    throw new Error('EasyAI not initialized. Run "easyai init" first.');
  }

  if (options.test) {
    await testModelConnectivity(projectDir);
    return;
  }

  await listModels(projectDir, options);
}

async function listModels(projectDir: string, options: ModelsOptions): Promise<void> {
  const env = await loadEnv(projectDir);
  
  console.log(chalk.blue('🤖 Available AI Models'));
  console.log('═'.repeat(80));

  try {
    const models: Model[] = [];

    // Fetch OpenAI models
    if (!options.provider || options.provider === 'openai') {
      if (env.OPENAI_API_KEY && env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
        try {
          const openaiModels = await fetchOpenAIModels(env.OPENAI_API_KEY);
          models.push(...openaiModels);
        } catch (error) {
          console.log(chalk.red('❌ OpenAI: API key not configured or invalid'));
        }
      } else {
        console.log(chalk.yellow('⚠️  OpenAI: API key not configured'));
      }
    }

    // Fetch Anthropic models
    if (!options.provider || options.provider === 'anthropic') {
      if (env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
        try {
          const anthropicModels = await fetchAnthropicModels();
          models.push(...anthropicModels);
        } catch (error) {
          console.log(chalk.red('❌ Anthropic: API key not configured or invalid'));
        }
      } else {
        console.log(chalk.yellow('⚠️  Anthropic: API key not configured'));
      }
    }

    // Fetch OpenRouter models
    if (!options.provider || options.provider === 'openrouter') {
      if (env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here') {
        try {
          const openrouterModels = await fetchOpenRouterModels(env.OPENROUTER_API_KEY);
          models.push(...openrouterModels.slice(0, 50)); // Limit to first 50 for display
        } catch (error) {
          console.log(chalk.red('❌ OpenRouter: API key not configured or invalid'));
        }
      } else {
        console.log(chalk.yellow('⚠️  OpenRouter: API key not configured'));
      }
    }

    if (models.length === 0) {
      console.log(chalk.yellow('\n📋 No models available. Configure API keys in settings.'));
      return;
    }

    // Apply search filter
    let filteredModels = models;
    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      filteredModels = models.filter(model => 
        model.name.toLowerCase().includes(searchTerm) ||
        model.id.toLowerCase().includes(searchTerm) ||
        model.provider.toLowerCase().includes(searchTerm)
      );
    }

    // Group by provider
    const groupedModels = filteredModels.reduce((groups, model) => {
      if (!groups[model.provider]) groups[model.provider] = [];
      groups[model.provider].push(model);
      return groups;
    }, {} as Record<string, Model[]>);

    // Display models
    for (const [provider, providerModels] of Object.entries(groupedModels)) {
      console.log(`\n${chalk.cyan.bold(provider)} Models (${providerModels.length})`);
      console.log('─'.repeat(60));

      providerModels.forEach(model => {
        if (options.detailed) {
          displayDetailedModel(model);
        } else {
          displayCompactModel(model);
        }
      });
    }

    console.log(`\n${chalk.gray(`Total: ${filteredModels.length} models`)}`);
    
  } catch (error: any) {
    throw new Error(`Failed to fetch models: ${error.message}`);
  }
}

function displayCompactModel(model: Model): void {
  const name = chalk.green(model.name);
  const id = chalk.gray(model.id);
  console.log(`  ${name} ${id}`);
}

function displayDetailedModel(model: Model): void {
  console.log(`\n  ${chalk.green.bold(model.name)}`);
  console.log(`  ID: ${chalk.cyan(model.id)}`);
  
  if (model.description) {
    console.log(`  Description: ${chalk.gray(model.description)}`);
  }
  
  if (model.context_length) {
    console.log(`  Context Length: ${chalk.yellow(model.context_length.toLocaleString())} tokens`);
  }
  
  if (model.pricing) {
    console.log(`  Pricing: $${model.pricing.prompt}/1K input, $${model.pricing.completion}/1K output`);
  }
}

async function fetchOpenAIModels(apiKey: string): Promise<Model[]> {
  const response = await axios.get('https://api.openai.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'User-Agent': 'EasyAI-CLI/1.0'
    }
  });

  return response.data.data
    .filter((model: any) => model.id.includes('gpt') || model.id.includes('o1'))
    .map((model: any) => ({
      id: model.id,
      name: formatModelName(model.id),
      provider: 'OpenAI',
      description: getModelDescription(model.id)
    }));
}

async function fetchAnthropicModels(): Promise<Model[]> {
  // Static list of Anthropic models since they don't have a public models API
  return [
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet (New)',
      provider: 'Anthropic',
      description: 'Most intelligent model, balanced performance and speed',
      context_length: 200000
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      provider: 'Anthropic',
      description: 'Fastest model, optimized for speed and efficiency',
      context_length: 200000
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      provider: 'Anthropic',
      description: 'Most powerful model for complex tasks',
      context_length: 200000
    },
    {
      id: 'claude-3-sonnet-20240229',
      name: 'Claude 3 Sonnet',
      provider: 'Anthropic',
      description: 'Balanced model for various tasks',
      context_length: 200000
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      provider: 'Anthropic',
      description: 'Fast model for simple tasks',
      context_length: 200000
    }
  ];
}

async function fetchOpenRouterModels(apiKey: string): Promise<Model[]> {
  const response = await axios.get('https://openrouter.ai/api/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'User-Agent': 'EasyAI-CLI/1.0'
    }
  });

  return response.data.data.map((model: any) => ({
    id: model.id,
    name: model.name || formatModelName(model.id),
    provider: 'OpenRouter',
    description: model.description,
    context_length: model.context_length,
    pricing: model.pricing
  }));
}

async function testModelConnectivity(projectDir: string): Promise<void> {
  const env = await loadEnv(projectDir);
  
  console.log(chalk.blue('🔍 Testing Model Connectivity'));
  console.log('─'.repeat(50));

  const tests = [
    {
      name: 'OpenAI',
      test: async () => {
        if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === 'your_openai_api_key_here') {
          throw new Error('API key not configured');
        }
        await fetchOpenAIModels(env.OPENAI_API_KEY);
      }
    },
    {
      name: 'Anthropic',
      test: async () => {
        if (!env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
          throw new Error('API key not configured');
        }
        // Test with a simple request
        await axios.post(
          'https://api.anthropic.com/v1/messages',
          {
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'hi' }]
          },
          {
            headers: {
              'x-api-key': env.ANTHROPIC_API_KEY,
              'content-type': 'application/json',
              'anthropic-version': '2023-06-01'
            }
          }
        );
      }
    },
    {
      name: 'OpenRouter',
      test: async () => {
        if (!env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
          throw new Error('API key not configured');
        }
        await fetchOpenRouterModels(env.OPENROUTER_API_KEY);
      }
    }
  ];

  for (const { name, test } of tests) {
    try {
      await test();
      console.log(chalk.green(`✅ ${name}: Connected successfully`));
    } catch (error: any) {
      console.log(chalk.red(`❌ ${name}: ${error.message}`));
    }
  }
}

function formatModelName(id: string): string {
  return id
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getModelDescription(id: string): string {
  const descriptions: Record<string, string> = {
    'gpt-4': 'Most capable GPT-4 model for complex reasoning',
    'gpt-4-turbo': 'Latest GPT-4 with improved performance',
    'gpt-4o': 'GPT-4 Omni with multimodal capabilities',
    'gpt-3.5-turbo': 'Fast and efficient for most tasks',
    'o1-preview': 'Advanced reasoning model for complex problems',
    'o1-mini': 'Efficient reasoning model for simpler tasks'
  };

  for (const [key, desc] of Object.entries(descriptions)) {
    if (id.includes(key)) {
      return desc;
    }
  }

  return 'AI language model';
}