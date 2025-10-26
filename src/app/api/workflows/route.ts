import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { workflowEngine } from '@/lib/workflow-engine'
import { createSuccessResponse, parsePaginationParams, parseFilterParams } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/workflows - Get workflow instances
async function getWorkflowsHandler(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(searchParams)
    const filters = parseFilterParams(searchParams)

    // Build query based on user role and filters
    const query: any = {}

    // Role-based filtering
    if (user.role !== 'admin') {
      // Non-admin users can only see workflows they created or are assigned to
      query.$or = [
        { createdBy: user.id },
        { 'steps.assignedTo': user.id },
        { 'steps.assignedTo': user.role },
        { 'steps.assignedTo': user.department }
      ]
    }

    // Apply filters
    if (filters.status) query.status = filters.status
    if (filters.templateId) query.templateId = filters.templateId
    if (filters.contextType) query.contextType = filters.contextType
    if (filters.contextId) query.contextId = filters.contextId
    if (filters.priority) query.priority = filters.priority
    if (filters.createdBy) query.createdBy = filters.createdBy

    // Date range filter
    if (filters.startDate || filters.endDate) {
      query.createdAt = {}
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate)
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate)
    }

    const result = await workflowEngine.getWorkflows({
      query,
      page,
      limit,
      skip,
      sortBy: filters.sortBy || 'createdAt',
      sortOrder: filters.sortOrder || 'desc'
    })

    return createSuccessResponse({
      workflows: result.workflows,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
      userPermissions: {
        canCreate: ['admin', 'spoc'].includes(user.role),
        canManage: user.role === 'admin'
      }
    })
  } catch (error) {
    console.error('Get workflows error:', error)
    return NextResponse.json(
      { error: 'Failed to get workflows' },
      { status: 500 }
    )
  }
}

// POST /api/workflows - Start new workflow
async function startWorkflowHandler(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json()
    const {
      templateId,
      contextType,
      contextId,
      contextData,
      priority = 'medium',
      dueDate,
      notes
    } = body

    // Validate required fields
    if (!templateId || !contextType || !contextId) {
      return NextResponse.json(
        { error: 'Template ID, context type, and context ID are required' },
        { status: 400 }
      )
    }

    // Check permissions
    if (!['admin', 'spoc', 'user'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to start workflows' },
        { status: 403 }
      )
    }

    const startRequest = {
      templateId,
      contextType,
      contextId,
      contextData: contextData || {},
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes
    }

    const result = await workflowEngine.startWorkflow(startRequest, user.id)

    return createSuccessResponse({
      workflow: result.workflow,
      message: result.message
    }, 'Workflow started successfully', 201)
  } catch (error) {
    console.error('Start workflow error:', error)
    
    if (error.message.includes('Template not found') || 
        error.message.includes('Invalid') ||
        error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to start workflow' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getWorkflowsHandler)
export const POST = withApiMiddleware(startWorkflowHandler)