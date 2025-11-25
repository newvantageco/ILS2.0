import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool as PgPool, PoolConfig } from 'pg';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { NeonDatabase } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import logger from './utils/logger';

// Type definitions for pool and database
type SchemaType = typeof schema;
type DbType = NodePgDatabase<SchemaType> | NeonDatabase<SchemaType>;
type PoolType = PgPool | NeonPool;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Detect if we're using standard PostgreSQL or Neon cloud
// Standard PG: local, Docker, Railway internal network
// Neon: only for neon.tech URLs (WebSocket-based)
const isStandardPostgres = process.env.DATABASE_URL?.includes('localhost') || 
                           process.env.DATABASE_URL?.includes('127.0.0.1') ||
                           process.env.DATABASE_URL?.includes('postgres:5432') || // Docker service
                           process.env.DATABASE_URL?.includes('@postgres/') ||
                           process.env.DATABASE_URL?.includes('.railway.internal') || // Railway internal network
                           process.env.DATABASE_URL?.includes('railway.app') || // Railway external
                           !process.env.DATABASE_URL?.includes('neon.tech'); // Default to standard if not Neon

// Production-ready pool configuration
const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Max connections
  min: parseInt(process.env.DB_POOL_MIN || '2', 10),  // Min connections
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Fail if connection takes >10s
  allowExitOnIdle: false, // Keep pool alive in production
};

// Use appropriate driver based on database type
let pool: PoolType;
let db: DbType;

if (isStandardPostgres) {
  // Use standard PostgreSQL driver for local/Docker/Railway databases
  logger.info('🔧 Using standard PostgreSQL driver (pg) for database');
  const pgPool = new PgPool(poolConfig);
  
  // Handle pool errors gracefully
  pgPool.on('error', (err: Error) => {
    logger.error({ error: err.message }, 'PostgreSQL pool error - client will be removed from pool');
  });
  
  pgPool.on('connect', () => {
    logger.debug('New PostgreSQL client connected to pool');
  });
  
  pool = pgPool;
  db = drizzlePg(pgPool, { schema });
} else {
  // Use Neon serverless driver for Neon cloud database (WebSocket-based)
  logger.info('🔧 Using Neon serverless driver for cloud database');
  neonConfig.webSocketConstructor = ws;
  const neonPool = new NeonPool({ connectionString: process.env.DATABASE_URL });
  pool = neonPool;
  db = drizzleNeon({ client: neonPool, schema });
}

/**
 * Test database connectivity - useful for health checks
 */
export async function testConnection(): Promise<boolean> {
  try {
    if ('query' in pool) {
      await (pool as PgPool).query('SELECT 1');
    }
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
    if ('end' in pool) {
      await (pool as PgPool).end();
      logger.info('PostgreSQL pool closed gracefully');
    }
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error closing database pool');
  }
}

export { pool, db };
