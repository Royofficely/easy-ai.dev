const express = require('express');
const { authenticateApiKey, checkPermission } = require('../middleware/auth');
const { validateInput } = require('../middleware/validation');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { Prompt, RequestLog } = require('../models');
const { llmGateway } = require('../gateway/llmGateway');
const { renderTemplate } = require('../utils/templateUtils');
const { calculateCost } = require('../utils/costUtils');

const router = express.Router();

// Main completion endpoint
router.post('/v1/completions', 
  apiRateLimiter,
  authenticateApiKey, 
  checkPermission('read'),
  validateInput('completion'),
  async (req, res) => {
    const startTime = Date.now();
    let requestLog = null;

    try {
      const { prompt_id, parameters = {}, model, options = {}, environment = 'development' } = req.body;

      // Get prompt configuration
      const prompt = await Prompt.findOne({
        where: {
          prompt_id: prompt_id,
          user_id: req.user.id,
          is_active: true
        }
      });

      if (!prompt) {
        return res.status(404).json({ error: 'Prompt not found' });
      }

      // Render template with parameters
      const renderedPrompt = renderTemplate(prompt.template, parameters);

      // Determine model to use
      const modelToUse = model || prompt.model_config.primary;
      
      // Merge options
      const finalOptions = {
        ...prompt.options,
        ...options
      };

      // Apply environment-specific overrides
      if (prompt.environments[environment]) {
        Object.assign(finalOptions, prompt.environments[environment]);
      }

      // Create request log
      requestLog = await RequestLog.create({
        user_id: req.user.id,
        api_key_id: req.apiKey.id,
        prompt_id: prompt_id,
        model_used: modelToUse,
        request_data: {
          prompt: renderedPrompt,
          parameters,
          options: finalOptions
        },
        parameters,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        environment,
        status: 'pending',
        duration_ms: 0
      });

      // Make LLM API call
      const llmResponse = await llmGateway.complete({
        prompt: renderedPrompt,
        model: modelToUse,
        options: finalOptions,
        fallbacks: prompt.model_config.fallbacks || []
      });

      const duration = Date.now() - startTime;
      const cost = calculateCost(modelToUse, llmResponse.tokens_used);

      // Update request log
      await requestLog.update({
        response_data: llmResponse,
        tokens_used: llmResponse.tokens_used,
        cost: cost,
        duration_ms: duration,
        status: 'success'
      });

      // Update prompt usage stats
      await prompt.incrementUsage(llmResponse.tokens_used, cost);

      // Return response
      res.json({
        id: requestLog.id,
        content: llmResponse.content,
        model: llmResponse.model_used,
        tokens_used: llmResponse.tokens_used,
        cost: cost,
        duration_ms: duration,
        prompt_id: prompt_id,
        environment: environment
      });

    } catch (error) {
      console.error('Gateway completion error:', error);
      
      const duration = Date.now() - startTime;
      
      // Update request log with error
      if (requestLog) {
        await requestLog.update({
          error_message: error.message,
          duration_ms: duration,
          status: 'error'
        });
      }

      // Handle different error types
      if (error.name === 'ModelNotAvailableError') {
        return res.status(503).json({ 
          error: 'Model temporarily unavailable', 
          details: error.message 
        });
      }

      if (error.name === 'RateLimitError') {
        return res.status(429).json({ 
          error: 'Rate limit exceeded', 
          details: error.message 
        });
      }

      res.status(500).json({ 
        error: 'Completion failed', 
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Direct completion endpoint (without prompts)
router.post('/v1/completions/direct',
  apiRateLimiter,
  authenticateApiKey,
  checkPermission('read'),
  async (req, res) => {
    const startTime = Date.now();
    let requestLog = null;

    try {
      const { prompt, model = 'gpt-3.5-turbo', options = {} } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      // Create request log
      requestLog = await RequestLog.create({
        user_id: req.user.id,
        api_key_id: req.apiKey.id,
        prompt_id: 'direct',
        model_used: model,
        request_data: {
          prompt,
          options
        },
        parameters: {},
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        environment: 'direct',
        status: 'pending',
        duration_ms: 0
      });

      // Make LLM API call
      const llmResponse = await llmGateway.complete({
        prompt,
        model,
        options,
        fallbacks: []
      });

      const duration = Date.now() - startTime;
      const cost = calculateCost(model, llmResponse.tokens_used);

      // Update request log
      await requestLog.update({
        response_data: llmResponse,
        tokens_used: llmResponse.tokens_used,
        cost: cost,
        duration_ms: duration,
        status: 'success'
      });

      // Return response
      res.json({
        id: requestLog.id,
        content: llmResponse.content,
        model: llmResponse.model_used,
        tokens_used: llmResponse.tokens_used,
        cost: cost,
        duration_ms: duration
      });

    } catch (error) {
      console.error('Direct completion error:', error);
      
      const duration = Date.now() - startTime;
      
      if (requestLog) {
        await requestLog.update({
          error_message: error.message,
          duration_ms: duration,
          status: 'error'
        });
      }

      res.status(500).json({ 
        error: 'Completion failed', 
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// List available models
router.get('/v1/models', authenticateApiKey, async (req, res) => {
  try {
    const models = await llmGateway.getAvailableModels();
    res.json({ models });
  } catch (error) {
    console.error('Models list error:', error);
    res.status(500).json({ error: 'Failed to retrieve models' });
  }
});

module.exports = router;