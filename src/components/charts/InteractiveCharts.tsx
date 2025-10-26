'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Activity,
  RefreshCw,
  Download,
  Maximize2
} from 'lucide-react'

interface ChartData {
  id: string
  title: string
  type: 'bar' | 'line' | 'pie' | 'area' | 'donut'
  data: any[]
  config?: {
    xAxis?: string
    yAxis?: string
    colorScheme?: string[]
    showLegend?: boolean
    showGrid?: boolean
    animate?: boolean
  }
  insights?: {
    trend: 'up' | 'down' | 'stable'
    change: number
    summary: string
  }
}

interface InteractiveChartsProps {
  charts: ChartData[]
  onChartUpdate?: (chartId: string, timeRange: string) => void
  onExportChart?: (chartId: string, format: 'png' | 'svg' | 'pdf') => void
}

export function InteractiveCharts({ charts, onChartUpdate, onExportChart }: InteractiveChartsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d')
  const [expandedChart, setExpandedChart] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState<string | null>(null)

  const handleTimeRangeChange = (chartId: string, timeRange: string) => {
    setSelectedTimeRange(timeRange)
    onChartUpdate?.(chartId, timeRange)
  }

  const handleRefreshChart = async (chartId: string) => {
    setRefreshing(chartId)
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(null)
      onChartUpdate?.(chartId, selectedTimeRange)
    }, 1000)
  }

  const handleExportChart = (chartId: string, format: 'png' | 'svg' | 'pdf') => {
    onExportChart?.(chartId, format)
  }

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'bar':
        return <BarChart3 className="h-4 w-4" />
      case 'pie':
      case 'donut':
        return <PieChart className="h-4 w-4" />
      case 'line':
      case 'area':
        return <Activity className="h-4 w-4" />
      default:
        return <BarChart3 className="h-4 w-4" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />
      default:
        return null
    }
  }

  const renderSimpleBarChart = (data: any[], config?: any) => {
    const maxValue = Math.max(...data.map(d => d.value || 0))
    
    return (
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-20 text-sm text-right">{item.label}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
              <span className="absolute right-2 top-0 text-xs text-white font-medium leading-4">
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderSimplePieChart = (data: any[], config?: any) => {
    const total = data.reduce((sum, item) => sum + (item.value || 0), 0)
    const colors = config?.colorScheme || ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
    
    return (
      <div className="flex items-center justify-center space-x-8">
        {/* Simple pie representation using CSS */}
        <div className="relative w-32 h-32">
          <div className="w-full h-full rounded-full bg-gray-200 relative overflow-hidden">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100
              return (
                <div
                  key={index}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(${colors[index % colors.length]} 0% ${percentage}%, transparent ${percentage}% 100%)`,
                    transform: `rotate(${data.slice(0, index).reduce((sum, d) => sum + (d.value / total) * 360, 0)}deg)`
                  }}
                />
              )
            })}
          </div>
        </div>
        
        {/* Legend */}
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm">{item.label}</span>
              <span className="text-sm text-muted-foreground">
                ({Math.round((item.value / total) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderSimpleLineChart = (data: any[], config?: any) => {
    const maxValue = Math.max(...data.map(d => d.value || 0))
    const minValue = Math.min(...data.map(d => d.value || 0))
    const range = maxValue - minValue || 1
    
    return (
      <div className="relative h-40 bg-gray-50 rounded p-4">
        <svg className="w-full h-full" viewBox="0 0 400 120">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={i}
              x1="0"
              y1={i * 24}
              x2="400"
              y2={i * 24}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
          
          {/* Data line */}
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            points={data.map((item, index) => {
              const x = (index / (data.length - 1)) * 400
              const y = 120 - ((item.value - minValue) / range) * 120
              return `${x},${y}`
            }).join(' ')}
          />
          
          {/* Data points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 400
            const y = 120 - ((item.value - minValue) / range) * 120
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill="#3B82F6"
              />
            )
          })}
        </svg>
        
        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          {data.map((item, index) => (
            <span key={index}>{item.label}</span>
          ))}
        </div>
      </div>
    )
  }

  const renderChart = (chart: ChartData) => {
    switch (chart.type) {
      case 'bar':
        return renderSimpleBarChart(chart.data, chart.config)
      case 'pie':
      case 'donut':
        return renderSimplePieChart(chart.data, chart.config)
      case 'line':
      case 'area':
        return renderSimpleLineChart(chart.data, chart.config)
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Chart type "{chart.type}" not implemented
          </div>
        )
    }
  }

  if (!charts || charts.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium">No Charts Available</p>
        <p className="text-muted-foreground">Charts will appear here when data is available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {charts.map((chart) => (
          <Card key={chart.id} className={expandedChart === chart.id ? 'lg:col-span-2' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  {getChartIcon(chart.type)}
                  <span>{chart.title}</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {chart.insights && (
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(chart.insights.trend)}
                      <span className="text-sm font-medium">
                        {chart.insights.change > 0 ? '+' : ''}{chart.insights.change}%
                      </span>
                    </div>
                  )}
                  <Select
                    value={selectedTimeRange}
                    onValueChange={(value) => handleTimeRangeChange(chart.id, value)}
                  >
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1d">1D</SelectItem>
                      <SelectItem value="7d">7D</SelectItem>
                      <SelectItem value="30d">30D</SelectItem>
                      <SelectItem value="90d">90D</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRefreshChart(chart.id)}
                    disabled={refreshing === chart.id}
                  >
                    <RefreshCw className={`h-3 w-3 ${refreshing === chart.id ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedChart(expandedChart === chart.id ? null : chart.id)}
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {chart.insights && (
                <p className="text-sm text-muted-foreground">{chart.insights.summary}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className={expandedChart === chart.id ? 'h-96' : 'h-64'}>
                {renderChart(chart)}
              </div>
              
              {/* Chart Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <Badge variant="outline" className="text-xs">
                  {chart.type.toUpperCase()} CHART
                </Badge>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExportChart(chart.id, 'png')}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Sample chart data for demonstration
export const sampleChartData: ChartData[] = [
  {
    id: 'assets-by-department',
    title: 'Assets by Department',
    type: 'bar',
    data: [
      { label: 'Finance', value: 45 },
      { label: 'IT', value: 32 },
      { label: 'HR', value: 28 },
      { label: 'Operations', value: 51 },
      { label: 'Marketing', value: 19 }
    ],
    config: {
      colorScheme: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
    },
    insights: {
      trend: 'up',
      change: 12,
      summary: 'Asset count increased by 12% across all departments this month'
    }
  },
  {
    id: 'asset-status-distribution',
    title: 'Asset Status Distribution',
    type: 'pie',
    data: [
      { label: 'Active', value: 120 },
      { label: 'Inactive', value: 25 },
      { label: 'Under Maintenance', value: 8 },
      { label: 'Disposed', value: 12 }
    ],
    config: {
      colorScheme: ['#10B981', '#F59E0B', '#EF4444', '#6B7280']
    },
    insights: {
      trend: 'stable',
      change: 2,
      summary: 'Asset status distribution remains stable with 73% active assets'
    }
  },
  {
    id: 'monthly-asset-trends',
    title: 'Monthly Asset Trends',
    type: 'line',
    data: [
      { label: 'Jan', value: 145 },
      { label: 'Feb', value: 152 },
      { label: 'Mar', value: 148 },
      { label: 'Apr', value: 165 },
      { label: 'May', value: 171 },
      { label: 'Jun', value: 175 }
    ],
    config: {
      showGrid: true,
      animate: true
    },
    insights: {
      trend: 'up',
      change: 18,
      summary: 'Steady growth in asset count over the past 6 months'
    }
  },
  {
    id: 'verification-status',
    title: 'Verification Status',
    type: 'donut',
    data: [
      { label: 'Verified', value: 89 },
      { label: 'Pending', value: 34 },
      { label: 'Overdue', value: 12 },
      { label: 'Discrepancy', value: 5 }
    ],
    config: {
      colorScheme: ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
    },
    insights: {
      trend: 'down',
      change: -5,
      summary: 'Verification completion rate improved by 5% this quarter'
    }
  }
]