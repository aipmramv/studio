import { query } from './db';
import { createObjectId } from '@/types/server-types';
import { WorkflowNotification } from '@/types/workflow';

// Notification types and interfaces
// ... (interfaces remain the same)

export class NotificationService {
  private notificationsTable = 'workflow_notifications';
  private preferencesTable = 'notification_preferences';
  private templatesTable = 'email_templates';
  private queueTable = 'notification_queue';

  constructor() {}

  async sendNotification(
    notification: Omit<WorkflowNotification, 'id'>
  ): Promise<{
    success: boolean;
    notificationId: string;
    channelResults: Array<{
      channel: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    const notificationId = createObjectId();
    const notificationDoc = {
      ...notification,
      id: notificationId,
      createdAt: new Date()
    };

    const sql = `
      INSERT INTO ${this.notificationsTable} (id, workflow_id, step_id, type, recipients, subject, message, data, channels, scheduled_at, sent_at, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
    `;
    const params = [
      notificationDoc.id,
      notificationDoc.workflowId,
      notificationDoc.stepId,
      notificationDoc.type,
      JSON.stringify(notificationDoc.recipients),
      notificationDoc.subject,
      notificationDoc.message,
      JSON.stringify(notificationDoc.data),
      JSON.stringify(notificationDoc.channels),
      notificationDoc.scheduledAt,
      notificationDoc.sentAt,
      notificationDoc.status,
      notificationDoc.createdAt
    ];
    await query(sql, params);

    const channelResults: Array<{ channel: string; success: boolean; error?: string }> = [];

    for (const channel of notification.channels) {
      try {
        const channelResult = await this.sendThroughChannel(
          notificationDoc,
          channel
        );
        channelResults.push({
          channel,
          success: channelResult.success,
          error: channelResult.error
        });
      } catch (error) {
        channelResults.push({
          channel,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const overallSuccess = channelResults.some(r => r.success);
    const updateSql = `
      UPDATE ${this.notificationsTable}
      SET status = $1, sent_at = $2, channel_results = $3
      WHERE id = $4;
    `;
    const updateParams = [
      overallSuccess ? 'sent' : 'failed',
      overallSuccess ? new Date() : undefined,
      JSON.stringify(channelResults),
      notificationId
    ];
    await query(updateSql, updateParams);

    return {
      success: overallSuccess,
      notificationId,
      channelResults
    };
  }

  // ... other methods (rewritten for PostgreSQL)
}

// Export service instance
export const notificationService = new NotificationService();