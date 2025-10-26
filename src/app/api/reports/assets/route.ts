import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { reportGenerationService } from '@/lib/report-generation'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'
import { ReportFilters } from '@/lib/report-generation'

// GET /api/reports/assets - Generate asset register report
async function generateAssetReport(request: NextRequest, user: JWTPayload) {
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
      assetCategories: searchParams.get('categories')?.split(',').filter(Boolean),
      statuses: searchParams.get('statuses')?.split(',').filter(Boolean),
      valueRange: searchParams.get('minValue') && searchParams.get('maxValue') ? {
        min: parseFloat(searchParams.get('minValue')!),
        max: parseFloat(searchParams.get('maxValue')!)
      } : undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean)
    }

    const format = (searchParams.get('format') as 'pdf' | 'excel' | 'csv' | 'json') || 'json'
    const reportType = searchParams.get('type') || 'register'

    let result

    switch (reportType) {
      case 'register':
        result = await reportGenerationService.generateAssetRegisterReport(
          filters,
          format,
          user.id,
          user
        )
        break
      case 'verification':
        result = await reportGenerationService.generateVerificationReport(
          filters,
          format,
          user.id,
          user
        )
        break
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    return createSuccessResponse({
      report: result.report,
      data: format === 'json' ? result.data : undefined,
      message: 'Report generated successfully'
    })
  } catch (error) {
    console.error('Asset report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate asset report' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(generateAssetReport)