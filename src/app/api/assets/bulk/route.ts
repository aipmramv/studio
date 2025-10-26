import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/api-utils'
import { withAdminOnly } from '@/lib/auth-middleware'
import { assetService } from '@/lib/mongodb-service'
import { AssetManagementSchema } from '@/lib/schemas'

// POST /api/assets/bulk - Bulk create assets (admin only)
async function bulkCreateAssetsHandler(request: NextRequest, user: any) {
  const { assets } = await request.json()

  if (!Array.isArray(assets) || assets.length === 0) {
    throw new Error('Assets array is required and must not be empty')
  }

  if (assets.length > 100) {
    throw new Error('Cannot create more than 100 assets at once')
  }

  const results = []
  const errors = []

  for (let i = 0; i < assets.length; i++) {
    try {
      // Validate each asset
      const validatedAsset = AssetManagementSchema.parse(assets[i])
      
      // Create asset
      const assetId = await assetService.createAsset(validatedAsset, user.id)
      results.push({ index: i, assetId, status: 'success' })
    } catch (error) {
      errors.push({ 
        index: i, 
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      })
    }
  }

  return createSuccessResponse({
    totalProcessed: assets.length,
    successful: results.length,
    failed: errors.length,
    results,
    errors,
  }, `Bulk operation completed: ${results.length} successful, ${errors.length} failed`)
}

// PUT /api/assets/bulk - Bulk update assets (admin only)
async function bulkUpdateAssetsHandler(request: NextRequest, user: any) {
  const { updates } = await request.json()

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new Error('Updates array is required and must not be empty')
  }

  if (updates.length > 100) {
    throw new Error('Cannot update more than 100 assets at once')
  }

  const results = []
  const errors = []

  for (let i = 0; i < updates.length; i++) {
    try {
      const { id, ...updateData } = updates[i]
      
      if (!id) {
        throw new Error('Asset ID is required for update')
      }

      // Validate update data
      const validatedData = AssetManagementSchema.partial().parse(updateData)
      
      // Update asset
      const success = await assetService.updateAsset(id, validatedData, user.id)
      if (success) {
        results.push({ index: i, assetId: id, status: 'success' })
      } else {
        errors.push({ index: i, assetId: id, error: 'Asset not found or update failed', status: 'error' })
      }
    } catch (error) {
      errors.push({ 
        index: i, 
        assetId: updates[i]?.id || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      })
    }
  }

  return createSuccessResponse({
    totalProcessed: updates.length,
    successful: results.length,
    failed: errors.length,
    results,
    errors,
  }, `Bulk update completed: ${results.length} successful, ${errors.length} failed`)
}

// DELETE /api/assets/bulk - Bulk delete assets (admin only)
async function bulkDeleteAssetsHandler(request: NextRequest, user: any) {
  const { assetIds } = await request.json()

  if (!Array.isArray(assetIds) || assetIds.length === 0) {
    throw new Error('Asset IDs array is required and must not be empty')
  }

  if (assetIds.length > 100) {
    throw new Error('Cannot delete more than 100 assets at once')
  }

  const results = []
  const errors = []

  for (let i = 0; i < assetIds.length; i++) {
    try {
      const assetId = assetIds[i]
      
      // Delete asset
      const success = await assetService.deleteById(assetId)
      if (success) {
        results.push({ index: i, assetId, status: 'success' })
      } else {
        errors.push({ index: i, assetId, error: 'Asset not found or delete failed', status: 'error' })
      }
    } catch (error) {
      errors.push({ 
        index: i, 
        assetId: assetIds[i] || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      })
    }
  }

  return createSuccessResponse({
    totalProcessed: assetIds.length,
    successful: results.length,
    failed: errors.length,
    results,
    errors,
  }, `Bulk delete completed: ${results.length} successful, ${errors.length} failed`)
}

export const POST = withAdminOnly(bulkCreateAssetsHandler)
export const PUT = withAdminOnly(bulkUpdateAssetsHandler)
export const DELETE = withAdminOnly(bulkDeleteAssetsHandler)