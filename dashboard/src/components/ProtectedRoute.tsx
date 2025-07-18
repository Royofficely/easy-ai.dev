import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    // Instead of showing login, show a message about CLI setup
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '40px', 
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h2 style={{ color: '#333', marginBottom: '20px' }}>EasyAI Dashboard</h2>
          <p style={{ color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>
            Welcome to EasyAI! To access the dashboard, please authenticate using the CLI:
          </p>
          <div style={{ 
            background: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#333',
            marginBottom: '20px'
          }}>
            <div style={{ marginBottom: '10px' }}>$ easyai setup --api-key YOUR_API_KEY</div>
            <div>$ easyai ui</div>
          </div>
          <p style={{ color: '#888', fontSize: '14px' }}>
            Get your API key from <a href="https://easy-ai.dev" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>easy-ai.dev</a>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;