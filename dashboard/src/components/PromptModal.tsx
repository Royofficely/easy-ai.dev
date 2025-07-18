import React, { useState, useEffect } from 'react';
import './PromptModal.css';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prompt: any) => void;
  editingPrompt?: any;
}

const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose, onSave, editingPrompt }) => {
  const [formData, setFormData] = useState({
    name: editingPrompt?.name || '',
    category: editingPrompt?.category || 'development',
    description: editingPrompt?.description || '',
    content: editingPrompt?.content || '',
    variables: editingPrompt?.variables ? editingPrompt.variables.join(', ') : ''
  });

  const [saving, setSaving] = useState(false);
  const [contentFocused, setContentFocused] = useState(false);

  // Update form data when editingPrompt changes
  useEffect(() => {
    if (editingPrompt) {
      setFormData({
        name: editingPrompt.name || '',
        category: editingPrompt.category || 'development',
        description: editingPrompt.description || '',
        content: editingPrompt.content || '',
        variables: editingPrompt.variables ? editingPrompt.variables.join(', ') : ''
      });
    } else {
      setFormData({
        name: '',
        category: 'development',
        description: '',
        content: '',
        variables: ''
      });
    }
  }, [editingPrompt, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const promptData = {
        ...formData,
        variables: formData.variables.split(',').map((v: string) => v.trim()).filter((v: string) => v)
      };

      await onSave(promptData);
      onClose();
      setFormData({
        name: '',
        category: 'development',
        description: '',
        content: '',
        variables: ''
      });
    } catch (error) {
      console.error('Error saving prompt:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleContentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newValue = formData.content.substring(0, start) + '  ' + formData.content.substring(end);
      setFormData({ ...formData, content: newValue });
      
      // Set cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content notion-style-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-area">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Untitled"
              className="modal-title-input"
              required
            />
          </div>
          <button className="close-button" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="prompt-form">
          <div className="form-meta">
            <div className="form-group-inline">
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="category-select"
                required
              >
                <option value="development">🔧 Development</option>
                <option value="testing">🧪 Testing</option>
                <option value="debugging">🐛 Debugging</option>
                <option value="documentation">📚 Documentation</option>
                <option value="code-review">👁️ Code Review</option>
                <option value="general">📝 General</option>
              </select>
            </div>
            
            <div className="form-group-inline">
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add a description..."
                className="description-input"
              />
            </div>
          </div>

          <div className="content-section">
            <div className="content-toolbar">
              <span className="content-label">Prompt Content</span>
              <div className="toolbar-actions">
                <span className="variable-hint">Use {`{variable_name}`} for variables</span>
              </div>
            </div>
            <div className={`content-editor ${contentFocused ? 'focused' : ''}`}>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                onKeyDown={handleContentKeyDown}
                onFocus={() => setContentFocused(true)}
                onBlur={() => setContentFocused(false)}
                required
                rows={12}
                className="content-textarea"
                placeholder="Start writing your prompt here...

You can use variables like {language}, {code}, or {question} to make your prompts dynamic.

Example:
Please review this {language} code and provide feedback:

{code}

Focus on:
- Code quality
- Best practices
- Potential bugs"
              />
            </div>
          </div>

          {formData.variables && (
            <div className="variables-section">
              <label className="variables-label">Variables:</label>
              <input
                type="text"
                name="variables"
                value={formData.variables}
                onChange={handleChange}
                placeholder="language, code, filename..."
                className="variables-input"
              />
              <small className="variables-hint">Comma-separated list of variables used in your prompt</small>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="secondary-button">
              Cancel
            </button>
            <button type="submit" disabled={saving || !formData.name.trim()} className="primary-button">
              {saving ? (
                <>
                  <svg className="loading-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Saving...
                </>
              ) : (
                editingPrompt ? 'Update Prompt' : 'Create Prompt'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromptModal;