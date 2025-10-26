import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { reportGenerationService } from '@/lib/report-generation'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'
import { ReportFilters } from '@/lib/report-generation'

// GET /api/reports/financial - Generate financial report
async function generateFinancialReport(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filters
    const filters: ReportFilters = {
      dateRange: searchParams.get('startDate') && searchParams.get('endDate') ? {
        start: new Date(searchParams.get('startDate')!),
        end: new Date(searchParams.get('endDate')!),
        field: (searchParams.get('dateField') as any) || 'capitalizationDate'
      } : undefined,
      departments: searchParams.get('departments')?.split(',').filter(Boolean),
      assetCategories: searchParams.get('categories')?.split(',').filter(Boolean),
      valueRange: searchParams.get('minValue') && searchParams.get('maxValue') ? {
        min: parseFloat(searchParams.get('minValue')!),
        max: parseFloat(searchParams.get('maxValue')!)
      } : undefined
    }

    const format = (searchParams.get('format') as 'pdf' | 'excel' | 'csv' | 'json') || 'json'

    const result = await reportGenerationService.generateFinancialReport(
      filters,
      format,
      user.id,
      user
    )

    return createSuccessResponse({
      report: result.report,
      data: format === 'json' ? result.data : undefined,
      message: 'Financial report generated successfully'
    })
  } catch (error) {
    console.error('Financial report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate financial report' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(generateFinancialReport)