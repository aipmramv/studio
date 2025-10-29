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
import { query } from './db';
import { createObjectId, isValidObjectId } from '@/types/server-types';

/**
 * Workflow Engine Service
 * Manages workflow templates, instances, and execution
 */
export class WorkflowEngine {
  private templatesTable = 'workflow_templates'
  private instancesTable = 'workflow_instances'
  private notificationsTable = 'workflow_notifications'

  constructor() {}

  /**
   * Template Management
   */

  async createTemplate(
    templateData: CreateWorkflowTemplateRequest,
    createdBy: string
  ): Promise<{
    template: WorkflowTemplate
    message: string
  }> {
    try {
      // Validate template data
      this.validateTemplateData(templateData)

      // Generate step IDs and validate step order
      const steps = templateData.steps.map((step, index) => ({
        ...step,
        id: createObjectId(),
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

      const sql = `
        INSERT INTO ${this.templatesTable} (name, description, category, version, is_active, steps, triggers, settings, created_by, last_modified_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id;
      `;

      const params = [
        templateDocument.name,
        templateDocument.description,
        templateDocument.category,
        templateDocument.version,
        templateDocument.isActive,
        JSON.stringify(templateDocument.steps),
        JSON.stringify(templateDocument.triggers),
        JSON.stringify(templateDocument.settings),
        templateDocument.createdBy,
        templateDocument.lastModifiedBy,
        templateDocument.createdAt,
        templateDocument.updatedAt
      ];

      const result = await query(sql, params);
      const templateId = result.rows[0].id;

      const template: WorkflowTemplate = {
        id: templateId,
        ...templateDocument
      }

      return {
        template,
        message: 'Workflow template created successfully'
      }
    } catch (error) {
      console.error('Error creating workflow template:', error);
      throw new Error('Failed to create workflow template');
    }
  }

  async getTemplate(templateId: string): Promise<WorkflowTemplate> {
    try {
      const sql = `
        SELECT id, name, description, category, version, is_active, steps, triggers, settings, created_by, last_modified_by, created_at, updated_at
        FROM ${this.templatesTable}
        WHERE id = $1;
      `;

      const result = await query(sql, [templateId]);

      if (result.rows.length === 0) {
        throw new Error('Workflow template not found');
      }

      const templateFromDb = result.rows[0];

      return {
        id: templateFromDb.id,
        name: templateFromDb.name,
        description: templateFromDb.description,
        category: templateFromDb.category,
        version: templateFromDb.version,
        isActive: templateFromDb.is_active,
        steps: templateFromDb.steps,
        triggers: templateFromDb.triggers,
        settings: templateFromDb.settings,
        createdAt: templateFromDb.created_at,
        updatedAt: templateFromDb.updated_at,
        createdBy: templateFromDb.created_by,
        lastModifiedBy: templateFromDb.last_modified_by
      };
    } catch (error) {
      console.error(`Error getting workflow template with id ${templateId}:`, error);
      throw new Error('Failed to get workflow template');
    }
  }

  async updateTemplate(
    templateId: string,
    updates: UpdateWorkflowTemplateRequest,
    updatedBy: string
  ): Promise<{
    template: WorkflowTemplate
    message: string
  }> {
    try {
      const existingTemplate = await this.getTemplate(templateId);

      // Process step updates
      let processedSteps = existingTemplate.steps;
      if (updates.steps) {
        processedSteps = updates.steps.map((step, index) => ({
          ...step,
          id: step.id || createObjectId(),
          order: step.order || index + 1
        }));
        this.validateStepConfiguration(processedSteps);
      }

      const updateDocument = {
        ...updates,
        steps: processedSteps,
        version: existingTemplate.version + 1,
        updatedAt: new Date(),
        lastModifiedBy: updatedBy
      };

      const sql = `
        UPDATE ${this.templatesTable}
        SET name = $1, description = $2, category = $3, version = $4, is_active = $5, steps = $6, triggers = $7, settings = $8, last_modified_by = $9, updated_at = $10
        WHERE id = $11;
      `;

      const params = [
        updateDocument.name || existingTemplate.name,
        updateDocument.description || existingTemplate.description,
        updateDocument.category || existingTemplate.category,
        updateDocument.version,
        updateDocument.isActive !== undefined ? updateDocument.isActive : existingTemplate.isActive,
        JSON.stringify(updateDocument.steps),
        JSON.stringify(updateDocument.triggers || existingTemplate.triggers),
        JSON.stringify(updateDocument.settings || existingTemplate.settings),
        updateDocument.lastModifiedBy,
        updateDocument.updatedAt,
        templateId
      ];

      const result = await query(sql, params);

      if (result.rowCount === 0) {
        throw new Error('Failed to update workflow template');
      }

      const template = await this.getTemplate(templateId);

      return {
        template,
        message: 'Workflow template updated successfully'
      };
    } catch (error) {
      console.error(`Error updating workflow template with id ${templateId}:`, error);
      throw new Error('Failed to update workflow template');
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
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      let whereClause = '';
      const params = [];

      if (filters.category) {
        whereClause += `WHERE category = $${params.length + 1}`;
        params.push(filters.category);
      }

      if (filters.isActive !== undefined) {
        whereClause += whereClause ? ' AND ' : 'WHERE ';
        whereClause += `is_active = $${params.length + 1}`;
        params.push(filters.isActive);
      }

      const totalSql = `SELECT COUNT(*) FROM ${this.templatesTable} ${whereClause}`;
      const totalResult = await query(totalSql, params);
      const total = parseInt(totalResult.rows[0].count, 10);

      const sql = `
        SELECT id, name, description, category, version, is_active, steps, triggers, settings, created_by, last_modified_by, created_at, updated_at
        FROM ${this.templatesTable}
        ${whereClause}
        ORDER BY updated_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2};
      `;

      const result = await query(sql, [...params, limit, offset]);

      const templates = result.rows.map(templateFromDb => ({
        id: templateFromDb.id,
        name: templateFromDb.name,
        description: templateFromDb.description,
        category: templateFromDb.category,
        version: templateFromDb.version,
        isActive: templateFromDb.is_active,
        steps: templateFromDb.steps,
        triggers: templateFromDb.triggers,
        settings: templateFromDb.settings,
        createdAt: templateFromDb.created_at,
        updatedAt: templateFromDb.updated_at,
        createdBy: templateFromDb.created_by,
        lastModifiedBy: templateFromDb.last_modified_by
      }));

      return {
        templates,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error listing workflow templates:', error);
      throw new Error('Failed to list workflow templates');
    }
  }

  /**
   * Workflow Instance Management
   */

  async startWorkflow(
    request: StartWorkflowRequest,
    startedBy: string
  ): Promise<{
    workflow: WorkflowInstance
    message: string
  }> {
    try {
      // Get template
      const template = await this.getTemplate(request.templateId)
      if (!template.isActive) {
        throw new Error('Cannot start workflow from inactive template')
      }

      await this.validateWorkflowContext(request.contextType, request.contextId)

      const existingWorkflow = await this.findActiveWorkflowForContext(
        request.contextType,
        request.contextId
      )
      if (existingWorkflow && !template.settings.allowParallelExecution) {
        throw new Error('An active workflow already exists for this context')
      }

      // Create workflow instance
      const workflowId = createObjectId();
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

      const sql = `
        INSERT INTO ${this.instancesTable} (id, template_id, template_version, name, category, status, priority, context_type, context_id, context_data, current_step_id, current_step_order, steps, variables, started_at, due_date, created_by, assigned_to, tags, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING id;
      `;

      const params = [
        workflowId,
        workflowInstance.templateId,
        workflowInstance.templateVersion,
        workflowInstance.name,
        workflowInstance.category,
        workflowInstance.status,
        workflowInstance.priority,
        workflowInstance.contextType,
        workflowInstance.contextId,
        JSON.stringify(workflowInstance.contextData),
        workflowInstance.currentStepId,
        workflowInstance.currentStepOrder,
        JSON.stringify(workflowInstance.steps),
        JSON.stringify(workflowInstance.variables),
        workflowInstance.startedAt,
        workflowInstance.dueDate,
        workflowInstance.createdBy,
        JSON.stringify(workflowInstance.assignedTo),
        JSON.stringify(workflowInstance.tags),
        JSON.stringify(workflowInstance.metadata)
      ];

      await query(sql, params);

      const workflow: WorkflowInstance = {
        id: workflowId,
        ...workflowInstance
      }

      await this.startStep(workflow.id, instanceSteps[0].id, startedBy)

      if (template.settings.notifyOnStart) {
        await this.sendWorkflowNotification(workflow, 'assignment')
      }

      return {
        workflow,
        message: 'Workflow started successfully'
      }
    } catch (error) {
      console.error('Error starting workflow:', error);
      throw new Error('Failed to start workflow');
    }
  }

  async getWorkflow(workflowId: string, user?: JWTPayload): Promise<WorkflowInstance> {
    try {
      const sql = `
        SELECT id, template_id, template_version, name, category, status, priority, context_type, context_id, context_data, current_step_id, current_step_order, steps, variables, started_at, completed_at, due_date, created_by, assigned_to, tags, metadata
        FROM ${this.instancesTable}
        WHERE id = $1;
      `;

      const result = await query(sql, [workflowId]);

      if (result.rows.length === 0) {
        throw new Error('Workflow not found');
      }

      const workflowFromDb = result.rows[0];

      if (user && !this.canAccessWorkflow(workflowFromDb, user)) {
        throw new Error('Access denied to this workflow');
      }

      return {
        id: workflowFromDb.id,
        templateId: workflowFromDb.template_id,
        templateVersion: workflowFromDb.template_version,
        name: workflowFromDb.name,
        category: workflowFromDb.category,
        status: workflowFromDb.status,
        priority: workflowFromDb.priority,
        contextType: workflowFromDb.context_type,
        contextId: workflowFromDb.context_id,
        contextData: workflowFromDb.context_data,
        currentStepId: workflowFromDb.current_step_id,
        currentStepOrder: workflowFromDb.current_step_order,
        steps: workflowFromDb.steps,
        variables: workflowFromDb.variables,
        startedAt: workflowFromDb.started_at,
        completedAt: workflowFromDb.completed_at,
        dueDate: workflowFromDb.due_date,
        createdBy: workflowFromDb.created_by,
        assignedTo: workflowFromDb.assigned_to,
        tags: workflowFromDb.tags,
        metadata: workflowFromDb.metadata
      };
    } catch (error) {
      console.error(`Error getting workflow with id ${workflowId}:`, error);
      throw new Error('Failed to get workflow');
    }
  }

  async performAction(
    workflowId: string,
    stepId: string,
    actionRequest: WorkflowActionRequest,
    performedBy: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    workflow: WorkflowInstance
    nextStep?: WorkflowInstanceStep
    message: string
  }> {
    try {
      const workflow = await this.getWorkflow(workflowId)
      const step = workflow.steps.find(s => s.id === stepId)

      if (!step) {
        throw new Error('Workflow step not found')
      }

      if (step.status !== 'in_progress') {
        throw new Error('Step is not in progress')
      }

      if (!this.canPerformAction(step, performedBy, actionRequest.action)) {
        throw new Error('You are not authorized to perform this action')
      }

      // Create action record
      const action: WorkflowInstanceAction = {
        id: createObjectId(),
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
          await this.startStep(workflowId, nextStep.id, performedBy)
        } else {
          // Workflow completed
          await this.completeWorkflow(workflowId, performedBy)
        }
      } else if (updatedStep.status === 'failed') {
        // Handle workflow failure
        await this.failWorkflow(workflowId, actionRequest.reason || 'Step rejected', performedBy)
      }

      // Update workflow in database
      const updateDoc: any = {
        steps: updatedSteps,
        'metadata.lastActionAt': new Date(),
        'metadata.lastActionBy': performedBy
      }

      if (nextStep) {
        updateDoc.currentStepId = nextStep.id
        updateDoc.currentStepOrder = nextStep.order
      }

      const sql = `
        UPDATE ${this.instancesTable}
        SET steps = $1, metadata = metadata || $2, current_step_id = $3, current_step_order = $4
        WHERE id = $5;
      `;

      const params = [
        JSON.stringify(updateDoc.steps),
        JSON.stringify({ lastActionAt: updateDoc['metadata.lastActionAt'], lastActionBy: updateDoc['metadata.lastActionBy'] }),
        updateDoc.currentStepId,
        updateDoc.currentStepOrder,
        workflowId
      ];

      await query(sql, params);

      const updatedWorkflow = await this.getWorkflow(workflowId)

      return {
        workflow: updatedWorkflow,
        nextStep,
        message: `Action ${actionRequest.action} performed successfully`
      }
    } catch (error) {
      console.error('Error performing action:', error);
      throw new Error('Failed to perform action');
    }
  }

  async searchWorkflows(
    filters: WorkflowSearchFilters,
    user?: JWTPayload,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<WorkflowListResponse> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      let whereClause = '';
      const params = [];

      if (user && user.role !== 'admin') {
        whereClause += `WHERE (created_by = $${params.length + 1} OR assigned_to @> $${params.length + 2} OR steps @> $${params.length + 3})`
        params.push(user.id, JSON.stringify([user.id]), JSON.stringify([{ assignedTo: [user.id] }]));
      }

      if (filters.status && filters.status.length > 0) {
        whereClause += whereClause ? ' AND ' : 'WHERE ';
        whereClause += `status = ANY($${params.length + 1})`;
        params.push(filters.status);
      }

      // ... more filters ...

      const totalSql = `SELECT COUNT(*) FROM ${this.instancesTable} ${whereClause}`;
      const totalResult = await query(totalSql, params);
      const total = parseInt(totalResult.rows[0].count, 10);

      const sql = `
        SELECT id, template_id, template_version, name, category, status, priority, context_type, context_id, context_data, current_step_id, current_step_order, steps, variables, started_at, completed_at, due_date, created_by, assigned_to, tags, metadata
        FROM ${this.instancesTable}
        ${whereClause}
        ORDER BY started_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2};
      `;

      const result = await query(sql, [...params, limit, offset]);

      const workflows = result.rows.map(workflowFromDb => ({
        id: workflowFromDb.id,
        templateId: workflowFromDb.template_id,
        templateVersion: workflowFromDb.template_version,
        name: workflowFromDb.name,
        category: workflowFromDb.category,
        status: workflowFromDb.status,
        priority: workflowFromDb.priority,
        contextType: workflowFromDb.context_type,
        contextId: workflowFromDb.context_id,
        contextData: workflowFromDb.context_data,
        currentStepId: workflowFromDb.current_step_id,
        currentStepOrder: workflowFromDb.current_step_order,
        steps: workflowFromDb.steps,
        variables: workflowFromDb.variables,
        startedAt: workflowFromDb.started_at,
        completedAt: workflowFromDb.completed_at,
        dueDate: workflowFromDb.due_date,
        createdBy: workflowFromDb.created_by,
        assignedTo: workflowFromDb.assigned_to,
        tags: workflowFromDb.tags,
        metadata: workflowFromDb.metadata
      }));

      return {
        workflows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        filters,
        aggregations: {
          byStatus: {},
          byCategory: {},
          byPriority: {},
          overdue: 0
        }
      };
    } catch (error) {
      console.error('Error searching workflows:', error);
      throw new Error('Failed to search workflows');
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
    const sql = `
      SELECT COUNT(*) FROM ${this.instancesTable}
      WHERE template_id = $1 AND status = ANY($2);
    `;
    const params = [templateId, ['active', 'pending', 'in_progress']];
    const result = await query(sql, params);
    return parseInt(result.rows[0].count, 10) > 0;
  }

  private async validateWorkflowContext(contextType: string, contextId: string): Promise<void> {
    // Validate that the context exists
    // This would check the appropriate table based on contextType
    // For now, we'll just validate the format
    if (!isValidObjectId(contextId)) {
      throw new Error('Invalid context ID format');
    }
  }

  private async findActiveWorkflowForContext(
    contextType: string,
    contextId: string
  ): Promise<WorkflowInstance | null> {
    const sql = `
      SELECT id, template_id, template_version, name, category, status, priority, context_type, context_id, context_data, current_step_id, current_step_order, steps, variables, started_at, completed_at, due_date, created_by, assigned_to, tags, metadata
      FROM ${this.instancesTable}
      WHERE context_type = $1 AND context_id = $2 AND status = ANY($3);
    `;
    const params = [contextType, contextId, ['active', 'pending', 'in_progress']];
    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return null;
    }

    const workflowFromDb = result.rows[0];

    return {
      id: workflowFromDb.id,
      templateId: workflowFromDb.template_id,
      templateVersion: workflowFromDb.template_version,
      name: workflowFromDb.name,
      category: workflowFromDb.category,
      status: workflowFromDb.status,
      priority: workflowFromDb.priority,
      contextType: workflowFromDb.context_type,
      contextId: workflowFromDb.context_id,
      contextData: workflowFromDb.context_data,
      currentStepId: workflowFromDb.current_step_id,
      currentStepOrder: workflowFromDb.current_step_order,
      steps: workflowFromDb.steps,
      variables: workflowFromDb.variables,
      startedAt: workflowFromDb.started_at,
      completedAt: workflowFromDb.completed_at,
      dueDate: workflowFromDb.due_date,
      createdBy: workflowFromDb.created_by,
      assignedTo: workflowFromDb.assigned_to,
      tags: workflowFromDb.tags,
      metadata: workflowFromDb.metadata
    };
  }

  private createInstanceSteps(templateSteps: any[], variables: Record<string, any>): WorkflowInstanceStep[] {
    return templateSteps.map(step => ({
      id: createObjectId(),
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
    startedBy: string
  ): Promise<void> {
    const sql = `
      UPDATE ${this.instancesTable}
      SET steps = jsonb_set(
        steps,
        (SELECT '{' || index - 1 || ',status}' FROM jsonb_array_elements(steps) WITH ORDINALITY arr(step, index) WHERE step->>'id' = $2),
        '"in_progress"'
      ),
      steps = jsonb_set(
        steps,
        (SELECT '{' || index - 1 || ',startedAt}' FROM jsonb_array_elements(steps) WITH ORDINALITY arr(step, index) WHERE step->>'id' = $2),
        '"' || NOW() || '"'
      )
      WHERE id = $1;
    `;
    const params = [workflowId, stepId];
    await query(sql, params);
  }

  private getNextStep(workflow: WorkflowInstance, updatedSteps: WorkflowInstanceStep[]): WorkflowInstanceStep | undefined {
    const currentOrder = workflow.currentStepOrder
    return updatedSteps
      .filter(step => step.order > currentOrder && step.status === 'pending')
      .sort((a, b) => a.order - b.order)[0]
  }

  private async completeWorkflow(
    workflowId: string,
    completedBy: string
  ): Promise<void> {
    const sql = `
      UPDATE ${this.instancesTable}
      SET status = 'completed', completed_at = NOW(), metadata = metadata || jsonb_build_object('completedBy', $2)
      WHERE id = $1;
    `;
    const params = [workflowId, completedBy];
    await query(sql, params);
  }

  private async failWorkflow(
    workflowId: string,
    reason: string,
    failedBy: string
  ): Promise<void> {
    const sql = `
      UPDATE ${this.instancesTable}
      SET status = 'failed', completed_at = NOW(), metadata = metadata || jsonb_build_object('failureReason', $2, 'failedBy', $3)
      WHERE id = $1;
    `;
    const params = [workflowId, reason, failedBy];
    await query(sql, params);
  }

  private canAccessWorkflow(workflow: any, user: JWTPayload): boolean {
    if (user.role === 'admin') return true
    
    // User can access if they created it, are assigned to it, or assigned to any step
    return workflow.createdBy === user.id ||
           (Array.isArray(workflow.assignedTo) && workflow.assignedTo.includes(user.id)) ||
           (Array.isArray(workflow.steps) && workflow.steps.some(step => Array.isArray(step.assignedTo) && step.assignedTo.includes(user.id)))
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