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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

console.log("Database connection initialized successfully");
