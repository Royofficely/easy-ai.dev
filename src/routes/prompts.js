const express = require('express');
const { authenticateApiKey, checkPermission } = require('../middleware/auth');
const { validateInput } = require('../middleware/validation');
const { Prompt } = require('../models');

const router = express.Router();

// Create prompt
router.post('/', authenticateApiKey, checkPermission('write'), validateInput('createPrompt'), async (req, res) => {
  try {
    const promptData = {
      ...req.body,
      user_id: req.user.id
    };

    const prompt = await Prompt.create(promptData);
    
    // Emit WebSocket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('prompt_created', {
        prompt: prompt,
        user_id: req.user.id,
        timestamp: new Date().toISOString()
      });
      console.log('📡 WebSocket: Prompt created event emitted');
    }
    
    res.status(201).json(prompt);
  } catch (error) {
    console.error('Prompt creation error:', error);
    res.status(500).json({ error: 'Failed to create prompt' });
  }
});

// List prompts
router.get('/', authenticateApiKey, async (req, res) => {
  try {
    const { category, active = true } = req.query;
    
    const where = {
      user_id: req.user.id,
      is_active: active === 'true'
    };

    if (category) {
      where.category = category;
    }

    const prompts = await Prompt.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    res.json({ prompts });
  } catch (error) {
    console.error('Prompts list error:', error);
    res.status(500).json({ error: 'Failed to retrieve prompts' });
  }
});

// Get prompt by ID
router.get('/:prompt_id', authenticateApiKey, async (req, res) => {
  try {
    const prompt = await Prompt.findOne({
      where: {
        prompt_id: req.params.prompt_id,
        user_id: req.user.id
      }
    });

    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    res.json(prompt);
  } catch (error) {
    console.error('Prompt retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve prompt' });
  }
});

// Update prompt
router.put('/:prompt_id', authenticateApiKey, checkPermission('write'), async (req, res) => {
  try {
    const prompt = await Prompt.findOne({
      where: {
        prompt_id: req.params.prompt_id,
        user_id: req.user.id
      }
    });

    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Increment version on update
    await prompt.update({
      ...req.body,
      version: prompt.version + 1
    });

    // Emit WebSocket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('prompt_updated', {
        prompt: prompt,
        user_id: req.user.id,
        timestamp: new Date().toISOString()
      });
      console.log('📡 WebSocket: Prompt updated event emitted');
    }

    res.json(prompt);
  } catch (error) {
    console.error('Prompt update error:', error);
    res.status(500).json({ error: 'Failed to update prompt' });
  }
});

// Delete prompt
router.delete('/:prompt_id', authenticateApiKey, checkPermission('write'), async (req, res) => {
  try {
    const prompt = await Prompt.findOne({
      where: {
        prompt_id: req.params.prompt_id,
        user_id: req.user.id
      }
    });

    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    prompt.is_active = false;
    await prompt.save();

    // Emit WebSocket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('prompt_deleted', {
        prompt_id: req.params.prompt_id,
        user_id: req.user.id,
        timestamp: new Date().toISOString()
      });
      console.log('📡 WebSocket: Prompt deleted event emitted');
    }

    res.json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    console.error('Prompt deletion error:', error);
    res.status(500).json({ error: 'Failed to delete prompt' });
  }
});

module.exports = router;