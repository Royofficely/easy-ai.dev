import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  ClockIcon, 
  PlayIcon, 
  CogIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline'

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const navigation = [
  { name: 'Analytics', id: 'analytics', icon: ChartBarIcon },
  { name: 'Prompts', id: 'prompts', icon: DocumentTextIcon },
  { name: 'Logs', id: 'logs', icon: ClockIcon },
  { name: 'Playground', id: 'playground', icon: PlayIcon },
  { name: 'Settings', id: 'settings', icon: CogIcon },
]

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <div className="sidebar w-64 h-full flex flex-col">
      {/* Header */}
      <div className="p-8 pb-12">
        <div className="flex items-center gap-3">
          <CircleStackIcon className="w-5 h-5 text-gray-400" />
          <div>
            <h2 className="text-sm font-medium text-gray-900">EasyAI</h2>
            <p className="text-xs text-gray-400">Platform</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-link w-full text-left ${
                isActive ? 'active' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-4 h-4 mr-4 ${
                isActive ? 'text-white' : 'text-gray-400'
              }`} />
              <span className="text-sm">{item.name}</span>
            </button>
          )
        })}
      </nav>
      
      {/* Footer */}
      <div className="p-6 pt-8">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-25 hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">U</span>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900">User</p>
            <p className="text-xs text-gray-400">Free</p>
          </div>
        </div>
      </div>
    </div>
  )
}