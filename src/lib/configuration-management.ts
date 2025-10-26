import 'server-only'

import { MongoDBConnection, BaseMongoService } from './mongodb-service'
import { ObjectId, ClientSession } from '@/types/server-types'
import { JWTPayload } from '@/types/auth'

// Configuration types and interfaces
export interface SystemConfiguration {
  id: string
  category: 'system' | 'application' | 'security' | 'integration' | 'notification'
  key: string
  name: string
  description: string
  value: any
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array'
  isEncrypted: boolean
  isRequired: boolean
  defaultValue?: any
  validation?: ConfigurationValidation
  environment: 'development' | 'staging' | 'production' | 'all'
  scope: 'global' | 'tenant' | 'user'
  permissions: ConfigurationPermissions
  version: number
  isActive: boolean
  lastModified: Date
  modifiedBy: string
  createdAt: Date
  createdBy: string
}

export interface ConfigurationValidation {
  type: 'regex' | 'range' | 'enum' | 'custom'
  rule: string | number[] | string[]
  message?: string
}

export interface ConfigurationPermissions {
  read: string[] // Roles that can read
  write: string[] // Roles that can write
}

export interface NotificationRule {
  id: string
  name: string
  description: string
  category: 'workflow' | 'system' | 'security' | 'asset' | 'user'
  eventType: string
  conditions: NotificationCondition[]
  actions: NotificationAction[]
  channels: NotificationChannel[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  isActive: boolean
  schedule?: NotificationSchedule
  throttling?: NotificationThrottling
  template?: NotificationTemplate
  createdAt: Date
  updatedAt: Date
  createdBy: string
  lastModifiedBy: string
}

export interface NotificationCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
  logicalOperator?: 'AND' | 'OR'
}

export interface NotificationAction {
  type: 'email' | 'sms' | 'in_app' | 'webhook' | 'slack' | 'teams'
  recipients: NotificationRecipient[]
  template?: string
  customMessage?: string
  attachments?: string[]
}

export interface NotificationRecipient {
  type: 'user' | 'role' | 'department' | 'email' | 'dynamic'
  value: string
  conditions?: NotificationCondition[]
}

export interface NotificationChannel {
  type: 'email' | 'sms' | 'in_app' | 'webhook' | 'slack' | 'teams'
  config: Record<string, any>
  isActive: boolean
  retryPolicy?: {
    maxRetries: number
    retryDelay: number
    backoffMultiplier: number
  }
}

export interface NotificationSchedule {
  type: 'immediate' | 'delayed' | 'scheduled' | 'recurring'
  delay?: number // minutes
  scheduledAt?: Date
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    interval: number
    daysOfWeek?: number[]
    dayOfMonth?: number
    time: string // HH:MM
  }
}

export interface NotificationThrottling {
  enabled: boolean
  maxPerHour?: number
  maxPerDay?: number
  cooldownMinutes?: number
  groupBy?: string[]
}

export interface NotificationTemplate {
  id: string
  name: string
  type: 'email' | 'sms' | 'in_app' | 'webhook'
  subject?: string
  body: string
  variables: string[]
  isHtml?: boolean
  attachments?: string[]
}

export interface WorkflowTemplateConfig {
  id: string
  name: string
  description: string
  category: string
  isDefault: boolean
  configuration: {
    autoStart: boolean
    allowParallelExecution: boolean
    maxConcurrentInstances?: number
    defaultPriority: 'low' | 'medium' | 'high' | 'urgent'
    timeoutHours?: number
    escalationRules: EscalationRuleConfig[]
    notificationSettings: WorkflowNotificationSettings
  }
  permissions: {
    canUse: string[]
    canModify: string[]
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  lastModifiedBy: string
}

export interface EscalationRuleConfig {
  stepType: string
  timeoutHours: number
  escalateTo: string[]
  action: 'notify' | 'reassign' | 'auto_approve' | 'auto_reject'
  message?: string
}

export interface WorkflowNotificationSettings {
  notifyOnStart: boolean
  notifyOnComplete: boolean
  notifyOnError: boolean
  notifyOnEscalation: boolean
  customNotifications: CustomNotificationConfig[]
}

export interface CustomNotificationConfig {
  event: string
  recipients: string[]
  template?: string
  conditions?: NotificationCondition[]
}

export interface AlertRule {
  id: string
  name: string
  description: string
  category: 'performance' | 'security' | 'business' | 'system'
  metric: string
  condition: {
    operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals'
    threshold: number
    duration?: number // minutes
  }
  severity: 'info' | 'warning' | 'error' | 'critical'
  actions: AlertAction[]
  isActive: boolean
  suppressionRules?: AlertSuppressionRule[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
  lastModifiedBy: string
}

export interface AlertAction {
  type: 'notification' | 'webhook' | 'script' | 'ticket'
  config: Record<string, any>
  delay?: number // minutes
}

export interface AlertSuppressionRule {
  condition: string
  duration: number // minutes
  reason: string
}

/**
 * Configuration Management Service
 * Handles system configuration, workflow templates, and notification rules
 */
export class ConfigurationManagementService extends BaseMongoService<any> {
  private configurationsCollection = 'systemConfigurations'
  private notificationRulesCollection = 'notificationRules'
  private workflowTemplateConfigsCollection = 'workflowTemplateConfigs'
  private alertRulesCollection = 'alertRules'
  private notificationTemplatesCollection = 'notificationTemplates'

  constructor() {
    super('configuration_management')
  }

  /**
   * System Configuration Management
   */

  async getSystemConfiguration(
    key?: string,
    category?: string,
    environment?: string,
    user?: JWTPayload
  ): Promise<SystemConfiguration[]> {
    try {
      await this.ensureConnection()

      const configurationsCollection = this.db.collection(this.configurationsCollection)
      const query: any = { isActive: true }

      if (key) query.key = key
      if (category) query.category = category
      if (environment) {
        query.$or = [
          { environment },
          { environment: 'all' }
        ]
      }

      const configurations = await configurationsCollection
        .find(query)
        .sort({ category: 1, key: 1 })
        .toArray()

      // Filter based on permissions
      const filteredConfigs = configurations.filter(config => 
        this.hasConfigurationPermission(config, 'read', user)
      )

      return filteredConfigs.map(config => ({
        id: config._id.toString(),
        category: config.category,
        key: config.key,
        name: config.name,
        description: config.description,
        value: config.isEncrypted ? '[ENCRYPTED]' : config.value,
        dataType: config.dataType,
        isEncrypted: config.isEncrypted,
        isRequired: config.isRequired,
        defaultValue: config.defaultValue,
        validation: config.validation,
        environment: config.environment,
        scope: config.scope,
        permissions: config.permissions,
        version: config.version,
        isActive: config.isActive,
        lastModified: config.lastModified,
        modifiedBy: config.modifiedBy,
        createdAt: config.createdAt,
        createdBy: config.createdBy
      }))
    } catch (error) {
      this.handleError('getSystemConfiguration', error)
    }
  }

  async updateSystemConfiguration(
    key: string,
    value: any,
    updatedBy: string,
    user?: JWTPayload,
    session?: ClientSession
  ): Promise<SystemConfiguration> {
    try {
      await this.ensureConnection()

      const configurationsCollection = this.db.collection(this.configurationsCollection)
      const config = await configurationsCollection.findOne({ key, isActive: true })

      if (!config) {
        throw new Error(`Configuration key '${key}' not found`)
      }

      // Check permissions
      if (!this.hasConfigurationPermission(config, 'write', user)) {
        throw new Error('Insufficient permissions to update this configuration')
      }

      // Validate value
      if (config.validation) {
        this.validateConfigurationValue(value, config.validation, config.dataType)
      }

      // Encrypt value if needed
      const finalValue = config.isEncrypted ? this.encryptValue(value) : value

      // Update configuration
      const result = await configurationsCollection.updateOne(
        { key, isActive: true },
        {
          $set: {
            value: finalValue,
            version: config.version + 1,
            lastModified: new Date(),
            modifiedBy: updatedBy
          }
        },
        session ? { session } : {}
      )

      if (result.modifiedCount === 0) {
        throw new Error('Failed to update configuration')
      }

      // Return updated configuration
      const updatedConfig = await configurationsCollection.findOne({ key, isActive: true })
      return {
        id: updatedConfig._id.toString(),
        category: updatedConfig.category,
        key: updatedConfig.key,
        name: updatedConfig.name,
        description: updatedConfig.description,
        value: updatedConfig.isEncrypted ? '[ENCRYPTED]' : updatedConfig.value,
        dataType: updatedConfig.dataType,
        isEncrypted: updatedConfig.isEncrypted,
        isRequired: updatedConfig.isRequired,
        defaultValue: updatedConfig.defaultValue,
        validation: updatedConfig.validation,
        environment: updatedConfig.environment,
        scope: updatedConfig.scope,
        permissions: updatedConfig.permissions,
        version: updatedConfig.version,
        isActive: updatedConfig.isActive,
        lastModified: updatedConfig.lastModified,
        modifiedBy: updatedConfig.modifiedBy,
        createdAt: updatedConfig.createdAt,
        createdBy: updatedConfig.createdBy
      }
    } catch (error) {
      this.handleError('updateSystemConfiguration', error)
    }
  }

  async createSystemConfiguration(
    configData: Omit<SystemConfiguration, 'id' | 'version' | 'lastModified' | 'createdAt'>,
    createdBy: string,
    user?: JWTPayload,
    session?: ClientSession
  ): Promise<SystemConfiguration> {
    try {
      await this.ensureConnection()

      // Check permissions (admin only)
      if (user?.role !== 'admin') {
        throw new Error('Only administrators can create system configurations')
      }

      const configurationsCollection = this.db.collection(this.configurationsCollection)

      // Check if key already exists
      const existing = await configurationsCollection.findOne({ key: configData.key })
      if (existing) {
        throw new Error(`Configuration key '${configData.key}' already exists`)
      }

      // Validate value
      if (configData.validation) {
        this.validateConfigurationValue(configData.value, configData.validation, configData.dataType)
      }

      const configDocument = {
        ...configData,
        value: configData.isEncrypted ? this.encryptValue(configData.value) : configData.value,
        version: 1,
        lastModified: new Date(),
        modifiedBy: createdBy,
        createdAt: new Date(),
        createdBy
      }

      const result = await configurationsCollection.insertOne(
        configDocument,
        session ? { session } : {}
      )

      return {
        id: result.insertedId.toString(),
        ...configData,
        value: configData.isEncrypted ? '[ENCRYPTED]' : configData.value,
        version: 1,
        lastModified: configDocument.lastModified,
        modifiedBy: createdBy,
        createdAt: configDocument.createdAt,
        createdBy
      }
    } catch (error) {
      this.handleError('createSystemConfiguration', error)
    }
  }

  /**
   * Notification Rules Management
   */

  async getNotificationRules(
    category?: string,
    isActive?: boolean
  ): Promise<NotificationRule[]> {
    try {
      await this.ensureConnection()

      const rulesCollection = this.db.collection(this.notificationRulesCollection)
      const query: any = {}

      if (category) query.category = category
      if (isActive !== undefined) query.isActive = isActive

      const rules = await rulesCollection
        .find(query)
        .sort({ category: 1, name: 1 })
        .toArray()

      return rules.map(rule => ({
        id: rule._id.toString(),
        name: rule.name,
        description: rule.description,
        category: rule.category,
        eventType: rule.eventType,
        conditions: rule.conditions,
        actions: rule.actions,
        channels: rule.channels,
        priority: rule.priority,
        isActive: rule.isActive,
        schedule: rule.schedule,
        throttling: rule.throttling,
        template: rule.template,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
        createdBy: rule.createdBy,
        lastModifiedBy: rule.lastModifiedBy
      }))
    } catch (error) {
      this.handleError('getNotificationRules', error)
    }
  }

  async createNotificationRule(
    ruleData: Omit<NotificationRule, 'id' | 'createdAt' | 'updatedAt'>,
    createdBy: string,
    session?: ClientSession
  ): Promise<NotificationRule> {
    try {
      await this.ensureConnection()

      const ruleDocument = {
        ...ruleData,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        lastModifiedBy: createdBy
      }

      const rulesCollection = this.db.collection(this.notificationRulesCollection)
      const result = await rulesCollection.insertOne(
        ruleDocument,
        session ? { session } : {}
      )

      return {
        id: result.insertedId.toString(),
        ...ruleDocument
      }
    } catch (error) {
      this.handleError('createNotificationRule', error)
    }
  }

  async updateNotificationRule(
    ruleId: string,
    updates: Partial<Omit<NotificationRule, 'id' | 'createdAt' | 'createdBy'>>,
    updatedBy: string,
    session?: ClientSession
  ): Promise<NotificationRule> {
    try {
      await this.ensureConnection()

      const rulesCollection = this.db.collection(this.notificationRulesCollection)
      
      const updateDocument = {
        ...updates,
        updatedAt: new Date(),
        lastModifiedBy: updatedBy
      }

      const result = await rulesCollection.updateOne(
        { _id: new ObjectId(ruleId) },
        { $set: updateDocument },
        session ? { session } : {}
      )

      if (result.modifiedCount === 0) {
        throw new Error('Notification rule not found or no changes made')
      }

      const updatedRule = await rulesCollection.findOne({ _id: new ObjectId(ruleId) })
      return {
        id: updatedRule._id.toString(),
        name: updatedRule.name,
        description: updatedRule.description,
        category: updatedRule.category,
        eventType: updatedRule.eventType,
        conditions: updatedRule.conditions,
        actions: updatedRule.actions,
        channels: updatedRule.channels,
        priority: updatedRule.priority,
        isActive: updatedRule.isActive,
        schedule: updatedRule.schedule,
        throttling: updatedRule.throttling,
        template: updatedRule.template,
        createdAt: updatedRule.createdAt,
        updatedAt: updatedRule.updatedAt,
        createdBy: updatedRule.createdBy,
        lastModifiedBy: updatedRule.lastModifiedBy
      }
    } catch (error) {
      this.handleError('updateNotificationRule', error)
    }
  }

  /**
   * Workflow Template Configuration Management
   */

  async getWorkflowTemplateConfigs(
    category?: string,
    isActive?: boolean
  ): Promise<WorkflowTemplateConfig[]> {
    try {
      await this.ensureConnection()

      const configsCollection = this.db.collection(this.workflowTemplateConfigsCollection)
      const query: any = {}

      if (category) query.category = category
      if (isActive !== undefined) query.isActive = isActive

      const configs = await configsCollection
        .find(query)
        .sort({ category: 1, name: 1 })
        .toArray()

      return configs.map(config => ({
        id: config._id.toString(),
        name: config.name,
        description: config.description,
        category: config.category,
        isDefault: config.isDefault,
        configuration: config.configuration,
        permissions: config.permissions,
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
        createdBy: config.createdBy,
        lastModifiedBy: config.lastModifiedBy
      }))
    } catch (error) {
      this.handleError('getWorkflowTemplateConfigs', error)
    }
  }

  async createWorkflowTemplateConfig(
    configData: Omit<WorkflowTemplateConfig, 'id' | 'createdAt' | 'updatedAt'>,
    createdBy: string,
    session?: ClientSession
  ): Promise<WorkflowTemplateConfig> {
    try {
      await this.ensureConnection()

      const configDocument = {
        ...configData,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        lastModifiedBy: createdBy
      }

      const configsCollection = this.db.collection(this.workflowTemplateConfigsCollection)
      const result = await configsCollection.insertOne(
        configDocument,
        session ? { session } : {}
      )

      return {
        id: result.insertedId.toString(),
        ...configDocument
      }
    } catch (error) {
      this.handleError('createWorkflowTemplateConfig', error)
    }
  }

  /**
   * Alert Rules Management
   */

  async getAlertRules(
    category?: string,
    isActive?: boolean
  ): Promise<AlertRule[]> {
    try {
      await this.ensureConnection()

      const rulesCollection = this.db.collection(this.alertRulesCollection)
      const query: any = {}

      if (category) query.category = category
      if (isActive !== undefined) query.isActive = isActive

      const rules = await rulesCollection
        .find(query)
        .sort({ category: 1, name: 1 })
        .toArray()

      return rules.map(rule => ({
        id: rule._id.toString(),
        name: rule.name,
        description: rule.description,
        category: rule.category,
        metric: rule.metric,
        condition: rule.condition,
        severity: rule.severity,
        actions: rule.actions,
        isActive: rule.isActive,
        suppressionRules: rule.suppressionRules,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
        createdBy: rule.createdBy,
        lastModifiedBy: rule.lastModifiedBy
      }))
    } catch (error) {
      this.handleError('getAlertRules', error)
    }
  }

  async createAlertRule(
    ruleData: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>,
    createdBy: string,
    session?: ClientSession
  ): Promise<AlertRule> {
    try {
      await this.ensureConnection()

      const ruleDocument = {
        ...ruleData,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        lastModifiedBy: createdBy
      }

      const rulesCollection = this.db.collection(this.alertRulesCollection)
      const result = await rulesCollection.insertOne(
        ruleDocument,
        session ? { session } : {}
      )

      return {
        id: result.insertedId.toString(),
        ...ruleDocument
      }
    } catch (error) {
      this.handleError('createAlertRule', error)
    }
  }

  // Private helper methods

  private hasConfigurationPermission(
    config: any,
    permission: 'read' | 'write',
    user?: JWTPayload
  ): boolean {
    if (!user) return false
    if (user.role === 'admin') return true

    const requiredRoles = config.permissions[permission] || []
    return requiredRoles.includes(user.role)
  }

  private validateConfigurationValue(
    value: any,
    validation: ConfigurationValidation,
    dataType: string
  ): void {
    switch (validation.type) {
      case 'regex':
        if (dataType === 'string' && typeof validation.rule === 'string') {
          const regex = new RegExp(validation.rule)
          if (!regex.test(value)) {
            throw new Error(validation.message || 'Value does not match required pattern')
          }
        }
        break
      case 'range':
        if (dataType === 'number' && Array.isArray(validation.rule) && validation.rule.length === 2) {
          const [min, max] = validation.rule
          if (value < min || value > max) {
            throw new Error(validation.message || `Value must be between ${min} and ${max}`)
          }
        }
        break
      case 'enum':
        if (Array.isArray(validation.rule) && !validation.rule.includes(value)) {
          throw new Error(validation.message || `Value must be one of: ${validation.rule.join(', ')}`)
        }
        break
    }
  }

  private encryptValue(value: any): string {
    // Simplified encryption - in real implementation would use proper encryption
    return Buffer.from(JSON.stringify(value)).toString('base64')
  }

  private decryptValue(encryptedValue: string): any {
    // Simplified decryption - in real implementation would use proper decryption
    try {
      return JSON.parse(Buffer.from(encryptedValue, 'base64').toString())
    } catch (error) {
      return encryptedValue
    }
  }
}

// Export service instance
export const configurationManagementService = new ConfigurationManagementService()