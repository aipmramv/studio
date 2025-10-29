
import { NextRequest, NextResponse } from 'next/server'
import { withReportAccess } from '@/lib/auth-middleware'
import { bulkOperationsService } from '@/lib/bulk-operations-service'
import { parseFilterParams } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'
import { query } from '@/lib/db'

async function bulkExportAssetsHandler(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = parseFilterParams(searchParams)
    const format = searchParams.get('format') || 'excel'

    if (!['json', 'csv', 'excel'].includes(format)) {
      return NextResponse.json(
        { error: 'Format must be json, csv, or excel' },
        { status: 400 }
      )
    }

    // Apply department filtering based on user role
    let exportFilters: any = {}
    
    let departmentId = null;
    if (filters.department) {
        const { rows } = await query('SELECT id FROM departments WHERE name = ', [filters.department]);
        if (rows.length > 0) departmentId = rows[0].id;
    }

    if (user.role === 'admin' && departmentId) {
      exportFilters.department_id = departmentId;
    } else if (user.role !== 'admin' && user.department_id) {
      exportFilters.department_id = user.department_id;
    }

    // Apply additional filters
    if (filters.location) {
        const { rows } = await query('SELECT id FROM locations WHERE name = ', [filters.location]);
        if (rows.length > 0) exportFilters.location_id = rows[0].id;
    }
    if (filters.status) {
        const { rows } = await query('SELECT id FROM asset_statuses WHERE name = ', [filters.status]);
        if (rows.length > 0) exportFilters.current_status_id = rows[0].id;
    }
    if (filters.classification) {
        const { rows } = await query('SELECT id FROM asset_classifications WHERE name = ', [filters.classification]);
        if (rows.length > 0) exportFilters.asset_classification_id = rows[0].id;
    }

    const exportOptions = {
      format: format as 'json' | 'csv' | 'excel',
      includeHeaders: searchParams.get('includeHeaders') !== 'false',
      batchSize: parseInt(searchParams.get('batchSize') || '1000')
    }

    const buffer = await bulkOperationsService.bulkExportAssets(
      exportFilters,
      exportOptions
    )

    // Determine content type and filename
    let contentType: string
    let fileExtension: string

    switch (format) {
      case 'json':
        contentType = 'application/json'
        fileExtension = 'json'
        break
      case 'csv':
        contentType = 'text/csv'
        fileExtension = 'csv'
        break
      case 'excel':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        fileExtension = 'xlsx'
        break
      default:
        contentType = 'application/octet-stream'
        fileExtension = 'bin'
    }

    const filename = `assets_export_${new Date().toISOString().split('T')[0]}.${fileExtension}`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}" নীতিমালা`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Bulk export error:', error)
    return NextResponse.json(
      { error: 'Failed to export assets' },
      { status: 500 }
    )
  }
}

export const GET = withReportAccess(bulkExportAssetsHandler, 'export')