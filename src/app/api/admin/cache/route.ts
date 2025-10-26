/**
 * Cache Management API
 * Provides cache monitoring, statistics, and management endpoints
 */

import { NextRequest } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils'
import { withAdminOnly } from '@/lib/auth-middleware'
import { cacheManager } from '@/lib/caching-system'
import { BulkCacheOperations } from '@/lib/cache-integration'
import { JWTPayload } from '@/types/auth'

// GET /api/admin/cache - Get cache statistics and health
async function getCacheStatsHandler(request: NextRequest, user: JWTPayload) {
  try {
    const health = await BulkCacheOperations.getCacheHealth()
    const stats = cacheManager.getStats()

    return createSuccessResponse({
      health,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to get cache stats:', error)
    return createErrorResponse('Failed to retrieve cache statistics', 500)
  }
}

// POST /api/admin/cache/clear - Clear cache
async function clearCacheHandler(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json()
    const { level, tags, namespace, pattern } = body

    if (level === 'all') {
      await cacheManager.clear()
    } else if (tags || namespace || pattern) {
      await cacheManager.invalidate({ tags, namespace, pattern })
    } else if (level) {
      await cacheManager.clear({ level })
    } else {
      return createErrorResponse('Invalid clear cache parameters', 400)
    }

    return createSuccessResponse(
      { cleared: true, timestamp: new Date().toISOString() },
      'Cache cleared successfully'
    )
  } catch (error) {
    console.error('Failed to clear cache:', error)
    return createErrorResponse('Failed to clear cache', 500)
  }
}

// POST /api/admin/cache/warmup - Warm up cache
async function warmupCacheHandler(request: NextRequest, user: JWTPayload) {
  try {
    await BulkCacheOperations.warmupCache()

    return createSuccessResponse(
      { warmedUp: true, timestamp: new Date().toISOString() },
      'Cache warmup completed successfully'
    )
  } catch (error) {
    console.error('Failed to warm up cache:', error)
    return createErrorResponse('Failed to warm up cache', 500)
  }
}

// POST /api/admin/cache/cleanup - Clean up expired cache entries
async function cleanupCacheHandler(request: NextRequest, user: JWTPayload) {
  try {
    await BulkCacheOperations.clearExpiredCache()

    return createSuccessResponse(
      { cleanedUp: true, timestamp: new Date().toISOString() },
      'Cache cleanup completed successfully'
    )
  } catch (error) {
    console.error('Failed to clean up cache:', error)
    return createErrorResponse('Failed to clean up cache', 500)
  }
}

export const GET = withAdminOnly(getCacheStatsHandler)
export const POST = withAdminOnly(async (request: NextRequest, user: JWTPayload) => {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  switch (action) {
    case 'clear':
      return clearCacheHandler(request, user)
    case 'warmup':
      return warmupCacheHandler(request, user)
    case 'cleanup':
      return cleanupCacheHandler(request, user)
    default:
      return createErrorResponse('Invalid action parameter', 400)
  }
})