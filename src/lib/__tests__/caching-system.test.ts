/**
 * Caching System Tests
 * Tests for the comprehensive caching system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CacheManager, cacheManager } from '../caching-system'
import { ServiceCache, CacheKeys, BulkCacheOperations } from '../cache-integration'
import { ApiCacheMiddleware, CacheInvalidator } from '../api-cache-middleware'

// Mock Redis client
vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    connect: vi.fn(),
    on: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    setEx: vi.fn(),
    del: vi.fn(),
    sAdd: vi.fn(),
    sMembers: vi.fn(),
    expire: vi.fn(),
    keys: vi.fn(),
    flushDb: vi.fn()
  }))
}))

describe('CacheManager', () => {
  let cache: CacheManager

  beforeEach(() => {
    cache = new CacheManager()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Memory Cache', () => {
    it('should store and retrieve data', async () => {
      const key = 'test-key'
      const data = { id: 1, name: 'Test' }

      await cache.set(key, data, { level: 'memory' })
      const result = await cache.get(key, { level: 'memory' })

      expect(result).toEqual(data)
    })

    it('should handle TTL expiration', async () => {
      const key = 'test-ttl'
      const data = { id: 1, name: 'Test' }

      await cache.set(key, data, { level: 'memory', ttl: 1 })
      
      // Should be available immediately
      let result = await cache.get(key, { level: 'memory' })
      expect(result).toEqual(data)

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      result = await cache.get(key, { level: 'memory' })
      expect(result).toBeNull()
    })

    it('should handle cache invalidation by tags', async () => {
      const key1 = 'test-tag-1'
      const key2 = 'test-tag-2'
      const data1 = { id: 1, name: 'Test1' }
      const data2 = { id: 2, name: 'Test2' }

      await cache.set(key1, data1, { level: 'memory', tags: ['tag1', 'common'] })
      await cache.set(key2, data2, { level: 'memory', tags: ['tag2', 'common'] })

      // Both should be available
      expect(await cache.get(key1, { level: 'memory' })).toEqual(data1)
      expect(await cache.get(key2, { level: 'memory' })).toEqual(data2)

      // Invalidate by common tag
      await cache.invalidate({ tags: ['common'], level: 'memory' })

      // Both should be gone
      expect(await cache.get(key1, { level: 'memory' })).toBeNull()
      expect(await cache.get(key2, { level: 'memory' })).toBeNull()
    })

    it('should handle LRU eviction', async () => {
      const smallCache = new CacheManager({ maxMemorySize: 2 })
      
      await smallCache.set('key1', 'data1', { level: 'memory' })
      await smallCache.set('key2', 'data2', { level: 'memory' })
      await smallCache.set('key3', 'data3', { level: 'memory' })

      // key1 should be evicted (LRU)
      expect(await smallCache.get('key1', { level: 'memory' })).toBeNull()
      expect(await smallCache.get('key2', { level: 'memory' })).toEqual('data2')
      expect(await smallCache.get('key3', { level: 'memory' })).toEqual('data3')
    })
  })

  describe('Cache Statistics', () => {
    it('should track hit and miss statistics', async () => {
      const key = 'stats-test'
      const data = { id: 1, name: 'Test' }

      // Miss
      await cache.get(key, { level: 'memory' })
      
      // Set and hit
      await cache.set(key, data, { level: 'memory' })
      await cache.get(key, { level: 'memory' })

      const stats = cache.getStats('memory')
      expect(stats).toHaveProperty('hits')
      expect(stats).toHaveProperty('misses')
      expect(stats).toHaveProperty('hitRate')
      expect(stats.hits).toBeGreaterThan(0)
      expect(stats.misses).toBeGreaterThan(0)
    })
  })
})

describe('ServiceCache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should cache asset data', async () => {
    const assetId = 'asset-123'
    const assetData = { id: assetId, name: 'Test Asset' }
    
    const fetcher = vi.fn().mockResolvedValue(assetData)
    
    // First call should fetch from source
    const result1 = await ServiceCache.getAsset(assetId, fetcher)
    expect(result1).toEqual(assetData)
    expect(fetcher).toHaveBeenCalledTimes(1)

    // Second call should use cache
    const result2 = await ServiceCache.getAsset(assetId, fetcher)
    expect(result2).toEqual(assetData)
    expect(fetcher).toHaveBeenCalledTimes(1) // Still only called once
  })

  it('should cache asset lists with filters', async () => {
    const filters = { department: 'IT', status: 'active' }
    const assetList = [
      { id: '1', name: 'Asset 1' },
      { id: '2', name: 'Asset 2' }
    ]
    
    const fetcher = vi.fn().mockResolvedValue(assetList)
    
    const result1 = await ServiceCache.getAssetList(filters, fetcher)
    expect(result1).toEqual(assetList)
    expect(fetcher).toHaveBeenCalledTimes(1)

    const result2 = await ServiceCache.getAssetList(filters, fetcher)
    expect(result2).toEqual(assetList)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('should cache master data', async () => {
    const type = 'departments'
    const masterData = [
      { id: '1', name: 'IT' },
      { id: '2', name: 'HR' }
    ]
    
    const fetcher = vi.fn().mockResolvedValue(masterData)
    
    const result1 = await ServiceCache.getMasterData(type, fetcher)
    expect(result1).toEqual(masterData)
    expect(fetcher).toHaveBeenCalledTimes(1)

    const result2 = await ServiceCache.getMasterData(type, fetcher)
    expect(result2).toEqual(masterData)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})

describe('CacheKeys', () => {
  it('should generate consistent cache keys', () => {
    const assetId = 'asset-123'
    const key1 = CacheKeys.asset(assetId)
    const key2 = CacheKeys.asset(assetId)
    
    expect(key1).toBe(key2)
    expect(key1).toBe('asset:asset-123')
  })

  it('should generate different keys for different filters', () => {
    const filters1 = { department: 'IT', status: 'active' }
    const filters2 = { department: 'HR', status: 'active' }
    
    const key1 = CacheKeys.assetList(filters1)
    const key2 = CacheKeys.assetList(filters2)
    
    expect(key1).not.toBe(key2)
  })

  it('should generate same keys for same filters in different order', () => {
    const filters1 = { department: 'IT', status: 'active' }
    const filters2 = { status: 'active', department: 'IT' }
    
    const key1 = CacheKeys.assetList(filters1)
    const key2 = CacheKeys.assetList(filters2)
    
    expect(key1).toBe(key2)
  })
})

describe('BulkCacheOperations', () => {
  it('should get cache health status', async () => {
    const health = await BulkCacheOperations.getCacheHealth()
    
    expect(health).toHaveProperty('redis')
    expect(health).toHaveProperty('memory')
    expect(health).toHaveProperty('overall')
    expect(['healthy', 'degraded', 'unhealthy']).toContain(health.overall)
  })
})

describe('ApiCacheMiddleware', () => {
  it('should create cache middleware instance', () => {
    const middleware = ApiCacheMiddleware.getInstance()
    expect(middleware).toBeInstanceOf(ApiCacheMiddleware)
    
    // Should return same instance (singleton)
    const middleware2 = ApiCacheMiddleware.getInstance()
    expect(middleware).toBe(middleware2)
  })
})

describe('CacheInvalidator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have invalidation methods', () => {
    expect(typeof CacheInvalidator.invalidateAssets).toBe('function')
    expect(typeof CacheInvalidator.invalidateWorkflows).toBe('function')
    expect(typeof CacheInvalidator.invalidateMasterData).toBe('function')
    expect(typeof CacheInvalidator.invalidateReports).toBe('function')
    expect(typeof CacheInvalidator.invalidateUser).toBe('function')
    expect(typeof CacheInvalidator.invalidateDepartment).toBe('function')
    expect(typeof CacheInvalidator.invalidateAll).toBe('function')
  })
})