/**
 * Database Read Replica Configuration
 * Distributes read queries to replica instances for better scalability
 * Critical for handling thousands of companies with heavy read workloads
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";

// Primary database pool (for writes and critical reads)
export const primaryPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || "20", 10),
  min: parseInt(process.env.DB_POOL_MIN || "5", 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  maxUses: 7500,
  application_name: `${process.env.APP_NAME || "ILS"}-primary`,
});

// Read replica pools (for read-heavy operations)
const readReplicaPools: Pool[] = [];

// Initialize read replicas if configured
function initializeReadReplicas() {
  const replicaUrls = process.env.DATABASE_READ_REPLICAS?.split(',') || [];
  
  if (replicaUrls.length === 0) {
    console.log('No read replicas configured. All queries will use primary database.');
    return;
  }

  for (let i = 0; i < replicaUrls.length; i++) {
    const url = replicaUrls[i].trim();
    if (!url) continue;

    const replicaPool = new Pool({
      connectionString: url,
      max: parseInt(process.env.DB_REPLICA_POOL_MAX || "30", 10), // Replicas can handle more connections
      min: parseInt(process.env.DB_REPLICA_POOL_MIN || "10", 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      maxUses: 7500,
      application_name: `${process.env.APP_NAME || "ILS"}-replica-${i + 1}`,
    });

    replicaPool.on("error", (err) => {
      console.error(`Read replica ${i + 1} error:`, err);
    });

    readReplicaPools.push(replicaPool);
    console.log(`✓ Read replica ${i + 1} configured`);
  }

  console.log(`Total read replicas: ${readReplicaPools.length}`);
}

initializeReadReplicas();

// Round-robin index for load balancing across replicas
let replicaIndex = 0;

/**
 * Get a read replica pool using round-robin load balancing
 */
function getReadReplicaPool(): Pool {
  if (readReplicaPools.length === 0) {
    return primaryPool; // Fallback to primary
  }

  const pool = readReplicaPools[replicaIndex];
  replicaIndex = (replicaIndex + 1) % readReplicaPools.length;
  return pool;
}

/**
 * Primary database instance (for writes and critical reads)
 */
export const db = drizzle(primaryPool, { schema });

/**
 * Read replica database instance (for read-heavy operations)
 * Automatically distributes load across available replicas
 */
export const dbRead = drizzle(getReadReplicaPool(), { schema });

/**
 * Get a fresh read database instance with load balancing
 * Use this for long-running read operations to ensure even distribution
 */
export function getReadDb() {
  return drizzle(getReadReplicaPool(), { schema });
}

/**
 * Execute a query on a specific replica (for testing/debugging)
 */
export function getReplicaDb(index: number) {
  if (index < 0 || index >= readReplicaPools.length) {
    console.warn(`Replica ${index} not available, using primary`);
    return db;
  }
  return drizzle(readReplicaPools[index], { schema });
}

/**
 * Health check for all database connections
 */
export async function checkDatabaseHealth(): Promise<{
  primary: boolean;
  replicas: boolean[];
  healthy: boolean;
}> {
  const results = {
    primary: false,
    replicas: [] as boolean[],
    healthy: false,
  };

  // Check primary
  try {
    await primaryPool.query('SELECT 1');
    results.primary = true;
  } catch (error) {
    console.error('Primary database health check failed:', error);
  }

  // Check replicas
  for (let i = 0; i < readReplicaPools.length; i++) {
    try {
      await readReplicaPools[i].query('SELECT 1');
      results.replicas[i] = true;
    } catch (error) {
      console.error(`Replica ${i + 1} health check failed:`, error);
      results.replicas[i] = false;
    }
  }

  // System is healthy if primary is up (replicas are optional)
  results.healthy = results.primary;

  return results;
}

/**
 * Get database connection stats
 */
export function getDatabaseStats() {
  return {
    primary: {
      total: primaryPool.totalCount,
      idle: primaryPool.idleCount,
      waiting: primaryPool.waitingCount,
    },
    replicas: readReplicaPools.map((pool, index) => ({
      index: index + 1,
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    })),
  };
}

/**
 * Graceful shutdown of all database connections
 */
export async function shutdownDatabases(): Promise<void> {
  console.log('Closing database connections...');
  
  try {
    await primaryPool.end();
    console.log('✓ Primary database closed');
    
    for (let i = 0; i < readReplicaPools.length; i++) {
      await readReplicaPools[i].end();
      console.log(`✓ Replica ${i + 1} closed`);
    }
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
}

// Graceful shutdown handlers
process.on("SIGTERM", async () => {
  await shutdownDatabases();
});

process.on("SIGINT", async () => {
  await shutdownDatabases();
  process.exit(0);
});

/**
 * Usage Guidelines:
 * 
 * 1. Use `db` for all write operations (INSERT, UPDATE, DELETE)
 * 2. Use `dbRead` for read operations that can tolerate slight replication lag:
 *    - List views (orders, patients, products)
 *    - Analytics queries
 *    - Dashboard metrics
 *    - Search operations
 * 
 * 3. Use `db` (primary) for reads that require immediate consistency:
 *    - Authentication checks
 *    - Authorization verification
 *    - Recent writes that must be visible immediately
 *    - Financial transactions
 * 
 * Example:
 * 
 * // Write operation - always use primary
 * await db.insert(orders).values(newOrder);
 * 
 * // Read operation - can use replica
 * const allOrders = await dbRead.select().from(orders).where(eq(orders.companyId, companyId));
 * 
 * // Critical read - use primary
 * const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
 */

console.log("Database configuration initialized");
console.log(`Read replicas available: ${readReplicaPools.length}`);
