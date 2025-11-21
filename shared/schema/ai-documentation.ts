/**
 * AI Documentation Schema
 * Database schema for AI-powered clinical documentation
 */

import { pgTable, text, timestamp, integer, decimal, boolean, uuid } from 'drizzle-orm/pg-core';
import { users, companies, patients } from '../schema';

export const aiDocumentationLogs = pgTable('ai_documentation_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id),
  companyId: text('company_id').notNull().references(() => companies.id),
  patientId: text('patient_id').references(() => patients.id),
  
  documentationType: text('documentation_type').notNull(), // 'clinical_note' | 'differential_diagnosis' | 'auto_coding'
  
  tokenCount: integer('token_count'),
  generationTimeMs: integer('generation_time_ms'),
  confidence: decimal('confidence', { precision: 5, scale: 4 }), // 0.0000 to 1.0000
  
  wasAccepted: boolean('was_accepted'), // null = pending, true = accepted, false = rejected
  userEdits: text('user_edits'), // JSON string of edits made by user
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at'),
});

export type AIDocumentationLog = typeof aiDocumentationLogs.$inferSelect;
export type NewAIDocumentationLog = typeof aiDocumentationLogs.$inferInsert;
