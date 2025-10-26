import { NextRequest, NextResponse } from 'next/server'
import { MongoDBConnection } from '@/lib/mongodb-service'
import { authMiddleware } from '@/lib/auth-middleware'
import { ObjectId, isValidObjectId } from '@/types/server-types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const authResult = await authMiddleware(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: 401 }
      )
    }

    const { id } = params

    // Validate asset ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid asset ID' },
        { status: 400 }
      )
    }

    // Connect to database
    const db = await MongoDBConnection.getInstance().connect()

    // Check if asset exists and user has access
    const asset = await db.collection('assets').findOne({ _id: new ObjectId(id) })
    
    if (!asset) {
      return NextResponse.json(
        { success: false, message: 'Asset not found' },
        { status: 404 }
      )
    }

    // Check department access for non-admin users
    if (authResult.user.role !== 'admin' && asset.department !== authResult.user.department) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // Get asset history
    const history = await db.collection('assetHistory')
      .find({ assetId: id })
      .sort({ performedAt: -1 })
      .limit(50)
      .toArray()

    // Transform history data
    const transformedHistory = history.map(entry => ({
      id: entry._id.toString(),
      assetId: entry.assetId,
      action: entry.action,
      description: entry.description,
      performedBy: entry.performedBy,
      performedAt: entry.performedAt,
      details: entry.details,
      oldValues: entry.oldValues,
      newValues: entry.newValues
    }))

    return NextResponse.json({
      success: true,
      data: {
        history: transformedHistory
      }
    })

  } catch (error) {
    console.error('Error fetching asset history:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}