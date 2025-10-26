import { NextRequest, NextResponse } from 'next/server'
import { withWorkflowAccess } from '@/lib/auth-middleware'
import { workflowEngine } from '@/lib/workflow-engine'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/workflows/templates - Get workflow templates
async function getTemplatesHandler(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    const templates = await workflowEngine.getTemplates(activeOnly)

    return createSuccessResponse({
      templates,
      userPermissions: {
        canCreate: user.role === 'admin',
        canEdit: user.role === 'admin',
        canDelete: user.role === 'admin'
      }
    })
  } catch (error) {
    console.error('Get templates error:', error)
    return NextResponse.json(
      { error: 'Failed to get workflow templates' },
      { status: 500 }
    )
  }
}

// POST /api/workflows/templates - Create workflow template (admin only)
async function createTemplateHandler(request: NextRequest, user: JWTPayload) {
  try {
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can create workflow templates' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { type, name, description, steps } = body

    if (!type || !name || !steps || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: 'Type, name, and steps array are required' },
        { status: 400 }
      )
    }

    const template = {
      type,
      name,
      description,
      steps,
      isActive: true
    }

    const templateId = await workflowEngine.createTemplate(template, user.id)

    return createSuccessResponse({
      templateId,
      message: 'Workflow template created successfully'
    }, 'Workflow template created successfully', 201)
  } catch (error) {
    console.error('Create template error:', error)
    
    if (error.message.includes('Duplicate') || error.message.includes('required')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create workflow template' },
      { status: 500 }
    )
  }
}

export const GET = withWorkflowAccess(getTemplatesHandler, 'read')
export const POST = withWorkflowAccess(createTemplateHandler, 'create')