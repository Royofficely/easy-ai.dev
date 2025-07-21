'use client'

import { useEffect, useState } from 'react'
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'
import axios from 'axios'

interface LogEntry {
  timestamp: string
  prompt: string
  model: string
  tokens?: number
  cost?: number
  duration?: number
  success: boolean
  error?: string
  input?: string
  response?: string
}

export default function LogHistory() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [logs, searchTerm, filter])

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/api/logs?limit=200')
      setLogs(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = logs

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.prompt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.input?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (filter === 'success') {
      filtered = filtered.filter(log => log.success)
    } else if (filter === 'error') {
      filtered = filtered.filter(log => !log.success)
    }

    setFilteredLogs(filtered)
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatCost = (cost?: number) => {
    return cost ? `$${cost.toFixed(4)}` : '$0.0000'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading logs...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="error">Errors</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            API Calls ({filteredLogs.length})
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredLogs.map((log, index) => (
              <div
                key={index}
                onClick={() => setSelectedLog(log)}
                className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                  selectedLog === log
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-700'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${log.success ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {log.prompt || 'Unknown'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(log.timestamp)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>{log.model}</span>
                    <span>{log.tokens} tokens</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>{formatCost(log.cost)}</span>
                    <span>{log.duration}ms</span>
                  </div>
                </div>
                
                {log.error && (
                  <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                    Error: {log.error}
                  </div>
                )}
              </div>
            ))}
            
            {filteredLogs.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No logs found
              </div>
            )}
          </div>
        </div>

        {/* Log Details */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Log Details
          </h3>
          
          {selectedLog ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
                  <div className={`inline-flex items-center ml-2 ${selectedLog.success ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-2 h-2 rounded-full mr-1 ${selectedLog.success ? 'bg-green-500' : 'bg-red-500'}`} />
                    {selectedLog.success ? 'Success' : 'Error'}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Model:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{selectedLog.model}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Tokens:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{selectedLog.tokens || 0}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Cost:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formatCost(selectedLog.cost)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Duration:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{selectedLog.duration}ms</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Timestamp:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formatTimestamp(selectedLog.timestamp)}</span>
                </div>
              </div>

              {selectedLog.error && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Error:</span>
                  <div className="mt-1 p-2 bg-red-50 dark:bg-red-900 rounded text-red-700 dark:text-red-300 text-sm">
                    {selectedLog.error}
                  </div>
                </div>
              )}

              {selectedLog.input && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Input:</span>
                  <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm max-h-32 overflow-y-auto">
                    {selectedLog.input}
                  </div>
                </div>
              )}

              {selectedLog.response && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Response:</span>
                  <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm max-h-32 overflow-y-auto">
                    {selectedLog.response}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Select a log entry to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}