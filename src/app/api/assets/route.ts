
import { NextRequest } from 'next/server'
import { createSuccessResponse, parsePaginationParams, parseFilterParams, validateRequiredFields } from '@/lib/api-utils'
import { withApiMiddleware, withAdminOnly, withAssetAccess } from '@/lib/auth-middleware'
import { getAssets, createAsset, getAssetById } from '@/lib/server-only-services'
import { AssetManagementSchema } from '@/lib/schemas'
import { DepartmentFilterService } from '@/lib/department-filter'
import { JWTPayload } from '@/types/auth'
import { query } from '@/lib/db'

// GET /api/assets - Get assets with filtering and pagination
async function getAssetsHandler(request: NextRequest, user: JWTPayload) {
  const { searchParams } = new URL(request.url)
  const { page, limit, skip } = parsePaginationParams(searchParams)
  const filters = parseFilterParams(searchParams)

  let whereClauses: string[] = [];
  let params: any[] = [];
  let paramIndex = 1;

  // Apply department-based filtering using RBAC
  ({ whereClauses, params } = DepartmentFilterService.filterAssetQuery(whereClauses, params, user));

  // Apply additional filters
  if (filters.department && user.role === 'admin') {
    const departmentId = (await query(`SELECT id FROM departments WHERE name = ${paramIndex++}`, [filters.department])).rows[0]?.id;
    if (departmentId) {
        whereClauses.push(`a.department_id = ${paramIndex++}`);
        params.push(departmentId);
    }
  }
  if (filters.location) {
    const locationId = (await query(`SELECT id FROM locations WHERE name = ${paramIndex++}`, [filters.location])).rows[0]?.id;
    if (locationId) {
        whereClauses.push(`a.location_id = ${paramIndex++}`);
        params.push(locationId);
    }
  }
  if (filters.status) {
    const statusId = (await query(`SELECT id FROM asset_statuses WHERE name = ${paramIndex++}`, [filters.status])).rows[0]?.id;
    if (statusId) {
        whereClauses.push(`a.current_status_id = ${paramIndex++}`);
        params.push(statusId);
    }
  }
  if (filters.classification) {
    const classificationId = (await query(`SELECT id FROM asset_classifications WHERE name = ${paramIndex++}`, [filters.classification])).rows[0]?.id;
    if (classificationId) {
        whereClauses.push(`a.asset_classification_id = ${paramIndex++}`);
        params.push(classificationId);
    }
  }

  // Build search filter
  if (filters.search) {
    whereClauses.push(`(a.asset_number ILIKE ${paramIndex++} OR a.asset_description ILIKE ${paramIndex++})`);
    params.push(`%${filters.search}%`);
    params.push(`%${filters.search}%`);
  }

  const result = await getAssets({ whereClauses, params }, { limit, skip, sort: { updated_at: 'DESC' } })

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