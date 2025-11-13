/**
 * Archived Data Schema
 *
 * Provides tables and utilities for soft deletes, archival, and historical data retention.
 * Allows retrieval of old data and reports without permanently deleting them.
 */

import { pgTable, text, varchar, timestamp, jsonb, index, integer, boolean } from "drizzle-orm/pg-core";

/**
 * Archived Records Table
 *
 * Stores soft-deleted records from any table in the system.
 * Allows complete data recovery and historical analysis.
 */
export const archivedRecords = pgTable("archived_records", {
  id: varchar("id", { length: 255 }).primaryKey(),

  // Original record information
  originalTable: varchar("original_table", { length: 255 }).notNull(),
  originalId: varchar("original_id", { length: 255 }).notNull(),
  recordData: jsonb("record_data").notNull(),

  // Metadata
  companyId: varchar("company_id", { length: 255 }),
  archivedAt: timestamp("archived_at").defaultNow().notNull(),
  archivedBy: varchar("archived_by", { length: 255 }),
  archiveReason: text("archive_reason"),

  // Restore tracking
  restoredAt: timestamp("restored_at"),
  restoredBy: varchar("restored_by", { length: 255 }),

  // Permanent deletion tracking (if ever needed)
  permanentlyDeletedAt: timestamp("permanently_deleted_at"),
  permanentlyDeletedBy: varchar("permanently_deleted_by", { length: 255 }),

  // Tags for categorization
  tags: jsonb("tags").$type<string[]>(),
}, (table) => ({
  originalTableIdx: index("archived_records_original_table_idx").on(table.originalTable),
  originalIdIdx: index("archived_records_original_id_idx").on(table.originalId),
  companyIdIdx: index("archived_records_company_id_idx").on(table.companyId),
  archivedAtIdx: index("archived_records_archived_at_idx").on(table.archivedAt),
}));

/**
 * Report Archives Table
 *
 * Stores generated reports for historical retrieval.
 * Allows users to access old reports without regenerating them.
 */
export const reportArchives = pgTable("report_archives", {
  id: varchar("id", { length: 255 }).primaryKey(),

  // Report identification
  reportType: varchar("report_type", { length: 255 }).notNull(),
  reportName: varchar("report_name", { length: 500 }).notNull(),

  // Report data
  reportData: jsonb("report_data").notNull(),
  parameters: jsonb("parameters"),

  // File storage (if exported)
  fileUrl: text("file_url"),
  fileFormat: varchar("file_format", { length: 50 }), // pdf, xlsx, csv, json
  fileSize: integer("file_size"), // bytes

  // Metadata
  companyId: varchar("company_id", { length: 255 }).notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  generatedBy: varchar("generated_by", { length: 255 }).notNull(),

  // Time period covered by report
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),

  // Access tracking
  lastAccessedAt: timestamp("last_accessed_at"),
  accessCount: integer("access_count").default(0).notNull(),

  // Retention
  expiresAt: timestamp("expires_at"),
  isArchived: boolean("is_archived").default(false).notNull(),

  // Tags and categorization
  tags: jsonb("tags").$type<string[]>(),
  category: varchar("category", { length: 255 }),
}, (table) => ({
  reportTypeIdx: index("report_archives_report_type_idx").on(table.reportType),
  companyIdIdx: index("report_archives_company_id_idx").on(table.companyId),
  generatedAtIdx: index("report_archives_generated_at_idx").on(table.generatedAt),
  periodStartIdx: index("report_archives_period_start_idx").on(table.periodStart),
  expiresAtIdx: index("report_archives_expires_at_idx").on(table.expiresAt),
}));

/**
 * Data Export Logs Table
 *
 * Tracks all data exports for compliance and auditing.
 */
export const dataExportLogs = pgTable("data_export_logs", {
  id: varchar("id", { length: 255 }).primaryKey(),

  // Export details
  exportType: varchar("export_type", { length: 255 }).notNull(),
  entityType: varchar("entity_type", { length: 255 }).notNull(),
  recordCount: integer("record_count").notNull(),

  // Filters and parameters
  filters: jsonb("filters"),
  dateRange: jsonb("date_range").$type<{ start: string; end: string }>(),

  // File information
  fileUrl: text("file_url"),
  fileFormat: varchar("file_format", { length: 50 }).notNull(),
  fileSize: integer("file_size"),

  // Metadata
  companyId: varchar("company_id", { length: 255 }).notNull(),
  exportedAt: timestamp("exported_at").defaultNow().notNull(),
  exportedBy: varchar("exported_by", { length: 255 }).notNull(),

  // Download tracking
  downloadCount: integer("download_count").default(0).notNull(),
  lastDownloadedAt: timestamp("last_downloaded_at"),

  // Status
  status: varchar("status", { length: 50 }).default("completed").notNull(),
  errorMessage: text("error_message"),
}, (table) => ({
  exportTypeIdx: index("data_export_logs_export_type_idx").on(table.exportType),
  companyIdIdx: index("data_export_logs_company_id_idx").on(table.companyId),
  exportedAtIdx: index("data_export_logs_exported_at_idx").on(table.exportedAt),
}));

/**
 * Historical Snapshots Table
 *
 * Stores point-in-time snapshots of critical data for time-travel queries.
 */
export const historicalSnapshots = pgTable("historical_snapshots", {
  id: varchar("id", { length: 255 }).primaryKey(),

  // Snapshot details
  snapshotType: varchar("snapshot_type", { length: 255 }).notNull(),
  entityType: varchar("entity_type", { length: 255 }).notNull(),
  entityId: varchar("entity_id", { length: 255 }).notNull(),

  // Data
  snapshotData: jsonb("snapshot_data").notNull(),
  previousSnapshotId: varchar("previous_snapshot_id", { length: 255 }),

  // Changes (diff from previous)
  changes: jsonb("changes"),
  changeType: varchar("change_type", { length: 50 }), // created, updated, deleted

  // Metadata
  companyId: varchar("company_id", { length: 255 }),
  capturedAt: timestamp("captured_at").defaultNow().notNull(),
  capturedBy: varchar("captured_by", { length: 255 }),
  triggerEvent: varchar("trigger_event", { length: 255 }),

  // Version tracking
  version: integer("version").notNull(),
}, (table) => ({
  entityTypeIdx: index("historical_snapshots_entity_type_idx").on(table.entityType),
  entityIdIdx: index("historical_snapshots_entity_id_idx").on(table.entityId),
  companyIdIdx: index("historical_snapshots_company_id_idx").on(table.companyId),
  capturedAtIdx: index("historical_snapshots_captured_at_idx").on(table.capturedAt),
  versionIdx: index("historical_snapshots_version_idx").on(table.version),
}));

/**
 * Audit Trail Table
 *
 * Comprehensive audit trail for all CRUD operations.
 */
export const auditTrail = pgTable("audit_trail", {
  id: varchar("id", { length: 255 }).primaryKey(),

  // Action details
  action: varchar("action", { length: 50 }).notNull(), // create, read, update, delete, archive, restore
  entityType: varchar("entity_type", { length: 255 }).notNull(),
  entityId: varchar("entity_id", { length: 255 }).notNull(),

  // Before/after data
  beforeData: jsonb("before_data"),
  afterData: jsonb("after_data"),
  changes: jsonb("changes"),

  // Context
  companyId: varchar("company_id", { length: 255 }),
  userId: varchar("user_id", { length: 255 }).notNull(),
  userRole: varchar("user_role", { length: 255 }),

  // Request information
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  requestPath: text("request_path"),
  requestMethod: varchar("request_method", { length: 10 }),

  // Timing
  performedAt: timestamp("performed_at").defaultNow().notNull(),
  duration: integer("duration"), // milliseconds

  // Result
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),

  // Tags
  tags: jsonb("tags").$type<string[]>(),
}, (table) => ({
  actionIdx: index("audit_trail_action_idx").on(table.action),
  entityTypeIdx: index("audit_trail_entity_type_idx").on(table.entityType),
  entityIdIdx: index("audit_trail_entity_id_idx").on(table.entityId),
  companyIdIdx: index("audit_trail_company_id_idx").on(table.companyId),
  userIdIdx: index("audit_trail_user_id_idx").on(table.userId),
  performedAtIdx: index("audit_trail_performed_at_idx").on(table.performedAt),
}));

/**
 * Data Retention Policies Table
 *
 * Defines how long different types of data should be retained.
 */
export const dataRetentionPolicies = pgTable("data_retention_policies", {
  id: varchar("id", { length: 255 }).primaryKey(),

  // Policy details
  entityType: varchar("entity_type", { length: 255 }).notNull(),
  policyName: varchar("policy_name", { length: 500 }).notNull(),
  description: text("description"),

  // Retention periods (in days)
  activeRetentionDays: integer("active_retention_days").notNull(),
  archiveRetentionDays: integer("archive_retention_days").notNull(),
  totalRetentionDays: integer("total_retention_days").notNull(),

  // Actions
  autoArchive: boolean("auto_archive").default(true).notNull(),
  autoDelete: boolean("auto_delete").default(false).notNull(),

  // Scope
  companyId: varchar("company_id", { length: 255 }),
  isGlobalPolicy: boolean("is_global_policy").default(false).notNull(),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
}, (table) => ({
  entityTypeIdx: index("data_retention_policies_entity_type_idx").on(table.entityType),
  companyIdIdx: index("data_retention_policies_company_id_idx").on(table.companyId),
}));

export type ArchivedRecord = typeof archivedRecords.$inferSelect;
export type InsertArchivedRecord = typeof archivedRecords.$inferInsert;

export type ReportArchive = typeof reportArchives.$inferSelect;
export type InsertReportArchive = typeof reportArchives.$inferInsert;

export type DataExportLog = typeof dataExportLogs.$inferSelect;
export type InsertDataExportLog = typeof dataExportLogs.$inferInsert;

export type HistoricalSnapshot = typeof historicalSnapshots.$inferSelect;
export type InsertHistoricalSnapshot = typeof historicalSnapshots.$inferInsert;

export type AuditTrailEntry = typeof auditTrail.$inferSelect;
export type InsertAuditTrailEntry = typeof auditTrail.$inferInsert;

export type DataRetentionPolicy = typeof dataRetentionPolicies.$inferSelect;
export type InsertDataRetentionPolicy = typeof dataRetentionPolicies.$inferInsert;
