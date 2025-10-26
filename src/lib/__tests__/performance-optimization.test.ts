/**
 * Performance Optimization Tests
 * Tests for performance monitoring, caching, and data loading optimization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { performanceMonitor, PerformanceAlert } from '../performance-monitor';
import { optimizedDataLoader, OptimizedDataLoader } from '../data-loading-optimization';
import { 
  DatabasePerformanceTracker, 
  CachePerformanceTracker,
  measureExecutionTime 
} from '../performance-middleware';

// Mock data for testing
const mockAssets = [
  { id: '1', name: 'Asset 1', department: 'IT' },
  { id: '2', name: 'Asset 2', department: 'HR' },
  { id: '3', name: 'Asset 3', department: 'IT' },
  { id: '4', name: 'Asset 4', department: 'Finance' },
  { id: '5', name: 'Asset 5', department: 'IT' }
];

describe('Performance Monitor', () => {
  beforeEach(() => {
    performanceMonitor.clearData();
  });

  afterEach(() => {
    performanceMonitor.stopMonitoring();
  });

  it('should record API request performance', () => {
    performanceMonitor.recordApiRequest('/api/assets', 'GET', 150, 200);
    
    const report = performanceMonitor.getPerformanceReport();
    expect(report.summary.totalRequests).toBe(1);
    expect(report.summary.averageResponseTime).toBe(150);
    expect(report.summary.errorRate).toBe(0);
  });

  it('should record database query performance', () => {
    performanceMonitor.recordDatabaseQuery('assets', 'find', 250, 10);
    
    const metrics = performanceMonitor.getMetricsByCategory('database');
    expect(metrics).toHaveLength(1);
    expect(metrics[0].name).toBe('database_query_time');
    expect(metrics[0].value).toBe(250);
    expect(metrics[0].tags?.collection).toBe('assets');
    expect(metrics[0].tags?.operation).toBe('find');
  });

  it('should record cache operations', () => {
    performanceMonitor.recordCacheOperation('hit', 'test-key', 5);
    performanceMonitor.recordCacheOperation('miss', 'test-key-2', 3);
    
    const cacheMetrics = performanceMonitor.getMetricsByCategory('cache');
    expect(cacheMetrics).toHaveLength(2);
    expect(cacheMetrics[0].name).toBe('cache_hit');
    expect(cacheMetrics[1].name).toBe('cache_miss');
  });

  it('should create alerts for slow responses', () => {
    // Record a slow API request (over 1000ms threshold)
    performanceMonitor.recordApiRequest('/api/slow-endpoint', 'GET', 1500, 200);
    
    const alerts = performanceMonitor.getActiveAlerts();
    expect(alerts.length).toBeGreaterThan(0);
    
    const slowAlert = alerts.find(a => a.metric === 'api_response_time');
    expect(slowAlert).toBeDefined();
    expect(slowAlert?.type).toBe('warning');
  });

  it('should create critical alerts for very slow responses', () => {
    // Record a very slow API request (over 3000ms threshold)
    performanceMonitor.recordApiRequest('/api/very-slow-endpoint', 'GET', 3500, 200);
    
    const alerts = performanceMonitor.getActiveAlerts();
    const criticalAlert = alerts.find(a => a.metric === 'api_response_time' && a.type === 'critical');
    expect(criticalAlert).toBeDefined();
    expect(criticalAlert?.currentValue).toBe(3500);
  });

  it('should resolve alerts', () => {
    performanceMonitor.recordApiRequest('/api/slow-endpoint', 'GET', 1500, 200);
    
    const alerts = performanceMonitor.getActiveAlerts();
    expect(alerts.length).toBeGreaterThan(0);
    
    const alertId = alerts[0].id;
    const resolved = performanceMonitor.resolveAlert(alertId);
    expect(resolved).toBe(true);
    
    const activeAlerts = performanceMonitor.getActiveAlerts();
    expect(activeAlerts.find(a => a.id === alertId)).toBeUndefined();
  });

  it('should generate performance trends', () => {
    // Record multiple requests over time
    for (let i = 0; i < 10; i++) {
      performanceMonitor.recordApiRequest('/api/test', 'GET', 100 + i * 10, 200);
    }
    
    const report = performanceMonitor.getPerformanceReport();
    expect(report.trends.responseTime).toBeDefined();
    expect(report.trends.throughput).toBeDefined();
    expect(report.trends.errorRate).toBeDefined();
  });

  it('should start and stop monitoring', () => {
    expect(() => performanceMonitor.startMonitoring(1000)).not.toThrow();
    expect(() => performanceMonitor.stopMonitoring()).not.toThrow();
  });

  it('should update thresholds', () => {
    const newThresholds = {
      responseTime: { warning: 500, critical: 2000 },
      errorRate: { warning: 0.03, critical: 0.08 }
    };
    
    performanceMonitor.updateThresholds(newThresholds);
    const currentThresholds = performanceMonitor.getThresholds();
    
    expect(currentThresholds.responseTime.warning).toBe(500);
    expect(currentThresholds.responseTime.critical).toBe(2000);
    expect(currentThresholds.errorRate.warning).toBe(0.03);
    expect(currentThresholds.errorRate.critical).toBe(0.08);
  });
});

describe('Optimized Data Loader', () => {
  let dataLoader: OptimizedDataLoader;

  beforeEach(() => {
    dataLoader = new OptimizedDataLoader();
    dataLoader.clearCache();
  });

  it('should load data with caching', async () => {
    const mockQueryFn = vi.fn().mockResolvedValue(mockAssets);
    
    // First call should execute query
    const result1 = await dataLoader.loadData(mockQueryFn, {
      useCache: true,
      cacheKey: 'test-assets',
      cacheTTL: 60000
    });
    
    expect(result1).toEqual(mockAssets);
    expect(mockQueryFn).toHaveBeenCalledTimes(1);
    
    // Second call should use cache
    const result2 = await dataLoader.loadData(mockQueryFn, {
      useCache: true,
      cacheKey: 'test-assets',
      cacheTTL: 60000
    });
    
    expect(result2).toEqual(mockAssets);
    expect(mockQueryFn).toHaveBeenCalledTimes(1); // Still only called once
  });

  it('should apply projection to reduce data size', async () => {
    const mockQueryFn = vi.fn().mockResolvedValue(mockAssets);
    
    const result = await dataLoader.loadData(mockQueryFn, {
      projection: ['id', 'name']
    });
    
    expect(result[0]).toEqual({ id: '1', name: 'Asset 1' });
    expect(result[0]).not.toHaveProperty('department');
  });

  it('should handle query timeout', async () => {
    const slowQueryFn = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockAssets), 2000))
    );
    
    await expect(
      dataLoader.loadData(slowQueryFn, { timeout: 1000 })
    ).rejects.toThrow('Query timeout');
  });

  it('should paginate data efficiently', async () => {
    const mockQueryFn = vi.fn().mockImplementation((skip: number, limit: number) => {
      return Promise.resolve(mockAssets.slice(skip, skip + limit));
    });
    
    const mockCountFn = vi.fn().mockResolvedValue(mockAssets.length);
    
    const result = await dataLoader.paginateData(
      mockQueryFn,
      mockCountFn,
      { page: 1, limit: 2, useCache: true, cacheKey: 'paginated-assets' }
    );
    
    expect(result.data).toHaveLength(2);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(2);
    expect(result.pagination.total).toBe(5);
    expect(result.pagination.totalPages).toBe(3);
    expect(result.pagination.hasNext).toBe(true);
    expect(result.pagination.hasPrev).toBe(false);
  });

  it('should handle cursor-based pagination', async () => {
    const mockQueryFn = vi.fn().mockImplementation((cursor?: string, limit?: number) => {
      const startIndex = cursor ? parseInt(cursor) : 0;
      const data = mockAssets.slice(startIndex, startIndex + (limit || 2));
      const nextCursor = startIndex + (limit || 2) < mockAssets.length 
        ? (startIndex + (limit || 2)).toString() 
        : undefined;
      
      return Promise.resolve({ data, nextCursor });
    });
    
    const result = await dataLoader.paginateWithCursor(mockQueryFn, {
      limit: 2,
      sortBy: 'id',
      useCache: true,
      cacheKey: 'cursor-assets'
    });
    
    expect(result.data).toHaveLength(2);
    expect(result.pagination.hasNext).toBe(true);
    expect(result.pagination.nextCursor).toBe('2');
  });

  it('should batch load efficiently', async () => {
    const mockLoadFn = vi.fn().mockImplementation((ids: string[]) => {
      return Promise.resolve(mockAssets.filter(asset => ids.includes(asset.id)));
    });
    
    const result = await dataLoader.batchLoad(
      ['1', '3', '5'],
      mockLoadFn,
      { batchSize: 2, useCache: true, cacheKey: 'batch-assets' }
    );
    
    expect(result.size).toBe(3);
    expect(result.get('1')).toEqual(mockAssets[0]);
    expect(result.get('3')).toEqual(mockAssets[2]);
    expect(result.get('5')).toEqual(mockAssets[4]);
    
    // Should have been called twice due to batch size of 2
    expect(mockLoadFn).toHaveBeenCalledTimes(2);
  });

  it('should preload relations to avoid N+1 queries', async () => {
    const itemsWithRelations = [
      { id: '1', name: 'Item 1', departmentId: 'dept1' },
      { id: '2', name: 'Item 2', departmentId: 'dept2' },
      { id: '3', name: 'Item 3', departmentId: 'dept1' }
    ];
    
    const mockLoadRelationFn = vi.fn().mockImplementation((ids: string[]) => {
      const departments = [
        { id: 'dept1', name: 'IT Department' },
        { id: 'dept2', name: 'HR Department' }
      ];
      return Promise.resolve(departments.filter(dept => ids.includes(dept.id)));
    });
    
    const result = await dataLoader.preloadRelations(
      itemsWithRelations,
      'departmentId',
      mockLoadRelationFn,
      'id',
      { useCache: true, cacheKey: 'preload-test' }
    );
    
    expect(result).toHaveLength(3);
    expect(result[0]).toHaveProperty('departmentIdData');
    expect((result[0] as any).departmentIdData.name).toBe('IT Department');
    expect(mockLoadRelationFn).toHaveBeenCalledTimes(1); // Single batch call
  });

  it('should provide cache statistics', () => {
    const stats = dataLoader.getCacheStats();
    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('hitRate');
    expect(stats).toHaveProperty('memoryUsage');
  });

  it('should clear cache with pattern', async () => {
    const mockQueryFn = vi.fn().mockResolvedValue(mockAssets);
    
    // Add some cached data
    await dataLoader.loadData(mockQueryFn, { useCache: true, cacheKey: 'assets:list' });
    await dataLoader.loadData(mockQueryFn, { useCache: true, cacheKey: 'assets:details' });
    await dataLoader.loadData(mockQueryFn, { useCache: true, cacheKey: 'users:list' });
    
    // Clear only assets cache
    dataLoader.clearCache('assets:.*');
    
    // Verify assets cache is cleared but users cache remains
    const result = await dataLoader.loadData(mockQueryFn, { useCache: true, cacheKey: 'assets:list' });
    expect(mockQueryFn).toHaveBeenCalledTimes(4); // Original 3 calls + 1 after cache clear
  });
});

describe('Performance Middleware', () => {
  it('should track database operations', async () => {
    const dbTracker = DatabasePerformanceTracker.getInstance();
    
    const mockOperation = vi.fn().mockResolvedValue(['result1', 'result2']);
    
    const result = await dbTracker.trackOperation('assets', 'find', mockOperation);
    
    expect(result).toEqual(['result1', 'result2']);
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it('should track cache operations', async () => {
    const cacheTracker = CachePerformanceTracker.getInstance();
    
    const mockCacheOperation = vi.fn().mockResolvedValue('cached-value');
    
    const result = await cacheTracker.trackOperation('hit', 'test-key', mockCacheOperation);
    
    expect(result).toBe('cached-value');
    expect(mockCacheOperation).toHaveBeenCalledTimes(1);
  });

  it('should measure execution time', async () => {
    const mockFunction = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('result'), 100))
    );
    
    const result = await measureExecutionTime('test-function', mockFunction);
    
    expect(result).toBe('result');
    expect(mockFunction).toHaveBeenCalledTimes(1);
    
    // Check that performance metric was recorded
    const metrics = performanceMonitor.getMetricsByCategory('api');
    const executionMetric = metrics.find(m => m.name === 'execution_time');
    expect(executionMetric).toBeDefined();
    expect(executionMetric?.value).toBeGreaterThanOrEqual(100);
  });

  it('should handle errors in measured functions', async () => {
    const mockFunction = vi.fn().mockRejectedValue(new Error('Test error'));
    
    await expect(
      measureExecutionTime('error-function', mockFunction)
    ).rejects.toThrow('Test error');
    
    // Check that error metric was recorded
    const metrics = performanceMonitor.getMetricsByCategory('api');
    const errorMetric = metrics.find(m => m.name === 'execution_time_error');
    expect(errorMetric).toBeDefined();
  });
});

describe('Performance Integration', () => {
  beforeEach(() => {
    performanceMonitor.clearData();
    optimizedDataLoader.clearCache();
  });

  afterEach(() => {
    performanceMonitor.stopMonitoring();
  });

  it('should work together for comprehensive performance monitoring', async () => {
    // Start performance monitoring
    performanceMonitor.startMonitoring(100); // Short interval for testing
    
    // Simulate API requests with data loading
    const mockQueryFn = vi.fn().mockResolvedValue(mockAssets);
    
    // Load data multiple times to test caching
    await optimizedDataLoader.loadData(mockQueryFn, {
      useCache: true,
      cacheKey: 'integration-test',
      cacheTTL: 60000
    });
    
    // Second call should hit cache
    await optimizedDataLoader.loadData(mockQueryFn, {
      useCache: true,
      cacheKey: 'integration-test',
      cacheTTL: 60000
    });
    
    // Record some API performance
    performanceMonitor.recordApiRequest('/api/assets', 'GET', 150, 200);
    performanceMonitor.recordApiRequest('/api/assets', 'GET', 120, 200);
    
    // Get comprehensive report
    const report = performanceMonitor.getPerformanceReport();
    const cacheStats = optimizedDataLoader.getCacheStats();
    
    expect(report.summary.totalRequests).toBe(2);
    expect(report.summary.averageResponseTime).toBe(135); // (150 + 120) / 2
    expect(cacheStats.size).toBeGreaterThan(0);
    expect(mockQueryFn).toHaveBeenCalledTimes(1); // Only called once due to caching
  });

  it('should handle high load scenarios', async () => {
    const promises = [];
    
    // Simulate high load with concurrent requests
    for (let i = 0; i < 50; i++) {
      promises.push(
        optimizedDataLoader.loadData(
          () => Promise.resolve(mockAssets),
          { useCache: true, cacheKey: `load-test-${i % 5}` } // 5 different cache keys
        )
      );
      
      // Record API performance
      performanceMonitor.recordApiRequest('/api/load-test', 'GET', 50 + i, 200);
    }
    
    await Promise.all(promises);
    
    const report = performanceMonitor.getPerformanceReport();
    expect(report.summary.totalRequests).toBe(50);
    expect(report.summary.averageResponseTime).toBeGreaterThan(0);
  });

  it('should detect performance degradation', async () => {
    // Record normal performance
    for (let i = 0; i < 10; i++) {
      performanceMonitor.recordApiRequest('/api/normal', 'GET', 100, 200);
    }
    
    // Record degraded performance
    for (let i = 0; i < 5; i++) {
      performanceMonitor.recordApiRequest('/api/slow', 'GET', 2000, 200);
    }
    
    const alerts = performanceMonitor.getActiveAlerts();
    const slowAlerts = alerts.filter(a => a.metric === 'api_response_time');
    
    expect(slowAlerts.length).toBeGreaterThan(0);
    expect(slowAlerts.some(a => a.type === 'warning')).toBe(true);
  });
});