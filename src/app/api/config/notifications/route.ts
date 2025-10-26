import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { configurationManagementService } from '@/lib/configuration-management'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/config/notifications - Get notification rules
async function getNotificationRules(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url)
    
    const category = searchParams.get('category') || undefined
    const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined

    const rules = await configurationManagementService.getNotificationRules(category, isActive)

    return createSuccessResponse({
      rules,
      total: rules.length,
      filters: { category, isActive }
    })
  } catch (error) {
    console.error('Get notification rules error:', error)
    return NextResponse.json(
      { error: 'Failed to get notification rules' },
      { status: 500 }
    )
  }
}

// POST /api/config/notifications - Create notification rule
async function createNotificationRule(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      category,
      eventType,
      conditions,
      actions,
      channels,
      priority,
      isActive,
      schedule,
      throttling,
      template
    } = body

    // Validate required fields
    if (!name || !category || !eventType || !actions || !channels) {
      return NextResponse.json(
        { error: 'Name, category, eventType, actions, and channels are required' },
        { status: 400 }
      )
    }

    // Check permissions (admin and spoc can create notification rules)
    if (!['admin', 'spoc'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create notification rules' },
        { status: 403 }
      )
    }

    const rule = await configurationManagementService.createNotificationRule(
      {
        name,
        description: description || '',
        category,
        eventType,
        conditions: conditions || [],
        actions,
        channels,
        priority: priority || 'medium',
        isActive: isActive !== false,
        schedule,
        throttling,
        template
      },
      user.id
    )

    return createSuccessResponse({
      rule,
      message: 'Notification rule created successfully'
    })
  } catch (error) {
    console.error('Create notification rule error:', error)
    return NextResponse.json(
      { error: 'Failed to create notification rule' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getNotificationRules)
export const POST = withApiMiddleware(createNotificationRule)