/**
 * MFA Enforcement Middleware
 * 
 * Enforces multi-factor authentication (MFA) for privileged accounts.
 * Implements OWASP authentication best practices for admin/privileged roles.
 * 
 * Security Requirements:
 * - MFA mandatory for platform_admin and admin roles
 * - Session-based MFA verification tracking
 * - Grace period for MFA setup (7 days)
 * - Audit logging for MFA events
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { logger, logSecurityEvent } from '../utils/logger';

/**
 * Extended Request type with user and session info
 */
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    companyId?: string;
  };
  session?: {
    mfaVerified?: boolean;
    mfaVerifiedAt?: Date;
    userId?: string;
  } & Express.Session;
}

/**
 * Roles that require MFA enforcement
 */
const MFA_REQUIRED_ROLES = [
  'platform_admin',
  'admin',
  'super_admin',
] as const;

/**
 * Grace period for new admin users to set up MFA (7 days)
 */
const MFA_SETUP_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * MFA verification timeout - require re-verification after 24 hours
 */
const MFA_VERIFICATION_TIMEOUT_MS = 24 * 60 * 60 * 1000;

/**
 * Check if user role requires MFA
 */
function roleRequiresMFA(role: string): boolean {
  return MFA_REQUIRED_ROLES.includes(role as any);
}

/**
 * Check if user is within MFA setup grace period
 */
function isWithinGracePeriod(userCreatedAt: Date): boolean {
  const now = Date.now();
  const createdAt = new Date(userCreatedAt).getTime();
  return (now - createdAt) < MFA_SETUP_GRACE_PERIOD_MS;
}

/**
 * Check if MFA verification is still valid
 */
function isMFAVerificationValid(verifiedAt?: Date): boolean {
  if (!verifiedAt) return false;
  
  const now = Date.now();
  const verified = new Date(verifiedAt).getTime();
  return (now - verified) < MFA_VERIFICATION_TIMEOUT_MS;
}

/**
 * Middleware: Require MFA for privileged roles
 * 
 * Usage:
 * ```typescript
 * app.use('/api/admin/*', requireAuth, requireMFA);
 * app.use('/api/system-admin/*', requireAuth, requireMFA);
 * ```
 */
export async function requireMFA(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  
  // Check authentication first
  if (!authReq.user) {
    res.status(401).json({ 
      error: 'Authentication required',
      message: 'You must be logged in to access this resource'
    });
    return;
  }
  
  const { id: userId, role, email } = authReq.user;
  
  // Skip MFA for non-privileged roles
  if (!roleRequiresMFA(role)) {
    next();
    return;
  }
  
  try {
    // Fetch user's MFA status from database
    const [dbUser] = await db
      .select({
        mfaEnabled: users.mfaEnabled,
        mfaSecret: users.mfaSecret,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!dbUser) {
      logger.error({ userId, email }, 'User not found during MFA check');
      res.status(401).json({ error: 'User not found' });
      return;
    }
    
    // Check if user has MFA enabled
    if (!dbUser.mfaEnabled || !dbUser.mfaSecret) {
      // Allow grace period for new admin users
      if (isWithinGracePeriod(dbUser.createdAt)) {
        const daysRemaining = Math.ceil(
          (MFA_SETUP_GRACE_PERIOD_MS - (Date.now() - new Date(dbUser.createdAt).getTime())) 
          / (24 * 60 * 60 * 1000)
        );
        
        logger.warn(
          { userId, email, role, daysRemaining },
          'Admin user accessing system without MFA (within grace period)'
        );
        
        // Set warning header
        res.setHeader('X-MFA-Warning', `MFA setup required in ${daysRemaining} days`);
        next();
        return;
      }
      
      // Grace period expired - enforce MFA setup
      logSecurityEvent(
        'mfa_enforcement_block',
        'high',
        { userId, email, role, reason: 'MFA not enabled' }
      );
      
      res.status(403).json({
        error: 'MFA required',
        message: 'Multi-factor authentication must be enabled for your account',
        action: 'setup_mfa',
        setupUrl: '/settings/security/mfa',
        gracePeriodExpired: true,
      });
      return;
    }
    
    // Check if MFA was verified in current session
    const mfaVerified = authReq.session?.mfaVerified;
    const mfaVerifiedAt = authReq.session?.mfaVerifiedAt;
    
    if (!mfaVerified || !isMFAVerificationValid(mfaVerifiedAt)) {
      logSecurityEvent(
        'mfa_challenge_required',
        'medium',
        { 
          userId, 
          email, 
          role,
          sessionMfaVerified: mfaVerified,
          lastVerification: mfaVerifiedAt,
        }
      );
      
      res.status(403).json({
        error: 'MFA verification required',
        message: 'Please complete MFA challenge to access this resource',
        action: 'verify_mfa',
        challengeUrl: '/api/auth/mfa/challenge',
        sessionExpired: !isMFAVerificationValid(mfaVerifiedAt),
      });
      return;
    }
    
    // MFA verified - allow access
    logger.debug(
      { userId, email, role, verifiedAt: mfaVerifiedAt },
      'MFA verified - access granted'
    );
    
    next();
    
  } catch (error) {
    logger.error({ error, userId, email }, 'Error during MFA enforcement check');
    res.status(500).json({ 
      error: 'MFA verification failed',
      message: 'An error occurred while verifying multi-factor authentication'
    });
  }
}

/**
 * Middleware: Check MFA setup status (warning only)
 * 
 * Used on login to prompt users to set up MFA without blocking access.
 * 
 * Usage:
 * ```typescript
 * app.post('/api/auth/login', checkMFASetup, async (req, res) => { ... });
 * ```
 */
export async function checkMFASetup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.user) {
    next();
    return;
  }
  
  const { id: userId, role } = authReq.user;
  
  // Only check for privileged roles
  if (!roleRequiresMFA(role)) {
    next();
    return;
  }
  
  try {
    const [dbUser] = await db
      .select({
        mfaEnabled: users.mfaEnabled,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (dbUser && !dbUser.mfaEnabled) {
      const withinGracePeriod = isWithinGracePeriod(dbUser.createdAt);
      
      if (withinGracePeriod) {
        const daysRemaining = Math.ceil(
          (MFA_SETUP_GRACE_PERIOD_MS - (Date.now() - new Date(dbUser.createdAt).getTime())) 
          / (24 * 60 * 60 * 1000)
        );
        
        // Set response header to notify client
        res.setHeader('X-MFA-Setup-Warning', 'true');
        res.setHeader('X-MFA-Grace-Days-Remaining', daysRemaining.toString());
      }
    }
    
    next();
    
  } catch (error) {
    logger.error({ error, userId }, 'Error checking MFA setup status');
    // Don't block on error - log and continue
    next();
  }
}

/**
 * Mark MFA as verified in session (called by MFA verification endpoint)
 * 
 * Usage in auth routes:
 * ```typescript
 * app.post('/api/auth/mfa/verify', async (req, res) => {
 *   const valid = await verifyMFACode(req.body.code);
 *   if (valid) {
 *     markMFAVerified(req);
 *     res.json({ success: true });
 *   }
 * });
 * ```
 */
export function markMFAVerified(req: Request): void {
  const authReq = req as AuthenticatedRequest;
  
  if (authReq.session) {
    authReq.session.mfaVerified = true;
    authReq.session.mfaVerifiedAt = new Date();
    
    logSecurityEvent(
      'mfa_verified',
      'low',
      {
        userId: authReq.user?.id,
        email: authReq.user?.email,
        sessionId: authReq.session.id,
      }
    );
  }
}

/**
 * Clear MFA verification from session (called on sensitive operations)
 */
export function clearMFAVerification(req: Request): void {
  const authReq = req as AuthenticatedRequest;
  
  if (authReq.session) {
    authReq.session.mfaVerified = false;
    authReq.session.mfaVerifiedAt = undefined;
  }
}

/**
 * Get MFA enforcement status for user
 */
export async function getMFAStatus(userId: string): Promise<{
  required: boolean;
  enabled: boolean;
  verified: boolean;
  gracePeriod: boolean;
  daysRemaining?: number;
}> {
  const [user] = await db
    .select({
      role: users.role,
      mfaEnabled: users.mfaEnabled,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const required = roleRequiresMFA(user.role);
  const enabled = user.mfaEnabled || false;
  const withinGracePeriod = isWithinGracePeriod(user.createdAt);
  
  let daysRemaining: number | undefined;
  if (required && !enabled && withinGracePeriod) {
    daysRemaining = Math.ceil(
      (MFA_SETUP_GRACE_PERIOD_MS - (Date.now() - new Date(user.createdAt).getTime())) 
      / (24 * 60 * 60 * 1000)
    );
  }
  
  return {
    required,
    enabled,
    verified: false, // Session state not available here
    gracePeriod: withinGracePeriod,
    daysRemaining,
  };
}
