'use client'

import { useEffect, useState } from 'react'
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import toast from 'react-hot-toast'

interface Prompt {
  name: string
  category: string
  content: string
}

export default function PromptManager() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [newPromptName, setNewPromptName] = useState('')
  const [newPromptCategory, setNewPromptCategory] = useState('custom')
  const [showNewPrompt, setShowNewPrompt] = useState(false)

  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    try {
      const response = await axios.get('/api/prompts')
      setPrompts(response.data)
    } catch (error) {
      toast.error('Failed to load prompts')
    }
  }

  const selectPrompt = async (prompt: Prompt) => {
    try {
      const response = await axios.get(`/api/prompts/${prompt.category}/${prompt.name}`)
      setSelectedPrompt(response.data)
      setEditContent(response.data.content)
      setIsEditing(false)
    } catch (error) {
      toast.error('Failed to load prompt content')
    }
  }

  const savePrompt = async () => {
    if (!selectedPrompt) return

    try {
      await axios.post(`/api/prompts/${selectedPrompt.category}/${selectedPrompt.name}`, {
        content: editContent
      })
      toast.success('Prompt saved successfully')
      setIsEditing(false)
      fetchPrompts()
    } catch (error) {
      toast.error('Failed to save prompt')
    }
  }

  const createNewPrompt = async () => {
    if (!newPromptName.trim()) {
      toast.error('Please enter a prompt name')
      return
    }

    try {
      const content = `# ${newPromptName}

## Description
Describe what this prompt does here.

## Input
{{input}}

## Instructions
Add your prompt instructions here.`

      await axios.post(`/api/prompts/${newPromptCategory}/${newPromptName}`, {
        content
      })
      
      toast.success('Prompt created successfully')
      setShowNewPrompt(false)
      setNewPromptName('')
      fetchPrompts()
    } catch (error) {
      toast.error('Failed to create prompt')
    }
  }

  const deletePrompt = async (prompt: Prompt) => {
    if (!confirm(`Delete prompt "${prompt.name}"?`)) return

    try {
      await axios.delete(`/api/prompts/${prompt.category}/${prompt.name}`)
      toast.success('Prompt deleted successfully')
      if (selectedPrompt?.name === prompt.name) {
        setSelectedPrompt(null)
      }
      fetchPrompts()
    } catch (error) {
      toast.error('Failed to delete prompt')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Prompts List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Prompts
          </h3>
          <button
            onClick={() => setShowNewPrompt(true)}
            className="btn-primary text-sm"
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            New
          </button>
        </div>

        {showNewPrompt && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <input
              type="text"
              placeholder="Prompt name"
              value={newPromptName}
              onChange={(e) => setNewPromptName(e.target.value)}
              className="w-full p-2 border rounded mb-2 dark:bg-gray-600 dark:border-gray-500"
            />
            <select
              value={newPromptCategory}
              onChange={(e) => setNewPromptCategory(e.target.value)}
              className="w-full p-2 border rounded mb-2 dark:bg-gray-600 dark:border-gray-500"
            >
              <option value="custom">Custom</option>
              <option value="examples">Examples</option>
            </select>
            <div className="flex space-x-2">
              <button onClick={createNewPrompt} className="btn-primary text-sm">
                Create
              </button>
              <button 
                onClick={() => setShowNewPrompt(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {prompts.map((prompt) => (
            <div
              key={`${prompt.category}-${prompt.name}`}
              className={`p-3 rounded-lg cursor-pointer border ${
                selectedPrompt?.name === prompt.name
                  ? 'bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-700'
                  : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'
              }`}
              onClick={() => selectPrompt(prompt)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {prompt.name}
                  </h4>
                  <p className="text-sm text-gray-500 capitalize">
                    {prompt.category}
                  </p>
                </div>
                {prompt.category === 'custom' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deletePrompt(prompt)
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prompt Editor */}
      <div className="lg:col-span-2">
        {selectedPrompt ? (
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {selectedPrompt.name}
              </h3>
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <button onClick={savePrompt} className="btn-primary">
                      Save
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditing(false)
                        setEditContent(selectedPrompt.content)
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="btn-primary"
                  >
                    <PencilIcon className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                )}
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-96 p-4 border rounded-lg font-mono text-sm dark:bg-gray-700 dark:border-gray-600"
                placeholder="Enter your prompt content..."
              />
            ) : (
              <div className="h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-900 dark:text-white">
                  {selectedPrompt.content}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="card h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-4" />
              <p>Select a prompt to view and edit</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DocumentTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}