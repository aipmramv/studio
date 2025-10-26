import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/api-utils'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { MongoDBConnection } from '@/lib/mongodb-service'

// GET /api/assets/filters - Get available filter options
async function getFilterOptionsHandler(request: NextRequest, user: any) {
  const db = MongoDBConnection.getInstance().getDb()
  const assetsCollection = db.collection('assets')

  // Build base filter for user's accessible data
  const baseFilter: any = {}
  if (user.role !== 'admin') {
    baseFilter.department = user.department
  }

  // Get distinct values for filter options
  const [
    departments,
    locations,
    statuses,
    classifications,
    groupings,
    verificationStatuses,
    usableConditions,
    workingConditions,
    brands,
    models,
  ] = await Promise.all([
    assetsCollection.distinct('department', baseFilter),
    assetsCollection.distinct('location', baseFilter),
    assetsCollection.distinct('currentStatus', baseFilter),
    assetsCollection.distinct('assetClassification', baseFilter),
    assetsCollection.distinct('assetGrouping', baseFilter),
    assetsCollection.distinct('verificationStatus', baseFilter),
    assetsCollection.distinct('usableCondition', baseFilter),
    assetsCollection.distinct('workingConditionStatus', baseFilter),
    assetsCollection.distinct('brandName', { ...baseFilter, brandName: { $ne: null, $ne: '' } }),
    assetsCollection.distinct('modelNo', { ...baseFilter, modelNo: { $ne: null, $ne: '' } }),
  ])

  // Get value ranges
  const valueRanges = await assetsCollection.aggregate([
    { $match: { ...baseFilter, purchaseValue: { $ne: null, $gt: 0 } } },
    {
      $group: {
        _id: null,
        minPurchaseValue: { $min: '$purchaseValue' },
        maxPurchaseValue: { $max: '$purchaseValue' },
        avgPurchaseValue: { $avg: '$purchaseValue' },
        minCapitalizationDate: { $min: '$capitalizationDate' },
        maxCapitalizationDate: { $max: '$capitalizationDate' },
        minCreatedDate: { $min: '$createdAt' },
        maxCreatedDate: { $max: '$createdAt' },
      }
    }
  ]).toArray()

  const ranges = valueRanges[0] || {
    minPurchaseValue: 0,
    maxPurchaseValue: 0,
    avgPurchaseValue: 0,
    minCapitalizationDate: null,
    maxCapitalizationDate: null,
    minCreatedDate: null,
    maxCreatedDate: null,
  }

  // Get asset counts by category
  const assetCounts = await assetsCollection.aggregate([
    { $match: baseFilter },
    {
      $group: {
        _id: null,
        totalAssets: { $sum: 1 },
        byDepartment: {
          $push: {
            department: '$department',
            count: 1
          }
        },
        byStatus: {
          $push: {
            status: '$currentStatus',
            count: 1
          }
        },
        byClassification: {
          $push: {
            classification: '$assetClassification',
            count: 1
          }
        }
      }
    }
  ]).toArray()

  const filterOptions = {
    departments: departments.filter(Boolean).sort(),
    locations: locations.filter(Boolean).sort(),
    statuses: statuses.filter(Boolean).sort(),
    classifications: classifications.filter(Boolean).sort(),
    groupings: groupings.filter(Boolean).sort(),
    verificationStatuses: verificationStatuses.filter(Boolean).sort(),
    usableConditions: usableConditions.filter(Boolean).sort(),
    workingConditions: workingConditions.filter(Boolean).sort(),
    brands: brands.filter(Boolean).sort(),
    models: models.filter(Boolean).sort(),
    ranges,
    counts: assetCounts[0] || { totalAssets: 0 },
  }

  return createSuccessResponse(filterOptions)
}

export const GET = withApiMiddleware(getFilterOptionsHandler)