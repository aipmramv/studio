import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { workflowEngine } from '@/lib/workflow-engine'
import { createSuccessResponse, validateObjectId, parsePaginationParams } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/workflows/[id]/history - Get workflow history
async function getWorkflowHistoryHandler(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id
    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(searchParams)

    if (!validateObjectId(workflowId)) {
      return NextResponse.json(
        { error: 'Invalid workflow ID' },
        { status: 400 }
      )
    }

    const workflow = await workflowEngine.getWorkflowById(workflowId)

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const canView = user.role === 'admin' || 
                   workflow.createdBy === user.id ||
                   workflow.steps.some(step => 
                     step.assignedTo.includes(user.id) ||
                     step.assignedTo.includes(user.role) ||
                     step.assignedTo.includes(user.department)
                   )

    if (!canView) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get detailed history with pagination
    const result = await workflowEngine.getWorkflowHistory(workflowId, {
      page,
      limit,
      skip,
      includeSystemEvents: searchParams.get('includeSystem') === 'true'
    })

    return createSuccessResponse({
      history: result.history,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
      workflow: {
        id: workflow.id,
        status: workflow.status,
        currentStep: workflow.currentStepOrder,
        totalSteps: workflow.steps.length
      }
    })
  } catch (error) {
    console.error('Get workflow history error:', error)
    return NextResponse.json(
      { error: 'Failed to get workflow history' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getWorkflowHistoryHandler)