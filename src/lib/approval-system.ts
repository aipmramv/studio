import 'server-only'

import { MongoDBConnection, BaseMongoService } from './mongodb-service'
import { ObjectId, ClientSession } from '@/types/server-types'
import { WorkflowEngine } from './workflow-engine'
import {
  WorkflowInstance,
  WorkflowInstanceStep,
  WorkflowInstanceAction,
  WorkflowActionRequest,
  WorkflowNotification
} from '@/types/workflow'
import { JWTPayload } from '@/types/auth'

// Approval-specific types
export interface ApprovalRequest {
  workflowId: string
  stepId: string
  action: 'approve' | 'reject' | 'request_changes' | 'delegate'
  comment?: string
  reason?: string
  attachments?: Array<{
    filename: string
    url: string
    type: string
    size: number
  }>
  delegateTo?: string[]
  conditions?: Record<string, any>
}

export interface ApprovalResponse {
  success: boolean
  workflow: WorkflowInstance
  nextStep?: WorkflowInstanceStep
  notifications: WorkflowNotification[]
  message: string
}

export interface ApprovalTask {
  id: string
  workflowId: string
  stepId: string
  workflowName: string
  stepName: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo: string
  assignedAt: Date
  dueDate?: Date
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  contextType: string
  contextId: string
  contextData: Record<string, any>
  requiredActions: string[]
  formFields?: any[]
  attachments: any[]
  escalationLevel: number
  metadata: Record<string, any>
}

export interface ApprovalDashboard {
  pendingApprovals: ApprovalTask[]
  overdueApprovals: ApprovalTask[]
  recentActions: Array<{
    id: string
    workflowName: string
    action: string
    performedAt: Date
    performedBy: string
  }>
  statistics: {
    totalPending: number
    totalOverdue: number
    completedToday: number
    averageResponseTime: number
  }
  trends: {
    approvalRate: Array<{ date: string; approved: number; rejected: number }>
    responseTime: Array<{ date: string; averageHours: number }>
    workloadTrend: Array<{ date: string; pending: number; completed: number }>
  }
}

export interface EscalationRule {
  id: string
  workflowId: string
  stepId: string
  triggerAfterHours: number
  escalateTo: string[]
  action: 'notify' | 'reassign' | 'auto_approve' | 'auto_reject'
  message?: string
  isActive: boolean
  lastTriggered?: Date
}

export interface NotificationTemplate {
  id: string
  name: string
  type: 'assignment' | 'reminder' | 'escalation' | 'completion' | 'rejection'
  subject: string
  bodyTemplate: string
  channels: ('email' | 'in_app' | 'sms')[]
  variables: string[]
  isActive: boolean
}

/**
 * Approval Process System
 * Handles workflow approvals, notifications, and escalations
 */
export class ApprovalSystem extends BaseMongoService<any> {
  private workflowEngine: WorkflowEngine
  private approvalsCollection = 'approvalTasks'
  private escalationsCollection = 'escalationRules'
  private notificationsCollection = 'workflowNotifications'
  private templatesCollection = 'notificationTemplates'

  constructor(workflowEngine: WorkflowEngine) {
    super('approval_system')
    this.workflowEngine = workflowEngine
  }

  /**
   * Process approval action
   */
  async processApproval(
    request: ApprovalRequest,
    approver: JWTPayload,
    ipAddress?: string,
    userAgent?: string,
    session?: ClientSession
  ): Promise<ApprovalResponse> {
    try {
      await this.ensureConnection()

      // Validate approval request
      await this.validateApprovalRequest(request, approver)

      // Get workflow and step details
      const workflow = await this.workflowEngine.getWorkflow(request.workflowId, approver)
      const step = workflow.steps.find(s => s.id === request.stepId)

      if (!step) {
        throw new Error('Workflow step not found')
      }

      // Check if user can perform this action
      if (!this.canPerformApproval(step, approver, request.action)) {
        throw new Error('You are not authorized to perform this approval action')
      }

      // Handle delegation
      if (request.action === 'delegate' && request.delegateTo) {
        return await this.handleDelegation(request, approver, session)
      }

      // Create action request for workflow engine
      const actionRequest: WorkflowActionRequest = {
        action: request.action as 'approve' | 'reject' | 'reassign' | 'comment' | 'escalate' | 'complete' | 'skip',
        comment: request.comment,
        reason: request.reason,
        data: {
          attachments: request.attachments,
          conditions: request.conditions
        },
        reassignTo: request.delegateTo
      }

      // Perform action through workflow engine
      const result = await this.workflowEngine.performAction(
        request.workflowId,
        request.stepId,
        actionRequest,
        approver.id,
        ipAddress,
        userAgent,
        session
      )

      // Generate notifications
      const notifications = await this.generateApprovalNotifications(
        result.workflow,
        step,
        request.action,
        approver
      )

      // Send notifications
      await this.sendNotifications(notifications)

      // Update approval task status
      await this.updateApprovalTaskStatus(request.workflowId, request.stepId, request.action, approver.id)

      // Handle automatic advancement
      if (request.action === 'approve' && result.nextStep) {
        await this.handleAutomaticAdvancement(result.workflow, result.nextStep)
      }

      return {
        success: true,
        workflow: result.workflow,
        nextStep: result.nextStep,
        notifications,
        message: result.message
      }
    } catch (error) {
      this.handleError('processApproval', error)
    }
  }

  /**
   * Get approval tasks for a user
   */
  async getApprovalTasks(
    userId: string,
    filters: {
      status?: string[]
      priority?: string[]
      overdue?: boolean
      workflowCategory?: string[]
    } = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{
    tasks: ApprovalTask[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    try {
      await this.ensureConnection()

      // Build query for user's approval tasks
      const query: any = {
        assignedTo: userId,
        status: { $in: ['pending', 'in_progress'] }
      }

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query.status = { $in: filters.status }
      }

      if (filters.priority && filters.priority.length > 0) {
        query.priority = { $in: filters.priority }
      }

      if (filters.overdue) {
        query.dueDate = { $lt: new Date() }
        query.status = { $in: ['pending', 'in_progress'] }
      }

      if (filters.workflowCategory && filters.workflowCategory.length > 0) {
        query['contextData.category'] = { $in: filters.workflowCategory }
      }

      const { page, limit } = pagination
      const skip = (page - 1) * limit

      // Get approval tasks from active workflows
      const pipeline = [
        {
          $lookup: {
            from: 'workflowInstances',
            localField: 'workflowId',
            foreignField: '_id',
            as: 'workflow'
          }
        },
        {
          $unwind: '$workflow'
        },
        {
          $match: {
            'workflow.status': { $in: ['active', 'in_progress'] },
            'workflow.steps': {
              $elemMatch: {
                assignedTo: userId,
                status: { $in: ['pending', 'in_progress'] }
              }
            }
          }
        },
        {
          $addFields: {
            currentStep: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$workflow.steps',
                    cond: {
                      $and: [
                        { $in: [userId, '$$this.assignedTo'] },
                        { $in: ['$$this.status', ['pending', 'in_progress']] }
                      ]
                    }
                  }
                },
                0
              ]
            }
          }
        },
        {
          $project: {
            id: { $toString: '$_id' },
            workflowId: { $toString: '$workflow._id' },
            stepId: '$currentStep.id',
            workflowName: '$workflow.name',
            stepName: '$currentStep.name',
            description: '$currentStep.description',
            priority: '$workflow.priority',
            assignedTo: userId,
            assignedAt: '$currentStep.startedAt',
            dueDate: '$currentStep.dueDate',
            status: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$currentStep.dueDate', null] },
                    { $lt: ['$currentStep.dueDate', new Date()] }
                  ]
                },
                'overdue',
                '$currentStep.status'
              ]
            },
            contextType: '$workflow.contextType',
            contextId: '$workflow.contextId',
            contextData: '$workflow.contextData',
            requiredActions: ['approve', 'reject'],
            formFields: '$currentStep.formFields',
            attachments: '$currentStep.attachments',
            escalationLevel: { $size: '$currentStep.escalations' },
            metadata: '$workflow.metadata'
          }
        },
        {
          $match: query
        },
        {
          $facet: {
            tasks: [
              { $sort: { priority: -1, assignedAt: 1 } },
              { $skip: skip },
              { $limit: limit }
            ],
            total: [{ $count: 'count' }]
          }
        }
      ]

      const workflowsCollection = this.db.collection('workflowInstances')
      const [result] = await workflowsCollection.aggregate(pipeline).toArray()

      const tasks = result.tasks || []
      const total = result.total[0]?.count || 0

      return {
        tasks,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    } catch (error) {
      this.handleError('getApprovalTasks', error)
    }
  }

  /**
   * Get approval dashboard for a user
   */
  async getApprovalDashboard(userId: string): Promise<ApprovalDashboard> {
    try {
      await this.ensureConnection()

      // Get pending approvals
      const pendingResult = await this.getApprovalTasks(userId, { status: ['pending', 'in_progress'] })
      const pendingApprovals = pendingResult.tasks

      // Get overdue approvals
      const overdueResult = await this.getApprovalTasks(userId, { overdue: true })
      const overdueApprovals = overdueResult.tasks

      // Get recent actions
      const recentActions = await this.getRecentApprovalActions(userId, 10)

      // Calculate statistics
      const statistics = await this.calculateApprovalStatistics(userId)

      // Calculate trends
      const trends = await this.calculateApprovalTrends(userId)

      return {
        pendingApprovals,
        overdueApprovals,
        recentActions,
        statistics,
        trends
      }
    } catch (error) {
      this.handleError('getApprovalDashboard', error)
    }
  }

  /**
   * Set up escalation rules
   */
  async createEscalationRule(
    rule: Omit<EscalationRule, 'id' | 'lastTriggered'>,
    createdBy: string,
    session?: ClientSession
  ): Promise<EscalationRule> {
    try {
      await this.ensureConnection()

      const escalationRule: Omit<EscalationRule, 'id'> = {
        ...rule,
        isActive: true
      }

      const escalationsCollection = this.db.collection(this.escalationsCollection)
      const result = await escalationsCollection.insertOne(
        escalationRule,
        session ? { session } : {}
      )

      return {
        id: result.insertedId.toString(),
        ...escalationRule
      }
    } catch (error) {
      this.handleError('createEscalationRule', error)
    }
  }

  /**
   * Process escalations for overdue approvals
   */
  async processEscalations(): Promise<{
    processed: number
    escalated: number
    errors: string[]
  }> {
    try {
      await this.ensureConnection()

      const escalationsCollection = this.db.collection(this.escalationsCollection)
      const workflowsCollection = this.db.collection('workflowInstances')

      // Get active escalation rules
      const escalationRules = await escalationsCollection
        .find({ isActive: true })
        .toArray()

      let processed = 0
      let escalated = 0
      const errors: string[] = []

      for (const rule of escalationRules as EscalationRule[]) {
        try {
          processed++

          // Check if escalation should trigger
          const workflow = await workflowsCollection.findOne({
            _id: new ObjectId(rule.workflowId),
            status: { $in: ['active', 'in_progress'] }
          })

          if (!workflow) continue

          const step = workflow.steps.find(s => s.id === rule.stepId)
          if (!step || step.status !== 'in_progress') continue

          // Check if enough time has passed
          const stepStartTime = new Date(step.startedAt)
          const hoursElapsed = (Date.now() - stepStartTime.getTime()) / (1000 * 60 * 60)

          if (hoursElapsed >= rule.triggerAfterHours) {
            // Check if already escalated recently
            const lastTriggered = rule.lastTriggered ? new Date(rule.lastTriggered) : null
            if (lastTriggered) {
              const hoursSinceLastEscalation = (Date.now() - lastTriggered.getTime()) / (1000 * 60 * 60)
              if (hoursSinceLastEscalation < 24) continue // Don't escalate more than once per day
            }

            // Perform escalation action
            await this.performEscalationAction(rule, workflow, step)

            // Update last triggered time
            await escalationsCollection.updateOne(
              { _id: new ObjectId(rule.id) },
              { $set: { lastTriggered: new Date() } }
            )

            escalated++
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`Escalation rule ${rule.id}: ${errorMessage}`)
        }
      }

      return { processed, escalated, errors }
    } catch (error) {
      this.handleError('processEscalations', error)
    }
  }

  /**
   * Send reminder notifications
   */
  async sendReminders(): Promise<{
    sent: number
    errors: string[]
  }> {
    try {
      await this.ensureConnection()

      const workflowsCollection = this.db.collection('workflowInstances')
      
      // Find workflows with steps that need reminders
      const overdueWorkflows = await workflowsCollection
        .find({
          status: { $in: ['active', 'in_progress'] },
          'steps.status': 'in_progress',
          'steps.dueDate': { $lt: new Date() }
        })
        .toArray()

      let sent = 0
      const errors: string[] = []

      for (const workflow of overdueWorkflows) {
        try {
          const overdueSteps = workflow.steps.filter(
            step => step.status === 'in_progress' && 
                   step.dueDate && 
                   new Date(step.dueDate) < new Date()
          )

          for (const step of overdueSteps as any[]) {
            const notification: WorkflowNotification = {
              id: new ObjectId().toString(),
              workflowId: workflow._id.toString(),
              stepId: step.id,
              type: 'reminder',
              recipients: step.assignedTo,
              subject: `Reminder: ${workflow.name} - ${step.name}`,
              message: `You have an overdue approval task: ${step.name}`,
              data: {
                workflowId: workflow._id.toString(),
                stepId: step.id,
                dueDate: step.dueDate,
                priority: workflow.priority
              },
              channels: ['email', 'in_app'],
              status: 'pending',
              createdAt: new Date()
            }

            await this.sendNotifications([notification])
            sent++
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`Workflow ${workflow._id}: ${errorMessage}`)
        }
      }

      return { sent, errors }
    } catch (error) {
      this.handleError('sendReminders', error)
    }
  }

  // Private helper methods

  private async validateApprovalRequest(request: ApprovalRequest, approver: JWTPayload): Promise<void> {
    if (!request.workflowId || !request.stepId) {
      throw new Error('Workflow ID and Step ID are required')
    }

    if (!['approve', 'reject', 'request_changes', 'delegate'].includes(request.action)) {
      throw new Error('Invalid approval action')
    }

    if (request.action === 'delegate' && (!request.delegateTo || request.delegateTo.length === 0)) {
      throw new Error('Delegation target is required for delegate action')
    }

    if (request.action === 'reject' && !request.reason) {
      throw new Error('Reason is required for rejection')
    }
  }

  private canPerformApproval(step: WorkflowInstanceStep, approver: JWTPayload, action: string): boolean {
    // Check if user is assigned to the step
    if (!step.assignedTo.includes(approver.id)) {
      return false
    }

    // Check step status
    if (step.status !== 'in_progress') {
      return false
    }

    // Additional action-specific checks could be added here
    return true
  }

  private async handleDelegation(
    request: ApprovalRequest,
    delegator: JWTPayload,
    session?: ClientSession
  ): Promise<ApprovalResponse> {
    // Reassign the step to the delegated users
    const actionRequest: WorkflowActionRequest = {
      action: 'reassign',
      comment: request.comment || `Delegated by ${delegator.email}`,
      reassignTo: request.delegateTo
    }

    const result = await this.workflowEngine.performAction(
      request.workflowId,
      request.stepId,
      actionRequest,
      delegator.id,
      undefined,
      undefined,
      session
    )

    // Generate delegation notifications
    const notifications = await this.generateDelegationNotifications(
      result.workflow,
      request.stepId,
      delegator,
      request.delegateTo!
    )

    await this.sendNotifications(notifications)

    return {
      success: true,
      workflow: result.workflow,
      notifications,
      message: 'Task delegated successfully'
    }
  }

  private async generateApprovalNotifications(
    workflow: WorkflowInstance,
    step: WorkflowInstanceStep,
    action: string,
    approver: JWTPayload
  ): Promise<WorkflowNotification[]> {
    const notifications: WorkflowNotification[] = []

    // Notify workflow creator
    if (workflow.createdBy !== approver.id) {
      notifications.push({
        id: new ObjectId().toString(),
        workflowId: workflow.id,
        stepId: step.id,
        type: action === 'approve' ? 'completion' : 'cancellation',
        recipients: [workflow.createdBy],
        subject: `${workflow.name} - ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        message: `Your workflow "${workflow.name}" has been ${action}d by ${approver.email}`,
        data: {
          workflowId: workflow.id,
          stepId: step.id,
          action,
          approver: approver.email
        },
        channels: ['email', 'in_app'],
        status: 'pending',
        createdAt: new Date()
      })
    }

    // Notify next step assignees if approved
    if (action === 'approve') {
      const nextStep = workflow.steps.find(s => s.order === step.order + 1)
      if (nextStep) {
        notifications.push({
          id: new ObjectId().toString(),
          workflowId: workflow.id,
          stepId: nextStep.id,
          type: 'assignment',
          recipients: nextStep.assignedTo,
          subject: `New Approval Task: ${workflow.name} - ${nextStep.name}`,
          message: `You have been assigned a new approval task: ${nextStep.name}`,
          data: {
            workflowId: workflow.id,
            stepId: nextStep.id,
            priority: workflow.priority
          },
          channels: ['email', 'in_app'],
          status: 'pending',
          createdAt: new Date()
        })
      }
    }

    return notifications
  }

  private async generateDelegationNotifications(
    workflow: WorkflowInstance,
    stepId: string,
    delegator: JWTPayload,
    delegatedTo: string[]
  ): Promise<WorkflowNotification[]> {
    const step = workflow.steps.find(s => s.id === stepId)
    if (!step) return []

    return [{
      id: new ObjectId().toString(),
      workflowId: workflow.id,
      stepId: step.id,
      type: 'assignment',
      recipients: delegatedTo,
      subject: `Delegated Task: ${workflow.name} - ${step.name}`,
      message: `${delegator.email} has delegated an approval task to you: ${step.name}`,
      data: {
        workflowId: workflow.id,
        stepId: step.id,
        delegatedBy: delegator.email,
        priority: workflow.priority
      },
      channels: ['email', 'in_app'],
      status: 'pending',
      createdAt: new Date()
    }]
  }

  private async sendNotifications(notifications: WorkflowNotification[]): Promise<void> {
    const notificationsCollection = this.db.collection(this.notificationsCollection)
    
    if (notifications.length > 0) {
      await notificationsCollection.insertMany(notifications)
      
      // In a real implementation, this would integrate with email/SMS services
      console.log(`Sent ${notifications.length} workflow notifications`)
    }
  }

  private async updateApprovalTaskStatus(
    workflowId: string,
    stepId: string,
    action: string,
    userId: string
  ): Promise<void> {
    // Update any approval task records
    // This would be used for tracking and analytics
    console.log(`Updated approval task status: ${workflowId}/${stepId} - ${action} by ${userId}`)
  }

  private async handleAutomaticAdvancement(
    workflow: WorkflowInstance,
    nextStep: WorkflowInstanceStep
  ): Promise<void> {
    // Handle any automatic advancement logic
    // This could include auto-approvals based on conditions
    console.log(`Automatically advanced workflow ${workflow.id} to step ${nextStep.id}`)
  }

  private async getRecentApprovalActions(userId: string, limit: number): Promise<any[]> {
    // Get recent approval actions by the user
    const workflowsCollection = this.db.collection('workflowInstances')
    
    const pipeline = [
      { $unwind: '$steps' },
      { $unwind: '$steps.actions' },
      {
        $match: {
          'steps.actions.performedBy': userId,
          'steps.actions.action': { $in: ['approve', 'reject', 'delegate'] }
        }
      },
      {
        $project: {
          id: { $toString: '$_id' },
          workflowName: '$name',
          action: '$steps.actions.action',
          performedAt: '$steps.actions.performedAt',
          performedBy: '$steps.actions.performedBy'
        }
      },
      { $sort: { performedAt: -1 } },
      { $limit: limit }
    ]

    return await workflowsCollection.aggregate(pipeline).toArray()
  }

  private async calculateApprovalStatistics(userId: string): Promise<any> {
    const workflowsCollection = this.db.collection('workflowInstances')
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const pipeline = [
      {
        $match: {
          $or: [
            { 'steps.assignedTo': userId },
            { 'steps.actions.performedBy': userId }
          ]
        }
      },
      {
        $project: {
          pendingSteps: {
            $filter: {
              input: '$steps',
              cond: {
                $and: [
                  { $in: [userId, '$$this.assignedTo'] },
                  { $eq: ['$$this.status', 'in_progress'] }
                ]
              }
            }
          },
          overdueSteps: {
            $filter: {
              input: '$steps',
              cond: {
                $and: [
                  { $in: [userId, '$$this.assignedTo'] },
                  { $eq: ['$$this.status', 'in_progress'] },
                  { $lt: ['$$this.dueDate', new Date()] }
                ]
              }
            }
          },
          completedToday: {
            $filter: {
              input: '$steps',
              cond: {
                $and: [
                  { $in: [userId, '$$this.assignedTo'] },
                  { $eq: ['$$this.status', 'completed'] },
                  { $gte: ['$$this.completedAt', today] }
                ]
              }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalPending: { $sum: { $size: '$pendingSteps' } },
          totalOverdue: { $sum: { $size: '$overdueSteps' } },
          completedToday: { $sum: { $size: '$completedToday' } }
        }
      }
    ]

    const [stats] = await workflowsCollection.aggregate(pipeline).toArray()

    return {
      totalPending: stats?.totalPending || 0,
      totalOverdue: stats?.totalOverdue || 0,
      completedToday: stats?.completedToday || 0,
      averageResponseTime: 0 // Would need more complex calculation
    }
  }

  private async calculateApprovalTrends(userId: string): Promise<any> {
    const workflowsCollection = this.db.collection('workflowInstances')
    
    // Get data for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Generate approval rate trends
    const approvalRateData: Array<{ date: string; approved: number; rejected: number }> = []
    const responseTimeData: Array<{ date: string; averageHours: number }> = []
    const workloadData: Array<{ date: string; pending: number; completed: number }> = []

    // For now, return empty arrays - in a real implementation, 
    // these would be populated with actual trend calculations
    return {
      approvalRate: approvalRateData,
      responseTime: responseTimeData,
      workloadTrend: workloadData
    }
  }

  private async performEscalationAction(
    rule: EscalationRule,
    workflow: any,
    step: any
  ): Promise<void> {
    switch (rule.action) {
      case 'notify':
        await this.sendEscalationNotification(rule, workflow, step)
        break
      case 'reassign':
        await this.escalateReassignment(rule, workflow, step)
        break
      case 'auto_approve':
        await this.performAutoApproval(rule, workflow, step)
        break
      case 'auto_reject':
        await this.performAutoRejection(rule, workflow, step)
        break
    }
  }

  private async sendEscalationNotification(rule: EscalationRule, workflow: any, step: any): Promise<void> {
    const notification: WorkflowNotification = {
      id: new ObjectId().toString(),
      workflowId: workflow._id.toString(),
      stepId: step.id,
      type: 'escalation',
      recipients: rule.escalateTo,
      subject: `Escalation: ${workflow.name} - ${step.name}`,
      message: rule.message || `Approval task has been overdue for ${rule.triggerAfterHours} hours`,
      data: {
        workflowId: workflow._id.toString(),
        stepId: step.id,
        escalationLevel: step.escalations?.length || 0,
        originalAssignees: step.assignedTo
      },
      channels: ['email', 'in_app'],
      status: 'pending',
      createdAt: new Date()
    }

    await this.sendNotifications([notification])
  }

  private async escalateReassignment(rule: EscalationRule, workflow: any, step: any): Promise<void> {
    const actionRequest: WorkflowActionRequest = {
      action: 'reassign',
      comment: `Escalated after ${rule.triggerAfterHours} hours`,
      reassignTo: rule.escalateTo
    }

    await this.workflowEngine.performAction(
      workflow._id.toString(),
      step.id,
      actionRequest,
      'system'
    )
  }

  private async performAutoApproval(rule: EscalationRule, workflow: any, step: any): Promise<void> {
    const actionRequest: WorkflowActionRequest = {
      action: 'approve',
      comment: `Auto-approved after ${rule.triggerAfterHours} hours (escalation rule)`
    }

    await this.workflowEngine.performAction(
      workflow._id.toString(),
      step.id,
      actionRequest,
      'system'
    )
  }

  private async performAutoRejection(rule: EscalationRule, workflow: any, step: any): Promise<void> {
    const actionRequest: WorkflowActionRequest = {
      action: 'reject',
      reason: `Auto-rejected after ${rule.triggerAfterHours} hours (escalation rule)`
    }

    await this.workflowEngine.performAction(
      workflow._id.toString(),
      step.id,
      actionRequest,
      'system'
    )
  }
}

// Export service instance
export const approvalSystem = new ApprovalSystem(new WorkflowEngine())