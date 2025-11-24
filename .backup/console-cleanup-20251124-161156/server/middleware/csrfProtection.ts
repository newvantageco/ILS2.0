/**
 * CSRF Protection Middleware
 * 
 * Protects against Cross-Site Request Forgery attacks
 * Uses csrf-csrf (modern replacement for deprecated csurf)
 */

import { doubleCsrf } from 'csrf-csrf';
import type { Request, Response, NextFunction } from 'express';

const CSRF_SECRET = process.env.CSRF_SECRET || 'your-secret-csrf-token-change-in-production';

// Configure CSRF protection
const {
  invalidCsrfTokenError,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => CSRF_SECRET,
  getSessionIdentifier: (req: Request) => {
    // Use session ID or user ID as identifier
    return (req as any).session?.id || (req as any).user?.id || 'anonymous';
  },
  cookieName: '__Host-psifi.x-csrf-token',
  cookieOptions: {
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getCsrfTokenFromRequest: (req: Request) => {
    // Check header first, then body
    return req.headers['x-csrf-token'] as string || req.body._csrf;
  },
});

/**
 * Middleware to generate CSRF token
 * Call this on routes where you need to generate a token (like form pages)
 */
export const generateCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Token is automatically attached by doubleCsrfProtection middleware
    res.locals.csrfToken = res.locals.csrfToken || '';
    next();
  } catch (err) {
    console.error('CSRF token generation error:', err);
    next(err);
  }
};

/**
 * Middleware to validate CSRF token
 * Apply this to routes that modify data (POST, PUT, DELETE, PATCH)
 */
export const csrfProtection = doubleCsrfProtection;

/**
 * Custom CSRF error handler
 * Call this after your routes to handle CSRF errors
 */
export const csrfErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err === invalidCsrfTokenError) {
    return res.status(403).json({
      error: 'CSRF Token Validation Failed',
      message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
    });
  }
  next(err);
};

/**
 * API endpoint to get CSRF token for AJAX requests
 * GET /api/csrf-token
 */
export const getCsrfToken = (req: Request, res: Response) => {
  // Use doubleCsrfProtection middleware before this endpoint to generate token
  const token = res.locals.csrfToken || '';
  res.json({ csrfToken: token });
};

/**
 * Middleware for routes that don't need CSRF protection
 * Use for API endpoints with other authentication methods (JWT, API keys)
 */
export const skipCsrf = (_req: Request, _res: Response, next: NextFunction) => {
  next();
};
