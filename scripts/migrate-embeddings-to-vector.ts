/**
 * JSONB to Vector Migration Script
 *
 * Migrates embedding data from JSONB format to pgvector format.
 * Supports resume on failure and provides detailed progress tracking.
 *
 * Usage:
 *   npx tsx scripts/migrate-embeddings-to-vector.ts [options]
 *
 * Options:
 *   --dry-run          Preview migration without making changes
 *   --batch-size N     Process N records at a time (default: 100)
 *   --company-id ID    Migrate only specific company
 *   --resume           Resume from last checkpoint
 *   --force            Skip validation checks
 */

import { db } from '../server/db.js';
import { aiKnowledgeBase } from '../shared/schema.js';
import { eq, isNotNull, and, isNull, sql } from 'drizzle-orm';
import { createLogger } from '../server/utils/logger.js';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('embedding-migration');

// Configuration
interface MigrationConfig {
  dryRun: boolean;
  batchSize: number;
  companyId?: string;
  resume: boolean;
  force: boolean;
}

interface MigrationCheckpoint {
  lastProcessedId: string;
  processedCount: number;
  successCount: number;
  failedCount: number;
  timestamp: Date;
}

interface MigrationStats {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  startTime: Date;
  endTime?: Date;
}

const CHECKPOINT_FILE = '.migration-checkpoint.json';

// Parse command line arguments
function parseArgs(): MigrationConfig {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    batchSize: parseInt(args.find(a => a.startsWith('--batch-size='))?.split('=')[1] || '100'),
    companyId: args.find(a => a.startsWith('--company-id='))?.split('=')[1],
    resume: args.includes('--resume'),
    force: args.includes('--force'),
  };
}

// Load checkpoint for resume
function loadCheckpoint(): MigrationCheckpoint | null {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      const data = fs.readFileSync(CHECKPOINT_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    logger.warn('Failed to load checkpoint:', error);
  }
  return null;
}

// Save checkpoint
function saveCheckpoint(checkpoint: MigrationCheckpoint): void {
  try {
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
  } catch (error) {
    logger.error('Failed to save checkpoint:', error);
  }
}

// Validate embedding array
function isValidEmbedding(embedding: any): embedding is number[] {
  if (!Array.isArray(embedding)) {
    return false;
  }

  // Check if all elements are numbers
  if (!embedding.every(v => typeof v === 'number' && !isNaN(v))) {
    return false;
  }

  // Check dimensions (OpenAI ada-002 = 1536, sentence-transformers vary)
  const validDimensions = [384, 768, 1536]; // Common embedding dimensions
  if (!validDimensions.includes(embedding.length)) {
    return false;
  }

  return true;
}

// Perform pre-migration validation
async function validateMigration(config: MigrationConfig): Promise<boolean> {
  if (config.force) {
    logger.warn('⚠️  Validation skipped (--force flag)');
    return true;
  }

  logger.info('Running pre-migration validation checks...\n');

  try {
    // Check 1: Verify vector column exists
    logger.info('Check 1: Verifying vector column exists...');
    const tableInfo = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'ai_knowledge_base'
        AND column_name = 'embedding'
    `);

    if (tableInfo.rows.length === 0) {
      logger.error('❌ Vector column "embedding" not found in ai_knowledge_base table');
      logger.info('   Run: npm run db:push');
      return false;
    }
    logger.info('✅ Vector column exists');

    // Check 2: Count records to migrate
    logger.info('\nCheck 2: Counting records to migrate...');
    const conditions = [
      isNotNull(aiKnowledgeBase.embeddings),
      isNull(aiKnowledgeBase.embedding)
    ];
    if (config.companyId) {
      conditions.push(eq(aiKnowledgeBase.companyId, config.companyId));
    }

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiKnowledgeBase)
      .where(and(...conditions));

    const totalToMigrate = Number(countResult[0].count);
    logger.info(`✅ Found ${totalToMigrate} records to migrate`);

    if (totalToMigrate === 0) {
      logger.info('ℹ️  No records need migration');
      return false;
    }

    // Check 3: Sample validation
    logger.info('\nCheck 3: Validating sample embeddings...');
    const sample = await db
      .select()
      .from(aiKnowledgeBase)
      .where(and(...conditions))
      .limit(10);

    let validCount = 0;
    for (const record of sample) {
      if (isValidEmbedding(record.embeddings)) {
        validCount++;
      }
    }

    const validationRate = (validCount / sample.length) * 100;
    logger.info(`✅ ${validCount}/${sample.length} sample embeddings valid (${validationRate.toFixed(1)}%)`);

    if (validationRate < 90) {
      logger.warn('⚠️  Less than 90% of sample embeddings are valid');
      logger.warn('   Consider reviewing data quality before migration');
      if (!config.force) {
        return false;
      }
    }

    logger.info('\n✅ All validation checks passed');
    return true;

  } catch (error) {
    logger.error('❌ Validation failed:', error);
    return false;
  }
}

// Migrate a single record
async function migrateRecord(record: any): Promise<boolean> {
  try {
    const embedding = record.embeddings;

    // Validate embedding
    if (!isValidEmbedding(embedding)) {
      logger.warn(`Invalid embedding for record ${record.id}: ${typeof embedding}, length: ${Array.isArray(embedding) ? embedding.length : 'N/A'}`);
      return false;
    }

    // Update with vector format
    await db
      .update(aiKnowledgeBase)
      .set({
        embedding: embedding, // Drizzle will convert to vector
        updatedAt: new Date()
      })
      .where(eq(aiKnowledgeBase.id, record.id));

    return true;

  } catch (error) {
    logger.error(`Failed to migrate record ${record.id}:`, error);
    return false;
  }
}

// Main migration function
async function runMigration(config: MigrationConfig): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    startTime: new Date()
  };

  try {
    // Load checkpoint if resuming
    let checkpoint: MigrationCheckpoint | null = null;
    if (config.resume) {
      checkpoint = loadCheckpoint();
      if (checkpoint) {
        logger.info(`📍 Resuming from checkpoint: ${checkpoint.processedCount} records processed`);
        stats.processed = checkpoint.processedCount;
        stats.successful = checkpoint.successCount;
        stats.failed = checkpoint.failedCount;
      }
    }

    // Build query conditions
    const conditions = [
      isNotNull(aiKnowledgeBase.embeddings),
      isNull(aiKnowledgeBase.embedding)
    ];
    if (config.companyId) {
      conditions.push(eq(aiKnowledgeBase.companyId, config.companyId));
    }
    if (checkpoint?.lastProcessedId) {
      conditions.push(sql`${aiKnowledgeBase.id} > ${checkpoint.lastProcessedId}`);
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiKnowledgeBase)
      .where(and(...conditions));
    stats.total = Number(countResult[0].count);

    logger.info(`\n📊 Migration starting: ${stats.total} records to process`);
    if (config.dryRun) {
      logger.info('🔍 DRY RUN MODE - No changes will be made\n');
    }

    // Process in batches
    let offset = 0;
    let lastProcessedId = checkpoint?.lastProcessedId || '';

    while (offset < stats.total) {
      // Fetch batch
      const batch = await db
        .select()
        .from(aiKnowledgeBase)
        .where(and(...conditions))
        .orderBy(aiKnowledgeBase.id)
        .limit(config.batchSize)
        .offset(offset);

      if (batch.length === 0) {
        break;
      }

      // Process each record in batch
      for (const record of batch) {
        if (config.dryRun) {
          // Just validate in dry-run mode
          const valid = isValidEmbedding(record.embeddings);
          if (valid) {
            stats.successful++;
          } else {
            stats.failed++;
          }
        } else {
          // Actually migrate
          const success = await migrateRecord(record);
          if (success) {
            stats.successful++;
          } else {
            stats.failed++;
          }
        }

        stats.processed++;
        lastProcessedId = record.id;

        // Progress indicator
        if (stats.processed % 100 === 0) {
          const progress = ((stats.processed / stats.total) * 100).toFixed(1);
          logger.info(`Progress: ${stats.processed}/${stats.total} (${progress}%) - Success: ${stats.successful}, Failed: ${stats.failed}`);

          // Save checkpoint
          if (!config.dryRun) {
            saveCheckpoint({
              lastProcessedId,
              processedCount: stats.processed,
              successCount: stats.successful,
              failedCount: stats.failed,
              timestamp: new Date()
            });
          }
        }
      }

      offset += config.batchSize;
    }

    stats.endTime = new Date();

    // Clean up checkpoint on successful completion
    if (!config.dryRun && stats.failed === 0) {
      try {
        fs.unlinkSync(CHECKPOINT_FILE);
      } catch (e) {
        // Ignore errors
      }
    }

  } catch (error) {
    logger.error('Migration failed:', error);
    stats.endTime = new Date();
  }

  return stats;
}

// Print final report
function printReport(stats: MigrationStats, config: MigrationConfig): void {
  const duration = stats.endTime
    ? (stats.endTime.getTime() - stats.startTime.getTime()) / 1000
    : 0;

  logger.info('\n' + '='.repeat(60));
  logger.info('MIGRATION REPORT');
  logger.info('='.repeat(60));
  logger.info(`Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE'}`);
  logger.info(`Total records: ${stats.total}`);
  logger.info(`Processed: ${stats.processed}`);
  logger.info(`✅ Successful: ${stats.successful}`);
  logger.info(`❌ Failed: ${stats.failed}`);
  logger.info(`⏭️  Skipped: ${stats.skipped}`);
  logger.info(`Duration: ${duration.toFixed(2)} seconds`);
  if (stats.processed > 0) {
    logger.info(`Rate: ${(stats.processed / duration).toFixed(1)} records/second`);
  }
  logger.info('='.repeat(60));

  if (config.dryRun) {
    logger.info('\n🔍 This was a DRY RUN. No changes were made.');
    logger.info('   Run without --dry-run to perform actual migration.');
  } else if (stats.failed === 0 && stats.processed === stats.total) {
    logger.info('\n🎉 Migration completed successfully!');
    logger.info('\nNext steps:');
    logger.info('1. Run: npx tsx scripts/verify-pgvector.ts');
    logger.info('2. Create indexes: psql $DATABASE_URL -f scripts/create-vector-indexes.sql');
    logger.info('3. Test queries with vector similarity');
  } else if (stats.failed > 0) {
    logger.warn('\n⚠️  Migration completed with errors');
    logger.warn('   Review logs above for failed records');
    logger.warn('   Run with --resume to retry failed records');
  }
}

// Main execution
async function main() {
  const config = parseArgs();

  logger.info('🚀 Embedding Migration Script');
  logger.info('📄 Converting JSONB embeddings to pgvector format\n');

  // Show configuration
  logger.info('Configuration:');
  logger.info(`  Dry run: ${config.dryRun}`);
  logger.info(`  Batch size: ${config.batchSize}`);
  logger.info(`  Company filter: ${config.companyId || 'all'}`);
  logger.info(`  Resume: ${config.resume}`);
  logger.info(`  Force: ${config.force}\n`);

  // Validate before migration
  const isValid = await validateMigration(config);
  if (!isValid) {
    logger.error('\n❌ Validation failed. Migration aborted.');
    logger.info('   Fix issues above or use --force to skip validation');
    process.exit(1);
  }

  // Confirm before proceeding (if not dry-run)
  if (!config.dryRun && !config.force) {
    logger.info('\n⚠️  This will modify the database.');
    logger.info('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Run migration
  const stats = await runMigration(config);

  // Print report
  printReport(stats, config);

  // Exit with appropriate code
  process.exit(stats.failed > 0 ? 1 : 0);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runMigration, validateMigration, isValidEmbedding };
