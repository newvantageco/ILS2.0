/**
 * Per-Company Rate Limiting Middleware
 * Prevents any single company from overwhelming the system
 * Essential for handling thousands of companies at scale
 */

import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/CacheService';

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  message?: string;      // Custom error message
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

/**
 * Default rate limit configurations by subscription tier
 */
export const RateLimitTiers = {
  FREE: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 500,           // 500 requests per 15 minutes
  },
  BASIC: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 2000,          // 2000 requests per 15 minutes
  },
  PROFESSIONAL: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 5000,          // 5000 requests per 15 minutes
  },
  ENTERPRISE: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 20000,         // 20000 requests per 15 minutes
  },
  PLATFORM_ADMIN: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 50000,         // No practical limit for admins
  },
} as const;

/**
 * In-memory fallback store when Redis is unavailable
 */
class MemoryStore {
  private store: Map<string, RateLimitInfo> = new Map();
  private readonly MAX_KEYS = 10000;

  async increment(key: string, windowMs: number): Promise<RateLimitInfo> {
    const now = Date.now();
    const resetTime = now + windowMs;

    const existing = this.store.get(key);

    if (existing && existing.resetTime > now) {
      // Within the same window, increment count
      existing.count++;
      return existing;
    } else {
      // New window, reset count
      const info: RateLimitInfo = { count: 1, resetTime };
      this.store.set(key, info);
      
      // Enforce size limit
      if (this.store.size > this.MAX_KEYS) {
        const firstKey = Array.from(this.store.keys())[0];
        this.store.delete(firstKey);
      }
      
      return info;
    }
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    const keys = Array.from(this.store.entries());
    for (const [key, info] of keys) {
      if (info.resetTime < now) {
        this.store.delete(key);
      }
    }
  }
}

const memoryStore = new MemoryStore();

// Cleanup expired entries every 5 minutes
setInterval(() => memoryStore.cleanup(), 5 * 60 * 1000);

/**
 * Get rate limit info using Redis or memory fallback
 */
async function getRateLimitInfo(
  companyId: string,
  windowMs: number
): Promise<RateLimitInfo> {
  const key = `ratelimit:${companyId}`;
  const now = Date.now();
  const resetTime = now + windowMs;

  try {
    // Try Redis first
    const cached = await cacheService.get<RateLimitInfo>(companyId, 'ratelimit', {
      namespace: 'system',
    });

    if (cached && cached.resetTime > now) {
      // Within window, increment
      cached.count++;
      await cacheService.set(companyId, 'ratelimit', cached, {
        namespace: 'system',
        ttl: Math.ceil(windowMs / 1000),
      });
      return cached;
    } else {
      // New window
      const info: RateLimitInfo = { count: 1, resetTime };
      await cacheService.set(companyId, 'ratelimit', info, {
        namespace: 'system',
        ttl: Math.ceil(windowMs / 1000),
      });
      return info;
    }
  } catch (error) {
    // Fallback to memory store
    return memoryStore.increment(key, windowMs);
  }
}

/**
 * Create rate limiting middleware for company-scoped requests
 */
export function createCompanyRateLimiter(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip if user is not authenticated or doesn't have companyId
      if (!req.user || !req.user.companyId) {
        return next();
      }

      const companyId = req.user.companyId;
      const { windowMs, maxRequests, message } = config;

      // Get current rate limit status
      const info = await getRateLimitInfo(companyId, windowMs);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - info.count).toString());
      res.setHeader('X-RateLimit-Reset', new Date(info.resetTime).toISOString());

      // Check if limit exceeded
      if (info.count > maxRequests) {
        const retryAfter = Math.ceil((info.resetTime - Date.now()) / 1000);
        res.setHeader('Retry-After', retryAfter.toString());

        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: message || 'Too many requests from your organization. Please try again later.',
          retryAfter,
          limit: maxRequests,
          windowMs,
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // On error, allow the request to proceed (fail open)
      next();
    }
  };
}

/**
 * Dynamic rate limiter that adjusts based on subscription tier
 */
export function companyRateLimiter(req: Request, res: Response, next: NextFunction) {
  // Determine rate limit based on company's subscription plan
  const user = req.user as any;
  const companyData = (req as any).companyData;

  let config: RateLimitConfig;

  // Platform admins get highest limits
  if (user?.role === 'platform_admin') {
    config = { ...RateLimitTiers.PLATFORM_ADMIN };
  } 
  // Check company subscription plan
  else if (companyData?.subscriptionPlan) {
    const plan = companyData.subscriptionPlan.toUpperCase();
    config = RateLimitTiers[plan as keyof typeof RateLimitTiers] || RateLimitTiers.FREE;
  } 
  // Default to FREE tier
  else {
    config = { ...RateLimitTiers.FREE };
  }

  // Apply the rate limiter
  const limiter = createCompanyRateLimiter(config);
  return limiter(req, res, next);
}

/**
 * Strict rate limiter for expensive operations
 */
export const strictRateLimiter = createCompanyRateLimiter({
  windowMs: 60 * 1000,    // 1 minute
  maxRequests: 10,         // 10 requests per minute
  message: 'This operation is rate limited. Please slow down.',
});

/**
 * Rate limiter for file uploads
 */
export const uploadRateLimiter = createCompanyRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 100,          // 100 uploads per hour
  message: 'Upload limit reached. Please try again later.',
});

/**
 * Rate limiter for AI/ML operations
 */
export const aiRateLimiter = createCompanyRateLimiter({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  maxRequests: 50,           // 50 AI requests per 5 minutes
  message: 'AI operation limit reached. Please try again later.',
});

/**
 * Utility to manually reset rate limit for a company (admin use)
 */
export async function resetCompanyRateLimit(companyId: string): Promise<void> {
  await cacheService.delete(companyId, 'ratelimit', { namespace: 'system' });
  await memoryStore.reset(`ratelimit:${companyId}`);
}

/**
 * Get current rate limit status for a company
 */
export async function getCompanyRateLimitStatus(
  companyId: string,
  windowMs: number = 15 * 60 * 1000
): Promise<RateLimitInfo | null> {
  try {
    return await getRateLimitInfo(companyId, windowMs);
  } catch (error) {
    console.error('Failed to get rate limit status:', error);
    return null;
  }
}
