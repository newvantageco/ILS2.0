/**
 * Electronic Health Records (EHR) Domain Schema
 *
 * Comprehensive clinical documentation and health records management system including:
 * - Medications: Prescription management with NDC codes and dosage tracking
 * - Allergies: Patient allergy tracking with severity levels and reactions
 * - Clinical Notes: SOAP notes (Subjective, Objective, Assessment, Plan) and documentation
 * - Vital Signs: Patient vital sign measurements with reference ranges
 * - Immunizations: Vaccine administration tracking with CVX codes
 *
 * This domain handles all aspects of electronic health record management for optometry
 * practices, including clinical documentation, medication prescribing, allergy tracking,
 * vital sign monitoring, and immunization records. It supports standardized coding systems
 * like NDC (National Drug Code), CVX (CDC Vaccine Code), and LOINC for interoperability
 * with other healthcare systems.
 *
 * Key Features:
 * - SOAP Note Structure: Standardized clinical documentation format
 * - Medication Tracking: Complete prescription lifecycle from prescribing to discontinuation
 * - Allergy Management: Comprehensive allergen tracking with severity classification
 * - Vital Sign Monitoring: Regular measurement tracking with interpretation flags
 * - Immunization Schedules: Vaccine administration with next due date tracking
 * - Digital Signatures: Electronic signature support for clinical notes
 * - Audit Trail: Complete tracking of who created, updated, and signed documents
 *
 * Clinical Documentation Workflows:
 * 1. Patient Encounter: Practitioner creates clinical note during patient visit
 * 2. SOAP Documentation: Records subjective complaints, objective findings, assessment, and plan
 * 3. Vital Signs: Measures and records patient vital signs (BP, HR, temp, IOP, visual acuity)
 * 4. Medication Management: Prescribes new medications or updates existing prescriptions
 * 5. Allergy Review: Reviews and updates patient allergy list
 * 6. Immunization Tracking: Records vaccine administration and schedules next doses
 * 7. Note Signing: Practitioner reviews and digitally signs clinical documentation
 *
 * SOAP Notes Structure:
 * - Subjective: Patient's description of symptoms, complaints, and concerns
 * - Objective: Practitioner's observations, measurements, and test results
 * - Assessment: Clinical diagnosis or impression based on subjective and objective findings
 * - Plan: Treatment plan, prescriptions, follow-up instructions, and referrals
 *
 * Vital Sign Reference Ranges:
 * - Blood Pressure: Normal <120/80 mmHg, Elevated 120-129/<80, High ≥130/80
 * - Heart Rate: Normal 60-100 bpm, Tachycardia >100, Bradycardia <60
 * - Temperature: Normal 97.8-99.1°F (36.5-37.3°C), Fever >100.4°F (38°C)
 * - Oxygen Saturation: Normal ≥95%, Hypoxia <90%
 * - Intraocular Pressure: Normal 10-21 mmHg, Elevated >21 mmHg
 * - Visual Acuity: Measured using Snellen chart (20/20, 20/40, etc.)
 *
 * Immunization Schedules:
 * - Annual: Influenza vaccine
 * - Every 10 years: Tetanus-Diphtheria-Pertussis (Tdap) booster
 * - One-time or Series: Hepatitis B, Pneumococcal, Shingles (Zoster)
 * - Travel-specific: Yellow fever, Typhoid, Japanese encephalitis
 *
 * @module shared/schema/ehr
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  numeric,
  boolean,
  jsonb,
  index,
  pgEnum,
  integer,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Import external dependencies
import { companies, users } from "../core/tables";
import { appointments } from "../appointments";

// ============================================
// EHR ENUMS
// ============================================

export const medicationStatusEnum = pgEnum("medication_status", [
  "active",
  "discontinued",
  "completed",
  "on_hold"
]);

export const allergySeverityEnum = pgEnum("allergy_severity", [
  "mild",
  "moderate",
  "severe",
  "life_threatening"
]);

export const clinicalNoteTypeEnum = pgEnum("clinical_note_type", [
  "consultation",
  "examination",
  "follow_up",
  "discharge_summary",
  "referral",
  "progress_note",
  "initial_evaluation",
  "treatment_plan"
]);

export const vitalSignTypeEnum = pgEnum("vital_sign_type", [
  "blood_pressure",
  "heart_rate",
  "respiratory_rate",
  "temperature",
  "oxygen_saturation",
  "height",
  "weight",
  "bmi",
  "visual_acuity",
  "intraocular_pressure"
]);

export const immunizationStatusEnum = pgEnum("immunization_status", [
  "administered",
  "refused",
  "contraindicated",
  "scheduled",
  "unknown"
]);

// ============================================
// MEDICATIONS
// ============================================

/**
 * Medications Table
 * Manages patient prescriptions and medication history
 */
export const medications = pgTable(
  "medications",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
    patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }),
    practitionerId: varchar("practitioner_id").references(() => users.id, { onDelete: 'set null' }),

    // Medication details
    medicationName: varchar("medication_name", { length: 255 }).notNull(),
    genericName: varchar("generic_name", { length: 255 }),
    ndcCode: varchar("ndc_code", { length: 20 }), // National Drug Code
    dosage: varchar("dosage", { length: 100 }).notNull(),
    route: varchar("route", { length: 50 }).notNull(), // oral, topical, etc.
    frequency: varchar("frequency", { length: 100 }).notNull(),
    instructions: text("instructions"),

    // Prescription details
    prescribedDate: timestamp("prescribed_date", { withTimezone: true }).notNull(),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    status: medicationStatusEnum("status").notNull().default("active"),

    // Prescribing information
    reason: text("reason"),
    quantity: integer("quantity"),
    refills: integer("refills").default(0),
    pharmacy: varchar("pharmacy", { length: 255 }),

    // Metadata
    prescribedBy: varchar("prescribed_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),

    // External identifiers
    externalPrescriptionId: varchar("external_prescription_id", { length: 100 }),
  },
  (table) => [
    index("idx_medications_company").on(table.companyId),
    index("idx_medications_patient").on(table.patientId),
    index("idx_medications_practitioner").on(table.practitionerId),
    index("idx_medications_status").on(table.status),
    index("idx_medications_name").on(table.medicationName),
    index("idx_medications_prescribed_date").on(table.prescribedDate),
  ],
);

// ============================================
// ALLERGIES
// ============================================

/**
 * Allergies Table
 * Tracks patient allergies and adverse reactions
 */
export const allergies = pgTable(
  "allergies",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
    patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }),
    practitionerId: varchar("practitioner_id").references(() => users.id, { onDelete: 'set null' }),

    // Allergy details
    allergen: varchar("allergen", { length: 255 }).notNull(),
    allergenType: varchar("allergen_type", { length: 50 }).notNull(), // medication, food, environmental
    severity: allergySeverityEnum("severity").notNull(),
    reaction: text("reaction").notNull(),

    // Status and dates
    status: varchar("status", { length: 50 }).default("active"),
    onsetDate: date("onset_date"),
    reportedDate: timestamp("reported_date", { withTimezone: true }).defaultNow(),

    // Clinical notes
    notes: text("notes"),

    // Metadata
    reportedBy: varchar("reported_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_allergies_company").on(table.companyId),
    index("idx_allergies_patient").on(table.patientId),
    index("idx_allergies_severity").on(table.severity),
    index("idx_allergies_status").on(table.status),
    index("idx_allergies_allergen").on(table.allergen),
  ],
);

// ============================================
// CLINICAL NOTES
// ============================================

/**
 * Clinical Notes Table
 * SOAP notes and clinical documentation
 */
export const clinicalNotes = pgTable(
  "clinical_notes",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
    patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }),
    practitionerId: varchar("practitioner_id").references(() => users.id, { onDelete: 'set null' }),

    // Note details
    noteType: clinicalNoteTypeEnum("note_type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),

    // SOAP structure (Subjective, Objective, Assessment, Plan)
    subjective: text("subjective"),
    objective: text("objective"),
    assessment: text("assessment"),
    plan: text("plan"),

    // Date and time
    noteDate: timestamp("note_date", { withTimezone: true }).notNull(),
    serviceDate: timestamp("service_date", { withTimezone: true }),

    // Status and workflow
    status: varchar("status", { length: 50 }).default("draft"),
    isSigned: boolean("is_signed").default(false),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    signedBy: varchar("signed_by").references(() => users.id),

    // Metadata
    createdBy: varchar("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),

    // Attachments and references
    appointmentId: varchar("appointment_id").references(() => appointments.id),
    attachments: jsonb("attachments"), // Array of file references

    // Soft Delete
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: varchar("deleted_by").references(() => users.id),
  },
  (table) => [
    index("idx_clinical_notes_company").on(table.companyId),
    index("idx_clinical_notes_patient").on(table.patientId),
    index("idx_clinical_notes_practitioner").on(table.practitionerId),
    index("idx_clinical_notes_type").on(table.noteType),
    index("idx_clinical_notes_date").on(table.noteDate),
    index("idx_clinical_notes_status").on(table.status),
    index("idx_clinical_notes_appointment").on(table.appointmentId),
  ],
);

// ============================================
// VITAL SIGNS
// ============================================

/**
 * Vital Signs Table
 * Patient vital sign measurements and monitoring
 */
export const vitalSigns = pgTable(
  "vital_signs",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
    patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }),
    practitionerId: varchar("practitioner_id").references(() => users.id, { onDelete: 'set null' }),

    // Vital sign details
    vitalType: vitalSignTypeEnum("vital_type").notNull(),
    value: varchar("value", { length: 100 }).notNull(),
    unit: varchar("unit", { length: 50 }).notNull(),

    // Measurement details
    measurementDate: timestamp("measurement_date", { withTimezone: true }).notNull(),
    method: varchar("method", { length: 100 }), // How it was measured
    position: varchar("position", { length: 50 }), // Patient position during measurement

    // Clinical context
    interpretation: varchar("interpretation", { length: 50 }), // normal, high, low, critical
    notes: text("notes"),

    // Metadata
    measuredBy: varchar("measured_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),

    // Device information
    deviceId: varchar("device_id", { length: 100 }),
    deviceType: varchar("device_type", { length: 100 }),

    // Soft Delete
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: varchar("deleted_by").references(() => users.id),
  },
  (table) => [
    index("idx_vital_signs_company").on(table.companyId),
    index("idx_vital_signs_patient").on(table.patientId),
    index("idx_vital_signs_type").on(table.vitalType),
    index("idx_vital_signs_date").on(table.measurementDate),
    index("idx_vital_signs_interpretation").on(table.interpretation),
  ],
);

// ============================================
// IMMUNIZATIONS
// ============================================

/**
 * Immunizations Table
 * Vaccine administration and immunization records
 */
export const immunizations = pgTable(
  "immunizations",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
    patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }),
    practitionerId: varchar("practitioner_id").references(() => users.id, { onDelete: 'set null' }),

    // Vaccine details
    vaccineName: varchar("vaccine_name", { length: 255 }).notNull(),
    vaccineType: varchar("vaccine_type", { length: 100 }).notNull(),
    manufacturer: varchar("manufacturer", { length: 255 }),
    lotNumber: varchar("lot_number", { length: 100 }),

    // Administration details
    administrationDate: timestamp("administration_date", { withTimezone: true }).notNull(),
    dose: varchar("dose", { length: 100 }),
    route: varchar("route", { length: 50 }),
    site: varchar("site", { length: 50 }), // Injection site

    // Status and dates
    status: immunizationStatusEnum("status").notNull().default("administered"),
    nextDueDate: timestamp("next_due_date", { withTimezone: true }),

    // Clinical information
    indications: text("indications"),
    adverseEvents: text("adverse_events"),
    notes: text("notes"),

    // Metadata
    administeredBy: varchar("administered_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),

    // External identifiers
    cvxCode: varchar("cvx_code", { length: 10 }), // CDC Vaccine Code
  },
  (table) => [
    index("idx_immunizations_company").on(table.companyId),
    index("idx_immunizations_patient").on(table.patientId),
    index("idx_immunizations_vaccine").on(table.vaccineName),
    index("idx_immunizations_date").on(table.administrationDate),
    index("idx_immunizations_status").on(table.status),
  ],
);

// ============================================
// ZOD SCHEMAS
// ============================================

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAllergySchema = createInsertSchema(allergies).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertClinicalNoteSchema = createInsertSchema(clinicalNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  signedAt: true
});

export const insertVitalSignSchema = createInsertSchema(vitalSigns).omit({
  id: true,
  createdAt: true
});

export const insertImmunizationSchema = createInsertSchema(immunizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// ============================================
// TYPESCRIPT TYPES
// ============================================

// Medications
export type Medication = typeof medications.$inferSelect;
export type InsertMedication = typeof medications.$inferInsert;

// Allergies
export type Allergy = typeof allergies.$inferSelect;
export type InsertAllergy = typeof allergies.$inferInsert;

// Clinical Notes
export type ClinicalNote = typeof clinicalNotes.$inferSelect;
export type InsertClinicalNote = typeof clinicalNotes.$inferInsert;

// Vital Signs
export type VitalSign = typeof vitalSigns.$inferSelect;
export type InsertVitalSign = typeof vitalSigns.$inferInsert;

// Immunizations
export type Immunization = typeof immunizations.$inferSelect;
export type InsertImmunization = typeof immunizations.$inferInsert;
