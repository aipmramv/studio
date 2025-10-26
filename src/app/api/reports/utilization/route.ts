import { NextRequest } from 'next/server'
import { createSuccessResponse, parseFilterParams } from '@/lib/api-utils'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { analyticsService } from '@/lib/analytics-service'

// GET /api/reports/utilization - Get utilization report
async function getUtilizationReportHandler(request: NextRequest, user: any) {
  const { searchParams } = new URL(request.url)
  const filters = parseFilterParams(searchParams)

  // Apply role-based filtering
  const reportFilters: any = {}
  
  if (user.role !== 'admin') {
    reportFilters.department = user.department
  } else {
    if (filters.department) reportFilters.department = filters.department
  }

  if (filters.classification) reportFilters.classification = filters.classification
  if (filters.timeRange) reportFilters.timeRange = filters.timeRange as 'week' | 'month' | 'quarter' | 'year'

  // Get utilization report
  const report = await analyticsService.getUtilizationReport(reportFilters)

  return createSuccessResponse(report)
}

export const GET = withApiMiddleware(getUtilizationReportHandler)