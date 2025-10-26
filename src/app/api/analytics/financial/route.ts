import { NextRequest, NextResponse } from 'next/server'
import { withReportAccess } from '@/lib/auth-middleware'
import { analyticsService } from '@/lib/analytics-service'
import { createSuccessResponse, parseFilterParams } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

async function getFinancialAnalyticsHandler(request: NextRequest, user: JWTPayload) {
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
    
    // Date range filter
    if (filters.startDate && filters.endDate) {
      analyticsFilters.dateRange = {
        start: new Date(filters.startDate),
        end: new Date(filters.endDate)
      }
    }

    const analytics = await analyticsService.getFinancialAnalytics(analyticsFilters)
    
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
    console.error('Financial analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to generate financial analytics' },
      { status: 500 }
    )
  }
}

export const GET = withReportAccess(getFinancialAnalyticsHandler, 'read')