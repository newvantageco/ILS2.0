import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL environment variable is not set");
  console.error("This is required for database connectivity");
  
  // In production deployment, this should be configured in deployment secrets
  if (process.env.REPLIT_DEPLOYMENT) {
    console.error("Running in production deployment - DATABASE_URL must be set in deployment configuration");
  }
  
  throw new Error("DATABASE_URL must be set. Please configure it in your deployment secrets or environment variables.");
}

console.log("Initializing database connection...");

// Production-grade connection pooling configuration
// Optimized for handling thousands of concurrent companies
const pool = new Pool({
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
pool.on("connect", (client) => {
  console.log("New database client connected. Pool size:", pool.totalCount);
});

pool.on("error", (err, client) => {
  console.error("Unexpected error on idle database client:", err);
});

pool.on("remove", (client) => {
  console.log("Database client removed. Pool size:", pool.totalCount);
});

// Graceful shutdown handler
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing database pool...");
  await pool.end();
  console.log("Database pool closed");
});

export const db = drizzle(pool, { schema });

// Export pool for read replica configuration
export { pool as primaryPool };

console.log("Database connection initialized successfully");
console.log(`Connection pool configured: min=${pool.options.min}, max=${pool.options.max}`);
