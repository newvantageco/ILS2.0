/**
 * Data Migration Schema Extensions
 *
 * Comprehensive migration tracking and company-scoped data import
 * Supports unlimited file sizes for bulk practice migrations
 */

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, pgEnum, integer, boolean, decimal } from "drizzle-orm/pg-core";
import { companies, users, patients, eyeExaminations, prescriptions, orders, dispenseRecords } from "./schema";

// ========== MIGRATION ENUMS ==========

/**
 * Migration job status
 */
export const migrationStatusEnum = pgEnum("migration_status", [
  "pending",
  "validating",
  "processing",
  "completed",
  "failed",
  "cancelled",
  "paused"
]);

/**
 * Migration source platforms
 */
export const migrationSourceEnum = pgEnum("migration_source", [
  "optix",
  "occuco",
  "acuity",
  "optomate",
  "eyecare_pro",
  "vision_web",
  "manual_csv",
  "manual_excel",
  "api_import",
  "other"
]);

/**
 * Data type being migrated
 */
export const migrationDataTypeEnum = pgEnum("migration_data_type", [
  "patients",
  "examinations",
  "prescriptions",
  "dispenses",
  "orders",
  "appointments",
  "clinical_notes",
  "invoices",
  "payments",
  "all"
]);

// ========== MIGRATION TRACKING TABLES ==========

/**
 * Migration Jobs - tracks company-wide data migrations
 * Each practice gets their own migration job scoped to their companyId
 */
export const migrationJobs = pgTable("migration_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Multi-tenant isolation
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),

  // Job metadata
  jobNumber: varchar("job_number", { length: 50 }).notNull().unique(), // e.g., "MIG-001-2025"
  jobName: varchar("job_name", { length: 255 }).notNull(),
  description: text("description"),

  // Source information
  sourceSystem: migrationSourceEnum("source_system").notNull(),
  sourceVersion: varchar("source_version", { length: 100 }),
  dataTypes: jsonb("data_types").notNull(), // Array of data types to migrate

  // Status tracking
  status: migrationStatusEnum("status").notNull().default("pending"),
  progress: jsonb("progress").notNull().default(sql`'{"total":0,"processed":0,"successful":0,"failed":0,"skipped":0}'::jsonb`),

  // File information
  uploadedFiles: jsonb("uploaded_files"), // Array of {filename, size, path, type}
  totalFileSize: decimal("total_file_size", { precision: 15, scale: 0 }), // Bytes - no limit

  // Field mappings and configuration
  fieldMappings: jsonb("field_mappings"), // Source → ILS 2.0 field mappings
  transformations: jsonb("transformations"), // Custom transformation rules
  validationRules: jsonb("validation_rules"),
  importOptions: jsonb("import_options"), // skipDuplicates, updateExisting, etc.

  // Validation results
  validationResults: jsonb("validation_results"),
  validationErrors: jsonb("validation_errors").default(sql`'[]'::jsonb`),
  validationWarnings: jsonb("validation_warnings").default(sql`'[]'::jsonb`),

  // Error tracking
  errors: jsonb("errors").default(sql`'[]'::jsonb`),
  criticalErrors: integer("critical_errors").default(0),

  // Timing
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  estimatedDuration: integer("estimated_duration"), // Seconds

  // Legal & compliance
  baaSignedAt: timestamp("baa_signed_at"),
  baaSignedBy: varchar("baa_signed_by", { length: 255 }),
  dataExportRequestedAt: timestamp("data_export_requested_at"),
  dataReceivedAt: timestamp("data_received_at"),

  // User tracking
  createdBy: varchar("created_by").notNull().references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),

  // Audit trail
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Rollback support
  canRollback: boolean("can_rollback").default(true),
  rolledBackAt: timestamp("rolled_back_at"),
  rolledBackBy: varchar("rolled_back_by").references(() => users.id),

  // Metadata
  metadata: jsonb("metadata"), // Additional flexible data
}, (table) => [
  index("idx_migration_jobs_company").on(table.companyId),
  index("idx_migration_jobs_status").on(table.status),
  index("idx_migration_jobs_created_by").on(table.createdBy),
]);

/**
 * Migration Records - tracks each individual record imported
 * Enables rollback and auditing
 */
export const migrationRecords = pgTable("migration_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Links to migration job
  migrationJobId: varchar("migration_job_id").notNull().references(() => migrationJobs.id, { onDelete: 'cascade' }),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),

  // Record type and identifiers
  dataType: migrationDataTypeEnum("data_type").notNull(),
  externalId: varchar("external_id", { length: 255 }), // ID from source system
  internalId: varchar("internal_id", { length: 255 }), // ILS 2.0 ID (UUID)

  // Source data
  sourceData: jsonb("source_data"), // Original data from legacy system
  transformedData: jsonb("transformed_data"), // After transformation

  // Status
  status: varchar("status", { length: 50 }).notNull(), // success, failed, skipped, duplicate
  errorMessage: text("error_message"),
  warnings: jsonb("warnings"),

  // Mapping info
  tableName: varchar("table_name", { length: 100 }), // patients, eye_examinations, etc.

  // Row tracking
  sourceRow: integer("source_row"), // Row number in CSV/Excel
  batchNumber: integer("batch_number"), // Batch number (for large imports)

  // Timestamps
  importedAt: timestamp("imported_at").defaultNow().notNull(),

  // Metadata
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_migration_records_job").on(table.migrationJobId),
  index("idx_migration_records_company").on(table.companyId),
  index("idx_migration_records_type").on(table.dataType),
  index("idx_migration_records_external_id").on(table.externalId),
  index("idx_migration_records_internal_id").on(table.internalId),
]);

/**
 * Migration Presets - pre-configured field mappings for common platforms
 * Makes migration from Optix, Occuco, Acuity easier
 */
export const migrationPresets = pgTable("migration_presets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Preset identification
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sourceSystem: migrationSourceEnum("source_system").notNull(),
  version: varchar("version", { length: 100 }),

  // Configuration
  dataType: migrationDataTypeEnum("data_type").notNull(),
  fieldMappings: jsonb("field_mappings").notNull(), // Pre-configured mappings
  transformations: jsonb("transformations"), // Pre-configured transformations
  validationRules: jsonb("validation_rules"),
  defaultOptions: jsonb("default_options"),

  // Usage tracking
  usageCount: integer("usage_count").default(0),

  // Status
  active: boolean("active").default(true),
  isPlatformDefault: boolean("is_platform_default").default(false), // Platform-provided vs custom

  // Ownership (null = platform default, otherwise company-specific)
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
  createdBy: varchar("created_by").references(() => users.id),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Metadata
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_migration_presets_source").on(table.sourceSystem),
  index("idx_migration_presets_type").on(table.dataType),
  index("idx_migration_presets_company").on(table.companyId),
]);

/**
 * Add import tracking fields to existing tables
 * These fields help track which records came from migrations
 */

// Note: These should be added via migration to existing tables:
// - patients: externalId, importSource, importJobId, importedAt
// - eyeExaminations: externalId, importSource, importJobId, importedAt
// - prescriptions: externalId, importSource, importJobId, importedAt
// - dispenseRecords: externalId, importSource, importJobId, importedAt
// - orders: externalId, importSource, importJobId, importedAt

/**
 * Migration Log - detailed audit trail
 */
export const migrationLogs = pgTable("migration_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  migrationJobId: varchar("migration_job_id").notNull().references(() => migrationJobs.id, { onDelete: 'cascade' }),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),

  // Log details
  level: varchar("level", { length: 20 }).notNull(), // info, warning, error, critical
  message: text("message").notNull(),
  details: jsonb("details"),

  // Context
  phase: varchar("phase", { length: 50 }), // validation, transformation, import
  recordId: varchar("record_id"), // Link to specific migration_records.id

  // Timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_migration_logs_job").on(table.migrationJobId),
  index("idx_migration_logs_company").on(table.companyId),
  index("idx_migration_logs_level").on(table.level),
]);

/**
 * Data Export Requests - track data requests from old vendors
 */
export const dataExportRequests = pgTable("data_export_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  migrationJobId: varchar("migration_job_id").references(() => migrationJobs.id, { onDelete: 'set null' }),

  // Vendor information
  vendorName: varchar("vendor_name", { length: 255 }).notNull(), // Optix, Occuco, etc.
  vendorContactEmail: varchar("vendor_contact_email", { length: 255 }),
  vendorContactPhone: varchar("vendor_contact_phone", { length: 50 }),

  // Request details
  requestDate: timestamp("request_date").defaultNow().notNull(),
  requestMethod: varchar("request_method", { length: 50 }), // email, phone, portal
  requestReference: varchar("request_reference", { length: 100 }),

  // Status tracking
  status: varchar("status", { length: 50 }).notNull().default("requested"), // requested, acknowledged, processing, completed, failed
  responseDate: timestamp("response_date"),
  dataReceivedDate: timestamp("data_received_date"),

  // Data details
  dataFormat: varchar("data_format", { length: 50 }), // csv, excel, api, database_dump
  dataTypes: jsonb("data_types"), // What data was requested
  estimatedRecords: integer("estimated_records"),

  // Files
  files: jsonb("files"), // Array of received files

  // Notes
  notes: text("notes"),
  vendorNotes: text("vendor_notes"),

  // User tracking
  requestedBy: varchar("requested_by").notNull().references(() => users.id),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_data_export_requests_company").on(table.companyId),
  index("idx_data_export_requests_status").on(table.status),
]);

/**
 * Business Associate Agreements - HIPAA compliance tracking
 */
export const businessAssociateAgreements = pgTable("business_associate_agreements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  migrationJobId: varchar("migration_job_id").references(() => migrationJobs.id, { onDelete: 'set null' }),

  // Agreement details
  agreementNumber: varchar("agreement_number", { length: 50 }).notNull().unique(),
  templateVersion: varchar("template_version", { length: 50 }).notNull(),

  // Parties
  coveredEntity: varchar("covered_entity", { length: 255 }).notNull(), // Practice name
  businessAssociate: varchar("business_associate", { length: 255 }).notNull().default("ILS 2.0"),

  // Signature details
  signedByName: varchar("signed_by_name", { length: 255 }).notNull(),
  signedByTitle: varchar("signed_by_title", { length: 255 }),
  signedByEmail: varchar("signed_by_email", { length: 255 }).notNull(),
  signatureDate: timestamp("signature_date").notNull(),
  signatureMethod: varchar("signature_method", { length: 50 }), // electronic, wet_signature
  signatureIpAddress: varchar("signature_ip_address", { length: 50 }),

  // Document
  documentUrl: text("document_url"), // Signed PDF
  documentHash: varchar("document_hash", { length: 128 }), // SHA-256 for verification

  // Status
  status: varchar("status", { length: 50 }).notNull().default("active"), // active, expired, terminated
  effectiveDate: timestamp("effective_date").notNull(),
  expirationDate: timestamp("expiration_date"),
  terminationDate: timestamp("termination_date"),
  terminationReason: text("termination_reason"),

  // Compliance
  hipaaCompliant: boolean("hipaa_compliant").default(true).notNull(),
  gdprCompliant: boolean("gdpr_compliant").default(false),

  // User tracking
  createdBy: varchar("created_by").notNull().references(() => users.id),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Metadata
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_baa_company").on(table.companyId),
  index("idx_baa_status").on(table.status),
]);

// Export types
export type MigrationJob = typeof migrationJobs.$inferSelect;
export type NewMigrationJob = typeof migrationJobs.$inferInsert;
export type MigrationRecord = typeof migrationRecords.$inferSelect;
export type MigrationPreset = typeof migrationPresets.$inferSelect;
export type MigrationLog = typeof migrationLogs.$inferSelect;
export type DataExportRequest = typeof dataExportRequests.$inferSelect;
export type BusinessAssociateAgreement = typeof businessAssociateAgreements.$inferSelect;
