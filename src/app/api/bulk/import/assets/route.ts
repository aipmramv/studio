import { NextRequest, NextResponse } from 'next/server'
import { withAssetAccess } from '@/lib/auth-middleware'
import { bulkOperationsService } from '@/lib/bulk-operations-service'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

async function bulkImportAssetsHandler(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json()
    const { assets, options = {} } = body

    if (!Array.isArray(assets) || assets.length === 0) {
      return NextResponse.json(
        { error: 'Assets array is required and cannot be empty' },
        { status: 400 }
      )
    }

    if (assets.length > 10000) {
      return NextResponse.json(
        { error: 'Maximum 10,000 assets can be imported at once' },
        { status: 400 }
      )
    }

    // Validate user permissions for bulk import
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can perform bulk imports' },
        { status: 403 }
      )
    }

    const result = await bulkOperationsService.bulkImportAssets(
      assets,
      user.id,
      options
    )

    return createSuccessResponse({
      result,
      message: `Bulk import completed. ${result.successCount} assets imported successfully, ${result.errorCount} errors.`
    })
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { error: 'Failed to import assets' },
      { status: 500 }
    )
  }
}

export const POST = withAssetAccess(bulkImportAssetsHandler, 'create')