/**
 * Database Connection - Simplified & Production-Ready
 * 
 * Uses standard pg driver with connection pooling.
 * Environment controls the database via DATABASE_URL.
 * For Neon: use their PgBouncer endpoint (sslmode=require)
 * For Local/Docker/Railway: standard PostgreSQL connection
 */
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import logger from './utils/logger';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Production-ready pool configuration
// These can be overridden via environment variables
const pool = new Pool({
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
const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

logger.info({ maxConnections: pool.options.max }, 'Database pool initialized');

/**
 * Test database connectivity - useful for health checks
 */
export async function testConnection(): Promise<boolean> {
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
  try {
    await pool.end();
    logger.info('PostgreSQL pool closed gracefully');
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error closing database pool');
  }
}

export { pool, db };
