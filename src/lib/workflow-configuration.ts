import { MongoDBConnection, BaseMongoService } from './mongodb-service'
import { ObjectId, ClientSession } from '@/types/server-types'
import { WorkflowEngine } from './workflow-engine'
import { WorkflowTemplates } from './workflow-templates'
import {
  WorkflowTemplate,
  CreateWorkflowTemplateRequest,
  UpdateWorkflowTemplateRequest,
  WorkflowStep,
  WorkflowCondition,
  WorkflowAction,
  StartWorkflowRequest
} from '@/types/workflow'
import { JWTPayload } from '@/types/auth'

// Configuration-specific types
export interface WorkflowConfiguration {
  id: string
  name: string
  description: string
  category: string
  isSystemTemplate: boolean
  isActive: boolean
  version: number
  template: WorkflowTemplate
  permissions: WorkflowPermissions
  validation: WorkflowValidation
  testing: WorkflowTesting
  deployment: WorkflowDeployment
  createdAt: Date
  updatedAt: Date
  createdBy: string
  lastModifiedBy: string
}

export interface WorkflowPermissions {
  canView: string[] // Role names or user IDs
  canEdit: string[] // Role names or user IDs
  canDelete: string[] // Role names or user IDs
  canDeploy: string[] // Role names or user IDs
  canTest: string[] // Role names or user IDs
}

export interface WorkflowValidation {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  lastValidated: Date
  validatedBy: string
}

export interface ValidationError {
  type: 'step_config' | 'assignment' | 'condition' | 'action' | 'trigger' | 'dependency'
  stepId?: string
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  type: string
  stepId?: string
  field: string
  message: string
  recommendation?: string
}

export interface WorkflowTesting {
  testCases: WorkflowTestCase[]
  lastTestRun?: Date
  testResults?: WorkflowTestResults
}

export interface WorkflowTestCase {
  id: string
  name: string
  description: string
  scenario: string
  inputData: Record<string, any>
  expectedOutcome: {
    finalStatus: string
    completedSteps: string[]
    expectedDuration?: number
  }
  isActive: boolean
}

export interface WorkflowTestResults {
  testRunId: string
  runAt: Date
  runBy: string
  totalTests: number
  passedTests: number
  failedTests: number
  results: Array<{
    testCaseId: string
    status: 'passed' | 'failed' | 'error'
    duration: number
    error?: string
    actualOutcome?: any
  }>
}

export interface WorkflowDeployment {
  status: 'draft' | 'testing' | 'staging' | 'production'
  deployedAt?: Date
  deployedBy?: string
  rollbackVersion?: number
  deploymentNotes?: string
}

export interface WorkflowConfigurationRequest {
  name: string
  description: string
  category: string
  template: CreateWorkflowTemplateRequest
  permissions?: Partial<WorkflowPermissions>
  testCases?: Omit<WorkflowTestCase, 'id'>[]
}

export interface WorkflowConfigurationUpdate {
  name?: string
  description?: string
  template?: UpdateWorkflowTemplateRequest
  permissions?: Partial<WorkflowPermissions>
  testCases?: Omit<WorkflowTestCase, 'id'>[]
  isActive?: boolean
}

/**
 * Workflow Configuration Management Service
 * Handles workflow template configuration, validation, testing, and deployment
 */
export class WorkflowConfigurationManager extends BaseMongoService<any> {
  private workflowEngine: WorkflowEngine
  private configurationsCollection = 'workflowConfigurations'
  private testRunsCollection = 'workflowTestRuns'

  constructor(workflowEngine: WorkflowEngine) {
    super('workflow_configuration')
    this.workflowEngine = workflowEngine
  }

  /**
   * Create new workflow configuration
   */
  async createConfiguration(
    request: WorkflowConfigurationRequest,
    createdBy: string,
    session?: ClientSession
  ): Promise<{
    configuration: WorkflowConfiguration
    validation: WorkflowValidation
    message: string
  }> {
    try {
      await this.ensureConnection()

      // Validate the template configuration
      const validation = await this.validateWorkflowTemplate(request.template)

      // Create workflow template first
      const templateResult = await this.workflowEngine.createTemplate(
        request.template,
        createdBy,
        session
      )

      // Create configuration document
      const configurationDoc: Omit<WorkflowConfiguration, 'id'> = {
        name: request.name,
        description: request.description,
        category: request.category,
        isSystemTemplate: false,
        isActive: validation.isValid && validation.errors.length === 0,
        version: 1,
        template: templateResult.template,
        permissions: {
          canView: ['admin'],
          canEdit: ['admin'],
          canDelete: ['admin'],
          canDeploy: ['admin'],
          canTest: ['admin'],
          ...request.permissions
        },
        validation,
        testing: {
          testCases: request.testCases?.map(tc => ({
            ...tc,
            id: new ObjectId().toString()
          })) || []
        },
        deployment: {
          status: 'draft'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        lastModifiedBy: createdBy
      }

      const configurationsCollection = this.db.collection(this.configurationsCollection)
      const result = await configurationsCollection.insertOne(
        configurationDoc,
        session ? { session } : {}
      )

      const configuration: WorkflowConfiguration = {
        id: result.insertedId.toString(),
        ...configurationDoc
      }

      return {
        configuration,
        validation,
        message: 'Workflow configuration created successfully'
      }
    } catch (error) {
      this.handleError('createConfiguration', error)
    }
  }

  /**
   * Get workflow configuration by ID
   */
  async getConfiguration(
    configurationId: string,
    user?: JWTPayload
  ): Promise<WorkflowConfiguration> {
    try {
      await this.ensureConnection()

      const configurationsCollection = this.db.collection(this.configurationsCollection)
      const config = await configurationsCollection.findOne({
        _id: new ObjectId(configurationId)
      })

      if (!config) {
        throw new Error('Workflow configuration not found')
      }

      // Check permissions
      if (user && !this.canViewConfiguration(config, user)) {
        throw new Error('Access denied to this workflow configuration')
      }

      return {
        id: config._id.toString(),
        name: config.name,
        description: config.description,
        category: config.category,
        isSystemTemplate: config.isSystemTemplate,
        isActive: config.isActive,
        version: config.version,
        template: config.template,
        permissions: config.permissions,
        validation: config.validation,
        testing: config.testing,
        deployment: config.deployment,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
        createdBy: config.createdBy,
        lastModifiedBy: config.lastModifiedBy
      }
    } catch (error) {
      this.handleError('getConfiguration', error)
    }
  }

  /**
   * Update workflow configuration
   */
  async updateConfiguration(
    configurationId: string,
    updates: WorkflowConfigurationUpdate,
    updatedBy: string,
    user?: JWTPayload,
    session?: ClientSession
  ): Promise<{
    configuration: WorkflowConfiguration
    validation: WorkflowValidation
    message: string
  }> {
    try {
      await this.ensureConnection()

      const currentConfig = await this.getConfiguration(configurationId, user)

      // Check permissions
      if (user && !this.canEditConfiguration(currentConfig, user)) {
        throw new Error('Access denied to edit this workflow configuration')
      }

      // Check if configuration has active instances
      if (updates.template && currentConfig.isActive) {
        const hasActiveInstances = await this.hasActiveWorkflowInstances(currentConfig.template.id)
        if (hasActiveInstances) {
          throw new Error('Cannot modify template structure while there are active workflow instances')
        }
      }

      let validation = currentConfig.validation
      let updatedTemplate = currentConfig.template

      // Update template if provided
      if (updates.template) {
        // Validate the updated template
        const mergedTemplate = {
          ...currentConfig.template,
          ...updates.template
        }
        validation = await this.validateWorkflowTemplate(mergedTemplate)

        // Update the actual template
        const templateResult = await this.workflowEngine.updateTemplate(
          currentConfig.template.id,
          updates.template,
          updatedBy,
          session
        )
        updatedTemplate = templateResult.template
      }

      // Process test cases
      let testCases = currentConfig.testing.testCases
      if (updates.testCases) {
        testCases = updates.testCases.map(tc => ({
          ...tc,
          id: new ObjectId().toString()
        }))
      }

      // Prepare update document
      const updateDocument = {
        ...updates,
        template: updatedTemplate,
        validation,
        testing: {
          ...currentConfig.testing,
          testCases
        },
        version: currentConfig.version + 1,
        updatedAt: new Date(),
        lastModifiedBy: updatedBy
      }

      // Update configuration
      const configurationsCollection = this.db.collection(this.configurationsCollection)
      const result = await configurationsCollection.updateOne(
        { _id: new ObjectId(configurationId) },
        { $set: updateDocument },
        session ? { session } : {}
      )

      if (result.modifiedCount === 0) {
        throw new Error('Failed to update workflow configuration')
      }

      const configuration = await this.getConfiguration(configurationId)

      return {
        configuration,
        validation,
        message: 'Workflow configuration updated successfully'
      }
    } catch (error) {
      this.handleError('updateConfiguration', error)
    }
  }

  /**
   * Delete workflow configuration
   */
  async deleteConfiguration(
    configurationId: string,
    deletedBy: string,
    user?: JWTPayload,
    session?: ClientSession
  ): Promise<{ message: string }> {
    try {
      await this.ensureConnection()

      const config = await this.getConfiguration(configurationId, user)

      // Check permissions
      if (user && !this.canDeleteConfiguration(config, user)) {
        throw new Error('Access denied to delete this workflow configuration')
      }

      // Check if it's a system template
      if (config.isSystemTemplate) {
        throw new Error('Cannot delete system workflow templates')
      }

      // Check if configuration has active instances
      if (config.isActive) {
        const hasActiveInstances = await this.hasActiveWorkflowInstances(config.template.id)
        if (hasActiveInstances) {
          throw new Error('Cannot delete configuration with active workflow instances')
        }
      }

      // Soft delete by deactivating
      const configurationsCollection = this.db.collection(this.configurationsCollection)
      await configurationsCollection.updateOne(
        { _id: new ObjectId(configurationId) },
        {
          $set: {
            isActive: false,
            'deployment.status': 'draft',
            deletedAt: new Date(),
            deletedBy,
            updatedAt: new Date(),
            lastModifiedBy: deletedBy
          }
        },
        session ? { session } : {}
      )

      return { message: 'Workflow configuration deleted successfully' }
    } catch (error) {
      this.handleError('deleteConfiguration', error)
    }
  }

  /**
   * List workflow configurations
   */
  async listConfigurations(
    filters: {
      category?: string
      status?: string
      isActive?: boolean
      createdBy?: string
    } = {},
    user?: JWTPayload,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{
    configurations: WorkflowConfiguration[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    try {
      await this.ensureConnection()

      const configurationsCollection = this.db.collection(this.configurationsCollection)
      let query: any = {}

      // Apply filters
      if (filters.category) query.category = filters.category
      if (filters.status) query['deployment.status'] = filters.status
      if (filters.isActive !== undefined) query.isActive = filters.isActive
      if (filters.createdBy) query.createdBy = filters.createdBy

      // Apply user-based filtering
      if (user && user.role !== 'admin') {
        query.$or = [
          { 'permissions.canView': user.role },
          { 'permissions.canView': user.id },
          { createdBy: user.id }
        ]
      }

      const { page, limit } = pagination
      const skip = (page - 1) * limit

      const [configurations, total] = await Promise.all([
        configurationsCollection
          .find(query)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        configurationsCollection.countDocuments(query)
      ])

      const processedConfigurations = configurations.map(config => ({
        id: config._id.toString(),
        name: config.name,
        description: config.description,
        category: config.category,
        isSystemTemplate: config.isSystemTemplate,
        isActive: config.isActive,
        version: config.version,
        template: config.template,
        permissions: config.permissions,
        validation: config.validation,
        testing: config.testing,
        deployment: config.deployment,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
        createdBy: config.createdBy,
        lastModifiedBy: config.lastModifiedBy
      }))

      return {
        configurations: processedConfigurations,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    } catch (error) {
      this.handleError('listConfigurations', error)
    }
  }

  /**
   * Validate workflow template
   */
  async validateWorkflowTemplate(
    template: CreateWorkflowTemplateRequest | UpdateWorkflowTemplateRequest | any
  ): Promise<WorkflowValidation> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    try {
      // Basic template validation
      if (!template.name || template.name.trim().length < 3) {
        errors.push({
          type: 'step_config',
          field: 'name',
          message: 'Template name must be at least 3 characters long',
          severity: 'error'
        })
      }

      if (!template.steps || template.steps.length === 0) {
        errors.push({
          type: 'step_config',
          field: 'steps',
          message: 'Template must have at least one step',
          severity: 'error'
        })
      }

      // Step validation
      if (template.steps) {
        const stepOrders = new Set()
        const stepIds = new Set()

        for (const step of template.steps) {
          // Check for duplicate orders
          if (stepOrders.has(step.order)) {
            errors.push({
              type: 'step_config',
              stepId: step.id,
              field: 'order',
              message: `Duplicate step order: ${step.order}`,
              severity: 'error'
            })
          }
          stepOrders.add(step.order)

          // Check for duplicate IDs
          if (step.id && stepIds.has(step.id)) {
            errors.push({
              type: 'step_config',
              stepId: step.id,
              field: 'id',
              message: `Duplicate step ID: ${step.id}`,
              severity: 'error'
            })
          }
          if (step.id) stepIds.add(step.id)

          // Validate step configuration
          await this.validateStep(step, errors, warnings)
        }

        // Check for gaps in step order
        const orders = Array.from(stepOrders).sort((a, b) => a - b)
        for (let i = 1; i < orders.length; i++) {
          if (orders[i] - orders[i - 1] > 1) {
            warnings.push({
              type: 'step_config',
              field: 'order',
              message: `Gap in step order between ${orders[i - 1]} and ${orders[i]}`,
              recommendation: 'Consider reordering steps to be sequential'
            })
          }
        }
      }

      // Trigger validation
      if (template.triggers) {
        for (const trigger of template.triggers) {
          if (!trigger.event) {
            errors.push({
              type: 'trigger',
              field: 'event',
              message: 'Trigger event is required',
              severity: 'error'
            })
          }
        }
      }

      // Settings validation
      if (template.settings) {
        if (template.settings.retentionDays && template.settings.retentionDays < 1) {
          errors.push({
            type: 'step_config',
            field: 'retentionDays',
            message: 'Retention days must be at least 1',
            severity: 'error'
          })
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        lastValidated: new Date(),
        validatedBy: 'system'
      }
    } catch (error) {
      errors.push({
        type: 'step_config',
        field: 'general',
        message: `Validation error: ${error.message}`,
        severity: 'error'
      })

      return {
        isValid: false,
        errors,
        warnings,
        lastValidated: new Date(),
        validatedBy: 'system'
      }
    }
  }

  /**
   * Test workflow configuration
   */
  async testWorkflowConfiguration(
    configurationId: string,
    testCaseIds?: string[],
    testedBy?: string,
    user?: JWTPayload
  ): Promise<WorkflowTestResults> {
    try {
      await this.ensureConnection()

      const config = await this.getConfiguration(configurationId, user)

      // Check permissions
      if (user && !this.canTestConfiguration(config, user)) {
        throw new Error('Access denied to test this workflow configuration')
      }

      const testRunId = new ObjectId().toString()
      const testCases = testCaseIds 
        ? config.testing.testCases.filter(tc => testCaseIds.includes(tc.id))
        : config.testing.testCases.filter(tc => tc.isActive)

      const results: WorkflowTestResults = {
        testRunId,
        runAt: new Date(),
        runBy: testedBy || 'system',
        totalTests: testCases.length,
        passedTests: 0,
        failedTests: 0,
        results: []
      }

      // Run each test case
      for (const testCase of testCases) {
        const testResult = await this.runTestCase(config, testCase)
        results.results.push(testResult)

        if (testResult.status === 'passed') {
          results.passedTests++
        } else {
          results.failedTests++
        }
      }

      // Save test results
      const testRunsCollection = this.db.collection(this.testRunsCollection)
      await testRunsCollection.insertOne({
        configurationId,
        ...results
      })

      // Update configuration with test results
      const configurationsCollection = this.db.collection(this.configurationsCollection)
      await configurationsCollection.updateOne(
        { _id: new ObjectId(configurationId) },
        {
          $set: {
            'testing.lastTestRun': results.runAt,
            'testing.testResults': results,
            updatedAt: new Date()
          }
        }
      )

      return results
    } catch (error) {
      this.handleError('testWorkflowConfiguration', error)
    }
  }

  /**
   * Deploy workflow configuration
   */
  async deployConfiguration(
    configurationId: string,
    targetEnvironment: 'testing' | 'staging' | 'production',
    deployedBy: string,
    notes?: string,
    user?: JWTPayload,
    session?: ClientSession
  ): Promise<{
    configuration: WorkflowConfiguration
    message: string
  }> {
    try {
      await this.ensureConnection()

      const config = await this.getConfiguration(configurationId, user)

      // Check permissions
      if (user && !this.canDeployConfiguration(config, user)) {
        throw new Error('Access denied to deploy this workflow configuration')
      }

      // Validate configuration before deployment
      if (!config.validation.isValid) {
        throw new Error('Cannot deploy configuration with validation errors')
      }

      // Check if testing is required for production deployment
      if (targetEnvironment === 'production') {
        if (!config.testing.lastTestRun || config.testing.testResults?.failedTests > 0) {
          throw new Error('All tests must pass before production deployment')
        }
      }

      // Update deployment status
      const configurationsCollection = this.db.collection(this.configurationsCollection)
      await configurationsCollection.updateOne(
        { _id: new ObjectId(configurationId) },
        {
          $set: {
            'deployment.status': targetEnvironment,
            'deployment.deployedAt': new Date(),
            'deployment.deployedBy': deployedBy,
            'deployment.deploymentNotes': notes,
            isActive: true,
            updatedAt: new Date(),
            lastModifiedBy: deployedBy
          }
        },
        session ? { session } : {}
      )

      const updatedConfig = await this.getConfiguration(configurationId)

      return {
        configuration: updatedConfig,
        message: `Workflow configuration deployed to ${targetEnvironment} successfully`
      }
    } catch (error) {
      this.handleError('deployConfiguration', error)
    }
  }

  /**
   * Initialize system templates
   */
  async initializeSystemTemplates(createdBy: string): Promise<{
    created: number
    errors: string[]
  }> {
    try {
      const systemTemplates = WorkflowTemplates.getAllTemplates()
      let created = 0
      const errors: string[] = []

      for (const template of systemTemplates) {
        try {
          const configRequest: WorkflowConfigurationRequest = {
            name: template.name,
            description: template.description,
            category: template.category,
            template,
            permissions: {
              canView: ['admin', 'spoc'],
              canEdit: ['admin'],
              canDelete: [],
              canDeploy: ['admin'],
              canTest: ['admin']
            }
          }

          const result = await this.createConfiguration(configRequest, createdBy)
          
          // Mark as system template and deploy to production
          const configurationsCollection = this.db.collection(this.configurationsCollection)
          await configurationsCollection.updateOne(
            { _id: new ObjectId(result.configuration.id) },
            {
              $set: {
                isSystemTemplate: true,
                'deployment.status': 'production',
                'deployment.deployedAt': new Date(),
                'deployment.deployedBy': createdBy
              }
            }
          )

          created++
        } catch (error) {
          errors.push(`${template.name}: ${error.message}`)
        }
      }

      return { created, errors }
    } catch (error) {
      this.handleError('initializeSystemTemplates', error)
    }
  }

  // Private helper methods

  private async validateStep(
    step: WorkflowStep,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    // Step name validation
    if (!step.name || step.name.trim().length < 2) {
      errors.push({
        type: 'step_config',
        stepId: step.id,
        field: 'name',
        message: 'Step name must be at least 2 characters long',
        severity: 'error'
      })
    }

    // Assignment validation
    if (!step.assignmentType || !step.assignedTo || step.assignedTo.length === 0) {
      errors.push({
        type: 'assignment',
        stepId: step.id,
        field: 'assignedTo',
        message: 'Step must have assignment configuration',
        severity: 'error'
      })
    }

    // Timeout validation
    if (step.timeoutHours && step.timeoutHours < 1) {
      warnings.push({
        type: 'step_config',
        stepId: step.id,
        field: 'timeoutHours',
        message: 'Timeout less than 1 hour may be too short',
        recommendation: 'Consider increasing timeout duration'
      })
    }

    // Escalation rules validation
    if (step.escalationRules) {
      for (const rule of step.escalationRules) {
        if (!rule.escalateTo || rule.escalateTo.length === 0) {
          errors.push({
            type: 'step_config',
            stepId: step.id,
            field: 'escalationRules',
            message: 'Escalation rule must specify escalation targets',
            severity: 'error'
          })
        }
      }
    }

    // Form fields validation
    if (step.formFields) {
      for (const field of step.formFields) {
        if (!field.name || !field.label) {
          errors.push({
            type: 'step_config',
            stepId: step.id,
            field: 'formFields',
            message: 'Form field must have name and label',
            severity: 'error'
          })
        }
      }
    }
  }

  private async runTestCase(
    config: WorkflowConfiguration,
    testCase: WorkflowTestCase
  ): Promise<{
    testCaseId: string
    status: 'passed' | 'failed' | 'error'
    duration: number
    error?: string
    actualOutcome?: any
  }> {
    const startTime = Date.now()

    try {
      // Create a test workflow instance
      const startRequest: StartWorkflowRequest = {
        templateId: config.template.id,
        contextType: 'test',
        contextId: `test-${testCase.id}`,
        contextData: testCase.inputData,
        priority: 'low',
        variables: testCase.inputData
      }

      const workflowResult = await this.workflowEngine.startWorkflow(
        startRequest,
        'test-system'
      )

      // Simulate workflow execution based on test scenario
      const actualOutcome = await this.simulateWorkflowExecution(
        workflowResult.workflow,
        testCase
      )

      // Compare with expected outcome
      const passed = this.compareOutcomes(testCase.expectedOutcome, actualOutcome)

      return {
        testCaseId: testCase.id,
        status: passed ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        actualOutcome
      }
    } catch (error) {
      return {
        testCaseId: testCase.id,
        status: 'error',
        duration: Date.now() - startTime,
        error: error.message
      }
    }
  }

  private async simulateWorkflowExecution(workflow: any, testCase: WorkflowTestCase): Promise<any> {
    // This is a simplified simulation
    // In a real implementation, this would execute the workflow steps
    return {
      finalStatus: 'completed',
      completedSteps: workflow.steps.map(s => s.id),
      duration: 1000 // Mock duration
    }
  }

  private compareOutcomes(expected: any, actual: any): boolean {
    // Simple comparison - in reality this would be more sophisticated
    return expected.finalStatus === actual.finalStatus &&
           expected.completedSteps.length === actual.completedSteps.length
  }

  private async hasActiveWorkflowInstances(templateId: string): Promise<boolean> {
    const workflowsCollection = this.db.collection('workflowInstances')
    const count = await workflowsCollection.countDocuments({
      templateId,
      status: { $in: ['active', 'pending', 'in_progress'] }
    })
    return count > 0
  }

  private canViewConfiguration(config: any, user: JWTPayload): boolean {
    if (user.role === 'admin') return true
    return config.permissions.canView.includes(user.role) ||
           config.permissions.canView.includes(user.id) ||
           config.createdBy === user.id
  }

  private canEditConfiguration(config: any, user: JWTPayload): boolean {
    if (user.role === 'admin') return true
    return config.permissions.canEdit.includes(user.role) ||
           config.permissions.canEdit.includes(user.id)
  }

  private canDeleteConfiguration(config: any, user: JWTPayload): boolean {
    if (user.role === 'admin') return true
    return config.permissions.canDelete.includes(user.role) ||
           config.permissions.canDelete.includes(user.id)
  }

  private canTestConfiguration(config: any, user: JWTPayload): boolean {
    if (user.role === 'admin') return true
    return config.permissions.canTest.includes(user.role) ||
           config.permissions.canTest.includes(user.id)
  }

  private canDeployConfiguration(config: any, user: JWTPayload): boolean {
    if (user.role === 'admin') return true
    return config.permissions.canDeploy.includes(user.role) ||
           config.permissions.canDeploy.includes(user.id)
  }
}

// Export service instance
export const workflowConfigurationManager = new WorkflowConfigurationManager(new WorkflowEngine())