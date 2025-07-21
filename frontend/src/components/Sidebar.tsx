import React from 'react'

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: 'analytics' | 'prompts' | 'playground' | 'logs' | 'settings') => void
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const menuItems = [
    { id: 'analytics', label: 'Analytics', icon: 'BarChart' },
    { id: 'prompts', label: 'Prompts', icon: 'MessageSquare' },
    { id: 'playground', label: 'Playground', icon: 'Play' },
    { id: 'logs', label: 'Logs', icon: 'FileText' },
    { id: 'settings', label: 'Settings', icon: 'Settings' }
  ]

  const IconComponent = ({ name }: { name: string }) => {
    const iconStyles = {
      width: '16px',
      height: '16px',
      stroke: 'currentColor',
      strokeWidth: '1.5',
      fill: 'none',
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const
    }

    switch (name) {
      case 'BarChart':
        return (
          <svg style={iconStyles} viewBox="0 0 24 24">
            <line x1="12" y1="20" x2="12" y2="10"></line>
            <line x1="18" y1="20" x2="18" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="16"></line>
          </svg>
        )
      case 'MessageSquare':
        return (
          <svg style={iconStyles} viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )
      case 'Play':
        return (
          <svg style={iconStyles} viewBox="0 0 24 24">
            <polygon points="5,3 19,12 5,21"></polygon>
          </svg>
        )
      case 'FileText':
        return (
          <svg style={iconStyles} viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2Z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10,9 9,9 8,9"></polyline>
          </svg>
        )
      case 'Settings':
        return (
          <svg style={iconStyles} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        )
      case 'Bot':
        return (
          <svg style={iconStyles} viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="10" rx="2"></rect>
            <circle cx="12" cy="5" r="2"></circle>
            <path d="M12 7v4"></path>
            <line x1="8" y1="16" x2="8" y2="16"></line>
            <line x1="16" y1="16" x2="16" y2="16"></line>
          </svg>
        )
      case 'Search':
        return (
          <svg style={iconStyles} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div style={{
      width: '280px',
      background: '#ffffff',
      borderRight: '1px solid #f3f4f6',
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000,
      boxShadow: '4px 0 20px rgba(0,0,0,0.05)'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '2rem 1.5rem',
        borderBottom: '1px solid #f3f4f6',
        marginBottom: '1rem',
        animation: 'slideDown 0.6s ease-out'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          padding: '0.75rem',
          borderRadius: '12px',
          transition: 'all 0.2s ease'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
            color: '#111827'
          }}>
            <IconComponent name="Bot" />
          </div>
          <div>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              letterSpacing: '-0.02em',
              color: '#111827',
              marginBottom: '2px'
            }}>
              EasyAI
            </div>
            <div style={{
              fontSize: '11px',
              color: '#6b7280',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Dashboard
            </div>
          </div>
        </div>
      </div>
      
      {/* Search Button */}
      <div style={{ padding: '0 1.5rem', marginBottom: '1rem' }}>
        <button
          onClick={() => {
            console.log('Search button clicked in sidebar')
            // Dispatch global search event
            const searchEvent = new CustomEvent('globalSearch', { 
              detail: { source: 'sidebar' } 
            })
            console.log('Dispatching search event:', searchEvent)
            window.dispatchEvent(searchEvent)
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            color: '#6b7280',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textAlign: 'left',
            animation: 'slideIn 0.6s ease-out 0.1s both'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6'
            e.currentTarget.style.borderColor = '#d1d5db'
            e.currentTarget.style.transform = 'translateX(2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb'
            e.currentTarget.style.borderColor = '#e5e7eb'
            e.currentTarget.style.transform = 'translateX(0)'
          }}
        >
          <div style={{ marginRight: '12px', display: 'flex', alignItems: 'center' }}>
            <IconComponent name="Search" />
          </div>
          <span>Universal Search</span>
          <div style={{ 
            marginLeft: 'auto', 
            fontSize: '0.75rem', 
            color: '#9ca3af',
            fontFamily: 'ui-monospace, monospace'
          }}>
            ⌘K
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ 
        flex: 1, 
        padding: '0 1.5rem',
        display: 'flex', 
        flexDirection: 'column', 
        gap: '6px' 
      }}>
        {menuItems.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id as any)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: activeSection === item.id ? '600' : '500',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: 'transparent',
              color: activeSection === item.id 
                ? '#5b61eb' 
                : '#6b7280',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden',
              transform: 'translateX(0)',
              boxShadow: 'none',
              animation: `slideIn 0.6s ease-out ${index * 0.1}s both`
            }}
            onMouseEnter={(e) => {
              if (activeSection !== item.id) {
                e.currentTarget.style.background = '#f8fafc'
                e.currentTarget.style.color = '#374151'
              } else {
                e.currentTarget.style.background = 'rgba(91,97,235,0.05)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              if (activeSection !== item.id) {
                e.currentTarget.style.color = '#6b7280'
              } else {
                e.currentTarget.style.color = '#5b61eb'
              }
            }}
          >
            <span style={{ 
              marginRight: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeSection === item.id ? '#5b61eb' : '#6b7280',
              transition: 'all 0.2s ease'
            }}>
              <IconComponent name={item.icon} />
            </span>
            {item.label}
            
            {/* Active indicator */}
            {activeSection === item.id && (
              <div style={{
                position: 'absolute',
                right: '12px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#5b61eb',
                animation: 'pulse 2s ease-in-out infinite'
              }} />
            )}
          </button>
        ))}
      </nav>
      
      {/* Footer */}
      <div style={{
        padding: '1.5rem',
        borderTop: '1px solid #f3f4f6',
        animation: 'slideUp 0.8s ease-out 0.5s both'
      }}>
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f1f5f9'
          e.currentTarget.style.borderColor = '#cbd5e1'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#f8fafc'
          e.currentTarget.style.borderColor = '#e2e8f0'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '4px'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#10b981',
              marginRight: '8px',
              animation: 'pulse 2s ease-in-out infinite'
            }}></div>
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151'
            }}>
              System Online
            </span>
          </div>
          <div style={{
            fontSize: '10px',
            color: '#9ca3af',
            textAlign: 'center',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace'
          }}>
            EasyAI CLI v1.0.0
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar