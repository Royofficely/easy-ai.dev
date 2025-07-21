import { useState, useCallback, useEffect } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import Fuse from 'fuse.js'

interface SearchOptions {
  keys: string[]
  threshold?: number
  includeMatches?: boolean
}

export const useUniversalSearch = <T extends Record<string, any>>(
  data: T[],
  options: SearchOptions
) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<T[]>(data)

  // Initialize Fuse.js with options
  const fuse = new Fuse(data, {
    keys: options.keys,
    threshold: options.threshold || 0.3,
    includeScore: true,
    includeMatches: options.includeMatches || true,
    ignoreLocation: true,
    findAllMatches: true
  })

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      setSearchResults(data)
      return
    }

    const results = fuse.search(query)
    setSearchResults(results.map(result => result.item))
  }, [fuse, data])

  // Open search modal
  const openSearch = useCallback(() => {
    console.log('openSearch called, current isSearchOpen:', isSearchOpen)
    setIsSearchOpen(true)
    console.log('Search modal should be open now')
    // Focus search input after modal opens
    setTimeout(() => {
      const searchInput = document.getElementById('universal-search-input')
      if (searchInput) {
        searchInput.focus()
        console.log('Search input focused')
      } else {
        console.log('Search input not found!')
      }
    }, 100)
  }, [isSearchOpen])

  // Close search modal
  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
    setSearchQuery('')
    setSearchResults(data)
  }, [data])

  // Listen for global search events
  useEffect(() => {
    const handleGlobalSearch = (event: any) => {
      console.log('Global search event received:', event)
      openSearch()
    }
    
    window.addEventListener('globalSearch', handleGlobalSearch)
    console.log('Global search listener added')
    
    return () => {
      window.removeEventListener('globalSearch', handleGlobalSearch)
      console.log('Global search listener removed')
    }
  }, [openSearch])

  // Keyboard shortcuts (backup)
  useHotkeys('cmd+k, ctrl+k', (event) => {
    event.preventDefault()
    openSearch()
  }, { enableOnFormTags: true })

  useHotkeys('escape', () => {
    if (isSearchOpen) {
      closeSearch()
    }
  }, { enableOnFormTags: false, enabled: isSearchOpen })

  // Update results when data changes
  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery)
    } else {
      setSearchResults(data)
    }
  }, [data, searchQuery, handleSearch])

  return {
    isSearchOpen,
    searchQuery,
    searchResults,
    openSearch,
    closeSearch,
    handleSearch
  }
}

// Search Modal Component
interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  searchQuery: string
  onSearch: (query: string) => void
  placeholder?: string
  children?: React.ReactNode
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearch,
  placeholder = "Search...",
  children
}) => {
  console.log('SearchModal render - isOpen:', isOpen)
  if (!isOpen) {
    console.log('SearchModal not rendering because isOpen is false')
    return null
  }
  
  console.log('SearchModal rendering with isOpen=true')

  return (
    <div style={{
      position: 'fixed',
      inset: '0',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '10vh 1rem 1rem',
      zIndex: '9999',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '42rem',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        animation: 'slideUp 0.2s ease-out',
        overflow: 'hidden'
      }}>
        {/* Search Input */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #f3f4f6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '20px',
              height: '20px',
              marginRight: '12px',
              color: '#6b7280'
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
            <input
              id="universal-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              onKeyDown={(e) => {
                // Allow all keyboard input including delete/backspace
                e.stopPropagation()
              }}
              placeholder={placeholder}
              style={{
                flex: '1',
                border: 'none',
                outline: 'none',
                fontSize: '1.125rem',
                color: '#111827',
                backgroundColor: 'transparent'
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            <button
              onClick={onClose}
              style={{
                padding: '6px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div style={{
          maxHeight: '60vh',
          overflowY: 'auto'
        }}>
          {children}
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.75rem 1.5rem',
          borderTop: '1px solid #f3f4f6',
          backgroundColor: '#f9fafb',
          fontSize: '0.75rem',
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>Press ESC to close</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <kbd style={{
                padding: '2px 6px',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '0.625rem',
                fontFamily: 'ui-monospace, monospace'
              }}>
                {navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}
              </kbd>
              <kbd style={{
                padding: '2px 6px',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '0.625rem',
                fontFamily: 'ui-monospace, monospace'
              }}>
                K
              </kbd>
              <span style={{ marginLeft: '4px' }}>to search</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}