import { SignJWT, jwtVerify } from 'jose';
import 'server-only'

import { compare, hash } from 'bcryptjs';
import { cookies } from 'next/headers';
import { userService, UserDocument } from './mongodb-service';
import { ApiError } from './api-utils';

// JWT configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || 'your-secret-key-min-32-chars-long!!'
);
const JWT_EXPIRY = '24h';
const COOKIE_NAME = 'auth-token';

// Auth interfaces
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'spoc' | 'user';
  department?: string;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'spoc' | 'user';
  department?: string;
}

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'spoc' | 'user';
  department?: string;
  iat: number;
  exp: number;
}

export class AuthService {
  // Generate JWT token
  private async generateToken(user: UserDocument): Promise<string> {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      id: user._id!.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
    };

    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRY)
      .sign(JWT_SECRET);
  }

  // Verify JWT token
  public async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return payload as JWTPayload;
    } catch (error) {
      throw new ApiError(401, 'Invalid or expired token', 'INVALID_TOKEN');
    }
  }

  // Login user
  public async login(credentials: LoginCredentials): Promise<{
    user: AuthUser;
    token: string;
  }> {
    const { email, password } = credentials;

    // Validate input
    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required', 'MISSING_CREDENTIALS');
    }

    // Find user by email
    const user = await userService.findByEmail(email.toLowerCase().trim());
    if (!user) {
      throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError(401, 'Account is deactivated', 'ACCOUNT_DEACTIVATED');
    }

    // Verify password
    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Update last login
    await userService.updateLastLogin(user._id!.toString());

    // Generate token
    const token = await this.generateToken(user);

    // Return user data (excluding sensitive fields)
    const authUser: AuthUser = {
      id: user._id!.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
    };

    return { user: authUser, token };
  }

  // Register new user
  public async register(userData: RegisterData): Promise<{
    user: AuthUser;
    token: string;
  }> {
    const { email, name, password, role, department } = userData;

    // Validate input
    if (!email || !name || !password || !role) {
      throw new ApiError(400, 'All required fields must be provided', 'MISSING_FIELDS');
    }

    if (password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters long', 'WEAK_PASSWORD');
    }

    // Check if user already exists
    const existingUser = await userService.findByEmail(email.toLowerCase().trim());
    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists', 'USER_EXISTS');
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const userId = await userService.createUser({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      password: hashedPassword,
      role,
      department,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Get created user
    const user = await userService.findById(userId);
    if (!user) {
      throw new ApiError(500, 'Failed to create user', 'USER_CREATION_FAILED');
    }

    // Generate token
    const token = await this.generateToken(user);

    // Return user data
    const authUser: AuthUser = {
      id: user._id!.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
    };

    return { user: authUser, token };
  }

  // Get current user from token
  public async getCurrentUser(token: string): Promise<AuthUser> {
    const payload = await this.verifyToken(token);
    
    // Get fresh user data from database
    const user = await userService.findById(payload.id);
    if (!user || !user.isActive) {
      throw new ApiError(401, 'User not found or deactivated', 'USER_NOT_FOUND');
    }

    return {
      id: user._id!.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
    };
  }

  // Change password
  public async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    if (!currentPassword || !newPassword) {
      throw new ApiError(400, 'Current and new passwords are required', 'MISSING_PASSWORDS');
    }

    if (newPassword.length < 6) {
      throw new ApiError(400, 'New password must be at least 6 characters long', 'WEAK_PASSWORD');
    }

    // Get user
    const user = await userService.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Verify current password
    const isValidPassword = await compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new ApiError(401, 'Current password is incorrect', 'INVALID_PASSWORD');
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12);

    // Update password
    await userService.updateById(userId, { 
      password: hashedPassword,
      updatedAt: new Date(),
    });
  }

  // Reset password (admin only)
  public async resetPassword(
    adminUserId: string,
    targetUserId: string,
    newPassword: string
  ): Promise<void> {
    // Verify admin user
    const adminUser = await userService.findById(adminUserId);
    if (!adminUser || adminUser.role !== 'admin') {
      throw new ApiError(403, 'Only administrators can reset passwords', 'INSUFFICIENT_PERMISSIONS');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new ApiError(400, 'New password must be at least 6 characters long', 'WEAK_PASSWORD');
    }

    // Get target user
    const targetUser = await userService.findById(targetUserId);
    if (!targetUser) {
      throw new ApiError(404, 'Target user not found', 'USER_NOT_FOUND');
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12);

    // Update password
    await userService.updateById(targetUserId, { 
      password: hashedPassword,
      updatedAt: new Date(),
    });
  }

  // Deactivate user (admin only)
  public async deactivateUser(adminUserId: string, targetUserId: string): Promise<void> {
    // Verify admin user
    const adminUser = await userService.findById(adminUserId);
    if (!adminUser || adminUser.role !== 'admin') {
      throw new ApiError(403, 'Only administrators can deactivate users', 'INSUFFICIENT_PERMISSIONS');
    }

    // Get target user
    const targetUser = await userService.findById(targetUserId);
    if (!targetUser) {
      throw new ApiError(404, 'Target user not found', 'USER_NOT_FOUND');
    }

    // Cannot deactivate self
    if (adminUserId === targetUserId) {
      throw new ApiError(400, 'Cannot deactivate your own account', 'CANNOT_DEACTIVATE_SELF');
    }

    // Update user status
    await userService.updateById(targetUserId, { 
      isActive: false,
      updatedAt: new Date(),
    });
  }

  // Activate user (admin only)
  public async activateUser(adminUserId: string, targetUserId: string): Promise<void> {
    // Verify admin user
    const adminUser = await userService.findById(adminUserId);
    if (!adminUser || adminUser.role !== 'admin') {
      throw new ApiError(403, 'Only administrators can activate users', 'INSUFFICIENT_PERMISSIONS');
    }

    // Get target user
    const targetUser = await userService.findById(targetUserId);
    if (!targetUser) {
      throw new ApiError(404, 'Target user not found', 'USER_NOT_FOUND');
    }

    // Update user status
    await userService.updateById(targetUserId, { 
      isActive: true,
      updatedAt: new Date(),
    });
  }

  // Update user profile
  public async updateProfile(
    userId: string,
    updates: {
      name?: string;
      email?: string;
      department?: string;
    }
  ): Promise<AuthUser> {
    const user = await userService.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // If email is being updated, check for conflicts
    if (updates.email && updates.email !== user.email) {
      const existingUser = await userService.findByEmail(updates.email.toLowerCase().trim());
      if (existingUser) {
        throw new ApiError(409, 'Email already in use by another user', 'EMAIL_IN_USE');
      }
    }

    // Prepare update data
    const updateData: any = { updatedAt: new Date() };
    if (updates.name) updateData.name = updates.name.trim();
    if (updates.email) updateData.email = updates.email.toLowerCase().trim();
    if (updates.department) updateData.department = updates.department;

    // Update user
    await userService.updateById(userId, updateData);

    // Get updated user
    const updatedUser = await userService.findById(userId);
    if (!updatedUser) {
      throw new ApiError(500, 'Failed to update user', 'UPDATE_FAILED');
    }

    return {
      id: updatedUser._id!.toString(),
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      department: updatedUser.department,
      isActive: updatedUser.isActive,
    };
  }

  // Get all users (admin only)
  public async getAllUsers(adminUserId: string): Promise<AuthUser[]> {
    // Verify admin user
    const adminUser = await userService.findById(adminUserId);
    if (!adminUser || adminUser.role !== 'admin') {
      throw new ApiError(403, 'Only administrators can view all users', 'INSUFFICIENT_PERMISSIONS');
    }

    const users = await userService.findMany({}, { sort: { name: 1 } });
    
    return users.map(user => ({
      id: user._id!.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
    }));
  }

  // Get users by department
  public async getUsersByDepartment(department: string): Promise<AuthUser[]> {
    const users = await userService.getUsersByDepartment(department);
    
    return users.map(user => ({
      id: user._id!.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
    }));
  }

  // Get users by role
  public async getUsersByRole(role: string): Promise<AuthUser[]> {
    const users = await userService.getUsersByRole(role);
    
    return users.map(user => ({
      id: user._id!.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
    }));
  }
}

// Cookie management utilities
export class CookieManager {
  public static setAuthCookie(token: string): void {
    const cookieStore = cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });
  }

  public static getAuthCookie(): string | undefined {
    const cookieStore = cookies();
    return cookieStore.get(COOKIE_NAME)?.value;
  }

  public static clearAuthCookie(): void {
    const cookieStore = cookies();
    cookieStore.delete(COOKIE_NAME);
  }
}

// Permission utilities
export class PermissionManager {
  public static hasRole(user: AuthUser, requiredRoles: string[]): boolean {
    return requiredRoles.includes(user.role);
  }

  public static canAccessDepartment(user: AuthUser, department: string): boolean {
    if (user.role === 'admin') {
      return true; // Admins can access all departments
    }
    
    if (user.role === 'spoc' || user.role === 'user') {
      return user.department === department;
    }
    
    return false;
  }

  public static canManageUsers(user: AuthUser): boolean {
    return user.role === 'admin';
  }

  public static canApproveWorkflows(user: AuthUser): boolean {
    return user.role === 'admin' || user.role === 'spoc';
  }

  public static canCreateAssets(user: AuthUser): boolean {
    return user.role === 'admin';
  }

  public static canEditAssets(user: AuthUser): boolean {
    return user.role === 'admin';
  }

  public static canDeleteAssets(user: AuthUser): boolean {
    return user.role === 'admin';
  }

  public static canViewReports(user: AuthUser): boolean {
    return true; // All authenticated users can view reports (filtered by department)
  }

  public static canExportReports(user: AuthUser): boolean {
    return user.role === 'admin' || user.role === 'spoc';
  }

  public static canManageMasterData(user: AuthUser): boolean {
    return user.role === 'admin';
  }
}

// Export singleton instance
export const authService = new AuthService();