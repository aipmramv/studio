import { NextRequest, NextResponse } from 'next/server';
import { connectionPoolMonitor } from '@/lib/connection-pool-monitor';
import { verifyAuth } from '@/lib/auth-middleware';

// GET /api/admin/database/pool - Get connection pool statistics
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
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = connectionPoolMonitor.getStats();
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        });

      case 'alerts':
        const limit = parseInt(searchParams.get('limit') || '10');
        const alerts = connectionPoolMonitor.getAlerts(limit);
        return NextResponse.json({
          success: true,
          data: alerts,
          timestamp: new Date().toISOString()
        });

      case 'history':
        const minutes = parseInt(searchParams.get('minutes') || '60');
        const history = connectionPoolMonitor.getConnectionHistory(minutes);
        return NextResponse.json({
          success: true,
          data: history,
          timestamp: new Date().toISOString()
        });

      case 'report':
        const report = connectionPoolMonitor.generateReport();
        return NextResponse.json({
          success: true,
          data: report,
          timestamp: new Date().toISOString()
        });

      default:
        // Default: return comprehensive data
        const comprehensiveData = {
          stats: connectionPoolMonitor.getStats(),
          alerts: connectionPoolMonitor.getAlerts(5),
          recommendations: connectionPoolMonitor.getOptimizationRecommendations()
        };

        return NextResponse.json({
          success: true,
          data: comprehensiveData,
          timestamp: new Date().toISOString()
        });
    }
  } catch (error: any) {
    console.error('Failed to get connection pool data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve connection pool data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/database/pool - Control connection pool monitoring
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
    const { action, intervalMs } = body;

    switch (action) {
      case 'start':
        connectionPoolMonitor.startMonitoring(intervalMs || 30000);
        return NextResponse.json({
          success: true,
          message: 'Connection pool monitoring started',
          intervalMs: intervalMs || 30000
        });

      case 'stop':
        connectionPoolMonitor.stopMonitoring();
        return NextResponse.json({
          success: true,
          message: 'Connection pool monitoring stopped'
        });

      case 'reset':
        connectionPoolMonitor.resetStats();
        return NextResponse.json({
          success: true,
          message: 'Connection pool statistics reset'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, stop, or reset' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Failed to control connection pool monitoring:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to control connection pool monitoring',
        details: error.message 
      },
      { status: 500 }
    );
  }
}