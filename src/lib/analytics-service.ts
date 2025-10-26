import 'server-only'

import { MongoDBConnection, BaseMongoService } from './mongodb-service'
import { ObjectId } from '@/types/server-types'
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'

// Analytics interfaces
export interface AssetAnalytics {
  totalAssets: number
  assetsByStatus: Record<string, number>
  assetsByDepartment: Record<string, number>
  assetsByClassification: Record<string, number>
  assetsByLocation: Record<string, number>
  totalValue: number
  averageAge: number
  utilizationRate: number
  maintenanceRate: number
}

export interface MovementAnalytics {
  totalMovements: number
  movementsByType: Record<string, number>
  movementsByDepartment: Record<string, number>
  movementTrends: Array<{
    date: string
    count: number
    type: string
  }>
  topMovedAssets: Array<{
    assetId: string
    assetNumber: string
    movementCount: number
  }>
}

export interface FinancialAnalytics {
  totalAssetValue: number
  valueByDepartment: Record<string, number>
  valueByClassification: Record<string, number>
  depreciationSummary: {
    totalDepreciation: number
    currentBookValue: number
    depreciationByYear: Record<string, number>
  }
  purchaseTrends: Array<{
    month: string
    value: number
    count: number
  }>
}

export interface UtilizationAnalytics {
  overallUtilization: number
  utilizationByDepartment: Record<string, number>
  utilizationByClassification: Record<string, number>
  underutilizedAssets: Array<{
    assetId: string
    assetNumber: string
    utilizationRate: number
    lastUsed: Date
  }>
  idleAssets: Array<{
    assetId: string
    assetNumber: string
    idleDays: number
  }>
}

export interface ExceptionReport {
  incompleteRecords: Array<{
    assetId: string
    assetNumber: string
    missingFields: string[]
    severity: 'low' | 'medium' | 'high'
  }>
  duplicateAssets: Array<{
    assetNumber: string
    duplicateIds: string[]
  }>
  orphanedRecords: Array<{
    recordId: string
    type: string
    reason: string
  }>
  dataQualityScore: number
}

// Analytics service class
export class AnalyticsService extends BaseMongoService<any> {
  constructor() {
    super('analytics_cache') // Cache collection for performance
  }

  /**
   * Get comprehensive asset analytics
   */
  async getAssetAnalytics(filters: {
    department?: string
    dateRange?: { start: Date; end: Date }
    classification?: string
  } = {}): Promise<AssetAnalytics> {
    try {
      await this.ensureConnection()
      
      const assetsCollection = this.db.collection('assets')
      const matchStage: any = {}
      
      // Apply filters
      if (filters.department) {
        matchStage.department = filters.department
      }
      if (filters.classification) {
        matchStage.assetClassification = filters.classification
      }
      if (filters.dateRange) {
        matchStage.createdAt = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end
        }
      }

      // Main analytics aggregation pipeline
      const pipeline = [
        { $match: matchStage },
        {
          $facet: {
            // Total count
            totalCount: [{ $count: 'total' }],
            
            // Group by status
            statusGroups: [
              {
                $group: {
                  _id: '$currentStatus',
                  count: { $sum: 1 }
                }
              }
            ],
            
            // Group by department
            departmentGroups: [
              {
                $group: {
                  _id: '$department',
                  count: { $sum: 1 }
                }
              }
            ],
            
            // Group by classification
            classificationGroups: [
              {
                $group: {
                  _id: '$assetClassification',
                  count: { $sum: 1 }
                }
              }
            ],
            
            // Group by location
            locationGroups: [
              {
                $group: {
                  _id: '$location',
                  count: { $sum: 1 }
                }
              }
            ],
            
            // Financial calculations
            financialStats: [
              {
                $group: {
                  _id: null,
                  totalValue: { $sum: { $ifNull: ['$purchaseValue', 0] } },
                  avgValue: { $avg: { $ifNull: ['$purchaseValue', 0] } },
                  count: { $sum: 1 }
                }
              }
            ],
            
            // Age calculations
            ageStats: [
              {
                $addFields: {
                  ageInDays: {
                    $divide: [
                      { $subtract: [new Date(), '$createdAt'] },
                      1000 * 60 * 60 * 24
                    ]
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  avgAge: { $avg: '$ageInDays' }
                }
              }
            ],
            
            // Utilization stats
            utilizationStats: [
              {
                $group: {
                  _id: null,
                  activeAssets: {
                    $sum: {
                      $cond: [{ $eq: ['$currentStatus', 'Active'] }, 1, 0]
                    }
                  },
                  totalAssets: { $sum: 1 },
                  maintenanceAssets: {
                    $sum: {
                      $cond: [{ $eq: ['$currentStatus', 'Maintenance'] }, 1, 0]
                    }
                  }
                }
              }
            ]
          }
        }
      ]

      const [result] = await assetsCollection.aggregate(pipeline).toArray()
      
      // Process results
      const totalAssets = result.totalCount[0]?.total || 0
      
      const assetsByStatus = {}
      result.statusGroups.forEach(group => {
        assetsByStatus[group._id || 'Unknown'] = group.count
      })
      
      const assetsByDepartment = {}
      result.departmentGroups.forEach(group => {
        assetsByDepartment[group._id || 'Unknown'] = group.count
      })
      
      const assetsByClassification = {}
      result.classificationGroups.forEach(group => {
        assetsByClassification[group._id || 'Unknown'] = group.count
      })
      
      const assetsByLocation = {}
      result.locationGroups.forEach(group => {
        assetsByLocation[group._id || 'Unknown'] = group.count
      })
      
      const financialStats = result.financialStats[0] || {}
      const ageStats = result.ageStats[0] || {}
      const utilizationStats = result.utilizationStats[0] || {}
      
      const utilizationRate = utilizationStats.totalAssets > 0 
        ? (utilizationStats.activeAssets / utilizationStats.totalAssets) * 100 
        : 0
        
      const maintenanceRate = utilizationStats.totalAssets > 0 
        ? (utilizationStats.maintenanceAssets / utilizationStats.totalAssets) * 100 
        : 0

      return {
        totalAssets,
        assetsByStatus,
        assetsByDepartment,
        assetsByClassification,
        assetsByLocation,
        totalValue: financialStats.totalValue || 0,
        averageAge: Math.round(ageStats.avgAge || 0),
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        maintenanceRate: Math.round(maintenanceRate * 100) / 100
      }
    } catch (error) {
      this.handleError('getAssetAnalytics', error)
    }
  }

  /**
   * Get movement analytics
   */
  async getMovementAnalytics(filters: {
    department?: string
    dateRange?: { start: Date; end: Date }
  } = {}): Promise<MovementAnalytics> {
    try {
      await this.ensureConnection()
      
      const movementsCollection = this.db.collection('assetMovements')
      const matchStage: any = {}
      
      if (filters.department) {
        matchStage.department = filters.department
      }
      if (filters.dateRange) {
        matchStage.createdAt = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end
        }
      }

      const pipeline = [
        { $match: matchStage },
        {
          $facet: {
            totalCount: [{ $count: 'total' }],
            
            typeGroups: [
              {
                $group: {
                  _id: '$movementType',
                  count: { $sum: 1 }
                }
              }
            ],
            
            departmentGroups: [
              {
                $group: {
                  _id: '$department',
                  count: { $sum: 1 }
                }
              }
            ],
            
            trends: [
              {
                $group: {
                  _id: {
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    type: '$movementType'
                  },
                  count: { $sum: 1 }
                }
              },
              { $sort: { '_id.date': 1 } }
            ],
            
            topAssets: [
              {
                $group: {
                  _id: '$assetId',
                  count: { $sum: 1 },
                  assetNumber: { $first: '$assetNumber' }
                }
              },
              { $sort: { count: -1 } },
              { $limit: 10 }
            ]
          }
        }
      ]

      const [result] = await movementsCollection.aggregate(pipeline).toArray()
      
      const totalMovements = result.totalCount[0]?.total || 0
      
      const movementsByType = {}
      result.typeGroups.forEach(group => {
        movementsByType[group._id || 'Unknown'] = group.count
      })
      
      const movementsByDepartment = {}
      result.departmentGroups.forEach(group => {
        movementsByDepartment[group._id || 'Unknown'] = group.count
      })
      
      const movementTrends = result.trends.map(trend => ({
        date: trend._id.date,
        count: trend.count,
        type: trend._id.type
      }))
      
      const topMovedAssets = result.topAssets.map(asset => ({
        assetId: asset._id,
        assetNumber: asset.assetNumber,
        movementCount: asset.count
      }))

      return {
        totalMovements,
        movementsByType,
        movementsByDepartment,
        movementTrends,
        topMovedAssets
      }
    } catch (error) {
      this.handleError('getMovementAnalytics', error)
    }
  }

  /**
   * Get financial analytics
   */
  async getFinancialAnalytics(filters: {
    department?: string
    dateRange?: { start: Date; end: Date }
  } = {}): Promise<FinancialAnalytics> {
    try {
      await this.ensureConnection()
      
      const assetsCollection = this.db.collection('assets')
      const matchStage: any = {}
      
      if (filters.department) {
        matchStage.department = filters.department
      }
      if (filters.dateRange) {
        matchStage.createdAt = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end
        }
      }

      const pipeline = [
        { $match: matchStage },
        {
          $addFields: {
            purchaseValue: { $ifNull: ['$purchaseValue', 0] },
            ageInYears: {
              $divide: [
                { $subtract: [new Date(), '$capitalizationDate'] },
                1000 * 60 * 60 * 24 * 365
              ]
            },
            lifecycleYears: { $ifNull: ['$lifecycleYears', 5] }
          }
        },
        {
          $addFields: {
            annualDepreciation: {
              $cond: [
                { $gt: ['$lifecycleYears', 0] },
                { $divide: ['$purchaseValue', '$lifecycleYears'] },
                0
              ]
            },
            accumulatedDepreciation: {
              $multiply: [
                {
                  $cond: [
                    { $gt: ['$lifecycleYears', 0] },
                    { $divide: ['$purchaseValue', '$lifecycleYears'] },
                    0
                  ]
                },
                { $min: ['$ageInYears', '$lifecycleYears'] }
              ]
            }
          }
        },
        {
          $addFields: {
            currentBookValue: {
              $subtract: ['$purchaseValue', '$accumulatedDepreciation']
            }
          }
        },
        {
          $facet: {
            totalValue: [
              {
                $group: {
                  _id: null,
                  total: { $sum: '$purchaseValue' }
                }
              }
            ],
            
            valueByDepartment: [
              {
                $group: {
                  _id: '$department',
                  value: { $sum: '$purchaseValue' }
                }
              }
            ],
            
            valueByClassification: [
              {
                $group: {
                  _id: '$assetClassification',
                  value: { $sum: '$purchaseValue' }
                }
              }
            ],
            
            depreciationSummary: [
              {
                $group: {
                  _id: null,
                  totalDepreciation: { $sum: '$accumulatedDepreciation' },
                  currentBookValue: { $sum: '$currentBookValue' }
                }
              }
            ],
            
            depreciationByYear: [
              {
                $group: {
                  _id: { $year: '$capitalizationDate' },
                  depreciation: { $sum: '$accumulatedDepreciation' }
                }
              },
              { $sort: { _id: 1 } }
            ],
            
            purchaseTrends: [
              {
                $group: {
                  _id: {
                    year: { $year: '$capitalizationDate' },
                    month: { $month: '$capitalizationDate' }
                  },
                  value: { $sum: '$purchaseValue' },
                  count: { $sum: 1 }
                }
              },
              { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]
          }
        }
      ]

      const [result] = await assetsCollection.aggregate(pipeline).toArray()
      
      const totalAssetValue = result.totalValue[0]?.total || 0
      
      const valueByDepartment = {}
      result.valueByDepartment.forEach(group => {
        valueByDepartment[group._id || 'Unknown'] = group.value
      })
      
      const valueByClassification = {}
      result.valueByClassification.forEach(group => {
        valueByClassification[group._id || 'Unknown'] = group.value
      })
      
      const depreciationSummary = result.depreciationSummary[0] || {}
      const depreciationByYear = {}
      result.depreciationByYear.forEach(group => {
        depreciationByYear[group._id] = group.depreciation
      })
      
      const purchaseTrends = result.purchaseTrends.map(trend => ({
        month: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
        value: trend.value,
        count: trend.count
      }))

      return {
        totalAssetValue,
        valueByDepartment,
        valueByClassification,
        depreciationSummary: {
          totalDepreciation: depreciationSummary.totalDepreciation || 0,
          currentBookValue: depreciationSummary.currentBookValue || 0,
          depreciationByYear
        },
        purchaseTrends
      }
    } catch (error) {
      this.handleError('getFinancialAnalytics', error)
    }
  }

  /**
   * Get utilization analytics
   */
  async getUtilizationAnalytics(filters: {
    department?: string
  } = {}): Promise<UtilizationAnalytics> {
    try {
      await this.ensureConnection()
      
      const assetsCollection = this.db.collection('assets')
      const matchStage: any = {}
      
      if (filters.department) {
        matchStage.department = filters.department
      }

      // This is a simplified version - in reality, you'd track actual usage data
      const pipeline = [
        { $match: matchStage },
        {
          $addFields: {
            daysSinceLastUsed: {
              $divide: [
                { $subtract: [new Date(), { $ifNull: ['$lastUsedDate', '$createdAt'] }] },
                1000 * 60 * 60 * 24
              ]
            },
            utilizationScore: {
              $cond: [
                { $eq: ['$currentStatus', 'Active'] },
                {
                  $cond: [
                    { $lt: [{ $ifNull: ['$daysSinceLastUsed', 0] }, 30] },
                    100,
                    {
                      $max: [0, { $subtract: [100, { $multiply: [{ $ifNull: ['$daysSinceLastUsed', 0] }, 2] }] }]
                    }
                  ]
                },
                0
              ]
            }
          }
        },
        {
          $facet: {
            overallUtilization: [
              {
                $group: {
                  _id: null,
                  avgUtilization: { $avg: '$utilizationScore' }
                }
              }
            ],
            
            utilizationByDepartment: [
              {
                $group: {
                  _id: '$department',
                  avgUtilization: { $avg: '$utilizationScore' }
                }
              }
            ],
            
            utilizationByClassification: [
              {
                $group: {
                  _id: '$assetClassification',
                  avgUtilization: { $avg: '$utilizationScore' }
                }
              }
            ],
            
            underutilizedAssets: [
              { $match: { utilizationScore: { $lt: 50 } } },
              {
                $project: {
                  assetId: { $toString: '$_id' },
                  assetNumber: 1,
                  utilizationRate: '$utilizationScore',
                  lastUsed: { $ifNull: ['$lastUsedDate', '$createdAt'] }
                }
              },
              { $sort: { utilizationRate: 1 } },
              { $limit: 20 }
            ],
            
            idleAssets: [
              { $match: { daysSinceLastUsed: { $gt: 90 } } },
              {
                $project: {
                  assetId: { $toString: '$_id' },
                  assetNumber: 1,
                  idleDays: { $round: '$daysSinceLastUsed' }
                }
              },
              { $sort: { idleDays: -1 } },
              { $limit: 20 }
            ]
          }
        }
      ]

      const [result] = await assetsCollection.aggregate(pipeline).toArray()
      
      const overallUtilization = result.overallUtilization[0]?.avgUtilization || 0
      
      const utilizationByDepartment = {}
      result.utilizationByDepartment.forEach(group => {
        utilizationByDepartment[group._id || 'Unknown'] = Math.round(group.avgUtilization * 100) / 100
      })
      
      const utilizationByClassification = {}
      result.utilizationByClassification.forEach(group => {
        utilizationByClassification[group._id || 'Unknown'] = Math.round(group.avgUtilization * 100) / 100
      })

      return {
        overallUtilization: Math.round(overallUtilization * 100) / 100,
        utilizationByDepartment,
        utilizationByClassification,
        underutilizedAssets: result.underutilizedAssets,
        idleAssets: result.idleAssets
      }
    } catch (error) {
      this.handleError('getUtilizationAnalytics', error)
    }
  }

  /**
   * Generate exception report for data quality
   */
  async generateExceptionReport(filters: {
    department?: string
  } = {}): Promise<ExceptionReport> {
    try {
      await this.ensureConnection()
      
      const assetsCollection = this.db.collection('assets')
      const matchStage: any = {}
      
      if (filters.department) {
        matchStage.department = filters.department
      }

      // Check for incomplete records
      const incompleteRecordsPipeline = [
        { $match: matchStage },
        {
          $addFields: {
            missingFields: {
              $filter: {
                input: [
                  { field: 'assetDescription', missing: { $or: [{ $eq: ['$assetDescription', ''] }, { $eq: ['$assetDescription', null] }] } },
                  { field: 'department', missing: { $or: [{ $eq: ['$department', ''] }, { $eq: ['$department', null] }] } },
                  { field: 'location', missing: { $or: [{ $eq: ['$location', ''] }, { $eq: ['$location', null] }] } },
                  { field: 'currentStatus', missing: { $or: [{ $eq: ['$currentStatus', ''] }, { $eq: ['$currentStatus', null] }] } },
                  { field: 'assetClassification', missing: { $or: [{ $eq: ['$assetClassification', ''] }, { $eq: ['$assetClassification', null] }] } }
                ],
                cond: '$$this.missing'
              }
            }
          }
        },
        {
          $match: {
            'missingFields.0': { $exists: true }
          }
        },
        {
          $project: {
            assetId: { $toString: '$_id' },
            assetNumber: 1,
            missingFields: {
              $map: {
                input: '$missingFields',
                as: 'field',
                in: '$$field.field'
              }
            },
            severity: {
              $switch: {
                branches: [
                  { case: { $gte: [{ $size: '$missingFields' }, 3] }, then: 'high' },
                  { case: { $gte: [{ $size: '$missingFields' }, 2] }, then: 'medium' }
                ],
                default: 'low'
              }
            }
          }
        }
      ]

      // Check for duplicate asset numbers
      const duplicateAssetsPipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: '$assetNumber',
            ids: { $push: { $toString: '$_id' } },
            count: { $sum: 1 }
          }
        },
        {
          $match: { count: { $gt: 1 } }
        },
        {
          $project: {
            assetNumber: '$_id',
            duplicateIds: '$ids'
          }
        }
      ]

      const [incompleteRecords, duplicateAssets] = await Promise.all([
        assetsCollection.aggregate(incompleteRecordsPipeline).toArray(),
        assetsCollection.aggregate(duplicateAssetsPipeline).toArray()
      ])

      // Calculate data quality score
      const totalAssets = await assetsCollection.countDocuments(matchStage)
      const qualityIssues = incompleteRecords.length + duplicateAssets.length
      const dataQualityScore = totalAssets > 0 
        ? Math.max(0, Math.round(((totalAssets - qualityIssues) / totalAssets) * 100))
        : 100

      return {
        incompleteRecords,
        duplicateAssets,
        orphanedRecords: [], // Would implement based on specific business rules
        dataQualityScore
      }
    } catch (error) {
      this.handleError('generateExceptionReport', error)
    }
  }

  /**
   * Export analytics data to Excel
   */
  async exportToExcel(
    analyticsData: any,
    reportType: string,
    filters: any = {}
  ): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'KTI Assets System'
      workbook.created = new Date()

      // Create summary sheet
      const summarySheet = workbook.addWorksheet('Summary')
      
      // Add header
      summarySheet.addRow(['KTI Assets Analytics Report'])
      summarySheet.addRow([`Report Type: ${reportType}`])
      summarySheet.addRow([`Generated: ${new Date().toLocaleString()}`])
      summarySheet.addRow([]) // Empty row

      // Add filters information
      if (Object.keys(filters).length > 0) {
        summarySheet.addRow(['Applied Filters:'])
        Object.entries(filters).forEach(([key, value]) => {
          summarySheet.addRow([`${key}: ${value}`])
        })
        summarySheet.addRow([]) // Empty row
      }

      // Add data based on report type
      switch (reportType) {
        case 'asset_analytics':
          this.addAssetAnalyticsToExcel(summarySheet, analyticsData)
          break
        case 'financial_analytics':
          this.addFinancialAnalyticsToExcel(summarySheet, analyticsData)
          break
        case 'utilization_analytics':
          this.addUtilizationAnalyticsToExcel(summarySheet, analyticsData)
          break
        default:
          summarySheet.addRow(['Unknown report type'])
      }

      // Style the header
      summarySheet.getRow(1).font = { bold: true, size: 16 }
      summarySheet.getRow(2).font = { bold: true }
      summarySheet.getRow(3).font = { italic: true }

      return await workbook.xlsx.writeBuffer() as Buffer
    } catch (error) {
      this.handleError('exportToExcel', error)
    }
  }

  private addAssetAnalyticsToExcel(sheet: ExcelJS.Worksheet, data: AssetAnalytics): void {
    sheet.addRow(['Asset Analytics Summary'])
    sheet.addRow(['Total Assets:', data.totalAssets])
    sheet.addRow(['Total Value:', `$${data.totalValue.toLocaleString()}`])
    sheet.addRow(['Average Age (days):', data.averageAge])
    sheet.addRow(['Utilization Rate:', `${data.utilizationRate}%`])
    sheet.addRow([])

    // Assets by Status
    sheet.addRow(['Assets by Status'])
    sheet.addRow(['Status', 'Count'])
    Object.entries(data.assetsByStatus).forEach(([status, count]) => {
      sheet.addRow([status, count])
    })
    sheet.addRow([])

    // Assets by Department
    sheet.addRow(['Assets by Department'])
    sheet.addRow(['Department', 'Count'])
    Object.entries(data.assetsByDepartment).forEach(([dept, count]) => {
      sheet.addRow([dept, count])
    })
  }

  private addFinancialAnalyticsToExcel(sheet: ExcelJS.Worksheet, data: FinancialAnalytics): void {
    sheet.addRow(['Financial Analytics Summary'])
    sheet.addRow(['Total Asset Value:', `$${data.totalAssetValue.toLocaleString()}`])
    sheet.addRow(['Current Book Value:', `$${data.depreciationSummary.currentBookValue.toLocaleString()}`])
    sheet.addRow(['Total Depreciation:', `$${data.depreciationSummary.totalDepreciation.toLocaleString()}`])
    sheet.addRow([])

    // Value by Department
    sheet.addRow(['Value by Department'])
    sheet.addRow(['Department', 'Value'])
    Object.entries(data.valueByDepartment).forEach(([dept, value]) => {
      sheet.addRow([dept, `$${value.toLocaleString()}`])
    })
  }

  private addUtilizationAnalyticsToExcel(sheet: ExcelJS.Worksheet, data: UtilizationAnalytics): void {
    sheet.addRow(['Utilization Analytics Summary'])
    sheet.addRow(['Overall Utilization:', `${data.overallUtilization}%`])
    sheet.addRow([])

    // Utilization by Department
    sheet.addRow(['Utilization by Department'])
    sheet.addRow(['Department', 'Utilization %'])
    Object.entries(data.utilizationByDepartment).forEach(([dept, util]) => {
      sheet.addRow([dept, `${util}%`])
    })
    sheet.addRow([])

    // Underutilized Assets
    sheet.addRow(['Underutilized Assets'])
    sheet.addRow(['Asset Number', 'Utilization Rate', 'Last Used'])
    data.underutilizedAssets.forEach(asset => {
      sheet.addRow([asset.assetNumber, `${asset.utilizationRate}%`, asset.lastUsed.toLocaleDateString()])
    })
  }

  /**
   * Export analytics data to PDF
   */
  async exportToPDF(
    analyticsData: any,
    reportType: string,
    filters: any = {}
  ): Promise<Buffer> {
    try {
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument()
        const chunks: Buffer[] = []

        doc.on('data', chunk => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)

        // Add header
        doc.fontSize(20).text('KTI Assets Analytics Report', { align: 'center' })
        doc.fontSize(14).text(`Report Type: ${reportType}`, { align: 'center' })
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
        doc.moveDown(2)

        // Add filters if any
        if (Object.keys(filters).length > 0) {
          doc.fontSize(14).text('Applied Filters:')
          Object.entries(filters).forEach(([key, value]) => {
            doc.fontSize(12).text(`${key}: ${value}`)
          })
          doc.moveDown()
        }

        // Add content based on report type
        switch (reportType) {
          case 'asset_analytics':
            this.addAssetAnalyticsToPDF(doc, analyticsData)
            break
          case 'financial_analytics':
            this.addFinancialAnalyticsToPDF(doc, analyticsData)
            break
          case 'utilization_analytics':
            this.addUtilizationAnalyticsToPDF(doc, analyticsData)
            break
          default:
            doc.text('Unknown report type')
        }

        doc.end()
      })
    } catch (error) {
      this.handleError('exportToPDF', error)
    }
  }

  private addAssetAnalyticsToPDF(doc: PDFKit.PDFDocument, data: AssetAnalytics): void {
    doc.fontSize(16).text('Asset Analytics Summary')
    doc.fontSize(12)
    doc.text(`Total Assets: ${data.totalAssets}`)
    doc.text(`Total Value: $${data.totalValue.toLocaleString()}`)
    doc.text(`Average Age: ${data.averageAge} days`)
    doc.text(`Utilization Rate: ${data.utilizationRate}%`)
    doc.moveDown()

    doc.fontSize(14).text('Assets by Status:')
    doc.fontSize(12)
    Object.entries(data.assetsByStatus).forEach(([status, count]) => {
      doc.text(`${status}: ${count}`)
    })
    doc.moveDown()

    doc.fontSize(14).text('Assets by Department:')
    doc.fontSize(12)
    Object.entries(data.assetsByDepartment).forEach(([dept, count]) => {
      doc.text(`${dept}: ${count}`)
    })
  }

  private addFinancialAnalyticsToPDF(doc: PDFKit.PDFDocument, data: FinancialAnalytics): void {
    doc.fontSize(16).text('Financial Analytics Summary')
    doc.fontSize(12)
    doc.text(`Total Asset Value: $${data.totalAssetValue.toLocaleString()}`)
    doc.text(`Current Book Value: $${data.depreciationSummary.currentBookValue.toLocaleString()}`)
    doc.text(`Total Depreciation: $${data.depreciationSummary.totalDepreciation.toLocaleString()}`)
    doc.moveDown()

    doc.fontSize(14).text('Value by Department:')
    doc.fontSize(12)
    Object.entries(data.valueByDepartment).forEach(([dept, value]) => {
      doc.text(`${dept}: $${value.toLocaleString()}`)
    })
  }

  private addUtilizationAnalyticsToPDF(doc: PDFKit.PDFDocument, data: UtilizationAnalytics): void {
    doc.fontSize(16).text('Utilization Analytics Summary')
    doc.fontSize(12)
    doc.text(`Overall Utilization: ${data.overallUtilization}%`)
    doc.moveDown()

    doc.fontSize(14).text('Utilization by Department:')
    doc.fontSize(12)
    Object.entries(data.utilizationByDepartment).forEach(([dept, util]) => {
      doc.text(`${dept}: ${util}%`)
    })
  }
}

// Export service instance
export const analyticsService = new AnalyticsService()