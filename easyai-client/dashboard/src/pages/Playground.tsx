import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Settings, 
  Copy, 
  Download, 
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Zap
} from 'lucide-react';

interface ModelResult {
  model: string;
  success: boolean;
  response?: string;
  error?: string;
  tokens?: number;
  cost?: number;
  latency: number;
  provider?: string;
}

interface TestResult {
  prompt: string;
  results: ModelResult[];
  totalTime: number;
  timestamp: string;
}

interface Model {
  id: string;
  name: string;
  provider: string;
  cost_per_token: number;
}

const Playground: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-4', 'claude-3-sonnet']);
  const [availableModels, setAvailableModels] = useState<Record<string, Model[]>>({});
  const [parameters, setParameters] = useState({
    temperature: 0.7,
    max_tokens: 500,
    top_p: 1.0
  });
  const [results, setResults] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/playground/models', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableModels(data.models);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const runTest = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setResults(null);
    
    try {
      const response = await fetch('/api/playground/test-multi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          models: selectedModels,
          parameters
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        const error = await response.json();
        console.error('Test failed:', error);
      }
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const copyResult = (result: ModelResult) => {
    if (result.response) {
      navigator.clipboard.writeText(result.response);
    }
  };

  const ResultCard: React.FC<{ result: ModelResult }> = ({ result }) => (
    <div className={`border rounded-lg p-4 ${
      result.success 
        ? 'border-green-200 bg-green-50' 
        : 'border-red-200 bg-red-50'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <h3 className="font-medium text-gray-900">{result.model}</h3>
          <span className="text-sm text-gray-500">({result.provider})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            {result.latency}ms
          </div>
          {result.cost && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <DollarSign className="w-4 h-4" />
              ${result.cost.toFixed(6)}
            </div>
          )}
        </div>
      </div>
      
      {result.success && result.response ? (
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded p-3">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 max-h-40 overflow-y-auto">
              {result.response}
            </pre>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {result.tokens && (
                <span>{result.tokens} tokens</span>
              )}
            </div>
            <button
              onClick={() => copyResult(result)}
              className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded p-3">
          <p className="text-sm text-red-600">{result.error}</p>
        </div>
      )}
    </div>
  );

  useEffect(() => {
    fetchModels();
  }, []);

  if (loadingModels) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">AI Playground</h1>
          <p className="text-gray-600">Test and compare responses from multiple AI models</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Input */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Prompt</h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Models</h2>
            <div className="space-y-3">
              {Object.entries(availableModels).map(([provider, models]) => (
                <div key={provider}>
                  <h3 className="text-sm font-medium text-gray-700 mb-2 capitalize">{provider}</h3>
                  <div className="space-y-2">
                    {models.map((model) => (
                      <label key={model.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedModels.includes(model.id)}
                          onChange={() => toggleModel(model.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{model.name}</span>
                        <span className="text-xs text-gray-500">
                          (${model.cost_per_token.toFixed(6)}/token)
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Parameters</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature: {parameters.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={parameters.temperature}
                  onChange={(e) => setParameters(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  min="1"
                  max="4000"
                  value={parameters.max_tokens}
                  onChange={(e) => setParameters(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Top P: {parameters.top_p}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={parameters.top_p}
                  onChange={(e) => setParameters(prev => ({ ...prev, top_p: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <button
            onClick={runTest}
            disabled={loading || !prompt.trim() || selectedModels.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Testing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Test
              </>
            )}
          </button>
        </div>

        {/* Right Panel - Results */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">Results</h2>
              {results && (
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{results.results.length} models tested</span>
                  <span>{results.totalTime}ms total</span>
                </div>
              )}
            </div>

            {results ? (
              <div className="space-y-4">
                {results.results.map((result, index) => (
                  <ResultCard key={index} result={result} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to test</h3>
                <p className="text-gray-500">
                  Enter a prompt and select models to compare their responses
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Playground;