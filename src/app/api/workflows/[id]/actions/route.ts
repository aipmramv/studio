import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { workflowEngine } from '@/lib/workflow-engine'
import { createSuccessResponse, validateObjectId } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// POST /api/workflows/[id]/actions - Perform workflow action
async function performActionHandler(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id
    const body = await request.json()

    if (!validateObjectId(workflowId)) {
      return NextResponse.json(
        { error: 'Invalid workflow ID' },
        { status: 400 }
      )
    }

    const {
      stepId,
      action,
      comment,
      reason,
      data,
      reassignTo,
      delegateTo
    } = body

    // Validate required fields
    if (!stepId || !action) {
      return NextResponse.json(
        { error: 'Step ID and action are required' },
        { status: 400 }
      )
    }

    // Validate action type
    const validActions = ['approve', 'reject', 'complete', 'reassign', 'delegate', 'request_info']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
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

    // Find the step
    const step = workflow.steps.find(s => s.id === stepId)
    if (!step) {
      return NextResponse.json(
        { error: 'Step not found' },
        { status: 404 }
      )
    }

    // Check if user can perform this action
    const canPerformAction = user.role === 'admin' ||
                           step.assignedTo.includes(user.id) ||
                           step.assignedTo.includes(user.role) ||
                           step.assignedTo.includes(user.department)

    if (!canPerformAction) {
      return NextResponse.json(
        { error: 'You are not authorized to perform this action' },
        { status: 403 }
      )
    }

    // Check if step is in correct status
    if (step.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only perform actions on pending steps' },
        { status: 400 }
      )
    }

    // Build action request
    const actionRequest: any = {
      action,
      comment,
      reason,
      data
    }

    if (action === 'reassign' && reassignTo) {
      actionRequest.reassignTo = Array.isArray(reassignTo) ? reassignTo : [reassignTo]
    }

    if (action === 'delegate' && delegateTo) {
      actionRequest.delegateTo = Array.isArray(delegateTo) ? delegateTo : [delegateTo]
    }

    const result = await workflowEngine.performAction(
      workflowId,
      stepId,
      actionRequest,
      user.id
    )

    return createSuccessResponse({
      workflow: result.workflow,
      nextStep: result.nextStep,
      notifications: result.notifications,
      message: `Action '${action}' performed successfully`
    })
  } catch (error) {
    console.error('Perform action error:', error)
    
    if (error.message.includes('not authorized') ||
        error.message.includes('Invalid') ||
        error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    )
  }
}

export const POST = withApiMiddleware(performActionHandler)