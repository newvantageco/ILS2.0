/**
 * AR Virtual Try-On Schema
 * Database schema for AR try-on sessions and favorites
 */

import { pgTable, text, timestamp, integer, boolean, uuid, json } from 'drizzle-orm/pg-core';
import { users, companies, products } from '../schema';

export const arTryOnSessions = pgTable('ar_try_on_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id),
  companyId: text('company_id').notNull().references(() => companies.id),
  
  deviceInfo: text('device_info'), // JSON string of device capabilities
  status: text('status').notNull().default('active'), // 'active' | 'completed' | 'abandoned'
  
  startedAt: timestamp('started_at').notNull().defaultNow(),
  endedAt: timestamp('ended_at'),
  duration: integer('duration'), // Duration in seconds
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const arTryOnFavorites = pgTable('ar_try_on_favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id),
  sessionId: uuid('session_id').notNull().references(() => arTryOnSessions.id),
  productId: text('product_id').notNull().references(() => products.id),
  
  screenshot: text('screenshot'), // Base64 or URL to saved screenshot
  notes: text('notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type ARTryOnSession = typeof arTryOnSessions.$inferSelect;
export type NewARTryOnSession = typeof arTryOnSessions.$inferInsert;

export type ARTryOnFavorite = typeof arTryOnFavorites.$inferSelect;
export type NewARTryOnFavorite = typeof arTryOnFavorites.$inferInsert;
