import React, { useState } from 'react';

interface Prompt {
  prompt_id: string;
  name: string;
  description?: string;
  content: string;
  category?: string;
  variables?: string[];
  created_at: string;
  updated_at: string;
}

interface NotionStylePromptsSectionProps {
  prompts: Prompt[];
  loading: boolean;
  onCreatePrompt: (promptData: any) => void;
  onEditPrompt: (prompt: Prompt) => void;
  onDeletePrompt: (promptId: string) => void;
}

const NotionStylePromptsSection: React.FC<NotionStylePromptsSectionProps> = ({
  prompts,
  loading,
  onCreatePrompt,
  onEditPrompt,
  onDeletePrompt
}) => {
  const [newPromptMode, setNewPromptMode] = useState(false);
  const [newPromptTitle, setNewPromptTitle] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [newPromptDescription, setNewPromptDescription] = useState('');
  const [newPromptCategory, setNewPromptCategory] = useState('General');
  const [newPromptModel, setNewPromptModel] = useState('gpt-4');

  const handleCreateNewPrompt = () => {
    if (!newPromptTitle.trim()) return;
    
    const promptData = {
      name: newPromptTitle,
      content: newPromptContent || 'Start writing your prompt here...',
      category: newPromptCategory,
      description: newPromptDescription,
      model: newPromptModel,
      variables: []
    };
    
    onCreatePrompt(promptData);
    setNewPromptMode(false);
    setNewPromptTitle('');
    setNewPromptContent('');
    setNewPromptDescription('');
    setNewPromptCategory('General');
    setNewPromptModel('gpt-4');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreateNewPrompt();
    } else if (e.key === 'Escape') {
      setNewPromptMode(false);
      setNewPromptTitle('');
      setNewPromptContent('');
      setNewPromptDescription('');
      setNewPromptCategory('General');
      setNewPromptModel('gpt-4');
    }
  };

  if (loading) {
    return (
      <div className="section-content">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading prompts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-content">
      <div className="section-header">
        <div className="section-title">
          <h2>Prompts</h2>
          <p className="section-subtitle">Manage your AI prompt templates</p>
        </div>
        <div className="section-actions">
          <button 
            className="btn-primary" 
            onClick={() => setNewPromptMode(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Prompt
          </button>
        </div>
      </div>

      <div className="notion-prompts-container">
        {/* New prompt creation area */}
        {newPromptMode && (
          <div className="notion-prompt-card new-prompt-card">
            <div className="notion-prompt-header">
              <input
                type="text"
                value={newPromptTitle}
                onChange={(e) => setNewPromptTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Untitled"
                className="notion-prompt-title-input"
                autoFocus
              />
            </div>
            <div className="notion-prompt-form-fields">
              <input
                type="text"
                value={newPromptDescription}
                onChange={(e) => setNewPromptDescription(e.target.value)}
                placeholder="Brief description (optional)"
                className="notion-prompt-description-input"
              />
              
              <div className="notion-prompt-form-row">
                <select
                  value={newPromptCategory}
                  onChange={(e) => setNewPromptCategory(e.target.value)}
                  className="notion-prompt-select"
                >
                  <option value="General">General</option>
                  <option value="Development">Development</option>
                  <option value="Creative">Creative</option>
                  <option value="Business">Business</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Research">Research</option>
                  <option value="Education">Education</option>
                </select>
                
                <select
                  value={newPromptModel}
                  onChange={(e) => setNewPromptModel(e.target.value)}
                  className="notion-prompt-select"
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                  <option value="claude-3-haiku">Claude 3 Haiku</option>
                  <option value="gemini-pro">Gemini Pro</option>
                </select>
              </div>
            </div>
            
            <div className="notion-prompt-content">
              <textarea
                value={newPromptContent}
                onChange={(e) => setNewPromptContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Start writing your prompt here..."
                className="notion-prompt-content-textarea"
                rows={4}
              />
            </div>
            <div className="notion-prompt-actions">
              <button 
                className="btn-secondary btn-sm"
                onClick={() => {
                  setNewPromptMode(false);
                  setNewPromptTitle('');
                  setNewPromptContent('');
                  setNewPromptDescription('');
                  setNewPromptCategory('General');
                  setNewPromptModel('gpt-4');
                }}
              >
                Cancel
              </button>
              <button 
                className="btn-primary btn-sm"
                onClick={handleCreateNewPrompt}
                disabled={!newPromptTitle.trim()}
              >
                Create
              </button>
            </div>
          </div>
        )}

        {/* Existing prompts */}
        {prompts.length > 0 ? (
          <div className="notion-prompts-grid">
            {prompts.map((prompt) => (
              <div key={prompt.prompt_id} className="notion-prompt-card">
                <div className="notion-prompt-header">
                  <h3 className="notion-prompt-title">{prompt.name}</h3>
                  <div className="notion-prompt-menu">
                    <button 
                      className="btn-icon"
                      onClick={() => onEditPrompt(prompt)}
                      title="Edit prompt"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="m18.5 2.5 3 3L12 15l-4 1 1-4z"/>
                      </svg>
                    </button>
                    <button 
                      className="btn-icon btn-danger"
                      onClick={() => onDeletePrompt(prompt.prompt_id)}
                      title="Delete prompt"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                    </button>
                  </div>
                </div>
                
                {prompt.description && (
                  <p className="notion-prompt-description">{prompt.description}</p>
                )}
                
                <div className="notion-prompt-content">
                  <div className="notion-prompt-preview">
                    {prompt.content.substring(0, 200)}
                    {prompt.content.length > 200 && '...'}
                  </div>
                </div>
                
                <div className="notion-prompt-footer">
                  {prompt.category && (
                    <span className="notion-prompt-category">{prompt.category}</span>
                  )}
                  {prompt.variables && prompt.variables.length > 0 && (
                    <div className="notion-prompt-variables">
                      {prompt.variables.map((variable, index) => (
                        <span key={index} className="variable-tag">
                          {variable}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="notion-prompt-date">
                    {new Date(prompt.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
            <h3>No prompts yet</h3>
            <p>Create your first prompt template to get started</p>
            <button 
              className="btn-primary" 
              onClick={() => setNewPromptMode(true)}
            >
              Create Prompt
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotionStylePromptsSection;