/**
 * Orders Domain Schema
 *
 * Order management, timeline tracking, and consultation logs.
 * Orders represent lens prescriptions and are the primary business entity.
 *
 * @module shared/schema/orders
 */

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, integer, decimal } from "drizzle-orm/pg-core";
import { companies, users } from "../core/tables";
import { patients } from "../patients";
import { orderStatusEnum, consultPriorityEnum } from "../core/enums";

// ============================================
// ORDERS - Primary Business Entity
// ============================================

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  ecpId: varchar("ecp_id").notNull().references(() => users.id),
  status: orderStatusEnum("status").notNull().default("pending"),

  odSphere: decimal("od_sphere", { precision: 6, scale: 3 }),
  odCylinder: decimal("od_cylinder", { precision: 6, scale: 3 }),
  odAxis: integer("od_axis"),
  odAdd: decimal("od_add", { precision: 4, scale: 2 }),
  osSphere: decimal("os_sphere", { precision: 6, scale: 3 }),
  osCylinder: decimal("os_cylinder", { precision: 6, scale: 3 }),
  osAxis: integer("os_axis"),
  osAdd: decimal("os_add", { precision: 4, scale: 2 }),
  pd: decimal("pd", { precision: 4, scale: 1 }),

  lensType: text("lens_type").notNull(),
  lensMaterial: text("lens_material").notNull(),
  coating: text("coating").notNull(),
  frameType: text("frame_type"),

  notes: text("notes"),
  traceFileUrl: text("trace_file_url"),
  trackingNumber: text("tracking_number"),
  shippedAt: timestamp("shipped_at"),

  customerReferenceLabel: text("customer_reference_label"),
  customerReferenceNumber: text("customer_reference_number"),

  omaFileContent: text("oma_file_content"),
  omaFilename: text("oma_filename"),
  omaParsedData: jsonb("oma_parsed_data"),

  // LIMS Integration Fields (Phase 1)
  jobId: varchar("job_id"),
  jobStatus: varchar("job_status"),
  sentToLabAt: timestamp("sent_to_lab_at"),
  jobErrorMessage: text("job_error_message"),
  // PDF generation fields (worker-updated)
  pdfUrl: text("pdf_url"),
  pdfErrorMessage: text("pdf_error_message"),
  // Analytics worker error metadata (worker-updated)
  analyticsErrorMessage: text("analytics_error_message"),

  orderDate: timestamp("order_date").defaultNow().notNull(),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),

  // Timestamp tracking
  createdBy: varchar("created_by", { length: 255 }),
  updatedBy: varchar("updated_by", { length: 255 }),
  changeHistory: jsonb("change_history").default(sql`'[]'::jsonb`),

  // Import Tracking (for migrated records)
  externalId: varchar("external_id", { length: 255 }), // Original order ID from legacy system
  importSource: varchar("import_source", { length: 100 }),
  importJobId: varchar("import_job_id", { length: 255 }),
  importedAt: timestamp("imported_at"),

  // Soft Delete
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by", { length: 255 }),
});

// ============================================
// ORDER TIMELINE - Status History Tracking
// ============================================

export const orderTimeline = pgTable("order_timeline", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  status: varchar("status").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  metadata: jsonb("metadata"),
});

// ============================================
// CONSULT LOGS - Lab-ECP Communication
// ============================================

export const consultLogs = pgTable("consult_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  ecpId: varchar("ecp_id").notNull().references(() => users.id),
  priority: consultPriorityEnum("priority").notNull().default("normal"),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  labResponse: text("lab_response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
});
