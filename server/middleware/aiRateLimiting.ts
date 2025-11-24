import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { companies } from '@shared/schema';
import { eq } from 'drizzle-orm';
import logger from '../utils/logger';


interface RateLimitStore {
  [tenantId: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory rate limit store (for production, use Redis)
const rateLimitStore: RateLimitStore = {};

// Rate limits by subscription tier (queries per minute)
const RATE_LIMITS: Record<string, number> = {
  basic: 30,
  professional: 60,
  enterprise: 120,
  default: 10 // For unknown tiers
};

/**
 * Middleware to enforce rate limiting for AI queries based on subscription tier
 */
export const aiRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenantContext = (req as any).tenantContext;

    if (!tenantContext || !tenantContext.tenantId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const tenantId = tenantContext.tenantId;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window

    // Initialize or reset rate limit data
    if (!rateLimitStore[tenantId] || now > rateLimitStore[tenantId].resetTime) {
      rateLimitStore[tenantId] = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    // Get tenant's subscription tier
    const [tenant] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, tenantId))
      .limit(1);

    if (!tenant) {
      res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
      return;
    }

    // Determine rate limit based on subscription tier
    const tenantAny = tenant as any;
    const subscriptionTier = tenantAny.subscriptionTier || 'basic';
    const limit = RATE_LIMITS[subscriptionTier] || RATE_LIMITS.default;

    // Check if limit exceeded
    if (rateLimitStore[tenantId].count >= limit) {
      const resetIn = Math.ceil((rateLimitStore[tenantId].resetTime - now) / 1000);
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `You've exceeded the rate limit for your ${subscriptionTier} tier (${limit} queries/minute)`,
        resetIn,
        limit,
        current: rateLimitStore[tenantId].count
      });
      return;
    }

    // Increment counter
    rateLimitStore[tenantId].count++;

    // Add rate limit info to response headers
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', (limit - rateLimitStore[tenantId].count).toString());
    res.setHeader('X-RateLimit-Reset', rateLimitStore[tenantId].resetTime.toString());

    next();
  } catch (error) {
    logger.error('Rate limiting error:', error);
    res.status(500).json({
      success: false,
      error: 'Rate limiting service error'
    });
  }
};

/**
 * Get current rate limit status for a tenant
 */
export const getRateLimitStatus = (tenantId: string, subscriptionTier: string) => {
  const now = Date.now();
  const limit = RATE_LIMITS[subscriptionTier] || RATE_LIMITS.default;
  
  if (!rateLimitStore[tenantId] || now > rateLimitStore[tenantId].resetTime) {
    return {
      limit,
      remaining: limit,
      resetTime: now + 60000,
      current: 0
    };
  }

  return {
    limit,
    remaining: Math.max(0, limit - rateLimitStore[tenantId].count),
    resetTime: rateLimitStore[tenantId].resetTime,
    current: rateLimitStore[tenantId].count
  };
};

/**
 * Clear rate limit for a tenant (admin function)
 */
export const clearRateLimit = (tenantId: string): void => {
  delete rateLimitStore[tenantId];
};
