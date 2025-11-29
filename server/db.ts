/**
 * Database Connection - Simplified & Production-Ready
 *
 * Uses standard pg driver with connection pooling.
 * Environment controls the database via DATABASE_URL.
 * For Neon: use their PgBouncer endpoint (sslmode=require)
 * For Local/Docker/Railway: standard PostgreSQL connection
 *
 * IMPORTANT: This module does NOT throw at import time to allow
 * health checks to run even if DATABASE_URL is not configured.
 * The db and pool exports will be null if DATABASE_URL is missing.
 */
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import logger from './utils/logger';

// Initialize pool and db as null - they will be set if DATABASE_URL exists
let pool: Pool | null = null;
let db: NodePgDatabase<typeof schema> | null = null;

// Only initialize database connection if DATABASE_URL is configured
// This allows the server to start and serve health checks even without a database
if (process.env.DATABASE_URL) {
  // Production-ready pool configuration
  // These can be overridden via environment variables
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  // Handle pool errors gracefully
  pool.on('error', (err: Error) => {
    logger.error({ error: err.message }, 'PostgreSQL pool error - client will be removed from pool');
  });

  pool.on('connect', () => {
    logger.debug('New PostgreSQL client connected to pool');
  });

  // Initialize Drizzle ORM
  db = drizzle(pool, { schema });

  logger.info({ maxConnections: pool.options.max }, 'Database pool initialized');
} else {
  logger.warn({}, 'DATABASE_URL not set - database features will be unavailable');
}

/**
 * Test database connectivity - useful for health checks
 */
export async function testConnection(): Promise<boolean> {
  if (!pool) {
    logger.warn({}, 'Database pool not initialized - cannot test connection');
    return false;
  }
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Database connection test failed');
    return false;
  }
}

/**
 * Gracefully close all pool connections
 */
export async function closePool(): Promise<void> {
  if (!pool) {
    logger.debug({}, 'No database pool to close');
    return;
  }
  try {
    await pool.end();
    logger.info('PostgreSQL pool closed gracefully');
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error closing database pool');
  }
}

/**
 * Check if database is available
 */
export function isDatabaseAvailable(): boolean {
  return pool !== null && db !== null;
}

export { pool, db };
