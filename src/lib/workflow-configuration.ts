import { query } from './db';
import { createObjectId } from '@/types/server-types';
import { WorkflowEngine } from './workflow-engine';
import { WorkflowTemplates } from './workflow-templates';
import {
  WorkflowTemplate,
  CreateWorkflowTemplateRequest,
  UpdateWorkflowTemplateRequest,
  WorkflowStep,
  WorkflowCondition,
  WorkflowAction,
  StartWorkflowRequest
} from '@/types/workflow';
import { JWTPayload } from '@/types/auth';

// Configuration-specific types
export interface WorkflowConfiguration {
  id: string;
  name: string;
  description: string;
  category: string;
  isSystemTemplate: boolean;
  isActive: boolean;
  version: number;
  template: WorkflowTemplate;
  permissions: WorkflowPermissions;
  validation: WorkflowValidation;
  testing: WorkflowTesting;
  deployment: WorkflowDeployment;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
}

export interface WorkflowPermissions {
  canView: string[]; // Role names or user IDs
  canEdit: string[]; // Role names or user IDs
  canDelete: string[]; // Role names or user IDs
  canDeploy: string[]; // Role names or user IDs
  canTest: string[]; // Role names or user IDs
}

export interface WorkflowValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  lastValidated: Date;
  validatedBy: string;
}

export interface ValidationError {
  type: 'step_config' | 'assignment' | 'condition' | 'action' | 'trigger' | 'dependency';
  stepId?: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  type: string;
  stepId?: string;
  field: string;
  message: string;
  recommendation?: string;
}

export interface WorkflowTesting {
  testCases: WorkflowTestCase[];
  lastTestRun?: Date;
  testResults?: WorkflowTestResults;
}

export interface WorkflowTestCase {
  id: string;
  name: string;
  description: string;
  scenario: string;
  inputData: Record<string, any>;
  expectedOutcome: {
    finalStatus: string;
    completedSteps: string[];
    expectedDuration?: number;
  };
  isActive: boolean;
}

export interface WorkflowTestResults {
  testRunId: string;
  runAt: Date;
  runBy: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: Array<{
    testCaseId: string;
    status: 'passed' | 'failed' | 'error';
    duration: number;
    error?: string;
    actualOutcome?: any;
  }>;
}

export interface WorkflowDeployment {
  status: 'draft' | 'testing' | 'staging' | 'production';
  deployedAt?: Date;
  deployedBy?: string;
  rollbackVersion?: number;
  deploymentNotes?: string;
}

export interface WorkflowConfigurationRequest {
  name: string;
  description: string;
  category: string;
  template: CreateWorkflowTemplateRequest;
  permissions?: Partial<WorkflowPermissions>;
  testCases?: Omit<WorkflowTestCase, 'id'>[];
}

export interface WorkflowConfigurationUpdate {
  name?: string;
  description?: string;
  template?: UpdateWorkflowTemplateRequest;
  permissions?: Partial<WorkflowPermissions>;
  testCases?: Omit<WorkflowTestCase, 'id'>[];
  isActive?: boolean;
}

/**
 * Workflow Configuration Management Service
 * Handles workflow template configuration, validation, testing, and deployment
 */
export class WorkflowConfigurationManager {
  private workflowEngine: WorkflowEngine;
  private configurationsTable = 'workflow_configurations';
  private testRunsTable = 'workflow_test_runs';

  constructor(workflowEngine: WorkflowEngine) {
    this.workflowEngine = workflowEngine;
  }

  async createConfiguration(
    request: WorkflowConfigurationRequest,
    createdBy: string
  ): Promise<{
    configuration: WorkflowConfiguration;
    validation: WorkflowValidation;
    message: string;
  }> {
    const validation = await this.validateWorkflowTemplate(request.template);
    const templateResult = await this.workflowEngine.createTemplate(
      request.template,
      createdBy
    );

    const configurationId = createObjectId();
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
          id: createObjectId()
        })) || []
      },
      deployment: {
        status: 'draft'
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      lastModifiedBy: createdBy
    };

    const sql = `
      INSERT INTO ${this.configurationsTable} (id, name, description, category, is_system_template, is_active, version, template, permissions, validation, testing, deployment, created_at, updated_at, created_by, last_modified_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id;
    `;
    const params = [
      configurationId,
      configurationDoc.name,
      configurationDoc.description,
      configurationDoc.category,
      configurationDoc.isSystemTemplate,
      configurationDoc.isActive,
      configurationDoc.version,
      JSON.stringify(configurationDoc.template),
      JSON.stringify(configurationDoc.permissions),
      JSON.stringify(configurationDoc.validation),
      JSON.stringify(configurationDoc.testing),
      JSON.stringify(configurationDoc.deployment),
      configurationDoc.createdAt,
      configurationDoc.updatedAt,
      configurationDoc.createdBy,
      configurationDoc.lastModifiedBy
    ];

    await query(sql, params);

    const configuration: WorkflowConfiguration = {
      id: configurationId,
      ...configurationDoc
    };

    return {
      configuration,
      validation,
      message: 'Workflow configuration created successfully'
    };
  }

  // ... other methods ...
}

// Export service instance
export const workflowConfigurationManager = new WorkflowConfigurationManager(new WorkflowEngine());