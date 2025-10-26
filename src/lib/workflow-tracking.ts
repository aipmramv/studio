import 'server-only'

import { MongoDBConnection, BaseMongoService } from './mongodb-service'
import { ObjectId, ClientSession } from '@/types/server-types'
import {
  WorkflowInstance,
  WorkflowInstanceStep,
  WorkflowInstanceAction,
  WorkflowStatus,
  StepStatus,
  WorkflowAnalytics
} from '@/types/workflow'
import { JWTPayload } from '@/types/auth'

// Tracking-specific types
export interface WorkflowStatusUpdate {
  workflowId: string
  stepId?: string
  oldStatus: string
  newStatus: string
  updatedBy: string
  updatedAt: Date
  reason?: string
  metadata?: Record<string, any>
}

export interface WorkflowMetrics {
  workflowId: string
  templateId: string
  templateName: string
  category: string
  status: WorkflowStatus
  priority: string
  startedAt: Date
  completedAt?: Date
  dueDate?: Date
  duration?: number // in milliseconds
  stepMetrics: StepMetrics[]
  performanceIndicators: {
    isOverdue: boolean
    isEscalated: boolean
    completionRate: number
    averageStepDuration: number
    totalActions: number
  }
  contextType: string
  contextId: string
  createdBy: string
  assignedUsers: string[]
}

export interface StepMetrics {
  stepId: string
  stepName: string
  stepType: string
  order: number
  status: StepStatus
  assignedTo: string[]
  actualAssignee?: string
  startedAt?: Date
  completedAt?: Date
  dueDate?: Date
  duration?: number
  actionCount: number
  escalationCount: number
  isOverdue: boolean
  responseTime?: number // Time from assignment to first action
}

export interface WorkflowDashboard {
  summary: {
    totalWorkflows: number
    activeWorkflows: number
    completedWorkflows: number
    overdueWorkflows: number
    escalatedWorkflows: number
  }
  statusDistribution: Record<WorkflowStatus, number>
  categoryDistribution: Record<string, number>
  priorityDistribution: Record<string, number>
  recentActivity: WorkflowActivity[]
  performanceMetrics: {
    averageCompletionTime: number
    completionRate: number
    escalationRate: number
    onTimeCompletionRate: number
  }
  topPerformers: Array<{
    userId: string
    userName: string
    completedTasks: number
    averageResponseTime: number
    onTimeRate: number
  }>
  bottlenecks: Array<{
    stepName: string
    templateName: string
    averageDuration: number
    pendingCount: number
  }>
}

export interface WorkflowActivity {
  id: string
  workflowId: string
  workflowName: string
  stepName?: string
  action: string
  performedBy: string
  performedByName: string
  performedAt: Date
  description: string
  priority: string
  contextType: string
  contextId: string
}

export interface WorkflowProgressIndicator {
  workflowId: string
  currentStep: number
  totalSteps: number
  completedSteps: number
  progressPercentage: number
  estimatedCompletion?: Date
  timeRemaining?: number
  status: WorkflowStatus
  nextStepName?: string
  nextStepAssignees?: string[]
}

export interface WorkflowPerformanceReport {
  reportId: string
  generatedAt: Date
  generatedBy: string
  period: {
    start: Date
    end: Date
  }
  filters: {
    categories?: string[]
    templates?: string[]
    users?: string[]
    departments?: string[]
  }
  metrics: {
    totalWorkflows: number
    completedWorkflows: number
    averageCompletionTime: number
    completionRate: number
    escalationRate: number
    onTimeRate: number
  }
  templatePerformance: Array<{
    templateId: string
    templateName: string
    category: string
    totalInstances: number
    completedInstances: number
    averageCompletionTime: number
    completionRate: number
    escalationRate: number
  }>
  userPerformance: Array<{
    userId: string
    userName: string
    department: string
    assignedTasks: number
    completedTasks: number
    averageResponseTime: number
    onTimeRate: number
    escalationCount: number
  }>
  trends: Array<{
    date: Date
    started: number
    completed: number
    escalated: number
    overdue: number
  }>
  recommendations: string[]
}

/**
 * Workflow Status Tracking Service
 * Provides comprehensive workflow tracking, analytics, and reporting
 */
export class WorkflowTrackingService extends BaseMongoService<any> {
  private statusUpdatesCollection = 'workflowStatusUpdates'
  private metricsCollection = 'workflowMetrics'
  private activityCollection = 'workflowActivity'
  private reportsCollection = 'workflowReports'

  constructor() {
    super('workflow_tracking')
  }

  /**
   * Track workflow status update
   */
  async trackStatusUpdate(
    update: Omit<WorkflowStatusUpdate, 'updatedAt'>,
    session?: ClientSession
  ): Promise<void> {
    try {
      await this.ensureConnection()

      const statusUpdate: WorkflowStatusUpdate = {
        ...update,
        updatedAt: new Date()
      }

      const statusUpdatesCollection = this.db.collection(this.statusUpdatesCollection)
      await statusUpdatesCollection.insertOne(
        statusUpdate,
        session ? { session } : {}
      )

      // Update metrics
      await this.updateWorkflowMetrics(update.workflowId, session)

      // Log activity
      await this.logWorkflowActivity({
        workflowId: update.workflowId,
        stepName: update.stepId ? `Step ${update.stepId}` : undefined,
        action: 'status_change',
        performedBy: update.updatedBy,
        performedAt: statusUpdate.updatedAt,
        description: `Status changed from ${update.oldStatus} to ${update.newStatus}`,
        metadata: {
          oldStatus: update.oldStatus,
          newStatus: update.newStatus,
          reason: update.reason
        }
      }, session)
    } catch (error) {
      this.handleError('trackStatusUpdate', error)
    }
  }

  /**
   * Get workflow metrics
   */
  async getWorkflowMetrics(workflowId: string): Promise<WorkflowMetrics> {
    try {
      await this.ensureConnection()

      const metricsCollection = this.db.collection(this.metricsCollection)
      const metrics = await metricsCollection.findOne({ workflowId })

      if (!metrics) {
        // Generate metrics if not found
        return await this.generateWorkflowMetrics(workflowId)
      }

      return {
        workflowId: metrics.workflowId,
        templateId: metrics.templateId,
        templateName: metrics.templateName,
        category: metrics.category,
        status: metrics.status,
        priority: metrics.priority,
        startedAt: metrics.startedAt,
        completedAt: metrics.completedAt,
        dueDate: metrics.dueDate,
        duration: metrics.duration,
        stepMetrics: metrics.stepMetrics,
        performanceIndicators: metrics.performanceIndicators,
        contextType: metrics.contextType,
        contextId: metrics.contextId,
        createdBy: metrics.createdBy,
        assignedUsers: metrics.assignedUsers
      }
    } catch (error) {
      this.handleError('getWorkflowMetrics', error)
    }
  }

  /**
   * Get workflow dashboard data
   */
  async getWorkflowDashboard(
    filters: {
      dateRange?: { start: Date; end: Date }
      categories?: string[]
      users?: string[]
      departments?: string[]
    } = {},
    user?: JWTPayload
  ): Promise<WorkflowDashboard> {
    try {
      await this.ensureConnection()

      const workflowsCollection = this.db.collection('workflowInstances')

      // Build base query
      let baseQuery: any = {}

      // Apply date filter
      if (filters.dateRange) {
        baseQuery.startedAt = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end
        }
      }

      // Apply category filter
      if (filters.categories && filters.categories.length > 0) {
        baseQuery.category = { $in: filters.categories }
      }

      // Apply user-based filtering
      if (user && user.role !== 'admin') {
        baseQuery.$or = [
          { createdBy: user.id },
          { assignedTo: user.id },
          { 'steps.assignedTo': user.id }
        ]
      }

      // Get summary statistics
      const summaryPipeline = [
        { $match: baseQuery },
        {
          $group: {
            _id: null,
            totalWorkflows: { $sum: 1 },
            activeWorkflows: {
              $sum: { $cond: [{ $in: ['$status', ['active', 'in_progress']] }, 1, 0] }
            },
            completedWorkflows: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            overdueWorkflows: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$status', 'completed'] },
                      { $lt: ['$dueDate', new Date()] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            escalatedWorkflows: {
              $sum: {
                $cond: [
                  { $gt: [{ $size: { $ifNull: ['$steps.escalations', []] } }, 0] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]

      const [summaryResult] = await workflowsCollection.aggregate(summaryPipeline).toArray()
      const summary = {
        totalWorkflows: summaryResult?.totalWorkflows || 0,
        activeWorkflows: summaryResult?.activeWorkflows || 0,
        completedWorkflows: summaryResult?.completedWorkflows || 0,
        overdueWorkflows: summaryResult?.overdueWorkflows || 0,
        escalatedWorkflows: summaryResult?.escalatedWorkflows || 0
      }

      // Get distributions
      const distributionsPipeline = [
        { $match: baseQuery },
        {
          $group: {
            _id: null,
            statusDistribution: {
              $push: { k: '$status', v: 1 }
            },
            categoryDistribution: {
              $push: { k: '$category', v: 1 }
            },
            priorityDistribution: {
              $push: { k: '$priority', v: 1 }
            }
          }
        }
      ]

      const [distributionsResult] = await workflowsCollection.aggregate(distributionsPipeline).toArray()

      const processDistribution = (items: Array<{ k: string; v: number }>) => {
        const result: Record<string, number> = {}
        items.forEach(item => {
          result[item.k] = (result[item.k] || 0) + item.v
        })
        return result
      }

      const statusDistribution = processDistribution(distributionsResult?.statusDistribution || []) as Record<WorkflowStatus, number>
      const categoryDistribution = processDistribution(distributionsResult?.categoryDistribution || [])
      const priorityDistribution = processDistribution(distributionsResult?.priorityDistribution || [])

      // Get recent activity
      const recentActivity = await this.getRecentActivity(10, filters)

      // Calculate performance metrics
      const performanceMetrics = await this.calculatePerformanceMetrics(baseQuery)

      // Get top performers
      const topPerformers = await this.getTopPerformers(5, filters)

      // Identify bottlenecks
      const bottlenecks = await this.identifyBottlenecks(5, filters)

      return {
        summary: summary as any,
        statusDistribution,
        categoryDistribution,
        priorityDistribution,
        recentActivity,
        performanceMetrics,
        topPerformers,
        bottlenecks
      } as WorkflowDashboard
    } catch (error) {
      this.handleError('getWorkflowDashboard', error)
    }
  }

  /**
   * Get workflow progress indicator
   */
  async getWorkflowProgress(workflowId: string): Promise<WorkflowProgressIndicator> {
    try {
      await this.ensureConnection()

      const workflowsCollection = this.db.collection('workflowInstances')
      const workflow = await workflowsCollection.findOne({ _id: new ObjectId(workflowId) })

      if (!workflow) {
        throw new Error('Workflow not found')
      }

      const totalSteps = workflow.steps.length
      const completedSteps = workflow.steps.filter((s: any) => s.status === 'completed').length
      const currentStep = workflow.currentStepOrder || 1
      const progressPercentage = Math.round((completedSteps / totalSteps) * 100)

      // Find next step
      const nextStep = workflow.steps.find((s: any) => s.status === 'pending' && s.order > currentStep)

      // Estimate completion time based on historical data
      const estimatedCompletion = await this.estimateCompletionTime(workflow)

      return {
        workflowId,
        currentStep,
        totalSteps,
        completedSteps,
        progressPercentage,
        estimatedCompletion,
        timeRemaining: estimatedCompletion ? estimatedCompletion.getTime() - Date.now() : undefined,
        status: workflow.status,
        nextStepName: nextStep?.name,
        nextStepAssignees: nextStep?.assignedTo
      }
    } catch (error) {
      this.handleError('getWorkflowProgress', error)
    }
  }

  /**
   * Generate workflow performance report
   */
  async generatePerformanceReport(
    period: { start: Date; end: Date },
    filters: {
      categories?: string[]
      templates?: string[]
      users?: string[]
      departments?: string[]
    } = {},
    generatedBy: string
  ): Promise<WorkflowPerformanceReport> {
    try {
      await this.ensureConnection()

      const reportId = new ObjectId().toString()
      const workflowsCollection = this.db.collection('workflowInstances')

      // Build query
      const query: any = {
        startedAt: {
          $gte: period.start,
          $lte: period.end
        }
      }

      if (filters.categories && filters.categories.length > 0) {
        query.category = { $in: filters.categories }
      }

      if (filters.templates && filters.templates.length > 0) {
        query.templateId = { $in: filters.templates }
      }

      // Calculate overall metrics
      const overallMetrics = await this.calculateReportMetrics(query)

      // Get template performance
      const templatePerformance = await this.getTemplatePerformance(query)

      // Get user performance
      const userPerformance = await this.getUserPerformance(query, filters.users)

      // Get trends
      const trends = await this.getTrendData(period, query)

      // Generate recommendations
      const recommendations = this.generateRecommendations(overallMetrics, templatePerformance, userPerformance)

      const report: WorkflowPerformanceReport = {
        reportId,
        generatedAt: new Date(),
        generatedBy,
        period,
        filters,
        metrics: overallMetrics,
        templatePerformance,
        userPerformance,
        trends,
        recommendations
      }

      // Save report
      const reportsCollection = this.db.collection(this.reportsCollection)
      await reportsCollection.insertOne(report)

      return report
    } catch (error) {
      this.handleError('generatePerformanceReport', error)
    }
  }

  /**
   * Get workflow history
   */
  async getWorkflowHistory(
    workflowId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 50 }
  ): Promise<{
    updates: WorkflowStatusUpdate[]
    activities: WorkflowActivity[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    try {
      await this.ensureConnection()

      const { page, limit } = pagination
      const skip = (page - 1) * limit

      // Get status updates
      const statusUpdatesCollection = this.db.collection(this.statusUpdatesCollection)
      const updates = await statusUpdatesCollection
        .find({ workflowId })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray()

      // Get activities
      const activityCollection = this.db.collection(this.activityCollection)
      const activities = await activityCollection
        .find({ workflowId })
        .sort({ performedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray()

      const total = await statusUpdatesCollection.countDocuments({ workflowId })

      return {
        updates: updates.map(u => ({
          workflowId: u.workflowId,
          stepId: u.stepId,
          oldStatus: u.oldStatus,
          newStatus: u.newStatus,
          updatedBy: u.updatedBy,
          updatedAt: u.updatedAt,
          reason: u.reason,
          metadata: u.metadata
        })),
        activities: activities.map(a => ({
          id: a._id.toString(),
          workflowId: a.workflowId,
          workflowName: a.workflowName,
          stepName: a.stepName,
          action: a.action,
          performedBy: a.performedBy,
          performedByName: a.performedByName,
          performedAt: a.performedAt,
          description: a.description,
          priority: a.priority,
          contextType: a.contextType,
          contextId: a.contextId
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    } catch (error) {
      this.handleError('getWorkflowHistory', error)
    }
  }

  // Private helper methods

  private async updateWorkflowMetrics(workflowId: string, session?: ClientSession): Promise<void> {
    try {
      const metrics = await this.generateWorkflowMetrics(workflowId)

      const metricsCollection = this.db.collection(this.metricsCollection)
      await metricsCollection.updateOne(
        { workflowId },
        { $set: metrics },
        { upsert: true, ...(session ? { session } : {}) }
      )
    } catch (error) {
      console.error('Failed to update workflow metrics:', error)
    }
  }

  private async generateWorkflowMetrics(workflowId: string): Promise<WorkflowMetrics> {
    const workflowsCollection = this.db.collection('workflowInstances')
    const workflow = await workflowsCollection.findOne({ _id: new ObjectId(workflowId) })

    if (!workflow) {
      throw new Error('Workflow not found')
    }

    // Calculate step metrics
    const stepMetrics: StepMetrics[] = workflow.steps.map((step: any) => {
      const duration = step.completedAt && step.startedAt
        ? new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime()
        : undefined

      const responseTime = step.actions.length > 0 && step.startedAt
        ? new Date(step.actions[0].performedAt).getTime() - new Date(step.startedAt).getTime()
        : undefined

      return {
        stepId: step.id,
        stepName: step.name,
        stepType: step.type,
        order: step.order,
        status: step.status,
        assignedTo: step.assignedTo,
        actualAssignee: step.actualAssignee,
        startedAt: step.startedAt,
        completedAt: step.completedAt,
        dueDate: step.dueDate,
        duration,
        actionCount: step.actions.length,
        escalationCount: step.escalations.length,
        isOverdue: step.dueDate ? new Date(step.dueDate) < new Date() && step.status !== 'completed' : false,
        responseTime
      }
    })

    // Calculate performance indicators
    const completedSteps = stepMetrics.filter((s: StepMetrics) => s.status === 'completed').length
    const totalSteps = stepMetrics.length
    const completionRate = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

    const averageStepDuration = stepMetrics
      .filter((s: StepMetrics) => s.duration)
      .reduce((sum, s) => sum + s.duration!, 0) / Math.max(completedSteps, 1)

    const totalActions = stepMetrics.reduce((sum, s) => sum + s.actionCount, 0)
    const isOverdue = workflow.dueDate ? new Date(workflow.dueDate) < new Date() && workflow.status !== 'completed' : false
    const isEscalated = stepMetrics.some(s => s.escalationCount > 0)

    const duration = workflow.completedAt && workflow.startedAt
      ? new Date(workflow.completedAt).getTime() - new Date(workflow.startedAt).getTime()
      : undefined

    // Get all assigned users
    const assignedUsers = Array.from(new Set(
      stepMetrics.flatMap(s => s.assignedTo)
    ))

    return {
      workflowId,
      templateId: workflow.templateId,
      templateName: workflow.name.split(' - ')[0], // Extract template name
      category: workflow.category,
      status: workflow.status,
      priority: workflow.priority,
      startedAt: workflow.startedAt,
      completedAt: workflow.completedAt,
      dueDate: workflow.dueDate,
      duration,
      stepMetrics,
      performanceIndicators: {
        isOverdue,
        isEscalated,
        completionRate,
        averageStepDuration,
        totalActions
      },
      contextType: workflow.contextType,
      contextId: workflow.contextId,
      createdBy: workflow.createdBy,
      assignedUsers
    }
  }

  private async logWorkflowActivity(
    activity: Omit<WorkflowActivity, 'id' | 'workflowName' | 'performedByName' | 'priority' | 'contextType' | 'contextId'> & {
      metadata?: Record<string, any>
    },
    session?: ClientSession
  ): Promise<void> {
    try {
      // Get workflow details
      const workflowsCollection = this.db.collection('workflowInstances')
      const workflow = await workflowsCollection.findOne({ _id: new ObjectId(activity.workflowId) })

      if (!workflow) return

      // Get user details (simplified - in real implementation would fetch from user service)
      const performedByName = activity.performedBy // Would be resolved to actual name

      const activityDoc = {
        ...activity,
        id: new ObjectId().toString(),
        workflowName: workflow.name,
        performedByName,
        priority: workflow.priority,
        contextType: workflow.contextType,
        contextId: workflow.contextId
      }

      const activityCollection = this.db.collection(this.activityCollection)
      await activityCollection.insertOne(
        activityDoc,
        session ? { session } : {}
      )
    } catch (error) {
      console.error('Failed to log workflow activity:', error)
    }
  }

  private async getRecentActivity(limit: number, filters: any): Promise<WorkflowActivity[]> {
    const activityCollection = this.db.collection(this.activityCollection)

    const query: any = {}
    if (filters.dateRange) {
      query.performedAt = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end
      }
    }

    const activities = await activityCollection
      .find(query)
      .sort({ performedAt: -1 })
      .limit(limit)
      .toArray()

    return activities.map(a => ({
      id: a._id.toString(),
      workflowId: a.workflowId,
      workflowName: a.workflowName,
      stepName: a.stepName,
      action: a.action,
      performedBy: a.performedBy,
      performedByName: a.performedByName,
      performedAt: a.performedAt,
      description: a.description,
      priority: a.priority,
      contextType: a.contextType,
      contextId: a.contextId
    }))
  }

  private async calculatePerformanceMetrics(query: any): Promise<any> {
    const workflowsCollection = this.db.collection('workflowInstances')

    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: null,
          totalWorkflows: { $sum: 1 },
          completedWorkflows: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          averageCompletionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                { $subtract: ['$completedAt', '$startedAt'] },
                null
              ]
            }
          },
          escalatedWorkflows: {
            $sum: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ['$steps.escalations', []] } }, 0] },
                1,
                0
              ]
            }
          },
          onTimeWorkflows: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'completed'] },
                    { $lte: ['$completedAt', '$dueDate'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]

    const [result] = await workflowsCollection.aggregate(pipeline).toArray()

    if (!result) {
      return {
        averageCompletionTime: 0,
        completionRate: 0,
        escalationRate: 0,
        onTimeCompletionRate: 0
      }
    }

    const completionRate = result.totalWorkflows > 0
      ? (result.completedWorkflows / result.totalWorkflows) * 100
      : 0

    const escalationRate = result.totalWorkflows > 0
      ? (result.escalatedWorkflows / result.totalWorkflows) * 100
      : 0

    const onTimeCompletionRate = result.completedWorkflows > 0
      ? (result.onTimeWorkflows / result.completedWorkflows) * 100
      : 0

    return {
      averageCompletionTime: result.averageCompletionTime || 0,
      completionRate,
      escalationRate,
      onTimeCompletionRate
    }
  }

  private async getTopPerformers(limit: number, filters: any): Promise<any[]> {
    // Simplified implementation - would need more complex aggregation in real scenario
    return []
  }

  private async identifyBottlenecks(limit: number, filters: any): Promise<any[]> {
    // Simplified implementation - would analyze step durations and pending counts
    return []
  }

  private async estimateCompletionTime(workflow: any): Promise<Date | undefined> {
    // Simplified estimation based on remaining steps and historical data
    const remainingSteps = workflow.steps.filter((s: any) => s.status === 'pending').length
    if (remainingSteps === 0) return undefined

    // Estimate 2 days per remaining step (simplified)
    const estimatedDays = remainingSteps * 2
    return new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000)
  }

  private async calculateReportMetrics(query: any): Promise<any> {
    return await this.calculatePerformanceMetrics(query)
  }

  private async getTemplatePerformance(query: any): Promise<any[]> {
    // Would aggregate performance by template
    return []
  }

  private async getUserPerformance(query: any, users?: string[]): Promise<any[]> {
    // Would aggregate performance by user
    return []
  }

  private async getTrendData(period: { start: Date; end: Date }, query: any): Promise<any[]> {
    // Would generate daily/weekly trend data
    return []
  }

  private generateRecommendations(metrics: any, templatePerf: any[], userPerf: any[]): string[] {
    const recommendations: string[] = []

    if (metrics.completionRate < 80) {
      recommendations.push('Consider reviewing workflow templates to reduce complexity')
    }

    if (metrics.escalationRate > 20) {
      recommendations.push('High escalation rate indicates need for better resource allocation')
    }

    if (metrics.onTimeCompletionRate < 70) {
      recommendations.push('Review due date settings and step timeouts')
    }

    return recommendations
  }
}

// Export service instance
export const workflowTrackingService = new WorkflowTrackingService()