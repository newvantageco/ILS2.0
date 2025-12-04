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
import authJWTRoutes from '../../auth-jwt';
import twoFactorRoutes from '../../twoFactor';
import verificationRoutes from '../../verification';
import { registerGoogleAuthRoutes } from '../../google-auth';
import { authenticateJWT, type AuthenticatedRequest } from '../../../middleware/auth-jwt';
import { storage } from '../../../storage';
import { createLogger } from '../../../utils/logger';
import { createAuditLog } from '../../../middleware/audit';

const router = Router();
const logger = createLogger('auth-domain');

// JWT-based authentication
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
