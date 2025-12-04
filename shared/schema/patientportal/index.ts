/**
 * Patient Portal Domain Schema
 *
 * Self-service portal for patients including:
 * - Medical records access and viewing
 * - Patient-provider secure messaging
 * - Online bill payments
 * - Document management and uploads
 * - Health metrics tracking
 * - Portal settings and preferences
 * - Audit logging for compliance
 */

import { pgTable, text, varchar, timestamp, jsonb, index, pgEnum, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";

// External dependencies
import { companies, users } from "../core/tables";
import { patients } from "../patients";
import { invoices, paymentMethodEnum } from "../billing";

// ============================================
// PATIENT PORTAL ENUMS
// ============================================

export const medicalRecordTypeEnum = pgEnum("medical_record_type", [
  "exam",
  "prescription",
  "lab_result",
  "document",
  "image",
]);

export const conversationStatusEnum = pgEnum("conversation_status", ["open", "closed"]);

export const messageSenderTypeEnum = pgEnum("message_sender_type", ["patient", "provider"]);

export const portalPaymentStatusEnum = pgEnum("portal_payment_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
]);

// ============================================
// PATIENT PORTAL TABLES
// ============================================

/**
 * Medical Records Table
 * Patient portal medical records (exams, prescriptions, lab results, documents)
 */
export const medicalRecords = pgTable(
  "medical_records",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    type: medicalRecordTypeEnum("type").notNull(),
    title: text("title").notNull(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    provider: text("provider").notNull(),
    summary: text("summary"),
    details: jsonb("details").$type<Record<string, any>>(),
    attachments: jsonb("attachments").$type<Array<{
      id: string;
      filename: string;
      fileType: string;
      fileSize: number;
      url: string;
    }>>(),
    viewable: boolean("viewable").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("medical_records_company_idx").on(table.companyId),
    patientIdx: index("medical_records_patient_idx").on(table.patientId),
    typeIdx: index("medical_records_type_idx").on(table.type),
    dateIdx: index("medical_records_date_idx").on(table.date),
    createdAtIdx: index("medical_records_created_at_idx").on(table.createdAt),
  })
);

/**
 * Portal Conversations Table
 * Patient-provider messaging conversations
 */
export const portalConversations = pgTable(
  "portal_conversations",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    providerId: text("provider_id").notNull(),
    providerName: text("provider_name").notNull(),
    subject: text("subject").notNull(),
    status: conversationStatusEnum("status").notNull().default("open"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull(),
    unreadCount: integer("unread_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("portal_conversations_company_idx").on(table.companyId),
    patientIdx: index("portal_conversations_patient_idx").on(table.patientId),
    providerIdx: index("portal_conversations_provider_idx").on(table.providerId),
    statusIdx: index("portal_conversations_status_idx").on(table.status),
    lastMessageAtIdx: index("portal_conversations_last_message_at_idx").on(table.lastMessageAt),
  })
);

/**
 * Portal Messages Table
 * Individual messages within conversations
 */
export const portalMessages = pgTable(
  "portal_messages",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    conversationId: text("conversation_id").notNull().references(() => portalConversations.id, { onDelete: "cascade" }),
    from: messageSenderTypeEnum("from").notNull(),
    senderId: text("sender_id").notNull(),
    senderName: text("sender_name").notNull(),
    recipientId: text("recipient_id").notNull(),
    subject: text("subject"),
    body: text("body").notNull(),
    attachments: jsonb("attachments").$type<Array<{
      filename: string;
      url: string;
    }>>(),
    read: boolean("read").notNull().default(false),
    readAt: timestamp("read_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("portal_messages_company_idx").on(table.companyId),
    conversationIdx: index("portal_messages_conversation_idx").on(table.conversationId),
    senderIdx: index("portal_messages_sender_idx").on(table.senderId),
    recipientIdx: index("portal_messages_recipient_idx").on(table.recipientId),
    sentAtIdx: index("portal_messages_sent_at_idx").on(table.sentAt),
  })
);

/**
 * Portal Payments Table
 * Patient bill payments through portal
 */
export const portalPayments = pgTable(
  "portal_payments",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    billId: text("bill_id").notNull().references(() => invoices.id, { onDelete: "restrict" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(), // in cents
    method: paymentMethodEnum("method").notNull(),
    status: portalPaymentStatusEnum("status").notNull().default("pending"),
    transactionId: text("transaction_id"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("portal_payments_company_idx").on(table.companyId),
    billIdx: index("portal_payments_bill_idx").on(table.billId),
    patientIdx: index("portal_payments_patient_idx").on(table.patientId),
    statusIdx: index("portal_payments_status_idx").on(table.status),
    createdAtIdx: index("portal_payments_created_at_idx").on(table.createdAt),
  })
);

/**
 * Patient Portal Settings
 * Portal settings and preferences
 */
export const patientPortalSettings = pgTable("patient_portal_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  preferredLanguage: varchar("preferred_language").default("en"),
  timezone: varchar("timezone").default("UTC"),
  notificationPreferences: jsonb("notification_preferences"),
  privacySettings: jsonb("privacy_settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Patient Documents
 * Patient documents and files
 */
export const patientDocuments = pgTable("patient_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  documentType: varchar("document_type").notNull(), // lab_result, imaging, prescription, insurance_card, id_document, other
  title: varchar("title").notNull(),
  description: text("description"),
  fileUrl: varchar("file_url").notNull(),
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  isShared: boolean("is_shared").default(false).notNull(),
  status: varchar("status").default("active").notNull(), // active, archived, deleted
  uploadedBy: varchar("uploaded_by").references(() => users.id, { onDelete: 'set null' }),
  tags: jsonb("tags"),
  metadata: jsonb("metadata"),
});

/**
 * Patient Health Metrics
 * Health metrics and wellness tracking
 */
export const patientHealthMetrics = pgTable("patient_health_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  metricType: varchar("metric_type").notNull(), // blood_pressure, weight, blood_sugar, temperature, heart_rate, oxygen_saturation, custom
  value: numeric("value").notNull(),
  unit: varchar("unit").notNull(),
  measuredAt: timestamp("measured_at").notNull(),
  notes: text("notes"),
  deviceInfo: varchar("device_info"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  source: varchar("source").default("patient"), // patient, provider, device
  customMetricName: varchar("custom_metric_name"),
  metadata: jsonb("metadata"),
});

/**
 * Patient Portal Access Logs
 * Portal access logs for audit
 */
export const patientPortalAccessLogs = pgTable("patient_portal_access_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  accessTime: timestamp("access_time").defaultNow().notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  action: varchar("action").notNull(), // login, logout, view_records, send_message, etc.
  resourceType: varchar("resource_type"), // appointment, medical_record, message, document
  resourceId: varchar("resource_id"),
  success: boolean("success").default(true).notNull(),
  failureReason: varchar("failure_reason"),
  sessionId: varchar("session_id"),
  location: jsonb("location"), // geolocation data
  deviceFingerprint: varchar("device_fingerprint"),
});

// ============================================
// ZOD SCHEMAS
// ============================================

export const insertMedicalRecordSchema = createInsertSchema(medicalRecords);
export const insertPortalConversationSchema = createInsertSchema(portalConversations);
export const insertPortalMessageSchema = createInsertSchema(portalMessages);
export const insertPortalPaymentSchema = createInsertSchema(portalPayments);

// ============================================
// TYPES
// ============================================

export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type InsertMedicalRecord = typeof medicalRecords.$inferInsert;
export type PortalConversation = typeof portalConversations.$inferSelect;
export type InsertPortalConversation = typeof portalConversations.$inferInsert;
export type PortalMessage = typeof portalMessages.$inferSelect;
export type InsertPortalMessage = typeof portalMessages.$inferInsert;
export type PortalPayment = typeof portalPayments.$inferSelect;
export type InsertPortalPayment = typeof portalPayments.$inferInsert;
export type PatientPortalSetting = typeof patientPortalSettings.$inferSelect;
export type InsertPatientPortalSetting = typeof patientPortalSettings.$inferInsert;
export type PatientDocument = typeof patientDocuments.$inferSelect;
export type InsertPatientDocument = typeof patientDocuments.$inferInsert;
export type PatientHealthMetric = typeof patientHealthMetrics.$inferSelect;
export type InsertPatientHealthMetric = typeof patientHealthMetrics.$inferInsert;
export type PatientPortalAccessLog = typeof patientPortalAccessLogs.$inferSelect;
export type InsertPatientPortalAccessLog = typeof patientPortalAccessLogs.$inferInsert;
