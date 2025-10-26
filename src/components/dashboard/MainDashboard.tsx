'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown,
  Package,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Download,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

interface DashboardKPI {
  id: string
  title: string
  value: string | number
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: React.ReactNode
  description: string
  trend?: number[]
}

interface ChartData {
  id: string
  title: string
  type: 'bar' | 'line' | 'pie' | 'area'
  data: any[]
  config?: Record<string, any>
}

interface DashboardData {
  kpis: DashboardKPI[]
  charts: ChartData[]
  recentActivity: ActivityItem[]
  alerts: AlertItem[]
}

interface ActivityItem {
  id: string
  type: 'asset_created' | 'asset_transferred' | 'workflow_completed' | 'verification_completed'
  title: string
  description: string
  timestamp: Date
  user: string
  metadata?: Record<string, any>
}

interface AlertItem {
  id: string
  type: 'warning' | 'error' | 'info'
  title: string
  description: string
  timestamp: Date
  actionRequired: boolean
  actionUrl?: string
}

export function MainDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [timeRange, setTimeRange] = useState('7d')

  const { user } = useAuth()

  useEffect(() => {
    loadDashboardData()
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [timeRange])

  const loadDashboardData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const response = await fetch(`/api/dashboard/analytics?type=all&timeRange=${timeRange}`)
      
      if (!response.ok) {
        throw new Error('Failed to load dashboard data')
      }

      const data = await response.json()
      
      if (data.success) {
        setDashboardData(transformDashboardData(data.data))
      } else {
        throw new Error(data.message || 'Failed to load dashboard data')
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const transformDashboardData = (rawData: any): DashboardData => {
    // Transform raw API data into dashboard format
    const kpis: DashboardKPI[] = [
      {
        id: 'total_assets',
        title: 'Total Assets',
        value: rawData.kpis?.totalAssets || 0,
        change: rawData.kpis?.assetsChange || 0,
        changeType: (rawData.kpis?.assetsChange || 0) >= 0 ? 'increase' : 'decrease',
        icon: <Package className="h-4 w-4" />,
        description: 'Total number of assets in the system',
        trend: rawData.trends?.assets || []
      },
      {
        id: 'active_workflows',
        title: 'Active Workflows',
        value: rawData.kpis?.activeWorkflows || 0,
        change: rawData.kpis?.workflowsChange || 0,
        changeType: (rawData.kpis?.workflowsChange || 0) >= 0 ? 'increase' : 'decrease',
        icon: <Activity className="h-4 w-4" />,
        description: 'Workflows currently in progress',
        trend: rawData.trends?.workflows || []
      },
      {
        id: 'pending_approvals',
        title: 'Pending Approvals',
        value: rawData.kpis?.pendingApprovals || 0,
        change: rawData.kpis?.approvalsChange || 0,
        changeType: (rawData.kpis?.approvalsChange || 0) <= 0 ? 'increase' : 'decrease',
        icon: <Clock className="h-4 w-4" />,
        description: 'Approvals waiting for action',
        trend: rawData.trends?.approvals || []
      },
      {
        id: 'verified_assets',
        title: 'Verified Assets',
        value: `${rawData.kpis?.verificationRate || 0}%`,
        change: rawData.kpis?.verificationChange || 0,
        changeType: (rawData.kpis?.verificationChange || 0) >= 0 ? 'increase' : 'decrease',
        icon: <CheckCircle className="h-4 w-4" />,
        description: 'Percentage of assets verified',
        trend: rawData.trends?.verification || []
      },
      {
        id: 'asset_value',
        title: 'Total Asset Value',
        value: `₹${(rawData.kpis?.totalValue || 0).toLocaleString()}`,
        change: rawData.kpis?.valueChange || 0,
        changeType: (rawData.kpis?.valueChange || 0) >= 0 ? 'increase' : 'decrease',
        icon: <DollarSign className="h-4 w-4" />,
        description: 'Total value of all assets',
        trend: rawData.trends?.value || []
      },
      {
        id: 'overdue_items',
        title: 'Overdue Items',
        value: rawData.kpis?.overdueItems || 0,
        change: rawData.kpis?.overdueChange || 0,
        changeType: (rawData.kpis?.overdueChange || 0) <= 0 ? 'increase' : 'decrease',
        icon: <AlertTriangle className="h-4 w-4" />,
        description: 'Items requiring immediate attention',
        trend: rawData.trends?.overdue || []
      }
    ]

    const charts: ChartData[] = rawData.charts || []
    const recentActivity: ActivityItem[] = rawData.recentActivity || []
    const alerts: AlertItem[] = rawData.alerts || []

    return { kpis, charts, recentActivity, alerts }
  }

  const handleRefresh = () => {
    loadDashboardData(true)
    toast.success('Dashboard refreshed')
  }

  const handleExportData = async () => {
    try {
      const response = await fetch(`/api/dashboard/export?timeRange=${timeRange}&format=excel`)
      
      if (!response.ok) {
        throw new Error('Failed to export dashboard data')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Dashboard data exported successfully')
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export dashboard data')
    }
  }

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-3 w-3 text-green-600" />
      case 'decrease':
        return <TrendingDown className="h-3 w-3 text-red-600" />
      default:
        return null
    }
  }

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600'
      case 'decrease':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatActivityTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'asset_created':
        return <Package className="h-4 w-4 text-blue-600" />
      case 'asset_transferred':
        return <Activity className="h-4 w-4 text-purple-600" />
      case 'workflow_completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'verification_completed':
        return <CheckCircle className="h-4 w-4 text-orange-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'info':
        return <Activity className="h-4 w-4 text-blue-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || 'User'}. Here's what's happening with your assets.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {dashboardData.kpis.map((kpi) => (
            <Card key={kpi.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {kpi.icon}
                    <div>
                      <p className="text-2xl font-bold">{kpi.value}</p>
                      <p className="text-xs text-muted-foreground">{kpi.title}</p>
                    </div>
                  </div>
                  {kpi.change !== 0 && (
                    <div className={`flex items-center space-x-1 ${getChangeColor(kpi.changeType)}`}>
                      {getChangeIcon(kpi.changeType)}
                      <span className="text-xs font-medium">
                        {Math.abs(kpi.change)}%
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{kpi.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <PieChart className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="mr-2 h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Alerts
            {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {dashboardData.alerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Assets by Department</span>
                    <Button variant="link" className="p-0 h-auto">
                      View Details
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {['Finance', 'IT', 'HR', 'Operations'].map((dept) => (
                      <div key={dept} className="flex items-center justify-between">
                        <span className="text-sm">{dept}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.random() * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {Math.floor(Math.random() * 100)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatActivityTime(activity.timestamp)} by {activity.user}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Asset Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  Interactive charts will be implemented with a charting library
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workflow Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  Workflow analytics charts will be displayed here
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{activity.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatActivityTime(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{activity.user}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No activity to display</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData?.alerts && dashboardData.alerts.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.alerts.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{alert.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatActivityTime(alert.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                        {alert.actionRequired && alert.actionUrl && (
                          <Button size="sm" variant="outline">
                            Take Action
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-lg font-medium">All Clear!</p>
                  <p className="text-muted-foreground">No alerts at the moment.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}