/**
 * Business Intelligence Schema
 * 
 * Advanced analytics tables for comprehensive BI dashboards:
 * - Practice Pulse KPIs
 * - Financial & Sales Performance
 * - Operational & Staff Efficiency
 * - Patient & Clinical Insights
 */

import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, decimal, integer, boolean, index, text, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { companies, users, patients } from "./schema";

// ============================================
// Enums for BI
// ============================================

export const kpiCategoryEnum = pgEnum("kpi_category", [
  "financial",
  "operational",
  "clinical",
  "patient",
  "staff"
]);

export const trendDirectionEnum = pgEnum("trend_direction", [
  "up",
  "down",
  "stable"
]);

export const referralSourceEnum = pgEnum("referral_source", [
  "web",
  "doctor_referral",
  "walk_in",
  "insurance",
  "social_media",
  "advertising",
  "word_of_mouth",
  "other"
]);

// ============================================
// Practice Pulse Dashboard
// ============================================

/**
 * Daily Practice Metrics Snapshot
 * Captures daily KPIs for trend analysis
 */
export const dailyPracticeMetrics = pgTable("daily_practice_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  metricDate: timestamp("metric_date").notNull(),
  
  // Core Financial Metrics
  grossRevenue: decimal("gross_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  netRevenue: decimal("net_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  discountsGiven: decimal("discounts_given", { precision: 10, scale: 2 }).default("0").notNull(),
  refundsIssued: decimal("refunds_issued", { precision: 10, scale: 2 }).default("0").notNull(),
  
  // Patient Metrics
  totalPatientsSeen: integer("total_patients_seen").default(0).notNull(),
  newPatients: integer("new_patients").default(0).notNull(),
  returningPatients: integer("returning_patients").default(0).notNull(),
  
  // Appointment Metrics
  totalAppointments: integer("total_appointments").default(0).notNull(),
  completedAppointments: integer("completed_appointments").default(0).notNull(),
  cancelledAppointments: integer("cancelled_appointments").default(0).notNull(),
  noShowAppointments: integer("no_show_appointments").default(0).notNull(),
  
  // Sales Metrics
  totalTransactions: integer("total_transactions").default(0).notNull(),
  eyewearSalesCount: integer("eyewear_sales_count").default(0).notNull(),
  eyewearSalesRevenue: decimal("eyewear_sales_revenue", { precision: 10, scale: 2 }).default("0").notNull(),
  examRevenue: decimal("exam_revenue", { precision: 10, scale: 2 }).default("0").notNull(),
  
  // Calculated KPIs
  averageRevenuePerPatient: decimal("average_revenue_per_patient", { precision: 10, scale: 2 }).default("0"),
  noShowRate: decimal("no_show_rate", { precision: 5, scale: 4 }).default("0"), // 0-1 range
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 4 }).default("0"), // 0-1 range (exams to eyewear)
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_daily_metrics_company").on(table.companyId),
  index("idx_daily_metrics_date").on(table.metricDate),
]);

/**
 * Patient Lifetime Value Tracking
 * Tracks cumulative value and visit history per patient
 */
export const patientLifetimeValue = pgTable("patient_lifetime_value", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id, { onDelete: 'cascade' }).notNull().unique(),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  
  // Lifetime Metrics
  totalVisits: integer("total_visits").default(0).notNull(),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default("0").notNull(),
  averageOrderValue: decimal("average_order_value", { precision: 10, scale: 2 }).default("0"),
  lifetimeValue: decimal("lifetime_value", { precision: 12, scale: 2 }).default("0").notNull(),
  
  // Engagement Metrics
  firstVisitDate: timestamp("first_visit_date"),
  lastVisitDate: timestamp("last_visit_date"),
  daysSinceLastVisit: integer("days_since_last_visit"),
  expectedNextVisit: timestamp("expected_next_visit"),
  
  // Acquisition Info
  acquisitionDate: timestamp("acquisition_date"),
  referralSource: referralSourceEnum("referral_source"),
  acquisitionCost: decimal("acquisition_cost", { precision: 10, scale: 2 }),
  
  // Retention Flags
  isActive: boolean("is_active").default(true).notNull(),
  isAtRisk: boolean("is_at_risk").default(false).notNull(), // Haven't visited in expected timeframe
  churnedAt: timestamp("churned_at"),
  
  // Product Preferences
  preferredFrameBrand: varchar("preferred_frame_brand"),
  preferredLensType: varchar("preferred_lens_type"),
  purchaseHistory: jsonb("purchase_history").default('[]'), // Array of purchase summaries
  
  lastCalculated: timestamp("last_calculated").defaultNow().notNull(),
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_plv_patient").on(table.patientId),
  index("idx_plv_company").on(table.companyId),
  index("idx_plv_active").on(table.isActive),
  index("idx_plv_at_risk").on(table.isAtRisk),
]);

// ============================================
// Financial & Sales Performance
// ============================================

/**
 * Revenue Breakdown by Category
 * Detailed revenue categorization for analysis
 */
export const revenueBreakdown = pgTable("revenue_breakdown", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  periodType: varchar("period_type", { length: 20 }).notNull(), // 'daily', 'weekly', 'monthly', 'quarterly'
  
  // Revenue Categories
  framesRevenue: decimal("frames_revenue", { precision: 10, scale: 2 }).default("0").notNull(),
  lensesRevenue: decimal("lenses_revenue", { precision: 10, scale: 2 }).default("0").notNull(),
  coatingsRevenue: decimal("coatings_revenue", { precision: 10, scale: 2 }).default("0").notNull(),
  contactLensesRevenue: decimal("contact_lenses_revenue", { precision: 10, scale: 2 }).default("0").notNull(),
  examsRevenue: decimal("exams_revenue", { precision: 10, scale: 2 }).default("0").notNull(),
  servicesRevenue: decimal("services_revenue", { precision: 10, scale: 2 }).default("0").notNull(),
  otherRevenue: decimal("other_revenue", { precision: 10, scale: 2 }).default("0").notNull(),
  
  // Cost Analysis
  framesCogs: decimal("frames_cogs", { precision: 10, scale: 2 }).default("0").notNull(),
  lensesCogs: decimal("lenses_cogs", { precision: 10, scale: 2 }).default("0").notNull(),
  coatingsCogs: decimal("coatings_cogs", { precision: 10, scale: 2 }).default("0").notNull(),
  contactLensesCogs: decimal("contact_lenses_cogs", { precision: 10, scale: 2 }).default("0").notNull(),
  
  // Profitability
  grossProfit: decimal("gross_profit", { precision: 12, scale: 2 }).default("0").notNull(),
  grossProfitMargin: decimal("gross_profit_margin", { precision: 5, scale: 4 }).default("0"), // 0-1 range
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_revenue_breakdown_company").on(table.companyId),
  index("idx_revenue_breakdown_period").on(table.periodStart, table.periodEnd),
]);

/**
 * Staff Performance Metrics
 * Individual staff member productivity and sales
 */
export const staffPerformanceMetrics = pgTable("staff_performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  staffId: varchar("staff_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Sales Metrics
  totalSales: decimal("total_sales", { precision: 12, scale: 2 }).default("0").notNull(),
  totalTransactions: integer("total_transactions").default(0).notNull(),
  averageTransactionValue: decimal("average_transaction_value", { precision: 10, scale: 2 }).default("0"),
  
  // Productivity Metrics
  hoursWorked: decimal("hours_worked", { precision: 6, scale: 2 }),
  revenuePerHour: decimal("revenue_per_hour", { precision: 10, scale: 2 }),
  transactionsPerHour: decimal("transactions_per_hour", { precision: 6, scale: 2 }),
  
  // Upsell Performance
  upsellCount: integer("upsell_count").default(0).notNull(), // Add-ons sold (coatings, etc.)
  upsellRevenue: decimal("upsell_revenue", { precision: 10, scale: 2 }).default("0").notNull(),
  upsellRate: decimal("upsell_rate", { precision: 5, scale: 4 }).default("0"), // % of transactions with upsells
  
  // Discount Management
  discountsApplied: integer("discounts_applied").default(0).notNull(),
  totalDiscountAmount: decimal("total_discount_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  averageDiscountPercentage: decimal("average_discount_percentage", { precision: 5, scale: 2 }),
  
  // Customer Service
  refundsProcessed: integer("refunds_processed").default(0).notNull(),
  complaintsReceived: integer("complaints_received").default(0).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_staff_performance_company").on(table.companyId),
  index("idx_staff_performance_staff").on(table.staffId),
  index("idx_staff_performance_period").on(table.periodStart),
]);

/**
 * Payment Method Analysis
 * Track payment trends and cash flow
 */
export const paymentMethodAnalytics = pgTable("payment_method_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Payment Methods
  cashTransactions: integer("cash_transactions").default(0).notNull(),
  cashRevenue: decimal("cash_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  
  cardTransactions: integer("card_transactions").default(0).notNull(),
  cardRevenue: decimal("card_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  
  insuranceTransactions: integer("insurance_transactions").default(0).notNull(),
  insuranceRevenue: decimal("insurance_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  
  splitPaymentTransactions: integer("split_payment_transactions").default(0).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_payment_analytics_company").on(table.companyId),
  index("idx_payment_analytics_period").on(table.periodStart),
]);

// ============================================
// Operational & Staff Efficiency
// ============================================

/**
 * Inventory Performance Metrics
 * Track inventory turnover and product performance
 */
export const inventoryPerformanceMetrics = pgTable("inventory_performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Overall Metrics
  averageInventoryValue: decimal("average_inventory_value", { precision: 12, scale: 2 }).default("0").notNull(),
  costOfGoodsSold: decimal("cost_of_goods_sold", { precision: 12, scale: 2 }).default("0").notNull(),
  inventoryTurnoverRate: decimal("inventory_turnover_rate", { precision: 6, scale: 2 }).default("0"), // Times per period
  
  // Stock Health
  totalSKUs: integer("total_skus").default(0).notNull(),
  outOfStockEvents: integer("out_of_stock_events").default(0).notNull(),
  slowMovingItems: integer("slow_moving_items").default(0).notNull(), // Items with < 1 sale per quarter
  deadStockValue: decimal("dead_stock_value", { precision: 12, scale: 2 }).default("0"), // Items with no sales in 6+ months
  
  // Brand Performance (Top 10)
  topBrands: jsonb("top_brands").default('[]'), // [{ brand, sales, revenue, units }]
  topItems: jsonb("top_items").default('[]'), // [{ sku, name, sales, revenue, margin }]
  bottomItems: jsonb("bottom_items").default('[]'), // Items to consider discontinuing
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_inventory_performance_company").on(table.companyId),
  index("idx_inventory_performance_period").on(table.periodStart),
]);

/**
 * Insurance Claim Metrics
 * Track claim processing and rejection rates
 */
export const insuranceClaimMetrics = pgTable("insurance_claim_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Claim Volume
  totalClaims: integer("total_claims").default(0).notNull(),
  approvedClaims: integer("approved_claims").default(0).notNull(),
  rejectedClaims: integer("rejected_claims").default(0).notNull(),
  pendingClaims: integer("pending_claims").default(0).notNull(),
  
  // Financial Impact
  totalClaimValue: decimal("total_claim_value", { precision: 12, scale: 2 }).default("0").notNull(),
  approvedClaimValue: decimal("approved_claim_value", { precision: 12, scale: 2 }).default("0").notNull(),
  rejectedClaimValue: decimal("rejected_claim_value", { precision: 12, scale: 2 }).default("0").notNull(),
  
  // Performance Metrics
  averageProcessingTimeDays: decimal("average_processing_time_days", { precision: 6, scale: 2 }),
  rejectionRate: decimal("rejection_rate", { precision: 5, scale: 4 }).default("0"), // 0-1 range
  
  // Top Rejection Reasons
  rejectionReasons: jsonb("rejection_reasons").default('[]'), // [{ reason, count, value }]
  
  // Provider Performance
  topInsuranceProviders: jsonb("top_insurance_providers").default('[]'), // [{ provider, claims, value, approval_rate }]
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_insurance_metrics_company").on(table.companyId),
  index("idx_insurance_metrics_period").on(table.periodStart),
]);

// ============================================
// Patient & Clinical Insights
// ============================================

/**
 * Patient Acquisition Tracking
 * Track how patients find the practice
 */
export const patientAcquisition = pgTable("patient_acquisition", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Acquisition Channels
  referralSource: referralSourceEnum("referral_source").notNull(),
  newPatients: integer("new_patients").default(0).notNull(),
  
  // Cost & Value
  totalMarketingSpend: decimal("total_marketing_spend", { precision: 10, scale: 2 }),
  costPerAcquisition: decimal("cost_per_acquisition", { precision: 10, scale: 2 }),
  
  // First Visit Performance
  firstVisitRevenue: decimal("first_visit_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  averageFirstVisitValue: decimal("average_first_visit_value", { precision: 10, scale: 2 }),
  
  // Conversion
  patientsWithPurchase: integer("patients_with_purchase").default(0).notNull(),
  firstVisitConversionRate: decimal("first_visit_conversion_rate", { precision: 5, scale: 4 }), // % who buy on first visit
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_patient_acquisition_company").on(table.companyId),
  index("idx_patient_acquisition_period").on(table.periodStart),
  index("idx_patient_acquisition_source").on(table.referralSource),
]);

/**
 * Patient Retention Metrics
 * Track patient loyalty and return rates
 */
export const patientRetentionMetrics = pgTable("patient_retention_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  cohortMonth: timestamp("cohort_month").notNull(), // Month patients were acquired
  measurementMonth: timestamp("measurement_month").notNull(), // Month being measured
  
  // Cohort Data
  cohortSize: integer("cohort_size").notNull(), // Number of patients acquired in cohort month
  activePatients: integer("active_patients").notNull(), // Still active in measurement month
  churnedPatients: integer("churned_patients").notNull(),
  
  // Retention Metrics
  retentionRate: decimal("retention_rate", { precision: 5, scale: 4 }).notNull(), // % still active
  churnRate: decimal("churn_rate", { precision: 5, scale: 4 }).notNull(), // % who churned
  
  // Revenue Impact
  cohortRevenue: decimal("cohort_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  averageRevenuePerActivePatient: decimal("average_revenue_per_active_patient", { precision: 10, scale: 2 }),
  
  monthsFromAcquisition: integer("months_from_acquisition").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_retention_metrics_company").on(table.companyId),
  index("idx_retention_metrics_cohort").on(table.cohortMonth),
  index("idx_retention_metrics_measurement").on(table.measurementMonth),
]);

/**
 * Recall Effectiveness
 * Track appointment reminder and recall success
 */
export const recallEffectiveness = pgTable("recall_effectiveness", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Recall Campaigns
  recallsSent: integer("recalls_sent").default(0).notNull(),
  recallsOpened: integer("recalls_opened").default(0).notNull(),
  appointmentsBooked: integer("appointments_booked").default(0).notNull(),
  appointmentsCompleted: integer("appointments_completed").default(0).notNull(),
  
  // Effectiveness Metrics
  openRate: decimal("open_rate", { precision: 5, scale: 4 }).default("0"), // % opened
  bookingRate: decimal("booking_rate", { precision: 5, scale: 4 }).default("0"), // % who booked
  completionRate: decimal("completion_rate", { precision: 5, scale: 4 }).default("0"), // % who completed
  
  // Revenue Impact
  recallGeneratedRevenue: decimal("recall_generated_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  averageRecallValue: decimal("average_recall_value", { precision: 10, scale: 2 }),
  
  // Channel Performance
  emailRecalls: integer("email_recalls").default(0).notNull(),
  smsRecalls: integer("sms_recalls").default(0).notNull(),
  phoneRecalls: integer("phone_recalls").default(0).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_recall_effectiveness_company").on(table.companyId),
  index("idx_recall_effectiveness_period").on(table.periodStart),
]);

/**
 * Clinical Exam Type Analysis
 * Track mix of routine vs medical exams
 */
export const clinicalExamAnalytics = pgTable("clinical_exam_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Exam Types
  routineExams: integer("routine_exams").default(0).notNull(),
  routineExamsRevenue: decimal("routine_exams_revenue", { precision: 10, scale: 2 }).default("0").notNull(),
  
  medicalExams: integer("medical_exams").default(0).notNull(),
  medicalExamsRevenue: decimal("medical_exams_revenue", { precision: 10, scale: 2 }).default("0").notNull(),
  
  contactLensFittings: integer("contact_lens_fittings").default(0).notNull(),
  contactLensFittingsRevenue: decimal("contact_lens_fittings_revenue", { precision: 10, scale: 2 }).default("0").notNull(),
  
  // Ratios
  medicalToRoutineRatio: decimal("medical_to_routine_ratio", { precision: 5, scale: 2 }), // Higher value exams
  
  // Provider Productivity
  providerProductivity: jsonb("provider_productivity").default('[]'), // [{ providerId, exams, revenue, patientsPerHour }]
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_clinical_analytics_company").on(table.companyId),
  index("idx_clinical_analytics_period").on(table.periodStart),
]);

// ============================================
// Platform Admin Views (Multi-Tenant Aggregation)
// ============================================

/**
 * Platform-Wide Practice Performance
 * For platform admin to compare all practices
 */
export const platformPracticeComparison = pgTable("platform_practice_comparison", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  
  // Financial Performance
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  revenueGrowth: decimal("revenue_growth", { precision: 6, scale: 2 }), // % growth vs previous period
  
  // Patient Metrics
  totalPatients: integer("total_patients").default(0).notNull(),
  newPatients: integer("new_patients").default(0).notNull(),
  patientRetentionRate: decimal("patient_retention_rate", { precision: 5, scale: 4 }),
  
  // Operational Efficiency
  averageRevenuePerPatient: decimal("average_revenue_per_patient", { precision: 10, scale: 2 }),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 4 }),
  inventoryTurnover: decimal("inventory_turnover", { precision: 6, scale: 2 }),
  
  // Platform Usage
  activeUsers: integer("active_users").default(0).notNull(),
  totalTransactions: integer("total_transactions").default(0).notNull(),
  
  // Rankings (within platform)
  revenueRank: integer("revenue_rank"),
  growthRank: integer("growth_rank"),
  efficiencyRank: integer("efficiency_rank"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_platform_comparison_period").on(table.periodStart),
  index("idx_platform_comparison_company").on(table.companyId),
]);

// ============================================
// KPI Alerts & Thresholds
// ============================================

/**
 * KPI Alerts
 * Automated alerts when metrics fall outside expected ranges
 */
export const kpiAlerts = pgTable("kpi_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  
  kpiName: varchar("kpi_name", { length: 100 }).notNull(),
  kpiCategory: kpiCategoryEnum("kpi_category").notNull(),
  
  currentValue: decimal("current_value", { precision: 12, scale: 4 }).notNull(),
  thresholdValue: decimal("threshold_value", { precision: 12, scale: 4 }).notNull(),
  expectedValue: decimal("expected_value", { precision: 12, scale: 4 }),
  
  alertType: varchar("alert_type", { length: 50 }).notNull(), // 'above_threshold', 'below_threshold', 'anomaly'
  severity: varchar("severity", { length: 20 }).default("medium").notNull(), // 'low', 'medium', 'high', 'critical'
  
  message: text("message").notNull(),
  recommendation: text("recommendation"),
  
  isAcknowledged: boolean("is_acknowledged").default(false).notNull(),
  acknowledgedBy: varchar("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  
  isResolved: boolean("is_resolved").default(false).notNull(),
  resolvedAt: timestamp("resolved_at"),
  
  triggeredAt: timestamp("triggered_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_kpi_alerts_company").on(table.companyId),
  index("idx_kpi_alerts_severity").on(table.severity),
  index("idx_kpi_alerts_acknowledged").on(table.isAcknowledged),
  index("idx_kpi_alerts_triggered").on(table.triggeredAt),
]);

// Export all table types
export type DailyPracticeMetrics = typeof dailyPracticeMetrics.$inferSelect;
export type PatientLifetimeValue = typeof patientLifetimeValue.$inferSelect;
export type RevenueBreakdown = typeof revenueBreakdown.$inferSelect;
export type StaffPerformanceMetrics = typeof staffPerformanceMetrics.$inferSelect;
export type PaymentMethodAnalytics = typeof paymentMethodAnalytics.$inferSelect;
export type InventoryPerformanceMetrics = typeof inventoryPerformanceMetrics.$inferSelect;
export type InsuranceClaimMetrics = typeof insuranceClaimMetrics.$inferSelect;
export type PatientAcquisition = typeof patientAcquisition.$inferSelect;
export type PatientRetentionMetrics = typeof patientRetentionMetrics.$inferSelect;
export type RecallEffectiveness = typeof recallEffectiveness.$inferSelect;
export type ClinicalExamAnalytics = typeof clinicalExamAnalytics.$inferSelect;
export type PlatformPracticeComparison = typeof platformPracticeComparison.$inferSelect;
export type KpiAlert = typeof kpiAlerts.$inferSelect;
