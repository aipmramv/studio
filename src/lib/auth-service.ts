

import { SignJWT, jwtVerify } from 'jose';
import 'server-only'

import { compare, hash } from 'bcryptjs';
import { cookies } from 'next/headers';
import { query } from './db';
import { ApiError } from './api-utils';
import { RBACService } from './rbac';
import { userManagementService } from './user-management-service';

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
  role: string; // Role name
  department?: string; // Department name
  isActive: boolean;
  permissions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
  role: string;
  department?: string;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: string; // Role name
  role_id: number; // Role ID
  department?: string; // Department name
  department_id?: number; // Department ID
  permissions: string[];
  iat: number;
  exp: number;
}

export class AuthService {
  // Generate JWT token
  private async generateToken(user: AuthUser): Promise<string> {
    const { rows: roleRows } = await query('SELECT id FROM roles WHERE name = $1', [user.role]);
    const roleId = roleRows[0]?.id;

    let departmentId = undefined;
    if (user.department) {
      const { rows: deptRows } = await query('SELECT id FROM departments WHERE name = $1', [user.department]);
      departmentId = deptRows[0]?.id;
    }

    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      id: user.id,
      email: user.email,
      role: user.role,
      role_id: roleId,
      department: user.department,
      department_id: departmentId,
      permissions: user.permissions,
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

    const userProfile = await userManagementService.authenticateUser(email, password);

    const authUser: AuthUser = {
      id: userProfile.user.id,
      email: userProfile.user.email,
      name: userProfile.user.name,
      role: userProfile.user.role,
      department: userProfile.user.department,
      isActive: userProfile.user.isActive,
      permissions: userProfile.user.permissions,
    };

    const token = await this.generateToken(authUser);

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

    const userProfile = await userManagementService.registerUser({
      email, name, password, role, department, isActive: true
    });

    const authUser: AuthUser = {
      id: userProfile.user.id,
      email: userProfile.user.email,
      name: userProfile.user.name,
      role: userProfile.user.role,
      department: userProfile.user.department,
      isActive: userProfile.user.isActive,
      permissions: userProfile.user.permissions,
    };

    const token = await this.generateToken(authUser);

    return { user: authUser, token };
  }

  // Get current user from token
  public async getCurrentUser(token: string): Promise<AuthUser> {
    const payload = await this.verifyToken(token);
    
    // Get fresh user data from database
    const userProfile = await userManagementService.getUserProfile(payload.id);
    if (!userProfile || !userProfile.isActive) {
      throw new ApiError(401, 'User not found or deactivated', 'USER_NOT_FOUND');
    }

    return {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      role: userProfile.role,
      department: userProfile.department,
      isActive: userProfile.isActive,
      permissions: userProfile.permissions,
    };
  }

  // Change password
  public async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await userManagementService.changePassword(userId, { currentPassword, newPassword });
  }

  // Reset password (admin only)
  public async resetPassword(
    adminUserId: string,
    targetUserId: string,
    newPassword: string
  ): Promise<void> {
    // This logic should ideally be in userManagementService and check admin role there
    // For now, assuming admin check happens before calling this.
    await userManagementService.resetUserPassword(targetUserId, newPassword, adminUserId);
  }

  // Deactivate user (admin only)
  public async deactivateUser(adminUserId: string, targetUserId: string): Promise<void> {
    // This logic should ideally be in userManagementService and check admin role there
    // For now, assuming admin check happens before calling this.
    await userManagementService.deleteUser(targetUserId, adminUserId); // deleteUser now deactivates
  }

  // Activate user (admin only)
  public async activateUser(adminUserId: string, targetUserId: string): Promise<void> {
    // This logic should ideally be in userManagementService and check admin role there
    // For now, assuming admin check happens before calling this.
    await userManagementService.updateUserProfile(targetUserId, { isActive: true }, adminUserId);
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
    const userProfile = await userManagementService.updateUserProfile(userId, updates, userId);

    return {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      role: userProfile.role,
      department: userProfile.department,
      isActive: userProfile.isActive,
      permissions: userProfile.permissions,
    };
  }

  // Get all users (admin only)
  public async getAllUsers(adminUserId: string): Promise<AuthUser[]> {
    // This logic should ideally be in userManagementService and check admin role there
    // For now, assuming admin check happens before calling this.
    const { users } = await userManagementService.getUsers({});
    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
      permissions: user.permissions,
    }));
  }

  // Get users by department
  public async getUsersByDepartment(departmentName: string): Promise<AuthUser[]> {
    const { users } = await userManagementService.getUsers({ department: departmentName });
    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
      permissions: user.permissions,
    }));
  }

  // Get users by role
  public async getUsersByRole(roleName: string): Promise<AuthUser[]> {
    const { users } = await userManagementService.getUsers({ role: roleName });
    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
      permissions: user.permissions,
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
  public static async hasPermission(user: AuthUser, resource: string, action: string): Promise<boolean> {
    const { rows: roleRows } = await query('SELECT id FROM roles WHERE name = $1', [user.role]);
    const roleId = roleRows[0]?.id;
    if (!roleId) return false;
    return RBACService.hasPermission(roleId, resource, action);
  }

  public static async canAccessDepartment(user: AuthUser, departmentName: string): Promise<boolean> {
    const { rows: deptRows } = await query('SELECT id FROM departments WHERE name = $1', [departmentName]);
    const departmentId = deptRows[0]?.id;
    if (!departmentId) return false;
    return RBACService.canAccessDepartment(user.role as any, user.department_id, departmentId);
  }

  public static async canManageUsers(user: AuthUser): Promise<boolean> {
    return this.hasPermission(user, 'users', 'manage');
  }

  public static async canApproveWorkflows(user: AuthUser): Promise<boolean> {
    return this.hasPermission(user, 'workflows', 'approve');
  }

  public static async canCreateAssets(user: AuthUser): Promise<boolean> {
    return this.hasPermission(user, 'assets', 'create');
  }

  public static async canEditAssets(user: AuthUser): Promise<boolean> {
    return this.hasPermission(user, 'assets', 'update');
  }

  public static async canDeleteAssets(user: AuthUser): Promise<boolean> {
    return this.hasPermission(user, 'assets', 'delete');
  }

  public static async canViewReports(user: AuthUser): Promise<boolean> {
    return this.hasPermission(user, 'reports', 'read');
  }

  public static async canExportReports(user: AuthUser): Promise<boolean> {
    return this.hasPermission(user, 'reports', 'export');
  }

  public static async canManageMasterData(user: AuthUser): Promise<boolean> {
    return this.hasPermission(user, 'masters', 'manage');
  }
}

// Export singleton instance
export const authService = new AuthService();