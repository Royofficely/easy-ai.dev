# EasyAI Client

Local development tools for AI prompt management and model switching.

## 🚀 Quick Start

### 1. Get Your API Key
Visit [https://easy-ai.dev](https://easy-ai.dev) and sign up to get your API key.

### 2. Install EasyAI Client
```bash
npm install -g @easyai/client
```

### 3. Setup with Your API Key
```bash
easyai setup --api-key YOUR_API_KEY
```

### 4. Start the Dashboard
```bash
easyai ui
```

Your dashboard will open at `http://localhost:3001`

## 📋 Features

- **Local Dashboard** - Manage prompts and settings locally
- **Model Switching** - Switch between OpenAI, Claude, Gemini, and more
- **Cost Tracking** - Monitor your AI usage costs in real-time
- **IDE Integration** - Works with Claude Code, Cursor, and other tools
- **Prompt Management** - Organize and version your prompts
- **Privacy First** - All data stays on your machine

## 🛠️ Commands

- `easyai setup --api-key KEY` - Configure EasyAI with your API key
- `easyai ui` - Start the local dashboard
- `easyai prompts` - Manage prompts (coming soon)

## 🔧 Configuration

After setup, your configuration is stored in `.env`:
```
EASYAI_API_KEY=your_api_key_here
EASYAI_BASE_URL=https://easy-aidev-production.up.railway.app
```

## 📝 License

MIT License - see LICENSE file for details.