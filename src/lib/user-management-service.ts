import { MongoDBConnection, BaseMongoService, userService } from './mongodb-service'
import { ObjectId, ClientSession } from '@/types/server-types'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { JWTPayload } from '@/types/auth'

// User management interfaces
export interface CreateUserRequest {
  name: string
  email: string
  password: string
  role: 'admin' | 'user'
  department?: string
  phone?: string
  employeeId?: string
  isActive?: boolean
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  role?: 'admin' | 'user'
  department?: string
  phone?: string
  employeeId?: string
  isActive?: boolean
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  department?: string
  phone?: string
  employeeId?: string
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
  permissions: string[]
}

export interface UserActivity {
  id: string
  userId: string
  action: string
  resource?: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: Date
}

export interface LoginAttempt {
  email: string
  success: boolean
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  failureReason?: string
}

// User management service
export class UserManagementService extends BaseMongoService<any> {
  private readonly JWT_SECRET: string
  private readonly JWT_EXPIRES_IN: string
  private readonly MAX_LOGIN_ATTEMPTS: number = 5
  private readonly LOCKOUT_DURATION: number = 15 * 60 * 1000 // 15 minutes

  constructor() {
    super('user_management')
    this.JWT_SECRET = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long!!'
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'
  }

  /**
   * Register a new user
   */
  async registerUser(userData: CreateUserRequest, createdBy?: string): Promise<{
    user: UserProfile
    message: string
  }> {
    try {
      await this.ensureConnection()

      // Validate input
      this.validateUserData(userData)

      // Check if user already exists
      const existingUser = await userService.findByEmail(userData.email)
      if (existingUser) {
        throw new Error('User with this email already exists')
      }

      // Validate department assignment for non-admin users
      if (userData.role !== 'admin' && !userData.department) {
        throw new Error('Department is required for SPOC and User roles')
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12)

      // Create user
      const userId = await userService.createUser({
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        role: userData.role,
        department: userData.department,
        phone: userData.phone,
        employeeId: userData.employeeId,
        isActive: userData.isActive !== false
      })

      // Log activity
      if (createdBy) {
        await this.logUserActivity(createdBy, 'user_created', 'user', userId, {
          createdUserEmail: userData.email,
          createdUserRole: userData.role
        })
      }

      // Get created user profile
      const userProfile = await this.getUserProfile(userId)

      return {
        user: userProfile,
        message: 'User registered successfully'
      }
    } catch (error) {
      this.handleError('registerUser', error)
    }
  }

  /**
   * Authenticate user login
   */
  async authenticateUser(
    email: string, 
    password: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<{
    user: UserProfile
    token: string
    refreshToken: string
  }> {
    try {
      await this.ensureConnection()

      const normalizedEmail = email.toLowerCase()

      // Check for account lockout
      await this.checkAccountLockout(normalizedEmail)

      // Find user
      const user = await userService.findByEmail(normalizedEmail)
      
      if (!user) {
        await this.logLoginAttempt(normalizedEmail, false, ipAddress, userAgent, 'User not found')
        throw new Error('Invalid email or password')
      }

      // Check if user is active
      if (!user.isActive) {
        await this.logLoginAttempt(normalizedEmail, false, ipAddress, userAgent, 'Account disabled')
        throw new Error('Account is disabled')
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password)
      
      if (!isPasswordValid) {
        await this.logLoginAttempt(normalizedEmail, false, ipAddress, userAgent, 'Invalid password')
        await this.incrementFailedAttempts(normalizedEmail)
        throw new Error('Invalid email or password')
      }

      // Reset failed attempts on successful login
      await this.resetFailedAttempts(normalizedEmail)

      // Update last login
      await userService.updateLastLogin(user._id?.toString() || '')

      // Generate tokens
      const userProfile = await this.getUserProfile(user._id?.toString() || '')
      const token = this.generateAccessToken(userProfile)
      const refreshToken = this.generateRefreshToken(userProfile)

      // Log successful login
      await this.logLoginAttempt(normalizedEmail, true, ipAddress, userAgent)
      await this.logUserActivity(user._id?.toString() || '', 'login', undefined, undefined, {
        ipAddress,
        userAgent
      })

      return {
        user: userProfile,
        token,
        refreshToken
      }
    } catch (error) {
      this.handleError('authenticateUser', error)
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const user = await userService.findById(userId)
      
      if (!user) {
        throw new Error('User not found')
      }

      return {
        id: user._id?.toString() || '',
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        employeeId: user.employeeId,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        permissions: this.getUserPermissions(user.role)
      }
    } catch (error) {
      this.handleError('getUserProfile', error)
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string, 
    updates: UpdateUserRequest, 
    updatedBy: string
  ): Promise<UserProfile> {
    try {
      await this.ensureConnection()

      // Validate updates
      if (updates.email) {
        const existingUser = await userService.findByEmail(updates.email.toLowerCase())
        if (existingUser && existingUser._id?.toString() !== userId) {
          throw new Error('Email is already in use by another user')
        }
      }

      // Validate department assignment for role changes
      if (updates.role && updates.role !== 'admin' && !updates.department) {
        const currentUser = await userService.findById(userId)
        if (!currentUser?.department) {
          throw new Error('Department is required for SPOC and User roles')
        }
      }

      // Prepare update data
      const updateData: any = {}
      if (updates.name) updateData.name = updates.name
      if (updates.email) updateData.email = updates.email.toLowerCase()
      if (updates.role) updateData.role = updates.role
      if (updates.department !== undefined) updateData.department = updates.department
      if (updates.phone !== undefined) updateData.phone = updates.phone
      if (updates.employeeId !== undefined) updateData.employeeId = updates.employeeId
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive

      // Update user
      const success = await userService.updateUser(userId, updateData, updatedBy)
      
      if (!success) {
        throw new Error('Failed to update user')
      }

      // Log activity
      await this.logUserActivity(updatedBy, 'user_updated', 'user', userId, {
        updates: Object.keys(updateData)
      })

      // Return updated profile
      return await this.getUserProfile(userId)
    } catch (error) {
      this.handleError('updateUserProfile', error)
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string, 
    passwordData: ChangePasswordRequest
  ): Promise<{ message: string }> {
    try {
      const user = await userService.findById(userId)
      
      if (!user) {
        throw new Error('User not found')
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(passwordData.currentPassword, user.password)
      
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect')
      }

      // Validate new password
      this.validatePassword(passwordData.newPassword)

      // Hash new password
      const hashedPassword = await bcrypt.hash(passwordData.newPassword, 12)

      // Update password
      const success = await userService.updateUser(userId, { password: hashedPassword }, userId)
      
      if (!success) {
        throw new Error('Failed to update password')
      }

      // Log activity
      await this.logUserActivity(userId, 'password_changed')

      return { message: 'Password changed successfully' }
    } catch (error) {
      this.handleError('changePassword', error)
    }
  }

  /**
   * Reset user password (admin only)
   */
  async resetUserPassword(
    userId: string, 
    newPassword: string, 
    resetBy: string
  ): Promise<{ message: string; temporaryPassword?: string }> {
    try {
      const user = await userService.findById(userId)
      
      if (!user) {
        throw new Error('User not found')
      }

      let passwordToSet = newPassword
      let isTemporary = false

      // Generate temporary password if not provided
      if (!newPassword) {
        passwordToSet = this.generateTemporaryPassword()
        isTemporary = true
      }

      // Validate password
      this.validatePassword(passwordToSet)

      // Hash password
      const hashedPassword = await bcrypt.hash(passwordToSet, 12)

      // Update password
      const updateData: any = { password: hashedPassword }
      if (isTemporary) {
        updateData.requirePasswordChange = true
      }

      const success = await userService.updateUser(userId, updateData, resetBy)
      
      if (!success) {
        throw new Error('Failed to reset password')
      }

      // Log activity
      await this.logUserActivity(resetBy, 'password_reset', 'user', userId, {
        targetUserEmail: user.email,
        isTemporary
      })

      return {
        message: 'Password reset successfully',
        temporaryPassword: isTemporary ? passwordToSet : undefined
      }
    } catch (error) {
      this.handleError('resetUserPassword', error)
    }
  }

  /**
   * Get users list with filtering and pagination
   */
  async getUsers(filters: {
    role?: string
    department?: string
    isActive?: boolean
    search?: string
    page?: number
    limit?: number
  } = {}): Promise<{
    users: UserProfile[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    try {
      await this.ensureConnection()

      const {
        role,
        department,
        isActive,
        search,
        page = 1,
        limit = 20
      } = filters

      // Build query
      const query: any = {}
      
      if (role) query.role = role
      if (department) query.department = department
      if (isActive !== undefined) query.isActive = isActive
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } }
        ]
      }

      const skip = (page - 1) * limit

      // Get users
      const users = await userService.findMany(query, {
        skip,
        limit,
        sort: { name: 1 },
        projection: { password: 0 } // Exclude password
      })

      const total = await userService.count(query)

      // Convert to user profiles
      const userProfiles = users.map(user => ({
        id: user._id?.toString() || '',
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        employeeId: user.employeeId,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        permissions: this.getUserPermissions(user.role)
      }))

      return {
        users: userProfiles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    } catch (error) {
      this.handleError('getUsers', error)
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId: string, deletedBy: string): Promise<{ message: string }> {
    try {
      const user = await userService.findById(userId)
      
      if (!user) {
        throw new Error('User not found')
      }

      // Prevent deletion of the last admin
      if (user.role === 'admin') {
        const adminCount = await userService.count({ role: 'admin', isActive: true })
        if (adminCount <= 1) {
          throw new Error('Cannot delete the last active admin user')
        }
      }

      // Soft delete by deactivating
      const success = await userService.updateUser(userId, { 
        isActive: false
      }, deletedBy)
      
      if (!success) {
        throw new Error('Failed to delete user')
      }

      // Log activity
      await this.logUserActivity(deletedBy, 'user_deleted', 'user', userId, {
        deletedUserEmail: user.email
      })

      return { message: 'User deleted successfully' }
    } catch (error) {
      this.handleError('deleteUser', error)
    }
  }

  /**
   * Get user activity log
   */
  async getUserActivity(
    userId?: string,
    filters: {
      action?: string
      startDate?: Date
      endDate?: Date
      page?: number
      limit?: number
    } = {}
  ): Promise<{
    activities: UserActivity[]
    total: number
    page: number
    limit: number
  }> {
    try {
      await this.ensureConnection()

      const activitiesCollection = this.db.collection('userActivities')
      
      const {
        action,
        startDate,
        endDate,
        page = 1,
        limit = 50
      } = filters

      // Build query
      const query: any = {}
      
      if (userId) query.userId = userId
      if (action) query.action = action
      
      if (startDate || endDate) {
        query.timestamp = {}
        if (startDate) query.timestamp.$gte = startDate
        if (endDate) query.timestamp.$lte = endDate
      }

      const skip = (page - 1) * limit

      // Get activities
      const activities = await activitiesCollection
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray()

      const total = await activitiesCollection.countDocuments(query)

      return {
        activities: activities.map(activity => ({
          id: activity._id.toString(),
          userId: activity.userId,
          action: activity.action,
          resource: activity.resource,
          resourceId: activity.resourceId,
          details: activity.details,
          ipAddress: activity.ipAddress,
          userAgent: activity.userAgent,
          timestamp: activity.timestamp
        })),
        total,
        page,
        limit
      }
    } catch (error) {
      this.handleError('getUserActivity', error)
    }
  }

  // Private helper methods

  private validateUserData(userData: CreateUserRequest): void {
    if (!userData.name || userData.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long')
    }

    if (!userData.email || !this.isValidEmail(userData.email)) {
      throw new Error('Valid email is required')
    }

    if (!userData.password) {
      throw new Error('Password is required')
    }

    this.validatePassword(userData.password)

    if (!['admin', 'spoc', 'user'].includes(userData.role)) {
      throw new Error('Invalid role specified')
    }
  }

  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private getUserPermissions(role: string): string[] {
    const permissions = {
      admin: ['all'],
      spoc: ['assets:read', 'assets:update', 'workflows:create', 'workflows:approve', 'reports:read'],
      user: ['assets:read', 'workflows:read', 'reports:read']
    }
    
    return (permissions as any)[role] || []
  }

  private generateAccessToken(user: UserProfile): string {
    const payload: JWTPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      department: user.department,
      permissions: user.permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }

    return jwt.sign(payload, this.JWT_SECRET)
  }

  private generateRefreshToken(user: UserProfile): string {
    const payload = {
      id: user.id,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }

    return jwt.sign(payload, this.JWT_SECRET)
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let password = ''
    
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    return password
  }

  private async logUserActivity(
    userId: string,
    action: string,
    resource?: string,
    resourceId?: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const activitiesCollection = this.db.collection('userActivities')
      
      await activitiesCollection.insertOne({
        userId,
        action,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('Failed to log user activity:', error)
    }
  }

  private async logLoginAttempt(
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    failureReason?: string
  ): Promise<void> {
    try {
      const loginAttemptsCollection = this.db.collection('loginAttempts')
      
      await loginAttemptsCollection.insertOne({
        email,
        success,
        ipAddress,
        userAgent,
        failureReason,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('Failed to log login attempt:', error)
    }
  }

  private async checkAccountLockout(email: string): Promise<void> {
    const loginAttemptsCollection = this.db.collection('loginAttempts')
    
    const recentAttempts = await loginAttemptsCollection
      .find({
        email,
        success: false,
        timestamp: { $gte: new Date(Date.now() - this.LOCKOUT_DURATION) }
      })
      .sort({ timestamp: -1 })
      .limit(this.MAX_LOGIN_ATTEMPTS)
      .toArray()

    if (recentAttempts.length >= this.MAX_LOGIN_ATTEMPTS) {
      throw new Error('Account is temporarily locked due to too many failed login attempts')
    }
  }

  private async incrementFailedAttempts(email: string): Promise<void> {
    // This is handled by logLoginAttempt, but could be extended for more sophisticated tracking
  }

  private async resetFailedAttempts(email: string): Promise<void> {
    // Could implement cleanup of old failed attempts here if needed
  }
}

// Export service instance
export const userManagementService = new UserManagementService()