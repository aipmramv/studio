import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/api-utils'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { analyticsService } from '@/lib/analytics-service'

// GET /api/reports/exceptions/incomplete - Get incomplete records report
async function getIncompleteRecordsReportHandler(request: NextRequest, user: any) {
  // Get incomplete records report
  const report = await analyticsService.getIncompleteRecordsReport()

  // Filter by department for non-admin users
  if (user.role !== 'admin') {
    report.assets = report.assets.filter(asset => asset.department === user.department)
    
    // Recalculate summary for filtered data
    report.summary = {
      totalAssets: report.assets.length,
      incompleteAssets: report.assets.length,
      averageCompletion: report.assets.length > 0 
        ? report.assets.reduce((acc, asset) => acc + asset.completionPercentage, 0) / report.assets.length
        : 0,
    }
  }

  return createSuccessResponse(report)
}

export const GET = withApiMiddleware(getIncompleteRecordsReportHandler)