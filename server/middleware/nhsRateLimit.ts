/**
 * NHS PCSE API Rate Limiting Middleware
 *
 * Implements rate limiting for PCSE API calls to comply with NHS API limits.
 *
 * Default limits (can be configured via environment variables):
 * - 10 requests per minute per company
 * - 100 requests per hour per company
 *
 * Uses in-memory storage for simplicity. For production with multiple
 * servers, consider Redis or a distributed cache.
 *
 * @module server/middleware/nhsRateLimit
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('nhs-rate-limit');

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

// In-memory rate limit store
// Key format: "{companyId}:{window}"
// Window: "minute" or "hour"
const rateLimitStore: RateLimitStore = {};

// Configuration
const REQUESTS_PER_MINUTE = parseInt(process.env.NHS_API_RATE_LIMIT_MINUTE || '10');
const REQUESTS_PER_HOUR = parseInt(process.env.NHS_API_RATE_LIMIT_HOUR || '100');

/**
 * Clean up expired rate limit entries
 * Runs periodically to prevent memory bloat
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const key in rateLimitStore) {
    if (rateLimitStore[key].resetAt < now) {
      delete rateLimitStore[key];
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.debug({ cleaned }, 'Cleaned up expired rate limit entries');
  }
}

// Clean up every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Check and update rate limit for a company
 *
 * @param companyId - The company ID
 * @param window - The time window ('minute' or 'hour')
 * @param limit - The request limit for this window
 * @returns Object with allowed flag and reset time
 */
function checkRateLimit(
  companyId: string,
  window: 'minute' | 'hour',
  limit: number
): { allowed: boolean; resetAt: number; remaining: number } {
  const now = Date.now();
  const key = `${companyId}:${window}`;
  const windowMs = window === 'minute' ? 60 * 1000 : 60 * 60 * 1000;

  // Get or create entry
  let entry = rateLimitStore[key];

  if (!entry || entry.resetAt < now) {
    // Create new entry
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
    rateLimitStore[key] = entry;
  }

  // Check if limit exceeded
  if (entry.count >= limit) {
    return {
      allowed: false,
      resetAt: entry.resetAt,
      remaining: 0,
    };
  }

  // Increment count
  entry.count++;

  return {
    allowed: true,
    resetAt: entry.resetAt,
    remaining: limit - entry.count,
  };
}

/**
 * NHS PCSE API Rate Limit Middleware
 *
 * Apply this to routes that make PCSE API calls.
 * Checks both per-minute and per-hour limits.
 *
 * Example usage:
 * ```typescript
 * router.post('/api/nhs/claims/:id/submit', nhsRateLimit, async (req, res) => {
 *   // Handler code
 * });
 * ```
 */
export function nhsRateLimit(req: Request, res: Response, next: NextFunction): void {
  // Get company ID from authenticated user
  const companyId = (req as any).user?.companyId;

  if (!companyId) {
    // No company ID, skip rate limiting (will fail auth elsewhere)
    return next();
  }

  // Check per-minute limit
  const minuteLimit = checkRateLimit(companyId, 'minute', REQUESTS_PER_MINUTE);
  if (!minuteLimit.allowed) {
    const retryAfter = Math.ceil((minuteLimit.resetAt - Date.now()) / 1000);
    logger.warn({ companyId, retryAfter }, 'Per-minute rate limit exceeded');

    res.set('Retry-After', retryAfter.toString());
    res.set('X-RateLimit-Limit', REQUESTS_PER_MINUTE.toString());
    res.set('X-RateLimit-Remaining', '0');
    res.set('X-RateLimit-Reset', minuteLimit.resetAt.toString());

    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Too many NHS API requests. Maximum ${REQUESTS_PER_MINUTE} requests per minute.`,
      retryAfter,
      resetAt: new Date(minuteLimit.resetAt).toISOString(),
    });
  }

  // Check per-hour limit
  const hourLimit = checkRateLimit(companyId, 'hour', REQUESTS_PER_HOUR);
  if (!hourLimit.allowed) {
    const retryAfter = Math.ceil((hourLimit.resetAt - Date.now()) / 1000);
    logger.warn({ companyId, retryAfter }, 'Per-hour rate limit exceeded');

    res.set('Retry-After', retryAfter.toString());
    res.set('X-RateLimit-Limit', REQUESTS_PER_HOUR.toString());
    res.set('X-RateLimit-Remaining', '0');
    res.set('X-RateLimit-Reset', hourLimit.resetAt.toString());

    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Too many NHS API requests. Maximum ${REQUESTS_PER_HOUR} requests per hour.`,
      retryAfter,
      resetAt: new Date(hourLimit.resetAt).toISOString(),
    });
  }

  // Set rate limit headers
  res.set('X-RateLimit-Limit-Minute', REQUESTS_PER_MINUTE.toString());
  res.set('X-RateLimit-Remaining-Minute', minuteLimit.remaining.toString());
  res.set('X-RateLimit-Reset-Minute', minuteLimit.resetAt.toString());
  res.set('X-RateLimit-Limit-Hour', REQUESTS_PER_HOUR.toString());
  res.set('X-RateLimit-Remaining-Hour', hourLimit.remaining.toString());
  res.set('X-RateLimit-Reset-Hour', hourLimit.resetAt.toString());

  logger.debug({
    companyId,
    minuteRemaining: minuteLimit.remaining,
    hourRemaining: hourLimit.remaining
  }, 'Rate limit check passed');

  next();
}

/**
 * Get current rate limit status for a company
 *
 * Useful for monitoring and debugging.
 *
 * @param companyId - The company ID
 * @returns Rate limit status
 */
export function getRateLimitStatus(companyId: string): {
  minute: { count: number; limit: number; resetAt: number };
  hour: { count: number; limit: number; resetAt: number };
} {
  const now = Date.now();

  const minuteKey = `${companyId}:minute`;
  const hourKey = `${companyId}:hour`;

  const minuteEntry = rateLimitStore[minuteKey];
  const hourEntry = rateLimitStore[hourKey];

  return {
    minute: {
      count: minuteEntry && minuteEntry.resetAt >= now ? minuteEntry.count : 0,
      limit: REQUESTS_PER_MINUTE,
      resetAt: minuteEntry?.resetAt || 0,
    },
    hour: {
      count: hourEntry && hourEntry.resetAt >= now ? hourEntry.count : 0,
      limit: REQUESTS_PER_HOUR,
      resetAt: hourEntry?.resetAt || 0,
    },
  };
}
