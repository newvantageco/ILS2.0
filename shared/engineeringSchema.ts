import { pgTable, varchar, timestamp, jsonb, text, boolean, integer, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Root Cause Analysis (RCA) records
export const rcaRecords = pgTable('rca_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title').notNull(),
  description: text('description').notNull(),
  category: varchar('category').notNull(), // e.g., 'quality', 'process', 'equipment'
  severity: integer('severity').notNull(), // 1-5 scale
  status: varchar('status').notNull().default('open'),
  assignedTo: varchar('assigned_to').notNull(),
  discoveredBy: varchar('discovered_by').notNull(),
  discoveredAt: timestamp('discovered_at').notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at'),
  resolution: text('resolution'),
  rootCauses: jsonb('root_causes').notNull(), // Array of identified causes
  correctiveActions: jsonb('corrective_actions').notNull(), // Array of actions taken
  preventiveMeasures: jsonb('preventive_measures').notNull(), // Array of measures to prevent recurrence
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// QA Failure Records
export const qaFailures = pgTable('qa_failures', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: varchar('order_id').notNull(),
  productType: varchar('product_type').notNull(),
  failureType: varchar('failure_type').notNull(),
  severity: integer('severity').notNull(), // 1-5 scale
  description: text('description').notNull(),
  detectedBy: varchar('detected_by').notNull(),
  detectedAt: timestamp('detected_at').notNull().defaultNow(),
  stage: varchar('stage').notNull(), // e.g., 'production', 'final-qa', 'packaging'
  impactedComponents: jsonb('impacted_components').notNull(),
  remedialAction: text('remedial_action'),
  isReworkable: boolean('is_reworkable').notNull(),
  reworkInstructions: text('rework_instructions'),
  linkedRcaId: varchar('linked_rca_id').references(() => rcaRecords.id),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Engineering KPIs
export const engineeringKpis = pgTable('engineering_kpis', {
  id: uuid('id').primaryKey().defaultRandom(),
  category: varchar('category').notNull(), // e.g., 'quality', 'efficiency', 'process'
  metric: varchar('metric').notNull(),
  value: jsonb('value').notNull(), // Flexible storage for different metric types
  unit: varchar('unit').notNull(),
  period: varchar('period').notNull(), // e.g., 'daily', 'weekly', 'monthly'
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Process Control Points
export const controlPoints = pgTable('control_points', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  process: varchar('process').notNull(),
  description: text('description').notNull(),
  parameters: jsonb('parameters').notNull(), // Control parameters and limits
  isActive: boolean('is_active').notNull().default(true),
  alertThresholds: jsonb('alert_thresholds').notNull(),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Process Measurements
export const measurements = pgTable('measurements', {
  id: uuid('id').primaryKey().defaultRandom(),
  controlPointId: varchar('control_point_id').references(() => controlPoints.id),
  value: jsonb('value').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  operator: varchar('operator').notNull(),
  equipment: varchar('equipment'),
  isWithinLimits: boolean('is_within_limits').notNull(),
  deviationNotes: text('deviation_notes'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Zod Schemas for validation
export const insertRcaSchema = createInsertSchema(rcaRecords);
export const selectRcaSchema = createSelectSchema(rcaRecords);

export const insertQaFailureSchema = createInsertSchema(qaFailures);
export const selectQaFailureSchema = createSelectSchema(qaFailures);

export const insertKpiSchema = createInsertSchema(engineeringKpis);
export const selectKpiSchema = createSelectSchema(engineeringKpis);

export const insertControlPointSchema = createInsertSchema(controlPoints);
export const selectControlPointSchema = createSelectSchema(controlPoints);

export const insertMeasurementSchema = createInsertSchema(measurements);
export const selectMeasurementSchema = createSelectSchema(measurements);