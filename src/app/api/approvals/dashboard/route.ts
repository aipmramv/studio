import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { approvalSystem } from '@/lib/approval-system'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/approvals/dashboard - Get approval dashboard data
async function getApprovalDashboardHandler(request: NextRequest, user: JWTPayload) {
  try {
    const dashboard = await approvalSystem.getApprovalDashboard(user.id)

    return createSuccessResponse({
      pendingApprovals: dashboard.pendingApprovals,
      overdueApprovals: dashboard.overdueApprovals,
      recentActions: dashboard.recentActions,
      statistics: dashboard.statistics,
      trends: dashboard.trends,
      userInfo: {
        id: user.id,
        role: user.role,
        department: user.department
      }
    })
  } catch (error) {
    console.error('Get approval dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to get approval dashboard' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getApprovalDashboardHandler)