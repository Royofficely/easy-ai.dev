import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Editor from '@monaco-editor/react'

interface Model {
  id: string
  name: string
  provider: string
  description: string
}

interface PlaygroundResponse {
  success: boolean
  response?: string
  error?: string
  tokens?: number
  cost?: number
  duration?: number
}

interface Prompt {
  name: string
  description: string
  category: string
  model: string
  content: string
}

const Playground: React.FC = () => {
  const [prompt, setPrompt] = useState('')
  const [availableModels, setAvailableModels] = useState<Model[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, PlaygroundResponse>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [modelSearchQuery, setModelSearchQuery] = useState('')
  const [availablePrompts, setAvailablePrompts] = useState<Prompt[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<string>('')
  const [showPromptSelector, setShowPromptSelector] = useState(false)
  const [collapsedProviders, setCollapsedProviders] = useState<Set<string>>(new Set(['OpenAI', 'Anthropic', 'OpenRouter']))
  const [showModelFilters, setShowModelFilters] = useState(false)

  // Icons
  const IconPlay = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5,3 19,12 5,21"></polygon>
    </svg>
  )

  const IconCpu = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"></rect>
      <rect x="9" y="9" width="6" height="6"></rect>
      <line x1="9" y1="1" x2="9" y2="4"></line>
      <line x1="15" y1="1" x2="15" y2="4"></line>
      <line x1="9" y1="20" x2="9" y2="23"></line>
      <line x1="15" y1="20" x2="15" y2="23"></line>
      <line x1="20" y1="9" x2="23" y2="9"></line>
      <line x1="20" y1="14" x2="23" y2="14"></line>
      <line x1="1" y1="9" x2="4" y2="9"></line>
      <line x1="1" y1="14" x2="4" y2="14"></line>
    </svg>
  )

  const IconEdit = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  )

  const IconCheck = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,6 9,17 4,12"></polyline>
    </svg>
  )

  const IconFileText = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2Z"></path>
      <polyline points="14,2 14,8 20,8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10,9 9,9 8,9"></polyline>
    </svg>
  )

  const IconChevronDown = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6,9 12,15 18,9"></polyline>
    </svg>
  )

  const IconChevronUp = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18,15 12,9 6,15"></polyline>
    </svg>
  )

  const IconFilter = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"></polygon>
    </svg>
  )

  useEffect(() => {
    fetchModels()
    fetchPrompts()
  }, [])

  const fetchModels = async () => {
    try {
      const response = await axios.get('/api/models')
      const models = Array.isArray(response.data) ? response.data : []
      setAvailableModels(models)
      if (models.length > 0) {
        setSelectedModels([models[0].id])
      }
    } catch (error) {
      console.error('Failed to fetch models:', error)
      setAvailableModels([])
    }
  }

  const fetchPrompts = async () => {
    try {
      const response = await axios.get('/api/prompts')
      const prompts = Array.isArray(response.data) ? response.data : []
      setAvailablePrompts(prompts)
    } catch (error) {
      console.error('Failed to fetch prompts:', error)
      setAvailablePrompts([])
    }
  }

  const detectVariables = (text: string) => {
    const variablePattern = /\{\{(\w+)\}\}/g
    const matches = [...text.matchAll(variablePattern)]
    const detectedVars = matches.map(match => match[1])
    
    // Add new variables to state
    const newVariables = { ...variables }
    detectedVars.forEach(varName => {
      if (!newVariables[varName]) {
        newVariables[varName] = ''
      }
    })
    setVariables(newVariables)
    
    return detectedVars
  }

  const handlePromptChange = (value: string | undefined) => {
    const newValue = value || ''
    setPrompt(newValue)
    detectVariables(newValue)
  }

  const handleModelToggle = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    )
  }

  const handlePromptSelect = (promptName: string) => {
    const selectedPromptData = availablePrompts.find(p => p.name === promptName)
    if (selectedPromptData) {
      // Extract full content by making API call to get the actual prompt content
      loadPromptContent(selectedPromptData)
      setSelectedPrompt(promptName)
      setShowPromptSelector(false)
    }
  }

  const loadPromptContent = async (promptData: Prompt) => {
    try {
      // For now, use the content preview. In a real app, you'd fetch full content
      setPrompt(promptData.content)
      detectVariables(promptData.content)
    } catch (error) {
      console.error('Failed to load prompt content:', error)
    }
  }

  const getSampleValues = () => {
    const sampleData: Record<string, string> = {}
    detectedVariables.forEach(varName => {
      const lowerName = varName.toLowerCase()
      if (lowerName.includes('name')) {
        sampleData[varName] = 'John Smith'
      } else if (lowerName.includes('company')) {
        sampleData[varName] = 'Acme Corporation'
      } else if (lowerName.includes('product')) {
        sampleData[varName] = 'AI Assistant Pro'
      } else if (lowerName.includes('email')) {
        sampleData[varName] = 'john@example.com'
      } else if (lowerName.includes('topic') || lowerName.includes('subject')) {
        sampleData[varName] = 'Artificial Intelligence'
      } else if (lowerName.includes('language')) {
        sampleData[varName] = 'JavaScript'
      } else if (lowerName.includes('date')) {
        sampleData[varName] = new Date().toLocaleDateString()
      } else if (lowerName.includes('url')) {
        sampleData[varName] = 'https://example.com'
      } else {
        sampleData[varName] = 'Sample value'
      }
    })
    return sampleData
  }

  const getQuickFillOptions = (varName: string) => {
    const lowerName = varName.toLowerCase()
    const options = []
    
    if (lowerName.includes('name')) {
      options.push(
        { label: 'John', value: 'John Smith' },
        { label: 'Jane', value: 'Jane Doe' },
        { label: 'Alex', value: 'Alex Johnson' }
      )
    } else if (lowerName.includes('company')) {
      options.push(
        { label: 'Tech', value: 'Tech Solutions Inc' },
        { label: 'Startup', value: 'Innovative Startup' },
        { label: 'Corp', value: 'Global Corporation' }
      )
    } else if (lowerName.includes('language')) {
      options.push(
        { label: 'JS', value: 'JavaScript' },
        { label: 'Python', value: 'Python' },
        { label: 'React', value: 'React' }
      )
    } else if (lowerName.includes('topic')) {
      options.push(
        { label: 'AI', value: 'Artificial Intelligence' },
        { label: 'Web', value: 'Web Development' },
        { label: 'Data', value: 'Data Science' }
      )
    } else {
      options.push(
        { label: 'Sample', value: 'Sample value' },
        { label: 'Test', value: 'Test data' }
      )
    }
    
    return options.slice(0, 3) // Limit to 3 options to keep UI clean
  }

  const toggleProviderCollapse = (provider: string) => {
    setCollapsedProviders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(provider)) {
        newSet.delete(provider)
      } else {
        newSet.add(provider)
      }
      return newSet
    })
  }

  const runTests = async () => {
    if (!prompt.trim()) return
    
    const testPromises = selectedModels.map(async (modelId) => {
      setLoading(prev => ({ ...prev, [modelId]: true }))
      
      try {
        let processedPrompt = prompt
        // Replace variables
        Object.entries(variables).forEach(([key, value]) => {
          processedPrompt = processedPrompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
        })
        
        const response = await axios.post('/api/playground/test', {
          prompt: processedPrompt,
          model: modelId,
          variables
        })
        
        setResults(prev => ({ ...prev, [modelId]: response.data }))
      } catch (error: any) {
        setResults(prev => ({ 
          ...prev, 
          [modelId]: { 
            success: false, 
            error: error.response?.data?.error || error.message 
          }
        }))
      } finally {
        setLoading(prev => ({ ...prev, [modelId]: false }))
      }
    })
    
    await Promise.all(testPromises)
  }

  const detectedVariables = Object.keys(variables)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '100rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid #f3f4f6', padding: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>
              Playground
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Test prompts across multiple AI models and compare results
            </p>
          </div>
        </div>

        <div style={{ padding: '2rem' }}>
          {/* Top Section: Models (left) + Prompt Editor (right) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            
            {/* Left: Model Selection */}
            <div style={{
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid #f3f4f6',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  marginRight: '8px',
                  color: '#5b61eb'
                }}>
                  <IconCpu />
                </div>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  Select Models ({selectedModels.length})
                </h3>
              </div>

              {/* Always Visible Search */}
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Search models..."
                  value={modelSearchQuery}
                  onChange={(e) => setModelSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              {/* Models Container */}
              <div style={{ 
                maxHeight: '240px',
                overflowY: 'auto',
                border: '1px solid #f3f4f6',
                borderRadius: '8px',
                padding: '0.5rem'
              }}>
                {Object.entries(
                  availableModels
                    .filter(model => 
                      modelSearchQuery === '' ||
                      model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
                      model.id.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
                      model.provider.toLowerCase().includes(modelSearchQuery.toLowerCase())
                    )
                    .reduce((groups, model) => {
                      if (!groups[model.provider]) groups[model.provider] = []
                      groups[model.provider].push(model)
                      return groups
                    }, {} as Record<string, Model[]>)
                ).map(([provider, providerModels]) => (
                  <div key={provider} style={{ marginBottom: '1.5rem' }}>
                    {/* Provider header */}
                    <div 
                      onClick={() => toggleProviderCollapse(provider)}
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.75rem',
                        padding: '0.5rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb'
                      }}
                    >
                      <span>{provider} Models ({providerModels.length})</span>
                      <span style={{ marginLeft: '8px' }}>
                        {collapsedProviders.has(provider) ? <IconChevronDown /> : <IconChevronUp />}
                      </span>
                    </div>
                    
                    {/* Models list */}
                    {!collapsedProviders.has(provider) && (
                      <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        marginBottom: '1rem'
                      }}>
                      {providerModels
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((model) => (
                          <div
                            key={model.id}
                            onClick={() => handleModelToggle(model.id)}
                            style={{
                              padding: '0.75rem',
                              border: selectedModels.includes(model.id) ? '2px solid #5b61eb' : '1px solid #e5e7eb',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              backgroundColor: selectedModels.includes(model.id) ? '#f8faff' : '#ffffff'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  color: '#111827',
                                  marginBottom: '0.25rem'
                                }}>
                                  {model.name}
                                </div>
                                <div style={{
                                  fontSize: '0.75rem',
                                  color: '#6b7280',
                                  fontFamily: 'ui-monospace, monospace'
                                }}>
                                  {model.id}
                                </div>
                              </div>
                              {selectedModels.includes(model.id) && (
                                <div style={{
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '50%',
                                  backgroundColor: '#5b61eb',
                                  color: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginLeft: '8px',
                                  flexShrink: 0
                                }}>
                                  <IconCheck />
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      }
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Run Button */}
              <div style={{ marginTop: '1.5rem' }}>
                <button
                  onClick={runTests}
                  disabled={!prompt.trim() || selectedModels.length === 0 || Object.values(loading).some(Boolean)}
                  style={{
                    width: '100%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 24px',
                    backgroundColor: (!prompt.trim() || selectedModels.length === 0 || Object.values(loading).some(Boolean)) ? '#d1d5db' : '#5b61eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: (!prompt.trim() || selectedModels.length === 0 || Object.values(loading).some(Boolean)) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ marginRight: '8px' }}>
                    {Object.values(loading).some(Boolean) ? (
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #ffffff',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                    ) : (
                      <IconPlay />
                    )}
                  </span>
                  {Object.values(loading).some(Boolean) ? 'Running...' : 'Run Tests'}
                </button>
              </div>
            </div>

            {/* Right: Prompt Editor */}
            <div style={{
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid #f3f4f6',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    marginRight: '8px',
                    color: '#5b61eb'
                  }}>
                    <IconEdit />
                  </div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#111827'
                  }}>
                    Prompt Editor
                  </h3>
                </div>
                
                {/* Load Prompt Button */}
                <button
                  onClick={() => setShowPromptSelector(!showPromptSelector)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: '#ffffff',
                    color: '#5b61eb',
                    border: '1px solid #e0e7ff',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f4ff'
                    e.currentTarget.style.borderColor = '#c7d2fe'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff'
                    e.currentTarget.style.borderColor = '#e0e7ff'
                  }}
                >
                  <span style={{ marginRight: '6px' }}>
                    <IconFileText />
                  </span>
                  Load Prompt
                  <span style={{ marginLeft: '6px' }}>
                    <IconChevronDown />
                  </span>
                </button>
              </div>

              {/* Prompt Selector Dropdown */}
              {showPromptSelector && (
                <div style={{
                  position: 'relative',
                  marginBottom: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  zIndex: 10
                }}>
                  {availablePrompts.length === 0 ? (
                    <div style={{
                      padding: '2rem',
                      textAlign: 'center',
                      color: '#6b7280'
                    }}>
                      No prompts available. Create some prompts first.
                    </div>
                  ) : (
                    Object.entries(
                      availablePrompts.reduce((groups, prompt) => {
                        if (!groups[prompt.category]) groups[prompt.category] = []
                        groups[prompt.category].push(prompt)
                        return groups
                      }, {} as Record<string, Prompt[]>)
                    ).map(([category, categoryPrompts]) => (
                      <div key={category} style={{ marginBottom: '1rem' }}>
                        {/* Category header */}
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#374151',
                          padding: '0.75rem 1rem 0.5rem',
                          backgroundColor: '#f9fafb',
                          borderBottom: '1px solid #f3f4f6',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {category}
                        </div>
                        
                        {/* Prompts list */}
                        {categoryPrompts.map((prompt) => (
                          <div
                            key={prompt.name}
                            onClick={() => handlePromptSelect(prompt.name)}
                            style={{
                              padding: '0.75rem 1rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f3f4f6',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f8faff'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <div style={{
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: '#111827',
                              marginBottom: '0.25rem'
                            }}>
                              {prompt.name}
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              lineHeight: '1.4'
                            }}>
                              {prompt.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Monaco Editor */}
              <div style={{
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <Editor
                  height="300px"
                  defaultLanguage="markdown"
                  value={prompt}
                  onChange={handlePromptChange}
                  theme="vs"
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    wrappingIndent: 'indent',
                    padding: { top: 12, bottom: 12 },
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
                    renderLineHighlight: 'none',
                    hideCursorInOverviewRuler: true,
                    overviewRulerBorder: false,
                    scrollbar: {
                      vertical: 'auto',
                      horizontal: 'auto',
                      verticalScrollbarSize: 8,
                      horizontalScrollbarSize: 8
                    }
                  }}
                  loading={
                    <div style={{
                      height: '300px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#fafafa',
                      color: '#6b7280'
                    }}>
                      Loading editor...
                    </div>
                  }
                />
              </div>

              {/* Variables */}
              {detectedVariables.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h4 style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      margin: 0
                    }}>
                      Test Variables ({detectedVariables.length})
                    </h4>
                    <button
                      onClick={() => {
                        const sampleValues = getSampleValues()
                        setVariables(prev => ({ ...prev, ...sampleValues }))
                      }}
                      style={{
                        fontSize: '0.75rem',
                        color: '#5b61eb',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Fill with sample data
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {detectedVariables.map((varName) => (
                      <div key={varName} style={{
                        padding: '1rem',
                        border: '1px solid #f3f4f6',
                        borderRadius: '8px',
                        backgroundColor: '#fafbfc'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <label style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151',
                            fontFamily: 'ui-monospace, monospace'
                          }}>
                            {`{{${varName}}}`}
                          </label>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {getQuickFillOptions(varName).map((option) => (
                              <button
                                key={option.label}
                                onClick={() => setVariables(prev => ({
                                  ...prev,
                                  [varName]: option.value
                                }))}
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '2px 6px',
                                  backgroundColor: '#e0e7ff',
                                  color: '#5b61eb',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#c7d2fe'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#e0e7ff'
                                }}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <input
                          type="text"
                          value={variables[varName] || ''}
                          onChange={(e) => setVariables(prev => ({
                            ...prev,
                            [varName]: e.target.value
                          }))}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease',
                            backgroundColor: '#ffffff'
                          }}
                          placeholder={`Enter value for ${varName}`}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#5b61eb'
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,97,235,0.1)'
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d1d5db'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section: Results Table (full width) */}
          {Object.keys(results).length > 0 && (
            <div style={{
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid #f3f4f6',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '1.5rem'
              }}>
                Results ({Object.keys(results).length} model{Object.keys(results).length !== 1 ? 's' : ''})
              </h3>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{
                        textAlign: 'left',
                        padding: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Model
                      </th>
                      <th style={{
                        textAlign: 'left',
                        padding: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Query
                      </th>
                      <th style={{
                        textAlign: 'left',
                        padding: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Status
                      </th>
                      <th style={{
                        textAlign: 'left',
                        padding: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Tokens
                      </th>
                      <th style={{
                        textAlign: 'left',
                        padding: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Cost
                      </th>
                      <th style={{
                        textAlign: 'left',
                        padding: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Duration
                      </th>
                      <th style={{
                        textAlign: 'left',
                        padding: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Response
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(results).map(([modelId, result]) => {
                      const model = availableModels.find(m => m.id === modelId)
                      return (
                        <tr key={modelId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px', verticalAlign: 'top' }}>
                            <div>
                              <div style={{
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: '#111827'
                              }}>
                                {model?.name || modelId}
                              </div>
                              <div style={{
                                fontSize: '0.75rem',
                                color: '#6b7280'
                              }}>
                                {model?.provider}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px', verticalAlign: 'top', maxWidth: '300px' }}>
                            <div style={{
                              fontSize: '0.875rem',
                              color: '#111827',
                              lineHeight: '1.4',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              fontFamily: 'ui-monospace, monospace'
                            }}>
                              {prompt}
                            </div>
                          </td>
                          <td style={{ padding: '12px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <div style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: result.success ? '#22c55e' : '#ef4444',
                                marginRight: '6px'
                              }}></div>
                              <span style={{
                                fontSize: '0.75rem',
                                color: result.success ? '#059669' : '#dc2626',
                                fontWeight: '500'
                              }}>
                                {result.success ? 'Success' : 'Failed'}
                              </span>
                            </div>
                          </td>
                          <td style={{ 
                            padding: '12px', 
                            verticalAlign: 'top',
                            fontSize: '0.875rem',
                            color: '#111827',
                            fontFamily: 'ui-monospace, monospace'
                          }}>
                            {result.tokens || '-'}
                          </td>
                          <td style={{ 
                            padding: '12px', 
                            verticalAlign: 'top',
                            fontSize: '0.875rem',
                            color: '#111827',
                            fontFamily: 'ui-monospace, monospace'
                          }}>
                            {result.cost ? `$${result.cost.toFixed(4)}` : '-'}
                          </td>
                          <td style={{ 
                            padding: '12px', 
                            verticalAlign: 'top',
                            fontSize: '0.875rem',
                            color: '#111827',
                            fontFamily: 'ui-monospace, monospace'
                          }}>
                            {result.duration ? `${result.duration}ms` : '-'}
                          </td>
                          <td style={{ padding: '12px', verticalAlign: 'top', maxWidth: '400px' }}>
                            {result.success ? (
                              <div style={{
                                fontSize: '0.875rem',
                                color: '#111827',
                                lineHeight: '1.4',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 4,
                                WebkitBoxOrient: 'vertical',
                                fontFamily: 'ui-monospace, monospace'
                              }}>
                                {result.response}
                              </div>
                            ) : (
                              <div style={{
                                fontSize: '0.875rem',
                                color: '#dc2626',
                                fontStyle: 'italic'
                              }}>
                                {result.error}
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Playground