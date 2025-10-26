#!/usr/bin/env tsx

/**
 * Configuration Initialization Script
 * Sets up default system configurations, notification rules, and workflow templates
 */

import { MongoDBConnection } from '../src/lib/mongodb-service'
import { configurationManagementService } from '../src/lib/configuration-management'
import { SystemConfiguration, NotificationRule, WorkflowTemplateConfig, AlertRule } from '../src/lib/configuration-management'

// Default system configurations
const defaultSystemConfigurations: Omit<SystemConfiguration, 'id' | 'version' | 'lastModified' | 'createdAt'>[] = [
  // Application Settings
  {
    category: 'application',
    key: 'app.name',
    name: 'Application Name',
    description: 'The name of the application',
    value: 'KTI Assets Management System',
    dataType: 'string',
    isEncrypted: false,
    isRequired: true,
    defaultValue: 'KTI Assets Management System',
    environment: 'all',
    scope: 'global',
    permissions: {
      read: ['admin', 'spoc', 'user'],
      write: ['admin']
    },
    isActive: true
  },
  {
    category: 'application',
    key: 'app.version',
    name: 'Application Version',
    description: 'Current version of the application',
    value: '1.0.0',
    dataType: 'string',
    isEncrypted: false,
    isRequired: true,
    defaultValue: '1.0.0',
    environment: 'all',
    scope: 'global',
    permissions: {
      read: ['admin', 'spoc', 'user'],
      write: ['admin']
    },
    isActive: true
  },
  {
    category: 'application',
    key: 'app.maintenance_mode',
    name: 'Maintenance Mode',
    description: 'Enable/disable maintenance mode',
    value: false,
    dataType: 'boolean',
    isEncrypted: false,
    isRequired: true,
    defaultValue: false,
    environment: 'all',
    scope: 'global',
    permissions: {
      read: ['admin'],
      write: ['admin']
    },
    isActive: true
  },

  // Security Settings
  {
    category: 'security',
    key: 'auth.jwt_expiry',
    name: 'JWT Token Expiry',
    description: 'JWT token expiry time in hours',
    value: 24,
    dataType: 'number',
    isEncrypted: false,
    isRequired: true,
    defaultValue: 24,
    validation: {
      type: 'range',
      rule: [1, 168], // 1 hour to 1 week
      message: 'JWT expiry must be between 1 and 168 hours'
    },
    environment: 'all',
    scope: 'global',
    permissions: {
      read: ['admin'],
      write: ['admin']
    },
    isActive: true
  },
  {
    category: 'security',
    key: 'auth.max_login_attempts',
    name: 'Maximum Login Attempts',
    description: 'Maximum failed login attempts before account lockout',
    value: 5,
    dataType: 'number',
    isEncrypted: false,
    isRequired: true,
    defaultValue: 5,
    validation: {
      type: 'range',
      rule: [3, 10],
      message: 'Max login attempts must be between 3 and 10'
    },
    environment: 'all',
    scope: 'global',
    permissions: {
      read: ['admin'],
      write: ['admin']
    },
    isActive: true
  },
  {
    category: 'security',
    key: 'auth.lockout_duration',
    name: 'Account Lockout Duration',
    description: 'Account lockout duration in minutes',
    value: 30,
    dataType: 'number',
    isEncrypted: false,
    isRequired: true,
    defaultValue: 30,
    validation: {
      type: 'range',
      rule: [5, 1440], // 5 minutes to 24 hours
      message: 'Lockout duration must be between 5 and 1440 minutes'
    },
    environment: 'all',
    scope: 'global',
    permissions: {
      read: ['admin'],
      write: ['admin']
    },
    isActive: true
  },

  // System Settings
  {
    category: 'system',
    key: 'system.max_file_size',
    name: 'Maximum File Upload Size',
    description: 'Maximum file upload size in MB',
    value: 10,
    dataType: 'number',
    isEncrypted: false,
    isRequired: true,
    defaultValue: 10,
    validation: {
      type: 'range',
      rule: [1, 100],
      message: 'File size must be between 1 and 100 MB'
    },
    environment: 'all',
    scope: 'global',
    permissions: {
      read: ['admin', 'spoc'],
      write: ['admin']
    },
    isActive: true
  },
  {
    category: 'system',
    key: 'system.session_timeout',
    name: 'Session Timeout',
    description: 'User session timeout in minutes',
    value: 480, // 8 hours
    dataType: 'number',
    isEncrypted: false,
    isRequired: true,
    defaultValue: 480,
    validation: {
      type: 'range',
      rule: [30, 1440], // 30 minutes to 24 hours
      message: 'Session timeout must be between 30 and 1440 minutes'
    },
    environment: 'all',
    scope: 'global',
    permissions: {
      read: ['admin'],
      write: ['admin']
    },
    isActive: true
  },
  {
    category: 'system',
    key: 'system.backup_retention_days',
    name: 'Backup Retention Period',
    description: 'Number of days to retain backups',
    value: 90,
    dataType: 'number',
    isEncrypted: false,
    isRequired: true,
    defaultValue: 90,
    validation: {
      type: 'range',
      rule: [7, 365],
      message: 'Backup retention must be between 7 and 365 days'
    },
    environment: 'all',
    scope: 'global',
    permissions: {
      read: ['admin'],
      write: ['admin']
    },
    isActive: true
  },

  // Notification Settings
  {
    category: 'notification',
    key: 'notification.email_enabled',
    name: 'Email Notifications Enabled',
    description: 'Enable/disable email notifications',
    value: true,
    dataType: 'boolean',
    isEncrypted: false,
    isRequired: true,
    defaultValue: true,
    environment: 'all',
    scope: 'global',
    permissions: {
      read: ['admin', 'spoc'],
      write: ['admin']
    },
    isActive: true
  },
  {
    category: 'notification',
    key: 'notification.sms_enabled',
    name: 'SMS Notifications Enabled',
    description: 'Enable/disable SMS notifications',
    value: false,
    dataType: 'boolean',
    isEncrypted: false,
    isRequired: true,
    defaultValue: false,
    environment: 'all',
    scope: 'global',
    permissions: {
      read: ['admin', 'spoc'],
      write: ['admin']
    },
    isActive: true
  },
  {
    category: 'notification',
    key: 'notification.batch_size',
    name: 'Notification Batch Size',
    description: 'Number of notifications to process in each batch',
    value: 50,
    dataType: 'number',
    isEncrypted: false,
    isRequired: true,
    defaultValue: 50,
    validation: {
      type: 'range',
      rule: [10, 500],
      message: 'Batch size must be between 10 and 500'
    },
    environment: 'all',
    scope: 'global',
    permissions: {
      read: ['admin'],
      write: ['admin']
    },
    isActive: true
  },

  // Integration Settings
  {
    category: 'integration',
    key: 'integration.api_rate_limit',
    name: 'API Rate Limit',
    description: 'API requests per minute per user',
    value: 100,
    dataType: 'number',
    isEncrypted: false,
    isRequired: true,
    defaultValue: 100,
    validation: {
      type: 'range',
      rule: [10, 1000],
      message: 'Rate limit must be between 10 and 1000 requests per minute'
    },
    environment: 'all',
    scope: 'global',
    permissions: {
      read: ['admin'],
      write: ['admin']
    },
    isActive: true
  },
  {
    category: 'integration',
    key: 'integration.webhook_timeout',
    name: 'Webhook Timeout',
    description: 'Webhook request timeout in seconds',
    value: 30,
    dataType: 'number',
    isEncrypted: false,
    isRequired: true,
    defaultValue: 30,
    validation: {
      type: 'range',
      rule: [5, 300],
      message: 'Webhook timeout must be between 5 and 300 seconds'
    },
    environment: 'all',
    scope: 'global',
    permissions: {
      read: ['admin'],
      write: ['admin']
    },
    isActive: true
  }
]

// Default notification rules
const defaultNotificationRules: Omit<NotificationRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Asset Transfer Approval Required',
    description: 'Notify when asset transfer requires approval',
    category: 'workflow',
    eventType: 'workflow_step_assigned',
    conditions: [
      {
        field: 'workflow.category',
        operator: 'equals',
        value: 'asset_transfer'
      },
      {
        field: 'step.type',
        operator: 'equals',
        value: 'approval',
        logicalOperator: 'AND'
      }
    ],
    actions: [
      {
        type: 'email',
        recipients: [
          {
            type: 'dynamic',
            value: 'step.assignedTo'
          }
        ],
        template: 'workflow_approval_required'
      },
      {
        type: 'in_app',
        recipients: [
          {
            type: 'dynamic',
            value: 'step.assignedTo'
          }
        ]
      }
    ],
    channels: [
      {
        type: 'email',
        config: {
          priority: 'normal'
        },
        isActive: true
      },
      {
        type: 'in_app',
        config: {},
        isActive: true
      }
    ],
    priority: 'medium',
    isActive: true,
    schedule: {
      type: 'immediate'
    },
    throttling: {
      enabled: true,
      maxPerHour: 10,
      cooldownMinutes: 5,
      groupBy: ['workflow.id', 'step.id']
    },
    createdBy: 'system',
    lastModifiedBy: 'system'
  },
  {
    name: 'Asset Transfer Completed',
    description: 'Notify when asset transfer is completed',
    category: 'workflow',
    eventType: 'workflow_completed',
    conditions: [
      {
        field: 'workflow.category',
        operator: 'equals',
        value: 'asset_transfer'
      }
    ],
    actions: [
      {
        type: 'email',
        recipients: [
          {
            type: 'dynamic',
            value: 'workflow.createdBy'
          },
          {
            type: 'role',
            value: 'admin'
          }
        ],
        template: 'workflow_completed'
      }
    ],
    channels: [
      {
        type: 'email',
        config: {
          priority: 'normal'
        },
        isActive: true
      }
    ],
    priority: 'low',
    isActive: true,
    schedule: {
      type: 'immediate'
    },
    createdBy: 'system',
    lastModifiedBy: 'system'
  },
  {
    name: 'Asset Verification Overdue',
    description: 'Notify when asset verification is overdue',
    category: 'asset',
    eventType: 'verification_overdue',
    conditions: [
      {
        field: 'asset.verificationStatus',
        operator: 'equals',
        value: 'pending'
      },
      {
        field: 'verification.daysOverdue',
        operator: 'greater_than',
        value: 7,
        logicalOperator: 'AND'
      }
    ],
    actions: [
      {
        type: 'email',
        recipients: [
          {
            type: 'department',
            value: 'asset.department'
          }
        ],
        template: 'verification_overdue'
      }
    ],
    channels: [
      {
        type: 'email',
        config: {
          priority: 'high'
        },
        isActive: true
      }
    ],
    priority: 'high',
    isActive: true,
    schedule: {
      type: 'recurring',
      recurrence: {
        frequency: 'daily',
        interval: 1,
        time: '09:00'
      }
    },
    throttling: {
      enabled: true,
      maxPerDay: 1,
      groupBy: ['asset.id']
    },
    createdBy: 'system',
    lastModifiedBy: 'system'
  },
  {
    name: 'System Error Alert',
    description: 'Notify administrators of system errors',
    category: 'system',
    eventType: 'system_error',
    conditions: [
      {
        field: 'error.severity',
        operator: 'in',
        value: ['error', 'critical']
      }
    ],
    actions: [
      {
        type: 'email',
        recipients: [
          {
            type: 'role',
            value: 'admin'
          }
        ],
        template: 'system_error_alert'
      }
    ],
    channels: [
      {
        type: 'email',
        config: {
          priority: 'urgent'
        },
        isActive: true
      }
    ],
    priority: 'critical',
    isActive: true,
    schedule: {
      type: 'immediate'
    },
    throttling: {
      enabled: true,
      maxPerHour: 5,
      cooldownMinutes: 15,
      groupBy: ['error.type']
    },
    createdBy: 'system',
    lastModifiedBy: 'system'
  }
]

// Default workflow template configurations
const defaultWorkflowTemplateConfigs: Omit<WorkflowTemplateConfig, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Standard Asset Transfer Configuration',
    description: 'Default configuration for asset transfer workflows',
    category: 'asset_transfer',
    isDefault: true,
    configuration: {
      autoStart: false,
      allowParallelExecution: false,
      maxConcurrentInstances: 1,
      defaultPriority: 'medium',
      timeoutHours: 72,
      escalationRules: [
        {
          stepType: 'approval',
          timeoutHours: 24,
          escalateTo: ['admin'],
          action: 'notify',
          message: 'Approval is overdue and has been escalated'
        },
        {
          stepType: 'approval',
          timeoutHours: 48,
          escalateTo: ['admin'],
          action: 'auto_approve',
          message: 'Auto-approved due to timeout'
        }
      ],
      notificationSettings: {
        notifyOnStart: true,
        notifyOnComplete: true,
        notifyOnError: true,
        notifyOnEscalation: true,
        customNotifications: [
          {
            event: 'step_completed',
            recipients: ['workflow.createdBy'],
            template: 'workflow_progress_update'
          }
        ]
      }
    },
    permissions: {
      canUse: ['admin', 'spoc', 'user'],
      canModify: ['admin']
    },
    isActive: true,
    createdBy: 'system',
    lastModifiedBy: 'system'
  },
  {
    name: 'Express Asset Transfer Configuration',
    description: 'Fast-track configuration for urgent asset transfers',
    category: 'asset_transfer',
    isDefault: false,
    configuration: {
      autoStart: true,
      allowParallelExecution: true,
      maxConcurrentInstances: 5,
      defaultPriority: 'high',
      timeoutHours: 24,
      escalationRules: [
        {
          stepType: 'approval',
          timeoutHours: 4,
          escalateTo: ['admin'],
          action: 'notify',
          message: 'Urgent approval required'
        },
        {
          stepType: 'approval',
          timeoutHours: 8,
          escalateTo: ['admin'],
          action: 'auto_approve',
          message: 'Auto-approved for urgent transfer'
        }
      ],
      notificationSettings: {
        notifyOnStart: true,
        notifyOnComplete: true,
        notifyOnError: true,
        notifyOnEscalation: true,
        customNotifications: [
          {
            event: 'workflow_started',
            recipients: ['admin'],
            template: 'urgent_workflow_started'
          }
        ]
      }
    },
    permissions: {
      canUse: ['admin', 'spoc'],
      canModify: ['admin']
    },
    isActive: true,
    createdBy: 'system',
    lastModifiedBy: 'system'
  }
]

// Default alert rules
const defaultAlertRules: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'High Failed Login Attempts',
    description: 'Alert when failed login attempts exceed threshold',
    category: 'security',
    metric: 'failed_login_attempts',
    condition: {
      operator: 'greater_than',
      threshold: 10,
      duration: 15 // 15 minutes
    },
    severity: 'warning',
    actions: [
      {
        type: 'notification',
        config: {
          recipients: ['admin'],
          template: 'security_alert'
        }
      }
    ],
    isActive: true,
    createdBy: 'system',
    lastModifiedBy: 'system'
  },
  {
    name: 'Database Connection Failures',
    description: 'Alert when database connection failures occur',
    category: 'system',
    metric: 'database_connection_failures',
    condition: {
      operator: 'greater_than',
      threshold: 5,
      duration: 5 // 5 minutes
    },
    severity: 'critical',
    actions: [
      {
        type: 'notification',
        config: {
          recipients: ['admin'],
          template: 'system_critical_alert'
        }
      }
    ],
    isActive: true,
    createdBy: 'system',
    lastModifiedBy: 'system'
  },
  {
    name: 'High API Response Time',
    description: 'Alert when API response time is consistently high',
    category: 'performance',
    metric: 'api_response_time_avg',
    condition: {
      operator: 'greater_than',
      threshold: 5000, // 5 seconds
      duration: 10 // 10 minutes
    },
    severity: 'warning',
    actions: [
      {
        type: 'notification',
        config: {
          recipients: ['admin'],
          template: 'performance_alert'
        }
      }
    ],
    isActive: true,
    createdBy: 'system',
    lastModifiedBy: 'system'
  },
  {
    name: 'Overdue Asset Verifications',
    description: 'Alert when asset verifications are overdue',
    category: 'business',
    metric: 'overdue_verifications_count',
    condition: {
      operator: 'greater_than',
      threshold: 50
    },
    severity: 'warning',
    actions: [
      {
        type: 'notification',
        config: {
          recipients: ['admin', 'spoc'],
          template: 'business_alert'
        }
      }
    ],
    isActive: true,
    suppressionRules: [
      {
        condition: 'weekend',
        duration: 2880, // 48 hours
        reason: 'Suppress alerts during weekends'
      }
    ],
    createdBy: 'system',
    lastModifiedBy: 'system'
  }
]

async function initializeConfigurations() {
  console.log('🚀 Starting configuration initialization...')

  try {
    // Connect to database
    const connection = MongoDBConnection.getInstance()
    await connection.connect()
    console.log('✅ Connected to database')

    let created = 0
    let skipped = 0
    let errors = 0

    // Initialize system configurations
    console.log('📋 Initializing system configurations...')
    for (const config of defaultSystemConfigurations) {
      try {
        // Check if configuration already exists
        const existing = await configurationManagementService.getSystemConfiguration(
          config.key,
          undefined,
          config.environment
        )

        if (existing.length > 0) {
          console.log(`⏭️  Skipping existing configuration: ${config.key}`)
          skipped++
          continue
        }

        await configurationManagementService.createSystemConfiguration(
          config,
          'system'
        )
        console.log(`✅ Created system configuration: ${config.key}`)
        created++
      } catch (error) {
        console.error(`❌ Failed to create configuration ${config.key}:`, error.message)
        errors++
      }
    }

    // Initialize notification rules
    console.log('🔔 Initializing notification rules...')
    for (const rule of defaultNotificationRules) {
      try {
        await configurationManagementService.createNotificationRule(rule, 'system')
        console.log(`✅ Created notification rule: ${rule.name}`)
        created++
      } catch (error) {
        console.error(`❌ Failed to create notification rule ${rule.name}:`, error.message)
        errors++
      }
    }

    // Initialize workflow template configurations
    console.log('⚙️  Initializing workflow template configurations...')
    for (const config of defaultWorkflowTemplateConfigs) {
      try {
        await configurationManagementService.createWorkflowTemplateConfig(config, 'system')
        console.log(`✅ Created workflow template config: ${config.name}`)
        created++
      } catch (error) {
        console.error(`❌ Failed to create workflow template config ${config.name}:`, error.message)
        errors++
      }
    }

    // Initialize alert rules
    console.log('🚨 Initializing alert rules...')
    for (const rule of defaultAlertRules) {
      try {
        await configurationManagementService.createAlertRule(rule, 'system')
        console.log(`✅ Created alert rule: ${rule.name}`)
        created++
      } catch (error) {
        console.error(`❌ Failed to create alert rule ${rule.name}:`, error.message)
        errors++
      }
    }

    console.log('\n📊 Configuration initialization summary:')
    console.log(`✅ Created: ${created}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`❌ Errors: ${errors}`)

    if (errors === 0) {
      console.log('\n🎉 Configuration initialization completed successfully!')
    } else {
      console.log('\n⚠️  Configuration initialization completed with some errors.')
    }

  } catch (error) {
    console.error('💥 Configuration initialization failed:', error)
    process.exit(1)
  } finally {
    // Close database connection
    await MongoDBConnection.getInstance().disconnect()
    console.log('🔌 Database connection closed')
  }
}

// Run initialization if this script is executed directly
if (require.main === module) {
  initializeConfigurations()
    .then(() => {
      console.log('✨ Configuration initialization script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Configuration initialization script failed:', error)
      process.exit(1)
    })
}

export { initializeConfigurations }