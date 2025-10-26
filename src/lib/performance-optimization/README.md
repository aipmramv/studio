# Performance Optimization System

This comprehensive performance optimization system provides monitoring, caching, and data loading optimizations for the KTI Assets application.

## Overview

The performance optimization system consists of several integrated components:

1. **Application Performance Monitor** - Real-time performance monitoring and alerting
2. **Caching System** - Multi-level caching with Redis, memory, and client-side caching
3. **Database Performance Optimizer** - Database indexing and query optimization
4. **Data Loading Optimization** - Efficient pagination, batching, and query optimization
5. **Performance Middleware** - Automatic API performance tracking

## Components

### 1. Application Performance Monitor (`performance-monitor.ts`)

Provides comprehensive application performance monitoring with:

- **Real-time Metrics Collection**: API response times, database queries, cache operations
- **Performance Alerts**: Automatic alerts for slow responses, high error rates, low cache hit rates
- **Trend Analysis**: Historical performance trends and analytics
- **Threshold Management**: Configurable performance thresholds
- **System Monitoring**: Memory usage, CPU usage, system load

#### Usage

```typescript
import { performanceMonitor } from '@/lib/performance-monitor';

// Start monitoring
performanceMonitor.startMonitoring(30000); // 30 second intervals

// Record API performance
performanceMonitor.recordApiRequest('/api/assets', 'GET', 150, 200);

// Record database performance
performanceMonitor.recordDatabaseQuery('assets', 'find', 250, 10);

// Get performance report
const report = performanceMonitor.getPerformanceReport();

// Get active alerts
const alerts = performanceMonitor.getActiveAlerts();
```

### 2. Caching System (`caching-system.ts`)

Multi-level caching system with:

- **Redis Cache**: Distributed caching for production environments
- **Memory Cache**: In-memory caching with LRU eviction
- **Client Cache**: Browser-based caching using localStorage/sessionStorage
- **Cache Invalidation**: Tag-based and pattern-based invalidation
- **Performance Monitoring**: Cache hit rates and performance metrics

#### Usage

```typescript
import { cacheManager } from '@/lib/caching-system';

// Set data in cache
await cacheManager.set('user:123', userData, {
  ttl: 3600, // 1 hour
  tags: ['user', 'profile'],
  namespace: 'users'
});

// Get data from cache
const userData = await cacheManager.get<UserData>('user:123');

// Invalidate by tags
await cacheManager.invalidate({ tags: ['user'] });

// Get cache statistics
const stats = cacheManager.getStats();
```

### 3. Database Performance Optimizer (`database-performance.ts`)

Comprehensive database optimization with:

- **Automatic Index Creation**: Optimized indexes for all collections
- **Performance Monitoring**: Query performance and connection pool monitoring
- **Index Analysis**: Usage statistics and optimization recommendations
- **Connection Pool Optimization**: Efficient connection management
- **Slow Query Detection**: Automatic detection and logging of slow queries

#### Usage

```typescript
import { databasePerformanceOptimizer } from '@/lib/database-performance';

// Initialize optimization
await databasePerformanceOptimizer.initialize();

// Get performance metrics
const metrics = await databasePerformanceOptimizer.getPerformanceMetrics();

// Analyze performance
const analysis = await databasePerformanceOptimizer.analyzeIndexPerformance();

// Optimize database
const result = await databasePerformanceOptimizer.optimizeDatabase();
```

### 4. Data Loading Optimization (`data-loading-optimization.ts`)

Efficient data loading with:

- **Optimized Pagination**: Both offset-based and cursor-based pagination
- **Batch Loading**: Efficient loading of multiple resources
- **Relation Preloading**: Avoid N+1 query problems
- **Query Caching**: Automatic caching of query results
- **Projection**: Reduce data transfer with field selection

#### Usage

```typescript
import { optimizedDataLoader } from '@/lib/data-loading-optimization';

// Load data with caching
const assets = await optimizedDataLoader.loadData(
  () => fetchAssets(),
  { useCache: true, cacheKey: 'assets:list', cacheTTL: 300000 }
);

// Paginate data
const result = await optimizedDataLoader.paginateData(
  (skip, limit) => fetchAssets(skip, limit),
  () => countAssets(),
  { page: 1, limit: 20, useCache: true, cacheKey: 'assets:paginated' }
);

// Batch load
const assetMap = await optimizedDataLoader.batchLoad(
  ['1', '2', '3'],
  (ids) => fetchAssetsByIds(ids),
  { batchSize: 100, useCache: true, cacheKey: 'assets:batch' }
);
```

### 5. Performance Middleware (`performance-middleware.ts`)

Automatic performance tracking with:

- **API Monitoring**: Automatic tracking of API response times
- **Database Tracking**: Monitor database operation performance
- **Cache Tracking**: Track cache operation performance
- **Error Handling**: Performance tracking for error scenarios
- **Decorators**: Easy integration with class methods

#### Usage

```typescript
import { withPerformanceMonitoring, MonitorPerformance } from '@/lib/performance-middleware';

// Wrap API handler
export const GET = withPerformanceMonitoring(async (request) => {
  // Your API logic here
  return NextResponse.json({ data: 'response' });
});

// Use decorator
class AssetService {
  @MonitorPerformance('database')
  async findAssets(): Promise<Asset[]> {
    // Database operation
    return assets;
  }
}
```

## API Endpoints

### Performance Monitoring
- `GET /api/admin/performance` - Get performance report
- `POST /api/admin/performance` - Control monitoring (start/stop/clear)
- `GET /api/admin/performance/alerts` - Get active alerts
- `POST /api/admin/performance/alerts` - Resolve alerts

### Database Performance
- `GET /api/admin/database/performance` - Get database metrics
- `POST /api/admin/database/performance/analyze` - Analyze performance
- `POST /api/admin/database/optimize` - Run optimization

### Cache Management
- `GET /api/admin/cache` - Get cache statistics
- `POST /api/admin/cache` - Control cache operations

## Dashboard Components

### Performance Monitoring Dashboard
```typescript
import PerformanceMonitoringDashboard from '@/components/admin/PerformanceMonitoringDashboard';

<PerformanceMonitoringDashboard />
```

Features:
- Real-time performance metrics
- Interactive charts and trends
- Active alerts management
- Performance threshold configuration
- Cache statistics

### Database Performance Dashboard
```typescript
import DatabasePerformanceDashboard from '@/components/admin/DatabasePerformanceDashboard';

<DatabasePerformanceDashboard />
```

Features:
- Database performance metrics
- Index usage statistics
- Connection pool monitoring
- Query optimization recommendations

## Configuration

### Environment Variables

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379

# Cache Configuration
MEMORY_CACHE_MAX_SIZE=1000
MEMORY_CACHE_CLEANUP_INTERVAL=60000
CLIENT_CACHE_SESSION=false
CLIENT_CACHE_PREFIX=kti_cache_

# Performance Monitoring
CACHE_WARMUP_ENABLED=true
CACHE_MONITORING_ENABLED=true
CACHE_STATS_INTERVAL=300000

# Database Performance
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2
MONGODB_MAX_IDLE_TIME=30000
```

### Performance Thresholds

```typescript
const thresholds = {
  responseTime: { warning: 1000, critical: 3000 }, // milliseconds
  errorRate: { warning: 0.05, critical: 0.1 }, // 5% warning, 10% critical
  cacheHitRate: { warning: 0.7, critical: 0.5 }, // 70% warning, 50% critical
  memoryUsage: { warning: 0.8, critical: 0.9 }, // 80% warning, 90% critical
  cpuUsage: { warning: 0.8, critical: 0.9 } // 80% warning, 90% critical
};
```

## Performance Optimizations Applied

### 1. Database Optimizations
- **Compound Indexes**: Optimized for common query patterns
- **Text Indexes**: Full-text search with weighted fields
- **Sparse Indexes**: For optional fields to save space
- **TTL Indexes**: Automatic cleanup of old data
- **Connection Pooling**: Efficient connection management

### 2. Caching Strategies
- **Multi-level Caching**: Redis → Memory → Client
- **Cache Warming**: Preload frequently accessed data
- **Intelligent Invalidation**: Tag-based and pattern-based
- **Compression**: Reduce memory usage for large objects

### 3. Query Optimizations
- **Projection**: Return only needed fields
- **Pagination**: Efficient offset and cursor-based pagination
- **Batching**: Reduce number of database round trips
- **Preloading**: Avoid N+1 query problems

### 4. API Optimizations
- **Response Caching**: Cache API responses
- **Compression**: Gzip compression for responses
- **Rate Limiting**: Prevent abuse and ensure fair usage
- **Timeout Handling**: Prevent hanging requests

## Monitoring and Alerts

### Performance Metrics Tracked
- API response times
- Database query performance
- Cache hit/miss rates
- Memory and CPU usage
- Error rates and patterns
- Throughput and concurrency

### Alert Types
- **Warning Alerts**: Performance degradation detected
- **Critical Alerts**: Severe performance issues
- **System Alerts**: Resource exhaustion or failures
- **Trend Alerts**: Gradual performance degradation

### Alert Actions
- Automatic logging and notification
- Performance report generation
- Optimization recommendations
- Escalation procedures

## Best Practices

### 1. Caching
- Use appropriate TTL values for different data types
- Implement cache warming for critical data
- Monitor cache hit rates and adjust strategies
- Use cache tags for efficient invalidation

### 2. Database Queries
- Always use indexes for frequently queried fields
- Implement proper pagination for large datasets
- Use projection to limit returned data
- Monitor slow queries and optimize them

### 3. API Performance
- Implement proper error handling and timeouts
- Use compression for large responses
- Cache expensive operations
- Monitor and alert on performance degradation

### 4. Monitoring
- Set up automated performance monitoring
- Define appropriate performance thresholds
- Review performance reports regularly
- Act on performance alerts promptly

## Troubleshooting

### Common Issues

1. **High Response Times**
   - Check database query performance
   - Verify cache hit rates
   - Review index usage
   - Check system resource usage

2. **Low Cache Hit Rates**
   - Review cache TTL settings
   - Check cache invalidation patterns
   - Verify cache key generation
   - Monitor cache memory usage

3. **Database Performance Issues**
   - Review slow query logs
   - Check index usage statistics
   - Monitor connection pool utilization
   - Verify query optimization

4. **Memory Issues**
   - Monitor cache memory usage
   - Check for memory leaks
   - Review cache cleanup policies
   - Optimize data structures

### Performance Debugging

1. Use the performance dashboard to identify issues
2. Review performance metrics and trends
3. Check active alerts and their causes
4. Analyze slow query logs
5. Monitor system resource usage
6. Review cache statistics and hit rates

## Testing

Run the performance optimization tests:

```bash
npm test src/lib/__tests__/performance-optimization.test.ts
```

The tests verify:
- Performance monitoring functionality
- Caching system operations
- Data loading optimizations
- Performance middleware integration
- Alert generation and resolution
- Integration between all components

## Integration

The performance optimization system is automatically initialized when the application starts:

```typescript
// In your application startup
import { initializePerformanceMonitoring } from '@/lib/performance-middleware';
import { databasePerformanceOptimizer } from '@/lib/database-performance';

// Initialize performance monitoring
initializePerformanceMonitoring({
  startMonitoring: true,
  monitoringInterval: 30000
});

// Initialize database optimization
await databasePerformanceOptimizer.initialize();
```

## Conclusion

This comprehensive performance optimization system provides:

- **Real-time Monitoring**: Track performance metrics and trends
- **Automatic Optimization**: Database indexing and query optimization
- **Multi-level Caching**: Reduce database load and improve response times
- **Efficient Data Loading**: Optimized pagination and batching
- **Performance Alerts**: Proactive issue detection and resolution
- **Comprehensive Dashboard**: Visual monitoring and management tools

The system is designed to scale with your application and provide the insights needed to maintain optimal performance as your user base and data volume grow.