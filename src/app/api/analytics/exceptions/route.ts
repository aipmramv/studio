import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { dataExportAnalyticsService } from '@/lib/data-export-analytics'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'
import { ExportFilters } from '@/lib/data-export-analytics'

// GET /api/analytics/exceptions - Generate exception reports
async function getExceptionReports(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters: ExportFilters = {
      dateRange: searchParams.get('startDate') && searchParams.get('endDate') ? {
        start: new Date(searchParams.get('startDate')!),
        end: new Date(searchParams.get('endDate')!),
        field: searchParams.get('dateField') || 'createdAt'
      } : undefined,
      departments: searchParams.get('departments')?.split(',').filter(Boolean),
      locations: searchParams.get('locations')?.split(',').filter(Boolean),
      categories: searchParams.get('categories')?.split(',').filter(Boolean),
      statuses: searchParams.get('statuses')?.split(',').filter(Boolean)
    }

    const exceptions = await dataExportAnalyticsService.generateExceptionReports(
      filters,
      user
    )

    // Group exceptions by type and severity
    const summary = {
      total: exceptions.length,
      byType: {},
      bySeverity: {},
      byStatus: {}
    }

    exceptions.forEach(exception => {
      // By type
      summary.byType[exception.type] = (summary.byType[exception.type] || 0) + 1
      
      // By severity
      summary.bySeverity[exception.severity] = (summary.bySeverity[exception.severity] || 0) + 1
      
      // By status
      summary.byStatus[exception.status] = (summary.byStatus[exception.status] || 0) + 1
    })

    return createSuccessResponse({
      exceptions,
      summary,
      filters,
      message: 'Exception reports generated successfully'
    })
  } catch (error) {
    console.error('Exception reports error:', error)
    return NextResponse.json(
      { error: 'Failed to generate exception reports' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getExceptionReports)