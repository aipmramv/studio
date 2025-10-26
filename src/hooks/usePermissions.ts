'use client'

import React, { useContext, createContext, ReactNode } from 'react'
import { JWTPayload } from '@/types/auth'
import { RBACService, createAuthContext, AuthContext } from '@/lib/rbac'

// Create auth context
const AuthPermissionContext = createContext<AuthContext | null>(null)

// Provider component
interface AuthPermissionProviderProps {
  children: ReactNode
  user: JWTPayload
}

export function AuthPermissionProvider({ children, user }: AuthPermissionProviderProps) {
  const authContext = createAuthContext(user)
  
  return React.createElement(
    AuthPermissionContext.Provider,
    { value: authContext },
    children
  )
}

// Hook to use permissions
export function usePermissions() {
  const context = useContext(AuthPermissionContext)
  
  if (!context) {
    throw new Error('usePermissions must be used within AuthPermissionProvider')
  }
  
  // Add convenience methods for common permission checks
  return {
    ...context,
    canEdit: (resource: string) => context.hasPermission(resource, 'update'),
    canTransfer: (resource: string) => context.hasPermission(resource, 'update'),
    canVerify: (resource: string) => context.hasPermission(resource, 'update'),
    canCreate: (resource: string) => context.hasPermission(resource, 'create'),
    canDelete: (resource: string) => context.hasPermission(resource, 'delete'),
    canApprove: (resource: string) => context.hasPermission(resource, 'approve'),
    canExport: (resource: string) => context.hasPermission(resource, 'export'),
  }
}

// Hook for checking specific permissions
export function useHasPermission(resource: string, action: string): boolean {
  const { hasPermission } = usePermissions()
  return hasPermission(resource, action)
}

// Hook for checking department access
export function useCanAccessDepartment(department: string): boolean {
  const { canAccessDepartment } = usePermissions()
  return canAccessDepartment(department)
}

// Hook for getting user role
export function useUserRole(): string {
  const { user } = usePermissions()
  return user.role
}

// Hook for getting user department
export function useUserDepartment(): string | undefined {
  const { user } = usePermissions()
  return user.department
}

// Hook for checking if user is admin
export function useIsAdmin(): boolean {
  const { user } = usePermissions()
  return user.role === 'admin'
}

// Hook for checking if user is SPOC
export function useIsSPOC(): boolean {
  const { user } = usePermissions()
  return user.role === 'spoc'
}

// Hook for getting department filter for queries
export function useDepartmentFilter(): Record<string, any> | null {
  const { getDepartmentFilter } = usePermissions()
  return getDepartmentFilter()
}

// Custom hook for conditional rendering based on permissions
export function useConditionalRender() {
  const permissions = usePermissions()
  
  return {
    // Render component only if user has permission
    renderIfPermission: (resource: string, action: string, component: ReactNode) => {
      return permissions.hasPermission(resource, action) ? component : null
    },
    
    // Render component only if user can access department
    renderIfDepartment: (department: string, component: ReactNode) => {
      return permissions.canAccessDepartment(department) ? component : null
    },
    
    // Render component only for admin
    renderIfAdmin: (component: ReactNode) => {
      return permissions.user.role === 'admin' ? component : null
    },
    
    // Render component only for SPOC
    renderIfSPOC: (component: ReactNode) => {
      return permissions.user.role === 'spoc' ? component : null
    },
    
    // Render component only for regular user
    renderIfUser: (component: ReactNode) => {
      return permissions.user.role === 'user' ? component : null
    }
  }
}