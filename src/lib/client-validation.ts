import { z } from 'zod'
import { ValidationErrorDetail } from './validation-framework'

/**
 * Client-side validation utilities
 * Provides real-time validation for forms and user inputs
 */

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
}

export class ClientValidator {
  /**
   * Validate form field in real-time
   */
  static validateField(
    fieldName: string,
    value: any,
    schema: z.ZodSchema,
    context?: any
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Extract field schema from object schema
      let fieldSchema: z.ZodSchema = schema

      if (schema instanceof z.ZodObject) {
        const shape = schema.shape
        fieldSchema = shape[fieldName]
      }

      if (fieldSchema) {
        fieldSchema.parse(value)
      }

      // Add contextual warnings
      if (context) {
        const contextWarnings = this.getContextualWarnings(fieldName, value, context)
        warnings.push(...contextWarnings)
      }

      return {
        isValid: true,
        errors,
        warnings
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(err => err.message))
      }

      return {
        isValid: false,
        errors,
        warnings
      }
    }
  }

  /**
   * Validate entire form
   */
  static validateForm(
    data: any,
    schema: z.ZodSchema,
    context?: any
  ): ValidationResult {
    const errors: Record<string, string[]> = {}
    const warnings: Record<string, string[]> = {}

    try {
      schema.parse(data)

      // Add contextual warnings for the entire form
      if (context) {
        Object.keys(data).forEach(fieldName => {
          const fieldWarnings = this.getContextualWarnings(fieldName, data[fieldName], context)
          if (fieldWarnings.length > 0) {
            warnings[fieldName] = fieldWarnings
          }
        })
      }

      return {
        isValid: true,
        errors,
        warnings
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          const fieldName = err.path.join('.')
          if (!errors[fieldName]) {
            errors[fieldName] = []
          }
          errors[fieldName].push(err.message)
        })
      }

      return {
        isValid: false,
        errors,
        warnings
      }
    }
  }

  /**
   * Get contextual warnings based on business rules
   */
  private static getContextualWarnings(
    fieldName: string,
    value: any,
    context: any
  ): string[] {
    const warnings: string[] = []

    // Asset-specific warnings
    if (context.type === 'asset') {
      if (fieldName === 'purchaseValue' && value > 500000) {
        warnings.push('High value asset - ensure proper documentation')
      }

      if (fieldName === 'assetClassification' && value === 'Software' && !context.data?.licenseInfo) {
        warnings.push('Consider adding license information for software assets')
      }

      if (fieldName === 'location' && value === 'Warehouse' && context.data?.currentStatus === 'Active') {
        warnings.push('Active assets are typically not stored in warehouse')
      }
    }

    // Transfer-specific warnings
    if (context.type === 'transfer') {
      if (fieldName === 'isTemporary' && value === false && !context.data?.expectedReturnDate) {
        warnings.push('Permanent transfers should have clear documentation')
      }

      if (fieldName === 'toLocation' && context.asset?.location === value) {
        warnings.push('Asset is already at this location')
      }
    }

    // Verification-specific warnings
    if (context.type === 'verification') {
      if (fieldName === 'usableCondition' && value === 'Partial' && !context.data?.comments) {
        warnings.push('Please provide details about partial usability')
      }

      if (fieldName === 'workingConditionStatus' && value === 'Under Maintenance' && !context.data?.recommendedActions) {
        warnings.push('Consider adding recommended maintenance actions')
      }
    }

    return warnings
  }

  /**
   * Validate file uploads
   */
  static validateFile(
    file: File,
    options: {
      maxSize?: number // in bytes
      allowedTypes?: string[]
      maxFiles?: number
    } = {}
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      maxFiles = 1
    } = options

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`)
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`)
    }

    // Check file name
    if (file.name.length > 255) {
      errors.push('File name is too long')
    }

    // Check for potentially dangerous file names
    const dangerousPatterns = [/\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i]
    if (dangerousPatterns.some(pattern => pattern.test(file.name))) {
      errors.push('File type not allowed for security reasons')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate multiple files
   */
  static validateFiles(
    files: FileList | File[],
    options: {
      maxSize?: number
      allowedTypes?: string[]
      maxFiles?: number
      totalMaxSize?: number
    } = {}
  ): { isValid: boolean; errors: string[]; fileErrors: Record<string, string[]> } {
    const errors: string[] = []
    const fileErrors: Record<string, string[]> = {}
    const {
      maxFiles = 5,
      totalMaxSize = 50 * 1024 * 1024 // 50MB total
    } = options

    const fileArray = Array.from(files)

    // Check number of files
    if (fileArray.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`)
    }

    // Check total size
    const totalSize = fileArray.reduce((sum, file) => sum + file.size, 0)
    if (totalSize > totalMaxSize) {
      errors.push(`Total file size must be less than ${Math.round(totalMaxSize / (1024 * 1024))}MB`)
    }

    // Validate each file
    fileArray.forEach((file, index) => {
      const fileValidation = this.validateFile(file, options)
      if (!fileValidation.isValid) {
        fileErrors[`file_${index}`] = fileValidation.errors
      }
    })

    return {
      isValid: errors.length === 0 && Object.keys(fileErrors).length === 0,
      errors,
      fileErrors
    }
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): {
    isValid: boolean
    score: number // 0-4
    feedback: string[]
    requirements: Record<string, boolean>
  } {
    const feedback: string[] = []
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noCommonPatterns: !this.hasCommonPatterns(password)
    }

    let score = 0

    // Calculate score
    if (requirements.minLength) score++
    if (requirements.hasUppercase) score++
    if (requirements.hasLowercase) score++
    if (requirements.hasNumbers) score++
    if (requirements.hasSpecialChars) score++
    if (requirements.noCommonPatterns) score++

    // Generate feedback
    if (!requirements.minLength) {
      feedback.push('Password must be at least 8 characters long')
    }
    if (!requirements.hasUppercase) {
      feedback.push('Add uppercase letters')
    }
    if (!requirements.hasLowercase) {
      feedback.push('Add lowercase letters')
    }
    if (!requirements.hasNumbers) {
      feedback.push('Add numbers')
    }
    if (!requirements.hasSpecialChars) {
      feedback.push('Add special characters')
    }
    if (!requirements.noCommonPatterns) {
      feedback.push('Avoid common patterns like "123456" or "password"')
    }

    return {
      isValid: score >= 4,
      score: Math.min(score, 4),
      feedback,
      requirements
    }
  }

  /**
   * Check for common password patterns
   */
  private static hasCommonPatterns(password: string): boolean {
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /letmein/i,
      /welcome/i,
      /monkey/i,
      /dragon/i
    ]

    return commonPatterns.some(pattern => pattern.test(password))
  }

  /**
   * Validate email format and domain
   */
  static validateEmail(email: string, allowedDomains?: string[]): {
    isValid: boolean
    errors: string[]
    suggestions: string[]
  } {
    const errors: string[] = []
    const suggestions: string[] = []

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format')
      return { isValid: false, errors, suggestions }
    }

    const [localPart, domain] = email.split('@')

    // Check local part length
    if (localPart.length > 64) {
      errors.push('Email local part is too long')
    }

    // Check domain
    if (domain.length > 253) {
      errors.push('Email domain is too long')
    }

    // Check allowed domains
    if (allowedDomains && allowedDomains.length > 0) {
      const isAllowedDomain = allowedDomains.some(allowedDomain => 
        domain.toLowerCase().endsWith(allowedDomain.toLowerCase())
      )
      
      if (!isAllowedDomain) {
        errors.push(`Email must be from allowed domains: ${allowedDomains.join(', ')}`)
        suggestions.push(`Try using: ${localPart}@${allowedDomains[0]}`)
      }
    }

    // Common typo suggestions
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
    const domainLower = domain.toLowerCase()
    
    commonDomains.forEach(commonDomain => {
      if (this.calculateLevenshteinDistance(domainLower, commonDomain) === 1) {
        suggestions.push(`Did you mean: ${localPart}@${commonDomain}?`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      suggestions
    }
  }

  /**
   * Calculate Levenshtein distance for typo detection
   */
  private static calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }
}

// React hook for form validation
export function useFormValidation<T>(
  schema: z.ZodSchema<T>,
  options: {
    validateOnChange?: boolean
    validateOnBlur?: boolean
    context?: any
  } = {}
) {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    context
  } = options

  const validateField = (fieldName: string, value: any) => {
    return ClientValidator.validateField(fieldName, value, schema, context)
  }

  const validateForm = (data: any) => {
    return ClientValidator.validateForm(data, schema, context)
  }

  return {
    validateField,
    validateForm,
    validateOnChange,
    validateOnBlur
  }
}

export default ClientValidator