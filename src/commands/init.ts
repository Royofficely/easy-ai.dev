import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { generateId } from '../utils/helpers';

async function updateApiKey(easyaiDir: string, apiKey: string): Promise<void> {
  const envFile = path.join(easyaiDir, 'easyai.env');
  
  if (!await fs.pathExists(envFile)) {
    throw new Error('Configuration file not found');
  }

  let envContent = await fs.readFile(envFile, 'utf8');
  
  // Detect API key type
  const isOpenAI = apiKey.startsWith('sk-') && !apiKey.startsWith('sk-ant-');
  const isAnthropic = apiKey.startsWith('sk-ant-');
  
  if (isOpenAI) {
    envContent = envContent.replace(/OPENAI_API_KEY=.*/g, `OPENAI_API_KEY=${apiKey}`);
    console.log(chalk.blue('🔑 API key configured as OpenAI (auto-detected)'));
  } else if (isAnthropic) {
    envContent = envContent.replace(/ANTHROPIC_API_KEY=.*/g, `ANTHROPIC_API_KEY=${apiKey}`);
    console.log(chalk.blue('🔑 API key configured as Anthropic (auto-detected)'));
  } else {
    // Default to OpenAI if format is unknown
    envContent = envContent.replace(/OPENAI_API_KEY=.*/g, `OPENAI_API_KEY=${apiKey}`);
    console.log(chalk.blue('🔑 API key configured (assumed OpenAI)'));
  }
  
  await fs.writeFile(envFile, envContent);
}

export async function initializeProject(userId?: string, apiKey?: string, force: boolean = false): Promise<void> {
  const projectDir = process.cwd();
  const easyaiDir = path.join(projectDir, 'easyai');

  // Check if already initialized
  if (await fs.pathExists(easyaiDir)) {
    if (!force) {
      // Try to just update the API key if one is provided
      if (apiKey) {
        console.log(chalk.yellow('🔄 EasyAI already initialized, updating API key...'));
        await updateApiKey(easyaiDir, apiKey);
        console.log(chalk.green('✅ API key updated successfully!'));
        return;
      } else {
        throw new Error('EasyAI is already initialized in this project');
      }
    } else {
      console.log(chalk.yellow('🔄 Force re-initializing EasyAI...'));
      await fs.remove(easyaiDir);
    }
  }

  console.log(chalk.blue('🚀 Initializing EasyAI...'));

  // Create directory structure
  await fs.ensureDir(path.join(easyaiDir, 'prompts', 'examples'));
  await fs.ensureDir(path.join(easyaiDir, 'prompts', 'custom'));
  await fs.ensureDir(path.join(easyaiDir, 'logs'));
  await fs.ensureDir(path.join(easyaiDir, 'config'));
  await fs.ensureDir(path.join(easyaiDir, 'cache'));

  // Create example prompts
  await createExamplePrompts(easyaiDir);

  // Create configuration files
  await createConfigFiles(easyaiDir, userId, apiKey);

  // Create initial log files
  await createLogFiles(easyaiDir);

  console.log(chalk.green('📁 Created folder structure'));
  console.log(chalk.green('📝 Created example prompts'));
  console.log(chalk.green('⚙️  Created configuration files'));
  
  if (!apiKey) {
    console.log(chalk.yellow('💡 Next steps:'));
    console.log(chalk.yellow('   1. Add your API keys to easyai/config/easyai.env'));
    console.log(chalk.yellow('   2. Run "easyai ui" to open the dashboard'));
  } else {
    console.log(chalk.green('✅ API key configured automatically'));
    console.log(chalk.yellow('💡 Ready to use! Run "easyai ui" to open the dashboard'));
  }
}

async function createExamplePrompts(easyaiDir: string): Promise<void> {
  const examplesDir = path.join(easyaiDir, 'prompts', 'examples');

  await fs.writeFile(
    path.join(examplesDir, 'code-review.md'),
    `# Code Review Prompt

## Task
Review the following code for:
- Code quality and best practices
- Security vulnerabilities
- Performance issues
- Maintainability

## Input
\`\`\`{{language}}
{{code}}
\`\`\`

## Output Format
Provide structured feedback with specific suggestions for improvement.`
  );

  await fs.writeFile(
    path.join(examplesDir, 'bug-fix.md'),
    `# Bug Fix Prompt

## Task
Analyze the following code and identify potential bugs:

## Code
\`\`\`{{language}}
{{code}}
\`\`\`

## Error/Issue
{{error_description}}

## Expected Output
1. Root cause analysis
2. Proposed fix with explanation
3. Prevention strategies`
  );

  await fs.writeFile(
    path.join(examplesDir, 'feature-request.md'),
    `# Feature Implementation Prompt

## Feature Description
{{feature_description}}

## Requirements
{{requirements}}

## Existing Code Context
\`\`\`{{language}}
{{existing_code}}
\`\`\`

## Output
Provide implementation plan and code for the requested feature.`
  );
}

async function createConfigFiles(easyaiDir: string, userId?: string, apiKey?: string): Promise<void> {
  const configDir = path.join(easyaiDir, 'config');
  
  // Detect API key type and set appropriate values
  let openaiKey = 'your_openai_key_here';
  let anthropicKey = 'your_anthropic_key_here';
  
  if (apiKey) {
    if (apiKey.startsWith('sk-ant-')) {
      // Anthropic key pattern
      anthropicKey = apiKey;
      console.log(chalk.green('🔑 Anthropic API key configured automatically'));
    } else if (apiKey.startsWith('sk-')) {
      // OpenAI key pattern  
      openaiKey = apiKey;
      console.log(chalk.green('🔑 OpenAI API key configured automatically'));
    } else {
      // Try to determine by length and content, default to OpenAI if unsure
      if (apiKey.length > 40) {
        openaiKey = apiKey;
        console.log(chalk.yellow('🔑 API key configured as OpenAI (auto-detected)'));
      } else {
        anthropicKey = apiKey;
        console.log(chalk.yellow('🔑 API key configured as Anthropic (auto-detected)'));
      }
    }
  }
  
  // Create .env file
  const envContent = `# OpenAI Configuration
OPENAI_API_KEY=${openaiKey}
OPENAI_MODEL=gpt-4

# Anthropic Configuration  
ANTHROPIC_API_KEY=${anthropicKey}
ANTHROPIC_MODEL=claude-3-sonnet

# EasyAI Configuration
EASYAI_USER_ID=${userId || generateId()}
EASYAI_PROJECT_ID=${generateId()}
EASYAI_LOG_LEVEL=info
EASYAI_PORT=3000
`;

  await fs.writeFile(path.join(configDir, 'easyai.env'), envContent);

  // Create settings.json
  const settings = {
    ui: {
      theme: 'dark',
      autoSave: true
    },
    models: {
      openai: 'gpt-4',
      anthropic: 'claude-3-sonnet',
      default: 'gpt-4'
    },
    logging: {
      enabled: true,
      includeResponses: true,
      retention: '30d'
    },
    prompts: {
      autoBackup: true,
      validateSyntax: true
    }
  };

  await fs.writeJSON(path.join(configDir, 'settings.json'), settings, { spaces: 2 });
}

async function createLogFiles(easyaiDir: string): Promise<void> {
  const logsDir = path.join(easyaiDir, 'logs');
  const configDir = path.join(easyaiDir, 'config');

  // Create empty log files
  await fs.writeFile(path.join(logsDir, 'calls.jsonl'), '');
  
  // Create legacy log file in config (for compatibility)
  await fs.writeFile(path.join(configDir, 'easyai.jsonl'), '');
  
  // Note: analytics.json is no longer needed - analytics are calculated directly from log files
}