import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { configurationManagementService } from '@/lib/configuration-management'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/config/system/[key] - Get specific system configuration
async function getSystemConfiguration(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { key: string } }
) {
  try {
    const key = params.key
    const { searchParams } = new URL(request.url)
    const environment = searchParams.get('environment') || process.env.NODE_ENV || 'development'

    const configurations = await configurationManagementService.getSystemConfiguration(
      key,
      undefined,
      environment,
      user
    )

    if (configurations.length === 0) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      )
    }

    return createSuccessResponse({
      configuration: configurations[0]
    })
  } catch (error) {
    console.error('Get system configuration error:', error)
    return NextResponse.json(
      { error: 'Failed to get system configuration' },
      { status: 500 }
    )
  }
}

// PUT /api/config/system/[key] - Update system configuration
async function updateSystemConfiguration(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { key: string } }
) {
  try {
    const body = await request.json()
    const key = params.key
    const { value } = body

    if (value === undefined) {
      return NextResponse.json(
        { error: 'Value is required' },
        { status: 400 }
      )
    }

    const configuration = await configurationManagementService.updateSystemConfiguration(
      key,
      value,
      user.id,
      user
    )

    return createSuccessResponse({
      configuration,
      message: 'System configuration updated successfully'
    })
  } catch (error) {
    console.error('Update system configuration error:', error)
    
    if (error.message === 'Configuration key not found') {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      )
    }
    
    if (error.message === 'Insufficient permissions to update this configuration') {
      return NextResponse.json(
        { error: 'Insufficient permissions to update this configuration' },
        { status: 403 }
      )
    }
    
    if (error.message.includes('Value')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update system configuration' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getSystemConfiguration)
export const PUT = withApiMiddleware(updateSystemConfiguration)