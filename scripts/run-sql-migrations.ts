#!/usr/bin/env tsx
/**
 * SQL Migration Runner
 *
 * Runs all SQL migration files in the migrations directory
 * Tracks completed migrations in a migration_history table
 * Safe to run multiple times (idempotent)
 */

import * as dotenv from "dotenv";
dotenv.config();

import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { db } from "../db";
import { sql } from "drizzle-orm";

const MIGRATIONS_DIR = join(process.cwd(), "migrations");

interface MigrationFile {
  filename: string;
  path: string;
}

/**
 * Ensure migration history table exists
 */
async function ensureMigrationHistoryTable(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS migration_history (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW() NOT NULL,
        checksum VARCHAR(64),
        success BOOLEAN DEFAULT TRUE
      );
      CREATE INDEX IF NOT EXISTS idx_migration_history_filename ON migration_history(filename);
    `);
    console.log("✓ Migration history table ready");
  } catch (error) {
    console.error("Error creating migration history table:", error);
    throw error;
  }
}

/**
 * Get list of all SQL migration files
 */
async function getSQLMigrationFiles(): Promise<MigrationFile[]> {
  try {
    const files = await readdir(MIGRATIONS_DIR);
    const sqlFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort() // Alphabetical order
      .map(filename => ({
        filename,
        path: join(MIGRATIONS_DIR, filename),
      }));

    console.log(`Found ${sqlFiles.length} SQL migration files`);
    return sqlFiles;
  } catch (error) {
    console.error("Error reading migrations directory:", error);
    throw error;
  }
}

/**
 * Check if a migration has already been executed
 */
async function isMigrationExecuted(filename: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT 1 FROM migration_history WHERE filename = ${filename} AND success = TRUE LIMIT 1
    `);
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Error checking migration status for ${filename}:`, error);
    return false;
  }
}

/**
 * Record migration execution
 */
async function recordMigration(filename: string, success: boolean): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO migration_history (filename, success, executed_at)
      VALUES (${filename}, ${success}, NOW())
      ON CONFLICT (filename)
      DO UPDATE SET executed_at = NOW(), success = ${success}
    `);
  } catch (error) {
    console.error(`Error recording migration ${filename}:`, error);
  }
}

/**
 * Execute a single migration file
 */
async function executeMigration(migration: MigrationFile): Promise<boolean> {
  const { filename, path } = migration;

  try {
    // Check if already executed
    if (await isMigrationExecuted(filename)) {
      console.log(`⏭️  Skipping ${filename} (already executed)`);
      return true;
    }

    console.log(`📝 Executing ${filename}...`);

    // Read migration file
    const sqlContent = await readFile(path, 'utf-8');

    // Execute migration
    await db.execute(sql.raw(sqlContent));

    // Record successful execution
    await recordMigration(filename, true);

    console.log(`✓ ${filename} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error executing ${filename}:`, error);
    // Record failed execution
    await recordMigration(filename, false);
    return false;
  }
}

/**
 * Main migration runner
 */
async function runMigrations(): Promise<void> {
  console.log("=== SQL Migration Runner ===");
  console.log(`Migrations directory: ${MIGRATIONS_DIR}`);
  console.log("");

  try {
    // Ensure migration tracking table exists
    await ensureMigrationHistoryTable();

    // Get all SQL migration files
    const migrations = await getSQLMigrationFiles();

    if (migrations.length === 0) {
      console.log("No SQL migrations found");
      return;
    }

    // Execute migrations in order
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (const migration of migrations) {
      if (await isMigrationExecuted(migration.filename)) {
        skipCount++;
        console.log(`⏭️  ${migration.filename} (already executed)`);
        continue;
      }

      const success = await executeMigration(migration);
      if (success) {
        successCount++;
      } else {
        failCount++;
        // Continue with other migrations even if one fails
        console.warn(`⚠️  Continuing with remaining migrations...`);
      }
    }

    // Summary
    console.log("");
    console.log("=== Migration Summary ===");
    console.log(`Total migrations: ${migrations.length}`);
    console.log(`✓ Executed: ${successCount}`);
    console.log(`⏭️  Skipped: ${skipCount}`);
    if (failCount > 0) {
      console.log(`❌ Failed: ${failCount}`);
    }
    console.log("");

    if (failCount > 0) {
      console.warn("⚠️  Some migrations failed. Check the logs above for details.");
      console.warn("The application may still function, but some features might be unavailable.");
    } else {
      console.log("✓ All migrations completed successfully");
    }
  } catch (error) {
    console.error("Fatal error running migrations:", error);
    throw error;
  }
}

// Run migrations if executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log("Migration process completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration process failed:", error);
      process.exit(1);
    });
}

export { runMigrations };
