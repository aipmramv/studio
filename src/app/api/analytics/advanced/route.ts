import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { dataExportAnalyticsService } from '@/lib/data-export-analytics'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'
import { ExportFilters } from '@/lib/data-export-analytics'

// GET /api/analytics/advanced - Perform advanced analytics
async function getAdvancedAnalytics(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url)
    
    const dataSource = searchParams.get('dataSource')

    if (!dataSource) {
      return NextResponse.json(
        { error: 'Data source is required' },
        { status: 400 }
      )
    }

    if (!['assets', 'transfers', 'workflows', 'users'].includes(dataSource)) {
      return NextResponse.json(
        { error: 'Invalid data source' },
        { status: 400 }
      )
    }

    const filters: ExportFilters = {
      dateRange: searchParams.get('startDate') && searchParams.get('endDate') ? {
        start: new Date(searchParams.get('startDate')!),
        end: new Date(searchParams.get('endDate')!),
        field: searchParams.get('dateField') || 'createdAt'
      } : undefined,
      departments: searchParams.get('departments')?.split(',').filter(Boolean),
      locations: searchParams.get('locations')?.split(',').filter(Boolean),
      categories: searchParams.get('categories')?.split(',').filter(Boolean),
      statuses: searchParams.get('statuses')?.split(',').filter(Boolean),
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    }

    const analytics = await dataExportAnalyticsService.performAdvancedAnalytics(
      dataSource,
      filters,
      user
    )

    return createSuccessResponse({
      analytics,
      dataSource,
      message: 'Advanced analytics completed successfully'
    })
  } catch (error) {
    console.error('Advanced analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to perform advanced analytics' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getAdvancedAnalytics)