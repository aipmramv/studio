import { NextRequest } from 'next/server'
import { createSuccessResponse, validateObjectId, validateRequiredFields } from '@/lib/api-utils'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { assetService, MongoDBConnection } from '@/lib/mongodb-service'

// POST /api/assets/[id]/verify - Verify asset
async function verifyAssetHandler(request: NextRequest, user: any, { params }: { params: { id: string } }) {
  const assetId = params.id
  validateObjectId(assetId)

  const body = await request.json()
  validateRequiredFields(body, ['verificationStatus', 'usableCondition', 'workingConditionStatus'])

  const {
    verificationStatus,
    usableCondition,
    workingConditionStatus,
    comments,
    photoUrl,
    verificationDate = new Date(),
    discrepancies = [],
    recommendedActions = [],
  } = body

  // Check if asset exists
  const asset = await assetService.findById(assetId)
  if (!asset) {
    throw new Error('Asset not found')
  }

  // Check if user can verify this asset
  if (user.role !== 'admin' && asset.department !== user.department) {
    throw new Error('You can only verify assets from your department')
  }

  const db = MongoDBConnection.getInstance().getDb()
  
  // Create verification record
  const verificationsCollection = db.collection('assetVerifications')
  
  const verificationRecord = {
    assetId,
    assetNumber: asset.assetNumber,
    assetDescription: asset.assetDescription,
    verificationStatus,
    usableCondition,
    workingConditionStatus,
    comments,
    photoUrl,
    verificationDate: new Date(verificationDate),
    discrepancies,
    recommendedActions,
    verifiedBy: user.id,
    verifiedByName: user.name,
    verifiedByRole: user.role,
    department: asset.department,
    location: asset.location,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const verificationResult = await verificationsCollection.insertOne(verificationRecord)

  // Update asset with verification details
  const updateData: any = {
    verificationStatus,
    verifiedOn: new Date(verificationDate),
    usableCondition,
    workingConditionStatus,
    comments,
    lastModifiedBy: user.id,
  }

  // If asset has discrepancies, update status
  if (verificationStatus === 'Discrepancy') {
    updateData.currentStatus = 'Verification Pending'
    updateData.statusChangedOn = new Date()
  }

  // If asset is not working, update status
  if (workingConditionStatus === 'Not Working' || workingConditionStatus === 'Under Maintenance') {
    updateData.currentStatus = 'Under Maintenance'
    updateData.statusChangedOn = new Date()
  }

  const success = await assetService.updateAsset(assetId, updateData, user.id)
  if (!success) {
    // Rollback verification record if asset update fails
    await verificationsCollection.deleteOne({ _id: verificationResult.insertedId })
    throw new Error('Failed to update asset verification status')
  }

  // Create audit log entry
  const auditCollection = db.collection('auditLogs')
  await auditCollection.insertOne({
    entityType: 'asset',
    entityId: assetId,
    action: 'verification',
    changes: {
      verificationStatus,
      usableCondition,
      workingConditionStatus,
      comments,
      discrepancies,
    },
    performedBy: user.id,
    performedByName: user.name,
    timestamp: new Date(),
  })

  // If there are recommended actions, create follow-up tasks
  if (recommendedActions.length > 0) {
    const tasksCollection = db.collection('verificationTasks')
    
    for (const action of recommendedActions) {
      await tasksCollection.insertOne({
        assetId,
        assetNumber: asset.assetNumber,
        verificationId: verificationResult.insertedId.toString(),
        action,
        status: 'Pending',
        assignedTo: asset.department, // Assign to asset's department
        createdBy: user.id,
        createdByName: user.name,
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      })
    }
  }

  // Get updated asset
  const updatedAsset = await assetService.findById(assetId)

  return createSuccessResponse({
    asset: updatedAsset,
    verification: {
      id: verificationResult.insertedId.toString(),
      ...verificationRecord,
    },
  }, 'Asset verified successfully')
}

export const POST = withApiMiddleware(verifyAssetHandler)