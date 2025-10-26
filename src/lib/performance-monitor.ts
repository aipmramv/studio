/**
 * Application Performance Monitor
 * Comprehensive performance monitoring for the KTI Assets system
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  category: 'api' | 'database' | 'cache' | 'ui' | 'system';
  tags?: Record<string, string>;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical';
  message: string;
  metric: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  resolved: boolean;
}

export interface PerformanceReport {
  summary: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    systemLoad: number;
  };
  metrics: PerformanceMetric[];
  alerts: PerformanceAlert[];
  trends: {
    responseTime: Array<{ timestamp: Date; value: number }>;
    throughput: Array<{ timestamp: Date; value: number }>;
    errorRate: Array<{ timestamp: Date; value: number }>;
  };
}

export interface PerformanceThresholds {
  responseTime: {
    warning: number;
    critical: number;
  };
  errorRate: {
    warning: number;
    critical: number;
  };
  cacheHitRate: {
    warning: number;
    critical: number;
  };
  memoryUsage: {
    warning: number;
    critical: number;
  };
  cpuUsage: {
    warning: number;
    critical: number;
  };
}

class ApplicationPerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private requestCounts = new Map<string, number>();
  private responseTimes = new Map<string, number[]>();
  private errorCounts = new Map<string, number>();
  
  private thresholds: PerformanceThresholds = {
    responseTime: { warning: 1000, critical: 3000 }, // milliseconds
    errorRate: { warning: 0.05, critical: 0.1 }, // 5% warning, 10% critical
    cacheHitRate: { warning: 0.7, critical: 0.5 }, // 70% warning, 50% critical
    memoryUsage: { warning: 0.8, critical: 0.9 }, // 80% warning, 90% critical
    cpuUsage: { warning: 0.8, critical: 0.9 } // 80% warning, 90% critical
  };

  /**
   * Start performance monitoring
   */
  public startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      console.warn('Performance monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.checkThresholds();
      this.cleanupOldMetrics();
    }, intervalMs);

    console.log(`Application performance monitoring started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Application performance monitoring stopped');
  }

  /**
   * Record API request performance
   */
  public recordApiRequest(endpoint: string, method: string, responseTime: number, statusCode: number): void {
    const key = `${method} ${endpoint}`;
    
    // Record request count
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1);
    
    // Record response time
    if (!this.responseTimes.has(key)) {
      this.responseTimes.set(key, []);
    }
    this.responseTimes.get(key)!.push(responseTime);
    
    // Record errors
    if (statusCode >= 400) {
      this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
    }

    // Add metric
    this.addMetric({
      name: 'api_response_time',
      value: responseTime,
      unit: 'ms',
      timestamp: new Date(),
      category: 'api',
      tags: { endpoint, method, status: statusCode.toString() }
    });

    // Check for performance issues
    if (responseTime > this.thresholds.responseTime.critical) {
      this.createAlert('critical', `Critical response time for ${key}: ${responseTime}ms`, 'api_response_time', this.thresholds.responseTime.critical, responseTime);
    } else if (responseTime > this.thresholds.responseTime.warning) {
      this.createAlert('warning', `Slow response time for ${key}: ${responseTime}ms`, 'api_response_time', this.thresholds.responseTime.warning, responseTime);
    }
  }

  /**
   * Record database query performance
   */
  public recordDatabaseQuery(collection: string, operation: string, duration: number, recordCount?: number): void {
    this.addMetric({
      name: 'database_query_time',
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      category: 'database',
      tags: { collection, operation, recordCount: recordCount?.toString() }
    });

    if (duration > 1000) { // Queries over 1 second
      this.createAlert('warning', `Slow database query on ${collection}.${operation}: ${duration}ms`, 'database_query_time', 1000, duration);
    }
  }

  /**
   * Record cache performance
   */
  public recordCacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', key: string, duration?: number): void {
    this.addMetric({
      name: `cache_${operation}`,
      value: duration || 1,
      unit: duration ? 'ms' : 'count',
      timestamp: new Date(),
      category: 'cache',
      tags: { operation, key: this.sanitizeKey(key) }
    });
  }

  /**
   * Record UI performance metrics
   */
  public recordUIMetric(metric: string, value: number, unit: string, component?: string): void {
    this.addMetric({
      name: metric,
      value,
      unit,
      timestamp: new Date(),
      category: 'ui',
      tags: component ? { component } : undefined
    });
  }

  /**
   * Get current performance report
   */
  public getPerformanceReport(): PerformanceReport {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    
    // Filter recent metrics
    const recentMetrics = this.metrics.filter(m => m.timestamp >= oneHourAgo);
    
    // Calculate summary statistics
    const apiMetrics = recentMetrics.filter(m => m.category === 'api' && m.name === 'api_response_time');
    const totalRequests = apiMetrics.length;
    const averageResponseTime = totalRequests > 0 
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / totalRequests 
      : 0;
    
    const errorCount = recentMetrics.filter(m => 
      m.category === 'api' && m.tags?.status && parseInt(m.tags.status) >= 400
    ).length;
    const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;
    
    const cacheHits = recentMetrics.filter(m => m.name === 'cache_hit').length;
    const cacheMisses = recentMetrics.filter(m => m.name === 'cache_miss').length;
    const cacheHitRate = (cacheHits + cacheMisses) > 0 ? cacheHits / (cacheHits + cacheMisses) : 0;
    
    // Get system load (simplified)
    const systemLoad = this.getSystemLoad();
    
    // Generate trends
    const trends = this.generateTrends(recentMetrics);

    return {
      summary: {
        totalRequests,
        averageResponseTime: Math.round(averageResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
        systemLoad
      },
      metrics: recentMetrics.slice(-100), // Last 100 metrics
      alerts: this.alerts.filter(a => !a.resolved).slice(-20), // Last 20 unresolved alerts
      trends
    };
  }

  /**
   * Get performance metrics for a specific category
   */
  public getMetricsByCategory(category: PerformanceMetric['category'], limit: number = 100): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.category === category)
      .slice(-limit);
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Update performance thresholds
   */
  public updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Get current thresholds
   */
  public getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }

  /**
   * Clear all metrics and alerts
   */
  public clearData(): void {
    this.metrics = [];
    this.alerts = [];
    this.requestCounts.clear();
    this.responseTimes.clear();
    this.errorCounts.clear();
  }

  /**
   * Export performance data
   */
  public exportData(): {
    metrics: PerformanceMetric[];
    alerts: PerformanceAlert[];
    summary: any;
  } {
    const report = this.getPerformanceReport();
    return {
      metrics: this.metrics,
      alerts: this.alerts,
      summary: report.summary
    };
  }

  // Private methods

  public addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last 10000 metrics to prevent memory issues
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }
  }

  private createAlert(type: 'warning' | 'critical', message: string, metric: string, threshold: number, currentValue: number): void {
    // Check if similar alert already exists and is unresolved
    const existingAlert = this.alerts.find(a => 
      !a.resolved && 
      a.metric === metric && 
      a.type === type &&
      Date.now() - a.timestamp.getTime() < 300000 // Within last 5 minutes
    );

    if (existingAlert) {
      return; // Don't create duplicate alerts
    }

    const alert: PerformanceAlert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      metric,
      threshold,
      currentValue,
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.push(alert);
    
    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-500);
    }

    console.warn(`Performance Alert [${type.toUpperCase()}]: ${message}`);
  }

  private collectSystemMetrics(): void {
    try {
      // Memory usage
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const memUsage = process.memoryUsage();
        this.addMetric({
          name: 'memory_usage',
          value: memUsage.heapUsed,
          unit: 'bytes',
          timestamp: new Date(),
          category: 'system',
          tags: { type: 'heap_used' }
        });

        this.addMetric({
          name: 'memory_usage',
          value: memUsage.heapTotal,
          unit: 'bytes',
          timestamp: new Date(),
          category: 'system',
          tags: { type: 'heap_total' }
        });
      }

      // CPU usage (simplified - would need more sophisticated implementation in production)
      const cpuUsage = this.getCPUUsage();
      if (cpuUsage !== null) {
        this.addMetric({
          name: 'cpu_usage',
          value: cpuUsage,
          unit: 'percent',
          timestamp: new Date(),
          category: 'system'
        });
      }
    } catch (error) {
      console.error('Error collecting system metrics:', error);
    }
  }

  private checkThresholds(): void {
    const recentMetrics = this.metrics.filter(m => 
      Date.now() - m.timestamp.getTime() < 300000 // Last 5 minutes
    );

    // Check error rate
    const apiRequests = recentMetrics.filter(m => m.category === 'api' && m.name === 'api_response_time');
    const errors = recentMetrics.filter(m => 
      m.category === 'api' && m.tags?.status && parseInt(m.tags.status) >= 400
    );
    
    if (apiRequests.length > 0) {
      const errorRate = errors.length / apiRequests.length;
      
      if (errorRate > this.thresholds.errorRate.critical) {
        this.createAlert('critical', `Critical error rate: ${Math.round(errorRate * 100)}%`, 'error_rate', this.thresholds.errorRate.critical, errorRate);
      } else if (errorRate > this.thresholds.errorRate.warning) {
        this.createAlert('warning', `High error rate: ${Math.round(errorRate * 100)}%`, 'error_rate', this.thresholds.errorRate.warning, errorRate);
      }
    }

    // Check cache hit rate
    const cacheHits = recentMetrics.filter(m => m.name === 'cache_hit').length;
    const cacheMisses = recentMetrics.filter(m => m.name === 'cache_miss').length;
    const totalCacheOps = cacheHits + cacheMisses;
    
    if (totalCacheOps > 0) {
      const hitRate = cacheHits / totalCacheOps;
      
      if (hitRate < this.thresholds.cacheHitRate.critical) {
        this.createAlert('critical', `Critical cache hit rate: ${Math.round(hitRate * 100)}%`, 'cache_hit_rate', this.thresholds.cacheHitRate.critical, hitRate);
      } else if (hitRate < this.thresholds.cacheHitRate.warning) {
        this.createAlert('warning', `Low cache hit rate: ${Math.round(hitRate * 100)}%`, 'cache_hit_rate', this.thresholds.cacheHitRate.warning, hitRate);
      }
    }
  }

  private cleanupOldMetrics(): void {
    const oneDayAgo = new Date(Date.now() - 86400000); // 24 hours ago
    this.metrics = this.metrics.filter(m => m.timestamp >= oneDayAgo);
    
    const oneWeekAgo = new Date(Date.now() - 604800000); // 1 week ago
    this.alerts = this.alerts.filter(a => a.timestamp >= oneWeekAgo);
  }

  private generateTrends(metrics: PerformanceMetric[]): PerformanceReport['trends'] {
    const now = new Date();
    const intervals = 12; // 12 intervals of 5 minutes each = 1 hour
    const intervalMs = 300000; // 5 minutes
    
    const responseTimeTrend: Array<{ timestamp: Date; value: number }> = [];
    const throughputTrend: Array<{ timestamp: Date; value: number }> = [];
    const errorRateTrend: Array<{ timestamp: Date; value: number }> = [];

    for (let i = intervals - 1; i >= 0; i--) {
      const intervalStart = new Date(now.getTime() - (i + 1) * intervalMs);
      const intervalEnd = new Date(now.getTime() - i * intervalMs);
      
      const intervalMetrics = metrics.filter(m => 
        m.timestamp >= intervalStart && m.timestamp < intervalEnd
      );

      // Response time trend
      const responseTimeMetrics = intervalMetrics.filter(m => 
        m.category === 'api' && m.name === 'api_response_time'
      );
      const avgResponseTime = responseTimeMetrics.length > 0
        ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
        : 0;
      
      responseTimeTrend.push({
        timestamp: intervalEnd,
        value: Math.round(avgResponseTime)
      });

      // Throughput trend (requests per minute)
      const requestCount = responseTimeMetrics.length;
      const throughput = requestCount * (60000 / intervalMs); // Convert to requests per minute
      
      throughputTrend.push({
        timestamp: intervalEnd,
        value: Math.round(throughput)
      });

      // Error rate trend
      const errorCount = intervalMetrics.filter(m => 
        m.category === 'api' && m.tags?.status && parseInt(m.tags.status) >= 400
      ).length;
      const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;
      
      errorRateTrend.push({
        timestamp: intervalEnd,
        value: Math.round(errorRate * 100) / 100
      });
    }

    return {
      responseTime: responseTimeTrend,
      throughput: throughputTrend,
      errorRate: errorRateTrend
    };
  }

  private sanitizeKey(key: string): string {
    // Remove sensitive information from cache keys for logging
    return key.replace(/user:\d+/g, 'user:***').replace(/token:[^:]+/g, 'token:***');
  }

  private getSystemLoad(): number {
    // Simplified system load calculation
    // In production, you might want to use more sophisticated metrics
    try {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const memUsage = process.memoryUsage();
        const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
        return Math.round(heapUsedPercent);
      }
    } catch (error) {
      console.error('Error getting system load:', error);
    }
    return 0;
  }

  private getCPUUsage(): number | null {
    // Simplified CPU usage - in production you'd want to use process.cpuUsage()
    // or a more sophisticated monitoring library
    try {
      if (typeof process !== 'undefined' && process.cpuUsage) {
        const usage = process.cpuUsage();
        const totalUsage = usage.user + usage.system;
        // Convert to percentage (this is a simplified calculation)
        return Math.round((totalUsage / 1000000) * 100) / 100;
      }
    } catch (error) {
      console.error('Error getting CPU usage:', error);
    }
    return null;
  }
}

// Singleton instance
export const performanceMonitor = new ApplicationPerformanceMonitor();

// Middleware function for automatic API monitoring
export function createPerformanceMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const originalSend = res.send;
    
    res.send = function(data: any) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      performanceMonitor.recordApiRequest(
        req.route?.path || req.path || req.url,
        req.method,
        responseTime,
        res.statusCode
      );
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}

// Utility functions for manual performance tracking
export const performanceUtils = {
  // Time a function execution
  timeFunction: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      performanceMonitor.recordUIMetric(`function_execution_time`, duration, 'ms', name);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      performanceMonitor.recordUIMetric(`function_execution_time`, duration, 'ms', `${name}_error`);
      throw error;
    }
  },

  // Mark performance points
  mark: (name: string): void => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  },

  // Measure between marks
  measure: (name: string, startMark: string, endMark?: string): void => {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        if (measure) {
          performanceMonitor.recordUIMetric('performance_measure', measure.duration, 'ms', name);
        }
      } catch (error) {
        console.warn('Performance measure failed:', error);
      }
    }
  },

  // Record custom metric
  recordMetric: (name: string, value: number, unit: string, category: PerformanceMetric['category'] = 'ui', tags?: Record<string, string>): void => {
    performanceMonitor.addMetric({
      name,
      value,
      unit,
      timestamp: new Date(),
      category,
      tags
    });
  }
};