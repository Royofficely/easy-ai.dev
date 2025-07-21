import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Editor from '@monaco-editor/react'
import { LogEntry } from '../types'
import { useUniversalSearch, SearchModal } from '../hooks/useUniversalSearch'

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState('summary')
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'cost-desc' | 'cost-asc' | 'tokens-desc' | 'tokens-asc'>('date-desc')
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)

  // Universal search
  const {
    isSearchOpen,
    searchQuery,
    searchResults,
    openSearch,
    closeSearch,
    handleSearch
  } = useUniversalSearch(filteredLogs, {
    keys: ['prompt', 'model', 'response'],
    threshold: 0.3
  })

  // Icons
  const IconRefresh = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23,4 23,10 17,10"></polyline>
      <polyline points="1,20 1,14 7,14"></polyline>
      <path d="M20.49,9A9,9 0 0,0 5.64,5.64L1,10M3.51,15a9,9 0 0,0 14.85,3.36L23,14"></path>
    </svg>
  )

  const IconFileText = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2Z"></path>
      <polyline points="14,2 14,8 20,8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10,9 9,9 8,9"></polyline>
    </svg>
  )

  const IconClock = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12,6 12,12 16,14"></polyline>
    </svg>
  )

  const IconDollar = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  )

  const IconHash = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9"></line>
      <line x1="4" y1="15" x2="20" y2="15"></line>
      <line x1="10" y1="3" x2="8" y2="21"></line>
      <line x1="16" y1="3" x2="14" y2="21"></line>
    </svg>
  )

  const IconCheck = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,6 9,17 4,12"></polyline>
    </svg>
  )

  const IconX = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )

  const IconEye = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  )

  const IconClose = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )

  const IconDownload = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7,10 12,15 17,10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  )

  const IconFilter = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"></polygon>
    </svg>
  )

  const IconCalendar = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  )

  const IconChevronLeft = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15,18 9,12 15,6"></polyline>
    </svg>
  )

  const IconChevronRight = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9,18 15,12 9,6"></polyline>
    </svg>
  )

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    filterLogsByDate()
  }, [logs, dateRange, sortBy])

  // Close date pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-date-picker]')) {
        setShowStartDatePicker(false)
        setShowEndDatePicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/api/logs')
      setLogs(response.data)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterLogsByDate = () => {
    let filtered = [...logs]
    
    if (dateRange.startDate) {
      const startDate = new Date(dateRange.startDate)
      filtered = filtered.filter(log => new Date(log.timestamp) >= startDate)
    }
    
    if (dateRange.endDate) {
      const endDate = new Date(dateRange.endDate)
      endDate.setHours(23, 59, 59, 999) // Include the entire end date
      filtered = filtered.filter(log => new Date(log.timestamp) <= endDate)
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        case 'date-asc':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        case 'cost-desc':
          return (b.cost || 0) - (a.cost || 0)
        case 'cost-asc':
          return (a.cost || 0) - (b.cost || 0)
        case 'tokens-desc':
          return (b.tokens || 0) - (a.tokens || 0)
        case 'tokens-asc':
          return (a.tokens || 0) - (b.tokens || 0)
        default:
          return 0
      }
    })
    
    setFilteredLogs(filtered)
  }

  const exportToCSV = () => {
    const csvHeaders = ['Timestamp', 'Model', 'Prompt', 'Success', 'Tokens', 'Cost', 'Duration', 'Response']
    const csvRows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.model,
      `"${log.prompt.replace(/"/g, '""')}"`, // Escape quotes
      log.success ? 'Success' : 'Failed',
      log.tokens || 0,
      log.cost || 0,
      log.duration || 0,
      `"${(log.response || '').replace(/"/g, '""')}"` // Escape quotes
    ])
    
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `logs_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const clearDateFilters = () => {
    setDateRange({ startDate: '', endDate: '' })
  }

  // Custom date picker functions
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Select date'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const generateCalendarDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
      if (days.length >= 42) break // 6 weeks max
    }
    
    return days
  }

  const CustomDatePicker = ({ 
    value, 
    onChange, 
    onClose, 
    show 
  }: { 
    value: string, 
    onChange: (date: string) => void, 
    onClose: () => void,
    show: boolean 
  }) => {
    const [viewDate, setViewDate] = useState(() => {
      const date = value ? new Date(value) : new Date()
      return { year: date.getFullYear(), month: date.getMonth() }
    })

    if (!show) return null

    const days = generateCalendarDays(viewDate.year, viewDate.month)
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const handleDateClick = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0]
      onChange(dateStr)
      onClose()
    }

    const isToday = (date: Date) => {
      const today = new Date()
      return date.toDateString() === today.toDateString()
    }

    const isSelected = (date: Date) => {
      if (!value) return false
      const selectedDate = new Date(value)
      return date.toDateString() === selectedDate.toDateString()
    }

    const isCurrentMonth = (date: Date) => {
      return date.getMonth() === viewDate.month
    }

    return (
      <div style={{
        position: 'absolute',
        top: '100%',
        left: '0',
        zIndex: 1000,
        marginTop: '4px',
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        padding: '1rem',
        minWidth: '280px',
        animation: 'slideUp 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <button
            onClick={() => setViewDate(prev => ({
              year: prev.month === 0 ? prev.year - 1 : prev.year,
              month: prev.month === 0 ? 11 : prev.month - 1
            }))}
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#6b7280',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <IconChevronLeft />
          </button>

          <div style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#111827',
            textAlign: 'center'
          }}>
            {monthNames[viewDate.month]} {viewDate.year}
          </div>

          <button
            onClick={() => setViewDate(prev => ({
              year: prev.month === 11 ? prev.year + 1 : prev.year,
              month: prev.month === 11 ? 0 : prev.month + 1
            }))}
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#6b7280',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <IconChevronRight />
          </button>
        </div>

        {/* Day labels */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: '2px',
          marginBottom: '0.5rem'
        }}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} style={{
              padding: '8px',
              textAlign: 'center',
              fontSize: '0.75rem',
              fontWeight: '500',
              color: '#6b7280'
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: '2px'
        }}>
          {days.map((date, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              style={{
                padding: '8px',
                backgroundColor: isSelected(date) ? '#5b61eb' : 'transparent',
                color: isSelected(date) ? '#ffffff' : 
                       isToday(date) ? '#5b61eb' :
                       isCurrentMonth(date) ? '#111827' : '#d1d5db',
                border: isToday(date) && !isSelected(date) ? '1px solid #5b61eb' : 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: isSelected(date) || isToday(date) ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: '32px'
              }}
              onMouseEnter={(e) => {
                if (!isSelected(date)) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected(date)) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              {date.getDate()}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const handleViewLog = (log: LogEntry) => {
    setSelectedLog(log)
    setShowModal(true)
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ 
          width: '24px', 
          height: '24px', 
          border: '2px solid #e5e7eb', 
          borderTop: '2px solid #111827',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid #f3f4f6', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>
                Logs
              </h1>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                View your AI API call history and detailed responses
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: showFilters ? '#5b61eb' : '#ffffff',
                  color: showFilters ? '#ffffff' : '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => {
                  if (!showFilters) {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                    e.currentTarget.style.borderColor = '#9ca3af'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showFilters) {
                    e.currentTarget.style.backgroundColor = '#ffffff'
                    e.currentTarget.style.borderColor = '#d1d5db'
                  }
                }}
              >
                <span style={{ marginRight: '8px' }}>
                  <IconFilter />
                </span>
                Filters
              </button>

              {/* Export CSV Button */}
              <button
                onClick={exportToCSV}
                disabled={filteredLogs.length === 0}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: filteredLogs.length === 0 ? '#f3f4f6' : '#ffffff',
                  color: filteredLogs.length === 0 ? '#9ca3af' : '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: filteredLogs.length === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => {
                  if (filteredLogs.length > 0) {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                    e.currentTarget.style.borderColor = '#9ca3af'
                  }
                }}
                onMouseLeave={(e) => {
                  if (filteredLogs.length > 0) {
                    e.currentTarget.style.backgroundColor = '#ffffff'
                    e.currentTarget.style.borderColor = '#d1d5db'
                  }
                }}
              >
                <span style={{ marginRight: '8px' }}>
                  <IconDownload />
                </span>
                Export CSV
              </button>

              {/* Refresh Button */}
              <button
                onClick={fetchLogs}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                  e.currentTarget.style.borderColor = '#9ca3af'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff'
                  e.currentTarget.style.borderColor = '#d1d5db'
                }}
              >
                <span style={{ marginRight: '8px' }}>
                  <IconRefresh />
                </span>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div style={{
            borderBottom: '1px solid #f3f4f6',
            backgroundColor: '#f9fafb',
            padding: '1.5rem 2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  minWidth: '4rem'
                }}>
                  From:
                </label>
                <div style={{ position: 'relative' }} data-date-picker>
                  <button
                    onClick={() => {
                      setShowStartDatePicker(!showStartDatePicker)
                      setShowEndDatePicker(false)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      backgroundColor: '#ffffff',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit',
                      color: dateRange.startDate ? '#374151' : '#9ca3af',
                      width: '160px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5b61eb'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,97,235,0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <span>{formatDateDisplay(dateRange.startDate)}</span>
                    <IconCalendar />
                  </button>
                  
                  <CustomDatePicker
                    value={dateRange.startDate}
                    onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                    onClose={() => setShowStartDatePicker(false)}
                    show={showStartDatePicker}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  minWidth: '2rem'
                }}>
                  To:
                </label>
                <div style={{ position: 'relative' }} data-date-picker>
                  <button
                    onClick={() => {
                      setShowEndDatePicker(!showEndDatePicker)
                      setShowStartDatePicker(false)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      backgroundColor: '#ffffff',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit',
                      color: dateRange.endDate ? '#374151' : '#9ca3af',
                      width: '160px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5b61eb'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,97,235,0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <span>{formatDateDisplay(dateRange.endDate)}</span>
                    <IconCalendar />
                  </button>
                  
                  <CustomDatePicker
                    value={dateRange.endDate}
                    onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                    onClose={() => setShowEndDatePicker(false)}
                    show={showEndDatePicker}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  minWidth: '4rem'
                }}>
                  Sort by:
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    style={{
                      padding: '10px 12px',
                      paddingRight: '40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      backgroundColor: '#ffffff',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit',
                      color: '#374151',
                      width: '180px',
                      outline: 'none',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5b61eb'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,97,235,0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <option value="date-desc">Date (Newest first)</option>
                    <option value="date-asc">Date (Oldest first)</option>
                    <option value="cost-desc">Cost (Highest first)</option>
                    <option value="cost-asc">Cost (Lowest first)</option>
                    <option value="tokens-desc">Tokens (Most first)</option>
                    <option value="tokens-asc">Tokens (Least first)</option>
                  </select>
                  
                  {/* Custom dropdown arrow */}
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#6b7280'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6,9 12,15 18,9"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  Showing {filteredLogs.length} of {logs.length} logs
                </span>
                
                {(dateRange.startDate || dateRange.endDate) && (
                  <button
                    onClick={clearDateFilters}
                    style={{
                      fontSize: '0.875rem',
                      color: '#5b61eb',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ padding: '2rem' }}>
          {logs.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              animation: 'slideUp 0.6s ease-out both'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#f3f4f6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                color: '#9ca3af'
              }}>
                <div style={{ transform: 'scale(1.5)' }}>
                  <IconFileText />
                </div>
              </div>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                color: '#111827',
                marginBottom: '0.5rem'
              }}>
                No logs yet
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                API call logs will appear here once you start using the playground
              </p>
              <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                Test some prompts in the Playground to see detailed execution logs
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {searchResults.map((log, index) => (
                <div
                  key={index}
                  style={{
                    padding: '2rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid #f3f4f6',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease',
                    animation: `slideUp 0.6s ease-out ${index * 0.1}s both`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'
                    e.currentTarget.style.borderColor = '#e2e8f0'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
                    e.currentTarget.style.borderColor = '#f3f4f6'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                      {/* Status Dot */}
                      {log.success && (
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#22c55e',
                          marginRight: '1rem',
                          marginTop: '6px',
                          flexShrink: 0
                        }}></div>
                      )}

                      <div style={{ flex: 1 }}>
                        {/* Prompt and Model */}
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <h3 style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#111827',
                            marginRight: '0.75rem',
                            lineHeight: '1.3',
                            maxWidth: '400px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {log.prompt}
                          </h3>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            color: '#374151',
                            backgroundColor: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace'
                          }}>
                            {log.model}
                          </span>
                        </div>

                        {/* Metadata */}
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                          gap: '1rem',
                          marginBottom: '1rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <IconClock />
                            <div style={{ marginLeft: '6px' }}>
                              <div style={{ 
                                fontSize: '0.75rem', 
                                color: '#6b7280',
                                fontWeight: '500'
                              }}>
                                Time
                              </div>
                              <div style={{
                                fontSize: '0.875rem',
                                color: '#111827',
                                fontWeight: '500',
                                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace'
                              }}>
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <IconHash />
                            <div style={{ marginLeft: '6px' }}>
                              <div style={{ 
                                fontSize: '0.75rem', 
                                color: '#6b7280',
                                fontWeight: '500'
                              }}>
                                Tokens
                              </div>
                              <div style={{
                                fontSize: '0.875rem',
                                color: '#111827',
                                fontWeight: '500',
                                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace'
                              }}>
                                {log.tokens.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <IconDollar />
                            <div style={{ marginLeft: '6px' }}>
                              <div style={{ 
                                fontSize: '0.75rem', 
                                color: '#6b7280',
                                fontWeight: '500'
                              }}>
                                Cost
                              </div>
                              <div style={{
                                fontSize: '0.875rem',
                                color: '#111827',
                                fontWeight: '500',
                                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace'
                              }}>
                                ${log.cost.toFixed(4)}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <IconClock />
                            <div style={{ marginLeft: '6px' }}>
                              <div style={{ 
                                fontSize: '0.75rem', 
                                color: '#6b7280',
                                fontWeight: '500'
                              }}>
                                Duration
                              </div>
                              <div style={{
                                fontSize: '0.875rem',
                                color: '#111827',
                                fontWeight: '500',
                                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace'
                              }}>
                                {formatDuration(log.duration)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Date */}
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#9ca3af',
                          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace'
                        }}>
                          {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                      <button
                        onClick={() => handleViewLog(log)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '8px 16px',
                          backgroundColor: '#ffffff',
                          color: '#5b61eb',
                          border: '1px solid #e0e7ff',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f0f4ff'
                          e.currentTarget.style.borderColor = '#c7d2fe'
                          e.currentTarget.style.transform = 'translateY(-1px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#ffffff'
                          e.currentTarget.style.borderColor = '#e0e7ff'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        <span style={{ marginRight: '6px' }}>
                          <IconEye />
                        </span>
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedLog && (
        <div style={{
          position: 'fixed',
          inset: '0',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: '50',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '2rem',
            width: '100%',
            maxWidth: '56rem',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#111827'
              }}>
                Log Details
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                  e.currentTarget.style.color = '#374151'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#6b7280'
                }}
              >
                <IconClose />
              </button>
            </div>
            
            {/* Tabs */}
            <div style={{ 
              display: 'flex',
              borderBottom: '2px solid #f3f4f6',
              marginBottom: '2rem',
              gap: '1rem'
            }}>
              <button
                onClick={() => setActiveTab('summary')}
                style={{
                  padding: '0.75rem 0',
                  borderBottom: activeTab === 'summary' ? '2px solid #5b61eb' : '2px solid transparent',
                  color: activeTab === 'summary' ? '#5b61eb' : '#6b7280',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveTab('details')}
                style={{
                  padding: '0.75rem 0',
                  borderBottom: activeTab === 'details' ? '2px solid #5b61eb' : '2px solid transparent',
                  color: activeTab === 'details' ? '#5b61eb' : '#6b7280',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Full Details
              </button>
            </div>

            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <>
                {/* API Call to Provider Section */}
                {selectedLog.api_call && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <span style={{ 
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        marginRight: '8px'
                      }}></span>
                      API Call to {selectedLog.provider}
                    </h3>
                    
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1.5rem'
                    }}>
                      {/* Endpoint */}
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#374151',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.25rem',
                          display: 'block'
                        }}>
                          API Endpoint
                        </label>
                        <div style={{
                          fontSize: '0.875rem',
                          fontFamily: 'ui-monospace, monospace',
                          color: '#059669',
                          fontWeight: '500',
                          backgroundColor: '#ecfdf5',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #d1fae5'
                        }}>
                          {selectedLog.api_call.method} {selectedLog.api_call.provider_endpoint}
                        </div>
                      </div>

                      {/* Headers */}
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#374151',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.5rem',
                          display: 'block'
                        }}>
                          Headers Sent
                        </label>
                        <div style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          overflow: 'hidden'
                        }}>
                          <Editor
                            height="120px"
                            language="json"
                            value={JSON.stringify(selectedLog.api_call.headers_sent, null, 2)}
                            options={{
                              readOnly: true,
                              minimap: { enabled: false },
                              fontSize: 12,
                              wordWrap: 'off',
                              scrollBeyondLastLine: false,
                              fontFamily: 'ui-monospace, monospace',
                              lineNumbers: 'off',
                              folding: false,
                              padding: { top: 12, bottom: 12 }
                            }}
                          />
                        </div>
                      </div>

                      {/* Payload */}
                      <div>
                        <label style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#374151',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.5rem',
                          display: 'block'
                        }}>
                          Payload Sent to {selectedLog.provider}
                        </label>
                        <div style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          overflow: 'hidden'
                        }}>
                          <Editor
                            height="200px"
                            language="json"
                            value={JSON.stringify(selectedLog.api_call.payload_sent || selectedLog.api_call.attempted_payload, null, 2)}
                            options={{
                              readOnly: true,
                              minimap: { enabled: false },
                              fontSize: 12,
                              wordWrap: 'off',
                              scrollBeyondLastLine: false,
                              fontFamily: 'ui-monospace, monospace',
                              lineNumbers: 'off',
                              folding: true,
                              padding: { top: 12, bottom: 12 }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  {/* Left Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Original Prompt
                      </label>
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#111827',
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
                        lineHeight: '1.5',
                        maxHeight: '150px',
                        overflow: 'auto'
                      }}>
                        {selectedLog.request?.fullPrompt || selectedLog.prompt}
                      </div>
                    </div>
                    
                    {selectedLog.request_flow && (
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '0.5rem'
                        }}>
                          Request Flow
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}>
                            <span style={{ color: '#6b7280', minWidth: '60px' }}>Client</span>
                            <span style={{ margin: '0 8px', color: '#d1d5db' }}>→</span>
                            <span style={{ 
                              fontFamily: 'ui-monospace, monospace',
                              backgroundColor: '#f3f4f6',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {selectedLog.request_flow.client_to_easyai}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}>
                            <span style={{ color: '#6b7280', minWidth: '60px' }}>EasyAI</span>
                            <span style={{ margin: '0 8px', color: '#d1d5db' }}>→</span>
                            <span style={{ 
                              fontFamily: 'ui-monospace, monospace',
                              backgroundColor: '#ecfdf5',
                              color: '#065f46',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {selectedLog.request_flow.easyai_to_provider.split('/').slice(-2).join('/')}
                            </span>
                          </div>
                          <div style={{ 
                            fontSize: '0.75rem',
                            color: '#9ca3af',
                            marginTop: '0.25rem'
                          }}>
                            Total hops: {selectedLog.request_flow.total_hops}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Model & Provider
                      </label>
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#111827',
                        fontWeight: '500'
                      }}>
                        {selectedLog.model}
                        {selectedLog.provider && (
                          <span style={{ 
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginLeft: '8px',
                            backgroundColor: '#f3f4f6',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            {selectedLog.provider}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Status
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: selectedLog.success ? '#22c55e' : '#ef4444',
                          marginRight: '8px'
                        }}></div>
                        <span style={{
                          fontSize: '0.875rem',
                          color: '#111827',
                          fontWeight: '500'
                        }}>
                          {selectedLog.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Performance
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Tokens</div>
                          <div style={{
                            fontSize: '0.875rem',
                            color: '#111827',
                            fontWeight: '500',
                            fontFamily: 'ui-monospace, monospace'
                          }}>
                            {selectedLog.tokens ? selectedLog.tokens.toLocaleString() : '-'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Cost</div>
                          <div style={{
                            fontSize: '0.875rem',
                            color: '#111827',
                            fontWeight: '500',
                            fontFamily: 'ui-monospace, monospace'
                          }}>
                            ${selectedLog.cost ? selectedLog.cost.toFixed(4) : '0.0000'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Duration</div>
                          <div style={{
                            fontSize: '0.875rem',
                            color: '#111827',
                            fontWeight: '500',
                            fontFamily: 'ui-monospace, monospace'
                          }}>
                            {formatDuration(selectedLog.duration)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Speed</div>
                          <div style={{
                            fontSize: '0.875rem',
                            color: '#111827',
                            fontWeight: '500',
                            fontFamily: 'ui-monospace, monospace'
                          }}>
                            {selectedLog.performance?.tokensPerSecond || selectedLog.response_full?.tokensPerSecond ? 
                              `${selectedLog.performance?.tokensPerSecond || selectedLog.response_full?.tokensPerSecond} t/s` : '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Response */}
                {selectedLog.response && (
                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.75rem'
                    }}>
                      Response
                    </label>
                    <div style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#f8fafc'
                    }}>
                      <Editor
                        height="400px"
                        language="text"
                        value={selectedLog.response_full?.content || selectedLog.response}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          fontSize: 13,
                          wordWrap: 'on',
                          scrollBeyondLastLine: false,
                          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
                          lineHeight: 1.5,
                          padding: { top: 16, bottom: 16 }
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Full Details Tab */}
            {activeTab === 'details' && (
              <div style={{ marginBottom: '2rem' }}>
                {selectedLog.id && selectedLog.endpoint ? (
                  // New format with full details
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <h3 style={{ 
                        fontSize: '1rem', 
                        fontWeight: '600', 
                        color: '#111827',
                        marginBottom: '0.5rem'
                      }}>
                        Complete Request/Response Data
                      </h3>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: '#6b7280',
                        marginBottom: '1rem'
                      }}>
                        Full detailed logging information including endpoint, headers, and performance metrics.
                      </p>
                    </div>
                    <div style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#f8fafc'
                    }}>
                      <Editor
                        height="600px"
                        language="json"
                        value={JSON.stringify({
                          id: selectedLog.id,
                          timestamp: selectedLog.timestamp,
                          endpoint: selectedLog.endpoint,
                          method: selectedLog.method,
                          request: selectedLog.request,
                          response_full: selectedLog.response_full,
                          performance: selectedLog.performance,
                          provider: selectedLog.provider,
                          api_endpoint: selectedLog.api_endpoint,
                          user_agent: selectedLog.user_agent,
                          ip_address: selectedLog.ip_address,
                          session_id: selectedLog.session_id
                        }, null, 2)}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          fontSize: 12,
                          wordWrap: 'off',
                          scrollBeyondLastLine: false,
                          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
                          lineHeight: 1.5,
                          padding: { top: 16, bottom: 16 },
                          folding: true,
                          foldingHighlight: true
                        }}
                      />
                    </div>
                  </>
                ) : (
                  // Old format - limited data available
                  <>
                    <div style={{ 
                      textAlign: 'center',
                      padding: '3rem 2rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: '#fbbf24',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        color: '#ffffff'
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                      </div>
                      <h3 style={{ 
                        fontSize: '1.125rem', 
                        fontWeight: '600', 
                        color: '#111827',
                        marginBottom: '0.5rem'
                      }}>
                        Limited Details Available
                      </h3>
                      <p style={{ 
                        color: '#6b7280', 
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        lineHeight: '1.5'
                      }}>
                        This log entry was created before enhanced logging was enabled. Only basic information is available.
                      </p>
                      
                      {/* Show available basic data */}
                      <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        padding: '1.5rem',
                        textAlign: 'left'
                      }}>
                        <h4 style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '1rem'
                        }}>
                          Available Basic Information:
                        </h4>
                        <div style={{
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid #e5e7eb',
                          backgroundColor: '#f8fafc'
                        }}>
                          <Editor
                            height="300px"
                            language="json"
                            value={JSON.stringify({
                              timestamp: selectedLog.timestamp,
                              prompt: selectedLog.prompt,
                              model: selectedLog.model,
                              tokens: selectedLog.tokens,
                              cost: selectedLog.cost,
                              duration: selectedLog.duration,
                              success: selectedLog.success,
                              response: selectedLog.response
                            }, null, 2)}
                            options={{
                              readOnly: true,
                              minimap: { enabled: false },
                              fontSize: 12,
                              wordWrap: 'off',
                              scrollBeyondLastLine: false,
                              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
                              lineHeight: 1.5,
                              padding: { top: 16, bottom: 16 }
                            }}
                          />
                        </div>
                      </div>
                      
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: '#9ca3af',
                        marginTop: '1.5rem'
                      }}>
                        New requests will include detailed information like endpoint URLs, headers, performance metrics, and more.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#5b61eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(91,97,235,0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4f46e5'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(91,97,235,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#5b61eb'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(91,97,235,0.2)'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={closeSearch}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        placeholder="Search logs by prompt, model, or response..."
      >
        <div style={{ padding: '1rem' }}>
          {searchQuery && (
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginBottom: '1rem'
            }}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
            </div>
          )}
          
          {searchResults.length === 0 && searchQuery ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#9ca3af'
            }}>
              <div style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No results found</div>
              <div style={{ fontSize: '0.875rem' }}>Try searching for different terms</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {searchResults.slice(0, 10).map((log, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedLog(log)
                    setShowModal(true)
                    closeSearch()
                  }}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                    e.currentTarget.style.borderColor = '#e5e7eb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.borderColor = '#f3f4f6'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    {log.success && (
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#22c55e',
                        marginRight: '0.75rem'
                      }}></div>
                    )}
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#111827',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {log.prompt}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      backgroundColor: '#f3f4f6',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontFamily: 'ui-monospace, monospace'
                    }}>
                      {log.model}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#9ca3af',
                    fontFamily: 'ui-monospace, monospace'
                  }}>
                    {new Date(log.timestamp).toLocaleDateString()} • {log.tokens} tokens • ${log.cost.toFixed(4)}
                  </div>
                </div>
              ))}
              
              {searchResults.length > 10 && (
                <div style={{
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  padding: '0.5rem'
                }}>
                  Showing first 10 results of {searchResults.length}
                </div>
              )}
            </div>
          )}
        </div>
      </SearchModal>
    </div>
  )
}

export default Logs