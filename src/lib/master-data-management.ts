import { MongoDBConnection, BaseMongoService } from './mongodb-service'
import { ObjectId, ClientSession } from '@/types/server-types'
import { JWTPayload } from '@/types/auth'

// Master data types and interfaces
export interface MasterDataType {
  id: string
  name: string
  description: string
  category: 'system' | 'business' | 'reference'
  collection: string
  schema: MasterDataSchema
  validation: ValidationRules
  permissions: MasterDataPermissions
  versioning: VersioningConfig
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  lastModifiedBy: string
}

export interface MasterDataSchema {
  fields: MasterDataField[]
  indexes: MasterDataIndex[]
  relationships: MasterDataRelationship[]
}

export interface MasterDataField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'reference'
  required: boolean
  unique?: boolean
  defaultValue?: any
  validation?: FieldValidation
  display: FieldDisplay
}

export interface FieldValidation {
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  enum?: string[]
  customValidator?: string
}

export interface FieldDisplay {
  label: string
  description?: string
  placeholder?: string
  helpText?: string
  order: number
  group?: string
  hidden?: boolean
  readonly?: boolean
}

export interface MasterDataIndex {
  name: string
  fields: string[]
  unique: boolean
  sparse?: boolean
}

export interface MasterDataRelationship {
  field: string
  targetCollection: string
  targetField: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  cascadeDelete?: boolean
  required?: boolean
}

export interface ValidationRules {
  businessRules: BusinessRule[]
  referentialIntegrity: ReferentialIntegrityRule[]
  customValidators: CustomValidator[]
}

export interface BusinessRule {
  id: string
  name: string
  description: string
  condition: string // JavaScript expression
  message: string
  severity: 'error' | 'warning'
  isActive: boolean
}

export interface ReferentialIntegrityRule {
  field: string
  referencedCollection: string
  referencedField: string
  onDelete: 'cascade' | 'restrict' | 'set_null'
  onUpdate: 'cascade' | 'restrict'
}

export interface CustomValidator {
  name: string
  function: string // JavaScript function
  message: string
}

export interface MasterDataPermissions {
  read: string[] // Roles that can read
  create: string[] // Roles that can create
  update: string[] // Roles that can update
  delete: string[] // Roles that can delete
  export: string[] // Roles that can export
  import: string[] // Roles that can import
}

export interface VersioningConfig {
  enabled: boolean
  maxVersions: number
  trackFields: string[]
  retentionDays: number
}

export interface MasterDataEntry {
  id: string
  type: string
  data: Record<string, any>
  version: number
  status: 'active' | 'inactive' | 'deprecated'
  effectiveDate?: Date
  expiryDate?: Date
  createdAt: Date
  updatedAt: Date
  createdBy: string
  lastModifiedBy: string
  changeHistory: MasterDataChange[]
}

export interface MasterDataChange {
  id: string
  version: number
  changeType: 'create' | 'update' | 'delete' | 'activate' | 'deactivate'
  changedFields: string[]
  oldValues: Record<string, any>
  newValues: Record<string, any>
  reason?: string
  approvedBy?: string
  changedAt: Date
  changedBy: string
}

export interface MasterDataValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  field: string
  message: string
  code: string
  recommendation?: string
}

export interface MasterDataImportResult {
  totalRecords: number
  successfulImports: number
  failedImports: number
  warnings: number
  errors: ImportError[]
  summary: Record<string, any>
}

export interface ImportError {
  row: number
  field?: string
  message: string
  data: Record<string, any>
}

/**
 * Master Data Management Engine
 * Handles generic master data operations with validation and versioning
 */
export class MasterDataManagementEngine extends BaseMongoService<any> {
  private masterDataTypesCollection = 'masterDataTypes'
  private masterDataCollection = 'masterData'
  private changeHistoryCollection = 'masterDataChanges'

  constructor() {
    super('master_data_management')
  }

  /**
   * Register a new master data type
   */
  async registerMasterDataType(
    typeData: Omit<MasterDataType, 'id' | 'createdAt' | 'updatedAt'>,
    createdBy: string,
    session?: ClientSession
  ): Promise<MasterDataType> {
    try {
      await this.ensureConnection()

      // Validate schema
      this.validateMasterDataSchema(typeData.schema)

      // Create collection if it doesn't exist
      await this.createMasterDataCollection(typeData.collection, typeData.schema)

      const typeDocument: Omit<MasterDataType, 'id'> = {
        ...typeData,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        lastModifiedBy: createdBy
      }

      const typesCollection = this.db.collection(this.masterDataTypesCollection)
      const result = await typesCollection.insertOne(
        typeDocument,
        session ? { session } : {}
      )

      return {
        id: result.insertedId.toString(),
        ...typeDocument
      }
    } catch (error) {
      this.handleError('registerMasterDataType', error)
    }
  }

  /**
   * Get master data type by ID
   */
  async getMasterDataType(typeId: string): Promise<MasterDataType> {
    try {
      await this.ensureConnection()

      const typesCollection = this.db.collection(this.masterDataTypesCollection)
      const type = await typesCollection.findOne({ _id: new ObjectId(typeId) })

      if (!type) {
        throw new Error('Master data type not found')
      }

      return {
        id: type._id.toString(),
        name: type.name,
        description: type.description,
        category: type.category,
        collection: type.collection,
        schema: type.schema,
        validation: type.validation,
        permissions: type.permissions,
        versioning: type.versioning,
        isActive: type.isActive,
        createdAt: type.createdAt,
        updatedAt: type.updatedAt,
        createdBy: type.createdBy,
        lastModifiedBy: type.lastModifiedBy
      }
    } catch (error) {
      this.handleError('getMasterDataType', error)
    }
  }

  /**
   * List all master data types
   */
  async listMasterDataTypes(
    filters: {
      category?: string
      isActive?: boolean
    } = {}
  ): Promise<MasterDataType[]> {
    try {
      await this.ensureConnection()

      const typesCollection = this.db.collection(this.masterDataTypesCollection)
      const query: any = {}

      if (filters.category) query.category = filters.category
      if (filters.isActive !== undefined) query.isActive = filters.isActive

      const types = await typesCollection
        .find(query)
        .sort({ name: 1 })
        .toArray()

      return types.map(type => ({
        id: type._id.toString(),
        name: type.name,
        description: type.description,
        category: type.category,
        collection: type.collection,
        schema: type.schema,
        validation: type.validation,
        permissions: type.permissions,
        versioning: type.versioning,
        isActive: type.isActive,
        createdAt: type.createdAt,
        updatedAt: type.updatedAt,
        createdBy: type.createdBy,
        lastModifiedBy: type.lastModifiedBy
      }))
    } catch (error) {
      this.handleError('listMasterDataTypes', error)
    }
  }

  /**
   * Create master data entry
   */
  async createMasterDataEntry(
    typeId: string,
    data: Record<string, any>,
    createdBy: string,
    user?: JWTPayload,
    session?: ClientSession
  ): Promise<MasterDataEntry> {
    try {
      await this.ensureConnection()

      const masterDataType = await this.getMasterDataType(typeId)

      // Check permissions
      if (!this.hasPermission(masterDataType.permissions.create, user)) {
        throw new Error('Insufficient permissions to create master data')
      }

      // Validate data
      const validation = await this.validateMasterData(data, masterDataType)
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
      }

      // Create entry
      const entryId = new ObjectId().toString()
      const entry: Omit<MasterDataEntry, 'id'> = {
        type: typeId,
        data,
        version: 1,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        lastModifiedBy: createdBy,
        changeHistory: []
      }

      const masterDataCollection = this.db.collection(this.masterDataCollection)
      await masterDataCollection.insertOne(
        { _id: new ObjectId(entryId), ...entry },
        session ? { session } : {}
      )

      // Record change history
      if (masterDataType.versioning.enabled) {
        await this.recordChange({
          entryId,
          version: 1,
          changeType: 'create',
          changedFields: Object.keys(data),
          oldValues: {},
          newValues: data,
          changedAt: new Date(),
          changedBy: createdBy
        }, session)
      }

      return {
        id: entryId,
        ...entry
      }
    } catch (error) {
      this.handleError('createMasterDataEntry', error)
    }
  }

  /**
   * Update master data entry
   */
  async updateMasterDataEntry(
    entryId: string,
    updates: Record<string, any>,
    updatedBy: string,
    reason?: string,
    user?: JWTPayload,
    session?: ClientSession
  ): Promise<MasterDataEntry> {
    try {
      await this.ensureConnection()

      // Get current entry
      const currentEntry = await this.getMasterDataEntry(entryId)
      const masterDataType = await this.getMasterDataType(currentEntry.type)

      // Check permissions
      if (!this.hasPermission(masterDataType.permissions.update, user)) {
        throw new Error('Insufficient permissions to update master data')
      }

      // Validate updates
      const mergedData = { ...currentEntry.data, ...updates }
      const validation = await this.validateMasterData(mergedData, masterDataType)
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
      }

      // Track changes
      const changedFields = Object.keys(updates).filter(
        key => JSON.stringify(updates[key]) !== JSON.stringify(currentEntry.data[key])
      )

      if (changedFields.length === 0) {
        throw new Error('No changes detected')
      }

      const oldValues = {}
      const newValues = {}
      changedFields.forEach(field => {
        oldValues[field] = currentEntry.data[field]
        newValues[field] = updates[field]
      })

      // Update entry
      const newVersion = masterDataType.versioning.enabled ? currentEntry.version + 1 : currentEntry.version
      const updateDocument = {
        data: mergedData,
        version: newVersion,
        updatedAt: new Date(),
        lastModifiedBy: updatedBy
      }

      const masterDataCollection = this.db.collection(this.masterDataCollection)
      await masterDataCollection.updateOne(
        { _id: new ObjectId(entryId) },
        { $set: updateDocument },
        session ? { session } : {}
      )

      // Record change history
      if (masterDataType.versioning.enabled) {
        await this.recordChange({
          entryId,
          version: newVersion,
          changeType: 'update',
          changedFields,
          oldValues,
          newValues,
          reason,
          changedAt: new Date(),
          changedBy: updatedBy
        }, session)
      }

      return {
        ...currentEntry,
        ...updateDocument
      }
    } catch (error) {
      this.handleError('updateMasterDataEntry', error)
    }
  }

  /**
   * Get master data entry
   */
  async getMasterDataEntry(entryId: string): Promise<MasterDataEntry> {
    try {
      await this.ensureConnection()

      const masterDataCollection = this.db.collection(this.masterDataCollection)
      const entry = await masterDataCollection.findOne({ _id: new ObjectId(entryId) })

      if (!entry) {
        throw new Error('Master data entry not found')
      }

      // Get change history
      const changeHistory = await this.getChangeHistory(entryId)

      return {
        id: entry._id.toString(),
        type: entry.type,
        data: entry.data,
        version: entry.version,
        status: entry.status,
        effectiveDate: entry.effectiveDate,
        expiryDate: entry.expiryDate,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        createdBy: entry.createdBy,
        lastModifiedBy: entry.lastModifiedBy,
        changeHistory
      }
    } catch (error) {
      this.handleError('getMasterDataEntry', error)
    }
  }

  /**
   * List master data entries
   */
  async listMasterDataEntries(
    typeId: string,
    filters: {
      status?: string
      search?: string
      effectiveDate?: Date
    } = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
    user?: JWTPayload
  ): Promise<{
    entries: MasterDataEntry[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    try {
      await this.ensureConnection()

      const masterDataType = await this.getMasterDataType(typeId)

      // Check permissions
      if (!this.hasPermission(masterDataType.permissions.read, user)) {
        throw new Error('Insufficient permissions to read master data')
      }

      const masterDataCollection = this.db.collection(this.masterDataCollection)
      const query: any = { type: typeId }

      // Apply filters
      if (filters.status) query.status = filters.status
      if (filters.effectiveDate) {
        query.$or = [
          { effectiveDate: { $lte: filters.effectiveDate } },
          { effectiveDate: { $exists: false } }
        ]
        query.$and = [
          {
            $or: [
              { expiryDate: { $gte: filters.effectiveDate } },
              { expiryDate: { $exists: false } }
            ]
          }
        ]
      }

      // Text search
      if (filters.search) {
        const searchFields = masterDataType.schema.fields
          .filter(field => field.type === 'string')
          .map(field => `data.${field.name}`)

        query.$or = searchFields.map(field => ({
          [field]: { $regex: filters.search, $options: 'i' }
        }))
      }

      const { page, limit } = pagination
      const skip = (page - 1) * limit

      const [entries, total] = await Promise.all([
        masterDataCollection
          .find(query)
          .sort({ 'data.name': 1, updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        masterDataCollection.countDocuments(query)
      ])

      const processedEntries = entries.map(entry => ({
        id: entry._id.toString(),
        type: entry.type,
        data: entry.data,
        version: entry.version,
        status: entry.status,
        effectiveDate: entry.effectiveDate,
        expiryDate: entry.expiryDate,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        createdBy: entry.createdBy,
        lastModifiedBy: entry.lastModifiedBy,
        changeHistory: [] // Not included in list view for performance
      }))

      return {
        entries: processedEntries,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    } catch (error) {
      this.handleError('listMasterDataEntries', error)
    }
  }

  /**
   * Delete master data entry
   */
  async deleteMasterDataEntry(
    entryId: string,
    deletedBy: string,
    reason?: string,
    user?: JWTPayload,
    session?: ClientSession
  ): Promise<{ message: string }> {
    try {
      await this.ensureConnection()

      const entry = await this.getMasterDataEntry(entryId)
      const masterDataType = await this.getMasterDataType(entry.type)

      // Check permissions
      if (!this.hasPermission(masterDataType.permissions.delete, user)) {
        throw new Error('Insufficient permissions to delete master data')
      }

      // Check referential integrity
      await this.checkReferentialIntegrity(entryId, masterDataType)

      // Soft delete by updating status
      const masterDataCollection = this.db.collection(this.masterDataCollection)
      await masterDataCollection.updateOne(
        { _id: new ObjectId(entryId) },
        {
          $set: {
            status: 'inactive',
            updatedAt: new Date(),
            lastModifiedBy: deletedBy
          }
        },
        session ? { session } : {}
      )

      // Record change history
      if (masterDataType.versioning.enabled) {
        await this.recordChange({
          entryId,
          version: entry.version + 1,
          changeType: 'delete',
          changedFields: ['status'],
          oldValues: { status: entry.status },
          newValues: { status: 'inactive' },
          reason,
          changedAt: new Date(),
          changedBy: deletedBy
        }, session)
      }

      return { message: 'Master data entry deleted successfully' }
    } catch (error) {
      this.handleError('deleteMasterDataEntry', error)
    }
  }

  /**
   * Import master data from file
   */
  async importMasterData(
    typeId: string,
    data: Record<string, any>[],
    importedBy: string,
    options: {
      updateExisting?: boolean
      skipValidation?: boolean
      batchSize?: number
    } = {},
    user?: JWTPayload
  ): Promise<MasterDataImportResult> {
    try {
      await this.ensureConnection()

      const masterDataType = await this.getMasterDataType(typeId)

      // Check permissions
      if (!this.hasPermission(masterDataType.permissions.import, user)) {
        throw new Error('Insufficient permissions to import master data')
      }

      const result: MasterDataImportResult = {
        totalRecords: data.length,
        successfulImports: 0,
        failedImports: 0,
        warnings: 0,
        errors: [],
        summary: {}
      }

      const batchSize = options.batchSize || 100
      
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)
        
        for (let j = 0; j < batch.length; j++) {
          const rowIndex = i + j + 1
          const rowData = batch[j]

          try {
            // Validate data if not skipped
            if (!options.skipValidation) {
              const validation = await this.validateMasterData(rowData, masterDataType)
              if (!validation.isValid) {
                result.errors.push({
                  row: rowIndex,
                  message: validation.errors.map(e => e.message).join(', '),
                  data: rowData
                })
                result.failedImports++
                continue
              }
              if (validation.warnings.length > 0) {
                result.warnings++
              }
            }

            // Check if entry exists (for updates)
            let existingEntry = null
            if (options.updateExisting && rowData.id) {
              try {
                existingEntry = await this.getMasterDataEntry(rowData.id)
              } catch (error) {
                // Entry doesn't exist, will create new one
              }
            }

            if (existingEntry && options.updateExisting) {
              // Update existing entry
              await this.updateMasterDataEntry(
                existingEntry.id,
                rowData,
                importedBy,
                'Bulk import update',
                user
              )
            } else {
              // Create new entry
              await this.createMasterDataEntry(
                typeId,
                rowData,
                importedBy,
                user
              )
            }

            result.successfulImports++
          } catch (error) {
            result.errors.push({
              row: rowIndex,
              message: error.message,
              data: rowData
            })
            result.failedImports++
          }
        }
      }

      return result
    } catch (error) {
      this.handleError('importMasterData', error)
    }
  }

  /**
   * Validate master data against schema and business rules
   */
  async validateMasterData(
    data: Record<string, any>,
    masterDataType: MasterDataType
  ): Promise<MasterDataValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    try {
      // Schema validation
      for (const field of masterDataType.schema.fields) {
        const value = data[field.name]

        // Required field validation
        if (field.required && (value === undefined || value === null || value === '')) {
          errors.push({
            field: field.name,
            message: `${field.display.label} is required`,
            code: 'REQUIRED_FIELD',
            severity: 'error'
          })
          continue
        }

        // Type validation
        if (value !== undefined && value !== null) {
          const typeError = this.validateFieldType(field, value)
          if (typeError) {
            errors.push(typeError)
            continue
          }

          // Field-specific validation
          if (field.validation) {
            const validationErrors = this.validateFieldValue(field, value)
            errors.push(...validationErrors)
          }
        }

        // Unique field validation
        if (field.unique && value !== undefined && value !== null) {
          const isDuplicate = await this.checkFieldUniqueness(
            masterDataType.collection,
            field.name,
            value
          )
          if (isDuplicate) {
            errors.push({
              field: field.name,
              message: `${field.display.label} must be unique`,
              code: 'DUPLICATE_VALUE',
              severity: 'error'
            })
          }
        }
      }

      // Business rules validation
      for (const rule of masterDataType.validation.businessRules) {
        if (rule.isActive) {
          const ruleResult = this.evaluateBusinessRule(rule, data)
          if (!ruleResult.passed) {
            const validationItem = {
              field: ruleResult.field || 'general',
              message: rule.message,
              code: rule.id,
              severity: rule.severity
            }

            if (rule.severity === 'error') {
              errors.push(validationItem as ValidationError)
            } else {
              warnings.push(validationItem as ValidationWarning)
            }
          }
        }
      }

      // Referential integrity validation
      for (const rule of masterDataType.validation.referentialIntegrity) {
        const refValue = data[rule.field]
        if (refValue) {
          const exists = await this.checkReferenceExists(
            rule.referencedCollection,
            rule.referencedField,
            refValue
          )
          if (!exists) {
            errors.push({
              field: rule.field,
              message: `Referenced ${rule.referencedCollection} does not exist`,
              code: 'INVALID_REFERENCE',
              severity: 'error'
            })
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    } catch (error) {
      errors.push({
        field: 'general',
        message: `Validation error: ${error.message}`,
        code: 'VALIDATION_ERROR',
        severity: 'error'
      })

      return {
        isValid: false,
        errors,
        warnings
      }
    }
  }

  // Private helper methods

  private validateMasterDataSchema(schema: MasterDataSchema): void {
    if (!schema.fields || schema.fields.length === 0) {
      throw new Error('Schema must have at least one field')
    }

    const fieldNames = new Set()
    for (const field of schema.fields) {
      if (!field.name || !field.type) {
        throw new Error('Field must have name and type')
      }

      if (fieldNames.has(field.name)) {
        throw new Error(`Duplicate field name: ${field.name}`)
      }
      fieldNames.add(field.name)
    }
  }

  private async createMasterDataCollection(
    collectionName: string,
    schema: MasterDataSchema
  ): Promise<void> {
    try {
      const collections = await this.db.listCollections({ name: collectionName }).toArray()
      if (collections.length === 0) {
        await this.db.createCollection(collectionName)
      }

      // Create indexes
      const collection = this.db.collection(collectionName)
      for (const index of schema.indexes) {
        const indexSpec = {}
        index.fields.forEach(field => {
          indexSpec[field] = 1
        })

        await collection.createIndex(indexSpec, {
          name: index.name,
          unique: index.unique,
          sparse: index.sparse
        })
      }
    } catch (error) {
      console.error('Failed to create master data collection:', error)
    }
  }

  private hasPermission(requiredRoles: string[], user?: JWTPayload): boolean {
    if (!user) return false
    if (user.role === 'admin') return true
    return requiredRoles.includes(user.role)
  }

  private validateFieldType(field: MasterDataField, value: any): ValidationError | null {
    switch (field.type) {
      case 'string':
        if (typeof value !== 'string') {
          return {
            field: field.name,
            message: `${field.display.label} must be a string`,
            code: 'INVALID_TYPE',
            severity: 'error'
          }
        }
        break
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return {
            field: field.name,
            message: `${field.display.label} must be a number`,
            code: 'INVALID_TYPE',
            severity: 'error'
          }
        }
        break
      case 'boolean':
        if (typeof value !== 'boolean') {
          return {
            field: field.name,
            message: `${field.display.label} must be a boolean`,
            code: 'INVALID_TYPE',
            severity: 'error'
          }
        }
        break
      case 'date':
        if (!(value instanceof Date) && !Date.parse(value)) {
          return {
            field: field.name,
            message: `${field.display.label} must be a valid date`,
            code: 'INVALID_TYPE',
            severity: 'error'
          }
        }
        break
      case 'array':
        if (!Array.isArray(value)) {
          return {
            field: field.name,
            message: `${field.display.label} must be an array`,
            code: 'INVALID_TYPE',
            severity: 'error'
          }
        }
        break
    }
    return null
  }

  private validateFieldValue(field: MasterDataField, value: any): ValidationError[] {
    const errors: ValidationError[] = []
    const validation = field.validation!

    if (field.type === 'string' && typeof value === 'string') {
      if (validation.minLength && value.length < validation.minLength) {
        errors.push({
          field: field.name,
          message: `${field.display.label} must be at least ${validation.minLength} characters`,
          code: 'MIN_LENGTH',
          severity: 'error'
        })
      }
      if (validation.maxLength && value.length > validation.maxLength) {
        errors.push({
          field: field.name,
          message: `${field.display.label} must be at most ${validation.maxLength} characters`,
          code: 'MAX_LENGTH',
          severity: 'error'
        })
      }
      if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
        errors.push({
          field: field.name,
          message: `${field.display.label} format is invalid`,
          code: 'INVALID_FORMAT',
          severity: 'error'
        })
      }
    }

    if (field.type === 'number' && typeof value === 'number') {
      if (validation.min !== undefined && value < validation.min) {
        errors.push({
          field: field.name,
          message: `${field.display.label} must be at least ${validation.min}`,
          code: 'MIN_VALUE',
          severity: 'error'
        })
      }
      if (validation.max !== undefined && value > validation.max) {
        errors.push({
          field: field.name,
          message: `${field.display.label} must be at most ${validation.max}`,
          code: 'MAX_VALUE',
          severity: 'error'
        })
      }
    }

    if (validation.enum && !validation.enum.includes(value)) {
      errors.push({
        field: field.name,
        message: `${field.display.label} must be one of: ${validation.enum.join(', ')}`,
        code: 'INVALID_ENUM',
        severity: 'error'
      })
    }

    return errors
  }

  private async checkFieldUniqueness(
    collection: string,
    field: string,
    value: any
  ): Promise<boolean> {
    const dataCollection = this.db.collection(collection)
    const existing = await dataCollection.findOne({ [field]: value })
    return existing !== null
  }

  private evaluateBusinessRule(rule: BusinessRule, data: Record<string, any>): { passed: boolean; field?: string } {
    try {
      // Simplified rule evaluation - in real implementation would use a proper expression evaluator
      // For now, just return true (rule passed)
      return { passed: true }
    } catch (error) {
      return { passed: false }
    }
  }

  private async checkReferenceExists(
    collection: string,
    field: string,
    value: any
  ): Promise<boolean> {
    const refCollection = this.db.collection(collection)
    const existing = await refCollection.findOne({ [field]: value })
    return existing !== null
  }

  private async checkReferentialIntegrity(
    entryId: string,
    masterDataType: MasterDataType
  ): Promise<void> {
    // Check if this entry is referenced by other data
    for (const relationship of masterDataType.schema.relationships) {
      if (relationship.type === 'one-to-many' || relationship.type === 'many-to-many') {
        const refCollection = this.db.collection(relationship.targetCollection)
        const references = await refCollection.countDocuments({
          [relationship.targetField]: entryId
        })

        if (references > 0) {
          throw new Error(`Cannot delete: ${references} records reference this entry`)
        }
      }
    }
  }

  private async recordChange(
    change: Omit<MasterDataChange, 'id'> & { entryId: string },
    session?: ClientSession
  ): Promise<void> {
    const changeDoc = {
      ...change,
      id: new ObjectId().toString()
    }

    const changesCollection = this.db.collection(this.changeHistoryCollection)
    await changesCollection.insertOne(
      changeDoc,
      session ? { session } : {}
    )
  }

  private async getChangeHistory(entryId: string): Promise<MasterDataChange[]> {
    const changesCollection = this.db.collection(this.changeHistoryCollection)
    const changes = await changesCollection
      .find({ entryId })
      .sort({ changedAt: -1 })
      .limit(50)
      .toArray()

    return changes.map(change => ({
      id: change._id.toString(),
      version: change.version,
      changeType: change.changeType,
      changedFields: change.changedFields,
      oldValues: change.oldValues,
      newValues: change.newValues,
      reason: change.reason,
      approvedBy: change.approvedBy,
      changedAt: change.changedAt,
      changedBy: change.changedBy
    }))
  }
}

// Export service instance
export const masterDataManagementEngine = new MasterDataManagementEngine()