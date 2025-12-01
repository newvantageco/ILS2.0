/**
 * JWT Authentication Middleware
 *
 * JWT-based authentication for all protected routes.
 * Legacy session-based authentication has been removed.
 */

import { Request, Response, NextFunction } from 'express';
import { authenticateJWT, type AuthenticatedRequest as JWTAuthRequest } from './auth-jwt.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('auth-jwt-wrapper');

/**
 * JWT Authentication Middleware (renamed from authenticateHybrid)
 *
 * Uses JWT tokens from Authorization header for authentication.
 * Legacy session-based authentication has been removed.
 *
 * Usage:
 * ```typescript
 * app.get('/api/protected', authenticateHybrid, (req, res) => {
 *   const user = req.user;
 *   res.json({ user });
 * });
 * ```
 */
export const authenticateHybrid = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Use JWT authentication only
  try {
    authenticateJWT(req, res, (err?: any) => {
      if (err) {
        logger.debug('JWT authentication failed');
        res.status(401).json({
          error: 'Authentication required',
          message: 'Please login with valid credentials'
        });
      } else {
        logger.debug('Authenticated via JWT');
        next();
      }
    });
  } catch (error) {
    logger.error('JWT authentication error:', error);
    res.status(401).json({
      error: 'Authentication required',
      message: 'Please login with valid credentials'
    });
  }
};

/**
 * Optional Hybrid Authentication Middleware
 *
 * Tries JWT then session authentication but doesn't require it.
 * Useful for routes that work for both authenticated and anonymous users.
 *
 * Usage:
 * ```typescript
 * app.get('/api/optional', optionalAuthenticateHybrid, (req, res) => {
 *   const user = req.user;
 *   if (user) {
 *     res.json({ message: `Hello ${user.email}` });
 *   } else {
 *     res.json({ message: 'Hello guest' });
 *   }
 * });
 * ```
 */
export const optionalAuthenticateHybrid = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check if Authorization header with JWT exists
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Try JWT authentication
    try {
      authenticateJWT(req, res, (err?: any) => {
        if (err) {
          // JWT auth failed, continue as anonymous
          logger.debug('Optional JWT auth failed, continuing as anonymous');
          next();
        } else {
          // JWT auth succeeded
          logger.debug('Optionally authenticated via JWT');
          next();
        }
      });
      return;
    } catch (error) {
      // JWT failed, continue as anonymous
      next();
      return;
    }
  }

  // No JWT, continue without auth (optional)
  next();
};
