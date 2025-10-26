import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor, PerformanceThresholds } from '@/lib/performance-monitor';
import { verifyAuth } from '@/lib/auth-middleware';

// GET /api/admin/performance - Get performance report
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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as any;
    const limit = parseInt(searchParams.get('limit') || '100');

    let data;
    if (category) {
      data = {
        metrics: performanceMonitor.getMetricsByCategory(category, limit),
        category
      };
    } else {
      data = performanceMonitor.getPerformanceReport();
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Failed to get performance data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve performance data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/performance - Control performance monitoring
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
    const { action, intervalMs, thresholds } = body;

    let result: any = { success: true };

    switch (action) {
      case 'start':
        performanceMonitor.startMonitoring(intervalMs || 30000);
        result.message = 'Performance monitoring started';
        break;

      case 'stop':
        performanceMonitor.stopMonitoring();
        result.message = 'Performance monitoring stopped';
        break;

      case 'clear':
        performanceMonitor.clearData();
        result.message = 'Performance data cleared';
        break;

      case 'updateThresholds':
        if (thresholds) {
          performanceMonitor.updateThresholds(thresholds);
          result.message = 'Performance thresholds updated';
          result.thresholds = performanceMonitor.getThresholds();
        } else {
          return NextResponse.json(
            { success: false, error: 'Thresholds data required' },
            { status: 400 }
          );
        }
        break;

      case 'export':
        result.data = performanceMonitor.exportData();
        result.message = 'Performance data exported';
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to control performance monitoring:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to control performance monitoring',
        details: error.message 
      },
      { status: 500 }
    );
  }
}