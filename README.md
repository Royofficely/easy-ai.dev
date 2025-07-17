# 🤖 EasyAI - AI Development Made Simple

## 🚀 Quick Start

### For End Users
1. **Get your API token**: Visit [https://easy-ai.dev](https://easy-ai.dev)
2. **Install EasyAI**: Run the installer
3. **Start building**: Use your token to access AI models

```bash
curl -fsSL https://raw.githubusercontent.com/Royofficely/easyai/main/install-easyai-complete.sh | bash
```

### For Developers (Running Locally)
1. **Clone and setup**:
```bash
git clone https://github.com/Royofficely/easyai.git
cd easyai
npm install
cp .env.example .env
# Edit .env with your API keys
```

2. **Start the platform**:
```bash
# Terminal 1: Backend server
npm run dev

# Terminal 2: React dashboard
cd dashboard && npm install && npm start
```

3. **Access the platform**:
- Landing page: Open `landing-page.html` in browser
- Dashboard: http://localhost:3000
- API: http://localhost:3000/api/v1

## 🌟 Features

- **Unified API**: One interface for OpenAI, Claude, Gemini, and more
- **Auto Fallbacks**: Automatic failover between AI providers
- **Real-time Analytics**: Track usage, costs, and performance
- **Secure**: Enterprise-grade security with tiered access
- **Scalable**: From localhost to enterprise deployments

## 🔑 Authentication Flow

1. **Visit**: [easy-ai.dev](https://easy-ai.dev)
2. **Register/Login**: Create account with email verification
3. **Generate Token**: Get your API key in the dashboard
4. **Deploy**: Use locally (free) or upgrade for production

## 💰 Pricing Tiers

- **Free**: 100 requests/hour, localhost only
- **Paid**: 10K requests/hour, production domains
- **Enterprise**: 100K requests/hour, self-hosted options

## 📚 Quick Usage Example

### Node.js
```javascript
const { EasyAI } = require('easyai-sdk');

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

## 🛠️ Development Setup

### Backend Server
```bash
# From project root
npm install
npm run dev
# Server runs on http://localhost:3000
```

### React Dashboard
```bash
cd dashboard
npm install
npm start
# Dashboard runs on http://localhost:3000
```

### Landing Page
```bash
# Simply open landing-page.html in your browser
open landing-page.html
```

## 📖 Core Concepts

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

## 🔧 CLI Commands

### Project Setup
```bash
# Initialize new project
easyai init --name "my-ai-app"

# List available models
easyai models
```

### Prompt Management
```bash
# List all prompts
easyai prompts list

# Create new prompt
easyai prompts create --name "summarizer"

# Test prompt
easyai prompts test my-prompt --params '{"text": "Hello world"}'

# Compare models
easyai prompts compare my-prompt --models "gpt-4,claude-3"
```

### Analytics
```bash
# View usage analytics
easyai analytics --days 30

# Health check
easyai health
```

**Note**: CLI tool is available at `./bin/cli.js` and can be installed globally with `npm install -g .`

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Application   │────▶│   EasyAI SDK     │────▶│  EasyAI Cloud   │
│  (Your Code)    │     │  (npm package)   │     │   API Gateway   │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                           │
                        ┌──────────────────────────────────┼──────────────────────────────────┐
                        │                                  │                                  │
                    ┌───▼─────┐                    ┌───────▼────────┐              ┌──────────▼────────┐
                    │ OpenAI  │                    │   Anthropic    │              │      Google       │
                    │   API    │                    │     Claude     │              │      Gemini       │
                    └─────────┘                    └────────────────┘              └───────────────────┘
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **API Key Management**: Cryptographic key generation
- **Rate Limiting**: Per-tier usage limits
- **Domain Validation**: Production usage monitoring
- **Audit Logging**: Complete request/response tracking

## 🚀 Deployment Options

### Local Development
```bash
# Start backend server
npm run dev

# Start React dashboard (in separate terminal)
cd dashboard && npm start

# Access:
# - Backend API: http://localhost:3000
# - React Dashboard: http://localhost:3000
# - Landing Page: Open landing-page.html in browser
```

### Production Deployment
```bash
# Set environment variables
export NODE_ENV=production
export JWT_SECRET=your-secret-key
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
export GOOGLE_API_KEY=AIza...

# Build and start
npm install
npm start
```

### Docker Deployment
```bash
# Build container
docker build -t easyai .

# Run container
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=sk-... \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e JWT_SECRET=your-secret \
  easyai
```

## 📊 Monitoring & Analytics

### Built-in Analytics
- Request/response logging
- Token usage tracking
- Cost analysis per model
- Performance metrics
- Error rate monitoring

### Integration with External Tools
```javascript
// Custom analytics webhook
const ai = new EasyAI({
  apiKey: 'your-key',
  webhook: 'https://your-analytics-endpoint.com/webhook'
});
```

## 🔧 Configuration

### Server Environment Variables
```bash
# Server Configuration
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key

# Database
DATABASE_URL=./database/easyai.sqlite

# LLM Provider Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
DEEPSEEK_API_KEY=sk-...

# Email Verification
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/ggrd1nilwumpay2envc5k8lqhwqtxlm7
```

### SDK Configuration
```bash
# For applications using the SDK
EASYAI_API_KEY=your_api_key_here
EASYAI_BASE_URL=http://localhost:3000
EASYAI_TIMEOUT=30000
```

### Project Configuration (easyai.config.json)
```json
{
  "project_name": "My AI Project",
  "api": {
    "base_url": "http://localhost:3000",
    "timeout": 30000
  },
  "models": {
    "default": "gpt-4o-mini",
    "fallback_chain": ["gpt-4o-mini", "claude-3-haiku", "gemini-pro"]
  },
  "prompts": {
    "categories": ["general", "development", "email", "analysis"]
  }
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [https://docs.easyai.dev](https://docs.easyai.dev)
- **Community**: [Discord](https://discord.gg/easyai)
- **Issues**: [GitHub Issues](https://github.com/Royofficely/easyai/issues)
- **Email**: [support@easy-ai.dev](mailto:support@easy-ai.dev)

## 🎯 Roadmap

### Phase 1: Core Platform ✅
- [x] Unified API gateway
- [x] Basic prompt management
- [x] Node.js SDK
- [x] Local dashboard
- [x] Provider integrations

### Phase 2: Advanced Features 🚧
- [ ] Team collaboration
- [ ] Advanced analytics
- [ ] A/B testing
- [ ] Custom model endpoints
- [ ] Workflow automation

### Phase 3: Enterprise Features 📋
- [ ] SSO/SAML support
- [ ] Private cloud deployment
- [ ] Compliance certifications
- [ ] SLA guarantees
- [ ] 24/7 support

---

**Made with ❤️ by the EasyAI Team**

Get started today at [easy-ai.dev](https://easy-ai.dev)!