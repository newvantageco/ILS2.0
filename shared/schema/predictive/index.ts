/**
 * Predictive Analytics Domain Schema
 *
 * This module contains database schemas for machine learning and AI-powered
 * predictive analytics in healthcare settings.
 *
 * Features:
 * - Machine learning model management and versioning
 * - Risk stratification for various health outcomes
 * - Hospital readmission risk predictions
 * - Appointment no-show risk predictions
 * - Disease progression forecasting
 * - Treatment outcome predictions and alternative recommendations
 *
 * The predictive analytics domain leverages ML models to provide actionable
 * insights for clinical decision support, population health management, and
 * proactive patient care interventions.
 */

import { pgTable, pgEnum, text, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { companies } from "../core";
import { patients } from "../patients";
import { riskLevelEnum } from "../populationhealth";

// ========== Predictive Analytics Enums ==========

/**
 * Prediction Confidence Levels
 * Indicates the confidence level of a prediction made by an ML model
 */
export const predictionConfidenceEnum = pgEnum("prediction_confidence", ["low", "medium", "high"]);

/**
 * ML Model Types
 * Categorizes machine learning models by their algorithmic approach
 */
export const mlModelTypeEnum = pgEnum("ml_model_type", ["classification", "regression", "clustering"]);

/**
 * ML Model Status
 * Tracks the deployment status of ML models in the system
 */
export const mlModelStatusEnum = pgEnum("ml_model_status", ["active", "testing", "deprecated"]);

/**
 * Risk Types
 * Categorizes different types of health risks that can be predicted
 */
export const riskTypeEnum = pgEnum("risk_type", ["readmission", "disease_progression", "complication", "mortality"]);

/**
 * Readmission Timeframes
 * Standard timeframes for predicting hospital readmissions
 */
export const readmissionTimeframeEnum = pgEnum("readmission_timeframe", ["7_days", "30_days", "90_days"]);

// ========== Predictive Analytics Tables ==========

/**
 * ML Models Table
 * Stores machine learning models used for healthcare predictions
 *
 * This table tracks ML models including their metadata, training information,
 * performance metrics, and deployment status. Models can be versioned and
 * their performance tracked over time.
 */
export const mlModels = pgTable(
  "ml_models",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: mlModelTypeEnum("type").notNull(),
    version: text("version").notNull(),
    trainedAt: timestamp("trained_at", { withTimezone: true }).notNull(),

    // Features and performance
    features: jsonb("features").notNull().$type<string[]>(),
    performance: jsonb("performance").notNull().$type<{
      accuracy?: number;
      precision?: number;
      recall?: number;
      f1Score?: number;
      auc?: number;
      rmse?: number;
    }>(),

    status: mlModelStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("ml_models_company_idx").on(table.companyId),
    statusIdx: index("ml_models_status_idx").on(table.status),
    typeIdx: index("ml_models_type_idx").on(table.type),
  })
);

/**
 * Risk Stratifications Table
 * Stores comprehensive risk assessments for patients across multiple risk types
 *
 * This table maintains risk assessments that stratify patients based on various
 * health risks. Each assessment includes a risk score, contributing factors,
 * and recommended interventions.
 */
export const riskStratifications = pgTable(
  "risk_stratifications",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),

    riskType: riskTypeEnum("risk_type").notNull(),
    riskLevel: riskLevelEnum("risk_level").notNull(),
    riskScore: integer("risk_score").notNull(), // 0-100
    confidence: predictionConfidenceEnum("confidence").notNull(),

    // Complex data stored as JSONB
    riskFactors: jsonb("risk_factors").notNull().$type<Array<{
      factor: string;
      weight: number;
      value: any;
      impact: 'positive' | 'negative' | 'neutral';
      description: string;
    }>>(),
    interventions: jsonb("interventions").notNull().$type<string[]>(),

    predictedTimeframe: text("predicted_timeframe"),
    modelVersion: text("model_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("risk_stratifications_company_idx").on(table.companyId),
    patientIdx: index("risk_stratifications_patient_idx").on(table.patientId),
    riskTypeIdx: index("risk_stratifications_risk_type_idx").on(table.riskType),
    riskLevelIdx: index("risk_stratifications_risk_level_idx").on(table.riskLevel),
    createdAtIdx: index("risk_stratifications_created_at_idx").on(table.createdAt),
  })
);

/**
 * Readmission Predictions Table
 * Stores hospital readmission risk predictions for discharged patients
 *
 * This table tracks predictions for the likelihood of a patient being readmitted
 * to the hospital within specific timeframes. Includes contributing factors and
 * preventive actions to reduce readmission risk.
 */
export const readmissionPredictions = pgTable(
  "readmission_predictions",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    admissionId: text("admission_id").notNull(),

    probability: integer("probability").notNull(), // 0-100
    riskLevel: riskLevelEnum("risk_level").notNull(),
    timeframe: readmissionTimeframeEnum("timeframe").notNull(),

    contributingFactors: jsonb("contributing_factors").notNull().$type<Array<{
      factor: string;
      weight: number;
      value: any;
      impact: 'positive' | 'negative' | 'neutral';
      description: string;
    }>>(),
    preventiveActions: jsonb("preventive_actions").notNull().$type<string[]>(),

    confidence: predictionConfidenceEnum("confidence").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("readmission_predictions_company_idx").on(table.companyId),
    patientIdx: index("readmission_predictions_patient_idx").on(table.patientId),
    admissionIdx: index("readmission_predictions_admission_idx").on(table.admissionId),
    riskLevelIdx: index("readmission_predictions_risk_level_idx").on(table.riskLevel),
    createdAtIdx: index("readmission_predictions_created_at_idx").on(table.createdAt),
  })
);

/**
 * No-Show Predictions Table
 * Stores appointment no-show risk predictions for scheduled appointments
 *
 * This table predicts the likelihood of patients not showing up for their
 * scheduled appointments. Helps optimize scheduling and implement targeted
 * reminder strategies to reduce no-show rates.
 */
export const noShowPredictions = pgTable(
  "no_show_predictions",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    appointmentId: text("appointment_id").notNull(),

    probability: integer("probability").notNull(), // 0-100
    riskLevel: riskLevelEnum("risk_level").notNull(),

    contributingFactors: jsonb("contributing_factors").notNull().$type<Array<{
      factor: string;
      weight: number;
      value: any;
      impact: 'positive' | 'negative' | 'neutral';
      description: string;
    }>>(),
    recommendedActions: jsonb("recommended_actions").notNull().$type<string[]>(),

    confidence: predictionConfidenceEnum("confidence").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("no_show_predictions_company_idx").on(table.companyId),
    patientIdx: index("no_show_predictions_patient_idx").on(table.patientId),
    appointmentIdx: index("no_show_predictions_appointment_idx").on(table.appointmentId),
    riskLevelIdx: index("no_show_predictions_risk_level_idx").on(table.riskLevel),
    createdAtIdx: index("no_show_predictions_created_at_idx").on(table.createdAt),
  })
);

/**
 * Disease Progression Predictions Table
 * Stores predictions for how diseases will progress over time
 *
 * This table forecasts the likely progression of a patient's disease through
 * various stages. Includes predicted stages, timeframes, and recommended
 * interventions at each stage to improve outcomes.
 */
export const diseaseProgressionPredictions = pgTable(
  "disease_progression_predictions",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),

    disease: text("disease").notNull(),
    currentStage: text("current_stage").notNull(),

    predictedStages: jsonb("predicted_stages").notNull().$type<Array<{
      stage: string;
      timeframe: string;
      probability: number;
      interventions?: string[];
    }>>(),
    riskFactors: jsonb("risk_factors").notNull().$type<Array<{
      factor: string;
      weight: number;
      value: any;
      impact: 'positive' | 'negative' | 'neutral';
      description: string;
    }>>(),

    confidence: predictionConfidenceEnum("confidence").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("disease_progression_predictions_company_idx").on(table.companyId),
    patientIdx: index("disease_progression_predictions_patient_idx").on(table.patientId),
    diseaseIdx: index("disease_progression_predictions_disease_idx").on(table.disease),
    createdAtIdx: index("disease_progression_predictions_created_at_idx").on(table.createdAt),
  })
);

/**
 * Treatment Outcome Predictions Table
 * Stores predictions for treatment success and alternative treatment options
 *
 * This table predicts the likelihood of success for specific treatments given
 * a patient's condition. Provides alternative treatment recommendations with
 * success probabilities to support clinical decision-making.
 */
export const treatmentOutcomePredictions = pgTable(
  "treatment_outcome_predictions",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),

    treatment: text("treatment").notNull(),
    condition: text("condition").notNull(),

    predictedOutcomes: jsonb("predicted_outcomes").notNull().$type<Array<{
      outcome: string;
      probability: number;
      timeframe: string;
      confidenceInterval?: {
        lower: number;
        upper: number;
      };
    }>>(),
    successProbability: integer("success_probability").notNull(), // 0-100
    alternativeTreatments: jsonb("alternative_treatments").$type<Array<{
      treatment: string;
      successProbability: number;
      rationale: string;
    }>>(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("treatment_outcome_predictions_company_idx").on(table.companyId),
    patientIdx: index("treatment_outcome_predictions_patient_idx").on(table.patientId),
    treatmentIdx: index("treatment_outcome_predictions_treatment_idx").on(table.treatment),
    createdAtIdx: index("treatment_outcome_predictions_created_at_idx").on(table.createdAt),
  })
);

// ========== Zod Validation Schemas ==========

export const insertMlModelSchema = createInsertSchema(mlModels);
export const insertRiskStratificationSchema = createInsertSchema(riskStratifications);
export const insertReadmissionPredictionSchema = createInsertSchema(readmissionPredictions);
export const insertNoShowPredictionSchema = createInsertSchema(noShowPredictions);
export const insertDiseaseProgressionPredictionSchema = createInsertSchema(diseaseProgressionPredictions);
export const insertTreatmentOutcomePredictionSchema = createInsertSchema(treatmentOutcomePredictions);

// ========== TypeScript Types ==========

export type MlModel = typeof mlModels.$inferSelect;
export type InsertMlModel = typeof mlModels.$inferInsert;
export type RiskStratification = typeof riskStratifications.$inferSelect;
export type InsertRiskStratification = typeof riskStratifications.$inferInsert;
export type ReadmissionPrediction = typeof readmissionPredictions.$inferSelect;
export type InsertReadmissionPrediction = typeof readmissionPredictions.$inferInsert;
export type NoShowPrediction = typeof noShowPredictions.$inferSelect;
export type InsertNoShowPrediction = typeof noShowPredictions.$inferInsert;
export type DiseaseProgressionPrediction = typeof diseaseProgressionPredictions.$inferSelect;
export type InsertDiseaseProgressionPrediction = typeof diseaseProgressionPredictions.$inferInsert;
export type TreatmentOutcomePrediction = typeof treatmentOutcomePredictions.$inferSelect;
export type InsertTreatmentOutcomePrediction = typeof treatmentOutcomePredictions.$inferInsert;
