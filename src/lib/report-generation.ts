import { MongoDBConnection, BaseMongoService } from './mongodb-service'
import { ObjectId, ClientSession } from '@/types/server-types'
import { JWTPayload } from '@/types/auth'
import { DepartmentFilterService } from './department-filter'

// Report types and interfaces
export interface ReportRequest {
  type: 'asset_register' | 'movement_report' | 'financial_report' | 'depreciation_report' | 'verification_report' | 'custom'
  name: string
  description?: string
  filters: ReportFilters
  format: 'pdf' | 'excel' | 'csv' | 'json'
  template?: string
  schedule?: ReportSchedule
  recipients?: string[]
}

export interface ReportFilters {
  dateRange?: {
    start: Date
    end: Date
    field?: 'createdAt' | 'updatedAt' | 'capitalizationDate' | 'verificationDate'
  }
  departments?: string[]
  locations?: string[]
  assetCategories?: string[]
  statuses?: string[]
  valueRange?: {
    min: number
    max: number
  }
  tags?: string[]
  customFilters?: Record<string, any>
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  dayOfWeek?: number // 0-6 for weekly
  dayOfMonth?: number // 1-31 for monthly
  time: string // HH:MM format
  timezone: string
  isActive: boolean
  nextRun?: Date
}

export interface GeneratedReport {
  id: string
  type: string
  name: string
  description?: string
  status: 'generating' | 'completed' | 'failed' | 'expired'
  format: string
  fileUrl?: string
  fileSize?: number
  filters: ReportFilters
  generatedBy: string
  generatedAt: Date
  expiresAt?: Date
  downloadCount: number
  error?: string
  metadata: {
    totalRecords: number
    processingTime: number
    columns: string[]
    summary?: Record<string, any>
  }
}

export interface AssetRegisterReport {
  assets: Array<{
    assetNumber: string
    description: string
    department: string
    location: string
    status: string
    classification: string
    brand?: string
    model?: string
    serialNumber?: string
    purchaseValue?: number
    currentValue?: number
    capitalizationDate?: Date
    lifecycleYears?: number
    warrantyExpiry?: Date
    lastVerificationDate?: Date
    verificationStatus: string
    createdAt: Date
  }>
  summary: {
    totalAssets: number
    totalValue: number
    totalCurrentValue: number
    byStatus: Record<string, number>
    byDepartment: Record<string, number>
    byCategory: Record<string, number>
  }
}

export interface MovementReport {
  movements: Array<{
    transferId: string
    assetNumber: string
    assetDescription: string
    fromDepartment: string
    toDepartment: string
    fromLocation: string
    toLocation: string
    transferDate: Date
    requestedBy: string
    approvedBy?: string
    status: string
    reason?: string
    dcNumber?: string
    completedAt?: Date
  }>
  summary: {
    totalMovements: number
    completedMovements: number
    pendingMovements: number
    averageProcessingTime: number
    byDepartment: Record<string, number>
    byStatus: Record<string, number>
  }
}

export interface FinancialReport {
  assets: Array<{
    assetNumber: string
    description: string
    department: string
    purchaseValue: number
    currentValue: number
    depreciationAmount: number
    depreciationRate: number
    capitalizationDate: Date
    lifecycleYears: number
    remainingLife: number
    monthlyDepreciation: number
  }>
  summary: {
    totalPurchaseValue: number
    totalCurrentValue: number
    totalDepreciation: number
    averageDepreciationRate: number
    byDepartment: Record<string, { purchaseValue: number; currentValue: number; depreciation: number }>
    byCategory: Record<string, { purchaseValue: number; currentValue: number; depreciation: number }>
  }
}

export interface VerificationReport {
  assets: Array<{
    assetNumber: string
    description: string
    department: string
    location: string
    verificationStatus: string
    lastVerificationDate?: Date
    verifiedBy?: string
    nextVerificationDue?: Date
    daysOverdue?: number
    verificationNotes?: string
  }>
  summary: {
    totalAssets: number
    verifiedAssets: number
    pendingVerification: number
    overdueVerification: number
    verificationRate: number
    averageDaysOverdue: number
    byDepartment: Record<string, { total: number; verified: number; pending: number; overdue: number }>
  }
}

/**
 * Report Generation Service
 * Handles creation and management of various asset reports
 */
export class ReportGenerationService extends BaseMongoService<any> {
  private reportsCollection = 'generatedReports'
  private scheduledReportsCollection = 'scheduledReports'

  constructor() {
    super('report_generation')
  }

  /**
   * Generate asset register report
   */
  async generateAssetRegisterReport(
    filters: ReportFilters,
    format: 'pdf' | 'excel' | 'csv' | 'json',
    generatedBy: string,
    user?: JWTPayload
  ): Promise<{
    report: GeneratedReport
    data: AssetRegisterReport
  }> {
    try {
      await this.ensureConnection()

      const startTime = Date.now()
      const reportId = new ObjectId().toString()

      // Build query
      let query = this.buildAssetQuery(filters, user)

      // Apply department filtering
      if (user) {
        query = DepartmentFilterService.filterAssetQuery(query, user)
      }

      // Get assets data
      const assetsCollection = this.db.collection('assets')
      const pipeline = [
        { $match: query },
        {
          $addFields: {
            currentValue: {
              $cond: [
                { $and: [
                  { $ne: ['$purchaseValue', null] },
                  { $ne: ['$capitalizationDate', null] },
                  { $ne: ['$lifecycleYears', null] }
                ]},
                {
                  $max: [
                    {
                      $subtract: [
                        '$purchaseValue',
                        {
                          $multiply: [
                            '$purchaseValue',
                            {
                              $divide: [
                                {
                                  $divide: [
                                    { $subtract: [new Date(), '$capitalizationDate'] },
                                    1000 * 60 * 60 * 24 * 365
                                  ]
                                },
                                '$lifecycleYears'
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    0
                  ]
                },
                '$purchaseValue'
              ]
            }
          }
        },
        {
          $project: {
            assetNumber: 1,
            assetDescription: 1,
            department: 1,
            location: 1,
            currentStatus: 1,
            assetClassification: 1,
            brandName: 1,
            modelNo: 1,
            productSerialNo: 1,
            purchaseValue: 1,
            currentValue: 1,
            capitalizationDate: 1,
            lifecycleYears: 1,
            warrantyExpiryDate: 1,
            lastVerificationDate: 1,
            verificationStatus: 1,
            createdAt: 1
          }
        },
        { $sort: { assetNumber: 1 } }
      ]

      const assets = await assetsCollection.aggregate(pipeline).toArray()

      // Calculate summary
      const summary = this.calculateAssetSummary(assets)

      const reportData: AssetRegisterReport = {
        assets: assets.map(asset => ({
          assetNumber: asset.assetNumber,
          description: asset.assetDescription,
          department: asset.department,
          location: asset.location,
          status: asset.currentStatus,
          classification: asset.assetClassification,
          brand: asset.brandName,
          model: asset.modelNo,
          serialNumber: asset.productSerialNo,
          purchaseValue: asset.purchaseValue,
          currentValue: asset.currentValue,
          capitalizationDate: asset.capitalizationDate,
          lifecycleYears: asset.lifecycleYears,
          warrantyExpiry: asset.warrantyExpiryDate,
          lastVerificationDate: asset.lastVerificationDate,
          verificationStatus: asset.verificationStatus || 'Pending',
          createdAt: asset.createdAt
        })),
        summary
      }

      // Generate file based on format
      const fileUrl = await this.generateReportFile(reportData, format, 'asset_register', reportId)

      // Create report record
      const report: GeneratedReport = {
        id: reportId,
        type: 'asset_register',
        name: 'Asset Register Report',
        status: 'completed',
        format,
        fileUrl,
        fileSize: await this.getFileSize(fileUrl),
        filters,
        generatedBy,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        downloadCount: 0,
        metadata: {
          totalRecords: assets.length,
          processingTime: Date.now() - startTime,
          columns: this.getAssetRegisterColumns(),
          summary
        }
      }

      // Save report record
      await this.saveReportRecord(report)

      return { report, data: reportData }
    } catch (error) {
      this.handleError('generateAssetRegisterReport', error)
    }
  }

  /**
   * Generate movement report
   */
  async generateMovementReport(
    filters: ReportFilters,
    format: 'pdf' | 'excel' | 'csv' | 'json',
    generatedBy: string,
    user?: JWTPayload
  ): Promise<{
    report: GeneratedReport
    data: MovementReport
  }> {
    try {
      await this.ensureConnection()

      const startTime = Date.now()
      const reportId = new ObjectId().toString()

      // Build query for transfers
      let query = this.buildTransferQuery(filters, user)

      // Get transfers data
      const transfersCollection = this.db.collection('assetTransfers')
      const pipeline = [
        { $match: query },
        {
          $lookup: {
            from: 'assets',
            localField: 'assetId',
            foreignField: '_id',
            as: 'asset'
          }
        },
        { $unwind: '$asset' },
        {
          $project: {
            transferId: { $toString: '$_id' },
            assetNumber: '$asset.assetNumber',
            assetDescription: '$asset.assetDescription',
            fromDepartment: '$fromDepartment',
            toDepartment: '$toDepartment',
            fromLocation: '$fromLocation',
            toLocation: '$toLocation',
            transferDate: '$requestedAt',
            requestedBy: '$requestedBy',
            approvedBy: '$approvedBy',
            status: '$status',
            reason: '$reason',
            dcNumber: '$dcNumber',
            completedAt: '$completedAt'
          }
        },
        { $sort: { transferDate: -1 } }
      ]

      const movements = await transfersCollection.aggregate(pipeline).toArray()

      // Calculate summary
      const summary = this.calculateMovementSummary(movements)

      const reportData: MovementReport = {
        movements,
        summary
      }

      // Generate file
      const fileUrl = await this.generateReportFile(reportData, format, 'movement_report', reportId)

      // Create report record
      const report: GeneratedReport = {
        id: reportId,
        type: 'movement_report',
        name: 'Asset Movement Report',
        status: 'completed',
        format,
        fileUrl,
        fileSize: await this.getFileSize(fileUrl),
        filters,
        generatedBy,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        downloadCount: 0,
        metadata: {
          totalRecords: movements.length,
          processingTime: Date.now() - startTime,
          columns: this.getMovementReportColumns(),
          summary
        }
      }

      await this.saveReportRecord(report)

      return { report, data: reportData }
    } catch (error) {
      this.handleError('generateMovementReport', error)
    }
  }

  /**
   * Generate financial report
   */
  async generateFinancialReport(
    filters: ReportFilters,
    format: 'pdf' | 'excel' | 'csv' | 'json',
    generatedBy: string,
    user?: JWTPayload
  ): Promise<{
    report: GeneratedReport
    data: FinancialReport
  }> {
    try {
      await this.ensureConnection()

      const startTime = Date.now()
      const reportId = new ObjectId().toString()

      // Build query for assets with financial data
      let query = this.buildAssetQuery(filters, user)
      query.purchaseValue = { $exists: true, $ne: null }

      if (user) {
        query = DepartmentFilterService.filterAssetQuery(query, user)
      }

      const assetsCollection = this.db.collection('assets')
      const pipeline = [
        { $match: query },
        {
          $addFields: {
            currentValue: {
              $cond: [
                { $and: [
                  { $ne: ['$capitalizationDate', null] },
                  { $ne: ['$lifecycleYears', null] }
                ]},
                {
                  $max: [
                    {
                      $subtract: [
                        '$purchaseValue',
                        {
                          $multiply: [
                            '$purchaseValue',
                            {
                              $divide: [
                                {
                                  $divide: [
                                    { $subtract: [new Date(), '$capitalizationDate'] },
                                    1000 * 60 * 60 * 24 * 365
                                  ]
                                },
                                '$lifecycleYears'
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    0
                  ]
                },
                '$purchaseValue'
              ]
            },
            depreciationAmount: {
              $cond: [
                { $and: [
                  { $ne: ['$capitalizationDate', null] },
                  { $ne: ['$lifecycleYears', null] }
                ]},
                {
                  $subtract: [
                    '$purchaseValue',
                    {
                      $max: [
                        {
                          $subtract: [
                            '$purchaseValue',
                            {
                              $multiply: [
                                '$purchaseValue',
                                {
                                  $divide: [
                                    {
                                      $divide: [
                                        { $subtract: [new Date(), '$capitalizationDate'] },
                                        1000 * 60 * 60 * 24 * 365
                                      ]
                                    },
                                    '$lifecycleYears'
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        0
                      ]
                    }
                  ]
                },
                0
              ]
            },
            depreciationRate: {
              $cond: [
                { $gt: ['$purchaseValue', 0] },
                {
                  $multiply: [
                    {
                      $divide: [
                        {
                          $subtract: [
                            '$purchaseValue',
                            {
                              $max: [
                                {
                                  $subtract: [
                                    '$purchaseValue',
                                    {
                                      $multiply: [
                                        '$purchaseValue',
                                        {
                                          $divide: [
                                            {
                                              $divide: [
                                                { $subtract: [new Date(), '$capitalizationDate'] },
                                                1000 * 60 * 60 * 24 * 365
                                              ]
                                            },
                                            '$lifecycleYears'
                                          ]
                                        }
                                      ]
                                    }
                                  ]
                                },
                                0
                              ]
                            }
                          ]
                        },
                        '$purchaseValue'
                      ]
                    },
                    100
                  ]
                },
                0
              ]
            },
            remainingLife: {
              $cond: [
                { $and: [
                  { $ne: ['$capitalizationDate', null] },
                  { $ne: ['$lifecycleYears', null] }
                ]},
                {
                  $max: [
                    {
                      $subtract: [
                        '$lifecycleYears',
                        {
                          $divide: [
                            { $subtract: [new Date(), '$capitalizationDate'] },
                            1000 * 60 * 60 * 24 * 365
                          ]
                        }
                      ]
                    },
                    0
                  ]
                },
                '$lifecycleYears'
              ]
            },
            monthlyDepreciation: {
              $cond: [
                { $and: [
                  { $ne: ['$purchaseValue', null] },
                  { $ne: ['$lifecycleYears', null] },
                  { $gt: ['$lifecycleYears', 0] }
                ]},
                {
                  $divide: [
                    '$purchaseValue',
                    { $multiply: ['$lifecycleYears', 12] }
                  ]
                },
                0
              ]
            }
          }
        },
        {
          $project: {
            assetNumber: 1,
            assetDescription: 1,
            department: 1,
            assetClassification: 1,
            purchaseValue: 1,
            currentValue: 1,
            depreciationAmount: 1,
            depreciationRate: 1,
            capitalizationDate: 1,
            lifecycleYears: 1,
            remainingLife: 1,
            monthlyDepreciation: 1
          }
        },
        { $sort: { assetNumber: 1 } }
      ]

      const assets = await assetsCollection.aggregate(pipeline).toArray()

      // Calculate summary
      const summary = this.calculateFinancialSummary(assets)

      const reportData: FinancialReport = {
        assets: assets.map(asset => ({
          assetNumber: asset.assetNumber,
          description: asset.assetDescription,
          department: asset.department,
          purchaseValue: asset.purchaseValue,
          currentValue: asset.currentValue,
          depreciationAmount: asset.depreciationAmount,
          depreciationRate: asset.depreciationRate,
          capitalizationDate: asset.capitalizationDate,
          lifecycleYears: asset.lifecycleYears,
          remainingLife: asset.remainingLife,
          monthlyDepreciation: asset.monthlyDepreciation
        })),
        summary
      }

      // Generate file
      const fileUrl = await this.generateReportFile(reportData, format, 'financial_report', reportId)

      // Create report record
      const report: GeneratedReport = {
        id: reportId,
        type: 'financial_report',
        name: 'Financial Report',
        status: 'completed',
        format,
        fileUrl,
        fileSize: await this.getFileSize(fileUrl),
        filters,
        generatedBy,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        downloadCount: 0,
        metadata: {
          totalRecords: assets.length,
          processingTime: Date.now() - startTime,
          columns: this.getFinancialReportColumns(),
          summary
        }
      }

      await this.saveReportRecord(report)

      return { report, data: reportData }
    } catch (error) {
      this.handleError('generateFinancialReport', error)
    }
  }

  /**
   * Generate verification report
   */
  async generateVerificationReport(
    filters: ReportFilters,
    format: 'pdf' | 'excel' | 'csv' | 'json',
    generatedBy: string,
    user?: JWTPayload
  ): Promise<{
    report: GeneratedReport
    data: VerificationReport
  }> {
    try {
      await this.ensureConnection()

      const startTime = Date.now()
      const reportId = new ObjectId().toString()

      let query = this.buildAssetQuery(filters, user)

      if (user) {
        query = DepartmentFilterService.filterAssetQuery(query, user)
      }

      const assetsCollection = this.db.collection('assets')
      const pipeline = [
        { $match: query },
        {
          $addFields: {
            nextVerificationDue: {
              $cond: [
                { $ne: ['$lastVerificationDate', null] },
                {
                  $add: [
                    '$lastVerificationDate',
                    365 * 24 * 60 * 60 * 1000 // 1 year in milliseconds
                  ]
                },
                null
              ]
            },
            daysOverdue: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$lastVerificationDate', null] },
                    { $lt: [
                      {
                        $add: [
                          '$lastVerificationDate',
                          365 * 24 * 60 * 60 * 1000
                        ]
                      },
                      new Date()
                    ]}
                  ]
                },
                {
                  $divide: [
                    {
                      $subtract: [
                        new Date(),
                        {
                          $add: [
                            '$lastVerificationDate',
                            365 * 24 * 60 * 60 * 1000
                          ]
                        }
                      ]
                    },
                    24 * 60 * 60 * 1000
                  ]
                },
                0
              ]
            }
          }
        },
        {
          $project: {
            assetNumber: 1,
            assetDescription: 1,
            department: 1,
            location: 1,
            verificationStatus: { $ifNull: ['$verificationStatus', 'Pending'] },
            lastVerificationDate: 1,
            verifiedBy: 1,
            nextVerificationDue: 1,
            daysOverdue: 1,
            verificationNotes: 1
          }
        },
        { $sort: { assetNumber: 1 } }
      ]

      const assets = await assetsCollection.aggregate(pipeline).toArray()

      // Calculate summary
      const summary = this.calculateVerificationSummary(assets)

      const reportData: VerificationReport = {
        assets: assets.map(asset => ({
          assetNumber: asset.assetNumber,
          description: asset.assetDescription,
          department: asset.department,
          location: asset.location,
          verificationStatus: asset.verificationStatus,
          lastVerificationDate: asset.lastVerificationDate,
          verifiedBy: asset.verifiedBy,
          nextVerificationDue: asset.nextVerificationDue,
          daysOverdue: asset.daysOverdue > 0 ? Math.round(asset.daysOverdue) : undefined,
          verificationNotes: asset.verificationNotes
        })),
        summary
      }

      // Generate file
      const fileUrl = await this.generateReportFile(reportData, format, 'verification_report', reportId)

      // Create report record
      const report: GeneratedReport = {
        id: reportId,
        type: 'verification_report',
        name: 'Verification Report',
        status: 'completed',
        format,
        fileUrl,
        fileSize: await this.getFileSize(fileUrl),
        filters,
        generatedBy,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        downloadCount: 0,
        metadata: {
          totalRecords: assets.length,
          processingTime: Date.now() - startTime,
          columns: this.getVerificationReportColumns(),
          summary
        }
      }

      await this.saveReportRecord(report)

      return { report, data: reportData }
    } catch (error) {
      this.handleError('generateVerificationReport', error)
    }
  }

  /**
   * Get generated reports list
   */
  async getGeneratedReports(
    filters: {
      type?: string
      generatedBy?: string
      status?: string
      dateRange?: { start: Date; end: Date }
    } = {},
    user?: JWTPayload,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{
    reports: GeneratedReport[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    try {
      await this.ensureConnection()

      const reportsCollection = this.db.collection(this.reportsCollection)
      let query: any = {}

      // Apply filters
      if (filters.type) query.type = filters.type
      if (filters.status) query.status = filters.status
      if (filters.dateRange) {
        query.generatedAt = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end
        }
      }

      // User-based filtering
      if (user?.role !== 'admin') {
        query.generatedBy = user?.id
      } else if (filters.generatedBy) {
        query.generatedBy = filters.generatedBy
      }

      const { page, limit } = pagination
      const skip = (page - 1) * limit

      const [reports, total] = await Promise.all([
        reportsCollection
          .find(query)
          .sort({ generatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        reportsCollection.countDocuments(query)
      ])

      const processedReports = reports.map(report => ({
        id: report._id.toString(),
        type: report.type,
        name: report.name,
        description: report.description,
        status: report.status,
        format: report.format,
        fileUrl: report.fileUrl,
        fileSize: report.fileSize,
        filters: report.filters,
        generatedBy: report.generatedBy,
        generatedAt: report.generatedAt,
        expiresAt: report.expiresAt,
        downloadCount: report.downloadCount,
        error: report.error,
        metadata: report.metadata
      }))

      return {
        reports: processedReports,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    } catch (error) {
      this.handleError('getGeneratedReports', error)
    }
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId: string, user?: JWTPayload): Promise<GeneratedReport> {
    try {
      await this.ensureConnection()

      const reportsCollection = this.db.collection(this.reportsCollection)
      const report = await reportsCollection.findOne({ _id: new ObjectId(reportId) })

      if (!report) {
        throw new Error('Report not found')
      }

      // Check access permissions
      if (user?.role !== 'admin' && report.generatedBy !== user?.id) {
        throw new Error('Access denied to this report')
      }

      return {
        id: report._id.toString(),
        type: report.type,
        name: report.name,
        description: report.description,
        status: report.status,
        format: report.format,
        fileUrl: report.fileUrl,
        fileSize: report.fileSize,
        filters: report.filters,
        generatedBy: report.generatedBy,
        generatedAt: report.generatedAt,
        expiresAt: report.expiresAt,
        downloadCount: report.downloadCount,
        error: report.error,
        metadata: report.metadata
      }
    } catch (error) {
      this.handleError('getReportById', error)
    }
  }

  /**
   * Delete report
   */
  async deleteReport(reportId: string, user?: JWTPayload): Promise<{ message: string }> {
    try {
      await this.ensureConnection()

      const report = await this.getReportById(reportId, user)

      // Delete file if exists
      if (report.fileUrl) {
        await this.deleteReportFile(report.fileUrl)
      }

      // Delete report record
      const reportsCollection = this.db.collection(this.reportsCollection)
      await reportsCollection.deleteOne({ _id: new ObjectId(reportId) })

      return { message: 'Report deleted successfully' }
    } catch (error) {
      this.handleError('deleteReport', error)
    }
  }

  // Private helper methods

  private buildAssetQuery(filters: ReportFilters, user?: JWTPayload): any {
    const query: any = {}

    // Date range filter
    if (filters.dateRange) {
      const field = filters.dateRange.field || 'createdAt'
      query[field] = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end
      }
    }

    // Other filters
    if (filters.departments && filters.departments.length > 0) {
      query.department = { $in: filters.departments }
    }
    if (filters.locations && filters.locations.length > 0) {
      query.location = { $in: filters.locations }
    }
    if (filters.assetCategories && filters.assetCategories.length > 0) {
      query.assetClassification = { $in: filters.assetCategories }
    }
    if (filters.statuses && filters.statuses.length > 0) {
      query.currentStatus = { $in: filters.statuses }
    }
    if (filters.valueRange) {
      query.purchaseValue = {
        $gte: filters.valueRange.min,
        $lte: filters.valueRange.max
      }
    }
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags }
    }

    // Custom filters
    if (filters.customFilters) {
      Object.assign(query, filters.customFilters)
    }

    return query
  }

  private buildTransferQuery(filters: ReportFilters, user?: JWTPayload): any {
    const query: any = {}

    if (filters.dateRange) {
      const field = filters.dateRange.field === 'createdAt' ? 'requestedAt' : 'completedAt'
      query[field] = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end
      }
    }

    if (filters.departments && filters.departments.length > 0) {
      query.$or = [
        { fromDepartment: { $in: filters.departments } },
        { toDepartment: { $in: filters.departments } }
      ]
    }

    if (filters.statuses && filters.statuses.length > 0) {
      query.status = { $in: filters.statuses }
    }

    return query
  }

  private calculateAssetSummary(assets: any[]): any {
    const summary = {
      totalAssets: assets.length,
      totalValue: 0,
      totalCurrentValue: 0,
      byStatus: {},
      byDepartment: {},
      byCategory: {}
    }

    assets.forEach(asset => {
      summary.totalValue += asset.purchaseValue || 0
      summary.totalCurrentValue += asset.currentValue || 0

      // Count by status
      const status = asset.currentStatus || 'Unknown'
      summary.byStatus[status] = (summary.byStatus[status] || 0) + 1

      // Count by department
      const dept = asset.department || 'Unknown'
      summary.byDepartment[dept] = (summary.byDepartment[dept] || 0) + 1

      // Count by category
      const category = asset.assetClassification || 'Unknown'
      summary.byCategory[category] = (summary.byCategory[category] || 0) + 1
    })

    return summary
  }

  private calculateMovementSummary(movements: any[]): any {
    const summary = {
      totalMovements: movements.length,
      completedMovements: 0,
      pendingMovements: 0,
      averageProcessingTime: 0,
      byDepartment: {},
      byStatus: {}
    }

    let totalProcessingTime = 0
    let completedCount = 0

    movements.forEach(movement => {
      // Count by status
      const status = movement.status || 'Unknown'
      summary.byStatus[status] = (summary.byStatus[status] || 0) + 1

      if (status === 'Completed') {
        summary.completedMovements++
        if (movement.completedAt && movement.transferDate) {
          totalProcessingTime += new Date(movement.completedAt).getTime() - new Date(movement.transferDate).getTime()
          completedCount++
        }
      } else {
        summary.pendingMovements++
      }

      // Count by department
      const fromDept = movement.fromDepartment || 'Unknown'
      const toDept = movement.toDepartment || 'Unknown'
      summary.byDepartment[fromDept] = (summary.byDepartment[fromDept] || 0) + 1
      summary.byDepartment[toDept] = (summary.byDepartment[toDept] || 0) + 1
    })

    if (completedCount > 0) {
      summary.averageProcessingTime = totalProcessingTime / completedCount / (24 * 60 * 60 * 1000) // Convert to days
    }

    return summary
  }

  private calculateFinancialSummary(assets: any[]): any {
    const summary = {
      totalPurchaseValue: 0,
      totalCurrentValue: 0,
      totalDepreciation: 0,
      averageDepreciationRate: 0,
      byDepartment: {},
      byCategory: {}
    }

    let totalDepreciationRate = 0
    let assetsWithDepreciation = 0

    assets.forEach(asset => {
      const purchaseValue = asset.purchaseValue || 0
      const currentValue = asset.currentValue || 0
      const depreciation = asset.depreciationAmount || 0

      summary.totalPurchaseValue += purchaseValue
      summary.totalCurrentValue += currentValue
      summary.totalDepreciation += depreciation

      if (asset.depreciationRate > 0) {
        totalDepreciationRate += asset.depreciationRate
        assetsWithDepreciation++
      }

      // By department
      const dept = asset.department || 'Unknown'
      if (!summary.byDepartment[dept]) {
        summary.byDepartment[dept] = { purchaseValue: 0, currentValue: 0, depreciation: 0 }
      }
      summary.byDepartment[dept].purchaseValue += purchaseValue
      summary.byDepartment[dept].currentValue += currentValue
      summary.byDepartment[dept].depreciation += depreciation

      // By category
      const category = asset.assetClassification || 'Unknown'
      if (!summary.byCategory[category]) {
        summary.byCategory[category] = { purchaseValue: 0, currentValue: 0, depreciation: 0 }
      }
      summary.byCategory[category].purchaseValue += purchaseValue
      summary.byCategory[category].currentValue += currentValue
      summary.byCategory[category].depreciation += depreciation
    })

    if (assetsWithDepreciation > 0) {
      summary.averageDepreciationRate = totalDepreciationRate / assetsWithDepreciation
    }

    return summary
  }

  private calculateVerificationSummary(assets: any[]): any {
    const summary = {
      totalAssets: assets.length,
      verifiedAssets: 0,
      pendingVerification: 0,
      overdueVerification: 0,
      verificationRate: 0,
      averageDaysOverdue: 0,
      byDepartment: {}
    }

    let totalOverdueDays = 0
    let overdueCount = 0

    assets.forEach(asset => {
      const status = asset.verificationStatus || 'Pending'
      const dept = asset.department || 'Unknown'

      // Initialize department stats
      if (!summary.byDepartment[dept]) {
        summary.byDepartment[dept] = { total: 0, verified: 0, pending: 0, overdue: 0 }
      }
      summary.byDepartment[dept].total++

      if (status === 'Verified') {
        summary.verifiedAssets++
        summary.byDepartment[dept].verified++
      } else if (asset.daysOverdue > 0) {
        summary.overdueVerification++
        summary.byDepartment[dept].overdue++
        totalOverdueDays += asset.daysOverdue
        overdueCount++
      } else {
        summary.pendingVerification++
        summary.byDepartment[dept].pending++
      }
    })

    summary.verificationRate = summary.totalAssets > 0 
      ? (summary.verifiedAssets / summary.totalAssets) * 100 
      : 0

    summary.averageDaysOverdue = overdueCount > 0 
      ? totalOverdueDays / overdueCount 
      : 0

    return summary
  }

  private async generateReportFile(
    data: any,
    format: string,
    reportType: string,
    reportId: string
  ): Promise<string> {
    // Simplified implementation - would integrate with actual file generation
    const filename = `${reportType}_${reportId}.${format}`
    const fileUrl = `/reports/${filename}`
    
    // In a real implementation, this would:
    // 1. Generate Excel/PDF files using libraries like ExcelJS, PDFKit
    // 2. Save to cloud storage (AWS S3, etc.)
    // 3. Return the actual file URL
    
    console.log(`Generated ${format} report: ${filename}`)
    return fileUrl
  }

  private async getFileSize(fileUrl: string): Promise<number> {
    // Simplified implementation - would get actual file size
    return Math.floor(Math.random() * 1000000) + 100000 // Random size between 100KB-1MB
  }

  private async saveReportRecord(report: GeneratedReport): Promise<void> {
    const reportsCollection = this.db.collection(this.reportsCollection)
    await reportsCollection.insertOne({
      _id: new ObjectId(report.id),
      ...report
    })
  }

  private async deleteReportFile(fileUrl: string): Promise<void> {
    // Simplified implementation - would delete actual file
    console.log(`Deleted report file: ${fileUrl}`)
  }

  private getAssetRegisterColumns(): string[] {
    return [
      'Asset Number', 'Description', 'Department', 'Location', 'Status',
      'Classification', 'Brand', 'Model', 'Serial Number', 'Purchase Value',
      'Current Value', 'Capitalization Date', 'Lifecycle Years', 'Warranty Expiry',
      'Last Verification', 'Verification Status', 'Created Date'
    ]
  }

  private getMovementReportColumns(): string[] {
    return [
      'Transfer ID', 'Asset Number', 'Asset Description', 'From Department',
      'To Department', 'From Location', 'To Location', 'Transfer Date',
      'Requested By', 'Approved By', 'Status', 'Reason', 'DC Number', 'Completed Date'
    ]
  }

  private getFinancialReportColumns(): string[] {
    return [
      'Asset Number', 'Description', 'Department', 'Purchase Value',
      'Current Value', 'Depreciation Amount', 'Depreciation Rate',
      'Capitalization Date', 'Lifecycle Years', 'Remaining Life',
      'Monthly Depreciation'
    ]
  }

  private getVerificationReportColumns(): string[] {
    return [
      'Asset Number', 'Description', 'Department', 'Location',
      'Verification Status', 'Last Verification Date', 'Verified By',
      'Next Verification Due', 'Days Overdue', 'Verification Notes'
    ]
  }
}

// Export service instance
export const reportGenerationService = new ReportGenerationService()