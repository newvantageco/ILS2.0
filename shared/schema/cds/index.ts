/**
 * Clinical Decision Support (CDS) Domain Schema
 *
 * Comprehensive clinical decision support system for healthcare providers including:
 * - Drug database management with formulary information
 * - Drug-drug interaction checking and alerts
 * - Clinical practice guidelines from major organizations (AAO, AHA, CDC, etc.)
 * - Patient safety alerts (allergies, critical labs, guideline deviations)
 * - AI-powered treatment recommendations based on evidence-based medicine
 * - AI-powered diagnostic suggestions with differential diagnoses
 * - Real-time clinical alerts with configurable severity levels
 * - Evidence quality and recommendation strength tracking
 *
 * This domain supports clinical workflows by providing:
 * - Proactive safety monitoring and intervention suggestions
 * - Evidence-based treatment pathways
 * - Standardized clinical guidelines adherence
 * - Intelligent diagnostic assistance
 * - Comprehensive drug interaction database
 *
 * @module shared/schema/cds
 */

import { pgTable, text, timestamp, jsonb, index, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { companies } from "../core";
import { patients } from "../patients";

// ============================================
// CLINICAL DECISION SUPPORT ENUMS
// ============================================

/**
 * Alert severity levels for clinical alerts
 */
export const alertSeverityEnum = pgEnum("alert_severity", [
  "info",
  "warning",
  "critical"
]);

/**
 * Drug interaction severity
 */
export const interactionSeverityEnum = pgEnum("interaction_severity", [
  "minor",
  "moderate",
  "major",
  "contraindicated"
]);

/**
 * Recommendation confidence level
 */
export const confidenceLevelEnum = pgEnum("confidence_level", [
  "low",
  "medium",
  "high",
  "very_high"
]);

/**
 * Clinical alert types
 */
export const clinicalAlertTypeEnum = pgEnum("clinical_alert_type", [
  "drug_interaction",
  "allergy",
  "lab_critical",
  "guideline_deviation",
  "risk_factor"
]);

/**
 * Guideline strength of recommendation
 */
export const recommendationStrengthEnum = pgEnum("recommendation_strength", [
  "A", // Strong
  "B", // Moderate
  "C", // Weak
  "D"  // Very weak
]);

/**
 * Quality of evidence
 */
export const evidenceQualityEnum = pgEnum("evidence_quality", [
  "high",
  "moderate",
  "low",
  "very_low"
]);

/**
 * Lab result status
 */
export const labStatusEnum = pgEnum("lab_status", [
  "normal",
  "low",
  "high",
  "critical"
]);

/**
 * Diagnostic urgency
 */
export const diagnosticUrgencyEnum = pgEnum("diagnostic_urgency", [
  "routine",
  "urgent",
  "emergency"
]);

// ============================================
// CLINICAL DECISION SUPPORT TABLES
// ============================================

/**
 * Drugs Table
 * Stores drug database for clinical decision support
 */
export const drugs = pgTable(
  "drugs",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    genericName: text("generic_name").notNull(),
    brandNames: jsonb("brand_names").notNull().$type<string[]>(),
    drugClass: text("drug_class").notNull(),
    interactions: jsonb("interactions").notNull().$type<string[]>(), // Drug IDs
    contraindications: jsonb("contraindications").notNull().$type<string[]>(),
    sideEffects: jsonb("side_effects").notNull().$type<string[]>(),
    dosageRange: jsonb("dosage_range").$type<{
      min: number;
      max: number;
      unit: string;
    }>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("drugs_company_idx").on(table.companyId),
    nameIdx: index("drugs_name_idx").on(table.name),
    genericNameIdx: index("drugs_generic_name_idx").on(table.genericName),
  })
);

/**
 * Drug Interactions Table
 * Stores known drug-drug interactions
 */
export const drugInteractions = pgTable(
  "drug_interactions",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    drug1Id: text("drug1_id").notNull().references(() => drugs.id, { onDelete: "cascade" }),
    drug2Id: text("drug2_id").notNull().references(() => drugs.id, { onDelete: "cascade" }),
    severity: interactionSeverityEnum("severity").notNull(),
    description: text("description").notNull(),
    clinicalEffects: jsonb("clinical_effects").notNull().$type<string[]>(),
    management: text("management").notNull(),
    references: jsonb("references").notNull().$type<string[]>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("drug_interactions_company_idx").on(table.companyId),
    drug1Idx: index("drug_interactions_drug1_idx").on(table.drug1Id),
    drug2Idx: index("drug_interactions_drug2_idx").on(table.drug2Id),
    severityIdx: index("drug_interactions_severity_idx").on(table.severity),
  })
);

/**
 * Clinical Guidelines Table
 * Stores clinical practice guidelines
 */
export const clinicalGuidelines = pgTable(
  "clinical_guidelines",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    condition: text("condition").notNull(),
    organization: text("organization").notNull(), // AAO, AHA, CDC, etc.
    version: text("version").notNull(),
    lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull(),
    recommendations: jsonb("recommendations").notNull().$type<Array<{
      id: string;
      title: string;
      description: string;
      strengthOfRecommendation: 'A' | 'B' | 'C' | 'D';
      qualityOfEvidence: 'high' | 'moderate' | 'low' | 'very_low';
      applicableCriteria?: string[];
      contraindications?: string[];
    }>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("clinical_guidelines_company_idx").on(table.companyId),
    conditionIdx: index("clinical_guidelines_condition_idx").on(table.condition),
    organizationIdx: index("clinical_guidelines_organization_idx").on(table.organization),
  })
);

/**
 * Clinical Alerts Table
 * Stores clinical alerts for patient safety
 */
export const clinicalAlerts = pgTable(
  "clinical_alerts",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    type: clinicalAlertTypeEnum("type").notNull(),
    severity: alertSeverityEnum("severity").notNull(),
    message: text("message").notNull(),
    details: text("details").notNull(),
    recommendations: jsonb("recommendations").notNull().$type<string[]>(),
    requiresAcknowledgment: boolean("requires_acknowledgment").notNull().default(false),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    acknowledgedBy: text("acknowledged_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("clinical_alerts_company_idx").on(table.companyId),
    patientIdx: index("clinical_alerts_patient_idx").on(table.patientId),
    typeIdx: index("clinical_alerts_type_idx").on(table.type),
    severityIdx: index("clinical_alerts_severity_idx").on(table.severity),
    createdAtIdx: index("clinical_alerts_created_at_idx").on(table.createdAt),
  })
);

/**
 * Treatment Recommendations Table
 * Stores AI-generated treatment recommendations
 */
export const treatmentRecommendations = pgTable(
  "treatment_recommendations",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    condition: text("condition").notNull(),
    diagnosis: text("diagnosis").notNull(),
    recommendations: jsonb("recommendations").notNull().$type<Array<{
      treatment: string;
      rationale: string;
      confidence: string;
      evidenceLevel: string;
      alternatives?: string[];
      contraindications?: string[];
      expectedOutcome?: string;
      monitoringRequired?: string[];
    }>>(),
    guidelineReferences: jsonb("guideline_references").notNull().$type<string[]>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("treatment_recommendations_company_idx").on(table.companyId),
    patientIdx: index("treatment_recommendations_patient_idx").on(table.patientId),
    conditionIdx: index("treatment_recommendations_condition_idx").on(table.condition),
    createdAtIdx: index("treatment_recommendations_created_at_idx").on(table.createdAt),
  })
);

/**
 * Diagnostic Suggestions Table
 * Stores AI-generated diagnostic suggestions
 */
export const diagnosticSuggestions = pgTable(
  "diagnostic_suggestions",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    symptoms: jsonb("symptoms").notNull().$type<string[]>(),
    labResults: jsonb("lab_results").$type<Record<string, any>>(),
    vitalSigns: jsonb("vital_signs").$type<Record<string, number>>(),
    possibleDiagnoses: jsonb("possible_diagnoses").notNull().$type<Array<{
      condition: string;
      icd10Code: string;
      probability: number;
      supportingFactors: string[];
      differentialDiagnoses: string[];
      recommendedTests?: string[];
      urgency: 'routine' | 'urgent' | 'emergency';
    }>>(),
    confidence: confidenceLevelEnum("confidence").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("diagnostic_suggestions_company_idx").on(table.companyId),
    patientIdx: index("diagnostic_suggestions_patient_idx").on(table.patientId),
    confidenceIdx: index("diagnostic_suggestions_confidence_idx").on(table.confidence),
    createdAtIdx: index("diagnostic_suggestions_created_at_idx").on(table.createdAt),
  })
);

// ============================================
// ZOD SCHEMAS
// ============================================

export const insertDrugSchema = createInsertSchema(drugs);
export const insertDrugInteractionSchema = createInsertSchema(drugInteractions);
export const insertClinicalGuidelineSchema = createInsertSchema(clinicalGuidelines);
export const insertClinicalAlertSchema = createInsertSchema(clinicalAlerts);
export const insertTreatmentRecommendationSchema = createInsertSchema(treatmentRecommendations);
export const insertDiagnosticSuggestionSchema = createInsertSchema(diagnosticSuggestions);

// ============================================
// TYPES
// ============================================

export type Drug = typeof drugs.$inferSelect;
export type InsertDrug = typeof drugs.$inferInsert;
export type DrugInteraction = typeof drugInteractions.$inferSelect;
export type InsertDrugInteraction = typeof drugInteractions.$inferInsert;
export type ClinicalGuideline = typeof clinicalGuidelines.$inferSelect;
export type InsertClinicalGuideline = typeof clinicalGuidelines.$inferInsert;
export type ClinicalAlert = typeof clinicalAlerts.$inferSelect;
export type InsertClinicalAlert = typeof clinicalAlerts.$inferInsert;
export type TreatmentRecommendation = typeof treatmentRecommendations.$inferSelect;
export type InsertTreatmentRecommendation = typeof treatmentRecommendations.$inferInsert;
export type DiagnosticSuggestion = typeof diagnosticSuggestions.$inferSelect;
export type InsertDiagnosticSuggestion = typeof diagnosticSuggestions.$inferInsert;
