import React, { createContext, useContext } from 'react';
import axios from 'axios';

interface ApiContextType {
  apiCall: (endpoint: string, options?: any) => Promise<any>;
  get: (endpoint: string, params?: any) => Promise<any>;
  post: (endpoint: string, data?: any) => Promise<any>;
  put: (endpoint: string, data?: any) => Promise<any>;
  delete: (endpoint: string) => Promise<any>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const useApi = () => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';

export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      return { 'X-API-Key': token };
    }
    return {};
  };

  const apiCall = async (endpoint: string, options: any = {}) => {
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await axios(`${API_BASE}${endpoint}`, config);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'API call failed');
    }
  };

  const get = async (endpoint: string, params?: any) => {
    return apiCall(endpoint, { method: 'GET', params });
  };

  const post = async (endpoint: string, data?: any) => {
    return apiCall(endpoint, { method: 'POST', data });
  };

  const put = async (endpoint: string, data?: any) => {
    return apiCall(endpoint, { method: 'PUT', data });
  };

  const deleteRequest = async (endpoint: string) => {
    return apiCall(endpoint, { method: 'DELETE' });
  };

  const value = {
    apiCall,
    get,
    post,
    put,
    delete: deleteRequest
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};