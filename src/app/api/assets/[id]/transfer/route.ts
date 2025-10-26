import { NextRequest } from 'next/server'
import { createSuccessResponse, validateObjectId, validateRequiredFields } from '@/lib/api-utils'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { assetService, workflowService, MongoDBConnection } from '@/lib/mongodb-service'

// POST /api/assets/[id]/transfer - Transfer asset to new location
async function transferAssetHandler(request: NextRequest, user: any, { params }: { params: { id: string } }) {
  const assetId = params.id
  validateObjectId(assetId)

  const body = await request.json()
  validateRequiredFields(body, ['toLocation', 'dcNumber', 'reason'])

  const {
    toLocation,
    dcNumber,
    reason,
    transferDate = new Date(),
    notes,
    expectedReturnDate,
    isTemporary = false,
  } = body

  // Check if asset exists
  const asset = await assetService.findById(assetId)
  if (!asset) {
    throw new Error('Asset not found')
  }

  // Check if user can transfer this asset
  if (user.role !== 'admin' && asset.department !== user.department) {
    throw new Error('You can only transfer assets from your department')
  }

  // Check if asset is available for transfer
  if (asset.currentStatus === 'Scrapped') {
    throw new Error('Cannot transfer scrapped assets')
  }

  if (asset.currentStatus === 'Under Maintenance') {
    throw new Error('Cannot transfer assets that are under maintenance')
  }

  // Create transfer record
  const db = MongoDBConnection.getInstance().getDb()
  const transfersCollection = db.collection('assetTransfers')
  
  const transferRecord = {
    assetId,
    assetNumber: asset.assetNumber,
    assetDescription: asset.assetDescription,
    fromLocation: asset.location,
    toLocation,
    dcNumber,
    reason,
    transferDate: new Date(transferDate),
    expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
    isTemporary,
    notes,
    transferredBy: user.id,
    transferredByName: user.name,
    status: 'In Transit',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const transferResult = await transfersCollection.insertOne(transferRecord)

  // Update asset location and status
  const updateData: any = {
    location: toLocation,
    currentStatus: isTemporary ? 'In Use' : 'In Store',
    statusChangedOn: new Date(),
    lastModifiedBy: user.id,
  }

  const success = await assetService.updateAsset(assetId, updateData, user.id)
  if (!success) {
    // Rollback transfer record if asset update fails
    await transfersCollection.deleteOne({ _id: transferResult.insertedId })
    throw new Error('Failed to update asset location')
  }

  // Create audit log entry
  const auditCollection = db.collection('auditLogs')
  await auditCollection.insertOne({
    entityType: 'asset',
    entityId: assetId,
    action: 'transfer',
    changes: {
      fromLocation: asset.location,
      toLocation,
      dcNumber,
      reason,
    },
    performedBy: user.id,
    performedByName: user.name,
    timestamp: new Date(),
  })

  // Get updated asset
  const updatedAsset = await assetService.findById(assetId)

  return createSuccessResponse({
    asset: updatedAsset,
    transfer: {
      id: transferResult.insertedId.toString(),
      ...transferRecord,
    },
  }, 'Asset transferred successfully')
}

export const POST = withApiMiddleware(transferAssetHandler)