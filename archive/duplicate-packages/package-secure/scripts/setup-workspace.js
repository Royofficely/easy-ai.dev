#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const EASYAI_WORKSPACE = path.join(os.homedir(), '.easyai');
const CONFIG_FILE = path.join(EASYAI_WORKSPACE, 'config.json');
const PROMPTS_DIR = path.join(EASYAI_WORKSPACE, 'prompts');
const MODELS_FILE = path.join(EASYAI_WORKSPACE, 'models.json');
const README_FILE = path.join(EASYAI_WORKSPACE, 'README.md');

console.log('🏗️  Setting up EasyAI workspace...');

try {
  // Create workspace directory
  if (!fs.existsSync(EASYAI_WORKSPACE)) {
    fs.mkdirSync(EASYAI_WORKSPACE, { recursive: true });
    console.log(`✅ Created workspace: ${EASYAI_WORKSPACE}`);
  }

  // Create prompts directory
  if (!fs.existsSync(PROMPTS_DIR)) {
    fs.mkdirSync(PROMPTS_DIR, { recursive: true });
    console.log('✅ Created prompts directory');
  }

  // Create default configuration
  if (!fs.existsSync(CONFIG_FILE)) {
    const defaultConfig = {
      version: "1.3.23",
      apiKey: null,
      apiBase: "https://api.easy-ai.dev",
      dashboardUrl: "https://easy-ai.dev/dashboard",
      workspace: EASYAI_WORKSPACE,
      defaultModel: "gpt-4",
      temperature: 0.7,
      maxTokens: 1000,
      providers: {
        openai: {
          apiKey: null,
          models: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
          enabled: true
        },
        anthropic: {
          apiKey: null,
          models: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
          enabled: true
        },
        google: {
          apiKey: null,
          models: ["gemini-pro", "gemini-pro-vision"],
          enabled: true
        }
      },
      features: {
        autoSync: true,
        realTimeUpdates: true,
        costTracking: true,
        ideIntegration: true
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    console.log('✅ Created default configuration');
  }

  // Create models configuration
  if (!fs.existsSync(MODELS_FILE)) {
    const modelsConfig = {
      providers: {
        openai: {
          models: {
            "gpt-4": {
              name: "GPT-4",
              description: "Most capable model for complex tasks",
              inputCost: 0.03,
              outputCost: 0.06,
              maxTokens: 8192,
              contextWindow: 8192
            },
            "gpt-4-turbo": {
              name: "GPT-4 Turbo", 
              description: "Faster and cheaper than GPT-4",
              inputCost: 0.01,
              outputCost: 0.03,
              maxTokens: 4096,
              contextWindow: 128000
            },
            "gpt-3.5-turbo": {
              name: "GPT-3.5 Turbo",
              description: "Fast and efficient for most tasks",
              inputCost: 0.0005,
              outputCost: 0.0015,
              maxTokens: 4096,
              contextWindow: 16385
            }
          }
        },
        anthropic: {
          models: {
            "claude-3-opus": {
              name: "Claude 3 Opus",
              description: "Most powerful model for complex analysis",
              inputCost: 0.015,
              outputCost: 0.075,
              maxTokens: 4096,
              contextWindow: 200000
            },
            "claude-3-sonnet": {
              name: "Claude 3 Sonnet", 
              description: "Balanced performance and speed",
              inputCost: 0.003,
              outputCost: 0.015,
              maxTokens: 4096,
              contextWindow: 200000
            },
            "claude-3-haiku": {
              name: "Claude 3 Haiku",
              description: "Fastest model for simple tasks",
              inputCost: 0.00025,
              outputCost: 0.00125,
              maxTokens: 4096,
              contextWindow: 200000
            }
          }
        },
        google: {
          models: {
            "gemini-pro": {
              name: "Gemini Pro",
              description: "Google's flagship text model",
              inputCost: 0.001,
              outputCost: 0.001,
              maxTokens: 2048,
              contextWindow: 32768
            },
            "gemini-pro-vision": {
              name: "Gemini Pro Vision",
              description: "Multimodal model with vision capabilities",
              inputCost: 0.002,
              outputCost: 0.002,
              maxTokens: 2048,
              contextWindow: 16384
            }
          }
        }
      },
      lastUpdated: new Date().toISOString()
    };

    fs.writeFileSync(MODELS_FILE, JSON.stringify(modelsConfig, null, 2));
    console.log('✅ Created models configuration');
  }

  // Create sample prompts
  const samplePrompts = [
    {
      name: "code-review",
      category: "development",
      description: "Review code for best practices and potential issues",
      content: "Please review the following code and provide feedback on:\n1. Code quality and best practices\n2. Potential bugs or security issues\n3. Performance improvements\n4. Documentation suggestions\n\nCode:\n{code}",
      variables: ["code"],
      tags: ["development", "code-review", "quality"],
      createdAt: new Date().toISOString()
    },
    {
      name: "debug-helper",
      category: "debugging", 
      description: "Help debug issues and find solutions",
      content: "I'm experiencing the following issue:\n\nError: {error}\nCode: {code}\nExpected behavior: {expected}\nActual behavior: {actual}\n\nPlease help me:\n1. Identify the root cause\n2. Provide a solution\n3. Suggest prevention strategies",
      variables: ["error", "code", "expected", "actual"],
      tags: ["debugging", "troubleshooting", "problem-solving"],
      createdAt: new Date().toISOString()
    },
    {
      name: "api-documentation",
      category: "documentation",
      description: "Generate API documentation from code",
      content: "Generate comprehensive API documentation for:\n\nEndpoint: {endpoint}\nMethod: {method}\nCode:\n{code}\n\nInclude:\n- Description and purpose\n- Parameters (required/optional)\n- Request/Response examples\n- Error codes and messages\n- Authentication requirements",
      variables: ["endpoint", "method", "code"],
      tags: ["documentation", "api", "reference"],
      createdAt: new Date().toISOString()
    }
  ];

  samplePrompts.forEach(prompt => {
    const promptFile = path.join(PROMPTS_DIR, `${prompt.name}.json`);
    if (!fs.existsSync(promptFile)) {
      fs.writeFileSync(promptFile, JSON.stringify(prompt, null, 2));
    }
  });
  console.log(`✅ Created ${samplePrompts.length} sample prompts`);

  // Create workspace README
  const readmeContent = `# EasyAI Workspace

This is your personal EasyAI workspace. All your prompts, configurations, and local data are stored here.

## Directory Structure

\`\`\`
${EASYAI_WORKSPACE}/
├── config.json          # Main configuration file
├── models.json          # AI models configuration and pricing
├── prompts/             # Your prompt templates
│   ├── code-review.json
│   ├── debug-helper.json
│   └── api-documentation.json
└── README.md           # This file
\`\`\`

## Quick Start

1. **Setup your API key:**
   \`\`\`bash
   easyai setup --api-key YOUR_EASYAI_KEY
   \`\`\`

2. **Create a new prompt:**
   \`\`\`bash
   easyai add prompt "my-custom-prompt"
   \`\`\`

3. **List your prompts:**
   \`\`\`bash
   easyai list prompts
   \`\`\`

4. **Open the dashboard:**
   \`\`\`bash
   easyai ui
   \`\`\`

## Configuration

Edit \`config.json\` to customize your EasyAI experience:

- **API Keys**: Add your provider API keys (OpenAI, Anthropic, Google)
- **Default Model**: Set your preferred AI model
- **Temperature**: Control randomness (0.0 = deterministic, 1.0 = creative)
- **Max Tokens**: Maximum response length

## Prompts

Prompts are stored as JSON files in the \`prompts/\` directory. Each prompt contains:

- **name**: Unique identifier
- **category**: Organization tag
- **description**: What the prompt does
- **content**: The actual prompt text with variables
- **variables**: Array of variable names used in {brackets}

## Models

The \`models.json\` file contains information about available AI models, including:

- Pricing information
- Context window sizes
- Capabilities and descriptions

## Support

- Documentation: https://docs.easy-ai.dev
- Support: https://easy-ai.dev/support
- GitHub: https://github.com/easyai-dev/cli

---

Generated by EasyAI v${JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')).version}
`;

  if (!fs.existsSync(README_FILE)) {
    fs.writeFileSync(README_FILE, readmeContent);
    console.log('✅ Created workspace README');
  }

  console.log('');
  console.log('🎉 EasyAI workspace setup complete!');
  console.log('');
  console.log('📁 Your workspace: ' + EASYAI_WORKSPACE);
  console.log('');
  console.log('Next steps:');
  console.log('1. Get your API key: https://easy-ai.dev');
  console.log('2. Run: easyai setup --api-key YOUR_KEY');
  console.log('3. Run: easyai ui');
  console.log('');

} catch (error) {
  console.error('❌ Workspace setup failed:', error.message);
  process.exit(1);
}