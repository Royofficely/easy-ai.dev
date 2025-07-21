'use client'

import { useState } from 'react'
import { PlayIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import toast from 'react-hot-toast'

interface Variable {
  key: string
  value: string
}

export default function Playground() {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('gpt-4')
  const [variables, setVariables] = useState<Variable[]>([])
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [responseData, setResponseData] = useState<any>(null)

  const models = [
    'gpt-4',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
    'o1-preview',
    'o1-mini',
    'claude-3-sonnet',
    'claude-3-opus',
    'claude-3-haiku',
    'claude-3-5-sonnet'
  ]

  const addVariable = () => {
    setVariables([...variables, { key: '', value: '' }])
  }

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index))
  }

  const updateVariable = (index: number, field: 'key' | 'value', value: string) => {
    const updated = variables.map((variable, i) => 
      i === index ? { ...variable, [field]: value } : variable
    )
    setVariables(updated)
  }

  const testPrompt = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    setIsLoading(true)
    setResponse('')
    setResponseData(null)

    try {
      const variablesObj = variables.reduce((acc, variable) => {
        if (variable.key && variable.value) {
          acc[variable.key] = variable.value
        }
        return acc
      }, {} as Record<string, string>)

      const result = await axios.post('/api/playground/test', {
        prompt,
        model,
        variables: variablesObj
      })

      setResponse(result.data.response)
      setResponseData({
        tokens: result.data.tokens,
        cost: result.data.cost,
        duration: result.data.duration
      })
      toast.success('Prompt executed successfully')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to execute prompt'
      toast.error(errorMessage)
      setResponse(`Error: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const loadExamplePrompt = () => {
    setPrompt(`# Code Review Assistant

Please review the following code for:
- Code quality and best practices
- Security vulnerabilities  
- Performance issues
- Maintainability

## Code to Review
\`\`\`{{language}}
{{code}}
\`\`\`

Provide specific suggestions for improvement.`)

    setVariables([
      { key: 'language', value: 'javascript' },
      { key: 'code', value: 'function calculateTotal(items) {\n  let total = 0;\n  for (let i = 0; i < items.length; i++) {\n    total += items[i].price * items[i].quantity;\n  }\n  return total;\n}' }
    ])
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Prompt Playground
          </h3>
          <div className="flex gap-2">
            <button
              onClick={loadExamplePrompt}
              className="btn-secondary text-sm"
            >
              Load Example
            </button>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              {models.map(modelName => (
                <option key={modelName} value={modelName}>
                  {modelName}
                </option>
              ))}
            </select>
            <button
              onClick={testPrompt}
              disabled={isLoading}
              className="btn-primary flex items-center"
            >
              <PlayIcon className="w-4 h-4 mr-1" />
              {isLoading ? 'Running...' : 'Test'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          {/* Prompt Editor */}
          <div className="card">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Prompt
            </h4>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-64 p-4 border rounded-lg font-mono text-sm dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter your prompt here... Use {{variable}} for variables"
            />
          </div>

          {/* Variables */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Variables
              </h4>
              <button
                onClick={addVariable}
                className="btn-primary text-sm"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add
              </button>
            </div>

            <div className="space-y-2">
              {variables.map((variable, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Key"
                    value={variable.key}
                    onChange={(e) => updateVariable(index, 'key', e.target.value)}
                    className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={variable.value}
                    onChange={(e) => updateVariable(index, 'value', e.target.value)}
                    className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  />
                  <button
                    onClick={() => removeVariable(index)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {variables.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No variables defined
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          {/* Response */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Response
              </h4>
              {responseData && (
                <div className="text-sm text-gray-500 space-x-4">
                  <span>{responseData.tokens} tokens</span>
                  <span>${responseData.cost?.toFixed(4)}</span>
                  <span>{responseData.duration}ms</span>
                </div>
              )}
            </div>

            <div className="h-64 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">Running prompt...</div>
                </div>
              ) : response ? (
                <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
                  {response}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Run a prompt to see the response
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="card">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Processed Prompt Preview
            </h4>
            <div className="h-32 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {(() => {
                  let processed = prompt
                  variables.forEach(variable => {
                    if (variable.key && variable.value) {
                      processed = processed.replace(
                        new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g'),
                        variable.value
                      )
                    }
                  })
                  return processed || 'Enter a prompt to see preview'
                })()}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}