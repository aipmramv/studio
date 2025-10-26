import { NextRequest, NextResponse } from 'next/server'
import { withUserManagement } from '@/lib/auth-middleware'
import { databaseInitializer } from '@/lib/database-initializer'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

async function initializeDatabaseHandler(request: NextRequest, user: JWTPayload) {
  try {
    // Only allow super admin to initialize database
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can initialize the database' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const {
      createAdminUser = true,
      createSampleUsers = false,
      createMasterData = true,
      createSampleAssets = false,
      runMigrations = true,
      force = false
    } = body

    // Check if database is already initialized
    if (!force) {
      const status = await databaseInitializer.getInitializationStatus()
      if (status.isInitialized) {
        return NextResponse.json(
          { 
            error: 'Database is already initialized. Use force=true to reinitialize.',
            status 
          },
          { status: 400 }
        )
      }
    }

    const config = {
      createAdminUser,
      createSampleUsers,
      createMasterData,
      createSampleAssets,
      runMigrations
    }

    const result = await databaseInitializer.initialize(config)

    if (result.success) {
      return createSuccessResponse({
        message: 'Database initialized successfully',
        result,
        config
      })
    } else {
      return NextResponse.json(
        { 
          error: 'Database initialization failed',
          result 
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    )
  }
}

export const POST = withUserManagement(initializeDatabaseHandler, 'create')