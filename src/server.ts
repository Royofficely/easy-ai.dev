import express from 'express'
import path from 'path'
import fs from 'fs-extra'
import axios from 'axios'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'
import cors from 'cors'

// Load environment variables from easyai.env
const envPath = path.join(process.cwd(), 'easyai', 'easyai.env')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

const app = express()
const port = process.env.EASYAI_PORT || 7542

// Middleware
app.use(cors())
app.use(express.json())

// Initialize AI clients
let openai: OpenAI | null = null
let anthropic: Anthropic | null = null

// Function to reload environment and reinitialize AI clients
async function reloadAIClients() {
  try {
    const envPath = path.join(process.cwd(), 'easyai', 'easyai.env')
    if (fs.existsSync(envPath)) {
      // Read the latest env file
      const envContent = await fs.readFile(envPath, 'utf-8')
      const env: Record<string, string> = {}
      
      envContent.split('\n').forEach(line => {
        line = line.trim()
        if (line && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=')
          if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim()
          }
        }
      })
      
      // Reinitialize clients with fresh API keys
      openai = null
      anthropic = null
      
      if (env.OPENAI_API_KEY?.trim()) {
        openai = new OpenAI({ apiKey: env.OPENAI_API_KEY.trim() })
        console.log('✅ OpenAI client reinitialized')
      }
      if (env.ANTHROPIC_API_KEY?.trim()) {
        anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY.trim() })
        console.log('✅ Anthropic client reinitialized')
      }
    }
  } catch (error) {
    console.warn('⚠️ AI clients reinitialization failed:', error)
  }
}

// Initial client setup
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  if (process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
} catch (error) {
  console.warn('⚠️ AI clients initialization failed:', error)
}

// API Routes
app.get('/api/analytics', async (req, res) => {
  try {
    const logsPath = path.join(process.cwd(), 'easyai', 'easyai.jsonl')
    
    if (!fs.existsSync(logsPath)) {
      return res.json({
        totalCalls: 0,
        totalTokens: 0,
        modelUsage: {},
        lastUpdated: new Date().toISOString()
      })
    }

    const logsContent = await fs.readFile(logsPath, 'utf8')
    const logs = logsContent.trim().split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))

    const analytics = {
      totalCalls: logs.length,
      totalTokens: logs.reduce((sum, log) => sum + (log.tokens || 0), 0),
      modelUsage: logs.reduce((acc, log) => {
        acc[log.model] = (acc[log.model] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      lastUpdated: logs.length > 0 ? logs[logs.length - 1].timestamp : new Date().toISOString()
    }

    res.json(analytics)
  } catch (error) {
    console.error('Analytics error:', error)
    res.json({
      totalCalls: 0,
      totalTokens: 0,
      modelUsage: {},
      lastUpdated: new Date().toISOString()
    })
  }
})

app.get('/api/logs', async (req, res) => {
  try {
    const logsPath = path.join(process.cwd(), 'easyai', 'easyai.jsonl')
    
    if (!fs.existsSync(logsPath)) {
      return res.json([])
    }

    const logsContent = await fs.readFile(logsPath, 'utf8')
    const logs = logsContent.trim().split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
      .reverse() // Most recent first

    res.json(logs)
  } catch (error) {
    console.error('Logs error:', error)
    res.json([])
  }
})

app.get('/api/prompts', async (req, res) => {
  try {
    const prompts: any[] = []
    const promptsBaseDir = path.join(process.cwd(), 'easyai', 'prompts')
    
    if (!fs.existsSync(promptsBaseDir)) {
      return res.json([])
    }

    const categories = await fs.readdir(promptsBaseDir, { withFileTypes: true })
    
    for (const category of categories) {
      if (!category.isDirectory()) continue
      
      const categoryDir = path.join(promptsBaseDir, category.name)
      const files = await fs.readdir(categoryDir)
      
      for (const file of files) {
        if (!file.endsWith('.md')) continue
        
        const name = file.replace('.md', '')
        const filePath = path.join(categoryDir, file)
        const content = await fs.readFile(filePath, 'utf8')
        
        // Parse metadata from content
        const lines = content.split('\n')
        let description = ''
        let model = 'gpt-4'
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()
          if (line.startsWith('## Description')) {
            description = lines[i + 1]?.trim() || ''
          } else if (line.startsWith('## Model')) {
            model = lines[i + 1]?.trim() || 'gpt-4'
          }
        }
        
        prompts.push({
          name,
          category: category.name,
          content: content.substring(0, 200) + '...',
          fullContent: content,
          description,
          model
        })
      }
    }
    
    res.json(prompts)
  } catch (error) {
    console.error('Prompts error:', error)
    res.json([])
  }
})

app.get('/api/prompts/:category/:name', async (req, res) => {
  try {
    const { category, name } = req.params
    const promptFile = path.join(process.cwd(), 'easyai', 'prompts', category, `${name}.md`)
    
    if (fs.existsSync(promptFile)) {
      const content = await fs.readFile(promptFile, 'utf8')
      res.json({ name, category, content })
    } else {
      res.json({
        name,
        category,
        content: `# ${name}\n\n## Description\nThis is a ${category} prompt.\n\n## Model\ngpt-4\n\n## Content\nAdd your prompt instructions here.\n\n{{input}}`
      })
    }
  } catch (error) {
    console.error('Get prompt error:', error)
    res.status(500).json({ error: 'Failed to read prompt file' })
  }
})

app.post('/api/prompts/:category/:name', async (req, res) => {
  try {
    const { category, name } = req.params
    const { content } = req.body
    
    const promptDir = path.join(process.cwd(), 'easyai', 'prompts', category)
    const promptFile = path.join(promptDir, `${name}.md`)
    
    await fs.ensureDir(promptDir)
    await fs.writeFile(promptFile, content, 'utf8')
    
    console.log(`✅ Prompt saved: ${promptFile}`)
    res.json({ success: true, message: `Prompt ${name} saved successfully` })
  } catch (error) {
    console.error('Save prompt error:', error)
    res.status(500).json({ success: false, error: 'Failed to save prompt file' })
  }
})

app.delete('/api/prompts/:category/:name', async (req, res) => {
  try {
    const { category, name } = req.params
    const promptFile = path.join(process.cwd(), 'easyai', 'prompts', category, `${name}.md`)
    
    if (fs.existsSync(promptFile)) {
      await fs.remove(promptFile)
      console.log(`✅ Prompt deleted: ${promptFile}`)
      res.json({ success: true, message: `Prompt ${name} deleted successfully` })
    } else {
      res.status(404).json({ success: false, error: 'Prompt file not found' })
    }
  } catch (error) {
    console.error('Delete prompt error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete prompt file' })
  }
})

app.post('/api/playground/test', async (req, res) => {
  try {
    const { prompt, model, variables } = req.body
    
    console.log(`🎮 Playground test request: ${model}`)
    console.log(`📝 Prompt: ${prompt?.substring(0, 100)}...`)
    
    // Validate request
    if (!prompt || !model) {
      return res.status(400).json({
        success: false,
        response: 'Error: Missing prompt or model',
        tokens: 0,
        cost: 0,
        duration: 0,
        model: model || 'unknown'
      })
    }
    
    // Log the request
    const logEntry = {
      timestamp: new Date().toISOString(),
      prompt: 'playground-test',
      model,
      tokens: 0,
      cost: 0,
      duration: 0,
      success: false,
      response: ''
    }
    
    const startTime = Date.now()
    
    try {
      let response = ''
      let tokens = 0
      let cost = 0
      
      if (model.includes('gpt') && openai) {
        console.log(`🤖 Using OpenAI for ${model}`)
        console.log(`🔑 OpenAI client exists: ${!!openai}`)
        const completion = await openai.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000
        })
        
        response = completion.choices[0]?.message?.content || 'No response'
        tokens = completion.usage?.total_tokens || 0
        cost = calculateCost(model, tokens)
      } else if (model.includes('claude') && anthropic) {
        console.log(`🤖 Using Anthropic for ${model}`)
        const completion = await anthropic.messages.create({
          model,
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
        
        response = completion.content[0]?.type === 'text' ? completion.content[0].text : 'No response'
        tokens = (completion.usage?.input_tokens || 0) + (completion.usage?.output_tokens || 0)
        cost = calculateCost(model, tokens)
      } else {
        console.log(`🎭 Using simulated response for ${model}`)
        response = `Simulated response from ${model}.\n\nYour prompt was processed successfully. To get real responses, configure your API keys in the Settings page.`
        tokens = Math.floor(Math.random() * 500) + 100
        cost = calculateCost(model, tokens)
      }
      
      const duration = Date.now() - startTime
      
      logEntry.tokens = tokens
      logEntry.cost = cost
      logEntry.duration = duration
      logEntry.success = true
      logEntry.response = response
      
      // Save log
      try {
        const logsPath = path.join(process.cwd(), 'easyai', 'easyai.jsonl')
        await fs.appendFile(logsPath, JSON.stringify(logEntry) + '\n')
      } catch (logError) {
        console.error('⚠️ Failed to save log:', logError)
      }
      
      console.log(`✅ Playground response: ${tokens} tokens, ${duration}ms`)
      
      res.json({
        success: true,
        response,
        tokens,
        cost,
        duration,
        model
      })
    } catch (apiError) {
      console.error('❌ API Error:', apiError)
      const duration = Date.now() - startTime
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown API error'
      
      logEntry.duration = duration
      logEntry.response = `Error: ${errorMessage}`
      
      // Save error log
      try {
        const logsPath = path.join(process.cwd(), 'easyai', 'easyai.jsonl')
        await fs.appendFile(logsPath, JSON.stringify(logEntry) + '\n')
      } catch (logError) {
        console.error('⚠️ Failed to save error log:', logError)
      }
      
      res.json({
        success: false,
        response: `Error: ${errorMessage}`,
        tokens: 0,
        cost: 0,
        duration,
        model
      })
    }
  } catch (error) {
    console.error('❌ Playground error:', error)
    res.status(500).json({
      success: false,
      response: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      tokens: 0,
      cost: 0,
      duration: 0,
      model: req.body?.model || 'unknown'
    })
  }
})

app.get('/api/config', async (req, res) => {
  try {
    const configPath = path.join(process.cwd(), 'easyai', 'easyai.env')
    
    let env: Record<string, string> = {}
    if (fs.existsSync(configPath)) {
      const envContent = await fs.readFile(configPath, 'utf8')
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=')
          env[key] = key.includes('KEY') ? (value ? '***configured***' : '') : value
        }
      })
    }
    
    const config = {
      config: {
        ui: { theme: 'light', defaultModel: 'gpt-4', autoSave: true },
        logging: { enabled: true, includeResponses: true, retention: '30d' }
      },
      env
    }
    
    res.json(config)
  } catch (error) {
    console.error('Config error:', error)
    res.status(500).json({ error: 'Failed to load config' })
  }
})

app.post('/api/config', async (req, res) => {
  try {
    const { env } = req.body
    const configPath = path.join(process.cwd(), 'easyai', 'easyai.env')
    
    if (!await fs.pathExists(configPath)) {
      return res.status(404).json({ success: false, error: 'Configuration file not found. Please run "easyai init" first.' })
    }
    
    // Read existing content
    let envContent = await fs.readFile(configPath, 'utf-8')
    
    // Update each environment variable
    Object.entries(env).forEach(([key, value]) => {
      if (value && value !== '***configured***') {
        const regex = new RegExp(`${key}=.*`)
        if (envContent.match(regex)) {
          envContent = envContent.replace(regex, `${key}=${value}`)
        } else {
          envContent += `\n${key}=${value}`
        }
      }
    })
    
    await fs.writeFile(configPath, envContent)
    
    // Reload AI clients with new API keys
    await reloadAIClients()
    
    console.log('✅ Configuration saved')
    res.json({ success: true, message: 'Configuration saved successfully' })
  } catch (error) {
    console.error('Save config error:', error)
    res.status(500).json({ success: false, error: 'Failed to save configuration' })
  }
})

// Get available models endpoint
app.get('/api/models', async (req, res) => {
  try {
    const models: any[] = []
    
    // Test OpenAI connection and get models
    if (openai) {
      try {
        const openaiModels = await openai.models.list()
        const relevantModels = openaiModels.data
          .filter(model => 
            model.id.includes('gpt-4') || 
            model.id.includes('gpt-3.5') ||
            model.id === 'gpt-4o' ||
            model.id === 'gpt-4o-mini'
          )
          .map(model => ({
            id: model.id,
            name: model.id.replace('gpt-4o', 'GPT-4o').replace('gpt-4', 'GPT-4').replace('gpt-3.5', 'GPT-3.5'),
            provider: 'openai',
            available: true
          }))
        models.push(...relevantModels)
        console.log(`✅ OpenAI: Found ${relevantModels.length} models`)
      } catch (error) {
        console.log('❌ OpenAI models fetch failed:', error instanceof Error ? error.message : 'Unknown error')
        // Add default OpenAI models if API call fails
        models.push(
          { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', available: false },
          { id: 'gpt-4', name: 'GPT-4', provider: 'openai', available: false },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', available: false }
        )
      }
    } else {
      // Add default OpenAI models if no API key
      models.push(
        { id: 'gpt-4o', name: 'GPT-4o (No API Key)', provider: 'openai', available: false },
        { id: 'gpt-4', name: 'GPT-4 (No API Key)', provider: 'openai', available: false },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (No API Key)', provider: 'openai', available: false }
      )
    }
    
    // Test Anthropic connection and add models
    if (anthropic) {
      try {
        // Test with a minimal request to verify the key works
        await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        })
        
        // Add Anthropic models
        models.push(
          { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', available: true },
          { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'anthropic', available: true },
          { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', available: true }
        )
        console.log('✅ Anthropic: API key validated')
      } catch (error) {
        console.log('❌ Anthropic validation failed:', error instanceof Error ? error.message : 'Unknown error')
        // Add default Anthropic models if API call fails
        models.push(
          { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', available: false },
          { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'anthropic', available: false },
          { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', available: false }
        )
      }
    } else {
      // Add default Anthropic models if no API key
      models.push(
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (No API Key)', provider: 'anthropic', available: false },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet (No API Key)', provider: 'anthropic', available: false },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku (No API Key)', provider: 'anthropic', available: false }
      )
    }
    
    res.json(models)
  } catch (error) {
    console.error('Models endpoint error:', error)
    res.status(500).json({ error: 'Failed to fetch models' })
  }
})

// Alternative endpoint for frontend compatibility
app.post('/api/config/save', async (req, res) => {
  try {
    const { env } = req.body
    const configPath = path.join(process.cwd(), 'easyai', 'easyai.env')
    
    if (!await fs.pathExists(configPath)) {
      return res.status(404).json({ success: false, error: 'Configuration file not found. Please run "easyai init" first.' })
    }
    
    // Read existing content
    let envContent = await fs.readFile(configPath, 'utf-8')
    
    // Update each environment variable
    Object.entries(env).forEach(([key, value]) => {
      if (value && value !== '***configured***') {
        const regex = new RegExp(`${key}=.*`)
        if (envContent.match(regex)) {
          envContent = envContent.replace(regex, `${key}=${value}`)
        } else {
          envContent += `\n${key}=${value}`
        }
      }
    })
    
    await fs.writeFile(configPath, envContent)
    
    // Reload AI clients with new API keys
    await reloadAIClients()
    
    console.log('✅ Configuration saved')
    res.json({ success: true, message: 'Configuration saved successfully' })
  } catch (error) {
    console.error('Save config error:', error)
    res.status(500).json({ success: false, error: 'Failed to save configuration' })
  }
})

// Helper function to calculate costs
function calculateCost(model: string, tokens: number): number {
  const rates: Record<string, number> = {
    'gpt-4': 0.00003,
    'gpt-3.5-turbo': 0.000002,
    'claude-3-opus': 0.000015,
    'claude-3-sonnet': 0.000003,
    'claude-3-haiku': 0.00000025
  }
  
  return (rates[model] || 0.00001) * tokens
}

// Serve React build
const buildPath = path.join(__dirname, '../dist/dashboard')
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath))
  
  // Catch all handler for React Router
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(buildPath, 'index.html'))
    }
  })
} else {
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.send(`
        <html>
          <body>
            <h1>EasyAI Dashboard</h1>
            <p>Frontend build not found. Please run <code>npm run build</code> first.</p>
          </body>
        </html>
      `)
    }
  })
}

// Ensure EasyAI structure exists on server start
async function ensureEasyAIStructure() {
  const easyaiDir = path.join(process.cwd(), 'easyai')
  const configPath = path.join(easyaiDir, 'easyai.env')
  
  try {
    // Create easyai directory if it doesn't exist
    await fs.ensureDir(easyaiDir)
    await fs.ensureDir(path.join(easyaiDir, 'logs'))
    await fs.ensureDir(path.join(easyaiDir, 'prompts'))
    
    // Create easyai.env if it doesn't exist
    if (!await fs.pathExists(configPath)) {
      const defaultEnv = `# EasyAI Configuration - Add your API keys here
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Default model settings
DEFAULT_MODEL=gpt-4
TEMPERATURE=0.7
MAX_TOKENS=1000

# Logging settings
ENABLE_LOGGING=true
LOG_LEVEL=info
`
      await fs.writeFile(configPath, defaultEnv)
      console.log('✅ Created default configuration file')
    }
  } catch (error) {
    console.log('⚠️ Warning: Could not ensure EasyAI structure:', error)
  }
}

export async function startServer() {
  // Ensure EasyAI structure exists before starting
  await ensureEasyAIStructure()
  
  app.listen(port, () => {
    console.log(`🎯 EasyAI Dashboard: http://localhost:${port}`)
    console.log('✅ TypeScript + React server ready')
  })
}

export default app