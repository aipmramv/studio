import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { createSuccessResponse, parsePaginationParams, parseFilterParams, validateRequiredFields } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'
import { MasterDataManagementEngine } from '@/lib/master-data-management'

// GET /api/masters/[type] - Get all entries for a specific master data type
async function getMasterDataEntries(request: NextRequest, { params }: { params: { type: string } }, user: JWTPayload) {
  try {
    const tableName = MasterDataManagementEngine.getTableName(params.type);
    const { searchParams } = new URL(request.url);
    const filters = parseFilterParams(searchParams);

    const entries = await MasterDataManagementEngine.getMasterDataEntries(tableName, filters);

    return createSuccessResponse({
      entries,
      total: entries.length,
    });
  } catch (error) {
    console.error(`Get master data entries for ${params.type} error:`, error);
    return NextResponse.json(
      { error: `Failed to get master data entries for ${params.type}` },
      { status: 500 }
    );
  }
}

// POST /api/masters/[type] - Create a new entry for a specific master data type
async function createMasterDataEntry(request: NextRequest, { params }: { params: { type: string } }, user: JWTPayload) {
  try {
    const tableName = MasterDataManagementEngine.getTableName(params.type);
    const body = await request.json();

    // Basic validation (more comprehensive validation would be schema-driven)
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required to create a master data entry' },
        { status: 400 }
      );
    }

    const newEntry = await MasterDataManagementEngine.createMasterDataEntry(tableName, body);

    return createSuccessResponse({
      entry: newEntry,
      message: `${params.type} entry created successfully`
    }, 201);
  } catch (error) {
    console.error(`Create master data entry for ${params.type} error:`, error);
    return NextResponse.json(
      { error: `Failed to create master data entry for ${params.type}` },
      { status: 500 }
    );
  }
}

// PUT /api/masters/[type]/[id] - Update an entry for a specific master data type
async function updateMasterDataEntry(request: NextRequest, { params }: { params: { type: string, id: string } }, user: JWTPayload) {
  try {
    const tableName = MasterDataManagementEngine.getTableName(params.type);
    const body = await request.json();

    const updated = await MasterDataManagementEngine.updateMasterDataEntry(tableName, parseInt(params.id), body);

    if (updated) {
      return createSuccessResponse({
        message: `${params.type} entry updated successfully`
      });
    } else {
      return NextResponse.json(
        { error: `${params.type} entry not found or no changes made` },
        { status: 404 }
      );
    }
  }
  catch (error) {
    console.error(`Update master data entry for ${params.type} error:`, error);
    return NextResponse.json(
      { error: `Failed to update master data entry for ${params.type}` },
      { status: 500 }
    );
  }
}

// DELETE /api/masters/[type]/[id] - Delete an entry for a specific master data type
async function deleteMasterDataEntry(request: NextRequest, { params }: { params: { type: string, id: string } }, user: JWTPayload) {
  try {
    const tableName = MasterDataManagementEngine.getTableName(params.type);

    const deleted = await MasterDataManagementEngine.deleteMasterDataEntry(tableName, parseInt(params.id));

    if (deleted) {
      return createSuccessResponse({
        message: `${params.type} entry deleted successfully`
      });
    } else {
      return NextResponse.json(
        { error: `${params.type} entry not found` },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error(`Delete master data entry for ${params.type} error:`, error);
    return NextResponse.json(
      { error: `Failed to delete master data entry for ${params.type}` },
      { status: 500 }
    );
  }
}

export const GET = withApiMiddleware(getMasterDataEntries);
export const POST = withApiMiddleware(createMasterDataEntry);
export const PUT = withApiMiddleware(updateMasterDataEntry);
export const DELETE = withApiMiddleware(deleteMasterDataEntry);