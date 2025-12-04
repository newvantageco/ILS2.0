/**
 * Care Coordination Domain Schema
 *
 * This module defines schemas for comprehensive care coordination:
 * - Care teams (multi-disciplinary coordination)
 * - Care gaps (quality measure gaps identification)
 * - Transitions of care (hospital-to-home, SNF transitions, medication reconciliation)
 * - Care coordination tasks (workflow management)
 * - Patient outreach (engagement tracking)
 *
 * Note: carePlans table is in the healthcare domain schema
 *
 * @module shared/schema/carecoordination
 */

import { pgTable, pgEnum, text, timestamp, boolean, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { companies } from "../core";
import { patients } from "../patients";
import { carePlans } from "../healthcare";

// ============================================
// ENUMS
// ============================================

/**
 * Care Coordination Enums
 */
export const carePlanStatusEnum = pgEnum("care_plan_status", ["draft", "active", "on_hold", "completed", "cancelled"]);
export const carePlanCategoryEnum = pgEnum("care_plan_category", ["chronic_disease", "preventive", "transitional", "behavioral_health", "other"]);
export const careGoalStatusEnum = pgEnum("care_goal_status", ["not_started", "in_progress", "achieved", "not_achieved", "cancelled"]);
export const careInterventionTypeEnum = pgEnum("care_intervention_type", ["education", "medication", "monitoring", "lifestyle", "referral", "therapy", "other"]);
export const careInterventionStatusEnum = pgEnum("care_intervention_status", ["planned", "active", "completed", "cancelled"]);
export const reviewFrequencyEnum = pgEnum("review_frequency", ["weekly", "biweekly", "monthly", "quarterly"]);
export const careTeamStatusEnum = pgEnum("care_team_status", ["active", "inactive"]);
export const careTeamMemberStatusEnum = pgEnum("care_team_member_status", ["active", "inactive"]);
export const careGapCategoryEnum = pgEnum("care_gap_category", ["preventive", "chronic_care", "medication", "screening", "follow_up"]);
export const careGapSeverityEnum = pgEnum("care_gap_severity", ["low", "medium", "high", "critical"]);
export const careGapStatusEnum = pgEnum("care_gap_status", ["open", "in_progress", "closed", "not_applicable"]);
export const transitionTypeEnum = pgEnum("transition_type", ["hospital_to_home", "hospital_to_snf", "snf_to_home", "er_to_home", "specialist_referral", "other"]);
export const transitionStatusEnum = pgEnum("transition_status", ["planned", "in_progress", "completed", "failed"]);
export const medicationActionEnum = pgEnum("medication_action", ["continue", "new", "discontinued", "changed"]);
export const coordinationTaskTypeEnum = pgEnum("coordination_task_type", ["outreach", "follow_up", "assessment", "referral", "education", "coordination", "other"]);
export const coordinationTaskPriorityEnum = pgEnum("coordination_task_priority", ["low", "medium", "high", "urgent"]);
export const coordinationTaskStatusEnum = pgEnum("coordination_task_status", ["pending", "in_progress", "completed", "cancelled"]);
export const outreachTypeEnum = pgEnum("outreach_type", ["phone", "email", "sms", "mail", "in_person", "portal"]);
export const outreachStatusEnum = pgEnum("outreach_status", ["scheduled", "attempted", "completed", "failed", "cancelled"]);
export const outreachContactResultEnum = pgEnum("outreach_contact_result", ["successful", "no_answer", "left_message", "wrong_number", "declined"]);

// ============================================
// TABLES
// ============================================

/**
 * Care Teams Table
 * Multi-disciplinary care teams for patients
 */
export const careTeams = pgTable(
  "care_teams",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    members: jsonb("members").notNull().$type<Array<{
      id: string;
      userId: string;
      name: string;
      role: string;
      specialty?: string;
      isPrimary: boolean;
      responsibilities: string[];
      contactInfo: {
        phone?: string;
        email?: string;
        extension?: string;
      };
      joinedDate: string;
      status: string;
    }>>(),
    status: careTeamStatusEnum("status").notNull().default("active"),
    primaryContact: text("primary_contact"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("care_teams_company_idx").on(table.companyId),
    patientIdx: index("care_teams_patient_idx").on(table.patientId),
    statusIdx: index("care_teams_status_idx").on(table.status),
  })
);

/**
 * Care Gaps Table
 * Identified gaps in patient care requiring attention
 */
export const careGaps = pgTable(
  "care_gaps",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    gapType: text("gap_type").notNull(),
    category: careGapCategoryEnum("category").notNull(),
    description: text("description").notNull(),
    severity: careGapSeverityEnum("severity").notNull(),
    status: careGapStatusEnum("status").notNull().default("open"),
    identifiedDate: timestamp("identified_date", { withTimezone: true }).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    closedDate: timestamp("closed_date", { withTimezone: true }),
    recommendations: jsonb("recommendations").notNull().$type<string[]>(),
    assignedTo: text("assigned_to"),
    evidence: text("evidence").notNull(),
    measure: text("measure"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("care_gaps_company_idx").on(table.companyId),
    patientIdx: index("care_gaps_patient_idx").on(table.patientId),
    categoryIdx: index("care_gaps_category_idx").on(table.category),
    severityIdx: index("care_gaps_severity_idx").on(table.severity),
    statusIdx: index("care_gaps_status_idx").on(table.status),
    dueDateIdx: index("care_gaps_due_date_idx").on(table.dueDate),
  })
);

/**
 * Transitions of Care Table
 * Tracks patient transitions between care settings
 */
export const transitionsOfCare = pgTable(
  "transitions_of_care",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    transitionType: transitionTypeEnum("transition_type").notNull(),
    fromLocation: text("from_location").notNull(),
    toLocation: text("to_location").notNull(),
    status: transitionStatusEnum("status").notNull().default("planned"),
    dischargeDate: timestamp("discharge_date", { withTimezone: true }),
    admissionDate: timestamp("admission_date", { withTimezone: true }),
    followUpRequired: boolean("follow_up_required").notNull().default(false),
    followUpDate: timestamp("follow_up_date", { withTimezone: true }),
    followUpCompleted: boolean("follow_up_completed").notNull().default(false),
    medications: jsonb("medications").notNull().$type<Array<{
      medicationId: string;
      medicationName: string;
      action: string;
      previousDose?: string;
      newDose?: string;
      reason?: string;
      reconciledBy: string;
      reconciledDate: string;
    }>>(),
    careInstructions: jsonb("care_instructions").notNull().$type<string[]>(),
    riskFactors: jsonb("risk_factors").notNull().$type<string[]>(),
    responsibleProvider: text("responsible_provider"),
    coordinatedBy: text("coordinated_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("transitions_company_idx").on(table.companyId),
    patientIdx: index("transitions_patient_idx").on(table.patientId),
    typeIdx: index("transitions_type_idx").on(table.transitionType),
    statusIdx: index("transitions_status_idx").on(table.status),
    followUpIdx: index("transitions_follow_up_idx").on(table.followUpDate),
  })
);

/**
 * Care Coordination Tasks Table
 * Tasks for care coordination workflow
 */
export const careCoordinationTasks = pgTable(
  "care_coordination_tasks",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    carePlanId: text("care_plan_id").references(() => carePlans.id, { onDelete: "cascade" }),
    transitionId: text("transition_id").references(() => transitionsOfCare.id, { onDelete: "cascade" }),
    gapId: text("gap_id").references(() => careGaps.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    type: coordinationTaskTypeEnum("type").notNull(),
    priority: coordinationTaskPriorityEnum("priority").notNull(),
    status: coordinationTaskStatusEnum("status").notNull().default("pending"),
    assignedTo: text("assigned_to"),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    completedDate: timestamp("completed_date", { withTimezone: true }),
    completedBy: text("completed_by"),
    notes: text("notes").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("coordination_tasks_company_idx").on(table.companyId),
    patientIdx: index("coordination_tasks_patient_idx").on(table.patientId),
    carePlanIdx: index("coordination_tasks_care_plan_idx").on(table.carePlanId),
    statusIdx: index("coordination_tasks_status_idx").on(table.status),
    priorityIdx: index("coordination_tasks_priority_idx").on(table.priority),
    dueDateIdx: index("coordination_tasks_due_date_idx").on(table.dueDate),
    assignedToIdx: index("coordination_tasks_assigned_to_idx").on(table.assignedTo),
  })
);

/**
 * Patient Outreach Table
 * Tracks patient outreach attempts and outcomes
 */
export const patientOutreach = pgTable(
  "patient_outreach",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    taskId: text("task_id").references(() => careCoordinationTasks.id, { onDelete: "set null" }),
    outreachType: outreachTypeEnum("outreach_type").notNull(),
    purpose: text("purpose").notNull(),
    status: outreachStatusEnum("status").notNull().default("scheduled"),
    scheduledDate: timestamp("scheduled_date", { withTimezone: true }),
    attemptedDate: timestamp("attempted_date", { withTimezone: true }),
    completedDate: timestamp("completed_date", { withTimezone: true }),
    contactResult: outreachContactResultEnum("contact_result"),
    notes: text("notes").notNull(),
    nextSteps: jsonb("next_steps").notNull().$type<string[]>(),
    performedBy: text("performed_by"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("patient_outreach_company_idx").on(table.companyId),
    patientIdx: index("patient_outreach_patient_idx").on(table.patientId),
    taskIdx: index("patient_outreach_task_idx").on(table.taskId),
    statusIdx: index("patient_outreach_status_idx").on(table.status),
    scheduledDateIdx: index("patient_outreach_scheduled_date_idx").on(table.scheduledDate),
    typeIdx: index("patient_outreach_type_idx").on(table.outreachType),
  })
);

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

export const insertCareTeamSchema = createInsertSchema(careTeams);
export const insertCareGapSchema = createInsertSchema(careGaps);
export const insertTransitionOfCareSchema = createInsertSchema(transitionsOfCare);
export const insertCareCoordinationTaskSchema = createInsertSchema(careCoordinationTasks);
export const insertPatientOutreachSchema = createInsertSchema(patientOutreach);

// ============================================
// TYPESCRIPT TYPES
// ============================================

export type CareTeam = typeof careTeams.$inferSelect;
export type InsertCareTeam = typeof careTeams.$inferInsert;
export type CareGap = typeof careGaps.$inferSelect;
export type InsertCareGap = typeof careGaps.$inferInsert;
export type TransitionOfCare = typeof transitionsOfCare.$inferSelect;
export type InsertTransitionOfCare = typeof transitionsOfCare.$inferInsert;
export type CareCoordinationTask = typeof careCoordinationTasks.$inferSelect;
export type InsertCareCoordinationTask = typeof careCoordinationTasks.$inferInsert;
export type PatientOutreach = typeof patientOutreach.$inferSelect;
export type InsertPatientOutreach = typeof patientOutreach.$inferInsert;
