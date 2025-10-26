import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { RBACService } from '../rbac'
import { createAuthContext } from '../rbac'
import { withAuth, getAuthenticatedUser } from '../auth-middleware'
import { JWTPayload } from '@/types/auth'

// Mock MongoDB service
vi.mock('../mongodb-service', () => ({
  userService: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    updateLastLogin: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    getUsersByDepartment: vi.fn(),
    getUsersByRole: vi.fn(),
  },
  MongoDBConnection: {
    getInstance: vi.fn().mockReturnValue({
      connect: vi.fn(),
      getDb: vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue({
          insertOne: vi.fn(),
          find: vi.fn().mockReturnValue({
            sort: vi.fn().mockReturnValue({
              skip: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  toArray: vi.fn().mockResolvedValue([])
                })
              })
            })
          }),
          countDocuments: vi.fn().mockResolvedValue(0)
        })
      })
    })
  }
}))

describe('Authentication and Authorization Integration', () => {
  const mockUser: JWTPayload = {
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    role: 'admin',
    department: 'IT',
    permissions: ['all'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  }

  const mockSPOCUser: JWTPayload = {
    id: '507f1f77bcf86cd799439012',
    email: 'spoc@example.com',
    role: 'spoc',
    department: 'Finance',
    permissions: ['assets:read', 'assets:update', 'workflows:create', 'workflows:approve', 'reports:read'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  }

  const mockRegularUser: JWTPayload = {
    id: '507f1f77bcf86cd799439013',
    email: 'user@example.com',
    role: 'user',
    department: 'HR',
    permissions: ['assets:read', 'workflows:read', 'reports:read'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('RBAC Service', () => {
    it('should correctly validate admin permissions', () => {
      expect(RBACService.hasPermission('admin', 'assets', 'create')).toBe(true)
      expect(RBACService.hasPermission('admin', 'assets', 'delete')).toBe(true)
      expect(RBACService.hasPermission('admin', 'users', 'create')).toBe(true)
      expect(RBACService.hasPermission('admin', 'workflows', 'approve')).toBe(true)
    })

    it('should correctly validate SPOC permissions', () => {
      expect(RBACService.hasPermission('spoc', 'assets', 'read')).toBe(true)
      expect(RBACService.hasPermission('spoc', 'assets', 'update')).toBe(true)
      expect(RBACService.hasPermission('spoc', 'assets', 'create')).toBe(false)
      expect(RBACService.hasPermission('spoc', 'assets', 'delete')).toBe(false)
      expect(RBACService.hasPermission('spoc', 'workflows', 'approve')).toBe(true)
      expect(RBACService.hasPermission('spoc', 'users', 'create')).toBe(false)
    })

    it('should correctly validate user permissions', () => {
      expect(RBACService.hasPermission('user', 'assets', 'read')).toBe(true)
      expect(RBACService.hasPermission('user', 'assets', 'update')).toBe(false)
      expect(RBACService.hasPermission('user', 'assets', 'create')).toBe(false)
      expect(RBACService.hasPermission('user', 'workflows', 'read')).toBe(true)
      expect(RBACService.hasPermission('user', 'workflows', 'approve')).toBe(false)
    })

    it('should correctly validate department access', () => {
      expect(RBACService.canAccessDepartment('admin', 'IT', 'Finance')).toBe(true)
      expect(RBACService.canAccessDepartment('spoc', 'Finance', 'Finance')).toBe(true)
      expect(RBACService.canAccessDepartment('spoc', 'Finance', 'IT')).toBe(false)
      expect(RBACService.canAccessDepartment('user', 'HR', 'HR')).toBe(true)
      expect(RBACService.canAccessDepartment('user', 'HR', 'Finance')).toBe(false)
    })

    it('should generate correct department filters', () => {
      expect(RBACService.getDepartmentFilter('admin', 'IT')).toBeNull()
      expect(RBACService.getDepartmentFilter('spoc', 'Finance')).toEqual({ department: 'Finance' })
      expect(RBACService.getDepartmentFilter('user', 'HR')).toEqual({ department: 'HR' })
      expect(RBACService.getDepartmentFilter('user', undefined)).toEqual({ department: null })
    })

    it('should validate API access correctly', () => {
      // Admin access
      let result = RBACService.validateApiAccess(mockUser, 'assets', 'create')
      expect(result.allowed).toBe(true)

      // SPOC access - allowed
      result = RBACService.validateApiAccess(mockSPOCUser, 'assets', 'read')
      expect(result.allowed).toBe(true)

      // SPOC access - denied
      result = RBACService.validateApiAccess(mockSPOCUser, 'assets', 'delete')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Insufficient permissions')

      // User access - allowed
      result = RBACService.validateApiAccess(mockRegularUser, 'assets', 'read')
      expect(result.allowed).toBe(true)

      // User access - denied
      result = RBACService.validateApiAccess(mockRegularUser, 'workflows', 'approve')
      expect(result.allowed).toBe(false)

      // Department access validation
      result = RBACService.validateApiAccess(mockSPOCUser, 'assets', 'read', 'IT')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Access denied to department')
    })
  })

  describe('Auth Context', () => {
    it('should create correct auth context for admin', () => {
      const context = createAuthContext(mockUser)
      
      expect(context.user).toBe(mockUser)
      expect(context.hasPermission('assets', 'create')).toBe(true)
      expect(context.canAccessDepartment('Finance')).toBe(true)
      expect(context.getDepartmentFilter()).toBeNull()
    })

    it('should create correct auth context for SPOC', () => {
      const context = createAuthContext(mockSPOCUser)
      
      expect(context.user).toBe(mockSPOCUser)
      expect(context.hasPermission('assets', 'read')).toBe(true)
      expect(context.hasPermission('assets', 'delete')).toBe(false)
      expect(context.canAccessDepartment('Finance')).toBe(true)
      expect(context.canAccessDepartment('IT')).toBe(false)
      expect(context.getDepartmentFilter()).toEqual({ department: 'Finance' })
    })

    it('should create correct auth context for user', () => {
      const context = createAuthContext(mockRegularUser)
      
      expect(context.user).toBe(mockRegularUser)
      expect(context.hasPermission('assets', 'read')).toBe(true)
      expect(context.hasPermission('workflows', 'approve')).toBe(false)
      expect(context.canAccessDepartment('HR')).toBe(true)
      expect(context.canAccessDepartment('Finance')).toBe(false)
      expect(context.getDepartmentFilter()).toEqual({ department: 'HR' })
    })
  })

  describe('Auth Middleware Integration', () => {
    it('should authenticate valid token', () => {
      // Mock JWT verification
      const mockRequest = {
        headers: {
          get: vi.fn().mockImplementation((header: string) => {
            if (header === 'authorization') return 'Bearer valid-token'
            return null
          })
        },
        cookies: {
          get: vi.fn()
        }
      } as unknown as NextRequest

      // Mock token verification
      vi.spyOn(require('jsonwebtoken'), 'verify').mockReturnValue(mockUser)

      const user = getAuthenticatedUser(mockRequest)
      expect(user).toEqual(mockUser)
    })

    it('should reject invalid token', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(null)
        },
        cookies: {
          get: vi.fn().mockReturnValue(null)
        }
      } as unknown as NextRequest

      const user = getAuthenticatedUser(mockRequest)
      expect(user).toBeNull()
    })

    it('should create protected route handler', async () => {
      const mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }))
      const protectedHandler = withAuth(mockHandler, { resource: 'assets', action: 'read' })

      const mockRequest = {
        headers: {
          get: vi.fn().mockImplementation((header: string) => {
            if (header === 'authorization') return 'Bearer valid-token'
            return null
          })
        },
        cookies: {
          get: vi.fn()
        }
      } as unknown as NextRequest

      // Mock token verification
      vi.spyOn(require('jsonwebtoken'), 'verify').mockReturnValue(mockUser)

      const response = await protectedHandler(mockRequest)
      expect(mockHandler).toHaveBeenCalledWith(mockRequest, mockUser)
    })

    it('should reject unauthorized access', async () => {
      const mockHandler = vi.fn()
      const protectedHandler = withAuth(mockHandler, { resource: 'assets', action: 'delete' })

      const mockRequest = {
        headers: {
          get: vi.fn().mockImplementation((header: string) => {
            if (header === 'authorization') return 'Bearer valid-token'
            return null
          })
        },
        cookies: {
          get: vi.fn()
        }
      } as unknown as NextRequest

      // Mock token verification with user role
      vi.spyOn(require('jsonwebtoken'), 'verify').mockReturnValue(mockRegularUser)

      const response = await protectedHandler(mockRequest)
      expect(response.status).toBe(403)
      expect(mockHandler).not.toHaveBeenCalled()
    })
  })

  describe('Session Management', () => {
    it('should handle token expiration', () => {
      // Mock expired token verification
      vi.spyOn(require('jsonwebtoken'), 'verify').mockImplementation(() => {
        throw new Error('Token expired')
      })

      const mockRequest = {
        headers: {
          get: vi.fn().mockImplementation((header: string) => {
            if (header === 'authorization') return 'Bearer expired-token'
            return null
          })
        },
        cookies: {
          get: vi.fn()
        }
      } as unknown as NextRequest

      const user = getAuthenticatedUser(mockRequest)
      expect(user).toBeNull()
    })
  })
})