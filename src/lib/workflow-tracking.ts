import { query } from './db';
import { createObjectId } from '@/types/server-types';
import { JWTPayload } from '@/types/auth';
import {
  WorkflowInstance,
  WorkflowInstanceStep,
  WorkflowInstanceAction,
  WorkflowStatus,
  StepStatus,
  WorkflowAnalytics
} from '@/types/workflow';

// Tracking-specific types
// ... (interfaces remain the same)

export class WorkflowTrackingService {
  private statusUpdatesTable = 'workflow_status_updates';
  private metricsTable = 'workflow_metrics';
  private activityTable = 'workflow_activity';
  private reportsTable = 'workflow_reports';

  constructor() {}

  async trackStatusUpdate(
    update: Omit<WorkflowStatusUpdate, 'updatedAt'>
  ): Promise<void> {
    const statusUpdate = {
      ...update,
      updatedAt: new Date()
    };

    const sql = `
      INSERT INTO ${this.statusUpdatesTable} (workflow_id, step_id, old_status, new_status, updated_by, updated_at, reason, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `;
    const params = [
      statusUpdate.workflowId,
      statusUpdate.stepId,
      statusUpdate.oldStatus,
      statusUpdate.newStatus,
      statusUpdate.updatedBy,
      statusUpdate.updatedAt,
      statusUpdate.reason,
      JSON.stringify(statusUpdate.metadata)
    ];
    await query(sql, params);

    await this.updateWorkflowMetrics(update.workflowId);
    await this.logWorkflowActivity({
      workflowId: update.workflowId,
      stepName: update.stepId ? `Step ${update.stepId}` : undefined,
      action: 'status_change',
      performedBy: update.updatedBy,
      performedAt: statusUpdate.updatedAt,
      description: `Status changed from ${update.oldStatus} to ${update.newStatus}`,
      metadata: {
        oldStatus: update.oldStatus,
        newStatus: update.newStatus,
        reason: update.reason
      }
    });
  }

  // ... other methods (rewritten for PostgreSQL)
}

// Export service instance
export const workflowTrackingService = new WorkflowTrackingService();