import { NextRequest, NextResponse } from 'next/server';
import { databasePerformanceOptimizer } from '@/lib/database-performance';
import { verifyAuth } from '@/lib/auth-middleware';

// POST /api/admin/database/optimize - Run database optimization
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { force = false } = body;

    // Get current metrics first
    const metrics = await databasePerformanceOptimizer.getPerformanceMetrics();
    
    // Check if optimization is needed (unless forced)
    if (!force) {
      const needsOptimization = 
        metrics.queryPerformance.averageQueryTime > 200 ||
        metrics.cacheHitRatio < 80 ||
        (metrics.connectionPool.checkedOutConnections / metrics.connectionPool.maxPoolSize) > 0.8;

      if (!needsOptimization) {
        return NextResponse.json({
          success: true,
          message: 'Database performance is optimal, no optimization needed',
          metrics,
          optimizationsApplied: [],
          errors: []
        });
      }
    }

    // Run optimization
    const result = await databasePerformanceOptimizer.optimizeDatabase();

    return NextResponse.json({
      success: true,
      message: 'Database optimization completed',
      optimizationsApplied: result.optimizationsApplied,
      errors: result.errors,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Failed to optimize database:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to optimize database',
        details: error.message 
      },
      { status: 500 }
    );
  }
}