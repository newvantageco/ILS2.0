/**
 * Chronic Disease Management Domain Schema
 *
 * This module defines schemas for comprehensive chronic disease management:
 * - Disease registries (population management, enrollment tracking)
 * - Disease management programs (structured programs with interventions)
 * - Clinical metrics tracking (measurements, outcomes, goal attainment)
 * - Patient engagement (activities, coaching, milestones)
 * - Outcome tracking (clinical, functional, behavioral, QoL outcomes)
 * - Preventive care recommendations (screenings, vaccinations, counseling)
 *
 * @module shared/schema/chronicdisease
 */

import { pgTable, pgEnum, text, timestamp, boolean, integer, real, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { companies } from "../core";
import { patients } from "../patients";

// ============================================
// ENUMS
// ============================================

/**
 * Chronic Disease Management Enums
 */
export const registryCriteriaTypeEnum = pgEnum("registry_criteria_type", ["diagnosis", "lab_value", "medication", "procedure", "risk_score"]);
export const criteriaOperatorEnum = pgEnum("criteria_operator", ["equals", "contains", "greater_than", "less_than", "in_range"]);
export const registryEnrollmentStatusEnum = pgEnum("registry_enrollment_status", ["active", "inactive", "graduated", "deceased", "transferred"]);
export const programCriteriaTypeEnum = pgEnum("program_criteria_type", ["clinical", "demographic", "behavioral", "financial"]);
export const programInterventionTypeEnum = pgEnum("program_intervention_type", ["education", "coaching", "monitoring", "medication_management", "lifestyle"]);
export const interventionDeliveryMethodEnum = pgEnum("intervention_delivery_method", ["in_person", "phone", "video", "online", "app"]);
export const measurementFrequencyEnum = pgEnum("measurement_frequency", ["monthly", "quarterly", "annually"]);
export const programEnrollmentStatusEnum = pgEnum("program_enrollment_status", ["active", "completed", "withdrawn", "failed"]);
export const engagementTypeEnum = pgEnum("engagement_type", ["education_completed", "coaching_session", "self_monitoring", "goal_set", "milestone_achieved"]);
export const outcomeTypeEnum = pgEnum("outcome_type", ["clinical", "functional", "behavioral", "quality_of_life", "cost"]);
export const preventiveCareTypeEnum = pgEnum("preventive_care_type", ["screening", "vaccination", "counseling", "medication"]);
export const preventiveCareStatusEnum = pgEnum("preventive_care_status", ["due", "overdue", "completed", "not_applicable", "refused"]);
export const preventiveCareImportanceEnum = pgEnum("preventive_care_importance", ["routine", "recommended", "essential"]);

// ============================================
// TABLES
// ============================================

/**
 * Disease Registries Table
 * Chronic disease registries for population management
 */
export const diseaseRegistries = pgTable(
  "disease_registries",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    diseaseCode: text("disease_code").notNull(),
    description: text("description").notNull(),
    criteria: jsonb("criteria").notNull().$type<Array<{
      type: string;
      field: string;
      operator: string;
      value: any;
    }>>(),
    active: boolean("active").notNull().default(true),
    patientCount: integer("patient_count").notNull().default(0),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("disease_registries_company_idx").on(table.companyId),
    diseaseCodeIdx: index("disease_registries_disease_code_idx").on(table.diseaseCode),
    activeIdx: index("disease_registries_active_idx").on(table.active),
  })
);

/**
 * Registry Enrollments Table
 * Patient enrollments in disease registries
 */
export const registryEnrollments = pgTable(
  "registry_enrollments",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    registryId: text("registry_id").notNull().references(() => diseaseRegistries.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    enrollmentDate: timestamp("enrollment_date", { withTimezone: true }).notNull(),
    status: registryEnrollmentStatusEnum("status").notNull().default("active"),
    enrollmentReason: text("enrollment_reason").notNull(),
    disenrollmentDate: timestamp("disenrollment_date", { withTimezone: true }),
    disenrollmentReason: text("disenrollment_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("registry_enrollments_company_idx").on(table.companyId),
    registryIdx: index("registry_enrollments_registry_idx").on(table.registryId),
    patientIdx: index("registry_enrollments_patient_idx").on(table.patientId),
    statusIdx: index("registry_enrollments_status_idx").on(table.status),
  })
);

/**
 * Disease Management Programs Table
 * Disease management programs and protocols
 */
export const diseaseManagementPrograms = pgTable(
  "disease_management_programs",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    diseaseType: text("disease_type").notNull(),
    description: text("description").notNull(),
    objectives: jsonb("objectives").notNull().$type<string[]>(),
    eligibilityCriteria: jsonb("eligibility_criteria").notNull().$type<Array<{
      type: string;
      description: string;
      required: boolean;
    }>>(),
    interventions: jsonb("interventions").notNull().$type<Array<{
      id: string;
      type: string;
      name: string;
      description: string;
      frequency: string;
      duration: number;
      deliveryMethod: string;
    }>>(),
    qualityMeasures: jsonb("quality_measures").notNull().$type<Array<{
      id: string;
      name: string;
      description: string;
      numerator: string;
      denominator: string;
      targetValue: number;
      unit: string;
      measurementFrequency: string;
    }>>(),
    duration: integer("duration").notNull(), // days
    active: boolean("active").notNull().default(true),
    enrollmentCount: integer("enrollment_count").notNull().default(0),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("disease_programs_company_idx").on(table.companyId),
    diseaseTypeIdx: index("disease_programs_disease_type_idx").on(table.diseaseType),
    activeIdx: index("disease_programs_active_idx").on(table.active),
  })
);

/**
 * Program Enrollments Table
 * Patient enrollments in disease management programs
 */
export const programEnrollments = pgTable(
  "program_enrollments",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    programId: text("program_id").notNull().references(() => diseaseManagementPrograms.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    enrollmentDate: timestamp("enrollment_date", { withTimezone: true }).notNull(),
    expectedEndDate: timestamp("expected_end_date", { withTimezone: true }).notNull(),
    status: programEnrollmentStatusEnum("status").notNull().default("active"),
    completionPercentage: integer("completion_percentage").notNull().default(0),
    interventionsCompleted: jsonb("interventions_completed").notNull().$type<string[]>(),
    outcomesAchieved: jsonb("outcomes_achieved").notNull().$type<string[]>(),
    withdrawalReason: text("withdrawal_reason"),
    endDate: timestamp("end_date", { withTimezone: true }),
    assignedCoach: text("assigned_coach"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("program_enrollments_company_idx").on(table.companyId),
    programIdx: index("program_enrollments_program_idx").on(table.programId),
    patientIdx: index("program_enrollments_patient_idx").on(table.patientId),
    statusIdx: index("program_enrollments_status_idx").on(table.status),
    coachIdx: index("program_enrollments_coach_idx").on(table.assignedCoach),
  })
);

/**
 * Clinical Metrics Table
 * Clinical measurements and outcomes tracking
 */
export const clinicalMetrics = pgTable(
  "clinical_metrics",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    registryId: text("registry_id").references(() => diseaseRegistries.id, { onDelete: "set null" }),
    programId: text("program_id").references(() => diseaseManagementPrograms.id, { onDelete: "set null" }),
    metricType: text("metric_type").notNull(),
    metricName: text("metric_name").notNull(),
    value: real("value").notNull(),
    unit: text("unit").notNull(),
    targetValue: real("target_value"),
    isAtGoal: boolean("is_at_goal").notNull(),
    measurementDate: timestamp("measurement_date", { withTimezone: true }).notNull(),
    source: text("source").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("clinical_metrics_company_idx").on(table.companyId),
    patientIdx: index("clinical_metrics_patient_idx").on(table.patientId),
    registryIdx: index("clinical_metrics_registry_idx").on(table.registryId),
    programIdx: index("clinical_metrics_program_idx").on(table.programId),
    metricTypeIdx: index("clinical_metrics_metric_type_idx").on(table.metricType),
    measurementDateIdx: index("clinical_metrics_measurement_date_idx").on(table.measurementDate),
  })
);

/**
 * Patient Engagement Table
 * Patient engagement activities and milestones
 */
export const patientEngagement = pgTable(
  "patient_engagement",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    programId: text("program_id").references(() => diseaseManagementPrograms.id, { onDelete: "set null" }),
    engagementType: engagementTypeEnum("engagement_type").notNull(),
    description: text("description").notNull(),
    engagementDate: timestamp("engagement_date", { withTimezone: true }).notNull(),
    score: integer("score"),
    notes: text("notes").notNull(),
    recordedBy: text("recorded_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("patient_engagement_company_idx").on(table.companyId),
    patientIdx: index("patient_engagement_patient_idx").on(table.patientId),
    programIdx: index("patient_engagement_program_idx").on(table.programId),
    engagementTypeIdx: index("patient_engagement_type_idx").on(table.engagementType),
    engagementDateIdx: index("patient_engagement_date_idx").on(table.engagementDate),
  })
);

/**
 * Outcome Tracking Table
 * Clinical and quality outcomes tracking
 */
export const outcomeTracking = pgTable(
  "outcome_tracking",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    programId: text("program_id").references(() => diseaseManagementPrograms.id, { onDelete: "set null" }),
    registryId: text("registry_id").references(() => diseaseRegistries.id, { onDelete: "set null" }),
    outcomeType: outcomeTypeEnum("outcome_type").notNull(),
    measure: text("measure").notNull(),
    baselineValue: real("baseline_value").notNull(),
    currentValue: real("current_value").notNull(),
    targetValue: real("target_value"),
    improvement: real("improvement").notNull(),
    improvementPercentage: real("improvement_percentage").notNull(),
    unit: text("unit").notNull(),
    baselineDate: timestamp("baseline_date", { withTimezone: true }).notNull(),
    latestMeasurementDate: timestamp("latest_measurement_date", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("outcome_tracking_company_idx").on(table.companyId),
    patientIdx: index("outcome_tracking_patient_idx").on(table.patientId),
    programIdx: index("outcome_tracking_program_idx").on(table.programId),
    registryIdx: index("outcome_tracking_registry_idx").on(table.registryId),
    outcomeTypeIdx: index("outcome_tracking_outcome_type_idx").on(table.outcomeType),
  })
);

/**
 * Preventive Care Recommendations Table
 * Preventive care recommendations and tracking
 */
export const preventiveCareRecommendations = pgTable(
  "preventive_care_recommendations",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    recommendationType: preventiveCareTypeEnum("recommendation_type").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    frequency: text("frequency").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    status: preventiveCareStatusEnum("status").notNull().default("due"),
    completedDate: timestamp("completed_date", { withTimezone: true }),
    nextDueDate: timestamp("next_due_date", { withTimezone: true }),
    evidence: text("evidence").notNull(),
    importance: preventiveCareImportanceEnum("importance").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("preventive_care_company_idx").on(table.companyId),
    patientIdx: index("preventive_care_patient_idx").on(table.patientId),
    typeIdx: index("preventive_care_type_idx").on(table.recommendationType),
    statusIdx: index("preventive_care_status_idx").on(table.status),
    dueDateIdx: index("preventive_care_due_date_idx").on(table.dueDate),
  })
);

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

export const insertDiseaseRegistrySchema = createInsertSchema(diseaseRegistries);
export const insertRegistryEnrollmentSchema = createInsertSchema(registryEnrollments);
export const insertDiseaseManagementProgramSchema = createInsertSchema(diseaseManagementPrograms);
export const insertProgramEnrollmentSchema = createInsertSchema(programEnrollments);
export const insertClinicalMetricSchema = createInsertSchema(clinicalMetrics);
export const insertPatientEngagementSchema = createInsertSchema(patientEngagement);
export const insertOutcomeTrackingSchema = createInsertSchema(outcomeTracking);
export const insertPreventiveCareRecommendationSchema = createInsertSchema(preventiveCareRecommendations);

// ============================================
// TYPESCRIPT TYPES
// ============================================

export type DiseaseRegistry = typeof diseaseRegistries.$inferSelect;
export type InsertDiseaseRegistry = typeof diseaseRegistries.$inferInsert;
export type RegistryEnrollment = typeof registryEnrollments.$inferSelect;
export type InsertRegistryEnrollment = typeof registryEnrollments.$inferInsert;
export type DiseaseManagementProgram = typeof diseaseManagementPrograms.$inferSelect;
export type InsertDiseaseManagementProgram = typeof diseaseManagementPrograms.$inferInsert;
export type ProgramEnrollment = typeof programEnrollments.$inferSelect;
export type InsertProgramEnrollment = typeof programEnrollments.$inferInsert;
export type ClinicalMetric = typeof clinicalMetrics.$inferSelect;
export type InsertClinicalMetric = typeof clinicalMetrics.$inferInsert;
export type PatientEngagement = typeof patientEngagement.$inferSelect;
export type InsertPatientEngagement = typeof patientEngagement.$inferInsert;
export type OutcomeTracking = typeof outcomeTracking.$inferSelect;
export type InsertOutcomeTracking = typeof outcomeTracking.$inferInsert;
export type PreventiveCareRecommendation = typeof preventiveCareRecommendations.$inferSelect;
export type InsertPreventiveCareRecommendation = typeof preventiveCareRecommendations.$inferInsert;
