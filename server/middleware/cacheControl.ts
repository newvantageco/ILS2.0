/**
 * HTTP Response Caching Middleware
 *
 * Provides Cache-Control headers and ETag support for API responses.
 * Implements different caching strategies based on route patterns and
 * data sensitivity.
 *
 * Caching Strategies:
 * - PUBLIC: Cacheable by CDNs and browsers (static resources, public data)
 * - PRIVATE: Cacheable only by browser (user-specific data)
 * - NO_STORE: Never cache (PHI, sensitive data, mutations)
 * - REVALIDATE: Cache but always check for freshness
 *
 * @module server/middleware/cacheControl
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import crypto from 'crypto';
import { createLogger } from '../utils/logger';

const logger = createLogger('CacheControl');

/**
 * Cache strategy types
 */
export type CacheStrategy = 'public' | 'private' | 'no-store' | 'revalidate';

/**
 * Cache configuration for a route
 */
export interface CacheConfig {
  strategy: CacheStrategy;
  maxAge?: number; // seconds
  staleWhileRevalidate?: number; // seconds
  staleIfError?: number; // seconds
  vary?: string[]; // headers to vary on
  tags?: string[]; // cache tags for invalidation
}

/**
 * Default cache configurations by route pattern
 */
const DEFAULT_CACHE_CONFIGS: Record<string, CacheConfig> = {
  // Static/public data - cache aggressively
  '/api/docs': { strategy: 'public', maxAge: 3600, staleWhileRevalidate: 86400 },
  '/api/products': { strategy: 'private', maxAge: 300, staleWhileRevalidate: 600 },
  '/api/settings/public': { strategy: 'public', maxAge: 3600 },
  '/metrics': { strategy: 'public', maxAge: 15 },

  // User-specific data - cache privately with short TTL
  '/api/users/me': { strategy: 'private', maxAge: 60 },
  '/api/notifications': { strategy: 'private', maxAge: 30 },
  '/api/dashboard': { strategy: 'private', maxAge: 60, staleWhileRevalidate: 120 },

  // Reference data - cache with revalidation
  '/api/inventory/categories': { strategy: 'private', maxAge: 600, staleWhileRevalidate: 1800 },
  '/api/settings': { strategy: 'private', maxAge: 300 },

  // PHI/Sensitive data - never cache
  '/api/patients': { strategy: 'no-store' },
  '/api/examinations': { strategy: 'no-store' },
  '/api/prescriptions': { strategy: 'no-store' },
  '/api/medical': { strategy: 'no-store' },
  '/api/nhs': { strategy: 'no-store' },

  // Real-time data - must revalidate
  '/api/orders': { strategy: 'revalidate', maxAge: 0 },
  '/api/invoices': { strategy: 'revalidate', maxAge: 0 },
  '/api/analytics': { strategy: 'private', maxAge: 60, staleWhileRevalidate: 300 },
};

/**
 * Routes that should never be cached (mutations, auth, PHI)
 */
const NO_CACHE_PATTERNS = [
  /^\/api\/auth\//,
  /^\/api\/patients/,
  /^\/api\/examinations/,
  /^\/api\/prescriptions/,
  /^\/api\/medical/,
  /^\/api\/nhs/,
  /^\/api\/.*\/phi/,
  /^\/api\/stripe/,
  /^\/api\/webhook/,
];

/**
 * HTTP methods that should never be cached
 */
const NO_CACHE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Generate ETag from response body
 */
function generateETag(body: string | Buffer): string {
  const hash = crypto.createHash('md5').update(body).digest('hex');
  return `"${hash.substring(0, 16)}"`;
}

/**
 * Generate weak ETag (allows semantic equivalence)
 */
function generateWeakETag(body: string | Buffer): string {
  const hash = crypto.createHash('md5').update(body).digest('hex');
  return `W/"${hash.substring(0, 16)}"`;
}

/**
 * Check if request has matching ETag (conditional request)
 */
function checkConditionalRequest(req: Request, etag: string): boolean {
  const ifNoneMatch = req.headers['if-none-match'];
  if (!ifNoneMatch) return false;

  // Handle multiple ETags
  const tags = ifNoneMatch.split(',').map(t => t.trim());
  return tags.includes(etag) || tags.includes('*');
}

/**
 * Build Cache-Control header value
 */
function buildCacheControlHeader(config: CacheConfig): string {
  const directives: string[] = [];

  switch (config.strategy) {
    case 'public':
      directives.push('public');
      break;
    case 'private':
      directives.push('private');
      break;
    case 'no-store':
      directives.push('no-store', 'no-cache', 'must-revalidate');
      return directives.join(', ');
    case 'revalidate':
      directives.push('no-cache');
      break;
  }

  if (config.maxAge !== undefined) {
    directives.push(`max-age=${config.maxAge}`);
  }

  if (config.staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  }

  if (config.staleIfError !== undefined) {
    directives.push(`stale-if-error=${config.staleIfError}`);
  }

  return directives.join(', ');
}

/**
 * Find matching cache config for a path
 */
function findCacheConfig(path: string): CacheConfig | null {
  // Check exact match first
  if (DEFAULT_CACHE_CONFIGS[path]) {
    return DEFAULT_CACHE_CONFIGS[path];
  }

  // Check prefix matches (longest first)
  const sortedPaths = Object.keys(DEFAULT_CACHE_CONFIGS)
    .filter(p => path.startsWith(p))
    .sort((a, b) => b.length - a.length);

  if (sortedPaths.length > 0) {
    return DEFAULT_CACHE_CONFIGS[sortedPaths[0]];
  }

  return null;
}

/**
 * Check if path matches no-cache patterns
 */
function isNoCachePath(path: string): boolean {
  return NO_CACHE_PATTERNS.some(pattern => pattern.test(path));
}

/**
 * Main cache control middleware
 *
 * Automatically applies appropriate Cache-Control headers based on:
 * - Request method (mutations never cached)
 * - Route patterns (PHI never cached)
 * - Response status (errors not cached)
 * - Custom configuration
 */
export function cacheControl(customConfig?: CacheConfig): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET methods
    if (NO_CACHE_METHODS.includes(req.method)) {
      res.setHeader('Cache-Control', 'no-store');
      return next();
    }

    // Skip caching for sensitive paths
    if (isNoCachePath(req.path)) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return next();
    }

    // Find appropriate cache config
    const config = customConfig || findCacheConfig(req.path) || {
      strategy: 'private' as CacheStrategy,
      maxAge: 0,
    };

    // Capture original json method for ETag generation
    const originalJson = res.json.bind(res);
    let responseBody: any = null;

    res.json = function(body: any) {
      responseBody = body;

      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Set Cache-Control header
        res.setHeader('Cache-Control', buildCacheControlHeader(config));

        // Generate and set ETag for GET requests
        if (req.method === 'GET' && body) {
          const bodyString = JSON.stringify(body);
          const etag = config.strategy === 'public'
            ? generateETag(bodyString)
            : generateWeakETag(bodyString);

          res.setHeader('ETag', etag);

          // Check for conditional request (304 Not Modified)
          if (checkConditionalRequest(req, etag)) {
            res.status(304);
            return res.end();
          }
        }

        // Set Vary header if configured
        if (config.vary && config.vary.length > 0) {
          res.setHeader('Vary', config.vary.join(', '));
        } else {
          // Default: vary on Accept-Encoding and Authorization
          res.setHeader('Vary', 'Accept-Encoding, Authorization');
        }
      } else {
        // Don't cache error responses
        res.setHeader('Cache-Control', 'no-store');
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Middleware for static/public resources
 */
export function publicCache(maxAge: number = 3600): RequestHandler {
  return cacheControl({
    strategy: 'public',
    maxAge,
    staleWhileRevalidate: maxAge * 2,
  });
}

/**
 * Middleware for private/user-specific resources
 */
export function privateCache(maxAge: number = 300): RequestHandler {
  return cacheControl({
    strategy: 'private',
    maxAge,
    staleWhileRevalidate: maxAge,
  });
}

/**
 * Middleware to prevent all caching (PHI, sensitive data)
 */
export function noCache(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  };
}

/**
 * Middleware for data that must always be fresh
 */
export function mustRevalidate(): RequestHandler {
  return cacheControl({
    strategy: 'revalidate',
    maxAge: 0,
  });
}

/**
 * Global cache control middleware
 * Applies default caching rules based on path patterns
 */
export function globalCacheControl(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    // Apply cache control based on path
    const middleware = cacheControl();
    return middleware(req, res, next);
  };
}

/**
 * Cache invalidation helper
 * Call this after mutations to invalidate related caches
 */
export function invalidateCache(tags: string[]): void {
  // In a full implementation, this would:
  // 1. Notify CDN to purge cached content
  // 2. Update cache version in Redis
  // 3. Broadcast invalidation to other instances
  logger.info({ tags }, 'Cache invalidation requested');
}

/**
 * Surrogate-Key header for CDN cache invalidation
 */
export function addSurrogateKeys(keys: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Surrogate-Key', keys.join(' '));
    next();
  };
}

/**
 * Cache statistics tracking
 */
interface CacheStats {
  hits: number;
  misses: number;
  conditionalHits: number;
}

const cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  conditionalHits: 0,
};

export function getCacheStats(): CacheStats {
  return { ...cacheStats };
}

export function resetCacheStats(): void {
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.conditionalHits = 0;
}

export default cacheControl;
