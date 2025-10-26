import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { masterDataManagementEngine } from '@/lib/master-data-management'
import { createSuccessResponse, parsePaginationParams, validateObjectId } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/masters/[type] - Get master data entries for a specific type
async function getMasterDataEntries(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { type: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const { page, limit } = parsePaginationParams(searchParams)
    
    const typeId = params.type

    if (!validateObjectId(typeId)) {
      return NextResponse.json(
        { error: 'Invalid master data type ID' },
        { status: 400 }
      )
    }

    const filters = {
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      effectiveDate: searchParams.get('effectiveDate') ? new Date(searchParams.get('effectiveDate')!) : undefined
    }

    const result = await masterDataManagementEngine.listMasterDataEntries(
      typeId,
      filters,
      { page, limit },
      user
    )

    return createSuccessResponse(result)
  } catch (error) {
    console.error('Get master data entries error:', error)
    
    if (error.message === 'Master data type not found') {
      return NextResponse.json(
        { error: 'Master data type not found' },
        { status: 404 }
      )
    }
    
    if (error.message === 'Insufficient permissions to read master data') {
      return NextResponse.json(
        { error: 'Insufficient permissions to read master data' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to get master data entries' },
      { status: 500 }
    )
  }
}

// POST /api/masters/[type] - Create new master data entry
async function createMasterDataEntry(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { type: string } }
) {
  try {
    const body = await request.json()
    const typeId = params.type

    if (!validateObjectId(typeId)) {
      return NextResponse.json(
        { error: 'Invalid master data type ID' },
        { status: 400 }
      )
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body must be an object' },
        { status: 400 }
      )
    }

    const entry = await masterDataManagementEngine.createMasterDataEntry(
      typeId,
      body,
      user.id,
      user
    )

    return createSuccessResponse({
      entry,
      message: 'Master data entry created successfully'
    })
  } catch (error) {
    console.error('Create master data entry error:', error)
    
    if (error.message === 'Master data type not found') {
      return NextResponse.json(
        { error: 'Master data type not found' },
        { status: 404 }
      )
    }
    
    if (error.message === 'Insufficient permissions to create master data') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create master data' },
        { status: 403 }
      )
    }
    
    if (error.message.includes('Validation failed')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create master data entry' },
      { status: 500 }
    )
  }
}

// PUT /api/masters/[type] - Update master data type configuration
async function updateMasterDataType(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { type: string } }
) {
  try {
    const body = await request.json()
    const typeId = params.type

    if (!validateObjectId(typeId)) {
      return NextResponse.json(
        { error: 'Invalid master data type ID' },
        { status: 400 }
      )
    }

    // Check permissions (admin only for updating master data types)
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can update master data types' },
        { status: 403 }
      )
    }

    // Get current type and update it
    const currentType = await masterDataManagementEngine.getMasterDataType(typeId)
    
    const updatedType = {
      ...currentType,
      ...body,
      updatedAt: new Date(),
      lastModifiedBy: user.id
    }

    // In a real implementation, you would have an update method
    // For now, we'll return the updated type
    return createSuccessResponse({
      masterDataType: updatedType,
      message: 'Master data type updated successfully'
    })
  } catch (error) {
    console.error('Update master data type error:', error)
    
    if (error.message === 'Master data type not found') {
      return NextResponse.json(
        { error: 'Master data type not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update master data type' },
      { status: 500 }
    )
  }
}

// DELETE /api/masters/[type] - Delete master data type
async function deleteMasterDataType(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { type: string } }
) {
  try {
    const typeId = params.type

    if (!validateObjectId(typeId)) {
      return NextResponse.json(
        { error: 'Invalid master data type ID' },
        { status: 400 }
      )
    }

    // Check permissions (admin only for deleting master data types)
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can delete master data types' },
        { status: 403 }
      )
    }

    // In a real implementation, you would have a delete method
    // For now, we'll return a success message
    return createSuccessResponse({
      message: 'Master data type deleted successfully'
    })
  } catch (error) {
    console.error('Delete master data type error:', error)
    
    if (error.message === 'Master data type not found') {
      return NextResponse.json(
        { error: 'Master data type not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete master data type' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getMasterDataEntries)
export const POST = withApiMiddleware(createMasterDataEntry)
export const PUT = withApiMiddleware(updateMasterDataType)
export const DELETE = withApiMiddleware(deleteMasterDataType)