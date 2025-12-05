/**
 * Apply Database Index Migration Script
 *
 * This script applies the missing foreign key indexes migration
 * to improve database query performance.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import pg from 'pg';

const { Pool } = pg;

async function applyMigration() {
  // Get DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL environment variable not found');
    process.exit(1);
  }

  console.log('🔌 Connecting to database...');

  // Create database pool
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('railway') ? { rejectUnauthorized: false } : undefined
  });

  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection established');

    // Read migration file
    const migrationPath = join(process.cwd(), 'migrations', '2025-12-05-add-missing-foreign-key-indexes.sql');
    console.log(`📖 Reading migration file: ${migrationPath}`);

    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Applying migration...\n');

    // Split SQL into individual statements (separated by semicolons)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comment-only statements
      if (statement.startsWith('--')) continue;

      // Extract index name for better logging
      const indexMatch = statement.match(/idx_\w+/);
      const indexName = indexMatch ? indexMatch[0] : `statement ${i + 1}`;

      try {
        await client.query(statement);

        if (statement.includes('CREATE INDEX')) {
          console.log(`  ✓ Created index: ${indexName}`);
          successCount++;
        } else if (statement.includes('ANALYZE')) {
          console.log(`  ✓ Analyzed table: ${indexName}`);
        }
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`  ⊘ Skipped (already exists): ${indexName}`);
          skipCount++;
        } else {
          console.error(`  ✗ Failed: ${indexName}`);
          console.error(`    Error: ${error.message}`);
        }
      }
    }

    console.log(`\n✅ Migration completed successfully!`);
    console.log(`   - ${successCount} indexes created`);
    console.log(`   - ${skipCount} indexes skipped (already exist)`);

    // Query to show all indexes on affected tables
    console.log('\n📊 Verifying indexes on affected tables...');
    const result = await client.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename IN ('orders', 'patients', 'order_timeline', 'consult_logs')
      ORDER BY tablename, indexname;
    `);

    console.log(`\n🔍 Total indexes found: ${result.rows.length}`);

    // Group by table
    const byTable: Record<string, number> = {};
    result.rows.forEach(row => {
      byTable[row.tablename] = (byTable[row.tablename] || 0) + 1;
    });

    console.log('\nIndexes by table:');
    Object.entries(byTable).forEach(([table, count]) => {
      console.log(`  - ${table}: ${count} indexes`);
    });

    client.release();

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
applyMigration().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
