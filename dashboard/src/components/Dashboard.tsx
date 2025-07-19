import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PromptModal from './PromptModal';
import NotionStylePromptsSection from './NotionStylePromptsSection';
import PlaygroundSection from './PlaygroundSection';
import { io, Socket } from 'socket.io-client';
import './Dashboard.css';

// Settings Component
interface SettingsSectionProps {
  currentApiKey: string;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ currentApiKey }) => {
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    google: ''
  });
  const [maskedKeys, setMaskedKeys] = useState({
    openai: '',
    anthropic: '',
    google: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchApiKeys();
  }, [currentApiKey]);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/settings/api-keys`, {
        headers: { 'x-api-key': currentApiKey }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMaskedKeys(data.apiKeys || {});
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    }
  };

  const handleSaveApiKeys = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      // Only send keys that have been changed (not empty)
      const keysToUpdate: {[key: string]: string} = {};
      Object.entries(apiKeys).forEach(([provider, key]) => {
        if (key && key.trim()) {
          keysToUpdate[provider] = key.trim();
        }
      });

      if (Object.keys(keysToUpdate).length === 0) {
        setMessage('No API keys to update');
        setSaving(false);
        return;
      }

      const response = await fetch(`http://localhost:4000/api/settings/api-keys`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': currentApiKey
        },
        body: JSON.stringify({ apiKeys: keysToUpdate })
      });
      
      if (response.ok) {
        setMessage('API keys saved successfully!');
        setApiKeys({ openai: '', anthropic: '', google: '' }); // Clear form
        await fetchApiKeys(); // Refresh masked keys
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error || 'Failed to save API keys'}`);
      }
    } catch (error) {
      console.error('Failed to save API keys:', error);
      setMessage('Failed to save API keys. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="section-content">
      <div className="section-header">
        <div className="section-title">
          <h2>Settings</h2>
          <p className="section-subtitle">Manage your account and AI provider settings</p>
        </div>
      </div>
      
      <div className="settings-card">
        <h3 className="settings-title">API Key Authentication</h3>
        <div className="setting-group">
          <div className="setting-item">
            <label className="setting-label">Current API Key</label>
            <div className="api-key-display-settings">
              <code className="api-key-value">{currentApiKey}</code>
              <span className="status-badge status-active">Active</span>
            </div>
          </div>
          <div className="setting-item">
            <label className="setting-label">User ID</label>
            <input className="setting-input" type="text" value={currentApiKey.slice(-8)} disabled />
          </div>
          <div className="setting-item">
            <label className="setting-label">Permissions</label>
            <input className="setting-input" type="text" value="Read, Write" disabled />
          </div>
          <div className="setting-item">
            <label className="setting-label">Created</label>
            <input className="setting-input" type="text" value="Today" disabled />
          </div>
        </div>
      </div>

      <div className="settings-card">
        <h3 className="settings-title">Account Information</h3>
        <div className="setting-group">
          <div className="setting-item">
            <label className="setting-label">Email Address</label>
            <input className="setting-input" type="email" value={`Connected via API Key ${currentApiKey.slice(-8)}`} disabled />
          </div>
          <div className="setting-item">
            <label className="setting-label">Account Type</label>
            <input className="setting-input" type="text" value="Developer" disabled />
          </div>
        </div>
      </div>

      <div className="settings-card">
        <h3 className="settings-title">AI Provider API Keys</h3>
        <div className="setting-group">
          <div className="setting-item">
            <div className="setting-label-row">
              <label className="setting-label">OpenAI API Key</label>
              <span className={`api-key-status ${maskedKeys.openai ? 'active' : 'inactive'}`}>
                <div className={`status-dot ${maskedKeys.openai ? 'active' : 'inactive'}`}></div>
                {maskedKeys.openai ? 'Active' : 'Not Set'}
              </span>
            </div>
            <input 
              className="setting-input" 
              type="password" 
              placeholder={maskedKeys.openai || "sk-..."}
              value={apiKeys.openai}
              onChange={(e) => setApiKeys({...apiKeys, openai: e.target.value})}
            />
            <small className="setting-hint">Used for GPT-4, GPT-3.5, and other OpenAI models</small>
            {maskedKeys.openai && <small className="setting-current">Current: {maskedKeys.openai}</small>}
          </div>
          <div className="setting-item">
            <div className="setting-label-row">
              <label className="setting-label">Anthropic API Key</label>
              <span className={`api-key-status ${maskedKeys.anthropic ? 'active' : 'inactive'}`}>
                <div className={`status-dot ${maskedKeys.anthropic ? 'active' : 'inactive'}`}></div>
                {maskedKeys.anthropic ? 'Active' : 'Not Set'}
              </span>
            </div>
            <input 
              className="setting-input" 
              type="password" 
              placeholder={maskedKeys.anthropic || "sk-ant-..."}
              value={apiKeys.anthropic}
              onChange={(e) => setApiKeys({...apiKeys, anthropic: e.target.value})}
            />
            <small className="setting-hint">Used for Claude models (Claude-3 Sonnet, Claude-3 Haiku, etc.)</small>
            {maskedKeys.anthropic && <small className="setting-current">Current: {maskedKeys.anthropic}</small>}
          </div>
          <div className="setting-item">
            <div className="setting-label-row">
              <label className="setting-label">Google AI API Key</label>
              <span className={`api-key-status ${maskedKeys.google ? 'active' : 'inactive'}`}>
                <div className={`status-dot ${maskedKeys.google ? 'active' : 'inactive'}`}></div>
                {maskedKeys.google ? 'Active' : 'Not Set'}
              </span>
            </div>
            <input 
              className="setting-input" 
              type="password" 
              placeholder={maskedKeys.google || "AI..."}
              value={apiKeys.google}
              onChange={(e) => setApiKeys({...apiKeys, google: e.target.value})}
            />
            <small className="setting-hint">Used for Gemini models (Gemini Pro, etc.)</small>
            {maskedKeys.google && <small className="setting-current">Current: {maskedKeys.google}</small>}
          </div>
        </div>
        
        {message && (
          <div className={`settings-message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
        
        <div className="setting-actions">
          <button 
            className="btn-primary" 
            onClick={handleSaveApiKeys}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save API Keys'}
          </button>
        </div>
      </div>

      <div className="settings-card">
        <h3 className="settings-title">Default Model Settings</h3>
        <div className="setting-group">
          <div className="setting-item">
            <label className="setting-label">Default Model</label>
            <select className="setting-input">
              <option value="gpt-4">GPT-4 (OpenAI)</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (OpenAI)</option>
              <option value="claude-3-sonnet">Claude-3 Sonnet (Anthropic)</option>
              <option value="claude-3-haiku">Claude-3 Haiku (Anthropic)</option>
              <option value="gemini-pro">Gemini Pro (Google)</option>
            </select>
          </div>
          <div className="setting-item">
            <label className="setting-label">Temperature</label>
            <input 
              className="setting-input" 
              type="number" 
              min="0" 
              max="2" 
              step="0.1" 
              defaultValue="0.7"
            />
            <small className="setting-hint">Controls randomness (0.0 = deterministic, 2.0 = very random)</small>
          </div>
          <div className="setting-item">
            <label className="setting-label">Max Tokens</label>
            <input 
              className="setting-input" 
              type="number" 
              min="1" 
              max="4096" 
              step="1" 
              defaultValue="1000"
            />
            <small className="setting-hint">Maximum number of tokens in the response</small>
          </div>
        </div>
      </div>
    </div>
  );
};

// Analytics Component
interface AnalyticsSectionProps {
  currentApiKey: string;
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ currentApiKey }) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [realTimeData, setRealTimeData] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, currentApiKey]);

  useEffect(() => {
    // Listen for real-time API calls
    const socket = io('http://localhost:4000');
    
    socket.on('api_call', (data) => {
      if (data.user_id) {
        setRealTimeData(prev => [
          { ...data, id: Date.now() },
          ...prev.slice(0, 49) // Keep last 50 calls
        ]);
      }
    });

    return () => {
      socket.close();
    };
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/api/proxy/stats?period=${timeRange}`, {
        headers: { 'x-api-key': currentApiKey }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalCost = () => {
    if (!analytics?.stats) return 0;
    return analytics.stats.reduce((sum: number, stat: any) => sum + stat.cost, 0);
  };

  const getTotalRequests = () => {
    if (!analytics?.stats) return 0;
    return analytics.stats.reduce((sum: number, stat: any) => sum + stat.requests, 0);
  };

  const getTotalTokens = () => {
    if (!analytics?.stats) return 0;
    return analytics.stats.reduce((sum: number, stat: any) => sum + stat.tokens, 0);
  };

  const getMostUsedProvider = () => {
    if (!analytics?.stats || analytics.stats.length === 0) return 'None';
    return analytics.stats.reduce((max: any, stat: any) => 
      stat.requests > max.requests ? stat : max
    ).provider;
  };

  if (loading) {
    return (
      <div className="section-content">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-content">
      <div className="section-header">
        <div className="section-title">
          <h2>Analytics</h2>
          <p className="section-subtitle">Track your AI usage, costs, and performance</p>
        </div>
        <div className="section-actions">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-selector"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="analytics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
            </svg>
          </div>
          <div className="metric-content">
            <h3 className="metric-title">Total API Calls</h3>
            <p className="metric-value">{getTotalRequests().toLocaleString()}</p>
            <p className="metric-change">
              {analytics?.period && `Last ${analytics.period.replace('h', ' hour').replace('d', ' days')}`}
            </p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M2 12h20"/>
            </svg>
          </div>
          <div className="metric-content">
            <h3 className="metric-title">Total Cost</h3>
            <p className="metric-value">${getTotalCost().toFixed(4)}</p>
            <p className="metric-change">
              Avg: ${getTotalRequests() > 0 ? (getTotalCost() / getTotalRequests()).toFixed(6) : '0'} per call
            </p>
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
            <h3 className="metric-title">Tokens Used</h3>
            <p className="metric-value">{getTotalTokens().toLocaleString()}</p>
            <p className="metric-change">
              Avg: {getTotalRequests() > 0 ? Math.round(getTotalTokens() / getTotalRequests()) : 0} per call
            </p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="m22 21-3-3m0 0a4 4 0 1 1-6-6 4 4 0 0 1 6 6z"/>
            </svg>
          </div>
          <div className="metric-content">
            <h3 className="metric-title">Top Provider</h3>
            <p className="metric-value">{getMostUsedProvider()}</p>
            <p className="metric-change">Most frequently used</p>
          </div>
        </div>
      </div>

      {/* Provider Breakdown */}
      {analytics?.stats && analytics.stats.length > 0 && (
        <div className="provider-breakdown">
          <h3 className="section-title">Provider Breakdown</h3>
          <div className="provider-grid">
            {analytics.stats.map((stat: any) => (
              <div key={stat.provider} className="provider-card">
                <div className="provider-header">
                  <h4 className="provider-name">{stat.provider.toUpperCase()}</h4>
                  <span className="provider-badge">{stat.requests} calls</span>
                </div>
                <div className="provider-metrics">
                  <div className="provider-metric">
                    <span className="metric-label">Cost</span>
                    <span className="metric-value">${stat.cost.toFixed(4)}</span>
                  </div>
                  <div className="provider-metric">
                    <span className="metric-label">Tokens</span>
                    <span className="metric-value">{stat.tokens.toLocaleString()}</span>
                  </div>
                  <div className="provider-metric">
                    <span className="metric-label">Avg Cost/Call</span>
                    <span className="metric-value">${(stat.cost / stat.requests).toFixed(6)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Activity */}
      {realTimeData.length > 0 && (
        <div className="realtime-activity">
          <h3 className="section-title">Real-time Activity</h3>
          <div className="activity-feed">
            {realTimeData.slice(0, 10).map((call: any) => (
              <div key={call.id} className="activity-item">
                <div className="activity-icon">
                  <div className="provider-dot" data-provider={call.provider}></div>
                </div>
                <div className="activity-content">
                  <div className="activity-main">
                    <span className="activity-provider">{call.provider.toUpperCase()}</span>
                    <span className="activity-cost">${call.cost?.toFixed(4) || '0.0000'}</span>
                  </div>
                  <div className="activity-meta">
                    <span className="activity-tokens">{call.tokens || 0} tokens</span>
                    <span className="activity-time">
                      {new Date(call.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!analytics?.stats || analytics.stats.length === 0) && (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3v18h18"/>
              <path d="m19 9-5 5-4-4-3 3"/>
            </svg>
          </div>
          <h3>No Analytics Data Yet</h3>
          <p>Start making API calls through EasyAI to see your usage analytics</p>
          <button 
            className="btn-primary" 
            onClick={() => window.open('http://localhost:4000/api/proxy/openai/v1/', '_blank')}
          >
            View API Endpoints
          </button>
        </div>
      )}
    </div>
  );
};

type DashboardSection = 'overview' | 'prompts' | 'playground' | 'settings';

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
    
    // Enhanced WebSocket connection with reconnection logic
    const connectWebSocket = () => {
      const newSocket = io('http://localhost:4000', {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        timeout: 20000,
        forceNew: true
      });
      
      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('🔌 Connected to EasyAI server');
        setConnectedClients(1);
        
        // Join user-specific room for targeted updates
        newSocket.emit('join_user_room', { apiKey: apiKeyValue });
      });
      
      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from server:', reason);
        setConnectedClients(0);
      });
      
      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Reconnected after', attemptNumber, 'attempts');
      });
      
      newSocket.on('reconnect_error', (error) => {
        console.error('🔄 Reconnection failed:', error);
      });
      
      // Listen for real-time prompt events
      newSocket.on('prompt_created', (data) => {
        console.log('🎉 New prompt created:', data.prompt);
        setPrompts(prev => [data.prompt, ...prev]);
        
        // Show notification
        if (Notification.permission === 'granted') {
          new Notification('New Prompt Created', {
            body: `"${data.prompt.name}" was created successfully`,
            icon: '/favicon.ico'
          });
        }
      });
      
      newSocket.on('prompt_updated', (data) => {
        console.log('✏️ Prompt updated:', data.prompt);
        setPrompts(prev => prev.map(p => p.id === data.prompt.id ? data.prompt : p));
      });
      
      newSocket.on('prompt_deleted', (data) => {
        console.log('🗑️ Prompt deleted:', data.prompt_id);
        setPrompts(prev => prev.filter(p => p.prompt_id !== data.prompt_id));
      });
      
      // Listen for API call events from proxy
      newSocket.on('api_call', (data) => {
        console.log('📡 API call tracked:', data);
        // You could update analytics in real-time here
      });
      
      // Listen for connection count updates
      newSocket.on('client_count', (count) => {
        setConnectedClients(count);
      });
      
      // Listen for server messages
      newSocket.on('server_message', (data) => {
        console.log('📢 Server message:', data.message);
      });
      
      return newSocket;
    };
    
    const newSocket = connectWebSocket();
    setSocket(newSocket);
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    return () => {
      newSocket.close();
    };
  }, [apiKey]);
  
  // Fetch prompts when component mounts or when prompts/playground sections are active
  useEffect(() => {
    if (activeSection === 'prompts' || activeSection === 'playground') {
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
        return <NotionStylePromptsSection 
          prompts={prompts} 
          loading={loading} 
          onCreatePrompt={handleCreatePrompt}
          onEditPrompt={(prompt) => {
            setEditingPrompt(prompt);
            setShowPromptModal(true);
          }}
          onDeletePrompt={handleDeletePrompt}
        />;
      case 'playground':
        return <PlaygroundSection prompts={prompts} />;
      case 'settings':
        return <SettingsSection currentApiKey={currentApiKey} />;
      default:
        return <AnalyticsSection currentApiKey={currentApiKey} />;
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
            className={activeSection === 'playground' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveSection('playground')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
            Playground
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
              <p className="user-email">{user?.email && !user.email.includes('@easyai.local') ? user.email : `API Key: ${currentApiKey.slice(-8)}`}</p>
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