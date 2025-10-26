import { NextRequest } from 'next/server'
import { createSuccessResponse, parsePaginationParams, parseFilterParams, validateRequiredFields } from '@/lib/api-utils'
import { withApiMiddleware, withAdminOnly, withAssetAccess } from '@/lib/auth-middleware'
import { getAssets, createAsset, getAssetById } from '@/lib/server-only-services'
import { AssetManagementSchema } from '@/lib/schemas'
import { DepartmentFilterService } from '@/lib/department-filter'
import { JWTPayload } from '@/types/auth'

// GET /api/assets - Get assets with filtering and pagination
async function getAssetsHandler(request: NextRequest, user: JWTPayload) {
  const { searchParams } = new URL(request.url)
  const { page, limit, skip } = parsePaginationParams(searchParams)
  const filters = parseFilterParams(searchParams)

  // Build base search query
  let searchQuery: any = {}
  
  // Apply department-based filtering using RBAC
  searchQuery = DepartmentFilterService.filterAssetQuery(searchQuery, user)

  // Apply additional filters
  if (filters.department && user.role === 'admin') {
    // Only admins can override department filter
    searchQuery.department = filters.department
  }
  if (filters.location) searchQuery.location = filters.location
  if (filters.status) searchQuery.status = filters.status
  if (filters.classification) searchQuery.classification = filters.classification

  // Build search filter
  if (filters.search) {
    searchQuery.$or = [
      { assetNumber: { $regex: filters.search, $options: 'i' } },
      { assetDescription: { $regex: filters.search, $options: 'i' } },
      { kmNumber: { $regex: filters.search, $options: 'i' } },
      { productSerialNo: { $regex: filters.search, $options: 'i' } },
    ]
  }

  const result = await getAssets(searchQuery, { limit, skip, sort: { updatedAt: -1 } })

  return createSuccessResponse({
    assets: result.assets,
    total: result.total,
    page,
    limit,
    totalPages: Math.ceil(result.total / limit),
    userPermissions: {
      canCreate: user.role === 'admin',
      canEdit: user.role === 'admin' || user.role === 'spoc',
      canDelete: user.role === 'admin',
      departmentFilter: DepartmentFilterService.getFrontendDepartmentFilter(user)
    }
  })
}

// POST /api/assets - Create new asset (admin only)
async function createAssetHandler(request: NextRequest, user: JWTPayload) {
  const body = await request.json()

  // Validate required fields
  validateRequiredFields(body, ['assetDescription', 'department', 'location', 'ledgerQty'])

  // Validate department access
  if (body.department) {
    const departmentAccess = DepartmentFilterService.validateDepartmentAccess(
      body.department,
      user,
      'create asset'
    )
    
    if (!departmentAccess.allowed) {
      return createSuccessResponse(null, departmentAccess.reason, 403)
    }
  }

  // Validate with Zod schema
  const validatedData = AssetManagementSchema.parse(body)

  // Add user info to asset data
  const assetData = {
    ...validatedData,
    createdBy: user.id,
    lastModifiedBy: user.id,
  }

  // Create asset
  const assetId = await createAsset(assetData)

  // Get created asset
  const asset = await getAssetById(assetId)

  return createSuccessResponse(asset, 'Asset created successfully', 201)
}

// Use new RBAC-aware middleware
export const GET = withAssetAccess(getAssetsHandler, 'read')
export const POST = withAssetAccess(createAssetHandler, 'create')