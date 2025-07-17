const axios = require('axios');
const fs = require('fs');
const path = require('path');

class EasyAI {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.EASYAI_API_KEY;
    this.baseUrl = options.baseUrl || process.env.EASYAI_BASE_URL || 'http://localhost:3000';
    this.timeout = options.timeout || 30000;
    this.userId = options.userId || process.env.EASYAI_USER_ID;
    
    if (!this.apiKey) {
      throw new Error('EASYAI_API_KEY is required. Get one from https://easy-ai.dev');
    }
  }

  // Main completion method using prompts
  async complete(options) {
    const {
      promptId,
      parameters = {},
      model,
      options: modelOptions = {},
      environment = 'development'
    } = options;

    if (!promptId) {
      throw new Error('promptId is required');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/gateway/v1/completions`,
        {
          prompt_id: promptId,
          parameters,
          model,
          options: modelOptions,
          environment
        },
        {
          headers: this.getHeaders(),
          timeout: this.timeout
        }
      );

      return new EasyAIResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Direct completion without prompts
  async completeDirect(options) {
    const {
      prompt,
      model = 'gpt-4o-mini',
      options: modelOptions = {}
    } = options;

    if (!prompt) {
      throw new Error('prompt is required');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/gateway/v1/completions/direct`,
        {
          prompt,
          model,
          options: modelOptions
        },
        {
          headers: this.getHeaders(),
          timeout: this.timeout
        }
      );

      return new EasyAIResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Prompt management
  async createPrompt(promptData) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/prompts`,
        promptData,
        {
          headers: this.getHeaders()
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPrompt(promptId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/prompts/${promptId}`,
        {
          headers: this.getHeaders()
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listPrompts(options = {}) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/prompts`,
        {
          headers: this.getHeaders(),
          params: options
        }
      );

      return response.data.prompts;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updatePrompt(promptId, updates) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/api/prompts/${promptId}`,
        updates,
        {
          headers: this.getHeaders()
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deletePrompt(promptId) {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/api/prompts/${promptId}`,
        {
          headers: this.getHeaders()
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Model management
  async getModels() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/gateway/v1/models`,
        {
          headers: this.getHeaders()
        }
      );

      return response.data.models;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Analytics
  async getAnalytics(days = 30) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/analytics`,
        {
          headers: this.getHeaders(),
          params: { days }
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // API key management
  async createApiKey(keyData) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/api-keys`,
        keyData,
        {
          headers: this.getHeaders()
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listApiKeys() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/api-keys`,
        {
          headers: this.getHeaders()
        }
      );

      return response.data.api_keys;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Local configuration management
  async uploadPrompts(filePath, mergeMode = 'update') {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const prompts = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let importedCount = 0;

    for (const prompt of prompts) {
      try {
        if (mergeMode === 'replace') {
          await this.updatePrompt(prompt.prompt_id, prompt);
        } else {
          await this.createPrompt(prompt);
        }
        importedCount++;
      } catch (error) {
        if (mergeMode === 'update' && error.response?.status === 409) {
          await this.updatePrompt(prompt.prompt_id, prompt);
          importedCount++;
        } else {
          console.warn(`Failed to import prompt ${prompt.prompt_id}: ${error.message}`);
        }
      }
    }

    return { imported_count: importedCount };
  }

  async downloadPrompts(filePath, formatStyle = 'easyai') {
    const prompts = await this.listPrompts();
    
    let exportData;
    if (formatStyle === 'raw') {
      exportData = prompts;
    } else {
      exportData = prompts.map(prompt => ({
        name: prompt.name,
        prompt_id: prompt.prompt_id,
        description: prompt.description,
        category: prompt.category,
        template: prompt.template,
        parameters: prompt.parameters,
        model: prompt.model_config.primary,
        options: prompt.options
      }));
    }

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
    return { exported_count: exportData.length };
  }

  // Health check
  async healthCheck() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/health`,
        {
          headers: this.getHeaders(),
          timeout: 5000
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Private methods
  getHeaders() {
    return {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': 'EasyAI-SDK/1.0.0'
    };
  }

  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        throw new EasyAIError('Authentication failed. Check your API key.', 'AUTH_ERROR');
      } else if (status === 403) {
        throw new EasyAIError('Insufficient permissions.', 'PERMISSION_ERROR');
      } else if (status === 404) {
        throw new EasyAIError('Resource not found.', 'NOT_FOUND');
      } else if (status === 429) {
        throw new EasyAIError('Rate limit exceeded.', 'RATE_LIMIT');
      } else if (status >= 500) {
        throw new EasyAIError('Server error. Please try again later.', 'SERVER_ERROR');
      } else {
        throw new EasyAIError(data.error || 'Request failed', 'REQUEST_ERROR');
      }
    } else if (error.code === 'ECONNREFUSED') {
      throw new EasyAIError('Connection refused. Is the EasyAI server running?', 'CONNECTION_ERROR');
    } else {
      throw new EasyAIError(error.message, 'UNKNOWN_ERROR');
    }
  }
}

class EasyAIResponse {
  constructor(data) {
    this.id = data.id;
    this.content = data.content;
    this.model = data.model;
    this.tokensUsed = data.tokens_used;
    this.cost = data.cost;
    this.durationMs = data.duration_ms;
    this.promptId = data.prompt_id;
    this.environment = data.environment;
    this.metadata = data.metadata || {};
  }
}

class EasyAIError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'EasyAIError';
    this.code = code;
  }
}

module.exports = {
  EasyAI,
  EasyAIResponse,
  EasyAIError
};