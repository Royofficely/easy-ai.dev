const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 7546;

// Read the HTML file
const htmlPath = path.join(__dirname, 'dist/dashboard/index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Create a comprehensive CSS that covers the basic styling
const basicCSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { 
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #111827;
  color: #ffffff;
  min-height: 100vh;
}
.flex { display: flex; }
.h-screen { height: 100vh; }
.w-64 { width: 16rem; }
.flex-1 { flex: 1; }
.bg-gray-800 { background-color: #1f2937; }
.bg-gray-900 { background-color: #111827; }
.bg-gray-100 { background-color: #f3f4f6; }
.bg-white { background-color: #ffffff; }
.text-white { color: #ffffff; }
.text-gray-900 { color: #111827; }
.text-gray-600 { color: #4b5563; }
.text-gray-400 { color: #9ca3af; }
.text-gray-300 { color: #d1d5db; }
.p-6 { padding: 1.5rem; }
.p-8 { padding: 2rem; }
.p-4 { padding: 1rem; }
.p-3 { padding: 0.75rem; }
.p-2 { padding: 0.5rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.mb-8 { margin-bottom: 2rem; }
.mb-4 { margin-bottom: 1rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-1 { margin-top: 0.25rem; }
.mr-3 { margin-right: 0.75rem; }
.text-xl { font-size: 1.25rem; }
.text-3xl { font-size: 1.875rem; }
.text-lg { font-size: 1.125rem; }
.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
.font-bold { font-weight: 700; }
.font-medium { font-weight: 500; }
.rounded-lg { border-radius: 0.5rem; }
.rounded-md { border-radius: 0.375rem; }
.shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }
.border { border: 1px solid #e5e7eb; }
.space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.5rem; }
.space-y-6 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.5rem; }
.grid { display: grid; }
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.gap-6 { gap: 1.5rem; }
.gap-4 { gap: 1rem; }
.overflow-auto { overflow: auto; }
.w-full { width: 100%; }
.w-5 { width: 1.25rem; }
.h-5 { height: 1.25rem; }
.h-64 { height: 16rem; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.text-center { text-align: center; }
.absolute { position: absolute; }
.bottom-4 { bottom: 1rem; }
.left-4 { left: 1rem; }
.right-4 { right: 1rem; }
.relative { position: relative; }
.cursor-pointer { cursor: pointer; }
.transition-colors { transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out; }

/* Custom components */
.sidebar-link {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  transition: all 0.15s ease-in-out;
  color: #d1d5db;
  text-decoration: none;
  border: none;
  background: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
}
.sidebar-link:hover {
  background-color: #374151;
  color: #ffffff;
}
.sidebar-link.active {
  background-color: #2563eb;
  color: #ffffff;
}

.card {
  background-color: #1f2937;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  border: 1px solid #374151;
}

.btn-primary {
  background-color: #2563eb;
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.15s ease-in-out;
}
.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-secondary {
  background-color: #4b5563;
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.15s ease-in-out;
}
.btn-secondary:hover {
  background-color: #374151;
}

.bg-blue-600 { background-color: #2563eb; }
.bg-green-600 { background-color: #059669; }
.bg-yellow-600 { background-color: #d97706; }
.bg-purple-600 { background-color: #9333ea; }
.text-blue-600 { color: #2563eb; }
.text-green-600 { color: #059669; }
.text-yellow-600 { color: #d97706; }
.text-purple-600 { color: #9333ea; }

.bg-gray-50 { background-color: #f9fafb; }
.bg-gray-700 { background-color: #374151; }

@media (min-width: 1024px) {
  .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (min-width: 768px) {
  .md\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
`;

// Inject comprehensive CSS into HTML
htmlContent = htmlContent.replace(
  '<head>',
  `<head><style>${basicCSS}</style>`
);

console.log('🎯 Final server with comprehensive CSS');

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// API mocks (same as before)
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
  try {
    const prompts = [];
    const promptsBaseDir = path.join(__dirname, 'test-project/easyai/prompts');
    
    // Read all categories (directories)
    const categories = fs.readdirSync(promptsBaseDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const category of categories) {
      const categoryDir = path.join(promptsBaseDir, category);
      const files = fs.readdirSync(categoryDir)
        .filter(file => file.endsWith('.md'));
      
      for (const file of files) {
        const name = file.replace('.md', '');
        const filePath = path.join(categoryDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        prompts.push({
          name,
          category,
          content: content.substring(0, 200) + '...',
          fullContent: content
        });
      }
    }
    
    res.json(prompts);
  } catch (error) {
    console.error(`❌ Failed to read prompts: ${error.message}`);
    res.json([]);
  }
});

app.get('/api/config', (req, res) => {
  res.json({
    config: {
      ui: { theme: 'dark', defaultModel: 'gpt-4', autoSave: true },
      logging: { enabled: true, includeResponses: true, retention: '30d' }
    },
    env: {
      OPENAI_API_KEY: '***configured***',
      ANTHROPIC_API_KEY: '***configured***'
    }
  });
});

// Parse JSON bodies
app.use(express.json());

// Create/Update prompt
app.post('/api/prompts/:category/:name', (req, res) => {
  const { category, name } = req.params;
  const { content } = req.body;
  
  console.log(`Creating prompt: ${category}/${name}`);
  console.log(`Content: ${content?.substring(0, 100)}...`);
  
  try {
    // Create the actual file in the easyai directory
    const promptDir = path.join(__dirname, 'test-project/easyai/prompts', category);
    const promptFile = path.join(promptDir, `${name}.md`);
    
    // Ensure directory exists
    if (!fs.existsSync(promptDir)) {
      fs.mkdirSync(promptDir, { recursive: true });
    }
    
    // Write the prompt file
    fs.writeFileSync(promptFile, content, 'utf8');
    
    console.log(`✅ Prompt file created: ${promptFile}`);
    res.json({ success: true, message: `Prompt ${name} created successfully` });
  } catch (error) {
    console.error(`❌ Failed to create prompt: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to create prompt file' });
  }
});

// Get specific prompt
app.get('/api/prompts/:category/:name', (req, res) => {
  const { category, name } = req.params;
  
  try {
    // Read the actual file from the easyai directory
    const promptFile = path.join(__dirname, 'test-project/easyai/prompts', category, `${name}.md`);
    
    if (fs.existsSync(promptFile)) {
      const content = fs.readFileSync(promptFile, 'utf8');
      res.json({ name, category, content });
    } else {
      // Return default content if file doesn't exist
      res.json({
        name,
        category,
        content: `# ${name}\n\n## Description\nThis is a ${category} prompt.\n\n## Instructions\nAdd your prompt instructions here.\n\n## Input\n{{input}}\n\n## Output\nProvide your response here.`
      });
    }
  } catch (error) {
    console.error(`❌ Failed to read prompt: ${error.message}`);
    res.status(500).json({ error: 'Failed to read prompt file' });
  }
});

// Delete prompt
app.delete('/api/prompts/:category/:name', (req, res) => {
  const { category, name } = req.params;
  console.log(`Deleting prompt: ${category}/${name}`);
  
  try {
    // Delete the actual file from the easyai directory
    const promptFile = path.join(__dirname, 'test-project/easyai/prompts', category, `${name}.md`);
    
    if (fs.existsSync(promptFile)) {
      fs.unlinkSync(promptFile);
      console.log(`✅ Prompt file deleted: ${promptFile}`);
      res.json({ success: true, message: `Prompt ${name} deleted successfully` });
    } else {
      res.status(404).json({ success: false, error: 'Prompt file not found' });
    }
  } catch (error) {
    console.error(`❌ Failed to delete prompt: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to delete prompt file' });
  }
});

// Playground test
app.post('/api/playground/test', (req, res) => {
  const { prompt, model, variables } = req.body;
  
  console.log(`Playground test: ${model}`);
  console.log(`Prompt: ${prompt?.substring(0, 100)}...`);
  
  // Simulate AI response
  res.json({
    response: `This is a simulated response from ${model}.\n\nYour prompt was processed successfully. In a real implementation, this would be the actual AI response from the selected model.`,
    tokens: 42,
    cost: 0.001,
    duration: 1200
  });
});

// Save config
app.post('/api/config', (req, res) => {
  const { config, env } = req.body;
  console.log('Saving config:', { config, env });
  res.json({ success: true, message: 'Configuration saved successfully' });
});

// Serve static assets
app.use('/_next/static', express.static(path.join(__dirname, 'dist/dashboard/_next/static')));

// Serve modified HTML with embedded CSS
app.get('*', (req, res) => {
  res.send(htmlContent);
});

app.listen(port, () => {
  console.log(`🎯 Final EasyAI Dashboard: http://localhost:${port}`);
  console.log('✅ Complete CSS styling applied');
  console.log('📊 Full dashboard functionality working');
});