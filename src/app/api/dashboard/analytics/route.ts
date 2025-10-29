import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return mock dashboard data for now
    const mockData = {
      success: true,
      data: {
        kpis: {
          totalAssets: 1250,
          assetsChange: 5.2,
          activeWorkflows: 23,
          workflowsChange: -2.1,
          pendingApprovals: 8,
          approvalsChange: 1.5,
          verificationRate: 87.5,
          verificationChange: 3.2,
          totalValue: 15750000,
          valueChange: 8.7,
          overdueItems: 3,
          overdueChange: -1.0
        },
        trends: {
          assets: [100, 120, 140, 135, 150, 145, 160],
          workflows: [20, 25, 22, 28, 24, 26, 23],
          approvals: [15, 12, 8, 10, 6, 9, 8],
          verification: [80, 82, 85, 84, 86, 87, 87.5],
          value: [14000000, 14500000, 15000000, 14800000, 15200000, 15500000, 15750000],
          overdue: [8, 6, 4, 5, 3, 4, 3]
        },
        charts: [],
        recentActivity: [
          {
            id: '1',
            type: 'asset_created',
            title: 'New Asset Added',
            description: 'Laptop Dell Inspiron 15 added to IT department',
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
            user: 'John Doe'
          },
          {
            id: '2',
            type: 'workflow_completed',
            title: 'Asset Transfer Approved',
            description: 'Transfer of projector from IT to Marketing approved',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
            user: 'Jane Smith'
          },
          {
            id: '3',
            type: 'verification_completed',
            title: 'Asset Verification Complete',
            description: '25 assets verified in Finance department',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
            user: 'Mike Johnson'
          }
        ],
        alerts: [
          {
            id: '1',
            type: 'warning',
            title: 'Pending Calibration',
            description: '5 test equipment items require calibration within 7 days',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
            actionRequired: true,
            actionUrl: '/asset-management/calibration'
          },
          {
            id: '2',
            type: 'info',
            title: 'Monthly Report Ready',
            description: 'Asset utilization report for October is ready for review',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
            actionRequired: false
          }
        ]
      }
    };

    return NextResponse.json(mockData);
  } catch (error: any) {
    console.error('Dashboard analytics error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load dashboard analytics'
    }, { status: 500 });
  }
}