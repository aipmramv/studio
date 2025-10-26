// Workflow system types and interfaces

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: 'asset_transfer' | 'asset_verification' | 'user_approval' | 'custom'
  version: number
  isActive: boolean
  steps: WorkflowStep[]
  triggers: WorkflowTrigger[]
  settings: WorkflowSettings
  createdAt: Date
  updatedAt: Date
  createdBy: string
  lastModifiedBy: string
}

export interface WorkflowStep {
  id: string
  name: string
  description: string
  type: 'approval' | 'notification' | 'system_action' | 'user_input' | 'condition'
  order: number
  isRequired: boolean
  assignmentType: 'role' | 'user' | 'department' | 'dynamic'
  assignedTo: string[] // Role names, user IDs, or department names
  conditions: WorkflowCondition[]
  actions: WorkflowAction[]
  timeoutHours?: number
  escalationRules?: EscalationRule[]
  formFields?: WorkflowFormField[]
}

export interface WorkflowCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists'
  value: any
  logicalOperator?: 'AND' | 'OR'
}

export interface WorkflowAction {
  type: 'update_field' | 'send_notification' | 'create_task' | 'call_api' | 'send_email'
  parameters: Record<string, any>
}

export interface EscalationRule {
  afterHours: number
  escalateTo: string[] // User IDs or role names
  action: 'notify' | 'reassign' | 'auto_approve' | 'auto_reject'
  message?: string
}

export interface WorkflowFormField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file' | 'checkbox'
  required: boolean
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

export interface WorkflowTrigger {
  event: 'asset_created' | 'asset_updated' | 'transfer_requested' | 'verification_submitted' | 'manual'
  conditions: WorkflowCondition[]
}

export interface WorkflowSettings {
  allowParallelExecution: boolean
  autoAdvanceOnApproval: boolean
  requireComments: boolean
  notifyOnStart: boolean
  notifyOnComplete: boolean
  retentionDays: number
}

// Workflow instance types
export interface WorkflowInstance {
  id: string
  templateId: string
  templateVersion: number
  name: string
  category: string
  status: WorkflowStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  contextType: 'asset' | 'user' | 'transfer' | 'verification' | 'custom'
  contextId: string
  contextData: Record<string, any>
  currentStepId?: string
  currentStepOrder: number
  steps: WorkflowInstanceStep[]
  variables: Record<string, any>
  startedAt: Date
  completedAt?: Date
  dueDate?: Date
  createdBy: string
  assignedTo?: string[]
  tags: string[]
  metadata: Record<string, any>
}

export interface WorkflowInstanceStep {
  id: string
  templateStepId: string
  name: string
  type: string
  order: number
  status: StepStatus
  assignedTo: string[]
  actualAssignee?: string
  startedAt?: Date
  completedAt?: Date
  dueDate?: Date
  actions: WorkflowInstanceAction[]
  comments: WorkflowComment[]
  attachments: WorkflowAttachment[]
  formData?: Record<string, any>
  escalations: WorkflowEscalation[]
}

export interface WorkflowInstanceAction {
  id: string
  action: 'approve' | 'reject' | 'comment' | 'reassign' | 'escalate' | 'complete' | 'skip'
  performedBy: string
  performedAt: Date
  comment?: string
  reason?: string
  data?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export interface WorkflowComment {
  id: string
  text: string
  author: string
  createdAt: Date
  isInternal: boolean
  attachments?: WorkflowAttachment[]
}

export interface WorkflowAttachment {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  uploadedBy: string
  uploadedAt: Date
}

export interface WorkflowEscalation {
  id: string
  triggeredAt: Date
  escalatedTo: string[]
  reason: string
  action: string
  resolvedAt?: Date
  resolvedBy?: string
}

// Enums
export type WorkflowStatus = 
  | 'draft'
  | 'active'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'failed'
  | 'expired'

export type StepStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'failed'
  | 'expired'
  | 'escalated'

// Request/Response types
export interface CreateWorkflowTemplateRequest {
  name: string
  description: string
  category: WorkflowTemplate['category']
  steps: Omit<WorkflowStep, 'id'>[]
  triggers: WorkflowTrigger[]
  settings: WorkflowSettings
}

export interface UpdateWorkflowTemplateRequest {
  name?: string
  description?: string
  steps?: Omit<WorkflowStep, 'id'>[]
  triggers?: WorkflowTrigger[]
  settings?: Partial<WorkflowSettings>
  isActive?: boolean
}

export interface StartWorkflowRequest {
  templateId: string
  contextType: WorkflowInstance['contextType']
  contextId: string
  contextData?: Record<string, any>
  priority?: WorkflowInstance['priority']
  dueDate?: Date
  variables?: Record<string, any>
  assignedTo?: string[]
  tags?: string[]
}

export interface WorkflowActionRequest {
  action: WorkflowInstanceAction['action']
  comment?: string
  reason?: string
  data?: Record<string, any>
  reassignTo?: string[]
}

export interface WorkflowSearchFilters {
  status?: WorkflowStatus[]
  category?: string[]
  assignedTo?: string
  createdBy?: string
  contextType?: string
  contextId?: string
  priority?: string[]
  tags?: string[]
  dateRange?: {
    field: 'startedAt' | 'completedAt' | 'dueDate'
    start: Date
    end: Date
  }
  search?: string
}

export interface WorkflowListResponse {
  workflows: WorkflowInstance[]
  total: number
  page: number
  limit: number
  totalPages: number
  filters: WorkflowSearchFilters
  aggregations: {
    byStatus: Record<string, number>
    byCategory: Record<string, number>
    byPriority: Record<string, number>
    overdue: number
  }
}

// Workflow analytics types
export interface WorkflowAnalytics {
  totalWorkflows: number
  activeWorkflows: number
  completedWorkflows: number
  averageCompletionTime: number
  completionRate: number
  escalationRate: number
  performanceByTemplate: Array<{
    templateId: string
    templateName: string
    totalInstances: number
    averageCompletionTime: number
    completionRate: number
  }>
  performanceByUser: Array<{
    userId: string
    userName: string
    assignedTasks: number
    completedTasks: number
    averageResponseTime: number
  }>
  trendsOverTime: Array<{
    date: Date
    started: number
    completed: number
    escalated: number
  }>
}

// Notification types
export interface WorkflowNotification {
  id: string
  workflowId: string
  stepId?: string
  type: 'assignment' | 'reminder' | 'escalation' | 'completion' | 'cancellation'
  recipients: string[]
  subject: string
  message: string
  data: Record<string, any>
  channels: ('email' | 'in_app' | 'sms')[]
  scheduledAt?: Date
  sentAt?: Date
  status: 'pending' | 'sent' | 'failed'
  createdAt: Date
}