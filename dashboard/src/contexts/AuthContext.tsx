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
        console.log('Sending verification code to:', email);
        
        // Try login first (for existing users)
        try {
          await axios.post(`${API_BASE_URL}/auth/login`, { email });
          return;
        } catch (error: any) {
          console.log('Login failed, trying registration:', error.response?.data);
          
          // If login fails, try registration (for new users)
          if (error.response?.status === 401 || error.response?.status === 404) {
            await axios.post(`${API_BASE_URL}/auth/register`, { email });
            return;
          }
          
          throw error;
        }
      }

      // Second step: verify code and login
      console.log('Verifying code:', verificationCode, 'for email:', email);
      
      // Try verification first
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/verify`, {
          email,
          verification_code: verificationCode
        });

        console.log('Verification response:', response.data);

        const { token: newToken, apiKey: newApiKey, user: userData } = response.data;
        
        setUser(userData);
        setToken(newToken);
        setApiKey(newApiKey);
        
        if (newToken) localStorage.setItem('token', newToken);
        if (newApiKey) localStorage.setItem('apiKey', newApiKey);
        
      } catch (error: any) {
        console.log('Verification failed, trying login with code:', error.response?.data);
        
        // If verification fails, try login with code (for existing verified users)
        if (error.response?.status === 400) {
          const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email,
            code: verificationCode
          });

          console.log('Login with code response:', response.data);

          const { token: newToken, user: userData } = response.data;
          
          setUser(userData);
          setToken(newToken);
          
          if (newToken) localStorage.setItem('token', newToken);
        } else {
          throw error;
        }
      }
      
    } catch (error: any) {
      console.error('Login failed:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
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