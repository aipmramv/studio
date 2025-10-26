import { NextRequest, NextResponse } from 'next/server'
import { withUserManagement } from '@/lib/auth-middleware'
import { userManagementService } from '@/lib/user-management-service'
import { createSuccessResponse, validateObjectId, parsePaginationParams, parseFilterParams } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/users/[id]/activity - Get user activity log
async function getUserActivityHandler(
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

    // Users can only view their own activity unless they're admin
    if (user.role !== 'admin' && user.id !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const { page, limit } = parsePaginationParams(searchParams)
    const filters = parseFilterParams(searchParams)

    const activityFilters: any = {
      page,
      limit
    }

    if (filters.action) activityFilters.action = filters.action
    if (filters.startDate) activityFilters.startDate = new Date(filters.startDate)
    if (filters.endDate) activityFilters.endDate = new Date(filters.endDate)

    const result = await userManagementService.getUserActivity(userId, activityFilters)

    return createSuccessResponse(result)
  } catch (error) {
    console.error('Get user activity error:', error)
    return NextResponse.json(
      { error: 'Failed to get user activity' },
      { status: 500 }
    )
  }
}

export const GET = withUserManagement(getUserActivityHandler, 'read')