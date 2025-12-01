/**
 * Authentication Repository
 *
 * SECURITY: This repository provides cross-tenant access ONLY for authentication flows.
 * All access is audit logged for HIPAA compliance.
 *
 * USE CASES:
 * 1. User login - need to find user by email before we know their tenant
 * 2. Token validation - need to validate session before establishing tenant context
 * 3. Password reset - need to find user by email/token
 * 4. Platform admin operations - explicitly authorized cross-tenant access
 *
 * WARNING: Do NOT use this repository for any other purpose.
 * For tenant-scoped operations, use the appropriate domain repository.
 */

import { db } from '../db';
import { users, userRoles, sessions } from '@shared/schema';
import type { User, UserWithRoles } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { createLogger } from '../utils/logger';
import { normalizeEmail } from '../utils/normalizeEmail';

const logger = createLogger('AuthRepository');

/**
 * Audit log entry for authentication repository access
 */
interface AuthAuditEntry {
  action: string;
  targetUserId?: string;
  targetEmail?: string;
  requestingUserId?: string;
  requestingIp?: string;
  reason: string;
  timestamp: Date;
  success: boolean;
  metadata?: Record<string, any>;
}

/**
 * Log authentication-related access for HIPAA compliance
 */
async function auditAuthAccess(entry: AuthAuditEntry): Promise<void> {
  try {
    // Log to application logs
    logger.info({
      audit: true,
      hipaa: true,
      ...entry,
    }, `Auth access: ${entry.action}`);

    // TODO: In production, also log to database audit table
    // await db.insert(authAuditLogs).values(entry);

    // TODO: In production, send to SIEM if configured
    // if (process.env.SIEM_ENDPOINT) {
    //   await sendToSIEM(entry);
    // }
  } catch (error) {
    // Never let audit logging failure break auth
    logger.error({ err: error }, 'Failed to write auth audit log');
  }
}

/**
 * Authentication Repository
 *
 * Provides AUDITED cross-tenant access for authentication flows only.
 */
export class AuthRepository {
  /**
   * Find user by email for login
   *
   * SECURITY: This is used during login before we know the user's tenant.
   * All access is audit logged.
   *
   * @param email - The email address to search for
   * @param requestContext - Context for audit logging
   */
  async findUserByEmail(
    email: string,
    requestContext: { ip?: string; userAgent?: string; reason?: string }
  ): Promise<User | undefined> {
    const normalizedEmail = normalizeEmail(email);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail));

    await auditAuthAccess({
      action: 'FIND_USER_BY_EMAIL',
      targetEmail: normalizedEmail,
      targetUserId: user?.id,
      requestingIp: requestContext.ip,
      reason: requestContext.reason || 'Authentication lookup',
      timestamp: new Date(),
      success: !!user,
      metadata: { userAgent: requestContext.userAgent },
    });

    return user;
  }

  /**
   * Find user by ID for session validation
   *
   * SECURITY: This is used during token/session validation.
   * The session token itself provides authorization; this just fetches the user data.
   *
   * @param userId - The user ID to find
   * @param requestContext - Context for audit logging
   */
  async findUserById(
    userId: string,
    requestContext: { sessionId?: string; ip?: string; reason?: string }
  ): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    await auditAuthAccess({
      action: 'FIND_USER_BY_ID',
      targetUserId: userId,
      requestingIp: requestContext.ip,
      reason: requestContext.reason || 'Session validation',
      timestamp: new Date(),
      success: !!user,
      metadata: { sessionId: requestContext.sessionId },
    });

    return user;
  }

  /**
   * Find user with roles for session establishment
   *
   * SECURITY: Returns user with all available roles for session setup.
   * Used after successful authentication to populate the user session.
   *
   * @param userId - The user ID to find
   * @param requestContext - Context for audit logging
   */
  async findUserWithRoles(
    userId: string,
    requestContext: { sessionId?: string; ip?: string; reason?: string }
  ): Promise<UserWithRoles | undefined> {
    const user = await this.findUserById(userId, {
      ...requestContext,
      reason: requestContext.reason || 'Session establishment with roles',
    });

    if (!user) return undefined;

    // Get all available roles for this user
    const roles = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId));

    const roleSet = new Set(roles.map(r => r.role));
    if (user.role) {
      roleSet.add(user.role);
    }

    return {
      ...user,
      availableRoles: Array.from(roleSet),
    };
  }

  /**
   * Validate session exists and is not expired
   *
   * SECURITY: Used by session middleware to validate session tokens.
   * Returns minimal data needed for validation.
   *
   * @param sessionId - The session ID to validate
   */
  async validateSession(
    sessionId: string
  ): Promise<{ userId: string; expires: Date } | undefined> {
    const [session] = await db
      .select({
        userId: sessions.userId,
        expire: sessions.expire,
      })
      .from(sessions)
      .where(eq(sessions.sid, sessionId));

    if (!session) return undefined;

    // Check if session is expired
    if (new Date(session.expire) < new Date()) {
      return undefined;
    }

    return {
      userId: session.userId,
      expires: new Date(session.expire),
    };
  }

  /**
   * Platform admin: Find any user (with full audit trail)
   *
   * SECURITY: Only for platform admins performing cross-tenant operations.
   * Requires explicit admin ID for audit trail.
   *
   * @param targetUserId - The user ID to find
   * @param adminUserId - The platform admin performing the lookup
   * @param reason - Business reason for the access (required for audit)
   */
  async platformAdminFindUser(
    targetUserId: string,
    adminUserId: string,
    reason: string
  ): Promise<User | undefined> {
    // Verify the requester is a platform admin
    const [admin] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.id, adminUserId),
        eq(users.role, 'platform_admin')
      ));

    if (!admin) {
      await auditAuthAccess({
        action: 'PLATFORM_ADMIN_FIND_USER_DENIED',
        targetUserId,
        requestingUserId: adminUserId,
        reason: 'Non-admin attempted platform admin lookup',
        timestamp: new Date(),
        success: false,
      });
      throw new Error('Unauthorized: Only platform admins can perform this operation');
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId));

    await auditAuthAccess({
      action: 'PLATFORM_ADMIN_FIND_USER',
      targetUserId,
      requestingUserId: adminUserId,
      reason,
      timestamp: new Date(),
      success: !!user,
    });

    return user;
  }

  /**
   * Platform admin: Find user by email (with full audit trail)
   *
   * @param email - The email to search for
   * @param adminUserId - The platform admin performing the lookup
   * @param reason - Business reason for the access
   */
  async platformAdminFindUserByEmail(
    email: string,
    adminUserId: string,
    reason: string
  ): Promise<User | undefined> {
    // Verify the requester is a platform admin
    const [admin] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.id, adminUserId),
        eq(users.role, 'platform_admin')
      ));

    if (!admin) {
      await auditAuthAccess({
        action: 'PLATFORM_ADMIN_FIND_BY_EMAIL_DENIED',
        targetEmail: email,
        requestingUserId: adminUserId,
        reason: 'Non-admin attempted platform admin lookup',
        timestamp: new Date(),
        success: false,
      });
      throw new Error('Unauthorized: Only platform admins can perform this operation');
    }

    const normalizedEmail = normalizeEmail(email);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail));

    await auditAuthAccess({
      action: 'PLATFORM_ADMIN_FIND_BY_EMAIL',
      targetEmail: normalizedEmail,
      targetUserId: user?.id,
      requestingUserId: adminUserId,
      reason,
      timestamp: new Date(),
      success: !!user,
    });

    return user;
  }
}

// Export singleton instance
export const authRepository = new AuthRepository();

// Export class for testing
export default AuthRepository;
