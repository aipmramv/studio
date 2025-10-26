import { NextRequest, NextResponse } from 'next/server'
import { 
  getServerDatabaseConnection, 
  getServerDatabaseHealth 
} from '@/lib/server-only-mongodb'

export async function GET(request: NextRequest) {
  try {
    // Perform health check using server-only module
    const healthCheck = await getServerDatabaseHealth()
    
    // Get basic connection info
    const connection = await getServerDatabaseConnection()
    const collections = await connection.listCollections().toArray()
    
    return NextResponse.json({
      status: 'success',
      data: {
        connected: healthCheck.status === 'connected',
        details: healthCheck.details,
        collections: collections.map(c => ({
          name: c.name,
          type: c.type || 'collection'
        })),
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Database status check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      error: {
        message: 'Database status check failed',
        details: error?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}