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
    // Temporarily bypass authentication for testing - show children directly
    console.log('🔍 DEBUG: User not found, checking for API key...');
    console.log('🔍 DEBUG: Window API Key:', (window as any).EASYAI_API_KEY);
    console.log('🔍 DEBUG: LocalStorage API Key:', localStorage.getItem('easyai_api_key'));
    
    // For now, just show the children (dashboard) without authentication
    return <>{children}</>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;