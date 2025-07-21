# EasyAI CLI

> AI development tool with interactive CLI and local dashboard

[![npm version](https://badge.fury.io/js/@easyai%2Fcli.svg)](https://badge.fury.io/js/@easyai%2Fcli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

### One-Command Setup
```bash
npm install -g @easyai/cli && easyai init --key=YOUR_API_KEY --ui
```

This single command will:
1. Install EasyAI globally
2. Initialize your project
3. Configure your API key automatically
4. Open the dashboard in your browser

### Manual Setup
```bash
npm install -g @easyai/cli
easyai init
easyai ui
```

## ✨ Features

- **Interactive Terminal** - ChatGPT-style CLI interface
- **Multi-Model Playground** - Test prompts across OpenAI, Anthropic, OpenRouter
- **Local Dashboard** - Beautiful web UI at `localhost:3000`
- **Prompt Management** - Create, edit, and organize AI prompts
- **Usage Analytics** - Track tokens, costs, and performance
- **Export & Sync** - Export data in JSON/CSV formats

## 📋 Commands

```bash
easyai                           # Interactive mode
easyai init                      # Setup new project
easyai init --key=API_KEY --ui   # One-command setup with auto dashboard
easyai ui                        # Launch web dashboard
easyai models                    # Browse available models
easyai prompts                   # Manage prompts
easyai playground                # Multi-model testing
easyai analytics                 # Usage statistics
```

## 🛠 Interactive Mode

Run `easyai` to enter interactive mode:

```
🤖 EasyAI Interactive Terminal
════════════════════════════════════════════════════════════
✅ EasyAI initialized
   Configured providers: OpenAI, Anthropic

Type "help" for commands, "exit" to quit
────────────────────────────────────────────────────────────
easyai> help

📚 Available Commands:
──────────────────────────────────────────────────

Core Commands:
  init         - Initialize EasyAI in current project
  ui           - Launch dashboard UI
  config       - Manage configuration
  status       - Show current project status

AI Operations:
  models       - Browse and manage AI models
  prompts      - Manage AI prompts  
  playground   - Test prompts against multiple models
  analytics    - View usage analytics
```

## 🔧 Configuration

### Quick Configuration
```bash
easyai init --key=YOUR_API_KEY  # Auto-detects OpenAI or Anthropic
```

### Interactive Configuration
```bash
easyai init
# Follow the prompts to add your OpenAI, Anthropic, etc. API keys
```

Or manually edit `easyai/config/easyai.env`:

```env
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
```

## 🎯 Use Cases

- **Prompt Engineering** - Test and iterate on prompts
- **Model Comparison** - Compare responses across different models
- **Cost Optimization** - Track and analyze AI usage costs  
- **Team Collaboration** - Share prompts and configurations
- **Development Workflow** - Integrate AI into your dev process

## 🌐 Web Dashboard

Launch the local dashboard:

```bash
easyai ui
```

Access at `http://localhost:3000` for:
- Visual prompt editor
- Model playground
- Usage analytics
- Configuration management

## 📊 Analytics & Exports

Track your AI usage:

```bash
easyai analytics --period week --detailed
easyai export --type logs --format csv
```

## 🤝 Support

- **Website**: [https://easy-ai.dev](https://easy-ai.dev)
- **Issues**: [GitHub Issues](https://github.com/easyai/cli/issues)
- **Email**: support@easy-ai.dev

## 📄 License

MIT © [EasyAI](https://easy-ai.dev)