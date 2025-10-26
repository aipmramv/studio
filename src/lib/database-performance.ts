import { MongoClient, Db, Collection, IndexSpecification, CreateIndexesOptions } from 'mongodb';
import { MongoDBConnection } from './mongodb-service';

// Performance monitoring interface
export interface DatabasePerformanceMetrics {
  connectionPool: {
    totalConnections: number;
    availableConnections: number;
    checkedOutConnections: number;
    maxPoolSize: number;
    minPoolSize: number;
  };
  queryPerformance: {
    averageQueryTime: number;
    slowQueries: Array<{
      query: string;
      duration: number;
      timestamp: Date;
    }>;
  };
  indexUsage: Array<{
    collection: string;
    index: string;
    usage: number;
    efficiency: number;
  }>;
  cacheHitRatio: number;
  diskUsage: {
    dataSize: number;
    indexSize: number;
    storageSize: number;
  };
}

// Index configuration for all collections
export interface IndexConfiguration {
  collection: string;
  indexes: Array<{
    specification: IndexSpecification;
    options?: CreateIndexesOptions;
    description: string;
  }>;
}

// Database performance optimizer
export class DatabasePerformanceOptimizer {
  private connection: MongoDBConnection;
  private db: Db | null = null;
  private performanceMetrics: DatabasePerformanceMetrics | null = null;
  private slowQueryThreshold: number = 100; // milliseconds
  private slowQueries: Array<{ query: string; duration: number; timestamp: Date }> = [];

  constructor() {
    this.connection = MongoDBConnection.getInstance();
  }

  /**
   * Initialize database performance optimization
   */
  public async initialize(): Promise<void> {
    try {
      this.db = await this.connection.connect();
      
      // Create optimized indexes
      await this.createOptimizedIndexes();
      
      // Set up performance monitoring
      await this.setupPerformanceMonitoring();
      
      // Configure connection pool optimization
      await this.optimizeConnectionPool();
      
      console.log('Database performance optimization initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database performance optimization:', error);
      throw error;
    }
  }

  /**
   * Create optimized indexes for all collections
   */
  private async createOptimizedIndexes(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    const indexConfigurations: IndexConfiguration[] = [
      {
        collection: 'assets',
        indexes: [
          {
            specification: { assetNumber: 1 },
            options: { unique: true, background: true },
            description: 'Unique index on asset number for fast lookups'
          },
          {
            specification: { department: 1, currentStatus: 1 },
            options: { background: true },
            description: 'Compound index for department-based filtering with status'
          },
          {
            specification: { location: 1, currentStatus: 1 },
            options: { background: true },
            description: 'Compound index for location-based queries with status'
          },
          {
            specification: { assetClassification: 1, department: 1 },
            options: { background: true },
            description: 'Compound index for classification and department filtering'
          },
          {
            specification: { 
              assetDescription: 'text', 
              assetNumber: 'text', 
              kmNumber: 'text',
              productSerialNo: 'text'
            },
            options: { 
              background: true,
              weights: {
                assetNumber: 10,
                assetDescription: 5,
                kmNumber: 3,
                productSerialNo: 1
              }
            },
            description: 'Text index for full-text search with weighted fields'
          },
          {
            specification: { createdAt: -1 },
            options: { background: true },
            description: 'Index for sorting by creation date'
          },
          {
            specification: { updatedAt: -1 },
            options: { background: true },
            description: 'Index for sorting by last update'
          },
          {
            specification: { createdBy: 1, createdAt: -1 },
            options: { background: true },
            description: 'Compound index for user-created assets with date sorting'
          },
          {
            specification: { 'attachments.photo': 1 },
            options: { sparse: true, background: true },
            description: 'Sparse index for assets with photos'
          },
          {
            specification: { verificationStatus: 1, department: 1 },
            options: { background: true },
            description: 'Index for verification status queries by department'
          }
        ]
      },
      {
        collection: 'users',
        indexes: [
          {
            specification: { email: 1 },
            options: { unique: true, background: true },
            description: 'Unique index on email for authentication'
          },
          {
            specification: { role: 1, isActive: 1 },
            options: { background: true },
            description: 'Compound index for role-based queries with active status'
          },
          {
            specification: { department: 1, role: 1 },
            options: { background: true },
            description: 'Compound index for department-based user queries'
          },
          {
            specification: { lastLogin: -1 },
            options: { background: true },
            description: 'Index for sorting by last login date'
          },
          {
            specification: { createdAt: -1 },
            options: { background: true },
            description: 'Index for sorting by user creation date'
          }
        ]
      },
      {
        collection: 'workflows',
        indexes: [
          {
            specification: { status: 1, currentAssignees: 1 },
            options: { background: true },
            description: 'Compound index for workflow status and assignee queries'
          },
          {
            specification: { requesterId: 1, createdAt: -1 },
            options: { background: true },
            description: 'Index for requester workflows sorted by date'
          },
          {
            specification: { type: 1, status: 1 },
            options: { background: true },
            description: 'Compound index for workflow type and status filtering'
          },
          {
            specification: { currentStepId: 1, status: 1 },
            options: { background: true },
            description: 'Index for current workflow step queries'
          },
          {
            specification: { requesterDepartment: 1, status: 1 },
            options: { background: true },
            description: 'Department-based workflow queries with status'
          },
          {
            specification: { createdAt: -1 },
            options: { background: true },
            description: 'Index for sorting workflows by creation date'
          },
          {
            specification: { completedAt: -1 },
            options: { sparse: true, background: true },
            description: 'Sparse index for completed workflows'
          }
        ]
      },
      {
        collection: 'masterData',
        indexes: [
          {
            specification: { type: 1, isActive: 1 },
            options: { background: true },
            description: 'Compound index for master data type and active status'
          },
          {
            specification: { code: 1, type: 1 },
            options: { unique: true, background: true },
            description: 'Unique compound index for master data code and type'
          },
          {
            specification: { parentId: 1 },
            options: { sparse: true, background: true },
            description: 'Sparse index for hierarchical master data'
          }
        ]
      },
      {
        collection: 'assetMovements',
        indexes: [
          {
            specification: { assetId: 1, timestamp: -1 },
            options: { background: true },
            description: 'Compound index for asset movement history'
          },
          {
            specification: { fromLocation: 1, toLocation: 1 },
            options: { background: true },
            description: 'Index for location-based movement queries'
          },
          {
            specification: { movementType: 1, timestamp: -1 },
            options: { background: true },
            description: 'Index for movement type queries with date sorting'
          },
          {
            specification: { approvedBy: 1, timestamp: -1 },
            options: { background: true },
            description: 'Index for movements by approver'
          }
        ]
      },
      {
        collection: 'auditLogs',
        indexes: [
          {
            specification: { entityType: 1, entityId: 1, timestamp: -1 },
            options: { background: true },
            description: 'Compound index for entity audit trails'
          },
          {
            specification: { userId: 1, timestamp: -1 },
            options: { background: true },
            description: 'Index for user activity logs'
          },
          {
            specification: { action: 1, timestamp: -1 },
            options: { background: true },
            description: 'Index for action-based audit queries'
          },
          {
            specification: { timestamp: -1 },
            options: { 
              background: true,
              expireAfterSeconds: 31536000 // 1 year TTL
            },
            description: 'TTL index for automatic audit log cleanup'
          }
        ]
      }
    ];

    for (const config of indexConfigurations) {
      await this.createCollectionIndexes(config);
    }
  }

  /**
   * Create indexes for a specific collection
   */
  private async createCollectionIndexes(config: IndexConfiguration): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    try {
      const collection = this.db.collection(config.collection);
      
      console.log(`Creating indexes for collection: ${config.collection}`);
      
      for (const indexConfig of config.indexes) {
        try {
          const indexName = await collection.createIndex(
            indexConfig.specification,
            {
              background: true,
              ...indexConfig.options
            }
          );
          
          console.log(`✓ Created index "${indexName}" on ${config.collection}: ${indexConfig.description}`);
        } catch (error: any) {
          // Skip if index already exists
          if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
            console.log(`⚠ Index already exists on ${config.collection}: ${indexConfig.description}`);
          } else {
            console.error(`✗ Failed to create index on ${config.collection}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to create indexes for collection ${config.collection}:`, error);
    }
  }

  /**
   * Set up performance monitoring
   */
  private async setupPerformanceMonitoring(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    try {
      // Enable profiling for slow operations
      await this.db.admin().command({
        profile: 2, // Profile all operations
        slowms: this.slowQueryThreshold
      });

      console.log(`Database profiling enabled for operations slower than ${this.slowQueryThreshold}ms`);
    } catch (error) {
      console.warn('Could not enable database profiling:', error);
    }
  }

  /**
   * Optimize connection pool settings
   */
  private async optimizeConnectionPool(): Promise<void> {
    // Connection pool optimization is handled in the MongoDBConnection class
    // This method can be used for runtime adjustments if needed
    console.log('Connection pool optimization configured in MongoDBConnection');
  }

  /**
   * Get current performance metrics
   */
  public async getPerformanceMetrics(): Promise<DatabasePerformanceMetrics> {
    if (!this.db) throw new Error('Database not connected');

    try {
      const client = this.connection.getClient();
      
      // Get connection pool stats
      const poolStats = client.topology?.s?.server?.s?.pool?.stats || {};
      
      // Get database stats
      const dbStats = await this.db.stats();
      
      // Get slow queries from profiler
      const slowQueries = await this.getSlowQueries();
      
      // Get index usage stats
      const indexUsage = await this.getIndexUsageStats();

      this.performanceMetrics = {
        connectionPool: {
          totalConnections: poolStats.totalConnectionCount || 0,
          availableConnections: poolStats.availableConnectionCount || 0,
          checkedOutConnections: poolStats.checkedOutConnectionCount || 0,
          maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
          minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2')
        },
        queryPerformance: {
          averageQueryTime: this.calculateAverageQueryTime(slowQueries),
          slowQueries: slowQueries.slice(0, 10) // Last 10 slow queries
        },
        indexUsage,
        cacheHitRatio: this.calculateCacheHitRatio(dbStats),
        diskUsage: {
          dataSize: dbStats.dataSize || 0,
          indexSize: dbStats.indexSize || 0,
          storageSize: dbStats.storageSize || 0
        }
      };

      return this.performanceMetrics;
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get slow queries from profiler
   */
  private async getSlowQueries(): Promise<Array<{ query: string; duration: number; timestamp: Date }>> {
    if (!this.db) return [];

    try {
      const profilerCollection = this.db.collection('system.profile');
      const slowOps = await profilerCollection
        .find({ 
          ts: { $gte: new Date(Date.now() - 3600000) }, // Last hour
          millis: { $gte: this.slowQueryThreshold }
        })
        .sort({ ts: -1 })
        .limit(50)
        .toArray();

      return slowOps.map(op => ({
        query: JSON.stringify(op.command || {}),
        duration: op.millis || 0,
        timestamp: op.ts || new Date()
      }));
    } catch (error) {
      console.warn('Could not retrieve slow queries:', error);
      return [];
    }
  }

  /**
   * Get index usage statistics
   */
  private async getIndexUsageStats(): Promise<Array<{ collection: string; index: string; usage: number; efficiency: number }>> {
    if (!this.db) return [];

    try {
      const collections = ['assets', 'users', 'workflows', 'masterData', 'assetMovements'];
      const indexStats: Array<{ collection: string; index: string; usage: number; efficiency: number }> = [];

      for (const collectionName of collections) {
        try {
          const collection = this.db.collection(collectionName);
          const stats = await collection.aggregate([
            { $indexStats: {} }
          ]).toArray();

          stats.forEach(stat => {
            indexStats.push({
              collection: collectionName,
              index: stat.name,
              usage: stat.accesses?.ops || 0,
              efficiency: this.calculateIndexEfficiency(stat)
            });
          });
        } catch (error) {
          console.warn(`Could not get index stats for ${collectionName}:`, error);
        }
      }

      return indexStats;
    } catch (error) {
      console.warn('Could not retrieve index usage stats:', error);
      return [];
    }
  }

  /**
   * Calculate average query time
   */
  private calculateAverageQueryTime(slowQueries: Array<{ duration: number }>): number {
    if (slowQueries.length === 0) return 0;
    
    const totalTime = slowQueries.reduce((sum, query) => sum + query.duration, 0);
    return Math.round(totalTime / slowQueries.length);
  }

  /**
   * Calculate cache hit ratio
   */
  private calculateCacheHitRatio(dbStats: any): number {
    // This is a simplified calculation - in production you might want more sophisticated metrics
    const hits = dbStats.indexCounters?.hits || 0;
    const misses = dbStats.indexCounters?.misses || 0;
    const total = hits + misses;
    
    return total > 0 ? Math.round((hits / total) * 100) : 0;
  }

  /**
   * Calculate index efficiency
   */
  private calculateIndexEfficiency(indexStat: any): number {
    const accesses = indexStat.accesses?.ops || 0;
    const since = indexStat.accesses?.since || new Date();
    const hoursSince = (Date.now() - since.getTime()) / (1000 * 60 * 60);
    
    // Calculate accesses per hour as efficiency metric
    return hoursSince > 0 ? Math.round(accesses / hoursSince) : 0;
  }

  /**
   * Analyze and recommend index optimizations
   */
  public async analyzeIndexPerformance(): Promise<{
    recommendations: string[];
    unusedIndexes: string[];
    slowQueries: Array<{ query: string; duration: number; recommendation: string }>;
  }> {
    const metrics = await this.getPerformanceMetrics();
    const recommendations: string[] = [];
    const unusedIndexes: string[] = [];
    const slowQueryRecommendations: Array<{ query: string; duration: number; recommendation: string }> = [];

    // Analyze index usage
    metrics.indexUsage.forEach(index => {
      if (index.usage === 0 && index.index !== '_id_') {
        unusedIndexes.push(`${index.collection}.${index.index}`);
      } else if (index.efficiency < 1 && index.index !== '_id_') {
        recommendations.push(`Consider reviewing index ${index.collection}.${index.index} - low efficiency (${index.efficiency} accesses/hour)`);
      }
    });

    // Analyze slow queries
    metrics.queryPerformance.slowQueries.forEach(query => {
      let recommendation = 'Consider adding appropriate indexes for this query';
      
      if (query.duration > 1000) {
        recommendation = 'Critical: This query is very slow (>1s). Immediate optimization needed.';
      } else if (query.duration > 500) {
        recommendation = 'Warning: This query is slow (>500ms). Consider optimization.';
      }

      slowQueryRecommendations.push({
        query: query.query,
        duration: query.duration,
        recommendation
      });
    });

    // Connection pool recommendations
    if (metrics.connectionPool.checkedOutConnections / metrics.connectionPool.maxPoolSize > 0.8) {
      recommendations.push('Connection pool utilization is high (>80%). Consider increasing maxPoolSize.');
    }

    // Cache hit ratio recommendations
    if (metrics.cacheHitRatio < 80) {
      recommendations.push(`Cache hit ratio is low (${metrics.cacheHitRatio}%). Consider optimizing queries or increasing cache size.`);
    }

    return {
      recommendations,
      unusedIndexes,
      slowQueries: slowQueryRecommendations
    };
  }

  /**
   * Optimize database based on current performance metrics
   */
  public async optimizeDatabase(): Promise<{
    optimizationsApplied: string[];
    errors: string[];
  }> {
    const optimizationsApplied: string[] = [];
    const errors: string[] = [];

    try {
      // Run database maintenance commands
      if (this.db) {
        // Compact collections to reclaim space
        const collections = await this.db.listCollections().toArray();
        
        for (const collection of collections) {
          try {
            await this.db.command({ compact: collection.name });
            optimizationsApplied.push(`Compacted collection: ${collection.name}`);
          } catch (error: any) {
            errors.push(`Failed to compact ${collection.name}: ${error.message}`);
          }
        }

        // Update collection statistics
        try {
          await this.db.command({ planCacheClear: 1 });
          optimizationsApplied.push('Cleared query plan cache');
        } catch (error: any) {
          errors.push(`Failed to clear plan cache: ${error.message}`);
        }
      }
    } catch (error: any) {
      errors.push(`Database optimization failed: ${error.message}`);
    }

    return { optimizationsApplied, errors };
  }

  /**
   * Monitor database performance continuously
   */
  public startPerformanceMonitoring(intervalMs: number = 60000): void {
    setInterval(async () => {
      try {
        const metrics = await this.getPerformanceMetrics();
        
        // Log performance alerts
        if (metrics.queryPerformance.averageQueryTime > 500) {
          console.warn(`Performance Alert: Average query time is ${metrics.queryPerformance.averageQueryTime}ms`);
        }

        if (metrics.connectionPool.checkedOutConnections / metrics.connectionPool.maxPoolSize > 0.9) {
          console.warn(`Performance Alert: Connection pool utilization is ${Math.round((metrics.connectionPool.checkedOutConnections / metrics.connectionPool.maxPoolSize) * 100)}%`);
        }

        if (metrics.cacheHitRatio < 70) {
          console.warn(`Performance Alert: Cache hit ratio is ${metrics.cacheHitRatio}%`);
        }
      } catch (error) {
        console.error('Performance monitoring error:', error);
      }
    }, intervalMs);

    console.log(`Database performance monitoring started (interval: ${intervalMs}ms)`);
  }
}

// Export singleton instance
export const databasePerformanceOptimizer = new DatabasePerformanceOptimizer();