import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { dataExportAnalyticsService } from '@/lib/data-export-analytics'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'
import { ExportFilters } from '@/lib/data-export-analytics'

// GET /api/analytics/trends - Perform trend analysis
async function getTrendAnalysis(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url)
    
    const metric = searchParams.get('metric')
    const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

    if (!metric) {
      return NextResponse.json(
        { error: 'Metric is required' },
        { status: 400 }
      )
    }

    if (!period || !['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].includes(period)) {
      return NextResponse.json(
        { error: 'Valid period is required (daily, weekly, monthly, quarterly, yearly)' },
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
      statuses: searchParams.get('statuses')?.split(',').filter(Boolean)
    }

    const analysis = await dataExportAnalyticsService.performTrendAnalysis(
      metric,
      period,
      filters,
      user
    )

    return createSuccessResponse({
      analysis,
      message: 'Trend analysis completed successfully'
    })
  } catch (error) {
    console.error('Trend analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to perform trend analysis' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getTrendAnalysis)