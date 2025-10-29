
import { query } from './db';
import { createObjectId } from '@/types/server-types';

interface MasterDataEntry {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class MasterDataManagementEngine {
  constructor() {}

  async getMasterDataEntries(tableName: string, filters: Record<string, any> = {}): Promise<MasterDataEntry[]> {
    let whereClauses: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        whereClauses.push(`${key} = ${paramIndex++}`);
        params.push(value);
      }
    });

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sql = `SELECT * FROM ${tableName} ${whereClause} ORDER BY name ASC`;
    const { rows } = await query(sql, params);
    return rows;
  }

  async getMasterDataEntryById(tableName: string, id: number): Promise<MasterDataEntry | null> {
    const sql = `SELECT * FROM ${tableName} WHERE id = `;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  }

  async createMasterDataEntry(tableName: string, data: Record<string, any>): Promise<MasterDataEntry> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `${i + 1}`).join(', ');
    const sql = `INSERT INTO ${tableName} (${keys.join(', ')}, created_at, updated_at) VALUES (${placeholders}, NOW(), NOW()) RETURNING *`;
    const { rows } = await query(sql, values);
    return rows[0];
  }

  async updateMasterDataEntry(tableName: string, id: number, data: Record<string, any>): Promise<boolean> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClauses = keys.map((key, i) => `${key} = ${i + 2}`).join(', ');
    const sql = `UPDATE ${tableName} SET ${setClauses}, updated_at = NOW() WHERE id = `;
    const { rowCount } = await query(sql, [id, ...values]);
    return rowCount > 0;
  }

  async deleteMasterDataEntry(tableName: string, id: number): Promise<boolean> {
    const sql = `DELETE FROM ${tableName} WHERE id = `;
    const { rowCount } = await query(sql, [id]);
    return rowCount > 0;
  }

  // Helper to get table name from master data type name
  static getTableName(masterDataType: string): string {
    switch (masterDataType) {
      case 'departments': return 'departments';
      case 'locations': return 'locations';
      case 'asset-classifications': return 'asset_classifications';
      case 'asset-groupings': return 'asset_groupings';
      case 'asset-statuses': return 'asset_statuses';
      case 'teams-and-tribes': return 'teams_and_tribes';
      case 'uom': return 'uom';
      case 'hsn-sac-codes': return 'hsn_sac_codes';
      case 'store-locations': return 'store_locations';
      case 'cost-centers': return 'cost_centers';
      case 'material-types': return 'material_types';
      case 'scrap-types': return 'scrap_types';
      case 'activity-types': return 'activity_types';
      case 'customers': return 'customers';
      case 'vendors': return 'vendors';
      case 'roles': return 'roles';
      case 'permissions': return 'permissions';
      case 'lifecycle-stages': return 'lifecycle_stages';
      case 'request-types': return 'request_types';
      case 'request-statuses': return 'request_statuses';
      case 'material-categories': return 'material_categories';
      default: throw new Error(`Unknown master data type: ${masterDataType}`);
    }
  }
}

export const masterDataManagementEngine = new MasterDataManagementEngine();