import 'server-only'

import { MongoDBConnection, BaseMongoService } from './mongodb-service'
import { ObjectId, ClientSession } from '@/types/server-types'
import { WorkflowNotification } from '@/types/workflow'

// Notification types and interfaces
export interface NotificationChannel {
  type: 'email' | 'in_app' | 'sms' | 'webhook'
  config: Record<string, any>
  isActive: boolean
}

export interface NotificationPreference {
  userId: string
  channels: {
    email: boolean
    inApp: boolean
    sms: boolean
  }
  categories: {
    workflow_assignment: boolean
    workflow_completion: boolean
    workflow_escalation: boolean
    system_alerts: boolean
  }
  quietHours: {
    enabled: boolean
    startTime: string // HH:MM format
    endTime: string   // HH:MM format
    timezone: string
  }
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlBody: string
  textBody: string
  variables: string[]
  category: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface NotificationQueue {
  id: string
  notification: WorkflowNotification
  scheduledAt: Date
  attempts: number
  maxAttempts: number
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled'
  error?: string
  sentAt?: Date
  createdAt: Date
}

/**
 * Notification Service
 * Handles sending notifications through various channels
 */
export class NotificationService extends BaseMongoService<any> {
  private notificationsCollection = 'workflowNotifications'
  private preferencesCollection = 'notificationPreferences'
  private templatesCollection = 'emailTemplates'
  private queueCollection = 'notificationQueue'

  constructor() {
    super('notification_service')
  }

  /**
   * Send notification through appropriate channels
   */
  async sendNotification(
    notification: Omit<WorkflowNotification, 'id'>,
    session?: ClientSession
  ): Promise<{
    success: boolean
    notificationId: string
    channelResults: Array<{
      channel: string
      success: boolean
      error?: string
    }>
  }> {
    try {
      await this.ensureConnection()

      // Create notification record
      const notificationDoc = {
        ...notification,
        createdAt: new Date()
      }

      const notificationsCollection = this.db.collection(this.notificationsCollection)
      const result = await notificationsCollection.insertOne(
        notificationDoc,
        session ? { session } : {}
      )

      const notificationId = result.insertedId.toString()
      const channelResults: Array<{ channel: string; success: boolean; error?: string }> = []

      // Process each channel
      for (const channel of notification.channels) {
        try {
          const channelResult = await this.sendThroughChannel(
            { id: notificationId, ...notification },
            channel
          )
          channelResults.push({
            channel,
            success: channelResult.success,
            error: channelResult.error
          })
        } catch (error) {
          channelResults.push({
            channel,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }

      // Update notification status
      const overallSuccess = channelResults.some(r => r.success)
      await notificationsCollection.updateOne(
        { _id: result.insertedId },
        {
          $set: {
            status: overallSuccess ? 'sent' : 'failed',
            sentAt: overallSuccess ? new Date() : undefined,
            channelResults
          }
        },
        session ? { session } : {}
      )

      return {
        success: overallSuccess,
        notificationId,
        channelResults
      }
    } catch (error) {
      this.handleError('sendNotification', error)
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(
    notifications: Array<Omit<WorkflowNotification, 'id'>>,
    session?: ClientSession
  ): Promise<{
    totalSent: number
    totalFailed: number
    results: Array<{
      success: boolean
      notificationId?: string
      error?: string
    }>
  }> {
    const results = []
    let totalSent = 0
    let totalFailed = 0

    for (const notification of notifications) {
      try {
        const result = await this.sendNotification(notification, session)
        results.push({
          success: result.success,
          notificationId: result.notificationId
        })

        if (result.success) {
          totalSent++
        } else {
          totalFailed++
        }
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        })
        totalFailed++
      }
    }

    return { totalSent, totalFailed, results }
  }

  /**
   * Queue notification for later delivery
   */
  async queueNotification(
    notification: Omit<WorkflowNotification, 'id'>,
    scheduledAt?: Date,
    session?: ClientSession
  ): Promise<string> {
    try {
      await this.ensureConnection()

      const queueItem = {
        notification: { ...notification, id: new ObjectId().toString() },
        scheduledAt: scheduledAt || new Date(),
        attempts: 0,
        maxAttempts: 3,
        status: 'pending',
        createdAt: new Date()
      }

      const queueCollection = this.db.collection(this.queueCollection)
      const result = await queueCollection.insertOne(
        queueItem,
        session ? { session } : {}
      )

      return result.insertedId.toString()
    } catch (error) {
      this.handleError('queueNotification', error)
    }
  }

  /**
   * Process notification queue
   */
  async processNotificationQueue(): Promise<{
    processed: number
    sent: number
    failed: number
    errors: string[]
  }> {
    try {
      await this.ensureConnection()

      const queueCollection = this.db.collection(this.queueCollection)

      // Get pending notifications that are due
      const pendingNotifications = await queueCollection
        .find({
          status: 'pending',
          scheduledAt: { $lte: new Date() }
        })
        .sort({ scheduledAt: 1 })
        .limit(100) // Process in batches
        .toArray()

      let processed = 0
      let sent = 0
      let failed = 0
      const errors: string[] = []

      for (const queueItem of pendingNotifications) {
        try {
          processed++

          // Mark as processing
          await queueCollection.updateOne(
            { _id: queueItem._id },
            { $set: { status: 'processing' } }
          )

          // Send notification
          const result = await this.sendNotification(queueItem.notification)

          if (result.success) {
            // Mark as sent
            await queueCollection.updateOne(
              { _id: queueItem._id },
              {
                $set: {
                  status: 'sent',
                  sentAt: new Date()
                }
              }
            )
            sent++
          } else {
            // Handle failure
            const newAttempts = queueItem.attempts + 1
            if (newAttempts >= queueItem.maxAttempts) {
              // Max attempts reached, mark as failed
              await queueCollection.updateOne(
                { _id: queueItem._id },
                {
                  $set: {
                    status: 'failed',
                    attempts: newAttempts,
                    error: 'Max attempts reached'
                  }
                }
              )
              failed++
            } else {
              // Retry later
              const nextAttempt = new Date(Date.now() + (newAttempts * 5 * 60 * 1000)) // Exponential backoff
              await queueCollection.updateOne(
                { _id: queueItem._id },
                {
                  $set: {
                    status: 'pending',
                    attempts: newAttempts,
                    scheduledAt: nextAttempt
                  }
                }
              )
            }
          }
        } catch (error) {
          errors.push(`Queue item ${queueItem._id}: ${error instanceof Error ? error.message : String(error)}`)

          // Mark as failed
          await queueCollection.updateOne(
            { _id: queueItem._id },
            {
              $set: {
                status: 'failed',
                error: error instanceof Error ? error.message : String(error)
              }
            }
          )
          failed++
        }
      }

      return { processed, sent, failed, errors }
    } catch (error) {
      this.handleError('processNotificationQueue', error)
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreference> {
    try {
      await this.ensureConnection()

      const preferencesCollection = this.db.collection(this.preferencesCollection)
      const preferences = await preferencesCollection.findOne({ userId })

      if (!preferences) {
        // Return default preferences
        return this.getDefaultPreferences(userId)
      }

      return {
        userId: preferences.userId,
        channels: preferences.channels,
        categories: preferences.categories,
        quietHours: preferences.quietHours
      }
    } catch (error) {
      this.handleError('getUserPreferences', error)
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<Omit<NotificationPreference, 'userId'>>,
    session?: ClientSession
  ): Promise<NotificationPreference> {
    try {
      await this.ensureConnection()

      const preferencesCollection = this.db.collection(this.preferencesCollection)

      const updateDoc = {
        ...preferences,
        updatedAt: new Date()
      }

      await preferencesCollection.updateOne(
        { userId },
        { $set: updateDoc },
        { upsert: true, ...(session ? { session } : {}) }
      )

      return await this.getUserPreferences(userId)
    } catch (error) {
      this.handleError('updateUserPreferences', error)
    }
  }

  /**
   * Get notification history for a user
   */
  async getNotificationHistory(
    userId: string,
    filters: {
      type?: string[]
      status?: string[]
      dateRange?: { start: Date; end: Date }
    } = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{
    notifications: WorkflowNotification[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    try {
      await this.ensureConnection()

      const notificationsCollection = this.db.collection(this.notificationsCollection)
      const query: any = {
        recipients: userId
      }

      // Apply filters
      if (filters.type && filters.type.length > 0) {
        query.type = { $in: filters.type }
      }

      if (filters.status && filters.status.length > 0) {
        query.status = { $in: filters.status }
      }

      if (filters.dateRange) {
        query.createdAt = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end
        }
      }

      const { page, limit } = pagination
      const skip = (page - 1) * limit

      const [notifications, total] = await Promise.all([
        notificationsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        notificationsCollection.countDocuments(query)
      ])

      const processedNotifications = notifications.map(notification => ({
        id: notification._id.toString(),
        workflowId: notification.workflowId,
        stepId: notification.stepId,
        type: notification.type,
        recipients: notification.recipients,
        subject: notification.subject,
        message: notification.message,
        data: notification.data,
        channels: notification.channels,
        scheduledAt: notification.scheduledAt,
        sentAt: notification.sentAt,
        status: notification.status,
        createdAt: notification.createdAt
      }))

      return {
        notifications: processedNotifications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    } catch (error) {
      this.handleError('getNotificationHistory', error)
    }
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(
    userId: string,
    notificationIds: string[],
    session?: ClientSession
  ): Promise<{ updated: number }> {
    try {
      await this.ensureConnection()

      const notificationsCollection = this.db.collection(this.notificationsCollection)

      const result = await notificationsCollection.updateMany(
        {
          _id: { $in: notificationIds.map(id => new ObjectId(id)) },
          recipients: userId
        },
        {
          $push: { readBy: userId } as any,
          $set: { [`readAt.${userId}`]: new Date() }
        },
        session ? { session } : {}
      )

      return { updated: result.modifiedCount }
    } catch (error) {
      this.handleError('markAsRead', error)
    }
  }

  // Private helper methods

  private async sendThroughChannel(
    notification: WorkflowNotification,
    channel: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      switch (channel) {
        case 'email':
          return await this.sendEmail(notification)
        case 'in_app':
          return await this.sendInAppNotification(notification)
        case 'sms':
          return await this.sendSMS(notification)
        default:
          throw new Error(`Unsupported notification channel: ${channel}`)
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  private async sendEmail(notification: WorkflowNotification): Promise<{ success: boolean; error?: string }> {
    try {
      // In a real implementation, this would integrate with an email service
      // For now, we'll just log the email
      console.log(`Sending email notification:`)
      console.log(`To: ${notification.recipients.join(', ')}`)
      console.log(`Subject: ${notification.subject}`)
      console.log(`Message: ${notification.message}`)

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100))

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  private async sendInAppNotification(notification: WorkflowNotification): Promise<{ success: boolean; error?: string }> {
    try {
      // Store in-app notification in database
      const inAppCollection = this.db.collection('inAppNotifications')

      for (const recipient of notification.recipients) {
        await inAppCollection.insertOne({
          userId: recipient,
          workflowId: notification.workflowId,
          stepId: notification.stepId,
          type: notification.type,
          subject: notification.subject,
          message: notification.message,
          data: notification.data,
          isRead: false,
          createdAt: new Date()
        })
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  private async sendSMS(notification: WorkflowNotification): Promise<{ success: boolean; error?: string }> {
    try {
      // In a real implementation, this would integrate with an SMS service
      console.log(`Sending SMS notification:`)
      console.log(`To: ${notification.recipients.join(', ')}`)
      console.log(`Message: ${notification.message}`)

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  private getDefaultPreferences(userId: string): NotificationPreference {
    return {
      userId,
      channels: {
        email: true,
        inApp: true,
        sms: false
      },
      categories: {
        workflow_assignment: true,
        workflow_completion: true,
        workflow_escalation: true,
        system_alerts: true
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'UTC'
      }
    }
  }

  private isInQuietHours(preferences: NotificationPreference): boolean {
    if (!preferences.quietHours.enabled) {
      return false
    }

    const now = new Date()
    const currentTime = now.toTimeString().substring(0, 5) // HH:MM format

    const { startTime, endTime } = preferences.quietHours

    if (startTime <= endTime) {
      // Same day quiet hours (e.g., 14:00 to 18:00)
      return currentTime >= startTime && currentTime <= endTime
    } else {
      // Overnight quiet hours (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime
    }
  }
}

// Export service instance
export const notificationService = new NotificationService()