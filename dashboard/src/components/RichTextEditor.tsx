import React, { useState, useRef, useCallback } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing your prompt here...",
  className = "",
  rows = 8
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const insertText = useCallback((before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  }, [value, onChange]);

  const handleBold = () => insertText('**', '**');
  const handleItalic = () => insertText('*', '*');
  const handleCode = () => insertText('`', '`');
  const handleCodeBlock = () => insertText('\n```\n', '\n```\n');
  const handleHeading = () => insertText('\n## ', '');
  const handleBulletPoint = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const newText = value.substring(0, lineStart) + '• ' + value.substring(lineStart);
    
    onChange(newText);
    setTimeout(() => {
      textarea.setSelectionRange(start + 2, start + 2);
      textarea.focus();
    }, 0);
  };

  const handleNumberedList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const newText = value.substring(0, lineStart) + '1. ' + value.substring(lineStart);
    
    onChange(newText);
    setTimeout(() => {
      textarea.setSelectionRange(start + 3, start + 3);
      textarea.focus();
    }, 0);
  };

  const handleVariable = () => insertText('{', '}');
  const handleNewLine = () => insertText('\n\n', '');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle common shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          handleBold();
          break;
        case 'i':
          e.preventDefault();
          handleItalic();
          break;
        case 'k':
          e.preventDefault();
          handleCode();
          break;
      }
    }
    
    // Handle Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      insertText('  ', '');
    }
  };

  return (
    <div className={`rich-text-editor ${isFocused ? 'focused' : ''} ${className}`}>
      <div className="rich-text-toolbar">
        <div className="toolbar-group">
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleBold}
            title="Bold (Cmd+B)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
            </svg>
          </button>
          
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleItalic}
            title="Italic (Cmd+I)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="4" x2="10" y2="4"/>
              <line x1="14" y1="20" x2="5" y2="20"/>
              <line x1="15" y1="4" x2="9" y2="20"/>
            </svg>
          </button>
          
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleCode}
            title="Inline Code (Cmd+K)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16,18 22,12 16,6"/>
              <polyline points="8,6 2,12 8,18"/>
            </svg>
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleHeading}
            title="Heading"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 12h12"/>
              <path d="M6 20V4"/>
              <path d="M18 20V4"/>
            </svg>
          </button>
          
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleBulletPoint}
            title="Bullet Point"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
          
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleNumberedList}
            title="Numbered List"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="10" y1="6" x2="21" y2="6"/>
              <line x1="10" y1="12" x2="21" y2="12"/>
              <line x1="10" y1="18" x2="21" y2="18"/>
              <path d="M4 6h1v4"/>
              <path d="M4 10h2"/>
              <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
            </svg>
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleCodeBlock}
            title="Code Block"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </button>
          
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleVariable}
            title="Add Variable"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 20L3 16l4-4"/>
              <path d="M17 4l4 4-4 4"/>
              <path d="M5 16h2"/>
              <path d="M17 8h2"/>
            </svg>
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <span className="toolbar-hint">Cmd+B Bold • Cmd+I Italic • Tab Indent</span>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        rows={rows}
        className="rich-text-textarea"
      />
    </div>
  );
};

export default RichTextEditor;