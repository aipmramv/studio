import { MongoClient } from 'mongodb';
import { MongoDBConnection } from './mongodb-service';

// Connection pool monitoring interface
export interface ConnectionPoolStats {
  totalConnections: number;
  availableConnections: number;
  checkedOutConnections: number;
  maxPoolSize: number;
  minPoolSize: number;
  waitQueueSize: number;
  utilization: number; // Percentage
  efficiency: number; // Connections per second
  averageWaitTime: number; // Milliseconds
  peakConnections: number;
  connectionErrors: number;
  lastResetTime: Date;
}

export interface ConnectionPoolAlert {
  type: 'warning' | 'critical' | 'info';
  message: string;
  timestamp: Date;
  metrics: Partial<ConnectionPoolStats>;
}

// Connection pool monitor
export class ConnectionPoolMonitor {
  private connection: MongoDBConnection;
  private stats: ConnectionPoolStats;
  private alerts: ConnectionPoolAlert[] = [];
  private monitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private connectionHistory: Array<{ timestamp: Date; connections: number }> = [];
  private waitTimeHistory: Array<{ timestamp: Date; waitTime: number }> = [];

  constructor() {
    this.connection = MongoDBConnection.getInstance();
    this.stats = this.initializeStats();
  }

  /**
   * Initialize default stats
   */
  private initializeStats(): ConnectionPoolStats {
    return {
      totalConnections: 0,
      availableConnections: 0,
      checkedOutConnections: 0,
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2'),
      waitQueueSize: 0,
      utilization: 0,
      efficiency: 0,
      averageWaitTime: 0,
      peakConnections: 0,
      connectionErrors: 0,
      lastResetTime: new Date()
    };
  }

  /**
   * Start monitoring connection pool
   */
  public startMonitoring(intervalMs: number = 30000): void {
    if (this.monitoring) {
      console.log('Connection pool monitoring is already running');
      return;
    }

    this.monitoring = true;
    this.monitoringInterval = setInterval(async () => {
      await this.collectStats();
      this.analyzeStats();
    }, intervalMs);

    console.log(`Connection pool monitoring started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.monitoring = false;
    console.log('Connection pool monitoring stopped');
  }

  /**
   * Collect current connection pool statistics
   */
  private async collectStats(): Promise<void> {
    try {
      if (!this.connection.isConnected()) {
        return;
      }

      const client = this.connection.getClient();
      const topology = (client as any).topology;
      
      if (!topology) {
        return;
      }

      // Get connection pool stats from MongoDB driver
      const poolStats = this.extractPoolStats(topology);
      
      // Update stats
      this.stats = {
        ...this.stats,
        ...poolStats,
        utilization: this.calculateUtilization(poolStats),
        efficiency: this.calculateEfficiency(),
        averageWaitTime: this.calculateAverageWaitTime(),
        peakConnections: Math.max(this.stats.peakConnections, poolStats.totalConnections)
      };

      // Record history
      this.recordConnectionHistory();
      
    } catch (error) {
      console.error('Failed to collect connection pool stats:', error);
      this.stats.connectionErrors++;
    }
  }

  /**
   * Extract pool statistics from MongoDB topology
   */
  private extractPoolStats(topology: any): Partial<ConnectionPoolStats> {
    try {
      // Access pool stats from different possible locations in the driver
      let poolStats: any = {};

      // Try different paths based on MongoDB driver version
      if (topology.s?.server?.s?.pool) {
        const pool = topology.s.server.s.pool;
        poolStats = {
          totalConnections: pool.totalConnectionCount || 0,
          availableConnections: pool.availableConnectionCount || 0,
          checkedOutConnections: pool.checkedOutConnectionCount || 0,
          waitQueueSize: pool.waitQueueSize || 0
        };
      } else if (topology.s?.servers) {
        // For replica sets or sharded clusters
        let totalConn = 0;
        let availableConn = 0;
        let checkedOutConn = 0;
        let waitQueue = 0;

        topology.s.servers.forEach((server: any) => {
          if (server.s?.pool) {
            const pool = server.s.pool;
            totalConn += pool.totalConnectionCount || 0;
            availableConn += pool.availableConnectionCount || 0;
            checkedOutConn += pool.checkedOutConnectionCount || 0;
            waitQueue += pool.waitQueueSize || 0;
          }
        });

        poolStats = {
          totalConnections: totalConn,
          availableConnections: availableConn,
          checkedOutConnections: checkedOutConn,
          waitQueueSize: waitQueue
        };
      }

      return poolStats;
    } catch (error) {
      console.warn('Could not extract pool stats:', error);
      return {};
    }
  }

  /**
   * Calculate connection pool utilization percentage
   */
  private calculateUtilization(poolStats: Partial<ConnectionPoolStats>): number {
    const checkedOut = poolStats.checkedOutConnections || 0;
    const maxPool = this.stats.maxPoolSize;
    return maxPool > 0 ? Math.round((checkedOut / maxPool) * 100) : 0;
  }

  /**
   * Calculate connection efficiency (connections per second)
   */
  private calculateEfficiency(): number {
    if (this.connectionHistory.length < 2) return 0;

    const recent = this.connectionHistory.slice(-10); // Last 10 measurements
    const timeSpan = recent[recent.length - 1].timestamp.getTime() - recent[0].timestamp.getTime();
    const connectionChanges = recent.reduce((sum, curr, index) => {
      if (index === 0) return 0;
      return sum + Math.abs(curr.connections - recent[index - 1].connections);
    }, 0);

    return timeSpan > 0 ? Math.round((connectionChanges / (timeSpan / 1000)) * 100) / 100 : 0;
  }

  /**
   * Calculate average wait time
   */
  private calculateAverageWaitTime(): number {
    if (this.waitTimeHistory.length === 0) return 0;

    const recent = this.waitTimeHistory.slice(-20); // Last 20 measurements
    const totalWaitTime = recent.reduce((sum, curr) => sum + curr.waitTime, 0);
    return Math.round(totalWaitTime / recent.length);
  }

  /**
   * Record connection history for trend analysis
   */
  private recordConnectionHistory(): void {
    const now = new Date();
    
    this.connectionHistory.push({
      timestamp: now,
      connections: this.stats.totalConnections
    });

    // Keep only last 100 entries
    if (this.connectionHistory.length > 100) {
      this.connectionHistory = this.connectionHistory.slice(-100);
    }

    // Simulate wait time recording (in real implementation, this would come from driver events)
    if (this.stats.waitQueueSize > 0) {
      this.waitTimeHistory.push({
        timestamp: now,
        waitTime: this.stats.waitQueueSize * 10 // Estimated wait time
      });

      if (this.waitTimeHistory.length > 50) {
        this.waitTimeHistory = this.waitTimeHistory.slice(-50);
      }
    }
  }

  /**
   * Analyze stats and generate alerts
   */
  private analyzeStats(): void {
    const now = new Date();

    // High utilization alert
    if (this.stats.utilization > 90) {
      this.addAlert({
        type: 'critical',
        message: `Connection pool utilization is critical (${this.stats.utilization}%). Consider increasing maxPoolSize.`,
        timestamp: now,
        metrics: { utilization: this.stats.utilization, maxPoolSize: this.stats.maxPoolSize }
      });
    } else if (this.stats.utilization > 80) {
      this.addAlert({
        type: 'warning',
        message: `Connection pool utilization is high (${this.stats.utilization}%). Monitor closely.`,
        timestamp: now,
        metrics: { utilization: this.stats.utilization }
      });
    }

    // Wait queue alert
    if (this.stats.waitQueueSize > 5) {
      this.addAlert({
        type: 'warning',
        message: `Connection wait queue is growing (${this.stats.waitQueueSize} waiting). Consider optimizing queries or increasing pool size.`,
        timestamp: now,
        metrics: { waitQueueSize: this.stats.waitQueueSize }
      });
    }

    // Low efficiency alert
    if (this.stats.efficiency > 10) {
      this.addAlert({
        type: 'warning',
        message: `High connection churn detected (${this.stats.efficiency} connections/sec). Consider connection reuse optimization.`,
        timestamp: now,
        metrics: { efficiency: this.stats.efficiency }
      });
    }

    // Connection errors alert
    if (this.stats.connectionErrors > 0) {
      this.addAlert({
        type: 'critical',
        message: `Connection errors detected (${this.stats.connectionErrors} errors). Check database connectivity.`,
        timestamp: now,
        metrics: { connectionErrors: this.stats.connectionErrors }
      });
    }
  }

  /**
   * Add alert to the alerts array
   */
  private addAlert(alert: ConnectionPoolAlert): void {
    this.alerts.push(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }

    // Log critical alerts immediately
    if (alert.type === 'critical') {
      console.error(`[CRITICAL] Connection Pool Alert: ${alert.message}`);
    } else if (alert.type === 'warning') {
      console.warn(`[WARNING] Connection Pool Alert: ${alert.message}`);
    }
  }

  /**
   * Get current connection pool statistics
   */
  public getStats(): ConnectionPoolStats {
    return { ...this.stats };
  }

  /**
   * Get recent alerts
   */
  public getAlerts(limit: number = 10): ConnectionPoolAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Get connection history for trend analysis
   */
  public getConnectionHistory(minutes: number = 60): Array<{ timestamp: Date; connections: number }> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.connectionHistory.filter(entry => entry.timestamp >= cutoff);
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = this.initializeStats();
    this.alerts = [];
    this.connectionHistory = [];
    this.waitTimeHistory = [];
    console.log('Connection pool statistics reset');
  }

  /**
   * Get optimization recommendations
   */
  public getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.stats.utilization > 80) {
      recommendations.push(`Increase maxPoolSize from ${this.stats.maxPoolSize} to ${Math.ceil(this.stats.maxPoolSize * 1.5)}`);
    }

    if (this.stats.utilization < 20 && this.stats.maxPoolSize > 5) {
      recommendations.push(`Consider reducing maxPoolSize from ${this.stats.maxPoolSize} to ${Math.max(5, Math.floor(this.stats.maxPoolSize * 0.7))}`);
    }

    if (this.stats.waitQueueSize > 0) {
      recommendations.push('Optimize slow queries to reduce connection hold time');
      recommendations.push('Consider implementing connection pooling at application level');
    }

    if (this.stats.efficiency > 5) {
      recommendations.push('High connection churn detected - implement connection reuse patterns');
      recommendations.push('Consider using connection pooling middleware');
    }

    if (this.stats.averageWaitTime > 100) {
      recommendations.push('High average wait time - consider increasing connection timeout settings');
    }

    return recommendations;
  }

  /**
   * Generate performance report
   */
  public generateReport(): {
    summary: string;
    stats: ConnectionPoolStats;
    alerts: ConnectionPoolAlert[];
    recommendations: string[];
    trends: {
      connectionTrend: 'increasing' | 'decreasing' | 'stable';
      utilizationTrend: 'increasing' | 'decreasing' | 'stable';
    };
  } {
    const recentHistory = this.getConnectionHistory(30);
    const connectionTrend = this.analyzeTrend(recentHistory.map(h => h.connections));
    
    const utilizationHistory = recentHistory.map(h => 
      this.stats.maxPoolSize > 0 ? (h.connections / this.stats.maxPoolSize) * 100 : 0
    );
    const utilizationTrend = this.analyzeTrend(utilizationHistory);

    let summary = 'Connection pool is operating ';
    if (this.stats.utilization > 90) {
      summary += 'at critical capacity';
    } else if (this.stats.utilization > 70) {
      summary += 'at high capacity';
    } else if (this.stats.utilization > 30) {
      summary += 'at normal capacity';
    } else {
      summary += 'at low capacity';
    }

    return {
      summary,
      stats: this.getStats(),
      alerts: this.getAlerts(),
      recommendations: this.getOptimizationRecommendations(),
      trends: {
        connectionTrend,
        utilizationTrend
      }
    };
  }

  /**
   * Analyze trend from numeric array
   */
  private analyzeTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 3) return 'stable';

    const recent = values.slice(-10);
    const first = recent.slice(0, Math.floor(recent.length / 2));
    const second = recent.slice(Math.floor(recent.length / 2));

    const firstAvg = first.reduce((sum, val) => sum + val, 0) / first.length;
    const secondAvg = second.reduce((sum, val) => sum + val, 0) / second.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }
}

// Export singleton instance
export const connectionPoolMonitor = new ConnectionPoolMonitor();