'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Users,
  FileText,
  Calendar,
  Loader2
} from 'lucide-react'
import { WorkflowInstance } from '@/types/workflow'
import { usePermissions } from '@/hooks/usePermissions'

interface ApprovalStats {
  pendingApprovals: number
  completedToday: number
  overdue: number
  averageProcessingTime: number
  myPendingApprovals: number
  totalActiveWorkflows: number
}

interface PendingApproval {
  id: string
  workflowId: string
  workflowName: string
  category: string
  priority: string
  requestedBy: string
  requestedAt: Date
  daysWaiting: number
  contextData?: Record<string, any>
}

export function ApprovalDashboard() {
  const [stats, setStats] = useState<ApprovalStats | null>(null)
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  const [recentWorkflows, setRecentWorkflows] = useState<WorkflowInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const { user } = usePermissions()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load dashboard statistics
      const [statsRes, approvalsRes, workflowsRes] = await Promise.all([
        fetch('/api/approvals/dashboard'),
        fetch('/api/approvals?status=pending&assignedToMe=true'),
        fetch('/api/workflows?limit=10&sortField=startedAt&sortDirection=desc')
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        if (statsData.success) {
          setStats(statsData.data.stats)
        }
      }

      if (approvalsRes.ok) {
        const approvalsData = await approvalsRes.json()
        if (approvalsData.success) {
          setPendingApprovals(approvalsData.data.approvals || [])
        }
      }

      if (workflowsRes.ok) {
        const workflowsData = await workflowsRes.json()
        if (workflowsData.success) {
          setRecentWorkflows(workflowsData.data.workflows || [])
        }
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickApproval = async (approvalId: string, action: 'approve' | 'reject') => {
    try {
      const approval = pendingApprovals.find(a => a.id === approvalId)
      if (!approval) return

      const response = await fetch(`/api/workflows/${approval.workflowId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepId: approvalId,
          action,
          comment: `Quick ${action} from dashboard`
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} approval`)
      }

      const result = await response.json()
      if (result.success) {
        // Refresh dashboard data
        loadDashboardData()
      } else {
        throw new Error(result.message || `Failed to ${action} approval`)
      }
    } catch (error) {
      console.error(`Error ${action}ing approval:`, error)
      setError(error instanceof Error ? error.message : `Failed to ${action} approval`)
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getDaysWaitingColor = (days: number) => {
    if (days >= 7) return 'text-red-600'
    if (days >= 3) return 'text-yellow-600'
    return 'text-green-600'
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
      <div>
        <h1 className="text-2xl font-bold">Approval Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your pending approvals and track workflow progress
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.myPendingApprovals}</p>
                  <p className="text-xs text-muted-foreground">My Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.completedToday}</p>
                  <p className="text-xs text-muted-foreground">Completed Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.overdue}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.averageProcessingTime}h</p>
                  <p className="text-xs text-muted-foreground">Avg. Processing</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
                  <p className="text-xs text-muted-foreground">Total Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalActiveWorkflows}</p>
                  <p className="text-xs text-muted-foreground">Active Workflows</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Approvals
            {pendingApprovals.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingApprovals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['high', 'medium', 'low'].map((priority) => {
                    const count = pendingApprovals.filter(a => a.priority === priority).length
                    const percentage = pendingApprovals.length > 0 
                      ? Math.round((count / pendingApprovals.length) * 100) 
                      : 0
                    
                    return (
                      <div key={priority} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={getPriorityBadgeVariant(priority)}>
                            {priority.toUpperCase()}
                          </Badge>
                          <span className="text-sm">{count} items</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                priority === 'high' ? 'bg-red-600' :
                                priority === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground">{percentage}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from(new Set(pendingApprovals.map(a => a.category))).map((category) => {
                    const count = pendingApprovals.filter(a => a.category === category).length
                    const percentage = pendingApprovals.length > 0 
                      ? Math.round((count / pendingApprovals.length) * 100) 
                      : 0
                    
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {category.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-sm">{count} items</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground">{percentage}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-lg font-medium">All caught up!</p>
                  <p className="text-muted-foreground">No pending approvals at the moment.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((approval) => (
                    <div key={approval.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium">{approval.workflowName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Requested by {approval.requestedBy}
                          </p>
                          {approval.contextData && (
                            <p className="text-sm text-muted-foreground">
                              {approval.contextData.assetNumber || approval.contextData.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getPriorityBadgeVariant(approval.priority)}>
                            {approval.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {approval.category.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(approval.requestedAt)}</span>
                          </div>
                          <div className={`flex items-center space-x-1 ${getDaysWaitingColor(approval.daysWaiting)}`}>
                            <Clock className="h-4 w-4" />
                            <span>{approval.daysWaiting} days waiting</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleQuickApproval(approval.id, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleQuickApproval(approval.id, 'reject')}
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Navigate to workflow details
                              window.location.href = `/workflows/${approval.workflowId}`
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Workflow Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentWorkflows.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {recentWorkflows.map((workflow) => (
                    <div key={workflow.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <h4 className="font-medium">{workflow.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {workflow.category.replace('_', ' ').toUpperCase()} • Started {formatDate(workflow.startedAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={workflow.status === 'completed' ? 'default' : 'outline'}>
                          {workflow.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            window.location.href = `/workflows/${workflow.id}`
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}