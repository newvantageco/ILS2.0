/**
 * CSRF Protection Middleware
 * 
 * Protects against Cross-Site Request Forgery attacks
 * Uses csrf-csrf (modern replacement for deprecated csurf)
 */

import { doubleCsrf } from 'csrf-csrf';
import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';


const CSRF_SECRET = process.env.CSRF_SECRET;
if (!CSRF_SECRET && process.env.NODE_ENV === 'production') {
  logger.warn('CSRF_SECRET not set in production - CSRF protection may not work correctly');
}

// Use a fallback for development only
const csrfSecretValue = CSRF_SECRET || (process.env.NODE_ENV !== 'production' ? 'dev-csrf-secret-change-me' : '');

// Configure CSRF protection
// Note: Removed __Host- prefix as it can cause issues with reverse proxies/load balancers
// The __Host- prefix is very strict and requires the cookie to be set directly by the host
const {
  invalidCsrfTokenError,
  doubleCsrfProtection,
  generateToken,
} = doubleCsrf({
  getSecret: () => csrfSecretValue,
  getSessionIdentifier: (req: Request) => {
    // Use session ID or user ID as identifier
    // Fallback chain: session.id -> user.id -> IP-based identifier
    const sessionId = (req as any).session?.id;
    const userId = (req as any).user?.id;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    return sessionId || userId || `anon-${ip}`;
  },
  cookieName: 'csrf-token',  // Simplified name, works better with proxies
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
 * Middleware to generate CSRF token and attach to res.locals
 * Call this on routes where you need to generate a token (like form pages)
 */
export const generateCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Generate token using the csrf-csrf library
    const token = generateToken(req, res);
    res.locals.csrfToken = token;
    next();
  } catch (err) {
    logger.error('CSRF token generation error:', err);
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
 *
 * Frontend should call this endpoint to get a token, then include it in
 * the X-CSRF-Token header for all state-changing requests (POST, PUT, DELETE, PATCH)
 */
export const getCsrfToken = (req: Request, res: Response) => {
  try {
    // Generate a new CSRF token for the client
    const token = generateToken(req, res);
    res.json({ csrfToken: token });
  } catch (err) {
    logger.error('Failed to generate CSRF token:', err);
    res.status(500).json({ error: 'Failed to generate CSRF token' });
  }
};

/**
 * Middleware for routes that don't need CSRF protection
 * Use for API endpoints with other authentication methods (JWT, API keys)
 */
export const skipCsrf = (_req: Request, _res: Response, next: NextFunction) => {
  next();
};
