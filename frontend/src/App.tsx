import { useState, useEffect } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import Sidebar from './components/Sidebar'
import Analytics from './components/Analytics'
import Prompts from './components/Prompts'
import Playground from './components/Playground'
import Logs from './components/Logs'
import Settings from './components/Settings'

type ActiveSection = 'analytics' | 'prompts' | 'playground' | 'logs' | 'settings'

function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('analytics')

  // Handle global search - redirect to appropriate section
  useEffect(() => {
    const handleGlobalSearch = (event: any) => {
      console.log('Global search event received in App:', event)
      
      // Check if we have searchable content in current section
      if (activeSection === 'prompts' || activeSection === 'logs') {
        // Current section has search, let it handle the event
        return
      }
      
      // Switch to prompts section for global search
      console.log('Switching to prompts section for search')
      setActiveSection('prompts')
      
      // Dispatch event again after section switch
      setTimeout(() => {
        const newSearchEvent = new CustomEvent('globalSearch', { 
          detail: { source: 'global', redirected: true } 
        })
        window.dispatchEvent(newSearchEvent)
      }, 100)
    }
    
    window.addEventListener('globalSearch', handleGlobalSearch)
    
    return () => {
      window.removeEventListener('globalSearch', handleGlobalSearch)
    }
  }, [activeSection])

  // Global search hotkey
  useHotkeys('cmd+k, ctrl+k', (event) => {
    event.preventDefault()
    
    // Dispatch a custom event that components can listen to
    const searchEvent = new CustomEvent('globalSearch', { 
      detail: { activeSection } 
    })
    window.dispatchEvent(searchEvent)
  }, { enableOnFormTags: true })

  const renderContent = () => {
    switch (activeSection) {
      case 'analytics':
        return <Analytics />
      case 'prompts':
        return <Prompts />
      case 'playground':
        return <Playground />
      case 'logs':
        return <Logs />
      case 'settings':
        return <Settings />
      default:
        return <Analytics />
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main style={{
        marginLeft: '280px',
        width: 'calc(100% - 280px)',
        height: '100vh',
        overflow: 'auto',
        background: '#ffffff'
      }}>
        {renderContent()}
      </main>
    </div>
  )
}

export default App