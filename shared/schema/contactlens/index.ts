/**
 * Contact Lens Domain Schema
 *
 * Comprehensive contact lens management system including:
 * - Initial assessments and patient suitability evaluation
 * - Trial lens fittings with detailed parameters
 * - Prescription management (OD/OS)
 * - Aftercare appointments and compliance monitoring
 * - Inventory management and stock control
 * - Patient orders and NHS voucher integration
 */

import { pgTable, text, varchar, timestamp, jsonb, index, pgEnum, integer, boolean, date, decimal, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import crypto from "crypto";

// External dependencies
import { companies } from "../core/tables";
import { users } from "../core/tables";
import { patients } from "../patients";
import { nhsPatientExemptions } from "../nhs";

// ============================================
// CONTACT LENS ENUMS
// ============================================

export const clWearingScheduleEnum = pgEnum("cl_wearing_schedule", [
  "daily_wear",
  "extended_wear",
  "continuous_wear",
  "occasional_wear"
]);

export const clReplacementScheduleEnum = pgEnum("cl_replacement_schedule", [
  "daily_disposable",
  "two_weekly",
  "monthly",
  "quarterly",
  "yearly"
]);

export const clLensTypeEnum = pgEnum("cl_lens_type", [
  "soft",
  "rigid_gas_permeable",
  "hybrid",
  "scleral",
  "orthokeratology"
]);

export const clDesignEnum = pgEnum("cl_design", [
  "spherical",
  "toric",
  "multifocal",
  "monovision",
  "custom"
]);

export const clFitAssessmentEnum = pgEnum("cl_fit_assessment", [
  "optimal",
  "acceptable",
  "too_tight",
  "too_loose",
  "decentered"
]);

export const clAftercareStatusEnum = pgEnum("cl_aftercare_status", [
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
  "rescheduled"
]);

// ============================================
// CONTACT LENS TABLES
// ============================================

/**
 * Contact Lens Assessments
 * Initial patient evaluation for contact lens suitability
 */
export const contactLensAssessments = pgTable("contact_lens_assessments", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id", { length: 255 }).notNull().references(() => patients.id),
  practitionerId: varchar("practitioner_id", { length: 255 }).references(() => users.id),

  // Assessment Details
  assessmentDate: date("assessment_date").notNull(),

  // Patient History
  previousClWearer: boolean("previous_cl_wearer").notNull().default(false),
  previousClType: varchar("previous_cl_type", { length: 100 }),
  reasonForDiscontinuation: text("reason_for_discontinuation"),

  // Motivation & Lifestyle
  motivationReason: text("motivation_reason"), // Sports, cosmetic, occupational, etc.
  occupation: varchar("occupation", { length: 255 }),
  hobbies: text("hobbies"),
  screenTime: varchar("screen_time", { length: 50 }), // Low, moderate, high

  // Medical Suitability
  dryEyes: boolean("dry_eyes").default(false),
  allergies: text("allergies"),
  medications: text("medications"),
  contraindications: text("contraindications"),

  // Ocular Assessment
  tearQuality: varchar("tear_quality", { length: 50 }), // Good, fair, poor
  tearBreakupTime: decimal("tear_breakup_time", { precision: 4, scale: 1 }), // seconds
  corneaCondition: text("cornea_condition"),
  conjunctivaCondition: text("conjunctiva_condition"),
  lidsCondition: text("lids_condition"),

  // Recommendation
  suitable: boolean("suitable").notNull(),
  recommendedLensType: clLensTypeEnum("recommended_lens_type"),
  recommendedWearingSchedule: clWearingScheduleEnum("recommended_wearing_schedule"),
  notes: text("notes"),

  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("cl_assessments_company_idx").on(table.companyId),
  index("cl_assessments_patient_idx").on(table.patientId),
  index("cl_assessments_date_idx").on(table.assessmentDate),
]);

/**
 * Contact Lens Fittings
 * Trial lens fitting records
 */
export const contactLensFittings = pgTable("contact_lens_fittings", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id", { length: 255 }).notNull().references(() => patients.id),
  assessmentId: varchar("assessment_id", { length: 255 }).references(() => contactLensAssessments.id),
  practitionerId: varchar("practitioner_id", { length: 255 }).references(() => users.id),

  // Fitting Details
  fittingDate: date("fitting_date").notNull(),
  eye: varchar("eye", { length: 2 }).notNull(), // OD or OS

  // Trial Lens Details
  trialLensBrand: varchar("trial_lens_brand", { length: 255 }).notNull(),
  trialLensType: clLensTypeEnum("trial_lens_type").notNull(),
  trialBaseCurve: decimal("trial_base_curve", { precision: 4, scale: 2 }), // mm
  trialDiameter: decimal("trial_diameter", { precision: 4, scale: 1 }), // mm
  trialPower: decimal("trial_power", { precision: 5, scale: 2 }), // D
  trialCylinder: decimal("trial_cylinder", { precision: 5, scale: 2 }), // D (for toric)
  trialAxis: integer("trial_axis"), // degrees (for toric)
  trialAddition: decimal("trial_addition", { precision: 3, scale: 2 }), // D (for multifocal)

  // Over-Refraction
  overRefractionSphere: decimal("over_refraction_sphere", { precision: 5, scale: 2 }),
  overRefractionCylinder: decimal("over_refraction_cylinder", { precision: 5, scale: 2 }),
  overRefractionAxis: integer("over_refraction_axis"),

  // Fit Assessment
  centration: varchar("centration", { length: 50 }), // Central, superior, inferior, temporal, nasal
  movement: varchar("movement", { length: 50 }), // Optimal, excessive, insufficient
  coverage: varchar("coverage", { length: 50 }), // Full, partial
  comfort: varchar("comfort", { length: 50 }), // Excellent, good, fair, poor
  fitAssessment: clFitAssessmentEnum("fit_assessment").notNull(),

  // Vision Assessment
  distanceVision: varchar("distance_vision", { length: 10 }), // e.g., "6/6", "20/20"
  nearVision: varchar("near_vision", { length: 10 }),

  // Final Lens Parameters (if different from trial)
  finalBaseCurve: decimal("final_base_curve", { precision: 4, scale: 2 }),
  finalDiameter: decimal("final_diameter", { precision: 4, scale: 1 }),
  finalPower: decimal("final_power", { precision: 5, scale: 2 }),
  finalCylinder: decimal("final_cylinder", { precision: 5, scale: 2 }),
  finalAxis: integer("final_axis"),
  finalAddition: decimal("final_addition", { precision: 3, scale: 2 }),

  // Teaching & Handling
  insertionTaught: boolean("insertion_taught").default(false),
  removalTaught: boolean("removal_taught").default(false),
  careTaught: boolean("care_taught").default(false),
  patientDemonstrated: boolean("patient_demonstrated").default(false),

  notes: text("notes"),

  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("cl_fittings_company_idx").on(table.companyId),
  index("cl_fittings_patient_idx").on(table.patientId),
  index("cl_fittings_date_idx").on(table.fittingDate),
]);

/**
 * Contact Lens Prescriptions
 * Final CL prescription records
 */
export const contactLensPrescriptions = pgTable("contact_lens_prescriptions", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id", { length: 255 }).notNull().references(() => patients.id),
  fittingId: varchar("fitting_id", { length: 255 }).references(() => contactLensFittings.id),
  practitionerId: varchar("practitioner_id", { length: 255 }).references(() => users.id),

  // Prescription Details
  prescriptionDate: date("prescription_date").notNull(),
  expiryDate: date("expiry_date"), // Usually 12 months from issue date

  // Right Eye (OD)
  odBrand: varchar("od_brand", { length: 255 }).notNull(),
  odLensType: clLensTypeEnum("od_lens_type").notNull(),
  odDesign: clDesignEnum("od_design").notNull(),
  odBaseCurve: decimal("od_base_curve", { precision: 4, scale: 2 }).notNull(),
  odDiameter: decimal("od_diameter", { precision: 4, scale: 1 }).notNull(),
  odPower: decimal("od_power", { precision: 5, scale: 2 }).notNull(),
  odCylinder: decimal("od_cylinder", { precision: 5, scale: 2 }),
  odAxis: integer("od_axis"),
  odAddition: decimal("od_addition", { precision: 3, scale: 2 }),
  odColor: varchar("od_color", { length: 100 }), // For cosmetic lenses

  // Left Eye (OS)
  osBrand: varchar("os_brand", { length: 255 }).notNull(),
  osLensType: clLensTypeEnum("os_lens_type").notNull(),
  osDesign: clDesignEnum("os_design").notNull(),
  osBaseCurve: decimal("os_base_curve", { precision: 4, scale: 2 }).notNull(),
  osDiameter: decimal("os_diameter", { precision: 4, scale: 1 }).notNull(),
  osPower: decimal("os_power", { precision: 5, scale: 2 }).notNull(),
  osCylinder: decimal("os_cylinder", { precision: 5, scale: 2 }),
  osAxis: integer("os_axis"),
  osAddition: decimal("os_addition", { precision: 3, scale: 2 }),
  osColor: varchar("os_color", { length: 100 }),

  // Wearing Instructions
  wearingSchedule: clWearingScheduleEnum("wearing_schedule").notNull(),
  replacementSchedule: clReplacementScheduleEnum("replacement_schedule").notNull(),
  maxWearingTime: integer("max_wearing_time"), // hours per day

  // Care System Recommendation
  careSystemBrand: varchar("care_system_brand", { length: 255 }),
  careSystemType: varchar("care_system_type", { length: 100 }), // Multipurpose, peroxide, etc.

  // Follow-up Schedule
  firstFollowUpDate: date("first_follow_up_date"), // Usually 1 day
  weekFollowUpDate: date("week_follow_up_date"), // Usually 1 week
  monthFollowUpDate: date("month_follow_up_date"), // Usually 1 month

  // Special Instructions
  specialInstructions: text("special_instructions"),
  notes: text("notes"),

  // NHS Funding (if applicable)
  nhsFunded: boolean("nhs_funded").default(false),
  nhsExemptionId: varchar("nhs_exemption_id", { length: 255 }).references(() => nhsPatientExemptions.id),

  // Status
  isActive: boolean("is_active").notNull().default(true),

  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("cl_prescriptions_company_idx").on(table.companyId),
  index("cl_prescriptions_patient_idx").on(table.patientId),
  index("cl_prescriptions_date_idx").on(table.prescriptionDate),
  index("cl_prescriptions_active_idx").on(table.isActive),
]);

/**
 * Contact Lens Aftercare
 * Follow-up appointments and monitoring
 */
export const contactLensAftercare = pgTable("contact_lens_aftercare", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id", { length: 255 }).notNull().references(() => patients.id),
  prescriptionId: varchar("prescription_id", { length: 255 }).references(() => contactLensPrescriptions.id),
  practitionerId: varchar("practitioner_id", { length: 255 }).references(() => users.id),

  // Appointment Details
  appointmentDate: date("appointment_date").notNull(),
  appointmentType: varchar("appointment_type", { length: 50 }).notNull(), // Initial, routine, problem
  status: clAftercareStatusEnum("status").notNull().default("scheduled"),

  // Compliance Check
  wearingTimeCompliance: varchar("wearing_time_compliance", { length: 50 }), // Good, fair, poor
  replacementCompliance: varchar("replacement_compliance", { length: 50 }),
  careSystemCompliance: varchar("care_system_compliance", { length: 50 }),
  sleepingInLenses: boolean("sleeping_in_lenses"),
  waterExposure: boolean("water_exposure"),

  // Clinical Assessment
  visualAcuityOD: varchar("visual_acuity_od", { length: 10 }),
  visualAcuityOS: varchar("visual_acuity_os", { length: 10 }),
  comfort: varchar("comfort", { length: 50 }),
  lensConditionOD: varchar("lens_condition_od", { length: 100 }),
  lensConditionOS: varchar("lens_condition_os", { length: 100 }),
  fitAssessmentOD: clFitAssessmentEnum("fit_assessment_od"),
  fitAssessmentOS: clFitAssessmentEnum("fit_assessment_os"),

  // Ocular Health
  corneaHealthOD: varchar("cornea_health_od", { length: 100 }),
  corneaHealthOS: varchar("cornea_health_os", { length: 100 }),
  conjunctivaHealthOD: varchar("conjunctiva_health_od", { length: 100 }),
  conjunctivaHealthOS: varchar("conjunctiva_health_os", { length: 100 }),

  // Problems Reported
  problemsReported: text("problems_reported"),
  adverseEvents: text("adverse_events"),

  // Actions Taken
  prescriptionChanged: boolean("prescription_changed").default(false),
  lensesReplaced: boolean("lenses_replaced").default(false),
  careSystemChanged: boolean("care_system_changed").default(false),
  additionalTraining: boolean("additional_training").default(false),
  referralMade: boolean("referral_made").default(false),

  // Next Appointment
  nextAppointmentDate: date("next_appointment_date"),
  nextAppointmentReason: text("next_appointment_reason"),

  notes: text("notes"),

  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("cl_aftercare_company_idx").on(table.companyId),
  index("cl_aftercare_patient_idx").on(table.patientId),
  index("cl_aftercare_date_idx").on(table.appointmentDate),
  index("cl_aftercare_status_idx").on(table.status),
]);

/**
 * Contact Lens Inventory
 * Stock management for contact lenses
 */
export const contactLensInventory = pgTable("contact_lens_inventory", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),

  // Product Details
  brand: varchar("brand", { length: 255 }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  lensType: clLensTypeEnum("lens_type").notNull(),
  design: clDesignEnum("design").notNull(),
  replacementSchedule: clReplacementScheduleEnum("replacement_schedule").notNull(),

  // Parameters
  baseCurve: decimal("base_curve", { precision: 4, scale: 2 }).notNull(),
  diameter: decimal("diameter", { precision: 4, scale: 1 }).notNull(),
  power: decimal("power", { precision: 5, scale: 2 }).notNull(),
  cylinder: decimal("cylinder", { precision: 5, scale: 2 }),
  axis: integer("axis"),
  addition: decimal("addition", { precision: 3, scale: 2 }),

  // Stock Management
  quantityInStock: integer("quantity_in_stock").notNull().default(0),
  reorderLevel: integer("reorder_level").notNull().default(5),
  reorderQuantity: integer("reorder_quantity").notNull().default(10),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  retailPrice: decimal("retail_price", { precision: 10, scale: 2 }),

  // Supplier Information
  supplierId: varchar("supplier_id", { length: 255 }),
  supplierProductCode: varchar("supplier_product_code", { length: 100 }),

  // Product Information
  expiryDate: date("expiry_date"),
  batchNumber: varchar("batch_number", { length: 100 }),

  // Status
  isActive: boolean("is_active").notNull().default(true),
  isTrialLens: boolean("is_trial_lens").default(false),

  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("cl_inventory_company_idx").on(table.companyId),
  index("cl_inventory_brand_idx").on(table.brand),
  index("cl_inventory_stock_idx").on(table.quantityInStock),
  index("cl_inventory_active_idx").on(table.isActive),
  uniqueIndex("cl_inventory_unique").on(
    table.companyId,
    table.brand,
    table.baseCurve,
    table.diameter,
    table.power,
    table.cylinder,
    table.axis,
    table.addition
  ),
]);

/**
 * Contact Lens Orders
 * Patient orders for contact lenses
 */
export const contactLensOrders = pgTable("contact_lens_orders", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id", { length: 255 }).notNull().references(() => patients.id),
  prescriptionId: varchar("prescription_id", { length: 255 }).references(() => contactLensPrescriptions.id),

  // Order Details
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  orderDate: date("order_date").notNull(),

  // Right Eye Order
  odInventoryId: varchar("od_inventory_id", { length: 255 }).references(() => contactLensInventory.id),
  odQuantity: integer("od_quantity").notNull(),
  odUnitPrice: decimal("od_unit_price", { precision: 10, scale: 2 }).notNull(),

  // Left Eye Order
  osInventoryId: varchar("os_inventory_id", { length: 255 }).references(() => contactLensInventory.id),
  osQuantity: integer("os_quantity").notNull(),
  osUnitPrice: decimal("os_unit_price", { precision: 10, scale: 2 }).notNull(),

  // Care System (if ordered)
  careSystemInventoryId: varchar("care_system_inventory_id", { length: 255 }),
  careSystemQuantity: integer("care_system_quantity"),
  careSystemPrice: decimal("care_system_price", { precision: 10, scale: 2 }),

  // Pricing
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),

  // NHS Funding
  nhsFunded: boolean("nhs_funded").default(false),
  nhsVoucherId: varchar("nhs_voucher_id", { length: 255 }), // If applicable

  // Status
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, ordered, received, dispensed
  orderedDate: date("ordered_date"),
  receivedDate: date("received_date"),
  dispensedDate: date("dispensed_date"),

  notes: text("notes"),

  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("cl_orders_company_idx").on(table.companyId),
  index("cl_orders_patient_idx").on(table.patientId),
  index("cl_orders_date_idx").on(table.orderDate),
  index("cl_orders_status_idx").on(table.status),
]);

// ============================================
// ZOD SCHEMAS
// ============================================

// No specific insert schemas needed - use standard createInsertSchema

// ============================================
// TYPES
// ============================================

export type ContactLensAssessment = typeof contactLensAssessments.$inferSelect;
export type InsertContactLensAssessment = typeof contactLensAssessments.$inferInsert;
export type ContactLensFitting = typeof contactLensFittings.$inferSelect;
export type InsertContactLensFitting = typeof contactLensFittings.$inferInsert;
export type ContactLensPrescription = typeof contactLensPrescriptions.$inferSelect;
export type InsertContactLensPrescription = typeof contactLensPrescriptions.$inferInsert;
export type ContactLensAftercare = typeof contactLensAftercare.$inferSelect;
export type InsertContactLensAftercare = typeof contactLensAftercare.$inferInsert;
export type ContactLensInventoryItem = typeof contactLensInventory.$inferSelect;
export type InsertContactLensInventoryItem = typeof contactLensInventory.$inferInsert;
export type ContactLensOrder = typeof contactLensOrders.$inferSelect;
export type InsertContactLensOrder = typeof contactLensOrders.$inferInsert;
