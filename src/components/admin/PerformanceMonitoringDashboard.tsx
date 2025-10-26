'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AlertTriangle, CheckCircle, Activity, Clock, Database, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { PerformanceReport, PerformanceAlert, PerformanceThresholds } from '@/lib/performance-monitor';

interface PerformanceMonitoringDashboardProps {
  className?: string;
}

export default function PerformanceMonitoringDashboard({ className }: PerformanceMonitoringDashboardProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceReport | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [thresholds, setThresholds] = useState<PerformanceThresholds | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformanceData();
    fetchAlerts();
    fetchThresholds();
    
    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchPerformanceData();
      fetchAlerts();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('/api/admin/performance');
      const result = await response.json();
      
      if (result.success) {
        setPerformanceData(result.data);
      } else {
        setError(result.error || 'Failed to fetch performance data');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/admin/performance/alerts');
      const result = await response.json();
      
      if (result.success) {
        setAlerts(result.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  const fetchThresholds = async () => {
    try {
      const response = await fetch('/api/admin/performance');
      const result = await response.json();
      
      if (result.success && result.data.thresholds) {
        setThresholds(result.data.thresholds);
      }
    } catch (err: any) {
      console.error('Failed to fetch thresholds:', err);
    }
  };

  const handleMonitoringControl = async (action: string, params?: any) => {
    try {
      const response = await fetch('/api/admin/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params })
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (action === 'start') setIsMonitoring(true);
        if (action === 'stop') setIsMonitoring(false);
        if (action === 'clear') {
          setPerformanceData(null);
          setAlerts([]);
        }
        fetchPerformanceData();
      } else {
        setError(result.error || 'Operation failed');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/admin/performance/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action: 'resolve' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        fetchAlerts();
      } else {
        setError(result.error || 'Failed to resolve alert');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getStatusColor = (value: number, warning: number, critical: number, inverse = false): string => {
    if (inverse) {
      if (value < critical) return 'text-red-600';
      if (value < warning) return 'text-yellow-600';
      return 'text-green-600';
    } else {
      if (value > critical) return 'text-red-600';
      if (value > warning) return 'text-yellow-600';
      return 'text-green-600';
    }
  };

  const getStatusIcon = (value: number, warning: number, critical: number, inverse = false) => {
    const isGood = inverse ? value >= warning : value <= warning;
    const isCritical = inverse ? value < critical : value > critical;
    
    if (isCritical) return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (!isGood) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading performance data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Performance Monitoring</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => handleMonitoringControl(isMonitoring ? 'stop' : 'start')}
            variant={isMonitoring ? 'destructive' : 'default'}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
          <Button
            onClick={() => handleMonitoringControl('clear')}
            variant="outline"
          >
            Clear Data
          </Button>
          <Button
            onClick={fetchPerformanceData}
            variant="outline"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Active Performance Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    alert.type === 'critical' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={alert.type === 'critical' ? 'destructive' : 'secondary'}>
                      {alert.type}
                    </Badge>
                    <span className="font-medium">{alert.message}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <Button
                    onClick={() => resolveAlert(alert.id)}
                    size="sm"
                    variant="outline"
                  >
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Summary */}
      {performanceData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                    <p className={`text-2xl font-bold ${thresholds ? getStatusColor(performanceData.summary.averageResponseTime, thresholds.responseTime.warning, thresholds.responseTime.critical) : ''}`}>
                      {formatDuration(performanceData.summary.averageResponseTime)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {thresholds && getStatusIcon(performanceData.summary.averageResponseTime, thresholds.responseTime.warning, thresholds.responseTime.critical)}
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold">{performanceData.summary.totalRequests.toLocaleString()}</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Error Rate</p>
                    <p className={`text-2xl font-bold ${thresholds ? getStatusColor(performanceData.summary.errorRate, thresholds.errorRate.warning, thresholds.errorRate.critical) : ''}`}>
                      {(performanceData.summary.errorRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {thresholds && getStatusIcon(performanceData.summary.errorRate, thresholds.errorRate.warning, thresholds.errorRate.critical)}
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                    <p className={`text-2xl font-bold ${thresholds ? getStatusColor(performanceData.summary.cacheHitRate, thresholds.cacheHitRate.warning, thresholds.cacheHitRate.critical, true) : ''}`}>
                      {(performanceData.summary.cacheHitRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {thresholds && getStatusIcon(performanceData.summary.cacheHitRate, thresholds.cacheHitRate.warning, thresholds.cacheHitRate.critical, true)}
                    <Database className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Charts */}
          <Tabs defaultValue="trends" className="w-full">
            <TabsList>
              <TabsTrigger value="trends">Performance Trends</TabsTrigger>
              <TabsTrigger value="metrics">Recent Metrics</TabsTrigger>
              <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
            </TabsList>

            <TabsContent value="trends" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Response Time Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={performanceData.trends.responseTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="timestamp" 
                          tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleString()}
                          formatter={(value: number) => [formatDuration(value), 'Response Time']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Throughput Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={performanceData.trends.throughput}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="timestamp" 
                          tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleString()}
                          formatter={(value: number) => [`${value} req/min`, 'Throughput']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ fill: '#10b981' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Error Rate Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={performanceData.trends.errorRate}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="timestamp" 
                          tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleString()}
                          formatter={(value: number) => [`${value}%`, 'Error Rate']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          dot={{ fill: '#ef4444' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Load</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                          {performanceData.summary.systemLoad}%
                        </div>
                        <p className="text-gray-600">Current System Load</p>
                        <div className="mt-4">
                          {performanceData.summary.systemLoad > 80 ? (
                            <Badge variant="destructive">High Load</Badge>
                          ) : performanceData.summary.systemLoad > 60 ? (
                            <Badge variant="secondary">Medium Load</Badge>
                          ) : (
                            <Badge variant="default">Normal Load</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {performanceData.metrics.slice(-20).reverse().map((metric, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{metric.category}</Badge>
                          <span className="font-medium">{metric.name}</span>
                          {metric.tags && (
                            <span className="text-sm text-gray-500">
                              {Object.entries(metric.tags).map(([key, value]) => `${key}:${value}`).join(', ')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">
                            {metric.value} {metric.unit}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(metric.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="thresholds" className="space-y-4">
              {thresholds && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Thresholds</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Response Time</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Warning:</span>
                              <span className="font-mono">{formatDuration(thresholds.responseTime.warning)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Critical:</span>
                              <span className="font-mono">{formatDuration(thresholds.responseTime.critical)}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Error Rate</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Warning:</span>
                              <span className="font-mono">{(thresholds.errorRate.warning * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Critical:</span>
                              <span className="font-mono">{(thresholds.errorRate.critical * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Cache Hit Rate</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Warning:</span>
                              <span className="font-mono">{(thresholds.cacheHitRate.warning * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Critical:</span>
                              <span className="font-mono">{(thresholds.cacheHitRate.critical * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Memory Usage</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Warning:</span>
                              <span className="font-mono">{(thresholds.memoryUsage.warning * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Critical:</span>
                              <span className="font-mono">{(thresholds.memoryUsage.critical * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}