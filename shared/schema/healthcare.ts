/**
 * Healthcare Domain Schema
 * 
 * Normalized schema for healthcare-related tables including care plans,
 * goals, interventions, and patient care data.
 */

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, pgEnum, integer, decimal, numeric, real, boolean, date, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import core tables for foreign keys - using direct imports
import { companies, patients, users } from "../shared/schema";

// Enums
export const carePlanStatusEnum = pgEnum("care_plan_status", ["draft", "active", "completed", "on_hold", "cancelled"]);
export const carePlanCategoryEnum = pgEnum("care_plan_category", ["myopia_management", "vision_therapy", "post_surgery", "dry_eye", "glaucoma", "other"]);
export const goalStatusEnum = pgEnum("goal_status", ["not_started", "in_progress", "achieved", "on_hold", "cancelled"]);
export const interventionStatusEnum = pgEnum("intervention_status", ["scheduled", "in_progress", "completed", "cancelled"]);

// Core Care Plans table (simplified)
export const carePlans = pgTable(
  "care_plans",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    status: carePlanStatusEnum("status").notNull().default("draft"),
    category: carePlanCategoryEnum("category").notNull(),
    startDate: date("start_date").notNull(),
    targetDate: date("target_date").notNull(),
    completedDate: date("completed_date"),
    createdBy: varchar("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_care_plan_patient").on(table.patientId),
    index("idx_care_plan_company").on(table.companyId),
    index("idx_care_plan_status").on(table.status),
  ],
);

// Care Plan Goals (normalized from jsonb)
export const carePlanGoals = pgTable(
  "care_plan_goals",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    carePlanId: varchar("care_plan_id").notNull().references(() => carePlans.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    targetDate: date("target_date").notNull(),
    status: goalStatusEnum("status").notNull().default("not_started"),
    measurableOutcome: text("measurable_outcome").notNull(),
    targetValue: decimal("target_value", { precision: 10, scale: 2 }),
    currentValue: decimal("current_value", { precision: 10, scale: 2 }),
    unit: text("unit"), // e.g., "mm", "degrees", "score"
    achievedDate: date("achieved_date"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_care_plan_goal_plan").on(table.carePlanId),
    index("idx_care_plan_goal_status").on(table.status),
    index("idx_care_plan_goal_target_date").on(table.targetDate),
  ],
);

// Care Plan Interventions (normalized from jsonb)
export const carePlanInterventions = pgTable(
  "care_plan_interventions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    carePlanId: varchar("care_plan_id").notNull().references(() => carePlans.id, { onDelete: "cascade" }),
    goalId: varchar("goal_id").references(() => carePlanGoals.id, { onDelete: "cascade" }), // Optional link to specific goal
    type: text("type").notNull(), // e.g., "medication", "exercise", "follow_up", "lens_change"
    title: text("title").notNull(),
    description: text("description").notNull(),
    frequency: text("frequency"), // e.g., "daily", "weekly", "monthly"
    status: interventionStatusEnum("status").notNull().default("scheduled"),
    scheduledDate: date("scheduled_date"),
    completedDate: date("completed_date"),
    assignedTo: varchar("assigned_to").references(() => users.id), // Staff member responsible
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_care_plan_intervention_plan").on(table.carePlanId),
    index("idx_care_plan_intervention_goal").on(table.goalId),
    index("idx_care_plan_intervention_status").on(table.status),
    index("idx_care_plan_intervention_assigned").on(table.assignedTo),
  ],
);

// Care Team Members (normalized from jsonb)
export const careTeamMembers = pgTable(
  "care_team_members",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    carePlanId: varchar("care_plan_id").notNull().references(() => carePlans.id, { onDelete: "cascade" }),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // e.g., "optometrist", "therapist", "advisor"
    responsibilities: text("responsibilities"), // JSON array of specific responsibilities
    isActive: boolean("is_active").default(true).notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    leftAt: timestamp("left_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_care_team_plan").on(table.carePlanId),
    index("idx_care_team_user").on(table.userId),
    index("idx_care_team_active").on(table.isActive),
    uniqueIndex("idx_care_team_unique").on(table.carePlanId, table.userId),
  ],
);

// Risk Factors (normalized from jsonb)
export const riskFactors = pgTable(
  "risk_factors",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    category: text("category").notNull(), // e.g., "lifestyle", "hereditary", "environmental"
    factor: text("factor").notNull(), // e.g., "screen_time", "family_history", "uv_exposure"
    severity: text("severity").notNull(), // e.g., "low", "medium", "high"
    description: text("description"),
    identifiedDate: date("identified_date").notNull(),
    resolvedDate: date("resolved_date"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_risk_factor_patient").on(table.patientId),
    index("idx_risk_factor_category").on(table.category),
    index("idx_risk_factor_severity").on(table.severity),
  ],
);

// Zod schemas for validation
export const insertCarePlanSchema = createInsertSchema(carePlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCarePlanGoalSchema = createInsertSchema(carePlanGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCarePlanInterventionSchema = createInsertSchema(carePlanInterventions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCareTeamMemberSchema = createInsertSchema(careTeamMembers).omit({
  id: true,
  createdAt: true,
});

export const insertRiskFactorSchema = createInsertSchema(riskFactors).omit({
  id: true,
  createdAt: true,
});

// Types
export type CarePlan = z.infer<typeof insertCarePlanSchema>;
export type CarePlanGoal = z.infer<typeof insertCarePlanGoalSchema>;
export type CarePlanIntervention = z.infer<typeof insertCarePlanInterventionSchema>;
export type CareTeamMember = z.infer<typeof insertCareTeamMemberSchema>;
export type RiskFactor = z.infer<typeof insertRiskFactorSchema>;
