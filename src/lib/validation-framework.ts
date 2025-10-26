import { z } from 'zod'
import { JWTPayload } from '@/types/auth'

/**
 * Validation Framework
 * Provides comprehensive validation utilities for the application
 */

// Custom validation error class
export class ValidationError extends Error {
  public errors: ValidationErrorDetail[]
  public statusCode: number = 400

  constructor(errors: ValidationErrorDetail[], message = 'Validation failed') {
    super(message)
    this.name = 'ValidationError'
    this.errors = errors
  }
}

export interface ValidationErrorDetail {
  field: string
  message: string
  code: string
  value?: any
}

// Business rule validation functions
export class BusinessRuleValidator {
  /**
   * Validate asset business rules
   */
  static validateAssetRules(data: any, user: JWTPayload): ValidationErrorDetail[] {
    const errors: ValidationErrorDetail[] = []

    // Department access validation
    if (user.role !== 'admin' && data.department && data.department !== user.department) {
      errors.push({
        field: 'department',
        message: 'You can only create assets for your own department',
        code: 'DEPARTMENT_ACCESS_DENIED',
        value: data.department
      })
    }

    // Asset value validation
    if (data.purchaseValue && data.purchaseValue > 1000000 && !data.approvalRequired) {
      errors.push({
        field: 'purchaseValue',
        message: 'Assets over 10 lakhs require special approval',
        code: 'HIGH_VALUE_APPROVAL_REQUIRED',
        value: data.purchaseValue
      })
    }

    // Serial number uniqueness for certain classifications
    if (data.assetClassification === 'Hardware' && 
        data.productSerialNo && 
        data.productSerialNo.length < 5) {
      errors.push({
        field: 'productSerialNo',
        message: 'Hardware assets must have a valid serial number (min 5 characters)',
        code: 'INVALID_SERIAL_NUMBER',
        value: data.productSerialNo
      })
    }

    // Lifecycle validation
    if (data.capitalizationDate && data.eolDate) {
      const capDate = new Date(data.capitalizationDate)
      const eolDate = new Date(data.eolDate)
      
      if (eolDate <= capDate) {
        errors.push({
          field: 'eolDate',
          message: 'End of life date must be after capitalization date',
          code: 'INVALID_EOL_DATE',
          value: data.eolDate
        })
      }
    }

    return errors
  }

  /**
   * Validate workflow business rules
   */
  static validateWorkflowRules(data: any, user: JWTPayload): ValidationErrorDetail[] {
    const errors: ValidationErrorDetail[] = []

    // Check if user can start workflows for the context type
    if (data.contextType === 'asset_transfer' && user.role === 'user') {
      errors.push({
        field: 'contextType',
        message: 'Users cannot initiate asset transfer workflows',
        code: 'INSUFFICIENT_WORKFLOW_PERMISSIONS'
      })
    }

    // Validate priority based on user role
    if (data.priority === 'urgent' && !['admin', 'spoc'].includes(user.role)) {
      errors.push({
        field: 'priority',
        message: 'Only admins and SPOCs can set urgent priority',
        code: 'INVALID_PRIORITY_LEVEL',
        value: data.priority
      })
    }

    // Due date validation
    if (data.dueDate) {
      const dueDate = new Date(data.dueDate)
      const now = new Date()
      
      if (dueDate <= now) {
        errors.push({
          field: 'dueDate',
          message: 'Due date must be in the future',
          code: 'INVALID_DUE_DATE',
          value: data.dueDate
        })
      }
    }

    return errors
  }

  /**
   * Validate transfer business rules
   */
  static validateTransferRules(data: any, asset: any, user: JWTPayload): ValidationErrorDetail[] {
    const errors: ValidationErrorDetail[] = []

    // Check asset status
    if (asset.currentStatus === 'Scrapped') {
      errors.push({
        field: 'assetId',
        message: 'Cannot transfer scrapped assets',
        code: 'INVALID_ASSET_STATUS',
        value: asset.currentStatus
      })
    }

    if (asset.currentStatus === 'Under Maintenance') {
      errors.push({
        field: 'assetId',
        message: 'Cannot transfer assets under maintenance',
        code: 'INVALID_ASSET_STATUS',
        value: asset.currentStatus
      })
    }

    // Department access validation
    if (user.role !== 'admin' && asset.department !== user.department) {
      errors.push({
        field: 'assetId',
        message: 'You can only transfer assets from your department',
        code: 'DEPARTMENT_ACCESS_DENIED'
      })
    }

    // DC number format validation
    if (data.dcNumber && !/^DC-\d{4}-\d{3,}$/.test(data.dcNumber)) {
      errors.push({
        field: 'dcNumber',
        message: 'DC number must follow format: DC-YYYY-XXX',
        code: 'INVALID_DC_FORMAT',
        value: data.dcNumber
      })
    }

    // Location validation
    if (data.toLocation === asset.location) {
      errors.push({
        field: 'toLocation',
        message: 'Cannot transfer asset to the same location',
        code: 'SAME_LOCATION_TRANSFER',
        value: data.toLocation
      })
    }

    return errors
  }

  /**
   * Validate verification business rules
   */
  static validateVerificationRules(data: any, asset: any, user: JWTPayload): ValidationErrorDetail[] {
    const errors: ValidationErrorDetail[] = []

    // Department access validation
    if (user.role !== 'admin' && asset.department !== user.department) {
      errors.push({
        field: 'assetId',
        message: 'You can only verify assets from your department',
        code: 'DEPARTMENT_ACCESS_DENIED'
      })
    }

    // Recent verification check
    if (asset.verifiedOn) {
      const lastVerified = new Date(asset.verifiedOn)
      const daysSinceVerification = Math.floor((Date.now() - lastVerified.getTime()) / (24 * 60 * 60 * 1000))
      
      if (daysSinceVerification < 30) {
        errors.push({
          field: 'verificationDate',
          message: 'Asset was verified less than 30 days ago',
          code: 'RECENT_VERIFICATION_EXISTS',
          value: asset.verifiedOn
        })
      }
    }

    // Consistency validation
    if (data.verificationStatus === 'Verified' && data.usableCondition === 'No') {
      errors.push({
        field: 'verificationStatus',
        message: 'Cannot mark asset as verified if it is not usable',
        code: 'INCONSISTENT_VERIFICATION_STATUS'
      })
    }

    if (data.workingConditionStatus === 'Working' && data.usableCondition === 'No') {
      errors.push({
        field: 'workingConditionStatus',
        message: 'Asset cannot be working if it is not usable',
        code: 'INCONSISTENT_WORKING_STATUS'
      })
    }

    return errors
  }
}

// Data integrity validators
export class DataIntegrityValidator {
  /**
   * Validate referential integrity
   */
  static async validateReferences(data: any, type: string): Promise<ValidationErrorDetail[]> {
    const errors: ValidationErrorDetail[] = []

    // This would typically check database references
    // For now, we'll implement basic validation

    if (type === 'asset' && data.department) {
      // Validate department exists
      const validDepartments = ['IT', 'Finance', 'HR', 'Operations', 'R&D']
      if (!validDepartments.includes(data.department)) {
        errors.push({
          field: 'department',
          message: 'Invalid department reference',
          code: 'INVALID_REFERENCE',
          value: data.department
        })
      }
    }

    return errors
  }

  /**
   * Validate data consistency
   */
  static validateConsistency(data: any, existingData?: any): ValidationErrorDetail[] {
    const errors: ValidationErrorDetail[] = []

    // Check for required field combinations
    if (data.purchaseValue && !data.capitalizationDate) {
      errors.push({
        field: 'capitalizationDate',
        message: 'Capitalization date is required when purchase value is provided',
        code: 'MISSING_REQUIRED_FIELD'
      })
    }

    // Validate status transitions
    if (existingData && data.currentStatus && existingData.currentStatus) {
      const validTransitions = {
        'Active': ['Inactive', 'Under Maintenance', 'Scrapped'],
        'Inactive': ['Active', 'Scrapped'],
        'Under Maintenance': ['Active', 'Inactive', 'Scrapped'],
        'Scrapped': [] // No transitions from scrapped
      }

      const allowedTransitions = (validTransitions as any)[existingData.currentStatus] || []
      if (!allowedTransitions.includes(data.currentStatus)) {
        errors.push({
          field: 'currentStatus',
          message: `Invalid status transition from ${existingData.currentStatus} to ${data.currentStatus}`,
          code: 'INVALID_STATUS_TRANSITION',
          value: data.currentStatus
        })
      }
    }

    return errors
  }
}

// Custom validation rules
export class CustomValidationRules {
  /**
   * Validate asset number format
   */
  static assetNumber = z.string().refine(
    (val) => /^AST-\d{4}-\d{4}$/.test(val),
    {
      message: 'Asset number must follow format: AST-YYYY-XXXX'
    }
  )

  /**
   * Validate email domain
   */
  static companyEmail = z.string().email().refine(
    (val) => val.endsWith('@kti.com') || val.endsWith('@company.com'),
    {
      message: 'Must use company email domain'
    }
  )

  /**
   * Validate phone number format
   */
  static phoneNumber = z.string().refine(
    (val) => /^[+]?[\d\s-()]{10,15}$/.test(val),
    {
      message: 'Invalid phone number format'
    }
  )

  /**
   * Validate monetary amount
   */
  static monetaryAmount = z.number().refine(
    (val) => val >= 0 && Number.isFinite(val),
    {
      message: 'Amount must be a positive finite number'
    }
  )

  /**
   * Validate date range
   */
  static dateRange = () => {
    return z.object({
      startDate: z.date(),
      endDate: z.date()
    }).refine(
      (data) => data.endDate > data.startDate,
      {
        message: 'End date must be after start date',
        path: ['endDate']
      }
    )
  }
}

// Validation middleware
export class ValidationMiddleware {
  /**
   * Validate request data with schema and business rules
   */
  static async validateRequest(
    data: any,
    schema: z.ZodSchema,
    user: JWTPayload,
    businessRuleType?: string,
    existingData?: any
  ): Promise<{ isValid: boolean; errors: ValidationErrorDetail[]; data?: any }> {
    const errors: ValidationErrorDetail[] = []

    try {
      // Schema validation
      const validatedData = schema.parse(data)

      // Business rule validation
      if (businessRuleType) {
        let businessErrors: ValidationErrorDetail[] = []

        switch (businessRuleType) {
          case 'asset':
            businessErrors = BusinessRuleValidator.validateAssetRules(data, user)
            break
          case 'workflow':
            businessErrors = BusinessRuleValidator.validateWorkflowRules(data, user)
            break
          case 'transfer':
            businessErrors = BusinessRuleValidator.validateTransferRules(data, existingData, user)
            break
          case 'verification':
            businessErrors = BusinessRuleValidator.validateVerificationRules(data, existingData, user)
            break
        }

        errors.push(...businessErrors)
      }

      // Data integrity validation
      const integrityErrors = DataIntegrityValidator.validateConsistency(data, existingData)
      errors.push(...integrityErrors)

      // Reference validation
      if (businessRuleType) {
        const referenceErrors = await DataIntegrityValidator.validateReferences(data, businessRuleType)
        errors.push(...referenceErrors)
      }

      return {
        isValid: errors.length === 0,
        errors,
        data: validatedData
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          value: (err as any).input
        }))
        errors.push(...zodErrors)
      } else {
        errors.push({
          field: 'general',
          message: 'Validation failed',
          code: 'VALIDATION_ERROR'
        })
      }

      return {
        isValid: false,
        errors
      }
    }
  }

  /**
   * Format validation errors for API response
   */
  static formatErrors(errors: ValidationErrorDetail[]) {
    return {
      message: 'Validation failed',
      errors: errors.reduce((acc, error) => {
        if (!acc[error.field]) {
          acc[error.field] = []
        }
        acc[error.field].push({
          message: error.message,
          code: error.code,
          value: error.value
        })
        return acc
      }, {} as Record<string, any[]>),
      totalErrors: errors.length
    }
  }
}

// Classes are already exported above, no need to re-export