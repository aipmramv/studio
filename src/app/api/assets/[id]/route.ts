import { NextRequest } from 'next/server'
import { createSuccessResponse, validateObjectId, validateDepartmentAccess } from '@/lib/api-utils'
import { withApiMiddleware, withAdminOnly } from '@/lib/auth-middleware'
import { assetService } from '@/lib/mongodb-service'
import { AssetManagementSchema } from '@/lib/schemas'

// GET /api/assets/[id] - Get asset by ID
async function getAssetHandler(request: NextRequest, user: any, { params }: { params: { id: string } }) {
  const assetId = params.id
  validateObjectId(assetId)

  const asset = await assetService.findById(assetId)
  if (!asset) {
    throw new Error('Asset not found')
  }

  // Check department access for non-admin users
  if (user.role !== 'admin') {
    validateDepartmentAccess(user.role, user.department, asset.department)
  }

  return createSuccessResponse(asset)
}

// PUT /api/assets/[id] - Update asset (admin only)
async function updateAssetHandler(request: NextRequest, user: any, { params }: { params: { id: string } }) {
  const assetId = params.id
  validateObjectId(assetId)

  const body = await request.json()

  // Check if asset exists
  const existingAsset = await assetService.findById(assetId)
  if (!existingAsset) {
    throw new Error('Asset not found')
  }

  // Validate partial update with Zod schema
  const validatedData = AssetManagementSchema.partial().parse(body)

  // Update asset
  const success = await assetService.updateAsset(assetId, validatedData, user.id)
  if (!success) {
    throw new Error('Failed to update asset')
  }

  // Get updated asset
  const updatedAsset = await assetService.findById(assetId)

  return createSuccessResponse(updatedAsset, 'Asset updated successfully')
}

// DELETE /api/assets/[id] - Delete asset (admin only)
async function deleteAssetHandler(request: NextRequest, user: any, { params }: { params: { id: string } }) {
  const assetId = params.id
  validateObjectId(assetId)

  // Check if asset exists
  const asset = await assetService.findById(assetId)
  if (!asset) {
    throw new Error('Asset not found')
  }

  // Delete asset
  const success = await assetService.deleteById(assetId)
  if (!success) {
    throw new Error('Failed to delete asset')
  }

  return createSuccessResponse(null, 'Asset deleted successfully')
}

export const GET = withApiMiddleware(getAssetHandler)
export const PUT = withAdminOnly(updateAssetHandler)
export const DELETE = withAdminOnly(deleteAssetHandler)