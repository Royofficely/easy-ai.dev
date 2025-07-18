import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PromptModal from './PromptModal';
import { io, Socket } from 'socket.io-client';
import './Dashboard.css';

type DashboardSection = 'overview' | 'prompts' | 'apikeys' | 'analytics' | 'settings';

const Dashboard: React.FC = () => {
  const { user, logout, apiKey } = useAuth();
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectedClients, setConnectedClients] = useState(1);
  const [currentApiKey, setCurrentApiKey] = useState<string>('');

  // Initialize WebSocket connection and get current API key
  useEffect(() => {
    const apiKeyValue = (window as any).EASYAI_API_KEY || localStorage.getItem('easyai_api_key') || apiKey || 'easyai_138690662fff4dc1';
    setCurrentApiKey(apiKeyValue);
    
    const newSocket = io('http://localhost:4000');
    setSocket(newSocket);
    
    // Listen for real-time prompt events
    newSocket.on('prompt_created', (data) => {
      console.log('🎉 New prompt created:', data.prompt);
      setPrompts(prev => [data.prompt, ...prev]);
    });
    
    newSocket.on('prompt_updated', (data) => {
      console.log('✏️ Prompt updated:', data.prompt);
      setPrompts(prev => prev.map(p => p.id === data.prompt.id ? data.prompt : p));
    });
    
    newSocket.on('prompt_deleted', (data) => {
      console.log('🗑️ Prompt deleted:', data.prompt_id);
      setPrompts(prev => prev.filter(p => p.prompt_id !== data.prompt_id));
    });
    
    // Listen for connection count updates
    newSocket.on('client_count', (count) => {
      setConnectedClients(count);
    });
    
    return () => {
      newSocket.close();
    };
  }, [apiKey]);
  
  // Fetch prompts when component mounts or when prompts section is active
  useEffect(() => {
    if (activeSection === 'prompts') {
      fetchPrompts();
    }
  }, [activeSection]);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/prompts', {
        headers: {
          'x-api-key': currentApiKey
        }
      });
      const data = await response.json();
      setPrompts(data.prompts || data);
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreatePrompt = async (promptData: any) => {
    try {
      const response = await fetch('http://localhost:4000/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': currentApiKey
        },
        body: JSON.stringify(promptData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create prompt');
      }
      
      const newPrompt = await response.json();
      console.log('✅ Prompt created successfully:', newPrompt);
      // Real-time update will be handled by WebSocket
    } catch (error) {
      console.error('Failed to create prompt:', error);
      alert('Failed to create prompt. Please try again.');
    }
  };
  
  const handleEditPrompt = async (promptData: any) => {
    try {
      const response = await fetch(`http://localhost:4000/api/prompts/${editingPrompt.prompt_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': currentApiKey
        },
        body: JSON.stringify(promptData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update prompt');
      }
      
      const updatedPrompt = await response.json();
      console.log('✅ Prompt updated successfully:', updatedPrompt);
      setEditingPrompt(null);
      // Real-time update will be handled by WebSocket
    } catch (error) {
      console.error('Failed to update prompt:', error);
      alert('Failed to update prompt. Please try again.');
    }
  };
  
  const handleDeletePrompt = async (promptId: string) => {
    if (!window.confirm('Are you sure you want to delete this prompt?')) return;
    
    try {
      const response = await fetch(`http://localhost:4000/api/prompts/${promptId}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': currentApiKey
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete prompt');
      }
      
      console.log('✅ Prompt deleted successfully');
      // Real-time update will be handled by WebSocket
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      alert('Failed to delete prompt. Please try again.');
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'prompts':
        return (
          <div className="section-content">
            <div className="section-header">
              <div className="section-title">
                <h2>Prompts</h2>
                <p className="section-subtitle">Manage your AI prompt templates</p>
              </div>
              <div className="section-actions">
                <button className="btn-primary" onClick={() => setShowPromptModal(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  New Prompt
                </button>
              </div>
            </div>
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading prompts...</p>
              </div>
            ) : (
              <div className="prompts-grid">
                {prompts.length > 0 ? (
                  prompts.map((prompt: any) => (
                    <div key={prompt.id} className="prompt-card">
                      <div className="prompt-header">
                        <div className="prompt-meta">
                          <span className="prompt-category">{prompt.category}</span>
                          <div className="prompt-actions">
                            <button className="btn-icon" onClick={() => {
                              setEditingPrompt(prompt);
                              setShowPromptModal(true);
                            }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button className="btn-icon btn-danger" onClick={() => handleDeletePrompt(prompt.prompt_id)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                        <h3 className="prompt-title">{prompt.name}</h3>
                        <p className="prompt-description">{prompt.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                        <line x1="12" y1="12" x2="12" y2="18"/>
                      </svg>
                    </div>
                    <h3>No prompts yet</h3>
                    <p>Create your first prompt template to get started</p>
                    <button className="btn-primary" onClick={() => setShowPromptModal(true)}>Create Prompt</button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case 'apikeys':
        return (
          <div className="section-content">
            <div className="section-header">
              <div className="section-title">
                <h2>API Keys</h2>
                <p className="section-subtitle">Manage your API keys and authentication</p>
              </div>
            </div>
            <div className="api-key-card">
              <div className="api-key-header">
                <div className="api-key-info">
                  <h3>Current API Key</h3>
                  <div className="api-key-display">
                    <code className="api-key-value">{currentApiKey}</code>
                    <span className="status-badge status-active">Active</span>
                  </div>
                </div>
              </div>
              <div className="api-key-details">
                <div className="detail-item">
                  <span className="detail-label">User ID</span>
                  <span className="detail-value">{currentApiKey.slice(-8)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Permissions</span>
                  <span className="detail-value">Read, Write</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created</span>
                  <span className="detail-value">Today</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="section-content">
            <div className="section-header">
              <div className="section-title">
                <h2>Analytics</h2>
                <p className="section-subtitle">Track your API usage and performance</p>
              </div>
            </div>
            <div className="analytics-grid">
              <div className="metric-card">
                <div className="metric-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                  </svg>
                </div>
                <div className="metric-content">
                  <h3 className="metric-title">Total API Calls</h3>
                  <p className="metric-value">0</p>
                  <p className="metric-change">+0% from last month</p>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <div className="metric-content">
                  <h3 className="metric-title">This Month</h3>
                  <p className="metric-value">0</p>
                  <p className="metric-change">+0% from last month</p>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"/>
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                </div>
                <div className="metric-content">
                  <h3 className="metric-title">Success Rate</h3>
                  <p className="metric-value">100%</p>
                  <p className="metric-change">Perfect performance</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="section-content">
            <div className="section-header">
              <div className="section-title">
                <h2>Settings</h2>
                <p className="section-subtitle">Manage your account and preferences</p>
              </div>
            </div>
            <div className="settings-card">
              <h3 className="settings-title">Account Information</h3>
              <div className="setting-group">
                <div className="setting-item">
                  <label className="setting-label">Email Address</label>
                  <input className="setting-input" type="email" value={user?.email || `user_${currentApiKey.slice(-8)}@easyai.local`} disabled />
                </div>
                <div className="setting-item">
                  <label className="setting-label">Account Type</label>
                  <input className="setting-input" type="text" value={user?.role || 'Developer'} disabled />
                </div>
                <div className="setting-item">
                  <label className="setting-label">User ID</label>
                  <input className="setting-input" type="text" value={currentApiKey.slice(-8)} disabled />
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="section-content">
            <div className="section-header">
              <div className="section-title">
                <h2>Overview</h2>
                <p className="section-subtitle">Welcome back to your EasyAI dashboard</p>
              </div>
            </div>
            
            <div className="overview-grid">
              <div className="metric-card overview-metric">
                <div className="metric-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                  </svg>
                </div>
                <div className="metric-content">
                  <h3 className="metric-title">API Calls</h3>
                  <p className="metric-value">0</p>
                </div>
              </div>
              <div className="metric-card overview-metric">
                <div className="metric-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"/>
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                </div>
                <div className="metric-content">
                  <h3 className="metric-title">Active Keys</h3>
                  <p className="metric-value">1</p>
                </div>
              </div>
              <div className="metric-card overview-metric">
                <div className="metric-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                </div>
                <div className="metric-content">
                  <h3 className="metric-title">Prompts</h3>
                  <p className="metric-value">{prompts.length}</p>
                </div>
              </div>
            </div>
            
            <div className="features-section">
              <h3 className="features-title">Quick Actions</h3>
              <div className="features-grid">
                <div className="feature-card" onClick={() => setActiveSection('prompts')}>
                  <div className="feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                      <polyline points="14,2 14,8 20,8"/>
                    </svg>
                  </div>
                  <div className="feature-content">
                    <h4>Prompts</h4>
                    <p>Manage your AI prompt templates</p>
                  </div>
                  <div className="feature-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </div>
                <div className="feature-card" onClick={() => setActiveSection('apikeys')}>
                  <div className="feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <circle cx="12" cy="16" r="1"/>
                      <path d="m7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div className="feature-content">
                    <h4>API Keys</h4>
                    <p>Manage your authentication keys</p>
                  </div>
                  <div className="feature-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </div>
                <div className="feature-card" onClick={() => setActiveSection('analytics')}>
                  <div className="feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3v18h18"/>
                      <path d="m19 9-5 5-4-4-3 3"/>
                    </svg>
                  </div>
                  <div className="feature-content">
                    <h4>Analytics</h4>
                    <p>Track usage and performance</p>
                  </div>
                  <div className="feature-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </div>
                <div className="feature-card" onClick={() => setActiveSection('settings')}>
                  <div className="feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v6m0 6v6m11-5h-6m-6 0H1"/>
                    </svg>
                  </div>
                  <div className="feature-content">
                    <h4>Settings</h4>
                    <p>Configure your account</p>
                  </div>
                  <div className="feature-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            <h1>EasyAI</h1>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={activeSection === 'overview' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveSection('overview')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            Overview
          </button>
          <button 
            className={activeSection === 'prompts' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveSection('prompts')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
            Prompts
          </button>
          <button 
            className={activeSection === 'apikeys' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveSection('apikeys')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <circle cx="12" cy="16" r="1"/>
              <path d="m7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            API Keys
          </button>
          <button 
            className={activeSection === 'analytics' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveSection('analytics')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18"/>
              <path d="m19 9-5 5-4-4-3 3"/>
            </svg>
            Analytics
          </button>
          <button 
            className={activeSection === 'settings' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveSection('settings')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m11-5h-6m-6 0H1"/>
            </svg>
            Settings
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="user-details">
              <p className="user-name">User {currentApiKey.slice(-8)}</p>
              <p className="user-email">{user?.email || `user_${currentApiKey.slice(-8)}@easyai.local`}</p>
            </div>
          </div>
          <div className="connection-status">
            <div className="status-indicator"></div>
            <span>Connected ({connectedClients})</span>
          </div>
        </div>
      </div>
      
      <main className="main-content">
        <div className="content-wrapper">
          {renderContent()}
        </div>
      </main>
      
      <PromptModal 
        isOpen={showPromptModal}
        onClose={() => {
          setShowPromptModal(false);
          setEditingPrompt(null);
        }}
        onSave={editingPrompt ? handleEditPrompt : handleCreatePrompt}
        editingPrompt={editingPrompt}
      />
    </div>
  );
};

export default Dashboard;