const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 7545;

// Read the CSS file
const cssPath = path.join(__dirname, 'dist/dashboard/_next/static/css/f409f51cd24a80df.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// Read the HTML file
const htmlPath = path.join(__dirname, 'dist/dashboard/index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Inject CSS directly into HTML
htmlContent = htmlContent.replace(
  '<head>',
  `<head><style>${cssContent}</style>`
);

console.log('🎯 Working server with embedded CSS');

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// API mocks
app.get('/api/analytics', (req, res) => {
  res.json({ 
    totalCalls: 5,
    totalTokens: 1250,
    modelUsage: { "gpt-4": 3, "claude-3-sonnet": 2 },
    lastUpdated: new Date().toISOString()
  });
});

app.get('/api/logs', (req, res) => {
  res.json([
    {
      timestamp: new Date().toISOString(),
      prompt: 'code-review',
      model: 'gpt-4',
      tokens: 250,
      cost: 0.015,
      duration: 1500,
      success: true
    },
    {
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      prompt: 'bug-fix',
      model: 'claude-3-sonnet',
      tokens: 180,
      cost: 0.009,
      duration: 2100,
      success: true
    }
  ]);
});

app.get('/api/prompts', (req, res) => {
  res.json([
    {
      name: 'code-review',
      category: 'examples', 
      content: '# Code Review Prompt\n\nReview this code for quality, security, and performance.',
      fullContent: '# Code Review Prompt\n\n## Task\nReview the following code for:\n- Code quality and best practices\n- Security vulnerabilities\n- Performance issues\n- Maintainability\n\n## Input\n```{{language}}\n{{code}}\n```\n\n## Output Format\nProvide structured feedback with specific suggestions for improvement.'
    },
    {
      name: 'bug-fix',
      category: 'examples',
      content: '# Bug Fix Prompt\n\nAnalyze and fix bugs in code.',
      fullContent: '# Bug Fix Prompt\n\n## Task\nAnalyze the following code and identify potential bugs.\n\n## Code\n```{{language}}\n{{code}}\n```\n\n## Error/Issue\n{{error_description}}\n\n## Expected Output\n1. Root cause analysis\n2. Proposed fix with explanation\n3. Prevention strategies'
    }
  ]);
});

app.get('/api/config', (req, res) => {
  res.json({
    config: {
      ui: { theme: 'dark', defaultModel: 'gpt-4', autoSave: true },
      logging: { enabled: true, includeResponses: true, retention: '30d' }
    },
    env: {
      OPENAI_API_KEY: '***configured***',
      ANTHROPIC_API_KEY: '***configured***',
      OPENAI_MODEL: 'gpt-4',
      ANTHROPIC_MODEL: 'claude-3-sonnet'
    }
  });
});

// Serve static assets
app.use('/_next/static', express.static(path.join(__dirname, 'dist/dashboard/_next/static')));

// Serve modified HTML with embedded CSS
app.get('*', (req, res) => {
  res.send(htmlContent);
});

app.listen(port, () => {
  console.log(`🎯 Working EasyAI Dashboard: http://localhost:${port}`);
  console.log('✅ CSS embedded directly into HTML');
  console.log('📊 Mock data included for testing');
});