import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { configurationManagementService } from '@/lib/configuration-management'
import { createSuccessResponse, validateObjectId } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// PUT /api/config/notifications/[id] - Update notification rule
async function updateNotificationRule(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const ruleId = params.id

    if (!validateObjectId(ruleId)) {
      return NextResponse.json(
        { error: 'Invalid notification rule ID' },
        { status: 400 }
      )
    }

    // Check permissions (admin and spoc can update notification rules)
    if (!['admin', 'spoc'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update notification rules' },
        { status: 403 }
      )
    }

    const rule = await configurationManagementService.updateNotificationRule(
      ruleId,
      body,
      user.id
    )

    return createSuccessResponse({
      rule,
      message: 'Notification rule updated successfully'
    })
  } catch (error) {
    console.error('Update notification rule error:', error)
    
    if (error.message === 'Notification rule not found or no changes made') {
      return NextResponse.json(
        { error: 'Notification rule not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update notification rule' },
      { status: 500 }
    )
  }
}

// DELETE /api/config/notifications/[id] - Delete notification rule
async function deleteNotificationRule(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { id: string } }
) {
  try {
    const ruleId = params.id

    if (!validateObjectId(ruleId)) {
      return NextResponse.json(
        { error: 'Invalid notification rule ID' },
        { status: 400 }
      )
    }

    // Check permissions (admin only can delete notification rules)
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can delete notification rules' },
        { status: 403 }
      )
    }

    // Soft delete by setting isActive to false
    await configurationManagementService.updateNotificationRule(
      ruleId,
      { isActive: false },
      user.id
    )

    return createSuccessResponse({
      message: 'Notification rule deleted successfully'
    })
  } catch (error) {
    console.error('Delete notification rule error:', error)
    
    if (error.message === 'Notification rule not found or no changes made') {
      return NextResponse.json(
        { error: 'Notification rule not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete notification rule' },
      { status: 500 }
    )
  }
}

export const PUT = withApiMiddleware(updateNotificationRule)
export const DELETE = withApiMiddleware(deleteNotificationRule)