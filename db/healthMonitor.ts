/**
 * Database Health Monitor
 *
 * Provides comprehensive database health monitoring including:
 * - Connection pool metrics
 * - Query performance statistics
 * - Table statistics
 * - Index usage analysis
 * - Storage metrics
 *
 * @module db/healthMonitor
 */

import { getPool, getDb, isDatabaseAvailable } from './index';
import { queryOptimizer } from './queryOptimizer';
import { createLogger } from '../server/utils/logger';

const logger = createLogger('DatabaseHealthMonitor');

// ============================================
// TYPES
// ============================================

export interface PoolMetrics {
  totalConnections: number;
  idleConnections: number;
  waitingClients: number;
  maxConnections: number;
  utilizationPercent: number;
}

export interface TableStats {
  tableName: string;
  rowCount: number;
  deadTuples: number;
  lastVacuum: Date | null;
  lastAutoVacuum: Date | null;
  lastAnalyze: Date | null;
  tableSize: string;
  indexSize: string;
  totalSize: string;
}

export interface IndexStats {
  indexName: string;
  tableName: string;
  indexScans: number;
  tuplesRead: number;
  tuplesFetched: number;
  indexSize: string;
  isUnused: boolean;
}

export interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  pool: PoolMetrics;
  queryStats: {
    totalQueries: number;
    slowQueries: number;
    avgExecutionTime: number;
    p95ExecutionTime: number;
    cacheHitRate: number;
  };
  storage: {
    databaseSize: string;
    tablesCount: number;
    indexesCount: number;
  };
  issues: string[];
  recommendations: string[];
}

export interface SlowQueryReport {
  query: string;
  executionTime: number;
  timestamp: Date;
  companyId?: string;
  count: number;
}

// ============================================
// HEALTH MONITOR CLASS
// ============================================

class DatabaseHealthMonitor {
  private checkInterval: NodeJS.Timeout | null = null;
  private lastHealth: DatabaseHealth | null = null;

  /**
   * Get current connection pool metrics
   */
  getPoolMetrics(): PoolMetrics | null {
    if (!isDatabaseAvailable()) {
      return null;
    }

    try {
      const pool = getPool();
      const total = pool.totalCount || 0;
      const idle = pool.idleCount || 0;
      const waiting = pool.waitingCount || 0;
      const max = pool.options.max || 20;

      return {
        totalConnections: total,
        idleConnections: idle,
        waitingClients: waiting,
        maxConnections: max,
        utilizationPercent: Math.round((total / max) * 100),
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get pool metrics');
      return null;
    }
  }

  /**
   * Get table statistics
   */
  async getTableStats(limit = 20): Promise<TableStats[]> {
    if (!isDatabaseAvailable()) {
      return [];
    }

    try {
      const db = getDb();
      const result = await db.execute(`
        SELECT
          schemaname || '.' || relname as table_name,
          n_live_tup as row_count,
          n_dead_tup as dead_tuples,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          pg_size_pretty(pg_table_size(relid)) as table_size,
          pg_size_pretty(pg_indexes_size(relid)) as index_size,
          pg_size_pretty(pg_total_relation_size(relid)) as total_size
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(relid) DESC
        LIMIT ${limit}
      `);

      return result.rows.map((row: any) => ({
        tableName: row.table_name,
        rowCount: parseInt(row.row_count) || 0,
        deadTuples: parseInt(row.dead_tuples) || 0,
        lastVacuum: row.last_vacuum ? new Date(row.last_vacuum) : null,
        lastAutoVacuum: row.last_autovacuum ? new Date(row.last_autovacuum) : null,
        lastAnalyze: row.last_analyze ? new Date(row.last_analyze) : null,
        tableSize: row.table_size,
        indexSize: row.index_size,
        totalSize: row.total_size,
      }));
    } catch (error) {
      logger.error({ error }, 'Failed to get table stats');
      return [];
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats(limit = 30): Promise<IndexStats[]> {
    if (!isDatabaseAvailable()) {
      return [];
    }

    try {
      const db = getDb();
      const result = await db.execute(`
        SELECT
          indexrelname as index_name,
          relname as table_name,
          idx_scan as index_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
          CASE WHEN idx_scan = 0 THEN true ELSE false END as is_unused
        FROM pg_stat_user_indexes
        ORDER BY idx_scan ASC
        LIMIT ${limit}
      `);

      return result.rows.map((row: any) => ({
        indexName: row.index_name,
        tableName: row.table_name,
        indexScans: parseInt(row.index_scans) || 0,
        tuplesRead: parseInt(row.tuples_read) || 0,
        tuplesFetched: parseInt(row.tuples_fetched) || 0,
        indexSize: row.index_size,
        isUnused: row.is_unused,
      }));
    } catch (error) {
      logger.error({ error }, 'Failed to get index stats');
      return [];
    }
  }

  /**
   * Get database storage metrics
   */
  async getStorageMetrics(): Promise<{ databaseSize: string; tablesCount: number; indexesCount: number }> {
    if (!isDatabaseAvailable()) {
      return { databaseSize: 'N/A', tablesCount: 0, indexesCount: 0 };
    }

    try {
      const db = getDb();

      const [sizeResult, tableCountResult, indexCountResult] = await Promise.all([
        db.execute(`SELECT pg_size_pretty(pg_database_size(current_database())) as size`),
        db.execute(`SELECT COUNT(*) as count FROM pg_stat_user_tables`),
        db.execute(`SELECT COUNT(*) as count FROM pg_stat_user_indexes`),
      ]);

      return {
        databaseSize: sizeResult.rows[0]?.size || 'N/A',
        tablesCount: parseInt(tableCountResult.rows[0]?.count) || 0,
        indexesCount: parseInt(indexCountResult.rows[0]?.count) || 0,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get storage metrics');
      return { databaseSize: 'N/A', tablesCount: 0, indexesCount: 0 };
    }
  }

  /**
   * Get unused indexes (candidates for removal)
   */
  async getUnusedIndexes(): Promise<IndexStats[]> {
    const allIndexes = await this.getIndexStats(100);
    return allIndexes.filter(idx => idx.isUnused && !idx.indexName.endsWith('_pkey'));
  }

  /**
   * Get tables needing vacuum
   */
  async getTablesNeedingVacuum(): Promise<TableStats[]> {
    const allTables = await this.getTableStats(100);
    const threshold = 10000; // More than 10k dead tuples

    return allTables.filter(table => table.deadTuples > threshold);
  }

  /**
   * Run full health check
   */
  async runHealthCheck(): Promise<DatabaseHealth> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Pool metrics
    const poolMetrics = this.getPoolMetrics();
    if (!poolMetrics) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        pool: {
          totalConnections: 0,
          idleConnections: 0,
          waitingClients: 0,
          maxConnections: 0,
          utilizationPercent: 0,
        },
        queryStats: {
          totalQueries: 0,
          slowQueries: 0,
          avgExecutionTime: 0,
          p95ExecutionTime: 0,
          cacheHitRate: 0,
        },
        storage: {
          databaseSize: 'N/A',
          tablesCount: 0,
          indexesCount: 0,
        },
        issues: ['Database connection not available'],
        recommendations: ['Check DATABASE_URL configuration'],
      };
    }

    // Check pool utilization
    if (poolMetrics.utilizationPercent > 90) {
      issues.push(`High connection pool utilization: ${poolMetrics.utilizationPercent}%`);
      recommendations.push('Consider increasing DB_POOL_MAX environment variable');
    }

    if (poolMetrics.waitingClients > 0) {
      issues.push(`Clients waiting for connections: ${poolMetrics.waitingClients}`);
      recommendations.push('Consider increasing pool size or optimizing slow queries');
    }

    // Query statistics
    const queryStats = queryOptimizer.getStatistics();

    if (queryStats.slowQueries > queryStats.totalQueries * 0.1) {
      issues.push(`High slow query rate: ${queryStats.slowQueries} of ${queryStats.totalQueries}`);
      recommendations.push('Review slow queries and add appropriate indexes');
    }

    if (queryStats.cacheHitRate < 50 && queryStats.totalQueries > 100) {
      recommendations.push(`Low cache hit rate (${queryStats.cacheHitRate}%) - consider caching frequent queries`);
    }

    // Storage metrics
    const storage = await this.getStorageMetrics();

    // Tables needing vacuum
    const tablesNeedingVacuum = await this.getTablesNeedingVacuum();
    if (tablesNeedingVacuum.length > 0) {
      issues.push(`${tablesNeedingVacuum.length} tables have high dead tuple counts`);
      recommendations.push(`Run VACUUM ANALYZE on: ${tablesNeedingVacuum.slice(0, 3).map(t => t.tableName).join(', ')}`);
    }

    // Unused indexes
    const unusedIndexes = await this.getUnusedIndexes();
    if (unusedIndexes.length > 5) {
      recommendations.push(`${unusedIndexes.length} unused indexes found - consider removing to improve write performance`);
    }

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (issues.length > 0) {
      status = issues.some(i => i.includes('High') || i.includes('waiting')) ? 'degraded' : 'healthy';
    }
    if (poolMetrics.utilizationPercent > 95 || poolMetrics.waitingClients > 10) {
      status = 'unhealthy';
    }

    const health: DatabaseHealth = {
      status,
      timestamp: new Date(),
      pool: poolMetrics,
      queryStats,
      storage,
      issues,
      recommendations,
    };

    this.lastHealth = health;
    return health;
  }

  /**
   * Get slow query report
   */
  getSlowQueryReport(): SlowQueryReport[] {
    const metrics = queryOptimizer.getMetrics({ slowOnly: true, limit: 50 });

    // Group by query and count occurrences
    const grouped = new Map<string, SlowQueryReport>();

    for (const metric of metrics) {
      const key = metric.query;
      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        existing.count++;
        if (metric.executionTime > existing.executionTime) {
          existing.executionTime = metric.executionTime;
        }
      } else {
        grouped.set(key, {
          query: metric.query,
          executionTime: metric.executionTime,
          timestamp: metric.timestamp,
          companyId: metric.companyId,
          count: 1,
        });
      }
    }

    return Array.from(grouped.values()).sort((a, b) => b.executionTime - a.executionTime);
  }

  /**
   * Get cached health (if recent) or run new check
   */
  async getHealth(maxAge = 60000): Promise<DatabaseHealth> {
    if (this.lastHealth && Date.now() - this.lastHealth.timestamp.getTime() < maxAge) {
      return this.lastHealth;
    }
    return this.runHealthCheck();
  }

  /**
   * Start periodic health monitoring
   */
  startMonitoring(intervalMs = 60000): void {
    if (this.checkInterval) {
      this.stopMonitoring();
    }

    logger.info({ intervalMs }, 'Starting database health monitoring');

    this.checkInterval = setInterval(async () => {
      const health = await this.runHealthCheck();

      if (health.status !== 'healthy') {
        logger.warn({ health }, 'Database health check: degraded or unhealthy');
      } else {
        logger.debug({ status: health.status }, 'Database health check: healthy');
      }
    }, intervalMs);

    // Run initial check
    this.runHealthCheck();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('Stopped database health monitoring');
    }
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const dbHealthMonitor = new DatabaseHealthMonitor();

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Quick health check for API endpoints
 */
export async function checkDatabaseHealth(): Promise<{ ok: boolean; message: string }> {
  if (!isDatabaseAvailable()) {
    return { ok: false, message: 'Database not configured' };
  }

  try {
    const db = getDb();
    await db.execute('SELECT 1');
    return { ok: true, message: 'Database connection healthy' };
  } catch (error) {
    return { ok: false, message: `Database error: ${error}` };
  }
}

/**
 * Get pool status for monitoring dashboards
 */
export function getPoolStatus(): PoolMetrics | null {
  return dbHealthMonitor.getPoolMetrics();
}
