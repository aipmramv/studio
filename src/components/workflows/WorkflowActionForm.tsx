'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { WorkflowInstance, WorkflowStep } from '@/types/workflow'
import { toast } from 'sonner'

interface WorkflowActionFormProps {
  workflow: WorkflowInstance
  currentStep: WorkflowStep
  onActionComplete: (workflow: WorkflowInstance) => void
  onCancel: () => void
}

interface ActionFormData {
  action: 'approve' | 'reject' | 'comment' | 'delegate' | 'request_info'
  comment: string
  delegateTo?: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
}

export function WorkflowActionForm({ 
  workflow, 
  currentStep, 
  onActionComplete, 
  onCancel 
}: WorkflowActionFormProps) {
  const [formData, setFormData] = useState<ActionFormData>({
    action: 'approve',
    comment: '',
    delegateTo: '',
    priority: workflow.priority as 'low' | 'medium' | 'high',
    dueDate: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableUsers, setAvailableUsers] = useState<string[]>([])

  // Load available users for delegation
  React.useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/users?role=spoc,admin')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setAvailableUsers(data.data.users.map((u: any) => u.id))
          }
        }
      } catch (error) {
        console.error('Failed to load users:', error)
      }
    }
    
    if (formData.action === 'delegate') {
      loadUsers()
    }
  }, [formData.action])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.comment.trim() && ['reject', 'request_info'].includes(formData.action)) {
      setError('Comment is required for this action')
      return
    }

    if (formData.action === 'delegate' && !formData.delegateTo) {
      setError('Please select a user to delegate to')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/workflows/${workflow.id}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepId: currentStep.id,
          action: formData.action,
          comment: formData.comment.trim() || undefined,
          delegateTo: formData.delegateTo || undefined,
          priority: formData.priority,
          dueDate: formData.dueDate || undefined
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${formData.action} workflow`)
      }

      if (result.success) {
        toast.success(`Workflow ${formData.action}d successfully`)
        onActionComplete(result.data.workflow)
      } else {
        throw new Error(result.message || `Failed to ${formData.action} workflow`)
      }
    } catch (error) {
      console.error(`Error ${formData.action}ing workflow:`, error)
      setError(error instanceof Error ? error.message : `Failed to ${formData.action} workflow`)
    } finally {
      setSubmitting(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'reject':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-blue-600" />
      case 'delegate':
        return <Clock className="h-4 w-4 text-purple-600" />
      case 'request_info':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'approve':
        return 'Approve this workflow step and move to the next step'
      case 'reject':
        return 'Reject this workflow and stop the process'
      case 'comment':
        return 'Add a comment without changing the workflow status'
      case 'delegate':
        return 'Delegate this approval to another user'
      case 'request_info':
        return 'Request additional information from the requester'
      default:
        return ''
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getActionIcon(formData.action)}
          <span>Workflow Action</span>
        </CardTitle>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            <strong>Workflow:</strong> {workflow.name}
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Current Step:</strong> {currentStep.name}
          </p>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {workflow.category.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge variant={workflow.priority === 'high' ? 'destructive' : 'default'}>
              {workflow.priority.toUpperCase()} Priority
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Action Selection */}
          <div className="space-y-2">
            <Label htmlFor="action">Action *</Label>
            <Select
              value={formData.action}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, action: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approve">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Approve</span>
                  </div>
                </SelectItem>
                <SelectItem value="reject">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>Reject</span>
                  </div>
                </SelectItem>
                <SelectItem value="comment">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span>Add Comment</span>
                  </div>
                </SelectItem>
                <SelectItem value="delegate">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span>Delegate</span>
                  </div>
                </SelectItem>
                <SelectItem value="request_info">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span>Request Information</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {getActionDescription(formData.action)}
            </p>
          </div>

          {/* Delegation User Selection */}
          {formData.action === 'delegate' && (
            <div className="space-y-2">
              <Label htmlFor="delegateTo">Delegate To *</Label>
              <Select
                value={formData.delegateTo}
                onValueChange={(value) => setFormData(prev => ({ ...prev, delegateTo: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user to delegate to" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((userId) => (
                    <SelectItem key={userId} value={userId}>
                      {userId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Priority Selection for Delegation */}
          {formData.action === 'delegate' && (
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Due Date for Delegation */}
          {formData.action === 'delegate' && (
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <input
                type="datetime-local"
                id="dueDate"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          )}

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">
              Comment {['reject', 'request_info'].includes(formData.action) && '*'}
            </Label>
            <Textarea
              id="comment"
              placeholder={
                formData.action === 'approve' ? 'Add an optional comment about your approval...' :
                formData.action === 'reject' ? 'Please explain why you are rejecting this workflow...' :
                formData.action === 'request_info' ? 'What additional information do you need?' :
                formData.action === 'delegate' ? 'Add instructions for the delegated user...' :
                'Add your comment...'
              }
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              rows={4}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              {formData.comment.length}/500 characters
            </p>
          </div>

          {/* Context Information */}
          {workflow.contextData && (
            <div className="space-y-2">
              <Label>Related Information</Label>
              <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                {Object.entries(workflow.contextData).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className={
                formData.action === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                formData.action === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                ''
              }
            >
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {getActionIcon(formData.action)}
              <span className="ml-2 capitalize">{formData.action}</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}