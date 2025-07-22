'use client'

import { useState, useEffect } from 'react'
import { useAuth, UserButton } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { Terminal, Copy, Check, Key, Download, Sparkles, ExternalLink, Book, Github } from 'lucide-react'
import { redirect } from 'next/navigation'

export default function Dashboard() {
  const { userId, isLoaded, isSignedIn } = useAuth()
  const [apiKey, setApiKey] = useState('')
  const [copied, setCopied] = useState(false)
  
  // Generate user-specific API key
  useEffect(() => {
    if (userId) {
      // In a real app, this would come from your backend
      setApiKey(`easyai_${userId.slice(-12)}`)
    }
  }, [userId])

  // Redirect if not signed in
  if (isLoaded && !isSignedIn) {
    redirect('/')
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-black rounded-full"></div>
      </div>
    )
  }

  const installCommand = `npm install -g @easyai/cli && easyai init -k ${apiKey} --ui`
  
  const copyCommand = () => {
    navigator.clipboard.writeText(installCommand)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const quickCommands = [
    {
      title: "Interactive Mode",
      command: "easyai",
      description: "Start the interactive terminal"
    },
    {
      title: "Browse Models", 
      command: "easyai models",
      description: "View available AI models"
    },
    {
      title: "Create Prompts",
      command: "easyai prompts create",
      description: "Build new AI prompts"
    },
    {
      title: "Multi-Model Test",
      command: "easyai playground",
      description: "Test across multiple models"
    },
    {
      title: "Usage Analytics",
      command: "easyai analytics",
      description: "View usage statistics"
    },
    {
      title: "Launch UI",
      command: "easyai ui",
      description: "Open web dashboard"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">EasyAI</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to EasyAI! 🎉
          </h1>
          <p className="text-lg text-gray-600">
            You're all set! Copy the command below to get started.
          </p>
        </motion.div>

        {/* Install Command */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Terminal className="w-5 h-5 mr-2" />
                Installation Command
              </h2>
              <button
                onClick={copyCommand}
                className="btn btn-secondary btn-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </button>
            </div>
            
            <div className="terminal">
              <div className="absolute top-3 left-4 flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              
              <div className="terminal-content">
                <div className="text-gray-400">$</div>
                <div className="text-green-400 mt-1 break-all">{installCommand}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* API Key */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Your API Key
              </h2>
              <button
                onClick={copyApiKey}
                className="btn btn-secondary btn-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </button>
            </div>
            
            <div className="code-block">
              <code className="text-purple-600 break-all">{apiKey}</code>
            </div>
            
            <p className="text-sm text-gray-500 mt-2">
              Keep this key secure. It's automatically included in your install command above.
            </p>
          </div>
        </motion.div>

        {/* One Command Setup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mb-8"
        >
          <div className="card p-6 bg-green-50 border-green-200">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-semibold text-sm">✨</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">One Command Setup</h2>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600">
              <p className="font-medium text-green-700">That's it! The single command above will:</p>
              <ul className="space-y-1 ml-4">
                <li>✅ Install EasyAI CLI globally</li>
                <li>✅ Set up your workspace automatically</li>
                <li>✅ Configure your API key</li>
                <li>✅ Open the dashboard in your browser</li>
              </ul>
              <p className="text-xs text-gray-500 mt-3">No additional steps needed. Everything is automated!</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Commands */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Commands
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickCommands.map((cmd, index) => (
              <div key={cmd.title} className="card p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{cmd.title}</h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(cmd.command)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <code className="text-sm text-purple-600 block mb-1">{cmd.command}</code>
                <p className="text-xs text-gray-500">{cmd.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              What's Next?
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="text-gray-900 font-medium">Run the install command</p>
                  <p className="text-sm text-gray-600">Copy the command above and run it in your terminal</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="text-gray-900 font-medium">Configure your AI providers</p>
                  <p className="text-sm text-gray-600">Add your OpenAI, Anthropic, or other API keys</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="text-gray-900 font-medium">Start building</p>
                  <p className="text-sm text-gray-600">Create prompts, test models, and analyze usage</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Resources
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="https://github.com/easyai/cli"
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <Github className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">GitHub</p>
                  <p className="text-sm text-gray-500">Source code & issues</p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
              </a>
              
              <a
                href="https://docs.easy-ai.dev"
                target="_blank"
                rel="noopener noreferrer" 
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <Book className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Documentation</p>
                  <p className="text-sm text-gray-500">Guides & API reference</p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
              </a>
              
              <a
                href="https://www.npmjs.com/package/@easyai/cli"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <Download className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">NPM Package</p>
                  <p className="text-sm text-gray-500">View on npm registry</p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}