// Authentication and authorization types

export interface JWTPayload {
  id: string
  email: string
  role: 'admin' | 'spoc' | 'user'
  department?: string
  permissions: string[]
  iat: number
  exp: number
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'spoc' | 'user'
  department?: string
  isActive: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  name: string
  password: string
  role: 'admin' | 'spoc' | 'user'
  department?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface AuthResponse {
  user: AuthUser
  token: string
  refreshToken?: string
}

export interface Permission {
  resource: string
  actions: string[]
}

export interface RolePermissions {
  admin: Permission[]
  spoc: Permission[]
  user: Permission[]
}

export type UserRole = 'admin' | 'spoc' | 'user'

export interface AuthContext {
  user: JWTPayload
  hasPermission: (resource: string, action: string) => boolean
  canAccessDepartment: (department: string) => boolean
  getDepartmentFilter: () => Record<string, any> | null
}

export interface ProtectedRouteOptions {
  resource: string
  action: string
  requireDepartment?: boolean
}

export interface ValidationResult {
  allowed: boolean
  reason?: string
}