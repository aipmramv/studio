
import "server-only";

import { query } from "./db";
import { createObjectId } from "@/types/server-types";

// Type definitions for function parameters
interface QueryOptions {
    limit?: number;
    skip?: number;
    sort?: Record<string, 'ASC' | 'DESC'>;
}

interface AssetFilter {
    [key: string]: any;
}

interface WorkflowFilter {
    [key: string]: any;
}

// Asset operations
export async function getAssets(filter: AssetFilter = {}, options: QueryOptions = {}) {
    const { limit = 50, skip = 0, sort = { updated_at: 'DESC' } } = options;
    const sortEntries = Object.entries(sort);
    const orderBy = sortEntries.length > 0 ? `ORDER BY ${sortEntries.map(([key, value]) => `a.${key} ${value}`).join(', ')}` : '';

    // Build WHERE clause
    let whereClauses: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    Object.entries(filter).forEach(([key, value]) => {
        if (value) {
            whereClauses.push(`a.${key} = ${paramIndex++}`);
            params.push(value);
        }
    });

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const selectClause = `
        SELECT a.*, 
               ac.name as asset_classification_name,
               ag.name as asset_grouping_name,
               d.name as department_name,
               l.name as location_name,
               ast.name as asset_status_name,
               ls.name as lifecycle_stage_name,
               t.name as team_or_tribe_name
        FROM assets a
        LEFT JOIN asset_classifications ac ON a.asset_classification_id = ac.id
        LEFT JOIN asset_groupings ag ON a.asset_grouping_id = ag.id
        LEFT JOIN departments d ON a.department_id = d.id
        LEFT JOIN locations l ON a.location_id = l.id
        LEFT JOIN asset_statuses ast ON a.current_status_id = ast.id
        LEFT JOIN lifecycle_stages ls ON a.lifecycle_stage_id = ls.id
        LEFT JOIN teams_and_tribes t ON a.team_or_tribe_id = t.id
    `;

    const assetsSql = `${selectClause} ${whereClause} ${orderBy} LIMIT ${paramIndex++} OFFSET ${paramIndex++}`;
    const countSql = `SELECT COUNT(*) FROM assets a ${whereClause}`;

    const { rows: assets } = await query(assetsSql, [...params, limit, skip]);
    const { rows: [{ count }] } = await query(countSql, params);

    return { assets, total: parseInt(count, 10) };
}

export async function getAssetById(id: string) {
    const sql = `
        SELECT a.*, 
               ac.name as asset_classification_name,
               ag.name as asset_grouping_name,
               d.name as department_name,
               l.name as location_name,
               ast.name as asset_status_name,
               ls.name as lifecycle_stage_name,
               t.name as team_or_tribe_name
        FROM assets a
        LEFT JOIN asset_classifications ac ON a.asset_classification_id = ac.id
        LEFT JOIN asset_groupings ag ON a.asset_grouping_id = ag.id
        LEFT JOIN departments d ON a.department_id = d.id
        LEFT JOIN locations l ON a.location_id = l.id
        LEFT JOIN asset_statuses ast ON a.current_status_id = ast.id
        LEFT JOIN lifecycle_stages ls ON a.lifecycle_stage_id = ls.id
        LEFT JOIN teams_and_tribes t ON a.team_or_tribe_id = t.id
        WHERE a.id = 
    `;
    const { rows } = await query(sql, [id]);
    return rows[0];
}

export async function createAsset(assetData: Record<string, any>) {
    const id = createObjectId();
    
    // Look up foreign key IDs
    const assetClassificationId = (await query('SELECT id FROM asset_classifications WHERE name = ', [assetData.assetClassification])).rows[0]?.id;
    const assetGroupingId = (await query('SELECT id FROM asset_groupings WHERE name = ', [assetData.assetGrouping])).rows[0]?.id;
    const departmentId = (await query('SELECT id FROM departments WHERE name = ', [assetData.department])).rows[0]?.id;
    const locationId = (await query('SELECT id FROM locations WHERE name = ', [assetData.location])).rows[0]?.id;
    const currentStatusId = (await query('SELECT id FROM asset_statuses WHERE name = ', [assetData.currentStatus])).rows[0]?.id;
    const lifecycleStageId = (await query('SELECT id FROM lifecycle_stages WHERE name = ', [assetData.lifecycleStage])).rows[0]?.id;
    const teamOrTribeId = (await query('SELECT id FROM teams_and_tribes WHERE name = ', [assetData.teamOrTribe])).rows[0]?.id;

    const sql = `
        INSERT INTO assets (id, asset_number, km_number, asset_description, asset_classification_id, asset_grouping_id, lifecycle_years, capitalization_date, eol_date, purchase_value, ledger_qty, brand_name, model_no, product_serial_no, on_going_project, weekly_usage_frequency, person_responsible, current_user, team_or_tribe_id, department_id, asset_coordinator, location_id, floor, laboratory, verification_status, verified_on, usable_condition, working_condition_status, comments, current_status_id, status_changed_on, lifecycle_stage_id, created_at, updated_at)
        VALUES (, $2, $3, $4, $5, $6, $7, $8, $9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, NOW(), NOW())
        RETURNING id;
    `;
    const params = [
        id,
        assetData.assetNumber,
        assetData.kmNumber,
        assetData.assetDescription,
        assetClassificationId,
        assetGroupingId,
        assetData.lifecycleYears,
        assetData.capitalizationDate,
        assetData.eolDate,
        assetData.purchaseValue,
        assetData.ledgerQty,
        assetData.brandName,
        assetData.modelNo,
        assetData.productSerialNo,
        assetData.onGoingProject,
        assetData.weeklyUsageFrequency,
        assetData.personResponsible,
        assetData.currentUser,
        teamOrTribeId,
        departmentId,
        assetData.assetCoordinator,
        locationId,
        assetData.floor,
        assetData.laboratory,
        assetData.verificationStatus,
        assetData.verifiedOn,
        assetData.usableCondition,
        assetData.workingConditionStatus,
        assetData.comments,
        currentStatusId,
        assetData.statusChangedOn,
        lifecycleStageId
    ];
    const { rows } = await query(sql, params);
    return rows[0].id;
}

export async function updateAsset(id: string, updates: Record<string, any>) {
    // Similar to createAsset, you would need to look up foreign key IDs for any updated fields.
    // This is a simplified example.
    const setClauses = Object.keys(updates).map((key, i) => `${key} = ${i + 2}`).join(', ');
    const sql = `UPDATE assets SET ${setClauses}, updated_at = NOW() WHERE id = `;
    const params = [id, ...Object.values(updates)];
    const { rowCount } = await query(sql, params);
    return rowCount > 0;
}

export async function deleteAsset(id: string) {
    const { rowCount } = await query('DELETE FROM assets WHERE id = ', [id]);
    return rowCount > 0;
}

// User operations (These are now in user-management-service.ts, but leaving placeholders if needed elsewhere)
export async function getUserByEmail(email: string) {
    const { rows } = await query('SELECT * FROM users WHERE email = ', [email]);
    return rows[0];
}

export async function createUser(userData: Record<string, any>) {
    // This logic is now in user-management-service.ts
    return null;
}

// Workflow operations
export async function getWorkflows(filter: WorkflowFilter = {}, options: QueryOptions = {}) {
    const { limit = 50, skip = 0, sort = { created_at: 'DESC' } } = options;
    const sortEntries = Object.entries(sort);
    const orderBy = sortEntries.length > 0 ? `ORDER BY ${sortEntries.map(([key, value]) => `wi.${key} ${value}`).join(', ')}` : '';

    const sql = `
        SELECT wi.*, a.asset_number, u.name as created_by_name
        FROM workflow_instances wi
        LEFT JOIN assets a ON wi.asset_id = a.id
        LEFT JOIN users u ON wi.created_by = u.id
        ${orderBy} LIMIT  OFFSET $2
    `;

    const { rows: workflows } = await query(sql, [limit, skip]);
    const { rows: [{ count }] } = await query('SELECT COUNT(*) FROM workflow_instances');

    return { workflows, total: parseInt(count, 10) };
}

// Dashboard analytics
export async function getDashboardStats() {
    const [
        { rows: [{ count: totalAssets }] },
        { rows: [{ count: totalUsers }] },
        { rows: [{ count: totalWorkflows }] },
        assetsByStatusRows
    ] = await Promise.all([
        query('SELECT COUNT(*) FROM assets'),
        query('SELECT COUNT(*) FROM users WHERE is_active = true'),
        query('SELECT COUNT(*) FROM workflow_instances'),
        query('SELECT ast.name as status, COUNT(a.id) as count FROM assets a JOIN asset_statuses ast ON a.current_status_id = ast.id GROUP BY ast.name')
    ]);

    const assetsByStatus = assetsByStatusRows.rows.reduce((acc: any, item: any) => {
        acc[item.status || 'Unknown'] = parseInt(item.count, 10);
        return acc;
    }, {});

    return {
        totalAssets: parseInt(totalAssets, 10),
        totalUsers: parseInt(totalUsers, 10),
        totalWorkflows: parseInt(totalWorkflows, 10),
        assetsByStatus
    };
}

