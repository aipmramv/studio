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
    const orderBy = sortEntries.length > 0 ? `ORDER BY ${sortEntries.map(([key, value]) => `${key} ${value}`).join(', ')}` : '';

    const { rows: assets } = await query(`SELECT * FROM assets ${orderBy} LIMIT $1 OFFSET $2`, [limit, skip]);
    const { rows: [{ count }] } = await query('SELECT COUNT(*) FROM assets');

    return { assets, total: parseInt(count, 10) };
}

export async function getAssetById(id: string) {
    const { rows } = await query('SELECT * FROM assets WHERE id = $1', [id]);
    return rows[0];
}

export async function createAsset(assetData: Record<string, any>) {
    const id = createObjectId();
    const sql = `
        INSERT INTO assets (id, name, type, status, location, purchase_date, purchase_price, current_value, assigned_to, last_maintenance, next_maintenance, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING id;
    `;
    const params = [
        id,
        assetData.name,
        assetData.type,
        assetData.status,
        assetData.location,
        assetData.purchaseDate,
        assetData.purchasePrice,
        assetData.currentValue,
        assetData.assignedTo,
        assetData.lastMaintenance,
        assetData.nextMaintenance
    ];
    const { rows } = await query(sql, params);
    return rows[0].id;
}

export async function updateAsset(id: string, updates: Record<string, any>) {
    const setClauses = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const sql = `UPDATE assets SET ${setClauses}, updated_at = NOW() WHERE id = $1`;
    const params = [id, ...Object.values(updates)];
    const { rowCount } = await query(sql, params);
    return rowCount > 0;
}

export async function deleteAsset(id: string) {
    const { rowCount } = await query('DELETE FROM assets WHERE id = $1', [id]);
    return rowCount > 0;
}

// User operations
export async function getUserByEmail(email: string) {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
}

export async function createUser(userData: Record<string, any>) {
    const id = createObjectId();
    const sql = `
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id;
    `;
    const params = [id, userData.email, userData.name, userData.role];
    const { rows } = await query(sql, params);
    return rows[0].id;
}

// Workflow operations
export async function getWorkflows(filter: WorkflowFilter = {}, options: QueryOptions = {}) {
    const { limit = 50, skip = 0, sort = { created_at: 'DESC' } } = options;
    const sortEntries = Object.entries(sort);
    const orderBy = sortEntries.length > 0 ? `ORDER BY ${sortEntries.map(([key, value]) => `${key} ${value}`).join(', ')}` : '';

    const { rows: workflows } = await query(`SELECT * FROM workflow_instances ${orderBy} LIMIT $1 OFFSET $2`, [limit, skip]);
    const { rows: [{ count }] } = await query('SELECT COUNT(*) FROM workflow_instances');

    return { workflows, total: parseInt(count, 10) };
}

// Dashboard analytics
export async function getDashboardStats() {
    const [
        { rows: [{ count: totalAssets }] },
        { rows: [{ count: totalUsers }] },
        { rows: [{ count: totalWorkflows }] },
        { rows: assetsByStatusRows }
    ] = await Promise.all([
        query('SELECT COUNT(*) FROM assets'),
        query('SELECT COUNT(*) FROM users WHERE is_active = true'),
        query('SELECT COUNT(*) FROM workflow_instances'),
        query('SELECT status, COUNT(*) as count FROM assets GROUP BY status')
    ]);

    const assetsByStatus = assetsByStatusRows.reduce((acc, item) => {
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
