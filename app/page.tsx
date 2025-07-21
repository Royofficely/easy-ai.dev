'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Terminal, Zap, Code, BarChart3, Copy, Check, Play, Sparkles, ArrowRight, Star, CheckCircle } from 'lucide-react'
// import { SignInButton, SignUpButton, useAuth } from '@clerk/nextjs'
import Link from 'next/link'

export default function Home() {
  const isSignedIn = false // Demo mode - no auth
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('analytics')
  
  const installCommand = "npm install -g @easyai/cli"

  const copyCommand = () => {
    navigator.clipboard.writeText(installCommand)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }


  const features = [
    {
      icon: Terminal,
      title: "Unified CLI",
      description: "One command interface for all AI models and providers",
    },
    {
      icon: Code,
      title: "IDE Integration", 
      description: "Seamless integration with VS Code, Cursor, and other editors",
    },
    {
      icon: Zap,
      title: "Multi-Provider",
      description: "OpenAI, Anthropic, Gemini, and 50+ models in one place",
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "Track usage, costs, and performance across all models",
    }
  ]

  const pricing = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "CLI access to all models",
        "Basic prompt management", 
        "Community support",
        "Up to 10 requests/day"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Pro",
      price: "$19",
      period: "per month",
      description: "For professional developers",
      features: [
        "Everything in Free",
        "Unlimited requests",
        "Advanced analytics",
        "Priority support",
        "Custom prompts library",
        "Team collaboration"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "For teams and organizations",
      features: [
        "Everything in Pro",
        "SSO & advanced security",
        "Dedicated support",
        "Custom integrations",
        "SLA guarantees",
        "On-premise deployment"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="backdrop-blur-md bg-white/80 border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 bg-gray-900 rounded-md flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-medium text-gray-900">EasyAI</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#demo" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Demo</a>
            </div>
            
            <div className="flex items-center space-x-3">
              {!isSignedIn ? (
                <>
                  <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-2">
                    Sign in
                  </button>
                  <button className="text-sm bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors">
                    Get started
                  </button>
                </>
              ) : (
                <Link href="/dashboard" className="text-sm bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors">
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full mb-8">
              <div className="w-2 h-2 bg-[#5b61eb] rounded-full mr-2"></div>
              AI development tools, reimagined
            </div>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-medium text-gray-900 mb-8 leading-tight tracking-tight">
              One CLI for
              <br />
              <span className="text-gray-500">every AI model</span>
            </h1>
            
            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Stop switching between interfaces. EasyAI brings OpenAI, Claude, Gemini, 
              and 50+ other models into a single, elegant command line experience.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            {!isSignedIn ? (
              <>
                <button className="bg-gray-900 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                  Get started for free
                </button>
                
                <a href="#demo" className="text-gray-600 hover:text-gray-900 transition-colors font-medium px-6 py-3 text-sm">
                  View demo
                </a>
              </>
            ) : (
              <Link href="/dashboard" className="bg-gray-900 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                Go to dashboard
              </Link>
            )}
          </motion.div>

          {/* Install Command */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-md mx-auto"
          >
            <div className="group bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between">
                <code className="text-gray-700 font-mono text-sm">{installCommand}</code>
                <button
                  onClick={copyCommand}
                  className="ml-3 p-1.5 hover:bg-gray-200 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-medium text-gray-900 mb-4 tracking-tight">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Built for developers who value simplicity and power in equal measure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group p-6 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#5b61eb]/5 transition-colors relative">
                  <feature.icon className="w-5 h-5 text-gray-700 group-hover:text-[#5b61eb] transition-colors" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#5b61eb]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-medium text-gray-900 mb-4 tracking-tight">
              Simple pricing
            </h2>
            <p className="text-gray-600">
              Start free, scale as you grow. No hidden fees or surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricing.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative bg-white rounded-lg border p-6 ${
                  plan.popular 
                    ? 'border-gray-900 ring-1 ring-gray-900' 
                    : 'border-gray-200 hover:border-gray-300'
                } transition-colors`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gray-900 text-white px-3 py-1 text-xs font-medium rounded-full">
                      Popular
                    </span>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-3">
                    <span className="text-3xl font-medium text-gray-900">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-gray-600 text-sm ml-1">/{plan.period}</span>}
                  </div>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <button 
                  className={`w-full py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
                    plan.popular
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-24 bg-gray-50/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-medium text-gray-900 mb-4 tracking-tight">
              CLI meets dashboard intelligence
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Code in your terminal, monitor from your browser. EasyAI connects your CLI workflow 
              with powerful analytics and management tools.
            </p>
          </div>

          {/* Simple Side-by-Side Demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto"
          >
            {/* CLI Side */}
            <div className="bg-black rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center bg-gray-800 px-4 py-3 border-b border-gray-700">
                <div className="flex space-x-2 mr-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 text-sm font-medium">Terminal</span>
                </div>
              </div>
              
              <div className="p-4 font-mono text-sm text-white space-y-2">
                <div className="flex">
                  <span className="text-green-400 mr-2">$</span>
                  <span>easyai prompts create "React Generator"</span>
                </div>
                <div className="text-green-400">✅ Prompt created: React Generator</div>
                
                <div className="flex mt-3">
                  <span className="text-green-400 mr-2">$</span>
                  <span>easyai playground --models gpt4,claude</span>
                </div>
                <div className="text-blue-400">🔄 Testing prompt with 2 models...</div>
                <div className="text-gray-300">✅ GPT-4: Detailed JSX + TypeScript</div>
                <div className="text-gray-300">✅ Claude: Clean + optimized code</div>
                <div className="text-yellow-300">💡 Claude wins: 0.8s, $0.002</div>
                <div className="text-gray-400">📊 All data synced to dashboard</div>
              </div>
            </div>

            {/* Dashboard Side */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-xs text-gray-500">localhost:3000/dashboard</span>
                </div>
                
                <div className="flex space-x-4 text-xs">
                  <button 
                    onClick={() => setActiveTab('analytics')}
                    className={`py-1 px-2 transition-colors ${activeTab === 'analytics' ? 'text-[#5b61eb] border-b border-[#5b61eb]' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Analytics
                  </button>
                  <button 
                    onClick={() => setActiveTab('prompts')}
                    className={`py-1 px-2 transition-colors ${activeTab === 'prompts' ? 'text-[#5b61eb] border-b border-[#5b61eb]' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Prompts
                  </button>
                  <button 
                    onClick={() => setActiveTab('playground')}
                    className={`py-1 px-2 transition-colors ${activeTab === 'playground' ? 'text-[#5b61eb] border-b border-[#5b61eb]' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Playground
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {activeTab === 'analytics' && (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center bg-gray-50 rounded-lg p-3">
                        <div className="text-lg font-bold text-gray-900">48</div>
                        <div className="text-xs text-gray-500">Requests</div>
                      </div>
                      <div className="text-center bg-gray-50 rounded-lg p-3">
                        <div className="text-lg font-bold text-green-600">$0.23</div>
                        <div className="text-xs text-gray-500">Total Cost</div>
                      </div>
                      <div className="text-center bg-gray-50 rounded-lg p-3">
                        <div className="text-lg font-bold text-[#5b61eb]">0.9s</div>
                        <div className="text-xs text-gray-500">Avg Speed</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Claude: Best performance</span>
                        <span className="text-[#5b61eb]">0.8s</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">GPT-4: Good quality</span>
                        <span className="text-green-600">1.2s</span>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'prompts' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">Prompts (13)</span>
                      <div className="w-2 h-2 bg-[#5b61eb] rounded-full animate-pulse"></div>
                    </div>
                    
                    <div className="p-3 bg-[#5b61eb]/5 border border-[#5b61eb]/20 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">React Generator</span>
                        <span className="text-xs text-green-600">New</span>
                      </div>
                      <div className="text-xs text-gray-500">Just added • Best: Claude (0.8s)</div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-900">Code Review Assistant</div>
                      <div className="text-xs text-gray-500">18 uses • GPT-4 preferred</div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-700">API Documentation</div>
                      <div className="text-xs text-gray-500">5 uses • Claude preferred</div>
                    </div>
                  </div>
                )}

                {activeTab === 'playground' && (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-900">Latest Test Results</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-700">GPT-4</span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">Good</span>
                        </div>
                        <span className="text-sm text-gray-500">1.2s</span>
                      </div>
                      <div className="flex items-center justify-between p-3 border-2 border-[#5b61eb] bg-[#5b61eb]/5 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-700 font-medium">Claude 3.5</span>
                          <span className="text-xs bg-[#5b61eb] text-white px-2 py-1 rounded">Winner</span>
                        </div>
                        <span className="text-sm text-[#5b61eb] font-medium">0.8s</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-2">
                      Tested with "React Generator" prompt
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Simple workflow illustration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 text-center"
          >
            <div className="inline-flex items-center space-x-8 bg-white border border-gray-200 rounded-lg px-8 py-4">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-gray-700" />
                <span className="text-sm font-medium text-gray-900">CLI Commands</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#5b61eb]" />
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-[#5b61eb]" />
                <span className="text-sm font-medium text-gray-900">Real-time Sync</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#5b61eb]" />
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-gray-700" />
                <span className="text-sm font-medium text-gray-900">Dashboard Analytics</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-medium mb-4 tracking-tight">
              Ready to simplify your AI workflow?
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of developers building the future with better AI tools.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!isSignedIn ? (
                <>
                  <button className="bg-white text-gray-900 px-6 py-3 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors">
                    Get started for free
                  </button>
                  <button 
                    onClick={copyCommand}
                    className="border border-gray-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:border-gray-500 hover:bg-gray-800 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2 inline" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2 inline" />
                        Copy install
                      </>
                    )}
                  </button>
                </>
              ) : (
                <Link href="/dashboard" className="bg-white text-gray-900 px-6 py-3 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors">
                  Go to dashboard
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="text-lg font-medium text-gray-900">EasyAI</span>
            </div>
            
            <div className="text-sm text-gray-500">
              © 2024 EasyAI. Built for developers.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}