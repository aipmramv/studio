'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  ArrowUpDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  Loader2
} from 'lucide-react'
import { WorkflowInstance } from '@/types/workflow'
import { usePermissions } from '@/hooks/usePermissions'

interface WorkflowListProps {
  onViewWorkflow: (workflow: WorkflowInstance) => void
  onApproveWorkflow?: (workflow: WorkflowInstance) => void
  onRejectWorkflow?: (workflow: WorkflowInstance) => void
}

interface WorkflowFilters {
  search: string
  status: string
  category: string
  priority: string
  assignedToMe: boolean
}

export function WorkflowList({ onViewWorkflow, onApproveWorkflow, onRejectWorkflow }: WorkflowListProps) {
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<WorkflowFilters>({
    search: '',
    status: '',
    category: '',
    priority: '',
    assignedToMe: false
  })
  const [sortField, setSortField] = useState<keyof WorkflowInstance>('startedAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalWorkflows, setTotalWorkflows] = useState(0)

  const { canApprove, canManageWorkflows } = usePermissions()

  // Load workflows
  useEffect(() => {
    loadWorkflows()
  }, [filters, sortField, sortDirection, currentPage])

  const loadWorkflows = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortField: sortField.toString(),
        sortDirection,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '' && value !== false)
        )
      })

      const response = await fetch(`/api/workflows?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to load workflows')
      }

      const data = await response.json()
      
      if (data.success) {
        setWorkflows(data.data.workflows)
        setTotalPages(data.data.totalPages)
        setTotalWorkflows(data.data.total)
      } else {
        throw new Error(data.message || 'Failed to load workflows')
      }
    } catch (error) {
      console.error('Error loading workflows:', error)
      setError(error instanceof Error ? error.message : 'Failed to load workflows')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: keyof WorkflowInstance) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleFilterChange = (key: keyof WorkflowFilters, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      category: '',
      priority: '',
      assignedToMe: false
    })
    setCurrentPage(1)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'in_progress':
        return 'default'
      case 'completed':
        return 'default'
      case 'failed':
      case 'cancelled':
        return 'destructive'
      case 'paused':
        return 'secondary'
      case 'pending':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'in_progress':
        return <Play className="h-3 w-3" />
      case 'completed':
        return <CheckCircle className="h-3 w-3" />
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-3 w-3" />
      case 'paused':
        return <Pause className="h-3 w-3" />
      case 'pending':
        return <Clock className="h-3 w-3" />
      default:
        return <AlertCircle className="h-3 w-3" />
    }
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

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getWorkflowProgress = (workflow: WorkflowInstance) => {
    if (!workflow.steps || workflow.steps.length === 0) return 0
    const completedSteps = workflow.steps.filter(step => step.status === 'completed').length
    return Math.round((completedSteps / workflow.steps.length) * 100)
  }

  const handleQuickAction = async (workflow: WorkflowInstance, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/workflows/${workflow.id}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepId: workflow.currentStepId,
          action,
          comment: `Quick ${action} from workflow list`
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} workflow`)
      }

      const result = await response.json()
      if (result.success) {
        // Refresh the workflow list
        loadWorkflows()
        
        if (action === 'approve' && onApproveWorkflow) {
          onApproveWorkflow(workflow)
        } else if (action === 'reject' && onRejectWorkflow) {
          onRejectWorkflow(workflow)
        }
      } else {
        throw new Error(result.message || `Failed to ${action} workflow`)
      }
    } catch (error) {
      console.error(`Error ${action}ing workflow:`, error)
      setError(error instanceof Error ? error.message : `Failed to ${action} workflow`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">
            Manage and track workflow approvals and processes
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search workflows..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={filters.category}
                onValueChange={(value) => handleFilterChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  <SelectItem value="asset_transfer">Asset Transfer</SelectItem>
                  <SelectItem value="asset_disposal">Asset Disposal</SelectItem>
                  <SelectItem value="purchase_approval">Purchase Approval</SelectItem>
                  <SelectItem value="maintenance_request">Maintenance Request</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={filters.priority}
                onValueChange={(value) => handleFilterChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assignment</label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="assignedToMe"
                  checked={filters.assignedToMe}
                  onChange={(e) => handleFilterChange('assignedToMe', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="assignedToMe" className="text-sm">
                  Assigned to me
                </label>
              </div>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Workflows Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Workflows ({totalWorkflows} total)
            </CardTitle>
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('name')}
                      className="h-auto p-0 font-semibold"
                    >
                      Workflow
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Current Step</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('startedAt')}
                      className="h-auto p-0 font-semibold"
                    >
                      Started
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p className="mt-2 text-muted-foreground">Loading workflows...</p>
                    </TableCell>
                  </TableRow>
                ) : workflows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">No workflows found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  workflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{workflow.name}</p>
                          {workflow.contextData && (
                            <p className="text-sm text-muted-foreground">
                              {workflow.contextData.assetNumber || workflow.contextId}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {workflow.category.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(workflow.status)}
                          <Badge variant={getStatusBadgeVariant(workflow.status)}>
                            {workflow.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(workflow.priority)}>
                          {workflow.priority.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${getWorkflowProgress(workflow)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {getWorkflowProgress(workflow)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {workflow.currentStepId ? (
                          <div>
                            <p className="text-sm font-medium">
                              Step {workflow.currentStepOrder}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {workflow.steps?.find(s => s.id === workflow.currentStepId)?.name}
                            </p>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(workflow.startedAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewWorkflow(workflow)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {canApprove('workflows') && workflow.status === 'active' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => handleQuickAction(workflow, 'approve')}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Quick Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleQuickAction(workflow, 'reject')}
                                  className="text-red-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Quick Reject
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}