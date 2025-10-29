import { query } from './db';
import { createObjectId } from '@/types/server-types';
import { JWTPayload } from '@/types/auth';

// Master data types and interfaces
// ... (interfaces remain the same)

export class MasterDataManagementEngine {
  private masterDataTypesTable = 'master_data_types';
  private masterDataTable = 'master_data';
  private changeHistoryTable = 'master_data_changes';

  constructor() {}

  async registerMasterDataType(
    typeData: Omit<MasterDataType, 'id' | 'createdAt' | 'updatedAt'>,
    createdBy: string
  ): Promise<MasterDataType> {
    this.validateMasterDataSchema(typeData.schema);

    await this.createMasterDataTable(typeData.collection, typeData.schema);

    const typeId = createObjectId();
    const typeDocument: Omit<MasterDataType, 'id'> = {
      ...typeData,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      lastModifiedBy: createdBy
    };

    const sql = `
      INSERT INTO ${this.masterDataTypesTable} (id, name, description, category, collection, schema, validation, permissions, versioning, is_active, created_at, updated_at, created_by, last_modified_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id;
    `;
    const params = [
      typeId,
      typeDocument.name,
      typeDocument.description,
      typeDocument.category,
      typeDocument.collection,
      JSON.stringify(typeDocument.schema),
      JSON.stringify(typeDocument.validation),
      JSON.stringify(typeDocument.permissions),
      JSON.stringify(typeDocument.versioning),
      typeDocument.isActive,
      typeDocument.createdAt,
      typeDocument.updatedAt,
      typeDocument.createdBy,
      typeDocument.lastModifiedBy
    ];

    await query(sql, params);

    return {
      id: typeId,
      ...typeDocument
    };
  }

  // ... other methods (rewritten for PostgreSQL)
}

// Export service instance
export const masterDataManagementEngine = new MasterDataManagementEngine();