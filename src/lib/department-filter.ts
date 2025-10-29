
import { JWTPayload } from '@/types/auth'
import { RBACService } from './rbac'

/**
 * Apply department-based filtering to SQL queries
 */
export class DepartmentFilterService {
  /**
   * Add department filter to SQL query based on user role
   */
  static applyDepartmentFilter(
    whereClauses: string[],
    params: any[],
    user: JWTPayload
  ): { whereClauses: string[], params: any[] } {
    const departmentFilter = RBACService.getDepartmentFilter(user.role, user.department_id)
    
    if (departmentFilter) {
        whereClauses.push(departmentFilter);
    }
    
    return { whereClauses, params };
  }

  /**
   * Apply department filter to asset queries
   */
  static filterAssetQuery(
    whereClauses: string[],
    params: any[],
    user: JWTPayload
  ): { whereClauses: string[], params: any[] } {
    return this.applyDepartmentFilter(whereClauses, params, user)
  }

  /**
   * Check if user can access specific asset
   */
  static async canAccessAsset(
    asset: { department_id: number },
    user: JWTPayload
  ): Promise<boolean> {
    return RBACService.canAccessDepartment(user.role, user.department_id, asset.department_id)
  }

  /**
   * Get department filter for frontend queries
   */
  static getFrontendDepartmentFilter(user: JWTPayload): {
    showAllDepartments: boolean
    allowedDepartments: number[]
    currentDepartment?: number
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
      allowedDepartments: user.department_id ? [user.department_id] : [],
      currentDepartment: user.department_id
    }
  }
}