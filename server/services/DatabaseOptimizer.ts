/**
 * Database Optimization Service for ILS 2.0
 * 
 * Comprehensive database performance optimization including:
 * - Query optimization and analysis
 * - Smart indexing strategies
 * - Connection pooling management
 * - Data archiving and cleanup
 * - Performance monitoring and metrics
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
      
      logger.info('Database performance analysis completed', {
        totalConnections: metrics.totalConnections,
        slowQueries: metrics.queryPerformance.slowQueries,
        cacheHitRatio: metrics.queryPerformance.cacheHitRatio
      });

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

      const row = result[0];
      return {
        total: Number(row.total_connections),
        active: Number(row.active_connections)
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

      return {
        slowQueries: Number(slowQueriesResult[0].slow_queries),
        averageQueryTime: Number(avgTimeResult[0].avg_time) || 0,
        cacheHitRatio: Number(cacheResult[0].cache_hit_ratio) || 0
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

      return {
        unusedIndexes: unusedIndexesResult.map(row => row.index_name as string),
        missingIndexes: missingIndexesResult.map(row => 
          `${row.table_name} (${row.table_scans} scans, ${row.tuples_read} tuples read)`
        ),
        fragmentedIndexes: fragmentedIndexesResult.map(row => row.index_name as string)
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

      const overallStats = overallStatsResult[0];

      return {
        totalTables: Number(overallStats.total_tables),
        totalRows: Number(overallStats.total_rows) || 0,
        totalSize: overallStats.total_size || '0 bytes',
        largestTables: largestTablesResult.map(row => ({
          name: row.tablename as string,
          size: row.size as string,
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
        sql: 'ALTER SYSTEM SET max_connections = 200; SELECT pg_reload_conf();'
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
        sql: 'ALTER SYSTEM SET shared_buffers = \'256MB\'; SELECT pg_reload_conf();'
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
   * Apply automatic optimizations (safe operations only)
   */
  async applyAutomaticOptimizations(): Promise<{ applied: string[]; skipped: string[] }> {
    logger.info('Applying automatic database optimizations...');

    const applied: string[] = [];
    const skipped: string[] = [];

    for (const recommendation of this.recommendations) {
      if (recommendation.type === 'configuration' && recommendation.sql) {
        try {
          await db.execute(sql.raw(recommendation.sql));
          applied.push(recommendation.description);
          logger.info('Applied automatic optimization', { description: recommendation.description });
        } catch (error) {
          skipped.push(recommendation.description);
          logger.warn({ error, description: recommendation.description }, 'Failed to apply optimization');
        }
      } else {
        skipped.push(recommendation.description);
        logger.info('Skipping manual optimization', { description: recommendation.description });
      }
    }

    return { applied, skipped };
  }

  /**
   * Create optimized indexes for common query patterns
   */
  async createOptimizedIndexes(): Promise<void> {
    logger.info('Creating optimized database indexes...');

    const indexes = [
      // Patient-related indexes
      'CREATE INDEX IF NOT EXISTS idx_patients_ecp_id ON patients(ecp_id)',
      'CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email)',
      
      // Prescription-related indexes
      'CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id)',
      'CREATE INDEX IF NOT EXISTS idx_prescriptions_created_at ON prescriptions(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status)',
      
      // Order-related indexes
      'CREATE INDEX IF NOT EXISTS idx_orders_ecp_id ON orders(ecp_id)',
      'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
      'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_orders_patient_id ON orders(patient_id)',
      
      // AI service indexes
      'CREATE INDEX IF NOT EXISTS idx_ai_analyses_created_at ON ai_analyses(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_ai_analyses_patient_id ON ai_analyses(patient_id)',
      'CREATE INDEX IF NOT EXISTS idx_ai_analyses_status ON ai_analyses(status)',
      
      // Audit log indexes
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)',
      
      // Performance monitoring indexes
      'CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint ON performance_metrics(endpoint)'
    ];

    for (const indexSql of indexes) {
      try {
        await db.execute(sql.raw(indexSql));
        logger.debug('Created index', { sql: indexSql });
      } catch (error) {
        logger.warn({ error, sql: indexSql }, 'Failed to create index');
      }
    }

    logger.info('Database indexes optimization completed');
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
    logger.info('Cleaning up old data...', { daysToKeep });

    let totalDeleted = 0;
    const totalSpaceFreed = 0;

    try {
      // Clean up old audit logs
      const auditResult = await db.execute(sql`
        DELETE FROM audit_logs 
        WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
        RETURNING id
      `);
      totalDeleted += auditResult.length;

      // Clean up old performance metrics
      const metricsResult = await db.execute(sql`
        DELETE FROM performance_metrics 
        WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'
        RETURNING id
      `);
      totalDeleted += metricsResult.length;

      // Clean up old AI analyses (keep successful ones longer)
      const aiResult = await db.execute(sql`
        DELETE FROM ai_analyses 
        WHERE created_at < NOW() - INTERVAL '30 days'
        AND status IN ('failed', 'expired')
        RETURNING id
      `);
      totalDeleted += aiResult.length;

      // Get space freed
      const spaceResult = await db.execute(sql`
        SELECT pg_size_pretty(pg_database_size(current_database()) - 
               (SELECT pg_database_size(current_database()) - 
                pg_total_relation_size('audit_logs') - 
                pg_total_relation_size('performance_metrics') - 
                pg_total_relation_size('ai_analyses'))) as space_freed
      `);

      const spaceFreed = spaceResult[0]?.space_freed || '0 bytes';

      logger.info('Data cleanup completed', { 
        deleted: totalDeleted, 
        spaceFreed,
        daysToKeep 
      });

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
   * Generate performance report
   */
  generatePerformanceReport(): string {
    if (!this.metrics) {
      return 'No performance data available. Run analyzePerformance() first.';
    }

    const report = `
# 📊 Database Performance Report
Generated: ${new Date().toISOString()}

## 📈 Overall Metrics
- **Total Connections**: ${this.metrics.totalConnections}
- **Active Connections**: ${this.metrics.activeConnections}
- **Cache Hit Ratio**: ${this.metrics.queryPerformance.cacheHitRatio}%
- **Average Query Time**: ${this.metrics.queryPerformance.averageQueryTime}ms
- **Slow Queries**: ${this.metrics.queryPerformance.slowQueries}

## 📋 Table Statistics
- **Total Tables**: ${this.metrics.tableStats.totalTables}
- **Total Rows**: ${this.metrics.tableStats.totalRows.toLocaleString()}
- **Total Size**: ${this.metrics.tableStats.totalSize}

## 🔍 Index Analysis
- **Unused Indexes**: ${this.metrics.indexUsage.unusedIndexes.length}
- **Missing Indexes**: ${this.metrics.indexUsage.missingIndexes.length}
- **Fragmented Indexes**: ${this.metrics.indexUsage.fragmentedIndexes.length}

## 💡 Optimization Recommendations
${this.recommendations.map(rec => `
- **${rec.type.toUpperCase()}** (${rec.priority}): ${rec.description}
  - Impact: ${rec.impact}
  - Estimated Improvement: ${rec.estimatedImprovement}
${rec.sql ? `  - SQL: \`${rec.sql}\`` : ''}
`).join('')}

## 🎯 Performance Score
${this.calculatePerformanceScore()}/100
    `.trim();

    return report;
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
