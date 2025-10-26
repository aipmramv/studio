import { NextRequest } from 'next/server'
import { createSuccessResponse, parsePaginationParams, parseFilterParams } from '@/lib/api-utils'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { MongoDBConnection } from '@/lib/mongodb-service'

// GET /api/assets/verifications - Get asset verifications
async function getVerificationsHandler(request: NextRequest, user: any) {
  const { searchParams } = new URL(request.url)
  const { page, limit, skip } = parsePaginationParams(searchParams)
  const filters = parseFilterParams(searchParams)

  const db = MongoDBConnection.getInstance().getDb()
  const verificationsCollection = db.collection('assetVerifications')

  // Build query
  const query: any = {}

  // Role-based filtering
  if (user.role !== 'admin') {
    query.department = user.department
  } else if (filters.department) {
    query.department = filters.department
  }

  // Apply filters
  if (filters.verificationStatus) query.verificationStatus = filters.verificationStatus
  if (filters.usableCondition) query.usableCondition = filters.usableCondition
  if (filters.workingConditionStatus) query.workingConditionStatus = filters.workingConditionStatus
  if (filters.verifiedBy) query.verifiedBy = filters.verifiedBy
  if (filters.assetNumber) query.assetNumber = { $regex: filters.assetNumber, $options: 'i' }

  // Date range filter
  if (filters.startDate || filters.endDate) {
    query.verificationDate = {}
    if (filters.startDate) query.verificationDate.$gte = new Date(filters.startDate)
    if (filters.endDate) query.verificationDate.$lte = new Date(filters.endDate)
  }

  // Get total count
  const total = await verificationsCollection.countDocuments(query)

  // Get verifications with pagination
  const verifications = await verificationsCollection
    .find(query)
    .sort({ verificationDate: -1 })
    .skip(skip)
    .limit(limit)
    .toArray()

  return createSuccessResponse({
    verifications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })
}

// POST /api/assets/verifications/bulk - Bulk verify assets
async function bulkVerifyAssetsHandler(request: NextRequest, user: any) {
  const body = await request.json()
  const { verifications } = body

  if (!Array.isArray(verifications) || verifications.length === 0) {
    throw new Error('Verifications array is required')
  }

  if (verifications.length > 20) {
    throw new Error('Cannot verify more than 20 assets at once')
  }

  const db = MongoDBConnection.getInstance().getDb()
  const assetsCollection = db.collection('assets')
  const verificationsCollection = db.collection('assetVerifications')
  const auditCollection = db.collection('auditLogs')

  const results = []
  const errors = []

  // Process each verification
  for (let i = 0; i < verifications.length; i++) {
    try {
      const verification = verifications[i]
      const { assetId, verificationStatus, usableCondition, workingConditionStatus, comments } = verification

      // Get asset
      const asset = await assetsCollection.findOne({ _id: assetId })
      if (!asset) {
        errors.push({ assetId, error: 'Asset not found' })
        continue
      }

      // Check permissions
      if (user.role !== 'admin' && asset.department !== user.department) {
        errors.push({ assetId, error: 'No permission to verify this asset' })
        continue
      }

      // Create verification record
      const verificationRecord = {
        assetId: assetId.toString(),
        assetNumber: asset.assetNumber,
        assetDescription: asset.assetDescription,
        verificationStatus,
        usableCondition,
        workingConditionStatus,
        comments,
        verificationDate: new Date(),
        verifiedBy: user.id,
        verifiedByName: user.name,
        verifiedByRole: user.role,
        department: asset.department,
        location: asset.location,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await verificationsCollection.insertOne(verificationRecord)

      // Update asset
      const updateData: any = {
        verificationStatus,
        verifiedOn: new Date(),
        usableCondition,
        workingConditionStatus,
        comments,
        lastModifiedBy: user.id,
        updatedAt: new Date(),
      }

      // Update status based on verification results
      if (verificationStatus === 'Discrepancy') {
        updateData.currentStatus = 'Verification Pending'
        updateData.statusChangedOn = new Date()
      } else if (workingConditionStatus === 'Not Working' || workingConditionStatus === 'Under Maintenance') {
        updateData.currentStatus = 'Under Maintenance'
        updateData.statusChangedOn = new Date()
      }

      await assetsCollection.updateOne(
        { _id: assetId },
        { $set: updateData }
      )

      // Create audit log
      await auditCollection.insertOne({
        entityType: 'asset',
        entityId: assetId.toString(),
        action: 'bulk_verification',
        changes: {
          verificationStatus,
          usableCondition,
          workingConditionStatus,
          comments,
        },
        performedBy: user.id,
        performedByName: user.name,
        timestamp: new Date(),
      })

      results.push({ assetId, status: 'success' })
    } catch (error) {
      errors.push({ 
        assetId: verifications[i]?.assetId || 'unknown', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }

  return createSuccessResponse({
    totalProcessed: verifications.length,
    successful: results.length,
    failed: errors.length,
    results,
    errors,
  }, `Bulk verification completed: ${results.length} successful, ${errors.length} failed`)
}

export const GET = withApiMiddleware(getVerificationsHandler)
export const POST = withApiMiddleware(bulkVerifyAssetsHandler)