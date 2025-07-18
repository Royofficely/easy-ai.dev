import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PromptModal from './PromptModal';
import { io, Socket } from 'socket.io-client';
import './Dashboard.css';

type DashboardSection = 'overview' | 'prompts' | 'apikeys' | 'analytics' | 'settings';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
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
    
    return () => {
      newSocket.close();
    };
  }, []);
  
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
          'x-api-key': (window as any).EASYAI_API_KEY || localStorage.getItem('easyai_api_key') || 'easyai_138690662fff4dc1'
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
          'x-api-key': (window as any).EASYAI_API_KEY || localStorage.getItem('easyai_api_key') || 'easyai_138690662fff4dc1'
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
          'x-api-key': (window as any).EASYAI_API_KEY || localStorage.getItem('easyai_api_key') || 'easyai_138690662fff4dc1'
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
          'x-api-key': (window as any).EASYAI_API_KEY || localStorage.getItem('easyai_api_key') || 'easyai_138690662fff4dc1'
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
            <h2>Prompts Manager</h2>
            <div className="section-actions">
              <button className="primary-button" onClick={() => setShowPromptModal(true)}>Create New Prompt</button>
            </div>
            {loading ? (
              <div className="loading">Loading prompts...</div>
            ) : (
              <div className="prompts-grid">
                {prompts.length > 0 ? (
                  prompts.map((prompt: any) => (
                    <div key={prompt.id} className="prompt-card">
                      <h3>{prompt.name}</h3>
                      <p className="prompt-category">{prompt.category}</p>
                      <p className="prompt-description">{prompt.description}</p>
                      <div className="prompt-actions">
                        <button className="secondary-button" onClick={() => {
                          setEditingPrompt(prompt);
                          setShowPromptModal(true);
                        }}>Edit</button>
                        <button className="danger-button" onClick={() => handleDeletePrompt(prompt.prompt_id)}>Delete</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No prompts found. Create your first prompt to get started!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case 'apikeys':
        return (
          <div className="section-content">
            <h2>API Keys</h2>
            <div className="api-key-info">
              <p>Current API Key: <code>easyai_138690662fff4dc1</code></p>
              <p>Status: <span className="status-active">Active</span></p>
            </div>
            <div className="section-actions">
              <button className="primary-button" onClick={() => alert('Generate new API key feature coming soon!')}>Generate New Key</button>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="section-content">
            <h2>Analytics</h2>
            <div className="analytics-stats">
              <div className="stat-card">
                <h3>Total API Calls</h3>
                <p className="stat-number">0</p>
              </div>
              <div className="stat-card">
                <h3>This Month</h3>
                <p className="stat-number">0</p>
              </div>
              <div className="stat-card">
                <h3>Success Rate</h3>
                <p className="stat-number">100%</p>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="section-content">
            <h2>Settings</h2>
            <div className="settings-section">
              <h3>Account Settings</h3>
              <div className="setting-item">
                <label>Email:</label>
                <input type="email" value={user?.email || ''} disabled />
              </div>
              <div className="setting-item">
                <label>Role:</label>
                <input type="text" value={user?.role || 'developer'} disabled />
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="section-content">
            <h2>Dashboard Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>API Calls</h3>
                <p className="stat-number">0</p>
              </div>
              <div className="stat-card">
                <h3>Active Keys</h3>
                <p className="stat-number">1</p>
              </div>
              <div className="stat-card">
                <h3>Usage</h3>
                <p className="stat-number">0%</p>
              </div>
            </div>
            
            <div className="features-grid">
              <div className="feature-card">
                <h3>API Keys</h3>
                <p>Manage your API keys</p>
                <button className="feature-button" onClick={() => setActiveSection('apikeys')}>View Keys</button>
              </div>
              <div className="feature-card">
                <h3>Analytics</h3>
                <p>View usage analytics</p>
                <button className="feature-button" onClick={() => setActiveSection('analytics')}>View Analytics</button>
              </div>
              <div className="feature-card">
                <h3>Settings</h3>
                <p>Configure your account</p>
                <button className="feature-button" onClick={() => setActiveSection('settings')}>Settings</button>
              </div>
              <div className="feature-card">
                <h3>Prompts</h3>
                <p>Manage your prompts</p>
                <button className="feature-button" onClick={() => setActiveSection('prompts')}>View Prompts</button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>EasyAI Dashboard</h1>
        <nav className="dashboard-nav">
          <button 
            className={activeSection === 'overview' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveSection('overview')}
          >
            Overview
          </button>
          <button 
            className={activeSection === 'prompts' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveSection('prompts')}
          >
            Prompts
          </button>
          <button 
            className={activeSection === 'apikeys' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveSection('apikeys')}
          >
            API Keys
          </button>
          <button 
            className={activeSection === 'analytics' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveSection('analytics')}
          >
            Analytics
          </button>
          <button 
            className={activeSection === 'settings' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveSection('settings')}
          >
            Settings
          </button>
        </nav>
        <div className="user-info">
          <span>Welcome, {user?.email || 'Developer'}</span>
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
      </header>
      
      <main className="dashboard-main">
        <div className="dashboard-content">
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