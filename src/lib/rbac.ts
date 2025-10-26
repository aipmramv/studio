import { NextRequest } from 'next/server'
import { JWTPayload } from '@/types/auth'

// Role definitions and permissions
export type UserRole = 'admin' | 'spoc' | 'user'

export interface Permission {
  resource: string
  actions: string[]
}

export interface RolePermissions {
  admin: Permission[]
  spoc: Permission[]
  user: Permission[]
}

// Define role-based permissions
export const ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    { resource: 'assets', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'workflows', actions: ['create', 'read', 'update', 'delete', 'approve'] },
    { resource: 'reports', actions: ['read', 'export'] },
    { resource: 'masters', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'departments', actions: ['read'] }, // Can access all departments
  ],
  spoc: [
    { resource: 'assets', actions: ['read', 'update'] }, // Only department assets
    { resource: 'workflows', actions: ['create', 'read', 'approve'] }, // Department workflows
    { resource: 'reports', actions: ['read'] }, // Department reports
    { resource: 'departments', actions: ['read'] }, // Only assigned department
  ],
  user: [
    { resource: 'assets', actions: ['read'] }, // Only department assets
    { resource: 'workflows', actions: ['read'] }, // Own workflows
    { resource: 'reports', actions: ['read'] }, // Department reports
    { resource: 'departments', actions: ['read'] }, // Only assigned department
  ],
}

// Permission checking utilities
export class RBACService {
  /**
   * Check if a user has permission to perform an action on a resource
   */
  static hasPermission(
    userRole: UserRole,
    resource: string,
    action: string
  ): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole]
    const resourcePermission = rolePermissions.find(p => p.resource === resource)
    
    if (!resourcePermission) {
      return false
    }
    
    return resourcePermission.actions.includes(action)
  }

  /**
   * Check if user can access data from a specific department
   */
  static canAccessDepartment(
    userRole: UserRole,
    userDepartment: string | undefined,
    targetDepartment: string
  ): boolean {
    // Admins can access all departments
    if (userRole === 'admin') {
      return true
    }
    
    // SPOCs and Users can only access their assigned department
    return userDepartment === targetDepartment
  }

  /**
   * Get department filter for database queries based on user role
   */
  static getDepartmentFilter(
    userRole: UserRole,
    userDepartment: string | undefined
  ): Record<string, any> | null {
    // Admins see all data
    if (userRole === 'admin') {
      return null
    }
    
    // SPOCs and Users see only their department data
    if (userDepartment) {
      return { department: userDepartment }
    }
    
    // If no department assigned, return empty filter (no access)
    return { department: null }
  }

  /**
   * Validate API access based on user permissions
   */
  static validateApiAccess(
    user: JWTPayload,
    resource: string,
    action: string,
    targetDepartment?: string
  ): { allowed: boolean; reason?: string } {
    // Check basic permission
    if (!this.hasPermission(user.role, resource, action)) {
      return {
        allowed: false,
        reason: `Insufficient permissions for ${action} on ${resource}`
      }
    }

    // Check department access if specified
    if (targetDepartment && !this.canAccessDepartment(user.role, user.department, targetDepartment)) {
      return {
        allowed: false,
        reason: `Access denied to department: ${targetDepartment}`
      }
    }

    return { allowed: true }
  }

  /**
   * Get user permissions for UI rendering
   */
  static getUserPermissions(userRole: UserRole): Record<string, string[]> {
    const permissions: Record<string, string[]> = {}
    const rolePermissions = ROLE_PERMISSIONS[userRole]
    
    rolePermissions.forEach(permission => {
      permissions[permission.resource] = permission.actions
    })
    
    return permissions
  }
}

// Middleware helper functions
export interface AuthContext {
  user: JWTPayload
  hasPermission: (resource: string, action: string) => boolean
  canAccessDepartment: (department: string) => boolean
  getDepartmentFilter: () => Record<string, any> | null
}

/**
 * Create auth context from JWT payload
 */
export function createAuthContext(user: JWTPayload): AuthContext {
  return {
    user,
    hasPermission: (resource: string, action: string) => 
      RBACService.hasPermission(user.role, resource, action),
    canAccessDepartment: (department: string) => 
      RBACService.canAccessDepartment(user.role, user.department, department),
    getDepartmentFilter: () => 
      RBACService.getDepartmentFilter(user.role, user.department)
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
export function validateRouteAccess(
  user: JWTPayload,
  options: ProtectedRouteOptions
): { allowed: boolean; reason?: string } {
  const validation = RBACService.validateApiAccess(
    user,
    options.resource,
    options.action
  )

  if (!validation.allowed) {
    return validation
  }

  // Check if department is required but not assigned
  if (options.requireDepartment && user.role !== 'admin' && !user.department) {
    return {
      allowed: false,
      reason: 'Department assignment required for this operation'
    }
  }

  return { allowed: true }
}