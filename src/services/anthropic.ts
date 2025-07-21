import Anthropic from '@anthropic-ai/sdk';

interface APIResponse {
  content: string;
  tokens: number;
  cost: number;
}

const PRICING = {
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  'claude-3-5-sonnet': { input: 0.003, output: 0.015 }
};

export async function callAnthropic(
  apiKey: string, 
  model: string, 
  prompt: string
): Promise<APIResponse> {
  if (!apiKey || apiKey === 'your_anthropic_key_here') {
    throw new Error('Anthropic API key not configured. Set it in easyai/config/easyai.env');
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const response = await anthropic.messages.create({
      model: model.replace('claude-', 'claude-'),
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const usage = response.usage;
    
    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;
    const totalTokens = inputTokens + outputTokens;

    // Calculate cost
    const pricing = PRICING[model as keyof typeof PRICING] || PRICING['claude-3-sonnet'];
    const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1000;

    return {
      content,
      tokens: totalTokens,
      cost: parseFloat(cost.toFixed(6))
    };

  } catch (error: any) {
    if (error.status === 401) {
      throw new Error('Invalid Anthropic API key.');
    } else if (error.status === 429) {
      throw new Error('Anthropic API rate limit exceeded.');
    } else {
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }
}