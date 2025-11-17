/**
 * Main Schema Index
 * 
 * This file imports and re-exports all domain-specific schemas.
 * This replaces the monolithic 3,000+ line schema.ts file with
 * a clean, modular architecture.
 */

// Core domain - essential business entities
export * from './core';

// Healthcare domain - care plans, goals, interventions, risk factors
export * from './healthcare';

// AI domain - recommendations, risk scores, analytics
export * from './ai';

// Additional domains can be added here as the application grows
// export * from './billing';
// export * from './inventory';
// export * from './rcm';

// Re-export commonly used imports for convenience
export { 
  pgTable, 
  text, 
  varchar, 
  timestamp, 
  jsonb, 
  index, 
  pgEnum, 
  integer, 
  decimal, 
  numeric, 
  real, 
  boolean, 
  date, 
  uniqueIndex
} from "drizzle-orm/pg-core";

export { createInsertSchema } from "drizzle-zod";
export { sql } from "drizzle-orm";
export { z } from "zod";
