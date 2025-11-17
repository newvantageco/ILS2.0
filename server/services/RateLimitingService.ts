/**
 * Rate Limiting Service
 * 
 * Comprehensive rate limiting for AI/ML endpoints to prevent abuse,
 * control costs, and ensure fair usage across all users.
 * 
 * Features:
 * - Multi-tier rate limiting (user, tenant, global)
 * - Sliding window algorithm for accurate limiting
 * - Redis-based distributed limiting
 * - Configurable limits per endpoint type
 * - Burst protection and gradual recovery
 * - Usage analytics and monitoring
 */

import Redis from 'ioredis';
import { storage } from '../storage';
import { logger } from '../utils/logger';

interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Max requests per window
  keyGenerator?: (req: any) => string;  // Custom key generator
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  totalHits: number;
  retryAfter?: number;
}

interface UsageMetrics {
  userId: string;
  tenantId: string;
  endpoint: string;
  requests: number;
  windowStart: Date;
  cost?: number;
}

interface RateLimitTier {
  name: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
  costPerRequest?: number;
}

export class RateLimitingService {
  private redis: Redis;
  private logger = logger.child({ service: 'rate-limiting' });

  // Rate limit tiers for different user types
  private readonly tiers: Map<string, RateLimitTier> = new Map([
    ['free', {
      name: 'Free',
      requestsPerMinute: 10,
      requestsPerHour: 100,
      requestsPerDay: 500,
      burstLimit: 20,
      costPerRequest: 0.01
    }],
    ['basic', {
      name: 'Basic',
      requestsPerMinute: 30,
      requestsPerHour: 500,
      requestsPerDay: 2000,
      burstLimit: 50,
      costPerRequest: 0.008
    }],
    ['professional', {
      name: 'Professional',
      requestsPerMinute: 100,
      requestsPerHour: 2000,
      requestsPerDay: 10000,
      burstLimit: 150,
      costPerRequest: 0.006
    }],
    ['enterprise', {
      name: 'Enterprise',
      requestsPerMinute: 500,
      requestsPerHour: 10000,
      requestsPerDay: 50000,
      burstLimit: 750,
      costPerRequest: 0.004
    }]
  ]);

  // Endpoint-specific limits
  private readonly endpointLimits: Map<string, RateLimitConfig> = new Map([
    // AI/ML endpoints - most restrictive
    ['/api/ai/ocr/prescription', {
      windowMs: 60 * 1000,  // 1 minute
      maxRequests: 10,
      message: 'Too many prescription uploads. Please wait before trying again.'
    }],
    ['/api/ai/analyze', {
      windowMs: 60 * 1000,  // 1 minute
      maxRequests: 20,
      message: 'Too many AI analysis requests. Please wait before trying again.'
    }],
    ['/api/ai/recommendations', {
      windowMs: 60 * 1000,  // 1 minute
      maxRequests: 30,
      message: 'Too many recommendation requests. Please wait before trying again.'
    }],
    ['/api/v1/ocr/prescription', {
      windowMs: 60 * 1000,  // 1 minute
      maxRequests: 10,
      message: 'Too many OCR requests. Please wait before trying again.'
    }],
    ['/api/v1/models/test', {
      windowMs: 60 * 1000,  // 1 minute
      maxRequests: 15,
      message: 'Too many model test requests. Please wait before trying again.'
    }],
    
    // Shopify widget endpoints - moderate limits
    ['/api/shopify/widgets/prescription/upload', {
      windowMs: 60 * 1000,  // 1 minute
      maxRequests: 25,
      message: 'Too many widget uploads. Please wait before trying again.'
    }],
    ['/api/shopify/widgets/recommendations', {
      windowMs: 60 * 1000,  // 1 minute
      maxRequests: 50,
      message: 'Too many widget recommendations. Please wait before trying again.'
    }],
    
    // General API endpoints - lenient limits
    ['/api/analytics', {
      windowMs: 60 * 1000,  // 1 minute
      maxRequests: 100,
      message: 'Too many analytics requests. Please wait before trying again.'
    }],
    ['/api/shopify', {
      windowMs: 60 * 1000,  // 1 minute
      maxRequests: 200,
      message: 'Too many Shopify requests. Please wait before trying again.'
    }]
  ]);

  constructor() {
    // Don't initialize Redis immediately - wait for first use
    // This prevents connecting to localhost:6379 at module load time in Docker
  }

  /**
   * Initialize Redis connection (lazy)
   */
  private initializeRedis(): void {
    if (this.redis) return; // Already initialized

    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.redis.on('error', (error) => {
      this.logger.error({ error }, 'Redis connection error');
    });

    this.redis.on('connect', () => {
      this.logger.info('Redis connected for rate limiting');
    });
  }

  /**
   * Check if a request is allowed based on rate limits
   */
  async checkRateLimit(
    identifier: string,
    config: RateLimitConfig,
    endpoint: string,
    userId?: string,
    tenantId?: string
  ): Promise<RateLimitResult> {
    this.initializeRedis(); // Lazy initialization
    
    const key = `rate_limit:${identifier}:${endpoint}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline();
      
      // Remove old entries outside the window
      pipeline.zremrangebyscore(key, 0, windowStart);
      
      // Add current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      
      // Count requests in current window
      pipeline.zcard(key);
      
      // Set expiration for cleanup
      pipeline.expire(key, Math.ceil(config.windowMs / 1000) + 1);
      
      const results = await pipeline.exec();
      const totalHits = results?.[2]?.[1] as number || 0;

      const allowed = totalHits <= config.maxRequests;
      const remaining = Math.max(0, config.maxRequests - totalHits);
      const resetTime = new Date(now + config.windowMs);

      // Log usage for analytics
      if (userId && tenantId) {
        await this.recordUsage({
          userId,
          tenantId,
          endpoint,
          requests: totalHits,
          windowStart: new Date(windowStart),
          cost: this.calculateEndpointCost(endpoint)
        });
      }

      // Check if user is over their tier limits
      if (userId && tenantId) {
        const tierResult = await this.checkTierLimits(userId, tenantId, endpoint);
        if (!tierResult.allowed) {
          return {
            allowed: false,
            remaining: 0,
            resetTime: tierResult.resetTime,
            totalHits: tierResult.totalHits,
            retryAfter: Math.ceil((tierResult.resetTime.getTime() - Date.now()) / 1000)
          };
        }
      }

      this.logger.debug(`Rate limit check ${identifier} ${endpoint} allowed:${allowed} totalHits:${totalHits} remaining:${remaining} config:${config.maxRequests}/${config.windowMs}ms`);

      return {
        allowed,
        remaining,
        resetTime,
        totalHits
      };

    } catch (error) {
      this.logger.error({ error, identifier, endpoint }, 'Rate limit check failed');
      
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: new Date(Date.now() + config.windowMs),
        totalHits: 0
      };
    }
  }

  /**
   * Check user-specific tier limits
   */
  private async checkTierLimits(
    userId: string,
    tenantId: string,
    endpoint: string
  ): Promise<RateLimitResult> {
    try {
      // Get user's subscription tier
      const user = await storage.getUser(userId);
      const company = await storage.getCompany(tenantId);
      
      const tierName = company?.subscriptionPlan || user?.subscriptionPlan || 'free';
      const tier = this.tiers.get(tierName) || this.tiers.get('free')!;

      const now = new Date();
      const minuteKey = `tier_limit:${tenantId}:${endpoint}:minute:${Math.floor(now.getTime() / 60000)}`;
      const hourKey = `tier_limit:${tenantId}:${endpoint}:hour:${Math.floor(now.getTime() / 3600000)}`;
      const dayKey = `tier_limit:${tenantId}:${endpoint}:day:${Math.floor(now.getTime() / 86400000)}`;

      const pipeline = this.redis.pipeline();
      
      // Check minute limit
      pipeline.incr(minuteKey);
      pipeline.expire(minuteKey, 60);
      
      // Check hour limit
      pipeline.incr(hourKey);
      pipeline.expire(hourKey, 3600);
      
      // Check day limit
      pipeline.incr(dayKey);
      pipeline.expire(dayKey, 86400);

      const results = await pipeline.exec();
      const minuteCount = results?.[0]?.[1] as number || 0;
      const hourCount = results?.[2]?.[1] as number || 0;
      const dayCount = results?.[4]?.[1] as number || 0;

      // Check if any limit is exceeded
      if (minuteCount > tier.requestsPerMinute) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(now.getTime() + 60000),
          totalHits: minuteCount,
          retryAfter: 60
        };
      }

      if (hourCount > tier.requestsPerHour) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(now.getTime() + 3600000),
          totalHits: hourCount,
          retryAfter: 3600
        };
      }

      if (dayCount > tier.requestsPerDay) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(now.getTime() + 86400000),
          totalHits: dayCount,
          retryAfter: 86400
        };
      }

      return {
        allowed: true,
        remaining: Math.min(
          tier.requestsPerMinute - minuteCount,
          tier.requestsPerHour - hourCount,
          tier.requestsPerDay - dayCount
        ),
        resetTime: new Date(now.getTime() + 60000),
        totalHits: minuteCount
      };

    } catch (error) {
      this.logger.error({ error, userId, tenantId }, 'Tier limit check failed');
      return { allowed: true, remaining: 0, resetTime: new Date(), totalHits: 0 };
    }
  }

  /**
   * Get rate limit configuration for an endpoint
   */
  getEndpointConfig(endpoint: string): RateLimitConfig | null {
    // Exact match first
    if (this.endpointLimits.has(endpoint)) {
      return this.endpointLimits.get(endpoint)!;
    }

    // Prefix match for dynamic routes
    for (const [key, config] of Array.from(this.endpointLimits.entries())) {
      if (endpoint.startsWith(key)) {
        return config;
      }
    }

    // Default limits
    return {
      windowMs: 60 * 1000,  // 1 minute
      maxRequests: 100,
      message: 'Rate limit exceeded. Please try again later.'
    };
  }

  /**
   * Calculate cost for an endpoint
   */
  private calculateEndpointCost(endpoint: string): number {
    const costs: Record<string, number> = {
      '/api/ai/ocr/prescription': 0.02,
      '/api/v1/ocr/prescription': 0.02,
      '/api/ai/analyze': 0.015,
      '/api/v1/models/test': 0.01,
      '/api/shopify/widgets/prescription/upload': 0.005,
      '/api/shopify/widgets/recommendations': 0.003
    };

    // Find matching endpoint cost
    for (const [key, cost] of Object.entries(costs)) {
      if (endpoint.startsWith(key)) {
        return cost;
      }
    }

    return 0.001; // Default minimal cost
  }

  /**
   * Generate rate limit key for request
   */
  generateKey(req: any, type: 'user' | 'tenant' | 'ip' | 'global' = 'user'): string {
    switch (type) {
      case 'user':
        return req.user?.id || req.auth?.userId || 'anonymous';
      case 'tenant':
        return req.user?.tenantId || req.auth?.tenantId || 'no-tenant';
      case 'ip':
        return req.ip || req.connection?.remoteAddress || 'unknown-ip';
      case 'global':
        return 'global';
      default:
        return 'anonymous';
    }
  }

  /**
   * Record usage for analytics
   */
  private async recordUsage(metrics: UsageMetrics): Promise<void> {
    this.initializeRedis();
    try {
      const usageKey = `usage:${metrics.tenantId}:${Date.now()}`;
      await this.redis.setex(
        usageKey,
        86400, // 24 hours
        JSON.stringify(metrics)
      );
    } catch (error) {
      this.logger.error({ error, metrics }, 'Failed to record usage');
    }
  }

  /**
   * Get usage analytics for a tenant
   */
  async getUsageAnalytics(
    tenantId: string,
    timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<any> {
    try {
      const now = Date.now();
      let startTime: number;
      let pattern: string;

      switch (timeRange) {
        case 'hour':
          startTime = now - 3600000;
          pattern = `usage:${tenantId}:*`;
          break;
        case 'day':
          startTime = now - 86400000;
          pattern = `usage:${tenantId}:*`;
          break;
        case 'week':
          startTime = now - 604800000;
          pattern = `usage:${tenantId}:*`;
          break;
        case 'month':
          startTime = now - 2592000000;
          pattern = `usage:${tenantId}:*`;
          break;
      }

      const keys = await this.redis.keys(pattern);
      const usageData = await this.redis.mget(keys);

      const analytics: any = {
        totalRequests: 0,
        uniqueEndpoints: new Set<string>(),
        totalCost: 0,
        endpointBreakdown: {} as Record<string, number>,
        hourlyUsage: {} as Record<string, number>
      };

      usageData.forEach((data) => {
        if (data) {
          const metrics: UsageMetrics = JSON.parse(data);
          analytics.totalRequests += metrics.requests;
          analytics.uniqueEndpoints.add(metrics.endpoint);
          analytics.totalCost += metrics.cost || 0;

          // Endpoint breakdown
          if (!analytics.endpointBreakdown[metrics.endpoint]) {
            analytics.endpointBreakdown[metrics.endpoint] = 0;
          }
          analytics.endpointBreakdown[metrics.endpoint] += metrics.requests;

          // Hourly breakdown
          const hour = new Date(metrics.windowStart).getHours();
          if (!analytics.hourlyUsage[hour]) {
            analytics.hourlyUsage[hour] = 0;
          }
          analytics.hourlyUsage[hour] += metrics.requests;
        }
      });

      return {
        ...analytics,
        uniqueEndpoints: Array.from(analytics.uniqueEndpoints),
        timeRange,
        tenantId,
        generatedAt: new Date()
      };

    } catch (error) {
      this.logger.error({ error, tenantId, timeRange }, 'Failed to get usage analytics');
      return null;
    }
  }

  /**
   * Reset rate limits for a user or tenant
   */
  async resetRateLimits(identifier: string, endpoint?: string): Promise<void> {
    this.initializeRedis();
    try {
      const pattern = endpoint 
        ? `rate_limit:${identifier}:${endpoint}*`
        : `rate_limit:${identifier}:*`;
      
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.info({ identifier, endpoint, keysDeleted: keys.length }, 'Rate limits reset');
      }
    } catch (error) {
      this.logger.error({ error, identifier, endpoint }, 'Failed to reset rate limits');
    }
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus(identifier: string, endpoint: string): Promise<any> {
    this.initializeRedis();
    try {
      const config = this.getEndpointConfig(endpoint);
      if (!config) {
        return null;
      }

      const key = `rate_limit:${identifier}:${endpoint}`;
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Remove old entries and count current
      await this.redis.zremrangebyscore(key, 0, windowStart);
      const totalHits = await this.redis.zcard(key);

      return {
        identifier,
        endpoint,
        currentUsage: totalHits,
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - totalHits),
        windowMs: config.windowMs,
        resetTime: new Date(now + config.windowMs),
        percentageUsed: (totalHits / config.maxRequests) * 100
      };

    } catch (error) {
      this.logger.error({ error, identifier, endpoint }, 'Failed to get rate limit status');
      return null;
    }
  }

  /**
   * Cleanup old rate limit data
   */
  async cleanup(): Promise<void> {
    this.initializeRedis();
    try {
      const pattern = 'rate_limit:*';
      const keys = await this.redis.keys(pattern);
      
      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) { // No expiration set
          await this.redis.expire(key, 3600); // Set 1 hour expiration
        }
      }

      this.logger.debug({ keysProcessed: keys.length }, 'Rate limit cleanup completed');
    } catch (error) {
      this.logger.error({ error }, 'Rate limit cleanup failed');
    }
  }

  /**
   * Get rate limiting statistics
   */
  async getStatistics(): Promise<any> {
    this.initializeRedis();
    try {
      const pattern = 'rate_limit:*';
      const keys = await this.redis.keys(pattern);
      
      let totalActiveKeys = 0;
      let totalRequests = 0;
      const endpointUsage: Record<string, number> = {};

      for (const key of keys) {
        const requests = await this.redis.zcard(key);
        if (requests > 0) {
          totalActiveKeys++;
          totalRequests += requests;
          
          // Extract endpoint from key
          const parts = key.split(':');
          if (parts.length >= 3) {
            const endpoint = parts[parts.length - 1];
            endpointUsage[endpoint] = (endpointUsage[endpoint] || 0) + requests;
          }
        }
      }

      return {
        totalActiveKeys,
        totalRequests,
        uniqueEndpoints: Object.keys(endpointUsage).length,
        endpointUsage,
        generatedAt: new Date()
      };

    } catch (error) {
      this.logger.error({ error }, 'Failed to get rate limiting statistics');
      return null;
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

export const rateLimitingService = new RateLimitingService();
