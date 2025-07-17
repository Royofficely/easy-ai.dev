const Joi = require('joi');

const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).max(50).required()
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  createPrompt: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    prompt_id: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).optional(),
    category: Joi.string().max(50).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    template: Joi.string().required(),
    parameters: Joi.object().optional(),
    model_config: Joi.object({
      primary: Joi.string().required(),
      fallbacks: Joi.array().items(Joi.string()).optional()
    }).optional(),
    options: Joi.object().optional(),
    environments: Joi.object().optional()
  }),
  
  completion: Joi.object({
    prompt_id: Joi.string().required(),
    parameters: Joi.object().optional(),
    model: Joi.string().optional(),
    options: Joi.object().optional(),
    environment: Joi.string().valid('development', 'staging', 'production').optional()
  }),
  
  createApiKey: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    permissions: Joi.array().items(Joi.string().valid('read', 'write')).optional(),
    expires_at: Joi.date().optional()
  })
};

const validateInput = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return res.status(500).json({ error: 'Validation schema not found' });
    }

    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errorMessages 
      });
    }

    req.body = value;
    next();
  };
};

module.exports = {
  validateInput,
  schemas
};