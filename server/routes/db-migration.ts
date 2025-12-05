/**
 * Database Migration Routes
 *
 * TEMPORARY endpoint for applying database migrations.
 * This endpoint should be removed after migrations are applied.
 */

import { Router, Request, Response } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth-jwt';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { createLogger } from '../utils/logger';
import { readFileSync } from 'fs';
import { join } from 'path';

const router = Router();
const logger = createLogger('db-migration');

/**
 * POST /api/db-migration/apply-indexes
 * Apply the missing foreign key indexes migration
 * ONLY platform_admin can run this
 */
router.post(
  '/apply-indexes',
  authenticateJWT,
  requireRole(['platform_admin']),
  async (req: Request, res: Response) => {
    try {
      logger.info('Starting index migration...');

      // Read the migration file
      const migrationPath = join(process.cwd(), 'migrations', '2025-12-05-add-missing-foreign-key-indexes.sql');
      const migrationSQL = readFileSync(migrationPath, 'utf-8');

      // Split into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\/\*/));

      const results = {
        total: 0,
        created: 0,
        skipped: 0,
        errors: [] as string[],
      };

      for (const statement of statements) {
        if (statement.startsWith('--')) continue;

        const indexMatch = statement.match(/idx_\w+/);
        const indexName = indexMatch ? indexMatch[0] : 'unknown';

        try {
          results.total++;

          await db.execute(sql.raw(statement));

          if (statement.includes('CREATE INDEX')) {
            logger.info({ indexName }, 'Created index');
            results.created++;
          }
        } catch (error: any) {
          if (error.message && error.message.includes('already exists')) {
            logger.info({ indexName }, 'Index already exists');
            results.skipped++;
          } else {
            logger.error({ error, indexName }, 'Failed to create index');
            results.errors.push(`${indexName}: ${error.message}`);
          }
        }
      }

      logger.info({ results }, 'Migration completed');

      // Get index count
      const indexResult = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM pg_indexes
        WHERE tablename IN ('orders', 'patients', 'order_timeline', 'consult_logs')
      `);

      res.json({
        success: true,
        results,
        totalIndexes: indexResult.rows[0]?.count || 0,
        message: `Migration completed: ${results.created} created, ${results.skipped} skipped, ${results.errors.length} errors`,
      });
    } catch (error: any) {
      logger.error({ error }, 'Migration failed');
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/db-migration/verify-indexes
 * Verify that indexes exist
 */
router.get(
  '/verify-indexes',
  authenticateJWT,
  requireRole(['platform_admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`
        SELECT
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE tablename IN ('orders', 'patients', 'order_timeline', 'consult_logs')
        ORDER BY tablename, indexname
      `);

      const byTable: Record<string, number> = {};
      result.rows.forEach((row: any) => {
        byTable[row.tablename] = (byTable[row.tablename] || 0) + 1;
      });

      res.json({
        success: true,
        total: result.rows.length,
        byTable,
        indexes: result.rows,
      });
    } catch (error: any) {
      logger.error({ error }, 'Failed to verify indexes');
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

export default router;
