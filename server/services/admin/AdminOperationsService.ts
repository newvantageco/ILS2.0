/**
 * Admin Operations Service
 *
 * Handles administrative operations, user management, and system maintenance
 */

import { loggers } from '../../utils/logger.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const logger = loggers.api;

// ========== Types & Interfaces ==========

/**
 * User role
 */
export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'provider'
  | 'staff'
  | 'user';

/**
 * User status
 */
export type UserStatus = 'active' | 'suspended' | 'locked' | 'pending' | 'deleted';

/**
 * Permission
 */
export type Permission =
  | 'users.read'
  | 'users.write'
  | 'users.delete'
  | 'patients.read'
  | 'patients.write'
  | 'patients.delete'
  | 'appointments.read'
  | 'appointments.write'
  | 'appointments.delete'
  | 'billing.read'
  | 'billing.write'
  | 'reports.read'
  | 'reports.write'
  | 'config.read'
  | 'config.write'
  | 'system.admin';

/**
 * Admin user
 */
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  permissions: Permission[];

  // Authentication
  passwordHash?: string;
  mfaEnabled: boolean;
  mfaSecret?: string;

  // Security
  lastLoginAt?: Date;
  lastLoginIp?: string;
  failedLoginAttempts: number;
  lockedUntil?: Date;

  // Metadata
  createdAt: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
  deletedAt?: Date;
  deletedBy?: string;
}

/**
 * Audit log entry
 */
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

/**
 * System operation
 */
export type SystemOperation =
  | 'clear_cache'
  | 'rebuild_indexes'
  | 'vacuum_database'
  | 'run_migrations'
  | 'export_data'
  | 'import_data'
  | 'backup_database'
  | 'restore_database';

/**
 * Operation result
 */
export interface OperationResult {
  success: boolean;
  operation: SystemOperation;
  startedAt: Date;
  completedAt: Date;
  duration: number; // milliseconds
  message?: string;
  details?: Record<string, any>;
  error?: string;
}

/**
 * Bulk operation
 */
export interface BulkOperation {
  id: string;
  type: 'delete' | 'update' | 'export';
  resource: string;
  criteria: Record<string, any>;
  updates?: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  startedAt?: Date;
  completedAt?: Date;
  createdBy: string;
  error?: string;
}

/**
 * Admin Operations Service
 */
export class AdminOperationsService {
  /**
   * In-memory stores (use database in production)
   */
  private static users = new Map<string, AdminUser>();
  private static auditLogs: AuditLog[] = [];
  private static bulkOperations = new Map<string, BulkOperation>();

  /**
   * Configuration
   */
  private static readonly AUDIT_LOG_RETENTION_DAYS = 365;
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCK_DURATION_MINUTES = 30;
  private static readonly PASSWORD_SALT_ROUNDS = 10;

  /**
   * Role permissions
   */
  private static readonly ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    super_admin: [
      'users.read',
      'users.write',
      'users.delete',
      'patients.read',
      'patients.write',
      'patients.delete',
      'appointments.read',
      'appointments.write',
      'appointments.delete',
      'billing.read',
      'billing.write',
      'reports.read',
      'reports.write',
      'config.read',
      'config.write',
      'system.admin',
    ],
    admin: [
      'users.read',
      'users.write',
      'patients.read',
      'patients.write',
      'appointments.read',
      'appointments.write',
      'billing.read',
      'billing.write',
      'reports.read',
      'reports.write',
      'config.read',
    ],
    manager: [
      'patients.read',
      'patients.write',
      'appointments.read',
      'appointments.write',
      'billing.read',
      'reports.read',
    ],
    provider: [
      'patients.read',
      'patients.write',
      'appointments.read',
      'appointments.write',
      'reports.read',
    ],
    staff: ['patients.read', 'appointments.read', 'appointments.write'],
    user: ['patients.read'],
  };

  /**
   * Initialize default users
   */
  static {
    this.initializeDefaultUsers();
  }

  // ========== User Management ==========

  /**
   * Initialize default users
   */
  private static initializeDefaultUsers(): void {
    // Create default super admin
    this.createUser(
      {
        email: 'admin@ils2.com',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'super_admin',
        password: 'Admin@123',
      },
      'system'
    );

    logger.info('Default admin user created');
  }

  /**
   * Create user
   */
  static createUser(
    userData: {
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      password: string;
      mfaEnabled?: boolean;
    },
    createdBy: string
  ): AdminUser {
    // Check if email exists
    const existing = Array.from(this.users.values()).find(
      (u) => u.email === userData.email && u.status !== 'deleted'
    );

    if (existing) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = bcrypt.hashSync(userData.password, this.PASSWORD_SALT_ROUNDS);

    // Get permissions for role
    const permissions = this.ROLE_PERMISSIONS[userData.role] || [];

    const user: AdminUser = {
      id: crypto.randomUUID(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      status: 'active',
      permissions,
      passwordHash,
      mfaEnabled: userData.mfaEnabled || false,
      failedLoginAttempts: 0,
      createdAt: new Date(),
      createdBy,
    };

    this.users.set(user.id, user);

    this.logAudit({
      userId: createdBy,
      userName: 'System',
      action: 'create_user',
      resource: 'user',
      resourceId: user.id,
      details: { email: user.email, role: user.role },
      success: true,
    });

    logger.info({ userId: user.id, email: user.email, role: user.role }, 'User created');

    return this.sanitizeUser(user);
  }

  /**
   * Get user
   */
  static getUser(userId: string): AdminUser | null {
    const user = this.users.get(userId);
    return user && user.status !== 'deleted' ? this.sanitizeUser(user) : null;
  }

  /**
   * Get user by email
   */
  static getUserByEmail(email: string): AdminUser | null {
    const user = Array.from(this.users.values()).find(
      (u) => u.email === email && u.status !== 'deleted'
    );

    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * List users
   */
  static listUsers(
    role?: UserRole,
    status?: UserStatus
  ): AdminUser[] {
    let users = Array.from(this.users.values()).filter((u) => u.status !== 'deleted');

    if (role) {
      users = users.filter((u) => u.role === role);
    }

    if (status) {
      users = users.filter((u) => u.status === status);
    }

    return users.map((u) => this.sanitizeUser(u)).sort((a, b) => a.email.localeCompare(b.email));
  }

  /**
   * Update user
   */
  static updateUser(
    userId: string,
    updates: Partial<Pick<AdminUser, 'firstName' | 'lastName' | 'role' | 'status'>>,
    updatedBy: string
  ): AdminUser | null {
    const user = this.users.get(userId);

    if (!user || user.status === 'deleted') {
      return null;
    }

    // Update permissions if role changed
    if (updates.role && updates.role !== user.role) {
      updates.permissions = this.ROLE_PERMISSIONS[updates.role];
    }

    Object.assign(user, updates, { updatedAt: new Date(), updatedBy });

    this.users.set(userId, user);

    this.logAudit({
      userId: updatedBy,
      userName: 'Admin',
      action: 'update_user',
      resource: 'user',
      resourceId: userId,
      details: updates,
      success: true,
    });

    logger.info({ userId, updates, updatedBy }, 'User updated');

    return this.sanitizeUser(user);
  }

  /**
   * Change password
   */
  static async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    const user = this.users.get(userId);

    if (!user || user.status === 'deleted') {
      return { success: false, error: 'User not found' };
    }

    // Verify old password
    const isValid = await bcrypt.compare(oldPassword, user.passwordHash!);

    if (!isValid) {
      return { success: false, error: 'Invalid current password' };
    }

    // Hash new password
    user.passwordHash = await bcrypt.hash(newPassword, this.PASSWORD_SALT_ROUNDS);
    user.updatedAt = new Date();

    this.users.set(userId, user);

    this.logAudit({
      userId,
      userName: user.email,
      action: 'change_password',
      resource: 'user',
      resourceId: userId,
      success: true,
    });

    logger.info({ userId }, 'Password changed');

    return { success: true };
  }

  /**
   * Reset password
   */
  static async resetPassword(
    userId: string,
    newPassword: string,
    resetBy: string
  ): Promise<AdminUser | null> {
    const user = this.users.get(userId);

    if (!user || user.status === 'deleted') {
      return null;
    }

    user.passwordHash = await bcrypt.hash(newPassword, this.PASSWORD_SALT_ROUNDS);
    user.updatedAt = new Date();
    user.updatedBy = resetBy;
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;

    this.users.set(userId, user);

    this.logAudit({
      userId: resetBy,
      userName: 'Admin',
      action: 'reset_password',
      resource: 'user',
      resourceId: userId,
      success: true,
    });

    logger.info({ userId, resetBy }, 'Password reset');

    return this.sanitizeUser(user);
  }

  /**
   * Suspend user
   */
  static suspendUser(userId: string, suspendedBy: string): AdminUser | null {
    return this.updateUser(userId, { status: 'suspended' }, suspendedBy);
  }

  /**
   * Unsuspend user
   */
  static unsuspendUser(userId: string, unsuspendedBy: string): AdminUser | null {
    return this.updateUser(userId, { status: 'active' }, unsuspendedBy);
  }

  /**
   * Delete user
   */
  static deleteUser(userId: string, deletedBy: string): AdminUser | null {
    const user = this.users.get(userId);

    if (!user || user.status === 'deleted') {
      return null;
    }

    user.status = 'deleted';
    user.deletedAt = new Date();
    user.deletedBy = deletedBy;

    this.users.set(userId, user);

    this.logAudit({
      userId: deletedBy,
      userName: 'Admin',
      action: 'delete_user',
      resource: 'user',
      resourceId: userId,
      success: true,
    });

    logger.info({ userId, deletedBy }, 'User deleted');

    return this.sanitizeUser(user);
  }

  /**
   * Check permission
   */
  static hasPermission(userId: string, permission: Permission): boolean {
    const user = this.users.get(userId);

    if (!user || user.status !== 'active') {
      return false;
    }

    return user.permissions.includes(permission);
  }

  /**
   * Sanitize user (remove sensitive data)
   */
  private static sanitizeUser(user: AdminUser): AdminUser {
    const { passwordHash, mfaSecret, ...sanitized } = user;
    return sanitized as AdminUser;
  }

  // ========== Audit Logging ==========

  /**
   * Log audit
   */
  static logAudit(
    entry: Omit<AuditLog, 'id' | 'timestamp'>
  ): AuditLog {
    const log: AuditLog = {
      id: crypto.randomUUID(),
      ...entry,
      timestamp: new Date(),
    };

    this.auditLogs.push(log);

    // Clean up old logs
    const cutoff = new Date(Date.now() - this.AUDIT_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    this.auditLogs = this.auditLogs.filter((l) => l.timestamp >= cutoff);

    logger.info({ auditId: log.id, action: entry.action, userId: entry.userId }, 'Audit logged');

    return log;
  }

  /**
   * Get audit logs
   */
  static getAuditLogs(
    filters?: {
      userId?: string;
      action?: string;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): AuditLog[] {
    let logs = this.auditLogs;

    if (filters) {
      if (filters.userId) {
        logs = logs.filter((l) => l.userId === filters.userId);
      }

      if (filters.action) {
        logs = logs.filter((l) => l.action === filters.action);
      }

      if (filters.resource) {
        logs = logs.filter((l) => l.resource === filters.resource);
      }

      if (filters.startDate) {
        logs = logs.filter((l) => l.timestamp >= filters.startDate!);
      }

      if (filters.endDate) {
        logs = logs.filter((l) => l.timestamp <= filters.endDate!);
      }
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // ========== System Operations ==========

  /**
   * Execute system operation
   */
  static async executeOperation(
    operation: SystemOperation,
    userId: string,
    params?: Record<string, any>
  ): Promise<OperationResult> {
    const startedAt = new Date();

    this.logAudit({
      userId,
      userName: 'Admin',
      action: 'execute_operation',
      resource: 'system',
      details: { operation, params },
      success: true,
    });

    logger.info({ operation, userId, params }, 'Executing system operation');

    let result: Partial<OperationResult> = {
      operation,
      startedAt,
    };

    try {
      switch (operation) {
        case 'clear_cache':
          result = await this.clearCache(params);
          break;

        case 'rebuild_indexes':
          result = await this.rebuildIndexes(params);
          break;

        case 'vacuum_database':
          result = await this.vacuumDatabase(params);
          break;

        case 'run_migrations':
          result = await this.runMigrations(params);
          break;

        case 'export_data':
          result = await this.exportData(params);
          break;

        case 'import_data':
          result = await this.importData(params);
          break;

        case 'backup_database':
          result = await this.backupDatabase(params);
          break;

        case 'restore_database':
          result = await this.restoreDatabase(params);
          break;

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      const completedAt = new Date();

      return {
        success: true,
        operation,
        startedAt,
        completedAt,
        duration: completedAt.getTime() - startedAt.getTime(),
        ...result,
      };
    } catch (error: any) {
      const completedAt = new Date();

      logger.error({ operation, error: error.message }, 'System operation failed');

      return {
        success: false,
        operation,
        startedAt,
        completedAt,
        duration: completedAt.getTime() - startedAt.getTime(),
        error: error.message,
      };
    }
  }

  /**
   * Clear cache
   */
  private static async clearCache(params?: Record<string, any>): Promise<Partial<OperationResult>> {
    // In production, clear Redis/Memcached
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      message: 'Cache cleared successfully',
      details: { cacheType: params?.cacheType || 'all' },
    };
  }

  /**
   * Rebuild indexes
   */
  private static async rebuildIndexes(params?: Record<string, any>): Promise<Partial<OperationResult>> {
    // In production, rebuild database indexes
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      message: 'Indexes rebuilt successfully',
      details: { tables: params?.tables || 'all', indexesRebuilt: 15 },
    };
  }

  /**
   * Vacuum database
   */
  private static async vacuumDatabase(params?: Record<string, any>): Promise<Partial<OperationResult>> {
    // In production, run VACUUM on PostgreSQL
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return {
      message: 'Database vacuumed successfully',
      details: { spaceReclaimed: '125 MB' },
    };
  }

  /**
   * Run migrations
   */
  private static async runMigrations(params?: Record<string, any>): Promise<Partial<OperationResult>> {
    // In production, run pending database migrations
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      message: 'Migrations completed successfully',
      details: { migrationsRun: 3 },
    };
  }

  /**
   * Export data
   */
  private static async exportData(params?: Record<string, any>): Promise<Partial<OperationResult>> {
    // In production, export data to file
    await new Promise((resolve) => setTimeout(resolve, 5000));

    return {
      message: 'Data exported successfully',
      details: {
        format: params?.format || 'json',
        records: 10000,
        fileSize: '25 MB',
        filePath: '/exports/data_export_' + Date.now() + '.json',
      },
    };
  }

  /**
   * Import data
   */
  private static async importData(params?: Record<string, any>): Promise<Partial<OperationResult>> {
    // In production, import data from file
    await new Promise((resolve) => setTimeout(resolve, 7000));

    return {
      message: 'Data imported successfully',
      details: {
        recordsImported: params?.recordCount || 5000,
        recordsFailed: 12,
      },
    };
  }

  /**
   * Backup database
   */
  private static async backupDatabase(params?: Record<string, any>): Promise<Partial<OperationResult>> {
    // In production, create database backup
    await new Promise((resolve) => setTimeout(resolve, 10000));

    return {
      message: 'Database backup created successfully',
      details: {
        backupFile: `/backups/db_backup_${Date.now()}.sql`,
        backupSize: '500 MB',
        compressed: true,
      },
    };
  }

  /**
   * Restore database
   */
  private static async restoreDatabase(params?: Record<string, any>): Promise<Partial<OperationResult>> {
    // In production, restore database from backup
    await new Promise((resolve) => setTimeout(resolve, 15000));

    return {
      message: 'Database restored successfully',
      details: {
        backupFile: params?.backupFile,
        restoredAt: new Date(),
      },
    };
  }

  // ========== Bulk Operations ==========

  /**
   * Create bulk operation
   */
  static createBulkOperation(
    type: BulkOperation['type'],
    resource: string,
    criteria: Record<string, any>,
    updates: Record<string, any> | undefined,
    createdBy: string
  ): BulkOperation {
    const operation: BulkOperation = {
      id: crypto.randomUUID(),
      type,
      resource,
      criteria,
      updates,
      status: 'pending',
      totalRecords: 0,
      processedRecords: 0,
      failedRecords: 0,
      createdBy,
    };

    this.bulkOperations.set(operation.id, operation);

    logger.info({ operationId: operation.id, type, resource }, 'Bulk operation created');

    // Execute async
    this.executeBulkOperation(operation.id);

    return operation;
  }

  /**
   * Execute bulk operation
   */
  private static async executeBulkOperation(operationId: string): Promise<void> {
    const operation = this.bulkOperations.get(operationId);

    if (!operation) {
      return;
    }

    operation.status = 'running';
    operation.startedAt = new Date();

    this.bulkOperations.set(operationId, operation);

    try {
      // In production, process actual records
      // For now, simulate processing
      operation.totalRecords = 1000;

      for (let i = 0; i < operation.totalRecords; i++) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        operation.processedRecords++;

        if (Math.random() < 0.01) {
          operation.failedRecords++;
        }

        this.bulkOperations.set(operationId, operation);
      }

      operation.status = 'completed';
      operation.completedAt = new Date();
    } catch (error: any) {
      operation.status = 'failed';
      operation.error = error.message;
      operation.completedAt = new Date();
    }

    this.bulkOperations.set(operationId, operation);

    logger.info({ operationId, status: operation.status }, 'Bulk operation completed');
  }

  /**
   * Get bulk operation
   */
  static getBulkOperation(operationId: string): BulkOperation | null {
    return this.bulkOperations.get(operationId) || null;
  }

  /**
   * List bulk operations
   */
  static listBulkOperations(userId?: string): BulkOperation[] {
    let operations = Array.from(this.bulkOperations.values());

    if (userId) {
      operations = operations.filter((o) => o.createdBy === userId);
    }

    return operations.sort((a, b) => {
      const aTime = a.startedAt?.getTime() || 0;
      const bTime = b.startedAt?.getTime() || 0;
      return bTime - aTime;
    });
  }

  // ========== Statistics ==========

  /**
   * Get admin statistics
   */
  static getStatistics(): {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    usersByRole: Record<UserRole, number>;
    auditLogsToday: number;
    totalAuditLogs: number;
  } {
    const users = Array.from(this.users.values()).filter((u) => u.status !== 'deleted');

    const usersByRole: Record<UserRole, number> = {
      super_admin: 0,
      admin: 0,
      manager: 0,
      provider: 0,
      staff: 0,
      user: 0,
    };

    users.forEach((u) => {
      usersByRole[u.role]++;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const auditLogsToday = this.auditLogs.filter((l) => l.timestamp >= today).length;

    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === 'active').length,
      suspendedUsers: users.filter((u) => u.status === 'suspended').length,
      usersByRole,
      auditLogsToday,
      totalAuditLogs: this.auditLogs.length,
    };
  }
}
