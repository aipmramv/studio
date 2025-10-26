import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { masterDataManagementEngine } from '@/lib/master-data-management'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/masters - Get all master data types
async function getMasterDataTypes(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      category: searchParams.get('category') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined
    }

    const masterDataTypes = await masterDataManagementEngine.listMasterDataTypes(filters)

    return createSuccessResponse({
      masterDataTypes,
      total: masterDataTypes.length,
      filters
    })
  } catch (error) {
    console.error('Get master data types error:', error)
    return NextResponse.json(
      { error: 'Failed to get master data types' },
      { status: 500 }
    )
  }
}

// POST /api/masters - Create new master data type
async function createMasterDataType(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      category,
      collection,
      schema,
      validation,
      permissions,
      versioning
    } = body

    // Validate required fields
    if (!name || !description || !category || !collection || !schema) {
      return NextResponse.json(
        { error: 'Name, description, category, collection, and schema are required' },
        { status: 400 }
      )
    }

    // Check permissions (admin only for creating master data types)
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can create master data types' },
        { status: 403 }
      )
    }

    // Validate category
    if (!['system', 'business', 'reference'].includes(category)) {
      return NextResponse.json(
        { error: 'Category must be system, business, or reference' },
        { status: 400 }
      )
    }

    const masterDataType = await masterDataManagementEngine.registerMasterDataType(
      {
        name,
        description,
        category,
        collection,
        schema,
        validation: validation || {
          businessRules: [],
          referentialIntegrity: [],
          customValidators: []
        },
        permissions: permissions || {
          read: ['admin', 'spoc', 'user'],
          create: ['admin', 'spoc'],
          update: ['admin', 'spoc'],
          delete: ['admin'],
          export: ['admin', 'spoc'],
          import: ['admin']
        },
        versioning: versioning || {
          enabled: true,
          maxVersions: 10,
          trackFields: [],
          retentionDays: 365
        },
        isActive: true
      },
      user.id
    )

    return createSuccessResponse({
      masterDataType,
      message: 'Master data type created successfully'
    })
  } catch (error) {
    console.error('Create master data type error:', error)
    return NextResponse.json(
      { error: 'Failed to create master data type' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getMasterDataTypes)
export const POST = withApiMiddleware(createMasterDataType)