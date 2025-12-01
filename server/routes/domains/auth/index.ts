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

import { Router } from 'express';
import authJWTRoutes from '../../auth-jwt';
import twoFactorRoutes from '../../twoFactor';
import verificationRoutes from '../../verification';
import { registerGoogleAuthRoutes } from '../../google-auth';

const router = Router();

// JWT-based authentication
router.use('/jwt', authJWTRoutes);

// Two-factor authentication
router.use('/2fa', twoFactorRoutes);

// Email verification
router.use('/verify', verificationRoutes);

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
