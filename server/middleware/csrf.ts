/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */

import { Request, Response, NextFunction } from 'express';
import { createHmac, randomBytes } from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.SESSION_SECRET || 'development-csrf-secret-change-in-production';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a CSRF token for the current session
 */
function generateToken(secret: string): string {
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(token + secret);
  return token + '.' + hmac.digest('hex');
}

/**
 * Validate a CSRF token against the session secret
 */
function validateToken(token: string, secret: string): boolean {
  if (!token || !token.includes('.')) {
    return false;
  }

  const [tokenPart, signaturePart] = token.split('.');
  
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(tokenPart + secret);
  const expectedSignature = hmac.digest('hex');

  // Constant-time comparison to prevent timing attacks
  if (signaturePart.length !== expectedSignature.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < signaturePart.length; i++) {
    mismatch |= signaturePart.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  return mismatch === 0;
}

/**
 * Middleware to set up CSRF protection
 * Should be used after session middleware
 */
export function csrfProtection(req: any, res: Response, next: NextFunction): void {
  // Skip CSRF for safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  
  // Skip CSRF if disabled (for development/testing only)
  if (process.env.CSRF_ENABLED === 'false') {
    return next();
  }

  // Initialize CSRF secret in session if not present
  if (req.session && !req.session.csrfSecret) {
    req.session.csrfSecret = randomBytes(32).toString('hex');
  }

  // Provide token generation function
  req.csrfToken = (): string => {
    if (!req.session?.csrfSecret) {
      throw new Error('Session not initialized');
    }
    return generateToken(req.session.csrfSecret);
  };

  // Skip validation for safe methods
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Skip CSRF for webhook endpoints (they use signature verification)
  if (req.path.includes('/webhook') || req.path.includes('/stripe-webhook')) {
    return next();
  }

  // Get token from header or body
  const token = req.headers['x-csrf-token'] as string || 
                req.body?._csrf || 
                req.query._csrf as string;

  if (!token) {
    res.status(403).json({ 
      success: false,
      error: {
        code: 'CSRF_TOKEN_MISSING',
        message: 'CSRF token is required for this request',
        details: 'Include X-CSRF-Token header or _csrf field in request'
      }
    });
    return;
  }

  // Validate token
  if (!req.session?.csrfSecret || !validateToken(token, req.session.csrfSecret)) {
    res.status(403).json({ 
      success: false,
      error: {
        code: 'CSRF_TOKEN_INVALID',
        message: 'Invalid or expired CSRF token',
        details: 'The CSRF token provided is not valid for this session'
      }
    });
    return;
  }

  next();
}

/**
 * Middleware to inject CSRF token into response
 * Useful for API endpoints that need to return token for subsequent requests
 */
export function attachCSRFToken(req: any, res: Response, next: NextFunction): void {
  if (req.csrfToken) {
    res.locals.csrfToken = req.csrfToken();
  }
  next();
}

/**
 * Express middleware factory for selective CSRF protection
 * @param options - Configuration options
 */
export function createCSRFMiddleware(options?: {
  ignoreMethods?: string[];
  ignorePaths?: (string | RegExp)[];
}) {
  const ignoreMethods = options?.ignoreMethods || ['GET', 'HEAD', 'OPTIONS'];
  const ignorePaths = options?.ignorePaths || [];

  return (req: any, res: Response, next: NextFunction): void => {
    // Check if path should be ignored
    const shouldIgnore = ignorePaths.some(path => 
      typeof path === 'string' ? req.path.startsWith(path) : path.test(req.path)
    );

    if (shouldIgnore || ignoreMethods.includes(req.method)) {
      return next();
    }

    csrfProtection(req, res, next);
  };
}

export default csrfProtection;
