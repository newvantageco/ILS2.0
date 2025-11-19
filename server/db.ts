import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Detect if we're using local PostgreSQL or Neon cloud
const isLocalPostgres = process.env.DATABASE_URL?.includes('localhost') || 
                        process.env.DATABASE_URL?.includes('127.0.0.1') ||
                        process.env.DATABASE_URL?.includes('postgres:5432') || // Docker service
                        process.env.DATABASE_URL?.includes('@postgres/') ||
                        process.env.NODE_ENV === 'development';

// Use appropriate driver based on database type
let pool: any;
let db: any;

if (isLocalPostgres) {
  // Use standard PostgreSQL driver for local/Docker databases
  console.log('🔧 Using standard PostgreSQL driver (pg) for local database');
  pool = new PgPool({ connectionString: process.env.DATABASE_URL });
  db = drizzlePg(pool, { schema });
} else {
  // Use Neon serverless driver for cloud database
  console.log('🔧 Using Neon serverless driver for cloud database');
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon({ client: pool, schema });
}

export { pool, db };
