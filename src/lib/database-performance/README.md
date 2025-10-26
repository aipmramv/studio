# Database Performance Optimization

This module provides comprehensive database performance optimization for the KTI Assets system, including indexing, connection pool monitoring, query optimization, and performance analytics.

## Features

### 1. Database Performance Optimizer (`database-performance.ts`)

The main performance optimization engine that provides:

- **Automated Index Creation**: Creates optimized indexes for all collections
- **Performance Metrics Collection**: Monitors query performance, connection pool usage, and cache hit ratios
- **Performance Analysis**: Analyzes index usage and provides optimization recommendations
- **Database Optimization**: Runs maintenance operations to improve performance

#### Usage

```typescript
import { databasePerformanceOptimizer } from '@/lib/database-performance';

// Initialize performance optimization
await databasePerformanceOptimizer.initialize();

// Get current performance metrics
const metrics = await databasePerformanceOptimizer.getPerformanceMetrics();

// Analyze performance and get recommendations
const analysis = await databasePerformanceOptimizer.analyzeIndexPerformance();

// Run database optimization
const result = await databasePerformanceOptimizer.optimizeDatabase();
```

### 2. Query Optimizer (`query-optimizer.ts`)

Provides query optimization utilities:

- **Query Optimization**: Optimizes MongoDB queries for better performance
- **Aggregation Pipeline Optimization**: Optimizes aggregation pipelines
- **Index Recommendations**: Recommends indexes based on query patterns
- **Pagination Optimization**: Provides efficient pagination strategies

#### Usage

```typescript
import { QueryOptimizer } from '@/lib/query-optimizer';

// Optimize a query
const optimized = QueryOptimizer.optimizeQuery(filter, options);

// Optimize for specific collection
const collectionOptimized = QueryOptimizer.optimizeForCollection('assets', filter, options);

// Create efficient pagination
const paginated = QueryOptimizer.createPaginationQuery(filter, page, limit);

// Create cursor-based pagination (for large datasets)
const cursorPaginated = QueryOptimizer.createCursorPaginationQuery(filter, cursor, limit);
```

### 3. Connection Pool Monitor (`connection-pool-monitor.ts`)

Monitors MongoDB connection pool performance:

- **Real-time Monitoring**: Tracks connection pool utilization and efficiency
- **Performance Alerts**: Generates alerts for performance issues
- **Trend Analysis**: Analyzes connection usage trends
- **Optimization Recommendations**: Provides connection pool tuning recommendations

#### Usage

```typescript
import { connectionPoolMonitor } from '@/lib/connection-pool-monitor';

// Start monitoring
connectionPoolMonitor.startMonitoring(30000); // 30 second intervals

// Get current stats
const stats = connectionPoolMonitor.getStats();

// Get performance report
const report = connectionPoolMonitor.generateReport();

// Stop monitoring
connectionPoolMonitor.stopMonitoring();
```

## API Endpoints

### Performance Metrics
- `GET /api/admin/database/performance` - Get current performance metrics
- `POST /api/admin/database/performance/analyze` - Analyze performance and get recommendations

### Database Optimization
- `POST /api/admin/database/optimize` - Run database optimization

### Connection Pool Monitoring
- `GET /api/admin/database/pool` - Get connection pool statistics
- `POST /api/admin/database/pool` - Control connection pool monitoring

## Database Indexes

The system automatically creates optimized indexes for all collections:

### Assets Collection
- `assetNumber` (unique)
- `department + currentStatus` (compound)
- `location + currentStatus` (compound)
- `assetClassification + department` (compound)
- Text search index on multiple fields
- `createdAt`, `updatedAt` (for sorting)
- `verificationStatus + department` (compound)

### Users Collection
- `email` (unique)
- `role + isActive` (compound)
- `department + role` (compound)
- `lastLogin` (for sorting)

### Workflows Collection
- `status + currentAssignees` (compound)
- `requesterId + createdAt` (compound)
- `type + status` (compound)
- `currentStepId + status` (compound)
- `requesterDepartment + status` (compound)

### Master Data Collection
- `type + isActive` (compound)
- `code + type` (unique compound)
- `parentId` (sparse)

### Asset Movements Collection
- `assetId + timestamp` (compound)
- `fromLocation + toLocation` (compound)
- `movementType + timestamp` (compound)

### Audit Logs Collection
- `entityType + entityId + timestamp` (compound)
- `userId + timestamp` (compound)
- `action + timestamp` (compound)
- TTL index for automatic cleanup (1 year)

## Performance Monitoring

### Metrics Collected

1. **Connection Pool Metrics**
   - Total connections
   - Available connections
   - Checked out connections
   - Pool utilization percentage
   - Connection efficiency

2. **Query Performance Metrics**
   - Average query time
   - Slow queries (>100ms)
   - Query patterns

3. **Index Usage Metrics**
   - Index access frequency
   - Index efficiency
   - Unused indexes

4. **Cache Performance**
   - Cache hit ratio
   - Cache efficiency

5. **Disk Usage**
   - Data size
   - Index size
   - Storage size

### Performance Alerts

The system generates alerts for:
- High connection pool utilization (>80%)
- Slow queries (>500ms)
- Low cache hit ratio (<80%)
- Connection errors
- Unused indexes

## Optimization Strategies

### Query Optimization
1. **Index Usage**: Ensures queries use appropriate indexes
2. **Projection**: Limits returned fields to reduce data transfer
3. **Pagination**: Uses efficient pagination strategies
4. **Aggregation**: Optimizes aggregation pipelines

### Connection Pool Optimization
1. **Pool Sizing**: Optimizes min/max pool sizes based on usage
2. **Connection Reuse**: Minimizes connection churn
3. **Timeout Settings**: Optimizes connection timeouts

### Index Optimization
1. **Compound Indexes**: Creates efficient compound indexes for common query patterns
2. **Text Indexes**: Optimizes full-text search performance
3. **Sparse Indexes**: Uses sparse indexes for optional fields
4. **TTL Indexes**: Implements automatic data cleanup

## Configuration

### Environment Variables

```env
# MongoDB Connection Pool Settings
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2
MONGODB_MAX_IDLE_TIME=30000
MONGODB_SERVER_SELECTION_TIMEOUT=5000
MONGODB_SOCKET_TIMEOUT=45000
MONGODB_CONNECT_TIMEOUT=10000
MONGODB_HEARTBEAT_FREQUENCY=10000
```

### Performance Thresholds

- Slow query threshold: 100ms
- High utilization threshold: 80%
- Low cache hit ratio threshold: 80%
- Connection pool monitoring interval: 30 seconds

## Best Practices

### Query Optimization
1. Always use indexes for frequently queried fields
2. Limit result sets with appropriate pagination
3. Use projection to return only needed fields
4. Avoid regex queries without anchoring
5. Use compound indexes for multi-field queries

### Connection Management
1. Monitor connection pool utilization
2. Adjust pool sizes based on application load
3. Implement proper error handling for connection failures
4. Use connection pooling for better resource utilization

### Index Management
1. Regularly review index usage statistics
2. Remove unused indexes to save storage
3. Create compound indexes for common query patterns
4. Use background index creation to avoid blocking operations

### Performance Monitoring
1. Set up automated performance monitoring
2. Review performance metrics regularly
3. Act on performance alerts promptly
4. Optimize queries based on performance data

## Troubleshooting

### Common Issues

1. **High Connection Pool Utilization**
   - Increase maxPoolSize
   - Optimize slow queries
   - Implement connection reuse

2. **Slow Queries**
   - Add appropriate indexes
   - Optimize query patterns
   - Use aggregation pipelines efficiently

3. **Low Cache Hit Ratio**
   - Review query patterns
   - Optimize index usage
   - Consider query result caching

4. **Index Bloat**
   - Remove unused indexes
   - Optimize compound indexes
   - Regular index maintenance

### Performance Debugging

1. Use the performance dashboard to identify issues
2. Review slow query logs
3. Analyze index usage statistics
4. Monitor connection pool metrics
5. Check database profiler output

## Integration

The database performance optimization is automatically initialized when the MongoDB service starts:

```typescript
// In mongodb-service.ts
export async function initializeDatabase(): Promise<void> {
  // ... other initialization code
  
  // Initialize performance optimization
  const { databasePerformanceOptimizer } = await import('./database-performance');
  await databasePerformanceOptimizer.initialize();
  
  // Start connection pool monitoring
  const { connectionPoolMonitor } = await import('./connection-pool-monitor');
  connectionPoolMonitor.startMonitoring();
}
```

## Testing

Run the performance optimization tests:

```bash
npm test src/lib/__tests__/database-performance-simple.test.ts
```

The tests verify:
- Query optimization functionality
- Index recommendation logic
- Pagination optimization
- Performance metric collection
- Connection pool monitoring

## Dashboard

Use the `DatabasePerformanceDashboard` component to monitor performance in the admin interface:

```typescript
import DatabasePerformanceDashboard from '@/components/admin/DatabasePerformanceDashboard';

// In your admin page
<DatabasePerformanceDashboard />
```

The dashboard provides:
- Real-time performance metrics
- Connection pool status
- Query performance analysis
- Index usage statistics
- Optimization recommendations