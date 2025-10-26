import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { masterDataManagementEngine } from '@/lib/master-data-management'
import { createSuccessResponse, validateObjectId } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// POST /api/masters/[type]/import - Import master data from file/array
async function importMasterData(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { type: string } }
) {
  try {
    const body = await request.json()
    const typeId = params.type
    const { data, options = {} } = body

    if (!validateObjectId(typeId)) {
      return NextResponse.json(
        { error: 'Invalid master data type ID' },
        { status: 400 }
      )
    }

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Data must be an array of objects' },
        { status: 400 }
      )
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'Data array cannot be empty' },
        { status: 400 }
      )
    }

    // Validate options
    const importOptions = {
      updateExisting: options.updateExisting || false,
      skipValidation: options.skipValidation || false,
      batchSize: options.batchSize || 100
    }

    // Limit batch size for performance
    if (importOptions.batchSize > 1000) {
      importOptions.batchSize = 1000
    }

    const result = await masterDataManagementEngine.importMasterData(
      typeId,
      data,
      user.id,
      importOptions,
      user
    )

    return createSuccessResponse({
      importResult: result,
      message: `Import completed: ${result.successfulImports} successful, ${result.failedImports} failed`
    })
  } catch (error) {
    console.error('Import master data error:', error)
    
    if (error.message === 'Master data type not found') {
      return NextResponse.json(
        { error: 'Master data type not found' },
        { status: 404 }
      )
    }
    
    if (error.message === 'Insufficient permissions to import master data') {
      return NextResponse.json(
        { error: 'Insufficient permissions to import master data' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to import master data' },
      { status: 500 }
    )
  }
}

export const POST = withApiMiddleware(importMasterData)