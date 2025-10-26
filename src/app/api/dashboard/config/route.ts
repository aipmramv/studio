import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { dashboardAnalyticsEngine } from '@/lib/dashboard-analytics'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/dashboard/config - Get user dashboard configurations
async function getDashboardConfigs(request: NextRequest, user: JWTPayload) {
  try {
    const configs = await dashboardAnalyticsEngine.getUserDashboardConfigs(user.id)

    return createSuccessResponse({
      configs,
      total: configs.length
    })
  } catch (error) {
    console.error('Get dashboard configs error:', error)
    return NextResponse.json(
      { error: 'Failed to get dashboard configurations' },
      { status: 500 }
    )
  }
}

// POST /api/dashboard/config - Save dashboard configuration
async function saveDashboardConfig(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json()
    const { name, layout, filters, refreshInterval, isDefault, isShared, sharedWith } = body

    if (!name || !layout) {
      return NextResponse.json(
        { error: 'Name and layout are required' },
        { status: 400 }
      )
    }

    const config = await dashboardAnalyticsEngine.saveDashboardConfig({
      userId: user.id,
      name,
      layout,
      filters: filters || {
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date(),
          preset: 'month'
        }
      },
      refreshInterval: refreshInterval || 300, // 5 minutes default
      isDefault: isDefault || false,
      isShared: isShared || false,
      sharedWith: sharedWith || []
    })

    return createSuccessResponse({
      config,
      message: 'Dashboard configuration saved successfully'
    })
  } catch (error) {
    console.error('Save dashboard config error:', error)
    return NextResponse.json(
      { error: 'Failed to save dashboard configuration' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getDashboardConfigs)
export const POST = withApiMiddleware(saveDashboardConfig)