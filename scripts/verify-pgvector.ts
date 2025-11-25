/**
 * pgvector Verification Script
 *
 * Tests if pgvector extension is installed and working in the database.
 * Run: npx tsx scripts/verify-pgvector.ts
 */

import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';
import { createLogger } from '../server/utils/logger.js';

const logger = createLogger('pgvector-verify');

interface PgExtension {
  extname: string;
  extversion: string;
}

interface VectorTest {
  distance: number;
}

async function verifyPgvector() {
  logger.info('Starting pgvector verification...\n');

  try {
    // Test 1: Check if pgvector extension is installed
    logger.info('Test 1: Checking pgvector extension...');
    const extensions = await db.execute<PgExtension>(
      sql`SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'`
    );

    if (extensions.rows.length === 0) {
      logger.error('❌ pgvector extension NOT found');
      logger.info('\nTo install pgvector:');
      logger.info('1. Connect to database as superuser');
      logger.info('2. Run: CREATE EXTENSION vector;');
      logger.info('3. Verify: SELECT * FROM pg_extension WHERE extname = \'vector\';');
      return false;
    }

    const ext = extensions.rows[0];
    logger.info(`✅ pgvector extension found: version ${ext.extversion}`);

    // Test 2: Test vector operations
    logger.info('\nTest 2: Testing vector operations...');
    const result = await db.execute<VectorTest>(
      sql`SELECT '[1,2,3]'::vector <=> '[4,5,6]'::vector AS distance`
    );

    const distance = result.rows[0].distance;
    logger.info(`✅ Vector cosine distance calculation works: ${distance}`);

    // Test 3: Check if vector column exists in schema
    logger.info('\nTest 3: Checking ai_knowledge_base table...');
    const tableInfo = await db.execute(sql`
      SELECT
        column_name,
        data_type,
        udt_name
      FROM information_schema.columns
      WHERE table_name = 'ai_knowledge_base'
        AND column_name IN ('embedding', 'embeddings')
      ORDER BY column_name
    `);

    logger.info(`Found ${tableInfo.rows.length} embedding-related columns:`);
    for (const col of tableInfo.rows) {
      logger.info(`  - ${col.column_name}: ${col.data_type} (${col.udt_name})`);
    }

    const hasVectorColumn = tableInfo.rows.some(
      (col: any) => col.column_name === 'embedding' && col.udt_name === 'vector'
    );
    const hasJsonbColumn = tableInfo.rows.some(
      (col: any) => col.column_name === 'embeddings' && col.udt_name === 'jsonb'
    );

    if (!hasVectorColumn) {
      logger.warn('⚠️  Vector column "embedding" not found in schema');
      logger.info('   Run: npm run db:push to create vector column');
    } else {
      logger.info('✅ Vector column "embedding" exists');
    }

    if (hasJsonbColumn) {
      logger.info('ℹ️  Legacy JSONB column "embeddings" still exists (will be migrated)');
    }

    // Test 4: Check for vector indexes
    logger.info('\nTest 4: Checking vector indexes...');
    const indexes = await db.execute(sql`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'ai_knowledge_base'
        AND indexdef LIKE '%vector%'
    `);

    if (indexes.rows.length === 0) {
      logger.warn('⚠️  No vector indexes found');
      logger.info('   Consider creating an IVFFlat or HNSW index for better performance');
    } else {
      logger.info(`✅ Found ${indexes.rows.length} vector index(es):`);
      for (const idx of indexes.rows) {
        logger.info(`  - ${idx.indexname}`);
      }
    }

    // Test 5: Count existing embeddings
    logger.info('\nTest 5: Checking existing embedding data...');
    const counts = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE embeddings IS NOT NULL) as jsonb_count,
        COUNT(*) FILTER (WHERE embedding IS NOT NULL) as vector_count,
        COUNT(*) as total_count
      FROM ai_knowledge_base
    `);

    const stats = counts.rows[0];
    logger.info(`Total knowledge base entries: ${stats.total_count}`);
    logger.info(`  - With JSONB embeddings: ${stats.jsonb_count}`);
    logger.info(`  - With vector embeddings: ${stats.vector_count}`);

    if (Number(stats.jsonb_count) > 0 && Number(stats.vector_count) === 0) {
      logger.warn('⚠️  Found JSONB embeddings that need migration to vector format');
      logger.info('   Run: npx tsx scripts/migrate-embeddings-to-vector.ts');
    } else if (Number(stats.vector_count) > 0) {
      logger.info('✅ Vector embeddings are populated');
    }

    // Summary
    logger.info('\n' + '='.repeat(60));
    logger.info('VERIFICATION SUMMARY');
    logger.info('='.repeat(60));
    logger.info(`✅ pgvector extension: INSTALLED (v${ext.extversion})`);
    logger.info(`✅ Vector operations: WORKING`);
    logger.info(`${hasVectorColumn ? '✅' : '⚠️ '} Vector column: ${hasVectorColumn ? 'EXISTS' : 'MISSING'}`);
    logger.info(`${indexes.rows.length > 0 ? '✅' : '⚠️ '} Vector indexes: ${indexes.rows.length > 0 ? 'CONFIGURED' : 'MISSING'}`);
    logger.info(`${Number(stats.vector_count) > 0 ? '✅' : 'ℹ️ '} Vector data: ${Number(stats.vector_count)} records`);
    logger.info('='.repeat(60));

    if (hasVectorColumn && Number(stats.vector_count) > 0) {
      logger.info('\n🎉 pgvector is FULLY OPERATIONAL!');
      return true;
    } else if (hasVectorColumn) {
      logger.info('\n⚠️  pgvector is CONFIGURED but needs data migration');
      return true;
    } else {
      logger.info('\n⚠️  pgvector extension works but schema needs update (run db:push)');
      return true;
    }

  } catch (error) {
    logger.error('❌ Verification failed:', error);
    if (error instanceof Error) {
      logger.error('Error details:', error.message);
    }
    return false;
  }
}

// Run verification
verifyPgvector()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
