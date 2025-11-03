import crypto from 'crypto';

interface CacheEntry {
  response: any;
  timestamp: number;
  tenantId: string;
}

// In-memory cache (for production, use Redis)
const queryCache = new Map<string, CacheEntry>();

// Cache TTL in milliseconds (5 minutes default)
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * Generate cache key from query parameters
 */
export const generateCacheKey = (
  tenantId: string,
  queryType: string,
  query: string
): string => {
  const data = `${tenantId}:${queryType}:${query.toLowerCase().trim()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Check if a query has been cached
 */
export const checkCache = (cacheKey: string, ttl: number = DEFAULT_TTL): any | null => {
  const entry = queryCache.get(cacheKey);
  
  if (!entry) {
    return null;
  }

  const now = Date.now();
  const age = now - entry.timestamp;

  // Check if cache entry is still valid
  if (age > ttl) {
    queryCache.delete(cacheKey);
    return null;
  }

  return entry.response;
};

/**
 * Store response in cache
 */
export const cacheResponse = (
  cacheKey: string,
  response: any,
  tenantId: string
): void => {
  queryCache.set(cacheKey, {
    response,
    timestamp: Date.now(),
    tenantId
  });

  // Cleanup old entries if cache gets too large
  if (queryCache.size > 1000) {
    cleanupOldEntries();
  }
};

/**
 * Check for duplicate request (within a short time window)
 */
export const isDuplicateRequest = (
  tenantId: string,
  queryType: string,
  query: string,
  windowMs: number = 5000 // 5 seconds
): boolean => {
  const cacheKey = generateCacheKey(tenantId, queryType, query);
  const entry = queryCache.get(cacheKey);

  if (!entry) {
    return false;
  }

  const age = Date.now() - entry.timestamp;
  return age < windowMs;
};

/**
 * Invalidate cache for a tenant (admin function)
 */
export const invalidateTenantCache = (tenantId: string): number => {
  let count = 0;
  
  queryCache.forEach((entry, key) => {
    if (entry.tenantId === tenantId) {
      queryCache.delete(key);
      count++;
    }
  });

  return count;
};

/**
 * Clear entire cache (admin function)
 */
export const clearCache = (): void => {
  queryCache.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;

  queryCache.forEach(entry => {
    const age = now - entry.timestamp;
    if (age <= DEFAULT_TTL) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  });

  return {
    totalEntries: queryCache.size,
    validEntries,
    expiredEntries,
    memoryUsage: queryCache.size * 0.001 // Rough estimate in KB
  };
};

/**
 * Cleanup old cache entries
 */
const cleanupOldEntries = (): void => {
  const now = Date.now();
  const keysToDelete: string[] = [];

  queryCache.forEach((entry, key) => {
    const age = now - entry.timestamp;
    if (age > DEFAULT_TTL) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => queryCache.delete(key));
};

/**
 * Start periodic cleanup (call on server start)
 */
export const startCacheCleanup = (intervalMs: number = 60000): NodeJS.Timer => {
  return setInterval(() => {
    cleanupOldEntries();
  }, intervalMs);
};
