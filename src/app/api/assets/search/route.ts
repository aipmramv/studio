import { NextRequest } from 'next/server'
import { createSuccessResponse, parsePaginationParams } from '@/lib/api-utils'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { assetService } from '@/lib/mongodb-service'

// POST /api/assets/search - Advanced asset search
async function searchAssetsHandler(request: NextRequest, user: any) {
  const { searchParams } = new URL(request.url)
  const { page, limit, skip } = parsePaginationParams(searchParams)
  
  const body = await request.json()
  const {
    searchTerm,
    department,
    location,
    status,
    classification,
    grouping,
    verificationStatus,
    usableCondition,
    workingConditionStatus,
    purchaseValueRange,
    capitalizationDateRange,
    createdDateRange,
    brandName,
    modelNo,
    serialNo,
    sortBy = 'assetNumber',
    sortOrder = 'asc'
  } = body

  // Build search query
  const searchQuery: any = {}

  // Role-based filtering
  if (user.role !== 'admin') {
    searchQuery.department = user.department
  } else if (department) {
    searchQuery.department = department
  }

  // Apply filters
  if (location) searchQuery.location = location
  if (status) searchQuery.currentStatus = status
  if (classification) searchQuery.assetClassification = classification
  if (grouping) searchQuery.assetGrouping = grouping
  if (verificationStatus) searchQuery.verificationStatus = verificationStatus
  if (usableCondition) searchQuery.usableCondition = usableCondition
  if (workingConditionStatus) searchQuery.workingConditionStatus = workingConditionStatus
  if (brandName) searchQuery.brandName = { $regex: brandName, $options: 'i' }
  if (modelNo) searchQuery.modelNo = { $regex: modelNo, $options: 'i' }
  if (serialNo) searchQuery.productSerialNo = { $regex: serialNo, $options: 'i' }

  // Purchase value range filter
  if (purchaseValueRange) {
    searchQuery.purchaseValue = {}
    if (purchaseValueRange.min !== undefined) {
      searchQuery.purchaseValue.$gte = purchaseValueRange.min
    }
    if (purchaseValueRange.max !== undefined) {
      searchQuery.purchaseValue.$lte = purchaseValueRange.max
    }
  }

  // Date range filters
  if (capitalizationDateRange) {
    searchQuery.capitalizationDate = {}
    if (capitalizationDateRange.start) {
      searchQuery.capitalizationDate.$gte = new Date(capitalizationDateRange.start)
    }
    if (capitalizationDateRange.end) {
      searchQuery.capitalizationDate.$lte = new Date(capitalizationDateRange.end)
    }
  }

  if (createdDateRange) {
    searchQuery.createdAt = {}
    if (createdDateRange.start) {
      searchQuery.createdAt.$gte = new Date(createdDateRange.start)
    }
    if (createdDateRange.end) {
      searchQuery.createdAt.$lte = new Date(createdDateRange.end)
    }
  }

  // Text search across multiple fields
  if (searchTerm) {
    searchQuery.$or = [
      { assetNumber: { $regex: searchTerm, $options: 'i' } },
      { assetDescription: { $regex: searchTerm, $options: 'i' } },
      { kmNumber: { $regex: searchTerm, $options: 'i' } },
      { productSerialNo: { $regex: searchTerm, $options: 'i' } },
      { brandName: { $regex: searchTerm, $options: 'i' } },
      { modelNo: { $regex: searchTerm, $options: 'i' } },
    ]
  }

  // Search assets with advanced filtering
  const result = await assetService.searchAssets({
    searchTerm: undefined, // We handle text search in the query above
    department: searchQuery.department,
    location: searchQuery.location,
    status: searchQuery.currentStatus,
    classification: searchQuery.assetClassification,
    limit,
    skip,
  })

  // Apply additional MongoDB query for complex filters
  const db = assetService['db'] // Access the database instance
  const collection = db.collection('assets')
  
  // Get total count with all filters
  const total = await collection.countDocuments(searchQuery)
  
  // Get assets with sorting and pagination
  const sortOptions: any = {}
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1
  
  const assets = await collection
    .find(searchQuery)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .toArray()

  return createSuccessResponse({
    assets,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    searchQuery: {
      ...body,
      appliedFilters: Object.keys(searchQuery).length,
    },
  })
}

// GET /api/assets/search - Simple text search for autocomplete
async function quickSearchHandler(request: NextRequest, user: any) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '10')

  if (!query.trim()) {
    return createSuccessResponse({
      results: [],
      total: 0
    })
  }

  try {
    // Use MongoDB text search with scoring
    const result = await assetService.searchAssets({
      searchTerm: query,
      department: user.role !== 'admin' ? user.department : undefined,
      limit,
      skip: 0
    })

    // Transform results to include search scoring and matched fields
    const transformedResults = result.assets.map((asset: any) => {
      const matchedFields: string[] = []
      const searchLower = query.toLowerCase()

      // Check which fields matched
      if (asset.assetNumber?.toLowerCase().includes(searchLower)) matchedFields.push('Asset Number')
      if (asset.assetDescription?.toLowerCase().includes(searchLower)) matchedFields.push('Description')
      if (asset.brandName?.toLowerCase().includes(searchLower)) matchedFields.push('Brand')
      if (asset.modelNo?.toLowerCase().includes(searchLower)) matchedFields.push('Model')
      if (asset.productSerialNo?.toLowerCase().includes(searchLower)) matchedFields.push('Serial')
      if (asset.location?.toLowerCase().includes(searchLower)) matchedFields.push('Location')

      return {
        asset: {
          id: asset._id?.toString() || asset.id,
          assetNumber: asset.assetNumber,
          assetDescription: asset.assetDescription,
          department: asset.department,
          location: asset.location,
          currentStatus: asset.currentStatus,
          assetClassification: asset.assetClassification,
          brandName: asset.brandName,
          modelNo: asset.modelNo,
          productSerialNo: asset.productSerialNo,
          purchaseValue: asset.purchaseValue,
          verificationStatus: asset.verificationStatus
        },
        score: matchedFields.length, // Simple scoring based on number of matched fields
        matchedFields
      }
    })

    // Sort by score (most matches first)
    transformedResults.sort((a, b) => b.score - a.score)

    return createSuccessResponse({
      results: transformedResults,
      total: result.total,
      query
    })

  } catch (error) {
    console.error('Quick search error:', error)
    return createSuccessResponse({
      results: [],
      total: 0,
      error: 'Search failed'
    }, 'Search failed', 500)
  }
}

export const GET = withApiMiddleware(quickSearchHandler)
export const POST = withApiMiddleware(searchAssetsHandler)