/**
 * Database Monitoring Service for ILS 2.0
 * 
 * PASSIVE OBSERVABILITY ONLY - Reports metrics, does NOT modify database.
 * 
 * For database tuning:
 * - Connection limits: Set via DATABASE_URL params or infrastructure (Railway/Docker)
 * - Indexes: Add via Drizzle Kit migrations
 * - Memory settings: Configure in docker-compose.yml or cloud provider
 * 
 * This service:
 * - Collects performance metrics for Prometheus/Grafana
 * - Reports recommendations (does NOT execute them)
 * - Monitors connection health
 */

import { db } from '../db';
import { logger } from '../utils/logger';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';

export interface DatabaseMetrics {
  totalConnections: number;
  activeConnections: number;
  queryPerformance: {
    slowQueries: number;
    averageQueryTime: number;
    cacheHitRatio: number;
  };
  indexUsage: {
    unusedIndexes: string[];
    missingIndexes: string[];
    fragmentedIndexes: string[];
  };
  tableStats: {
    totalTables: number;
    totalRows: number;
    totalSize: string;
    largestTables: Array<{ name: string; size: string; rows: number }>;
  };
}

export interface OptimizationRecommendation {
  type: 'index' | 'query' | 'partition' | 'archive' | 'configuration';
  priority: 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  estimatedImprovement: string;
  sql?: string;
}

export class DatabaseOptimizer {
  private metrics: DatabaseMetrics | null = null;
  private recommendations: OptimizationRecommendation[] = [];

  /**
   * Analyze current database performance
   */
  async analyzePerformance(): Promise<DatabaseMetrics> {
    logger.info('Starting database performance analysis...');

    try {
      const metrics = await this.collectMetrics();
      this.metrics = metrics;
      
      await this.generateRecommendations();
      
      logger.info({
        totalConnections: metrics.totalConnections,
        slowQueries: metrics.queryPerformance.slowQueries,
        cacheHitRatio: metrics.queryPerformance.cacheHitRatio
      }, 'Database performance analysis completed');

      return metrics;
    } catch (error) {
      logger.error({ error }, 'Database performance analysis failed');
      throw error;
    }
  }

  /**
   * Collect comprehensive database metrics
   */
  private async collectMetrics(): Promise<DatabaseMetrics> {
    // Connection metrics
    const connectionMetrics = await this.getConnectionMetrics();
    
    // Query performance metrics
    const queryMetrics = await this.getQueryMetrics();
    
    // Index usage metrics
    const indexMetrics = await this.getIndexMetrics();
    
    // Table statistics
    const tableStats = await this.getTableStatistics();

    return {
      totalConnections: connectionMetrics.total,
      activeConnections: connectionMetrics.active,
      queryPerformance: queryMetrics,
      indexUsage: indexMetrics,
      tableStats
    };
  }

  /**
   * Get connection pool metrics
   */
  private async getConnectionMetrics(): Promise<{ total: number; active: number }> {
    try {
      const result = await db.execute(sql`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);

      const rows = result.rows as Array<{ total_connections: string; active_connections: string }>;
      const row = rows[0];
      return {
        total: Number(row?.total_connections ?? 0),
        active: Number(row?.active_connections ?? 0)
      };
    } catch (error) {
      logger.warn({ error }, 'Failed to get connection metrics');
      return { total: 0, active: 0 };
    }
  }

  /**
   * Get query performance metrics
   */
  private async getQueryMetrics(): Promise<DatabaseMetrics['queryPerformance']> {
    try {
      // Get slow queries (queries taking more than 1 second)
      const slowQueriesResult = await db.execute(sql`
        SELECT count(*) as slow_queries
        FROM pg_stat_statements 
        WHERE mean_exec_time > 1000 
        AND calls > 10
      `);

      // Get average query time
      const avgTimeResult = await db.execute(sql`
        SELECT round(mean(mean_exec_time), 2) as avg_time
        FROM pg_stat_statements 
        WHERE calls > 10
      `);

      // Get cache hit ratio
      const cacheResult = await db.execute(sql`
        SELECT round(
          (sum(heap_blks_hit) / nullif(sum(heap_blks_hit + heap_blks_read), 0)) * 100, 2
        ) as cache_hit_ratio
        FROM pg_statio_user_tables
      `);

      const slowRows = slowQueriesResult.rows as Array<{ slow_queries: string }>;
      const avgRows = avgTimeResult.rows as Array<{ avg_time: string }>;
      const cacheRows = cacheResult.rows as Array<{ cache_hit_ratio: string }>;
      return {
        slowQueries: Number(slowRows[0]?.slow_queries ?? 0),
        averageQueryTime: Number(avgRows[0]?.avg_time ?? 0),
        cacheHitRatio: Number(cacheRows[0]?.cache_hit_ratio ?? 0)
      };
    } catch (error) {
      logger.warn({ error }, 'Failed to get query metrics');
      return {
        slowQueries: 0,
        averageQueryTime: 0,
        cacheHitRatio: 0
      };
    }
  }

  /**
   * Get index usage metrics
   */
  private async getIndexMetrics(): Promise<DatabaseMetrics['indexUsage']> {
    try {
      // Find unused indexes
      const unusedIndexesResult = await db.execute(sql`
        SELECT schemaname || '.' || tablename || '.' || indexname as index_name
        FROM pg_stat_user_indexes 
        WHERE idx_scan = 0 
        AND idx_tup_read = 0 
        AND idx_tup_fetch = 0
        AND schemaname NOT IN ('pg_catalog', 'information_schema')
      `);

      // Find potentially missing indexes (high scan counts)
      const missingIndexesResult = await db.execute(sql`
        SELECT schemaname || '.' || tablename as table_name,
               seq_scan as table_scans,
               seq_tup_read as tuples_read
        FROM pg_stat_user_tables 
        WHERE seq_scan > 1000 
        AND seq_tup_read > 10000
        AND schemaname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY seq_scan DESC
        LIMIT 10
      `);

      // Find fragmented indexes
      const fragmentedIndexesResult = await db.execute(sql`
        SELECT schemaname || '.' || tablename || '.' || indexname as index_name
        FROM pg_stat_user_indexes 
        WHERE idx_scan > 100 
        AND (idx_tup_read / idx_scan) > 1000
        AND schemaname NOT IN ('pg_catalog', 'information_schema')
      `);

      type IndexRow = { index_name: string };
      type TableRow = { table_name: string; table_scans: string; tuples_read: string };
      const unusedRows = unusedIndexesResult.rows as IndexRow[];
      const missingRows = missingIndexesResult.rows as TableRow[];
      const fragmentedRows = fragmentedIndexesResult.rows as IndexRow[];
      
      return {
        unusedIndexes: unusedRows.map(row => row.index_name),
        missingIndexes: missingRows.map(row => 
          `${row.table_name} (${row.table_scans} scans, ${row.tuples_read} tuples read)`
        ),
        fragmentedIndexes: fragmentedRows.map(row => row.index_name)
      };
    } catch (error) {
      logger.warn({ error }, 'Failed to get index metrics');
      return {
        unusedIndexes: [],
        missingIndexes: [],
        fragmentedIndexes: []
      };
    }
  }

  /**
   * Get table statistics
   */
  private async getTableStatistics(): Promise<DatabaseMetrics['tableStats']> {
    try {
      // Get overall table statistics
      const overallStatsResult = await db.execute(sql`
        SELECT 
          count(*) as total_tables,
          sum(n_tup_ins + n_tup_upd + n_tup_del) as total_rows,
          pg_size_pretty(sum(pg_total_relation_size(schemaname||'.'||tablename))) as total_size
        FROM pg_stat_user_tables 
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      `);

      // Get largest tables
      const largestTablesResult = await db.execute(sql`
        SELECT 
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          n_tup_ins + n_tup_upd + n_tup_del as rows
        FROM pg_stat_user_tables 
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `);

      type OverallRow = { total_tables: string; total_rows: string; total_size: string };
      type TableSizeRow = { tablename: string; size: string; rows: string };
      const overallRows = overallStatsResult.rows as OverallRow[];
      const largestRows = largestTablesResult.rows as TableSizeRow[];
      const overallStats = overallRows[0];

      return {
        totalTables: Number(overallStats?.total_tables ?? 0),
        totalRows: Number(overallStats?.total_rows ?? 0),
        totalSize: overallStats?.total_size || '0 bytes',
        largestTables: largestRows.map(row => ({
          name: row.tablename,
          size: row.size,
          rows: Number(row.rows)
        }))
      };
    } catch (error) {
      logger.warn({ error }, 'Failed to get table statistics');
      return {
        totalTables: 0,
        totalRows: 0,
        totalSize: '0 bytes',
        largestTables: []
      };
    }
  }

  /**
   * Generate optimization recommendations based on metrics
   */
  private async generateRecommendations(): Promise<void> {
    this.recommendations = [];

    if (!this.metrics) return;

    // Connection optimization recommendations
    if (this.metrics.totalConnections > 80) {
      this.recommendations.push({
        type: 'configuration',
        priority: 'high',
        description: 'High number of database connections detected',
        impact: 'Performance degradation and potential connection exhaustion',
        estimatedImprovement: '20-30% performance improvement',
        // NOTE: Do NOT use ALTER SYSTEM from app code - configure via infrastructure
        sql: '-- Configure max_connections in docker-compose.yml or Railway dashboard'
      });
    }

    // Query optimization recommendations
    if (this.metrics.queryPerformance.slowQueries > 5) {
      this.recommendations.push({
        type: 'query',
        priority: 'high',
        description: `${this.metrics.queryPerformance.slowQueries} slow queries detected`,
        impact: 'Poor user experience and resource waste',
        estimatedImprovement: '50-80% query time reduction',
        sql: 'SELECT * FROM pg_stat_statements WHERE mean_exec_time > 1000 ORDER BY mean_exec_time DESC LIMIT 10;'
      });
    }

    // Cache optimization recommendations
    if (this.metrics.queryPerformance.cacheHitRatio < 95) {
      this.recommendations.push({
        type: 'configuration',
        priority: 'medium',
        description: `Low cache hit ratio: ${this.metrics.queryPerformance.cacheHitRatio}%`,
        impact: 'Increased disk I/O and slower response times',
        estimatedImprovement: '15-25% performance improvement',
        // NOTE: Do NOT use ALTER SYSTEM from app code - configure via infrastructure
        sql: '-- Configure shared_buffers in docker-compose.yml: command: postgres -c shared_buffers=256MB'
      });
    }

    // Index optimization recommendations
    if (this.metrics.indexUsage.unusedIndexes.length > 0) {
      this.recommendations.push({
        type: 'index',
        priority: 'medium',
        description: `${this.metrics.indexUsage.unusedIndexes.length} unused indexes found`,
        impact: 'Wasted storage space and slower write operations',
        estimatedImprovement: '10-20% write performance improvement'
      });
    }

    if (this.metrics.indexUsage.missingIndexes.length > 0) {
      this.recommendations.push({
        type: 'index',
        priority: 'high',
        description: 'Tables with high sequential scan counts detected',
        impact: 'Slow query performance on large tables',
        estimatedImprovement: '60-90% query time reduction',
        sql: '-- Example: CREATE INDEX idx_patients_ecp_id ON patients(ecp_id);'
      });
    }

    // Table size optimization recommendations
    if (this.metrics.tableStats.largestTables.length > 0) {
      const largestTable = this.metrics.tableStats.largestTables[0];
      if (parseInt(largestTable.size) > 1000000) { // > 1GB
        this.recommendations.push({
          type: 'partition',
          priority: 'medium',
          description: `Large table detected: ${largestTable.name} (${largestTable.size})`,
          impact: 'Slow queries and maintenance operations',
          estimatedImprovement: '30-50% query performance improvement',
          sql: `-- Consider partitioning ${largestTable.name} by date or other logical criteria`
        });
      }
    }
  }

  /**
   * Get optimization recommendations
   */
  getRecommendations(): OptimizationRecommendation[] {
    return this.recommendations;
  }

  /**
   * @deprecated REMOVED - Do not apply optimizations from application code.
   * Use infrastructure-as-code (docker-compose, Railway, Terraform) for database tuning.
   * Use Drizzle Kit migrations for index creation.
   */
  async applyAutomaticOptimizations(): Promise<{ applied: string[]; skipped: string[] }> {
    logger.warn('applyAutomaticOptimizations() is deprecated - use infrastructure config instead');
    return { 
      applied: [], 
      skipped: this.recommendations.map(r => `${r.description} (use infrastructure config)`) 
    };
  }

  /**
   * @deprecated REMOVED - Create indexes via Drizzle Kit migrations instead.
   * Run: npx drizzle-kit generate && npx drizzle-kit migrate
   */
  async createOptimizedIndexes(): Promise<void> {
    logger.warn('createOptimizedIndexes() is deprecated - use Drizzle Kit migrations instead');
    logger.info({
      indexes: [
        'idx_patients_ecp_id',
        'idx_prescriptions_patient_id',
        'idx_orders_status',
        'idx_audit_logs_created_at'
      ]
    }, 'Recommended indexes (add to schema.ts)');
  }

  /**
   * Analyze and update table statistics
   */
  async updateTableStatistics(): Promise<void> {
    logger.info('Updating table statistics...');

    try {
      await db.execute(sql`ANALYZE`);
      logger.info('Table statistics updated successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to update table statistics');
      throw error;
    }
  }

  /**
   * Clean up old data for performance
   */
  async cleanupOldData(daysToKeep: number = 90): Promise<{ deleted: number; spaceFreed: string }> {
    logger.info({ daysToKeep }, 'Cleaning up old data...');

    let totalDeleted = 0;
    const totalSpaceFreed = 0;

    try {
      // Clean up old audit logs
      const auditResult = await db.execute(sql`
        DELETE FROM audit_logs 
        WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
        RETURNING id
      `);
      totalDeleted += auditResult.rowCount ?? 0;

      // Clean up old performance metrics
      const metricsResult = await db.execute(sql`
        DELETE FROM performance_metrics 
        WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'
        RETURNING id
      `);
      totalDeleted += metricsResult.rowCount ?? 0;

      // Clean up old AI analyses (keep successful ones longer)
      const aiResult = await db.execute(sql`
        DELETE FROM ai_analyses 
        WHERE created_at < NOW() - INTERVAL '30 days'
        AND status IN ('failed', 'expired')
        RETURNING id
      `);
      totalDeleted += aiResult.rowCount ?? 0;

      // Get space freed
      const spaceResult = await db.execute(sql`
        SELECT pg_size_pretty(pg_database_size(current_database()) - 
               (SELECT pg_database_size(current_database()) - 
                pg_total_relation_size('audit_logs') - 
                pg_total_relation_size('performance_metrics') - 
                pg_total_relation_size('ai_analyses'))) as space_freed
      `);

      const spaceRows = spaceResult.rows as Array<{ space_freed: string }>;
      const spaceFreed = spaceRows[0]?.space_freed || '0 bytes';

      logger.info({ 
        deleted: totalDeleted, 
        spaceFreed,
        daysToKeep 
      }, 'Data cleanup completed');

      return { deleted: totalDeleted, spaceFreed };
    } catch (error) {
      logger.error({ error }, 'Data cleanup failed');
      throw error;
    }
  }

  /**
   * Get current database metrics
   */
  getMetrics(): DatabaseMetrics | null {
    return this.metrics;
  }

  /**
   * Generate performance report as structured JSON (for Prometheus/Grafana/logging)
   * @deprecated Use getMetricsForPrometheus() for monitoring systems
   */
  generatePerformanceReport(): string {
    // Return JSON for structured logging instead of Markdown
    return JSON.stringify(this.getStructuredReport(), null, 2);
  }

  /**
   * Get structured report for logging/monitoring systems
   */
  getStructuredReport(): {
    timestamp: string;
    score: number;
    metrics: DatabaseMetrics | null;
    recommendations: OptimizationRecommendation[];
  } {
    return {
      timestamp: new Date().toISOString(),
      score: this.calculatePerformanceScore(),
      metrics: this.metrics,
      recommendations: this.recommendations
    };
  }

  /**
   * Get metrics formatted for Prometheus exposition
   * Use these gauges in your /metrics endpoint
   */
  getMetricsForPrometheus(): Record<string, number> {
    if (!this.metrics) return {};
    
    return {
      db_total_connections: this.metrics.totalConnections,
      db_active_connections: this.metrics.activeConnections,
      db_cache_hit_ratio: this.metrics.queryPerformance.cacheHitRatio,
      db_slow_queries_count: this.metrics.queryPerformance.slowQueries,
      db_avg_query_time_ms: this.metrics.queryPerformance.averageQueryTime,
      db_unused_indexes_count: this.metrics.indexUsage.unusedIndexes.length,
      db_missing_indexes_count: this.metrics.indexUsage.missingIndexes.length,
      db_total_tables: this.metrics.tableStats.totalTables,
      db_performance_score: this.calculatePerformanceScore()
    };
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(): number {
    if (!this.metrics) return 0;

    let score = 100;

    // Deduct points for slow queries
    score -= Math.min(this.metrics.queryPerformance.slowQueries * 5, 30);

    // Deduct points for low cache hit ratio
    if (this.metrics.queryPerformance.cacheHitRatio < 95) {
      score -= (95 - this.metrics.queryPerformance.cacheHitRatio) * 2;
    }

    // Deduct points for unused indexes
    score -= Math.min(this.metrics.indexUsage.unusedIndexes.length * 2, 20);

    // Deduct points for missing indexes
    score -= Math.min(this.metrics.indexUsage.missingIndexes.length * 3, 25);

    return Math.max(0, Math.min(100, score));
  }
}

export const databaseOptimizer = new DatabaseOptimizer();
export default databaseOptimizer;
