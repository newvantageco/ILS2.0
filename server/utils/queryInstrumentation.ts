/**
 * Database Query Instrumentation
 * Wraps database queries with performance tracking
 */

import { performance } from 'perf_hooks';
import { trackQuery } from '../middleware/performance';

/**
 * Instrument a database query with performance tracking
 *
 * @example
 * const patients = await instrumentQuery(
 *   'getPatients',
 *   () => db.select().from(schema.patients).where(eq(schema.patients.companyId, companyId))
 * );
 */
export async function instrumentQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  endpoint?: string
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - startTime;

    // Track query performance
    trackQuery(queryName, duration, endpoint);

    // Log in development
    if (process.env.NODE_ENV === 'development' && duration > 50) {
      console.debug(`🔍 Query "${queryName}": ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`❌ Query "${queryName}" failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
}

/**
 * Batch query instrumentation
 * Tracks performance of multiple related queries
 */
export class QueryBatch {
  private queries: Array<{ name: string; duration: number }> = [];
  private batchStartTime: number;
  private batchName: string;

  constructor(batchName: string) {
    this.batchName = batchName;
    this.batchStartTime = performance.now();
  }

  /**
   * Execute and track a query within this batch
   */
  async execute<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await queryFn();
      const duration = performance.now() - startTime;

      this.queries.push({ name: queryName, duration });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.queries.push({ name: `${queryName} (failed)`, duration });
      throw error;
    }
  }

  /**
   * Complete the batch and log results
   */
  complete() {
    const totalDuration = performance.now() - this.batchStartTime;

    if (totalDuration > 200 || process.env.NODE_ENV === 'development') {
      console.log(`📦 Batch "${this.batchName}": ${totalDuration.toFixed(2)}ms total`);
      this.queries.forEach(q => {
        console.log(`  - ${q.name}: ${q.duration.toFixed(2)}ms`);
      });
    }

    // Track the batch as a query
    trackQuery(this.batchName, totalDuration);
  }
}

/**
 * Create a query performance monitor for a specific context
 */
export function createQueryMonitor(context: string) {
  const queries: Array<{ query: string; duration: number }> = [];
  const startTime = performance.now();

  return {
    track: async <T>(queryName: string, queryFn: () => Promise<T>): Promise<T> => {
      const qStartTime = performance.now();
      try {
        const result = await queryFn();
        const duration = performance.now() - qStartTime;
        queries.push({ query: queryName, duration });
        return result;
      } catch (error) {
        const duration = performance.now() - qStartTime;
        queries.push({ query: `${queryName} (error)`, duration });
        throw error;
      }
    },

    summary: () => {
      const totalDuration = performance.now() - startTime;
      const queryCount = queries.length;
      const avgDuration = queryCount > 0
        ? queries.reduce((sum, q) => sum + q.duration, 0) / queryCount
        : 0;

      return {
        context,
        totalDuration: Math.round(totalDuration),
        queryCount,
        avgDuration: Math.round(avgDuration),
        queries: queries.map(q => ({
          query: q.query,
          duration: Math.round(q.duration),
        })),
      };
    },

    log: () => {
      const summary = this.summary();
      console.log(`📊 Query Monitor [${context}]:`, {
        total: `${summary.totalDuration}ms`,
        queries: summary.queryCount,
        avg: `${summary.avgDuration}ms`,
      });

      if (summary.queries.length > 0) {
        console.log('  Queries:');
        summary.queries.forEach(q => {
          console.log(`    - ${q.query}: ${q.duration}ms`);
        });
      }
    },
  };
}

/**
 * Decorator for query performance tracking (if using decorators)
 */
export function TrackQuery(queryName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const name = queryName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return instrumentQuery(name, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * Query caching wrapper with TTL
 */
interface CacheOptions {
  ttl: number; // Time to live in seconds
  key: string; // Cache key
}

const queryCache = new Map<string, { data: any; expiry: number }>();

export async function cachedQuery<T>(
  options: CacheOptions,
  queryFn: () => Promise<T>
): Promise<T> {
  const now = Date.now();

  // Check cache
  const cached = queryCache.get(options.key);
  if (cached && cached.expiry > now) {
    console.debug(`🎯 Cache hit: ${options.key}`);
    return cached.data as T;
  }

  // Execute query
  const result = await queryFn();

  // Store in cache
  queryCache.set(options.key, {
    data: result,
    expiry: now + options.ttl * 1000,
  });

  console.debug(`💾 Cache set: ${options.key} (TTL: ${options.ttl}s)`);

  return result;
}

/**
 * Clear query cache
 */
export function clearQueryCache(key?: string) {
  if (key) {
    queryCache.delete(key);
    console.debug(`🗑️  Cache cleared: ${key}`);
  } else {
    const size = queryCache.size;
    queryCache.clear();
    console.debug(`🗑️  Cache cleared: ${size} entries`);
  }
}

/**
 * Cleanup expired cache entries
 */
export function cleanupExpiredCache() {
  const now = Date.now();
  let cleaned = 0;

  queryCache.forEach((value, key) => {
    if (value.expiry <= now) {
      queryCache.delete(key);
      cleaned++;
    }
  });

  if (cleaned > 0) {
    console.debug(`🧹 Cleaned up ${cleaned} expired cache entries`);
  }
}

// Auto-cleanup expired cache every 5 minutes
setInterval(cleanupExpiredCache, 5 * 60 * 1000);
