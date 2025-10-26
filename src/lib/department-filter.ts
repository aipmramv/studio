import { JWTPayload } from '@/types/auth'
import { RBACService } from './rbac'

/**
 * Apply department-based filtering to MongoDB queries
 */
export class DepartmentFilterService {
  /**
   * Add department filter to MongoDB query based on user role
   */
  static applyDepartmentFilter(
    query: Record<string, any>,
    user: JWTPayload
  ): Record<string, any> {
    const departmentFilter = RBACService.getDepartmentFilter(user.role, user.department)
    
    if (departmentFilter) {
      return {
        ...query,
        ...departmentFilter
      }
    }
    
    return query
  }

  /**
   * Apply department filter to asset queries
   */
  static filterAssetQuery(
    query: Record<string, any>,
    user: JWTPayload
  ): Record<string, any> {
    return this.applyDepartmentFilter(query, user)
  }

  /**
   * Apply department filter to workflow queries
   */
  static filterWorkflowQuery(
    query: Record<string, any>,
    user: JWTPayload
  ): Record<string, any> {
    const baseQuery = this.applyDepartmentFilter(query, user)
    
    // For non-admin users, also filter by requester or department
    if (user.role !== 'admin') {
      return {
        ...baseQuery,
        $or: [
          { requesterId: user.id }, // Own requests
          { department: user.department } // Department requests
        ]
      }
    }
    
    return baseQuery
  }

  /**
   * Apply department filter to report queries
   */
  static filterReportQuery(
    query: Record<string, any>,
    user: JWTPayload
  ): Record<string, any> {
    return this.applyDepartmentFilter(query, user)
  }

  /**
   * Check if user can access specific asset
   */
  static canAccessAsset(
    asset: { department: string },
    user: JWTPayload
  ): boolean {
    return RBACService.canAccessDepartment(user.role, user.department, asset.department)
  }

  /**
   * Check if user can access specific workflow
   */
  static canAccessWorkflow(
    workflow: { department?: string; requesterId?: string },
    user: JWTPayload
  ): boolean {
    // Admins can access all workflows
    if (user.role === 'admin') {
      return true
    }
    
    // Users can access their own workflows
    if (workflow.requesterId === user.id) {
      return true
    }
    
    // Department-based access
    if (workflow.department && user.department) {
      return workflow.department === user.department
    }
    
    return false
  }

  /**
   * Get departments accessible by user
   */
  static getAccessibleDepartments(user: JWTPayload): string[] | null {
    // Admins can access all departments
    if (user.role === 'admin') {
      return null // null means all departments
    }
    
    // Other roles can only access their assigned department
    return user.department ? [user.department] : []
  }

  /**
   * Create aggregation pipeline with department filtering
   */
  static createDepartmentAggregation(
    pipeline: any[],
    user: JWTPayload
  ): any[] {
    const departmentFilter = RBACService.getDepartmentFilter(user.role, user.department)
    
    if (departmentFilter) {
      // Add match stage at the beginning of pipeline
      return [
        { $match: departmentFilter },
        ...pipeline
      ]
    }
    
    return pipeline
  }

  /**
   * Filter array of items based on department access
   */
  static filterItemsByDepartment<T extends { department: string }>(
    items: T[],
    user: JWTPayload
  ): T[] {
    // Admins see all items
    if (user.role === 'admin') {
      return items
    }
    
    // Filter by user's department
    if (user.department) {
      return items.filter(item => item.department === user.department)
    }
    
    return []
  }

  /**
   * Get department-specific statistics
   */
  static getDepartmentStats(
    allStats: Record<string, any>,
    user: JWTPayload
  ): Record<string, any> {
    // Admins see all stats
    if (user.role === 'admin') {
      return allStats
    }
    
    // Filter stats by department
    if (user.department && allStats[user.department]) {
      return {
        [user.department]: allStats[user.department]
      }
    }
    
    return {}
  }

  /**
   * Validate department access for API operations
   */
  static validateDepartmentAccess(
    targetDepartment: string,
    user: JWTPayload,
    operation: string
  ): { allowed: boolean; reason?: string } {
    // Admins can access all departments
    if (user.role === 'admin') {
      return { allowed: true }
    }
    
    // Check if user can access the target department
    if (!RBACService.canAccessDepartment(user.role, user.department, targetDepartment)) {
      return {
        allowed: false,
        reason: `Access denied to department ${targetDepartment} for operation: ${operation}`
      }
    }
    
    return { allowed: true }
  }

  /**
   * Get department filter for frontend queries
   */
  static getFrontendDepartmentFilter(user: JWTPayload): {
    showAllDepartments: boolean
    allowedDepartments: string[]
    currentDepartment?: string
  } {
    if (user.role === 'admin') {
      return {
        showAllDepartments: true,
        allowedDepartments: [],
        currentDepartment: undefined
      }
    }
    
    return {
      showAllDepartments: false,
      allowedDepartments: user.department ? [user.department] : [],
      currentDepartment: user.department
    }
  }
}