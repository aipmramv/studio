import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { reportGenerationService } from '@/lib/report-generation'
import { createSuccessResponse, parsePaginationParams } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/reports/generated - Get list of generated reports
async function getGeneratedReports(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url)
    const { page, limit } = parsePaginationParams(searchParams)
    
    const filters = {
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      generatedBy: searchParams.get('generatedBy') || undefined,
      dateRange: searchParams.get('startDate') && searchParams.get('endDate') ? {
        start: new Date(searchParams.get('startDate')!),
        end: new Date(searchParams.get('endDate')!)
      } : undefined
    }

    const result = await reportGenerationService.getGeneratedReports(
      filters,
      user,
      { page, limit }
    )

    return createSuccessResponse(result)
  } catch (error) {
    console.error('Get generated reports error:', error)
    return NextResponse.json(
      { error: 'Failed to get generated reports' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getGeneratedReports)