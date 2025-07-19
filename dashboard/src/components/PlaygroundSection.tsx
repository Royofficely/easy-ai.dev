import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface PlaygroundSectionProps {
  prompts: any[];
}

interface PromptVariable {
  name: string;
  value: string;
}

const PlaygroundSection: React.FC<PlaygroundSectionProps> = ({ prompts }) => {
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [maxTokens, setMaxTokens] = useState(150);
  const [temperature, setTemperature] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [variables, setVariables] = useState<PromptVariable[]>([]);

  const selectedPromptData = prompts.find(p => p.prompt_id === selectedPrompt);

  // Extract variables from prompt template when prompt changes
  useEffect(() => {
    if (selectedPromptData?.template) {
      const templateVariables = extractVariables(selectedPromptData.template);
      const newVariables: PromptVariable[] = templateVariables.map(name => ({
        name,
        value: variables.find(v => v.name === name)?.value || ''
      }));
      setVariables(newVariables);
    } else {
      setVariables([]);
    }
  }, [selectedPrompt, selectedPromptData]);

  const extractVariables = (template: string): string[] => {
    const matches = template.match(/{(\w+)}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map(match => match.slice(1, -1))));
  };

  const handleVariableChange = (name: string, value: string) => {
    setVariables(prev => prev.map(v => 
      v.name === name ? { ...v, value } : v
    ));
  };

  const renderVariableInputs = () => {
    if (variables.length === 0) return null;

    return (
      <div className="form-section">
        <h3>Template Variables</h3>
        <div className="variables-grid">
          {variables.map(variable => (
            <div key={variable.name} className="form-group">
              <label htmlFor={`var-${variable.name}`}>
                {variable.name}
              </label>
              <input
                id={`var-${variable.name}`}
                type="text"
                value={variable.value}
                onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                placeholder={`Enter value for {${variable.name}}`}
                className="notion-prompt-description-input"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getPreviewWithVariables = () => {
    if (!selectedPromptData?.template) return '';
    
    let preview = selectedPromptData.template;
    variables.forEach(variable => {
      if (variable.value.trim()) {
        preview = preview.replace(
          new RegExp(`{${variable.name}}`, 'g'), 
          variable.value
        );
      }
    });
    return preview;
  };

  const handleTest = async () => {
    if (!selectedPrompt) {
      setError('Please select a prompt to test');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      // Convert variables to parameters object
      const parameters: {[key: string]: string} = {};
      variables.forEach(variable => {
        if (variable.value.trim()) {
          parameters[variable.name] = variable.value;
        }
      });

      const apiKey = localStorage.getItem('easyai_api_key');
      if (!apiKey) {
        throw new Error('No API key found. Please check your settings.');
      }

      const requestData = {
        prompt_id: selectedPrompt,
        model: selectedModel,
        parameters: parameters,
        options: {
          max_tokens: maxTokens,
          temperature: temperature
        }
      };

      console.log('🧪 Testing API call:', requestData);

      const response = await fetch('/gateway/v1/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.text();
      
      if (response.ok) {
        setResponse(result);
        setError('');
        console.log('✅ API call successful!');
      } else {
        throw new Error(`API call failed (${response.status}): ${result}`);
      }
    } catch (err: any) {
      console.error('❌ API call failed:', err);
      setError(err.message);
      setResponse('');
    } finally {
      setIsLoading(false);
    }
  };

  const formatJsonResponse = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  return (
    <div className="section-content">
      <div className="section-header">
        <div className="section-title">
          <h2>Playground</h2>
          <p className="section-subtitle">Test your prompts and see analytics update in real-time</p>
        </div>
      </div>

      <div className="playground-layout">
        {/* Left Column - Configuration & Preview */}
        <div className="playground-left">
          <div className="form-section">
            <h3>Test Configuration</h3>
            
            <div className="form-group">
              <label htmlFor="prompt-select">Select Prompt</label>
              <select
                id="prompt-select"
                value={selectedPrompt}
                onChange={(e) => setSelectedPrompt(e.target.value)}
                className="notion-prompt-select"
              >
                <option value="">Choose a prompt to test...</option>
                {prompts && prompts.length > 0 ? (
                  prompts.map((prompt) => (
                    <option key={prompt.prompt_id} value={prompt.prompt_id}>
                      {prompt.name} ({prompt.category || 'No category'})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No prompts available - Create some in the Prompts section first</option>
                )}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="model-select">Model</label>
              <select
                id="model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="notion-prompt-select"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
                <option value="gemini-pro">Gemini Pro</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="max-tokens">Max Tokens</label>
                <input
                  id="max-tokens"
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  min="1"
                  max="4000"
                  className="notion-prompt-description-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="temperature">Temperature</label>
                <input
                  id="temperature"
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  min="0"
                  max="2"
                  step="0.1"
                  className="notion-prompt-description-input"
                />
              </div>
            </div>

            <button
              onClick={handleTest}
              disabled={isLoading || !selectedPrompt}
              className="btn-primary test-button"
            >
              {isLoading ? (
                <>
                  <svg className="loading-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Testing...
                </>
              ) : (
                <>
                  🧪 Test API Call
                </>
              )}
            </button>
          </div>

          {renderVariableInputs()}

          {selectedPromptData && (
            <div className="form-section">
              <h3>Prompt Preview</h3>
              <div className="prompt-preview">
                <div className="prompt-meta">
                  <span className="prompt-name">{selectedPromptData.name}</span>
                  <span className="prompt-category">{selectedPromptData.category}</span>
                </div>
                <div className="prompt-content">
                  {getPreviewWithVariables()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Response */}
        <div className="playground-right">
          <div className="results-section">
            <h3>Response</h3>
            
            {error && (
              <div className="error-message">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {error}
              </div>
            )}
            
            {response && (
              <div className="success-message">
                <div className="response-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  API Response
                </div>
                <div className="monaco-container">
                  <Editor
                    height="400px"
                    defaultLanguage="json"
                    value={formatJsonResponse(response)}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                      theme: 'vs-light',
                      fontSize: 14,
                      lineNumbers: 'on',
                      automaticLayout: true
                    }}
                  />
                </div>
              </div>
            )}

            {!error && !response && !isLoading && (
              <div className="placeholder-message">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
                <p>Select a prompt and click "Test API Call" to see the response here</p>
              </div>
            )}
          </div>

          <div className="playground-tips">
            <h4>💡 Tips</h4>
            <ul>
              <li>Test API calls will show up in your analytics dashboard</li>
              <li>Use the variables section to test dynamic prompts</li>
              <li>Try different models to compare responses</li>
              <li>Adjust temperature for more/less creative responses</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaygroundSection;