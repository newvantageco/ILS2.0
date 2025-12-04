/**
 * Population Health Domain Schema
 *
 * This module contains database schemas for population health management,
 * risk stratification, and predictive analytics functionality.
 *
 * Includes:
 * - Risk assessments and health risk questionnaires
 * - Predictive models and analyses for patient outcomes
 * - Social determinants of health (SDOH) tracking
 * - Risk stratification cohorts for population management
 */

import { pgTable, pgEnum, text, numeric, boolean, timestamp, jsonb, index, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { companies } from "../core";
import { patients } from "../patients";

// ========== Population Health Enums ==========

export const riskLevelEnum = pgEnum("risk_level", [
  "low",
  "moderate",
  "high",
  "very_high"
]);

export const assessmentStatusEnum = pgEnum("assessment_status", [
  "pending",
  "in_progress",
  "completed",
  "expired"
]);

export const socialDeterminantCategoryEnum = pgEnum("social_determinant_category", [
  "economic_stability",
  "education",
  "social_community",
  "healthcare_access",
  "neighborhood_environment"
]);

export const socialDeterminantStatusEnum = pgEnum("social_determinant_status", [
  "identified",
  "intervention_planned",
  "intervention_active",
  "resolved"
]);

export const severityEnum = pgEnum("severity", [
  "low",
  "moderate",
  "high"
]);

// ========== Population Health Tables ==========

/**
 * Health Risk Assessments Table
 * Stores structured health risk assessment questionnaires and responses
//  */
export const healthRiskAssessments = pgTable(
  "health_risk_assessments",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    assessmentType: text("assessment_type").notNull(), // e.g., "HRA", "PHQ-9", "GAD-7"
    status: assessmentStatusEnum("status").notNull().default("pending"),
    responses: jsonb("responses").notNull().$type<Array<{
      questionId: string;
      question: string;
      response: any;
      score: number;
      category: string;
    }>>(), // Array of AssessmentResponse objects
    totalScore: numeric("total_score", { precision: 10, scale: 2 }).notNull().default("0"),
    riskLevel: riskLevelEnum("risk_level").notNull(),
    recommendations: jsonb("recommendations").notNull().$type<string[]>().default([]), // Array of recommendation strings
    completedDate: timestamp("completed_date", { withTimezone: true }),
    expirationDate: timestamp("expiration_date", { withTimezone: true }).notNull(),
    administeredBy: text("administered_by"), // User ID who administered assessment
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("health_risk_assessments_company_idx").on(table.companyId),
    patientIdx: index("health_risk_assessments_patient_idx").on(table.patientId),
    statusIdx: index("health_risk_assessments_status_idx").on(table.status),
    riskLevelIdx: index("health_risk_assessments_risk_level_idx").on(table.riskLevel),
  })
);

/**
 * Predictive Models Table
 * Stores ML/statistical models for predicting patient outcomes
//  */
export const predictiveModels = pgTable(
  "predictive_models",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    version: text("version").notNull(),
    modelType: text("model_type").notNull(), // e.g., "readmission", "mortality", "cost"
    description: text("description").notNull(),
    inputFeatures: jsonb("input_features").notNull().$type<string[]>(), // Array of feature names
    outputMetric: text("output_metric").notNull(), // e.g., "probability", "risk_score", "cost"
    accuracy: numeric("accuracy", { precision: 5, scale: 4 }).notNull(), // Model accuracy (0-1)
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull().defaultNow(),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: text("created_by").notNull(), // User ID
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("predictive_models_company_idx").on(table.companyId),
    activeIdx: index("predictive_models_active_idx").on(table.isActive),
    modelTypeIdx: index("predictive_models_model_type_idx").on(table.modelType),
  })
);

/**
 * Predictive Analyses Table
 * Stores results of running predictive models on patient data
//  */
export const predictiveAnalyses = pgTable(
  "predictive_analyses",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    modelId: text("model_id").notNull().references(() => predictiveModels.id, { onDelete: "cascade" }),
    modelName: text("model_name").notNull(),
    predictedOutcome: text("predicted_outcome").notNull(), // e.g., "High risk of readmission"
    probability: numeric("probability", { precision: 5, scale: 4 }).notNull(), // 0-1
    confidence: numeric("confidence", { precision: 5, scale: 4 }).notNull(), // 0-1
    riskLevel: riskLevelEnum("risk_level").notNull(),
    contributingFactors: jsonb("contributing_factors").notNull().$type<Array<{
      factor: string;
      contribution: number;
    }>>(), // Array of contributing factors with weights
    recommendations: jsonb("recommendations").notNull().$type<string[]>(), // Array of action recommendations
    analyzedDate: timestamp("analyzed_date", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("predictive_analyses_company_idx").on(table.companyId),
    patientIdx: index("predictive_analyses_patient_idx").on(table.patientId),
    modelIdx: index("predictive_analyses_model_idx").on(table.modelId),
    riskLevelIdx: index("predictive_analyses_risk_level_idx").on(table.riskLevel),
    analyzedDateIdx: index("predictive_analyses_analyzed_date_idx").on(table.analyzedDate),
  })
);

/**
 * Social Determinants Table
 * Tracks social determinants of health (SDOH) and interventions
//  */
export const socialDeterminants = pgTable(
  "social_determinants",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    category: socialDeterminantCategoryEnum("category").notNull(),
    factor: text("factor").notNull(), // Specific SDOH factor identified
    status: socialDeterminantStatusEnum("status").notNull().default("identified"),
    severity: severityEnum("severity").notNull(),
    description: text("description").notNull(),
    impact: text("impact").notNull(), // Description of health impact
    interventions: jsonb("interventions").notNull().$type<string[]>().default([]), // Array of intervention descriptions
    identifiedDate: timestamp("identified_date", { withTimezone: true }).notNull().defaultNow(),
    resolvedDate: timestamp("resolved_date", { withTimezone: true }),
    identifiedBy: text("identified_by").notNull(), // User ID
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("social_determinants_company_idx").on(table.companyId),
    patientIdx: index("social_determinants_patient_idx").on(table.patientId),
    categoryIdx: index("social_determinants_category_idx").on(table.category),
    statusIdx: index("social_determinants_status_idx").on(table.status),
    severityIdx: index("social_determinants_severity_idx").on(table.severity),
  })
);

/**
 * Risk Stratification Cohorts Table
 * Defines patient cohorts based on risk criteria for population management
//  */
export const riskStratificationCohorts = pgTable(
  "risk_stratification_cohorts",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    criteria: jsonb("criteria").notNull().$type<Array<{
      field: string;
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
      value: any;
    }>>(), // Array of CohortCriteria objects
    riskLevels: jsonb("risk_levels").notNull().$type<Array<'low' | 'moderate' | 'high' | 'very_high'>>(), // Array of target risk levels
    patientCount: integer("patient_count").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdBy: text("created_by").notNull(), // User ID
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("risk_stratification_cohorts_company_idx").on(table.companyId),
    activeIdx: index("risk_stratification_cohorts_active_idx").on(table.active),
    nameIdx: index("risk_stratification_cohorts_name_idx").on(table.name),
  })
);

// ========== Zod Validation Schemas ==========

export const insertHealthRiskAssessmentSchema = createInsertSchema(healthRiskAssessments);
export const insertPredictiveModelSchema = createInsertSchema(predictiveModels);
export const insertPredictiveAnalysisSchema = createInsertSchema(predictiveAnalyses);
export const insertSocialDeterminantSchema = createInsertSchema(socialDeterminants);
export const insertRiskStratificationCohortSchema = createInsertSchema(riskStratificationCohorts);

// ========== TypeScript Types ==========

export type HealthRiskAssessment = typeof healthRiskAssessments.$inferSelect;
export type InsertHealthRiskAssessment = typeof healthRiskAssessments.$inferInsert;
export type PredictiveModel = typeof predictiveModels.$inferSelect;
export type InsertPredictiveModel = typeof predictiveModels.$inferInsert;
export type PredictiveAnalysis = typeof predictiveAnalyses.$inferSelect;
export type InsertPredictiveAnalysis = typeof predictiveAnalyses.$inferInsert;
export type SocialDeterminant = typeof socialDeterminants.$inferSelect;
export type InsertSocialDeterminant = typeof socialDeterminants.$inferInsert;
export type RiskStratificationCohort = typeof riskStratificationCohorts.$inferSelect;
export type InsertRiskStratificationCohort = typeof riskStratificationCohorts.$inferInsert;
