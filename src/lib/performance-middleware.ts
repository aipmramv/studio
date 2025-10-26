/**
 * Performance Monitoring Middleware
 * Automatically tracks API performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from './performance-monitor';

export interface PerformanceMiddlewareOptions {
  enabled?: boolean;
  trackSlowQueries?: boolean;
  slowQueryThreshold?: number;
  trackCacheOperations?: boolean;
  excludePaths?: string[];
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
}

const defaultOptions: PerformanceMiddlewareOptions = {
  enabled: true,
  trackSlowQueries: true,
  slowQueryThreshold: 1000, // 1 second
  trackCacheOperations: true,
  excludePaths: ['/api/health', '/api/admin/performance'],
  includeRequestBody: false,
  includeResponseBody: false
};

/**
 * Create performance monitoring middleware for API routes
 */
export function createPerformanceMiddleware(options: PerformanceMiddlewareOptions = {}) {
  const config = { ...defaultOptions, ...options };

  return async function performanceMiddleware(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    if (!config.enabled) {
      return handler(request);
    }

    const startTime = Date.now();
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Skip excluded paths
    if (config.excludePaths?.some(excludePath => path.startsWith(excludePath))) {
      return handler(request);
    }

    let response: NextResponse;
    let error: Error | null = null;

    try {
      // Execute the handler
      response = await handler(request);
    } catch (err) {
      error = err as Error;
      // Create error response
      response = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Record API performance
    performanceMonitor.recordApiRequest(
      path,
      method,
      duration,
      response.status
    );

    // Log slow queries if enabled
    if (config.trackSlowQueries && duration > (config.slowQueryThreshold || 1000)) {
      console.warn(`Slow API request detected: ${method} ${path} took ${duration}ms`);
    }

    // Add performance headers
    response.headers.set('X-Response-Time', `${duration}ms`);
    response.headers.set('X-Timestamp', new Date().toISOString());

    if (error) {
      throw error;
    }

    return response;
  };
}

/**
 * Wrapper for API route handlers with automatic performance monitoring
 */
export function withPerformanceMonitoring<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  options: PerformanceMiddlewareOptions = {}
) {
  const config = { ...defaultOptions, ...options };

  return async function monitoredHandler(...args: T): Promise<NextResponse> {
    if (!config.enabled) {
      return handler(...args);
    }

    const request = args[0] as NextRequest;
    const startTime = Date.now();
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Skip excluded paths
    if (config.excludePaths?.some(excludePath => path.startsWith(excludePath))) {
      return handler(...args);
    }

    let response: NextResponse;
    let error: Error | null = null;

    try {
      response = await handler(...args);
    } catch (err) {
      error = err as Error;
      response = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Record performance metrics
    performanceMonitor.recordApiRequest(path, method, duration, response.status);

    // Log slow requests
    if (config.trackSlowQueries && duration > (config.slowQueryThreshold || 1000)) {
      console.warn(`Slow API request: ${method} ${path} - ${duration}ms`);
    }

    // Add performance headers
    response.headers.set('X-Response-Time', `${duration}ms`);
    response.headers.set('X-Timestamp', new Date().toISOString());

    if (error) {
      throw error;
    }

    return response;
  };
}

/**
 * Database operation performance tracker
 */
export class DatabasePerformanceTracker {
  private static instance: DatabasePerformanceTracker;
  private activeOperations = new Map<string, { startTime: number; operation: string; collection: string }>();

  static getInstance(): DatabasePerformanceTracker {
    if (!DatabasePerformanceTracker.instance) {
      DatabasePerformanceTracker.instance = new DatabasePerformanceTracker();
    }
    return DatabasePerformanceTracker.instance;
  }

  /**
   * Start tracking a database operation
   */
  startOperation(operationId: string, collection: string, operation: string): void {
    this.activeOperations.set(operationId, {
      startTime: Date.now(),
      operation,
      collection
    });
  }

  /**
   * End tracking a database operation
   */
  endOperation(operationId: string, recordCount?: number): void {
    const operationData = this.activeOperations.get(operationId);
    if (!operationData) {
      return;
    }

    const duration = Date.now() - operationData.startTime;
    
    // Record the database performance
    performanceMonitor.recordDatabaseQuery(
      operationData.collection,
      operationData.operation,
      duration,
      recordCount
    );

    // Clean up
    this.activeOperations.delete(operationId);
  }

  /**
   * Track a database operation with automatic timing
   */
  async trackOperation<T>(
    collection: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const operationId = `${collection}_${operation}_${Date.now()}_${Math.random()}`;
    
    this.startOperation(operationId, collection, operation);
    
    try {
      const result = await fn();
      
      // Try to determine record count from result
      let recordCount: number | undefined;
      if (Array.isArray(result)) {
        recordCount = result.length;
      } else if (result && typeof result === 'object' && 'length' in result) {
        recordCount = (result as any).length;
      }
      
      this.endOperation(operationId, recordCount);
      return result;
    } catch (error) {
      this.endOperation(operationId);
      throw error;
    }
  }
}

/**
 * Cache operation performance tracker
 */
export class CachePerformanceTracker {
  private static instance: CachePerformanceTracker;

  static getInstance(): CachePerformanceTracker {
    if (!CachePerformanceTracker.instance) {
      CachePerformanceTracker.instance = new CachePerformanceTracker();
    }
    return CachePerformanceTracker.instance;
  }

  /**
   * Track cache hit
   */
  recordHit(key: string, duration?: number): void {
    performanceMonitor.recordCacheOperation('hit', key, duration);
  }

  /**
   * Track cache miss
   */
  recordMiss(key: string, duration?: number): void {
    performanceMonitor.recordCacheOperation('miss', key, duration);
  }

  /**
   * Track cache set operation
   */
  recordSet(key: string, duration?: number): void {
    performanceMonitor.recordCacheOperation('set', key, duration);
  }

  /**
   * Track cache delete operation
   */
  recordDelete(key: string, duration?: number): void {
    performanceMonitor.recordCacheOperation('delete', key, duration);
  }

  /**
   * Track a cache operation with automatic timing
   */
  async trackOperation<T>(
    operation: 'hit' | 'miss' | 'set' | 'delete',
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.recordOperation(operation, key, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordOperation(operation, key, duration);
      throw error;
    }
  }

  private recordOperation(operation: 'hit' | 'miss' | 'set' | 'delete', key: string, duration: number): void {
    switch (operation) {
      case 'hit':
        this.recordHit(key, duration);
        break;
      case 'miss':
        this.recordMiss(key, duration);
        break;
      case 'set':
        this.recordSet(key, duration);
        break;
      case 'delete':
        this.recordDelete(key, duration);
        break;
    }
  }
}

// Export singleton instances
export const dbPerformanceTracker = DatabasePerformanceTracker.getInstance();
export const cachePerformanceTracker = CachePerformanceTracker.getInstance();

/**
 * Utility function to measure function execution time
 */
export async function measureExecutionTime<T>(
  name: string,
  fn: () => Promise<T>,
  category: 'api' | 'database' | 'cache' | 'ui' | 'system' = 'api'
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    performanceMonitor.addMetric({
      name: 'execution_time',
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      category,
      tags: { function: name }
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    performanceMonitor.addMetric({
      name: 'execution_time_error',
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      category,
      tags: { function: name }
    });
    
    throw error;
  }
}

/**
 * Performance monitoring decorator for class methods
 */
export function MonitorPerformance(
  category: 'api' | 'database' | 'cache' | 'ui' | 'system' = 'api'
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const className = target.constructor.name;
      const methodName = `${className}.${propertyKey}`;
      
      return measureExecutionTime(
        methodName,
        () => originalMethod.apply(this, args),
        category
      );
    };

    return descriptor;
  };
}

/**
 * Initialize performance monitoring for the application
 */
export function initializePerformanceMonitoring(options: {
  startMonitoring?: boolean;
  monitoringInterval?: number;
} = {}): void {
  const { startMonitoring = true, monitoringInterval = 30000 } = options;

  if (startMonitoring) {
    performanceMonitor.startMonitoring(monitoringInterval);
    console.log('Performance monitoring initialized and started');
  } else {
    console.log('Performance monitoring initialized but not started');
  }

  // Set up process event handlers for cleanup
  if (typeof process !== 'undefined') {
    process.on('SIGINT', () => {
      performanceMonitor.stopMonitoring();
      console.log('Performance monitoring stopped');
    });

    process.on('SIGTERM', () => {
      performanceMonitor.stopMonitoring();
      console.log('Performance monitoring stopped');
    });
  }
}