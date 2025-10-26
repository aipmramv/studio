import { MongoDBConnection, BaseMongoService } from './mongodb-service'
import { ObjectId, ClientSession } from '@/types/server-types'
import {
  WorkflowTemplate,
  WorkflowInstance,
  WorkflowInstanceStep,
  WorkflowInstanceAction,
  CreateWorkflowTemplateRequest,
  UpdateWorkflowTemplateRequest,
  StartWorkflowRequest,
  WorkflowActionRequest,
  WorkflowSearchFilters,
  WorkflowListResponse,
  WorkflowStatus,
  StepStatus,
  WorkflowAnalytics,
  WorkflowNotification
} from '@/types/workflow'
import { JWTPayload } from '@/types/auth'
import { DepartmentFilterService } from './department-filter'

/**
 * Workflow Engine Service
 * Manages workflow templates, instances, and execution
 */
export class WorkflowEngine extends BaseMongoService<any> {
  private templatesCollection = 'workflowTemplates'
  private instancesCollection = 'workflowInstances'
  private notificationsCollection = 'workflowNotifications'

  constructor() {
    super('workflow_engine')
  }

  /**
   * Template Management
   */

  async createTemplate(
    templateData: CreateWorkflowTemplateRequest,
    createdBy: string,
    session?: ClientSession
  ): Promise<{
    template: WorkflowTemplate
    message: string
  }> {
    try {
      await this.ensureConnection()

      // Validate template data
      this.validateTemplateData(templateData)

      // Generate step IDs and validate step order
      const steps = templateData.steps.map((step, index) => ({
        ...step,
        id: new ObjectId().toString(),
        order: step.order || index + 1
      }))

      // Validate step dependencies and assignments
      this.validateStepConfiguration(steps)

      const templateDocument: Omit<WorkflowTemplate, 'id'> = {
        ...templateData,
        steps,
        version: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        lastModifiedBy: createdBy
      }

      const templatesCollection = this.db.collection(this.templatesCollection)
      const result = await templatesCollection.insertOne(templateDocument, session ? { session } : {})

      const template: WorkflowTemplate = {
        id: result.insertedId.toString(),
        ...templateDocument
      }

      return {
        template,
        message: 'Workflow template created successfully'
      }
    } catch (error) {
      this.handleError('createTemplate', error)
    }
  }

  async getTemplate(templateId: string): Promise<WorkflowTemplate> {
    try {
      await this.ensureConnection()

      const templatesCollection = this.db.collection(this.templatesCollection)
      const template = await templatesCollection.findOne({ _id: new ObjectId(templateId) })

      if (!template) {
        throw new Error('Workflow template not found')
      }

      return {
        id: template._id.toString(),
        name: template.name,
        description: template.description,
        category: template.category,
        version: template.version,
        isActive: template.isActive,
        steps: template.steps,
        triggers: template.triggers,
        settings: template.settings,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        createdBy: template.createdBy,
        lastModifiedBy: template.lastModifiedBy
      }
    } catch (error) {
      this.handleError('getTemplate', error)
    }
  }

  async updateTemplate(
    templateId: string,
    updates: UpdateWorkflowTemplateRequest,
    updatedBy: string,
    session?: ClientSession
  ): Promise<{
    template: WorkflowTemplate
    message: string
  }> {
    try {
      await this.ensureConnection()

      const templatesCollection = this.db.collection(this.templatesCollection)
      const existingTemplate = await templatesCollection.findOne({ _id: new ObjectId(templateId) })

      if (!existingTemplate) {
        throw new Error('Workflow template not found')
      }

      // Check if template has active instances
      if (updates.steps || updates.triggers) {
        const hasActiveInstances = await this.hasActiveInstances(templateId)
        if (hasActiveInstances) {
          throw new Error('Cannot modify template structure while there are active workflow instances')
        }
      }

      // Process step updates
      let processedSteps = existingTemplate.steps
      if (updates.steps) {
        processedSteps = updates.steps.map((step, index) => ({
          ...step,
          id: step.id || new ObjectId().toString(),
          order: step.order || index + 1
        }))
        this.validateStepConfiguration(processedSteps)
      }

      const updateDocument = {
        ...updates,
        steps: processedSteps,
        version: existingTemplate.version + 1,
        updatedAt: new Date(),
        lastModifiedBy: updatedBy
      }

      const result = await templatesCollection.updateOne(
        { _id: new ObjectId(templateId) },
        { $set: updateDocument },
        session ? { session } : {}
      )

      if (result.modifiedCount === 0) {
        throw new Error('Failed to update workflow template')
      }

      const template = await this.getTemplate(templateId)

      return {
        template,
        message: 'Workflow template updated successfully'
      }
    } catch (error) {
      this.handleError('updateTemplate', error)
    }
  }

  async listTemplates(
    filters: { category?: string; isActive?: boolean } = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{
    templates: WorkflowTemplate[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    try {
      await this.ensureConnection()

      const templatesCollection = this.db.collection(this.templatesCollection)
      const query: any = {}

      if (filters.category) query.category = filters.category
      if (filters.isActive !== undefined) query.isActive = filters.isActive

      const { page, limit } = pagination
      const skip = (page - 1) * limit

      const [templates, total] = await Promise.all([
        templatesCollection
          .find(query)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        templatesCollection.countDocuments(query)
      ])

      const processedTemplates = templates.map(template => ({
        id: template._id.toString(),
        name: template.name,
        description: template.description,
        category: template.category,
        version: template.version,
        isActive: template.isActive,
        steps: template.steps,
        triggers: template.triggers,
        settings: template.settings,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        createdBy: template.createdBy,
        lastModifiedBy: template.lastModifiedBy
      }))

      return {
        templates: processedTemplates,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    } catch (error) {
      this.handleError('listTemplates', error)
    }
  }

  /**
   * Workflow Instance Management
   */

  async startWorkflow(
    request: StartWorkflowRequest,
    startedBy: string,
    session?: ClientSession
  ): Promise<{
    workflow: WorkflowInstance
    message: string
  }> {
    try {
      await this.ensureConnection()

      // Get template
      const template = await this.getTemplate(request.templateId)
      if (!template.isActive) {
        throw new Error('Cannot start workflow from inactive template')
      }

      // Validate context
      await this.validateWorkflowContext(request.contextType, request.contextId)

      // Check for existing active workflows for the same context
      const existingWorkflow = await this.findActiveWorkflowForContext(
        request.contextType,
        request.contextId
      )
      if (existingWorkflow && !template.settings.allowParallelExecution) {
        throw new Error('An active workflow already exists for this context')
      }

      // Create workflow instance
      const workflowId = new ObjectId().toString()
      const instanceSteps = this.createInstanceSteps(template.steps, request.variables || {})

      const workflowInstance: Omit<WorkflowInstance, 'id'> = {
        templateId: template.id,
        templateVersion: template.version,
        name: `${template.name} - ${request.contextId}`,
        category: template.category,
        status: 'active',
        priority: request.priority || 'medium',
        contextType: request.contextType,
        contextId: request.contextId,
        contextData: request.contextData || {},
        currentStepId: instanceSteps[0]?.id,
        currentStepOrder: 1,
        steps: instanceSteps,
        variables: request.variables || {},
        startedAt: new Date(),
        dueDate: request.dueDate,
        createdBy: startedBy,
        assignedTo: request.assignedTo,
        tags: request.tags || [],
        metadata: {}
      }

      const instancesCollection = this.db.collection(this.instancesCollection)
      const result = await instancesCollection.insertOne(
        workflowInstance,
        session ? { session } : {}
      )

      const workflow: WorkflowInstance = {
        id: result.insertedId.toString(),
        ...workflowInstance
      }

      // Start first step
      await this.startStep(workflow.id, instanceSteps[0].id, startedBy, session)

      // Send notifications if configured
      if (template.settings.notifyOnStart) {
        await this.sendWorkflowNotification(workflow, 'assignment')
      }

      return {
        workflow,
        message: 'Workflow started successfully'
      }
    } catch (error) {
      this.handleError('startWorkflow', error)
    }
  }

  async getWorkflow(workflowId: string, user?: JWTPayload): Promise<WorkflowInstance> {
    try {
      await this.ensureConnection()

      const instancesCollection = this.db.collection(this.instancesCollection)
      const workflow = await instancesCollection.findOne({ _id: new ObjectId(workflowId) })

      if (!workflow) {
        throw new Error('Workflow not found')
      }

      // Check access permissions
      if (user && !this.canAccessWorkflow(workflow, user)) {
        throw new Error('Access denied to this workflow')
      }

      return {
        id: workflow._id.toString(),
        templateId: workflow.templateId,
        templateVersion: workflow.templateVersion,
        name: workflow.name,
        category: workflow.category,
        status: workflow.status,
        priority: workflow.priority,
        contextType: workflow.contextType,
        contextId: workflow.contextId,
        contextData: workflow.contextData,
        currentStepId: workflow.currentStepId,
        currentStepOrder: workflow.currentStepOrder,
        steps: workflow.steps,
        variables: workflow.variables,
        startedAt: workflow.startedAt,
        completedAt: workflow.completedAt,
        dueDate: workflow.dueDate,
        createdBy: workflow.createdBy,
        assignedTo: workflow.assignedTo,
        tags: workflow.tags,
        metadata: workflow.metadata
      }
    } catch (error) {
      this.handleError('getWorkflow', error)
    }
  }

  async performAction(
    workflowId: string,
    stepId: string,
    actionRequest: WorkflowActionRequest,
    performedBy: string,
    ipAddress?: string,
    userAgent?: string,
    session?: ClientSession
  ): Promise<{
    workflow: WorkflowInstance
    nextStep?: WorkflowInstanceStep
    message: string
  }> {
    try {
      await this.ensureConnection()

      const workflow = await this.getWorkflow(workflowId)
      const step = workflow.steps.find(s => s.id === stepId)

      if (!step) {
        throw new Error('Workflow step not found')
      }

      if (step.status !== 'in_progress') {
        throw new Error('Step is not in progress')
      }

      // Validate user can perform action
      if (!this.canPerformAction(step, performedBy, actionRequest.action)) {
        throw new Error('You are not authorized to perform this action')
      }

      // Create action record
      const action: WorkflowInstanceAction = {
        id: new ObjectId().toString(),
        action: actionRequest.action,
        performedBy,
        performedAt: new Date(),
        comment: actionRequest.comment,
        reason: actionRequest.reason,
        data: actionRequest.data,
        ipAddress,
        userAgent
      }

      // Update step
      const updatedStep = { ...step }
      updatedStep.actions.push(action)

      if (actionRequest.action === 'approve' || actionRequest.action === 'complete') {
        updatedStep.status = 'completed'
        updatedStep.completedAt = new Date()
        updatedStep.actualAssignee = performedBy
      } else if (actionRequest.action === 'reject') {
        updatedStep.status = 'failed'
        updatedStep.completedAt = new Date()
        updatedStep.actualAssignee = performedBy
      } else if (actionRequest.action === 'reassign' && actionRequest.reassignTo) {
        updatedStep.assignedTo = actionRequest.reassignTo
      }

      // Update workflow
      const updatedSteps = workflow.steps.map(s => s.id === stepId ? updatedStep : s)
      let nextStep: WorkflowInstanceStep | undefined

      // Determine next step
      if (updatedStep.status === 'completed') {
        nextStep = this.getNextStep(workflow, updatedSteps)
        if (nextStep) {
          await this.startStep(workflowId, nextStep.id, performedBy, session)
        } else {
          // Workflow completed
          await this.completeWorkflow(workflowId, performedBy, session)
        }
      } else if (updatedStep.status === 'failed') {
        // Handle workflow failure
        await this.failWorkflow(workflowId, actionRequest.reason || 'Step rejected', performedBy, session)
      }

      // Update workflow in database
      const instancesCollection = this.db.collection(this.instancesCollection)
      const updateDoc: any = {
        steps: updatedSteps,
        'metadata.lastActionAt': new Date(),
        'metadata.lastActionBy': performedBy
      }

      if (nextStep) {
        updateDoc.currentStepId = nextStep.id
        updateDoc.currentStepOrder = nextStep.order
      }

      await instancesCollection.updateOne(
        { _id: new ObjectId(workflowId) },
        { $set: updateDoc },
        session ? { session } : {}
      )

      const updatedWorkflow = await this.getWorkflow(workflowId)

      return {
        workflow: updatedWorkflow,
        nextStep,
        message: `Action ${actionRequest.action} performed successfully`
      }
    } catch (error) {
      this.handleError('performAction', error)
    }
  }

  async searchWorkflows(
    filters: WorkflowSearchFilters,
    user?: JWTPayload,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<WorkflowListResponse> {
    try {
      await this.ensureConnection()

      const instancesCollection = this.db.collection(this.instancesCollection)
      let query: any = {}

      // Apply user-based filtering
      if (user && user.role !== 'admin') {
        query.$or = [
          { createdBy: user.id },
          { assignedTo: user.id },
          { 'steps.assignedTo': user.id }
        ]
      }

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query.status = { $in: filters.status }
      }
      if (filters.category && filters.category.length > 0) {
        query.category = { $in: filters.category }
      }
      if (filters.assignedTo) {
        query.$or = [
          { assignedTo: filters.assignedTo },
          { 'steps.assignedTo': filters.assignedTo }
        ]
      }
      if (filters.createdBy) query.createdBy = filters.createdBy
      if (filters.contextType) query.contextType = filters.contextType
      if (filters.contextId) query.contextId = filters.contextId
      if (filters.priority && filters.priority.length > 0) {
        query.priority = { $in: filters.priority }
      }
      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags }
      }

      // Date range filter
      if (filters.dateRange) {
        query[filters.dateRange.field] = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end
        }
      }

      // Text search
      if (filters.search) {
        query.$text = { $search: filters.search }
      }

      const { page, limit } = pagination
      const skip = (page - 1) * limit

      // Execute aggregation for workflows and statistics
      const pipeline = [
        { $match: query },
        {
          $facet: {
            workflows: [
              { $sort: { startedAt: -1 } },
              { $skip: skip },
              { $limit: limit }
            ],
            total: [{ $count: 'count' }],
            aggregations: [
              {
                $group: {
                  _id: null,
                  byStatus: {
                    $push: { k: '$status', v: 1 }
                  },
                  byCategory: {
                    $push: { k: '$category', v: 1 }
                  },
                  byPriority: {
                    $push: { k: '$priority', v: 1 }
                  },
                  overdue: {
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
                  }
                }
              }
            ]
          }
        }
      ]

      const [result] = await instancesCollection.aggregate(pipeline).toArray()

      const workflows = result.workflows.map(workflow => ({
        id: workflow._id.toString(),
        templateId: workflow.templateId,
        templateVersion: workflow.templateVersion,
        name: workflow.name,
        category: workflow.category,
        status: workflow.status,
        priority: workflow.priority,
        contextType: workflow.contextType,
        contextId: workflow.contextId,
        contextData: workflow.contextData,
        currentStepId: workflow.currentStepId,
        currentStepOrder: workflow.currentStepOrder,
        steps: workflow.steps,
        variables: workflow.variables,
        startedAt: workflow.startedAt,
        completedAt: workflow.completedAt,
        dueDate: workflow.dueDate,
        createdBy: workflow.createdBy,
        assignedTo: workflow.assignedTo,
        tags: workflow.tags,
        metadata: workflow.metadata
      }))

      const total = result.total[0]?.count || 0
      const aggregations = result.aggregations[0] || {
        byStatus: [],
        byCategory: [],
        byPriority: [],
        overdue: 0
      }

      // Process aggregations
      const processAggregation = (items: Array<{ k: string; v: number }>) => {
        const result = {}
        items.forEach(item => {
          result[item.k] = (result[item.k] || 0) + item.v
        })
        return result
      }

      return {
        workflows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        filters,
        aggregations: {
          byStatus: processAggregation(aggregations.byStatus),
          byCategory: processAggregation(aggregations.byCategory),
          byPriority: processAggregation(aggregations.byPriority),
          overdue: aggregations.overdue
        }
      }
    } catch (error) {
      this.handleError('searchWorkflows', error)
    }
  }

  // Private helper methods

  private validateTemplateData(templateData: CreateWorkflowTemplateRequest): void {
    if (!templateData.name || templateData.name.trim().length < 3) {
      throw new Error('Template name must be at least 3 characters long')
    }

    if (!templateData.steps || templateData.steps.length === 0) {
      throw new Error('Template must have at least one step')
    }

    if (!templateData.category) {
      throw new Error('Template category is required')
    }
  }

  private validateStepConfiguration(steps: any[]): void {
    const orders = steps.map(s => s.order)
    const uniqueOrders = new Set(orders)
    
    if (orders.length !== uniqueOrders.size) {
      throw new Error('Step orders must be unique')
    }

    for (const step of steps) {
      if (!step.name || step.name.trim().length < 2) {
        throw new Error('Step name must be at least 2 characters long')
      }

      if (!step.type) {
        throw new Error('Step type is required')
      }

      if (!step.assignmentType || !step.assignedTo || step.assignedTo.length === 0) {
        throw new Error('Step assignment is required')
      }
    }
  }

  private async hasActiveInstances(templateId: string): Promise<boolean> {
    const instancesCollection = this.db.collection(this.instancesCollection)
    const count = await instancesCollection.countDocuments({
      templateId,
      status: { $in: ['active', 'pending', 'in_progress'] }
    })
    return count > 0
  }

  private async validateWorkflowContext(contextType: string, contextId: string): Promise<void> {
    // Validate that the context exists
    // This would check the appropriate collection based on contextType
    // For now, we'll just validate the format
    if (!ObjectId.isValid(contextId)) {
      throw new Error('Invalid context ID format')
    }
  }

  private async findActiveWorkflowForContext(
    contextType: string,
    contextId: string
  ): Promise<WorkflowInstance | null> {
    const instancesCollection = this.db.collection(this.instancesCollection)
    const workflow = await instancesCollection.findOne({
      contextType,
      contextId,
      status: { $in: ['active', 'pending', 'in_progress'] }
    })

    return workflow ? {
      id: workflow._id.toString(),
      ...workflow
    } : null
  }

  private createInstanceSteps(templateSteps: any[], variables: Record<string, any>): WorkflowInstanceStep[] {
    return templateSteps.map(step => ({
      id: new ObjectId().toString(),
      templateStepId: step.id,
      name: step.name,
      type: step.type,
      order: step.order,
      status: 'pending' as StepStatus,
      assignedTo: this.resolveAssignments(step, variables),
      actions: [],
      comments: [],
      attachments: [],
      escalations: []
    }))
  }

  private resolveAssignments(step: any, variables: Record<string, any>): string[] {
    // Resolve dynamic assignments based on variables
    if (step.assignmentType === 'dynamic' && variables) {
      // Implementation would depend on specific business rules
      return step.assignedTo
    }
    return step.assignedTo
  }

  private async startStep(
    workflowId: string,
    stepId: string,
    startedBy: string,
    session?: ClientSession
  ): Promise<void> {
    const instancesCollection = this.db.collection(this.instancesCollection)
    
    await instancesCollection.updateOne(
      { 
        _id: new ObjectId(workflowId),
        'steps.id': stepId
      },
      {
        $set: {
          'steps.$.status': 'in_progress',
          'steps.$.startedAt': new Date()
        }
      },
      session ? { session } : {}
    )
  }

  private getNextStep(workflow: WorkflowInstance, updatedSteps: WorkflowInstanceStep[]): WorkflowInstanceStep | undefined {
    const currentOrder = workflow.currentStepOrder
    return updatedSteps
      .filter(step => step.order > currentOrder && step.status === 'pending')
      .sort((a, b) => a.order - b.order)[0]
  }

  private async completeWorkflow(
    workflowId: string,
    completedBy: string,
    session?: ClientSession
  ): Promise<void> {
    const instancesCollection = this.db.collection(this.instancesCollection)
    
    await instancesCollection.updateOne(
      { _id: new ObjectId(workflowId) },
      {
        $set: {
          status: 'completed',
          completedAt: new Date(),
          'metadata.completedBy': completedBy
        }
      },
      session ? { session } : {}
    )
  }

  private async failWorkflow(
    workflowId: string,
    reason: string,
    failedBy: string,
    session?: ClientSession
  ): Promise<void> {
    const instancesCollection = this.db.collection(this.instancesCollection)
    
    await instancesCollection.updateOne(
      { _id: new ObjectId(workflowId) },
      {
        $set: {
          status: 'failed',
          completedAt: new Date(),
          'metadata.failureReason': reason,
          'metadata.failedBy': failedBy
        }
      },
      session ? { session } : {}
    )
  }

  private canAccessWorkflow(workflow: any, user: JWTPayload): boolean {
    if (user.role === 'admin') return true
    
    // User can access if they created it, are assigned to it, or assigned to any step
    return workflow.createdBy === user.id ||
           workflow.assignedTo?.includes(user.id) ||
           workflow.steps?.some(step => step.assignedTo?.includes(user.id))
  }

  private canPerformAction(step: WorkflowInstanceStep, userId: string, action: string): boolean {
    // Check if user is assigned to the step
    if (!step.assignedTo.includes(userId)) {
      return false
    }

    // Additional action-specific validations could be added here
    return true
  }

  private async sendWorkflowNotification(
    workflow: WorkflowInstance,
    type: 'assignment' | 'reminder' | 'escalation' | 'completion' | 'cancellation'
  ): Promise<void> {
    // Implementation would integrate with notification service
    // For now, we'll just log the notification
    console.log(`Workflow notification: ${type} for workflow ${workflow.id}`)
  }
}

// Export service instance
export const workflowEngine = new WorkflowEngine()