import { NextRequest, NextResponse } from 'next/server'
import { withUserManagement } from '@/lib/auth-middleware'
import { databaseInitializer } from '@/lib/database-initializer'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

async function resetDatabaseHandler(request: NextRequest, user: JWTPayload) {
  try {
    // Only allow super admin to reset database
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can reset the database' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { confirmReset } = body

    if (!confirmReset) {
      return NextResponse.json(
        { error: 'Database reset requires explicit confirmation (confirmReset: true)' },
        { status: 400 }
      )
    }

    // Check environment - only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Database reset is not allowed in production environment' },
        { status: 403 }
      )
    }

    await databaseInitializer.resetDatabase()

    return createSuccessResponse({
      message: 'Database reset successfully',
      warning: 'All data has been permanently deleted',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database reset error:', error)
    return NextResponse.json(
      { error: 'Failed to reset database' },
      { status: 500 }
    )
  }
}

export const POST = withUserManagement(resetDatabaseHandler, 'delete')