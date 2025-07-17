// Cost calculation utilities
const MODEL_COSTS = {
  'gpt-3.5-turbo': { input: 0.0000015, output: 0.000002 },
  'gpt-4': { input: 0.00003, output: 0.00006 },
  'gpt-4-turbo': { input: 0.00001, output: 0.00003 },
  'gpt-4o': { input: 0.000005, output: 0.000015 },
  'gpt-4o-mini': { input: 0.00000015, output: 0.0000006 },
  'claude-3-haiku': { input: 0.00000025, output: 0.00000125 },
  'claude-3-sonnet': { input: 0.000003, output: 0.000015 },
  'claude-3-opus': { input: 0.000015, output: 0.000075 },
  'claude-3-5-sonnet': { input: 0.000003, output: 0.000015 },
  'gemini-pro': { input: 0.0000005, output: 0.0000015 },
  'gemini-1.5-pro': { input: 0.00000125, output: 0.00000375 },
  'gemini-1.5-flash': { input: 0.000000075, output: 0.0000003 },
  'deepseek-chat': { input: 0.00000014, output: 0.00000028 },
  'deepseek-coder': { input: 0.00000014, output: 0.00000028 }
};

function calculateCost(model, tokensUsed, inputTokens = 0, outputTokens = 0) {
  const modelCost = MODEL_COSTS[model];
  
  if (!modelCost) {
    console.warn(`No cost data for model: ${model}`);
    return 0;
  }

  // If we have input/output token breakdown, use it
  if (inputTokens > 0 && outputTokens > 0) {
    return (inputTokens * modelCost.input) + (outputTokens * modelCost.output);
  }
  
  // Otherwise, estimate based on average ratio (roughly 80% input, 20% output)
  const estimatedInput = Math.floor(tokensUsed * 0.8);
  const estimatedOutput = tokensUsed - estimatedInput;
  
  return (estimatedInput * modelCost.input) + (estimatedOutput * modelCost.output);
}

function getCostPerToken(model, type = 'input') {
  const modelCost = MODEL_COSTS[model];
  return modelCost ? modelCost[type] : 0;
}

function estimateCost(model, prompt, maxTokens = 1000) {
  // Rough estimation: 1 token ≈ 0.75 words
  const estimatedInputTokens = Math.ceil(prompt.split(' ').length / 0.75);
  const estimatedOutputTokens = maxTokens;
  
  return calculateCost(model, estimatedInputTokens + estimatedOutputTokens, estimatedInputTokens, estimatedOutputTokens);
}

module.exports = {
  calculateCost,
  getCostPerToken,
  estimateCost,
  MODEL_COSTS
};