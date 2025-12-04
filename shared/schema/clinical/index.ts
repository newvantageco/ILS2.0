/**
 * Clinical Domain Schema
 *
 * Tables for clinical practice management including:
 * - Eye examinations
 * - Prescriptions
 * - Test rooms
 * - Clinical protocols
 * - Consult logs
 *
 * @module shared/schema/clinical
 */

import { pgTable, text, varchar, timestamp, jsonb, index, pgEnum, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";

// ============================================
// CLINICAL ENUMS
// ============================================

export const examinationStatusEnum = pgEnum("examination_status", [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled"
]);

export const consultPriorityEnum = pgEnum("consult_priority", [
  "low",
  "normal",
  "high",
  "urgent"
]);

// ============================================
// EYE EXAMINATIONS
// ============================================

export const eyeExaminations = pgTable("eye_examinations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  patientId: varchar("patient_id").notNull(),
  ecpId: varchar("ecp_id").notNull(),
  examinationDate: timestamp("examination_date").defaultNow().notNull(),
  status: examinationStatusEnum("status").notNull().default("in_progress"),
  reasonForVisit: text("reason_for_visit"),

  // Legacy fields (kept for backward compatibility)
  medicalHistory: jsonb("medical_history"),
  visualAcuity: jsonb("visual_acuity"),
  refraction: jsonb("refraction"),
  binocularVision: jsonb("binocular_vision"),
  eyeHealth: jsonb("eye_health"),
  equipmentReadings: jsonb("equipment_readings"),

  // Comprehensive examination fields
  generalHistory: jsonb("general_history"),
  currentRx: jsonb("current_rx"),
  newRx: jsonb("new_rx"),
  ophthalmoscopy: jsonb("ophthalmoscopy"),
  slitLamp: jsonb("slit_lamp"),
  additionalTests: jsonb("additional_tests"),
  tonometry: jsonb("tonometry"),
  eyeSketch: jsonb("eye_sketch"),
  images: jsonb("images"),
  summary: jsonb("summary"),

  // Enhanced examination workflow fields
  preScreening: jsonb("pre_screening"),
  retinoscopy: jsonb("retinoscopy"),
  sectionNotes: jsonb("section_notes"),
  gradingSystem: varchar("grading_system", { length: 20 }),

  finalized: boolean("finalized").default(false),

  gosFormType: text("gos_form_type"),
  nhsVoucherCode: text("nhs_voucher_code"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Import Tracking
  externalId: varchar("external_id", { length: 255 }),
  importSource: varchar("import_source", { length: 100 }),
  importJobId: varchar("import_job_id", { length: 255 }),
  importedAt: timestamp("imported_at"),

  // Soft Delete
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by", { length: 255 }),
}, (table) => [
  index("idx_eye_examinations_company").on(table.companyId),
  index("idx_eye_examinations_patient").on(table.patientId),
  index("idx_eye_examinations_ecp").on(table.ecpId),
  index("idx_eye_examinations_date").on(table.examinationDate),
]);

// ============================================
// PRESCRIPTIONS
// ============================================

export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  examinationId: varchar("examination_id"),
  patientId: varchar("patient_id").notNull(),
  ecpId: varchar("ecp_id").notNull(),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  expiryDate: timestamp("expiry_date"),

  // Right eye (OD)
  odSphere: decimal("od_sphere", { precision: 6, scale: 3 }),
  odCylinder: decimal("od_cylinder", { precision: 6, scale: 3 }),
  odAxis: integer("od_axis"),
  odAdd: decimal("od_add", { precision: 4, scale: 2 }),

  // Left eye (OS)
  osSphere: decimal("os_sphere", { precision: 6, scale: 3 }),
  osCylinder: decimal("os_cylinder", { precision: 6, scale: 3 }),
  osAxis: integer("os_axis"),
  osAdd: decimal("os_add", { precision: 4, scale: 2 }),

  // Pupillary distances
  pd: decimal("pd", { precision: 4, scale: 1 }),
  pdRight: decimal("pd_right", { precision: 4, scale: 1 }),
  pdLeft: decimal("pd_left", { precision: 4, scale: 1 }),
  binocularPd: decimal("binocular_pd", { precision: 4, scale: 1 }),
  nearPd: decimal("near_pd", { precision: 4, scale: 1 }),

  // Prism prescription
  odPrismHorizontal: decimal("od_prism_horizontal", { precision: 4, scale: 2 }),
  odPrismVertical: decimal("od_prism_vertical", { precision: 4, scale: 2 }),
  odPrismBase: varchar("od_prism_base", { length: 20 }),
  osPrismHorizontal: decimal("os_prism_horizontal", { precision: 4, scale: 2 }),
  osPrismVertical: decimal("os_prism_vertical", { precision: 4, scale: 2 }),
  osPrismBase: varchar("os_prism_base", { length: 20 }),

  // British standards compliance
  backVertexDistance: decimal("back_vertex_distance", { precision: 4, scale: 1 }),
  prescriptionType: varchar("prescription_type", { length: 50 }),
  dispensingNotes: text("dispensing_notes"),
  gocCompliant: boolean("goc_compliant").default(true).notNull(),
  prescriberGocNumber: varchar("prescriber_goc_number", { length: 50 }),

  // GOC Compliance
  testRoomName: varchar("test_room_name", { length: 100 }),
  prescriberName: varchar("prescriber_name", { length: 255 }),
  prescriberQualifications: varchar("prescriber_qualifications", { length: 255 }),
  prescriberGocType: varchar("prescriber_goc_type", { length: 50 }),

  // Visual Acuity
  odVisualAcuityUnaided: varchar("od_visual_acuity_unaided", { length: 20 }),
  odVisualAcuityAided: varchar("od_visual_acuity_aided", { length: 20 }),
  osVisualAcuityUnaided: varchar("os_visual_acuity_unaided", { length: 20 }),
  osVisualAcuityAided: varchar("os_visual_acuity_aided", { length: 20 }),
  binocularVisualAcuity: varchar("binocular_visual_acuity", { length: 20 }),

  // Clinical
  ocularHealthNotes: text("ocular_health_notes"),
  clinicalRecommendations: text("clinical_recommendations"),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  followUpReason: text("follow_up_reason"),

  // Dispensing Recommendations
  recommendedLensType: varchar("recommended_lens_type", { length: 100 }),
  recommendedLensMaterial: varchar("recommended_lens_material", { length: 100 }),
  recommendedCoatings: text("recommended_coatings"),
  frameRecommendations: text("frame_recommendations"),
  specialInstructions: text("special_instructions"),

  // Digital signature
  isSigned: boolean("is_signed").default(false).notNull(),
  signedByEcpId: varchar("signed_by_ecp_id"),
  digitalSignature: text("digital_signature"),
  signedAt: timestamp("signed_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),

  // Soft Delete
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by", { length: 255 }),
}, (table) => [
  index("idx_prescriptions_company").on(table.companyId),
  index("idx_prescriptions_patient").on(table.patientId),
  index("idx_prescriptions_examination").on(table.examinationId),
  index("idx_prescriptions_test_room").on(table.testRoomName),
  index("idx_prescriptions_goc_number").on(table.prescriberGocNumber),
]);

// ============================================
// TEST ROOMS
// ============================================

export const testRooms = pgTable("test_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  roomName: varchar("room_name", { length: 100 }).notNull(),
  roomCode: varchar("room_code", { length: 20 }),
  locationDescription: text("location_description"),
  equipmentList: text("equipment_list"),
  capacity: integer("capacity").default(1),
  isActive: boolean("is_active").default(true).notNull(),

  // Scheduling
  defaultSlotDuration: integer("default_slot_duration").default(30),
  availableFrom: varchar("available_from", { length: 5 }),
  availableTo: varchar("available_to", { length: 5 }),
  availableDays: jsonb("available_days").$type<number[]>(),

  // Equipment
  hasRetinalCamera: boolean("has_retinal_camera").default(false),
  hasOCT: boolean("has_oct").default(false),
  hasVisualFieldAnalyzer: boolean("has_visual_field_analyzer").default(false),
  hasAutoRefractor: boolean("has_auto_refractor").default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_test_rooms_company").on(table.companyId),
  index("idx_test_rooms_active").on(table.companyId, table.isActive),
]);

// ============================================
// CLINICAL PROTOCOLS
// ============================================

export const clinicalProtocols = pgTable("clinical_protocols", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  steps: jsonb("steps").$type<Array<{ order: number; title: string; description: string; required: boolean }>>(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by"),
}, (table) => [
  index("idx_clinical_protocols_company").on(table.companyId),
  index("idx_clinical_protocols_category").on(table.companyId, table.category),
]);

// ============================================
// CONSULT LOGS

// ============================================
// GOC COMPLIANCE CHECKS
// ============================================

export const gocComplianceChecks = pgTable("goc_compliance_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  prescriptionId: varchar("prescription_id"),
  ecpId: varchar("ecp_id").notNull(),
  checkType: varchar("check_type", { length: 100 }).notNull(),
  checkDate: timestamp("check_date").defaultNow().notNull(),
  passed: boolean("passed").notNull(),
  findings: jsonb("findings"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_goc_compliance_company").on(table.companyId),
  index("idx_goc_compliance_prescription").on(table.prescriptionId),
]);

// ============================================
// ZOD SCHEMAS
// ============================================

export const insertEyeExaminationSchema = createInsertSchema(eyeExaminations);
export const insertPrescriptionSchema = createInsertSchema(prescriptions);
export const insertTestRoomSchema = createInsertSchema(testRooms);
export const insertClinicalProtocolSchema = createInsertSchema(clinicalProtocols);
export const insertGocComplianceCheckSchema = createInsertSchema(gocComplianceChecks);

// ============================================
// TYPES
// ============================================

export type EyeExamination = typeof eyeExaminations.$inferSelect;
export type InsertEyeExamination = typeof eyeExaminations.$inferInsert;
export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = typeof prescriptions.$inferInsert;
export type TestRoom = typeof testRooms.$inferSelect;
export type InsertTestRoom = typeof testRooms.$inferInsert;
export type ClinicalProtocol = typeof clinicalProtocols.$inferSelect;
export type InsertClinicalProtocol = typeof clinicalProtocols.$inferInsert;
export type GocComplianceCheck = typeof gocComplianceChecks.$inferSelect;
export type InsertGocComplianceCheck = typeof gocComplianceChecks.$inferInsert;
