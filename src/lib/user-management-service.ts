
import { query } from './db';
import { createObjectId } from '@/types/server-types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '@/types/auth';

// User management interfaces
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  department?: string;
  phone?: string;
  employeeId?: string;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  phone?: string;
  employeeId?: string;
  isActive?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  phone?: string;
  employeeId?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  permissions: string[];
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface LoginAttempt {
  email: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  failureReason?: string;
}

// User management service
export class UserManagementService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;
  private readonly MAX_LOGIN_ATTEMPTS: number = 5;
  private readonly LOCKOUT_DURATION: number = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long!!';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
  }

  async registerUser(userData: CreateUserRequest, createdBy?: string): Promise<{
    user: UserProfile;
    message: string;
  }> {
    this.validateUserData(userData);

    const { rows: existingUsers } = await query('SELECT * FROM users WHERE email = ', [userData.email.toLowerCase()]);
    if (existingUsers.length > 0) {
      throw new Error('User with this email already exists');
    }

    const { rows: roleRows } = await query('SELECT id FROM roles WHERE name = ', [userData.role]);
    if (roleRows.length === 0) {
      throw new Error(`Role '${userData.role}' not found`);
    }
    const roleId = roleRows[0].id;

    let departmentId = null;
    if (userData.department) {
      const { rows: departmentRows } = await query('SELECT id FROM departments WHERE name = ', [userData.department]);
      if (departmentRows.length === 0) {
        throw new Error(`Department '${userData.department}' not found`);
      }
      departmentId = departmentRows[0].id;
    }

    if (userData.role !== 'admin' && !departmentId) {
      throw new Error('Department is required for SPOC and User roles');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const userId = createObjectId();

    const sql = `
      INSERT INTO users (id, name, email, password, role_id, department_id, phone, employee_id, is_active, created_at, updated_at)
      VALUES (, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id;
    `;
    const params = [
      userId,
      userData.name,
      userData.email.toLowerCase(),
      hashedPassword,
      roleId,
      departmentId,
      userData.phone,
      userData.employeeId,
      userData.isActive !== false
    ];

    await query(sql, params);

    if (createdBy) {
      await this.logUserActivity(createdBy, 'user_created', 'user', userId, {
        createdUserEmail: userData.email,
        createdUserRole: userData.role
      });
    }

    const userProfile = await this.getUserProfile(userId);

    return {
      user: userProfile,
      message: 'User registered successfully'
    };
  }

  async authenticateUser(
    email: string, 
    password: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<{
    user: UserProfile;
    token: string;
    refreshToken: string;
  }> {
    const normalizedEmail = email.toLowerCase();
    await this.checkAccountLockout(normalizedEmail);

    const sql = `
      SELECT u.*, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = ;
    `;
    const { rows: users } = await query(sql, [normalizedEmail]);
    const user = users[0];

    if (!user) {
      await this.logLoginAttempt(normalizedEmail, false, ipAddress, userAgent, 'User not found');
      throw new Error('Invalid email or password');
    }

    if (!user.is_active) {
      await this.logLoginAttempt(normalizedEmail, false, ipAddress, userAgent, 'Account disabled');
      throw new Error('Account is disabled');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await this.logLoginAttempt(normalizedEmail, false, ipAddress, userAgent, 'Invalid password');
      await this.incrementFailedAttempts(normalizedEmail);
      throw new Error('Invalid email or password');
    }

    await this.resetFailedAttempts(normalizedEmail);
    await query('UPDATE users SET last_login = NOW() WHERE id = ', [user.id]);

    const userProfile = await this.getUserProfile(user.id);
    const token = this.generateAccessToken(userProfile);
    const refreshToken = this.generateRefreshToken(userProfile);

    await this.logLoginAttempt(normalizedEmail, true, ipAddress, userAgent);
    await this.logUserActivity(user.id, 'login', undefined, undefined, {
      ipAddress,
      userAgent
    });

    return {
      user: userProfile,
      token,
      refreshToken
    };
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    const sql = `
      SELECT u.*, r.name as role_name, d.name as department_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ;
    `;
    const { rows } = await query(sql, [userId]);
    const user = rows[0];

    if (!user) {
      throw new Error('User not found');
    }

    const permissions = await this.getUserPermissions(user.role_id);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role_name,
      department: user.department_name,
      phone: user.phone,
      employeeId: user.employee_id,
      isActive: user.is_active,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      permissions: permissions
    };
  }

  async updateUserProfile(
    userId: string, 
    updates: UpdateUserRequest, 
    updatedBy: string
  ): Promise<UserProfile> {
    if (updates.email) {
      const { rows: existingUsers } = await query('SELECT * FROM users WHERE email =  AND id != $2', [updates.email.toLowerCase(), userId]);
      if (existingUsers.length > 0) {
        throw new Error('Email is already in use by another user');
      }
    }

    const updateFields: { [key: string]: any } = {};
    if (updates.name) updateFields.name = updates.name;
    if (updates.email) updateFields.email = updates.email.toLowerCase();
    if (updates.phone) updateFields.phone = updates.phone;
    if (updates.employeeId) updateFields.employee_id = updates.employeeId;
    if (updates.isActive !== undefined) updateFields.is_active = updates.isActive;

    if (updates.role) {
      const { rows: roleRows } = await query('SELECT id FROM roles WHERE name = ', [updates.role]);
      if (roleRows.length === 0) {
        throw new Error(`Role '${updates.role}' not found`);
      }
      updateFields.role_id = roleRows[0].id;
    }

    if (updates.department) {
      const { rows: departmentRows } = await query('SELECT id FROM departments WHERE name = ', [updates.department]);
      if (departmentRows.length === 0) {
        throw new Error(`Department '${updates.department}' not found`);
      }
      updateFields.department_id = departmentRows[0].id;
    }

    if (Object.keys(updateFields).length === 0) {
      return this.getUserProfile(userId);
    }

    const setClauses = Object.keys(updateFields).map((key, i) => `${key} = ${i + 2}`).join(', ');
    const sql = `UPDATE users SET ${setClauses}, updated_at = NOW() WHERE id = `;
    const params = [userId, ...Object.values(updateFields)];
    const { rowCount } = await query(sql, params);

    if (rowCount === 0) {
      throw new Error('Failed to update user');
    }

    await this.logUserActivity(updatedBy, 'user_updated', 'user', userId, {
      updates: Object.keys(updates)
    });

    return await this.getUserProfile(userId);
  }

  async changePassword(
    userId: string, 
    passwordData: ChangePasswordRequest
  ): Promise<{ message: string }> {
    const { rows: users } = await query('SELECT * FROM users WHERE id = ', [userId]);
    const user = users[0];

    if (!user) {
      throw new Error('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(passwordData.currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    this.validatePassword(passwordData.newPassword);
    const hashedPassword = await bcrypt.hash(passwordData.newPassword, 12);

    const { rowCount } = await query('UPDATE users SET password = , updated_at = NOW() WHERE id = $2', [hashedPassword, userId]);

    if (rowCount === 0) {
      throw new Error('Failed to update password');
    }

    await this.logUserActivity(userId, 'password_changed');

    return { message: 'Password changed successfully' };
  }

  async resetUserPassword(
    userId: string, 
    newPassword: string, 
    resetBy: string
  ): Promise<{ message: string; temporaryPassword?: string }> {
    const { rows: users } = await query('SELECT * FROM users WHERE id = ', [userId]);
    const user = users[0];

    if (!user) {
      throw new Error('User not found');
    }

    let passwordToSet = newPassword;
    let isTemporary = false;

    if (!newPassword) {
      passwordToSet = this.generateTemporaryPassword();
      isTemporary = true;
    }

    this.validatePassword(passwordToSet);
    const hashedPassword = await bcrypt.hash(passwordToSet, 12);

    const sql = `UPDATE users SET password = , require_password_change = $2, updated_at = NOW() WHERE id = $3`;
    const params = [hashedPassword, isTemporary, userId];
    const { rowCount } = await query(sql, params);

    if (rowCount === 0) {
      throw new Error('Failed to reset password');
    }

    await this.logUserActivity(resetBy, 'password_reset', 'user', userId, {
      targetUserEmail: user.email,
      isTemporary
    });

    return {
      message: 'Password reset successfully',
      temporaryPassword: isTemporary ? passwordToSet : undefined
    };
  }

  async getUsers(filters: { 
    role?: string;
    department?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    users: UserProfile[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { role, department, isActive, search, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let whereClauses = [];
    const params = [];

    if (role) {
      whereClauses.push(`r.name = ${params.length + 1}`);
      params.push(role);
    }

    if (department) {
      whereClauses.push(`d.name = ${params.length + 1}`);
      params.push(department);
    }

    if (isActive !== undefined) {
      whereClauses.push(`u.is_active = ${params.length + 1}`);
      params.push(isActive);
    }

    if (search) {
      whereClauses.push(`(u.name ILIKE ${params.length + 1} OR u.email ILIKE ${params.length + 1})`);
      params.push(`%${search}%`);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const totalSql = `SELECT COUNT(*) FROM users u LEFT JOIN roles r ON u.role_id = r.id LEFT JOIN departments d ON u.department_id = d.id ${whereClause}`;
    const totalResult = await query(totalSql, params);
    const total = parseInt(totalResult.rows[0].count, 10);

    const sql = `
      SELECT u.id, u.name, u.email, r.name as role, d.name as department, u.phone, u.employee_id, u.is_active, u.last_login, u.created_at, u.updated_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      ${whereClause}
      ORDER BY u.name ASC
      LIMIT ${params.length + 1} OFFSET ${params.length + 2};
    `;

    const result = await query(sql, [...params, limit, offset]);

    const userProfiles = await Promise.all(result.rows.map(async user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone,
      employeeId: user.employee_id,
      isActive: user.is_active,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      permissions: await this.getUserPermissions(user.id)
    })));

    return {
      users: userProfiles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async deleteUser(userId: string, deletedBy: string): Promise<{ message: string }> {
    const { rows: users } = await query('SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ', [userId]);
    const user = users[0];

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role_name === 'admin') {
      const { rows: [{ count }] } = await query('SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = \'admin\' AND u.is_active = true');
      if (parseInt(count, 10) <= 1) {
        throw new Error('Cannot delete the last active admin user');
      }
    }

    const { rowCount } = await query('UPDATE users SET is_active = false, updated_at = NOW() WHERE id = ', [userId]);

    if (rowCount === 0) {
      throw new Error('Failed to delete user');
    }

    await this.logUserActivity(deletedBy, 'user_deleted', 'user', userId, {
      deletedUserEmail: user.email
    });

    return { message: 'User deleted successfully' };
  }

  async getUserActivity(
    userId?: string,
    filters: {
      action?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    activities: UserActivity[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { action, startDate, endDate, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    let whereClauses = [];
    const params = [];

    if (userId) {
      whereClauses.push(`user_id = ${params.length + 1}`);
      params.push(userId);
    }
    
    if (action) {
        whereClauses.push(`action = ${params.length + 1}`);
        params.push(action);
    }

    if (startDate) {
        whereClauses.push(`timestamp >= ${params.length + 1}`);
        params.push(startDate);
    }

    if (endDate) {
        whereClauses.push(`timestamp <= ${params.length + 1}`);
        params.push(endDate);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const totalSql = `SELECT COUNT(*) FROM user_activities ${whereClause}`;
    const totalResult = await query(totalSql, params);
    const total = parseInt(totalResult.rows[0].count, 10);

    const sql = `
      SELECT id, user_id, action, resource, resource_id, details, ip_address, user_agent, timestamp
      FROM user_activities
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ${params.length + 1} OFFSET ${params.length + 2};
    `;

    const result = await query(sql, [...params, limit, offset]);

    const activities = result.rows.map(activity => ({
      id: activity.id,
      userId: activity.user_id,
      action: activity.action,
      resource: activity.resource,
      resourceId: activity.resource_id,
      details: activity.details,
      ipAddress: activity.ip_address,
      userAgent: activity.user_agent,
      timestamp: activity.timestamp
    }));

    return {
      activities,
      total,
      page,
      limit
    };
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
    const sql = `
      INSERT INTO user_activities (user_id, action, resource, resource_id, details, ip_address, user_agent, timestamp)
      VALUES (, $2, $3, $4, $5, $6, $7, NOW());
    `;
    const params = [userId, action, resource, resourceId, JSON.stringify(details), ipAddress, userAgent];
    await query(sql, params);
  }

  private async logLoginAttempt(
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    failureReason?: string
  ): Promise<void> {
    const sql = `
      INSERT INTO login_attempts (email, success, ip_address, user_agent, failure_reason, timestamp)
      VALUES (, $2, $3, $4, $5, NOW());
    `;
    const params = [email, success, ipAddress, userAgent, failureReason];
    await query(sql, params);
  }

  private async checkAccountLockout(email: string): Promise<void> {
    const sql = `
      SELECT COUNT(*) FROM login_attempts
      WHERE email =  AND success = false AND timestamp > NOW() - INTERVAL '${this.LOCKOUT_DURATION}ms';
    `;
    const { rows } = await query(sql, [email]);
    const failedAttempts = parseInt(rows[0].count, 10);

    if (failedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      throw new Error('Account is temporarily locked due to too many failed login attempts');
    }
  }

  private async incrementFailedAttempts(email: string): Promise<void> {
    // This is handled by logLoginAttempt
  }

  private async resetFailedAttempts(email: string): Promise<void> {
    // Could implement cleanup of old failed attempts here if needed
  }

  private validateUserData(userData: CreateUserRequest): void {
    if (!userData.name || userData.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    if (!userData.email || !this.isValidEmail(userData.email)) {
      throw new Error('Valid email is required');
    }

    if (!userData.password) {
      throw new Error('Password is required');
    }

    this.validatePassword(userData.password);

    if (!userData.role) {
      throw new Error('Role is required');
    }
  }

  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async getUserPermissions(roleId: number): Promise<string[]> {
    const sql = `
      SELECT p.name
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ;
    `;
    const { rows } = await query(sql, [roleId]);
    return rows.map(row => row.name);
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
    };

    return jwt.sign(payload, this.JWT_SECRET);
  }

  private generateRefreshToken(user: UserProfile): string {
    const payload = {
      id: user.id,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };

    return jwt.sign(payload, this.JWT_SECRET);
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return password;
  }
}

// Export service instance
export const userManagementService = new UserManagementService();

