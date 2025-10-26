import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { dataExportAnalyticsService } from '@/lib/data-export-analytics'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'
import { ExportRequest, ExportFilters, ExportFormat } from '@/lib/data-export-analytics'

// POST /api/analytics/export - Export data in various formats
async function exportData(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json()
    const {
      type,
      dataSource,
      filters,
      format,
      template,
      includeCharts,
      includeImages
    } = body

    if (!type || !dataSource) {
      return NextResponse.json(
        { error: 'Export type and data source are required' },
        { status: 400 }
      )
    }

    // Validate export type
    if (!['excel', 'pdf', 'csv', 'json'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid export type' },
        { status: 400 }
      )
    }

    // Validate data source
    if (!['assets', 'transfers', 'workflows', 'users', 'custom'].includes(dataSource)) {
      return NextResponse.json(
        { error: 'Invalid data source' },
        { status: 400 }
      )
    }

    const exportRequest: ExportRequest = {
      type,
      dataSource,
      filters: filters || {},
      format: format || {
        orientation: 'portrait',
        pageSize: 'A4',
        includeHeader: true,
        includeFooter: true,
        includeTimestamp: true,
        includeFilters: true,
        includeSummary: true
      },
      template,
      includeCharts,
      includeImages
    }

    const result = await dataExportAnalyticsService.exportData(
      exportRequest,
      user.id,
      user
    )

    return createSuccessResponse({
      export: result,
      message: 'Data export completed successfully'
    })
  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

// GET /api/analytics/export - Get export history
async function getExportHistory(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      type: searchParams.get('type') || undefined,
      dataSource: searchParams.get('dataSource') || undefined,
      exportedBy: searchParams.get('exportedBy') || undefined,
      dateRange: searchParams.get('startDate') && searchParams.get('endDate') ? {
        start: new Date(searchParams.get('startDate')!),
        end: new Date(searchParams.get('endDate')!)
      } : undefined
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await dataExportAnalyticsService.getExportHistory(
      filters,
      user,
      { page, limit }
    )

    return createSuccessResponse(result)
  } catch (error) {
    console.error('Get export history error:', error)
    return NextResponse.json(
      { error: 'Failed to get export history' },
      { status: 500 }
    )
  }
}

export const POST = withApiMiddleware(exportData)
export const GET = withApiMiddleware(getExportHistory)