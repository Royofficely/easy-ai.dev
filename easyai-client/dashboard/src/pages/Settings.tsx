import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface Setting {
  key: string;
  value: string;
  description: string;
  type: 'text' | 'select' | 'number' | 'boolean';
  options?: string[];
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const settingsConfig: Setting[] = [
    {
      key: 'OPENAI_API_KEY',
      value: settings.OPENAI_API_KEY || '',
      description: 'OpenAI API key for GPT models',
      type: 'text'
    },
    {
      key: 'ANTHROPIC_API_KEY',
      value: settings.ANTHROPIC_API_KEY || '',
      description: 'Anthropic API key for Claude models',
      type: 'text'
    },
    {
      key: 'GOOGLE_API_KEY',
      value: settings.GOOGLE_API_KEY || '',
      description: 'Google API key for Gemini models',
      type: 'text'
    },
    {
      key: 'DEEPSEEK_API_KEY',
      value: settings.DEEPSEEK_API_KEY || '',
      description: 'DeepSeek API key',
      type: 'text'
    },
    {
      key: 'DEFAULT_MODEL',
      value: settings.DEFAULT_MODEL || 'gpt-4',
      description: 'Default AI model to use',
      type: 'select',
      options: ['gpt-4', 'gpt-3.5-turbo', 'claude-3-sonnet', 'claude-3-haiku', 'gemini-pro']
    },
    {
      key: 'MAX_TOKENS',
      value: settings.MAX_TOKENS || '500',
      description: 'Maximum tokens per request',
      type: 'number'
    },
    {
      key: 'TEMPERATURE',
      value: settings.TEMPERATURE || '0.7',
      description: 'Default temperature for responses',
      type: 'number'
    },
    {
      key: 'ENABLE_FALLBACK',
      value: settings.ENABLE_FALLBACK || 'true',
      description: 'Enable automatic model fallback',
      type: 'boolean'
    }
  ];

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/env', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/settings/env', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ settings })
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully! Changes will take effect on next server restart.' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900">Environment Settings</h1>
          <p className="text-gray-600 mt-2">Configure your AI providers and default parameters</p>
        </div>

        <div className="p-6 space-y-6">
          {message && (
            <div className={`p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {message.text}
            </div>
          )}

          <div className="grid gap-6">
            {settingsConfig.map((setting) => (
              <div key={setting.key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {setting.key}
                </label>
                <p className="text-sm text-gray-500">{setting.description}</p>
                
                {setting.type === 'select' ? (
                  <select
                    value={setting.value}
                    onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {setting.options?.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : setting.type === 'boolean' ? (
                  <select
                    value={setting.value}
                    onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                ) : (
                  <input
                    type={setting.type}
                    value={setting.value}
                    onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={setting.type === 'text' && setting.key.includes('KEY') ? '••••••••••••••••' : ''}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            
            <button
              onClick={fetchSettings}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;