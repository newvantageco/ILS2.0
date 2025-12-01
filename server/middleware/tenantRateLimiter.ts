/**
 * Tenant-Aware Rate Limiting Middleware
 *
 * Provides rate limiting that is scoped per-tenant, preventing
 * one tenant's heavy usage from affecting other tenants.
 *
 * Features:
 * - Per-tenant rate limits with separate quotas
 * - Tier-based limits (free, pro, premium, enterprise)
 * - Burst protection
 * - Usage tracking and analytics
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request, Response } from 'express';
import { createLogger } from "../utils/logger";

const logger = createLogger("TenantRateLimiter");

/**
 * Rate limit configurations per subscription tier
 */
const TIER_LIMITS = {
  free: {
    requestsPerMinute: 30,
    requestsPerHour: 500,
    aiQueriesPerHour: 10,
    uploadsPerHour: 20,
    burstLimit: 5
  },
  pro: {
    requestsPerMinute: 100,
    requestsPerHour: 2000,
    aiQueriesPerHour: 50,
    uploadsPerHour: 100,
    burstLimit: 15
  },
  premium: {
    requestsPerMinute: 300,
    requestsPerHour: 5000,
    aiQueriesPerHour: 200,
    uploadsPerHour: 500,
    burstLimit: 30
  },
  enterprise: {
    requestsPerMinute: 1000,
    requestsPerHour: 20000,
    aiQueriesPerHour: 1000,
    uploadsPerHour: 2000,
    burstLimit: 100
  }
};

type SubscriptionTier = keyof typeof TIER_LIMITS;

/**
 * Get tenant ID from request
 */
function getTenantId(req: Request): string {
  const user = (req as any).user;
  const tenantId = user?.companyId || user?.tenantId || (req as any).tenantId;

  if (tenantId) {
    return `tenant:${tenantId}`;
  }

  // Fall back to IP-based limiting for unauthenticated requests
  return `ip:${ipKeyGenerator(req.ip || '')}`;
}

/**
 * Get subscription tier from request
 */
function getSubscriptionTier(req: Request): SubscriptionTier {
  const user = (req as any).user;
  const tier = user?.subscriptionPlan || user?.company?.subscriptionPlan || 'free';

  if (tier in TIER_LIMITS) {
    return tier as SubscriptionTier;
  }

  return 'free';
}

/**
 * Get tier limits for a request
 */
function getTierLimits(req: Request) {
  const tier = getSubscriptionTier(req);
  return TIER_LIMITS[tier];
}

/**
 * Tenant-aware general API rate limiter
 * Limits requests per minute based on subscription tier
 */
export const tenantApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: (req: Request) => getTierLimits(req).requestsPerMinute,
  keyGenerator: getTenantId,
  message: (req: Request) => ({
    error: 'Rate limit exceeded',
    message: `Your organization has exceeded the API rate limit. Upgrade your plan for higher limits.`,
    tier: getSubscriptionTier(req),
    limit: getTierLimits(req).requestsPerMinute,
    upgradeUrl: '/settings/billing'
  }),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const tenantId = getTenantId(req);
    const tier = getSubscriptionTier(req);

    logger.warn({
      tenantId,
      tier,
      path: req.path,
      method: req.method
    }, 'Tenant API rate limit exceeded');

    res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Your organization has exceeded the API rate limit. Please wait or upgrade your plan.`,
      tier,
      limit: getTierLimits(req).requestsPerMinute,
      retryAfter: 60,
      upgradeUrl: '/settings/billing'
    });
  }
});

/**
 * Tenant-aware hourly rate limiter
 * For tracking cumulative usage over longer periods
 */
export const tenantHourlyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req: Request) => getTierLimits(req).requestsPerHour,
  keyGenerator: (req: Request) => `hourly:${getTenantId(req)}`,
  message: (req: Request) => ({
    error: 'Hourly rate limit exceeded',
    message: `Your organization has exceeded the hourly API limit.`,
    tier: getSubscriptionTier(req),
    limit: getTierLimits(req).requestsPerHour
  }),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const tenantId = getTenantId(req);
    const tier = getSubscriptionTier(req);

    logger.warn({
      tenantId,
      tier,
      path: req.path
    }, 'Tenant hourly rate limit exceeded');

    res.status(429).json({
      error: 'Hourly rate limit exceeded',
      message: `Your organization has exceeded the hourly API limit. Please wait or upgrade your plan.`,
      tier,
      limit: getTierLimits(req).requestsPerHour,
      retryAfter: 3600,
      upgradeUrl: '/settings/billing'
    });
  }
});

/**
 * Tenant-aware AI query rate limiter
 * Separate limits for AI/ML endpoints due to cost
 */
export const tenantAILimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req: Request) => getTierLimits(req).aiQueriesPerHour,
  keyGenerator: (req: Request) => `ai:${getTenantId(req)}`,
  message: (req: Request) => ({
    error: 'AI query limit exceeded',
    message: `Your organization has exceeded the AI query limit.`,
    tier: getSubscriptionTier(req),
    limit: getTierLimits(req).aiQueriesPerHour
  }),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const tenantId = getTenantId(req);
    const tier = getSubscriptionTier(req);

    logger.warn({
      tenantId,
      tier,
      path: req.path
    }, 'Tenant AI rate limit exceeded');

    res.status(429).json({
      error: 'AI query limit exceeded',
      message: `Your organization has reached the AI query limit. Upgrade to get more AI queries.`,
      tier,
      limit: getTierLimits(req).aiQueriesPerHour,
      retryAfter: 3600,
      upgradeUrl: '/settings/billing',
      costControl: true
    });
  }
});

/**
 * Tenant-aware upload rate limiter
 * For file uploads and document processing
 */
export const tenantUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req: Request) => getTierLimits(req).uploadsPerHour,
  keyGenerator: (req: Request) => `upload:${getTenantId(req)}`,
  message: (req: Request) => ({
    error: 'Upload limit exceeded',
    message: `Your organization has exceeded the upload limit.`,
    tier: getSubscriptionTier(req),
    limit: getTierLimits(req).uploadsPerHour
  }),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const tenantId = getTenantId(req);
    const tier = getSubscriptionTier(req);

    logger.warn({
      tenantId,
      tier,
      path: req.path
    }, 'Tenant upload rate limit exceeded');

    res.status(429).json({
      error: 'Upload limit exceeded',
      message: `Your organization has reached the upload limit. Upgrade for more uploads.`,
      tier,
      limit: getTierLimits(req).uploadsPerHour,
      retryAfter: 3600,
      upgradeUrl: '/settings/billing'
    });
  }
});

/**
 * Tenant-aware burst protection
 * Prevents rapid-fire requests within a short window
 */
export const tenantBurstLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: (req: Request) => getTierLimits(req).burstLimit,
  keyGenerator: (req: Request) => `burst:${getTenantId(req)}`,
  message: {
    error: 'Too many requests',
    message: 'Please slow down your requests.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const tenantId = getTenantId(req);

    logger.warn({
      tenantId,
      path: req.path,
      method: req.method
    }, 'Tenant burst limit exceeded');

    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many requests in a short time. Please wait a moment.',
      retryAfter: 10
    });
  }
});

/**
 * Combined tenant rate limiting setup
 * Apply to Express app with appropriate routes
 */
export function setupTenantRateLimiting(app: any) {
  logger.info('Setting up tenant-aware rate limiting');

  // Apply burst protection globally (except health checks)
  app.use('/api', (req: Request, res: Response, next: any) => {
    if (req.path === '/health' || req.path === '/api/health') {
      return next();
    }
    return tenantBurstLimiter(req, res, next);
  });

  // Apply hourly limiter to all authenticated routes
  app.use('/api', tenantHourlyLimiter);

  // Apply AI limiter to AI routes
  app.use('/api/ai', tenantAILimiter);
  app.use('/api/master-ai', tenantAILimiter);
  app.use('/api/platform-ai', tenantAILimiter);
  app.use('/api/v1/ocr', tenantAILimiter);

  // Apply upload limiter to upload routes
  app.use('/api/upload', tenantUploadLimiter);
  app.use('/api/documents', tenantUploadLimiter);
  app.use('/api/prescriptions/upload', tenantUploadLimiter);

  logger.info('Tenant-aware rate limiting configured');
}

/**
 * Get current rate limit status for a tenant
 */
export function getTenantRateLimitStatus(tenantId: string, tier: SubscriptionTier) {
  const limits = TIER_LIMITS[tier];

  return {
    tier,
    limits: {
      requestsPerMinute: limits.requestsPerMinute,
      requestsPerHour: limits.requestsPerHour,
      aiQueriesPerHour: limits.aiQueriesPerHour,
      uploadsPerHour: limits.uploadsPerHour,
      burstLimit: limits.burstLimit
    }
  };
}

export default tenantApiLimiter;
