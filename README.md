# EasyAI - Stop Wrestling with AI Code

**Unified prompts, real-time costs, model switching, and IDE integration — all in one place.**

Building AI features shouldn't mean wrestling with hardcoded prompts, surprise costs, and IDE chaos. EasyAI gives you a single dashboard to manage all your prompts, track every API call, test multiple models, and automatically integrate with Claude Code and Cursor.

## 🚀 Quick Start

```bash
# Install the CLI
npm install -g easyai-cli

# Get your API key from https://easy-ai.dev
# Then setup everything in one command
easyai setup --api-key your_api_key_here

# Open the dashboard
easyai ui
```

## ✨ Key Features

- **🎯 Centralized Prompts** - No more scattered prompts in code. Manage everything in one dashboard.
- **💰 Real-time Cost Tracking** - See exactly what each API call costs across all providers.
- **🔄 Model Switching** - Switch between OpenAI, Claude, Gemini instantly without code changes.
- **🛠️ IDE Integration** - Works automatically with Claude Code and Cursor.
- **👥 Team Collaboration** - Non-devs can edit prompts without touching code.
- **📊 Analytics Dashboard** - Track usage, costs, and performance in real-time.

## 🎯 The Problem We Solve

### Before EasyAI:
```javascript
// Scattered prompts throughout your codebase
const systemPrompt = "You are a helpful assistant...";
const userPrompt = `Generate a summary of: ${text}`;

// Hidden costs across multiple providers
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Manual model switching requires code changes
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ]
});
```

### After EasyAI:
```javascript
// Clean, centralized prompt management
const easyai = require('easyai-cli');

const response = await easyai.complete({
  promptId: 'text_summarizer',
  parameters: { text: "Your content here" }
});

// Costs tracked automatically
// Model switching from dashboard
// Team can edit prompts without code deployment
```

## 🛠️ Installation & Setup

### 1. Install CLI
```bash
npm install -g easyai-cli
```

### 2. Get API Key
1. Visit [https://easy-ai.dev](https://easy-ai.dev)
2. Sign up with email verification
3. Get your API key from the dashboard

### 3. Setup Everything
```bash
# This command sets up everything:
# - Initializes your project
# - Configures IDE integration (Claude Code, Cursor)
# - Starts local server
# - Opens dashboard
easyai setup --api-key your_api_key_here
```

### 4. Start Building
```bash
# Open the dashboard anytime
easyai ui

# Check system status
easyai status

# Start just the server
easyai server
```

## 🎮 IDE Integration

EasyAI automatically configures your development environment:

### ✅ Claude Code
- Intercepts all AI requests
- Routes through EasyAI automatically
- Full cost tracking and analytics

### ✅ Cursor
- Seamless proxy integration
- All AI features work through EasyAI
- Real-time usage monitoring

### ✅ VS Code + Continue
- Automatic configuration
- All models available through EasyAI
- Unified prompt management

## 📊 Dashboard Features

### Prompt Management
- Visual prompt editor with syntax highlighting
- Real-time testing with multiple models
- Version control and rollback
- Team collaboration with comments

### Cost Analytics
- Real-time cost tracking per request
- Usage breakdown by model and prompt
- Budget alerts and limits
- Provider comparison

### Model Playground
- Test prompts across multiple models simultaneously
- Compare response quality and costs
- A/B testing capabilities
- Performance benchmarking

### Analytics & Monitoring
- Request/response logging
- Performance metrics
- Error tracking and alerts
- Usage patterns analysis

## 🔧 CLI Commands

### Project Management
```bash
# Initialize new project
easyai init

# Check system status
easyai status

# Open dashboard
easyai ui

# Start server
easyai server --port 3001
```

### Prompt Management
```bash
# List all prompts
easyai prompts list

# Create new prompt
easyai prompts add --name "email_writer"

# Test prompt
easyai prompts test email_writer --params '{"recipient": "John"}'

# Edit prompt (opens in dashboard)
easyai prompts edit email_writer
```

### Analytics
```bash
# View usage stats
easyai analytics usage --days 30

# View cost breakdown
easyai analytics costs

# Open analytics dashboard
easyai analytics open
```

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Your App      │────▶│   EasyAI CLI     │────▶│  EasyAI Cloud   │
│   (Node.js)     │     │   (Local Proxy)  │     │   API Gateway   │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                           │
                        ┌──────────────────────────────────┼──────────────────────────────────┐
                        │                                  │                                  │
                    ┌───▼─────┐                    ┌───────▼────────┐              ┌──────────▼────────┐
                    │ OpenAI  │                    │   Anthropic    │              │      Google       │
                    │   API    │                    │     Claude     │              │      Gemini       │
                    └─────────┘                    └────────────────┘              └───────────────────┘
```

## 💰 Pricing

### Free Tier
- ✅ Localhost development only
- ✅ All CLI features
- ✅ Dashboard access
- ✅ IDE integration
- ✅ Basic analytics

### Pro Tier
- ✅ Everything in Free
- ✅ Production domain support
- ✅ Team collaboration
- ✅ Advanced analytics
- ✅ Priority support

### Enterprise
- ✅ Everything in Pro
- ✅ Self-hosted deployment
- ✅ Custom integrations
- ✅ SLA guarantees
- ✅ Dedicated support

## 🔒 Security

- 🔐 API key-based authentication
- 🛡️ TLS 1.3 encryption
- 🔒 Local development by default
- 📊 Comprehensive audit logging
- 🔑 Role-based access control

## 🚀 For Developers (Running Locally)

### 1. Clone and Setup
```bash
git clone https://github.com/Royofficely/easyai.git
cd easyai
npm install
cp .env.example .env
# Edit .env with your API keys
```

### 2. Start the Platform
```bash
# Terminal 1: Backend server
npm run dev

# Terminal 2: React dashboard
cd dashboard && npm install && npm start
```

### 3. Access the Platform
- **Landing page**: Open `index.html` in browser
- **Dashboard**: http://localhost:3001/dashboard
- **API**: http://localhost:3001/api/v1

## 📚 Usage Examples

### Node.js SDK
```javascript
const { EasyAI } = require('easyai-cli');

const ai = new EasyAI({ apiKey: 'your-api-key' });

// Use a prompt template
const response = await ai.complete({
  promptId: 'email-writer',
  parameters: {
    recipient: 'John',
    topic: 'Project Update',
    tone: 'professional'
  }
});

console.log(response.content);
console.log(`Cost: $${response.cost}`);
```

### Direct API Usage
```javascript
// Direct prompt without templates
const response = await ai.completeDirect({
  prompt: 'Write a haiku about programming',
  model: 'gpt-4o',
  options: { temperature: 0.8 }
});

console.log(response.content);
```

## 🎯 Core Concepts

### Prompt Management
Create and manage AI prompts externally from your code:

```json
{
  "name": "code-reviewer",
  "prompt_id": "code-review",
  "template": "Review this {{language}} code for bugs and improvements: {{code}}",
  "model": "gpt-4o",
  "parameters": {
    "language": "JavaScript",
    "code": "function hello() { console.log('world'); }"
  }
}
```

### Model Fallbacks
Automatic failover when primary models are unavailable:

```json
{
  "model_config": {
    "primary": "gpt-4o",
    "fallbacks": ["claude-3-sonnet", "gemini-pro"]
  }
}
```

### Environment-Specific Settings
Different configurations for dev, staging, and production:

```json
{
  "environments": {
    "development": { "model": "gpt-4o-mini" },
    "production": { "model": "gpt-4o", "temperature": 0.5 }
  }
}
```

## 🤝 Contributing

We welcome contributions! Please check out our [Contributing Guide](CONTRIBUTING.md).

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 **Documentation**: [https://docs.easy-ai.dev](https://docs.easy-ai.dev)
- 💬 **Discord**: [Join our community](https://discord.gg/easyai)
- 🐛 **Issues**: [GitHub Issues](https://github.com/YourOrg/easyai/issues)
- 📧 **Email**: support@easy-ai.dev

## 🎯 What's Next?

- [ ] Python SDK
- [ ] Advanced A/B testing
- [ ] Custom model endpoints
- [ ] Workflow automation
- [ ] Enterprise SSO

---

**Ready to stop wrestling with AI code?** [Get started now →](https://easy-ai.dev)