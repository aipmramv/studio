
import { NextRequest } from 'next/server'
import { JWTPayload } from '@/types/auth'
import { query } from './db'

// Role definitions and permissions
export type UserRole = 'admin' | 'spoc' | 'user'

// Permission checking utilities
export class RBACService {
  /**
   * Check if a user has permission to perform an action on a resource
   */
  static async hasPermission(
    userRoleId: number,
    resource: string,
    action: string
  ): Promise<boolean> {
    const sql = `
      SELECT COUNT(*)
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id =  AND p.name = $2;
    `;
    // This is a simplified check. A real implementation would check for action as well.
    // For example, p.name could be 'assets:read', 'assets:write', etc.
    const { rows } = await query(sql, [userRoleId, `${resource}:${action}`]);
    return parseInt(rows[0].count, 10) > 0;
  }

  /**
   * Check if user can access data from a specific department
   */
  static canAccessDepartment(
    userRole: UserRole,
    userDepartmentId: number | undefined,
    targetDepartmentId: number
  ): boolean {
    // Admins can access all departments
    if (userRole === 'admin') {
      return true
    }
    
    // SPOCs and Users can only access their assigned department
    return userDepartmentId === targetDepartmentId
  }

  /**
   * Get department filter for database queries based on user role
   */
  static getDepartmentFilter(
    userRole: UserRole,
    userDepartmentId: number | undefined
  ): string | null {
    // Admins see all data
    if (userRole === 'admin') {
      return null
    }
    
    // SPOCs and Users see only their department data
    if (userDepartmentId) {
      return `department_id = ${userDepartmentId}`
    }
    
    // If no department assigned, return a condition that will not match any row
    return 'department_id IS NULL'
  }

  /**
   * Validate API access based on user permissions
   */
  static async validateApiAccess(
    user: JWTPayload,
    resource: string,
    action: string,
    targetDepartmentId?: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Check basic permission
    if (!user.role_id || !await this.hasPermission(user.role_id, resource, action)) {
      return {
        allowed: false,
        reason: `Insufficient permissions for ${action} on ${resource}`
      }
    }

    // Check department access if specified
    if (targetDepartmentId && !this.canAccessDepartment(user.role, user.department_id, targetDepartmentId)) {
      return {
        allowed: false,
        reason: `Access denied to department: ${targetDepartmentId}`
      }
    }

    return { allowed: true }
  }

  /**
   * Get user permissions for UI rendering
   */
  static async getUserPermissions(userRoleId: number): Promise<string[]> {
    const sql = `
        SELECT p.name
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ;
    `;
    const { rows } = await query(sql, [userRoleId]);
    return rows.map(row => row.name);
  }
}

// Middleware helper functions
export interface AuthContext {
  user: JWTPayload
  hasPermission: (resource: string, action: string) => Promise<boolean>
  canAccessDepartment: (departmentId: number) => boolean
  getDepartmentFilter: () => string | null
}

/**
 * Create auth context from JWT payload
 */
export function createAuthContext(user: JWTPayload): AuthContext {
  return {
    user,
    hasPermission: (resource: string, action: string) => 
      RBACService.hasPermission(user.role_id, resource, action),
    canAccessDepartment: (departmentId: number) => 
      RBACService.canAccessDepartment(user.role, user.department_id, departmentId),
    getDepartmentFilter: () => 
      RBACService.getDepartmentFilter(user.role, user.department_id)
  }
}

// Route protection decorators
export interface ProtectedRouteOptions {
  resource: string
  action: string
  requireDepartment?: boolean
}

/**
 * Validate route access
 */
export async function validateRouteAccess(
  user: JWTPayload,
  options: ProtectedRouteOptions
): Promise<{ allowed: boolean; reason?: string }> {
  const validation = await RBACService.validateApiAccess(
    user,
    options.resource,
    options.action
  )

  if (!validation.allowed) {
    return validation
  }

  // Check if department is required but not assigned
  if (options.requireDepartment && user.role !== 'admin' && !user.department_id) {
    return {
      allowed: false,
      reason: 'Department assignment required for this operation'
    }
  }

  return { allowed: true }
}