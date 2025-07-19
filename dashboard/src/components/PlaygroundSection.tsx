import React, { useState } from 'react';

interface PlaygroundSectionProps {
  prompts: any[];
}

const PlaygroundSection: React.FC<PlaygroundSectionProps> = ({ prompts }) => {
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [parameters, setParameters] = useState('{}');
  const [maxTokens, setMaxTokens] = useState(150);
  const [temperature, setTemperature] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');

  const handleTest = async () => {
    if (!selectedPrompt) {
      setError('Please select a prompt to test');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      let parsedParameters = {};
      if (parameters.trim()) {
        try {
          parsedParameters = JSON.parse(parameters);
        } catch (e) {
          throw new Error('Invalid JSON in parameters field');
        }
      }

      const apiKey = localStorage.getItem('easyai_api_key');
      if (!apiKey) {
        throw new Error('No API key found. Please check your settings.');
      }

      const requestData = {
        prompt_id: selectedPrompt,
        model: selectedModel,
        parameters: parsedParameters,
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

  const selectedPromptData = prompts.find(p => p.prompt_id === selectedPrompt);

  return (
    <div className="section-content">
      <div className="section-header">
        <div className="section-title">
          <h2>Playground</h2>
          <p className="section-subtitle">Test your prompts and see analytics update in real-time</p>
        </div>
      </div>

      <div className="playground-container">
        <div className="playground-form">
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
                {prompts.map((prompt) => (
                  <option key={prompt.prompt_id} value={prompt.prompt_id}>
                    {prompt.name} ({prompt.category})
                  </option>
                ))}
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

            <div className="form-group">
              <label htmlFor="parameters">Parameters (JSON)</label>
              <textarea
                id="parameters"
                value={parameters}
                onChange={(e) => setParameters(e.target.value)}
                placeholder='{"name": "John", "language": "JavaScript"}'
                className="notion-prompt-content-textarea"
                rows={3}
              />
              <small className="form-hint">
                Variables to replace in the prompt template (JSON format)
              </small>
            </div>

            <button
              onClick={handleTest}
              disabled={isLoading || !selectedPrompt}
              className="btn-primary"
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

          {selectedPromptData && (
            <div className="form-section">
              <h3>Prompt Preview</h3>
              <div className="prompt-preview">
                <div className="prompt-meta">
                  <span className="prompt-name">{selectedPromptData.name}</span>
                  <span className="prompt-category">{selectedPromptData.category}</span>
                </div>
                <div className="prompt-content">
                  {selectedPromptData.content}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="playground-results">
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
                <pre className="response-content">{response}</pre>
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
              <li>Use the parameters field to test dynamic prompts</li>
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