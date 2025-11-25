/**
 * Hybrid Authentication Middleware
 *
 * Supports both JWT and session-based authentication for gradual migration.
 * Tries JWT first, then falls back to session authentication.
 * This allows existing sessions to continue working while new logins use JWT.
 */

import { Request, Response, NextFunction } from 'express';
import { authenticateJWT, type AuthenticatedRequest as JWTAuthRequest } from './auth-jwt.js';
import { isAuthenticated } from '../replitAuth.js';
import { createLogger } from '../utils/logger.js';
import type { AuthenticatedRequest as SessionAuthRequest } from './auth.js';

const logger = createLogger('auth-hybrid');

/**
 * Hybrid Authentication Middleware
 *
 * Tries JWT authentication first (from Authorization header),
 * falls back to session authentication if JWT is not present or invalid.
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
  // Check if Authorization header with JWT exists
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Try JWT authentication
    try {
      authenticateJWT(req, res, (err?: any) => {
        if (err) {
          // JWT auth failed, try session
          logger.debug('JWT auth failed, falling back to session');
          trySessionAuth(req, res, next);
        } else {
          // JWT auth succeeded
          logger.debug('Authenticated via JWT');
          next();
        }
      });
      return;
    } catch (error) {
      logger.debug('JWT auth error, trying session:', error);
      // Continue to session auth
    }
  }

  // No JWT or JWT failed, try session authentication
  trySessionAuth(req, res, next);
};

/**
 * Helper function to attempt session authentication
 */
function trySessionAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    isAuthenticated(req, res, (err?: any) => {
      if (err) {
        logger.debug('Session auth also failed');
        res.status(401).json({
          error: 'Authentication required',
          message: 'Please login with valid credentials'
        });
      } else {
        logger.debug('Authenticated via session');
        next();
      }
    });
  } catch (error) {
    logger.debug('Session auth error');
    res.status(401).json({
      error: 'Authentication required',
      message: 'Please login with valid credentials'
    });
  }
}

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
