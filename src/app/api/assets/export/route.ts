import { NextRequest } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { assetService, MongoDBConnection } from '@/lib/mongodb-service'

// POST /api/assets/export - Export assets to Excel/CSV
async function exportAssetsHandler(request: NextRequest, user: any) {
  const body = await request.json()
  const { format = 'csv', filters = {}, fields = [] } = body

  // Build query based on filters and user permissions
  const query: any = {}
  
  // Role-based filtering
  if (user.role !== 'admin') {
    query.department = user.department
  } else if (filters.department) {
    query.department = filters.department
  }

  // Apply other filters
  if (filters.location) query.location = filters.location
  if (filters.status) query.currentStatus = filters.status
  if (filters.classification) query.assetClassification = filters.classification
  if (filters.searchTerm) {
    query.$or = [
      { assetNumber: { $regex: filters.searchTerm, $options: 'i' } },
      { assetDescription: { $regex: filters.searchTerm, $options: 'i' } },
      { kmNumber: { $regex: filters.searchTerm, $options: 'i' } },
      { productSerialNo: { $regex: filters.searchTerm, $options: 'i' } },
    ]
  }

  // Get assets
  const db = MongoDBConnection.getInstance().getDb()
  const assetsCollection = db.collection('assets')
  
  // Define default fields if none specified
  const defaultFields = [
    'assetNumber',
    'assetDescription',
    'department',
    'location',
    'currentStatus',
    'assetClassification',
    'purchaseValue',
    'brandName',
    'modelNo',
    'productSerialNo',
    'verificationStatus',
    'createdAt',
    'updatedAt'
  ]

  const selectedFields = fields.length > 0 ? fields : defaultFields
  
  // Build projection
  const projection: any = {}
  selectedFields.forEach(field => {
    projection[field] = 1
  })

  const assets = await assetsCollection
    .find(query, { projection })
    .sort({ assetNumber: 1 })
    .toArray()

  if (format === 'json') {
    return Response.json({
      success: true,
      data: assets,
      total: assets.length,
      exportedAt: new Date().toISOString(),
    })
  }

  // Generate CSV
  if (assets.length === 0) {
    const csvContent = selectedFields.join(',') + '\n'
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="assets_export.csv"',
      },
    })
  }

  // Create CSV content
  const csvRows = []
  
  // Header row
  csvRows.push(selectedFields.join(','))
  
  // Data rows
  assets.forEach(asset => {
    const row = selectedFields.map(field => {
      let value = asset[field]
      
      // Handle different data types
      if (value === null || value === undefined) {
        return ''
      }
      
      if (value instanceof Date) {
        return value.toISOString().split('T')[0] // Format as YYYY-MM-DD
      }
      
      if (typeof value === 'object') {
        return JSON.stringify(value)
      }
      
      // Escape commas and quotes in CSV
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      
      return stringValue
    })
    
    csvRows.push(row.join(','))
  })

  const csvContent = csvRows.join('\n')
  
  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="assets_export_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}

export const POST = withApiMiddleware(exportAssetsHandler)