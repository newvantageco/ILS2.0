/**
 * Authentication Domain Routes
 *
 * Consolidates all authentication-related routes:
 * - JWT authentication
 * - Google OAuth
 * - Two-factor authentication
 * - Email verification
 *
 * @module routes/domains/auth
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import authJWTRoutes from '../../auth-jwt';
import twoFactorRoutes from '../../twoFactor';
import verificationRoutes from '../../verification';
import { registerGoogleAuthRoutes } from '../../google-auth';
import { authenticateJWT, type AuthenticatedRequest } from '../../../middleware/auth-jwt';
import { storage } from '../../../storage';
import { pool } from '../../../db';
import { jwtService } from '../../../services/JWTService';
import { createLogger } from '../../../utils/logger';
import { createAuditLog } from '../../../middleware/audit';

const router = Router();
const logger = createLogger('auth-domain');

// ============================================
// LOGIN-EMAIL ROUTE (Legacy compatibility)
// ============================================
// This provides backward compatibility for frontend calling /api/auth/login-email

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

/**
 * Helper function to get user permissions based on role
 */
function getUserPermissions(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    'platform_admin': ['admin.all', 'company.all', 'user.all', 'data.all', 'settings.all', 'reports.all', 'ai.all', 'subscription.exempt'],
    'super_admin': ['admin.all', 'company.all', 'user.all', 'data.all', 'settings.all', 'reports.all', 'ai.all'],
    'company_admin': ['company.manage', 'user.manage', 'data.all', 'settings.manage', 'reports.all', 'ai.use', 'orders.all', 'patients.all', 'inventory.all', 'prescriptions.all'],
    'admin': ['company.manage', 'user.manage', 'data.all', 'settings.manage', 'reports.all', 'ai.use'],
    'ecp': ['data.view', 'data.create', 'data.update', 'reports.view', 'ai.use', 'orders.view', 'orders.create', 'patients.view', 'patients.create', 'patients.update', 'prescriptions.view', 'prescriptions.create', 'examinations.view', 'examinations.create'],
    'lab_tech': ['data.view', 'data.update', 'reports.view', 'orders.view', 'orders.update', 'inventory.view', 'inventory.update'],
    'manager': ['user.view', 'data.manage', 'reports.view', 'ai.use'],
    'staff': ['data.view', 'data.create', 'data.update', 'reports.view', 'ai.use'],
    'user': ['data.view', 'reports.view']
  };
  return rolePermissions[role] || rolePermissions['user'];
}

/**
 * POST /api/auth/login-email
 * POST /api/auth/login
 *
 * Login with email and password - returns JWT tokens
 * This is a convenience route that mirrors /api/auth/jwt/login
 */
const loginHandler = async (req: Request, res: Response) => {
  try {
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
    const userResult = await pool.query(
      'SELECT id, email, password, first_name, last_name, role, company_id, is_active, is_verified, account_status FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    const user = userResult.rows[0];

    if (!user) {
      logger.warn(`Login failed: User not found - ${email}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Login failed: Invalid password - ${email}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
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

    // Check email verification (skip for platform admins)
    if (!user.is_verified && user.role !== 'platform_admin') {
      logger.warn(`Login failed: Email not verified - ${email}`);
      return res.status(403).json({
        success: false,
        error: 'Please verify your email address before logging in.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Get permissions and generate tokens
    const permissions = getUserPermissions(user.role);
    const tokens = jwtService.generateTokenPair({
      userId: user.id,
      companyId: user.company_id,
      email: user.email,
      role: user.role,
      permissions
    });

    // Update last login
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    logger.info(`Login successful: ${email}`);

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
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
};

// Register both /login and /login-email for compatibility
router.post('/login', loginHandler);
router.post('/login-email', loginHandler);

// JWT-based authentication (full routes including refresh, logout, etc.)
router.use('/jwt', authJWTRoutes);

// Two-factor authentication
router.use('/2fa', twoFactorRoutes);

// Email verification
router.use('/verify', verificationRoutes);

// ============================================
// COMPLETE SIGNUP (OAuth users)
// ============================================

/**
 * Complete signup validation schema
 */
const completeSignupSchema = z.object({
  role: z.enum(['ecp', 'lab_tech', 'engineer', 'supplier', 'admin', 'optometrist'], {
    errorMap: () => ({ message: 'Invalid role selected' })
  }),
  organizationName: z.string().optional(),
  subscriptionPlan: z.enum(['full', 'free_ecp'], {
    errorMap: () => ({ message: 'Invalid subscription plan' })
  }),
  adminSetupKey: z.string().optional(),
  gocNumber: z.string().optional()
});

/**
 * POST /api/auth/complete-signup
 *
 * Complete account setup for OAuth-authenticated users
 * Validates role, creates/assigns company, and activates account
 */
router.post('/complete-signup', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const authUser = (req as AuthenticatedRequest).user;

    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    // Validate request body
    const validationResult = completeSignupSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const { role, organizationName, subscriptionPlan, adminSetupKey, gocNumber } = validationResult.data;

    logger.info(`Complete signup attempt for: ${authUser.email}, role: ${role}`);

    // Get the full user from database
    const user = await storage.getUser(authUser.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // SECURITY: Validate admin setup key for admin role
    if (role === 'admin') {
      if (!adminSetupKey) {
        logger.warn(`Admin signup attempted without key: ${user.email}`);
        return res.status(400).json({
          success: false,
          error: 'Admin setup key is required for admin accounts'
        });
      }

      const expectedKey = process.env.ADMIN_SETUP_KEY;
      if (!expectedKey) {
        logger.error('ADMIN_SETUP_KEY not configured in environment');
        return res.status(500).json({
          success: false,
          error: 'Admin setup is not configured'
        });
      }

      if (adminSetupKey !== expectedKey) {
        logger.warn(`Invalid admin setup key attempted: ${user.email}`);
        return res.status(403).json({
          success: false,
          error: 'Invalid admin setup key'
        });
      }
    }

    // SECURITY: Validate GOC number for ECP/optometrist roles
    if ((role === 'ecp' || role === 'optometrist') && !gocNumber) {
      return res.status(400).json({
        success: false,
        error: 'GOC registration number is required for ECPs and optometrists'
      });
    }

    // BUSINESS LOGIC: Validate subscription plan matches role
    const isEcpRole = role === 'ecp' || role === 'optometrist';
    const requiredPlan = isEcpRole ? 'free_ecp' : 'full';

    if (subscriptionPlan !== requiredPlan) {
      return res.status(400).json({
        success: false,
        error: `${isEcpRole ? 'ECP roles require free_ecp plan' : 'Non-ECP roles require full plan'}`
      });
    }

    // Handle company creation or assignment
    let companyId = user.companyId;

    if (!companyId && organizationName) {
      // Create a new company for this user
      try {
        const newCompany = await storage.createCompany({
          name: organizationName,
          type: isEcpRole ? 'ecp' : 'lab',
          status: role === 'admin' ? 'active' : 'pending_approval',
          email: user.email,
          subscriptionPlan: subscriptionPlan,
          gocNumber: gocNumber || null
        });
        companyId = newCompany.id;
        logger.info(`Created new company: ${organizationName} (${newCompany.id})`);
      } catch (error) {
        logger.error('Failed to create company:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to create organization'
        });
      }
    }

    // Update user with role and account status
    const accountStatus = role === 'admin' ? 'active' : 'pending_approval';
    const isActive = role === 'admin';

    const updateData: Partial<typeof user> = {
      role: role as any,
      subscriptionPlan: subscriptionPlan as any,
      accountStatus: accountStatus as any,
      isActive,
      updatedAt: new Date()
    };

    if (companyId) {
      updateData.companyId = companyId;
    }

    if (gocNumber) {
      updateData.gocNumber = gocNumber;
    }

    const updatedUser = await storage.updateUser(user.id, updateData);

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update user account'
      });
    }

    // Create audit log for signup completion
    await createAuditLog({
      userId: user.id,
      userEmail: user.email,
      userRole: role,
      companyId: companyId || null,
      eventType: 'create',
      resourceType: 'user',
      resourceId: user.id,
      action: 'signup_completed',
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null,
      success: true,
      metadata: {
        role,
        organizationName,
        subscriptionPlan,
        accountStatus,
        hasGocNumber: !!gocNumber
      }
    });

    logger.info(`Signup completed: ${user.email}, role: ${role}, status: ${accountStatus}`);

    const message = role === 'admin'
      ? 'Admin account created successfully'
      : 'Account created successfully. Pending administrator approval.';

    // Return success with user info
    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        companyId: updatedUser.companyId,
        accountStatus: updatedUser.accountStatus
      },
      message
    });

  } catch (error) {
    logger.error('Complete signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Signup completion failed. Please try again.'
    });
  }
});

export default router;

/**
 * Register Google Auth routes separately (needs app instance)
 */
export { registerGoogleAuthRoutes };

/**
 * Route metadata for auto-discovery
 */
export const routeConfig = {
  basePath: '/api/auth',
  description: 'Authentication and authorization routes',
  public: true, // Contains public endpoints like login
};
