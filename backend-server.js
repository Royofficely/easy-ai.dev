const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'easyai.env') });

const app = express();
const port = 7542;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, 'dist/dashboard')));

// Load environment variables from easyai.env
const loadEnvConfig = () => {
  const envPath = path.join(__dirname, 'easyai.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ easyai.env file not found. Please create it with your API keys.');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const config = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const equalIndex = line.indexOf('=');
      const key = line.substring(0, equalIndex).trim();
      const value = line.substring(equalIndex + 1).trim();
      if (key && value) {
        config[key] = value;
      }
    }
  });
  
  return config;
};

const config = loadEnvConfig();

// Debug: Log what we loaded
console.log('🔍 Loaded config:', {
  OPENAI_API_KEY: config.OPENAI_API_KEY ? `${config.OPENAI_API_KEY.slice(0, 10)}...` : 'NOT SET',
  ANTHROPIC_API_KEY: config.ANTHROPIC_API_KEY ? `${config.ANTHROPIC_API_KEY.slice(0, 10)}...` : 'NOT SET',
  GEMINI_API_KEY: config.GEMINI_API_KEY ? `${config.GEMINI_API_KEY.slice(0, 10)}...` : 'NOT SET',
  OPENROUTER_API_KEY: config.OPENROUTER_API_KEY ? `${config.OPENROUTER_API_KEY.slice(0, 10)}...` : 'NOT SET',
  OLLAMA_BASE_URL: config.OLLAMA_BASE_URL || 'NOT SET',
  OPENAI_MODEL: config.OPENAI_MODEL,
  ANTHROPIC_MODEL: config.ANTHROPIC_MODEL
});

// Enhanced logging function
const logRequest = (logData) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    id: Date.now() + '-' + Math.random().toString(36).substr(2, 9), // Unique ID
    ...logData
  };
  
  // Log to console (simplified for readability)
  console.log(`📋 ${logEntry.success ? '✅' : '❌'} ${logEntry.model} - ${logEntry.prompt} (${logEntry.tokens} tokens, ${logEntry.duration}ms)`);
  
  // Store in memory (simplified version for frontend display)
  if (!global.logs) global.logs = [];
  const simplifiedEntry = {
    timestamp: logEntry.timestamp,
    prompt: logEntry.prompt,
    model: logEntry.model,
    tokens: logEntry.tokens,
    cost: logEntry.cost,
    duration: logEntry.duration,
    success: logEntry.success,
    response: logEntry.response
  };
  global.logs.unshift(simplifiedEntry);
  
  // Keep only last 100 logs in memory
  if (global.logs.length > 100) {
    global.logs = global.logs.slice(0, 100);
  }
  
  // Save detailed log to persistent file
  try {
    const logsDir = path.join(__dirname, 'test-project', 'easyai', 'logs');
    const logFile = path.join(logsDir, 'calls.jsonl');
    
    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Append detailed log entry to file (JSONL format - one JSON object per line)
    const detailedLogLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(logFile, detailedLogLine, 'utf8');
    
  } catch (error) {
    console.error('Failed to save log to file:', error.message);
  }
};

// Analytics data calculated from log files
const getAnalytics = () => {
  try {
    const logFile = path.join(__dirname, 'test-project', 'easyai', 'logs', 'calls.jsonl');
    
    if (!fs.existsSync(logFile)) {
      return {
        totalCalls: 0,
        totalTokens: 0,
        modelUsage: {},
        lastUpdated: new Date().toISOString()
      };
    }

    // Read persistent logs from file
    const logData = fs.readFileSync(logFile, 'utf8');
    const logs = logData
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      })
      .filter(log => log !== null);

    const modelUsage = {};
    let totalTokens = 0;
    let lastUpdated = new Date('1970-01-01').toISOString();
    
    logs.forEach(log => {
      modelUsage[log.model] = (modelUsage[log.model] || 0) + 1;
      totalTokens += log.tokens || 0;
      
      // Track latest timestamp
      if (log.timestamp && log.timestamp > lastUpdated) {
        lastUpdated = log.timestamp;
      }
    });
    
    return {
      totalCalls: logs.length,
      totalTokens,
      modelUsage,
      lastUpdated: lastUpdated || new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to calculate analytics from logs:', error.message);
    return {
      totalCalls: 0,
      totalTokens: 0,
      modelUsage: {},
      lastUpdated: new Date().toISOString()
    };
  }
};

// API Routes
app.get('/api/analytics', (req, res) => {
  res.json(getAnalytics());
});

app.get('/api/logs', (req, res) => {
  try {
    const logFile = path.join(__dirname, 'test-project', 'easyai', 'logs', 'calls.jsonl');
    
    if (fs.existsSync(logFile)) {
      // Read persistent logs from file
      const logData = fs.readFileSync(logFile, 'utf8');
      const persistentLogs = logData
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (e) {
            return null;
          }
        })
        .filter(log => log !== null)
        .slice(0, 100); // Limit to last 100 logs
      
      res.json(persistentLogs);
    } else {
      // Fallback to memory logs
      res.json(global.logs || []);
    }
  } catch (error) {
    console.error('Error reading logs:', error.message);
    // Fallback to memory logs
    res.json(global.logs || []);
  }
});

// Get available models
app.get('/api/models', async (req, res) => {
  const currentConfig = loadEnvConfig();
  const models = [];
  
  // OpenAI models - fetch from API
  if (currentConfig.OPENAI_API_KEY && currentConfig.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    try {
      const OpenAI = require('openai');
      // Try direct API call to get all models
      const axios = require('axios');
      const response = await axios.get('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${currentConfig.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`OpenAI API returned ${response.data.data.length} total models`);
      console.log('Raw OpenAI models:', response.data.data.map(m => m.id).slice(0, 10));
      
      // Process all models returned by API (minimal filtering only for non-chat models)
      const chatModels = response.data.data
        .filter(model => {
          const id = model.id.toLowerCase();
          return (
            // Only exclude obvious non-chat models
            !id.includes('embedding') && 
            !id.includes('whisper') &&
            !id.includes('tts') &&
            !id.includes('dall-e') &&
            !id.includes('moderation')
          )
        })
        .sort((a, b) => {
          // Sort GPT-4 models first, then GPT-3.5, then others
          const aIsGPT4 = a.id.includes('gpt-4');
          const bIsGPT4 = b.id.includes('gpt-4');
          const aIsGPT35 = a.id.includes('gpt-3.5');
          const bIsGPT35 = b.id.includes('gpt-3.5');
          
          if (aIsGPT4 && !bIsGPT4) return -1;
          if (!aIsGPT4 && bIsGPT4) return 1;
          if (aIsGPT35 && !bIsGPT35 && !bIsGPT4) return -1;
          if (!aIsGPT35 && bIsGPT35 && !aIsGPT4) return 1;
          
          return a.id.localeCompare(b.id);
        })
        .map(model => ({
          id: model.id,
          name: model.id.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          provider: 'OpenAI',
          description: getModelDescription(model.id),
          created: model.created,
          owned_by: model.owned_by
        }));
      
      console.log(`Fetched ${chatModels.length} OpenAI models after filtering:`, chatModels.map(m => m.id));
      console.log('Filtered out models:', response.data.data.filter(m => !chatModels.find(cm => cm.id === m.id)).map(m => m.id));
        
      models.push(...chatModels);
      
    } catch (error) {
      console.error('Error fetching OpenAI models:', error.message);
      console.error('Full error details:', error);
      console.error('API Key configured:', !!currentConfig.OPENAI_API_KEY);
      console.error('API Key preview:', currentConfig.OPENAI_API_KEY ? currentConfig.OPENAI_API_KEY.slice(0, 10) + '...' : 'NOT SET');
      
      // Fallback to hardcoded models if API fails
      models.push(
        { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', description: 'Most capable model, great for complex tasks' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', description: 'Faster and cheaper than GPT-4' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Fast and efficient for most tasks' }
      );
    }
  }
  
  // Anthropic models - fetch from API
  if (currentConfig.ANTHROPIC_API_KEY && currentConfig.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
    try {
      const axios = require('axios');
      const response = await axios.get('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': currentConfig.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      });
      
      console.log(`Anthropic API returned ${response.data.data.length} total models`);
      console.log('Raw Anthropic models:', response.data.data.map(m => m.id));
      
      const anthropicModels = response.data.data
        .map(model => ({
          id: model.id,
          name: model.display_name || model.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          provider: 'Anthropic',
          description: `Claude model - ${model.id}`
        }));
      
      console.log(`Fetched ${anthropicModels.length} Anthropic models:`, anthropicModels.map(m => m.id));
      models.push(...anthropicModels);
    } catch (error) {
      console.error('Failed to fetch Anthropic models:', error.message);
      console.error('Full error:', error);
      // Fallback to basic hardcoded models if API fails
      models.push(
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Most intelligent Claude model' },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Most powerful Claude model for complex tasks' }
      );
    }
  }

  // OpenRouter models - fetch from API
  if (currentConfig.OPENROUTER_API_KEY && currentConfig.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here') {
    try {
      const axios = require('axios');
      const response = await axios.get('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${currentConfig.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:5172',
          'X-Title': 'EasyAI'
        }
      });
      
      const openRouterModels = response.data.data
        .filter(model => !model.id.includes('free')) // Filter out free models for cleaner list
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(model => ({
          id: model.id,
          name: model.name || model.id,
          provider: 'OpenRouter',
          description: model.description || `${model.id} via OpenRouter`,
          context_length: model.context_length,
          pricing: model.pricing
        }));
        
      models.push(...openRouterModels); // All OpenRouter models
      
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error.message);
      // Fallback to popular OpenRouter models
      models.push(
        { id: 'openai/gpt-4', name: 'GPT-4 (OpenRouter)', provider: 'OpenRouter', description: 'GPT-4 via OpenRouter' },
        { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo (OpenRouter)', provider: 'OpenRouter', description: 'GPT-3.5 Turbo via OpenRouter' },
        { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus (OpenRouter)', provider: 'OpenRouter', description: 'Claude 3 Opus via OpenRouter' }
      );
    }
  }

  // Google Gemini models
  if (currentConfig.GEMINI_API_KEY && currentConfig.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    try {
      const axios = require('axios');
      const response = await axios.get(`https://generativelanguage.googleapis.com/v1/models?key=${currentConfig.GEMINI_API_KEY}`);
      
      const geminiModels = response.data.models
        .filter(model => model.supportedGenerationMethods?.includes('generateContent'))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(model => ({
          id: model.name.replace('models/', ''),
          name: model.displayName || model.name.replace('models/', ''),
          provider: 'Google',
          description: model.description || `${model.displayName} - Google's AI model`,
          version: model.version
        }));
        
      models.push(...geminiModels);
      
    } catch (error) {
      console.error('Error fetching Gemini models:', error.message);
      // Fallback to known Gemini models
      models.push(
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', description: 'Most capable Gemini model' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google', description: 'Fast and efficient Gemini model' },
        { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', description: 'Gemini Pro model' }
      );
    }
  }

  // Ollama models - fetch from local instance
  if (currentConfig.OLLAMA_BASE_URL) {
    try {
      const axios = require('axios');
      const response = await axios.get(`${currentConfig.OLLAMA_BASE_URL}/api/tags`, {
        timeout: 5000 // 5 second timeout for local requests
      });
      
      const ollamaModels = response.data.models
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(model => ({
          id: model.name,
          name: model.name.charAt(0).toUpperCase() + model.name.slice(1),
          provider: 'Ollama',
          description: `Local ${model.name} model via Ollama`,
          size: model.size,
          modified_at: model.modified_at
        }));
        
      models.push(...ollamaModels);
      
    } catch (error) {
      console.log('Ollama not available or no models installed:', error.message);
      // Don't add fallback models for Ollama since it's local and optional
    }
  }
  
  res.json(models);
});

// Helper function to get model descriptions
const getModelDescription = (modelId) => {
  const descriptions = {
    // GPT-4 Models
    'gpt-4o': 'Latest GPT-4 model with enhanced capabilities',
    'gpt-4o-mini': 'Smaller, faster version of GPT-4o',
    'gpt-4-turbo': 'Latest GPT-4 model with improved performance and lower cost',
    'gpt-4-turbo-2024-04-09': 'GPT-4 Turbo with April 2024 training data',
    'gpt-4-turbo-preview': 'Preview version of GPT-4 Turbo',
    'gpt-4-0125-preview': 'GPT-4 Turbo with January 2024 training data',
    'gpt-4-1106-preview': 'GPT-4 Turbo model with 128k context window',
    'gpt-4-vision-preview': 'GPT-4 with vision capabilities',
    'gpt-4-1106-vision-preview': 'GPT-4 Turbo with vision and 128k context',
    'gpt-4': 'Most capable GPT-4 model, great for complex reasoning tasks',
    'gpt-4-0613': 'GPT-4 with June 2023 training data',
    'gpt-4-32k': 'GPT-4 with 32k context window',
    'gpt-4-32k-0613': 'GPT-4 with 32k context and June 2023 data',
    
    // GPT-3.5 Models
    'gpt-3.5-turbo': 'Fast and efficient for most conversational tasks',
    'gpt-3.5-turbo-0125': 'Latest GPT-3.5 Turbo with updated training',
    'gpt-3.5-turbo-1106': 'GPT-3.5 Turbo with November 2023 training',
    'gpt-3.5-turbo-16k': 'GPT-3.5 Turbo with 16k context window',
    'gpt-3.5-turbo-instruct': 'Instruction-following version of GPT-3.5',
    'gpt-3.5-turbo-0613': 'GPT-3.5 Turbo with June 2023 training',
    'gpt-3.5-turbo-16k-0613': 'GPT-3.5 Turbo 16k with June 2023 training',
    
    // Legacy Models
    'text-davinci-003': 'Most capable text completion model (legacy)',
    'text-davinci-002': 'Text completion model (legacy)',
    'text-curie-001': 'Fast and capable for many tasks (legacy)',
    'text-babbage-001': 'Simple tasks, faster and lower cost (legacy)',
    'text-ada-001': 'Simple tasks, very fast and low cost (legacy)'
  };
  
  // If no exact match, try to provide a smart description based on model name
  if (!descriptions[modelId]) {
    if (modelId.includes('gpt-4')) {
      return 'GPT-4 model for complex reasoning and analysis';
    } else if (modelId.includes('gpt-3.5')) {
      return 'GPT-3.5 model for general conversational tasks';
    } else if (modelId.includes('davinci')) {
      return 'Text completion model with high capability';
    } else if (modelId.includes('curie')) {
      return 'Balanced model for various tasks';
    } else if (modelId.includes('babbage')) {
      return 'Fast model for straightforward tasks';
    } else if (modelId.includes('ada')) {
      return 'Simple and fast model for basic tasks';
    }
  }
  
  return descriptions[modelId] || 'AI language model';
};

app.get('/api/prompts', (req, res) => {
  try {
    const promptsDir = path.join(__dirname, 'test-project', 'easyai', 'prompts');
    
    if (!fs.existsSync(promptsDir)) {
      console.log('Prompts directory not found:', promptsDir);
      return res.json([]);
    }
    
    const prompts = [];
    const categories = fs.readdirSync(promptsDir);
    
    categories.forEach(category => {
      const categoryPath = path.join(promptsDir, category);
      if (fs.statSync(categoryPath).isDirectory()) {
        const files = fs.readdirSync(categoryPath);
        
        files.forEach(file => {
          if (file.endsWith('.md')) {
            const filePath = path.join(categoryPath, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const name = file.replace('.md', '');
            
            // Parse front matter or extract description
            const lines = content.split('\n');
            let description = '';
            let model = 'gpt-4';
            
            // Look for description in content
            const descIndex = lines.findIndex(line => line.toLowerCase().includes('description'));
            if (descIndex !== -1 && lines[descIndex + 1]) {
              description = lines[descIndex + 1].trim();
            }
            
            // Look for model in content
            const modelIndex = lines.findIndex(line => line.toLowerCase().includes('model'));
            if (modelIndex !== -1 && lines[modelIndex + 1]) {
              model = lines[modelIndex + 1].trim();
            }
            
            prompts.push({
              name,
              description: description || `${name} prompt`,
              category,
              model,
              content: content.substring(0, 200) + (content.length > 200 ? '...' : '')
            });
          }
        });
      }
    });
    
    res.json(prompts);
  } catch (error) {
    console.error('Error reading prompts:', error);
    res.json([]);
  }
});

// Playground API - Test prompts with different models
app.post('/api/playground/test', async (req, res) => {
  const { prompt, model, variables } = req.body;
  const startTime = Date.now();
  
  try {
    // Reload config to get latest API keys
    const currentConfig = loadEnvConfig();
    
    let response;
    let tokens;
    let cost;
    
    // Get available models to check provider
    const modelProviderMap = new Map();
    // This is a simplified check - in a real app you'd cache this
    if (currentConfig.OLLAMA_BASE_URL) {
      try {
        const axios = require('axios');
        const ollamaModels = await axios.get(`${currentConfig.OLLAMA_BASE_URL}/api/tags`, { timeout: 3000 });
        ollamaModels.data.models?.forEach(m => {
          modelProviderMap.set(m.name, 'Ollama');
        });
      } catch (e) {
        // Ollama not available, ignore
      }
    }
    
    // Check if it's an OpenRouter model (contains slash like "anthropic/claude-3" or "openai/gpt-4")
    if (model.includes('/') && currentConfig.OPENROUTER_API_KEY && currentConfig.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here') {
      // OpenRouter API call
      try {
        const axios = require('axios');
        const openRouterResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
          model: model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000
        }, {
          headers: {
            'Authorization': `Bearer ${currentConfig.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'http://localhost:5172',
            'X-Title': 'EasyAI',
            'Content-Type': 'application/json'
          }
        });
        
        response = openRouterResponse.data.choices[0].message.content;
        tokens = openRouterResponse.data.usage?.total_tokens;
        
        // OpenRouter pricing calculation (rough estimate)
        if (tokens) {
          if (model.includes('gpt-4')) {
            cost = tokens * 0.00003;
          } else if (model.includes('gpt-3.5')) {
            cost = tokens * 0.000002;
          } else if (model.includes('claude')) {
            cost = tokens * 0.00002;
          } else {
            cost = tokens * 0.00001; // Generic estimate
          }
        }
        
      } catch (error) {
        if (error.response?.status === 401) {
          throw new Error('Invalid OpenRouter API key. Please check your API key in Settings.');
        }
        if (error.response?.status === 402) {
          throw new Error('OpenRouter account has insufficient credits. Please add credits to your account.');
        }
        throw new Error(error.response?.data?.error?.message || error.message);
      }
      
    } else if (model.includes('gpt') && !model.includes('/')) {
      if (!currentConfig.OPENAI_API_KEY || currentConfig.OPENAI_API_KEY === 'your_openai_api_key_here') {
        throw new Error('OpenAI API key not configured. Please add your API key in Settings.');
      }
      
      // Real OpenAI API call
      try {
        const OpenAI = require('openai');
        const openai = new OpenAI({
          apiKey: currentConfig.OPENAI_API_KEY
        });
        
        const completion = await openai.chat.completions.create({
          model: model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000
        });
        
        response = completion.choices[0].message.content;
        tokens = completion.usage.total_tokens;
        cost = tokens * 0.00003; // Rough estimate
        
      } catch (error) {
        if (error.status === 401) {
          throw new Error('Invalid OpenAI API key. Please check your API key in Settings.');
        }
        throw error;
      }
      
    } else if (model.includes('claude') && !model.includes('/')) {
      if (!currentConfig.ANTHROPIC_API_KEY || currentConfig.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
        throw new Error('Anthropic API key not configured. Please add your API key in Settings.');
      }
      
      // Real Anthropic API call  
      try {
        const Anthropic = require('@anthropic-ai/sdk');
        const anthropic = new Anthropic({
          apiKey: currentConfig.ANTHROPIC_API_KEY
        });
        
        const message = await anthropic.messages.create({
          model: model,
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        });
        
        response = message.content[0].text;
        tokens = message.usage.input_tokens + message.usage.output_tokens;
        cost = tokens * 0.00002; // Rough estimate
        
      } catch (error) {
        if (error.status === 401) {
          throw new Error('Invalid Anthropic API key. Please check your API key in Settings.');
        }
        throw error;
      }
    } else if (model.includes('gemini')) {
      if (!currentConfig.GEMINI_API_KEY || currentConfig.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        throw new Error('Google Gemini API key not configured. Please add your API key in Settings.');
      }
      
      // Google Gemini API call
      try {
        const axios = require('axios');
        const geminiResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${currentConfig.GEMINI_API_KEY}`,
          {
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              maxOutputTokens: 1000,
              temperature: 0.7
            }
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        response = geminiResponse.data.candidates[0].content.parts[0].text;
        tokens = geminiResponse.data.usageMetadata?.totalTokenCount;
        cost = tokens ? tokens * 0.000001 : 0; // Rough estimate for Gemini pricing
        
      } catch (error) {
        if (error.response?.status === 400) {
          throw new Error('Invalid request to Gemini API. Please check your model name and API key.');
        }
        if (error.response?.status === 403) {
          throw new Error('Invalid Gemini API key. Please check your API key in Settings.');
        }
        throw new Error(error.response?.data?.error?.message || error.message);
      }
      
    } else if (modelProviderMap.get(model) === 'Ollama') {
      if (!currentConfig.OLLAMA_BASE_URL) {
        throw new Error('Ollama base URL not configured. Please configure Ollama in Settings.');
      }
      
      // Ollama API call
      try {
        const axios = require('axios');
        const ollamaResponse = await axios.post(`${currentConfig.OLLAMA_BASE_URL}/api/generate`, {
          model: model,
          prompt: prompt,
          stream: false,
          options: {
            num_predict: 1000,
            temperature: 0.7
          }
        }, {
          timeout: 60000 // 60 second timeout for Ollama
        });
        
        response = ollamaResponse.data.response;
        tokens = ollamaResponse.data.eval_count + ollamaResponse.data.prompt_eval_count;
        cost = 0; // Ollama is local, no cost
        
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Cannot connect to Ollama. Please make sure Ollama is running locally.');
        }
        if (error.response?.status === 404) {
          throw new Error(`Model '${model}' not found in Ollama. Please pull the model first: ollama pull ${model}`);
        }
        throw new Error(error.response?.data?.error || error.message);
      }
      
    } else {
      throw new Error(`Unsupported model: ${model}. Please ensure you have the correct API key configured and the model is available.`);
    }
    
    const duration = Date.now() - startTime;
    
    // Log the successful request with full details
    logRequest({
      // Basic info for display
      prompt: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
      model,
      tokens,
      cost,
      duration,
      success: true,
      response: response.substring(0, 200) + (response.length > 200 ? '...' : ''),
      
      // Detailed info for file logging
      endpoint: '/api/playground/test',
      method: 'POST',
      request: {
        fullPrompt: prompt,
        model: model,
        variables: variables || {},
        timestamp: new Date().toISOString(),
        promptLength: prompt.length,
        variableCount: Object.keys(variables || {}).length
      },
      response_full: {
        content: response,
        tokens: tokens,
        cost: cost,
        duration: duration,
        success: true,
        responseLength: response.length,
        tokensPerSecond: tokens ? Math.round((tokens / duration) * 1000) : 0
      },
      performance: {
        startTime: startTime,
        endTime: Date.now(),
        duration: duration,
        tokensPerSecond: tokens ? Math.round((tokens / duration) * 1000) : 0
      },
      provider: model.includes('/') ? 'OpenRouter' : 
               model.includes('gpt') ? 'OpenAI' :
               model.includes('claude') ? 'Anthropic' :
               model.includes('gemini') ? 'Google' : 'Ollama',
      api_call: {
        provider_endpoint: model.includes('/') ? 'https://openrouter.ai/api/v1/chat/completions' :
                          model.includes('gpt') ? 'https://api.openai.com/v1/chat/completions' :
                          model.includes('claude') ? 'https://api.anthropic.com/v1/messages' :
                          model.includes('gemini') ? `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent` :
                          `${currentConfig.OLLAMA_BASE_URL}/api/generate`,
        method: 'POST',
        headers_sent: {
          'Content-Type': 'application/json',
          'Authorization': model.includes('/') ? 'Bearer OpenRouter-Key' :
                          model.includes('gpt') ? 'Bearer OpenAI-Key' :
                          model.includes('claude') ? 'x-api-key: Anthropic-Key' :
                          model.includes('gemini') ? 'API-Key: Gemini-Key' : 'None',
          'User-Agent': 'EasyAI/1.0'
        },
        payload_sent: {
          model: model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000
        }
      },
      // Legacy field for backward compatibility
      api_endpoint: model.includes('/') ? 'https://openrouter.ai/api/v1/chat/completions' :
                   model.includes('gpt') ? 'https://api.openai.com/v1/chat/completions' :
                   model.includes('claude') ? 'https://api.anthropic.com/v1/messages' :
                   model.includes('gemini') ? `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent` :
                   `${currentConfig.OLLAMA_BASE_URL}/api/generate`,
      client_info: {
        user_agent: req.get('User-Agent'),
        ip_address: req.ip || req.connection.remoteAddress,
        session_id: req.sessionID || 'unknown',
        referer: req.get('Referer') || 'direct'
      },
      request_flow: {
        client_to_easyai: '/api/playground/test',
        easyai_to_provider: model.includes('/') ? 'https://openrouter.ai/api/v1/chat/completions' :
                           model.includes('gpt') ? 'https://api.openai.com/v1/chat/completions' :
                           model.includes('claude') ? 'https://api.anthropic.com/v1/messages' :
                           model.includes('gemini') ? `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent` :
                           `${currentConfig.OLLAMA_BASE_URL}/api/generate`,
        total_hops: model.includes('/') ? 3 : 2 // Client -> EasyAI -> [OpenRouter] -> Provider
      }
    });
    
    res.json({
      success: true,
      response,
      tokens,
      cost,
      duration
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log the failed request with full details
    logRequest({
      // Basic info for display
      prompt: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
      model,
      tokens: 0,
      cost: 0,
      duration,
      success: false,
      response: `Error: ${error.message}`,
      
      // Detailed info for file logging
      endpoint: '/api/playground/test',
      method: 'POST',
      request: {
        fullPrompt: prompt,
        model: model,
        variables: variables || {},
        timestamp: new Date().toISOString(),
        promptLength: prompt.length,
        variableCount: Object.keys(variables || {}).length
      },
      response_full: {
        error: error.message,
        stack: error.stack,
        duration: duration,
        success: false,
        errorType: error.name || 'Error'
      },
      performance: {
        startTime: startTime,
        endTime: Date.now(),
        duration: duration,
        failed: true
      },
      provider: model.includes('/') ? 'OpenRouter' : 
               model.includes('gpt') ? 'OpenAI' :
               model.includes('claude') ? 'Anthropic' :
               model.includes('gemini') ? 'Google' : 'Ollama',
      api_call: {
        provider_endpoint: model.includes('/') ? 'https://openrouter.ai/api/v1/chat/completions' :
                          model.includes('gpt') ? 'https://api.openai.com/v1/chat/completions' :
                          model.includes('claude') ? 'https://api.anthropic.com/v1/messages' :
                          model.includes('gemini') ? `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent` :
                          `${currentConfig.OLLAMA_BASE_URL}/api/generate`,
        method: 'POST',
        headers_sent: {
          'Content-Type': 'application/json',
          'Authorization': model.includes('/') ? 'Bearer OpenRouter-Key' :
                          model.includes('gpt') ? 'Bearer OpenAI-Key' :
                          model.includes('claude') ? 'x-api-key: Anthropic-Key' :
                          model.includes('gemini') ? 'API-Key: Gemini-Key' : 'None',
          'User-Agent': 'EasyAI/1.0'
        },
        attempted_payload: {
          model: model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000
        }
      },
      // Legacy field for backward compatibility
      api_endpoint: model.includes('/') ? 'https://openrouter.ai/api/v1/chat/completions' :
                   model.includes('gpt') ? 'https://api.openai.com/v1/chat/completions' :
                   model.includes('claude') ? 'https://api.anthropic.com/v1/messages' :
                   model.includes('gemini') ? `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent` :
                   `${currentConfig.OLLAMA_BASE_URL}/api/generate`,
      client_info: {
        user_agent: req.get('User-Agent'),
        ip_address: req.ip || req.connection.remoteAddress,
        session_id: req.sessionID || 'unknown',
        referer: req.get('Referer') || 'direct'
      },
      request_flow: {
        client_to_easyai: '/api/playground/test',
        easyai_to_provider: model.includes('/') ? 'https://openrouter.ai/api/v1/chat/completions' :
                           model.includes('gpt') ? 'https://api.openai.com/v1/chat/completions' :
                           model.includes('claude') ? 'https://api.anthropic.com/v1/messages' :
                           model.includes('gemini') ? `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent` :
                           `${currentConfig.OLLAMA_BASE_URL}/api/generate`,
        total_hops: model.includes('/') ? 3 : 2,
        failed_at: 'provider_api_call'
      }
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
      tokens: 0,
      cost: 0,
      duration
    });
  }
});

// Save configuration to easyai.env
app.post('/api/config/save', (req, res) => {
  try {
    const { env } = req.body;
    const envPath = path.join(__dirname, 'easyai.env');
    
    // Helper function to preserve existing API keys when placeholders are submitted
    const preserveApiKey = (newValue, currentValue, defaultValue) => {
      // If new value is empty, placeholder, or undefined, keep current value
      if (!newValue || newValue === '***configured***' || newValue.trim() === '') {
        return currentValue || defaultValue;
      }
      // Otherwise use the new value
      return newValue;
    };
    
    // Create new env content, preserving existing API keys when placeholders are sent
    let envContent = '# API Keys for LLM Models\n';
    envContent += `OPENAI_API_KEY=${preserveApiKey(env.OPENAI_API_KEY, config.OPENAI_API_KEY, 'your_openai_api_key_here')}\n`;
    envContent += `ANTHROPIC_API_KEY=${preserveApiKey(env.ANTHROPIC_API_KEY, config.ANTHROPIC_API_KEY, 'your_anthropic_api_key_here')}\n`;
    envContent += `GEMINI_API_KEY=${preserveApiKey(env.GEMINI_API_KEY, config.GEMINI_API_KEY, 'your_gemini_api_key_here')}\n`;
    envContent += `OPENROUTER_API_KEY=${preserveApiKey(env.OPENROUTER_API_KEY, config.OPENROUTER_API_KEY, 'your_openrouter_api_key_here')}\n`;
    envContent += `OLLAMA_BASE_URL=${env.OLLAMA_BASE_URL !== undefined ? env.OLLAMA_BASE_URL : (config.OLLAMA_BASE_URL || '')}\n`;
    envContent += '\n# EasyAI Configuration\n';
    envContent += `EASYAI_PORT=${env.EASYAI_PORT !== undefined ? env.EASYAI_PORT : (config.EASYAI_PORT || '5173')}\n`;
    envContent += `EASYAI_LOG_LEVEL=${env.EASYAI_LOG_LEVEL !== undefined ? env.EASYAI_LOG_LEVEL : (config.EASYAI_LOG_LEVEL || 'info')}\n`;
    
    // Write to file
    fs.writeFileSync(envPath, envContent, 'utf8');
    
    // Update runtime config with preserved values
    const updatedConfig = {
      OPENAI_API_KEY: preserveApiKey(env.OPENAI_API_KEY, config.OPENAI_API_KEY, config.OPENAI_API_KEY),
      ANTHROPIC_API_KEY: preserveApiKey(env.ANTHROPIC_API_KEY, config.ANTHROPIC_API_KEY, config.ANTHROPIC_API_KEY),
      GEMINI_API_KEY: preserveApiKey(env.GEMINI_API_KEY, config.GEMINI_API_KEY, config.GEMINI_API_KEY),
      OPENROUTER_API_KEY: preserveApiKey(env.OPENROUTER_API_KEY, config.OPENROUTER_API_KEY, config.OPENROUTER_API_KEY),
      OLLAMA_BASE_URL: env.OLLAMA_BASE_URL !== undefined ? env.OLLAMA_BASE_URL : config.OLLAMA_BASE_URL,
      EASYAI_PORT: env.EASYAI_PORT !== undefined ? env.EASYAI_PORT : config.EASYAI_PORT,
      EASYAI_LOG_LEVEL: env.EASYAI_LOG_LEVEL !== undefined ? env.EASYAI_LOG_LEVEL : config.EASYAI_LOG_LEVEL
    };
    Object.assign(config, updatedConfig);
    
    // Log updated status
    console.log('🔄 Configuration updated:', {
      OPENAI_API_KEY: config.OPENAI_API_KEY ? `${config.OPENAI_API_KEY.slice(0, 10)}...` : 'NOT SET',
      ANTHROPIC_API_KEY: config.ANTHROPIC_API_KEY ? `${config.ANTHROPIC_API_KEY.slice(0, 10)}...` : 'NOT SET',
      GEMINI_API_KEY: config.GEMINI_API_KEY ? `${config.GEMINI_API_KEY.slice(0, 10)}...` : 'NOT SET',
      OPENROUTER_API_KEY: config.OPENROUTER_API_KEY ? `${config.OPENROUTER_API_KEY.slice(0, 10)}...` : 'NOT SET',
      OLLAMA_BASE_URL: config.OLLAMA_BASE_URL || 'NOT SET'
    });
    
    res.json({ success: true, message: 'Configuration saved successfully' });
  } catch (error) {
    console.error('Failed to save config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get configuration
app.get('/api/config', (req, res) => {
  const safeConfig = {
    config: {
      ui: {
        theme: 'light',
        defaultModel: config.OPENAI_MODEL || 'gpt-4',
        autoSave: true
      },
      logging: {
        enabled: true,
        includeResponses: true,
        retention: '30d'
      }
    },
    env: {
      OPENAI_API_KEY: config.OPENAI_API_KEY && config.OPENAI_API_KEY !== 'your_openai_api_key_here' && config.OPENAI_API_KEY.trim() ? '***configured***' : '',
      ANTHROPIC_API_KEY: config.ANTHROPIC_API_KEY && config.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here' && config.ANTHROPIC_API_KEY.trim() ? '***configured***' : '',
      GEMINI_API_KEY: config.GEMINI_API_KEY && config.GEMINI_API_KEY !== 'your_gemini_api_key_here' && config.GEMINI_API_KEY.trim() ? '***configured***' : '',
      OPENROUTER_API_KEY: config.OPENROUTER_API_KEY && config.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here' && config.OPENROUTER_API_KEY.trim() ? '***configured***' : '',
      OLLAMA_BASE_URL: config.OLLAMA_BASE_URL || '',
      OPENAI_MODEL: config.OPENAI_MODEL || 'gpt-4',
      ANTHROPIC_MODEL: config.ANTHROPIC_MODEL || 'claude-3-sonnet',
      EASYAI_PORT: config.EASYAI_PORT || '5173',
      EASYAI_LOG_LEVEL: config.EASYAI_LOG_LEVEL || 'info'
    }
  };
  
  res.json(safeConfig);
});

// Health check
app.get('/api/health', (req, res) => {
  const configStatus = {
    openai: !!(config.OPENAI_API_KEY && config.OPENAI_API_KEY !== 'your_openai_api_key_here'),
    anthropic: !!(config.ANTHROPIC_API_KEY && config.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here'),
    gemini: !!(config.GEMINI_API_KEY && config.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
    openrouter: !!(config.OPENROUTER_API_KEY && config.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here'),
    ollama: !!(config.OLLAMA_BASE_URL && config.OLLAMA_BASE_URL !== 'http://localhost:11434')
  };
  
  res.json({
    status: 'ok',
    config: configStatus,
    timestamp: new Date().toISOString()
  });
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/dashboard/index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`🚀 EasyAI Backend Server running on http://localhost:${port}`);
  console.log(`📁 Environment config loaded from: ${path.join(__dirname, 'easyai.env')}`);
  
  const configStatus = {
    openai: !!(config.OPENAI_API_KEY && config.OPENAI_API_KEY !== 'your_openai_api_key_here'),
    anthropic: !!(config.ANTHROPIC_API_KEY && config.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here'),
    gemini: !!(config.GEMINI_API_KEY && config.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
    openrouter: !!(config.OPENROUTER_API_KEY && config.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here'),
    ollama: !!(config.OLLAMA_BASE_URL && config.OLLAMA_BASE_URL !== 'http://localhost:11434')
  };
  
  console.log('🔑 API Keys Status:');
  console.log(`   OpenAI: ${configStatus.openai ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Anthropic: ${configStatus.anthropic ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Google Gemini: ${configStatus.gemini ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   OpenRouter: ${configStatus.openrouter ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Ollama: ${configStatus.ollama ? '✅ Configured' : '❌ Missing (using default: http://localhost:11434)'}`);
  
  if (!configStatus.openai && !configStatus.anthropic && !configStatus.gemini && !configStatus.openrouter && !configStatus.ollama) {
    console.log('⚠️  Please add your API keys to easyai.env file');
  }
});

// Initialize with some mock logs
if (!global.logs) {
  global.logs = [
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      prompt: 'Explain quantum computing',
      model: 'gpt-4',
      tokens: 324,
      cost: 0.0097,
      duration: 1250,
      success: true,
      response: 'Quantum computing is a revolutionary...'
    },
    {
      timestamp: new Date(Date.now() - 120000).toISOString(),
      prompt: 'Review this React code',
      model: 'claude-3-sonnet',
      tokens: 156,
      cost: 0.0023,
      duration: 890,
      success: true,
      response: 'This React component looks good overall...'
    },
    {
      timestamp: new Date(Date.now() - 180000).toISOString(),
      prompt: 'Debug Python error',
      model: 'gpt-4',
      tokens: 0,
      cost: 0,
      duration: 500,
      success: false,
      response: 'Error: API rate limit exceeded'
    }
  ];
}