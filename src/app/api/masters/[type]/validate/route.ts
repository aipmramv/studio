import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { masterDataManagementEngine } from '@/lib/master-data-management'
import { createSuccessResponse, validateObjectId } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// POST /api/masters/[type]/validate - Validate master data entry
async function validateMasterData(
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

    // Get master data type
    const masterDataType = await masterDataManagementEngine.getMasterDataType(typeId)

    // Validate the data
    const validation = await masterDataManagementEngine.validateMasterData(body, masterDataType)

    return createSuccessResponse({
      validation,
      data: body,
      message: validation.isValid ? 'Validation passed' : 'Validation failed'
    })
  } catch (error) {
    console.error('Validate master data error:', error)
    
    if (error.message === 'Master data type not found') {
      return NextResponse.json(
        { error: 'Master data type not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to validate master data' },
      { status: 500 }
    )
  }
}

export const POST = withApiMiddleware(validateMasterData)