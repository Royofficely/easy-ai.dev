const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 7549;

// Read the complete professional CSS from your existing dashboard
const professionalCSS = fs.readFileSync('/Users/agentim.ai/Desktop/easyai-dev/dashboard/src/components/Dashboard.css', 'utf8');

// Read the original Next.js CSS for fonts and base styles
const originalCSS = fs.readFileSync(path.join(__dirname, 'dist/dashboard/_next/static/css/f409f51cd24a80df.css'), 'utf8');

// Enhanced HTML with professional design structure
const professionalHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>EasyAI Dashboard</title>
  <meta name="description" content="AI development tool dashboard"/>
  <style>
    ${originalCSS}
    ${professionalCSS}
    
    /* Modern SaaS Reset & Variables */
    :root {
      --bg-primary: #fcfcfd;
      --bg-secondary: #ffffff;
      --bg-tertiary: #f8f9fa;
      --border-primary: #e1e5e9;
      --border-secondary: #d0d7de;
      --text-primary: #0d1117;
      --text-secondary: #656d76;
      --text-tertiary: #8c959f;
      --accent-blue: #0969da;
      --accent-blue-hover: #0860ca;
      --accent-green: #1a7f37;
      --accent-red: #d1242f;
      --shadow-sm: 0 1px 2px rgba(31, 35, 40, 0.04);
      --shadow-md: 0 3px 12px rgba(31, 35, 40, 0.08);
      --shadow-lg: 0 8px 32px rgba(31, 35, 40, 0.12);
      --radius-sm: 6px;
      --radius-md: 8px;
      --radius-lg: 12px;
      --spacing-xs: 4px;
      --spacing-sm: 8px;
      --spacing-md: 16px;
      --spacing-lg: 24px;
      --spacing-xl: 32px;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      background: var(--bg-primary);
      color: var(--text-primary);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
    
    /* Modern Layout System */
    .dashboard-container {
      display: flex;
      height: 100vh;
      background: var(--bg-primary);
    }
    
    .professional-sidebar {
      width: 256px;
      background: var(--bg-secondary);
      border-right: 1px solid var(--border-primary);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      backdrop-filter: blur(8px);
    }
    
    .professional-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }
    
    .professional-content {
      flex: 1;
      padding: var(--spacing-xl);
      overflow-y: auto;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
    
    /* Premium Card Design */
    .professional-card {
      background: var(--bg-secondary);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-primary);
      box-shadow: var(--shadow-sm);
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }
    
    .professional-card:hover {
      border-color: var(--border-secondary);
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }
    
    .card-content {
      padding: var(--spacing-xl);
    }
    
    .card-header {
      padding: var(--spacing-lg) var(--spacing-xl);
      border-bottom: 1px solid var(--border-primary);
      background: var(--bg-tertiary);
    }
    
    /* Modern Navigation */
    .professional-nav-item {
      display: flex;
      align-items: center;
      padding: var(--spacing-sm) var(--spacing-md);
      margin: 2px var(--spacing-sm);
      border: none;
      background: none;
      color: var(--text-secondary);
      border-radius: var(--radius-sm);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
      text-align: left;
      width: calc(100% - 16px);
      height: 36px;
      position: relative;
    }
    
    .professional-nav-item:hover {
      background: var(--bg-tertiary);
      color: var(--text-primary);
    }
    
    .professional-nav-item.active {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      font-weight: 600;
    }
    
    .professional-nav-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 2px;
      height: 20px;
      background: var(--accent-blue);
      border-radius: 0 2px 2px 0;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Premium Form System */
    .form-group {
      margin-bottom: var(--spacing-lg);
    }
    
    .form-label {
      display: block;
      font-weight: 500;
      color: var(--text-primary);
      font-size: 14px;
      margin-bottom: var(--spacing-sm);
      line-height: 1.4;
    }
    
    .form-input, .multi-select, select, input, textarea {
      width: 100%;
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-md);
      background: var(--bg-secondary);
      font-family: inherit;
      font-size: 14px;
      padding: 12px 16px;
      color: var(--text-primary);
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
      line-height: 1.5;
      outline: none;
    }
    
    .form-input:hover, .multi-select:hover, select:hover, input:hover, textarea:hover {
      border-color: var(--border-secondary);
    }
    
    .form-input:focus, .multi-select:focus, select:focus, input:focus, textarea:focus {
      border-color: var(--accent-blue);
      box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.12);
    }
    
    /* Premium Multi-select */
    .multi-select {
      padding: var(--spacing-sm);
      min-height: 120px;
      max-height: 200px;
    }
    
    .multi-select option {
      padding: 12px 16px;
      border: none;
      background: var(--bg-secondary);
      color: var(--text-primary);
      cursor: pointer;
      margin: 2px;
      border-radius: var(--radius-sm);
      font-size: 14px;
      line-height: 1.4;
      transition: all 150ms ease;
    }
    
    .multi-select option:hover {
      background: var(--bg-tertiary);
    }
    
    .multi-select option:checked {
      background: var(--accent-blue);
      color: white;
      font-weight: 500;
    }
    
    .multi-select optgroup {
      font-weight: 600;
      color: var(--text-secondary);
      background: var(--bg-tertiary);
      padding: var(--spacing-sm) var(--spacing-md);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: var(--radius-sm);
      margin: 2px;
    }
    
    .multi-select optgroup option {
      padding-left: var(--spacing-xl);
      font-weight: normal;
      text-transform: none;
      font-size: 14px;
      letter-spacing: normal;
    }
    
    /* Premium Button System */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      padding: 12px 20px;
      border-radius: var(--radius-md);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
      text-decoration: none;
      border: 1px solid transparent;
      outline: none;
      position: relative;
      overflow: hidden;
    }
    
    .btn-primary {
      background: var(--accent-blue);
      color: white;
      border-color: var(--accent-blue);
    }
    
    .btn-primary:hover {
      background: var(--accent-blue-hover);
      border-color: var(--accent-blue-hover);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }
    
    .btn-primary:active {
      transform: translateY(0);
      box-shadow: var(--shadow-sm);
    }
    
    .btn-secondary {
      background: var(--bg-secondary);
      color: var(--text-primary);
      border-color: var(--border-primary);
    }
    
    .btn-secondary:hover {
      background: var(--bg-tertiary);
      border-color: var(--border-secondary);
    }
    
    /* Override old button styles */
    button {
      background: var(--accent-blue) !important;
      color: white !important;
      border: 1px solid var(--accent-blue) !important;
      border-radius: var(--radius-md) !important;
      padding: 12px 20px !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      cursor: pointer !important;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1) !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: var(--spacing-sm) !important;
      outline: none !important;
    }
    
    button:hover {
      background: var(--accent-blue-hover) !important;
      border-color: var(--accent-blue-hover) !important;
      transform: translateY(-1px) !important;
      box-shadow: var(--shadow-md) !important;
    }
    
    /* Typography System */
    h1, h2, h3, h4, h5, h6 {
      color: var(--text-primary);
      font-weight: 600;
      letter-spacing: -0.01em;
      line-height: 1.3;
    }
    
    h1 { font-size: 32px; }
    h2 { font-size: 28px; }
    h3 { font-size: 20px; }
    h4 { font-size: 18px; }
    h5 { font-size: 16px; }
    h6 { font-size: 14px; }
    
    .text-secondary {
      color: var(--text-secondary);
    }
    
    .text-tertiary {
      color: var(--text-tertiary);
    }
    
    /* Premium Textarea */
    textarea {
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', monospace;
      line-height: 1.6;
      resize: vertical;
      min-height: 120px;
    }
    
    /* Status System */
    .status {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 500;
    }
    
    .status-success {
      color: var(--accent-green);
      background: rgba(26, 127, 55, 0.1);
    }
    
    .status-error {
      color: var(--accent-red);
      background: rgba(209, 36, 47, 0.1);
    }
    
    .status-info {
      color: var(--accent-blue);
      background: rgba(9, 105, 218, 0.1);
    }
    
    /* Utilities */
    .mb-sm { margin-bottom: var(--spacing-sm) !important; }
    .mb-md { margin-bottom: var(--spacing-md) !important; }
    .mb-lg { margin-bottom: var(--spacing-lg) !important; }
    .mb-xl { margin-bottom: var(--spacing-xl) !important; }
    
    .mt-sm { margin-top: var(--spacing-sm) !important; }
    .mt-md { margin-top: var(--spacing-md) !important; }
    .mt-lg { margin-top: var(--spacing-lg) !important; }
    .mt-xl { margin-top: var(--spacing-xl) !important; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    // Professional dashboard with vanilla JavaScript
    let activeTab = 'analytics';
    let data = { analytics: null, logs: [], prompts: [] };
    
    // Fetch initial data
    Promise.all([
      fetch('/api/analytics').then(r => r.json()),
      fetch('/api/logs').then(r => r.json()),
      fetch('/api/prompts').then(r => r.json()),
      fetch('/api/config').then(r => r.json())
    ]).then(([analytics, logs, prompts, config]) => {
      data = { analytics, logs, prompts, config };
      render();
    });

    const Dashboard = () => {
      
      const renderContent = () => {
        switch(activeTab) {
          case 'analytics':
            return \`
              <div style="margin-bottom: 32px;">
                <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Analytics</h2>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Track your AI usage, costs, and performance</p>
              </div>
              
              <div class="analytics-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
                <div class="professional-card" style="text-align: center;">
                  <h3 style="font-size: 0.875rem; color: #666666; margin-bottom: 0.5rem;">Total Calls</h3>
                  <p style="font-size: 2rem; font-weight: 700; color: #2563eb; margin: 0;">\${data.analytics?.totalCalls || 0}</p>
                </div>
                <div class="professional-card" style="text-align: center;">
                  <h3 style="font-size: 0.875rem; color: #666666; margin-bottom: 0.5rem;">Total Tokens</h3>
                  <p style="font-size: 2rem; font-weight: 700; color: #10b981; margin: 0;">\${(data.analytics?.totalTokens || 0).toLocaleString()}</p>
                </div>
                <div class="professional-card" style="text-align: center;">
                  <h3 style="font-size: 0.875rem; color: #666666; margin-bottom: 0.5rem;">Total Cost</h3>
                  <p style="font-size: 2rem; font-weight: 700; color: #f59e0b; margin: 0;">$\${(data.analytics?.totalCost || 0).toFixed(4)}</p>
                </div>
                <div class="professional-card" style="text-align: center;">
                  <h3 style="font-size: 0.875rem; color: #666666; margin-bottom: 0.5rem;">Success Rate</h3>
                  <p style="font-size: 2rem; font-weight: 700; color: #8b5cf6; margin: 0;">100%</p>
                </div>
              </div>
              
              <div class="professional-card">
                <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">Recent Activity</h3>
                <div style="space-y: 0.75rem;">
                  \${data.logs.slice(0, 5).map(log => \`
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f9fafb; border-radius: 0.5rem; margin-bottom: 0.5rem;">
                      <div>
                        <div style="font-weight: 500; color: #1a1a1a;">\${log.prompt}</div>
                        <div style="font-size: 0.875rem; color: #666666;">\${log.model} • \${new Date(log.timestamp).toLocaleString()}</div>
                      </div>
                      <div style="text-align: right;">
                        <div style="font-weight: 500; color: #1a1a1a;">\${log.tokens || 0} tokens</div>
                        <div style="font-size: 0.875rem; color: #666666;">$\${(log.cost || 0).toFixed(4)}</div>
                      </div>
                    </div>
                  \`).join('')}
                </div>
              </div>
            \`;
            
          case 'prompts':
            return \`
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;">
                <div>
                  <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Prompts</h2>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">Manage your prompt templates and workflows</p>
                </div>
                <button class="btn-primary" onclick="createNewPrompt()">
                  New Prompt
                </button>
              </div>
              
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
                \${data.prompts.map(prompt => \`
                  <div class="professional-card">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                      <div>
                        <h3 style="font-weight: 600; margin: 0 0 0.25rem 0;">\${prompt.name}</h3>
                        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                          <span style="font-size: 0.75rem; padding: 0.25rem 0.5rem; background: #f3f4f6; border-radius: 0.25rem; text-transform: uppercase; color: #666666;">\${prompt.category}</span>
                          \${prompt.model ? \`<span style="font-size: 0.75rem; padding: 0.25rem 0.5rem; background: #e0f2fe; border-radius: 0.25rem; color: #0277bd;">\${prompt.model}</span>\` : ''}
                        </div>
                        \${prompt.variables && prompt.variables.length > 0 ? \`<div style="font-size: 0.75rem; color: #666666;">Variables: \${prompt.variables.join(', ')}</div>\` : ''}
                      </div>
                      <button onclick="editPrompt('\${prompt.name}', '\${prompt.category}')" style="background: none; border: none; color: #666666; cursor: pointer;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </div>
                    <p style="color: #666666; font-size: 0.875rem; line-height: 1.5; margin: 0;">\${prompt.description || prompt.content}</p>
                  </div>
                \`).join('')}
              </div>
            \`;
            
          case 'logs':
            return \`
              <div style="margin-bottom: 32px;">
                <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Logs</h2>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">View all AI API calls, responses, and usage data</p>
              </div>
              
              <div class="professional-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                  <h3 style="margin: 0; font-weight: 600;">Recent API Calls</h3>
                  <div style="display: flex; gap: 0.5rem;">
                    <select style="padding: 0.5rem; border: 1px solid #e6e6e6; border-radius: 0.375rem; font-size: 0.875rem;">
                      <option value="all">All Models</option>
                      <option value="gpt-4">GPT-4</option>
                      <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </select>
                  </div>
                </div>
                
                \${data.logs.length === 0 ? \`
                  <div style="text-align: center; padding: 3rem; color: #666666;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 1rem; opacity: 0.5;">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    <h3 style="margin: 0 0 0.5rem 0; color: #666666;">No API calls yet</h3>
                    <p style="margin: 0; font-size: 0.875rem;">Start using EasyAI CLI commands to see your usage history here</p>
                  </div>
                \` : \`
                  <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <thead>
                        <tr style="border-bottom: 1px solid #e6e6e6;">
                          <th style="text-align: left; padding: 0.75rem 0.5rem; font-weight: 600; color: #666666; font-size: 0.875rem;">Timestamp</th>
                          <th style="text-align: left; padding: 0.75rem 0.5rem; font-weight: 600; color: #666666; font-size: 0.875rem;">Prompt</th>
                          <th style="text-align: left; padding: 0.75rem 0.5rem; font-weight: 600; color: #666666; font-size: 0.875rem;">Model</th>
                          <th style="text-align: right; padding: 0.75rem 0.5rem; font-weight: 600; color: #666666; font-size: 0.875rem;">Tokens</th>
                          <th style="text-align: right; padding: 0.75rem 0.5rem; font-weight: 600; color: #666666; font-size: 0.875rem;">Cost</th>
                          <th style="text-align: right; padding: 0.75rem 0.5rem; font-weight: 600; color: #666666; font-size: 0.875rem;">Duration</th>
                          <th style="text-align: center; padding: 0.75rem 0.5rem; font-weight: 600; color: #666666; font-size: 0.875rem;">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        \${data.logs.map(log => \`
                          <tr style="border-bottom: 1px solid #f0f0f0;">
                            <td style="padding: 0.75rem 0.5rem; font-size: 0.875rem; color: #666666;">
                              \${new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td style="padding: 0.75rem 0.5rem; font-weight: 500;">
                              \${log.prompt}
                            </td>
                            <td style="padding: 0.75rem 0.5rem;">
                              <span style="font-size: 0.75rem; padding: 0.25rem 0.5rem; background: #f3f4f6; border-radius: 0.25rem; text-transform: uppercase; font-weight: 500;">
                                \${log.model}
                              </span>
                            </td>
                            <td style="padding: 0.75rem 0.5rem; text-align: right; font-weight: 500;">
                              \${(log.tokens || 0).toLocaleString()}
                            </td>
                            <td style="padding: 0.75rem 0.5rem; text-align: right; font-weight: 500; color: #f59e0b;">
                              $\${(log.cost || 0).toFixed(4)}
                            </td>
                            <td style="padding: 0.75rem 0.5rem; text-align: right; color: #666666;">
                              \${log.duration || 0}ms
                            </td>
                            <td style="padding: 0.75rem 0.5rem; text-align: center;">
                              <span style="display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 0.25rem; \${log.success ? 'background: #ecfdf5; color: #065f46;' : 'background: #fef2f2; color: #991b1b;'}">
                                \${log.success ? '✓ Success' : '✗ Failed'}
                              </span>
                            </td>
                          </tr>
                        \`).join('')}
                      </tbody>
                    </table>
                  </div>
                \`}
              </div>
            \`;
            
          case 'playground':
            return \`
              <div class="mb-xl">
                <h2 class="mb-sm">Playground</h2>
                <p class="text-secondary">Test and experiment with your prompts</p>
              </div>
              
              <div style="display: grid; grid-template-columns: 400px 1fr; gap: var(--spacing-lg);">
                <div class="professional-card">
                  <div class="card-content">
                    <h4 class="mb-lg">Configuration</h4>
                    
                    <div class="form-group">
                      <label class="form-label">Models</label>
                      <select id="modelSelect" multiple class="multi-select" style="height: 140px;">
                        <option value="" disabled>Loading models...</option>
                      </select>
                      <div class="text-tertiary" style="font-size: 12px; margin-top: var(--spacing-xs);">
                        Hold ⌘/Ctrl to select multiple
                      </div>
                    </div>
                    
                    <div class="form-group">
                      <label class="form-label">Template</label>
                      <select id="templateSelect" onchange="loadTemplate()" class="form-input">
                        <option value="">Choose a template...</option>
                      </select>
                    </div>
                    
                    <div id="variablesSection" class="form-group" style="display: none;">
                      <label class="form-label">Variables</label>
                      <div id="variableInputs" style="display: grid; gap: var(--spacing-sm);"></div>
                    </div>
                    
                    <div class="form-group">
                      <label class="form-label">Prompt</label>
                      <textarea id="promptInput" placeholder="Enter your prompt here or select a template above..." class="form-input" style="height: 200px;" oninput="detectVariables()"></textarea>
                    </div>
                    
                    <button onclick="testMultipleModels()" style="width: 100%;" class="btn btn-primary">
                      Test Models
                    </button>
                  </div>
                </div>
                
                <div class="professional-card">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="margin: 0;">Model Comparison Results</h3>
                    <div style="display: flex; gap: 0.5rem;">
                      <button onclick="exportResults()" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: #f3f4f6; border: 1px solid #e6e6e6; border-radius: 0.25rem; color: #666666; cursor: pointer;">
                        Export CSV
                      </button>
                      <button onclick="clearResults()" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: #f3f4f6; border: 1px solid #e6e6e6; border-radius: 0.25rem; color: #666666; cursor: pointer;">
                        Clear
                      </button>
                    </div>
                  </div>
                  <div id="comparisonResults" style="height: 500px; overflow: auto; border: 1px solid #e6e6e6; border-radius: 0.375rem; background: #fafafa;">
                    <div style="padding: 2rem; text-align: center; color: #666666;">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 1rem; opacity: 0.5;">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                      </svg>
                      <p>Select models and run a prompt to see comparison results</p>
                    </div>
                  </div>
                </div>
              </div>
            \`;
            
          case 'settings':
            return \`
              <div style="margin-bottom: 32px;">
                <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Settings</h2>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Manage your account and AI provider settings</p>
              </div>
              
              <div class="professional-card">
                <h3 style="margin: 0 0 1.5rem 0;">API Configuration</h3>
                <div style="display: grid; gap: 1rem;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                      <label style="font-weight: 500;">OpenAI API Key</label>
                      \${data.config?.env?.OPENAI_API_KEY ? 
                        '<span style="display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; padding: 0.25rem 0.5rem; background: #ecfdf5; color: #065f46; border-radius: 0.25rem;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>Configured</span>' : 
                        '<span style="display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; padding: 0.25rem 0.5rem; background: #fef2f2; color: #991b1b; border-radius: 0.25rem;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>Not configured</span>'
                      }
                    </div>
                    <input id="openaiKey" type="password" placeholder="sk-..." value="\${data.config?.env?.OPENAI_API_KEY === '***configured***' ? '' : (data.config?.env?.OPENAI_API_KEY || '')}" style="width: 100%; padding: 0.5rem; border: 1px solid #e6e6e6; border-radius: 0.375rem;">
                    <small style="color: #666666;">Used for GPT-4, GPT-3.5, and other OpenAI models</small>
                  </div>
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                      <label style="font-weight: 500;">Anthropic API Key</label>
                      \${data.config?.env?.ANTHROPIC_API_KEY ? 
                        '<span style="display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; padding: 0.25rem 0.5rem; background: #ecfdf5; color: #065f46; border-radius: 0.25rem;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>Configured</span>' : 
                        '<span style="display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; padding: 0.25rem 0.5rem; background: #fef2f2; color: #991b1b; border-radius: 0.25rem;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>Not configured</span>'
                      }
                    </div>
                    <input id="anthropicKey" type="password" placeholder="sk-ant-..." value="\${data.config?.env?.ANTHROPIC_API_KEY === '***configured***' ? '' : (data.config?.env?.ANTHROPIC_API_KEY || '')}" style="width: 100%; padding: 0.5rem; border: 1px solid #e6e6e6; border-radius: 0.375rem;">
                    <small style="color: #666666;">Used for Claude models</small>
                  </div>
                  <div>
                    <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Default OpenAI Model</label>
                    <div style="position: relative;">
                      <select id="openaiModel" style="width: 100%; padding: 0.5rem; border: 1px solid #e6e6e6; border-radius: 0.375rem; background: white; font-family: inherit; font-size: 14px; appearance: none; background-image: url('data:image/svg+xml;utf8,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"12\\" height=\\"12\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\"><polyline points=\\"6,9 12,15 18,9\\"/></svg>'); background-repeat: no-repeat; background-position: right 0.5rem center; padding-right: 2.5rem;">
                        <option value="gpt-4" \${data.config?.env?.OPENAI_MODEL === 'gpt-4' ? 'selected' : ''}>GPT-4</option>
                        <option value="gpt-3.5-turbo" \${data.config?.env?.OPENAI_MODEL === 'gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5 Turbo</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Default Anthropic Model</label>
                    <div style="position: relative;">
                      <select id="anthropicModel" style="width: 100%; padding: 0.5rem; border: 1px solid #e6e6e6; border-radius: 0.375rem; background: white; font-family: inherit; font-size: 14px; appearance: none; background-image: url('data:image/svg+xml;utf8,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"12\\" height=\\"12\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\"><polyline points=\\"6,9 12,15 18,9\\"/></svg>'); background-repeat: no-repeat; background-position: right 0.5rem center; padding-right: 2.5rem;">
                        <option value="claude-3-sonnet" \${data.config?.env?.ANTHROPIC_MODEL === 'claude-3-sonnet' ? 'selected' : ''}>Claude 3 Sonnet</option>
                        <option value="claude-3-haiku" \${data.config?.env?.ANTHROPIC_MODEL === 'claude-3-haiku' ? 'selected' : ''}>Claude 3 Haiku</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                      <label style="font-weight: 500;">Ollama API URL</label>
                      \${data.config?.env?.OLLAMA_BASE_URL ? 
                        '<span style="display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; padding: 0.25rem 0.5rem; background: #ecfdf5; color: #065f46; border-radius: 0.25rem;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>Configured</span>' : 
                        '<span style="display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; padding: 0.25rem 0.5rem; background: #fef2f2; color: #991b1b; border-radius: 0.25rem;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>Not configured</span>'
                      }
                    </div>
                    <input id="ollamaUrl" type="text" placeholder="http://localhost:11434" value="\${data.config?.env?.OLLAMA_BASE_URL || ''}" style="width: 100%; padding: 0.5rem; border: 1px solid #e6e6e6; border-radius: 0.375rem;">
                    <small style="color: #666666;">Local Ollama server URL for open-source models</small>
                  </div>
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                      <label style="font-weight: 500;">OpenRouter API Key</label>
                      \${data.config?.env?.OPENROUTER_API_KEY ? 
                        '<span style="display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; padding: 0.25rem 0.5rem; background: #ecfdf5; color: #065f46; border-radius: 0.25rem;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>Configured</span>' : 
                        '<span style="display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; padding: 0.25rem 0.5rem; background: #fef2f2; color: #991b1b; border-radius: 0.25rem;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>Not configured</span>'
                      }
                    </div>
                    <input id="openrouterKey" type="password" placeholder="sk-or-..." value="\${data.config?.env?.OPENROUTER_API_KEY || ''}" style="width: 100%; padding: 0.5rem; border: 1px solid #e6e6e6; border-radius: 0.375rem;">
                    <small style="color: #666666;">Access to 100+ models through OpenRouter</small>
                  </div>
                </div>
                <button onclick="saveSettings()" class="btn-primary" style="margin-top: 1.5rem;">Save Settings</button>
              </div>
            \`;
            
          default:
            return '<div>Select a section</div>';
        }
      };
      
      return \`
        <div class="dashboard-container">
          <div class="professional-sidebar">
            <div style="padding: var(--spacing-lg); border-bottom: 1px solid var(--border-primary);">
              <h5 style="margin: 0;">EasyAI</h5>
            </div>
            
            <nav style="flex: 1; padding: var(--spacing-md);">
              <button class="professional-nav-item \${activeTab === 'analytics' ? 'active' : ''}" onclick="setActiveTab('analytics')">
                Analytics
              </button>
              <button class="professional-nav-item \${activeTab === 'prompts' ? 'active' : ''}" onclick="setActiveTab('prompts')">
                Prompts
              </button>
              <button class="professional-nav-item \${activeTab === 'logs' ? 'active' : ''}" onclick="setActiveTab('logs')">
                Logs
              </button>
              <button class="professional-nav-item \${activeTab === 'playground' ? 'active' : ''}" onclick="setActiveTab('playground')">
                Playground
              </button>
              <button class="professional-nav-item \${activeTab === 'settings' ? 'active' : ''}" onclick="setActiveTab('settings')">
                Settings
              </button>
            </nav>
          </div>
          
          <div class="professional-main">
            <div class="professional-content">
              \${renderContent()}
            </div>
          </div>
        </div>
      \`;
    };
    
    // Global functions
    window.setActiveTab = (tab) => {
      activeTab = tab;
      render();
      
      // Load models and templates when switching to playground
      if (tab === 'playground') {
        setTimeout(() => {
          window.refreshModels();
          window.loadTemplates();
        }, 100);
      }
    };
    
    window.createNewPrompt = () => {
      showPromptModal();
    };
    
    window.showPromptModal = (editMode = false, promptData = null) => {
      const modalHTML = \`
        <div id="promptModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
          <div style="background: white; border-radius: 8px; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto; padding: 0;">
            <div style="padding: 24px; border-bottom: 1px solid #e6e6e6;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 600;">\${editMode ? 'Edit Prompt' : 'Create New Prompt'}</h2>
            </div>
            <div style="padding: 24px;">
              <div style="display: grid; gap: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                  <div>
                    <label style="display: block; font-weight: 500; margin-bottom: 8px;">Name *</label>
                    <input id="promptName" type="text" placeholder="e.g., Code Review" value="\${promptData?.name || ''}" style="width: 100%; padding: 8px 12px; border: 1px solid #e6e6e6; border-radius: 6px;">
                  </div>
                  <div>
                    <label style="display: block; font-weight: 500; margin-bottom: 8px;">Category *</label>
                    <select id="promptCategory" style="width: 100%; padding: 8px 12px; border: 1px solid #e6e6e6; border-radius: 6px;">
                      <option value="custom" \${promptData?.category === 'custom' ? 'selected' : ''}>Custom</option>
                      <option value="examples" \${promptData?.category === 'examples' ? 'selected' : ''}>Examples</option>
                      <option value="templates" \${promptData?.category === 'templates' ? 'selected' : ''}>Templates</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label style="display: block; font-weight: 500; margin-bottom: 8px;">Description *</label>
                  <input id="promptDescription" type="text" placeholder="Describe what this prompt does..." value="\${promptData?.description || ''}" style="width: 100%; padding: 8px 12px; border: 1px solid #e6e6e6; border-radius: 6px;">
                </div>
                
                <div>
                  <label style="display: block; font-weight: 500; margin-bottom: 8px;">Preferred Model</label>
                  <select id="promptModel" style="width: 100%; padding: 8px 12px; border: 1px solid #e6e6e6; border-radius: 6px;">
                    <option value="">Auto (use default)</option>
                    <option value="gpt-4" \${promptData?.model === 'gpt-4' ? 'selected' : ''}>GPT-4</option>
                    <option value="gpt-3.5-turbo" \${promptData?.model === 'gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5 Turbo</option>
                    <option value="claude-3-sonnet" \${promptData?.model === 'claude-3-sonnet' ? 'selected' : ''}>Claude 3 Sonnet</option>
                    <option value="claude-3-haiku" \${promptData?.model === 'claude-3-haiku' ? 'selected' : ''}>Claude 3 Haiku</option>
                  </select>
                </div>
                
                <div>
                  <label style="display: block; font-weight: 500; margin-bottom: 8px;">Variables</label>
                  <input id="promptVariables" type="text" placeholder="e.g., input, context, language (comma-separated)" value="\${promptData?.variables || ''}" style="width: 100%; padding: 8px 12px; border: 1px solid #e6e6e6; border-radius: 6px;">
                  <small style="color: #666666;">Variables will be available as {{variable_name}} in your prompt</small>
                </div>
                
                <div>
                  <label style="display: block; font-weight: 500; margin-bottom: 8px;">Prompt Content *</label>
                  <textarea id="promptContent" placeholder="Enter your prompt here. Use {{variable_name}} for variables." style="width: 100%; height: 200px; padding: 12px; border: 1px solid #e6e6e6; border-radius: 6px; font-family: monospace; resize: vertical;">\${promptData?.content || ''}</textarea>
                </div>
              </div>
              
              <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e6e6e6;">
                <button onclick="closePromptModal()" style="padding: 8px 16px; border: 1px solid #e6e6e6; background: white; border-radius: 6px; cursor: pointer;">Cancel</button>
                <button onclick="savePrompt(\${editMode})" style="padding: 8px 16px; background: #000; color: white; border: none; border-radius: 6px; cursor: pointer;">Save Prompt</button>
              </div>
            </div>
          </div>
        </div>
      \`;
      
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    };
    
    window.closePromptModal = () => {
      const modal = document.getElementById('promptModal');
      if (modal) modal.remove();
    };
    
    window.savePrompt = (editMode = false) => {
      const name = document.getElementById('promptName').value.trim();
      const category = document.getElementById('promptCategory').value;
      const description = document.getElementById('promptDescription').value.trim();
      const model = document.getElementById('promptModel').value;
      const variables = document.getElementById('promptVariables').value.trim();
      const content = document.getElementById('promptContent').value.trim();
      
      if (!name || !description || !content) {
        alert('Please fill in all required fields (Name, Description, Content)');
        return;
      }
      
      const promptData = {
        name,
        category,
        description,
        model,
        variables: variables.split(',').map(v => v.trim()).filter(v => v),
        content,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };
      
      fetch(\`/api/prompts/\${category}/\${name}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptData)
      }).then(response => response.json())
      .then(data => {
        if (data.success) {
          closePromptModal();
          // Refresh prompts data
          fetch('/api/prompts').then(r => r.json()).then(prompts => {
            data.prompts = prompts;
            render();
          });
        } else {
          alert('Failed to save prompt: ' + (data.error || 'Unknown error'));
        }
      });
    };
    
    window.editPrompt = (name, category) => {
      fetch(\`/api/prompts/\${category}/\${name}\`)
        .then(r => r.json())
        .then(promptData => {
          showPromptModal(true, promptData);
        })
        .catch(error => {
          console.error('Failed to fetch prompt data:', error);
          alert('Failed to load prompt data for editing');
        });
    };
    
    window.testPrompt = () => {
      const prompt = document.getElementById('promptInput').value;
      const model = document.getElementById('modelSelect').value;
      const output = document.getElementById('playgroundOutput');
      
      if (!prompt.trim()) {
        output.textContent = 'Please enter a prompt first.';
        return;
      }
      
      output.textContent = 'Testing prompt...';
      
      fetch('/api/playground/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model })
      })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          const errorOutput = {
            error: data.error,
            timestamp: new Date().toISOString()
          };
          output.textContent = JSON.stringify(errorOutput, null, 2);
        } else {
          const apiResponse = {
            response: data.response,
            metadata: {
              model: model,
              tokens: data.tokens,
              cost: parseFloat(data.cost),
              duration: data.duration + 'ms',
              timestamp: new Date().toISOString()
            }
          };
          displayJsonTree(apiResponse);
        }
      })
      .catch(err => {
        const errorOutput = {
          error: 'Network error: ' + err.message,
          timestamp: new Date().toISOString()
        };
        output.textContent = JSON.stringify(errorOutput, null, 2);
      });
    };
    
    // JSON Tree Viewer Functions
    function createJsonTree(obj, level) {
      level = level || 0;
      
      if (obj === null) return '<span style="color: #f8c555;">null</span>';
      if (obj === undefined) return '<span style="color: #f8c555;">undefined</span>';
      
      const type = typeof obj;
      if (type === 'string') {
        return '<span style="color: #a5d6a7;">"' + obj.replace(/"/g, '&quot;') + '"</span>';
      }
      if (type === 'number') {
        return '<span style="color: #64b5f6;">' + obj + '</span>';
      }
      if (type === 'boolean') {
        return '<span style="color: #f8c555;">' + obj + '</span>';
      }
      
      if (Array.isArray(obj)) {
        if (obj.length === 0) return '<span style="color: #999;">[]</span>';
        
        const id = 'tree_' + Math.random().toString(36).substr(2, 9);
        let html = '<span onclick="toggleTree(\\'' + id + '\\')" style="cursor: pointer; color: #999;">▼ [</span>';
        html += '<div id="' + id + '" style="margin-left: 20px;">';
        
        for (let i = 0; i < obj.length; i++) {
          html += '<div>';
          html += createJsonTree(obj[i], level + 1);
          if (i < obj.length - 1) html += '<span style="color: #999;">,</span>';
          html += '</div>';
        }
        
        html += '</div><span style="color: #999;">]</span>';
        return html;
      }
      
      if (type === 'object') {
        const keys = Object.keys(obj);
        if (keys.length === 0) return '<span style="color: #999;">{}</span>';
        
        const id = 'tree_' + Math.random().toString(36).substr(2, 9);
        let html = '<span onclick="toggleTree(\\'' + id + '\\')" style="cursor: pointer; color: #999;">▼ {</span>';
        html += '<div id="' + id + '" style="margin-left: 20px;">';
        
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          html += '<div>';
          html += '<span style="color: #e1bee7;">"' + key + '"</span><span style="color: #999;">: </span>';
          html += createJsonTree(obj[key], level + 1);
          if (i < keys.length - 1) html += '<span style="color: #999;">,</span>';
          html += '</div>';
        }
        
        html += '</div><span style="color: #999;">}</span>';
        return html;
      }
      
      return String(obj);
    }
    
    window.toggleTree = (id) => {
      const element = document.getElementById(id);
      const toggle = element.previousElementSibling;
      
      if (element.style.display === 'none') {
        element.style.display = 'block';
        toggle.textContent = toggle.textContent.replace('▶', '▼');
      } else {
        element.style.display = 'none';
        toggle.textContent = toggle.textContent.replace('▼', '▶');
      }
    };
    
    function displayJsonTree(data) {
      const output = document.getElementById('playgroundOutput');
      try {
        const jsonObj = typeof data === 'string' ? JSON.parse(data) : data;
        output.innerHTML = createJsonTree(jsonObj);
      } catch (e) {
        // Fallback to plain text if not valid JSON
        output.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      }
    }
    
    window.copyOutput = () => {
      const output = document.getElementById('playgroundOutput');
      const text = output.textContent || output.innerText;
      navigator.clipboard.writeText(text).then(() => {
        // Brief visual feedback
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 1000);
      });
    };
    
    window.clearOutput = () => {
      const output = document.getElementById('playgroundOutput');
      output.innerHTML = '<span style="color: #999;">Run a prompt to see the response...</span>';
    };
    
    window.selectAllModels = () => {
      const modelSelect = document.getElementById('modelSelect');
      for (let option of modelSelect.options) {
        option.selected = true;
      }
    };
    
    window.clearModelSelection = () => {
      const modelSelect = document.getElementById('modelSelect');
      for (let option of modelSelect.options) {
        option.selected = false;
      }
    };
    
    window.testMultipleModels = async () => {
      const modelSelect = document.getElementById('modelSelect');
      const promptInput = document.getElementById('promptInput');
      const resultsContainer = document.getElementById('comparisonResults');
      
      const selectedModels = Array.from(modelSelect.selectedOptions).map(option => option.value).filter(v => v);
      
      if (selectedModels.length === 0) {
        showNotification('Please select at least one model', 'error');
        return;
      }
      
      if (!promptInput.value.trim()) {
        showNotification('Please enter a prompt', 'error');
        return;
      }
      
      // Replace variables in the prompt
      const processedPrompt = replaceVariables(promptInput.value);
      
      // Show loading state
      resultsContainer.innerHTML = '<div style="padding: 2rem; text-align: center;"><div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #333; border-radius: 50%; animation: spin 1s linear infinite;"></div><p style="margin-top: 1rem;">Testing ' + selectedModels.length + ' models...</p></div>';
      
      const results = [];
      const startTime = Date.now();
      
      // Test each model
      for (let i = 0; i < selectedModels.length; i++) {
        const model = selectedModels[i];
        try {
          const modelStartTime = Date.now();
          const response = await fetch('/api/playground/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: processedPrompt, model })
          });
          
          const data = await response.json();
          const modelEndTime = Date.now();
          
          results.push({
            model: model,
            success: !data.error,
            response: data.error || data.response,
            tokens: data.tokens || 0,
            cost: data.cost || 0,
            duration: modelEndTime - modelStartTime,
            error: data.error || null
          });
          
          // Update progress
          resultsContainer.innerHTML = '<div style="padding: 2rem; text-align: center;"><div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #333; border-radius: 50%; animation: spin 1s linear infinite;"></div><p style="margin-top: 1rem;">Completed ' + (i + 1) + ' of ' + selectedModels.length + ' models...</p></div>';
          
        } catch (error) {
          results.push({
            model: model,
            success: false,
            response: 'Network error: ' + error.message,
            tokens: 0,
            cost: 0,
            duration: 0,
            error: error.message
          });
        }
      }
      
      displayComparisonResults(results);
    };
    
    function displayComparisonResults(results) {
      const container = document.getElementById('comparisonResults');
      
      let html = '<table style="width: 100%; border-collapse: collapse; font-size: 14px;">';
      html += '<thead><tr style="background: #f5f5f5; border-bottom: 2px solid #e6e6e6;">';
      html += '<th style="padding: 12px; text-align: left; font-weight: 600;">Model</th>';
      html += '<th style="padding: 12px; text-align: left; font-weight: 600;">Status</th>';
      html += '<th style="padding: 12px; text-align: right; font-weight: 600;">Tokens</th>';
      html += '<th style="padding: 12px; text-align: right; font-weight: 600;">Cost</th>';
      html += '<th style="padding: 12px; text-align: right; font-weight: 600;">Duration</th>';
      html += '<th style="padding: 12px; text-align: left; font-weight: 600;">Response</th>';
      html += '</tr></thead><tbody>';
      
      results.forEach((result, index) => {
        const rowStyle = index % 2 === 0 ? 'background: #fafafa;' : 'background: white;';
        html += '<tr style="' + rowStyle + ' border-bottom: 1px solid #e6e6e6;">';
        html += '<td style="padding: 12px; font-weight: 500;">' + result.model + '</td>';
        html += '<td style="padding: 12px;">';
        if (result.success) {
          html += '<span style="color: #059669; font-weight: 500;">✓ Success</span>';
        } else {
          html += '<span style="color: #dc2626; font-weight: 500;">✗ Failed</span>';
        }
        html += '</td>';
        html += '<td style="padding: 12px; text-align: right;">' + (result.tokens || 0).toLocaleString() + '</td>';
        html += '<td style="padding: 12px; text-align: right; color: #d97706; font-weight: 500;">$' + (result.cost || 0) + '</td>';
        html += '<td style="padding: 12px; text-align: right;">' + result.duration + 'ms</td>';
        html += '<td style="padding: 12px; max-width: 300px;"><div style="max-height: 100px; overflow: auto; font-family: monospace; font-size: 12px; background: #f9f9f9; padding: 8px; border-radius: 4px;">' + (result.response || '').substring(0, 200) + (result.response && result.response.length > 200 ? '...' : '') + '</div></td>';
        html += '</tr>';
      });
      
      html += '</tbody></table>';
      
      // Add summary
      const totalCost = results.reduce((sum, r) => sum + parseFloat(r.cost || 0), 0);
      const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;
      const successCount = results.filter(r => r.success).length;
      
      html += '<div style="padding: 16px; background: #f5f5f5; border-top: 2px solid #e6e6e6; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; font-size: 14px;">';
      html += '<div><strong>Total Models:</strong> ' + results.length + '</div>';
      html += '<div><strong>Success Rate:</strong> ' + Math.round((successCount / results.length) * 100) + '%</div>';
      html += '<div><strong>Total Cost:</strong> $' + totalCost.toFixed(4) + '</div>';
      html += '<div><strong>Avg Duration:</strong> ' + Math.round(avgDuration) + 'ms</div>';
      html += '</div>';
      
      container.innerHTML = html;
      
      // Store results for export
      window.lastComparisonResults = results;
    }
    
    window.clearResults = () => {
      const container = document.getElementById('comparisonResults');
      container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666666;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 1rem; opacity: 0.5;"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg><p>Select models and run a prompt to see comparison results</p></div>';
      window.lastComparisonResults = null;
    };
    
    window.exportResults = () => {
      if (!window.lastComparisonResults) {
        alert('No results to export. Run a comparison first.');
        return;
      }
      
      const results = window.lastComparisonResults;
      let csv = 'Model,Status,Tokens,Cost,Duration (ms),Response\\n';
      
      results.forEach(result => {
        const response = (result.response || '').replace(/"/g, '""').replace(/\\n/g, ' ');
        csv += '"' + result.model + '","' + (result.success ? 'Success' : 'Failed') + '",' + 
               (result.tokens || 0) + ',' + (result.cost || 0) + ',' + result.duration + ',"' + response + '"\\n';
      });
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'model-comparison-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    };
    
    window.refreshModels = async () => {
      const modelSelect = document.getElementById('modelSelect');
      modelSelect.innerHTML = '<option value="" disabled style="color: #999; font-style: italic;">Loading models...</option>';
      
      try {
        const response = await fetch('/api/models');
        const data = await response.json();
        
        // Clear the select
        modelSelect.innerHTML = '';
        
        if (data.models.length === 0) {
          modelSelect.innerHTML = '<option value="" disabled style="color: #dc2626; font-weight: 500;">⚠️ No models available - configure API keys in Settings</option>';
          return;
        }
        
        const groupedModels = {};
        data.models.forEach(model => {
          if (!groupedModels[model.provider]) {
            groupedModels[model.provider] = [];
          }
          groupedModels[model.provider].push(model);
        });
        
        Object.keys(groupedModels).sort().forEach(provider => {
          const optgroup = document.createElement('optgroup');
          optgroup.label = provider.toUpperCase();
          
          groupedModels[provider].forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name || model.id;
            optgroup.appendChild(option);
          });
          
          modelSelect.appendChild(optgroup);
        });
        
        console.log('Models loaded:', data.models.length);
      } catch (error) {
        console.error('Failed to load models:', error);
        modelSelect.innerHTML = '<option value="" disabled style="color: #dc2626; font-weight: 500;">❌ Failed to load models</option>';
      }
    };
    
    window.loadTemplates = async () => {
      const templateSelect = document.getElementById('templateSelect');
      if (!templateSelect) return;
      
      try {
        const response = await fetch('/api/prompts');
        const prompts = await response.json();
        
        templateSelect.innerHTML = '<option value="">Choose a prompt template...</option>';
        
        // Group templates by category
        const groupedTemplates = {};
        prompts.forEach(prompt => {
          if (!groupedTemplates[prompt.category]) {
            groupedTemplates[prompt.category] = [];
          }
          groupedTemplates[prompt.category].push(prompt);
        });
        
        Object.keys(groupedTemplates).sort().forEach(category => {
          const optgroup = document.createElement('optgroup');
          optgroup.label = category.toUpperCase();
          
          groupedTemplates[category].forEach(prompt => {
            const option = document.createElement('option');
            option.value = \`\${prompt.category}/\${prompt.name}\`;
            option.textContent = prompt.name;
            if (prompt.description) {
              option.title = prompt.description;
            }
            optgroup.appendChild(option);
          });
          
          templateSelect.appendChild(optgroup);
        });
        
        console.log('Templates loaded:', prompts.length);
      } catch (error) {
        console.error('Failed to load templates:', error);
        templateSelect.innerHTML = '<option value="" disabled style="color: #dc2626;">❌ Failed to load templates</option>';
      }
    };
    
    window.loadTemplate = async () => {
      const templateSelect = document.getElementById('templateSelect');
      const promptInput = document.getElementById('promptInput');
      
      if (!templateSelect.value) {
        return;
      }
      
      const [category, name] = templateSelect.value.split('/');
      
      try {
        const response = await fetch(\`/api/prompts/\${category}/\${name}\`);
        const template = await response.json();
        
        promptInput.value = template.content;
        detectVariables();
        promptInput.focus();
        
        // Show notification
        showNotification(\`Template "\${name}" loaded!\`, 'success');
        
      } catch (error) {
        console.error('Failed to load template:', error);
        showNotification('Failed to load template', 'error');
      }
    };
    
    window.detectVariables = () => {
      const promptInput = document.getElementById('promptInput');
      const variablesSection = document.getElementById('variablesSection');
      const variableInputs = document.getElementById('variableInputs');
      
      if (!promptInput || !variablesSection || !variableInputs) return;
      
      const prompt = promptInput.value;
      const variablePattern = /\\{\\{(\\w+)\\}\\}/g;
      const variables = [];
      let match;
      
      while ((match = variablePattern.exec(prompt)) !== null) {
        if (!variables.includes(match[1])) {
          variables.push(match[1]);
        }
      }
      
      if (variables.length > 0) {
        variablesSection.style.display = 'block';
        variableInputs.innerHTML = variables.map(variable => \`
          <div>
            <label style="font-size: 13px; color: #656d76; margin-bottom: 4px;">\${variable}</label>
            <input 
              type="text" 
              id="var_\${variable}" 
              placeholder="Enter value for \${variable}..."
              style="height: 36px; font-size: 13px;"
            />
          </div>
        \`).join('');
      } else {
        variablesSection.style.display = 'none';
      }
    };
    
    window.replaceVariables = (prompt) => {
      const variablePattern = /\\{\\{(\\w+)\\}\\}/g;
      let processedPrompt = prompt;
      let match;
      
      while ((match = variablePattern.exec(prompt)) !== null) {
        const variableName = match[1];
        const variableInput = document.getElementById(\`var_\${variableName}\`);
        if (variableInput && variableInput.value.trim()) {
          processedPrompt = processedPrompt.replace(new RegExp(\`\\\\{\\\\{\${variableName}\\\\}\\\\}\`, 'g'), variableInput.value.trim());
        }
      }
      
      return processedPrompt;
    };
    
    window.showNotification = (message, type) => {
      const notification = document.createElement('div');
      notification.textContent = message;
      notification.className = type === 'success' ? 'status-success' : 'status-error';
      notification.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      \`;
      
      const style = document.createElement('style');
      style.textContent = \`
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      \`;
      document.head.appendChild(style);
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
          document.body.removeChild(notification);
          document.head.removeChild(style);
        }, 300);
      }, 3000);
    };
    
    window.saveSettings = () => {
      const openaiKey = document.getElementById('openaiKey').value;
      const anthropicKey = document.getElementById('anthropicKey').value;
      const openaiModel = document.getElementById('openaiModel').value;
      const anthropicModel = document.getElementById('anthropicModel').value;
      const ollamaUrl = document.getElementById('ollamaUrl').value;
      const openrouterKey = document.getElementById('openrouterKey').value;
      
      const env = {};
      if (openaiKey) env.OPENAI_API_KEY = openaiKey;
      if (anthropicKey) env.ANTHROPIC_API_KEY = anthropicKey;
      if (openaiModel) env.OPENAI_MODEL = openaiModel;
      if (anthropicModel) env.ANTHROPIC_MODEL = anthropicModel;
      if (ollamaUrl) env.OLLAMA_BASE_URL = ollamaUrl;
      if (openrouterKey) env.OPENROUTER_API_KEY = openrouterKey;
      
      fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ env })
      })
      .then(r => r.json())
      .then(response => {
        if (response.success) {
          alert('Settings saved successfully to easyai.env file!');
          // Refresh config data
          fetch('/api/config').then(r => r.json()).then(config => {
            data.config = config;
            render();
          });
        } else {
          alert('Failed to save settings: ' + response.error);
        }
      })
      .catch(err => {
        alert('Error saving settings: ' + err.message);
      });
    };
    
    const render = () => {
      document.getElementById('root').innerHTML = Dashboard();
    };
  </script>
</body>
</html>
`;

console.log('🎨 Professional server with exact design match');

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Parse JSON bodies
app.use(express.json());

// API endpoints - Real data from logs
app.get('/api/analytics', (req, res) => {
  try {
    const logsFile = path.join(__dirname, 'test-project/easyai/logs/easyai.jsonl');
    
    if (!fs.existsSync(logsFile)) {
      // Return zeros if no logs exist yet
      return res.json({
        totalCalls: 0,
        totalTokens: 0,
        totalCost: 0,
        modelUsage: {},
        lastUpdated: new Date().toISOString()
      });
    }
    
    const logContent = fs.readFileSync(logsFile, 'utf8');
    const logs = logContent.trim().split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
    
    const analytics = logs.reduce((acc, log) => {
      acc.totalCalls++;
      acc.totalTokens += log.tokens || 0;
      acc.totalCost += log.cost || 0;
      
      if (log.model) {
        acc.modelUsage[log.model] = (acc.modelUsage[log.model] || 0) + 1;
      }
      
      return acc;
    }, {
      totalCalls: 0,
      totalTokens: 0,
      totalCost: 0,
      modelUsage: {}
    });
    
    analytics.lastUpdated = new Date().toISOString();
    res.json(analytics);
  } catch (error) {
    console.error('❌ Failed to read analytics:', error.message);
    res.json({
      totalCalls: 0,
      totalTokens: 0,
      totalCost: 0,
      modelUsage: {},
      lastUpdated: new Date().toISOString()
    });
  }
});

app.get('/api/logs', (req, res) => {
  try {
    const logsFile = path.join(__dirname, 'test-project/easyai/logs/easyai.jsonl');
    
    if (!fs.existsSync(logsFile)) {
      return res.json([]);
    }
    
    const logContent = fs.readFileSync(logsFile, 'utf8');
    const logs = logContent.trim().split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Most recent first
    
    res.json(logs);
  } catch (error) {
    console.error('❌ Failed to read logs:', error.message);
    res.json([]);
  }
});

// Prompts API with real file operations
app.get('/api/prompts', (req, res) => {
  try {
    const prompts = [];
    const promptsBaseDir = path.join(__dirname, 'test-project/easyai/prompts');
    
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
        
        // Check for metadata file
        const metaFile = path.join(categoryDir, file.replace('.md', '.json'));
        let metadata = {
          description: content.substring(0, 150) + '...',
          model: '',
          variables: []
        };
        
        if (fs.existsSync(metaFile)) {
          try {
            const metaContent = fs.readFileSync(metaFile, 'utf8');
            const parsedMeta = JSON.parse(metaContent);
            metadata.description = parsedMeta.description || metadata.description;
            metadata.model = parsedMeta.model || '';
            metadata.variables = parsedMeta.variables || [];
          } catch (e) {
            console.log('Failed to parse metadata for', name);
          }
        }
        
        prompts.push({
          name,
          category,
          description: metadata.description,
          model: metadata.model,
          variables: metadata.variables,
          content: content.substring(0, 150) + '...',
          fullContent: content
        });
      }
    }
    
    res.json(prompts);
  } catch (error) {
    console.error('❌ Failed to read prompts:', error.message);
    res.json([]);
  }
});

app.post('/api/prompts/:category/:name', (req, res) => {
  const { category, name } = req.params;
  const promptData = req.body;
  
  try {
    const promptDir = path.join(__dirname, 'test-project/easyai/prompts', category);
    const promptFile = path.join(promptDir, `${name}.md`);
    const metaFile = path.join(promptDir, `${name}.json`);
    
    if (!fs.existsSync(promptDir)) {
      fs.mkdirSync(promptDir, { recursive: true });
    }
    
    // Write the markdown content
    const content = promptData.content || promptData;
    fs.writeFileSync(promptFile, typeof content === 'string' ? content : content.content, 'utf8');
    
    // Write metadata if it's the enhanced structure
    if (typeof promptData === 'object' && promptData.name) {
      const metadata = {
        name: promptData.name,
        description: promptData.description,
        category: promptData.category,
        model: promptData.model,
        variables: promptData.variables || [],
        created: promptData.created || new Date().toISOString(),
        updated: new Date().toISOString()
      };
      fs.writeFileSync(metaFile, JSON.stringify(metadata, null, 2), 'utf8');
    }
    
    console.log(`✅ Prompt created: ${promptFile}`);
    res.json({ success: true, message: `Prompt ${name} created successfully` });
  } catch (error) {
    console.error(`❌ Failed to create prompt: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to create prompt file' });
  }
});

app.get('/api/prompts/:category/:name', (req, res) => {
  const { category, name } = req.params;
  
  try {
    const promptFile = path.join(__dirname, 'test-project/easyai/prompts', category, `${name}.md`);
    const metaFile = path.join(__dirname, 'test-project/easyai/prompts', category, `${name}.json`);
    
    if (fs.existsSync(promptFile)) {
      const content = fs.readFileSync(promptFile, 'utf8');
      let metadata = {
        name,
        category,
        description: '',
        model: '',
        variables: []
      };
      
      // Read metadata if it exists
      if (fs.existsSync(metaFile)) {
        try {
          const metaContent = fs.readFileSync(metaFile, 'utf8');
          metadata = { ...metadata, ...JSON.parse(metaContent) };
        } catch (e) {
          console.log('Failed to parse metadata for', name);
        }
      }
      
      res.json({ ...metadata, content });
    } else {
      res.json({
        name,
        category,
        description: `This is a ${category} prompt`,
        model: '',
        variables: [],
        content: `# ${name}\n\n## Description\nThis is a ${category} prompt.\n\n## Instructions\nAdd your prompt instructions here.\n\n## Input\n{{input}}\n\n## Output\nProvide your response here.`
      });
    }
  } catch (error) {
    console.error(`❌ Failed to read prompt: ${error.message}`);
    res.status(500).json({ error: 'Failed to read prompt file' });
  }
});

app.post('/api/playground/test', async (req, res) => {
  const { prompt, model } = req.body;
  const startTime = Date.now();
  
  try {
    // Read API keys from easyai.env (check both locations)
    const envFileRoot = path.join(__dirname, 'test-project/easyai/easyai.env');
    const envFileConfig = path.join(__dirname, 'test-project/easyai/config/easyai.env');
    let apiKeys = {};
    
    // Helper function to read env file
    const readEnvFile = (filePath) => {
      if (fs.existsSync(filePath)) {
        const envContent = fs.readFileSync(filePath, 'utf8');
        envContent.split('\n').forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').trim();
              // Skip placeholder values
              if (value && !value.includes('your_') && !value.includes('_here')) {
                apiKeys[key.trim()] = value;
              }
            }
          }
        });
      }
    };
    
    // Read from root first (has real keys), then config (fallback)
    readEnvFile(envFileRoot);
    readEnvFile(envFileConfig);
    
    let response, tokens, cost;
    
    if (model.startsWith('gpt-')) {
      // OpenAI API call
      if (!apiKeys.OPENAI_API_KEY) {
        return res.status(400).json({ error: 'OpenAI API key not configured. Please add it in Settings.' });
      }
      
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKeys.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000
        })
      });
      
      if (!openaiResponse.ok) {
        const error = await openaiResponse.json();
        return res.status(400).json({ error: `OpenAI API Error: ${error.error?.message || 'Unknown error'}` });
      }
      
      const data = await openaiResponse.json();
      response = data.choices[0].message.content;
      tokens = data.usage.total_tokens;
      
      // Calculate cost (approximate)
      const inputTokens = data.usage.prompt_tokens;
      const outputTokens = data.usage.completion_tokens;
      
      if (model === 'gpt-4') {
        cost = (inputTokens * 0.03 + outputTokens * 0.06) / 1000;
      } else if (model === 'gpt-3.5-turbo') {
        cost = (inputTokens * 0.0015 + outputTokens * 0.002) / 1000;
      } else {
        // Default OpenAI pricing for unknown models
        cost = (inputTokens * 0.01 + outputTokens * 0.03) / 1000;
      }
      
    } else if (model.startsWith('claude-')) {
      // Anthropic API call
      if (!apiKeys.ANTHROPIC_API_KEY) {
        return res.status(400).json({ error: 'Anthropic API key not configured. Please add it in Settings.' });
      }
      
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKeys.ANTHROPIC_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      
      if (!anthropicResponse.ok) {
        const error = await anthropicResponse.json();
        return res.status(400).json({ error: `Anthropic API Error: ${error.error?.message || 'Unknown error'}` });
      }
      
      const data = await anthropicResponse.json();
      response = data.content[0].text;
      tokens = data.usage.input_tokens + data.usage.output_tokens;
      
      // Calculate cost (approximate)
      const inputTokens = data.usage.input_tokens;
      const outputTokens = data.usage.output_tokens;
      
      if (model === 'claude-3-sonnet') {
        cost = (inputTokens * 0.003 + outputTokens * 0.015) / 1000;
      } else if (model === 'claude-3-haiku') {
        cost = (inputTokens * 0.00025 + outputTokens * 0.00125) / 1000;
      } else {
        // Default Anthropic pricing for unknown models
        cost = (inputTokens * 0.003 + outputTokens * 0.015) / 1000;
      }
    } else {
      return res.status(400).json({ error: 'Unsupported model selected' });
    }
    
    // Ensure cost is defined
    cost = cost || 0;
    
    const duration = Date.now() - startTime;
    
    // Log the API call
    const logEntry = {
      timestamp: new Date().toISOString(),
      prompt: 'playground-test',
      model: model,
      tokens: tokens,
      cost: cost,
      duration: duration,
      success: true
    };
    
    // Append to log file
    const logsDir = path.join(__dirname, 'test-project/easyai/logs');
    const logsFile = path.join(logsDir, 'easyai.jsonl');
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.appendFileSync(logsFile, JSON.stringify(logEntry) + '\n');
    
    res.json({
      response,
      tokens,
      cost: cost.toFixed(4),
      duration
    });
    
  } catch (error) {
    console.error('❌ Playground API Error:', error.message);
    res.status(500).json({ error: `Failed to process request: ${error.message}` });
  }
});

// Models API endpoint
app.get('/api/models', async (req, res) => {
  try {
    const envFileRoot = path.join(__dirname, 'test-project/easyai/easyai.env');
    const envFileConfig = path.join(__dirname, 'test-project/easyai/config/easyai.env');
    let apiKeys = {};
    
    // Read API keys
    const readEnvFile = (filePath) => {
      if (fs.existsSync(filePath)) {
        const envContent = fs.readFileSync(filePath, 'utf8');
        envContent.split('\n').forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').trim();
              if (value && !value.includes('your_') && !value.includes('_here')) {
                apiKeys[key.trim()] = value;
              }
            }
          }
        });
      }
    };
    
    readEnvFile(envFileRoot);
    readEnvFile(envFileConfig);
    
    let models = [];
    
    // Fetch OpenAI models
    if (apiKeys.OPENAI_API_KEY) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKeys.OPENAI_API_KEY}` }
        });
        if (openaiResponse.ok) {
          const data = await openaiResponse.json();
          const openaiModels = data.data
            .filter(model => model.id.includes('gpt'))
            .map(model => ({ id: model.id, name: model.id, provider: 'openai' }));
          models.push(...openaiModels);
        }
      } catch (error) {
        console.log('Failed to fetch OpenAI models:', error.message);
      }
    }
    
    // Add Anthropic models (they don't have a public models API)
    if (apiKeys.ANTHROPIC_API_KEY) {
      models.push(
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'anthropic' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic' }
      );
    }
    
    // Fetch Ollama models
    if (apiKeys.OLLAMA_BASE_URL) {
      try {
        const ollamaResponse = await fetch(`${apiKeys.OLLAMA_BASE_URL}/api/tags`);
        if (ollamaResponse.ok) {
          const data = await ollamaResponse.json();
          const ollamaModels = data.models.map(model => ({ 
            id: model.name, 
            name: model.name, 
            provider: 'ollama' 
          }));
          models.push(...ollamaModels);
        }
      } catch (error) {
        console.log('Failed to fetch Ollama models:', error.message);
      }
    }
    
    // Fetch OpenRouter models
    if (apiKeys.OPENROUTER_API_KEY) {
      try {
        const openrouterResponse = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKeys.OPENROUTER_API_KEY}` }
        });
        if (openrouterResponse.ok) {
          const data = await openrouterResponse.json();
          const openrouterModels = data.data.map(model => ({ 
            id: model.id, 
            name: model.name || model.id, 
            provider: 'openrouter' 
          }));
          models.push(...openrouterModels);
        }
      } catch (error) {
        console.log('Failed to fetch OpenRouter models:', error.message);
      }
    }
    
    res.json({ models });
  } catch (error) {
    console.error('Failed to fetch models:', error.message);
    res.json({ models: [] });
  }
});

// Configuration endpoints - read and write easyai.env
app.get('/api/config', (req, res) => {
  try {
    // Read from root easyai.env where the real keys are stored
    const envFile = path.join(__dirname, 'test-project/easyai/easyai.env');
    let env = {};
    
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          // Mask sensitive keys for display
          if (key.includes('API_KEY') && value.trim()) {
            env[key] = '***configured***';
          } else {
            env[key] = value.trim();
          }
        }
      });
    }
    
    res.json({
      config: {
        ui: { theme: 'light', defaultModel: 'gpt-4', autoSave: true },
        logging: { enabled: true, includeResponses: true, retention: '30d' }
      },
      env
    });
  } catch (error) {
    console.error('❌ Failed to read config:', error.message);
    res.json({
      config: {
        ui: { theme: 'light', defaultModel: 'gpt-4', autoSave: true },
        logging: { enabled: true, includeResponses: true, retention: '30d' }
      },
      env: {}
    });
  }
});

app.post('/api/config', (req, res) => {
  const { env } = req.body;
  
  try {
    // Save to root easyai.env where the real keys are stored
    const envFile = path.join(__dirname, 'test-project/easyai/easyai.env');
    const envDir = path.dirname(envFile);
    
    // Ensure directory exists
    if (!fs.existsSync(envDir)) {
      fs.mkdirSync(envDir, { recursive: true });
    }
    
    // Build env file content
    let envContent = '';
    Object.keys(env).forEach(key => {
      if (env[key] && env[key] !== '***configured***') {
        envContent += `${key}=${env[key]}\n`;
      }
    });
    
    // Write to easyai.env file
    fs.writeFileSync(envFile, envContent, 'utf8');
    
    console.log(`✅ Configuration saved to: ${envFile}`);
    res.json({ success: true, message: 'Configuration saved successfully to easyai.env' });
  } catch (error) {
    console.error(`❌ Failed to save config: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to save configuration file' });
  }
});

// Serve the professional HTML
app.get('*', (req, res) => {
  res.send(professionalHTML);
});

app.listen(port, () => {
  console.log(`🎨 Professional EasyAI Dashboard: http://localhost:${port}`);
  console.log('✨ Exact design match with your existing dashboard');
  console.log('📁 Real file operations with easyai/prompts/');
  console.log('🚀 Professional SaaS design with Stripe/Notion aesthetics');
});