import { UserManagementService } from '../user-management-service'

// Mock dependencies
jest.mock('../mongodb-service', () => ({
  MongoDBConnection: {
    getInstance: jest.fn().mockReturnValue({
      connect: jest.fn().mockResolvedValue({
        collection: jest.fn().mockReturnValue({
          insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
          findOne: jest.fn().mockResolvedValue(null),
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([]),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis()
          }),
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
          countDocuments: jest.fn().mockResolvedValue(0)
        })
      }),
      getDb: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
          insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
          findOne: jest.fn().mockResolvedValue(null),
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([]),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis()
          }),
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
          countDocuments: jest.fn().mockResolvedValue(0)
        })
      })
    })
  },
  BaseMongoService: class MockBaseMongoService {
    protected db: any
    protected collection: any
    protected collectionName: string
    
    constructor(collectionName: string) {
      this.collectionName = collectionName
    }
    
    protected async ensureConnection() {}
    protected handleError(operation: string, error: any): never {
      throw error
    }
  },
  userService: {
    findByEmail: jest.fn().mockResolvedValue(null),
    createUser: jest.fn().mockResolvedValue('user-id'),
    findById: jest.fn().mockResolvedValue({
      _id: { toString: () => 'user-id' },
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      department: 'IT',
      isActive: true,
      password: 'hashed-password',
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    updateUser: jest.fn().mockResolvedValue(true),
    updateLastLogin: jest.fn().mockResolvedValue(undefined),
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0)
  }
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true)
}))

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token')
}))

describe('UserManagementService', () => {
  let userManagementService: UserManagementService

  beforeEach(() => {
    userManagementService = new UserManagementService()
    jest.clearAllMocks()
  })

  describe('registerUser', () => {
    const validUserData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123',
      role: 'user' as const,
      department: 'IT'
    }

    test('should register user successfully', async () => {
      const result = await userManagementService.registerUser(validUserData, 'admin-id')

      expect(result.user).toBeDefined()
      expect(result.message).toBe('User registered successfully')
      expect(result.user.email).toBe('john@example.com')
    })

    test('should throw error for duplicate email', async () => {
      const { userService } = require('../mongodb-service')
      userService.findByEmail.mockResolvedValueOnce({ email: 'john@example.com' })

      await expect(
        userManagementService.registerUser(validUserData, 'admin-id')
      ).rejects.toThrow('User with this email already exists')
    })

    test('should throw error for invalid email', async () => {
      const invalidUserData = { ...validUserData, email: 'invalid-email' }

      await expect(
        userManagementService.registerUser(invalidUserData, 'admin-id')
      ).rejects.toThrow('Valid email is required')
    })

    test('should throw error for weak password', async () => {
      const weakPasswordData = { ...validUserData, password: '123' }

      await expect(
        userManagementService.registerUser(weakPasswordData, 'admin-id')
      ).rejects.toThrow('Password must be at least 8 characters long')
    })

    test('should require department for non-admin users', async () => {
      const noDepartmentData = { ...validUserData, department: undefined }

      await expect(
        userManagementService.registerUser(noDepartmentData, 'admin-id')
      ).rejects.toThrow('Department is required for SPOC and User roles')
    })
  })

  describe('authenticateUser', () => {
    test('should authenticate user successfully', async () => {
      const { userService } = require('../mongodb-service')
      userService.findByEmail.mockResolvedValueOnce({
        _id: { toString: () => 'user-id' },
        email: 'test@example.com',
        password: 'hashed-password',
        isActive: true,
        role: 'user',
        department: 'IT'
      })

      const result = await userManagementService.authenticateUser(
        'test@example.com',
        'password123',
        '127.0.0.1',
        'test-agent'
      )

      expect(result.user).toBeDefined()
      expect(result.token).toBe('mock-jwt-token')
      expect(result.refreshToken).toBe('mock-jwt-token')
    })

    test('should throw error for non-existent user', async () => {
      await expect(
        userManagementService.authenticateUser('nonexistent@example.com', 'password')
      ).rejects.toThrow('Invalid email or password')
    })

    test('should throw error for inactive user', async () => {
      const { userService } = require('../mongodb-service')
      userService.findByEmail.mockResolvedValueOnce({
        email: 'test@example.com',
        isActive: false
      })

      await expect(
        userManagementService.authenticateUser('test@example.com', 'password')
      ).rejects.toThrow('Account is disabled')
    })

    test('should throw error for invalid password', async () => {
      const { userService } = require('../mongodb-service')
      const bcrypt = require('bcryptjs')
      
      userService.findByEmail.mockResolvedValueOnce({
        email: 'test@example.com',
        password: 'hashed-password',
        isActive: true
      })
      bcrypt.compare.mockResolvedValueOnce(false)

      await expect(
        userManagementService.authenticateUser('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password')
    })
  })

  describe('getUserProfile', () => {
    test('should get user profile successfully', async () => {
      const profile = await userManagementService.getUserProfile('user-id')

      expect(profile).toBeDefined()
      expect(profile.id).toBe('user-id')
      expect(profile.email).toBe('test@example.com')
      expect(profile.permissions).toBeDefined()
    })

    test('should throw error for non-existent user', async () => {
      const { userService } = require('../mongodb-service')
      userService.findById.mockResolvedValueOnce(null)

      await expect(
        userManagementService.getUserProfile('non-existent-id')
      ).rejects.toThrow('User not found')
    })
  })

  describe('updateUserProfile', () => {
    test('should update user profile successfully', async () => {
      const updates = { name: 'Updated Name', phone: '1234567890' }

      const result = await userManagementService.updateUserProfile(
        'user-id',
        updates,
        'admin-id'
      )

      expect(result).toBeDefined()
      expect(result.id).toBe('user-id')
    })

    test('should throw error for duplicate email', async () => {
      const { userService } = require('../mongodb-service')
      userService.findByEmail.mockResolvedValueOnce({
        _id: { toString: () => 'other-user-id' },
        email: 'existing@example.com'
      })

      const updates = { email: 'existing@example.com' }

      await expect(
        userManagementService.updateUserProfile('user-id', updates, 'admin-id')
      ).rejects.toThrow('Email is already in use by another user')
    })
  })

  describe('changePassword', () => {
    test('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: 'NewPassword123'
      }

      const result = await userManagementService.changePassword('user-id', passwordData)

      expect(result.message).toBe('Password changed successfully')
    })

    test('should throw error for incorrect current password', async () => {
      const bcrypt = require('bcryptjs')
      bcrypt.compare.mockResolvedValueOnce(false)

      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'NewPassword123'
      }

      await expect(
        userManagementService.changePassword('user-id', passwordData)
      ).rejects.toThrow('Current password is incorrect')
    })
  })

  describe('getUsers', () => {
    test('should get users list successfully', async () => {
      const result = await userManagementService.getUsers({
        page: 1,
        limit: 10
      })

      expect(result).toBeDefined()
      expect(result.users).toEqual([])
      expect(result.total).toBe(0)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
    })

    test('should filter users by role', async () => {
      const result = await userManagementService.getUsers({
        role: 'admin',
        page: 1,
        limit: 10
      })

      expect(result).toBeDefined()
    })
  })

  describe('deleteUser', () => {
    test('should delete user successfully', async () => {
      const result = await userManagementService.deleteUser('user-id', 'admin-id')

      expect(result.message).toBe('User deleted successfully')
    })

    test('should prevent deletion of last admin', async () => {
      const { userService } = require('../mongodb-service')
      userService.findById.mockResolvedValueOnce({
        _id: { toString: () => 'admin-id' },
        role: 'admin'
      })
      userService.count.mockResolvedValueOnce(1) // Only one admin

      await expect(
        userManagementService.deleteUser('admin-id', 'other-admin-id')
      ).rejects.toThrow('Cannot delete the last active admin user')
    })
  })

  describe('validation methods', () => {
    test('should validate email format', () => {
      const service = new UserManagementService()
      
      // Access private method for testing
      const isValidEmail = (service as any).isValidEmail.bind(service)
      
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
    })

    test('should validate password strength', () => {
      const service = new UserManagementService()
      
      // Access private method for testing
      const validatePassword = (service as any).validatePassword.bind(service)
      
      expect(() => validatePassword('Password123')).not.toThrow()
      expect(() => validatePassword('weak')).toThrow()
      expect(() => validatePassword('nouppercaseornumber')).toThrow()
      expect(() => validatePassword('NOLOWERCASEORNUMBER')).toThrow()
      expect(() => validatePassword('NoNumber')).toThrow()
    })
  })
})