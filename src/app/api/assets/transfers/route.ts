import { NextRequest } from 'next/server'
import { createSuccessResponse, parsePaginationParams, parseFilterParams } from '@/lib/api-utils'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { MongoDBConnection } from '@/lib/mongodb-service'

// GET /api/assets/transfers - Get asset transfers
async function getTransfersHandler(request: NextRequest, user: any) {
  const { searchParams } = new URL(request.url)
  const { page, limit, skip } = parsePaginationParams(searchParams)
  const filters = parseFilterParams(searchParams)

  const db = MongoDBConnection.getInstance().getDb()
  const transfersCollection = db.collection('assetTransfers')

  // Build query
  const query: any = {}

  // Role-based filtering - users can only see transfers they initiated or for their department
  if (user.role !== 'admin') {
    // Get assets from user's department to filter transfers
    const assetsCollection = db.collection('assets')
    const departmentAssets = await assetsCollection
      .find({ department: user.department }, { projection: { _id: 1 } })
      .toArray()
    
    const assetIds = departmentAssets.map(asset => asset._id.toString())
    
    query.$or = [
      { transferredBy: user.id },
      { assetId: { $in: assetIds } }
    ]
  }

  // Apply filters
  if (filters.status) query.status = filters.status
  if (filters.dcNumber) query.dcNumber = { $regex: filters.dcNumber, $options: 'i' }
  if (filters.assetNumber) query.assetNumber = { $regex: filters.assetNumber, $options: 'i' }
  if (filters.fromLocation) query.fromLocation = filters.fromLocation
  if (filters.toLocation) query.toLocation = filters.toLocation
  if (filters.transferredBy) query.transferredBy = filters.transferredBy

  // Date range filter
  if (filters.startDate || filters.endDate) {
    query.transferDate = {}
    if (filters.startDate) query.transferDate.$gte = new Date(filters.startDate)
    if (filters.endDate) query.transferDate.$lte = new Date(filters.endDate)
  }

  // Get total count
  const total = await transfersCollection.countDocuments(query)

  // Get transfers with pagination
  const transfers = await transfersCollection
    .find(query)
    .sort({ transferDate: -1 })
    .skip(skip)
    .limit(limit)
    .toArray()

  return createSuccessResponse({
    transfers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })
}

// POST /api/assets/transfers - Create bulk transfer
async function createBulkTransferHandler(request: NextRequest, user: any) {
  const body = await request.json()
  const { assetIds, toLocation, dcNumber, reason, notes, isTemporary = false } = body

  if (!Array.isArray(assetIds) || assetIds.length === 0) {
    throw new Error('Asset IDs array is required')
  }

  if (assetIds.length > 50) {
    throw new Error('Cannot transfer more than 50 assets at once')
  }

  const db = MongoDBConnection.getInstance().getDb()
  const assetsCollection = db.collection('assets')
  const transfersCollection = db.collection('assetTransfers')
  const auditCollection = db.collection('auditLogs')

  const results = []
  const errors = []

  // Process each asset transfer
  for (let i = 0; i < assetIds.length; i++) {
    try {
      const assetId = assetIds[i]
      
      // Get asset
      const asset = await assetsCollection.findOne({ _id: assetId })
      if (!asset) {
        errors.push({ assetId, error: 'Asset not found' })
        continue
      }

      // Check permissions
      if (user.role !== 'admin' && asset.department !== user.department) {
        errors.push({ assetId, error: 'No permission to transfer this asset' })
        continue
      }

      // Check if asset can be transferred
      if (asset.currentStatus === 'Scrapped' || asset.currentStatus === 'Under Maintenance') {
        errors.push({ assetId, error: `Cannot transfer asset with status: ${asset.currentStatus}` })
        continue
      }

      // Create transfer record
      const transferRecord = {
        assetId: assetId.toString(),
        assetNumber: asset.assetNumber,
        assetDescription: asset.assetDescription,
        fromLocation: asset.location,
        toLocation,
        dcNumber: `${dcNumber}-${i + 1}`, // Append sequence number for bulk transfers
        reason,
        transferDate: new Date(),
        isTemporary,
        notes,
        transferredBy: user.id,
        transferredByName: user.name,
        status: 'Completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await transfersCollection.insertOne(transferRecord)

      // Update asset
      await assetsCollection.updateOne(
        { _id: assetId },
        {
          $set: {
            location: toLocation,
            currentStatus: isTemporary ? 'In Use' : 'In Store',
            statusChangedOn: new Date(),
            lastModifiedBy: user.id,
            updatedAt: new Date(),
          }
        }
      )

      // Create audit log
      await auditCollection.insertOne({
        entityType: 'asset',
        entityId: assetId.toString(),
        action: 'bulk_transfer',
        changes: {
          fromLocation: asset.location,
          toLocation,
          dcNumber: transferRecord.dcNumber,
          reason,
        },
        performedBy: user.id,
        performedByName: user.name,
        timestamp: new Date(),
      })

      results.push({ assetId, status: 'success' })
    } catch (error) {
      errors.push({ 
        assetId: assetIds[i], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }

  return createSuccessResponse({
    totalProcessed: assetIds.length,
    successful: results.length,
    failed: errors.length,
    results,
    errors,
  }, `Bulk transfer completed: ${results.length} successful, ${errors.length} failed`)
}

export const GET = withApiMiddleware(getTransfersHandler)
export const POST = withApiMiddleware(createBulkTransferHandler)