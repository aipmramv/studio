import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { approvalSystem } from '@/lib/approval-system'
import { createSuccessResponse, parsePaginationParams, parseFilterParams } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/approvals - Get approval tasks
async function getApprovalsHandler(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(searchParams)
    const filters = parseFilterParams(searchParams)

    const result = await approvalSystem.getApprovalTasks(user.id, {
      status: filters.status,
      priority: filters.priority,
      overdue: filters.overdue,
      workflowCategory: filters.workflowCategory
    }, { page, limit })

    return createSuccessResponse({
      tasks: result.tasks,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit)
    })
  } catch (error) {
    console.error('Get approvals error:', error)
    return NextResponse.json(
      { error: 'Failed to get approval tasks' },
      { status: 500 }
    )
  }
}

// POST /api/approvals - Process approval
async function processApprovalHandler(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json()
    const {
      workflowId,
      stepId,
      action,
      comment,
      reason,
      delegateTo
    } = body

    // Validate required fields
    if (!workflowId || !stepId || !action) {
      return NextResponse.json(
        { error: 'Workflow ID, step ID, and action are required' },
        { status: 400 }
      )
    }

    const approvalRequest = {
      workflowId,
      stepId,
      action,
      comment,
      reason,
      delegateTo
    }

    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const result = await approvalSystem.processApproval(
      approvalRequest,
      user,
      clientIp,
      userAgent
    )

    return createSuccessResponse({
      success: result.success,
      workflow: result.workflow,
      nextStep: result.nextStep,
      notifications: result.notifications,
      message: `Approval ${action} processed successfully`
    })
  } catch (error) {
    console.error('Process approval error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage.includes('not authorized') ||
        errorMessage.includes('Invalid') ||
        errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getApprovalsHandler)
export const POST = withApiMiddleware(processApprovalHandler)