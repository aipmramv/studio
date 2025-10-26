import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { configurationManagementService } from '@/lib/configuration-management'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/config/system - Get system configurations
async function getSystemConfigurations(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url)
    
    const key = searchParams.get('key') || undefined
    const category = searchParams.get('category') || undefined
    const environment = searchParams.get('environment') || process.env.NODE_ENV || 'development'

    const configurations = await configurationManagementService.getSystemConfiguration(
      key,
      category,
      environment,
      user
    )

    return createSuccessResponse({
      configurations,
      total: configurations.length,
      environment,
      filters: { key, category }
    })
  } catch (error) {
    console.error('Get system configurations error:', error)
    return NextResponse.json(
      { error: 'Failed to get system configurations' },
      { status: 500 }
    )
  }
}

// POST /api/config/system - Create system configuration
async function createSystemConfiguration(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json()
    const {
      category,
      key,
      name,
      description,
      value,
      dataType,
      isEncrypted,
      isRequired,
      defaultValue,
      validation,
      environment,
      scope,
      permissions
    } = body

    // Validate required fields
    if (!category || !key || !name || !dataType) {
      return NextResponse.json(
        { error: 'Category, key, name, and dataType are required' },
        { status: 400 }
      )
    }

    // Check permissions (admin only)
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can create system configurations' },
        { status: 403 }
      )
    }

    const configuration = await configurationManagementService.createSystemConfiguration(
      {
        category,
        key,
        name,
        description: description || '',
        value,
        dataType,
        isEncrypted: isEncrypted || false,
        isRequired: isRequired || false,
        defaultValue,
        validation,
        environment: environment || 'all',
        scope: scope || 'global',
        permissions: permissions || {
          read: ['admin'],
          write: ['admin']
        },
        isActive: true
      },
      user.id,
      user
    )

    return createSuccessResponse({
      configuration,
      message: 'System configuration created successfully'
    })
  } catch (error) {
    console.error('Create system configuration error:', error)
    
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create system configuration' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getSystemConfigurations)
export const POST = withApiMiddleware(createSystemConfiguration)