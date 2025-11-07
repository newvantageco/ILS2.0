/**
 * Rate Limiting Middleware
 * 
 * Protects public endpoints from abuse and DDoS attacks
 * Uses express-rate-limit with Redis store for distributed rate limiting
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request, Response } from 'express';

// Extend Express Request type to include rateLimit info
declare module 'express' {
  interface Request {
    rateLimit?: {
      limit: number;
      current: number;
      remaining: number;
      resetTime?: Date;
    };
  }
}

/**
 * Standard rate limiter for public API endpoints
 * 100 requests per 15 minutes per IP
 */
export const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    const retryAfter = req.rateLimit?.resetTime ? Math.ceil(req.rateLimit.resetTime.getTime() / 1000) : Date.now() + 900;
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP (prevents brute force)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    const retryAfter = req.rateLimit?.resetTime ? Math.ceil(req.rateLimit.resetTime.getTime() / 1000) : Date.now() + 900;
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'You have exceeded the login attempt limit. Please try again in 15 minutes.',
      retryAfter
    });
  }
});

/**
 * Moderate rate limiter for signup/registration
 * 3 signups per hour per IP
 */
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 signups per hour
  message: {
    error: 'Too many signup attempts from this IP.',
    retryAfter: '1 hour'
  },
  handler: (req: Request, res: Response) => {
    const retryAfter = req.rateLimit?.resetTime ? Math.ceil(req.rateLimit.resetTime.getTime() / 1000) : Date.now() + 3600;
    res.status(429).json({
      error: 'Too many signup attempts',
      message: 'You have exceeded the signup limit. Please try again in 1 hour.',
      retryAfter
    });
  }
});

/**
 * Webhook rate limiter (more permissive for legitimate webhooks)
 * 1000 requests per 15 minutes per IP
 */
export const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // High limit for webhook traffic
  message: {
    error: 'Webhook rate limit exceeded.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * AI query rate limiter (prevents AI abuse)
 * 50 requests per hour per user
 */
export const aiQueryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit to 50 AI queries per hour
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise use IPv6-safe IP key generator
    const userId = (req as any).user?.id;
    if (userId) {
      return `user-${userId}`;
    }
    // Use the IPv6-safe key generator for IP-based limiting
    return ipKeyGenerator(req.ip || '');
  },
  message: {
    error: 'AI query limit exceeded.',
    retryAfter: '1 hour'
  },
  handler: (req: Request, res: Response) => {
    const retryAfter = req.rateLimit?.resetTime ? Math.ceil(req.rateLimit.resetTime.getTime() / 1000) : Date.now() + 3600;
    res.status(429).json({
      error: 'AI query limit exceeded',
      message: 'You have reached your hourly AI query limit. Please try again later.',
      retryAfter
    });
  }
});

/**
 * General rate limiter for all routes (fallback)
 * 1000 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Very high limit, just prevents extreme abuse
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  }
});

/**
 * Password reset rate limiter
 * 3 requests per hour per IP
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit to 3 password reset requests per hour
  message: {
    error: 'Too many password reset requests.',
    retryAfter: '1 hour'
  },
  handler: (req: Request, res: Response) => {
    const retryAfter = req.rateLimit?.resetTime ? Math.ceil(req.rateLimit.resetTime.getTime() / 1000) : Date.now() + 3600;
    res.status(429).json({
      error: 'Too many password reset attempts',
      message: 'You have exceeded the password reset limit. Please try again in 1 hour.',
      retryAfter
    });
  }
});
