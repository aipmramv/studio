import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DatabasePerformanceOptimizer, databasePerformanceOptimizer } from '../database-performance';
import { QueryOptimizer } from '../query-optimizer';
import { ConnectionPoolMonitor, connectionPoolMonitor } from '../connection-pool-monitor';
import { MongoDBConnection } from '../mongodb-service';

describe('Database Performance Optimization', () => {
  let connection: MongoDBConnection;

  beforeAll(async () => {
    connection = MongoDBConnection.getInstance();
    await connection.connect();
  });

  afterAll(async () => {
    await connection.disconnect();
  });

  describe('DatabasePerformanceOptimizer', () => {
    it('should initialize performance optimization', async () => {
      await expect(databasePerformanceOptimizer.initialize()).resolves.not.toThrow();
    });

    it('should get performance metrics', async () => {
      const metrics = await databasePerformanceOptimizer.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('connectionPool');
      expect(metrics).toHaveProperty('queryPerformance');
      expect(metrics).toHaveProperty('indexUsage');
      expect(metrics).toHaveProperty('cacheHitRatio');
      expect(metrics).toHaveProperty('diskUsage');
      
      expect(metrics.connectionPool).toHaveProperty('maxPoolSize');
      expect(metrics.connectionPool).toHaveProperty('totalConnections');
      expect(metrics.queryPerformance).toHaveProperty('averageQueryTime');
      expect(Array.isArray(metrics.indexUsage)).toBe(true);
    });

    it('should analyze index performance', async () => {
      const analysis = await databasePerformanceOptimizer.analyzeIndexPerformance();
      
      expect(analysis).toHaveProperty('recommendations');
      expect(analysis).toHaveProperty('unusedIndexes');
      expect(analysis).toHaveProperty('slowQueries');
      
      expect(Array.isArray(analysis.recommendations)).toBe(true);
      expect(Array.isArray(analysis.unusedIndexes)).toBe(true);
      expect(Array.isArray(analysis.slowQueries)).toBe(true);
    });

    it('should optimize database', async () => {
      const result = await databasePerformanceOptimizer.optimizeDatabase();
      
      expect(result).toHaveProperty('optimizationsApplied');
      expect(result).toHaveProperty('errors');
      
      expect(Array.isArray(result.optimizationsApplied)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('QueryOptimizer', () => {
    it('should optimize basic queries', () => {
      const filter = { department: 'IT', status: 'active' };
      const options = { skip: 0, limit: 50 };
      
      const result = QueryOptimizer.optimizeQuery(filter, options);
      
      expect(result).toHaveProperty('filter');
      expect(result).toHaveProperty('options');
      expect(result).toHaveProperty('hints');
      
      expect(Array.isArray(result.hints)).toBe(true);
      expect(result.options.limit).toBeLessThanOrEqual(100);
    });

    it('should optimize queries with large skip values', () => {
      const filter = { department: 'IT' };
      const options = { skip: 2000, limit: 50 };
      
      const result = QueryOptimizer.optimizeQuery(filter, options);
      
      expect(result.hints.some(hint => hint.includes('cursor-based pagination'))).toBe(true);
    });

    it('should optimize aggregation pipelines', () => {
      const pipeline = [
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $match: { count: { $gt: 10 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: 'department', as: 'users' } }
      ];
      
      const result = QueryOptimizer.optimizeAggregation(pipeline);
      
      expect(result).toHaveProperty('pipeline');
      expect(result).toHaveProperty('hints');
      expect(Array.isArray(result.hints)).toBe(true);
    });

    it('should recommend indexes based on query patterns', () => {
      const queries = [
        { filter: { department: 'IT', status: 'active' }, sort: { createdAt: -1 } },
        { filter: { department: 'HR', status: 'active' }, sort: { createdAt: -1 } },
        { filter: { department: 'Finance', status: 'inactive' }, sort: { updatedAt: -1 } }
      ];
      
      const recommendations = QueryOptimizer.recommendIndexes(queries);
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(rec => rec.includes('department'))).toBe(true);
    });

    it('should optimize collection-specific queries', () => {
      const filter = { department: 'IT', currentStatus: 'active' };
      const options = {};
      
      const result = QueryOptimizer.optimizeForCollection('assets', filter, options);
      
      expect(result).toHaveProperty('filter');
      expect(result).toHaveProperty('options');
      expect(result).toHaveProperty('hints');
      
      expect(result.hints.some(hint => hint.includes('compound index'))).toBe(true);
    });

    it('should create efficient pagination queries', () => {
      const filter = { department: 'IT' };
      const page = 5;
      const limit = 20;
      
      const result = QueryOptimizer.createPaginationQuery(filter, page, limit);
      
      expect(result.options.skip).toBe(80); // (5-1) * 20
      expect(result.options.limit).toBe(20);
      expect(result.options.sort).toBeDefined();
    });

    it('should create cursor-based pagination queries', () => {
      const filter = { department: 'IT' };
      const cursor = '507f1f77bcf86cd799439011';
      const limit = 20;
      
      const result = QueryOptimizer.createCursorPaginationQuery(filter, cursor, limit);
      
      expect(result.filter).toHaveProperty('_id');
      expect(result.filter._id).toHaveProperty('$gt');
      expect(result.options.limit).toBe(20);
      expect(result.hints.some(hint => hint.includes('cursor-based'))).toBe(true);
    });
  });

  describe('ConnectionPoolMonitor', () => {
    beforeEach(() => {
      connectionPoolMonitor.resetStats();
    });

    it('should get connection pool stats', () => {
      const stats = connectionPoolMonitor.getStats();
      
      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('availableConnections');
      expect(stats).toHaveProperty('checkedOutConnections');
      expect(stats).toHaveProperty('maxPoolSize');
      expect(stats).toHaveProperty('minPoolSize');
      expect(stats).toHaveProperty('utilization');
      expect(stats).toHaveProperty('efficiency');
      
      expect(typeof stats.totalConnections).toBe('number');
      expect(typeof stats.utilization).toBe('number');
    });

    it('should start and stop monitoring', () => {
      expect(() => connectionPoolMonitor.startMonitoring(1000)).not.toThrow();
      expect(() => connectionPoolMonitor.stopMonitoring()).not.toThrow();
    });

    it('should get alerts', () => {
      const alerts = connectionPoolMonitor.getAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should get connection history', () => {
      const history = connectionPoolMonitor.getConnectionHistory(30);
      expect(Array.isArray(history)).toBe(true);
    });

    it('should generate optimization recommendations', () => {
      const recommendations = connectionPoolMonitor.getOptimizationRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should generate performance report', () => {
      const report = connectionPoolMonitor.generateReport();
      
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('stats');
      expect(report).toHaveProperty('alerts');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('trends');
      
      expect(typeof report.summary).toBe('string');
      expect(Array.isArray(report.alerts)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.trends).toHaveProperty('connectionTrend');
      expect(report.trends).toHaveProperty('utilizationTrend');
    });

    it('should reset stats', () => {
      connectionPoolMonitor.resetStats();
      const stats = connectionPoolMonitor.getStats();
      
      expect(stats.connectionErrors).toBe(0);
      expect(stats.peakConnections).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    it('should work together for comprehensive performance monitoring', async () => {
      // Initialize performance optimization
      await databasePerformanceOptimizer.initialize();
      
      // Start connection pool monitoring
      connectionPoolMonitor.startMonitoring(5000);
      
      // Get comprehensive metrics
      const performanceMetrics = await databasePerformanceOptimizer.getPerformanceMetrics();
      const poolStats = connectionPoolMonitor.getStats();
      const analysis = await databasePerformanceOptimizer.analyzeIndexPerformance();
      
      expect(performanceMetrics).toBeDefined();
      expect(poolStats).toBeDefined();
      expect(analysis).toBeDefined();
      
      // Stop monitoring
      connectionPoolMonitor.stopMonitoring();
    });

    it('should optimize real queries', () => {
      const realQueries = [
        {
          collection: 'assets',
          filter: { department: 'IT', currentStatus: 'active' },
          options: { limit: 50, sort: { updatedAt: -1 } }
        },
        {
          collection: 'workflows',
          filter: { status: 'pending', currentAssignees: 'manager' },
          options: { limit: 20 }
        },
        {
          collection: 'users',
          filter: { role: 'user', isActive: true },
          options: { projection: { password: 0 } }
        }
      ];

      realQueries.forEach(query => {
        const optimized = QueryOptimizer.optimizeForCollection(
          query.collection,
          query.filter,
          query.options
        );
        
        expect(optimized).toHaveProperty('filter');
        expect(optimized).toHaveProperty('options');
        expect(optimized).toHaveProperty('hints');
        expect(Array.isArray(optimized.hints)).toBe(true);
      });
    });
  });
});