import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { userManagementService } from '@/lib/user-management-service'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/auth/profile - Get current user profile
async function getProfileHandler(request: NextRequest, user: JWTPayload) {
  try {
    const userProfile = await userManagementService.getUserProfile(user.id)

    return createSuccessResponse({
      user: userProfile
    })
  } catch (error) {
    console.error('Get profile error:', error)
    
    if (error.message === 'User not found') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    )
  }
}

// PUT /api/auth/profile - Update current user profile
async function updateProfileHandler(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json()
    const { name, phone, employeeId } = body

    // Users can only update limited fields in their own profile
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (employeeId !== undefined) updateData.employeeId = employeeId

    const updatedUser = await userManagementService.updateUserProfile(
      user.id,
      updateData,
      user.id
    )

    return createSuccessResponse({
      user: updatedUser,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Update profile error:', error)
    
    if (error.message === 'User not found') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getProfileHandler)
export const PUT = withAuth(updateProfileHandler)