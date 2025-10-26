/**
 * Cache System Demonstration
 * Shows how to use the caching system in practice
 */

import { cacheManager, cacheUtils } from './caching-system'
import { ServiceCache, CacheKeys } from './cache-integration'
import { clientCacheManager } from './client-cache'

// Example: Caching asset data
export async function demonstrateAssetCaching() {
  console.log('=== Asset Caching Demo ===')
  
  const assetId = 'demo-asset-123'
  const assetData = {
    id: assetId,
    assetNumber: 'KTI-2024-001',
    description: 'Demo Asset',
    department: 'IT',
    location: 'Main Office',
    status: 'Active'
  }

  // Simulate fetching asset from database
  const fetchAssetFromDB = async () => {
    console.log('Fetching asset from database...')
    await new Promise(resolve => setTimeout(resolve, 100)) // Simulate DB delay
    return assetData
  }

  // First call - should fetch from database
  console.log('First call (cache miss):')
  const start1 = Date.now()
  const result1 = await ServiceCache.getAsset(assetId, fetchAssetFromDB)
  const time1 = Date.now() - start1
  console.log(`Result: ${JSON.stringify(result1)}`)
  console.log(`Time: ${time1}ms`)

  // Second call - should use cache
  console.log('\nSecond call (cache hit):')
  const start2 = Date.now()
  const result2 = await ServiceCache.getAsset(assetId, fetchAssetFromDB)
  const time2 = Date.now() - start2
  console.log(`Result: ${JSON.stringify(result2)}`)
  console.log(`Time: ${time2}ms`)

  console.log(`\nPerformance improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}%`)
}

// Example: Caching master data
export async function demonstrateMasterDataCaching() {
  console.log('\n=== Master Data Caching Demo ===')
  
  const departments = [
    { id: '1', name: 'IT', code: 'IT' },
    { id: '2', name: 'HR', code: 'HR' },
    { id: '3', name: 'Finance', code: 'FIN' }
  ]

  const fetchDepartmentsFromDB = async () => {
    console.log('Fetching departments from database...')
    await new Promise(resolve => setTimeout(resolve, 50))
    return departments
  }

  // Cache master data
  const result = await ServiceCache.getMasterData('departments', fetchDepartmentsFromDB)
  console.log(`Cached departments: ${result.length} items`)

  // Verify cache hit
  const cachedResult = await ServiceCache.getMasterData('departments', fetchDepartmentsFromDB)
  console.log(`Retrieved from cache: ${cachedResult.length} items`)
}

// Example: Cache invalidation
export async function demonstrateCacheInvalidation() {
  console.log('\n=== Cache Invalidation Demo ===')
  
  // Set some test data
  await cacheManager.set('test:asset:1', { id: '1', name: 'Asset 1' }, {
    tags: ['assets', 'test'],
    ttl: 3600
  })
  
  await cacheManager.set('test:asset:2', { id: '2', name: 'Asset 2' }, {
    tags: ['assets', 'test'],
    ttl: 3600
  })

  await cacheManager.set('test:user:1', { id: '1', name: 'User 1' }, {
    tags: ['users', 'test'],
    ttl: 3600
  })

  // Verify data is cached
  console.log('Before invalidation:')
  console.log('Asset 1:', await cacheManager.get('test:asset:1'))
  console.log('Asset 2:', await cacheManager.get('test:asset:2'))
  console.log('User 1:', await cacheManager.get('test:user:1'))

  // Invalidate only assets
  await cacheManager.invalidate({ tags: ['assets'] })

  console.log('\nAfter invalidating assets:')
  console.log('Asset 1:', await cacheManager.get('test:asset:1'))
  console.log('Asset 2:', await cacheManager.get('test:asset:2'))
  console.log('User 1:', await cacheManager.get('test:user:1'))
}

// Example: Cache statistics
export async function demonstrateCacheStats() {
  console.log('\n=== Cache Statistics Demo ===')
  
  // Perform some cache operations
  await cacheManager.set('stats:test:1', 'data1')
  await cacheManager.set('stats:test:2', 'data2')
  await cacheManager.set('stats:test:3', 'data3')

  // Some hits
  await cacheManager.get('stats:test:1')
  await cacheManager.get('stats:test:2')
  await cacheManager.get('stats:test:1') // Another hit

  // Some misses
  await cacheManager.get('stats:test:missing1')
  await cacheManager.get('stats:test:missing2')

  // Get statistics
  const stats = cacheManager.getStats()
  console.log('Cache Statistics:')
  console.log(JSON.stringify(stats, null, 2))
}

// Example: Client-side caching
export async function demonstrateClientCaching() {
  console.log('\n=== Client-side Caching Demo ===')
  
  // This would typically run in the browser
  if (typeof window === 'undefined') {
    console.log('Client-side caching demo requires browser environment')
    return
  }

  const userId = 'demo-user-123'
  const preferences = {
    theme: 'dark',
    language: 'en',
    notifications: true,
    dashboardLayout: 'grid'
  }

  // Cache user preferences
  await clientCacheManager.cacheUserPreferences(userId, preferences)
  console.log('Cached user preferences')

  // Retrieve from cache
  const cachedPrefs = await clientCacheManager.getUserPreferences(userId)
  console.log('Retrieved preferences:', cachedPrefs)

  // Cache master data
  const departments = [
    { id: '1', name: 'IT' },
    { id: '2', name: 'HR' }
  ]
  
  await clientCacheManager.cacheMasterData('departments', departments)
  const cachedDepts = await clientCacheManager.getMasterData('departments')
  console.log('Cached departments:', cachedDepts)
}

// Run all demonstrations
export async function runCacheDemo() {
  console.log('🚀 KTI Assets Caching System Demo\n')
  
  try {
    await demonstrateAssetCaching()
    await demonstrateMasterDataCaching()
    await demonstrateCacheInvalidation()
    await demonstrateCacheStats()
    await demonstrateClientCaching()
    
    console.log('\n✅ Cache demo completed successfully!')
  } catch (error) {
    console.error('❌ Cache demo failed:', error)
  }
}

// Export for use in other files
export {
  cacheManager,
  ServiceCache,
  CacheKeys,
  clientCacheManager
}