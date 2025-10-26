import { NextRequest, NextResponse } from 'next/server'
import { 
  getServerDatabaseHealth, 
  getServerDatabaseStats, 
  checkServerCollectionHealth 
} from '@/lib/server-only-mongodb'

export async function GET(request: NextRequest) {
  try {
    // Perform health check
    const healthCheck = await getServerDatabaseHealth()
    
    // Get database statistics
    const stats = await getServerDatabaseStats()
    
    // Check individual collection health
    const collections = ['assets', 'users', 'workflows']
    const collectionHealth: Record<string, any> = {}
    
    for (const collectionName of collections) {
      try {
        collectionHealth[collectionName] = await checkServerCollectionHealth(collectionName)
      } catch (error: any) {
        collectionHealth[collectionName] = {
          status: 'error',
          details: { error: error?.message || 'Unknown error' }
        }
      }
    }

    return NextResponse.json({
      status: 'success',
      data: {
        connection: healthCheck,
        statistics: stats,
        collections: collectionHealth,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Database health check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      error: {
        message: 'Database health check failed',
        details: error?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}