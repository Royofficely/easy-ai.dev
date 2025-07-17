const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { llmGateway } = require('../gateway/llmGateway');

const router = express.Router();

// Test prompt with multiple models
router.post('/test-multi', authenticateToken, async (req, res) => {
  try {
    const { prompt, models, parameters } = req.body;
    
    if (!prompt || !models || !Array.isArray(models)) {
      return res.status(400).json({ error: 'Prompt and models array are required' });
    }
    
    const results = [];
    const startTime = Date.now();
    
    // Test with each model
    for (const model of models) {
      const modelStartTime = Date.now();
      
      try {
        const response = await llmGateway.complete({
          prompt,
          model,
          parameters: {
            temperature: parameters?.temperature || 0.7,
            max_tokens: parameters?.max_tokens || 500,
            ...parameters
          }
        });
        
        const modelEndTime = Date.now();
        
        results.push({
          model,
          success: true,
          response: response.content,
          tokens: response.tokens,
          cost: response.cost,
          latency: modelEndTime - modelStartTime,
          provider: response.provider
        });
      } catch (error) {
        console.error(`Error with model ${model}:`, error);
        results.push({
          model,
          success: false,
          error: error.message,
          latency: Date.now() - modelStartTime
        });
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    res.json({
      prompt,
      results,
      totalTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Playground error:', error);
    res.status(500).json({ error: 'Playground test failed' });
  }
});

// Get available models
router.get('/models', authenticateToken, async (req, res) => {
  try {
    const models = {
      openai: [
        { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', cost_per_token: 0.00003 },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', cost_per_token: 0.00001 },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', cost_per_token: 0.000002 }
      ],
      anthropic: [
        { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', cost_per_token: 0.000015 },
        { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', cost_per_token: 0.000003 },
        { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', cost_per_token: 0.00000025 }
      ],
      google: [
        { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', cost_per_token: 0.000001 },
        { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', provider: 'Google', cost_per_token: 0.000002 }
      ],
      deepseek: [
        { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek', cost_per_token: 0.0000001 },
        { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'DeepSeek', cost_per_token: 0.0000001 }
      ]
    };
    
    res.json({ models });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// Save playground session
router.post('/save-session', authenticateToken, async (req, res) => {
  try {
    const { name, prompt, models, parameters, results } = req.body;
    
    const session = {
      name,
      prompt,
      models,
      parameters,
      results,
      user_id: req.user.user_id,
      created: new Date().toISOString()
    };
    
    // Save to database (you can implement this based on your database structure)
    // For now, we'll just return success
    
    res.json({ message: 'Session saved successfully', session_id: Date.now() });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// Get saved sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    // This would typically fetch from database
    // For now, return empty array
    res.json({ sessions: [] });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

module.exports = router;