import { NextRequest, NextResponse } from 'next/server'
import { withReportAccess } from '@/lib/auth-middleware'
import { bulkOperationsService } from '@/lib/bulk-operations-service'
import { parseFilterParams } from '@/lib/api-utils'
import { DepartmentFilterService } from '@/lib/department-filter'
import { JWTPayload } from '@/types/auth'

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
    
    if (user.role === 'admin' && filters.department) {
      exportFilters.department = filters.department
    } else if (user.role !== 'admin' && user.department) {
      exportFilters.department = user.department
    }

    // Apply additional filters
    if (filters.location) exportFilters.location = filters.location
    if (filters.status) exportFilters.currentStatus = filters.status
    if (filters.classification) exportFilters.assetClassification = filters.classification

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
        'Content-Disposition': `attachment; filename="${filename}"`,
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