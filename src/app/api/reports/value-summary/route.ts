import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/api-utils'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { analyticsService } from '@/lib/analytics-service'

// GET /api/reports/value-summary - Get asset value summary report
async function getValueSummaryReportHandler(request: NextRequest, user: any) {
  const { searchParams } = new URL(request.url)
  const groupBy = (searchParams.get('groupBy') as 'department' | 'classification') || 'department'

  // Get asset value summary
  const report = await analyticsService.getAssetValueSummary(groupBy)

  // Filter by department for non-admin users
  if (user.role !== 'admin' && groupBy === 'department') {
    report.groups = report.groups.filter(group => group.name === user.department)
    
    // Recalculate totals for filtered data
    const filteredTotal = report.groups.reduce((acc, group) => ({
      totalValue: acc.totalValue + group.totalValue,
      totalAssets: acc.totalAssets + group.assetCount,
      averageValue: 0, // Will be calculated below
    }), { totalValue: 0, totalAssets: 0, averageValue: 0 })

    filteredTotal.averageValue = filteredTotal.totalAssets > 0 
      ? filteredTotal.totalValue / filteredTotal.totalAssets 
      : 0

    report.total = filteredTotal

    // Recalculate percentages
    report.groups = report.groups.map(group => ({
      ...group,
      percentage: report.total.totalValue > 0 ? (group.totalValue / report.total.totalValue) * 100 : 0,
    }))
  }

  return createSuccessResponse(report)
}

export const GET = withApiMiddleware(getValueSummaryReportHandler)