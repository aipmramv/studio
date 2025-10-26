import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { configurationManagementService } from '@/lib/configuration-management'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/config/workflows - Get workflow template configurations
async function getWorkflowTemplateConfigs(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url)
    
    const category = searchParams.get('category') || undefined
    const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined

    const configs = await configurationManagementService.getWorkflowTemplateConfigs(category, isActive)

    return createSuccessResponse({
      configs,
      total: configs.length,
      filters: { category, isActive }
    })
  } catch (error) {
    console.error('Get workflow template configs error:', error)
    return NextResponse.json(
      { error: 'Failed to get workflow template configurations' },
      { status: 500 }
    )
  }
}

// POST /api/config/workflows - Create workflow template configuration
async function createWorkflowTemplateConfig(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      category,
      isDefault,
      configuration,
      permissions,
      isActive
    } = body

    // Validate required fields
    if (!name || !category || !configuration) {
      return NextResponse.json(
        { error: 'Name, category, and configuration are required' },
        { status: 400 }
      )
    }

    // Check permissions (admin only)
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can create workflow template configurations' },
        { status: 403 }
      )
    }

    const config = await configurationManagementService.createWorkflowTemplateConfig(
      {
        name,
        description: description || '',
        category,
        isDefault: isDefault || false,
        configuration,
        permissions: permissions || {
          canUse: ['admin', 'spoc'],
          canModify: ['admin']
        },
        isActive: isActive !== false
      },
      user.id
    )

    return createSuccessResponse({
      config,
      message: 'Workflow template configuration created successfully'
    })
  } catch (error) {
    console.error('Create workflow template config error:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow template configuration' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getWorkflowTemplateConfigs)
export const POST = withApiMiddleware(createWorkflowTemplateConfig)