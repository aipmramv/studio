import { NextRequest, NextResponse } from 'next/server'
import { withUserManagement } from '@/lib/auth-middleware'
import { databaseInitializer } from '@/lib/database-initializer'
import { MongoDBConnection, DatabaseUtils, MigrationUtils } from '@/lib/mongodb-service'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

async function getDatabaseStatusHandler(request: NextRequest, user: JWTPayload) {
  try {
    // Only allow admin to check database status
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can check database status' },
        { status: 403 }
      )
    }

    // Get initialization status
    const initStatus = await databaseInitializer.getInitializationStatus()

    // Get connection health
    const connection = MongoDBConnection.getInstance()
    const healthCheck = await connection.healthCheck()

    // Get database statistics
    const dbStats = await DatabaseUtils.getDatabaseStats()

    // Get migration history
    const migrationHistory = await MigrationUtils.getMigrationHistory()

    // Check collection health
    const collections = ['assets', 'users', 'workflows', 'masterData']
    const collectionHealth = {}
    
    for (const collectionName of collections) {
      collectionHealth[collectionName] = await DatabaseUtils.checkCollectionHealth(collectionName)
    }

    return createSuccessResponse({
      initialization: initStatus,
      connection: healthCheck,
      statistics: dbStats,
      migrations: {
        total: migrationHistory.length,
        completed: migrationHistory.filter(m => m.status === 'completed').length,
        failed: migrationHistory.filter(m => m.status === 'failed').length,
        history: migrationHistory.slice(0, 10) // Last 10 migrations
      },
      collections: collectionHealth,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database status error:', error)
    return NextResponse.json(
      { error: 'Failed to get database status' },
      { status: 500 }
    )
  }
}

export const GET = withUserManagement(getDatabaseStatusHandler, 'read')