import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Prompt } from '../types'
import { useUniversalSearch, SearchModal } from '../hooks/useUniversalSearch'
import Editor from '@monaco-editor/react'

const Prompts: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [models, setModels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modelsLoading, setModelsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [modelSearchQuery, setModelSearchQuery] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    model: 'gpt-4',
    content: ''
  })

  // Universal search
  const {
    isSearchOpen,
    searchQuery,
    searchResults,
    openSearch,
    closeSearch,
    handleSearch
  } = useUniversalSearch(prompts, {
    keys: ['name', 'description', 'category', 'content'],
    threshold: 0.3
  })

  // Icons
  const IconPlus = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  )

  const IconEdit = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  )

  const IconTrash = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,6 5,6 21,6"></polyline>
      <path d="M19,6V20a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6M8,6V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2V6"></path>
    </svg>
  )

  const IconFolder = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
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

  useEffect(() => {
    fetchPrompts()
    fetchModels()
  }, [])

  // Collapse all categories by default when prompts are loaded
  useEffect(() => {
    if (prompts.length > 0) {
      const allCategories = [...new Set(prompts.map(p => p.category))]
      setCollapsedCategories(new Set(allCategories))
    }
  }, [prompts])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showModelDropdown && !(event.target as Element).closest('.model-dropdown-container')) {
        setShowModelDropdown(false)
        setModelSearchQuery('')
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showModelDropdown])

  const fetchPrompts = async () => {
    try {
      const response = await axios.get('/api/prompts')
      setPrompts(response.data)
    } catch (error) {
      console.error('Failed to fetch prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchModels = async () => {
    setModelsLoading(true)
    try {
      const response = await axios.get('/api/models')
      setModels(response.data)
      
      // Set default model if none selected and models are available
      if (response.data.length > 0 && formData.model === 'gpt-4') {
        const defaultModel = response.data.find((m: any) => m.id === 'gpt-4') || response.data[0]
        setFormData(prev => ({ ...prev, model: defaultModel.id }))
      }
    } catch (error) {
      console.error('Failed to fetch models:', error)
      // Fallback to default models
      setModels([
        { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', description: 'Most capable model' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Fast and efficient' }
      ])
    } finally {
      setModelsLoading(false)
    }
  }

  const handleCreatePrompt = () => {
    setEditingPrompt(null)
    setFormData({
      name: '',
      description: '',
      category: '',
      model: 'gpt-4',
      content: ''
    })
    setShowModal(true)
  }

  const handleEditPrompt = async (prompt: Prompt) => {
    try {
      const response = await axios.get(`/api/prompts/${prompt.category}/${prompt.name}`)
      setEditingPrompt(prompt)
      setFormData({
        name: prompt.name,
        description: prompt.description || '',
        category: prompt.category,
        model: prompt.model || 'gpt-4',
        content: response.data.content
      })
      setShowModal(true)
    } catch (error) {
      console.error('Failed to load prompt:', error)
    }
  }

  const handleSavePrompt = async () => {
    try {
      const content = `# ${formData.name}

## Description
${formData.description}

## Model
${formData.model}

## Content
${formData.content}`

      await axios.post(`/api/prompts/${formData.category}/${formData.name}`, {
        content
      })
      
      await fetchPrompts()
      setShowModal(false)
    } catch (error) {
      console.error('Failed to save prompt:', error)
    }
  }

  const handleDeletePrompt = async (prompt: Prompt) => {
    if (confirm(`Are you sure you want to delete "${prompt.name}"?`)) {
      try {
        await axios.delete(`/api/prompts/${prompt.category}/${prompt.name}`)
        await fetchPrompts()
      } catch (error) {
        console.error('Failed to delete prompt:', error)
      }
    }
  }

  const categories = [...new Set(searchResults.map(p => p.category))]

  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid #f3f4f6', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>
                Prompts
              </h1>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Manage your AI prompts and templates
              </p>
            </div>
            <button
              onClick={handleCreatePrompt}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '12px 20px',
                backgroundColor: '#5b61eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(91,97,235,0.2)',
                animation: 'slideUp 0.6s ease-out 0.2s both'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4f46e5'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(91,97,235,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#5b61eb'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(91,97,235,0.2)'
              }}
            >
              <span style={{ marginRight: '8px' }}>
                <IconPlus />
              </span>
              New Prompt
            </button>
          </div>
        </div>

        <div style={{ padding: '2rem' }}>
          {categories.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              animation: 'slideUp 0.6s ease-out both'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#f3f4f6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                color: '#9ca3af',
                fontSize: '32px'
              }}>
                📝
              </div>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                color: '#111827',
                marginBottom: '0.5rem'
              }}>
                No prompts yet
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '0.875rem' }}>
                Create your first prompt template to get started
              </p>
              <button 
                onClick={handleCreatePrompt}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '10px 16px',
                  backgroundColor: '#5b61eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ marginRight: '6px' }}>
                  <IconPlus />
                </span>
                Create your first prompt
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              {categories.map((category, categoryIndex) => (
                <div 
                  key={category}
                  style={{ animation: `slideUp 0.6s ease-out ${categoryIndex * 0.1}s both` }}
                >
                  {/* Category Header */}
                  <div 
                    onClick={() => toggleCategoryCollapse(category)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '1.5rem',
                      paddingBottom: '0.75rem',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      margin: '-0.5rem -0.5rem 1rem -0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      marginRight: '8px',
                      color: '#5b61eb'
                    }}>
                      <IconFolder />
                    </div>
                    <h2 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#111827',
                      textTransform: 'capitalize',
                      marginRight: '12px'
                    }}>
                      {category}
                    </h2>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      backgroundColor: '#f3f4f6',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
                      marginRight: 'auto'
                    }}>
                      {searchResults.filter(p => p.category === category).length} prompts
                    </span>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      color: '#6b7280',
                      transition: 'transform 0.2s ease',
                      transform: collapsedCategories.has(category) ? 'rotate(0deg)' : 'rotate(180deg)'
                    }}>
                      <IconChevronDown />
                    </div>
                  </div>

                  {/* Prompts Grid */}
                  {!collapsedCategories.has(category) && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                      gap: '1.5rem'
                    }}>
                    {searchResults
                      .filter(p => p.category === category)
                      .map((prompt, index) => (
                        <div
                          key={`${prompt.category}-${prompt.name}`}
                          style={{
                            padding: '1.5rem',
                            backgroundColor: '#ffffff',
                            border: '1px solid #f3f4f6',
                            borderRadius: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            position: 'relative',
                            animation: `slideUp 0.6s ease-out ${(categoryIndex * 0.2) + (index * 0.1)}s both`
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'
                            e.currentTarget.style.borderColor = '#e2e8f0'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
                            e.currentTarget.style.borderColor = '#f3f4f6'
                          }}
                        >
                          {/* Prompt Header */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '12px'
                          }}>
                            <h3 style={{
                              fontSize: '1rem',
                              fontWeight: '600',
                              color: '#111827',
                              marginBottom: '4px',
                              lineHeight: '1.3'
                            }}>
                              {prompt.name}
                            </h3>
                            
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleEditPrompt(prompt)}
                                style={{
                                  padding: '4px',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  borderRadius: '4px',
                                  color: '#6b7280',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                                  e.currentTarget.style.color = '#5b61eb'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                  e.currentTarget.style.color = '#6b7280'
                                }}
                              >
                                <IconEdit />
                              </button>
                              <button
                                onClick={() => handleDeletePrompt(prompt)}
                                style={{
                                  padding: '4px',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  borderRadius: '4px',
                                  color: '#6b7280',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#fef2f2'
                                  e.currentTarget.style.color = '#ef4444'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                  e.currentTarget.style.color = '#6b7280'
                                }}
                              >
                                <IconTrash />
                              </button>
                            </div>
                          </div>

                          {/* Prompt Description */}
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            lineHeight: '1.5',
                            marginBottom: '16px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {prompt.description || prompt.content || 'No description available'}
                          </p>

                          {/* Model Badge */}
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            color: '#374151',
                            backgroundColor: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace'
                          }}>
                            {prompt.model || 'gpt-4'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: '0',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: '50',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '2rem',
            width: '100%',
            maxWidth: '42rem',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '1.5rem'
            }}>
              {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Name
                </label>
                <input
                  type="text"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease'
                  }}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter prompt name"
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

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Description
                </label>
                <input
                  type="text"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease'
                  }}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter prompt description"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Category
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease'
                    }}
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="e.g., development, writing"
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

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      flex: 1
                    }}>
                      Model
                    </label>
                    <button
                      type="button"
                      onClick={fetchModels}
                      disabled={modelsLoading}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: modelsLoading ? 'not-allowed' : 'pointer',
                        color: '#6b7280',
                        opacity: modelsLoading ? 0.5 : 1
                      }}
                    >
                      {modelsLoading ? '⟳' : '↻'} Refresh
                    </button>
                  </div>
                  <div className="model-dropdown-container" style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => !modelsLoading && setShowModelDropdown(!showModelDropdown)}
                      disabled={modelsLoading}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        backgroundColor: '#ffffff',
                        cursor: modelsLoading ? 'not-allowed' : 'pointer',
                        opacity: modelsLoading ? 0.7 : 1,
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>
                        {modelsLoading ? 'Loading models...' : 
                         models.length === 0 ? 'No models available' :
                         models.find(m => m.id === formData.model)?.name || 'Select a model'}
                      </span>
                      <span style={{ color: '#6b7280' }}>
                        {showModelDropdown ? '▲' : '▼'}
                      </span>
                    </button>
                    
                    {showModelDropdown && !modelsLoading && models.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        zIndex: 1000,
                        marginTop: '4px'
                      }}>
                        {/* Search input */}
                        <div style={{ padding: '8px' }}>
                          <input
                            type="text"
                            placeholder="Search models..."
                            value={modelSearchQuery}
                            onChange={(e) => setModelSearchQuery(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '4px',
                              fontSize: '0.75rem'
                            }}
                          />
                        </div>
                        
                        {/* Models list with scroll */}
                        <div style={{
                          maxHeight: '200px',
                          overflowY: 'auto',
                          borderTop: '1px solid #f3f4f6'
                        }}>
                          {Object.entries(
                            models
                              .filter(model => 
                                modelSearchQuery === '' ||
                                model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
                                model.id.toLowerCase().includes(modelSearchQuery.toLowerCase())
                              )
                              .reduce((groups, model) => {
                                if (!groups[model.provider]) groups[model.provider] = []
                                groups[model.provider].push(model)
                                return groups
                              }, {})
                          ).map(([provider, providerModels]) => (
                            <div key={provider}>
                              <div style={{
                                padding: '8px 12px',
                                backgroundColor: '#f9fafb',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                color: '#374151',
                                borderTop: '1px solid #f3f4f6'
                              }}>
                                {provider} Models ({providerModels.length})
                              </div>
                              {providerModels
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((model) => (
                                  <button
                                    key={model.id}
                                    type="button"
                                    onClick={() => {
                                      setFormData({...formData, model: model.id})
                                      setShowModelDropdown(false)
                                      setModelSearchQuery('')
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      textAlign: 'left',
                                      border: 'none',
                                      backgroundColor: formData.model === model.id ? '#f0f4ff' : 'transparent',
                                      cursor: 'pointer',
                                      fontSize: '0.875rem',
                                      borderBottom: '1px solid #f9fafb'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = formData.model === model.id ? '#e0e7ff' : '#f9fafb'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = formData.model === model.id ? '#f0f4ff' : 'transparent'
                                    }}
                                    title={model.description}
                                  >
                                    <div style={{ fontWeight: '500', color: '#111827' }}>
                                      {model.name}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                                      {model.id}
                                    </div>
                                  </button>
                                ))
                              }
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {!modelsLoading && models.length > 0 && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginTop: '0.25rem',
                      fontStyle: 'italic'
                    }}>
                      {models.find(m => m.id === formData.model)?.description || ''}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Content
                </label>
                <div style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}>
                  <Editor
                    height="300px"
                    defaultLanguage="markdown"
                    value={formData.content}
                    onChange={(value) => setFormData({...formData, content: value || ''})}
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
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '2rem' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                  e.currentTarget.style.color = '#374151'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#6b7280'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrompt}
                disabled={!formData.name || !formData.category || !formData.content}
                style={{
                  padding: '10px 16px',
                  backgroundColor: (!formData.name || !formData.category || !formData.content) ? '#d1d5db' : '#5b61eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: (!formData.name || !formData.category || !formData.content) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!(!formData.name || !formData.category || !formData.content)) {
                    e.currentTarget.style.backgroundColor = '#4f46e5'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(!formData.name || !formData.category || !formData.content)) {
                    e.currentTarget.style.backgroundColor = '#5b61eb'
                  }
                }}
              >
                {editingPrompt ? 'Update' : 'Create'} Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={closeSearch}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        placeholder="Search prompts by name, description, or content..."
      >
        <div style={{ padding: '1rem' }}>
          {searchQuery && (
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginBottom: '1rem'
            }}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
            </div>
          )}
          
          {searchResults.length === 0 && searchQuery ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#9ca3af'
            }}>
              <div style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No prompts found</div>
              <div style={{ fontSize: '0.875rem' }}>Try searching for different terms</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {searchResults.slice(0, 10).map((prompt, index) => (
                <div
                  key={index}
                  onClick={() => {
                    handleEditPrompt(prompt)
                    closeSearch()
                  }}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                    e.currentTarget.style.borderColor = '#e5e7eb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.borderColor = '#f3f4f6'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#111827',
                      flex: 1
                    }}>
                      {prompt.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        backgroundColor: '#f3f4f6',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontFamily: 'ui-monospace, monospace'
                      }}>
                        {prompt.category}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        backgroundColor: '#f3f4f6',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontFamily: 'ui-monospace, monospace'
                      }}>
                        {prompt.model}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#9ca3af',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {prompt.description || 'No description'}
                  </div>
                </div>
              ))}
              
              {searchResults.length > 10 && (
                <div style={{
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  padding: '0.5rem'
                }}>
                  Showing first 10 results of {searchResults.length}
                </div>
              )}
            </div>
          )}
        </div>
      </SearchModal>
    </div>
  )
}

export default Prompts