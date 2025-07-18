#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔒 Building secure EasyAI package...');

const packageDir = path.join(__dirname, '../package-secure');
const sourceDir = path.join(__dirname, '..');

try {
  // Clean and create package directory
  if (fs.existsSync(packageDir)) {
    execSync(`rm -rf ${packageDir}`);
  }
  fs.mkdirSync(packageDir, { recursive: true });

  // Copy secure CLI
  const binDir = path.join(packageDir, 'bin');
  fs.mkdirSync(binDir, { recursive: true });
  fs.copyFileSync(
    path.join(sourceDir, 'bin/cli-secure.js'),
    path.join(binDir, 'cli.js')
  );
  
  // Make CLI executable
  fs.chmodSync(path.join(binDir, 'cli.js'), '755');

  // Copy scripts directory
  const scriptsDir = path.join(packageDir, 'scripts');
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.copyFileSync(
    path.join(sourceDir, 'scripts/setup-workspace.js'),
    path.join(scriptsDir, 'setup-workspace.js')
  );

  // Create minimal server directory (just for reference, actual server runs on our infrastructure)
  const serverDir = path.join(packageDir, 'server');
  fs.mkdirSync(serverDir, { recursive: true });
  
  const serverInfo = {
    message: "EasyAI server runs on our secure cloud infrastructure",
    endpoints: {
      api: "https://api.easy-ai.dev",
      dashboard: "https://easy-ai.dev/dashboard",
      docs: "https://docs.easy-ai.dev"
    },
    status: "https://status.easy-ai.dev"
  };
  
  fs.writeFileSync(
    path.join(serverDir, 'info.json'),
    JSON.stringify(serverInfo, null, 2)
  );

  // Copy distribution package.json
  fs.copyFileSync(
    path.join(sourceDir, 'package-dist.json'),
    path.join(packageDir, 'package.json')
  );

  // Create README for package
  const packageReadme = `# EasyAI CLI

Unified AI development platform with prompt management, cost tracking, and IDE integration.

## Quick Start

\`\`\`bash
npm install -g @easyai/cli
easyai setup --api-key YOUR_KEY
easyai ui
\`\`\`

## Features

- 🤖 **Multi-Provider Support**: OpenAI, Anthropic, Google AI
- 💰 **Real-time Cost Tracking**: Track spending across all providers
- 🔧 **IDE Integration**: Works with Claude Code, Cursor, VS Code
- 📝 **Prompt Management**: Version control for your AI prompts
- 📊 **Analytics Dashboard**: Usage insights and optimization tips
- 🔄 **Real-time Sync**: CLI and dashboard stay in sync

## Commands

- \`easyai setup --api-key KEY\` - Initial setup
- \`easyai add prompt NAME\` - Create new prompt
- \`easyai list prompts\` - List all prompts
- \`easyai ui\` - Open dashboard
- \`easyai status\` - Check configuration
- \`easyai config --set key=value\` - Update settings

## Get Your API Key

Visit [easy-ai.dev](https://easy-ai.dev) to create your account and get your API key.

## Documentation

- [Getting Started](https://docs.easy-ai.dev/getting-started)
- [CLI Reference](https://docs.easy-ai.dev/cli)
- [API Documentation](https://docs.easy-ai.dev/api)
- [IDE Integration](https://docs.easy-ai.dev/ide-integration)

## Support

- 📧 Support: support@easy-ai.dev
- 🐛 Issues: [GitHub Issues](https://github.com/easyai-dev/cli/issues)
- 💬 Discord: [EasyAI Community](https://discord.gg/easyai)

---

Built with ❤️ by the EasyAI team
`;

  fs.writeFileSync(path.join(packageDir, 'README.md'), packageReadme);

  // Create .npmignore to exclude unnecessary files
  const npmIgnore = `# Development files
src/
dashboard/src/
*.log
.env*
.git/
.DS_Store
node_modules/
coverage/
*.tgz

# Keep only distribution files
!bin/
!scripts/
!server/info.json
!README.md
!package.json
`;

  fs.writeFileSync(path.join(packageDir, '.npmignore'), npmIgnore);

  console.log('✅ Secure package built successfully!');
  console.log(`📦 Package location: ${packageDir}`);
  console.log('');
  console.log('Package contents:');
  console.log('├── bin/cli.js           # Secure CLI (connects to hosted backend)');
  console.log('├── scripts/             # Setup scripts');
  console.log('├── server/info.json     # Server endpoint information');
  console.log('├── package.json         # Package metadata');
  console.log('├── README.md           # User documentation');
  console.log('└── .npmignore          # NPM ignore rules');
  console.log('');
  console.log('To test the package:');
  console.log(`cd ${packageDir}`);
  console.log('npm pack');
  console.log('npm install -g easyai-cli-*.tgz');
  console.log('');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}