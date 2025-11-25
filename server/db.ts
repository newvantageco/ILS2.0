import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";
import logger from './utils/logger';


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

// Use appropriate driver based on database type
let pool: any;
let db: any;

if (isStandardPostgres) {
  // Use standard PostgreSQL driver for local/Docker/Railway databases
  logger.info('🔧 Using standard PostgreSQL driver (pg) for database');
  pool = new PgPool({ connectionString: process.env.DATABASE_URL });
  db = drizzlePg(pool, { schema });
} else {
  // Use Neon serverless driver for Neon cloud database (WebSocket-based)
  logger.info('🔧 Using Neon serverless driver for cloud database');
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon({ client: pool, schema });
}

export { pool, db };
