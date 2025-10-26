import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { dashboardAnalyticsEngine } from '@/lib/dashboard-analytics'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'
import { DashboardFilter } from '@/lib/dashboard-analytics'

// GET /api/dashboard/analytics - Get comprehensive dashboard analytics
async function getDashboardAnalytics(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filters from query parameters
    const filters: DashboardFilter = {
      dateRange: {
        start: searchParams.get('startDate') 
          ? new Date(searchParams.get('startDate')!) 
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: searchParams.get('endDate') 
          ? new Date(searchParams.get('endDate')!) 
          : new Date(),
        preset: searchParams.get('preset') as any || 'month'
      },
      departments: searchParams.get('departments')?.split(',').filter(Boolean),
      locations: searchParams.get('locations')?.split(',').filter(Boolean),
      assetCategories: searchParams.get('categories')?.split(',').filter(Boolean),
      statuses: searchParams.get('statuses')?.split(',').filter(Boolean),
      users: searchParams.get('users')?.split(',').filter(Boolean)
    }

    // Get requested data type
    const dataType = searchParams.get('type') || 'all'

    switch (dataType) {
      case 'kpis':
        const kpis = await dashboardAnalyticsEngine.getDashboardKPIs(filters, user)
        return createSuccessResponse({ kpis })

      case 'chart':
        const chartType = searchParams.get('chartType')
        if (!chartType) {
          return NextResponse.json(
            { error: 'Chart type is required' },
            { status: 400 }
          )
        }
        const chartData = await dashboardAnalyticsEngine.getChartData(chartType, filters, user)
        return createSuccessResponse({ chart: chartData })

      case 'analytics':
        const analyticsType = searchParams.get('analyticsType') || 'asset'
        let analytics
        
        switch (analyticsType) {
          case 'asset':
            analytics = await dashboardAnalyticsEngine.getAssetAnalytics(filters, user)
            break
          case 'financial':
            analytics = await dashboardAnalyticsEngine.getFinancialAnalytics(filters, user)
            break
          case 'operational':
            analytics = await dashboardAnalyticsEngine.getOperationalAnalytics(filters, user)
            break
          case 'user':
            analytics = await dashboardAnalyticsEngine.getUserActivityAnalytics(filters, user)
            break
          default:
            return NextResponse.json(
              { error: 'Invalid analytics type' },
              { status: 400 }
            )
        }
        
        return createSuccessResponse({ analytics })

      case 'all':
      default:
        // Get comprehensive dashboard data
        const [
          dashboardKPIs,
          assetAnalytics,
          financialAnalytics,
          operationalAnalytics,
          userAnalytics
        ] = await Promise.all([
          dashboardAnalyticsEngine.getDashboardKPIs(filters, user),
          dashboardAnalyticsEngine.getAssetAnalytics(filters, user),
          dashboardAnalyticsEngine.getFinancialAnalytics(filters, user),
          dashboardAnalyticsEngine.getOperationalAnalytics(filters, user),
          dashboardAnalyticsEngine.getUserActivityAnalytics(filters, user)
        ])

        // Get key charts
        const [
          assetsByStatusChart,
          assetsByDepartmentChart,
          assetValueTrendChart,
          verificationStatusChart,
          workflowPerformanceChart
        ] = await Promise.all([
          dashboardAnalyticsEngine.getChartData('assets_by_status', filters, user),
          dashboardAnalyticsEngine.getChartData('assets_by_department', filters, user),
          dashboardAnalyticsEngine.getChartData('asset_value_trend', filters, user),
          dashboardAnalyticsEngine.getChartData('verification_status', filters, user),
          dashboardAnalyticsEngine.getChartData('workflow_performance', filters, user)
        ])

        return createSuccessResponse({
          kpis: dashboardKPIs,
          analytics: {
            asset: assetAnalytics,
            financial: financialAnalytics,
            operational: operationalAnalytics,
            user: userAnalytics
          },
          charts: {
            assetsByStatus: assetsByStatusChart,
            assetsByDepartment: assetsByDepartmentChart,
            assetValueTrend: assetValueTrendChart,
            verificationStatus: verificationStatusChart,
            workflowPerformance: workflowPerformanceChart
          },
          filters,
          lastUpdated: new Date(),
          cacheInfo: {
            ttl: 300, // 5 minutes
            canRefresh: true
          }
        })
    }
  } catch (error) {
    console.error('Dashboard analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to get dashboard analytics' },
      { status: 500 }
    )
  }
}

// POST /api/dashboard/analytics/refresh - Refresh analytics cache
async function refreshAnalyticsCache(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json()
    const { pattern } = body

    // Clear cache for specific pattern or all
    dashboardAnalyticsEngine.clearCache(pattern)

    return createSuccessResponse({
      message: 'Analytics cache refreshed successfully',
      clearedPattern: pattern || 'all'
    })
  } catch (error) {
    console.error('Cache refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh cache' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getDashboardAnalytics)
export const POST = withApiMiddleware(refreshAnalyticsCache)