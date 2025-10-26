import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { workflowEngine } from '@/lib/workflow-engine'
import { createSuccessResponse, validateObjectId } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/workflows/[id] - Get workflow details
async function getWorkflowHandler(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id

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

    // Get workflow history
    const history = await workflowEngine.getWorkflowHistory(workflowId)

    return createSuccessResponse({
      workflow,
      history,
      userPermissions: {
        canPerformActions: workflow.steps.some(step => 
          step.status === 'pending' && (
            step.assignedTo.includes(user.id) ||
            step.assignedTo.includes(user.role) ||
            step.assignedTo.includes(user.department)
          )
        ),
        canCancel: user.role === 'admin' || workflow.createdBy === user.id,
        canReassign: user.role === 'admin'
      }
    })
  } catch (error) {
    console.error('Get workflow error:', error)
    return NextResponse.json(
      { error: 'Failed to get workflow' },
      { status: 500 }
    )
  }
}

// PUT /api/workflows/[id] - Update workflow
async function updateWorkflowHandler(
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

    const workflow = await workflowEngine.getWorkflowById(workflowId)

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (user.role !== 'admin' && workflow.createdBy !== user.id) {
      return NextResponse.json(
        { error: 'Only workflow creator or admin can update workflow' },
        { status: 403 }
      )
    }

    const { priority, dueDate, notes, metadata } = body

    const updateData: any = {}
    if (priority) updateData.priority = priority
    if (dueDate) updateData.dueDate = new Date(dueDate)
    if (notes) updateData.notes = notes
    if (metadata) updateData.metadata = { ...workflow.metadata, ...metadata }

    const result = await workflowEngine.updateWorkflow(workflowId, updateData, user.id)

    return createSuccessResponse({
      workflow: result.workflow,
      message: 'Workflow updated successfully'
    })
  } catch (error) {
    console.error('Update workflow error:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    )
  }
}

// DELETE /api/workflows/[id] - Cancel workflow
async function cancelWorkflowHandler(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id

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
    if (user.role !== 'admin' && workflow.createdBy !== user.id) {
      return NextResponse.json(
        { error: 'Only workflow creator or admin can cancel workflow' },
        { status: 403 }
      )
    }

    // Can only cancel active workflows
    if (workflow.status !== 'active') {
      return NextResponse.json(
        { error: 'Can only cancel active workflows' },
        { status: 400 }
      )
    }

    const { reason } = await request.json()

    const result = await workflowEngine.cancelWorkflow(workflowId, user.id, reason)

    return createSuccessResponse({
      workflow: result.workflow,
      message: 'Workflow cancelled successfully'
    })
  } catch (error) {
    console.error('Cancel workflow error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel workflow' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getWorkflowHandler)
export const PUT = withApiMiddleware(updateWorkflowHandler)
export const DELETE = withApiMiddleware(cancelWorkflowHandler)