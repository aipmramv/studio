import { WorkflowTemplate, CreateWorkflowTemplateRequest } from '@/types/workflow'

/**
 * Predefined workflow templates for common business processes
 */
export class WorkflowTemplates {
  /**
   * Asset Transfer Approval Workflow
   */
  static getAssetTransferTemplate(): CreateWorkflowTemplateRequest {
    return {
      name: 'Asset Transfer Approval',
      description: 'Standard workflow for approving asset transfers between departments',
      category: 'asset_transfer',
      steps: [
        {
          name: 'SPOC Review',
          description: 'Source department SPOC reviews and validates the transfer request',
          type: 'approval',
          order: 1,
          isRequired: true,
          assignmentType: 'role',
          assignedTo: ['spoc'],
          conditions: [],
          actions: [
            {
              type: 'update_field',
              parameters: {
                field: 'transferStatus',
                value: 'spoc_reviewed'
              }
            }
          ],
          timeoutHours: 48,
          escalationRules: [
            {
              afterHours: 24,
              escalateTo: ['admin'],
              action: 'notify',
              message: 'Transfer request pending SPOC review for over 24 hours'
            }
          ]
        },
        {
          name: 'Admin Approval',
          description: 'Admin reviews and approves the asset transfer',
          type: 'approval',
          order: 2,
          isRequired: true,
          assignmentType: 'role',
          assignedTo: ['admin'],
          conditions: [],
          actions: [
            {
              type: 'update_field',
              parameters: {
                field: 'transferStatus',
                value: 'approved'
              }
            },
            {
              type: 'send_notification',
              parameters: {
                recipients: ['requester', 'source_spoc', 'target_spoc'],
                template: 'transfer_approved'
              }
            }
          ],
          timeoutHours: 72,
          escalationRules: [
            {
              afterHours: 48,
              escalateTo: ['senior_admin'],
              action: 'notify',
              message: 'Transfer request pending admin approval for over 48 hours'
            }
          ]
        },
        {
          name: 'Asset Handover',
          description: 'Physical handover of asset to target department',
          type: 'user_input',
          order: 3,
          isRequired: true,
          assignmentType: 'role',
          assignedTo: ['spoc'],
          conditions: [],
          actions: [
            {
              type: 'update_field',
              parameters: {
                field: 'transferStatus',
                value: 'completed'
              }
            }
          ],
          formFields: [
            {
              name: 'handoverDate',
              label: 'Handover Date',
              type: 'date',
              required: true
            },
            {
              name: 'receivedBy',
              label: 'Received By',
              type: 'text',
              required: true
            },
            {
              name: 'condition',
              label: 'Asset Condition',
              type: 'select',
              required: true,
              options: ['Good', 'Fair', 'Needs Repair', 'Damaged']
            },
            {
              name: 'notes',
              label: 'Handover Notes',
              type: 'textarea',
              required: false
            }
          ]
        }
      ],
      triggers: [
        {
          event: 'transfer_requested',
          conditions: [
            {
              field: 'requiresApproval',
              operator: 'equals',
              value: true
            }
          ]
        }
      ],
      settings: {
        allowParallelExecution: false,
        autoAdvanceOnApproval: true,
        requireComments: true,
        notifyOnStart: true,
        notifyOnComplete: true,
        retentionDays: 365
      }
    }
  }

  /**
   * Asset Verification Workflow
   */
  static getAssetVerificationTemplate(): CreateWorkflowTemplateRequest {
    return {
      name: 'Asset Verification Process',
      description: 'Workflow for systematic asset verification and validation',
      category: 'asset_verification',
      steps: [
        {
          name: 'Physical Verification',
          description: 'Physical verification of asset location and condition',
          type: 'user_input',
          order: 1,
          isRequired: true,
          assignmentType: 'role',
          assignedTo: ['user', 'spoc'],
          conditions: [],
          actions: [
            {
              type: 'update_field',
              parameters: {
                field: 'verificationStatus',
                value: 'physically_verified'
              }
            }
          ],
          formFields: [
            {
              name: 'assetFound',
              label: 'Asset Found at Location',
              type: 'select',
              required: true,
              options: ['Yes', 'No', 'Different Location']
            },
            {
              name: 'actualLocation',
              label: 'Actual Location (if different)',
              type: 'text',
              required: false
            },
            {
              name: 'condition',
              label: 'Asset Condition',
              type: 'select',
              required: true,
              options: ['Excellent', 'Good', 'Fair', 'Poor', 'Not Working']
            },
            {
              name: 'photo',
              label: 'Asset Photo',
              type: 'file',
              required: true
            },
            {
              name: 'notes',
              label: 'Verification Notes',
              type: 'textarea',
              required: false
            }
          ]
        },
        {
          name: 'SPOC Review',
          description: 'Department SPOC reviews verification results',
          type: 'approval',
          order: 2,
          isRequired: true,
          assignmentType: 'role',
          assignedTo: ['spoc'],
          conditions: [
            {
              field: 'assetFound',
              operator: 'not_equals',
              value: 'Yes'
            }
          ],
          actions: [
            {
              type: 'update_field',
              parameters: {
                field: 'verificationStatus',
                value: 'spoc_reviewed'
              }
            }
          ]
        },
        {
          name: 'Exception Resolution',
          description: 'Resolve any discrepancies found during verification',
          type: 'user_input',
          order: 3,
          isRequired: false,
          assignmentType: 'role',
          assignedTo: ['admin'],
          conditions: [
            {
              field: 'assetFound',
              operator: 'equals',
              value: 'No'
            }
          ],
          actions: [
            {
              type: 'update_field',
              parameters: {
                field: 'verificationStatus',
                value: 'exception_resolved'
              }
            }
          ],
          formFields: [
            {
              name: 'resolutionAction',
              label: 'Resolution Action',
              type: 'select',
              required: true,
              options: ['Asset Located', 'Asset Written Off', 'Investigation Required']
            },
            {
              name: 'resolutionNotes',
              label: 'Resolution Details',
              type: 'textarea',
              required: true
            }
          ]
        }
      ],
      triggers: [
        {
          event: 'verification_submitted',
          conditions: []
        }
      ],
      settings: {
        allowParallelExecution: true,
        autoAdvanceOnApproval: true,
        requireComments: false,
        notifyOnStart: true,
        notifyOnComplete: true,
        retentionDays: 180
      }
    }
  }

  /**
   * User Account Approval Workflow
   */
  static getUserApprovalTemplate(): CreateWorkflowTemplateRequest {
    return {
      name: 'User Account Approval',
      description: 'Workflow for approving new user account requests',
      category: 'user_approval',
      steps: [
        {
          name: 'Department SPOC Approval',
          description: 'Department SPOC approves the user account request',
          type: 'approval',
          order: 1,
          isRequired: true,
          assignmentType: 'department',
          assignedTo: [], // Will be resolved dynamically based on user's department
          conditions: [],
          actions: [
            {
              type: 'update_field',
              parameters: {
                field: 'approvalStatus',
                value: 'spoc_approved'
              }
            }
          ],
          timeoutHours: 24
        },
        {
          name: 'Admin Final Approval',
          description: 'System admin provides final approval and account setup',
          type: 'approval',
          order: 2,
          isRequired: true,
          assignmentType: 'role',
          assignedTo: ['admin'],
          conditions: [],
          actions: [
            {
              type: 'update_field',
              parameters: {
                field: 'approvalStatus',
                value: 'approved'
              }
            },
            {
              type: 'send_notification',
              parameters: {
                recipients: ['requester'],
                template: 'account_approved'
              }
            }
          ]
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
        requireComments: true,
        notifyOnStart: true,
        notifyOnComplete: true,
        retentionDays: 90
      }
    }
  }

  /**
   * Asset Maintenance Workflow
   */
  static getMaintenanceWorkflowTemplate(): CreateWorkflowTemplateRequest {
    return {
      name: 'Asset Maintenance Request',
      description: 'Workflow for processing asset maintenance requests',
      category: 'custom',
      steps: [
        {
          name: 'Maintenance Request Review',
          description: 'Review and validate maintenance request',
          type: 'approval',
          order: 1,
          isRequired: true,
          assignmentType: 'role',
          assignedTo: ['spoc'],
          conditions: [],
          actions: [
            {
              type: 'update_field',
              parameters: {
                field: 'maintenanceStatus',
                value: 'reviewed'
              }
            }
          ],
          formFields: [
            {
              name: 'priority',
              label: 'Maintenance Priority',
              type: 'select',
              required: true,
              options: ['Low', 'Medium', 'High', 'Critical']
            },
            {
              name: 'estimatedCost',
              label: 'Estimated Cost',
              type: 'number',
              required: false
            }
          ]
        },
        {
          name: 'Budget Approval',
          description: 'Approve maintenance budget if cost exceeds threshold',
          type: 'approval',
          order: 2,
          isRequired: false,
          assignmentType: 'role',
          assignedTo: ['admin'],
          conditions: [
            {
              field: 'estimatedCost',
              operator: 'greater_than',
              value: 10000
            }
          ],
          actions: [
            {
              type: 'update_field',
              parameters: {
                field: 'maintenanceStatus',
                value: 'budget_approved'
              }
            }
          ]
        },
        {
          name: 'Maintenance Execution',
          description: 'Execute maintenance and update asset status',
          type: 'user_input',
          order: 3,
          isRequired: true,
          assignmentType: 'role',
          assignedTo: ['spoc'],
          conditions: [],
          actions: [
            {
              type: 'update_field',
              parameters: {
                field: 'maintenanceStatus',
                value: 'completed'
              }
            }
          ],
          formFields: [
            {
              name: 'completionDate',
              label: 'Completion Date',
              type: 'date',
              required: true
            },
            {
              name: 'actualCost',
              label: 'Actual Cost',
              type: 'number',
              required: true
            },
            {
              name: 'workPerformed',
              label: 'Work Performed',
              type: 'textarea',
              required: true
            },
            {
              name: 'assetCondition',
              label: 'Asset Condition After Maintenance',
              type: 'select',
              required: true,
              options: ['Excellent', 'Good', 'Fair', 'Needs Further Work']
            }
          ]
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
        retentionDays: 730
      }
    }
  }

  /**
   * Get all predefined templates
   */
  static getAllTemplates(): CreateWorkflowTemplateRequest[] {
    return [
      this.getAssetTransferTemplate(),
      this.getAssetVerificationTemplate(),
      this.getUserApprovalTemplate(),
      this.getMaintenanceWorkflowTemplate()
    ]
  }

  /**
   * Get template by category
   */
  static getTemplateByCategory(category: string): CreateWorkflowTemplateRequest | null {
    const templates = {
      'asset_transfer': this.getAssetTransferTemplate(),
      'asset_verification': this.getAssetVerificationTemplate(),
      'user_approval': this.getUserApprovalTemplate(),
      'maintenance': this.getMaintenanceWorkflowTemplate()
    }

    return templates[category] || null
  }

  /**
   * Initialize default templates in the database
   */
  static async initializeDefaultTemplates(workflowEngine: any, createdBy: string): Promise<void> {
    const templates = this.getAllTemplates()
    
    for (const template of templates) {
      try {
        await workflowEngine.createTemplate(template, createdBy)
        console.log(`Created workflow template: ${template.name}`)
      } catch (error) {
        console.error(`Failed to create template ${template.name}:`, error.message)
      }
    }
  }
}