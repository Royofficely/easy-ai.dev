'use client'

import { useEffect, useState } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import toast from 'react-hot-toast'

interface Config {
  config: {
    ui: {
      theme: string
      defaultModel: string
      autoSave: boolean
    }
    logging: {
      enabled: boolean
      includeResponses: boolean
      retention: string
    }
    prompts: {
      autoBackup: boolean
      validateSyntax: boolean
    }
  }
  env: Record<string, string>
}

export default function Settings() {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/config')
      setConfig(response.data)
      setLoading(false)
    } catch (error) {
      toast.error('Failed to load configuration')
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    if (!config) return

    setSaving(true)
    try {
      await axios.post('/api/config', config)
      toast.success('Configuration saved successfully')
    } catch (error) {
      toast.error('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (path: string, value: any) => {
    if (!config) return

    const keys = path.split('.')
    const newConfig = { ...config }
    
    let current = newConfig.config as any
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = value
    
    setConfig(newConfig)
  }

  const updateEnv = (key: string, value: string) => {
    if (!config) return

    setConfig({
      ...config,
      env: {
        ...config.env,
        [key]: value
      }
    })
  }

  const toggleApiKeyVisibility = (key: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading settings...</div>
      </div>
    )
  }

  if (!config) return null

  return (
    <div className="space-y-6">
      {/* API Configuration */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          API Configuration
        </h3>
        
        <div className="space-y-4">
          {/* OpenAI Settings */}
          <div className="border-b pb-4 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">OpenAI</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys.OPENAI_API_KEY ? 'text' : 'password'}
                    value={config.env.OPENAI_API_KEY === '***configured***' ? '' : config.env.OPENAI_API_KEY}
                    onChange={(e) => updateEnv('OPENAI_API_KEY', e.target.value)}
                    className="w-full p-2 pr-10 border rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="sk-..."
                  />
                  <button
                    type="button"
                    onClick={() => toggleApiKeyVisibility('OPENAI_API_KEY')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showApiKeys.OPENAI_API_KEY ? (
                      <EyeSlashIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Model
                </label>
                <select
                  value={config.env.OPENAI_MODEL}
                  onChange={(e) => updateEnv('OPENAI_MODEL', e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="o1-preview">O1 Preview</option>
                  <option value="o1-mini">O1 Mini</option>
                </select>
              </div>
            </div>
          </div>

          {/* Anthropic Settings */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Anthropic</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys.ANTHROPIC_API_KEY ? 'text' : 'password'}
                    value={config.env.ANTHROPIC_API_KEY === '***configured***' ? '' : config.env.ANTHROPIC_API_KEY}
                    onChange={(e) => updateEnv('ANTHROPIC_API_KEY', e.target.value)}
                    className="w-full p-2 pr-10 border rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="sk-ant-..."
                  />
                  <button
                    type="button"
                    onClick={() => toggleApiKeyVisibility('ANTHROPIC_API_KEY')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showApiKeys.ANTHROPIC_API_KEY ? (
                      <EyeSlashIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Model
                </label>
                <select
                  value={config.env.ANTHROPIC_MODEL}
                  onChange={(e) => updateEnv('ANTHROPIC_MODEL', e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                  <option value="claude-3-opus">Claude 3 Opus</option>
                  <option value="claude-3-haiku">Claude 3 Haiku</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UI Settings */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          UI Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Theme
            </label>
            <select
              value={config.config.ui.theme}
              onChange={(e) => updateConfig('ui.theme', e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Model
            </label>
            <select
              value={config.config.ui.defaultModel}
              onChange={(e) => updateConfig('ui.defaultModel', e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.config.ui.autoSave}
                onChange={(e) => updateConfig('ui.autoSave', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Auto-save prompts
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Logging Settings */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Logging Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.config.logging.enabled}
                onChange={(e) => updateConfig('logging.enabled', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable logging
              </span>
            </label>
          </div>

          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.config.logging.includeResponses}
                onChange={(e) => updateConfig('logging.includeResponses', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Include responses
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Retention Period
            </label>
            <select
              value={config.config.logging.retention}
              onChange={(e) => updateConfig('logging.retention', e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="90d">90 days</option>
              <option value="1y">1 year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Prompt Settings */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Prompt Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.config.prompts?.autoBackup}
                onChange={(e) => updateConfig('prompts.autoBackup', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Auto-backup prompts
              </span>
            </label>
          </div>

          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.config.prompts?.validateSyntax}
                onChange={(e) => updateConfig('prompts.validateSyntax', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Validate syntax
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}