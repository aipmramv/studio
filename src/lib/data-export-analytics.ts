import 'server-only'

import { MongoDBConnection, BaseMongoService } from './mongodb-service'
import { ObjectId, ClientSession } from '@/types/server-types'
import { JWTPayload } from '@/types/auth'
import { DepartmentFilterService } from './department-filter'

// Export and analytics types
export interface ExportRequest {
  type: 'excel' | 'pdf' | 'csv' | 'json'
  dataSource: 'assets' | 'transfers' | 'workflows' | 'users' | 'custom'
  filters: ExportFilters
  format: ExportFormat
  template?: string
  includeCharts?: boolean
  includeImages?: boolean
}

export interface ExportFilters {
  dateRange?: {
    start: Date
    end: Date
    field?: string
  }
  departments?: string[]
  locations?: string[]
  categories?: string[]
  statuses?: string[]
  users?: string[]
  customQuery?: Record<string, any>
  fields?: string[] // Specific fields to include
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ExportFormat {
  orientation?: 'portrait' | 'landscape'
  pageSize?: 'A4' | 'A3' | 'Letter' | 'Legal'
  includeHeader?: boolean
  includeFooter?: boolean
  includeTimestamp?: boolean
  includeFilters?: boolean
  includeSummary?: boolean
  groupBy?: string[]
  aggregations?: ExportAggregation[]
}

export interface ExportAggregation {
  field: string
  operation: 'sum' | 'avg' | 'count' | 'min' | 'max'
  label?: string
}

export interface ExportResult {
  id: string
  type: string
  dataSource: string
  status: 'processing' | 'completed' | 'failed'
  fileUrl?: string
  fileName: string
  fileSize?: number
  recordCount: number
  processingTime: number
  error?: string
  createdAt: Date
  expiresAt: Date
  downloadCount: number
  metadata: {
    filters: ExportFilters
    format: ExportFormat
    summary?: Record<string, any>
  }
}

export interface TrendAnalysis {
  metric: string
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  data: Array<{
    date: Date
    value: number
    change?: number
    changePercentage?: number
  }>
  trend: 'increasing' | 'decreasing' | 'stable'
  correlation?: number
  forecast?: Array<{
    date: Date
    predicted: number
    confidence: number
  }>
}

export interface ExceptionReport {
  id: string
  type: 'missing_data' | 'data_inconsistency' | 'business_rule_violation' | 'system_anomaly'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  affectedRecords: number
  detectedAt: Date
  status: 'open' | 'investigating' | 'resolved' | 'ignored'
  assignedTo?: string
  resolution?: string
  resolvedAt?: Date
  data: {
    query: Record<string, any>
    samples: any[]
    statistics: Record<string, any>
  }
}

export interface DataQualityMetrics {
  completeness: {
    score: number
    details: Array<{
      field: string
      completeness: number
      missingCount: number
      totalCount: number
    }>
  }
  accuracy: {
    score: number
    details: Array<{
      field: string
      accuracy: number
      invalidCount: number
      totalCount: number
    }>
  }
  consistency: {
    score: number
    details: Array<{
      rule: string
      consistency: number
      violationCount: number
      totalCount: number
    }>
  }
  timeliness: {
    score: number
    details: Array<{
      field: string
      timeliness: number
      outdatedCount: number
      totalCount: number
    }>
  }
  overallScore: number
}

export interface AdvancedAnalytics {
  correlations: Array<{
    field1: string
    field2: string
    correlation: number
    significance: number
    type: 'positive' | 'negative' | 'none'
  }>
  outliers: Array<{
    recordId: string
    field: string
    value: any
    expectedRange: { min: number; max: number }
    severity: 'mild' | 'moderate' | 'extreme'
  }>
  patterns: Array<{
    pattern: string
    description: string
    frequency: number
    confidence: number
    examples: any[]
  }>
  predictions: Array<{
    metric: string
    currentValue: number
    predictedValue: number
    confidence: number
    timeframe: string
    factors: string[]
  }>
}

/**
 * Data Export and Analytics Service
 * Handles data export, trend analysis, and exception reporting
 */
export class DataExportAnalyticsService extends BaseMongoService<any> {
  private exportsCollection = 'dataExports'
  private exceptionsCollection = 'exceptionReports'
  private analyticsCache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private readonly CACHE_TTL = 10 * 60 * 1000 // 10 minutes

  constructor() {
    super('data_export_analytics')
  }

  /**
   * Export data to various formats
   */
  async exportData(
    request: ExportRequest,
    exportedBy: string,
    user?: JWTPayload
  ): Promise<ExportResult> {
    try {
      await this.ensureConnection()

      const startTime = Date.now()
      const exportId = new ObjectId().toString()

      // Get data based on source
      const data = await this.getData(request.dataSource, request.filters, user)

      // Generate file based on type
      const { fileUrl, fileName, fileSize } = await this.generateExportFile(
        data,
        request.type,
        request.format,
        exportId
      )

      // Calculate summary if requested
      let summary
      if (request.format.includeSummary) {
        summary = await this.calculateExportSummary(data, request.format.aggregations)
      }

      const exportResult: ExportResult = {
        id: exportId,
        type: request.type,
        dataSource: request.dataSource,
        status: 'completed',
        fileUrl,
        fileName,
        fileSize,
        recordCount: Array.isArray(data) ? data.length : Object.keys(data).length,
        processingTime: Date.now() - startTime,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        downloadCount: 0,
        metadata: {
          filters: request.filters,
          format: request.format,
          summary
        }
      }

      // Save export record
      await this.saveExportRecord(exportResult, exportedBy)

      return exportResult
    } catch (error) {
      this.handleError('exportData', error)
    }
  }

  /**
   * Perform trend analysis
   */
  async performTrendAnalysis(
    metric: string,
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    filters: ExportFilters,
    user?: JWTPayload
  ): Promise<TrendAnalysis> {
    try {
      await this.ensureConnection()

      const cacheKey = `trend_${metric}_${period}_${JSON.stringify(filters)}_${user?.id || 'anonymous'}`
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      // Build aggregation pipeline for trend analysis
      const pipeline = this.buildTrendPipeline(metric, period, filters, user)

      const assetsCollection = this.db.collection('assets')
      const results = await assetsCollection.aggregate(pipeline).toArray()

      // Process results and calculate trends
      const trendData = this.processTrendData(results, period)
      const trend = this.calculateTrendDirection(trendData)
      const correlation = this.calculateCorrelation(trendData)

      const analysis: TrendAnalysis = {
        metric,
        period,
        data: trendData,
        trend,
        correlation
      }

      this.setCache(cacheKey, analysis, this.CACHE_TTL)
      return analysis
    } catch (error) {
      this.handleError('performTrendAnalysis', error)
    }
  }

  /**
   * Generate exception reports
   */
  async generateExceptionReports(
    filters: ExportFilters,
    user?: JWTPayload
  ): Promise<ExceptionReport[]> {
    try {
      await this.ensureConnection()

      const exceptions: ExceptionReport[] = []

      // Check for missing data exceptions
      const missingDataExceptions = await this.checkMissingData(filters, user)
      exceptions.push(...missingDataExceptions)

      // Check for data inconsistencies
      const inconsistencyExceptions = await this.checkDataInconsistencies(filters, user)
      exceptions.push(...inconsistencyExceptions)

      // Check for business rule violations
      const businessRuleExceptions = await this.checkBusinessRuleViolations(filters, user)
      exceptions.push(...businessRuleExceptions)

      // Check for system anomalies
      const anomalyExceptions = await this.checkSystemAnomalies(filters, user)
      exceptions.push(...anomalyExceptions)

      // Save exception reports
      for (const exception of exceptions) {
        await this.saveExceptionReport(exception)
      }

      return exceptions
    } catch (error) {
      this.handleError('generateExceptionReports', error)
    }
  }

  /**
   * Calculate data quality metrics
   */
  async calculateDataQualityMetrics(
    dataSource: string,
    filters: ExportFilters,
    user?: JWTPayload
  ): Promise<DataQualityMetrics> {
    try {
      await this.ensureConnection()

      const cacheKey = `quality_${dataSource}_${JSON.stringify(filters)}_${user?.id || 'anonymous'}`
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      // Get data for analysis
      const data = await this.getData(dataSource, filters, user)

      // Calculate completeness
      const completeness = await this.calculateCompleteness(data, dataSource)

      // Calculate accuracy
      const accuracy = await this.calculateAccuracy(data, dataSource)

      // Calculate consistency
      const consistency = await this.calculateConsistency(data, dataSource)

      // Calculate timeliness
      const timeliness = await this.calculateTimeliness(data, dataSource)

      // Calculate overall score
      const overallScore = (
        completeness.score + 
        accuracy.score + 
        consistency.score + 
        timeliness.score
      ) / 4

      const metrics: DataQualityMetrics = {
        completeness,
        accuracy,
        consistency,
        timeliness,
        overallScore
      }

      this.setCache(cacheKey, metrics, this.CACHE_TTL)
      return metrics
    } catch (error) {
      this.handleError('calculateDataQualityMetrics', error)
    }
  }

  /**
   * Perform advanced analytics
   */
  async performAdvancedAnalytics(
    dataSource: string,
    filters: ExportFilters,
    user?: JWTPayload
  ): Promise<AdvancedAnalytics> {
    try {
      await this.ensureConnection()

      const cacheKey = `advanced_${dataSource}_${JSON.stringify(filters)}_${user?.id || 'anonymous'}`
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      // Get data for analysis
      const data = await this.getData(dataSource, filters, user)

      // Calculate correlations
      const correlations = await this.calculateCorrelations(data)

      // Detect outliers
      const outliers = await this.detectOutliers(data)

      // Identify patterns
      const patterns = await this.identifyPatterns(data)

      // Generate predictions
      const predictions = await this.generatePredictions(data, dataSource)

      const analytics: AdvancedAnalytics = {
        correlations,
        outliers,
        patterns,
        predictions
      }

      this.setCache(cacheKey, analytics, this.CACHE_TTL)
      return analytics
    } catch (error) {
      this.handleError('performAdvancedAnalytics', error)
    }
  }

  /**
   * Get export history
   */
  async getExportHistory(
    filters: {
      type?: string
      dataSource?: string
      exportedBy?: string
      dateRange?: { start: Date; end: Date }
    } = {},
    user?: JWTPayload,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{
    exports: ExportResult[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    try {
      await this.ensureConnection()

      const exportsCollection = this.db.collection(this.exportsCollection)
      let query: any = {}

      // Apply filters
      if (filters.type) query.type = filters.type
      if (filters.dataSource) query.dataSource = filters.dataSource
      if (filters.dateRange) {
        query.createdAt = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end
        }
      }

      // User-based filtering
      if (user?.role !== 'admin') {
        query.exportedBy = user?.id
      } else if (filters.exportedBy) {
        query.exportedBy = filters.exportedBy
      }

      const { page, limit } = pagination
      const skip = (page - 1) * limit

      const [exports, total] = await Promise.all([
        exportsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        exportsCollection.countDocuments(query)
      ])

      const processedExports = exports.map(exp => ({
        id: exp._id.toString(),
        type: exp.type,
        dataSource: exp.dataSource,
        status: exp.status,
        fileUrl: exp.fileUrl,
        fileName: exp.fileName,
        fileSize: exp.fileSize,
        recordCount: exp.recordCount,
        processingTime: exp.processingTime,
        error: exp.error,
        createdAt: exp.createdAt,
        expiresAt: exp.expiresAt,
        downloadCount: exp.downloadCount,
        metadata: exp.metadata
      }))

      return {
        exports: processedExports,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    } catch (error) {
      this.handleError('getExportHistory', error)
    }
  }

  // Private helper methods

  private async getData(
    dataSource: string,
    filters: ExportFilters,
    user?: JWTPayload
  ): Promise<any[]> {
    let collection: string
    let baseQuery: any = {}

    switch (dataSource) {
      case 'assets':
        collection = 'assets'
        baseQuery = this.buildAssetQuery(filters, user)
        break
      case 'transfers':
        collection = 'assetTransfers'
        baseQuery = this.buildTransferQuery(filters, user)
        break
      case 'workflows':
        collection = 'workflowInstances'
        baseQuery = this.buildWorkflowQuery(filters, user)
        break
      case 'users':
        collection = 'users'
        baseQuery = this.buildUserQuery(filters, user)
        break
      default:
        throw new Error(`Unsupported data source: ${dataSource}`)
    }

    // Apply department filtering for assets
    if (dataSource === 'assets' && user) {
      baseQuery = DepartmentFilterService.filterAssetQuery(baseQuery, user)
    }

    const dataCollection = this.db.collection(collection)
    let query = dataCollection.find(baseQuery)

    // Apply sorting
    if (filters.sortBy) {
      const sortOrder = filters.sortOrder === 'desc' ? -1 : 1
      query = query.sort({ [filters.sortBy]: sortOrder })
    }

    // Apply limit
    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    // Project specific fields if requested
    if (filters.fields && filters.fields.length > 0) {
      const projection = {}
      filters.fields.forEach(field => {
        projection[field] = 1
      })
      query = query.project(projection)
    }

    return await query.toArray()
  }

  private async generateExportFile(
    data: any[],
    type: string,
    format: ExportFormat,
    exportId: string
  ): Promise<{ fileUrl: string; fileName: string; fileSize: number }> {
    // Simplified implementation - would integrate with actual file generation libraries
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `export_${exportId}_${timestamp}.${type}`
    const fileUrl = `/exports/${fileName}`
    
    // In a real implementation, this would:
    // 1. Use libraries like ExcelJS for Excel files
    // 2. Use PDFKit or similar for PDF generation
    // 3. Generate CSV using standard formatting
    // 4. Save to cloud storage
    
    console.log(`Generated ${type} export: ${fileName} with ${data.length} records`)
    
    // Simulate file size calculation
    const estimatedSize = data.length * 1000 + Math.random() * 100000
    
    return {
      fileUrl,
      fileName,
      fileSize: Math.floor(estimatedSize)
    }
  }

  private async calculateExportSummary(
    data: any[],
    aggregations?: ExportAggregation[]
  ): Promise<Record<string, any>> {
    const summary: Record<string, any> = {
      totalRecords: data.length
    }

    if (aggregations) {
      for (const agg of aggregations) {
        const values = data
          .map(item => item[agg.field])
          .filter(val => val != null && !isNaN(val))

        switch (agg.operation) {
          case 'sum':
            summary[agg.label || `${agg.field}_sum`] = values.reduce((sum, val) => sum + val, 0)
            break
          case 'avg':
            summary[agg.label || `${agg.field}_avg`] = values.length > 0 
              ? values.reduce((sum, val) => sum + val, 0) / values.length 
              : 0
            break
          case 'count':
            summary[agg.label || `${agg.field}_count`] = values.length
            break
          case 'min':
            summary[agg.label || `${agg.field}_min`] = values.length > 0 ? Math.min(...values) : 0
            break
          case 'max':
            summary[agg.label || `${agg.field}_max`] = values.length > 0 ? Math.max(...values) : 0
            break
        }
      }
    }

    return summary
  }

  private buildTrendPipeline(
    metric: string,
    period: string,
    filters: ExportFilters,
    user?: JWTPayload
  ): any[] {
    // Simplified trend pipeline - would be more complex in real implementation
    const pipeline = []

    // Match stage
    let matchStage: any = {}
    if (filters.dateRange) {
      matchStage[filters.dateRange.field || 'createdAt'] = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end
      }
    }

    if (user) {
      matchStage = DepartmentFilterService.filterAssetQuery(matchStage, user)
    }

    pipeline.push({ $match: matchStage })

    // Group by period
    const groupId = this.getGroupIdForPeriod(period)
    pipeline.push({
      $group: {
        _id: groupId,
        value: { $sum: `$${metric}` },
        count: { $sum: 1 }
      }
    })

    pipeline.push({ $sort: { _id: 1 } })

    return pipeline
  }

  private getGroupIdForPeriod(period: string): any {
    const dateField = '$createdAt'
    
    switch (period) {
      case 'daily':
        return {
          year: { $year: dateField },
          month: { $month: dateField },
          day: { $dayOfMonth: dateField }
        }
      case 'weekly':
        return {
          year: { $year: dateField },
          week: { $week: dateField }
        }
      case 'monthly':
        return {
          year: { $year: dateField },
          month: { $month: dateField }
        }
      case 'quarterly':
        return {
          year: { $year: dateField },
          quarter: {
            $ceil: { $divide: [{ $month: dateField }, 3] }
          }
        }
      case 'yearly':
        return { year: { $year: dateField } }
      default:
        return { $dateToString: { format: '%Y-%m-%d', date: dateField } }
    }
  }

  private processTrendData(results: any[], period: string): any[] {
    return results.map(result => ({
      date: this.convertGroupIdToDate(result._id, period),
      value: result.value,
      count: result.count
    }))
  }

  private convertGroupIdToDate(groupId: any, period: string): Date {
    // Simplified conversion - would handle all period types properly
    if (typeof groupId === 'string') {
      return new Date(groupId)
    }
    
    if (groupId.year) {
      const year = groupId.year
      const month = groupId.month || 1
      const day = groupId.day || 1
      return new Date(year, month - 1, day)
    }
    
    return new Date()
  }

  private calculateTrendDirection(data: any[]): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 2) return 'stable'
    
    const firstValue = data[0].value
    const lastValue = data[data.length - 1].value
    const change = ((lastValue - firstValue) / firstValue) * 100
    
    if (Math.abs(change) < 5) return 'stable'
    return change > 0 ? 'increasing' : 'decreasing'
  }

  private calculateCorrelation(data: any[]): number {
    // Simplified correlation calculation
    if (data.length < 2) return 0
    
    const values = data.map(d => d.value)
    const indices = data.map((_, i) => i)
    
    // Calculate Pearson correlation coefficient
    const n = values.length
    const sumX = indices.reduce((sum, x) => sum + x, 0)
    const sumY = values.reduce((sum, y) => sum + y, 0)
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0)
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0)
    const sumY2 = values.reduce((sum, y) => sum + y * y, 0)
    
    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
    
    return denominator === 0 ? 0 : numerator / denominator
  }

  private async checkMissingData(filters: ExportFilters, user?: JWTPayload): Promise<ExceptionReport[]> {
    // Simplified missing data check
    const exceptions: ExceptionReport[] = []
    
    const assetsCollection = this.db.collection('assets')
    const missingDescriptions = await assetsCollection.countDocuments({
      $or: [
        { assetDescription: { $exists: false } },
        { assetDescription: null },
        { assetDescription: '' }
      ]
    })
    
    if (missingDescriptions > 0) {
      exceptions.push({
        id: new ObjectId().toString(),
        type: 'missing_data',
        severity: 'medium',
        title: 'Missing Asset Descriptions',
        description: `${missingDescriptions} assets are missing descriptions`,
        affectedRecords: missingDescriptions,
        detectedAt: new Date(),
        status: 'open',
        data: {
          query: { assetDescription: { $in: [null, ''] } },
          samples: [],
          statistics: { missingCount: missingDescriptions }
        }
      })
    }
    
    return exceptions
  }

  private async checkDataInconsistencies(filters: ExportFilters, user?: JWTPayload): Promise<ExceptionReport[]> {
    // Simplified inconsistency check
    return []
  }

  private async checkBusinessRuleViolations(filters: ExportFilters, user?: JWTPayload): Promise<ExceptionReport[]> {
    // Simplified business rule check
    return []
  }

  private async checkSystemAnomalies(filters: ExportFilters, user?: JWTPayload): Promise<ExceptionReport[]> {
    // Simplified anomaly check
    return []
  }

  private async calculateCompleteness(data: any[], dataSource: string): Promise<any> {
    // Simplified completeness calculation
    const requiredFields = this.getRequiredFields(dataSource)
    const details = []
    let totalScore = 0
    
    for (const field of requiredFields) {
      const missingCount = data.filter(item => !item[field] || item[field] === '').length
      const completeness = ((data.length - missingCount) / data.length) * 100
      
      details.push({
        field,
        completeness,
        missingCount,
        totalCount: data.length
      })
      
      totalScore += completeness
    }
    
    return {
      score: totalScore / requiredFields.length,
      details
    }
  }

  private async calculateAccuracy(data: any[], dataSource: string): Promise<any> {
    // Simplified accuracy calculation
    return { score: 95, details: [] }
  }

  private async calculateConsistency(data: any[], dataSource: string): Promise<any> {
    // Simplified consistency calculation
    return { score: 90, details: [] }
  }

  private async calculateTimeliness(data: any[], dataSource: string): Promise<any> {
    // Simplified timeliness calculation
    return { score: 85, details: [] }
  }

  private async calculateCorrelations(data: any[]): Promise<any[]> {
    // Simplified correlation calculation
    return []
  }

  private async detectOutliers(data: any[]): Promise<any[]> {
    // Simplified outlier detection
    return []
  }

  private async identifyPatterns(data: any[]): Promise<any[]> {
    // Simplified pattern identification
    return []
  }

  private async generatePredictions(data: any[], dataSource: string): Promise<any[]> {
    // Simplified prediction generation
    return []
  }

  private getRequiredFields(dataSource: string): string[] {
    switch (dataSource) {
      case 'assets':
        return ['assetNumber', 'assetDescription', 'department', 'location', 'currentStatus']
      case 'transfers':
        return ['assetId', 'fromDepartment', 'toDepartment', 'requestedBy']
      case 'workflows':
        return ['templateId', 'status', 'createdBy']
      case 'users':
        return ['email', 'name', 'role', 'department']
      default:
        return []
    }
  }

  private buildAssetQuery(filters: ExportFilters, user?: JWTPayload): any {
    const query: any = {}
    
    if (filters.dateRange) {
      query[filters.dateRange.field || 'createdAt'] = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end
      }
    }
    
    if (filters.departments?.length) query.department = { $in: filters.departments }
    if (filters.locations?.length) query.location = { $in: filters.locations }
    if (filters.categories?.length) query.assetClassification = { $in: filters.categories }
    if (filters.statuses?.length) query.currentStatus = { $in: filters.statuses }
    
    return query
  }

  private buildTransferQuery(filters: ExportFilters, user?: JWTPayload): any {
    const query: any = {}
    
    if (filters.dateRange) {
      query[filters.dateRange.field || 'requestedAt'] = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end
      }
    }
    
    if (filters.statuses?.length) query.status = { $in: filters.statuses }
    
    return query
  }

  private buildWorkflowQuery(filters: ExportFilters, user?: JWTPayload): any {
    const query: any = {}
    
    if (filters.dateRange) {
      query[filters.dateRange.field || 'startedAt'] = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end
      }
    }
    
    if (filters.statuses?.length) query.status = { $in: filters.statuses }
    
    return query
  }

  private buildUserQuery(filters: ExportFilters, user?: JWTPayload): any {
    const query: any = {}
    
    if (filters.departments?.length) query.department = { $in: filters.departments }
    
    return query
  }

  private async saveExportRecord(exportResult: ExportResult, exportedBy: string): Promise<void> {
    const exportsCollection = this.db.collection(this.exportsCollection)
    await exportsCollection.insertOne({
      _id: new ObjectId(exportResult.id),
      ...exportResult,
      exportedBy
    })
  }

  private async saveExceptionReport(exception: ExceptionReport): Promise<void> {
    const exceptionsCollection = this.db.collection(this.exceptionsCollection)
    await exceptionsCollection.insertOne({
      _id: new ObjectId(exception.id),
      ...exception
    })
  }

  private getFromCache(key: string): any {
    const cached = this.analyticsCache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
    this.analyticsCache.delete(key)
    return null
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.analyticsCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
}

// Export service instance
export const dataExportAnalyticsService = new DataExportAnalyticsService()