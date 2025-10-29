import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { ValidationError } from './validation-framework'

/**
 * Comprehensive Error Handling System
 * Provides centralized error handling, logging, and user-friendly error messages
 */

// Error types and interfaces
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  BUSINESS_RULE = 'BUSINESS_RULE',
  DATABASE = 'DATABASE',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL = 'INTERNAL'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorContext {
  userId?: string
  requestId?: string
  endpoint?: string
  method?: string
  userAgent?: string
  ip?: string
  timestamp?: Date
  additionalData?: Record<string, any>
}

export interface ErrorDetails {
  type: ErrorType
  code: string
  message: string
  userMessage?: string
  severity: ErrorSeverity
  statusCode: number
  context?: ErrorContext
  originalError?: Error
  stack?: string
  suggestions?: string[]
  retryable?: boolean
}

// Custom error classes
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly code: string
  public readonly userMessage: string
  public readonly severity: ErrorSeverity
  public readonly statusCode: number
  public readonly context?: ErrorContext
  public readonly suggestions: string[]
  public readonly retryable: boolean

  constructor(details: Partial<ErrorDetails> & { message: string }) {
    super(details.message)
    this.name = 'AppError'
    this.type = details.type || ErrorType.INTERNAL
    this.code = details.code || 'UNKNOWN_ERROR'
    this.userMessage = details.userMessage || 'An unexpected error occurred'
    this.severity = details.severity || ErrorSeverity.MEDIUM
    this.statusCode = details.statusCode || 500
    this.context = details.context
    this.suggestions = details.suggestions || []
    this.retryable = details.retryable || false

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }
}

export class ValidationAppError extends AppError {
  constructor(message: string, details?: Partial<ErrorDetails>) {
    super({
      message,
      type: ErrorType.VALIDATION,
      code: 'VALIDATION_ERROR',
      userMessage: 'Please check your input and try again',
      severity: ErrorSeverity.LOW,
      statusCode: 400,
      ...details
    })
  }
}

export class AuthenticationAppError extends AppError {
  constructor(message: string, details?: Partial<ErrorDetails>) {
    super({
      message,
      type: ErrorType.AUTHENTICATION,
      code: 'AUTHENTICATION_ERROR',
      userMessage: 'Please log in to continue',
      severity: ErrorSeverity.MEDIUM,
      statusCode: 401,
      ...details
    })
  }
}

export class AuthorizationAppError extends AppError {
  constructor(message: string, details?: Partial<ErrorDetails>) {
    super({
      message,
      type: ErrorType.AUTHORIZATION,
      code: 'AUTHORIZATION_ERROR',
      userMessage: 'You do not have permission to perform this action',
      severity: ErrorSeverity.MEDIUM,
      statusCode: 403,
      ...details
    })
  }
}

export class NotFoundAppError extends AppError {
  constructor(resource: string, details?: Partial<ErrorDetails>) {
    super({
      message: `${resource} not found`,
      type: ErrorType.NOT_FOUND,
      code: 'RESOURCE_NOT_FOUND',
      userMessage: `The requested ${resource.toLowerCase()} could not be found`,
      severity: ErrorSeverity.LOW,
      statusCode: 404,
      ...details
    })
  }
}

export class ConflictAppError extends AppError {
  constructor(message: string, details?: Partial<ErrorDetails>) {
    super({
      message,
      type: ErrorType.CONFLICT,
      code: 'RESOURCE_CONFLICT',
      userMessage: 'This action conflicts with existing data',
      severity: ErrorSeverity.MEDIUM,
      statusCode: 409,
      ...details
    })
  }
}

export class BusinessRuleAppError extends AppError {
  constructor(message: string, details?: Partial<ErrorDetails>) {
    super({
      message,
      type: ErrorType.BUSINESS_RULE,
      code: 'BUSINESS_RULE_VIOLATION',
      userMessage: message, // Business rule errors are usually user-friendly
      severity: ErrorSeverity.MEDIUM,
      statusCode: 400,
      ...details
    })
  }
}

export class DatabaseAppError extends AppError {
  constructor(message: string, details?: Partial<ErrorDetails>) {
    super({
      message,
      type: ErrorType.DATABASE,
      code: 'DATABASE_ERROR',
      userMessage: 'A database error occurred. Please try again later',
      severity: ErrorSeverity.HIGH,
      statusCode: 500,
      retryable: true,
      ...details
    })
  }
}

export class ExternalServiceAppError extends AppError {
  constructor(service: string, details?: Partial<ErrorDetails>) {
    super({
      message: `External service error: ${service}`,
      type: ErrorType.EXTERNAL_SERVICE,
      code: 'EXTERNAL_SERVICE_ERROR',
      userMessage: 'An external service is temporarily unavailable. Please try again later',
      severity: ErrorSeverity.HIGH,
      statusCode: 503,
      retryable: true,
      ...details
    })
  }
}

export class RateLimitAppError extends AppError {
  constructor(details?: Partial<ErrorDetails>) {
    super({
      message: 'Rate limit exceeded',
      type: ErrorType.RATE_LIMIT,
      code: 'RATE_LIMIT_EXCEEDED',
      userMessage: 'Too many requests. Please wait before trying again',
      severity: ErrorSeverity.MEDIUM,
      statusCode: 429,
      retryable: true,
      suggestions: ['Wait a few minutes before trying again', 'Reduce the frequency of your requests'],
      ...details
    })
  }
}

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorLog: ErrorDetails[] = []

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * Handle and format errors for API responses
   */
  public handleError(error: unknown, context?: ErrorContext): NextResponse {
    const errorDetails = this.processError(error, context)
    this.logError(errorDetails)

    // Format response based on error type
    const response: any = {
      success: false,
      error: {
        type: errorDetails.type,
        code: errorDetails.code,
        message: errorDetails.userMessage,
        timestamp: new Date().toISOString(),
        requestId: context?.requestId,
        ...(errorDetails.suggestions && errorDetails.suggestions.length > 0 && { suggestions: errorDetails.suggestions }),
        ...(errorDetails.retryable && { retryable: true })
      }
    }

    // Add debug information in development
    if (process.env.NODE_ENV === 'development') {
      response.error.developerMessage = errorDetails.message;
      response.error.stack = errorDetails.stack;
    }

    return NextResponse.json(response, { status: errorDetails.statusCode })
  }

  /**
   * Process different types of errors
   */
  private processError(error: unknown, context?: ErrorContext): ErrorDetails {
    // Handle custom app errors
    if (error instanceof AppError) {
      return {
        type: error.type,
        code: error.code,
        message: error.message,
        userMessage: error.userMessage,
        severity: error.severity,
        statusCode: error.statusCode,
        context: { ...error.context, ...context },
        originalError: error,
        stack: error.stack,
        suggestions: error.suggestions,
        retryable: error.retryable
      }
    }

    // Handle validation errors
    if (error instanceof ValidationError) {
      return {
        type: ErrorType.VALIDATION,
        code: 'VALIDATION_FAILED',
        message: error.message,
        userMessage: 'Please check your input and correct any errors',
        severity: ErrorSeverity.LOW,
        statusCode: 400,
        context,
        originalError: error,
        suggestions: ['Review the highlighted fields', 'Ensure all required fields are filled']
      }
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const fieldErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      return {
        type: ErrorType.VALIDATION,
        code: 'SCHEMA_VALIDATION_FAILED',
        message: `Validation failed: ${fieldErrors}`,
        userMessage: 'Please check your input and correct any errors',
        severity: ErrorSeverity.LOW,
        statusCode: 400,
        context,
        originalError: error,
        suggestions: ['Check the format of your input', 'Ensure all required fields are provided']
      }
    }

    // Handle standard JavaScript errors
    if (error instanceof Error) {
      // Database connection errors
      if (error.message.includes('ECONNREFUSED') || error.message.includes('connection')) {
        return {
          type: ErrorType.DATABASE,
          code: 'DATABASE_CONNECTION_ERROR',
          message: error.message,
          userMessage: 'Database connection failed. Please try again later',
          severity: ErrorSeverity.HIGH,
          statusCode: 503,
          context,
          originalError: error,
          retryable: true,
          suggestions: ['Try again in a few minutes', 'Contact support if the problem persists']
        }
      }

      // Permission errors
      if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        return {
          type: ErrorType.AUTHORIZATION,
          code: 'PERMISSION_DENIED',
          message: error.message,
          userMessage: 'You do not have permission to perform this action',
          severity: ErrorSeverity.MEDIUM,
          statusCode: 403,
          context,
          originalError: error,
          suggestions: ['Contact your administrator for access', 'Ensure you are logged in with the correct account']
        }
      }

      // Timeout errors
      if (error.message.includes('timeout')) {
        return {
          type: ErrorType.EXTERNAL_SERVICE,
          code: 'REQUEST_TIMEOUT',
          message: error.message,
          userMessage: 'The request timed out. Please try again',
          severity: ErrorSeverity.MEDIUM,
          statusCode: 408,
          context,
          originalError: error,
          retryable: true,
          suggestions: ['Try again with a smaller request', 'Check your internet connection']
        }
      }

      // Generic error handling
      return {
        type: ErrorType.INTERNAL,
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
        userMessage: 'An unexpected error occurred. Please try again later',
        severity: ErrorSeverity.HIGH,
        statusCode: 500,
        context,
        originalError: error,
        stack: error.stack,
        retryable: true
      }
    }

    // Handle unknown errors
    return {
      type: ErrorType.INTERNAL,
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
      userMessage: 'An unexpected error occurred. Please try again later',
      severity: ErrorSeverity.HIGH,
      statusCode: 500,
      context,
      retryable: true
    }
  }

  /**
   * Log errors for monitoring and debugging
   */
  private logError(errorDetails: ErrorDetails): void {
    // Add to in-memory log (in production, this would go to a proper logging service)
    this.errorLog.push({
      ...errorDetails,
      timestamp: new Date()
    })

    // Console logging with appropriate level
    const logData = {
      type: errorDetails.type,
      code: errorDetails.code,
      message: errorDetails.message,
      severity: errorDetails.severity,
      statusCode: errorDetails.statusCode,
      context: errorDetails.context,
      timestamp: new Date().toISOString()
    }

    switch (errorDetails.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('🚨 CRITICAL ERROR:', logData)
        break
      case ErrorSeverity.HIGH:
        console.error('❌ HIGH SEVERITY ERROR:', logData)
        break
      case ErrorSeverity.MEDIUM:
        console.warn('⚠️ MEDIUM SEVERITY ERROR:', logData)
        break
      case ErrorSeverity.LOW:
        console.info('ℹ️ LOW SEVERITY ERROR:', logData)
        break
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(errorDetails)
    }
  }

  /**
   * Send error to monitoring service (placeholder)
   */
  private sendToMonitoringService(errorDetails: ErrorDetails): void {
    // This would integrate with services like Sentry, DataDog, etc.
    // For now, we'll just log it
    console.log('📊 Sending to monitoring service:', {
      type: errorDetails.type,
      code: errorDetails.code,
      severity: errorDetails.severity,
      context: errorDetails.context
    })
  }

  /**
   * Get error statistics
   */
  public getErrorStats(timeRange?: { start: Date; end: Date }) {
    let errors = this.errorLog

    if (timeRange) {
      errors = errors.filter(error => {
        const errorTime = error.context?.timestamp || new Date()
        return errorTime >= timeRange.start && errorTime <= timeRange.end
      })
    }

    const stats = {
      total: errors.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byStatusCode: {} as Record<string, number>,
      mostCommon: [] as Array<{ code: string; count: number }>
    }

    errors.forEach(error => {
      // Count by type
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1

      // Count by severity
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1

      // Count by status code
      const statusCode = error.statusCode.toString()
      stats.byStatusCode[statusCode] = (stats.byStatusCode[statusCode] || 0) + 1
    })

    // Calculate most common errors
    const errorCounts = errors.reduce((acc, error) => {
      acc[error.code] = (acc[error.code] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    stats.mostCommon = Object.entries(errorCounts)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return stats
  }

  /**
   * Clear error log (for testing or maintenance)
   */
  public clearErrorLog(): void {
    this.errorLog = []
  }
}

// Utility functions
export function createErrorContext(
  request?: Request,
  user?: { id: string },
  additionalData?: Record<string, any>
): ErrorContext {
  return {
    userId: user?.id,
    requestId: crypto.randomUUID(),
    endpoint: request?.url,
    method: request?.method,
    userAgent: request?.headers.get('user-agent') || undefined,
    ip: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    timestamp: new Date(),
    additionalData
  }
}

export function handleApiError(error: unknown, context?: ErrorContext): NextResponse {
  return ErrorHandler.getInstance().handleError(error, context)
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance()