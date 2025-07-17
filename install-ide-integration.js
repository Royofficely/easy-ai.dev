#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

console.log('🚀 EasyAI IDE Integration Setup');
console.log('===============================');

// Get user's API key
const apiKey = process.env.EASYAI_API_KEY || process.argv[2];
if (!apiKey) {
    console.error('❌ Error: EASYAI_API_KEY not found');
    console.log('Please run: export EASYAI_API_KEY="your-api-key"');
    console.log('Or: node install-ide-integration.js your-api-key');
    process.exit(1);
}

const homeDir = os.homedir();
const easyaiDir = path.join(homeDir, '.easyai');
const proxyPort = 8888;

// Create .easyai directory
if (!fs.existsSync(easyaiDir)) {
    fs.mkdirSync(easyaiDir);
}

// Create proxy configuration
const proxyConfig = {
    apiKey: apiKey,
    proxyPort: proxyPort,
    apiEndpoint: 'https://api.easy-ai.dev',
    providers: {
        openai: {
            baseUrl: 'https://api.openai.com/v1',
            models: ['gpt-4', 'gpt-3.5-turbo']
        },
        anthropic: {
            baseUrl: 'https://api.anthropic.com/v1',
            models: ['claude-3-sonnet', 'claude-3-haiku']
        }
    }
};

fs.writeFileSync(
    path.join(easyaiDir, 'config.json'),
    JSON.stringify(proxyConfig, null, 2)
);

// Create proxy server script
const proxyScript = `#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json());

const configPath = path.join(os.homedir(), '.easyai', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Proxy OpenAI API calls to EasyAI
app.all('/v1/*', async (req, res) => {
    try {
        const originalPath = req.path;
        const method = req.method.toLowerCase();
        
        // Log the request
        console.log(\`🔄 Proxying \${method.toUpperCase()} \${originalPath}\`);
        
        // Transform request for EasyAI
        const easyaiRequest = {
            method: method,
            url: \`\${config.apiEndpoint}/v1/chat/completions\`,
            headers: {
                'Authorization': \`Bearer \${config.apiKey}\`,
                'Content-Type': 'application/json'
            },
            data: req.body
        };
        
        // Make request to EasyAI
        const response = await axios(easyaiRequest);
        
        // Return response
        res.json(response.data);
    } catch (error) {
        console.error('❌ Proxy error:', error.message);
        res.status(500).json({ error: 'EasyAI proxy error' });
    }
});

const port = config.proxyPort;
app.listen(port, () => {
    console.log(\`🚀 EasyAI proxy server running on http://localhost:\${port}\`);
    console.log('🎯 All AI IDE requests will now go through EasyAI!');
});
`;

fs.writeFileSync(
    path.join(easyaiDir, 'proxy-server.js'),
    proxyScript
);

// Make proxy server executable
if (process.platform !== 'win32') {
    fs.chmodSync(path.join(easyaiDir, 'proxy-server.js'), '755');
}

// Function to update shell profile
function updateShellProfile(profilePath, content) {
    if (fs.existsSync(profilePath)) {
        const currentContent = fs.readFileSync(profilePath, 'utf8');
        if (!currentContent.includes('# EasyAI IDE Integration')) {
            fs.appendFileSync(profilePath, '\n' + content);
            return true;
        }
    }
    return false;
}

// Environment variables to add
const envVars = `
# EasyAI IDE Integration
export EASYAI_API_KEY="${apiKey}"
export OPENAI_API_BASE="http://localhost:${proxyPort}/v1"
export ANTHROPIC_API_BASE="http://localhost:${proxyPort}/v1"
export OPENAI_BASE_URL="http://localhost:${proxyPort}/v1"
export ANTHROPIC_BASE_URL="http://localhost:${proxyPort}/v1"

# Start EasyAI proxy server
if ! pgrep -f "easyai.*proxy-server" > /dev/null; then
    nohup node ~/.easyai/proxy-server.js > ~/.easyai/proxy.log 2>&1 &
fi
`;

// Update shell profiles
const profiles = [
    path.join(homeDir, '.bashrc'),
    path.join(homeDir, '.zshrc'),
    path.join(homeDir, '.profile')
];

let profileUpdated = false;
profiles.forEach(profile => {
    if (updateShellProfile(profile, envVars)) {
        console.log(`✅ Updated ${path.basename(profile)}`);
        profileUpdated = true;
    }
});

if (!profileUpdated) {
    console.log('⚠️  No shell profile found, creating ~/.profile');
    fs.writeFileSync(path.join(homeDir, '.profile'), envVars);
}

// Create Claude Code configuration
const claudeCodeConfigDir = path.join(homeDir, '.claude');
if (!fs.existsSync(claudeCodeConfigDir)) {
    fs.mkdirSync(claudeCodeConfigDir);
}

const claudeCodeConfig = {
    "api": {
        "baseUrl": \`http://localhost:\${proxyPort}/v1\`,
        "defaultModel": "gpt-4"
    },
    "easyai": {
        "enabled": true,
        "apiKey": apiKey
    }
};

fs.writeFileSync(
    path.join(claudeCodeConfigDir, 'config.json'),
    JSON.stringify(claudeCodeConfig, null, 2)
);

// Create Cursor configuration
const cursorConfigDir = path.join(homeDir, '.cursor');
if (!fs.existsSync(cursorConfigDir)) {
    fs.mkdirSync(cursorConfigDir);
}

const cursorConfig = {
    "openai": {
        "apiBase": \`http://localhost:\${proxyPort}/v1\`,
        "apiKey": "easyai-proxy"
    },
    "anthropic": {
        "apiBase": \`http://localhost:\${proxyPort}/v1\`,
        "apiKey": "easyai-proxy"
    }
};

fs.writeFileSync(
    path.join(cursorConfigDir, 'config.json'),
    JSON.stringify(cursorConfig, null, 2)
);

// Create VS Code settings for Continue extension
const vscodeDir = path.join(homeDir, '.vscode');
if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir);
}

const continueConfig = {
    "models": [
        {
            "title": "EasyAI GPT-4",
            "provider": "openai",
            "model": "gpt-4",
            "apiKey": apiKey,
            "apiBase": \`http://localhost:\${proxyPort}/v1\`
        },
        {
            "title": "EasyAI Claude",
            "provider": "anthropic",
            "model": "claude-3-sonnet",
            "apiKey": apiKey,
            "apiBase": \`http://localhost:\${proxyPort}/v1\`
        }
    ],
    "systemMessage": "You are an expert software engineer powered by EasyAI."
};

fs.writeFileSync(
    path.join(homeDir, '.continue', 'config.json'),
    JSON.stringify(continueConfig, null, 2)
);

// Start proxy server immediately
console.log('🚀 Starting EasyAI proxy server...');
try {
    execSync(\`node "\${path.join(easyaiDir, 'proxy-server.js')}" &\`, { 
        stdio: 'inherit',
        detached: true
    });
    console.log(\`✅ Proxy server started on http://localhost:\${proxyPort}\`);
} catch (error) {
    console.log('⚠️  Could not start proxy server automatically');
    console.log(\`Please run: node \${path.join(easyaiDir, 'proxy-server.js')}\`);
}

console.log('\\n🎉 EasyAI IDE Integration Setup Complete!');
console.log('==========================================');
console.log('✅ Proxy server configured');
console.log('✅ Environment variables set');
console.log('✅ Claude Code configured');
console.log('✅ Cursor configured');
console.log('✅ VS Code Continue extension configured');
console.log('\\n🔄 Please restart your terminal and IDEs');
console.log('🎯 All AI requests will now go through EasyAI!');
console.log('\\n📊 Monitor usage at: https://easy-ai.dev');