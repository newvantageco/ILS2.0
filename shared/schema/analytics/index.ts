/**
 * Analytics Domain Schema
 *
 * Tables for analytics and reporting including:
 * - Analytics events
 * - Audit logs (HIPAA compliance)
 * - Quality tracking
 * - User feedback and NPS
 * - SaaS metrics (MRR, churn, cohorts)
 * - Customer health scores
 *
 * @module shared/schema/analytics
 */

import { pgTable, text, varchar, timestamp, jsonb, index, pgEnum, integer, decimal, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { roleEnum } from "../core/enums";

// ============================================
// ANALYTICS ENUMS
// ============================================

export const analyticsEventTypeEnum = pgEnum("analytics_event_type", [
  "order_created",
  "order_updated",
  "quality_issue",
  "equipment_status",
  "material_usage",
  "return_created",
]);

export const qualityIssueTypeEnum = pgEnum("quality_issue_type", [
  "surface_defect",
  "coating_defect",
  "measurement_error",
  "material_defect",
  "processing_error",
  "other"
]);

export const auditEventTypeEnum = pgEnum("audit_event_type", [
  // Standard CRUD operations
  "access",
  "create",
  "read",
  "update",
  "delete",
  // Authentication events
  "login",
  "logout",
  "auth_attempt",
  "mfa_verify",
  "password_change",
  "password_reset",
  "session_expired",
  // Authorization events
  "permission_change",
  "role_change",
  "access_denied",
  // Data operations
  "export",
  "print",
  "download",
  "upload",
  "share",
  // PHI-specific events (HIPAA)
  "phi_access",
  "phi_export",
  "phi_print",
  "phi_share",
  // Security events
  "security_alert",
  "suspicious_activity",
  "rate_limit_exceeded",
  "ip_blocked"
]);

export const feedbackTypeEnum = pgEnum("feedback_type", [
  "general",
  "feature",
  "bug",
  "improvement"
]);

export const feedbackStatusEnum = pgEnum("feedback_status", [
  "new",
  "reviewed",
  "in_progress",
  "resolved",
  "ignored"
]);

export const npsCategoryEnum = pgEnum("nps_category", [
  "promoter",
  "passive",
  "detractor"
]);

// ============================================
// ANALYTICS EVENTS
// ============================================

export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: analyticsEventTypeEnum("event_type").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  sourceId: varchar("source_id").notNull(),
  sourceType: varchar("source_type").notNull(),
  data: jsonb("data").notNull(),
  metadata: jsonb("metadata"),
  organizationId: varchar("organization_id").notNull(),
}, (table) => [
  index("idx_analytics_events_type").on(table.eventType),
  index("idx_analytics_events_org").on(table.organizationId),
  index("idx_analytics_events_timestamp").on(table.timestamp),
]);

// ============================================
// QUALITY ISSUES
// ============================================

export const qualityIssues = pgTable("quality_issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueType: qualityIssueTypeEnum("issue_type").notNull(),
  orderId: varchar("order_id").notNull(),
  description: text("description").notNull(),
  severity: integer("severity").notNull(),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  detectedBy: varchar("detected_by").notNull(),
  status: varchar("status").notNull().default("open"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by"),
  rootCause: text("root_cause"),
  preventiveActions: text("preventive_actions"),
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_quality_issues_order").on(table.orderId),
  index("idx_quality_issues_status").on(table.status),
  index("idx_quality_issues_type").on(table.issueType),
]);

// ============================================
// RETURNS
// ============================================

export const returns = pgTable("returns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  returnReason: varchar("return_reason").notNull(),
  returnType: varchar("return_type").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").notNull(),
  status: varchar("status").notNull().default("pending"),
  processingNotes: text("processing_notes"),
  replacementOrderId: varchar("replacement_order_id"),
  qualityIssueId: varchar("quality_issue_id"),
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_returns_order").on(table.orderId),
  index("idx_returns_status").on(table.status),
]);

// ============================================
// AUDIT LOGS (HIPAA COMPLIANCE)
// ============================================

// FEATURE USAGE METRICS
// ============================================

export const featureUsageMetrics = pgTable("feature_usage_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  featureName: varchar("feature_name").notNull(),
  usageCount: integer("usage_count").default(0),
  activeUsers: integer("active_users").default(0),
  lastUsedAt: timestamp("last_used_at"),
  tier: varchar("tier", { length: 50 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_feature_usage_company").on(table.companyId),
  index("idx_feature_usage_name").on(table.featureName),
  index("idx_feature_usage_tier").on(table.tier),
  uniqueIndex("idx_feature_usage_unique").on(table.companyId, table.featureName),
]);

// ============================================
// CUSTOMER HEALTH SCORES
// ============================================

export const customerHealthScores = pgTable("customer_health_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),

  // Core health metrics (0-100)
  overallScore: integer("overall_score").notNull(),
  engagementScore: integer("engagement_score").notNull(),
  adoptionScore: integer("adoption_score").notNull(),
  satisfactionScore: integer("satisfaction_score").notNull(),

  // Trend data
  scoreHistory: jsonb("score_history"),
  trend: varchar("trend", { length: 20 }),
  riskLevel: varchar("risk_level", { length: 20 }),

  // Last calculated
  lastCalculatedAt: timestamp("last_calculated_at"),
  calculatedBy: varchar("calculated_by"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_health_scores_company").on(table.companyId),
  index("idx_health_scores_risk").on(table.riskLevel),
]);

// ============================================
// CHURN PREDICTIONS
// ============================================

export const churnPredictions = pgTable("churn_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),

  // Prediction data
  churnProbability: decimal("churn_probability", { precision: 5, scale: 4 }),
  riskFactors: jsonb("risk_factors"),
  recommendedActions: jsonb("recommended_actions"),

  // Prediction details
  modelVersion: varchar("model_version"),
  predictionScore: integer("prediction_score"),
  predictedChurnDate: timestamp("predicted_churn_date"),

  // Tracking
  isPredictionAccurate: boolean("is_prediction_accurate"),
  actualChurnDate: timestamp("actual_churn_date"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_churn_predictions_company").on(table.companyId),
  index("idx_churn_predictions_probability").on(table.churnProbability),
  index("idx_churn_predictions_risk").on(table.predictedChurnDate),
]);

// ============================================
// CUSTOMER ACQUISITION SOURCES
// ============================================

export const customerAcquisitionSources = pgTable("customer_acquisition_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),

  // Source details
  source: varchar("source").notNull(),
  campaign: varchar("campaign"),
  medium: varchar("medium"),
  content: varchar("content"),

  // Attribution data
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).default("0"),
  customersAcquired: integer("customers_acquired").default(0),
  revenueGenerated: decimal("revenue_generated", { precision: 14, scale: 2 }).default("0"),

  // Lifecycle metrics
  avgLifetimeValue: decimal("avg_lifetime_value", { precision: 12, scale: 2 }),
  avgMonthlyRetention: decimal("avg_monthly_retention", { precision: 5, scale: 4 }),
  avgChurnRate: decimal("avg_churn_rate", { precision: 5, scale: 4 }),

  // ROI calculations
  cac: decimal("cac", { precision: 10, scale: 2 }),
  roi: decimal("roi", { precision: 8, scale: 4 }),

  period: varchar("period"),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_acq_source_company").on(table.companyId),
  index("idx_acq_source_name").on(table.source),
  index("idx_acq_source_period").on(table.periodStart),
]);

// ============================================
// CUSTOMER COHORTS
// ============================================

export const customerCohorts = pgTable("customer_cohorts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),

  // Cohort definition
  cohortName: varchar("cohort_name").notNull(),
  cohortPeriod: varchar("cohort_period").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),

  // Size and segment
  totalCustomers: integer("total_customers").notNull(),
  segment: varchar("segment"),

  // Retention curve (month 0-12)
  month0Retention: decimal("month_0_retention", { precision: 5, scale: 2 }),
  month1Retention: decimal("month_1_retention", { precision: 5, scale: 2 }),
  month2Retention: decimal("month_2_retention", { precision: 5, scale: 2 }),
  month3Retention: decimal("month_3_retention", { precision: 5, scale: 2 }),
  month4Retention: decimal("month_4_retention", { precision: 5, scale: 2 }),
  month5Retention: decimal("month_5_retention", { precision: 5, scale: 2 }),
  month6Retention: decimal("month_6_retention", { precision: 5, scale: 2 }),
  month7Retention: decimal("month_7_retention", { precision: 5, scale: 2 }),
  month8Retention: decimal("month_8_retention", { precision: 5, scale: 2 }),
  month9Retention: decimal("month_9_retention", { precision: 5, scale: 2 }),
  month10Retention: decimal("month_10_retention", { precision: 5, scale: 2 }),
  month11Retention: decimal("month_11_retention", { precision: 5, scale: 2 }),
  month12Retention: decimal("month_12_retention", { precision: 5, scale: 2 }),

  // Analysis
  avgRetentionRate: decimal("avg_retention_rate", { precision: 5, scale: 2 }),
  lifetimeRetention: decimal("lifetime_retention", { precision: 5, scale: 2 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_cohorts_company").on(table.companyId),
  index("idx_cohorts_period").on(table.periodStart),
  index("idx_cohorts_segment").on(table.segment),
]);

// ============================================
// USAGE EVENTS
// ============================================

export const usageEvents = pgTable("usage_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  userId: varchar("user_id"),

  // Event details
  eventType: varchar("event_type").notNull(),
  eventName: varchar("event_name").notNull(),

  // Event data
  properties: jsonb("properties"),
  metadata: jsonb("metadata"),

  // Revenue impact
  revenueImpact: decimal("revenue_impact", { precision: 12, scale: 2 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_usage_events_company").on(table.companyId),
  index("idx_usage_events_type").on(table.eventType),
  index("idx_usage_events_user").on(table.userId),
  index("idx_usage_events_created").on(table.createdAt),
]);

// ============================================
// MONTHLY RECURRING REVENUE
// ============================================

export const monthlyRecurringRevenue = pgTable("monthly_recurring_revenue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),

  // Period
  year: integer("year").notNull(),
  month: integer("month").notNull(),

  // Revenue breakdown by tier
  breakdown: jsonb("breakdown"),

  // Totals
  totalMRR: decimal("total_mrr", { precision: 14, scale: 2 }).notNull(),
  arr: decimal("arr", { precision: 14, scale: 2 }).notNull(),

  // Movement metrics
  newMRR: decimal("new_mrr", { precision: 14, scale: 2 }),
  expansionMRR: decimal("expansion_mrr", { precision: 14, scale: 2 }),
  contractionMRR: decimal("contraction_mrr", { precision: 14, scale: 2 }),
  churnMRR: decimal("churn_mrr", { precision: 14, scale: 2 }),

  // Growth rate
  momGrowth: decimal("mom_growth", { precision: 8, scale: 4 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_mrr_company").on(table.companyId),
  index("idx_mrr_period").on(table.year, table.month),
  uniqueIndex("idx_mrr_unique").on(table.companyId, table.year, table.month),
]);

// ============================================
// USER FEEDBACK
// ============================================

export const feedback = pgTable("feedback", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"),
  type: feedbackTypeEnum("type").notNull(),
  message: text("message").notNull(),
  contactEmail: text("contact_email"),
  context: text("context"),
  userAgent: text("user_agent"),
  status: feedbackStatusEnum("status").notNull().default("new"),
  adminNotes: text("admin_notes"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedBy: text("resolved_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("feedback_user_id_idx").on(table.userId),
  index("feedback_type_idx").on(table.type),
  index("feedback_status_idx").on(table.status),
  index("feedback_created_at_idx").on(table.createdAt),
]);

// ============================================
// NPS SURVEYS
// ============================================

export const npsSurveys = pgTable("nps_surveys", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  score: integer("score").notNull(),
  category: npsCategoryEnum("category").notNull(),
  feedback: text("feedback"),
  trigger: text("trigger"),
  context: text("context"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("nps_user_id_idx").on(table.userId),
  index("nps_category_idx").on(table.category),
  index("nps_score_idx").on(table.score),
  index("nps_created_at_idx").on(table.createdAt),
  index("nps_trigger_idx").on(table.trigger),
]);

// ============================================
// ZOD SCHEMAS
// ============================================

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents);
export const insertQualityIssueSchema = createInsertSchema(qualityIssues);
export const insertReturnSchema = createInsertSchema(returns);
export const insertFeatureUsageMetricSchema = createInsertSchema(featureUsageMetrics);
export const insertCustomerHealthScoreSchema = createInsertSchema(customerHealthScores);
export const insertChurnPredictionSchema = createInsertSchema(churnPredictions);
export const insertCustomerAcquisitionSourceSchema = createInsertSchema(customerAcquisitionSources);
export const insertCustomerCohortSchema = createInsertSchema(customerCohorts);
export const insertUsageEventSchema = createInsertSchema(usageEvents);
export const insertMonthlyRecurringRevenueSchema = createInsertSchema(monthlyRecurringRevenue);
export const insertFeedbackSchema = createInsertSchema(feedback);
export const insertNPSSurveySchema = createInsertSchema(npsSurveys);

// ============================================
// TYPES
// ============================================

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;
export type QualityIssue = typeof qualityIssues.$inferSelect;
export type InsertQualityIssue = typeof qualityIssues.$inferInsert;
export type Return = typeof returns.$inferSelect;
export type InsertReturn = typeof returns.$inferInsert;
export type FeatureUsageMetric = typeof featureUsageMetrics.$inferSelect;
export type InsertFeatureUsageMetric = typeof featureUsageMetrics.$inferInsert;
export type CustomerHealthScore = typeof customerHealthScores.$inferSelect;
export type InsertCustomerHealthScore = typeof customerHealthScores.$inferInsert;
export type ChurnPrediction = typeof churnPredictions.$inferSelect;
export type InsertChurnPrediction = typeof churnPredictions.$inferInsert;
export type CustomerAcquisitionSource = typeof customerAcquisitionSources.$inferSelect;
export type InsertCustomerAcquisitionSource = typeof customerAcquisitionSources.$inferInsert;
export type CustomerCohort = typeof customerCohorts.$inferSelect;
export type InsertCustomerCohort = typeof customerCohorts.$inferInsert;
export type UsageEvent = typeof usageEvents.$inferSelect;
export type InsertUsageEvent = typeof usageEvents.$inferInsert;
export type MonthlyRecurringRevenue = typeof monthlyRecurringRevenue.$inferSelect;
export type InsertMonthlyRecurringRevenue = typeof monthlyRecurringRevenue.$inferInsert;
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = typeof feedback.$inferInsert;
export type NPSSurvey = typeof npsSurveys.$inferSelect;
export type InsertNPSSurvey = typeof npsSurveys.$inferInsert;
