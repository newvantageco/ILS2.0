/**
 * JWT Authentication Middleware
 *
 * Validates JWT tokens and attaches authenticated user to request.
 * Supports both Bearer token in Authorization header and cookies.
 */

import { Request, Response, NextFunction } from 'express';
import { jwtService, type JWTPayload } from '../services/JWTService.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('auth-jwt');

/**
 * Authenticated user information attached to request
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  companyId: string;
  permissions: string[];
}

/**
 * Extended Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  token?: string;
}

/**
 * Extract JWT token from request
 * Checks Authorization header (Bearer token) and cookies
 *
 * @param req - Express request
 * @returns JWT token string or null
 */
function extractToken(req: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  // Check cookies (support multiple cookie names for compatibility)
  // - auth_token: Used by Google OAuth and general auth
  // - access_token: Alternative naming convention
  if (req.cookies) {
    if (req.cookies.auth_token) {
      return req.cookies.auth_token;
    }
    if (req.cookies.access_token) {
      return req.cookies.access_token;
    }
  }

  return null;
}

/**
 * JWT Authentication Middleware
 *
 * Validates JWT token and attaches user info to request.
 * Returns 401 if token is missing, invalid, or expired.
 *
 * Usage:
 * ```typescript
 * app.get('/protected', authenticateJWT, (req, res) => {
 *   const user = (req as AuthenticatedRequest).user;
 *   res.json({ message: `Hello ${user.email}` });
 * });
 * ```
 */
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract token from request
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'NO_TOKEN'
      });
      return;
    }

    // Verify and decode token
    let payload: JWTPayload;
    try {
      payload = jwtService.verifyToken(token);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'TOKEN_EXPIRED') {
          res.status(401).json({
            error: 'Token expired',
            code: 'TOKEN_EXPIRED'
          });
          return;
        }
        if (error.message === 'TOKEN_INVALID') {
          res.status(401).json({
            error: 'Invalid token',
            code: 'TOKEN_INVALID'
          });
          return;
        }
      }

      logger.error('JWT verification failed:', error);
      res.status(401).json({
        error: 'Authentication failed',
        code: 'AUTH_FAILED'
      });
      return;
    }

    // Ensure it's an access token (not refresh token)
    if (payload.type === 'refresh') {
      res.status(401).json({
        error: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE'
      });
      return;
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      companyId: payload.companyId,
      permissions: payload.permissions
    };

    // Also attach raw token for refresh operations
    (req as AuthenticatedRequest).token = token;

    logger.debug(`Authenticated user: ${payload.email} (${payload.userId})`);

    next();

  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Optional JWT Authentication Middleware
 *
 * Validates JWT token if present but doesn't require it.
 * Useful for routes that work for both authenticated and anonymous users.
 *
 * Usage:
 * ```typescript
 * app.get('/optional', optionalAuthenticateJWT, (req, res) => {
 *   const user = (req as AuthenticatedRequest).user;
 *   if (user) {
 *     res.json({ message: `Hello ${user.email}` });
 *   } else {
 *     res.json({ message: 'Hello guest' });
 *   }
 * });
 * ```
 */
export const optionalAuthenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract token from request
    const token = extractToken(req);

    if (!token) {
      // No token provided, continue as anonymous user
      next();
      return;
    }

    // Try to verify and decode token
    try {
      const payload = jwtService.verifyToken(token);

      // Ensure it's an access token
      if (payload.type !== 'refresh') {
        // Attach user to request
        (req as AuthenticatedRequest).user = {
          id: payload.userId,
          email: payload.email,
          role: payload.role,
          companyId: payload.companyId,
          permissions: payload.permissions
        };

        (req as AuthenticatedRequest).token = token;

        logger.debug(`Optionally authenticated user: ${payload.email}`);
      }
    } catch (error) {
      // Token invalid or expired, continue as anonymous user
      logger.debug('Optional auth failed, continuing as anonymous');
    }

    next();

  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    next(); // Continue anyway for optional auth
  }
};

/**
 * Role-based Authorization Middleware Factory
 *
 * Requires authentication and checks if user has one of the allowed roles.
 *
 * Usage:
 * ```typescript
 * app.post('/admin', requireRole(['admin', 'super_admin']), (req, res) => {
 *   res.json({ message: 'Admin only' });
 * });
 * ```
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      logger.warn(`Access denied for user ${user.id} with role ${user.role}`);
      res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: allowedRoles
      });
      return;
    }

    next();
  };
};

/**
 * Permission-based Authorization Middleware Factory
 *
 * Requires authentication and checks if user has a specific permission.
 *
 * Usage:
 * ```typescript
 * app.delete('/data', requirePermission('data.delete'), (req, res) => {
 *   res.json({ message: 'Data deleted' });
 * });
 * ```
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
      return;
    }

    if (!user.permissions.includes(permission)) {
      logger.warn(`Access denied for user ${user.id} - missing permission: ${permission}`);
      res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: permission
      });
      return;
    }

    next();
  };
};
