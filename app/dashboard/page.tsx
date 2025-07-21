'use client'

import { useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Analytics from '../../components/Analytics'
import PromptManager from '../../components/PromptManager'
import LogHistory from '../../components/LogHistory'
import Playground from '../../components/Playground'
import Settings from '../../components/Settings'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('analytics')

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <Analytics />
      case 'prompts':
        return <PromptManager />
      case 'logs':
        return <LogHistory />
      case 'playground':
        return <Playground />
      case 'settings':
        return <Settings />
      default:
        return <Analytics />
    }
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-12">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}