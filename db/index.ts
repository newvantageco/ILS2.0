/**
 * Database Connection Module
 *
 * Production-grade connection pooling configuration optimized for handling
 * thousands of concurrent companies.
 *
 * IMPORTANT: This module does NOT throw at import time to allow
 * health checks to run even if DATABASE_URL is not configured.
 */
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize pool and db as null - they will be set if DATABASE_URL exists
let pool: Pool | null = null;
let db: NodePgDatabase<typeof schema> | null = null;

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
  pool = new Pool({
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
  pool.on("connect", () => {
    console.log("New database client connected. Pool size:", pool?.totalCount);
  });

  pool.on("error", (err) => {
    console.error("Unexpected error on idle database client:", err);
  });

  pool.on("remove", () => {
    console.log("Database client removed. Pool size:", pool?.totalCount);
  });

  // Initialize Drizzle ORM
  db = drizzle(pool, { schema });

  console.log("Database connection initialized successfully");
  console.log(`Connection pool configured: min=${pool.options.min}, max=${pool.options.max}`);
}

// Graceful shutdown handler - only close pool if it exists
process.on("SIGTERM", async () => {
  if (pool) {
    console.log("SIGTERM received, closing database pool...");
    await pool.end();
    console.log("Database pool closed");
  }
});

// Export pool for read replica configuration
export { db, pool as primaryPool };
