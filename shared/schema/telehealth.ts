/**
 * Telehealth Schema
 * Database schema for video consultations and telehealth sessions
 */

import { pgTable, text, timestamp, integer, boolean, uuid, json } from 'drizzle-orm/pg-core';
import { users, companies, patients, appointments } from '../schema';

export const telehealthSessions = pgTable('telehealth_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: text('company_id').notNull().references(() => companies.id),
  providerId: text('provider_id').notNull().references(() => users.id),
  patientId: text('patient_id').notNull().references(() => patients.id),
  appointmentId: text('appointment_id').references(() => appointments.id),
  
  sessionType: text('session_type').notNull(), // 'video' | 'async' | 'phone'
  status: text('status').notNull().default('scheduled'), // 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  
  roomId: text('room_id'), // Video room identifier
  recordingUrl: text('recording_url'), // Optional recording
  
  scheduledStart: timestamp('scheduled_start'),
  actualStart: timestamp('actual_start'),
  actualEnd: timestamp('actual_end'),
  duration: integer('duration'), // Duration in seconds
  
  consentGiven: boolean('consent_given').default(false),
  consentTimestamp: timestamp('consent_timestamp'),
  
  clinicalNotes: text('clinical_notes'),
  prescriptionIssued: boolean('prescription_issued').default(false),
  followUpRequired: boolean('follow_up_required').default(false),
  
  technicalIssues: text('technical_issues'), // JSON string of any tech problems
  patientRating: integer('patient_rating'), // 1-5 stars
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at'),
});

export const telehealthMessages = pgTable('telehealth_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => telehealthSessions.id),
  
  senderId: text('sender_id').notNull().references(() => users.id),
  messageType: text('message_type').notNull(), // 'text' | 'image' | 'file' | 'prescription'
  content: text('content').notNull(),
  attachmentUrl: text('attachment_url'),
  
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const telehealthDocuments = pgTable('telehealth_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => telehealthSessions.id),
  
  documentType: text('document_type').notNull(), // 'consent' | 'prescription' | 'image' | 'test_result'
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  
  uploadedBy: text('uploaded_by').notNull().references(() => users.id),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type TelehealthSession = typeof telehealthSessions.$inferSelect;
export type NewTelehealthSession = typeof telehealthSessions.$inferInsert;

export type TelehealthMessage = typeof telehealthMessages.$inferSelect;
export type NewTelehealthMessage = typeof telehealthMessages.$inferInsert;

export type TelehealthDocument = typeof telehealthDocuments.$inferSelect;
export type NewTelehealthDocument = typeof telehealthDocuments.$inferInsert;
