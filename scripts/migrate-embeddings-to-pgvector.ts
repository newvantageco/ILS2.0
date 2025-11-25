/**
 * Data Migration Script: JSONB Embeddings → pgvector
 *
 * This script migrates existing JSONB embeddings to the new pgvector format.
 * Run this after:
 * 1. Installing pgvector extension
 * 2. Adding vector column to schema
 * 3. Pushing schema changes to database
 *
 * Usage:
 *   npx tsx scripts/migrate-embeddings-to-pgvector.ts [--company-id=<id>] [--dry-run] [--batch-size=100]
 */

import { db } from '../server/db';
import { aiKnowledgeBase } from '../shared/schema';
import { eq, and, isNotNull, sql } from 'drizzle-orm';
import { createLogger } from '../server/utils/logger';

const logger = createLogger('migration');

// Parse command line arguments
const args = process.argv.slice(2);
const companyIdArg = args.find(arg => arg.startsWith('--company-id='))?.split('=')[1];
const isDryRun = args.includes('--dry-run');
const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1];
const batchSize = batchSizeArg ? parseInt(batchSizeArg, 10) : 100;

interface MigrationStats {
  total: number;
  migrated: number;
  failed: number;
  skipped: number;
  errors: Array<{ id: string; error: string }>;
}

async function migrateEmbeddings(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  logger.info('='.repeat(60));
  logger.info('JSONB → pgvector Embedding Migration');
  logger.info('='.repeat(60));

  if (isDryRun) {
    logger.warn('🔍 DRY RUN MODE - No changes will be made');
  }

  if (companyIdArg) {
    logger.info(`🎯 Filtering by company ID: ${companyIdArg}`);
  }

  logger.info(`📦 Batch size: ${batchSize}\n`);

  try {
    // Build query conditions
    const conditions = [
      isNotNull(aiKnowledgeBase.embeddings), // Has JSONB embeddings
      sql`${aiKnowledgeBase.embedding} IS NULL`, // Missing pgvector embedding
    ];

    if (companyIdArg) {
      conditions.push(eq(aiKnowledgeBase.companyId, companyIdArg));
    }

    // Get records that need migration
    const recordsToMigrate = await db
      .select({
        id: aiKnowledgeBase.id,
        companyId: aiKnowledgeBase.companyId,
        filename: aiKnowledgeBase.filename,
        embeddings: aiKnowledgeBase.embeddings,
      })
      .from(aiKnowledgeBase)
      .where(and(...conditions));

    stats.total = recordsToMigrate.length;

    if (stats.total === 0) {
      logger.info('✅ No records need migration!');
      return stats;
    }

    logger.info(`📊 Found ${stats.total} records to migrate\n`);

    // Process in batches
    for (let i = 0; i < recordsToMigrate.length; i += batchSize) {
      const batch = recordsToMigrate.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(recordsToMigrate.length / batchSize);

      logger.info(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)...`);

      for (const record of batch) {
        try {
          // Extract embedding array from JSONB
          const embeddingArray = record.embeddings as unknown as number[];

          // Validate embedding
          if (!Array.isArray(embeddingArray)) {
            logger.warn(`⚠️  Skipping ${record.id}: embeddings is not an array`);
            stats.skipped++;
            stats.errors.push({ id: record.id, error: 'Not an array' });
            continue;
          }

          if (embeddingArray.length !== 1536) {
            logger.warn(`⚠️  Skipping ${record.id}: invalid dimensions (${embeddingArray.length}, expected 1536)`);
            stats.skipped++;
            stats.errors.push({ id: record.id, error: `Invalid dimensions: ${embeddingArray.length}` });
            continue;
          }

          // Check for invalid values
          if (embeddingArray.some(val => typeof val !== 'number' || isNaN(val))) {
            logger.warn(`⚠️  Skipping ${record.id}: contains invalid values`);
            stats.skipped++;
            stats.errors.push({ id: record.id, error: 'Invalid values' });
            continue;
          }

          if (isDryRun) {
            logger.debug(`[DRY RUN] Would migrate ${record.filename} (company: ${record.companyId})`);
            stats.migrated++;
            continue;
          }

          // Perform migration
          await db
            .update(aiKnowledgeBase)
            .set({
              embedding: embeddingArray, // Drizzle will convert to vector type
              processingStatus: 'completed',
              updatedAt: new Date(),
            })
            .where(eq(aiKnowledgeBase.id, record.id));

          stats.migrated++;
          logger.debug(`✅ Migrated: ${record.filename}`);
        } catch (error: any) {
          logger.error(`❌ Failed to migrate ${record.id}:`, error.message);
          stats.failed++;
          stats.errors.push({ id: record.id, error: error.message });
        }
      }

      logger.info(`✓ Batch ${batchNumber} complete: ${stats.migrated} migrated, ${stats.failed} failed, ${stats.skipped} skipped`);

      // Small delay between batches to avoid overloading DB
      if (i + batchSize < recordsToMigrate.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Final summary
    logger.info('\n' + '='.repeat(60));
    logger.info('MIGRATION COMPLETE');
    logger.info('='.repeat(60));
    logger.info(`📊 Total records: ${stats.total}`);
    logger.info(`✅ Migrated: ${stats.migrated}`);
    logger.info(`❌ Failed: ${stats.failed}`);
    logger.info(`⚠️  Skipped: ${stats.skipped}`);

    if (stats.errors.length > 0 && stats.errors.length <= 10) {
      logger.info('\n❌ Errors:');
      stats.errors.forEach(({ id, error }) => {
        logger.error(`   ${id}: ${error}`);
      });
    } else if (stats.errors.length > 10) {
      logger.info(`\n❌ ${stats.errors.length} errors (showing first 10):`);
      stats.errors.slice(0, 10).forEach(({ id, error }) => {
        logger.error(`   ${id}: ${error}`);
      });
    }

    const successRate = ((stats.migrated / stats.total) * 100).toFixed(1);
    logger.info(`\n📈 Success rate: ${successRate}%`);

    if (isDryRun) {
      logger.warn('\n🔍 This was a DRY RUN - no changes were made');
      logger.info('Run without --dry-run to perform actual migration');
    }

  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }

  return stats;
}

/**
 * Verify migration results
 */
async function verifyMigration(companyId?: string): Promise<void> {
  logger.info('\n' + '='.repeat(60));
  logger.info('VERIFICATION');
  logger.info('='.repeat(60));

  try {
    const conditions = companyId ? [eq(aiKnowledgeBase.companyId, companyId)] : [];

    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        withJsonb: sql<number>`COUNT(*) FILTER (WHERE ${aiKnowledgeBase.embeddings} IS NOT NULL)`,
        withVector: sql<number>`COUNT(*) FILTER (WHERE ${aiKnowledgeBase.embedding} IS NOT NULL)`,
        withBoth: sql<number>`COUNT(*) FILTER (WHERE ${aiKnowledgeBase.embeddings} IS NOT NULL AND ${aiKnowledgeBase.embedding} IS NOT NULL)`,
        withNeither: sql<number>`COUNT(*) FILTER (WHERE ${aiKnowledgeBase.embeddings} IS NULL AND ${aiKnowledgeBase.embedding} IS NULL)`,
      })
      .from(aiKnowledgeBase)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    logger.info(`Total records: ${stats.total}`);
    logger.info(`With JSONB embeddings: ${stats.withJsonb}`);
    logger.info(`With vector embeddings: ${stats.withVector}`);
    logger.info(`With both formats: ${stats.withBoth}`);
    logger.info(`With neither: ${stats.withNeither}`);

    const migrationComplete = Number(stats.withJsonb) === Number(stats.withVector);
    if (migrationComplete) {
      logger.info('\n✅ Migration verification PASSED');
    } else {
      logger.warn('\n⚠️  Migration incomplete');
      logger.warn(`   ${Number(stats.withJsonb) - Number(stats.withVector)} records still need migration`);
    }
  } catch (error) {
    logger.error('Verification failed:', error);
  }
}

// Main execution
(async () => {
  try {
    const stats = await migrateEmbeddings();
    await verifyMigration(companyIdArg);

    if (stats.failed > 0) {
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
})();
