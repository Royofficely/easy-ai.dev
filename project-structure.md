# EasyAI Project Structure

## Core Architecture

### 1. Landing Page & Authentication
- Next.js/React landing page
- Clerk integration for user authentication
- Generates unique installation command per user

### 2. CLI Tool Structure
```
easyai/
├── prompts/                    # User prompt templates
│   ├── examples/
│   │   ├── code-review.md
│   │   ├── bug-fix.md
│   │   └── feature-request.md
│   └── custom/                 # User custom prompts
├── logs/
│   ├── calls.jsonl            # LLM API call logs
│   └── analytics.json         # Usage analytics
├── config/
│   ├── easyai.env            # API keys and configuration
│   └── settings.json         # UI preferences and settings
└── cache/                     # Temporary files and cache
```

### 3. Generated Files Content

#### easyai.env
```
# OpenAI Configuration
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-4

# Anthropic Configuration  
ANTHROPIC_API_KEY=your_anthropic_key_here
ANTHROPIC_MODEL=claude-3-sonnet

# EasyAI Configuration
EASYAI_USER_ID=generated_user_id
EASYAI_PROJECT_ID=generated_project_id
EASYAI_LOG_LEVEL=info
```

#### settings.json
```json
{
  "ui": {
    "theme": "dark",
    "defaultModel": "gpt-4",
    "autoSave": true
  },
  "logging": {
    "enabled": true,
    "includeResponses": true,
    "retention": "30d"
  }
}
```

### 4. CLI Commands
- `easyai init` - Initialize project
- `easyai ui` - Open dashboard
- `easyai prompt <name>` - Run prompt
- `easyai logs` - View recent logs
- `easyai config` - Manage configuration

### 5. Dashboard Features
- **Analytics**: Usage graphs, cost tracking, model performance
- **Prompt Manager**: Create, edit, organize prompts
- **Playground**: Test prompts with different models
- **Logs**: Search and filter call history
- **Settings**: Manage API keys and preferences

### 6. Tech Stack
- **CLI**: Node.js with Commander.js
- **Dashboard**: Next.js + React + Tailwind CSS
- **Database**: Local SQLite for logs + JSON files for config
- **Authentication**: Clerk
- **Charts**: Chart.js or Recharts
- **File Watching**: Chokidar for file-UI sync