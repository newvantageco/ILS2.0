/**
 * Laboratory Domain Schema
 *
 * Comprehensive laboratory testing and quality control system including:
 * - Lab Results Management: Patient laboratory test results with LOINC standardization
 * - Lab Orders: Laboratory test ordering and tracking workflow
 * - Lab Test Catalog: Master list of available laboratory tests with CPT/LOINC codes
 * - Lab Quality Control: QC testing and instrument calibration tracking
 *
 * This domain handles all aspects of laboratory operations for optometry practices,
 * including in-house testing, reference laboratory coordination, quality control
 * procedures, and test result management. It supports LOINC (Logical Observation
 * Identifiers Names and Codes) standardization for interoperability with other
 * healthcare systems and CPT coding for billing purposes.
 *
 * Key Features:
 * - LOINC Code Support: Standardized test identification for data exchange
 * - Quality Control: Comprehensive QC tracking with acceptable ranges and deviation monitoring
 * - Test Catalog: Centralized test definitions with specimen requirements and pricing
 * - Order Tracking: Complete workflow from order placement through result reporting
 * - Abnormal Flags: Standardized flagging (H/L/HH/LL) for out-of-range results
 * - Accession Numbers: Unique specimen tracking identifiers
 * - Multi-Laboratory Support: Track tests performed by different laboratories
 *
 * Laboratory Workflows:
 * 1. Test Ordering: Practitioner creates lab order with clinical indication
 * 2. Specimen Collection: Patient specimen collected with accession number
 * 3. Quality Control: Daily QC tests verify instrument accuracy
 * 4. Testing: Patient specimens analyzed using calibrated instruments
 * 5. Result Reporting: Results entered with reference ranges and interpretation
 * 6. Review: Practitioner reviews and acknowledges results
 *
 * Quality Control Requirements:
 * - Daily QC testing before patient samples
 * - Control levels (normal, high, low) for each test
 * - Acceptable range monitoring with automatic flagging
 * - Corrective action documentation for out-of-range results
 * - Lot number and expiration tracking for controls and reagents
 *
 * @module shared/schema/lab
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  numeric,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Import external dependencies
import { companies, users } from "../core/tables";

// ============================================
// LAB RESULTS
// ============================================

/**
 * Lab Results Table
 * Stores patient laboratory test results with LOINC standardization
 */
export const labResults = pgTable(
  "lab_results",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
    patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }),
    practitionerId: varchar("practitioner_id").references(() => users.id, { onDelete: 'set null' }),

    // Test details
    testName: varchar("test_name", { length: 255 }).notNull(),
    testCategory: varchar("test_category", { length: 100 }),
    loincCode: varchar("loinc_code", { length: 20 }), // LOINC code for standardization

    // Results
    resultValue: varchar("result_value", { length: 255 }),
    resultUnit: varchar("result_unit", { length: 50 }),
    referenceRange: text("reference_range"),
    abnormalFlag: varchar("abnormal_flag", { length: 10 }), // H, L, HH, LL, etc.
    interpretation: text("interpretation"),

    // Dates and status
    specimenDate: timestamp("specimen_date", { withTimezone: true }),
    resultDate: timestamp("result_date", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 50 }).default("final"),

    // Laboratory information
    performingLab: varchar("performing_lab", { length: 255 }),
    orderingProvider: varchar("ordering_provider", { length: 255 }),

    // Clinical notes
    clinicalNotes: text("clinical_notes"),

    // Metadata
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),

    // External identifiers
    accessionNumber: varchar("accession_number", { length: 100 }),
  },
  (table) => [
    index("idx_lab_results_company").on(table.companyId),
    index("idx_lab_results_patient").on(table.patientId),
    index("idx_lab_results_test").on(table.testName),
    index("idx_lab_results_date").on(table.resultDate),
    index("idx_lab_results_status").on(table.status),
  ],
);

// ============================================
// LAB ORDERS
// ============================================

/**
 * Lab Orders Table
 * Tracks laboratory test orders from placement through completion
 */
export const labOrders = pgTable(
  "lab_orders",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
    patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }),
    practitionerId: varchar("practitioner_id").references(() => users.id, { onDelete: 'set null' }),

    // Order details
    orderNumber: varchar("order_number", { length: 100 }).notNull(),
    orderType: varchar("order_type", { length: 50 }),
    priority: varchar("priority", { length: 20 }).default("routine"),

    // Dates
    orderedDate: timestamp("ordered_date", { withTimezone: true }).notNull().defaultNow(),
    scheduledDate: timestamp("scheduled_date", { withTimezone: true }),
    completedDate: timestamp("completed_date", { withTimezone: true }),

    // Status
    status: varchar("status", { length: 50 }).default("pending"),

    // Laboratory information
    performingLab: varchar("performing_lab", { length: 255 }),

    // Clinical information
    diagnosis: text("diagnosis"),
    clinicalNotes: text("clinical_notes"),
    specialInstructions: text("special_instructions"),

    // Metadata
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_lab_orders_company").on(table.companyId),
    index("idx_lab_orders_patient").on(table.patientId),
    index("idx_lab_orders_practitioner").on(table.practitionerId),
    index("idx_lab_orders_order_number").on(table.orderNumber),
    index("idx_lab_orders_status").on(table.status),
    index("idx_lab_orders_ordered_date").on(table.orderedDate),
  ],
);

// ============================================
// LAB TEST CATALOG
// ============================================

/**
 * Lab Test Catalog Table
 * Master list of available laboratory tests with standardization codes
 */
export const labTestCatalog = pgTable(
  "lab_test_catalog",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }), // null for system-wide tests

    // Test identification
    testCode: varchar("test_code", { length: 50 }).notNull(),
    testName: varchar("test_name", { length: 255 }).notNull(),
    category: varchar("category", { length: 100 }),
    description: text("description"),

    // Specimen and logistics
    specimenType: varchar("specimen_type", { length: 100 }),
    specimenVolume: varchar("specimen_volume", { length: 50 }),
    containerType: varchar("container_type", { length: 100 }),
    turnaroundTime: varchar("turnaround_time", { length: 100 }),

    // Standardization
    loincCode: varchar("loinc_code", { length: 20 }),
    cptCode: varchar("cpt_code", { length: 20 }),

    // Pricing and availability
    cost: numeric("cost", { precision: 10, scale: 2 }),
    isActive: boolean("is_active").default(true),
    requiresApproval: boolean("requires_approval").default(false),

    // Metadata
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_lab_test_catalog_company").on(table.companyId),
    index("idx_lab_test_catalog_code").on(table.testCode),
    index("idx_lab_test_catalog_category").on(table.category),
    index("idx_lab_test_catalog_active").on(table.isActive),
  ],
);

// ============================================
// LAB QUALITY CONTROL
// ============================================

/**
 * Lab Quality Control Table
 * Tracks QC testing for laboratory instruments and procedures
 */
export const labQualityControl = pgTable(
  "lab_quality_control",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
    technicianId: varchar("technician_id").references(() => users.id, { onDelete: 'set null' }),

    // Test identification
    testCode: varchar("test_code", { length: 50 }).notNull(),
    testName: varchar("test_name", { length: 255 }),

    // Control information
    controlLot: varchar("control_lot", { length: 100 }).notNull(),
    controlLevel: varchar("control_level", { length: 50 }),
    expirationDate: timestamp("expiration_date", { withTimezone: true }),

    // Results
    expectedValue: numeric("expected_value", { precision: 10, scale: 2 }).notNull(),
    actualValue: numeric("actual_value", { precision: 10, scale: 2 }).notNull(),
    unit: varchar("unit", { length: 50 }),
    acceptableRangeMin: numeric("acceptable_range_min", { precision: 10, scale: 2 }),
    acceptableRangeMax: numeric("acceptable_range_max", { precision: 10, scale: 2 }),
    isWithinRange: boolean("is_within_range").notNull(),
    deviation: numeric("deviation", { precision: 10, scale: 2 }),
    percentDeviation: numeric("percent_deviation", { precision: 10, scale: 2 }),

    // Equipment and reagents
    instrumentId: varchar("instrument_id", { length: 100 }),
    instrumentName: varchar("instrument_name", { length: 255 }),
    reagentLot: varchar("reagent_lot", { length: 100 }),

    // Test metadata
    testDate: timestamp("test_date", { withTimezone: true }).notNull(),
    performedBy: varchar("performed_by", { length: 255 }),
    reviewedBy: varchar("reviewed_by", { length: 255 }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),

    // Actions and notes
    actionTaken: text("action_taken"),
    notes: text("notes"),

    // Metadata
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_lab_qc_company").on(table.companyId),
    index("idx_lab_qc_test_code").on(table.testCode),
    index("idx_lab_qc_test_date").on(table.testDate),
    index("idx_lab_qc_instrument").on(table.instrumentId),
    index("idx_lab_qc_within_range").on(table.isWithinRange),
  ],
);

// ============================================
// ZOD SCHEMAS
// ============================================

export const insertLabResultSchema = createInsertSchema(labResults).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertLabOrderSchema = createInsertSchema(labOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertLabTestCatalogSchema = createInsertSchema(labTestCatalog).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertLabQualityControlSchema = createInsertSchema(labQualityControl).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// ============================================
// TYPESCRIPT TYPES
// ============================================

// Lab Results
export type LabResult = typeof labResults.$inferSelect;
export type InsertLabResult = typeof labResults.$inferInsert;

// Lab Orders
export type LabOrder = typeof labOrders.$inferSelect;
export type InsertLabOrder = typeof labOrders.$inferInsert;

// Lab Test Catalog
export type LabTestCatalog = typeof labTestCatalog.$inferSelect;
export type InsertLabTestCatalog = typeof labTestCatalog.$inferInsert;

// Lab Quality Control
export type LabQualityControl = typeof labQualityControl.$inferSelect;
export type InsertLabQualityControl = typeof labQualityControl.$inferInsert;
