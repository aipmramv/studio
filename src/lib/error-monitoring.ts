import { ErrorDetails, ErrorSeverity, ErrorType } from './error-handling'

/**
 * Error Monitoring and Alerting System
 * Provides real-time error monitoring, alerting, and health checks
 */

export interface AlertRule {
  id: string
  name: string
  condition: AlertCondition
  actions: AlertAction[]
  isActive: boolean
  cooldownMinutes: number
  lastTriggered?: Date
}

export interface AlertCondition {
  type: 'error_rate' | 'error_count' | 'specific_error' | 'severity_threshold'
  threshold: number
  timeWindowMinutes: number
  errorType?: ErrorType
  errorCode?: string
  severity?: ErrorSeverity
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'sms' | 'slack'
  target: string
  template?: string
}

export interface HealthMetrics {
  errorRate: number
  totalErrors: number
  errorsByType: Record<string, number>
  errorsBySeverity: Record<string, number>
  averageResponseTime: number
  uptime: number
  lastError?: ErrorDetails
  timestamp: Date
}

export class ErrorMonitor {
  private static instance: ErrorMonitor
  private errors: ErrorDetails[] = []
  private alertRules: AlertRule[] = []
  private healthMetrics: HealthMetrics
  private startTime: Date = new Date()

  private constructor() {
    this.healthMetrics = this.initializeHealthMetrics()
    this.setupDefaultAlertRules()
    this.startHealthCheck()
  }

  public static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor()
    }
    return ErrorMonitor.instance
  }

  /**
   * Record an error for monitoring
   */
  public recordError(error: ErrorDetails): void {
    this.errors.push({
      ...error,
      timestamp: new Date()
    })

    // Keep only last 1000 errors in memory
    if (this.errors.length > 1000) {
      this.errors = this.errors.slice(-1000)
    }

    this.updateHealthMetrics()
    this.checkAlertRules(error)
  }

  /**
   * Get current health metrics
   */
  public getHealthMetrics(): HealthMetrics {
    this.updateHealthMetrics()
    return { ...this.healthMetrics }
  }

  /**
   * Get error trends over time
   */
  public getErrorTrends(timeRangeHours: number = 24): {
    hourly: Array<{ hour: string; count: number; rate: number }>
    byType: Record<string, number>
    bySeverity: Record<string, number>
    topErrors: Array<{ code: string; count: number; message: string }>
  } {
    const now = new Date()
    const startTime = new Date(now.getTime() - timeRangeHours * 60 * 60 * 1000)
    
    const recentErrors = this.errors.filter(error => 
      (error.timestamp || new Date()) >= startTime
    )

    // Hourly breakdown
    const hourly: Array<{ hour: string; count: number; rate: number }> = []
    for (let i = 0; i < timeRangeHours; i++) {
      const hourStart = new Date(now.getTime() - (i + 1) * 60 * 60 * 1000)
      const hourEnd = new Date(now.getTime() - i * 60 * 60 * 1000)
      
      const hourErrors = recentErrors.filter(error => {
        const errorTime = error.timestamp || new Date()
        return errorTime >= hourStart && errorTime < hourEnd
      })

      hourly.unshift({
        hour: hourStart.toISOString().slice(0, 13) + ':00',
        count: hourErrors.length,
        rate: hourErrors.length / 60 // errors per minute
      })
    }

    // By type
    const byType = recentErrors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // By severity
    const bySeverity = recentErrors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Top errors
    const errorCounts = recentErrors.reduce((acc, error) => {
      const key = error.code
      if (!acc[key]) {
        acc[key] = { count: 0, message: error.message }
      }
      acc[key].count++
      return acc
    }, {} as Record<string, { count: number; message: string }>)

    const topErrors = Object.entries(errorCounts)
      .map(([code, data]) => ({ code, count: data.count, message: data.message }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      hourly,
      byType,
      bySeverity,
      topErrors
    }
  }

  /**
   * Add custom alert rule
   */
  public addAlertRule(rule: Omit<AlertRule, 'id'>): string {
    const alertRule: AlertRule = {
      id: crypto.randomUUID(),
      ...rule
    }
    
    this.alertRules.push(alertRule)
    return alertRule.id
  }

  /**
   * Update alert rule
   */
  public updateAlertRule(id: string, updates: Partial<AlertRule>): boolean {
    const index = this.alertRules.findIndex(rule => rule.id === id)
    if (index === -1) return false

    this.alertRules[index] = { ...this.alertRules[index], ...updates }
    return true
  }

  /**
   * Remove alert rule
   */
  public removeAlertRule(id: string): boolean {
    const index = this.alertRules.findIndex(rule => rule.id === id)
    if (index === -1) return false

    this.alertRules.splice(index, 1)
    return true
  }

  /**
   * Get all alert rules
   */
  public getAlertRules(): AlertRule[] {
    return [...this.alertRules]
  }

  /**
   * Check if any alert rules should be triggered
   */
  private checkAlertRules(error: ErrorDetails): void {
    const now = new Date()

    this.alertRules
      .filter(rule => rule.isActive)
      .forEach(rule => {
        // Check cooldown
        if (rule.lastTriggered) {
          const cooldownEnd = new Date(rule.lastTriggered.getTime() + rule.cooldownMinutes * 60 * 1000)
          if (now < cooldownEnd) return
        }

        if (this.shouldTriggerAlert(rule, error)) {
          this.triggerAlert(rule, error)
          rule.lastTriggered = now
        }
      })
  }

  /**
   * Check if alert should be triggered
   */
  private shouldTriggerAlert(rule: AlertRule, error: ErrorDetails): boolean {
    const { condition } = rule
    const timeWindow = new Date(Date.now() - condition.timeWindowMinutes * 60 * 1000)
    const recentErrors = this.errors.filter(e => (e.timestamp || new Date()) >= timeWindow)

    switch (condition.type) {
      case 'error_rate':
        const errorRate = recentErrors.length / condition.timeWindowMinutes
        return errorRate >= condition.threshold

      case 'error_count':
        return recentErrors.length >= condition.threshold

      case 'specific_error':
        if (condition.errorCode && error.code === condition.errorCode) {
          const specificErrors = recentErrors.filter(e => e.code === condition.errorCode)
          return specificErrors.length >= condition.threshold
        }
        if (condition.errorType && error.type === condition.errorType) {
          const typeErrors = recentErrors.filter(e => e.type === condition.errorType)
          return typeErrors.length >= condition.threshold
        }
        return false

      case 'severity_threshold':
        if (condition.severity) {
          const severityOrder = {
            [ErrorSeverity.LOW]: 1,
            [ErrorSeverity.MEDIUM]: 2,
            [ErrorSeverity.HIGH]: 3,
            [ErrorSeverity.CRITICAL]: 4
          }
          
          const errorSeverityLevel = severityOrder[error.severity]
          const thresholdLevel = severityOrder[condition.severity]
          
          return errorSeverityLevel >= thresholdLevel
        }
        return false

      default:
        return false
    }
  }

  /**
   * Trigger alert actions
   */
  private triggerAlert(rule: AlertRule, error: ErrorDetails): void {
    console.warn(`🚨 Alert triggered: ${rule.name}`, {
      rule: rule.name,
      error: {
        type: error.type,
        code: error.code,
        message: error.message,
        severity: error.severity
      }
    })

    rule.actions.forEach(action => {
      this.executeAlertAction(action, rule, error)
    })
  }

  /**
   * Execute alert action
   */
  private executeAlertAction(action: AlertAction, rule: AlertRule, error: ErrorDetails): void {
    const alertData = {
      ruleName: rule.name,
      error: {
        type: error.type,
        code: error.code,
        message: error.message,
        severity: error.severity,
        timestamp: error.timestamp
      },
      metrics: this.getHealthMetrics()
    }

    switch (action.type) {
      case 'email':
        this.sendEmailAlert(action.target, alertData)
        break
      case 'webhook':
        this.sendWebhookAlert(action.target, alertData)
        break
      case 'sms':
        this.sendSMSAlert(action.target, alertData)
        break
      case 'slack':
        this.sendSlackAlert(action.target, alertData)
        break
    }
  }

  /**
   * Send email alert (placeholder)
   */
  private sendEmailAlert(email: string, data: any): void {
    console.log(`📧 Email alert sent to ${email}:`, data)
    // In production, integrate with email service
  }

  /**
   * Send webhook alert (placeholder)
   */
  private sendWebhookAlert(url: string, data: any): void {
    console.log(`🔗 Webhook alert sent to ${url}:`, data)
    // In production, make HTTP request to webhook URL
  }

  /**
   * Send SMS alert (placeholder)
   */
  private sendSMSAlert(phone: string, data: any): void {
    console.log(`📱 SMS alert sent to ${phone}:`, data)
    // In production, integrate with SMS service
  }

  /**
   * Send Slack alert (placeholder)
   */
  private sendSlackAlert(channel: string, data: any): void {
    console.log(`💬 Slack alert sent to ${channel}:`, data)
    // In production, integrate with Slack API
  }

  /**
   * Initialize health metrics
   */
  private initializeHealthMetrics(): HealthMetrics {
    return {
      errorRate: 0,
      totalErrors: 0,
      errorsByType: {},
      errorsBySeverity: {},
      averageResponseTime: 0,
      uptime: 0,
      timestamp: new Date()
    }
  }

  /**
   * Update health metrics
   */
  private updateHealthMetrics(): void {
    const now = new Date()
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000)
    const recentErrors = this.errors.filter(error => 
      (error.timestamp || new Date()) >= lastHour
    )

    this.healthMetrics = {
      errorRate: recentErrors.length / 60, // errors per minute
      totalErrors: this.errors.length,
      errorsByType: recentErrors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      errorsBySeverity: recentErrors.reduce((acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      averageResponseTime: 0, // Would be calculated from request metrics
      uptime: (now.getTime() - this.startTime.getTime()) / 1000,
      lastError: this.errors[this.errors.length - 1],
      timestamp: now
    }
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultAlertRules(): void {
    // High error rate alert
    this.addAlertRule({
      name: 'High Error Rate',
      condition: {
        type: 'error_rate',
        threshold: 10, // 10 errors per minute
        timeWindowMinutes: 5
      },
      actions: [
        { type: 'email', target: 'admin@company.com' }
      ],
      isActive: true,
      cooldownMinutes: 15
    })

    // Critical error alert
    this.addAlertRule({
      name: 'Critical Error',
      condition: {
        type: 'severity_threshold',
        threshold: 1,
        timeWindowMinutes: 1,
        severity: ErrorSeverity.CRITICAL
      },
      actions: [
        { type: 'email', target: 'admin@company.com' },
        { type: 'sms', target: '+1234567890' }
      ],
      isActive: true,
      cooldownMinutes: 5
    })

    // Database error alert
    this.addAlertRule({
      name: 'Database Errors',
      condition: {
        type: 'specific_error',
        threshold: 3,
        timeWindowMinutes: 10,
        errorType: ErrorType.DATABASE
      },
      actions: [
        { type: 'email', target: 'dba@company.com' }
      ],
      isActive: true,
      cooldownMinutes: 30
    })
  }

  /**
   * Start periodic health check
   */
  private startHealthCheck(): void {
    setInterval(() => {
      this.updateHealthMetrics()
      
      // Log health status
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Health Check:', {
          errorRate: this.healthMetrics.errorRate,
          totalErrors: this.healthMetrics.totalErrors,
          uptime: Math.round(this.healthMetrics.uptime / 60) + ' minutes'
        })
      }
    }, 60000) // Every minute
  }

  /**
   * Get system health status
   */
  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    metrics: HealthMetrics
    issues: string[]
  } {
    const metrics = this.getHealthMetrics()
    const issues: string[] = []
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    // Check error rate
    if (metrics.errorRate > 20) {
      status = 'unhealthy'
      issues.push('Very high error rate')
    } else if (metrics.errorRate > 5) {
      status = 'degraded'
      issues.push('High error rate')
    }

    // Check for critical errors
    if (metrics.errorsBySeverity[ErrorSeverity.CRITICAL] > 0) {
      status = 'unhealthy'
      issues.push('Critical errors detected')
    }

    // Check for database errors
    if (metrics.errorsByType[ErrorType.DATABASE] > 5) {
      status = 'degraded'
      issues.push('Database connectivity issues')
    }

    return {
      status,
      metrics,
      issues
    }
  }
}

// Export singleton instance
export const errorMonitor = ErrorMonitor.getInstance()