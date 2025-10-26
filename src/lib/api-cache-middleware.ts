/**
 * API Response Caching Middleware
 * Provides automatic caching for API responses with proper invalidation
 */

import { NextRequest, NextResponse } from 'next/server'
import { cacheManager, CacheOptions } from './caching-system'

export interface ApiCacheOptions extends CacheOptions {
  keyGenerator?: (req: NextRequest) => string
  shouldCache?: (req: NextRequest, response: any) => boolean
  onCacheHit?: (key: string, data: any) => void
  onCacheMiss?: (key: string) => void
  onCacheSet?: (key: string, data: any) => void
}

export class ApiCacheMiddleware {
  private static instance: ApiCacheMiddleware
  
  static getInstance(): ApiCacheMiddleware {
    if (!ApiCacheMiddleware.instance) {
      ApiCacheMiddleware.instance = new ApiCacheMiddleware()
    }
    return ApiCacheMiddleware.instance
  }

  async withCache<T>(
    req: NextRequest,
    handler: () => Promise<NextResponse>,
    options: ApiCacheOptions = {}
  ): Promise<NextResponse> {
    const {
      ttl = 300, // 5 minutes default
      tags = [],
      namespace = 'api',
      keyGenerator = this.defaultKeyGenerator,
      shouldCache = this.defaultShouldCache,
      onCacheHit,
      onCacheMiss,
      onCacheSet
    } = options

    const cacheKey = keyGenerator(req)
    
    try {
      // Try to get from cache
      const cached = await cacheManager.get<any>(cacheKey)
      if (cached) {
        onCacheHit?.(cacheKey, cached)
        return NextResponse.json(cached.data, {
          status: cached.status || 200,
          headers: {
            'X-Cache': 'HIT',
            'X-Cache-Key': cacheKey,
            ...cached.headers
          }
        })
      }

      onCacheMiss?.(cacheKey)
      
      // Execute handler
      const response = await handler()
      const responseData = await response.json()
      
      // Check if we should cache this response
      if (shouldCache(req, responseData)) {
        const cacheData = {
          data: responseData,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        }
        
        await cacheManager.set(cacheKey, cacheData, {
          ttl,
          tags,
          namespace
        })
        
        onCacheSet?.(cacheKey, cacheData)
      }

      // Add cache headers
      response.headers.set('X-Cache', 'MISS')
      response.headers.set('X-Cache-Key', cacheKey)
      
      return NextResponse.json(responseData, {
        status: response.status,
        headers: response.headers
      })
      
    } catch (error) {
      console.error('Cache middleware error:', error)
      // Fallback to handler without caching
      return handler()
    }
  }  private 
defaultKeyGenerator(req: NextRequest): string {
    const url = new URL(req.url)
    const method = req.method
    const pathname = url.pathname
    const searchParams = url.searchParams.toString()
    
    return `api:${method}:${pathname}${searchParams ? ':' + searchParams : ''}`
  }

  private defaultShouldCache(req: NextRequest, response: any): boolean {
    // Only cache GET requests with successful responses
    return req.method === 'GET' && 
           response && 
           !response.error &&
           typeof response === 'object'
  }

  // Predefined cache configurations for different API types
  static readonly CACHE_CONFIGS = {
    // Master data - cache for 1 hour
    MASTER_DATA: {
      ttl: 3600,
      tags: ['master-data'],
      namespace: 'masters'
    },

    // Asset data - cache for 5 minutes
    ASSETS: {
      ttl: 300,
      tags: ['assets'],
      namespace: 'assets'
    },

    // Reports - cache for 10 minutes
    REPORTS: {
      ttl: 600,
      tags: ['reports'],
      namespace: 'reports'
    },

    // Analytics - cache for 15 minutes
    ANALYTICS: {
      ttl: 900,
      tags: ['analytics'],
      namespace: 'analytics'
    },

    // Workflows - cache for 2 minutes (more dynamic)
    WORKFLOWS: {
      ttl: 120,
      tags: ['workflows'],
      namespace: 'workflows'
    },

    // User data - cache for 10 minutes
    USERS: {
      ttl: 600,
      tags: ['users'],
      namespace: 'users'
    }
  }
}

// Cache invalidation utilities
export class CacheInvalidator {
  static async invalidateAssets(assetIds?: string[]): Promise<void> {
    if (assetIds && assetIds.length > 0) {
      // Invalidate specific assets
      for (const assetId of assetIds) {
        await cacheManager.invalidate({
          pattern: `*asset*${assetId}*`
        })
      }
    } else {
      // Invalidate all asset-related caches
      await cacheManager.invalidate({
        tags: ['assets']
      })
    }
    
    // Also invalidate related reports and analytics
    await cacheManager.invalidate({
      tags: ['reports', 'analytics']
    })
  }

  static async invalidateWorkflows(workflowIds?: string[]): Promise<void> {
    if (workflowIds && workflowIds.length > 0) {
      for (const workflowId of workflowIds) {
        await cacheManager.invalidate({
          pattern: `*workflow*${workflowId}*`
        })
      }
    } else {
      await cacheManager.invalidate({
        tags: ['workflows']
      })
    }
  }

  static async invalidateMasterData(types?: string[]): Promise<void> {
    if (types && types.length > 0) {
      for (const type of types) {
        await cacheManager.invalidate({
          pattern: `*masters*${type}*`
        })
      }
    } else {
      await cacheManager.invalidate({
        tags: ['master-data']
      })
    }
  }

  static async invalidateReports(): Promise<void> {
    await cacheManager.invalidate({
      tags: ['reports', 'analytics']
    })
  }

  static async invalidateUser(userId: string): Promise<void> {
    await cacheManager.invalidate({
      pattern: `*user*${userId}*`
    })
  }

  static async invalidateDepartment(department: string): Promise<void> {
    await cacheManager.invalidate({
      pattern: `*dept*${department}*`
    })
  }

  static async invalidateAll(): Promise<void> {
    await cacheManager.clear()
  }
}

// Helper function to create cached API handlers
export function createCachedHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: ApiCacheOptions = {}
) {
  const middleware = ApiCacheMiddleware.getInstance()
  
  return async (req: NextRequest): Promise<NextResponse> => {
    return middleware.withCache(req, () => handler(req), options)
  }
}

// Decorator for caching API routes
export function CachedRoute(options: ApiCacheOptions = {}) {
  return function decorator(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const middleware = ApiCacheMiddleware.getInstance()

    descriptor.value = async function(req: NextRequest, ...args: any[]) {
      return middleware.withCache(
        req,
        () => originalMethod.apply(this, [req, ...args]),
        options
      )
    }

    return descriptor
  }
}

// Cache warming utilities
export class CacheWarmer {
  static async warmAssetCache(): Promise<void> {
    try {
      // Warm frequently accessed asset endpoints
      const endpoints = [
        '/api/assets',
        '/api/assets/filters',
        '/api/masters/departments',
        '/api/masters/locations',
        '/api/masters/asset-classifications'
      ]

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${endpoint}`)
          if (response.ok) {
            console.log(`Warmed cache for ${endpoint}`)
          }
        } catch (error) {
          console.error(`Failed to warm cache for ${endpoint}:`, error)
        }
      }
    } catch (error) {
      console.error('Cache warming failed:', error)
    }
  }

  static async warmReportCache(): Promise<void> {
    try {
      const endpoints = [
        '/api/dashboard/analytics',
        '/api/reports/assets',
        '/api/analytics/assets'
      ]

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${endpoint}`)
          if (response.ok) {
            console.log(`Warmed cache for ${endpoint}`)
          }
        } catch (error) {
          console.error(`Failed to warm cache for ${endpoint}:`, error)
        }
      }
    } catch (error) {
      console.error('Report cache warming failed:', error)
    }
  }
}