/**
 * Data Loading Optimization
 * Efficient data loading, pagination, and query optimization utilities
 */

import { performanceMonitor } from './performance-monitor';

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    queryTime: number;
    cacheHit: boolean;
    optimizations: string[];
  };
}

export interface CursorPaginationOptions {
  cursor?: string;
  limit: number;
  sortBy: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface CursorPaginationResult<T> {
  data: T[];
  pagination: {
    nextCursor?: string;
    prevCursor?: string;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
  meta?: {
    queryTime: number;
    cacheHit: boolean;
    optimizations: string[];
  };
}

export interface DataLoadingOptions {
  useCache?: boolean;
  cacheKey?: string;
  cacheTTL?: number;
  preload?: string[];
  projection?: string[];
  batchSize?: number;
  timeout?: number;
}

export interface QueryOptimization {
  useIndexes: boolean;
  projection: boolean;
  filtering: boolean;
  sorting: boolean;
  caching: boolean;
  batching: boolean;
}

/**
 * Optimized data loader with caching, pagination, and performance monitoring
 */
export class OptimizedDataLoader {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private queryStats = new Map<string, { count: number; totalTime: number; avgTime: number }>();

  /**
   * Load data with optimization strategies
   */
  async loadData<T>(
    queryFn: () => Promise<T[]>,
    options: DataLoadingOptions = {}
  ): Promise<T[]> {
    const startTime = Date.now();
    const {
      useCache = true,
      cacheKey,
      cacheTTL = 300000, // 5 minutes
      projection = [],
      timeout = 30000 // 30 seconds
    } = options;

    let cacheHit = false;
    let data: T[];

    // Check cache first
    if (useCache && cacheKey) {
      const cached = this.getFromCache<T[]>(cacheKey);
      if (cached) {
        cacheHit = true;
        data = cached;
        performanceMonitor.recordCacheOperation('hit', cacheKey);
      }
    }

    if (!cacheHit) {
      // Set timeout for query
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), timeout);
      });

      try {
        // Execute query with timeout
        data = await Promise.race([queryFn(), timeoutPromise]);

        // Apply projection if specified
        if (projection.length > 0) {
          data = this.applyProjection(data, projection);
        }

        // Cache the result
        if (useCache && cacheKey) {
          this.setCache(cacheKey, data, cacheTTL);
          performanceMonitor.recordCacheOperation('set', cacheKey);
        }

        if (useCache && cacheKey) {
          performanceMonitor.recordCacheOperation('miss', cacheKey);
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'Query timeout') {
          console.error(`Query timeout after ${timeout}ms for key: ${cacheKey}`);
          performanceMonitor.recordUIMetric('query_timeout', timeout, 'ms', cacheKey);
        }
        throw error;
      }
    }

    const queryTime = Date.now() - startTime;
    
    // Update query statistics
    if (cacheKey) {
      this.updateQueryStats(cacheKey, queryTime);
    }

    // Record performance metrics
    performanceMonitor.recordUIMetric('data_loading_time', queryTime, 'ms', cacheKey);

    return data!;
  }

  /**
   * Optimized pagination with performance monitoring
   */
  async paginateData<T>(
    queryFn: (skip: number, limit: number, filters?: Record<string, any>) => Promise<T[]>,
    countFn: (filters?: Record<string, any>) => Promise<number>,
    options: PaginationOptions & DataLoadingOptions = { page: 1, limit: 20 }
  ): Promise<PaginationResult<T>> {
    const startTime = Date.now();
    const { page, limit, filters, useCache = true, cacheKey } = options;
    
    // Validate pagination parameters
    if (page < 1) throw new Error('Page must be >= 1');
    if (limit < 1 || limit > 1000) throw new Error('Limit must be between 1 and 1000');

    const skip = (page - 1) * limit;
    let cacheHit = false;
    let data: T[];
    let total: number;

    // Generate cache keys
    const dataCacheKey = cacheKey ? `${cacheKey}:data:${page}:${limit}:${JSON.stringify(filters)}` : undefined;
    const countCacheKey = cacheKey ? `${cacheKey}:count:${JSON.stringify(filters)}` : undefined;

    // Try to get data from cache
    if (useCache && dataCacheKey && countCacheKey) {
      const cachedData = this.getFromCache<T[]>(dataCacheKey);
      const cachedCount = this.getFromCache<number>(countCacheKey);
      
      if (cachedData && cachedCount !== null) {
        cacheHit = true;
        data = cachedData;
        total = cachedCount;
        performanceMonitor.recordCacheOperation('hit', dataCacheKey);
      }
    }

    if (!cacheHit) {
      // Execute queries in parallel for better performance
      const [dataResult, countResult] = await Promise.all([
        queryFn(skip, limit, filters),
        countFn(filters)
      ]);

      data = dataResult;
      total = countResult;

      // Cache the results
      if (useCache && dataCacheKey && countCacheKey) {
        this.setCache(dataCacheKey, data, 300000); // 5 minutes
        this.setCache(countCacheKey, total, 600000); // 10 minutes
        performanceMonitor.recordCacheOperation('set', dataCacheKey);
        performanceMonitor.recordCacheOperation('miss', dataCacheKey);
      }
    }

    const queryTime = Date.now() - startTime;
    const totalPages = Math.ceil(total / limit);

    // Record performance metrics
    performanceMonitor.recordUIMetric('pagination_query_time', queryTime, 'ms', cacheKey);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      meta: {
        queryTime,
        cacheHit,
        optimizations: this.getAppliedOptimizations(options)
      }
    };
  }

  /**
   * Cursor-based pagination for large datasets
   */
  async paginateWithCursor<T>(
    queryFn: (cursor?: string, limit?: number, filters?: Record<string, any>) => Promise<{ data: T[]; nextCursor?: string; prevCursor?: string }>,
    options: CursorPaginationOptions & DataLoadingOptions
  ): Promise<CursorPaginationResult<T>> {
    const startTime = Date.now();
    const { cursor, limit, filters, useCache = true, cacheKey } = options;

    // Validate parameters
    if (limit < 1 || limit > 1000) throw new Error('Limit must be between 1 and 1000');

    let cacheHit = false;
    let result: { data: T[]; nextCursor?: string; prevCursor?: string };

    // Generate cache key
    const dataCacheKey = cacheKey ? `${cacheKey}:cursor:${cursor || 'start'}:${limit}:${JSON.stringify(filters)}` : undefined;

    // Try cache first
    if (useCache && dataCacheKey) {
      const cached = this.getFromCache<typeof result>(dataCacheKey);
      if (cached) {
        cacheHit = true;
        result = cached;
        performanceMonitor.recordCacheOperation('hit', dataCacheKey);
      }
    }

    if (!cacheHit) {
      result = await queryFn(cursor, limit, filters);

      // Cache the result
      if (useCache && dataCacheKey) {
        this.setCache(dataCacheKey, result, 300000); // 5 minutes
        performanceMonitor.recordCacheOperation('set', dataCacheKey);
        performanceMonitor.recordCacheOperation('miss', dataCacheKey);
      }
    }

    const queryTime = Date.now() - startTime;

    // Record performance metrics
    performanceMonitor.recordUIMetric('cursor_pagination_time', queryTime, 'ms', cacheKey);

    return {
      data: result.data,
      pagination: {
        nextCursor: result.nextCursor,
        prevCursor: result.prevCursor,
        hasNext: !!result.nextCursor,
        hasPrev: !!result.prevCursor,
        limit
      },
      meta: {
        queryTime,
        cacheHit,
        optimizations: this.getAppliedOptimizations(options)
      }
    };
  }

  /**
   * Batch load multiple resources efficiently
   */
  async batchLoad<T>(
    ids: string[],
    loadFn: (ids: string[]) => Promise<T[]>,
    options: DataLoadingOptions & { keyField?: string } = {}
  ): Promise<Map<string, T>> {
    const startTime = Date.now();
    const { batchSize = 100, useCache = true, cacheKey, keyField = 'id' } = options;
    
    const result = new Map<string, T>();
    const uncachedIds: string[] = [];
    
    // Check cache for each ID
    if (useCache && cacheKey) {
      for (const id of ids) {
        const itemCacheKey = `${cacheKey}:item:${id}`;
        const cached = this.getFromCache<T>(itemCacheKey);
        if (cached) {
          result.set(id, cached);
          performanceMonitor.recordCacheOperation('hit', itemCacheKey);
        } else {
          uncachedIds.push(id);
        }
      }
    } else {
      uncachedIds.push(...ids);
    }

    // Load uncached items in batches
    if (uncachedIds.length > 0) {
      const batches = this.createBatches(uncachedIds, batchSize);
      
      for (const batch of batches) {
        const batchResult = await loadFn(batch);
        
        // Process batch results
        for (const item of batchResult) {
          const id = (item as any)[keyField];
          if (id) {
            result.set(id, item);
            
            // Cache individual items
            if (useCache && cacheKey) {
              const itemCacheKey = `${cacheKey}:item:${id}`;
              this.setCache(itemCacheKey, item, 300000); // 5 minutes
              performanceMonitor.recordCacheOperation('set', itemCacheKey);
            }
          }
        }
        
        // Record cache misses for items not found
        if (useCache && cacheKey) {
          for (const id of batch) {
            if (!result.has(id)) {
              const itemCacheKey = `${cacheKey}:item:${id}`;
              performanceMonitor.recordCacheOperation('miss', itemCacheKey);
            }
          }
        }
      }
    }

    const queryTime = Date.now() - startTime;
    performanceMonitor.recordUIMetric('batch_load_time', queryTime, 'ms', cacheKey);

    return result;
  }

  /**
   * Preload related data to reduce N+1 queries
   */
  async preloadRelations<T, R>(
    items: T[],
    relationKey: keyof T,
    loadRelationFn: (ids: any[]) => Promise<R[]>,
    relationIdField: keyof R,
    options: DataLoadingOptions = {}
  ): Promise<T[]> {
    if (items.length === 0) return items;

    const startTime = Date.now();
    const { batchSize = 100 } = options;

    // Extract unique relation IDs
    const relationIds = [...new Set(
      items
        .map(item => item[relationKey])
        .filter(id => id != null)
    )];

    if (relationIds.length === 0) return items;

    // Load relations in batches
    const relations = await this.batchLoad(
      relationIds.map(String),
      async (ids) => {
        const numericIds = ids.map(id => {
          const num = Number(id);
          return isNaN(num) ? id : num;
        });
        return loadRelationFn(numericIds);
      },
      { ...options, keyField: String(relationIdField) }
    );

    // Attach relations to items
    const enrichedItems = items.map(item => ({
      ...item,
      [`${String(relationKey)}Data`]: relations.get(String(item[relationKey]))
    }));

    const queryTime = Date.now() - startTime;
    performanceMonitor.recordUIMetric('preload_relations_time', queryTime, 'ms', options.cacheKey);

    return enrichedItems;
  }

  /**
   * Get query performance statistics
   */
  getQueryStats(cacheKey?: string): Record<string, { count: number; totalTime: number; avgTime: number }> {
    if (cacheKey) {
      const stats = this.queryStats.get(cacheKey);
      return stats ? { [cacheKey]: stats } : {};
    }
    return Object.fromEntries(this.queryStats.entries());
  }

  /**
   * Clear cache and statistics
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    const size = this.cache.size;
    let memoryUsage = 0;
    
    // Estimate memory usage
    for (const [key, value] of this.cache.entries()) {
      memoryUsage += key.length * 2; // UTF-16 characters
      memoryUsage += JSON.stringify(value.data).length * 2;
    }

    // Calculate hit rate from performance monitor
    const cacheMetrics = performanceMonitor.getMetricsByCategory('cache', 1000);
    const hits = cacheMetrics.filter(m => m.name === 'cache_hit').length;
    const misses = cacheMetrics.filter(m => m.name === 'cache_miss').length;
    const hitRate = (hits + misses) > 0 ? hits / (hits + misses) : 0;

    return { size, hitRate, memoryUsage };
  }

  // Private methods

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Cleanup expired entries periodically
    if (this.cache.size % 100 === 0) {
      this.cleanupExpiredCache();
    }
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.timestamp + value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private updateQueryStats(key: string, queryTime: number): void {
    const existing = this.queryStats.get(key) || { count: 0, totalTime: 0, avgTime: 0 };
    existing.count++;
    existing.totalTime += queryTime;
    existing.avgTime = existing.totalTime / existing.count;
    this.queryStats.set(key, existing);
  }

  private applyProjection<T>(data: T[], projection: string[]): T[] {
    if (projection.length === 0) return data;
    
    return data.map(item => {
      const projected: any = {};
      for (const field of projection) {
        if (field in (item as any)) {
          projected[field] = (item as any)[field];
        }
      }
      return projected;
    });
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private getAppliedOptimizations(options: any): string[] {
    const optimizations: string[] = [];
    
    if (options.useCache) optimizations.push('caching');
    if (options.projection?.length > 0) optimizations.push('projection');
    if (options.batchSize) optimizations.push('batching');
    if (options.preload?.length > 0) optimizations.push('preloading');
    
    return optimizations;
  }
}

// Singleton instance
export const optimizedDataLoader = new OptimizedDataLoader();

// Utility functions for common optimization patterns

/**
 * Create an optimized query function with automatic caching and performance monitoring
 */
export function createOptimizedQuery<T>(
  queryFn: () => Promise<T[]>,
  cacheKey: string,
  options: DataLoadingOptions = {}
) {
  return () => optimizedDataLoader.loadData(queryFn, { ...options, cacheKey });
}

/**
 * Create an optimized pagination function
 */
export function createOptimizedPagination<T>(
  queryFn: (skip: number, limit: number, filters?: Record<string, any>) => Promise<T[]>,
  countFn: (filters?: Record<string, any>) => Promise<number>,
  cacheKey: string,
  options: DataLoadingOptions = {}
) {
  return (paginationOptions: PaginationOptions) => 
    optimizedDataLoader.paginateData(queryFn, countFn, { ...options, ...paginationOptions, cacheKey });
}

/**
 * Create an optimized batch loader
 */
export function createOptimizedBatchLoader<T>(
  loadFn: (ids: string[]) => Promise<T[]>,
  cacheKey: string,
  options: DataLoadingOptions & { keyField?: string } = {}
) {
  return (ids: string[]) => optimizedDataLoader.batchLoad(ids, loadFn, { ...options, cacheKey });
}

/**
 * Decorator for automatic query optimization
 */
export function OptimizeQuery(cacheKey: string, options: DataLoadingOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return optimizedDataLoader.loadData(
        () => originalMethod.apply(this, args),
        { ...options, cacheKey: `${cacheKey}:${JSON.stringify(args)}` }
      );
    };

    return descriptor;
  };
}