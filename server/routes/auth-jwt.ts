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
import { storage } from '../storage.js';
import { createLogger } from '../utils/logger.js';

const router = Router();
const logger = createLogger('auth-jwt');

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
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

    // Get user from database
    const user = await storage.getUserByEmail(email.toLowerCase());

    if (!user) {
      logger.warn(`Login failed: User not found - ${email}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      logger.warn(`Login failed: Invalid password - ${email}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn(`Login failed: User inactive - ${email}`);
      return res.status(401).json({
        success: false,
        error: 'Account is inactive. Please contact support.'
      });
    }

    // Get user permissions based on role
    const permissions = getUserPermissions(user.role);

    // Generate JWT tokens
    const tokens = jwtService.generateTokenPair({
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role,
      permissions
    });

    // Update last login time
    await storage.updateUser(user.id, {
      lastLoginAt: new Date()
    });

    // Log successful login
    await storage.createAuditLog({
      userId: user.id,
      companyId: user.companyId,
      eventType: 'login',
      eventCategory: 'authentication',
      description: 'User logged in with JWT',
      metadata: {
        email: user.email,
        loginMethod: 'jwt',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

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
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        permissions
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
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
        companyId: user.companyId,
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
        companyId: user.companyId,
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
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
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

export default router;
