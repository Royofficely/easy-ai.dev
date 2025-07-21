import OpenAI from 'openai';

interface APIResponse {
  content: string;
  tokens: number;
  cost: number;
}

const PRICING = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
  'o1-preview': { input: 0.015, output: 0.06 },
  'o1-mini': { input: 0.003, output: 0.012 }
};

export async function callOpenAI(
  apiKey: string, 
  model: string, 
  prompt: string
): Promise<APIResponse> {
  if (!apiKey || apiKey === 'your_openai_key_here') {
    throw new Error('OpenAI API key not configured. Set it in easyai/config/easyai.env');
  }

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    });

    const response = completion.choices[0]?.message?.content || '';
    const usage = completion.usage;
    
    const inputTokens = usage?.prompt_tokens || 0;
    const outputTokens = usage?.completion_tokens || 0;
    const totalTokens = usage?.total_tokens || 0;

    // Calculate cost
    const pricing = PRICING[model as keyof typeof PRICING] || PRICING['gpt-4'];
    const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1000;

    return {
      content: response,
      tokens: totalTokens,
      cost: parseFloat(cost.toFixed(6))
    };

  } catch (error: any) {
    if (error.code === 'insufficient_quota') {
      throw new Error('OpenAI API quota exceeded. Check your billing.');
    } else if (error.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key.');
    } else {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
}