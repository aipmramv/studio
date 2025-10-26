import { NextRequest, NextResponse } from 'next/server'
import { withReportAccess } from '@/lib/auth-middleware'
import { analyticsService } from '@/lib/analytics-service'
import { createSuccessResponse, parseFilterParams } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

async function getUtilizationAnalyticsHandler(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = parseFilterParams(searchParams)
    
    // Apply department filtering based on user role
    const analyticsFilters: any = {}
    
    if (user.role === 'admin' && filters.department) {
      analyticsFilters.department = filters.department
    } else if (user.role !== 'admin' && user.department) {
      analyticsFilters.department = user.department
    }

    const analytics = await analyticsService.getUtilizationAnalytics(analyticsFilters)
    
    return createSuccessResponse({
      analytics,
      filters: analyticsFilters,
      userPermissions: {
        canViewAllDepartments: user.role === 'admin',
        currentDepartment: user.department,
        canExport: true
      }
    })
  } catch (error) {
    console.error('Utilization analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to generate utilization analytics' },
      { status: 500 }
    )
  }
}

export const GET = withReportAccess(getUtilizationAnalyticsHandler, 'read')