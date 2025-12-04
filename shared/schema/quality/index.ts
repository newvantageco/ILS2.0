/**
 * Quality Measures Domain Schema
 *
 * Comprehensive quality measurement and performance tracking system for
 * healthcare quality measures, gap analysis, and star ratings.
 *
 * This domain handles:
 * - Quality measure definitions (HEDIS, MIPS, CQM, Star Ratings)
 * - Measure calculations and results tracking
 * - Medicare Star Ratings data and scoring
 * - Quality gap analyses and closure tracking
 * - Dashboard configurations for quality reporting
 * - Patient-level compliance and gap identification
 * - Performance targets and improvement tracking
 *
 * @module shared/schema/quality
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  pgEnum,
  integer,
  decimal,
  boolean,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { companies, users } from "../core/tables";
import { patients } from "../patients";

// ============================================
// QUALITY MEASURES ENUMS
// ============================================

/**
 * Quality measure type
 * Different types of healthcare quality measures
 */
export const measureTypeEnum = pgEnum("measure_type", [
  "HEDIS",
  "MIPS",
  "CQM",
  "Star_Rating",
  "Core_Measure",
  "Custom",
]);

/**
 * Quality measure domain
 * Different domains of quality measurement
 */
export const measureDomainEnum = pgEnum("measure_domain", [
  "effectiveness",
  "access",
  "experience",
  "utilization",
  "safety",
  "care_coordination",
]);

// ============================================
// QUALITY MEASURES
// ============================================

/**
 * Quality Measures
 * Definitions of quality measures (HEDIS, MIPS, CQM, etc.)
 */
export const qualityMeasures = pgTable(
  "quality_measures",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    companyId: varchar("company_id", { length: 255 })
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),

    // Measure Details
    measureId: varchar("measure_id", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: measureTypeEnum("type").notNull(),
    domain: measureDomainEnum("domain").notNull(),
    description: text("description").notNull(),

    // Criteria
    numeratorCriteria: text("numerator_criteria").notNull(),
    denominatorCriteria: text("denominator_criteria").notNull(),
    exclusionCriteria: text("exclusion_criteria"),

    // Target
    targetRate: decimal("target_rate", { precision: 5, scale: 2 }).notNull(),
    reportingYear: integer("reporting_year").notNull(),

    // Metadata
    active: boolean("active").default(true),
    evidenceSource: varchar("evidence_source", { length: 255 }).notNull(),
    steward: varchar("steward", { length: 255 }).notNull(),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("quality_measures_company_idx").on(table.companyId),
    index("quality_measures_type_idx").on(table.type),
    uniqueIndex("quality_measures_company_measure_year").on(
      table.companyId,
      table.measureId,
      table.reportingYear
    ),
  ]
);

// ============================================
// MEASURE CALCULATIONS
// ============================================

/**
 * Measure Calculations
 * Results of quality measure calculations
 */
export const measureCalculations = pgTable(
  "measure_calculations",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    measureId: varchar("measure_id", { length: 255 })
      .notNull()
      .references(() => qualityMeasures.id, { onDelete: "cascade" }),

    // Calculation Period
    calculationDate: timestamp("calculation_date").notNull(),
    reportingPeriodStart: date("reporting_period_start").notNull(),
    reportingPeriodEnd: date("reporting_period_end").notNull(),

    // Results
    numerator: integer("numerator").notNull(),
    denominator: integer("denominator").notNull(),
    exclusions: integer("exclusions").notNull().default(0),
    rate: decimal("rate", { precision: 5, scale: 2 }).notNull(),
    targetRate: decimal("target_rate", { precision: 5, scale: 2 }).notNull(),
    performanceGap: decimal("performance_gap", { precision: 5, scale: 2 }).notNull(),
    meetingTarget: boolean("meeting_target").notNull(),

    // Patient List (stored as JSONB)
    patientList: jsonb("patient_list")
      .notNull()
      .$type<
        Array<{
          patientId: string;
          inDenominator: boolean;
          inNumerator: boolean;
          excluded: boolean;
          exclusionReason?: string;
          complianceDate?: string;
          gapClosure?: {
            gapIdentified: boolean;
            gapClosureDate?: string;
            interventions: string[];
          };
        }>
      >(),

    // Calculated By
    calculatedBy: varchar("calculated_by", { length: 255 }).notNull(),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("measure_calculations_measure_idx").on(table.measureId),
    index("measure_calculations_date_idx").on(table.calculationDate),
  ]
);

// ============================================
// STAR RATINGS
// ============================================

/**
 * Star Ratings
 * Medicare Star Ratings data
 */
export const starRatings = pgTable(
  "star_ratings",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    companyId: varchar("company_id", { length: 255 })
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),

    // Rating Details
    contractId: varchar("contract_id", { length: 100 }).notNull(),
    measurementYear: integer("measurement_year").notNull(),
    partCRating: decimal("part_c_rating", { precision: 2, scale: 1 }).notNull(),
    partDRating: decimal("part_d_rating", { precision: 2, scale: 1 }).notNull(),
    overallRating: decimal("overall_rating", { precision: 2, scale: 1 }).notNull(),

    // Measures (stored as JSONB)
    measures: jsonb("measures")
      .notNull()
      .$type<
        Array<{
          measureId: string;
          measureName: string;
          domain: string;
          weight: number;
          score: number;
          stars: number;
          cut1: number;
          cut2: number;
          cut3: number;
          cut4: number;
          cut5: number;
        }>
      >(),

    // Status
    calculatedDate: timestamp("calculated_date").notNull(),
    published: boolean("published").default(false),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("star_ratings_company_idx").on(table.companyId),
    index("star_ratings_year_idx").on(table.measurementYear),
    uniqueIndex("star_ratings_contract_year").on(
      table.contractId,
      table.measurementYear
    ),
  ]
);

// ============================================
// QUALITY GAP ANALYSES
// ============================================

/**
 * Quality Gap Analyses
 * Gap analysis results for quality measures
 */
export const qualityGapAnalyses = pgTable(
  "quality_gap_analyses",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    measureId: varchar("measure_id", { length: 255 })
      .notNull()
      .references(() => qualityMeasures.id, { onDelete: "cascade" }),

    // Analysis Details
    analysisDate: timestamp("analysis_date").notNull(),
    totalGaps: integer("total_gaps").notNull(),
    closableGaps: integer("closable_gaps").notNull(),
    potentialRateImprovement: decimal("potential_rate_improvement", {
      precision: 5,
      scale: 2,
    }).notNull(),

    // Gaps By Reason (stored as JSONB)
    gapsByReason: jsonb("gaps_by_reason")
      .notNull()
      .$type<
        Array<{
          reason: string;
          count: number;
          percentage: number;
        }>
      >(),

    // Recommended Actions
    recommendedActions: jsonb("recommended_actions")
      .notNull()
      .$type<string[]>(),

    // Projected Impact
    projectedImpact: jsonb("projected_impact")
      .notNull()
      .$type<{
        currentRate: number;
        projectedRate: number;
        rateImprovement: number;
      }>(),

    // Created By
    createdBy: varchar("created_by", { length: 255 }).notNull(),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("quality_gap_analyses_measure_idx").on(table.measureId),
    index("quality_gap_analyses_date_idx").on(table.analysisDate),
  ]
);

// ============================================
// QUALITY DASHBOARDS
// ============================================

/**
 * Quality Dashboards
 * Dashboard configurations for quality measures
 */
export const qualityDashboards = pgTable(
  "quality_dashboards",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    companyId: varchar("company_id", { length: 255 })
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),

    // Dashboard Details
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),

    // Configuration
    measures: jsonb("measures").notNull().$type<string[]>(),
    filters: jsonb("filters").$type<{
      provider?: string;
      location?: string;
      payerType?: string;
      dateRange?: {
        start: string;
        end: string;
      };
    }>(),

    // Created By
    createdBy: varchar("created_by", { length: 255 }).notNull(),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("quality_dashboards_company_idx").on(table.companyId),
    index("quality_dashboards_created_by_idx").on(table.createdBy),
  ]
);

// ============================================
// ZOD SCHEMAS
// ============================================

export const insertQualityMeasureSchema = createInsertSchema(qualityMeasures);
export const insertMeasureCalculationSchema = createInsertSchema(measureCalculations);
export const insertStarRatingSchema = createInsertSchema(starRatings);
export const insertQualityGapAnalysisSchema = createInsertSchema(qualityGapAnalyses);
export const insertQualityDashboardSchema = createInsertSchema(qualityDashboards);

// ============================================
// TYPES
// ============================================

export type QualityMeasure = typeof qualityMeasures.$inferSelect;
export type InsertQualityMeasure = typeof qualityMeasures.$inferInsert;
export type MeasureCalculation = typeof measureCalculations.$inferSelect;
export type InsertMeasureCalculation = typeof measureCalculations.$inferInsert;
export type StarRating = typeof starRatings.$inferSelect;
export type InsertStarRating = typeof starRatings.$inferInsert;
export type QualityGapAnalysis = typeof qualityGapAnalyses.$inferSelect;
export type InsertQualityGapAnalysis = typeof qualityGapAnalyses.$inferInsert;
export type QualityDashboard = typeof qualityDashboards.$inferSelect;
export type InsertQualityDashboard = typeof qualityDashboards.$inferInsert;
