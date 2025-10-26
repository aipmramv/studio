/**
 * Cache Integration Utilities
 * Provides integration between caching system and existing services
 */

import { cacheManager, cacheUtils } from './caching-system'
import { CacheInvalidator } from './api-cache-middleware'

// Cache keys generator
export const CacheKeys = {
  // Asset-related keys
  asset: (id: string) => cacheUtils.generateAssetKey(id),
  assetList: (filters: Record<string, any>) => 
    `assets:list:${Buffer.from(JSON.stringify(filters)).toString('base64')}`,
  assetSearch: (query: string, filters: Record<string, any>) =>
    `assets:search:${query}:${Buffer.from(JSON.stringify(filters)).toString('base64')}`,
  assetFilters: () => 'assets:filters',
  assetsByDepartment: (department: string) => 
    cacheUtils.generateDepartmentKey(department, 'assets'),

  // Workflow-related keys
  workflow: (id: string) => cacheUtils.generateWorkflowKey(id),
  workflowList: (filters: Record<string, any>) =>
    `workflows:list:${Buffer.from(JSON.stringify(filters)).toString('base64')}`,
  workflowsByUser: (userId: string) =>
    cacheUtils.generateUserKey(userId, 'workflows'),
  workflowTemplates: () => 'workflows:templates',

  // Report-related keys
  report: (type: string, filters: Record<string, any>) =>
    cacheUtils.generateReportKey(type, filters),
  dashboard: (userId: string) =>
    cacheUtils.generateUserKey(userId, 'dashboard'),
  analytics: (type: string, timeRange: string) =>
    `analytics:${type}:${timeRange}`,

  // Master data keys
  masterData: (type: string) => `masters:${type}`,
  masterDataEntry: (type: string, id: string) => `masters:${type}:${id}`,

  // User-related keys
  user: (id: string) => `user:${id}`,
  userPermissions: (id: string) => `user:${id}:permissions`,
  userPreferences: (id: string) => `user:${id}:preferences`
}

// Cache TTL configurations
export const CacheTTL = {
  VERY_SHORT: 60,      // 1 minute
  SHORT: 300,          // 5 minutes
  MEDIUM: 900,         // 15 minutes
  LONG: 3600,          // 1 hour
  VERY_LONG: 86400,    // 24 hours
  PERMANENT: 0         // No expiration
}

// Cache tags for organized invalidation
export const CacheTags = {
  ASSETS: 'assets',
  WORKFLOWS: 'workflows',
  REPORTS: 'reports',
  ANALYTICS: 'analytics',
  MASTER_DATA: 'master-data',
  USERS: 'users',
  DASHBOARD: 'dashboard'
}

// Service-level caching decorators
export class ServiceCache {
  // Asset service caching
  static async getAsset(id: string, fetcher: () => Promise<any>): Promise<any> {
    const key = CacheKeys.asset(id)
    
    let asset = await cacheManager.get(key)
    if (!asset) {
      asset = await fetcher()
      if (asset) {
        await cacheManager.set(key, asset, {
          ttl: CacheTTL.MEDIUM,
          tags: [CacheTags.ASSETS],
          namespace: 'assets'
        })
      }
    }
    
    return asset
  }

  static async getAssetList(
    filters: Record<string, any>,
    fetcher: () => Promise<any[]>
  ): Promise<any[]> {
    const key = CacheKeys.assetList(filters)
    
    let assets = await cacheManager.get(key)
    if (!assets) {
      assets = await fetcher()
      if (assets) {
        await cacheManager.set(key, assets, {
          ttl: CacheTTL.SHORT,
          tags: [CacheTags.ASSETS],
          namespace: 'assets'
        })
      }
    }
    
    return assets || []
  }

  static async invalidateAsset(id: string): Promise<void> {
    await cacheManager.delete(CacheKeys.asset(id))
    await CacheInvalidator.invalidateAssets([id])
  }

  // Workflow service caching
  static async getWorkflow(id: string, fetcher: () => Promise<any>): Promise<any> {
    const key = CacheKeys.workflow(id)
    
    let workflow = await cacheManager.get(key)
    if (!workflow) {
      workflow = await fetcher()
      if (workflow) {
        await cacheManager.set(key, workflow, {
          ttl: CacheTTL.VERY_SHORT, // Workflows change frequently
          tags: [CacheTags.WORKFLOWS],
          namespace: 'workflows'
        })
      }
    }
    
    return workflow
  }

  static async invalidateWorkflow(id: string): Promise<void> {
    await cacheManager.delete(CacheKeys.workflow(id))
    await CacheInvalidator.invalidateWorkflows([id])
  }

  // Master data caching
  static async getMasterData(type: string, fetcher: () => Promise<any[]>): Promise<any[]> {
    const key = CacheKeys.masterData(type)
    
    let data = await cacheManager.get(key)
    if (!data) {
      data = await fetcher()
      if (data) {
        await cacheManager.set(key, data, {
          ttl: CacheTTL.LONG, // Master data changes infrequently
          tags: [CacheTags.MASTER_DATA],
          namespace: 'masters'
        })
      }
    }
    
    return data || []
  }

  static async invalidateMasterData(type?: string): Promise<void> {
    if (type) {
      await cacheManager.delete(CacheKeys.masterData(type))
    }
    await CacheInvalidator.invalidateMasterData(type ? [type] : undefined)
  }

  // Report caching
  static async getReport(
    type: string,
    filters: Record<string, any>,
    fetcher: () => Promise<any>
  ): Promise<any> {
    const key = CacheKeys.report(type, filters)
    
    let report = await cacheManager.get(key)
    if (!report) {
      report = await fetcher()
      if (report) {
        await cacheManager.set(key, report, {
          ttl: CacheTTL.MEDIUM,
          tags: [CacheTags.REPORTS],
          namespace: 'reports'
        })
      }
    }
    
    return report
  }

  static async invalidateReports(): Promise<void> {
    await CacheInvalidator.invalidateReports()
  }

  // Dashboard caching
  static async getDashboard(userId: string, fetcher: () => Promise<any>): Promise<any> {
    const key = CacheKeys.dashboard(userId)
    
    let dashboard = await cacheManager.get(key)
    if (!dashboard) {
      dashboard = await fetcher()
      if (dashboard) {
        await cacheManager.set(key, dashboard, {
          ttl: CacheTTL.SHORT,
          tags: [CacheTags.DASHBOARD, CacheTags.ANALYTICS],
          namespace: 'dashboard'
        })
      }
    }
    
    return dashboard
  }

  static async invalidateDashboard(userId?: string): Promise<void> {
    if (userId) {
      await cacheManager.delete(CacheKeys.dashboard(userId))
    } else {
      await cacheManager.invalidate({
        tags: [CacheTags.DASHBOARD]
      })
    }
  }
}

// Bulk cache operations
export class BulkCacheOperations {
  static async warmupCache(): Promise<void> {
    console.log('Starting cache warmup...')
    
    try {
      // Warm up master data
      const masterDataTypes = [
        'departments',
        'locations',
        'asset-classifications',
        'asset-groupings',
        'brands'
      ]

      for (const type of masterDataTypes) {
        try {
          const response = await fetch(`/api/masters/${type}`)
          if (response.ok) {
            const data = await response.json()
            await cacheManager.set(CacheKeys.masterData(type), data, {
              ttl: CacheTTL.LONG,
              tags: [CacheTags.MASTER_DATA],
              namespace: 'masters'
            })
            console.log(`Warmed up master data: ${type}`)
          }
        } catch (error) {
          console.error(`Failed to warm up master data ${type}:`, error)
        }
      }

      console.log('Cache warmup completed')
    } catch (error) {
      console.error('Cache warmup failed:', error)
    }
  }

  static async clearExpiredCache(): Promise<void> {
    console.log('Clearing expired cache entries...')
    
    try {
      // This would be handled automatically by the cache implementations
      // but we can trigger manual cleanup if needed
      const stats = cacheManager.getStats()
      console.log('Cache stats before cleanup:', stats)
      
      // The individual cache implementations handle expiration automatically
      console.log('Expired cache cleanup completed')
    } catch (error) {
      console.error('Cache cleanup failed:', error)
    }
  }

  static async getCacheHealth(): Promise<{
    redis: any
    memory: any
    client?: any
    overall: 'healthy' | 'degraded' | 'unhealthy'
  }> {
    try {
      const stats = cacheManager.getStats()
      
      const health = {
        redis: typeof stats === 'object' && 'redis' in stats ? stats.redis : stats,
        memory: typeof stats === 'object' && 'memory' in stats ? stats.memory : stats,
        client: typeof stats === 'object' && 'client' in stats ? stats.client : undefined,
        overall: 'healthy' as const
      }

      // Determine overall health based on hit rates
      const redisHitRate = health.redis?.hitRate || 0
      const memoryHitRate = health.memory?.hitRate || 0
      
      if (redisHitRate < 0.3 && memoryHitRate < 0.3) {
        health.overall = 'unhealthy'
      } else if (redisHitRate < 0.5 || memoryHitRate < 0.5) {
        health.overall = 'degraded'
      }

      return health
    } catch (error) {
      console.error('Failed to get cache health:', error)
      return {
        redis: null,
        memory: null,
        overall: 'unhealthy'
      }
    }
  }
}

// Cache event handlers for data changes
export class CacheEventHandlers {
  static async onAssetCreated(asset: any): Promise<void> {
    // Invalidate asset lists and related caches
    await cacheManager.invalidate({
      tags: [CacheTags.ASSETS, CacheTags.REPORTS, CacheTags.ANALYTICS]
    })
  }

  static async onAssetUpdated(assetId: string, asset: any): Promise<void> {
    // Update specific asset cache and invalidate related caches
    await ServiceCache.invalidateAsset(assetId)
    await cacheManager.invalidate({
      tags: [CacheTags.REPORTS, CacheTags.ANALYTICS]
    })
  }

  static async onAssetDeleted(assetId: string): Promise<void> {
    await ServiceCache.invalidateAsset(assetId)
    await cacheManager.invalidate({
      tags: [CacheTags.ASSETS, CacheTags.REPORTS, CacheTags.ANALYTICS]
    })
  }

  static async onWorkflowStatusChanged(workflowId: string): Promise<void> {
    await ServiceCache.invalidateWorkflow(workflowId)
    await cacheManager.invalidate({
      tags: [CacheTags.DASHBOARD]
    })
  }

  static async onMasterDataChanged(type: string): Promise<void> {
    await ServiceCache.invalidateMasterData(type)
  }

  static async onUserPermissionsChanged(userId: string): Promise<void> {
    await cacheManager.delete(CacheKeys.userPermissions(userId))
    await cacheManager.delete(CacheKeys.dashboard(userId))
  }
}