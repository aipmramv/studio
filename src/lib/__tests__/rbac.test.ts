import { RBACService } from '../rbac'
import { JWTPayload } from '@/types/auth'

describe('RBAC Service', () => {
  const adminUser: JWTPayload = {
    id: '1',
    email: 'admin@test.com',
    role: 'admin',
    permissions: [],
    iat: Date.now(),
    exp: Date.now() + 3600000
  }

  const spocUser: JWTPayload = {
    id: '2',
    email: 'spoc@test.com',
    role: 'spoc',
    department: 'IT',
    permissions: [],
    iat: Date.now(),
    exp: Date.now() + 3600000
  }

  const regularUser: JWTPayload = {
    id: '3',
    email: 'user@test.com',
    role: 'user',
    department: 'HR',
    permissions: [],
    iat: Date.now(),
    exp: Date.now() + 3600000
  }

  describe('hasPermission', () => {
    test('admin should have all permissions', () => {
      expect(RBACService.hasPermission('admin', 'assets', 'create')).toBe(true)
      expect(RBACService.hasPermission('admin', 'assets', 'delete')).toBe(true)
      expect(RBACService.hasPermission('admin', 'users', 'create')).toBe(true)
    })

    test('spoc should have limited permissions', () => {
      expect(RBACService.hasPermission('spoc', 'assets', 'read')).toBe(true)
      expect(RBACService.hasPermission('spoc', 'assets', 'update')).toBe(true)
      expect(RBACService.hasPermission('spoc', 'assets', 'delete')).toBe(false)
      expect(RBACService.hasPermission('spoc', 'users', 'create')).toBe(false)
    })

    test('user should have minimal permissions', () => {
      expect(RBACService.hasPermission('user', 'assets', 'read')).toBe(true)
      expect(RBACService.hasPermission('user', 'assets', 'create')).toBe(false)
      expect(RBACService.hasPermission('user', 'assets', 'update')).toBe(false)
      expect(RBACService.hasPermission('user', 'users', 'read')).toBe(false)
    })
  })

  describe('canAccessDepartment', () => {
    test('admin can access all departments', () => {
      expect(RBACService.canAccessDepartment('admin', undefined, 'IT')).toBe(true)
      expect(RBACService.canAccessDepartment('admin', undefined, 'HR')).toBe(true)
    })

    test('spoc can only access assigned department', () => {
      expect(RBACService.canAccessDepartment('spoc', 'IT', 'IT')).toBe(true)
      expect(RBACService.canAccessDepartment('spoc', 'IT', 'HR')).toBe(false)
    })

    test('user can only access assigned department', () => {
      expect(RBACService.canAccessDepartment('user', 'HR', 'HR')).toBe(true)
      expect(RBACService.canAccessDepartment('user', 'HR', 'IT')).toBe(false)
    })
  })

  describe('getDepartmentFilter', () => {
    test('admin gets no filter (all departments)', () => {
      expect(RBACService.getDepartmentFilter('admin', undefined)).toBeNull()
    })

    test('spoc gets department filter', () => {
      expect(RBACService.getDepartmentFilter('spoc', 'IT')).toEqual({ department: 'IT' })
    })

    test('user gets department filter', () => {
      expect(RBACService.getDepartmentFilter('user', 'HR')).toEqual({ department: 'HR' })
    })

    test('user without department gets null filter', () => {
      expect(RBACService.getDepartmentFilter('user', undefined)).toEqual({ department: null })
    })
  })

  describe('validateApiAccess', () => {
    test('admin can access all resources', () => {
      const result = RBACService.validateApiAccess(adminUser, 'assets', 'create')
      expect(result.allowed).toBe(true)
    })

    test('spoc cannot delete assets', () => {
      const result = RBACService.validateApiAccess(spocUser, 'assets', 'delete')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Insufficient permissions')
    })

    test('user cannot access other departments', () => {
      const result = RBACService.validateApiAccess(regularUser, 'assets', 'read', 'IT')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Access denied to department')
    })

    test('user can access own department', () => {
      const result = RBACService.validateApiAccess(regularUser, 'assets', 'read', 'HR')
      expect(result.allowed).toBe(true)
    })
  })

  describe('getUserPermissions', () => {
    test('returns correct permissions for admin', () => {
      const permissions = RBACService.getUserPermissions('admin')
      expect(permissions.assets).toContain('create')
      expect(permissions.assets).toContain('delete')
      expect(permissions.users).toContain('create')
    })

    test('returns correct permissions for spoc', () => {
      const permissions = RBACService.getUserPermissions('spoc')
      expect(permissions.assets).toContain('read')
      expect(permissions.assets).toContain('update')
      expect(permissions.assets).not.toContain('delete')
      expect(permissions.users).toBeUndefined()
    })

    test('returns correct permissions for user', () => {
      const permissions = RBACService.getUserPermissions('user')
      expect(permissions.assets).toContain('read')
      expect(permissions.assets).not.toContain('create')
      expect(permissions.users).toBeUndefined()
    })
  })
})