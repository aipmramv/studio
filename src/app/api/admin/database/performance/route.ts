import { NextRequest, NextResponse } from 'next/server';
import { databasePerformanceOptimizer, DatabasePerformanceMetrics } from '@/lib/database-performance';
import { verifyAuth } from '@/lib/auth-middleware';

// GET /api/admin/database/performance - Get current performance metrics
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const metrics = await databasePerformanceOptimizer.getPerformanceMetrics();

    return NextResponse.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Failed to get database performance metrics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve performance metrics',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/database/performance/analyze - Analyze performance and get recommendations
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

    const analysis = await databasePerformanceOptimizer.analyzeIndexPerformance();

    return NextResponse.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Failed to analyze database performance:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to analyze performance',
        details: error.message 
      },
      { status: 500 }
    );
  }
}