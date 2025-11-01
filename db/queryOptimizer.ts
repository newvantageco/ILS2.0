/**
 * Query Optimizer
 * Automatic query optimization, monitoring, and performance analysis
 * Integrates with Drizzle ORM to improve database performance
 */

import { db } from './index';
import { cacheService } from '../server/services/CacheService';

// Import read replica if available
let dbRead: any;
try {
  const replicas = require('./replicas');
  dbRead = replicas.dbRead;
} catch (e) {
  dbRead = null;
}

interface QueryMetrics {
  query: string;
  executionTime: number;
  rowsReturned: number;
  cached: boolean;
  slow: boolean;
  timestamp: Date;
  companyId?: string;
}

interface QueryPlan {
  query: string;
  plan: any;
  cost: number;
  recommendations: string[];
}

interface IndexRecommendation {
  table: string;
  columns: string[];
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImprovement: string;
}

class QueryOptimizer {
  private metrics: QueryMetrics[] = [];
  private readonly maxMetrics = 1000;
  private readonly slowQueryThreshold = 1000; // 1 second
  private readonly cacheThreshold = 100; // Cache queries under 100ms
  private enabled = true;

  /**
   * Execute query with automatic optimization
   */
  async execute<T>(
    operation: 'read' | 'write',
    queryFn: () => Promise<T>,
    options?: {
      companyId?: string;
      cacheKey?: string;
      cacheTTL?: number;
      bypassCache?: boolean;
      logSlow?: boolean;
    }
  ): Promise<T> {
    if (!this.enabled) {
      return queryFn();
    }

    const startTime = Date.now();
    let result: T;
    let cached = false;

    // Try cache first for read operations
    if (operation === 'read' && options?.cacheKey && !options.bypassCache) {
      const cachedResult = await this.getFromCache<T>(
        options.companyId,
        options.cacheKey
      );

      if (cachedResult !== null) {
        const executionTime = Date.now() - startTime;
        
        this.recordMetric({
          query: options.cacheKey,
          executionTime,
          rowsReturned: Array.isArray(cachedResult) ? cachedResult.length : 1,
          cached: true,
          slow: false,
          timestamp: new Date(),
          companyId: options.companyId,
        });

        return cachedResult;
      }
    }

    // Execute query (use read replica for reads)
    if (operation === 'read' && dbRead) {
      result = await queryFn();
    } else {
      result = await queryFn();
    }

    const executionTime = Date.now() - startTime;
    const rowsReturned = Array.isArray(result) ? result.length : 1;
    const isSlow = executionTime >= this.slowQueryThreshold;

    // Record metrics
    this.recordMetric({
      query: options?.cacheKey || 'unnamed',
      executionTime,
      rowsReturned,
      cached,
      slow: isSlow,
      timestamp: new Date(),
      companyId: options?.companyId,
    });

    // Log slow queries
    if (isSlow && (options?.logSlow ?? true)) {
      console.warn(`⚠️  Slow query detected (${executionTime}ms):`, {
        cacheKey: options?.cacheKey,
        companyId: options?.companyId,
        rowsReturned,
      });

      // Analyze slow query
      if (options?.cacheKey) {
        await this.analyzeSlowQuery(options.cacheKey, executionTime);
      }
    }

    // Cache result for fast queries (read operations only)
    if (
      operation === 'read' &&
      options?.cacheKey &&
      executionTime < this.cacheThreshold &&
      !options.bypassCache
    ) {
      await this.saveToCache(
        options.companyId,
        options.cacheKey,
        result,
        options.cacheTTL
      );
    }

    return result;
  }

  /**
   * Get from cache
   */
  private async getFromCache<T>(
    companyId: string | undefined,
    cacheKey: string
  ): Promise<T | null> {
    if (!companyId) {
      return null;
    }

    return cacheService.get<T>(companyId, cacheKey, {
      namespace: 'query',
    });
  }

  /**
   * Save to cache
   */
  private async saveToCache<T>(
    companyId: string | undefined,
    cacheKey: string,
    data: T,
    ttl?: number
  ): Promise<void> {
    if (!companyId) {
      return;
    }

    await cacheService.set(companyId, cacheKey, data, {
      namespace: 'query',
      ttl: ttl || 300, // 5 minutes default
    });
  }

  /**
   * Record query metric
   */
  private recordMetric(metric: QueryMetrics): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Analyze slow query
   */
  private async analyzeSlowQuery(query: string, executionTime: number): Promise<void> {
    try {
      // In production, you would:
      // 1. Log to monitoring service (DataDog, New Relic, etc.)
      // 2. Run EXPLAIN ANALYZE
      // 3. Check for missing indexes
      // 4. Alert if critical
      
      console.log(`Analyzing slow query: ${query} (${executionTime}ms)`);
      
      // Store in cache for review
      const slowQueries = await cacheService.get<any[]>('system', 'slow-queries', {
        namespace: 'monitoring',
      }) || [];

      slowQueries.push({
        query,
        executionTime,
        timestamp: new Date(),
      });

      // Keep last 100 slow queries
      if (slowQueries.length > 100) {
        slowQueries.shift();
      }

      await cacheService.set('system', 'slow-queries', slowQueries, {
        namespace: 'monitoring',
        ttl: 86400, // 24 hours
      });
    } catch (error) {
      console.error('Failed to analyze slow query:', error);
    }
  }

  /**
   * Execute raw SQL with EXPLAIN ANALYZE
   */
  async explainQuery(sqlQuery: string): Promise<QueryPlan> {
    const startTime = Date.now();

    // Execute EXPLAIN ANALYZE
    const explainResult = await db.execute(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sqlQuery}`);
    const plan = explainResult.rows[0];

    const executionTime = Date.now() - startTime;
    const totalCost = this.extractCost(plan);
    const recommendations = this.generateRecommendations(plan);

    return {
      query: sqlQuery,
      plan,
      cost: totalCost,
      recommendations,
    };
  }

  /**
   * Extract total cost from query plan
   */
  private extractCost(plan: any): number {
    try {
      const planData = typeof plan === 'string' ? JSON.parse(plan) : plan;
      return planData[0]?.Plan?.['Total Cost'] || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(plan: any): string[] {
    const recommendations: string[] = [];

    try {
      const planData = typeof plan === 'string' ? JSON.parse(plan) : plan;
      const planNode = planData[0]?.Plan;

      if (!planNode) {
        return recommendations;
      }

      // Check for sequential scans
      if (planNode['Node Type'] === 'Seq Scan') {
        recommendations.push(`Consider adding index on ${planNode['Relation Name']}`);
      }

      // Check for high cost
      if (planNode['Total Cost'] > 1000) {
        recommendations.push('Query has high cost - consider optimization');
      }

      // Check for large row counts
      if (planNode['Plan Rows'] > 10000) {
        recommendations.push('Consider adding pagination or filters to reduce result set');
      }

      // Check for nested loops
      if (planNode['Node Type'] === 'Nested Loop') {
        recommendations.push('Nested loop detected - consider using hash join instead');
      }
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    }

    return recommendations;
  }

  /**
   * Get query metrics
   */
  getMetrics(options?: {
    companyId?: string;
    slowOnly?: boolean;
    limit?: number;
  }): QueryMetrics[] {
    let filtered = this.metrics;

    if (options?.companyId) {
      filtered = filtered.filter(m => m.companyId === options.companyId);
    }

    if (options?.slowOnly) {
      filtered = filtered.filter(m => m.slow);
    }

    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  /**
   * Get aggregate statistics
   */
  getStatistics(companyId?: string): {
    totalQueries: number;
    slowQueries: number;
    cachedQueries: number;
    avgExecutionTime: number;
    p95ExecutionTime: number;
    cacheHitRate: number;
  } {
    let queries = this.metrics;

    if (companyId) {
      queries = queries.filter(m => m.companyId === companyId);
    }

    if (queries.length === 0) {
      return {
        totalQueries: 0,
        slowQueries: 0,
        cachedQueries: 0,
        avgExecutionTime: 0,
        p95ExecutionTime: 0,
        cacheHitRate: 0,
      };
    }

    const slowQueries = queries.filter(m => m.slow).length;
    const cachedQueries = queries.filter(m => m.cached).length;
    
    const executionTimes = queries.map(m => m.executionTime).sort((a, b) => a - b);
    const avgExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    const p95Index = Math.floor(executionTimes.length * 0.95);
    const p95ExecutionTime = executionTimes[p95Index] || 0;

    const cacheHitRate = queries.length > 0 ? (cachedQueries / queries.length) * 100 : 0;

    return {
      totalQueries: queries.length,
      slowQueries,
      cachedQueries,
      avgExecutionTime: Math.round(avgExecutionTime),
      p95ExecutionTime: Math.round(p95ExecutionTime),
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
    };
  }

  /**
   * Analyze database for missing indexes
   */
  async analyzeIndexes(): Promise<IndexRecommendation[]> {
    const recommendations: IndexRecommendation[] = [];

    try {
      // Query PostgreSQL statistics for table scans
      const statsQuery = `
        SELECT 
          schemaname,
          tablename,
          seq_scan,
          seq_tup_read,
          idx_scan,
          idx_tup_fetch,
          n_tup_ins + n_tup_upd + n_tup_del as modifications
        FROM pg_stat_user_tables
        WHERE seq_scan > 0
        ORDER BY seq_tup_read DESC
        LIMIT 20
      `;

      const result = await db.execute(statsQuery);

      for (const row of result.rows) {
        const table = row.tablename as string;
        const seqScans = row.seq_scan as number;
        const idxScans = row.idx_scan as number || 0;

        // Tables with high sequential scan ratio
        if (seqScans > 100 && seqScans > idxScans * 2) {
          recommendations.push({
            table,
            columns: ['Analyze query patterns to determine columns'],
            reason: `High sequential scan count (${seqScans}) vs index scans (${idxScans})`,
            priority: 'high',
            estimatedImprovement: '50-80% faster queries',
          });
        }
      }

      // Check for missing foreign key indexes
      const fkQuery = `
        SELECT
          tc.table_name,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      `;

      const fkResult = await db.execute(fkQuery);

      for (const row of fkResult.rows) {
        const table = row.table_name as string;
        const column = row.column_name as string;

        // Check if index exists
        const indexCheckQuery = `
          SELECT indexname
          FROM pg_indexes
          WHERE tablename = '${table}'
          AND indexdef LIKE '%${column}%'
        `;

        const indexCheck = await db.execute(indexCheckQuery);

        if (indexCheck.rows.length === 0) {
          recommendations.push({
            table,
            columns: [column],
            reason: `Foreign key without index`,
            priority: 'high',
            estimatedImprovement: '70-90% faster joins',
          });
        }
      }

    } catch (error) {
      console.error('Failed to analyze indexes:', error);
    }

    return recommendations;
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Enable/disable optimizer
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`Query optimizer ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get health status
   */
  getHealth(): {
    enabled: boolean;
    metricsCount: number;
    slowQueriesLast10Min: number;
  } {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentSlowQueries = this.metrics.filter(
      m => m.slow && m.timestamp >= tenMinutesAgo
    ).length;

    return {
      enabled: this.enabled,
      metricsCount: this.metrics.length,
      slowQueriesLast10Min: recentSlowQueries,
    };
  }
}

// Singleton instance
export const queryOptimizer = new QueryOptimizer();

// Helper function for optimized reads
export async function optimizedRead<T>(
  companyId: string,
  cacheKey: string,
  queryFn: () => Promise<T>,
  options?: {
    cacheTTL?: number;
    bypassCache?: boolean;
  }
): Promise<T> {
  return queryOptimizer.execute('read', queryFn, {
    companyId,
    cacheKey,
    ...options,
  });
}

// Helper function for writes (no caching)
export async function optimizedWrite<T>(
  companyId: string,
  queryFn: () => Promise<T>
): Promise<T> {
  return queryOptimizer.execute('write', queryFn, {
    companyId,
    logSlow: true,
  });
}
