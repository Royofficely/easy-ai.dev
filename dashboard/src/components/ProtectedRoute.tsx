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
        backgroundColor: '#ffffff'
      }}>
        <div style={{ 
          background: '#ffffff', 
          padding: '40px', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #000000',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <div style={{ color: '#000000', fontSize: '16px' }}>Loading EasyAI...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    // No API key found - show message to get API key from website
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ 
          background: '#ffffff', 
          padding: '60px', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#000000', 
            margin: '0 0 16px 0',
            fontFamily: '"Inter", sans-serif'
          }}>
            Welcome to EasyAI
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: '#666666', 
            margin: '0 0 32px 0',
            lineHeight: '1.5',
            fontFamily: '"Inter", sans-serif'
          }}>
            Get your API key to start using EasyAI CLI
          </p>
          <a 
            href="https://easy-ai.dev"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#000000',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              fontFamily: '"Inter", sans-serif',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333333'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#000000'}
          >
            Get API Key →
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;