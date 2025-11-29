/**
 * Database Connection Module
 *
 * Production-grade connection pooling configuration optimized for handling
 * thousands of concurrent companies.
 *
 * IMPORTANT: This module does NOT throw at import time to allow
 * health checks to run even if DATABASE_URL is not configured.
 * Database operations will throw at runtime if DATABASE_URL is missing.
 */
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Internal nullable pool and db instances
let _pool: Pool | null = null;
let _db: NodePgDatabase<typeof schema> | null = null;

if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL environment variable is not set");
  console.warn("Database features will be unavailable until DATABASE_URL is configured");

  // In production deployment, this should be configured in deployment secrets
  if (process.env.REPLIT_DEPLOYMENT) {
    console.warn("Running in production deployment - DATABASE_URL must be set in deployment configuration");
  }
} else {
  console.log("Initializing database connection...");

  // Production-grade connection pooling configuration
  // Optimized for handling thousands of concurrent companies
  _pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    // Connection Pool Settings
    max: parseInt(process.env.DB_POOL_MAX || "20", 10),              // Maximum number of clients in the pool
    min: parseInt(process.env.DB_POOL_MIN || "5", 10),               // Minimum number of clients in the pool

    // Connection Lifecycle
    idleTimeoutMillis: 30000,                                         // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000,                                    // Timeout if connection takes > 2 seconds
    maxUses: 7500,                                                    // Recycle connections after 7500 uses

    // Error Handling
    allowExitOnIdle: false,                                           // Don't exit process when pool is idle

    // Application Name (useful for monitoring)
    application_name: process.env.APP_NAME || "IntegratedLensSystem",
  });

  // Pool event handlers for monitoring and debugging
  _pool.on("connect", () => {
    console.log("New database client connected. Pool size:", _pool?.totalCount);
  });

  _pool.on("error", (err) => {
    console.error("Unexpected error on idle database client:", err);
  });

  _pool.on("remove", () => {
    console.log("Database client removed. Pool size:", _pool?.totalCount);
  });

  // Initialize Drizzle ORM
  _db = drizzle(_pool, { schema });

  console.log("Database connection initialized successfully");
  console.log(`Connection pool configured: min=${_pool.options.min}, max=${_pool.options.max}`);
}

// Graceful shutdown handler - only close pool if it exists
process.on("SIGTERM", async () => {
  if (_pool) {
    console.log("SIGTERM received, closing database pool...");
    await _pool.end();
    console.log("Database pool closed");
  }
});

/**
 * Get database instance - throws if not initialized
 * Use this in code that requires database access
 */
export function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    throw new Error('Database not initialized. Ensure DATABASE_URL is configured.');
  }
  return _db;
}

/**
 * Get pool instance - throws if not initialized
 */
export function getPool(): Pool {
  if (!_pool) {
    throw new Error('Database pool not initialized. Ensure DATABASE_URL is configured.');
  }
  return _pool;
}

/**
 * Check if database is available
 */
export function isDatabaseAvailable(): boolean {
  return _pool !== null && _db !== null;
}

// Export db and pool as non-null types for backwards compatibility
// TypeScript will not complain, but runtime access will throw if not initialized
// Use isDatabaseAvailable() to check before accessing in code that needs graceful handling
const db = _db as NodePgDatabase<typeof schema>;
const primaryPool = _pool as Pool;

export { db, primaryPool };
