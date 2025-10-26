import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { masterDataManagementEngine } from '@/lib/master-data-management'
import { createSuccessResponse, validateObjectId } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/masters/[type]/entries/[id] - Get specific master data entry
async function getMasterDataEntry(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const entryId = params.id

    if (!validateObjectId(entryId)) {
      return NextResponse.json(
        { error: 'Invalid entry ID' },
        { status: 400 }
      )
    }

    const entry = await masterDataManagementEngine.getMasterDataEntry(entryId)

    return createSuccessResponse({ entry })
  } catch (error) {
    console.error('Get master data entry error:', error)
    
    if (error.message === 'Master data entry not found') {
      return NextResponse.json(
        { error: 'Master data entry not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to get master data entry' },
      { status: 500 }
    )
  }
}

// PUT /api/masters/[type]/entries/[id] - Update master data entry
async function updateMasterDataEntry(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const body = await request.json()
    const entryId = params.id
    const { reason, ...updates } = body

    if (!validateObjectId(entryId)) {
      return NextResponse.json(
        { error: 'Invalid entry ID' },
        { status: 400 }
      )
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Updates must be provided' },
        { status: 400 }
      )
    }

    const entry = await masterDataManagementEngine.updateMasterDataEntry(
      entryId,
      updates,
      user.id,
      reason,
      user
    )

    return createSuccessResponse({
      entry,
      message: 'Master data entry updated successfully'
    })
  } catch (error) {
    console.error('Update master data entry error:', error)
    
    if (error.message === 'Master data entry not found') {
      return NextResponse.json(
        { error: 'Master data entry not found' },
        { status: 404 }
      )
    }
    
    if (error.message === 'Insufficient permissions to update master data') {
      return NextResponse.json(
        { error: 'Insufficient permissions to update master data' },
        { status: 403 }
      )
    }
    
    if (error.message.includes('Validation failed')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    if (error.message === 'No changes detected') {
      return NextResponse.json(
        { error: 'No changes detected' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update master data entry' },
      { status: 500 }
    )
  }
}

// DELETE /api/masters/[type]/entries/[id] - Delete master data entry
async function deleteMasterDataEntry(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const entryId = params.id
    const { searchParams } = new URL(request.url)
    const reason = searchParams.get('reason')

    if (!validateObjectId(entryId)) {
      return NextResponse.json(
        { error: 'Invalid entry ID' },
        { status: 400 }
      )
    }

    const result = await masterDataManagementEngine.deleteMasterDataEntry(
      entryId,
      user.id,
      reason || undefined,
      user
    )

    return createSuccessResponse(result)
  } catch (error) {
    console.error('Delete master data entry error:', error)
    
    if (error.message === 'Master data entry not found') {
      return NextResponse.json(
        { error: 'Master data entry not found' },
        { status: 404 }
      )
    }
    
    if (error.message === 'Insufficient permissions to delete master data') {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete master data' },
        { status: 403 }
      )
    }
    
    if (error.message.includes('Cannot delete')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete master data entry' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getMasterDataEntry)
export const PUT = withApiMiddleware(updateMasterDataEntry)
export const DELETE = withApiMiddleware(deleteMasterDataEntry)