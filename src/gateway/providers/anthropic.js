const axios = require('axios');

class AnthropicProvider {
  constructor() {
    this.baseURL = 'https://api.anthropic.com/v1';
    this.apiKey = process.env.ANTHROPIC_API_KEY;
  }

  async complete(prompt, model, options = {}) {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const requestData = {
      model: model,
      max_tokens: options.max_tokens || 1000,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: options.temperature || 0.7,
      top_p: options.top_p || 1,
      top_k: options.top_k || 40
    };

    try {
      const response = await axios.post(`${this.baseURL}/messages`, requestData, {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const usage = response.data.usage;

      return {
        content: response.data.content[0].text,
        model_used: model,
        tokens_used: usage.input_tokens + usage.output_tokens,
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        finish_reason: response.data.stop_reason,
        provider: 'anthropic'
      };
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('Anthropic rate limit exceeded');
      }
      if (error.response?.status === 401) {
        throw new Error('Anthropic authentication failed');
      }
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }

  async getModels() {
    return [
      { name: 'claude-3-haiku', cost_per_input_token: 0.00000025, cost_per_output_token: 0.00000125 },
      { name: 'claude-3-sonnet', cost_per_input_token: 0.000003, cost_per_output_token: 0.000015 },
      { name: 'claude-3-opus', cost_per_input_token: 0.000015, cost_per_output_token: 0.000075 },
      { name: 'claude-3-5-sonnet', cost_per_input_token: 0.000003, cost_per_output_token: 0.000015 }
    ];
  }

  async healthCheck() {
    if (!this.apiKey) return false;
    
    try {
      // Simple health check by making a minimal request
      await axios.post(`${this.baseURL}/messages`, {
        model: 'claude-3-haiku',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }]
      }, {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = { AnthropicProvider };