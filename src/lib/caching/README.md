# KTI Assets Caching System

A comprehensive multi-level caching system for the KTI Assets application, providing Redis, in-memory, and client-side caching with automatic invalidation and performance monitoring.

## Features

- **Multi-level Caching**: Redis, in-memory, and client-side caching
- **Automatic Invalidation**: Tag-based and pattern-based cache invalidation
- **Performance Monitoring**: Hit rates, memory usage, and health monitoring
- **API Response Caching**: Automatic caching of API responses with proper invalidation
- **Client-side Caching**: Browser storage for static data and user preferences
- **Cache Warming**: Preload frequently accessed data
- **Configurable TTL**: Different expiration times for different data types

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Cache  │    │  Memory Cache   │    │   Redis Cache   │
│   (Browser)     │    │   (Server)      │    │   (External)    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • localStorage  │    │ • In-memory Map │    │ • Redis Server  │
│ • sessionStorage│    │ • LRU eviction  │    │ • Persistence   │
│ • User prefs    │    │ • Fast access   │    │ • Scalability   │
│ • Static data   │    │ • Auto cleanup  │    │ • Clustering    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Usage

### Basic Caching

```typescript
import { cacheManager } from '@/lib/caching-system'

// Set data with TTL
await cacheManager.set('user:123', userData, {
  ttl: 3600, // 1 hour
  tags: ['users'],
  namespace: 'user-data'
})

// Get data
const user = await cacheManager.get('user:123')

// Delete data
await cacheManager.delete('user:123')

// Invalidate by tags
await cacheManager.invalidate({ tags: ['users'] })
```

### Service-level Caching

```typescript
import { ServiceCache } from '@/lib/cache-integration'

// Cache asset data
const asset = await ServiceCache.getAsset(assetId, async () => {
  return await assetService.findById(assetId)
})

// Cache asset lists
const assets = await ServiceCache.getAssetList(filters, async () => {
  return await assetService.searchAssets(filters)
})

// Cache master data
const departments = await ServiceCache.getMasterData('departments', async () => {
  return await masterDataService.getDepartments()
})
```

### API Response Caching

```typescript
import { ApiCacheMiddleware } from '@/lib/api-cache-middleware'

// In API route
export const GET = async (request: NextRequest) => {
  const middleware = ApiCacheMiddleware.getInstance()
  
  return middleware.withCache(request, async () => {
    // Your API logic here
    const data = await fetchData()
    return NextResponse.json(data)
  }, {
    ttl: 300, // 5 minutes
    tags: ['assets'],
    namespace: 'api'
  })
}
```

### Client-side Caching

```typescript
import { useCachedFetch, useMasterData } from '@/lib/client-cache'

// React hook for cached API calls
const { data, loading, error, refetch } = useCachedFetch('/api/assets', {
  department: 'IT',
  status: 'active'
})

// React hook for master data
const { data: departments } = useMasterData('departments')
```

## Configuration

### Environment Variables

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379

# Memory Cache Configuration
MEMORY_CACHE_MAX_SIZE=1000
MEMORY_CACHE_CLEANUP_INTERVAL=60000

# Client Cache Configuration
CLIENT_CACHE_SESSION=false
CLIENT_CACHE_PREFIX=kti_cache_

# Cache Monitoring
CACHE_MONITORING_ENABLED=true
CACHE_LOG_STATS=true
CACHE_STATS_INTERVAL=300000

# Cache Warmup
CACHE_WARMUP_ENABLED=true
CACHE_WARMUP_ON_STARTUP=true
```

### Cache Levels

Different data types use different cache levels:

- **Master Data**: Redis + Memory + Client
- **Assets**: Redis + Memory
- **Workflows**: Redis + Memory
- **Reports**: Redis only
- **Analytics**: Redis only
- **User Preferences**: Client only
- **Static Data**: Client only

## Cache Keys

The system uses consistent key generation:

```typescript
import { CacheKeys } from '@/lib/cache-integration'

// Asset keys
CacheKeys.asset('123') // 'asset:123'
CacheKeys.assetList(filters) // 'assets:list:base64(filters)'
CacheKeys.assetsByDepartment('IT') // 'dept:IT:assets'

// Workflow keys
CacheKeys.workflow('456') // 'workflow:456'
CacheKeys.workflowsByUser('user123') // 'user:user123:workflows'

// Report keys
CacheKeys.report('assets', filters) // 'report:assets:base64(filters)'
CacheKeys.dashboard('user123') // 'user:user123:dashboard'
```

## Cache Invalidation

### Automatic Invalidation

The system automatically invalidates related caches when data changes:

```typescript
import { CacheEventHandlers } from '@/lib/cache-integration'

// When asset is created/updated/deleted
await CacheEventHandlers.onAssetCreated(asset)
await CacheEventHandlers.onAssetUpdated(assetId, asset)
await CacheEventHandlers.onAssetDeleted(assetId)

// When workflow status changes
await CacheEventHandlers.onWorkflowStatusChanged(workflowId)

// When master data changes
await CacheEventHandlers.onMasterDataChanged('departments')
```

### Manual Invalidation

```typescript
import { CacheInvalidator } from '@/lib/api-cache-middleware'

// Invalidate specific assets
await CacheInvalidator.invalidateAssets(['asset1', 'asset2'])

// Invalidate all assets
await CacheInvalidator.invalidateAssets()

// Invalidate workflows
await CacheInvalidator.invalidateWorkflows()

// Invalidate master data
await CacheInvalidator.invalidateMasterData(['departments'])

// Invalidate reports
await CacheInvalidator.invalidateReports()

// Invalidate user data
await CacheInvalidator.invalidateUser('user123')

// Invalidate department data
await CacheInvalidator.invalidateDepartment('IT')

// Clear all caches
await CacheInvalidator.invalidateAll()
```

## Monitoring

### Cache Statistics

```typescript
// Get overall statistics
const stats = cacheManager.getStats()

// Get statistics for specific level
const redisStats = cacheManager.getStats('redis')
const memoryStats = cacheManager.getStats('memory')
const clientStats = cacheManager.getStats('client')
```

### Health Monitoring

```typescript
import { BulkCacheOperations } from '@/lib/cache-integration'

// Get cache health
const health = await BulkCacheOperations.getCacheHealth()
console.log(health.overall) // 'healthy' | 'degraded' | 'unhealthy'
```

### Admin API

Cache management endpoints for administrators:

```
GET    /api/admin/cache           # Get cache statistics
POST   /api/admin/cache?action=clear    # Clear cache
POST   /api/admin/cache?action=warmup   # Warm up cache
POST   /api/admin/cache?action=cleanup  # Clean expired entries
```

## Performance

### Cache Warming

```typescript
import { BulkCacheOperations } from '@/lib/cache-integration'

// Warm up frequently accessed data
await BulkCacheOperations.warmupCache()
```

### TTL Configuration

```typescript
import { CacheTTL } from '@/lib/cache-integration'

// Predefined TTL values
CacheTTL.VERY_SHORT  // 1 minute
CacheTTL.SHORT       // 5 minutes
CacheTTL.MEDIUM      // 15 minutes
CacheTTL.LONG        // 1 hour
CacheTTL.VERY_LONG   // 24 hours
CacheTTL.PERMANENT   // No expiration
```

## Best Practices

1. **Use appropriate TTL**: Short for dynamic data, long for static data
2. **Tag your caches**: Use tags for organized invalidation
3. **Monitor hit rates**: Aim for >50% hit rate
4. **Handle cache misses gracefully**: Always have fallback logic
5. **Invalidate proactively**: Clear related caches when data changes
6. **Use compression for large data**: Enable compression for big objects
7. **Batch invalidations**: Group related invalidations together

## Testing

```bash
# Run cache system tests
npm test src/lib/__tests__/caching-system.test.ts

# Run cache demo
node -e "require('./src/lib/cache-demo.ts').runCacheDemo()"
```

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check REDIS_URL environment variable
   - Ensure Redis server is running
   - Check network connectivity

2. **Low Hit Rate**
   - Review TTL settings
   - Check invalidation patterns
   - Monitor cache size limits

3. **Memory Usage High**
   - Reduce MEMORY_CACHE_MAX_SIZE
   - Implement more aggressive cleanup
   - Use compression for large objects

4. **Client Storage Quota Exceeded**
   - Reduce CLIENT_CACHE_PREFIX usage
   - Implement storage cleanup
   - Use sessionStorage instead of localStorage

### Debug Mode

Enable debug logging:

```env
CACHE_LOG_STATS=true
CACHE_MONITORING_ENABLED=true
```

## Migration

When upgrading the caching system:

1. Clear all existing caches
2. Update cache key formats if needed
3. Migrate configuration settings
4. Test cache invalidation patterns
5. Monitor performance after deployment