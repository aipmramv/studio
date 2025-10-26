'use client'

import { ReactNode } from 'react'
import { usePermissions } from '@/hooks/usePermissions'

interface PermissionGateProps {
  children: ReactNode
  resource?: string
  action?: string
  role?: 'admin' | 'spoc' | 'user'
  department?: string
  fallback?: ReactNode
  requireAll?: boolean // If true, all conditions must be met
}

/**
 * Component that conditionally renders children based on user permissions
 */
export function PermissionGate({
  children,
  resource,
  action,
  role,
  department,
  fallback = null,
  requireAll = true
}: PermissionGateProps) {
  const { user, hasPermission, canAccessDepartment } = usePermissions()
  
  const conditions: boolean[] = []
  
  // Check resource permission
  if (resource && action) {
    conditions.push(hasPermission(resource, action))
  }
  
  // Check role
  if (role) {
    conditions.push(user.role === role)
  }
  
  // Check department access
  if (department) {
    conditions.push(canAccessDepartment(department))
  }
  
  // If no conditions specified, allow access
  if (conditions.length === 0) {
    return <>{children}</>
  }
  
  // Check if conditions are met
  const hasAccess = requireAll 
    ? conditions.every(condition => condition)
    : conditions.some(condition => condition)
  
  return hasAccess ? <>{children}</> : <>{fallback}</>
}

/**
 * Component for admin-only content
 */
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate role="admin" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

/**
 * Component for SPOC-only content
 */
export function SPOCOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate role="spoc" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

/**
 * Component for user-only content
 */
export function UserOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate role="user" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

/**
 * Component for department-specific content
 */
export function DepartmentGate({ 
  children, 
  department, 
  fallback = null 
}: { 
  children: ReactNode
  department: string
  fallback?: ReactNode 
}) {
  return (
    <PermissionGate department={department} fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

/**
 * Component for resource-action specific content
 */
export function ResourceGate({ 
  children, 
  resource, 
  action, 
  fallback = null 
}: { 
  children: ReactNode
  resource: string
  action: string
  fallback?: ReactNode 
}) {
  return (
    <PermissionGate resource={resource} action={action} fallback={fallback}>
      {children}
    </PermissionGate>
  )
}