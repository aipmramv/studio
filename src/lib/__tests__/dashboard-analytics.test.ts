import { DashboardAnalyticsEngine } from '../dashboard-analytics'
import { JWTPayload } from '@/types/auth'

// Mock dependencies
jest.mock('../mongodb-service', () => ({
  MongoDBConnection: {
    getInstance: jest.fn().mockReturnValue({
      connect: jest.fn().mockResolvedValue({
        collection: jest.fn().mockReturnValue({
          aggregate: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([])
          }),
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([]),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis()
          }),
          insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
          findOne: jest.fn().mockResolvedValue(null),
          countDocuments: jest.fn().mockResolvedValue(0)
        })
      })
    })
  },
  BaseMongoService: class MockBaseMongoService {
    protected db = {
      collection: jest.fn().mockReturnValue({
        aggregate: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([])
        }),
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis()
        }),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
        findOne: jest.fn().mockResolvedValue(null),
        countDocuments: jest.fn().mockResolvedValue(0)
      })
    }
    protected ensureConnection = jest.fn().mockResolvedValue(undefined)
    protected handleError = jest.fn().mockImplementation((operation, error) => {
      throw error
    })
  }
}))

jest.mock('../department-filter', () => ({
  DepartmentFilterService: {
    filterAssetQuery: jest.fn().mockImplementation((query, user) => query)
  }
}))

describe('DashboardAnalyticsEngine', () => {
  let dashboardAnalytics: DashboardAnalyticsEngine

  const mockUser: JWTPayload = {
    id: 'user-id',
    email: 'user@test.com',
    role: 'user',
    department: 'Finance'
  }

  const mockAdminUser: JWTPayload = {
    id: 'admin-id',
    email: 'admin@test.com',
    role: 'admin',
    department: 'IT'
  }

  const mockFilters = {
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-12-31'),
      preset: 'year' as const
    },
    departments: ['Finance', 'IT'],
    locations: ['Office A', 'Office B'],
    assetCategories: ['Hardware', 'Software'],
    statuses: ['Active', 'Inactive']
  }

  beforeEach(() => {
    dashboardAnalytics = new DashboardAnalyticsEngine()
    jest.clearAllMocks()
  })

  describe('getDashboardKPIs', () => {
    beforeEach(() => {
      // Mock the analytics methods
      jest.spyOn(dashboardAnalytics, 'getAssetAnalytics').mockResolvedValue({
        totalAssets: 100,
        assetsByStatus: { Active: 80, Inactive: 20 },
        assetsByDepartment: { Finance: 60, IT: 40 },
        assetsByCategory: { Hardware: 70, Software: 30 },
        assetsByLocation: { 'Office A': 60, 'Office B': 40 },
        totalValue: 1000000,
        averageValue: 10000,
        recentlyAdded: 5,
        pendingVerification: 10,
        overdueVerification: 3,
        maintenanceDue: 2,
        warrantyExpiring: 4
      })

      jest.spyOn(dashboardAnalytics, 'getFinancialAnalytics').mockResolvedValue({
        totalAssetValue: 1000000,
        depreciatedValue: 800000,
        depreciationRate: 20,
        valueByDepartment: { Finance: 600000, IT: 400000 },
        valueByCategory: { Hardware: 700000, Software: 300000 },
        monthlyDepreciation: [],
        topValueAssets: []
      })

      jest.spyOn(dashboardAnalytics, 'getOperationalAnalytics').mockResolvedValue({
        totalTransfers: 50,
        transfersByMonth: [],
        transfersByDepartment: { Finance: 30, IT: 20 },
        averageTransferTime: 5.2,
        pendingTransfers: 8,
        completedVerifications: 42,
        verificationRate: 84,
        workflowMetrics: {
          activeWorkflows: 12,
          completedWorkflows: 45,
          averageCompletionTime: 3.5,
          escalationRate: 8.2
        }
      })

      jest.spyOn(dashboardAnalytics, 'getUserActivityAnalytics').mockResolvedValue({
        activeUsers: 25,
        usersByRole: { admin: 3, spoc: 8, user: 14 },
        usersByDepartment: { Finance: 12, IT: 8, HR: 5 },
        recentLogins: 18,
        topActiveUsers: [],
        activityTrends: []
      })
    })

    test('should get dashboard KPIs successfully', async () => {
      const kpis = await dashboardAnalytics.getDashboardKPIs(mockFilters, mockUser)

      expect(kpis).toHaveLength(9)
      expect(kpis.find(k => k.id === 'total_assets')).toEqual({
        id: 'total_assets',
        name: 'Total Assets',
        value: 100,
        format: 'number',
        icon: 'assets',
        color: 'blue',
        description: 'Total number of assets in the system'
      })
      expect(kpis.find(k => k.id === 'total_value')).toEqual({
        id: 'total_value',
        name: 'Total Asset Value',
        value: 1000000,
        format: 'currency',
        icon: 'currency',
        color: 'green',
        description: 'Total value of all assets'
      })
    })

    test('should use cache for repeated requests', async () => {
      // First call
      await dashboardAnalytics.getDashboardKPIs(mockFilters, mockUser)
      
      // Second call should use cache
      await dashboardAnalytics.getDashboardKPIs(mockFilters, mockUser)

      // Analytics methods should only be called once due to caching
      expect(dashboardAnalytics.getAssetAnalytics).toHaveBeenCalledTimes(1)
    })

    test('should handle different users with different cache keys', async () => {
      await dashboardAnalytics.getDashboardKPIs(mockFilters, mockUser)
      await dashboardAnalytics.getDashboardKPIs(mockFilters, mockAdminUser)

      // Should be called twice for different users
      expect(dashboardAnalytics.getAssetAnalytics).toHaveBeenCalledTimes(2)
    })
  })

  describe('getChartData', () => {
    beforeEach(() => {
      jest.spyOn(dashboardAnalytics, 'getAssetAnalytics').mockResolvedValue({
        totalAssets: 100,
        assetsByStatus: { Active: 80, Inactive: 20 },
        assetsByDepartment: { Finance: 60, IT: 40 },
        assetsByCategory: { Hardware: 70, Software: 30 },
        assetsByLocation: { 'Office A': 60, 'Office B': 40 },
        totalValue: 1000000,
        averageValue: 10000,
        recentlyAdded: 5,
        pendingVerification: 10,
        overdueVerification: 3,
        maintenanceDue: 2,
        warrantyExpiring: 4
      })
    })

    test('should get assets by status chart', async () => {
      const chartData = await dashboardAnalytics.getChartData('assets_by_status', mockFilters, mockUser)

      expect(chartData).toEqual({
        id: 'assets_by_status',
        title: 'Assets by Status',
        type: 'doughnut',
        data: {
          labels: ['Active', 'Inactive'],
          datasets: [{
            label: 'Assets',
            data: [80, 20],
            backgroundColor: [
              '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
            ]
          }]
        },
        lastUpdated: expect.any(Date),
        cacheKey: 'assets_by_status'
      })
    })

    test('should get assets by department chart', async () => {
      const chartData = await dashboardAnalytics.getChartData('assets_by_department', mockFilters, mockUser)

      expect(chartData).toEqual({
        id: 'assets_by_department',
        title: 'Assets by Department',
        type: 'bar',
        data: {
          labels: ['Finance', 'IT'],
          datasets: [{
            label: 'Number of Assets',
            data: [60, 40],
            backgroundColor: '#3B82F6'
          }]
        },
        lastUpdated: expect.any(Date),
        cacheKey: 'assets_by_department'
      })
    })

    test('should throw error for unknown chart type', async () => {
      await expect(dashboardAnalytics.getChartData('unknown_chart', mockFilters, mockUser))
        .rejects.toThrow('Unknown chart type: unknown_chart')
    })

    test('should use cache for chart data', async () => {
      // First call
      await dashboardAnalytics.getChartData('assets_by_status', mockFilters, mockUser)
      
      // Second call should use cache
      await dashboardAnalytics.getChartData('assets_by_status', mockFilters, mockUser)

      expect(dashboardAnalytics.getAssetAnalytics).toHaveBeenCalledTimes(1)
    })
  })

  describe('getAssetAnalytics', () => {
    beforeEach(() => {
      const mockAggregationResult = [{
        totalAssets: 100,
        totalValue: 1000000,
        assetsByStatus: [
          { k: 'Active', v: 1 },
          { k: 'Active', v: 1 },
          { k: 'Inactive', v: 1 }
        ],
        assetsByDepartment: [
          { k: 'Finance', v: 1 },
          { k: 'IT', v: 1 }
        ],
        assetsByCategory: [
          { k: 'Hardware', v: 1 },
          { k: 'Software', v: 1 }
        ],
        assetsByLocation: [
          { k: 'Office A', v: 1 },
          { k: 'Office B', v: 1 }
        ],
        recentlyAdded: 5,
        pendingVerification: 10,
        overdueVerification: 3,
        maintenanceDue: 2,
        warrantyExpiring: 4
      }]

      const mockDb = dashboardAnalytics['db']
      mockDb.collection().aggregate().toArray.mockResolvedValue(mockAggregationResult)
    })

    test('should get asset analytics successfully', async () => {
      const analytics = await dashboardAnalytics.getAssetAnalytics(mockFilters, mockUser)

      expect(analytics).toEqual({
        totalAssets: 100,
        assetsByStatus: { Active: 2, Inactive: 1 },
        assetsByDepartment: { Finance: 1, IT: 1 },
        assetsByCategory: { Hardware: 1, Software: 1 },
        assetsByLocation: { 'Office A': 1, 'Office B': 1 },
        totalValue: 1000000,
        averageValue: 10000,
        recentlyAdded: 5,
        pendingVerification: 10,
        overdueVerification: 3,
        maintenanceDue: 2,
        warrantyExpiring: 4
      })
    })

    test('should handle empty results', async () => {
      const mockDb = dashboardAnalytics['db']
      mockDb.collection().aggregate().toArray.mockResolvedValue([])

      const analytics = await dashboardAnalytics.getAssetAnalytics(mockFilters, mockUser)

      expect(analytics).toEqual({
        totalAssets: 0,
        assetsByStatus: {},
        assetsByDepartment: {},
        assetsByCategory: {},
        assetsByLocation: {},
        totalValue: 0,
        averageValue: 0,
        recentlyAdded: 0,
        pendingVerification: 0,
        overdueVerification: 0,
        maintenanceDue: 0,
        warrantyExpiring: 0
      })
    })

    test('should apply department filtering for non-admin users', async () => {
      await dashboardAnalytics.getAssetAnalytics(mockFilters, mockUser)

      const { DepartmentFilterService } = require('../department-filter')
      expect(DepartmentFilterService.filterAssetQuery).toHaveBeenCalledWith(
        expect.any(Object),
        mockUser
      )
    })
  })

  describe('saveDashboardConfig', () => {
    test('should save dashboard configuration successfully', async () => {
      const configData = {
        userId: 'user-id',
        name: 'My Dashboard',
        layout: [
          {
            id: 'widget-1',
            type: 'kpi' as const,
            position: { x: 0, y: 0, width: 4, height: 2 },
            config: { kpiId: 'total_assets' }
          }
        ],
        filters: mockFilters,
        refreshInterval: 300,
        isDefault: false,
        isShared: false,
        sharedWith: []
      }

      const config = await dashboardAnalytics.saveDashboardConfig(configData)

      expect(config).toEqual({
        id: 'mock-id',
        ...configData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      })
    })
  })

  describe('getUserDashboardConfigs', () => {
    test('should get user dashboard configurations', async () => {
      const mockConfigs = [
        {
          _id: { toString: () => 'config-1' },
          userId: 'user-id',
          name: 'Default Dashboard',
          layout: [],
          filters: mockFilters,
          refreshInterval: 300,
          isDefault: true,
          isShared: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      const mockDb = dashboardAnalytics['db']
      mockDb.collection().find().sort().toArray.mockResolvedValue(mockConfigs)

      const configs = await dashboardAnalytics.getUserDashboardConfigs('user-id')

      expect(configs).toHaveLength(1)
      expect(configs[0]).toEqual({
        id: 'config-1',
        userId: 'user-id',
        name: 'Default Dashboard',
        layout: [],
        filters: mockFilters,
        refreshInterval: 300,
        isDefault: true,
        isShared: false,
        sharedWith: undefined,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      })
    })
  })

  describe('Cache Management', () => {
    test('should clear cache by pattern', () => {
      // Set some cache entries
      dashboardAnalytics['setCache']('kpis_test_user1', { data: 'test1' }, 300000)
      dashboardAnalytics['setCache']('chart_test_user1', { data: 'test2' }, 300000)
      dashboardAnalytics['setCache']('other_data', { data: 'test3' }, 300000)

      // Clear cache with pattern
      dashboardAnalytics.clearCache('test')

      // Check that pattern-matching entries are cleared
      expect(dashboardAnalytics['getFromCache']('kpis_test_user1')).toBeNull()
      expect(dashboardAnalytics['getFromCache']('chart_test_user1')).toBeNull()
      expect(dashboardAnalytics['getFromCache']('other_data')).toEqual({ data: 'test3' })
    })

    test('should clear all cache when no pattern provided', () => {
      // Set some cache entries
      dashboardAnalytics['setCache']('key1', { data: 'test1' }, 300000)
      dashboardAnalytics['setCache']('key2', { data: 'test2' }, 300000)

      // Clear all cache
      dashboardAnalytics.clearCache()

      // Check that all entries are cleared
      expect(dashboardAnalytics['getFromCache']('key1')).toBeNull()
      expect(dashboardAnalytics['getFromCache']('key2')).toBeNull()
    })

    test('should expire cache after TTL', () => {
      const shortTTL = 100 // 100ms
      dashboardAnalytics['setCache']('test_key', { data: 'test' }, shortTTL)

      // Should be available immediately
      expect(dashboardAnalytics['getFromCache']('test_key')).toEqual({ data: 'test' })

      // Wait for expiration and check again
      setTimeout(() => {
        expect(dashboardAnalytics['getFromCache']('test_key')).toBeNull()
      }, shortTTL + 50)
    })
  })

  describe('Filter Building', () => {
    test('should build base query with all filters', () => {
      const query = dashboardAnalytics['buildBaseQuery'](mockFilters, mockUser)

      expect(query).toEqual({
        createdAt: {
          $gte: mockFilters.dateRange.start,
          $lte: mockFilters.dateRange.end
        },
        department: { $in: mockFilters.departments },
        location: { $in: mockFilters.locations },
        assetClassification: { $in: mockFilters.assetCategories },
        currentStatus: { $in: mockFilters.statuses }
      })
    })

    test('should build query with minimal filters', () => {
      const minimalFilters = {
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        }
      }

      const query = dashboardAnalytics['buildBaseQuery'](minimalFilters, mockUser)

      expect(query).toEqual({
        createdAt: {
          $gte: minimalFilters.dateRange.start,
          $lte: minimalFilters.dateRange.end
        }
      })
    })
  })
})