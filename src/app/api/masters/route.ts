
import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'
import { MasterDataManagementEngine } from '@/lib/master-data-management'

// GET /api/masters - Get all master data types
async function getMasterDataTypes(request: NextRequest, user: JWTPayload) {
  try {
    // In the new schema, master data types are implicitly defined by tables.
    // We can return a list of these known types.
    const masterDataTypes = [
      { name: 'departments', displayName: 'Departments' },
      { name: 'locations', displayName: 'Locations' },
      { name: 'asset-classifications', displayName: 'Asset Classifications' },
      { name: 'asset-groupings', displayName: 'Asset Groupings' },
      { name: 'asset-statuses', displayName: 'Asset Statuses' },
      { name: 'teams-and-tribes', displayName: 'Teams and Tribes' },
      { name: 'uom', displayName: 'Units of Measure' },
      { name: 'hsn-sac-codes', displayName: 'HSN/SAC Codes' },
      { name: 'store-locations', displayName: 'Store Locations' },
      { name: 'cost-centers', displayName: 'Cost Centers' },
      { name: 'material-types', displayName: 'Material Types' },
      { name: 'scrap-types', displayName: 'Scrap Types' },
      { name: 'activity-types', displayName: 'Activity Types' },
      { name: 'customers', displayName: 'Customers' },
      { name: 'vendors', displayName: 'Vendors' },
      { name: 'roles', displayName: 'Roles' },
      { name: 'permissions', displayName: 'Permissions' },
      { name: 'lifecycle-stages', displayName: 'Lifecycle Stages' },
      { name: 'request-types', displayName: 'Request Types' },
      { name: 'request-statuses', displayName: 'Request Statuses' },
      { name: 'material-categories', displayName: 'Material Categories' },
    ];

    return createSuccessResponse({
      masterDataTypes,
      total: masterDataTypes.length,
    })
  } catch (error) {
    console.error('Get master data types error:', error)
    return NextResponse.json(
      { error: 'Failed to get master data types' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getMasterDataTypes)
// POST method for creating master data types is removed as it's no longer applicable