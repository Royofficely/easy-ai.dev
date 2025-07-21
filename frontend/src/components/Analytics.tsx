import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { AnalyticsData } from '../types'

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get('/api/analytics')
        setAnalytics(response.data)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const IconPhone = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
  )

  const IconHash = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9"></line>
      <line x1="4" y1="15" x2="20" y2="15"></line>
      <line x1="10" y1="3" x2="8" y2="21"></line>
      <line x1="16" y1="3" x2="14" y2="21"></line>
    </svg>
  )

  const IconCpu = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"></rect>
      <rect x="9" y="9" width="6" height="6"></rect>
      <line x1="9" y1="1" x2="9" y2="4"></line>
      <line x1="15" y1="1" x2="15" y2="4"></line>
      <line x1="9" y1="20" x2="9" y2="23"></line>
      <line x1="15" y1="20" x2="15" y2="23"></line>
      <line x1="20" y1="9" x2="23" y2="9"></line>
      <line x1="20" y1="14" x2="23" y2="14"></line>
      <line x1="1" y1="9" x2="4" y2="9"></line>
      <line x1="1" y1="14" x2="4" y2="14"></line>
    </svg>
  )

  const IconCheck = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,6 9,17 4,12"></polyline>
    </svg>
  )

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

  if (!analytics) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Failed to load analytics</div>
        </div>
      </div>
    )
  }

  const stats = [
    { 
      label: 'API Calls', 
      value: analytics.totalCalls.toLocaleString(),
      icon: <IconPhone />
    },
    { 
      label: 'Tokens Used', 
      value: analytics.totalTokens.toLocaleString(),
      icon: <IconHash />
    },
    { 
      label: 'Models', 
      value: Object.keys(analytics.modelUsage).length.toString(),
      icon: <IconCpu />
    },
    { 
      label: 'Success Rate', 
      value: '100%',
      icon: <IconCheck />
    }
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid #f3f4f6', padding: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>
            Analytics
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Overview of your AI usage and performance
          </p>
        </div>

        <div style={{ padding: '2rem' }}>
          {/* Stats Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '2rem', 
            marginBottom: '3rem' 
          }}>
            {stats.map((stat, index) => (
              <div 
                key={index} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '1px solid #f3f4f6',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  transform: 'translateY(0)',
                  animation: `slideUp 0.6s ease-out ${index * 0.1}s both`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(91,97,235,0.15)'
                  e.currentTarget.style.borderColor = '#e0e7ff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
                  e.currentTarget.style.borderColor = '#f3f4f6'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ 
                    color: '#5b61eb', 
                    marginRight: '0.75rem',
                    transform: 'scale(1)',
                    transition: 'transform 0.2s ease'
                  }}>
                    {stat.icon}
                  </div>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '500', 
                    color: '#6b7280', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.025em' 
                  }}>
                    {stat.label}
                  </span>
                </div>
                <div style={{ 
                  fontSize: '2rem', 
                  fontWeight: '700', 
                  color: '#111827',
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace'
                }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
            {/* Model Usage */}
            <div style={{
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid #f3f4f6',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              animation: 'slideUp 0.8s ease-out 0.3s both'
            }}>
              <h3 style={{ 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#111827', 
                marginBottom: '2rem',
                textTransform: 'uppercase',
                letterSpacing: '0.025em'
              }}>
                Model Distribution
              </h3>
              <div>
                {Object.entries(analytics.modelUsage)
                  .sort(([,a], [,b]) => b - a)
                  .map(([model, count], idx) => {
                    const percentage = (count / analytics.totalCalls) * 100
                    return (
                      <div key={model} style={{ 
                        marginBottom: '2rem',
                        animation: `slideUp 0.6s ease-out ${0.5 + idx * 0.1}s both`
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'baseline', 
                          marginBottom: '0.75rem' 
                        }}>
                          <span style={{ 
                            fontSize: '0.875rem', 
                            color: '#111827',
                            fontWeight: '500'
                          }}>{model}</span>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: '#6b7280',
                            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace'
                          }}>
                            {count} calls ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <div style={{ 
                          width: '100%', 
                          backgroundColor: '#f3f4f6', 
                          borderRadius: '9999px', 
                          height: '6px',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          <div 
                            style={{
                              backgroundColor: '#5b61eb',
                              height: '6px',
                              borderRadius: '9999px',
                              width: `${percentage}%`,
                              transition: 'width 2s cubic-bezier(0.4, 0, 0.2, 1)',
                              position: 'relative',
                              boxShadow: '0 0 10px rgba(91,97,235,0.3)'
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Performance Metrics */}
            <div style={{
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid #f3f4f6',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              animation: 'slideUp 0.8s ease-out 0.4s both'
            }}>
              <h3 style={{ 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#111827', 
                marginBottom: '2rem',
                textTransform: 'uppercase',
                letterSpacing: '0.025em'
              }}>
                Performance
              </h3>
              <div>
                {[
                  { 
                    label: 'Average tokens per call', 
                    value: analytics.totalCalls > 0 ? Math.round(analytics.totalTokens / analytics.totalCalls).toLocaleString() : '0'
                  },
                  { 
                    label: 'Most used model', 
                    value: Object.entries(analytics.modelUsage).length > 0 
                      ? Object.entries(analytics.modelUsage).reduce((a, b) => a[1] > b[1] ? a : b)[0]
                      : 'None'
                  },
                  { label: 'Success rate', value: '100%' },
                  { label: 'Last updated', value: new Date(analytics.lastUpdated).toLocaleString() }
                ].map((metric, idx) => (
                  <div 
                    key={metric.label}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '1.5rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      animation: `slideUp 0.5s ease-out ${0.6 + idx * 0.1}s both`,
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{metric.label}</span>
                    <span style={{ 
                      fontSize: idx === 3 ? '0.75rem' : '0.875rem', 
                      color: '#111827',
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
                      fontWeight: '600'
                    }}>
                      {metric.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics