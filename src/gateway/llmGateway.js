const axios = require('axios');
const { OpenAIProvider } = require('./providers/openai');
const { AnthropicProvider } = require('./providers/anthropic');
const { GoogleProvider } = require('./providers/google');
const { DeepSeekProvider } = require('./providers/deepseek');

class LLMGateway {
  constructor() {
    this.providers = {
      openai: new OpenAIProvider(),
      anthropic: new AnthropicProvider(),
      google: new GoogleProvider(),
      deepseek: new DeepSeekProvider()
    };
  }

  async complete({ prompt, model, options = {}, fallbacks = [] }) {
    const provider = this.getProviderForModel(model);
    
    if (!provider) {
      throw new Error(`No provider found for model: ${model}`);
    }

    try {
      const response = await provider.complete(prompt, model, options);
      return response;
    } catch (error) {
      console.error(`Primary model ${model} failed:`, error.message);
      
      // Try fallback models
      for (const fallbackModel of fallbacks) {
        try {
          const fallbackProvider = this.getProviderForModel(fallbackModel);
          if (fallbackProvider) {
            console.log(`Trying fallback model: ${fallbackModel}`);
            const response = await fallbackProvider.complete(prompt, fallbackModel, options);
            return response;
          }
        } catch (fallbackError) {
          console.error(`Fallback model ${fallbackModel} failed:`, fallbackError.message);
        }
      }

      // If all fallbacks fail, throw the original error
      throw error;
    }
  }

  getProviderForModel(model) {
    const modelMappings = {
      'gpt-3.5-turbo': 'openai',
      'gpt-4': 'openai',
      'gpt-4-turbo': 'openai',
      'gpt-4o': 'openai',
      'gpt-4o-mini': 'openai',
      'claude-3-haiku': 'anthropic',
      'claude-3-sonnet': 'anthropic',
      'claude-3-opus': 'anthropic',
      'claude-3-5-sonnet': 'anthropic',
      'gemini-pro': 'google',
      'gemini-1.5-pro': 'google',
      'gemini-1.5-flash': 'google',
      'deepseek-chat': 'deepseek',
      'deepseek-coder': 'deepseek'
    };

    const providerName = modelMappings[model];
    return this.providers[providerName];
  }

  async getAvailableModels() {
    const models = [];
    
    for (const [providerName, provider] of Object.entries(this.providers)) {
      try {
        const providerModels = await provider.getModels();
        models.push(...providerModels.map(model => ({
          ...model,
          provider: providerName
        })));
      } catch (error) {
        console.error(`Failed to get models from ${providerName}:`, error.message);
      }
    }

    return models;
  }

  async checkProviderHealth() {
    const health = {};
    
    for (const [providerName, provider] of Object.entries(this.providers)) {
      try {
        const isHealthy = await provider.healthCheck();
        health[providerName] = { status: isHealthy ? 'healthy' : 'unhealthy' };
      } catch (error) {
        health[providerName] = { status: 'error', error: error.message };
      }
    }

    return health;
  }
}

module.exports = {
  llmGateway: new LLMGateway()
};