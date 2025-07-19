const axios = require('axios');
const { API_ENDPOINTS } = require('../../../config/constants');

class OpenAIProvider {
  constructor() {
    this.baseURL = API_ENDPOINTS.OPENAI;
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  async complete(prompt, model, options = {}) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const requestData = {
      model: model,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1000,
      top_p: options.top_p || 1,
      frequency_penalty: options.frequency_penalty || 0,
      presence_penalty: options.presence_penalty || 0
    };

    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, requestData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const choice = response.data.choices[0];
      const usage = response.data.usage;

      return {
        content: choice.message.content,
        model_used: model,
        tokens_used: usage.total_tokens,
        input_tokens: usage.prompt_tokens,
        output_tokens: usage.completion_tokens,
        finish_reason: choice.finish_reason,
        provider: 'openai'
      };
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('OpenAI rate limit exceeded');
      }
      if (error.response?.status === 401) {
        throw new Error('OpenAI authentication failed');
      }
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async getModels() {
    return [
      { name: 'gpt-3.5-turbo', cost_per_input_token: 0.0000015, cost_per_output_token: 0.000002 },
      { name: 'gpt-4', cost_per_input_token: 0.00003, cost_per_output_token: 0.00006 },
      { name: 'gpt-4-turbo', cost_per_input_token: 0.00001, cost_per_output_token: 0.00003 },
      { name: 'gpt-4o', cost_per_input_token: 0.000005, cost_per_output_token: 0.000015 },
      { name: 'gpt-4o-mini', cost_per_input_token: 0.00000015, cost_per_output_token: 0.0000006 }
    ];
  }

  async healthCheck() {
    if (!this.apiKey) return false;
    
    try {
      await axios.get(`${this.baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        timeout: 5000
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = { OpenAIProvider };