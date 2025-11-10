import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Only use WebSocket for actual Neon connections (not local PostgreSQL)
const isLocalPostgres = process.env.DATABASE_URL?.includes('localhost') || 
                        process.env.DATABASE_URL?.includes('127.0.0.1');

if (!isLocalPostgres) {
  neonConfig.webSocketConstructor = ws;
} else {
  // For local PostgreSQL, disable WebSocket pooling
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineConnect = false;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
