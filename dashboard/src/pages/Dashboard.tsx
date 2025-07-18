import React, { useState, useEffect } from 'react';
import { useApi } from '../contexts/ApiContext';

interface DashboardStats {
  total_requests: number;
  total_cost: number;
  total_tokens: number;
  api_key_count: number;
  prompts_count: number;
  successful_requests: number;
  failed_requests: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { get } = useApi();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Load analytics and API keys in parallel
      const [analyticsData, apiKeysData, promptsData] = await Promise.all([
        get('/api/v1/analytics?days=30'),
        get('/api/v1/api-keys'),
        get('/api/prompts')
      ]);

      setStats({
        total_requests: analyticsData.total_requests || 0,
        total_cost: analyticsData.total_cost || 0,
        total_tokens: analyticsData.total_tokens || 0,
        api_key_count: apiKeysData.api_keys?.length || 0,
        prompts_count: promptsData.prompts?.length || 0,
        successful_requests: analyticsData.successful_requests || 0,
        failed_requests: analyticsData.failed_requests || 0
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load dashboard data';
      setError(errorMessage);
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Monitor your AI usage, manage prompts, and track performance.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📊</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Requests
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.total_requests.toLocaleString() || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">💰</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Cost
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${stats?.total_cost.toFixed(4) || '0.0000'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🔑</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    API Keys
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.api_key_count || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📝</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Prompts
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.prompts_count || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Usage Overview (Last 30 Days)
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Successful Requests</span>
                <span className="text-sm font-medium text-green-600">
                  {stats?.successful_requests || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Failed Requests</span>
                <span className="text-sm font-medium text-red-600">
                  {stats?.failed_requests || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Tokens Used</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats?.total_tokens.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average Cost per Request</span>
                <span className="text-sm font-medium text-gray-900">
                  ${(stats?.total_requests && stats.total_requests > 0) 
                    ? (stats.total_cost / stats.total_requests).toFixed(6) 
                    : '0.000000'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 border rounded-md hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <span className="text-lg mr-3">🔑</span>
                  <div>
                    <div className="font-medium">Create API Key</div>
                    <div className="text-sm text-gray-500">Generate a new API key for your applications</div>
                  </div>
                </div>
              </button>
              <button className="w-full text-left p-3 border rounded-md hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <span className="text-lg mr-3">📝</span>
                  <div>
                    <div className="font-medium">New Prompt</div>
                    <div className="text-sm text-gray-500">Create a new prompt template</div>
                  </div>
                </div>
              </button>
              <button className="w-full text-left p-3 border rounded-md hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <span className="text-lg mr-3">📊</span>
                  <div>
                    <div className="font-medium">View Analytics</div>
                    <div className="text-sm text-gray-500">See detailed usage analytics</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;