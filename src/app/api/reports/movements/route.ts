import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { reportGenerationService } from '@/lib/report-generation'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'
import { ReportFilters } from '@/lib/report-generation'

// GET /api/reports/movements - Generate asset movement report
async function generateMovementReport(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filters
    const filters: ReportFilters = {
      dateRange: searchParams.get('startDate') && searchParams.get('endDate') ? {
        start: new Date(searchParams.get('startDate')!),
        end: new Date(searchParams.get('endDate')!),
        field: (searchParams.get('dateField') as any) || 'createdAt'
      } : undefined,
      departments: searchParams.get('departments')?.split(',').filter(Boolean),
      locations: searchParams.get('locations')?.split(',').filter(Boolean),
      statuses: searchParams.get('statuses')?.split(',').filter(Boolean)
    }

    const format = (searchParams.get('format') as 'pdf' | 'excel' | 'csv' | 'json') || 'json'

    const result = await reportGenerationService.generateMovementReport(
      filters,
      format,
      user.id,
      user
    )

    return createSuccessResponse({
      report: result.report,
      data: format === 'json' ? result.data : undefined,
      message: 'Movement report generated successfully'
    })
  } catch (error) {
    console.error('Movement report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate movement report' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(generateMovementReport)