import { WorkflowEngine } from '../workflow-engine'
import { CreateWorkflowTemplateRequest, StartWorkflowRequest, WorkflowActionRequest } from '@/types/workflow'

// Mock dependencies
jest.mock('../mongodb-service', () => ({
  MongoDBConnection: {
    getInstance: jest.fn().mockReturnValue({
      connect: jest.fn().mockResolvedValue({
        collection: jest.fn().mockReturnValue({
          insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
          findOne: jest.fn().mockResolvedValue(null),
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([]),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis()
          }),
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
          countDocuments: jest.fn().mockResolvedValue(0),
          aggregate: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([{
              workflows: [],
              total: [{ count: 0 }],
              aggregations: [{ byStatus: [], byCategory: [], byPriority: [], overdue: 0 }]
            }])
          })
        })
      })
    })
  },
  BaseMongoService: class MockBaseMongoService {
    protected db = {
      collection: jest.fn().mockReturnValue({
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis()
        }),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        countDocuments: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([{
            workflows: [],
            total: [{ count: 0 }],
            aggregations: [{ byStatus: [], byCategory: [], byPriority: [], overdue: 0 }]
          }])
        })
      })
    }
    protected ensureConnection = jest.fn().mockResolvedValue(undefined)
    protected handleError = jest.fn().mockImplementation((operation, error) => {
      throw error
    })
  }
}))

describe('WorkflowEngine', () => {
  let workflowEngine: WorkflowEngine

  beforeEach(() => {
    workflowEngine = new WorkflowEngine()
    jest.clearAllMocks()
  })

  describe('Template Management', () => {
    const mockTemplateData: CreateWorkflowTemplateRequest = {
      name: 'Test Workflow',
      description: 'Test workflow description',
      category: 'asset_transfer',
      steps: [
        {
          name: 'Step 1',
          description: 'First step',
          type: 'approval',
          order: 1,
          isRequired: true,
          assignmentType: 'role',
          assignedTo: ['admin'],
          conditions: [],
          actions: []
        }
      ],
      triggers: [
        {
          event: 'manual',
          conditions: []
        }
      ],
      settings: {
        allowParallelExecution: false,
        autoAdvanceOnApproval: true,
        requireComments: false,
        notifyOnStart: true,
        notifyOnComplete: true,
        retentionDays: 30
      }
    }

    test('should create workflow template successfully', async () => {
      const result = await workflowEngine.createTemplate(mockTemplateData, 'admin-id')

      expect(result).toHaveProperty('template')
      expect(result).toHaveProperty('message')
      expect(result.template.name).toBe(mockTemplateData.name)
      expect(result.template.steps).toHaveLength(1)
      expect(result.template.steps[0]).toHaveProperty('id')
    })

    test('should validate template data', async () => {
      const invalidTemplate = {
        ...mockTemplateData,
        name: '' // Invalid name
      }

      await expect(workflowEngine.createTemplate(invalidTemplate, 'admin-id'))
        .rejects.toThrow('Template name must be at least 3 characters long')
    })

    test('should validate step configuration', async () => {
      const invalidTemplate = {
        ...mockTemplateData,
        steps: [
          {
            ...mockTemplateData.steps[0],
            assignedTo: [] // Invalid assignment
          }
        ]
      }

      await expect(workflowEngine.createTemplate(invalidTemplate, 'admin-id'))
        .rejects.toThrow('Step assignment is required')
    })

    test('should get template by ID', async () => {
      const mockTemplate = {
        _id: { toString: () => 'template-id' },
        name: 'Test Template',
        description: 'Test description',
        category: 'asset_transfer',
        version: 1,
        isActive: true,
        steps: [],
        triggers: [],
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin-id',
        lastModifiedBy: 'admin-id'
      }

      const mockDb = workflowEngine['db']
      mockDb.collection().findOne.mockResolvedValueOnce(mockTemplate)

      const result = await workflowEngine.getTemplate('template-id')

      expect(result.id).toBe('template-id')
      expect(result.name).toBe('Test Template')
    })

    test('should throw error for non-existent template', async () => {
      const mockDb = workflowEngine['db']
      mockDb.collection().findOne.mockResolvedValueOnce(null)

      await expect(workflowEngine.getTemplate('non-existent-id'))
        .rejects.toThrow('Workflow template not found')
    })

    test('should list templates with pagination', async () => {
      const result = await workflowEngine.listTemplates({}, { page: 1, limit: 10 })

      expect(result).toHaveProperty('templates')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('page')
      expect(result).toHaveProperty('limit')
      expect(result).toHaveProperty('totalPages')
    })
  })

  describe('Workflow Instance Management', () => {
    const mockStartRequest: StartWorkflowRequest = {
      templateId: 'template-id',
      contextType: 'asset',
      contextId: 'asset-id',
      contextData: { assetNumber: 'AST-001' },
      priority: 'medium'
    }

    const mockTemplate = {
      id: 'template-id',
      name: 'Test Template',
      description: 'Test description',
      category: 'asset_transfer',
      version: 1,
      isActive: true,
      steps: [
        {
          id: 'step-1',
          name: 'Step 1',
          description: 'First step',
          type: 'approval',
          order: 1,
          isRequired: true,
          assignmentType: 'role',
          assignedTo: ['admin'],
          conditions: [],
          actions: []
        }
      ],
      triggers: [],
      settings: {
        allowParallelExecution: false,
        autoAdvanceOnApproval: true,
        requireComments: false,
        notifyOnStart: true,
        notifyOnComplete: true,
        retentionDays: 30
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin-id',
      lastModifiedBy: 'admin-id'
    }

    beforeEach(() => {
      // Mock getTemplate method
      jest.spyOn(workflowEngine, 'getTemplate').mockResolvedValue(mockTemplate)
    })

    test('should start workflow successfully', async () => {
      const mockDb = workflowEngine['db']
      mockDb.collection().findOne.mockResolvedValueOnce(null) // No existing workflow

      const result = await workflowEngine.startWorkflow(mockStartRequest, 'user-id')

      expect(result).toHaveProperty('workflow')
      expect(result).toHaveProperty('message')
      expect(result.workflow.templateId).toBe(mockStartRequest.templateId)
      expect(result.workflow.contextId).toBe(mockStartRequest.contextId)
      expect(result.workflow.status).toBe('active')
    })

    test('should prevent parallel execution when not allowed', async () => {
      const mockDb = workflowEngine['db']
      mockDb.collection().findOne.mockResolvedValueOnce({
        _id: { toString: () => 'existing-workflow-id' },
        status: 'active'
      })

      await expect(workflowEngine.startWorkflow(mockStartRequest, 'user-id'))
        .rejects.toThrow('An active workflow already exists for this context')
    })

    test('should get workflow by ID', async () => {
      const mockWorkflow = {
        _id: { toString: () => 'workflow-id' },
        templateId: 'template-id',
        templateVersion: 1,
        name: 'Test Workflow',
        category: 'asset_transfer',
        status: 'active',
        priority: 'medium',
        contextType: 'asset',
        contextId: 'asset-id',
        contextData: {},
        currentStepId: 'step-1',
        currentStepOrder: 1,
        steps: [],
        variables: {},
        startedAt: new Date(),
        createdBy: 'user-id',
        assignedTo: [],
        tags: [],
        metadata: {}
      }

      const mockDb = workflowEngine['db']
      mockDb.collection().findOne.mockResolvedValueOnce(mockWorkflow)

      const result = await workflowEngine.getWorkflow('workflow-id')

      expect(result.id).toBe('workflow-id')
      expect(result.status).toBe('active')
    })

    test('should perform workflow action', async () => {
      const mockWorkflow = {
        id: 'workflow-id',
        templateId: 'template-id',
        templateVersion: 1,
        name: 'Test Workflow',
        category: 'asset_transfer',
        status: 'active',
        priority: 'medium',
        contextType: 'asset',
        contextId: 'asset-id',
        contextData: {},
        currentStepId: 'step-1',
        currentStepOrder: 1,
        steps: [
          {
            id: 'step-1',
            templateStepId: 'step-1',
            name: 'Step 1',
            type: 'approval',
            order: 1,
            status: 'in_progress',
            assignedTo: ['user-id'],
            actions: [],
            comments: [],
            attachments: [],
            escalations: []
          }
        ],
        variables: {},
        startedAt: new Date(),
        createdBy: 'user-id',
        assignedTo: [],
        tags: [],
        metadata: {}
      }

      jest.spyOn(workflowEngine, 'getWorkflow').mockResolvedValue(mockWorkflow)

      const actionRequest: WorkflowActionRequest = {
        action: 'approve',
        comment: 'Approved by user'
      }

      const result = await workflowEngine.performAction(
        'workflow-id',
        'step-1',
        actionRequest,
        'user-id'
      )

      expect(result).toHaveProperty('workflow')
      expect(result).toHaveProperty('message')
      expect(result.message).toContain('approve')
    })

    test('should prevent unauthorized actions', async () => {
      const mockWorkflow = {
        id: 'workflow-id',
        templateId: 'template-id',
        templateVersion: 1,
        name: 'Test Workflow',
        category: 'asset_transfer',
        status: 'active',
        priority: 'medium',
        contextType: 'asset',
        contextId: 'asset-id',
        contextData: {},
        currentStepId: 'step-1',
        currentStepOrder: 1,
        steps: [
          {
            id: 'step-1',
            templateStepId: 'step-1',
            name: 'Step 1',
            type: 'approval',
            order: 1,
            status: 'in_progress',
            assignedTo: ['other-user-id'], // Different user
            actions: [],
            comments: [],
            attachments: [],
            escalations: []
          }
        ],
        variables: {},
        startedAt: new Date(),
        createdBy: 'user-id',
        assignedTo: [],
        tags: [],
        metadata: {}
      }

      jest.spyOn(workflowEngine, 'getWorkflow').mockResolvedValue(mockWorkflow)

      const actionRequest: WorkflowActionRequest = {
        action: 'approve',
        comment: 'Approved by user'
      }

      await expect(workflowEngine.performAction(
        'workflow-id',
        'step-1',
        actionRequest,
        'user-id'
      )).rejects.toThrow('You are not authorized to perform this action')
    })

    test('should search workflows with filters', async () => {
      const filters = {
        status: ['active', 'pending'],
        category: ['asset_transfer']
      }

      const result = await workflowEngine.searchWorkflows(filters, undefined, { page: 1, limit: 10 })

      expect(result).toHaveProperty('workflows')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('aggregations')
      expect(result.filters).toEqual(filters)
    })
  })

  describe('Access Control', () => {
    test('should allow admin access to all workflows', () => {
      const workflow = {
        createdBy: 'other-user',
        assignedTo: [],
        steps: []
      }

      const adminUser = {
        id: 'admin-id',
        role: 'admin',
        email: 'admin@test.com',
        department: 'IT'
      }

      const canAccess = workflowEngine['canAccessWorkflow'](workflow, adminUser)
      expect(canAccess).toBe(true)
    })

    test('should allow creator access to workflow', () => {
      const workflow = {
        createdBy: 'user-id',
        assignedTo: [],
        steps: []
      }

      const user = {
        id: 'user-id',
        role: 'user',
        email: 'user@test.com',
        department: 'Finance'
      }

      const canAccess = workflowEngine['canAccessWorkflow'](workflow, user)
      expect(canAccess).toBe(true)
    })

    test('should allow assigned user access to workflow', () => {
      const workflow = {
        createdBy: 'other-user',
        assignedTo: ['user-id'],
        steps: []
      }

      const user = {
        id: 'user-id',
        role: 'user',
        email: 'user@test.com',
        department: 'Finance'
      }

      const canAccess = workflowEngine['canAccessWorkflow'](workflow, user)
      expect(canAccess).toBe(true)
    })

    test('should deny access to unrelated user', () => {
      const workflow = {
        createdBy: 'other-user',
        assignedTo: ['different-user'],
        steps: []
      }

      const user = {
        id: 'user-id',
        role: 'user',
        email: 'user@test.com',
        department: 'Finance'
      }

      const canAccess = workflowEngine['canAccessWorkflow'](workflow, user)
      expect(canAccess).toBe(false)
    })
  })

  describe('Step Management', () => {
    test('should resolve step assignments correctly', () => {
      const step = {
        assignmentType: 'role',
        assignedTo: ['admin', 'spoc']
      }

      const variables = {}

      const assignments = workflowEngine['resolveAssignments'](step, variables)
      expect(assignments).toEqual(['admin', 'spoc'])
    })

    test('should get next step in sequence', () => {
      const workflow = {
        currentStepOrder: 1
      }

      const steps = [
        { id: 'step-1', order: 1, status: 'completed' },
        { id: 'step-2', order: 2, status: 'pending' },
        { id: 'step-3', order: 3, status: 'pending' }
      ]

      const nextStep = workflowEngine['getNextStep'](workflow as any, steps as any)
      expect(nextStep?.id).toBe('step-2')
    })

    test('should return undefined when no next step available', () => {
      const workflow = {
        currentStepOrder: 3
      }

      const steps = [
        { id: 'step-1', order: 1, status: 'completed' },
        { id: 'step-2', order: 2, status: 'completed' },
        { id: 'step-3', order: 3, status: 'completed' }
      ]

      const nextStep = workflowEngine['getNextStep'](workflow as any, steps as any)
      expect(nextStep).toBeUndefined()
    })
  })
})