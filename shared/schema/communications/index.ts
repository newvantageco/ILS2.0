/**
 * Communications Domain Schema
 *
 * Tables for communication management including:
 * - Email templates
 * - Email logs with tracking
 * - Email tracking events
 *
 * @module shared/schema/communications
 */

import { pgTable, text, varchar, timestamp, jsonb, index, pgEnum, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod";

// ============================================
// COMMUNICATION ENUMS
// ============================================

export const emailTypeEnum = pgEnum("email_type", [
  "invoice",
  "receipt",
  "prescription_reminder",
  "recall_notification",
  "appointment_reminder",
  "order_confirmation",
  "order_update",
  "marketing",
  "general"
]);

export const emailStatusEnum = pgEnum("email_status", [
  "queued",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "failed",
  "spam"
]);

export const emailEventTypeEnum = pgEnum("email_event_type", [
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "spam",
  "unsubscribed"
]);

// ============================================
// EMAIL TEMPLATES
// ============================================

export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),

  // Template details
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  emailType: emailTypeEnum("email_type").notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),

  // Template variables (e.g., {{customerName}}, {{invoiceNumber}})
  variables: jsonb("variables"),

  // Settings
  isActive: boolean("is_active").default(true).notNull(),
  isDefault: boolean("is_default").default(false),

  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_email_templates_company").on(table.companyId),
  index("idx_email_templates_type").on(table.emailType),
  index("idx_email_templates_active").on(table.isActive),
]);

// ============================================
// EMAIL LOGS
// ============================================

export const emailLogs = pgTable("email_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),

  // Recipient info
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  recipientName: varchar("recipient_name", { length: 255 }),
  patientId: varchar("patient_id"),

  // Email details
  emailType: emailTypeEnum("email_type").notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),

  // Tracking
  status: emailStatusEnum("status").default("queued").notNull(),
  trackingId: varchar("tracking_id", { length: 100 }).unique(),

  // Related entities
  templateId: varchar("template_id"),
  relatedEntityType: varchar("related_entity_type", { length: 50 }),
  relatedEntityId: varchar("related_entity_id"),

  // Delivery info
  sentBy: varchar("sent_by").notNull(),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),

  // Engagement tracking
  openCount: integer("open_count").default(0).notNull(),
  firstOpenedAt: timestamp("first_opened_at"),
  lastOpenedAt: timestamp("last_opened_at"),
  clickCount: integer("click_count").default(0).notNull(),
  firstClickedAt: timestamp("first_clicked_at"),
  lastClickedAt: timestamp("last_clicked_at"),

  // Error handling
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0).notNull(),

  // Metadata
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_email_logs_company").on(table.companyId),
  index("idx_email_logs_recipient").on(table.recipientEmail),
  index("idx_email_logs_patient").on(table.patientId),
  index("idx_email_logs_type").on(table.emailType),
  index("idx_email_logs_status").on(table.status),
  index("idx_email_logs_sent_at").on(table.sentAt),
  index("idx_email_logs_tracking_id").on(table.trackingId),
  index("idx_email_logs_related").on(table.relatedEntityType, table.relatedEntityId),
]);

// ============================================
// EMAIL TRACKING EVENTS
// ============================================

export const emailTrackingEvents = pgTable("email_tracking_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emailLogId: varchar("email_log_id").notNull(),

  // Event details
  eventType: emailEventTypeEnum("event_type").notNull(),
  eventData: jsonb("event_data"),

  // User agent and location tracking
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  location: jsonb("location"),
  device: varchar("device", { length: 50 }),

  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_email_tracking_events_log").on(table.emailLogId),
  index("idx_email_tracking_events_type").on(table.eventType),
  index("idx_email_tracking_events_timestamp").on(table.timestamp),
]);

// ============================================
// ZOD SCHEMAS
// ============================================

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates, {
  name: z.string().min(1, "Template name is required").max(200),
  subject: z.string().min(1, "Subject is required").max(500),
  htmlContent: z.string().min(1, "HTML content is required"),
  emailType: z.enum(["invoice", "receipt", "prescription_reminder", "recall_notification", "appointment_reminder", "order_confirmation", "order_update", "marketing", "general"]),
});

export const insertEmailLogSchema = createInsertSchema(emailLogs, {
  recipientEmail: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(500),
  htmlContent: z.string().min(1, "HTML content is required"),
  emailType: z.enum(["invoice", "receipt", "prescription_reminder", "recall_notification", "appointment_reminder", "order_confirmation", "order_update", "marketing", "general"]),
});

export const insertEmailTrackingEventSchema = createInsertSchema(emailTrackingEvents, {
  eventType: z.enum(["sent", "delivered", "opened", "clicked", "bounced", "spam", "unsubscribed"]),
});

// ============================================
// TYPES
// ============================================

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;
export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;
export type EmailTrackingEvent = typeof emailTrackingEvents.$inferSelect;
export type InsertEmailTrackingEvent = typeof emailTrackingEvents.$inferInsert;
