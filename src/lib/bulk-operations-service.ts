import 'server-only'

import { MongoDBConnection, BaseMongoService } from './mongodb-service'
import { ObjectId, ClientSession } from '@/types/server-types'
import { AssetManagementFormData } from './schemas'

// Bulk operation interfaces
export interface BulkOperationResult {
  success: boolean
  totalProcessed: number
  successCount: number
  errorCount: number
  errors: Array<{
    index: number
    error: string
    data?: any
  }>
  duration: number
  operationId: string
}

export interface BulkImportOptions {
  batchSize?: number
  skipValidation?: boolean
  upsert?: boolean
  continueOnError?: boolean
  validateOnly?: boolean
}

export interface BulkExportOptions {
  format: 'json' | 'csv' | 'excel'
  includeHeaders?: boolean
  batchSize?: number
  compression?: boolean
}

// Progress tracking for long-running operations
export interface OperationProgress {
  operationId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  totalItems: number
  processedItems: number
  successCount: number
  errorCount: number
  startTime: Date
  endTime?: Date
  errors: Array<{
    index: number
    error: string
    data?: any
  }>
}

// Bulk operations service
export class BulkOperationsService extends BaseMongoService<any> {
  private operationProgress: Map<string, OperationProgress> = new Map()
  private readonly MAX_BATCH_SIZE = 1000
  private readonly DEFAULT_BATCH_SIZE = 100

  constructor() {
    super('bulk_operations')
  }

  /**
   * Bulk import assets with validation and error handling
   */
  async bulkImportAssets(
    assetsData: AssetManagementFormData[],
    userId: string,
    options: BulkImportOptions = {}
  ): Promise<BulkOperationResult> {
    const operationId = new ObjectId().toString()
    const startTime = Date.now()
    
    const {
      batchSize = this.DEFAULT_BATCH_SIZE,
      skipValidation = false,
      upsert = false,
      continueOnError = true,
      validateOnly = false
    } = options

    // Initialize progress tracking
    const progress: OperationProgress = {
      operationId,
      status: 'running',
      totalItems: assetsData.length,
      processedItems: 0,
      successCount: 0,
      errorCount: 0,
      startTime: new Date(),
      errors: []
    }
    this.operationProgress.set(operationId, progress)

    try {
      await this.ensureConnection()
      
      const assetsCollection = this.db.collection('assets')
      const results: BulkOperationResult = {
        success: true,
        totalProcessed: 0,
        successCount: 0,
        errorCount: 0,
        errors: [],
        duration: 0,
        operationId
      }

      // Validate batch size
      const effectiveBatchSize = Math.min(batchSize, this.MAX_BATCH_SIZE)
      
      // Process in batches
      for (let i = 0; i < assetsData.length; i += effectiveBatchSize) {
        const batch = assetsData.slice(i, i + effectiveBatchSize)
        
        try {
          const batchResult = await this.processBatch(
            batch,
            i,
            userId,
            assetsCollection,
            { skipValidation, upsert, validateOnly }
          )
          
          results.successCount += batchResult.successCount
          results.errorCount += batchResult.errorCount
          results.errors.push(...batchResult.errors)
          
          // Update progress
          progress.processedItems = Math.min(i + effectiveBatchSize, assetsData.length)
          progress.successCount = results.successCount
          progress.errorCount = results.errorCount
          progress.errors = results.errors
          
        } catch (error) {
          if (!continueOnError) {
            throw error
          }
          
          // Log batch error and continue
          console.error(`Batch ${i}-${i + effectiveBatchSize} failed:`, error)
          results.errorCount += batch.length
          results.errors.push({
            index: i,
            error: `Batch processing failed: ${error.message}`,
            data: batch
          })
        }
      }

      results.totalProcessed = assetsData.length
      results.duration = Date.now() - startTime
      results.success = results.errorCount === 0

      // Update final progress
      progress.status = results.success ? 'completed' : 'failed'
      progress.endTime = new Date()
      progress.processedItems = results.totalProcessed

      return results
    } catch (error) {
      progress.status = 'failed'
      progress.endTime = new Date()
      
      this.handleError('bulkImportAssets', error)
    }
  }

  /**
   * Process a batch of assets
   */
  private async processBatch(
    batch: AssetManagementFormData[],
    startIndex: number,
    userId: string,
    collection: any,
    options: { skipValidation: boolean; upsert: boolean; validateOnly: boolean }
  ): Promise<{ successCount: number; errorCount: number; errors: any[] }> {
    const result = {
      successCount: 0,
      errorCount: 0,
      errors: []
    }

    const operations = []
    
    for (let i = 0; i < batch.length; i++) {
      const assetData = batch[i]
      const globalIndex = startIndex + i
      
      try {
        // Validate asset data
        if (!options.skipValidation) {
          this.validateAssetData(assetData, globalIndex)
        }

        // Skip actual database operations if validation only
        if (options.validateOnly) {
          result.successCount++
          continue
        }

        // Prepare document
        const document = {
          ...assetData,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          lastModifiedBy: userId
        }

        // Generate asset number if not provided
        if (!document.assetNumber) {
          document.assetNumber = await this.generateAssetNumber()
        }

        // Prepare operation
        if (options.upsert) {
          operations.push({
            updateOne: {
              filter: { assetNumber: document.assetNumber },
              update: { $set: document },
              upsert: true
            }
          })
        } else {
          operations.push({
            insertOne: {
              document
            }
          })
        }
        
      } catch (error) {
        result.errorCount++
        result.errors.push({
          index: globalIndex,
          error: error.message,
          data: assetData
        })
      }
    }

    // Execute batch operations
    if (operations.length > 0 && !options.validateOnly) {
      try {
        const bulkResult = await collection.bulkWrite(operations, { ordered: false })
        result.successCount += (bulkResult.insertedCount || 0) + (bulkResult.upsertedCount || 0)
      } catch (error) {
        // Handle bulk write errors
        if (error.writeErrors) {
          error.writeErrors.forEach((writeError: any) => {
            result.errorCount++
            result.errors.push({
              index: startIndex + writeError.index,
              error: writeError.errmsg,
              data: batch[writeError.index]
            })
          })
        } else {
          throw error
        }
      }
    } else if (options.validateOnly) {
      // All validations passed
      result.successCount = batch.length - result.errorCount
    }

    return result
  }

  /**
   * Validate asset data
   */
  private validateAssetData(assetData: AssetManagementFormData, index: number): void {
    const requiredFields = ['assetDescription', 'department', 'location']
    
    for (const field of requiredFields) {
      if (!assetData[field] || assetData[field].toString().trim() === '') {
        throw new Error(`Missing required field: ${field}`)
      }
    }

    // Validate asset number format if provided
    if (assetData.assetNumber && !/^[A-Z0-9-]+$/.test(assetData.assetNumber)) {
      throw new Error('Invalid asset number format')
    }

    // Validate purchase value if provided
    if (assetData.purchaseValue && (isNaN(assetData.purchaseValue) || assetData.purchaseValue < 0)) {
      throw new Error('Invalid purchase value')
    }

    // Validate dates if provided
    if (assetData.capitalizationDate && isNaN(new Date(assetData.capitalizationDate).getTime())) {
      throw new Error('Invalid capitalization date')
    }
  }

  /**
   * Generate unique asset number
   */
  private async generateAssetNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `KTI-${year}-`
    
    const assetsCollection = this.db.collection('assets')
    
    // Find the highest existing number for this year
    const lastAsset = await assetsCollection
      .findOne(
        { assetNumber: { $regex: `^${prefix}` } },
        { sort: { assetNumber: -1 } }
      )

    let nextNumber = 1
    if (lastAsset?.assetNumber) {
      const lastNumber = parseInt(lastAsset.assetNumber.replace(prefix, ''))
      nextNumber = lastNumber + 1
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`
  }

  /**
   * Bulk export assets with filtering
   */
  async bulkExportAssets(
    filters: any = {},
    options: BulkExportOptions
  ): Promise<Buffer> {
    try {
      await this.ensureConnection()
      
      const assetsCollection = this.db.collection('assets')
      const { batchSize = 1000, format } = options

      // Get total count
      const totalCount = await assetsCollection.countDocuments(filters)
      
      if (totalCount === 0) {
        throw new Error('No assets found matching the criteria')
      }

      // Export based on format
      switch (format) {
        case 'json':
          return await this.exportToJSON(assetsCollection, filters, batchSize)
        case 'csv':
          return await this.exportToCSV(assetsCollection, filters, batchSize, options.includeHeaders)
        case 'excel':
          return await this.exportToExcel(assetsCollection, filters, batchSize)
        default:
          throw new Error('Unsupported export format')
      }
    } catch (error) {
      this.handleError('bulkExportAssets', error)
    }
  }

  /**
   * Export to JSON format
   */
  private async exportToJSON(
    collection: any,
    filters: any,
    batchSize: number
  ): Promise<Buffer> {
    const assets = []
    let skip = 0

    while (true) {
      const batch = await collection
        .find(filters)
        .skip(skip)
        .limit(batchSize)
        .toArray()

      if (batch.length === 0) break

      assets.push(...batch)
      skip += batchSize
    }

    return Buffer.from(JSON.stringify(assets, null, 2))
  }

  /**
   * Export to CSV format
   */
  private async exportToCSV(
    collection: any,
    filters: any,
    batchSize: number,
    includeHeaders: boolean = true
  ): Promise<Buffer> {
    const csvRows = []
    
    // Add headers
    if (includeHeaders) {
      const headers = [
        'Asset Number', 'Description', 'Department', 'Location', 'Status',
        'Classification', 'Purchase Value', 'Brand', 'Model', 'Serial Number',
        'Created Date', 'Created By'
      ]
      csvRows.push(headers.join(','))
    }

    let skip = 0
    while (true) {
      const batch = await collection
        .find(filters)
        .skip(skip)
        .limit(batchSize)
        .toArray()

      if (batch.length === 0) break

      for (const asset of batch) {
        const row = [
          this.escapeCsvValue(asset.assetNumber || ''),
          this.escapeCsvValue(asset.assetDescription || ''),
          this.escapeCsvValue(asset.department || ''),
          this.escapeCsvValue(asset.location || ''),
          this.escapeCsvValue(asset.currentStatus || ''),
          this.escapeCsvValue(asset.assetClassification || ''),
          asset.purchaseValue || '',
          this.escapeCsvValue(asset.brandName || ''),
          this.escapeCsvValue(asset.modelNo || ''),
          this.escapeCsvValue(asset.productSerialNo || ''),
          asset.createdAt ? asset.createdAt.toISOString() : '',
          this.escapeCsvValue(asset.createdBy || '')
        ]
        csvRows.push(row.join(','))
      }

      skip += batchSize
    }

    return Buffer.from(csvRows.join('\n'))
  }

  /**
   * Export to Excel format
   */
  private async exportToExcel(
    collection: any,
    filters: any,
    batchSize: number
  ): Promise<Buffer> {
    const ExcelJS = require('exceljs')
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Assets')

    // Add headers
    worksheet.columns = [
      { header: 'Asset Number', key: 'assetNumber', width: 15 },
      { header: 'Description', key: 'assetDescription', width: 30 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Location', key: 'location', width: 15 },
      { header: 'Status', key: 'currentStatus', width: 12 },
      { header: 'Classification', key: 'assetClassification', width: 15 },
      { header: 'Purchase Value', key: 'purchaseValue', width: 15 },
      { header: 'Brand', key: 'brandName', width: 15 },
      { header: 'Model', key: 'modelNo', width: 15 },
      { header: 'Serial Number', key: 'productSerialNo', width: 20 },
      { header: 'Created Date', key: 'createdAt', width: 15 },
      { header: 'Created By', key: 'createdBy', width: 15 }
    ]

    // Add data in batches
    let skip = 0
    while (true) {
      const batch = await collection
        .find(filters)
        .skip(skip)
        .limit(batchSize)
        .toArray()

      if (batch.length === 0) break

      batch.forEach(asset => {
        worksheet.addRow({
          assetNumber: asset.assetNumber,
          assetDescription: asset.assetDescription,
          department: asset.department,
          location: asset.location,
          currentStatus: asset.currentStatus,
          assetClassification: asset.assetClassification,
          purchaseValue: asset.purchaseValue,
          brandName: asset.brandName,
          modelNo: asset.modelNo,
          productSerialNo: asset.productSerialNo,
          createdAt: asset.createdAt,
          createdBy: asset.createdBy
        })
      })

      skip += batchSize
    }

    // Style the header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    return await workbook.xlsx.writeBuffer() as Buffer
  }

  /**
   * Escape CSV values
   */
  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  /**
   * Get operation progress
   */
  getOperationProgress(operationId: string): OperationProgress | null {
    return this.operationProgress.get(operationId) || null
  }

  /**
   * Cancel operation
   */
  cancelOperation(operationId: string): boolean {
    const progress = this.operationProgress.get(operationId)
    if (progress && progress.status === 'running') {
      progress.status = 'cancelled'
      progress.endTime = new Date()
      return true
    }
    return false
  }

  /**
   * Clean up old operation records
   */
  cleanupOperations(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
    
    for (const [operationId, progress] of this.operationProgress.entries()) {
      if (progress.startTime < cutoffTime && progress.status !== 'running') {
        this.operationProgress.delete(operationId)
      }
    }
  }
}

// Export service instance
export const bulkOperationsService = new BulkOperationsService()