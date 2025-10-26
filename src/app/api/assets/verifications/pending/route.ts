import { NextRequest } from 'next/server'
import { createSuccessResponse, parsePaginationParams } from '@/lib/api-utils'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { MongoDBConnection } from '@/lib/mongodb-service'

// GET /api/assets/verifications/pending - Get assets pending verification
async function getPendingVerificationsHandler(request: NextRequest, user: any) {
  const { searchParams } = new URL(request.url)
  const { page, limit, skip } = parsePaginationParams(searchParams)

  const db = MongoDBConnection.getInstance().getDb()
  const assetsCollection = db.collection('assets')

  // Build query for assets pending verification
  const query: any = {
    $or: [
      { verificationStatus: 'Pending' },
      { verificationStatus: { $exists: false } },
      { verificationStatus: null },
      // Assets not verified in the last 6 months
      {
        $and: [
          { verifiedOn: { $exists: true } },
          { verifiedOn: { $lt: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } }
        ]
      }
    ]
  }

  // Role-based filtering
  if (user.role !== 'admin') {
    query.department = user.department
  }

  // Exclude scrapped assets
  query.currentStatus = { $ne: 'Scrapped' }

  // Get total count
  const total = await assetsCollection.countDocuments(query)

  // Get assets with pagination
  const assets = await assetsCollection
    .find(query)
    .sort({ 
      verifiedOn: 1, // Assets never verified or oldest verification first
      assetNumber: 1 
    })
    .skip(skip)
    .limit(limit)
    .toArray()

  // Calculate verification priority for each asset
  const assetsWithPriority = assets.map(asset => {
    let priority = 'Medium'
    let daysSinceVerification = null

    if (!asset.verifiedOn) {
      priority = 'High' // Never verified
    } else {
      daysSinceVerification = Math.floor((Date.now() - asset.verifiedOn.getTime()) / (24 * 60 * 60 * 1000))
      
      if (daysSinceVerification > 365) {
        priority = 'High' // Over 1 year
      } else if (daysSinceVerification > 180) {
        priority = 'Medium' // Over 6 months
      } else {
        priority = 'Low' // Under 6 months
      }
    }

    return {
      ...asset,
      verificationPriority: priority,
      daysSinceVerification,
    }
  })

  // Get verification statistics
  const stats = await assetsCollection.aggregate([
    {
      $match: user.role === 'admin' ? {} : { department: user.department }
    },
    {
      $group: {
        _id: null,
        totalAssets: { $sum: 1 },
        verified: {
          $sum: {
            $cond: [
              { $eq: ['$verificationStatus', 'Verified'] },
              1,
              0
            ]
          }
        },
        pending: {
          $sum: {
            $cond: [
              { $or: [
                { $eq: ['$verificationStatus', 'Pending'] },
                { $eq: ['$verificationStatus', null] },
                { $not: { $ifNull: ['$verificationStatus', false] } }
              ]},
              1,
              0
            ]
          }
        },
        discrepancy: {
          $sum: {
            $cond: [
              { $eq: ['$verificationStatus', 'Discrepancy'] },
              1,
              0
            ]
          }
        },
        overdue: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $not: { $ifNull: ['$verifiedOn', false] } },
                  { $lt: ['$verifiedOn', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]).toArray()

  const statistics = stats[0] || {
    totalAssets: 0,
    verified: 0,
    pending: 0,
    discrepancy: 0,
    overdue: 0,
  }

  return createSuccessResponse({
    assets: assetsWithPriority,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    statistics,
  })
}

export const GET = withApiMiddleware(getPendingVerificationsHandler)