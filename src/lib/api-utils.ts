import 'server-only'

import { NextResponse } from 'next/server'
import { Document, ClientSession } from 'mongodb'
import { MongoDBConnection } from './mongodb-service'

// Custom API Error class
export class ApiError extends Error {
  public statusCode: number
  public code: string

  constructor(statusCode: number, message: string, code?: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code || 'API_ERROR'
    this.name = 'ApiError'
  }
}

// Error response interface
export interface ErrorResponse {
  error: {
    message: string
    code: string
    statusCode: number
    timestamp: string
  }
}

// Success response interface
export interface SuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

// Handle API errors and return appropriate responses
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  if (error instanceof ApiError) {
    const errorResponse: ErrorResponse = {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        timestamp: new Date().toISOString(),
      }
    }
    return NextResponse.json(errorResponse, { status: error.statusCode })
  }

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('duplicate key')) {
      const errorResponse: ErrorResponse = {
        error: {
          message: 'A record with this information already exists',
          code: 'DUPLICATE_ENTRY',
          statusCode: 409,
          timestamp: new Date().toISOString(),
        }
      }
      return NextResponse.json(errorResponse, { status: 409 })
    }

    if (error.message.includes('validation')) {
      const errorResponse: ErrorResponse = {
        error: {
          message: error.message,
          code: 'VALIDATION_ERROR',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        }
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }
  }

  // Generic server error
  const errorResponse: ErrorResponse = {
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    }
  }
  return NextResponse.json(errorResponse, { status: 500 })
}

// Create error response
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  code?: string
): NextResponse {
  const errorResponse: ErrorResponse = {
    error: {
      message,
      code: code || 'API_ERROR',
      statusCode,
      timestamp: new Date().toISOString(),
    }
  }
  return NextResponse.json(errorResponse, { status: statusCode })
}

// Create success response
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    message,
  }
  return NextResponse.json(response, { status })
}

// Get database collection with error handling
export async function getCollection<T extends Document = Document>(collectionName: string) {
  try {
    const connection = MongoDBConnection.getInstance()
    const db = await connection.connect()
    return db.collection<T>(collectionName)
  } catch (error) {
    console.error(`Failed to get collection ${collectionName}:`, error)
    throw new ApiError(500, 'Database connection failed', 'DB_CONNECTION_ERROR')
  }
}

// Validate required fields
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field =>
    data[field] === undefined || data[field] === null || data[field] === ''
  )

  if (missingFields.length > 0) {
    throw new ApiError(
      400,
      `Missing required fields: ${missingFields.join(', ')}`,
      'MISSING_FIELDS'
    )
  }
}

// Validate ObjectId format
export function validateObjectId(id: string): boolean {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/
  return objectIdRegex.test(id)
}

// Validate ObjectId format and throw error if invalid
export function validateObjectIdOrThrow(id: string): void {
  if (!validateObjectId(id)) {
    throw new ApiError(400, 'Invalid ID format', 'INVALID_ID')
  }
}

// Parse and validate pagination parameters
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number
  limit: number
  skip: number
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

// Parse filter parameters
export function parseFilterParams(searchParams: URLSearchParams): Record<string, any> {
  const filters: Record<string, any> = {}

  // Common filter parameters
  const filterKeys = [
    'department',
    'location',
    'status',
    'classification',
    'search',
    'startDate',
    'endDate',
  ]

  filterKeys.forEach(key => {
    const value = searchParams.get(key)
    if (value && value.trim()) {
      filters[key] = value.trim()
    }
  })

  return filters
}

// Validate user permissions
export function validateUserPermissions(
  userRole: string,
  requiredRoles: string[]
): void {
  if (!requiredRoles.includes(userRole)) {
    throw new ApiError(
      403,
      'Insufficient permissions to perform this action',
      'INSUFFICIENT_PERMISSIONS'
    )
  }
}

// Validate department access for SPOCs and Users
export function validateDepartmentAccess(
  userRole: string,
  userDepartment: string | undefined,
  resourceDepartment: string
): void {
  if (userRole === 'admin') {
    return // Admins have access to all departments
  }

  if (userRole === 'spoc' || userRole === 'user') {
    if (!userDepartment || userDepartment !== resourceDepartment) {
      throw new ApiError(
        403,
        'Access denied: You can only access resources from your department',
        'DEPARTMENT_ACCESS_DENIED'
      )
    }
  }
}

// Sanitize input data
export function sanitizeInput(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Basic XSS prevention
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim()
    } else if (value !== null && value !== undefined) {
      sanitized[key] = value
    }
  }

  return sanitized
}

// Rate limiting helper (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

// Log API activity
export function logApiActivity(
  method: string,
  path: string,
  userId?: string,
  statusCode?: number,
  error?: string
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    method,
    path,
    userId,
    statusCode,
    error,
  }

  // In production, this would go to a proper logging service
  console.log('API Activity:', JSON.stringify(logEntry))
}

// Async wrapper for API routes with error handling
export function withErrorHandling(
  handler: (request: Request, context?: any) => Promise<NextResponse>
) {
  return async (request: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

// Database transaction wrapper
export async function withTransaction<T>(
  operation: (session: ClientSession) => Promise<T>
): Promise<T> {
  const connection = MongoDBConnection.getInstance()

  // Use the MongoDB service's built-in transaction support
  return await connection.withTransaction(operation)
}