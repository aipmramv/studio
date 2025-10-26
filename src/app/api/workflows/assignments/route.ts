import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { workflowEngine } from '@/lib/workflow-engine'
import { createSuccessResponse, parsePaginationParams, parseFilterParams } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/workflows/assignments - Get user's workflow assignments
async function getAssignmentsHandler(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(searchParams)
    const filters = parseFilterParams(searchParams)

    // Build query for user's assignments
    const query: any = {
      status: 'active',
      'steps.status': 'pending',
      $or: [
        { 'steps.assignedTo': user.id },
        { 'steps.assignedTo': user.role },
        { 'steps.assignedTo': user.department }
      ]
    }

    // Apply additional filters
    if (filters.priority) query.priority = filters.priority
    if (filters.templateId) query.templateId = filters.templateId
    if (filters.contextType) query.contextType = filters.contextType

    // Date range filter for due dates
    if (filters.dueBefore) {
      query.dueDate = { $lte: new Date(filters.dueBefore) }
    }

    const result = await workflowEngine.getUserAssignments(user, {
      query,
      page,
      limit,
      skip,
      sortBy: filters.sortBy || 'dueDate',
      sortOrder: filters.sortOrder || 'asc'
    })

    // Calculate assignment statistics
    const stats = await workflowEngine.getAssignmentStats(user)

    return createSuccessResponse({
      assignments: result.assignments,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
      statistics: {
        totalPending: stats.totalPending,
        overdue: stats.overdue,
        dueToday: stats.dueToday,
        dueThisWeek: stats.dueThisWeek,
        byPriority: stats.byPriority,
        byType: stats.byType
      }
    })
  } catch (error) {
    console.error('Get assignments error:', error)
    return NextResponse.json(
      { error: 'Failed to get workflow assignments' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getAssignmentsHandler)