import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { checkEasyAIExists, loadEnv, logAPICall } from '../utils/helpers';
import { callOpenAI } from '../services/openai';
import { callAnthropic } from '../services/anthropic';

interface PromptOptions {
  model?: string;
  input?: string;
}

export async function runPrompt(promptName: string, options: PromptOptions): Promise<void> {
  const projectDir = process.cwd();
  
  if (!await checkEasyAIExists(projectDir)) {
    throw new Error('EasyAI not initialized. Run "easyai init" first.');
  }

  const env = await loadEnv(projectDir);
  
  // Find prompt file
  const promptPath = await findPromptFile(projectDir, promptName);
  if (!promptPath) {
    throw new Error(`Prompt "${promptName}" not found`);
  }

  console.log(chalk.blue(`📝 Running prompt: ${promptName}`));

  // Load prompt content
  const promptContent = await fs.readFile(promptPath, 'utf-8');
  
  // Process variables in prompt
  const processedPrompt = await processPromptVariables(promptContent, options.input);

  // Determine model to use
  const model = options.model || env.OPENAI_MODEL || 'gpt-4';
  
  console.log(chalk.gray(`🤖 Using model: ${model}`));

  const startTime = Date.now();
  
  try {
    let response;

    if (model.startsWith('gpt') || model.startsWith('o1')) {
      response = await callOpenAI(env.OPENAI_API_KEY, model, processedPrompt);
    } else if (model.startsWith('claude')) {
      response = await callAnthropic(env.ANTHROPIC_API_KEY, model, processedPrompt);
    } else {
      throw new Error(`Unsupported model: ${model}`);
    }

    const duration = Date.now() - startTime;

    // Log the API call
    await logAPICall(projectDir, {
      prompt: promptName,
      model,
      input: processedPrompt.substring(0, 200) + '...',
      response: response.content.substring(0, 200) + '...',
      tokens: response.tokens,
      duration,
      cost: response.cost,
      success: true
    });

    console.log(chalk.green('\n✅ Response:'));
    console.log(response.content);
    console.log(chalk.gray(`\n📊 Tokens: ${response.tokens} | Duration: ${duration}ms`));
    
  } catch (error: any) {
    await logAPICall(projectDir, {
      prompt: promptName,
      model,
      input: processedPrompt.substring(0, 200) + '...',
      error: error.message,
      duration: Date.now() - startTime,
      success: false
    });
    
    throw error;
  }
}

async function findPromptFile(projectDir: string, promptName: string): Promise<string | null> {
  const promptsDir = path.join(projectDir, 'easyai', 'prompts');
  
  // Check custom prompts first
  const customPath = path.join(promptsDir, 'custom', `${promptName}.md`);
  if (await fs.pathExists(customPath)) {
    return customPath;
  }
  
  // Check examples
  const examplePath = path.join(promptsDir, 'examples', `${promptName}.md`);
  if (await fs.pathExists(examplePath)) {
    return examplePath;
  }
  
  return null;
}

async function processPromptVariables(promptContent: string, input?: string): Promise<string> {
  let processed = promptContent;
  
  // Replace common variables
  if (input) {
    processed = processed.replace(/\{\{input\}\}/g, input);
    processed = processed.replace(/\{\{code\}\}/g, input);
  }
  
  // Add more variable processing as needed
  processed = processed.replace(/\{\{date\}\}/g, new Date().toISOString().split('T')[0]);
  processed = processed.replace(/\{\{time\}\}/g, new Date().toLocaleTimeString());
  
  return processed;
}