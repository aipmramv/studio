import { ConfigurationManagementService } from '../configuration-management'
import { JWTPayload } from '@/types/auth'

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
            sort: jest.fn().mockReturnThis()
          }),
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 })
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
          sort: jest.fn().mockReturnThis()
        }),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 })
      })
    }
    protected ensureConnection = jest.fn().mockResolvedValue(undefined)
    protected handleError = jest.fn().mockImplementation((operation, error) => {
      throw error
    })
  }
}))

describe('ConfigurationManagementService', () => {
  let configService: ConfigurationManagementService

  const mockAdminUser: JWTPayload = {
    id: 'admin-id',
    email: 'admin@test.com',
    role: 'admin',
    department: 'IT'
  }

  const mockUser: JWTPayload = {
    id: 'user-id',
    email: 'user@test.com',
    role: 'user',
    department: 'Finance'
  }

  beforeEach(() => {
    configService = new ConfigurationManagementService()
    jest.clearAllMocks()
  })

  describe('System Configuration Management', () => {
    const mockConfiguration = {
      _id: { toString: () => 'config-id' },
      category: 'system',
      key: 'app.name',
      name: 'Application Name',
      description: 'Name of the application',
      value: 'KTI Assets',
      dataType: 'string',
      isEncrypted: false,
      isRequired: true,
      environment: 'all',
      scope: 'global',
      permissions: {
        read: ['admin', 'spoc', 'user'],
        write: ['admin']
      },
      version: 1,
      isActive: true,
      lastModified: new Date(),
      modifiedBy: 'admin-id',
      createdAt: new Date(),
      createdBy: 'admin-id'
    }

    test('should get system configurations', async () => {
      const mockDb = configService['db']
      mockDb.collection().find().sort().toArray.mockResolvedValue([mockConfiguration])

      const configurations = await configService.getSystemConfiguration(
        undefined,
        undefined,
        undefined,
        mockAdminUser
      )

      expect(configurations).toHaveLength(1)
      expect(configurations[0].key).toBe('app.name')
      expect(configurations[0].value).toBe('KTI Assets')
    })

    test('should filter configurations by permissions', async () => {
      const restrictedConfig = {
        ...mockConfiguration,
        permissions: {
          read: ['admin'],
          write: ['admin']
        }
      }

      const mockDb = configService['db']
      mockDb.collection().find().sort().toArray.mockResolvedValue([restrictedConfig])

      const configurations = await configService.getSystemConfiguration(
        undefined,
        undefined,
        undefined,
        mockUser // Non-admin user
      )

      expect(configurations).toHaveLength(0) // Should be filtered out
    })

    test('should hide encrypted values', async () => {
      const encryptedConfig = {
        ...mockConfiguration,
        isEncrypted: true,
        value: 'encrypted-value'
      }

      const mockDb = configService['db']
      mockDb.collection().find().sort().toArray.mockResolvedValue([encryptedConfig])

      const configurations = await configService.getSystemConfiguration(
        undefined,
        undefined,
        undefined,
        mockAdminUser
      )

      expect(configurations[0].value).toBe('[ENCRYPTED]')
    })

    test('should update system configuration', async () => {
      const mockDb = configService['db']
      mockDb.collection().findOne
        .mockResolvedValueOnce(mockConfiguration) // First call for validation
        .mockResolvedValueOnce({ // Second call for returning updated config
          ...mockConfiguration,
          value: 'Updated Value',
          version: 2
        })

      const result = await configService.updateSystemConfiguration(
        'app.name',
        'Updated Value',
        'admin-id',
        mockAdminUser
      )

      expect(result.value).toBe('Updated Value')
      expect(result.version).toBe(2)
    })

    test('should validate configuration permissions for updates', async () => {
      const mockDb = configService['db']
      mockDb.collection().findOne.mockResolvedValue(mockConfiguration)

      await expect(configService.updateSystemConfiguration(
        'app.name',
        'New Value',
        'user-id',
        mockUser // Non-admin user
      )).rejects.toThrow('Insufficient permissions to update this configuration')
    })

    test('should create system configuration', async () => {
      const configData = {
        category: 'application' as const,
        key: 'app.version',
        name: 'Application Version',
        description: 'Current version of the application',
        value: '1.0.0',
        dataType: 'string' as const,
        isEncrypted: false,
        isRequired: true,
        environment: 'all' as const,
        scope: 'global' as const,
        permissions: {
          read: ['admin', 'spoc', 'user'],
          write: ['admin']
        },
        isActive: true
      }

      const result = await configService.createSystemConfiguration(
        configData,
        'admin-id',
        mockAdminUser
      )

      expect(result.key).toBe('app.version')
      expect(result.version).toBe(1)
    })

    test('should prevent non-admin from creating configurations', async () => {
      const configData = {
        category: 'application' as const,
        key: 'test.key',
        name: 'Test Config',
        description: 'Test configuration',
        value: 'test',
        dataType: 'string' as const,
        isEncrypted: false,
        isRequired: false,
        environment: 'all' as const,
        scope: 'global' as const,
        permissions: {
          read: ['admin'],
          write: ['admin']
        },
        isActive: true
      }

      await expect(configService.createSystemConfiguration(
        configData,
        'user-id',
        mockUser
      )).rejects.toThrow('Only administrators can create system configurations')
    })
  })

  describe('Notification Rules Management', () => {
    const mockNotificationRule = {
      _id: { toString: () => 'rule-id' },
      name: 'Asset Transfer Notification',
      description: 'Notify on asset transfer',
      category: 'workflow',
      eventType: 'asset_transfer_requested',
      conditions: [],
      actions: [
        {
          type: 'email',
          recipients: [{ type: 'role', value: 'admin' }],
          template: 'asset_transfer_template'
        }
      ],
      channels: [
        {
          type: 'email',
          config: {},
          isActive: true
        }
      ],
      priority: 'medium',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin-id',
      lastModifiedBy: 'admin-id'
    }

    test('should get notification rules', async () => {
      const mockDb = configService['db']
      mockDb.collection().find().sort().toArray.mockResolvedValue([mockNotificationRule])

      const rules = await configService.getNotificationRules()

      expect(rules).toHaveLength(1)
      expect(rules[0].name).toBe('Asset Transfer Notification')
      expect(rules[0].category).toBe('workflow')
    })

    test('should filter notification rules by category', async () => {
      const mockDb = configService['db']
      mockDb.collection().find().sort().toArray.mockResolvedValue([mockNotificationRule])

      await configService.getNotificationRules('workflow')

      expect(mockDb.collection().find).toHaveBeenCalledWith({ category: 'workflow' })
    })

    test('should create notification rule', async () => {
      const ruleData = {
        name: 'Test Notification Rule',
        description: 'Test rule description',
        category: 'system' as const,
        eventType: 'test_event',
        conditions: [],
        actions: [
          {
            type: 'email' as const,
            recipients: [{ type: 'role' as const, value: 'admin' }]
          }
        ],
        channels: [
          {
            type: 'email' as const,
            config: {},
            isActive: true
          }
        ],
        priority: 'medium' as const,
        isActive: true
      }

      const result = await configService.createNotificationRule(ruleData, 'admin-id')

      expect(result.name).toBe('Test Notification Rule')
      expect(result.id).toBe('mock-id')
    })

    test('should update notification rule', async () => {
      const mockDb = configService['db']
      mockDb.collection().findOne.mockResolvedValue({
        ...mockNotificationRule,
        name: 'Updated Rule Name'
      })

      const result = await configService.updateNotificationRule(
        'rule-id',
        { name: 'Updated Rule Name' },
        'admin-id'
      )

      expect(result.name).toBe('Updated Rule Name')
    })
  })

  describe('Workflow Template Configuration Management', () => {
    const mockWorkflowConfig = {
      _id: { toString: () => 'config-id' },
      name: 'Asset Transfer Config',
      description: 'Configuration for asset transfer workflows',
      category: 'asset_transfer',
      isDefault: true,
      configuration: {
        autoStart: true,
        allowParallelExecution: false,
        defaultPriority: 'medium',
        timeoutHours: 48,
        escalationRules: [],
        notificationSettings: {
          notifyOnStart: true,
          notifyOnComplete: true,
          notifyOnError: true,
          notifyOnEscalation: true,
          customNotifications: []
        }
      },
      permissions: {
        canUse: ['admin', 'spoc'],
        canModify: ['admin']
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin-id',
      lastModifiedBy: 'admin-id'
    }

    test('should get workflow template configurations', async () => {
      const mockDb = configService['db']
      mockDb.collection().find().sort().toArray.mockResolvedValue([mockWorkflowConfig])

      const configs = await configService.getWorkflowTemplateConfigs()

      expect(configs).toHaveLength(1)
      expect(configs[0].name).toBe('Asset Transfer Config')
      expect(configs[0].isDefault).toBe(true)
    })

    test('should create workflow template configuration', async () => {
      const configData = {
        name: 'Test Workflow Config',
        description: 'Test configuration',
        category: 'test',
        isDefault: false,
        configuration: {
          autoStart: false,
          allowParallelExecution: true,
          defaultPriority: 'low' as const,
          escalationRules: [],
          notificationSettings: {
            notifyOnStart: false,
            notifyOnComplete: true,
            notifyOnError: true,
            notifyOnEscalation: true,
            customNotifications: []
          }
        },
        permissions: {
          canUse: ['admin'],
          canModify: ['admin']
        },
        isActive: true
      }

      const result = await configService.createWorkflowTemplateConfig(configData, 'admin-id')

      expect(result.name).toBe('Test Workflow Config')
      expect(result.id).toBe('mock-id')
    })
  })

  describe('Alert Rules Management', () => {
    const mockAlertRule = {
      _id: { toString: () => 'alert-id' },
      name: 'High Asset Value Alert',
      description: 'Alert when asset value exceeds threshold',
      category: 'business',
      metric: 'asset_value',
      condition: {
        operator: 'greater_than',
        threshold: 100000
      },
      severity: 'warning',
      actions: [
        {
          type: 'notification',
          config: { template: 'high_value_alert' }
        }
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin-id',
      lastModifiedBy: 'admin-id'
    }

    test('should get alert rules', async () => {
      const mockDb = configService['db']
      mockDb.collection().find().sort().toArray.mockResolvedValue([mockAlertRule])

      const rules = await configService.getAlertRules()

      expect(rules).toHaveLength(1)
      expect(rules[0].name).toBe('High Asset Value Alert')
      expect(rules[0].severity).toBe('warning')
    })

    test('should create alert rule', async () => {
      const ruleData = {
        name: 'Test Alert Rule',
        description: 'Test alert description',
        category: 'performance' as const,
        metric: 'response_time',
        condition: {
          operator: 'greater_than' as const,
          threshold: 5000,
          duration: 5
        },
        severity: 'error' as const,
        actions: [
          {
            type: 'notification' as const,
            config: { message: 'Performance degraded' }
          }
        ],
        isActive: true
      }

      const result = await configService.createAlertRule(ruleData, 'admin-id')

      expect(result.name).toBe('Test Alert Rule')
      expect(result.id).toBe('mock-id')
    })
  })

  describe('Configuration Validation', () => {
    test('should validate regex pattern', () => {
      const validation = {
        type: 'regex' as const,
        rule: '^[A-Z]{3}$',
        message: 'Must be 3 uppercase letters'
      }

      expect(() => {
        configService['validateConfigurationValue']('ABC', validation, 'string')
      }).not.toThrow()

      expect(() => {
        configService['validateConfigurationValue']('abc', validation, 'string')
      }).toThrow('Must be 3 uppercase letters')
    })

    test('should validate number range', () => {
      const validation = {
        type: 'range' as const,
        rule: [1, 100],
        message: 'Must be between 1 and 100'
      }

      expect(() => {
        configService['validateConfigurationValue'](50, validation, 'number')
      }).not.toThrow()

      expect(() => {
        configService['validateConfigurationValue'](150, validation, 'number')
      }).toThrow('Must be between 1 and 100')
    })

    test('should validate enum values', () => {
      const validation = {
        type: 'enum' as const,
        rule: ['development', 'staging', 'production'],
        message: 'Must be a valid environment'
      }

      expect(() => {
        configService['validateConfigurationValue']('production', validation, 'string')
      }).not.toThrow()

      expect(() => {
        configService['validateConfigurationValue']('invalid', validation, 'string')
      }).toThrow('Must be a valid environment')
    })
  })

  describe('Permission Checking', () => {
    const mockConfig = {
      permissions: {
        read: ['admin', 'spoc'],
        write: ['admin']
      }
    }

    test('should allow admin all permissions', () => {
      expect(configService['hasConfigurationPermission'](mockConfig, 'read', mockAdminUser)).toBe(true)
      expect(configService['hasConfigurationPermission'](mockConfig, 'write', mockAdminUser)).toBe(true)
    })

    test('should check role-based permissions', () => {
      const spocUser = { ...mockUser, role: 'spoc' }
      
      expect(configService['hasConfigurationPermission'](mockConfig, 'read', spocUser)).toBe(true)
      expect(configService['hasConfigurationPermission'](mockConfig, 'write', spocUser)).toBe(false)
    })

    test('should deny access to unauthorized users', () => {
      expect(configService['hasConfigurationPermission'](mockConfig, 'read', mockUser)).toBe(false)
      expect(configService['hasConfigurationPermission'](mockConfig, 'write', mockUser)).toBe(false)
    })
  })

  describe('Encryption/Decryption', () => {
    test('should encrypt and decrypt values', () => {
      const originalValue = { secret: 'password123' }
      
      const encrypted = configService['encryptValue'](originalValue)
      expect(encrypted).not.toBe(originalValue)
      expect(typeof encrypted).toBe('string')

      const decrypted = configService['decryptValue'](encrypted)
      expect(decrypted).toEqual(originalValue)
    })

    test('should handle decryption errors gracefully', () => {
      const invalidEncrypted = 'invalid-base64-string'
      
      const result = configService['decryptValue'](invalidEncrypted)
      expect(result).toBe(invalidEncrypted) // Should return original value on error
    })
  })
})