import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  apiKey: string | null;
  login: (email: string, verificationCode?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem('apiKey'));
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedApiKey = localStorage.getItem('apiKey');
      
      if (storedToken || storedApiKey) {
        try {
          const headers: any = {};
          if (storedApiKey) {
            headers['x-api-key'] = storedApiKey;
          } else if (storedToken) {
            headers['Authorization'] = `Bearer ${storedToken}`;
          }

          const response = await axios.get(`${API_BASE_URL}/api/v1/user`, { headers });
          setUser(response.data.user);
          setToken(storedToken);
          setApiKey(storedApiKey);
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('apiKey');
          setUser(null);
          setToken(null);
          setApiKey(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [API_BASE_URL]);

  const login = async (email: string, verificationCode?: string) => {
    try {
      if (!verificationCode) {
        // First step: send verification code
        await axios.post(`${API_BASE_URL}/auth/login`, { email });
        return;
      }

      // Second step: verify code and login
      const response = await axios.post(`${API_BASE_URL}/auth/verify`, {
        email,
        verification_code: verificationCode
      });

      const { token: newToken, apiKey: newApiKey, user: userData } = response.data;
      
      setUser(userData);
      setToken(newToken);
      setApiKey(newApiKey);
      
      if (newToken) localStorage.setItem('token', newToken);
      if (newApiKey) localStorage.setItem('apiKey', newApiKey);
      
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setApiKey(null);
    localStorage.removeItem('token');
    localStorage.removeItem('apiKey');
  };

  const value = {
    user,
    token,
    apiKey,
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};