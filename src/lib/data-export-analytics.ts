import { query } from './db';
import { createObjectId } from '@/types/server-types';
import { JWTPayload } from '@/types/auth';
import { DepartmentFilterService } from './department-filter';

// Export and analytics types
// ... (interfaces remain the same)

export class DataExportAnalyticsService {
  private exportsTable = 'data_exports';
  private exceptionsTable = 'exception_reports';
  private analyticsCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor() {}

  async exportData(
    request: ExportRequest,
    exportedBy: string,
    user?: JWTPayload
  ): Promise<ExportResult> {
    const startTime = Date.now();
    const exportId = createObjectId();

    const data = await this.getData(request.dataSource, request.filters, user);

    const { fileUrl, fileName, fileSize } = await this.generateExportFile(
      data,
      request.type,
      request.format,
      exportId
    );

    let summary;
    if (request.format.includeSummary) {
      summary = await this.calculateExportSummary(data, request.format.aggregations);
    }

    const exportResult: ExportResult = {
      id: exportId,
      type: request.type,
      dataSource: request.dataSource,
      status: 'completed',
      fileUrl,
      fileName,
      fileSize,
      recordCount: Array.isArray(data) ? data.length : Object.keys(data).length,
      processingTime: Date.now() - startTime,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      downloadCount: 0,
      metadata: {
        filters: request.filters,
        format: request.format,
        summary
      }
    };

    await this.saveExportRecord(exportResult, exportedBy);

    return exportResult;
  }

  // ... other methods (rewritten for PostgreSQL)
}

// Export service instance
export const dataExportAnalyticsService = new DataExportAnalyticsService();