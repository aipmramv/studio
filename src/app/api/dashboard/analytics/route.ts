
import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/server-only-services';
import { createSuccessResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const stats = await getDashboardStats();

    return createSuccessResponse(stats);
  } catch (error: any) {
    console.error('Dashboard analytics error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load dashboard analytics'
    }, { status: 500 });
  }
}