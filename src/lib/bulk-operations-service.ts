

import 'server-only'

import { query } from './db'
import { createObjectId } from '@/types/server-types'
import { AssetManagementFormData } from './schemas'
import ExcelJS from 'exceljs'

// Bulk operation interfaces
export interface BulkOperationResult {
  success: boolean
  totalProcessed: number
  successCount: number
  errorCount: number
  errors: Array<{
    index: number
    error: string
    data?: any
  }>
  duration: number
  operationId: string
}

export interface BulkImportOptions {
  batchSize?: number
  skipValidation?: boolean
  upsert?: boolean
  continueOnError?: boolean
  validateOnly?: boolean
}

export interface BulkExportOptions {
  format: 'json' | 'csv' | 'excel'
  includeHeaders?: boolean
  batchSize?: number
  compression?: boolean
}

// Progress tracking for long-running operations
export interface OperationProgress {
  operationId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  totalItems: number
  processedItems: number
  successCount: number
  errorCount: number
  startTime: Date
  endTime?: Date
  errors: Array<{
    index: number
    error: string
    data?: any
  }>
}

// Bulk operations service
export class BulkOperationsService {
  private operationProgress: Map<string, OperationProgress> = new Map()
  private readonly MAX_BATCH_SIZE = 1000
  private readonly DEFAULT_BATCH_SIZE = 100

  constructor() {}

  /**
   * Bulk import assets with validation and error handling
   */
  async bulkImportAssets(
    assetsData: AssetManagementFormData[],
    userId: string,
    options: BulkImportOptions = {}
  ): Promise<BulkOperationResult> {
    const operationId = createObjectId(); // Using custom object ID for consistency
    const startTime = Date.now();
    
    const {
      batchSize = this.DEFAULT_BATCH_SIZE,
      skipValidation = false,
      upsert = false,
      continueOnError = true,
      validateOnly = false
    } = options;

    // Initialize progress tracking
    const progress: OperationProgress = {
      operationId,
      status: 'running',
      totalItems: assetsData.length,
      processedItems: 0,
      successCount: 0,
      errorCount: 0,
      startTime: new Date(),
      errors: []
    };
    this.operationProgress.set(operationId, progress);

    const results: BulkOperationResult = {
      success: true,
      totalProcessed: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
      duration: 0,
      operationId
    };

    try {
      const effectiveBatchSize = Math.min(batchSize, this.MAX_BATCH_SIZE);
      
      for (let i = 0; i < assetsData.length; i += effectiveBatchSize) {
        const batch = assetsData.slice(i, i + effectiveBatchSize);
        
        const batchResult = await this.processBatch(
          batch,
          i,
          userId,
          { skipValidation, upsert, validateOnly }
        );
        
        results.successCount += batchResult.successCount;
        results.errorCount += batchResult.errorCount;
        results.errors.push(...batchResult.errors);
        
        // Update progress
        progress.processedItems = Math.min(i + effectiveBatchSize, assetsData.length);
        progress.successCount = results.successCount;
        progress.errorCount = results.errorCount;
        progress.errors = results.errors;
        
        if (progress.status === 'cancelled') {
            results.success = false;
            results.errorCount += (assetsData.length - progress.processedItems);
            results.errors.push({ index: progress.processedItems, error: 'Operation cancelled', data: null });
            break;
        }

        if (!continueOnError && batchResult.errorCount > 0) {
          results.success = false;
          results.errorCount += (assetsData.length - progress.processedItems);
          results.errors.push({ index: progress.processedItems, error: 'Stopped due to error', data: null });
          break;
        }
      }

      results.totalProcessed = assetsData.length;
      results.duration = Date.now() - startTime;
      results.success = results.errorCount === 0;

      // Update final progress
      progress.status = results.success ? 'completed' : 'failed';
      progress.endTime = new Date();
      progress.processedItems = results.totalProcessed;

      return results;
    } catch (error: any) {
      progress.status = 'failed';
      progress.endTime = new Date();
      progress.errors.push({ index: 0, error: error.message, data: null });
      results.success = false;
      results.errorCount = assetsData.length;
      results.errors.push({ index: 0, error: error.message, data: null });
      return results;
    }
  }

  /**
   * Process a batch of assets
   */
  private async processBatch(
    batch: AssetManagementFormData[],
    startIndex: number,
    userId: string,
    options: { skipValidation: boolean; upsert: boolean; validateOnly: boolean }
  ): Promise<{ successCount: number; errorCount: number; errors: any[] }> {
    const result = {
      successCount: 0,
      errorCount: 0,
      errors: []
    };

    for (let i = 0; i < batch.length; i++) {
      const assetData = batch[i];
      const globalIndex = startIndex + i;
      
      try {
        // Validate asset data
        if (!options.skipValidation) {
          this.validateAssetData(assetData, globalIndex);
        }

        // Skip actual database operations if validation only
        if (options.validateOnly) {
          result.successCount++;
          continue;
        }

        // Look up foreign key IDs
        const departmentId = (await query('SELECT id FROM departments WHERE name = $1', [assetData.department_id])).rows[0]?.id;
        const locationId = (await query('SELECT id FROM locations WHERE name = $1', [assetData.location_id])).rows[0]?.id;
        const assetClassificationId = (await query('SELECT id FROM asset_classifications WHERE name = $1', [assetData.asset_classification_id])).rows[0]?.id;
        const assetGroupingId = assetData.asset_grouping_id ? (await query('SELECT id FROM asset_groupings WHERE name = $1', [assetData.asset_grouping_id])).rows[0]?.id : null;
        const currentStatusId = (await query('SELECT id FROM asset_statuses WHERE name = $1', [assetData.current_status_id])).rows[0]?.id;
        const teamOrTribeId = assetData.team_or_tribe_id ? (await query('SELECT id FROM teams_and_tribes WHERE name = $1', [assetData.team_or_tribe_id])).rows[0]?.id : null;
        const lifecycleStageId = assetData.lifecycle_stage_id ? (await query('SELECT id FROM lifecycle_stages WHERE name = $1', [assetData.lifecycle_stage_id])).rows[0]?.id : null;

        const insertSql = `
          INSERT INTO assets (
            id, asset_number, km_number, asset_description, asset_classification_id, asset_grouping_id, 
            lifecycle_years, capitalization_date, eol_date, purchase_value, ledger_qty, brand_name, 
            model_no, product_serial_no, on_going_project, weekly_usage_frequency, person_responsible, 
            current_user, team_or_tribe_id, department_id, asset_coordinator, location_id, floor, 
            laboratory, verification_status, verified_on, usable_condition, working_condition_status, 
            comments, current_status_id, status_changed_on, lifecycle_stage_id, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 
            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, NOW(), NOW()
          ) RETURNING id;
        `;

        const insertParams = [
          assetData.id || createObjectId(),
          assetData.asset_number,
          assetData.km_number,
          assetData.asset_description,
          assetClassificationId,
          assetGroupingId,
          assetData.lifecycle_years,
          assetData.capitalization_date,
          assetData.eol_date,
          assetData.purchase_value,
          assetData.ledger_qty,
          assetData.brand_name,
          assetData.model_no,
          assetData.product_serial_no,
          assetData.on_going_project,
          assetData.weekly_usage_frequency,
          assetData.person_responsible,
          assetData.current_user,
          teamOrTribeId,
          departmentId,
          assetData.asset_coordinator,
          locationId,
          assetData.floor,
          assetData.laboratory,
          assetData.verification_status,
          assetData.verified_on,
          assetData.usable_condition,
          assetData.working_condition_status,
          assetData.comments,
          currentStatusId,
          assetData.status_changed_on,
          lifecycleStageId
        ];

        if (options.upsert && assetData.id) {
          // For upsert, we would need to construct an UPDATE statement or use ON CONFLICT
          // This is a simplified example, assuming INSERT for now.
          await query(insertSql, insertParams);
        } else {
          await query(insertSql, insertParams);
        }
        result.successCount++;
      } catch (error: any) {
        result.errorCount++;
        result.errors.push({
          index: globalIndex,
          error: error.message,
          data: assetData
        });
      }
    }
    return result;
  }

  /**
   * Validate asset data
   */
  private validateAssetData(assetData: AssetManagementFormData, index: number): void {
    // Basic validation, more comprehensive validation is done by Zod schema in API layer
    if (!assetData.asset_description) {
      throw new Error('Asset Description is required');
    }
    if (!assetData.department_id) {
      throw new Error('Department is required');
    }
    if (!assetData.location_id) {
      throw new Error('Location is required');
    }
    if (!assetData.ledger_qty || assetData.ledger_qty < 1) {
      throw new Error('Ledger Quantity must be at least 1');
    }
  }

  /**
   * Generate unique asset number
   */
  private async generateAssetNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `KTI-${year}-`;
    
    const { rows } = await query(
      `SELECT asset_number FROM assets WHERE asset_number LIKE $1 ORDER BY asset_number DESC LIMIT 1`,
      [`${prefix}%`]
    );

    let nextNumber = 1;
    if (rows.length > 0) {
      const lastAssetNumber = rows[0].asset_number;
      const lastNumber = parseInt(lastAssetNumber.replace(prefix, ''));
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Bulk export assets with filtering
   */
  async bulkExportAssets(
    filters: any = {},
    options: BulkExportOptions
  ): Promise<Buffer> {
    try {
      const { format } = options;

      let whereClauses: string[] = [];
      let params: any[] = [];
      let paramIndex = 1;

      // Convert filter names to IDs if necessary
      if (filters.department) {
        const { rows } = await query('SELECT id FROM departments WHERE name = $1', [filters.department]);
        if (rows.length > 0) {
          whereClauses.push(`a.department_id = ${paramIndex++}`);
          params.push(rows[0].id);
        }
      }
      if (filters.location) {
        const { rows } = await query('SELECT id FROM locations WHERE name = $1', [filters.location]);
        if (rows.length > 0) {
          whereClauses.push(`a.location_id = ${paramIndex++}`);
          params.push(rows[0].id);
        }
      }
      if (filters.currentStatus) {
        const { rows } = await query('SELECT id FROM asset_statuses WHERE name = $1', [filters.currentStatus]);
        if (rows.length > 0) {
          whereClauses.push(`a.current_status_id = ${paramIndex++}`);
          params.push(rows[0].id);
        }
      }
      if (filters.assetClassification) {
        const { rows } = await query('SELECT id FROM asset_classifications WHERE name = $1', [filters.assetClassification]);
        if (rows.length > 0) {
          whereClauses.push(`a.asset_classification_id = ${paramIndex++}`);
          params.push(rows[0].id);
        }
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const selectSql = `
        SELECT 
          a.asset_number, a.km_number, a.asset_description, ac.name as asset_classification, ag.name as asset_grouping,
          a.lifecycle_years, a.capitalization_date, a.eol_date, a.purchase_value, a.ledger_qty, a.brand_name,
          a.model_no, a.product_serial_no, a.on_going_project, a.weekly_usage_frequency, a.person_responsible,
          a.current_user, t.name as team_or_tribe, d.name as department, a.asset_coordinator, l.name as location,
          a.floor, a.laboratory, a.verification_status, a.verified_on, a.usable_condition, a.working_condition_status,
          a.comments, ast.name as current_status, a.status_changed_on, ls.name as lifecycle_stage, a.created_at
        FROM assets a
        LEFT JOIN asset_classifications ac ON a.asset_classification_id = ac.id
        LEFT JOIN asset_groupings ag ON a.asset_grouping_id = ag.id
        LEFT JOIN departments d ON a.department_id = d.id
        LEFT JOIN locations l ON a.location_id = l.id
        LEFT JOIN asset_statuses ast ON a.current_status_id = ast.id
        LEFT JOIN lifecycle_stages ls ON a.lifecycle_stage_id = ls.id
        LEFT JOIN teams_and_tribes t ON a.team_or_tribe_id = t.id
        ${whereClause}
        ORDER BY a.asset_number ASC
      `;

      const { rows: assets } = await query(selectSql, params);
      
      if (assets.length === 0) {
        throw new Error('No assets found matching the criteria');
      }

      // Export based on format
      switch (format) {
        case 'json':
          return this.exportToJSON(assets);
        case 'csv':
          return this.exportToCSV(assets, options.includeHeaders);
        case 'excel':
          return this.exportToExcel(assets);
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error: any) {
      throw new Error(`bulkExportAssets failed: ${error.message}`);
    }
  }

  /**
   * Export to JSON format
   */
  private exportToJSON(assets: any[]): Buffer {
    return Buffer.from(JSON.stringify(assets, null, 2));
  }

  /**
   * Export to CSV format
   */
  private exportToCSV(
    assets: any[],
    includeHeaders: boolean = true
  ): Buffer {
    const csvRows = [];
    
    // Add headers
    if (includeHeaders) {
      const headers = [
        'Asset Number', 'KM Number', 'Description', 'Classification', 'Grouping', 'Lifecycle Years',
        'Capitalization Date', 'EOL Date', 'Purchase Value', 'Ledger Quantity', 'Brand', 'Model',
        'Serial Number', 'On-going Project', 'Weekly Usage Frequency', 'Person Responsible', 'Current User',
        'Team/Tribe', 'Department', 'Asset Coordinator', 'Location', 'Floor', 'Laboratory',
        'Verification Status', 'Verified On', 'Usable Condition', 'Working Condition Status', 'Comments',
        'Current Status', 'Status Changed On', 'Lifecycle Stage', 'Created At'
      ];
      csvRows.push(headers.join(','));
    }

    for (const asset of assets) {
      const row = [
        this.escapeCsvValue(asset.asset_number || ''),
        this.escapeCsvValue(asset.km_number || ''),
        this.escapeCsvValue(asset.asset_description || ''),
        this.escapeCsvValue(asset.asset_classification || ''),
        this.escapeCsvValue(asset.asset_grouping || ''),
        asset.lifecycle_years || '',
        asset.capitalization_date ? new Date(asset.capitalization_date).toISOString().split('T')[0] : '',
        asset.eol_date ? new Date(asset.eol_date).toISOString().split('T')[0] : '',
        asset.purchase_value || '',
        asset.ledger_qty || '',
        this.escapeCsvValue(asset.brand_name || ''),
        this.escapeCsvValue(asset.model_no || ''),
        this.escapeCsvValue(asset.product_serial_no || ''),
        this.escapeCsvValue(asset.on_going_project || ''),
        asset.weekly_usage_frequency || '',
        this.escapeCsvValue(asset.person_responsible || ''),
        this.escapeCsvValue(asset.current_user || ''),
        this.escapeCsvValue(asset.team_or_tribe || ''),
        this.escapeCsvValue(asset.department || ''),
        this.escapeCsvValue(asset.asset_coordinator || ''),
        this.escapeCsvValue(asset.location || ''),
        this.escapeCsvValue(asset.floor || ''),
        this.escapeCsvValue(asset.laboratory || ''),
        this.escapeCsvValue(asset.verification_status || ''),
        asset.verified_on ? new Date(asset.verified_on).toISOString().split('T')[0] : '',
        this.escapeCsvValue(asset.usable_condition || ''),
        this.escapeCsvValue(asset.working_condition_status || ''),
        this.escapeCsvValue(asset.comments || ''),
        this.escapeCsvValue(asset.current_status || ''),
        asset.status_changed_on ? new Date(asset.status_changed_on).toISOString().split('T')[0] : '',
        this.escapeCsvValue(asset.lifecycle_stage || ''),
        asset.created_at ? new Date(asset.created_at).toISOString() : '',
      ];
      csvRows.push(row.map(item => `"${item}"`).join(','));
    }

    return Buffer.from(csvRows.join('\n'));
  }

  /**
   * Export to Excel format
   */
  private async exportToExcel(
    assets: any[]
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Assets');

    // Add headers
    worksheet.columns = [
      { header: 'Asset Number', key: 'asset_number', width: 15 },
      { header: 'KM Number', key: 'km_number', width: 15 },
      { header: 'Description', key: 'asset_description', width: 30 },
      { header: 'Classification', key: 'asset_classification', width: 15 },
      { header: 'Grouping', key: 'asset_grouping', width: 15 },
      { header: 'Lifecycle Years', key: 'lifecycle_years', width: 15 },
      { header: 'Capitalization Date', key: 'capitalization_date', width: 15 },
      { header: 'EOL Date', key: 'eol_date', width: 15 },
      { header: 'Purchase Value', key: 'purchase_value', width: 15 },
      { header: 'Ledger Quantity', key: 'ledger_qty', width: 15 },
      { header: 'Brand', key: 'brand_name', width: 15 },
      { header: 'Model', key: 'model_no', width: 15 },
      { header: 'Serial Number', key: 'product_serial_no', width: 20 },
      { header: 'On-going Project', key: 'on_going_project', width: 15 },
      { header: 'Weekly Usage Frequency', key: 'weekly_usage_frequency', width: 15 },
      { header: 'Person Responsible', key: 'person_responsible', width: 20 },
      { header: 'Current User', key: 'current_user', width: 20 },
      { header: 'Team/Tribe', key: 'team_or_tribe', width: 15 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Asset Coordinator', key: 'asset_coordinator', width: 20 },
      { header: 'Location', key: 'location', width: 15 },
      { header: 'Floor', key: 'floor', width: 10 },
      { header: 'Laboratory', key: 'laboratory', width: 15 },
      { header: 'Verification Status', key: 'verification_status', width: 20 },
      { header: 'Verified On', key: 'verified_on', width: 15 },
      { header: 'Usable Condition', key: 'usable_condition', width: 15 },
      { header: 'Working Condition Status', key: 'working_condition_status', width: 25 },
      { header: 'Comments', key: 'comments', width: 30 },
      { header: 'Current Status', key: 'current_status', width: 15 },
      { header: 'Status Changed On', key: 'status_changed_on', width: 15 },
      { header: 'Lifecycle Stage', key: 'lifecycle_stage', width: 15 },
      { header: 'Created At', key: 'created_at', width: 15 },
    ];

    // Add data
    worksheet.addRows(assets.map(asset => ({
        ...asset,
        capitalization_date: asset.capitalization_date ? new Date(asset.capitalization_date).toISOString().split('T')[0] : '',
        eol_date: asset.eol_date ? new Date(asset.eol_date).toISOString().split('T')[0] : '',
        verified_on: asset.verified_on ? new Date(asset.verified_on).toISOString().split('T')[0] : '',
        status_changed_on: asset.status_changed_on ? new Date(asset.status_changed_on).toISOString().split('T')[0] : '',
        created_at: asset.created_at ? new Date(asset.created_at).toISOString() : '',
    })));

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  /**
   * Escape CSV values
   */
  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Get operation progress
   */
  getOperationProgress(operationId: string): OperationProgress | null {
    return this.operationProgress.get(operationId) || null;
  }

  /**
   * Cancel operation
   */
  cancelOperation(operationId: string): boolean {
    const progress = this.operationProgress.get(operationId);
    if (progress && progress.status === 'running') {
      progress.status = 'cancelled';
      progress.endTime = new Date();
      return true;
    }
    return false;
  }

  /**
   * Clean up old operation records
   */
  cleanupOperations(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    for (const [operationId, progress] of this.operationProgress.entries()) {
      if (progress.startTime < cutoffTime && progress.status !== 'running') {
        this.operationProgress.delete(operationId);
      }
    }
  }
}

// Export service instance
export const bulkOperationsService = new BulkOperationsService();