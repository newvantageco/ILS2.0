/**
 * Redis Cache Service
 * Provides company-scoped caching with TTL management
 * Optimized for multi-tenant scalability with thousands of companies
 */

// Optional Redis import - gracefully falls back to in-memory cache if not available
let Redis: any;
try {
  Redis = require('ioredis');
} catch (e) {
  console.warn('ioredis not installed. Using in-memory cache only.');
  Redis = null;
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 300 = 5 minutes)
  namespace?: string; // Custom namespace for cache keys
}

interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  totalKeys: number;
}

export class CacheService {
  private redis: any = null;
  private enabled: boolean = false;
  private stats: Map<string, CacheStats> = new Map();
  private fallbackCache: Map<string, { data: any; expiry: number }> = new Map();
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly MAX_FALLBACK_SIZE = 1000;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Redis connection
   * Falls back to in-memory cache if Redis is unavailable
   */
  private initialize() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.warn('REDIS_URL not configured. Using in-memory fallback cache.');
      console.warn('For production scalability, configure Redis.');
      this.enabled = false;
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err: Error) => {
          const targetErrors = ['READONLY', 'ECONNREFUSED'];
          return targetErrors.some(targetError => err.message.includes(targetError));
        },
      });

      this.redis.on('connect', () => {
        console.log('✓ Redis cache connected successfully');
        this.enabled = true;
      });

      this.redis.on('error', (err: Error) => {
        console.error('Redis cache error:', err.message);
        this.enabled = false;
      });

      this.redis.on('close', () => {
        console.warn('Redis cache connection closed. Using fallback cache.');
        this.enabled = false;
      });

    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.enabled = false;
    }
  }

  /**
   * Generate company-scoped cache key
   */
  private getKey(companyId: string, key: string, namespace?: string): string {
    const ns = namespace || 'default';
    return `ils:company:${companyId}:${ns}:${key}`;
  }

  /**
   * Get cached value for a company
   */
  async get<T>(companyId: string, key: string, options?: CacheOptions): Promise<T | null> {
    const cacheKey = this.getKey(companyId, key, options?.namespace);
    
    try {
      if (this.enabled && this.redis) {
        const value = await this.redis.get(cacheKey);
        
        if (value) {
          this.recordHit(companyId);
          return JSON.parse(value) as T;
        }
        
        this.recordMiss(companyId);
        return null;
      } else {
        // Fallback to in-memory cache
        return this.getFallback<T>(cacheKey);
      }
    } catch (error) {
      console.error('Cache get error:', error);
      this.recordError(companyId);
      return null;
    }
  }

  /**
   * Set cached value for a company
   */
  async set<T>(
    companyId: string,
    key: string,
    value: T,
    options?: CacheOptions
  ): Promise<boolean> {
    const cacheKey = this.getKey(companyId, key, options?.namespace);
    const ttl = options?.ttl || this.DEFAULT_TTL;

    try {
      if (this.enabled && this.redis) {
        await this.redis.setex(cacheKey, ttl, JSON.stringify(value));
        return true;
      } else {
        // Fallback to in-memory cache
        this.setFallback(cacheKey, value, ttl);
        return true;
      }
    } catch (error) {
      console.error('Cache set error:', error);
      this.recordError(companyId);
      return false;
    }
  }

  /**
   * Delete cached value for a company
   */
  async delete(companyId: string, key: string, options?: CacheOptions): Promise<boolean> {
    const cacheKey = this.getKey(companyId, key, options?.namespace);

    try {
      if (this.enabled && this.redis) {
        await this.redis.del(cacheKey);
        return true;
      } else {
        this.fallbackCache.delete(cacheKey);
        return true;
      }
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Invalidate all cache entries for a company
   */
  async invalidateCompany(companyId: string, namespace?: string): Promise<number> {
    try {
      if (this.enabled && this.redis) {
        const pattern = namespace 
          ? `ils:company:${companyId}:${namespace}:*`
          : `ils:company:${companyId}:*`;
        
        const keys = await this.redis.keys(pattern);
        
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        
        return keys.length;
      } else {
        // Fallback: delete matching keys from in-memory cache
        let count = 0;
        const prefix = namespace 
          ? `ils:company:${companyId}:${namespace}:`
          : `ils:company:${companyId}:`;
        
        const keysArray = Array.from(this.fallbackCache.keys());
        for (const key of keysArray) {
          if (key.startsWith(prefix)) {
            this.fallbackCache.delete(key);
            count++;
          }
        }
        
        return count;
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
      return 0;
    }
  }

  /**
   * Get or compute cached value (cache-aside pattern)
   */
  async getOrSet<T>(
    companyId: string,
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(companyId, key, options);
    
    if (cached !== null) {
      return cached;
    }

    // Cache miss - compute value
    const value = await factory();

    // Store in cache (don't wait)
    this.set(companyId, key, value, options).catch(err => {
      console.error('Background cache set failed:', err);
    });

    return value;
  }

  /**
   * Get cache statistics for a company
   */
  getStats(companyId: string): CacheStats {
    return this.stats.get(companyId) || {
      hits: 0,
      misses: 0,
      errors: 0,
      totalKeys: 0,
    };
  }

  /**
   * Get overall cache health status
   */
  async getHealth(): Promise<{
    enabled: boolean;
    connected: boolean;
    type: 'redis' | 'memory';
    stats: { totalCompanies: number; totalKeys: number };
  }> {
    const totalCompanies = this.stats.size;
    let totalKeys = 0;

    if (this.enabled && this.redis) {
      try {
        const keys = await this.redis.keys('ils:company:*');
        totalKeys = keys.length;
      } catch (error) {
        console.error('Failed to get cache health:', error);
      }
    } else {
      totalKeys = this.fallbackCache.size;
    }

    return {
      enabled: this.enabled,
      connected: this.enabled && this.redis !== null,
      type: this.enabled ? 'redis' : 'memory',
      stats: {
        totalCompanies,
        totalKeys,
      },
    };
  }

  /**
   * Fallback in-memory cache methods
   */
  private getFallback<T>(key: string): T | null {
    const entry = this.fallbackCache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.fallbackCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setFallback<T>(key: string, value: T, ttl: number): void {
    // Enforce size limit
    if (this.fallbackCache.size >= this.MAX_FALLBACK_SIZE) {
      // Remove oldest entries (simple FIFO)
      const firstKey = this.fallbackCache.keys().next().value;
      if (firstKey) {
        this.fallbackCache.delete(firstKey);
      }
    }

    this.fallbackCache.set(key, {
      data: value,
      expiry: Date.now() + (ttl * 1000),
    });
  }

  /**
   * Statistics tracking
   */
  private recordHit(companyId: string): void {
    const stats = this.getStats(companyId);
    stats.hits++;
    this.stats.set(companyId, stats);
  }

  private recordMiss(companyId: string): void {
    const stats = this.getStats(companyId);
    stats.misses++;
    this.stats.set(companyId, stats);
  }

  private recordError(companyId: string): void {
    const stats = this.getStats(companyId);
    stats.errors++;
    this.stats.set(companyId, stats);
  }

  /**
   * Clean up expired entries from fallback cache
   */
  private cleanupFallback(): void {
    const now = Date.now();
    const entries = Array.from(this.fallbackCache.entries());
    for (const [key, entry] of entries) {
      if (now > entry.expiry) {
        this.fallbackCache.delete(key);
      }
    }
  }

  /**
   * Start periodic cleanup (call once on app startup)
   */
  startCleanup(intervalMs: number = 60000): void {
    setInterval(() => {
      if (!this.enabled) {
        this.cleanupFallback();
      }
    }, intervalMs);
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      console.log('Redis cache connection closed');
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();

// Start cleanup timer
cacheService.startCleanup();

// Export common cache namespaces for consistency
export const CacheNamespaces = {
  PRODUCTS: 'products',
  ORDERS: 'orders',
  PATIENTS: 'patients',
  METRICS: 'metrics',
  AI_RECOMMENDATIONS: 'ai_recs',
  INVENTORY: 'inventory',
  ANALYTICS: 'analytics',
  USER_PERMISSIONS: 'permissions',
} as const;
