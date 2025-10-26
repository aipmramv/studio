import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/performance-monitor';
import { verifyAuth } from '@/lib/auth-middleware';

// GET /api/admin/performance/alerts - Get active performance alerts
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

    const alerts = performanceMonitor.getActiveAlerts();

    return NextResponse.json({
      success: true,
      data: alerts,
      count: alerts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Failed to get performance alerts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve performance alerts',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/performance/alerts - Resolve performance alert
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
    const { alertId, action } = body;

    if (!alertId) {
      return NextResponse.json(
        { success: false, error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    let result: any = { success: true };

    switch (action) {
      case 'resolve':
        const resolved = performanceMonitor.resolveAlert(alertId);
        if (resolved) {
          result.message = 'Alert resolved successfully';
        } else {
          return NextResponse.json(
            { success: false, error: 'Alert not found' },
            { status: 404 }
          );
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to manage performance alert:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to manage performance alert',
        details: error.message 
      },
      { status: 500 }
    );
  }
}