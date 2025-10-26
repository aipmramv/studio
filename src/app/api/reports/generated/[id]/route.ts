import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { reportGenerationService } from '@/lib/report-generation'
import { createSuccessResponse, validateObjectId } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/reports/generated/[id] - Get specific generated report
async function getGeneratedReport(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id

    if (!validateObjectId(reportId)) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      )
    }

    const report = await reportGenerationService.getReportById(reportId, user)

    return createSuccessResponse({ report })
  } catch (error) {
    console.error('Get generated report error:', error)
    
    if (error.message === 'Report not found') {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }
    
    if (error.message === 'Access denied to this report') {
      return NextResponse.json(
        { error: 'Access denied to this report' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to get report' },
      { status: 500 }
    )
  }
}

// DELETE /api/reports/generated/[id] - Delete generated report
async function deleteGeneratedReport(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id

    if (!validateObjectId(reportId)) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      )
    }

    const result = await reportGenerationService.deleteReport(reportId, user)

    return createSuccessResponse(result)
  } catch (error) {
    console.error('Delete generated report error:', error)
    
    if (error.message === 'Report not found') {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }
    
    if (error.message === 'Access denied to this report') {
      return NextResponse.json(
        { error: 'Access denied to this report' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getGeneratedReport)
export const DELETE = withApiMiddleware(deleteGeneratedReport)