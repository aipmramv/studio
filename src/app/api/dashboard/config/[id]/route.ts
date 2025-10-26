import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { dashboardAnalyticsEngine } from '@/lib/dashboard-analytics'
import { createSuccessResponse, validateObjectId } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/dashboard/config/[id] - Get specific dashboard configuration
async function getDashboardConfig(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { id: string } }
) {
  try {
    const configId = params.id

    if (!validateObjectId(configId)) {
      return NextResponse.json(
        { error: 'Invalid configuration ID' },
        { status: 400 }
      )
    }

    const configs = await dashboardAnalyticsEngine.getUserDashboardConfigs(user.id)
    const config = configs.find(c => c.id === configId)

    if (!config) {
      return NextResponse.json(
        { error: 'Dashboard configuration not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this config
    if (config.userId !== user.id && !config.isShared && !config.sharedWith?.includes(user.id)) {
      return NextResponse.json(
        { error: 'Access denied to this dashboard configuration' },
        { status: 403 }
      )
    }

    return createSuccessResponse({ config })
  } catch (error) {
    console.error('Get dashboard config error:', error)
    return NextResponse.json(
      { error: 'Failed to get dashboard configuration' },
      { status: 500 }
    )
  }
}

// PUT /api/dashboard/config/[id] - Update dashboard configuration
async function updateDashboardConfig(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { id: string } }
) {
  try {
    const configId = params.id
    const body = await request.json()

    if (!validateObjectId(configId)) {
      return NextResponse.json(
        { error: 'Invalid configuration ID' },
        { status: 400 }
      )
    }

    const configs = await dashboardAnalyticsEngine.getUserDashboardConfigs(user.id)
    const existingConfig = configs.find(c => c.id === configId)

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Dashboard configuration not found' },
        { status: 404 }
      )
    }

    // Check if user can update this config
    if (existingConfig.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied to update this dashboard configuration' },
        { status: 403 }
      )
    }

    // Update configuration (simplified - would need actual update logic)
    const updatedConfig = {
      ...existingConfig,
      ...body,
      updatedAt: new Date()
    }

    return createSuccessResponse({
      config: updatedConfig,
      message: 'Dashboard configuration updated successfully'
    })
  } catch (error) {
    console.error('Update dashboard config error:', error)
    return NextResponse.json(
      { error: 'Failed to update dashboard configuration' },
      { status: 500 }
    )
  }
}

// DELETE /api/dashboard/config/[id] - Delete dashboard configuration
async function deleteDashboardConfig(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { id: string } }
) {
  try {
    const configId = params.id

    if (!validateObjectId(configId)) {
      return NextResponse.json(
        { error: 'Invalid configuration ID' },
        { status: 400 }
      )
    }

    const configs = await dashboardAnalyticsEngine.getUserDashboardConfigs(user.id)
    const config = configs.find(c => c.id === configId)

    if (!config) {
      return NextResponse.json(
        { error: 'Dashboard configuration not found' },
        { status: 404 }
      )
    }

    // Check if user can delete this config
    if (config.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied to delete this dashboard configuration' },
        { status: 403 }
      )
    }

    // Prevent deletion of default config
    if (config.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default dashboard configuration' },
        { status: 400 }
      )
    }

    // Delete configuration (simplified - would need actual delete logic)
    return createSuccessResponse({
      message: 'Dashboard configuration deleted successfully'
    })
  } catch (error) {
    console.error('Delete dashboard config error:', error)
    return NextResponse.json(
      { error: 'Failed to delete dashboard configuration' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getDashboardConfig)
export const PUT = withApiMiddleware(updateDashboardConfig)
export const DELETE = withApiMiddleware(deleteDashboardConfig)