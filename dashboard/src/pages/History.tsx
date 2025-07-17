import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { RefreshCw, Search, Filter, Calendar, ExternalLink } from 'lucide-react';

interface HistoryItem {
  id: string;
  prompt_id: string;
  prompt_name: string;
  model: string;
  input: string;
  output: string;
  tokens_used: number;
  cost: number;
  timestamp: string;
  status: 'success' | 'error' | 'pending';
}

const History: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Mock data for now
      const mockHistory: HistoryItem[] = [
        {
          id: '1',
          prompt_id: 'code-review',
          prompt_name: 'Code Review',
          model: 'gpt-4o-mini',
          input: 'Review this React component...',
          output: 'The component looks good overall...',
          tokens_used: 150,
          cost: 0.002,
          timestamp: new Date().toISOString(),
          status: 'success'
        },
        {
          id: '2',
          prompt_id: 'email-writer',
          prompt_name: 'Email Writer',
          model: 'claude-3-haiku',
          input: 'Write a professional email...',
          output: 'Subject: Project Update...',
          tokens_used: 89,
          cost: 0.001,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'success'
        }
      ];
      setHistory(mockHistory);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter;
    const matchesSearch = item.prompt_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.input.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Request History</h1>
        <Button onClick={fetchHistory} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search prompts or content..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No requests found</p>
                <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredHistory.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{item.prompt_name}</CardTitle>
                    <Badge variant={item.status === 'success' ? 'default' : 'destructive'}>
                      {item.status}
                    </Badge>
                    <Badge variant="outline">{item.model}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Input</h4>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg line-clamp-3">
                      {item.input}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Output</h4>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg line-clamp-3">
                      {item.output}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Tokens: {item.tokens_used}</span>
                    <span>Cost: ${item.cost.toFixed(6)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default History;