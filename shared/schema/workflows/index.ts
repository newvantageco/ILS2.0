/**
 * Engagement Workflows (Automation) Domain Schema
 *
 * Tables for workflow automation including:
 * - Workflow definitions with triggers, conditions, and actions
 * - Workflow execution tracking and instance management
 * - Run count tracking to prevent over-execution
 *
 * This domain manages automated patient engagement workflows with support for:
 * - Event-based triggers (appointments, test results, payments, birthdays, etc.)
 * - Conditional workflow execution based on patient attributes
 * - Multi-step workflow actions (send messages, wait, tag management, task creation)
 * - Branching logic for complex workflows
 * - Run limiting (run once, max runs per patient)
 * - Execution logging and error tracking
 * - Workflow statistics and performance metrics
 *
 * @module shared/schema/workflows
 */

import { pgTable, text, timestamp, jsonb, index, pgEnum, integer, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { companies } from "../core";
import { patients } from "../patients";

// ============================================
// WORKFLOW ENUMS
// ============================================

/**
 * Workflow trigger types
 * Defines the events that can trigger a workflow to execute
 */
export const workflowTriggerEnum = pgEnum("workflow_trigger", [
  "patient_registered",
  "appointment_scheduled",
  "appointment_reminder",
  "appointment_completed",
  "test_results_available",
  "prescription_expiring",
  "no_show",
  "missed_appointment",
  "payment_due",
  "payment_overdue",
  "birthday",
  "annual_checkup_due",
  "custom"
]);

/**
 * Workflow action types
 * Defines the actions that can be performed in workflow steps
 */
export const workflowActionTypeEnum = pgEnum("workflow_action_type", [
  "send_message",
  "wait",
  "add_tag",
  "remove_tag",
  "create_task",
  "branch"
]);

/**
 * Workflow status
 * Defines the lifecycle status of workflow definitions
 */
export const workflowStatusEnum = pgEnum("workflow_status", [
  "active",
  "paused",
  "archived"
]);

/**
 * Workflow instance status
 * Defines the execution status of individual workflow instances
 */
export const workflowInstanceStatusEnum = pgEnum("workflow_instance_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled"
]);

// ============================================
// WORKFLOWS
// ============================================

/**
 * Workflows Table
 * Stores workflow definitions for automated patient engagement
 *
 * A workflow is a reusable automation template that defines:
 * - When it should trigger (patient_registered, appointment_scheduled, etc.)
 * - What conditions must be met for execution
 * - What sequence of actions to perform
 * - How many times it can run per patient
 *
 * Workflows support complex multi-step automations with branching logic,
 * delays, message sending, tag management, and task creation.
 */
export const workflows = pgTable(
  "workflows",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    trigger: workflowTriggerEnum("trigger").notNull(),
    status: workflowStatusEnum("status").notNull().default("active"),

    // Conditions for workflow execution
    conditions: jsonb("conditions").$type<Array<{
      field: string;
      operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains';
      value: any;
    }>>(),

    // Workflow actions
    actions: jsonb("actions").notNull().$type<Array<{
      id: string;
      type: string;
      order: number;
      channel?: string;
      templateId?: string;
      variables?: Record<string, string>;
      delayDays?: number;
      delayHours?: number;
      tags?: string[];
      taskTitle?: string;
      taskAssigneeId?: string;
      condition?: {
        field: string;
        operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains';
        value: any;
      };
      trueActions?: any[];
      falseActions?: any[];
    }>>(),

    // Settings
    runOnce: boolean("run_once").notNull().default(false),
    maxRuns: integer("max_runs"),

    // Statistics
    totalRuns: integer("total_runs").notNull().default(0),
    totalCompleted: integer("total_completed").notNull().default(0),
    totalFailed: integer("total_failed").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("workflows_company_idx").on(table.companyId),
    triggerIdx: index("workflows_trigger_idx").on(table.trigger),
    statusIdx: index("workflows_status_idx").on(table.status),
  })
);

// ============================================
// WORKFLOW INSTANCES
// ============================================

/**
 * Workflow Instances Table
 * Stores individual workflow executions for patients
 *
 * Each time a workflow is triggered for a patient, a new workflow instance
 * is created to track its execution. The instance maintains:
 * - Current execution state and progress
 * - Complete execution log of all actions performed
 * - Error information if the workflow fails
 * - Timing data (started, completed, failed)
 *
 * The execution log provides a complete audit trail of workflow actions,
 * allowing debugging and analysis of workflow behavior.
 */
export const workflowInstances = pgTable(
  "workflow_instances",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    workflowId: text("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),

    triggerData: jsonb("trigger_data").notNull().$type<Record<string, any>>(),

    status: workflowInstanceStatusEnum("status").notNull().default("pending"),
    currentActionIndex: integer("current_action_index").notNull().default(0),

    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    error: text("error"),

    executionLog: jsonb("execution_log").notNull().$type<Array<{
      actionId: string;
      actionType: string;
      executedAt: Date;
      success: boolean;
      error?: string;
      result?: any;
    }>>().default([]),
  },
  (table) => ({
    companyIdx: index("workflow_instances_company_idx").on(table.companyId),
    workflowIdx: index("workflow_instances_workflow_idx").on(table.workflowId),
    patientIdx: index("workflow_instances_patient_idx").on(table.patientId),
    statusIdx: index("workflow_instances_status_idx").on(table.status),
    startedAtIdx: index("workflow_instances_started_at_idx").on(table.startedAt),
  })
);

// ============================================
// WORKFLOW RUN COUNTS
// ============================================

/**
 * Workflow Run Counts Table
 * Tracks how many times each workflow has run for each patient
 *
 * This table enforces workflow run limits by maintaining a counter of
 * how many times a workflow has executed for each patient. Used to:
 * - Prevent over-execution (respect maxRuns limit)
 * - Enforce runOnce behavior
 * - Track last execution time for rate limiting
 * - Provide analytics on workflow frequency per patient
 *
 * The unique constraint on (workflowId, patientId) ensures atomic
 * counter updates and prevents race conditions.
 */
export const workflowRunCounts = pgTable(
  "workflow_run_counts",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    workflowId: text("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    runCount: integer("run_count").notNull().default(0),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  },
  (table) => ({
    companyIdx: index("workflow_run_counts_company_idx").on(table.companyId),
    workflowPatientIdx: uniqueIndex("workflow_run_counts_workflow_patient_unique").on(
      table.workflowId,
      table.patientId
    ),
  })
);

// ============================================
// ZOD SCHEMAS
// ============================================

export const insertWorkflowSchema = createInsertSchema(workflows);
export const insertWorkflowInstanceSchema = createInsertSchema(workflowInstances);
export const insertWorkflowRunCountSchema = createInsertSchema(workflowRunCounts);

// ============================================
// TYPES
// ============================================

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;
export type WorkflowInstance = typeof workflowInstances.$inferSelect;
export type InsertWorkflowInstance = typeof workflowInstances.$inferInsert;
export type WorkflowRunCount = typeof workflowRunCounts.$inferSelect;
export type InsertWorkflowRunCount = typeof workflowRunCounts.$inferInsert;
