'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Database, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Settings,
  BarChart3,
  Clock
} from 'lucide-react';

interface DatabasePerformanceMetrics {
  connectionPool: {
    totalConnections: number;
    availableConnections: number;
    checkedOutConnections: number;
    maxPoolSize: number;
    minPoolSize: number;
    utilization: number;
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

interface PerformanceAnalysis {
  recommendations: string[];
  unusedIndexes: string[];
  slowQueries: Array<{
    query: string;
    duration: number;
    recommendation: string;
  }>;
}

interface ConnectionPoolStats {
  totalConnections: number;
  availableConnections: number;
  checkedOutConnections: number;
  maxPoolSize: number;
  minPoolSize: number;
  utilization: number;
  efficiency: number;
  averageWaitTime: number;
  peakConnections: number;
  connectionErrors: number;
}

export default function DatabasePerformanceDashboard() {
  const [metrics, setMetrics] = useState<DatabasePerformanceMetrics | null>(null);
  const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null);
  const [poolStats, setPoolStats] = useState<ConnectionPoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch performance metrics
      const metricsResponse = await fetch('/api/admin/database/performance');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.data);
      }

      // Fetch connection pool stats
      const poolResponse = await fetch('/api/admin/database/pool?action=stats');
      if (poolResponse.ok) {
        const poolData = await poolResponse.json();
        setPoolStats(poolData.data);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysis = async () => {
    try {
      const response = await fetch('/api/admin/database/performance/analyze', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    }
  };

  const optimizeDatabase = async () => {
    try {
      setOptimizing(true);
      
      const response = await fetch('/api/admin/database/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false })
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Optimization completed:\n${data.optimizationsApplied.join('\n')}`);
        await fetchMetrics();
      }
    } catch (error) {
      console.error('Failed to optimize database:', error);
      alert('Failed to optimize database');
    } finally {
      setOptimizing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchAnalysis();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMetrics();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600';
    if (utilization >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getPerformanceStatus = (avgTime: number) => {
    if (avgTime > 500) return { status: 'Poor', color: 'text-red-600', icon: XCircle };
    if (avgTime > 200) return { status: 'Fair', color: 'text-yellow-600', icon: AlertTriangle };
    return { status: 'Good', color: 'text-green-600', icon: CheckCircle };
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading performance metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Database Performance</h2>
          <p className="text-gray-600">
            Monitor and optimize database performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchMetrics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={optimizeDatabase}
            disabled={optimizing}
          >
            <Settings className={`h-4 w-4 mr-2 ${optimizing ? 'animate-spin' : ''}`} />
            Optimize
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-sm text-gray-500 flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connections">Connection Pool</TabsTrigger>
          <TabsTrigger value="queries">Query Performance</TabsTrigger>
          <TabsTrigger value="indexes">Index Usage</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Connection Pool Utilization */}
            {poolStats && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pool Utilization</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <span className={getUtilizationColor(poolStats.utilization)}>
                      {poolStats.utilization}%
                    </span>
                  </div>
                  <Progress value={poolStats.utilization} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {poolStats.checkedOutConnections}/{poolStats.maxPoolSize} connections
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Query Performance */}
            {metrics && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Query Time</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <span className={getPerformanceStatus(metrics.queryPerformance.averageQueryTime).color}>
                      {metrics.queryPerformance.averageQueryTime}ms
                    </span>
                  </div>
                  <div className="flex items-center mt-2">
                    {React.createElement(getPerformanceStatus(metrics.queryPerformance.averageQueryTime).icon, {
                      className: `h-4 w-4 mr-1 ${getPerformanceStatus(metrics.queryPerformance.averageQueryTime).color}`
                    })}
                    <span className="text-xs text-muted-foreground">
                      {getPerformanceStatus(metrics.queryPerformance.averageQueryTime).status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cache Hit Ratio */}
            {metrics && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cache Hit Ratio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <span className={metrics.cacheHitRatio >= 80 ? 'text-green-600' : 'text-yellow-600'}>
                      {metrics.cacheHitRatio}%
                    </span>
                  </div>
                  <Progress value={metrics.cacheHitRatio} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {metrics.cacheHitRatio >= 80 ? 'Excellent' : 'Needs improvement'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Disk Usage */}
            {metrics && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatBytes(metrics.diskUsage.storageSize)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    <div>Data: {formatBytes(metrics.diskUsage.dataSize)}</div>
                    <div>Indexes: {formatBytes(metrics.diskUsage.indexSize)}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Connection Pool Tab */}
        <TabsContent value="connections" className="space-y-4">
          {poolStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Connection Pool Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Connections:</span>
                    <span className="font-medium">{poolStats.totalConnections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available:</span>
                    <span className="font-medium text-green-600">{poolStats.availableConnections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Checked Out:</span>
                    <span className="font-medium text-blue-600">{poolStats.checkedOutConnections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Pool Size:</span>
                    <span className="font-medium">{poolStats.maxPoolSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Min Pool Size:</span>
                    <span className="font-medium">{poolStats.minPoolSize}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Utilization:</span>
                    <Badge variant={poolStats.utilization > 80 ? 'destructive' : 'default'}>
                      {poolStats.utilization}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Efficiency:</span>
                    <span className="font-medium">{poolStats.efficiency} conn/sec</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Wait Time:</span>
                    <span className="font-medium">{poolStats.averageWaitTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peak Connections:</span>
                    <span className="font-medium">{poolStats.peakConnections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Connection Errors:</span>
                    <span className={`font-medium ${poolStats.connectionErrors > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {poolStats.connectionErrors}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Query Performance Tab */}
        <TabsContent value="queries" className="space-y-4">
          {metrics && (
            <Card>
              <CardHeader>
                <CardTitle>Slow Queries</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.queryPerformance.slowQueries.length > 0 ? (
                  <div className="space-y-4">
                    {metrics.queryPerformance.slowQueries.map((query, index) => (
                      <div key={index} className="border rounded p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant={query.duration > 1000 ? 'destructive' : 'secondary'}>
                            {query.duration}ms
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(query.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(JSON.parse(query.query), null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No slow queries detected</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Index Usage Tab */}
        <TabsContent value="indexes" className="space-y-4">
          {metrics && (
            <Card>
              <CardHeader>
                <CardTitle>Index Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.indexUsage.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Collection</th>
                          <th className="text-left p-2">Index</th>
                          <th className="text-left p-2">Usage</th>
                          <th className="text-left p-2">Efficiency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.indexUsage.map((index, i) => (
                          <tr key={i} className="border-b">
                            <td className="p-2">{index.collection}</td>
                            <td className="p-2 font-mono text-xs">{index.index}</td>
                            <td className="p-2">{index.usage}</td>
                            <td className="p-2">
                              <Badge variant={index.efficiency > 1 ? 'default' : 'secondary'}>
                                {index.efficiency}/hr
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No index usage data available</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          {analysis && (
            <div className="space-y-4">
              {/* General Recommendations */}
              {analysis.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                      Performance Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Unused Indexes */}
              {analysis.unusedIndexes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <XCircle className="h-5 w-5 mr-2 text-red-600" />
                      Unused Indexes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert>
                      <AlertDescription>
                        The following indexes are not being used and could be removed to save storage space:
                      </AlertDescription>
                    </Alert>
                    <ul className="mt-4 space-y-1">
                      {analysis.unusedIndexes.map((index, i) => (
                        <li key={i} className="text-sm font-mono bg-gray-100 p-2 rounded">
                          {index}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Slow Query Recommendations */}
              {analysis.slowQueries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-orange-600" />
                      Slow Query Optimizations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysis.slowQueries.map((query, index) => (
                        <div key={index} className="border rounded p-4">
                          <div className="flex justify-between items-center mb-2">
                            <Badge variant={query.duration > 1000 ? 'destructive' : 'secondary'}>
                              {query.duration}ms
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{query.recommendation}</p>
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {query.query}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No Issues */}
              {analysis.recommendations.length === 0 && 
               analysis.unusedIndexes.length === 0 && 
               analysis.slowQueries.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-green-600 mb-2">
                      Database Performance is Optimal
                    </h3>
                    <p className="text-gray-600">
                      No performance issues or optimization opportunities detected.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}