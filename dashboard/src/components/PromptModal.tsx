import React, { useState } from 'react';
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="prompt-form">
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter prompt name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category:</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="development">Development</option>
              <option value="testing">Testing</option>
              <option value="debugging">Debugging</option>
              <option value="documentation">Documentation</option>
              <option value="code-review">Code Review</option>
              <option value="general">General</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of the prompt"
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Content:</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={6}
              placeholder="Enter your prompt content. Use {variable_name} for variables."
            />
          </div>

          <div className="form-group">
            <label htmlFor="variables">Variables (comma-separated):</label>
            <input
              type="text"
              id="variables"
              name="variables"
              value={formData.variables}
              onChange={handleChange}
              placeholder="e.g., language, code, filename"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="secondary-button">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="primary-button">
              {saving ? 'Saving...' : (editingPrompt ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromptModal;