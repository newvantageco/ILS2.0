/**
 * JWT Authentication Routes
 *
 * Provides token-based authentication endpoints:
 * - Login with email/password → returns JWT tokens
 * - Token refresh → returns new JWT tokens
 * - Logout (client-side token deletion)
 * - Token verification
 */

import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { jwtService } from '../services/JWTService.js';
import { authenticateJWT, type AuthenticatedRequest } from '../middleware/auth-jwt.js';
import { pool } from '../db.js';
import { createLogger } from '../utils/logger.js';

const router = Router();
const logger = createLogger('auth-jwt');

// ============================================
// ACCOUNT LOCKOUT SYSTEM
// ============================================
// In-memory storage for development. In production, use Redis.
// Tracks failed login attempts and account lockouts

interface LoginAttemptTracker {
  attempts: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

const loginAttempts: Map<string, LoginAttemptTracker> = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes - reset attempts after this

/**
 * Check if an account is currently locked
 */
function isAccountLocked(email: string): { locked: boolean; remainingMs?: number } {
  const tracker = loginAttempts.get(email.toLowerCase());
  if (!tracker || !tracker.lockedUntil) {
    return { locked: false };
  }

  const now = Date.now();
  if (now >= tracker.lockedUntil) {
    // Lockout expired, reset
    loginAttempts.delete(email.toLowerCase());
    return { locked: false };
  }

  return {
    locked: true,
    remainingMs: tracker.lockedUntil - now
  };
}

/**
 * Record a failed login attempt
 */
function recordFailedAttempt(email: string): { locked: boolean; attemptsLeft: number } {
  const normalizedEmail = email.toLowerCase();
  const now = Date.now();

  let tracker = loginAttempts.get(normalizedEmail);

  if (!tracker || (now - tracker.lastAttempt > ATTEMPT_WINDOW_MS)) {
    // Reset if first attempt or outside window
    tracker = { attempts: 0, lastAttempt: now, lockedUntil: null };
  }

  tracker.attempts++;
  tracker.lastAttempt = now;

  if (tracker.attempts >= MAX_FAILED_ATTEMPTS) {
    tracker.lockedUntil = now + LOCKOUT_DURATION_MS;
    loginAttempts.set(normalizedEmail, tracker);

    // Schedule cleanup
    setTimeout(() => {
      loginAttempts.delete(normalizedEmail);
    }, LOCKOUT_DURATION_MS);

    logger.warn(`Account locked due to too many failed attempts: ${email}`);
    return { locked: true, attemptsLeft: 0 };
  }

  loginAttempts.set(normalizedEmail, tracker);
  return { locked: false, attemptsLeft: MAX_FAILED_ATTEMPTS - tracker.attempts };
}

/**
 * Clear failed attempts on successful login
 */
function clearFailedAttempts(email: string): void {
  loginAttempts.delete(email.toLowerCase());
}

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(12, 'Password must be at least 12 characters')
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

/**
 * POST /api/auth/login
 *
 * Login with email and password, returns JWT tokens
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "accessToken": "eyJ...",
 *   "refreshToken": "eyJ...",
 *   "expiresIn": 604800,
 *   "user": {
 *     "id": "...",
 *     "email": "...",
 *     "firstName": "...",
 *     "lastName": "...",
 *     "role": "...",
 *     "companyId": "..."
 *   }
 * }
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const { email, password } = validationResult.data;

    logger.info(`Login attempt for: ${email}`);

    // SECURITY: Check if account is locked due to too many failed attempts
    const lockStatus = isAccountLocked(email);
    if (lockStatus.locked) {
      const remainingMinutes = Math.ceil((lockStatus.remainingMs || 0) / 60000);
      logger.warn(`Login blocked: Account locked - ${email}, ${remainingMinutes} minutes remaining`);
      return res.status(429).json({
        success: false,
        error: `Account is temporarily locked due to too many failed login attempts. Try again in ${remainingMinutes} minutes.`,
        code: 'ACCOUNT_LOCKED',
        lockedUntil: Date.now() + (lockStatus.remainingMs || 0)
      });
    }

    // Get user from database using raw SQL (bypassing broken schema)
    const userResult = await pool.query(
      'SELECT id, email, password, first_name, last_name, role, company_id, is_active, is_verified, last_login_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    const user = userResult.rows[0];

    if (!user) {
      // Record failed attempt even for non-existent users (prevents user enumeration timing attacks)
      const result = recordFailedAttempt(email);
      logger.warn(`Login failed: User not found - ${email}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        attemptsRemaining: result.attemptsLeft
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const result = recordFailedAttempt(email);
      logger.warn(`Login failed: Invalid password - ${email}, ${result.attemptsLeft} attempts remaining`);

      if (result.locked) {
        return res.status(429).json({
          success: false,
          error: 'Account is now locked due to too many failed login attempts. Try again in 30 minutes.',
          code: 'ACCOUNT_LOCKED',
          lockedUntil: Date.now() + LOCKOUT_DURATION_MS
        });
      }

      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        attemptsRemaining: result.attemptsLeft
      });
    }

    // Check if user is active
    if (!user.is_active) {
      logger.warn(`Login failed: User inactive - ${email}`);
      return res.status(401).json({
        success: false,
        error: 'Account is inactive. Please contact support.'
      });
    }

    // SECURITY: Check if email is verified (skip for platform admins and Google OAuth users)
    // Platform admins may be created via CLI/scripts without email verification
    // Google OAuth users have verified emails through Google
    const isPlatformAdmin = user.role === 'platform_admin';
    const isGoogleOAuthUser = !user.password; // Google OAuth users don't have passwords

    if (!user.is_verified && !isPlatformAdmin && !isGoogleOAuthUser) {
      logger.warn(`Login failed: Email not verified - ${email}`);
      return res.status(403).json({
        success: false,
        error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // SECURITY: Clear failed attempts on successful login
    clearFailedAttempts(email);

    // Get user permissions based on role
    const permissions = getUserPermissions(user.role);

    // Generate JWT tokens
    const tokens = jwtService.generateTokenPair({
      userId: user.id,
      companyId: user.company_id,
      email: user.email,
      role: user.role,
      permissions
    });

    // Update last login time using raw SQL
    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Note: Skipping audit log creation to avoid broken ORM schema
    // TODO: Replace with raw SQL audit log insertion when needed

    logger.info(`Login successful: ${email}`);

    // Return tokens and user info
    res.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        companyId: user.company_id,
        permissions
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    logger.error(`Login error: ${errorMessage}`, { stack: errorStack });
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
});

/**
 * POST /api/auth/refresh
 *
 * Refresh access token using refresh token
 *
 * Request body:
 * {
 *   "refreshToken": "eyJ..."
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "accessToken": "eyJ...",
 *   "refreshToken": "eyJ...",
 *   "expiresIn": 604800
 * }
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = refreshSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const { refreshToken } = validationResult.data;

    logger.debug('Token refresh requested');

    // Refresh tokens
    const newTokens = jwtService.refreshTokens(refreshToken);

    logger.info('Token refresh successful');

    res.json({
      success: true,
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      expiresIn: newTokens.expiresIn
    });

  } catch (error) {
    logger.error('Token refresh error:', error);

    if (error instanceof Error) {
      if (error.message === 'TOKEN_EXPIRED') {
        return res.status(401).json({
          success: false,
          error: 'Refresh token expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      if (error.message === 'TOKEN_INVALID') {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
          code: 'TOKEN_INVALID'
        });
      }
    }

    res.status(401).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
});

/**
 * POST /api/auth/logout
 *
 * Logout and revoke tokens
 * Adds the access token to the blacklist so it cannot be reused
 */
router.post('/logout', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const token = (req as AuthenticatedRequest).token;

    if (user && token) {
      // SECURITY: Revoke the access token so it cannot be reused
      jwtService.revokeToken(token);

      // Also revoke refresh token if present in cookies
      const refreshToken = req.cookies?.refresh_token;
      if (refreshToken) {
        jwtService.revokeToken(refreshToken);
      }

      // Log logout event with revocation info
      await storage.createAuditLog({
        userId: user.id,
        companyId: user.company_id,
        eventType: 'logout',
        eventCategory: 'authentication',
        description: 'User logged out - tokens revoked',
        metadata: {
          email: user.email,
          tokenRevoked: true,
          refreshTokenRevoked: !!refreshToken
        }
      });

      logger.info(`Logout + tokens revoked: ${user.email}`);
    }

    // Clear cookies
    res.clearCookie('auth_token');
    res.clearCookie('access_token');
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * GET /api/auth/verify
 *
 * Verify current JWT token and return user info
 */
router.get('/verify', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.company_id,
        permissions: user.permissions
      }
    });

  } catch (error) {
    logger.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
});

/**
 * GET /api/auth/me
 *
 * Get current user profile
 */
router.get('/me', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const authUser = (req as AuthenticatedRequest).user;

    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    // Get full user profile from database
    const user = await storage.getUser(authUser.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        companyId: user.company_id,
        isActive: user.is_active,
        lastLoginAt: user.last_login_at,
        permissions: authUser.permissions
      }
    });

  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

/**
 * Helper function to get user permissions based on role
 */
function getUserPermissions(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    'super_admin': [
      'admin.all',
      'company.all',
      'user.all',
      'data.all',
      'settings.all',
      'reports.all',
      'ai.all'
    ],
    'admin': [
      'company.manage',
      'user.manage',
      'data.all',
      'settings.manage',
      'reports.all',
      'ai.use'
    ],
    'manager': [
      'user.view',
      'data.manage',
      'reports.view',
      'ai.use'
    ],
    'staff': [
      'data.view',
      'data.create',
      'data.update',
      'reports.view',
      'ai.use'
    ],
    'user': [
      'data.view',
      'reports.view'
    ]
  };

  return rolePermissions[role] || rolePermissions['user'];
}

// ============================================
// PASSWORD SETUP (for new users invited via email)
// ============================================

/**
 * Setup token validation schema
 */
const setupTokenSchema = z.object({
  token: z.string().min(1, 'Token is required')
});

/**
 * Password setup schema
 */
const setupPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/\d/, 'Password must contain a number')
});

/**
 * POST /api/auth/validate-setup-token
 *
 * Validates a password setup token from welcome email
 */
router.post('/validate-setup-token', async (req: Request, res: Response) => {
  try {
    const validationResult = setupTokenSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        valid: false,
        error: 'Invalid token format'
      });
    }

    const { token } = validationResult.data;

    // Decode and verify the setup token (JWT-based)
    try {
      const payload = jwtService.verifyToken(token);

      // Check if this is a setup token
      if ((payload as any).type !== 'password_setup') {
        return res.status(400).json({
          valid: false,
          error: 'Invalid token type'
        });
      }

      // Find the user
      const user = await storage.getUserByEmail((payload as any).setupEmail);
      if (!user) {
        return res.status(400).json({
          valid: false,
          error: 'User not found'
        });
      }

      // Check if password is already set (user already completed setup)
      if (user.password && user.password.length > 0) {
        return res.status(400).json({
          valid: false,
          error: 'Password already set. Please login instead.'
        });
      }

      res.json({
        valid: true,
        email: user.email,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim()
      });

    } catch (tokenError) {
      logger.debug('Setup token validation failed:', tokenError);
      return res.status(400).json({
        valid: false,
        error: 'Token is invalid or expired'
      });
    }

  } catch (error) {
    logger.error('Setup token validation error:', error);
    res.status(500).json({
      valid: false,
      error: 'Validation failed'
    });
  }
});

/**
 * POST /api/auth/setup-password
 *
 * Sets password for a new user invited via email
 */
router.post('/setup-password', async (req: Request, res: Response) => {
  try {
    const validationResult = setupPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const { token, password } = validationResult.data;

    // Verify the setup token
    let payload: any;
    try {
      payload = jwtService.verifyToken(token);

      if (payload.type !== 'password_setup') {
        return res.status(400).json({
          success: false,
          error: 'Invalid token type'
        });
      }
    } catch (tokenError) {
      return res.status(400).json({
        success: false,
        error: 'Token is invalid or expired'
      });
    }

    // Find the user
    const user = await storage.getUserByEmail(payload.setupEmail);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if password is already set
    if (user.password && user.password.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Password already set. Please login instead.'
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    await storage.updateUser(user.id, {
      password: hashedPassword,
      isVerified: true, // Mark as verified since they've completed setup
      accountStatus: 'active'
    });

    // Create audit log
    await storage.createAuditLog({
      userId: user.id,
      companyId: user.company_id,
      eventType: 'password_setup',
      eventCategory: 'authentication',
      description: 'User completed initial password setup',
      metadata: {
        email: user.email,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    logger.info(`Password setup completed for: ${user.email}`);

    res.json({
      success: true,
      message: 'Password set successfully. You can now login.'
    });

  } catch (error) {
    logger.error('Password setup error:', error);
    res.status(500).json({
      success: false,
      error: 'Password setup failed. Please try again.'
    });
  }
});

/**
 * Generate a password setup token for a user
 * This is called when admin creates a new user
 */
export function generatePasswordSetupToken(email: string): string {
  const payload = {
    setupEmail: email,
    type: 'password_setup',
    userId: '', // Will be filled by JWTService
    companyId: '',
    email: email,
    role: 'pending',
    permissions: []
  };

  // Generate token that expires in 24 hours
  const token = jwtService.generateAccessToken(payload);
  return token;
}

export default router;
