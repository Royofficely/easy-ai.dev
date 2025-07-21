import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Config } from '../types'

const Settings: React.FC = () => {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [envVars, setEnvVars] = useState<Record<string, string>>({})

  // Icons
  const IconKey = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5"></circle>
      <path d="m21 2-9.6 9.6"></path>
      <path d="m15.5 7.5 3 3L22 7l-3-3"></path>
    </svg>
  )


  const IconSave = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17,21 17,13 7,13 7,21"></polyline>
      <polyline points="7,3 7,8 15,8"></polyline>
    </svg>
  )

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/config')
      setConfig(response.data)
      setEnvVars(response.data.env)
    } catch (error) {
      console.error('Failed to fetch config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      const response = await axios.post('/api/config/save', {
        config: config?.config,
        env: envVars
      })
      
      if (response.data.success) {
        alert('Configuration saved successfully! API keys are now active.')
        // Refresh config to show updated status
        await fetchConfig()
      } else {
        throw new Error(response.data.error || 'Failed to save configuration')
      }
    } catch (error) {
      console.error('Failed to save config:', error)
      alert(`Failed to save configuration: ${error.response?.data?.error || error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleEnvChange = (key: string, value: string) => {
    setEnvVars(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleConfigChange = (path: string[], value: any) => {
    if (!config) return
    
    const newConfig = { ...config }
    let current: any = newConfig.config
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]]
    }
    current[path[path.length - 1]] = value
    
    setConfig(newConfig)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ 
          width: '24px', 
          height: '24px', 
          border: '2px solid #e5e7eb', 
          borderTop: '2px solid #111827',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    )
  }

  if (!config) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Failed to load settings</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid #f3f4f6', padding: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>
            Settings
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Configure your API keys to access different AI providers
          </p>
        </div>

        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* API Keys */}
            <div style={{
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid #f3f4f6',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              animation: 'slideUp 0.6s ease-out both'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  marginRight: '8px',
                  color: '#5b61eb'
                }}>
                  <IconKey />
                </div>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  API Keys
                </h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    OpenAI API Key
                    {envVars.OPENAI_API_KEY && envVars.OPENAI_API_KEY.trim() && (
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#22c55e',
                        marginLeft: '8px'
                      }}></div>
                    )}
                  </label>
                  <input
                    type="password"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease',
                      fontFamily: 'ui-monospace, monospace'
                    }}
                    value={envVars.OPENAI_API_KEY || ''}
                    onChange={(e) => handleEnvChange('OPENAI_API_KEY', e.target.value)}
                    placeholder="sk-..."
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5b61eb'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,97,235,0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginTop: '0.5rem'
                  }}>
                    Get your API key from{' '}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#5b61eb', textDecoration: 'none' }}
                    >
                      OpenAI Platform
                    </a>
                  </p>
                </div>

                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Anthropic API Key
                    {envVars.ANTHROPIC_API_KEY && envVars.ANTHROPIC_API_KEY.trim() && (
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#22c55e',
                        marginLeft: '8px'
                      }}></div>
                    )}
                  </label>
                  <input
                    type="password"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease',
                      fontFamily: 'ui-monospace, monospace'
                    }}
                    value={envVars.ANTHROPIC_API_KEY || ''}
                    onChange={(e) => handleEnvChange('ANTHROPIC_API_KEY', e.target.value)}
                    placeholder="sk-ant-..."
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5b61eb'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,97,235,0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginTop: '0.5rem'
                  }}>
                    Get your API key from{' '}
                    <a
                      href="https://console.anthropic.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#5b61eb', textDecoration: 'none' }}
                    >
                      Anthropic Console
                    </a>
                  </p>
                </div>

                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Google Gemini API Key
                    {envVars.GEMINI_API_KEY && envVars.GEMINI_API_KEY.trim() && (
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#22c55e',
                        marginLeft: '8px'
                      }}></div>
                    )}
                  </label>
                  <input
                    type="password"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease',
                      fontFamily: 'ui-monospace, monospace'
                    }}
                    value={envVars.GEMINI_API_KEY || ''}
                    onChange={(e) => handleEnvChange('GEMINI_API_KEY', e.target.value)}
                    placeholder="AIza..."
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5b61eb'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,97,235,0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginTop: '0.5rem'
                  }}>
                    Get your API key from{' '}
                    <a
                      href="https://makersuite.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#5b61eb', textDecoration: 'none' }}
                    >
                      Google AI Studio
                    </a>
                  </p>
                </div>

                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    OpenRouter API Key
                    {envVars.OPENROUTER_API_KEY && envVars.OPENROUTER_API_KEY.trim() && (
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#22c55e',
                        marginLeft: '8px'
                      }}></div>
                    )}
                  </label>
                  <input
                    type="password"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease',
                      fontFamily: 'ui-monospace, monospace'
                    }}
                    value={envVars.OPENROUTER_API_KEY || ''}
                    onChange={(e) => handleEnvChange('OPENROUTER_API_KEY', e.target.value)}
                    placeholder="sk-or-..."
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5b61eb'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,97,235,0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginTop: '0.5rem'
                  }}>
                    Get your API key from{' '}
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#5b61eb', textDecoration: 'none' }}
                    >
                      OpenRouter
                    </a>
                  </p>
                </div>

                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Ollama Base URL
                    {envVars.OLLAMA_BASE_URL && envVars.OLLAMA_BASE_URL.trim() && (
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#22c55e',
                        marginLeft: '8px'
                      }}></div>
                    )}
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease',
                      fontFamily: 'ui-monospace, monospace'
                    }}
                    value={envVars.OLLAMA_BASE_URL || ''}
                    onChange={(e) => handleEnvChange('OLLAMA_BASE_URL', e.target.value)}
                    placeholder="http://localhost:11434"
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5b61eb'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,97,235,0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginTop: '0.5rem'
                  }}>
                    Local Ollama server URL. Install from{' '}
                    <a
                      href="https://ollama.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#5b61eb', textDecoration: 'none' }}
                    >
                      ollama.com
                    </a>
                  </p>
                </div>
              </div>
            </div>


            {/* Save Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              animation: 'slideUp 0.6s ease-out 0.1s both'
            }}>
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '14px 28px',
                  backgroundColor: saving ? '#d1d5db' : '#5b61eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: saving ? 'none' : '0 2px 4px rgba(91,97,235,0.2)'
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.currentTarget.style.backgroundColor = '#4f46e5'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(91,97,235,0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saving) {
                    e.currentTarget.style.backgroundColor = '#5b61eb'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(91,97,235,0.2)'
                  }
                }}
              >
                <span style={{ marginRight: '8px' }}>
                  {saving ? (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                  ) : (
                    <IconSave />
                  )}
                </span>
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings