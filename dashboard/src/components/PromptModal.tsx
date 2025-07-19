import React, { useState, useEffect } from 'react';
import './PromptModal.css';
import RichTextEditor from './RichTextEditor';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prompt: any) => void;
  editingPrompt?: any;
}

const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose, onSave, editingPrompt }) => {
  const [formData, setFormData] = useState({
    name: editingPrompt?.name || '',
    category: editingPrompt?.category || 'General',
    description: editingPrompt?.description || '',
    content: editingPrompt?.content || '',
    model: editingPrompt?.model || 'gpt-4',
    variables: editingPrompt?.variables ? editingPrompt.variables.join(', ') : ''
  });

  const [saving, setSaving] = useState(false);

  // Update form data when editingPrompt changes
  useEffect(() => {
    if (editingPrompt) {
      setFormData({
        name: editingPrompt.name || '',
        category: editingPrompt.category || 'General',
        description: editingPrompt.description || '',
        content: editingPrompt.content || '',
        model: editingPrompt.model || 'gpt-4',
        variables: editingPrompt.variables ? editingPrompt.variables.join(', ') : ''
      });
    } else {
      setFormData({
        name: '',
        category: 'General',
        description: '',
        content: '',
        model: 'gpt-4',
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
        category: 'General',
        description: '',
        content: '',
        model: 'gpt-4',
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

  const handleContentChange = (content: string) => {
    setFormData({
      ...formData,
      content: content
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
              className="notion-prompt-title-input"
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
          <div className="notion-prompt-form-fields">
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description (optional)"
              className="notion-prompt-description-input"
            />
            
            <div className="notion-prompt-form-row">
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="notion-prompt-select"
                required
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
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="notion-prompt-select"
                required
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
            <RichTextEditor
              value={formData.content}
              onChange={handleContentChange}
              placeholder="Start writing your prompt here..."
              rows={12}
            />
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

          <div className="notion-prompt-actions">
            <button type="button" onClick={onClose} className="btn-secondary btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving || !formData.name.trim()} className="btn-primary btn-sm">
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