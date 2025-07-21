'use client'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import axios from 'axios'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
)

interface AnalyticsData {
  totalCalls: number
  totalTokens: number
  modelUsage: Record<string, number>
  lastUpdated: string
}

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease'
  icon: React.ElementType
  description?: string
}

function MetricCard({ title, value, change, changeType, icon: Icon, description }: MetricCardProps) {
  return (
    <div className="metric-card group">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">{title}</span>
        </div>
        
        <div className="space-y-2">
          <div className="text-2xl font-medium text-gray-900">{value}</div>
          {description && (
            <div className="text-xs text-gray-400">{description}</div>
          )}
        </div>

        {change !== undefined && (
          <div className="flex items-center gap-1.5 text-xs">
            {changeType === 'increase' ? (
              <ArrowUpIcon className="w-3 h-3 text-gray-400" />
            ) : (
              <ArrowDownIcon className="w-3 h-3 text-gray-400" />
            )}
            <span className="text-gray-400">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d')

  useEffect(() => {
    fetchAnalytics()
    fetchRecentLogs()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/analytics')
      setAnalytics(response.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const fetchRecentLogs = async () => {
    try {
      const response = await axios.get('/api/logs?limit=100')
      setLogs(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-8 space-y-4">
              <div className="loading-pulse h-3 w-16"></div>
              <div className="loading-pulse h-6 w-12"></div>
              <div className="loading-pulse h-2 w-20"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const calculateTotalCost = () => {
    return logs.reduce((total, log) => total + (log.cost || 0), 0)
  }

  const calculateSuccessRate = () => {
    if (logs.length === 0) return 0
    return Math.round((logs.filter(log => log.success).length / logs.length) * 100)
  }

  const callsOverTime = () => {
    const days = 7
    const timeRange = Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))
      return date.toISOString().split('T')[0]
    })

    const callsByDay = timeRange.map(date => {
      return logs.filter(log => log.timestamp?.startsWith(date)).length
    })

    return {
      labels: timeRange.map(date => new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' })),
      datasets: [
        {
          data: callsByDay,
          borderColor: '#737373',
          backgroundColor: 'transparent',
          tension: 0.3,
          borderWidth: 1,
          pointRadius: 0,
          pointHoverRadius: 3,
          pointBackgroundColor: '#737373',
        },
      ],
    }
  }

  const modelUsageData = {
    labels: Object.keys(analytics?.modelUsage || {}),
    datasets: [
      {
        data: Object.values(analytics?.modelUsage || {}),
        backgroundColor: [
          '#d6d6d6',
          '#a3a3a3',
          '#737373',
          '#525252',
          '#404040',
        ],
        borderWidth: 0,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#404040',
        bodyColor: '#525252',
        borderColor: '#e8e8e8',
        borderWidth: 1,
        cornerRadius: 4,
        padding: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 16,
          usePointStyle: true,
          font: { size: 11 },
          color: '#737373',
        },
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#404040',
        bodyColor: '#525252',
        borderColor: '#e8e8e8',
        borderWidth: 1,
        cornerRadius: 4,
        padding: 8,
      },
    },
    cutout: '70%',
  }

  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl font-medium text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">API usage overview</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricCard
          title="API Calls"
          value={(analytics?.totalCalls || 0).toLocaleString()}
          change={12}
          changeType="increase"
          icon={ChartBarIcon}
          description="Total requests"
        />
        <MetricCard
          title="Tokens"
          value={(analytics?.totalTokens || 0).toLocaleString()}
          change={8}
          changeType="increase"
          icon={CpuChipIcon}
          description="Input + output"
        />
        <MetricCard
          title="Cost"
          value={`$${calculateTotalCost().toFixed(2)}`}
          change={5}
          changeType="decrease"
          icon={CurrencyDollarIcon}
          description="Total spending"
        />
        <MetricCard
          title="Success"
          value={`${calculateSuccessRate()}%`}
          change={2}
          changeType="increase"
          icon={CheckCircleIcon}
          description="Success rate"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="card p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-900">Usage Trend</h3>
            <p className="text-xs text-gray-500">Last 7 days</p>
          </div>
          <div className="chart-container">
            <Line data={callsOverTime()} options={chartOptions} />
          </div>
        </div>

        <div className="card p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-900">Model Usage</h3>
            <p className="text-xs text-gray-500">Distribution</p>
          </div>
          <div className="chart-container">
            {Object.keys(analytics?.modelUsage || {}).length > 0 ? (
              <Doughnut data={modelUsageData} options={doughnutOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-xs text-gray-400">No data available</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-8 space-y-6">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-gray-900">Recent Activity</h3>
          <p className="text-xs text-gray-500">Latest requests</p>
        </div>
        
        {logs.length > 0 ? (
          <div className="space-y-6">
            {logs.slice(0, 5).map((log, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-4">
                  <div className={`activity-dot ${log.success ? 'success' : 'error'}`} />
                  <div className="space-y-1">
                    <div className="text-sm text-gray-900 truncate max-w-xs">
                      {log.prompt || 'Untitled request'}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{log.model}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-xs text-gray-900">
                    {(log.tokens || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">
                    ${(log.cost || 0).toFixed(4)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="text-xs text-gray-400">No recent activity</span>
          </div>
        )}
      </div>
    </div>
  )
}
}