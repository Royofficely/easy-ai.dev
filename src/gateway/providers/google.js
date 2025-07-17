const axios = require('axios');

class GoogleProvider {
  constructor() {
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
    this.apiKey = process.env.GOOGLE_API_KEY;
  }

  async complete(prompt, model, options = {}) {
    if (!this.apiKey) {
      throw new Error('Google API key not configured');
    }

    const requestData = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: options.temperature || 0.7,
        topK: options.top_k || 40,
        topP: options.top_p || 1,
        maxOutputTokens: options.max_tokens || 1000,
      }
    };

    try {
      const response = await axios.post(
        `${this.baseURL}/models/${model}:generateContent?key=${this.apiKey}`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const candidate = response.data.candidates[0];
      const usage = response.data.usageMetadata;

      return {
        content: candidate.content.parts[0].text,
        model_used: model,
        tokens_used: usage.totalTokenCount,
        input_tokens: usage.promptTokenCount,
        output_tokens: usage.candidatesTokenCount,
        finish_reason: candidate.finishReason,
        provider: 'google'
      };
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('Google rate limit exceeded');
      }
      if (error.response?.status === 401) {
        throw new Error('Google authentication failed');
      }
      throw new Error(`Google API error: ${error.message}`);
    }
  }

  async getModels() {
    return [
      { name: 'gemini-pro', cost_per_input_token: 0.0000005, cost_per_output_token: 0.0000015 },
      { name: 'gemini-1.5-pro', cost_per_input_token: 0.00000125, cost_per_output_token: 0.00000375 },
      { name: 'gemini-1.5-flash', cost_per_input_token: 0.000000075, cost_per_output_token: 0.0000003 }
    ];
  }

  async healthCheck() {
    if (!this.apiKey) return false;
    
    try {
      await axios.get(`${this.baseURL}/models?key=${this.apiKey}`, {
        timeout: 5000
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = { GoogleProvider };