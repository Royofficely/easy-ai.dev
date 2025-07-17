import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Copy, 
  Play,
  Folder,
  FileText,
  Settings,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface Prompt {
  id: string;
  name: string;
  description: string;
  template: string;
  parameters: Record<string, any>;
  model: string;
  lastModified: string;
}

interface PromptCategory {
  [key: string]: Prompt[];
}

const Prompts: React.FC = () => {
  const [categories, setCategories] = useState<PromptCategory>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/settings/prompts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
        // Auto-expand all categories initially
        setExpandedCategories(new Set(Object.keys(data.categories)));
      }
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const filteredCategories = Object.entries(categories).reduce((acc, [categoryName, prompts]) => {
    const filteredPrompts = prompts.filter(prompt =>
      prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filteredPrompts.length > 0) {
      acc[categoryName] = filteredPrompts;
    }
    
    return acc;
  }, {} as PromptCategory);

  const getCategoryIcon = (categoryName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'education': '📚',
      'development': '💻',
      'communication': '✉️',
      'general': '📝',
      'analysis': '📊',
      'creative': '🎨'
    };
    return iconMap[categoryName] || '📁';
  };

  const PromptCard: React.FC<{ prompt: Prompt }> = ({ prompt }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{prompt.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{prompt.description}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <span className="bg-gray-100 px-2 py-1 rounded">{prompt.model}</span>
            <span>{Object.keys(prompt.parameters).length} parameters</span>
            <span>{new Date(prompt.lastModified).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPrompt(prompt);
              setShowEditor(true);
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Copy prompt template to clipboard
              navigator.clipboard.writeText(prompt.template);
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Test prompt in playground
              window.open(`/playground?prompt=${encodeURIComponent(prompt.id)}`, '_blank');
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          >
            <Play className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    fetchPrompts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Prompt Library</h1>
          <p className="text-gray-600">Organize and manage your AI prompts</p>
        </div>
        <button
          onClick={() => setShowEditor(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Prompt
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Prompts by Category */}
      <div className="space-y-6">
        {Object.entries(filteredCategories).map(([categoryName, prompts]) => (
          <div key={categoryName} className="bg-gray-50 rounded-lg">
            <button
              onClick={() => toggleCategory(categoryName)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getCategoryIcon(categoryName)}</span>
                <span className="font-medium text-gray-900 capitalize">{categoryName}</span>
                <span className="text-sm text-gray-500">({prompts.length})</span>
              </div>
              {expandedCategories.has(categoryName) ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedCategories.has(categoryName) && (
              <div className="px-4 pb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {prompts.map((prompt) => (
                  <PromptCard key={prompt.id} prompt={prompt} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {Object.keys(filteredCategories).length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No prompts found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first prompt'}
          </p>
          <button
            onClick={() => setShowEditor(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Prompt
          </button>
        </div>
      )}

      {/* Prompt Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {selectedPrompt ? 'Edit Prompt' : 'Create New Prompt'}
              </h2>
              
              {/* Editor form would go here */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter prompt name..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Describe what this prompt does..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    rows={6}
                    placeholder="Enter your prompt template with {{variables}}..."
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Save Prompt
                </button>
                <button 
                  onClick={() => {
                    setShowEditor(false);
                    setSelectedPrompt(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prompts;