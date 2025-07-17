import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { RefreshCw, TrendingUp, DollarSign, Zap, Activity } from 'lucide-react';

interface AnalyticsData {
  totalRequests: number;
  totalCost: number;
  averageTokens: number;
  mostUsedModel: string;
  dailyUsage: Array<{
    date: string;
    requests: number;
    cost: number;
  }>;
  modelUsage: Array<{
    model: string;
    requests: number;
    cost: number;
  }>;
  promptUsage: Array<{
    prompt: string;
    requests: number;
    cost: number;
  }>;
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Mock data for now
      const mockData: AnalyticsData = {
        totalRequests: 1247,
        totalCost: 15.43,
        averageTokens: 245,
        mostUsedModel: 'gpt-4o-mini',
        dailyUsage: [
          { date: '2024-01-15', requests: 45, cost: 0.67 },
          { date: '2024-01-16', requests: 78, cost: 1.23 },
          { date: '2024-01-17', requests: 92, cost: 1.45 },
          { date: '2024-01-18', requests: 156, cost: 2.34 },
          { date: '2024-01-19', requests: 134, cost: 2.01 },
          { date: '2024-01-20', requests: 189, cost: 2.89 },
          { date: '2024-01-21', requests: 145, cost: 2.18 }
        ],
        modelUsage: [
          { model: 'gpt-4o-mini', requests: 567, cost: 8.45 },
          { model: 'claude-3-haiku', requests: 234, cost: 3.21 },
          { model: 'gemini-pro', requests: 189, cost: 2.34 },
          { model: 'deepseek-coder', requests: 145, cost: 1.23 }
        ],
        promptUsage: [
          { prompt: 'Code Review', requests: 234, cost: 3.45 },
          { prompt: 'Email Writer', requests: 189, cost: 2.78 },
          { prompt: 'Math Teacher', requests: 145, cost: 2.12 }
        ]
      };
      setData(mockData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (!data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="flex items-center gap-4">
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +5% from last period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Tokens</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageTokens}</div>
            <p className="text-xs text-muted-foreground">
              -2% from last period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used Model</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.mostUsedModel}</div>
            <p className="text-xs text-muted-foreground">
              45% of total requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Daily Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.dailyUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="requests" stroke="#3b82f6" name="Requests" />
                <Line type="monotone" dataKey="cost" stroke="#10b981" name="Cost ($)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model Usage Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.modelUsage}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ model, requests }) => `${model}: ${requests}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="requests"
                >
                  {data.modelUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Usage Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.modelUsage.map((item, index) => (
                <div key={item.model} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="font-medium">{item.model}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{item.requests} requests</div>
                    <div className="text-sm text-gray-500">${item.cost.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.promptUsage.map((item, index) => (
                <div key={item.prompt} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="font-medium">{item.prompt}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{item.requests} requests</div>
                    <div className="text-sm text-gray-500">${item.cost.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;