import { NextRequest, NextResponse } from 'next/server'
import { withUserManagement } from '@/lib/auth-middleware'
import { userManagementService } from '@/lib/user-management-service'
import { createSuccessResponse, validateObjectId } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/users/[id] - Get user profile
async function getUserHandler(
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

    // Users can only view their own profile unless they're admin
    if (user.role !== 'admin' && user.id !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const userProfile = await userManagementService.getUserProfile(userId)

    return createSuccessResponse({
      user: userProfile,
      canEdit: user.role === 'admin' || user.id === userId,
      canDelete: user.role === 'admin' && user.id !== userId
    })
  } catch (error) {
    console.error('Get user error:', error)
    
    if (error.message === 'User not found') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user
async function updateUserHandler(
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
    const { name, email, role, department, phone, employeeId, isActive } = body

    // Users can only update their own profile (limited fields)
    // Admins can update any user
    if (user.role !== 'admin' && user.id !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Prepare update data based on user permissions
    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (employeeId !== undefined) updateData.employeeId = employeeId

    // Only admins can change role, department, and active status
    if (user.role === 'admin') {
      if (role !== undefined) updateData.role = role
      if (department !== undefined) updateData.department = department
      if (isActive !== undefined) updateData.isActive = isActive
    }

    const updatedUser = await userManagementService.updateUserProfile(
      userId,
      updateData,
      user.id
    )

    return createSuccessResponse({
      user: updatedUser,
      message: 'User updated successfully'
    })
  } catch (error) {
    console.error('Update user error:', error)
    
    if (error.message === 'User not found') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    if (error.message.includes('already in use')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
async function deleteUserHandler(
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

    // Prevent self-deletion
    if (user.id === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    const result = await userManagementService.deleteUser(userId, user.id)

    return createSuccessResponse(result, result.message)
  } catch (error) {
    console.error('Delete user error:', error)
    
    if (error.message === 'User not found') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    if (error.message.includes('last active admin')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}

export const GET = withUserManagement(getUserHandler, 'read')
export const PUT = withUserManagement(updateUserHandler, 'update')
export const DELETE = withUserManagement(deleteUserHandler, 'delete')