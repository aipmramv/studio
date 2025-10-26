import { NextRequest, NextResponse } from 'next/server'
import { withUserManagement } from '@/lib/auth-middleware'
import { userManagementService } from '@/lib/user-management-service'
import { createSuccessResponse, validateObjectId } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// POST /api/users/[id]/reset-password - Reset user password (admin only)
async function resetPasswordHandler(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    if (!validateObjectId(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { newPassword, generateTemporary = false } = body

    // Validate that either newPassword is provided or generateTemporary is true
    if (!newPassword && !generateTemporary) {
      return NextResponse.json(
        { error: 'Either provide newPassword or set generateTemporary to true' },
        { status: 400 }
      )
    }

    const result = await userManagementService.resetUserPassword(
      userId,
      newPassword,
      user.id
    )

    return createSuccessResponse(result, result.message)
  } catch (error) {
    console.error('Reset password error:', error)
    
    if (error.message === 'User not found') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}

export const POST = withUserManagement(resetPasswordHandler, 'update')