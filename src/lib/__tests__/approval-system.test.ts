import { ApprovalSystem } from '../approval-system'
import { WorkflowEngine } from '../workflow-engine'
import { ApprovalRequest } from '../approval-system'
import { JWTPayload } from '@/types/auth'

// Mock dependencies
jest.mock('../mongodb-service', () => ({
  MongoDBConnection: {
    getInstance: jest.fn().mockReturnValue({
      connect: jest.fn().mockResolvedValue({
        collection: jest.fn().mockReturnValue({
          insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
          insertMany: jest.fn().mockResolvedValue({ insertedIds: ['id1', 'id2'] }),
          findOne: jest.fn().mockResolvedValue(null),
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([]),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis()
          }),
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
          updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
          countDocuments: jest.fn().mockResolvedValue(0),
          aggregate: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([{
              tasks: [],
              total: [{ count: 0 }]
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
        insertMany: jest.fn().mockResolvedValue({ insertedIds: ['id1', 'id2'] }),
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis()
        }),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        countDocuments: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([{
            tasks: [],
            total: [{ count: 0 }]
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

jest.mock('../workflow-engine')

describe('ApprovalSystem', () => {
  let approvalSystem: ApprovalSystem
  let mockWorkflowEngine: jest.Mocked<WorkflowEngine>

  const mockUser: JWTPayload = {
    id: 'user-id',
    email: 'user@test.com',
    role: 'user',
    department: 'Finance'
  }

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
        name: 'Approval Step',
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
    createdBy: 'creator-id',
    assignedTo: [],
    tags: [],
    metadata: {}
  }

  beforeEach(() => {
    mockWorkflowEngine = new WorkflowEngine() as jest.Mocked<WorkflowEngine>
    approvalSystem = new ApprovalSystem(mockWorkflowEngine)
    jest.clearAllMocks()
  })

  describe('processApproval', () => {
    const mockApprovalRequest: ApprovalRequest = {
      workflowId: 'workflow-id',
      stepId: 'step-1',
      action: 'approve',
      comment: 'Approved by user'
    }

    beforeEach(() => {
      mockWorkflowEngine.getWorkflow.mockResolvedValue(mockWorkflow)
      mockWorkflowEngine.performAction.mockResolvedValue({
        workflow: mockWorkflow,
        message: 'Action performed successfully'
      })
    })

    test('should process approval successfully', async () => {
      const result = await approvalSystem.processApproval(
        mockApprovalRequest,
        mockUser,
        '127.0.0.1',
        'test-agent'
      )

      expect(result.success).toBe(true)
      expect(result.workflow).toEqual(mockWorkflow)
      expect(result.message).toContain('Action performed successfully')
      expect(mockWorkflowEngine.performAction).toHaveBeenCalledWith(
        'workflow-id',
        'step-1',
        expect.objectContaining({
          action: 'approve',
          comment: 'Approved by user'
        }),
        'user-id',
        '127.0.0.1',
        'test-agent',
        undefined
      )
    })

    test('should validate approval request', async () => {
      const invalidRequest = {
        ...mockApprovalRequest,
        workflowId: '' // Invalid workflow ID
      }

      await expect(approvalSystem.processApproval(invalidRequest, mockUser))
        .rejects.toThrow('Workflow ID and Step ID are required')
    })

    test('should validate approval action', async () => {
      const invalidRequest = {
        ...mockApprovalRequest,
        action: 'invalid_action' as any
      }

      await expect(approvalSystem.processApproval(invalidRequest, mockUser))
        .rejects.toThrow('Invalid approval action')
    })

    test('should require reason for rejection', async () => {
      const rejectRequest = {
        ...mockApprovalRequest,
        action: 'reject' as const
        // Missing reason
      }

      await expect(approvalSystem.processApproval(rejectRequest, mockUser))
        .rejects.toThrow('Reason is required for rejection')
    })

    test('should require delegation target for delegate action', async () => {
      const delegateRequest = {
        ...mockApprovalRequest,
        action: 'delegate' as const
        // Missing delegateTo
      }

      await expect(approvalSystem.processApproval(delegateRequest, mockUser))
        .rejects.toThrow('Delegation target is required for delegate action')
    })

    test('should check user authorization', async () => {
      const unauthorizedWorkflow = {
        ...mockWorkflow,
        steps: [
          {
            ...mockWorkflow.steps[0],
            assignedTo: ['other-user-id'] // Different user
          }
        ]
      }

      mockWorkflowEngine.getWorkflow.mockResolvedValue(unauthorizedWorkflow)

      await expect(approvalSystem.processApproval(mockApprovalRequest, mockUser))
        .rejects.toThrow('You are not authorized to perform this approval action')
    })

    test('should handle delegation', async () => {
      const delegateRequest: ApprovalRequest = {
        workflowId: 'workflow-id',
        stepId: 'step-1',
        action: 'delegate',
        comment: 'Delegating to team lead',
        delegateTo: ['team-lead-id']
      }

      const result = await approvalSystem.processApproval(delegateRequest, mockUser)

      expect(result.success).toBe(true)
      expect(mockWorkflowEngine.performAction).toHaveBeenCalledWith(
        'workflow-id',
        'step-1',
        expect.objectContaining({
          action: 'reassign',
          reassignTo: ['team-lead-id']
        }),
        'user-id',
        undefined,
        undefined,
        undefined
      )
    })
  })

  describe('getApprovalTasks', () => {
    test('should get approval tasks for user', async () => {
      const result = await approvalSystem.getApprovalTasks('user-id')

      expect(result).toHaveProperty('tasks')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('page')
      expect(result).toHaveProperty('limit')
      expect(result).toHaveProperty('totalPages')
    })

    test('should apply filters correctly', async () => {
      const filters = {
        status: ['pending'],
        priority: ['high'],
        overdue: true
      }

      await approvalSystem.getApprovalTasks('user-id', filters)

      // Verify that the aggregation pipeline includes the filters
      const mockDb = approvalSystem['db']
      expect(mockDb.collection).toHaveBeenCalledWith('workflowInstances')
    })

    test('should handle pagination', async () => {
      const pagination = { page: 2, limit: 5 }

      const result = await approvalSystem.getApprovalTasks('user-id', {}, pagination)

      expect(result.page).toBe(2)
      expect(result.limit).toBe(5)
    })
  })

  describe('getApprovalDashboard', () => {
    beforeEach(() => {
      // Mock the methods called by getApprovalDashboard
      jest.spyOn(approvalSystem, 'getApprovalTasks')
        .mockResolvedValueOnce({ tasks: [], total: 0, page: 1, limit: 20, totalPages: 0 }) // pending
        .mockResolvedValueOnce({ tasks: [], total: 0, page: 1, limit: 20, totalPages: 0 }) // overdue

      jest.spyOn(approvalSystem as any, 'getRecentApprovalActions')
        .mockResolvedValue([])

      jest.spyOn(approvalSystem as any, 'calculateApprovalStatistics')
        .mockResolvedValue({
          totalPending: 0,
          totalOverdue: 0,
          completedToday: 0,
          averageResponseTime: 0
        })
    })

    test('should get approval dashboard for user', async () => {
      const result = await approvalSystem.getApprovalDashboard('user-id')

      expect(result).toHaveProperty('pendingApprovals')
      expect(result).toHaveProperty('overdueApprovals')
      expect(result).toHaveProperty('recentActions')
      expect(result).toHaveProperty('statistics')
    })
  })

  describe('createEscalationRule', () => {
    const mockEscalationRule = {
      workflowId: 'workflow-id',
      stepId: 'step-1',
      triggerAfterHours: 24,
      escalateTo: ['manager-id'],
      action: 'notify' as const,
      message: 'Approval overdue'
    }

    test('should create escalation rule successfully', async () => {
      const result = await approvalSystem.createEscalationRule(mockEscalationRule, 'admin-id')

      expect(result).toHaveProperty('id')
      expect(result.workflowId).toBe(mockEscalationRule.workflowId)
      expect(result.isActive).toBe(true)
    })
  })

  describe('processEscalations', () => {
    test('should process escalations for overdue approvals', async () => {
      const mockEscalationRules = [
        {
          _id: new Date(), // Mock ObjectId
          workflowId: 'workflow-id',
          stepId: 'step-1',
          triggerAfterHours: 24,
          escalateTo: ['manager-id'],
          action: 'notify',
          isActive: true
        }
      ]

      const mockOverdueWorkflow = {
        _id: { toString: () => 'workflow-id' },
        status: 'active',
        steps: [
          {
            id: 'step-1',
            status: 'in_progress',
            startedAt: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
          }
        ]
      }

      const mockDb = approvalSystem['db']
      mockDb.collection().find().toArray
        .mockResolvedValueOnce(mockEscalationRules) // escalation rules
      mockDb.collection().findOne
        .mockResolvedValueOnce(mockOverdueWorkflow) // workflow

      const result = await approvalSystem.processEscalations()

      expect(result.processed).toBeGreaterThan(0)
      expect(result.errors).toEqual([])
    })

    test('should handle escalation errors gracefully', async () => {
      const mockEscalationRules = [
        {
          _id: new Date(),
          workflowId: 'invalid-workflow-id',
          stepId: 'step-1',
          triggerAfterHours: 24,
          escalateTo: ['manager-id'],
          action: 'notify',
          isActive: true
        }
      ]

      const mockDb = approvalSystem['db']
      mockDb.collection().find().toArray
        .mockResolvedValueOnce(mockEscalationRules)
      mockDb.collection().findOne
        .mockResolvedValueOnce(null) // No workflow found

      const result = await approvalSystem.processEscalations()

      expect(result.processed).toBeGreaterThan(0)
      expect(result.escalated).toBe(0)
    })
  })

  describe('sendReminders', () => {
    test('should send reminders for overdue approvals', async () => {
      const mockOverdueWorkflows = [
        {
          _id: { toString: () => 'workflow-id' },
          name: 'Test Workflow',
          priority: 'medium',
          steps: [
            {
              id: 'step-1',
              name: 'Approval Step',
              status: 'in_progress',
              assignedTo: ['user-id'],
              dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day overdue
            }
          ]
        }
      ]

      const mockDb = approvalSystem['db']
      mockDb.collection().find().toArray
        .mockResolvedValueOnce(mockOverdueWorkflows)

      const result = await approvalSystem.sendReminders()

      expect(result.sent).toBeGreaterThan(0)
      expect(result.errors).toEqual([])
    })
  })

  describe('Access Control', () => {
    test('should allow assigned user to perform approval', () => {
      const step = {
        id: 'step-1',
        assignedTo: ['user-id'],
        status: 'in_progress'
      }

      const canPerform = approvalSystem['canPerformApproval'](step as any, mockUser, 'approve')
      expect(canPerform).toBe(true)
    })

    test('should deny unassigned user from performing approval', () => {
      const step = {
        id: 'step-1',
        assignedTo: ['other-user-id'],
        status: 'in_progress'
      }

      const canPerform = approvalSystem['canPerformApproval'](step as any, mockUser, 'approve')
      expect(canPerform).toBe(false)
    })

    test('should deny approval on completed step', () => {
      const step = {
        id: 'step-1',
        assignedTo: ['user-id'],
        status: 'completed'
      }

      const canPerform = approvalSystem['canPerformApproval'](step as any, mockUser, 'approve')
      expect(canPerform).toBe(false)
    })
  })

  describe('Notification Generation', () => {
    test('should generate approval notifications', async () => {
      const step = mockWorkflow.steps[0]
      
      const notifications = await approvalSystem['generateApprovalNotifications'](
        mockWorkflow,
        step,
        'approve',
        mockUser
      )

      expect(notifications).toHaveLength(1) // Notification to workflow creator
      expect(notifications[0].type).toBe('completion')
      expect(notifications[0].recipients).toContain('creator-id')
    })

    test('should generate delegation notifications', async () => {
      const notifications = await approvalSystem['generateDelegationNotifications'](
        mockWorkflow,
        'step-1',
        mockUser,
        ['team-lead-id']
      )

      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe('assignment')
      expect(notifications[0].recipients).toContain('team-lead-id')
    })
  })
})