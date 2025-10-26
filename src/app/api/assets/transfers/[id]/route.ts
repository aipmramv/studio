import { NextRequest } from 'next/server'
import { createSuccessResponse, validateObjectId } from '@/lib/api-utils'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { MongoDBConnection } from '@/lib/mongodb-service'
import { ObjectId, isValidObjectId } from '@/types/server-types'

// GET /api/assets/transfers/[id] - Get transfer details
async function getTransferHandler(request: NextRequest, user: any, { params }: { params: { id: string } }) {
  const transferId = params.id
  validateObjectId(transferId)

  const db = MongoDBConnection.getInstance().getDb()
  const transfersCollection = db.collection('assetTransfers')

  const transfer = await transfersCollection.findOne({ _id: new ObjectId(transferId) })
  if (!transfer) {
    throw new Error('Transfer not found')
  }

  // Check if user can view this transfer
  if (user.role !== 'admin' && transfer.transferredBy !== user.id) {
    // Check if the asset belongs to user's department
    const assetsCollection = db.collection('assets')
    const asset = await assetsCollection.findOne({ _id: new ObjectId(transfer.assetId) })
    
    if (!asset || asset.department !== user.department) {
      throw new Error('Access denied')
    }
  }

  return createSuccessResponse(transfer)
}

// PUT /api/assets/transfers/[id] - Update transfer status
async function updateTransferHandler(request: NextRequest, user: any, { params }: { params: { id: string } }) {
  const transferId = params.id
  validateObjectId(transferId)

  const { status, notes, completedDate } = await request.json()

  const db = MongoDBConnection.getInstance().getDb()
  const transfersCollection = db.collection('assetTransfers')

  // Get existing transfer
  const transfer = await transfersCollection.findOne({ _id: new ObjectId(transferId) })
  if (!transfer) {
    throw new Error('Transfer not found')
  }

  // Check permissions
  if (user.role !== 'admin' && transfer.transferredBy !== user.id) {
    throw new Error('You can only update transfers you initiated')
  }

  // Update transfer
  const updateData: any = {
    updatedAt: new Date(),
  }

  if (status) updateData.status = status
  if (notes) updateData.notes = notes
  if (completedDate) updateData.completedDate = new Date(completedDate)

  const result = await transfersCollection.updateOne(
    { _id: new ObjectId(transferId) },
    { $set: updateData }
  )

  if (result.modifiedCount === 0) {
    throw new Error('Failed to update transfer')
  }

  // If transfer is completed, update asset status
  if (status === 'Completed') {
    const assetsCollection = db.collection('assets')
    await assetsCollection.updateOne(
      { _id: new ObjectId(transfer.assetId) },
      {
        $set: {
          currentStatus: transfer.isTemporary ? 'In Use' : 'In Store',
          statusChangedOn: new Date(),
          updatedAt: new Date(),
        }
      }
    )

    // Create audit log
    const auditCollection = db.collection('auditLogs')
    await auditCollection.insertOne({
      entityType: 'transfer',
      entityId: transferId,
      action: 'status_update',
      changes: { status, notes },
      performedBy: user.id,
      performedByName: user.name,
      timestamp: new Date(),
    })
  }

  // Get updated transfer
  const updatedTransfer = await transfersCollection.findOne({ _id: new ObjectId(transferId) })

  return createSuccessResponse(updatedTransfer, 'Transfer updated successfully')
}

// DELETE /api/assets/transfers/[id] - Cancel transfer
async function cancelTransferHandler(request: NextRequest, user: any, { params }: { params: { id: string } }) {
  const transferId = params.id
  validateObjectId(transferId)

  const db = MongoDBConnection.getInstance().getDb()
  const transfersCollection = db.collection('assetTransfers')

  // Get existing transfer
  const transfer = await transfersCollection.findOne({ _id: new ObjectId(transferId) })
  if (!transfer) {
    throw new Error('Transfer not found')
  }

  // Check permissions
  if (user.role !== 'admin' && transfer.transferredBy !== user.id) {
    throw new Error('You can only cancel transfers you initiated')
  }

  // Can only cancel transfers that are not completed
  if (transfer.status === 'Completed') {
    throw new Error('Cannot cancel completed transfers')
  }

  // Update transfer status to cancelled
  await transfersCollection.updateOne(
    { _id: new ObjectId(transferId) },
    {
      $set: {
        status: 'Cancelled',
        cancelledBy: user.id,
        cancelledByName: user.name,
        cancelledAt: new Date(),
        updatedAt: new Date(),
      }
    }
  )

  // Revert asset location if needed
  if (transfer.status === 'In Transit') {
    const assetsCollection = db.collection('assets')
    await assetsCollection.updateOne(
      { _id: new ObjectId(transfer.assetId) },
      {
        $set: {
          location: transfer.fromLocation,
          currentStatus: 'In Store',
          statusChangedOn: new Date(),
          updatedAt: new Date(),
        }
      }
    )
  }

  // Create audit log
  const auditCollection = db.collection('auditLogs')
  await auditCollection.insertOne({
    entityType: 'transfer',
    entityId: transferId,
    action: 'cancel',
    changes: { status: 'Cancelled' },
    performedBy: user.id,
    performedByName: user.name,
    timestamp: new Date(),
  })

  return createSuccessResponse(null, 'Transfer cancelled successfully')
}

export const GET = withApiMiddleware(getTransferHandler)
export const PUT = withApiMiddleware(updateTransferHandler)
export const DELETE = withApiMiddleware(cancelTransferHandler)