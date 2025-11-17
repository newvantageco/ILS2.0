/**
 * Rate Limiting Middleware
 * 
 * Comprehensive rate limiting for ILS 2.0 platform including:
 * - AI/ML endpoint protection with cost control
 * - Multi-tier rate limiting (user, tenant, global)
 * - Burst protection and gradual recovery
 * - Redis-based distributed limiting
 * - Usage analytics and monitoring
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request, Response } from 'express';
import { rateLimitingService } from '../services/RateLimitingService';
import { logger } from '../utils/logger';

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

/**
 * AI/ML Rate Limiters - Comprehensive Cost Control and Usage Protection
 */

/**
 * OCR Processing Rate Limiter - Most restrictive (high OpenAI API cost)
 * 10 requests per minute per user to control costs
 */
export const ocrRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each user to 10 OCR requests per minute
  keyGenerator: (req: Request) => {
    return req.user?.id || ipKeyGenerator(req.ip || '');
  },
  message: {
    error: 'OCR processing rate limit exceeded',
    message: 'Too many prescription uploads. Please wait before trying again.',
    costControl: true,
    retryAfter: '60 seconds'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const userId = req.user?.id;
    const ip = req.ip;
    const endpoint = req.path;
    const userAgent = req.get('User-Agent');
    
    logger.warn({ userId, ip, endpoint, userAgent }, 'OCR rate limit exceeded');
    
    res.status(429).json({
      error: 'OCR processing rate limit exceeded',
      message: 'You have reached the limit for prescription processing. Please wait before trying again.',
      costControl: true,
      retryAfter: 60,
      upgradeUrl: '/pricing'
    });
  }
});

/**
 * AI Analysis Rate Limiter - Moderate restriction
 * 20 requests per minute per user for AI analysis endpoints
 */
export const aiAnalysisRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each user to 20 AI requests per minute
  keyGenerator: (req: Request) => {
    return req.user?.id || ipKeyGenerator(req.ip || '');
  },
  message: {
    error: 'AI analysis rate limit exceeded',
    message: 'Too many AI analysis requests. Please wait before trying again.',
    retryAfter: '60 seconds'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const userId = req.user?.id;
    const ip = req.ip;
    const endpoint = req.path;
    
    logger.warn({ userId, ip, endpoint }, 'AI analysis rate limit exceeded');
    
    res.status(429).json({
      error: 'AI analysis rate limit exceeded',
      message: 'You have reached the limit for AI requests. Please upgrade your plan or wait before trying again.',
      retryAfter: 60,
      upgradeUrl: '/pricing'
    });
  }
});

/**
 * ML Models Testing Rate Limiter - Moderate restriction
 * 15 requests per minute per user for model testing
 */
export const mlModelsRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // Limit each user to 15 model test requests per minute
  keyGenerator: (req: Request) => {
    return req.user?.id || ipKeyGenerator(req.ip || '');
  },
  message: {
    error: 'ML models testing rate limit exceeded',
    message: 'Too many model test requests. Please wait before trying again.',
    retryAfter: '60 seconds'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const userId = req.user?.id;
    const ip = req.ip;
    const endpoint = req.path;
    
    logger.warn({ userId, ip, endpoint }, 'ML models rate limit exceeded');
    
    res.status(429).json({
      error: 'ML models testing rate limit exceeded',
      message: 'You have reached the limit for model testing. Please wait before trying again.',
      retryAfter: 60
    });
  }
});

/**
 * Shopify Widgets Rate Limiter - Tenant-based limiting
 * 50 requests per minute per tenant for widget usage
 */
export const shopifyWidgetRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // Limit each tenant to 50 widget requests per minute
  keyGenerator: (req: Request) => {
    // Use tenant ID for Shopify widgets
    const tenantId = (req as any).user?.tenantId;
    if (tenantId) {
      return `tenant-${tenantId}`;
    }
    const shopDomain = req.headers['x-shopify-shop-domain'];
    return typeof shopDomain === 'string' ? shopDomain : ipKeyGenerator(req.ip || '');
  },
  message: {
    error: 'Shopify widget rate limit exceeded',
    message: 'Your store has reached the widget usage limit. Please upgrade your plan.',
    retryAfter: '60 seconds'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId;
    const shopDomain = req.headers['x-shopify-shop-domain'];
    const ip = req.ip;
    const endpoint = req.path;
    
    logger.warn({ tenantId, shopDomain, ip, endpoint }, 'Shopify widget rate limit exceeded');
    
    res.status(429).json({
      error: 'Shopify widget rate limit exceeded',
      message: 'Your store has reached the usage limit for widgets. Please upgrade your plan.',
      retryAfter: 300,
      upgradeUrl: '/shopify/pricing'
    });
  }
});

/**
 * Burst Protection Rate Limiter - Prevents rapid bursts
 * 5 requests per 10 seconds per user
 */
export const burstProtectionRateLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 5, // Limit each user to 5 requests per 10 seconds
  keyGenerator: (req: Request) => {
    return `burst:${req.user?.id || ipKeyGenerator(req.ip || '')}`;
  },
  message: {
    error: 'Burst rate limit exceeded',
    message: 'Too many requests in quick succession. Please slow down.',
    retryAfter: '10 seconds'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const userId = req.user?.id;
    const ip = req.ip;
    const endpoint = req.path;
    
    logger.warn({ userId, ip, endpoint }, 'Burst protection triggered');
    
    res.status(429).json({
      error: 'Burst rate limit exceeded',
      message: 'Too many requests in quick succession. Please wait before trying again.',
      retryAfter: 10
    });
  }
});

/**
 * Setup comprehensive rate limiting for Express application
 */
export function setupRateLimiting(app: any) {
  logger.info('Setting up comprehensive rate limiting');
  
  // Apply specific rate limiters to endpoint groups
  app.use('/api/ai/ocr/prescription', ocrRateLimiter);
  app.use('/api/v1/ocr/prescription', ocrRateLimiter);
  app.use('/api/ai', aiAnalysisRateLimiter);
  app.use('/api/v1/ocr', aiAnalysisRateLimiter);
  app.use('/api/v1/models', mlModelsRateLimiter);
  app.use('/api/shopify/widgets', shopifyWidgetRateLimiter);
  
  // Burst protection for expensive endpoints
  app.use('/api/ai/ocr/prescription', burstProtectionRateLimiter);
  app.use('/api/v1/ocr/prescription', burstProtectionRateLimiter);
  app.use('/api/shopify/widgets/prescription/upload', burstProtectionRateLimiter);
  
  // Existing rate limiters
  app.use('/api/auth', authLimiter);
  app.use('/api/auth/reset-password', passwordResetLimiter);
  app.use('/api/auth/signup', signupLimiter);
  app.use('/api/webhooks', webhookLimiter);
  
  logger.info('Rate limiting configured for all endpoints');
}

export default publicApiLimiter;
