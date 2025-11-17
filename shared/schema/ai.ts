/**
 * AI Domain Schema
 * 
 * Normalized schema for AI-related tables including recommendations,
 * risk scores, and analytics data.
 */

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, pgEnum, integer, decimal, numeric, real, boolean, date, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import core tables for foreign keys - using direct imports
import { companies, patients, users, orders } from "../shared/schema";

// Enums
export const recommendationTypeEnum = pgEnum("recommendation_type", ["lens", "treatment", "lifestyle", "follow_up", "equipment"]);
export const recommendationTierEnum = pgEnum("recommendation_tier", ["good", "better", "best"]);
export const riskLevelEnum = pgEnum("risk_level", ["low", "medium", "high", "critical"]);
export const analyticsEventTypeEnum = pgEnum("analytics_event_type", [
  "order_created",
  "order_updated", 
  "quality_issue",
  "equipment_status",
  "material_usage",
  "return_created",
  "non_adapt_reported"
]);

// AI Dispensing Recommendations (simplified)
export const aiDispensingRecommendations = pgTable(
  "ai_dispensing_recommendations",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    modelVersion: text("model_version").notNull(),
    confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }).notNull(), // 0.00 to 1.00
    generatedAt: timestamp("generated_at").defaultNow().notNull(),
    appliedAt: timestamp("applied_at"), // When the recommendation was applied to the order
    feedback: text("feedback"), // User feedback on the recommendation
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_ai_recommendation_order").on(table.orderId),
    index("idx_ai_recommendation_patient").on(table.patientId),
    index("idx_ai_recommendation_confidence").on(table.confidenceScore),
  ],
);

// AI Recommendation Items (normalized from jsonb)
export const aiRecommendationItems = pgTable(
  "ai_recommendation_items",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    recommendationId: varchar("recommendation_id").notNull().references(() => aiDispensingRecommendations.id, { onDelete: "cascade" }),
    type: recommendationTypeEnum("type").notNull(),
    tier: recommendationTierEnum("tier").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    lensType: text("lens_type"),
    lensMaterial: text("lens_material"),
    coating: text("coating"),
    price: decimal("price", { precision: 10, scale: 2 }),
    estimatedComfortScore: decimal("estimated_comfort_score", { precision: 3, scale: 1 }), // 1.0 to 10.0
    estimatedVisualAcuity: decimal("estimated_visual_acuity", { precision: 3, scale: 1 }), // 1.0 to 10.0
    pros: text("pros"), // JSON array of benefits
    cons: text("cons"), // JSON array of drawbacks
    isSelected: boolean("is_selected").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_ai_recommendation_item_recommendation").on(table.recommendationId),
    index("idx_ai_recommendation_item_type").on(table.type),
    index("idx_ai_recommendation_item_tier").on(table.tier),
    index("idx_ai_recommendation_item_selected").on(table.isSelected),
  ],
);

// Risk Scores (simplified)
export const riskScores = pgTable(
  "risk_scores",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    category: text("category").notNull(), // e.g., "myopia_progression", "complication_risk", "non_compliance"
    overallScore: decimal("overall_score", { precision: 3, scale: 1 }).notNull(), // 0.0 to 10.0
    riskLevel: riskLevelEnum("risk_level").notNull(),
    modelVersion: text("model_version").notNull(),
    assessedAt: timestamp("assessed_at").defaultNow().notNull(),
    nextAssessmentDue: timestamp("next_assessment_due"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_risk_score_patient").on(table.patientId),
    index("idx_risk_score_category").on(table.category),
    index("idx_risk_score_level").on(table.riskLevel),
    index("idx_risk_score_assessed").on(table.assessedAt),
  ],
);

// Risk Score Factors (normalized from jsonb)
export const riskScoreFactors = pgTable(
  "risk_score_factors",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    riskScoreId: varchar("risk_score_id").notNull().references(() => riskScores.id, { onDelete: "cascade" }),
    factor: text("factor").notNull(), // e.g., "age", "family_history", "screen_time", "current_prescription"
    weight: decimal("weight", { precision: 3, scale: 2 }).notNull(), // How much this factor contributes (0.00 to 1.00)
    value: text("value").notNull(), // The actual value (e.g., "12 years", "4 hours/day", "-2.50 sphere")
    impact: text("impact").notNull(), // Description of how this factor impacts risk
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_risk_factor_score").on(table.riskScoreId),
    index("idx_risk_factor_weight").on(table.weight),
  ],
);

// PDSA Cycles (simplified)
export const pdsaCycles = pgTable(
  "pdsa_cycles",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    objective: text("objective").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    status: text("status").notNull().default("planned"), // planned, active, completed, cancelled
    createdBy: varchar("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_pdsa_patient").on(table.patientId),
    index("idx_pdsa_status").on(table.status),
    index("idx_pdsa_dates").on(table.startDate, table.endDate),
  ],
);

// PDSA Plan Steps (normalized from jsonb)
export const pdsaPlanSteps = pgTable(
  "pdsa_plan_steps",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    cycleId: varchar("cycle_id").notNull().references(() => pdsaCycles.id, { onDelete: "cascade" }),
    stepNumber: integer("step_number").notNull(),
    description: text("description").notNull(),
    action: text("action").notNull(),
    measurement: text("measurement"), // How to measure success
    target: text("target"), // Target value or outcome
    actual: text("actual"), // Actual result
    completedAt: timestamp("completed_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_pdsa_step_cycle").on(table.cycleId),
    index("idx_pdsa_step_number").on(table.stepNumber),
    uniqueIndex("idx_pdsa_step_unique").on(table.cycleId, table.stepNumber),
  ],
);

// Analytics Events
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    companyId: varchar("company_id").references(() => companies.id, { onDelete: "cascade" }),
    userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
    patientId: varchar("patient_id").references(() => patients.id, { onDelete: "cascade" }),
    orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }),
    eventType: analyticsEventTypeEnum("event_type").notNull(),
    eventData: jsonb("event_data"), // Additional event-specific data
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    sessionId: varchar("session_id"),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
  },
  (table) => [
    index("idx_analytics_company").on(table.companyId),
    index("idx_analytics_user").on(table.userId),
    index("idx_analytics_patient").on(table.patientId),
    index("idx_analytics_event_type").on(table.eventType),
    index("idx_analytics_timestamp").on(table.timestamp),
  ],
);

// Zod schemas for validation
export const insertAiDispensingRecommendationSchema = createInsertSchema(aiDispensingRecommendations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiRecommendationItemSchema = createInsertSchema(aiRecommendationItems).omit({
  id: true,
  createdAt: true,
});

export const insertRiskScoreSchema = createInsertSchema(riskScores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRiskScoreFactorSchema = createInsertSchema(riskScoreFactors).omit({
  id: true,
  createdAt: true,
});

export const insertPdsaCycleSchema = createInsertSchema(pdsaCycles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPdsaPlanStepSchema = createInsertSchema(pdsaPlanSteps).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
});

// Types
export type AiDispensingRecommendation = z.infer<typeof insertAiDispensingRecommendationSchema>;
export type AiRecommendationItem = z.infer<typeof insertAiRecommendationItemSchema>;
export type RiskScore = z.infer<typeof insertRiskScoreSchema>;
export type RiskScoreFactor = z.infer<typeof insertRiskScoreFactorSchema>;
export type PdsaCycle = z.infer<typeof insertPdsaCycleSchema>;
export type PdsaPlanStep = z.infer<typeof insertPdsaPlanStepSchema>;
export type AnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
