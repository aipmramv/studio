'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  MessageSquare,
  ArrowRight,
  Play,
  Pause,
  AlertCircle,
  FileText,
  History,
  Loader2
} from 'lucide-react'
import { WorkflowInstance, WorkflowStep, WorkflowAction } from '@/types/workflow'
import { usePermissions } from '@/hooks/usePermissions'
import { toast } from 'sonner'

interface WorkflowDetailsProps {
  workflowId: string
  onClose: () => void
  onWorkflowUpdated?: (workflow: WorkflowInstance) => void
}

export function WorkflowDetails({ workflowId, onClose, onWorkflowUpdated }: WorkflowDetailsProps) {
  const [workflow, setWorkflow] = useState<WorkflowInstance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('details')
  const [actionComment, setActionComment] = useState('')
  const [submittingAction, setSubmittingAction] = useState<string | null>(null)

  const { canApprove, user } = usePermissions()

  useEffect(() => {
    loadWorkflowDetails()
  }, [workflowId])

  const loadWorkflowDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/workflows/${workflowId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load workflow details')
      }

      const data = await response.json()
      
      if (data.success) {
        setWorkflow(data.data.workflow)
      } else {
        throw new Error(data.message || 'Failed to load workflow')
      }
    } catch (error) {
      console.error('Error loading workflow details:', error)
      setError(error instanceof Error ? error.message : 'Failed to load workflow details')
    } finally {
      setLoading(false)
    }
  }

  const handleWorkflowAction = async (action: 'approve' | 'reject' | 'comment') => {
    if (!workflow || !workflow.currentStepId) return

    try {
      setSubmittingAction(action)
      setError(null)

      const response = await fetch(`/api/workflows/${workflowId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepId: workflow.currentStepId,
          action,
          comment: actionComment.trim() || undefined
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${action} workflow`)
      }

      if (result.success) {
        toast.success(`Workflow ${action}d successfully`)
        setActionComment('')
        
        // Reload workflow details
        await loadWorkflowDetails()
        
        // Notify parent component
        if (onWorkflowUpdated && result.data.workflow) {
          onWorkflowUpdated(result.data.workflow)
        }
      } else {
        throw new Error(result.message || `Failed to ${action} workflow`)
      }
    } catch (error) {
      console.error(`Error ${action}ing workflow:`, error)
      setError(error instanceof Error ? error.message : `Failed to ${action} workflow`)
      toast.error(error instanceof Error ? error.message : `Failed to ${action} workflow`)
    } finally {
      setSubmittingAction(null)
    }
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

  const getStepStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
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

  const canUserActOnCurrentStep = () => {
    if (!workflow || !workflow.currentStepId || !user) return false
    
    const currentStep = workflow.steps?.find(step => step.id === workflow.currentStepId)
    if (!currentStep) return false

    // Check if user is assigned to this step
    return currentStep.assignedTo?.includes(user.id) || false
  }

  const getWorkflowProgress = () => {
    if (!workflow?.steps || workflow.steps.length === 0) return 0
    const completedSteps = workflow.steps.filter(step => step.status === 'completed').length
    return Math.round((completedSteps / workflow.steps.length) * 100)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading workflow details...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={onClose} variant="outline">
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!workflow) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>Workflow not found</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={onClose} variant="outline">
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{workflow.name}</h1>
          <p className="text-lg text-muted-foreground">
            {workflow.category.replace('_', ' ').toUpperCase()}
          </p>
          <div className="flex items-center space-x-4 mt-2">
            <Badge variant={getStatusBadgeVariant(workflow.status)}>
              {workflow.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge variant="outline">
              {workflow.priority.toUpperCase()} Priority
            </Badge>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Progress: {getWorkflowProgress()}%</span>
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${getWorkflowProgress()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onClose}>
            Back
          </Button>
        </div>
      </div>

      {/* Action Panel - Show if user can act on current step */}
      {canUserActOnCurrentStep() && workflow.status === 'active' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Action Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-blue-700">
              This workflow is waiting for your approval on the current step.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="actionComment">Comment (optional)</Label>
              <Textarea
                id="actionComment"
                placeholder="Add a comment about your decision..."
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={() => handleWorkflowAction('approve')}
                disabled={submittingAction !== null}
                className="bg-green-600 hover:bg-green-700"
              >
                {submittingAction === 'approve' && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                onClick={() => handleWorkflowAction('reject')}
                disabled={submittingAction !== null}
                variant="destructive"
              >
                {submittingAction === 'reject' && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={() => handleWorkflowAction('comment')}
                disabled={submittingAction !== null}
                variant="outline"
              >
                {submittingAction === 'comment' && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <MessageSquare className="mr-2 h-4 w-4" />
                Add Comment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">
            <FileText className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="steps">
            <ArrowRight className="mr-2 h-4 w-4" />
            Steps
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Workflow Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID</label>
                    <p className="font-mono text-sm">{workflow.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Template</label>
                    <p>{workflow.templateId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <p>{workflow.category.replace('_', ' ').toUpperCase()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Priority</label>
                    <Badge variant={workflow.priority === 'high' ? 'destructive' : 'default'}>
                      {workflow.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p>{workflow.name}</p>
                </div>
              </CardContent>
            </Card>

            {/* Context Information */}
            <Card>
              <CardHeader>
                <CardTitle>Context Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Context Type</label>
                    <p className="font-medium">{workflow.contextType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Context ID</label>
                    <p className="font-mono text-sm">{workflow.contextId}</p>
                  </div>
                  {workflow.contextData && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Context Data</label>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        {Object.entries(workflow.contextData).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="font-medium">{key}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Started</label>
                    <p>{formatDate(workflow.startedAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Completed</label>
                    <p>{formatDate(workflow.completedAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created By</label>
                    <p>{workflow.createdBy}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Current Step</label>
                    <p>
                      {workflow.currentStepOrder ? `Step ${workflow.currentStepOrder}` : 'Completed'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="steps">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Steps</CardTitle>
            </CardHeader>
            <CardContent>
              {workflow.steps && workflow.steps.length > 0 ? (
                <div className="space-y-4">
                  {workflow.steps
                    .sort((a, b) => a.order - b.order)
                    .map((step, index) => (
                      <div key={step.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0">
                          {getStepStatusIcon(step.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">
                              Step {step.order}: {step.name}
                            </h4>
                            <Badge variant={getStatusBadgeVariant(step.status)}>
                              {step.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {step.description || 'No description available'}
                          </p>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Type:</span> {step.type}
                            </div>
                            <div>
                              <span className="font-medium">Required:</span> {step.isRequired ? 'Yes' : 'No'}
                            </div>
                            <div>
                              <span className="font-medium">Started:</span> {formatDate(step.startedAt)}
                            </div>
                            <div>
                              <span className="font-medium">Completed:</span> {formatDate(step.completedAt)}
                            </div>
                          </div>

                          {step.assignedTo && step.assignedTo.length > 0 && (
                            <div className="mt-2">
                              <span className="text-sm font-medium">Assigned to:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {step.assignedTo.map((assignee) => (
                                  <Badge key={assignee} variant="outline" className="text-xs">
                                    <User className="mr-1 h-3 w-3" />
                                    {assignee}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {step.actions && step.actions.length > 0 && (
                            <div className="mt-3">
                              <span className="text-sm font-medium">Actions:</span>
                              <div className="mt-1 space-y-2">
                                {step.actions.map((action, actionIndex) => (
                                  <div key={actionIndex} className="bg-gray-50 p-2 rounded text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">
                                        {action.action.toUpperCase()}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {formatDate(action.performedAt)}
                                      </span>
                                    </div>
                                    <div className="text-muted-foreground">
                                      by {action.performedBy}
                                    </div>
                                    {action.comment && (
                                      <div className="mt-1">
                                        <MessageSquare className="inline h-3 w-3 mr-1" />
                                        {action.comment}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No steps available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Workflow History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Workflow history will be implemented in the next iteration
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}