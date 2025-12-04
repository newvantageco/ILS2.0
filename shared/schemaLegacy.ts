import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, pgEnum, integer, decimal, numeric, real, boolean, date, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { vector } from "./schema-pgvector";
import { riskLevelEnum } from "./schema/populationhealth";

// Enums
/* DUPLICATE - Moved to core domain */
// export const roleEnum = pgEnum("role", ["ecp", "admin", "lab_tech", "engineer", "supplier", "platform_admin", "company_admin", "dispenser", "store_manager"]);
export const subscriptionPlanEnum = pgEnum("subscription_plan", ["free", "pro", "premium", "enterprise", "full", "free_ecp"]); // Legacy: full, free_ecp

// Session storage table for Replit Auth
/* DUPLICATE - Moved to modular schema
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    userId: varchar("user_id").references(() => users.id).notNull(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [
    index("IDX_session_expire").on(table.expire),
    index("IDX_session_user").on(table.userId),
  ],
); */

export const accountStatusEnum = pgEnum("account_status", ["pending", "active", "suspended"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "in_production",
  "quality_check",
  "shipped",
  "completed",
  "on_hold",
  "cancelled"
]);

export const analyticsEventTypeEnum = pgEnum("analytics_event_type", [
  "order_created",
  "order_updated",
  "quality_issue",
  "equipment_status",
  "material_usage",
  "return_created",
  "non_adapt_reported"
]);

// Appointment Scheduling Enums
/* DUPLICATE - appointmentStatusEnum moved to appointments domain */
// export const appointmentStatusEnum = pgEnum("appointment_status", [
//   "scheduled",
//   "confirmed",
//   "in_progress",
//   "completed",
//   "cancelled",
//   "no_show",
//   "rescheduled"
// ]);

/* DUPLICATE - appointmentTypeEnum moved to appointments domain */
// export const appointmentTypeEnum = pgEnum("appointment_type", [
//   "eye_examination",
//   "contact_lens_fitting",
//   "frame_selection",
//   "follow_up",
//   "emergency",
//   "consultation",
//   "test_room_booking",
//   "dispensing",
//   "collection"
// ]);

/* DUPLICATE - reminderTypeEnum moved to appointments domain */
// export const reminderTypeEnum = pgEnum("reminder_type", [
//   "email",
//   "sms",
//   "phone",
//   "push_notification",
//   "automated_call"
// ]);

/* DUPLICATE - resourceTypeEnum moved to appointments domain */
// export const resourceTypeEnum = pgEnum("resource_type", [
//   "test_room",
//   "equipment",
//   "practitioner",
//   "room",
//   "specialist"
// ]);

export const emailTypeEnum = pgEnum("email_type", [
  "invoice",
  "receipt",
  "prescription_reminder",
  "recall_notification",
  "appointment_reminder",
  "order_confirmation",
  "order_update",
  "marketing",
  "general"
]);

export const emailStatusEnum = pgEnum("email_status", [
  "queued",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "failed",
  "spam"
]);

export const emailEventTypeEnum = pgEnum("email_event_type", [
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "spam",
  "unsubscribed"
]);

export const qualityIssueTypeEnum = pgEnum("quality_issue_type", [
  "surface_defect",
  "coating_defect",
  "measurement_error",
  "material_defect",
  "processing_error",
  "other"
]);

// Tables for Analytics and Quality Control
// ========== RCM (Revenue Cycle Management) Enums ==========

/**
 * Insurance claim status
 * Tracks the lifecycle of insurance claims from draft to payment
 */
export const claimStatusEnum = pgEnum("claim_status", [
  "draft",
  "ready_to_submit",
  "submitted",
  "pending",
  "accepted",
  "rejected",
  "partially_paid",
  "paid",
  "denied",
  "appealed",
  "voided"
]);

/**
 * Insurance claim type
 * Different types of healthcare claims
 */
export const claimTypeEnum = pgEnum("claim_type", [
  "professional",
  "institutional",
  "pharmacy",
  "dental",
  "vision"
]);

/**
 * Service place of service
 * Where the service was rendered
 */
export const servicePlaceEnum = pgEnum("service_place", [
  "office",
  "hospital_outpatient",
  "hospital_inpatient",
  "emergency",
  "telehealth",
  "home",
  "nursing_facility",
  "assisted_living"
]);

/**
 * Insurance payer type
 * Different types of insurance payers
 */
export const payerTypeEnum = pgEnum("payer_type", [
  "commercial",
  "medicare",
  "medicaid",
  "tricare",
  "workers_comp",
  "self_pay",
  "other"
]);

/**
 * Claim submission method
 * How claims are submitted to payers
 */
export const claimSubmissionMethodEnum = pgEnum("claim_submission_method", [
  "electronic",
  "paper",
  "clearinghouse",
  "portal"
]);

/**
 * Batch submission status
 * Status of claim submission batches
 */
export const batchStatusEnum = pgEnum("batch_status", [
  "processing",
  "completed",
  "failed"
]);

/**
 * Appeal status
 * Status of claim appeals
 */
export const appealStatusEnum = pgEnum("appeal_status", [
  "submitted",
  "pending",
  "approved",
  "denied"
]);

// ========== End RCM Enums ==========

// ========== Quality Measures Enums ==========

export const measureTypeEnum = pgEnum("measure_type", [
  "HEDIS",
  "MIPS",
  "CQM",
  "Star_Rating",
  "Core_Measure",
  "Custom"
]);

export const measureDomainEnum = pgEnum("measure_domain", [
  "effectiveness",
  "access",
  "experience",
  "utilization",
  "safety",
  "care_coordination"
]);

// ========== End Quality Measures Enums ==========

/* DUPLICATE - Moved to modular schema
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: analyticsEventTypeEnum("event_type").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  sourceId: varchar("source_id").notNull(),
  sourceType: varchar("source_type").notNull(),
  data: jsonb("data").notNull(),
  metadata: jsonb("metadata"),
  organizationId: varchar("organization_id").notNull(),
}); */

/* DUPLICATE - Moved to modular schema
export const qualityIssues = pgTable("quality_issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueType: qualityIssueTypeEnum("issue_type").notNull(),
  orderId: varchar("order_id")
    .references(() => orders.id)
    .notNull(),
  description: text("description").notNull(),
  severity: integer("severity").notNull(),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  detectedBy: varchar("detected_by")
    .references(() => users.id)
    .notNull(),
  status: varchar("status").notNull().default("open"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  rootCause: text("root_cause"),
  preventiveActions: text("preventive_actions"),
  metadata: jsonb("metadata"),
}); */

/* DUPLICATE - Moved to modular schema
export const returns = pgTable("returns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id")
    .references(() => orders.id)
    .notNull(),
  returnReason: varchar("return_reason").notNull(),
  returnType: varchar("return_type").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by")
    .references(() => users.id)
    .notNull(),
  status: varchar("status").notNull().default("pending"),
  processingNotes: text("processing_notes"),
  replacementOrderId: varchar("replacement_order_id").references(() => orders.id),
  qualityIssueId: varchar("quality_issue_id").references(() => qualityIssues.id),
  metadata: jsonb("metadata"),
}); */

export const createReturnSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  returnReason: z.string().min(1, "Return reason is required"),
  returnType: z.string().min(1, "Return type is required"),
  description: z.string().min(1, "Description is required"),
  createdBy: z.string().min(1, "Creator ID is required"),
  processingNotes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateReturnStatusSchema = z.object({
  status: z.string().min(1, "Status is required"),
  processingNotes: z.string().optional(),
});

export const nonAdapts = pgTable("non_adapts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id")
    .references(() => orders.id)
    .notNull(),
  reportedBy: varchar("reported_by")
    .references(() => users.id)
    .notNull(),
  patientFeedback: text("patient_feedback").notNull(),
  symptoms: jsonb("symptoms").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolution: text("resolution"),
  resolutionType: varchar("resolution_type"),
  resolvedAt: timestamp("resolved_at"),
  qualityIssueId: varchar("quality_issue_id").references(() => qualityIssues.id),
  replacementOrderId: varchar("replacement_order_id").references(() => orders.id),
  metadata: jsonb("metadata"),
});

export const createNonAdaptSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  reportedBy: z.string().min(1, "Reporter ID is required"),
  patientFeedback: z.string().min(1, "Patient feedback is required"),
  symptoms: z.array(z.string()).nonempty("At least one symptom is required"),
  resolution: z.string().optional(),
  resolutionType: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateNonAdaptStatusSchema = z.object({
  resolution: z.string().optional(),
  resolutionType: z.string().optional(),
});

export const poStatusEnum = pgEnum("po_status", [
  "draft",
  "sent",
  "acknowledged",
  "in_transit",
  "delivered",
  "cancelled"
]);

export const documentTypeEnum = pgEnum("document_type", [
  "spec_sheet",
  "certificate",
  "sds",
  "compliance",
  "other"
]);

export const consultPriorityEnum = pgEnum("consult_priority", [
  "normal",
  "high",
  "urgent"
]);

export const examinationStatusEnum = pgEnum("examination_status", [
  "in_progress",
  "finalized"
]);

// Equipment and maintenance related enums
export const equipmentStatusEnum = pgEnum("equipment_status", [
  "operational",
  "maintenance",
  "repair",
  "offline"
]);

export const maintenanceTypeEnum = pgEnum("maintenance_type", [
  "routine",
  "repair",
  "upgrade",
  "emergency"
]);

// Equipment management tables
export const equipment = pgTable("equipment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  testRoomId: varchar("test_room_id").references(() => testRooms.id, { onDelete: 'set null' }),
  name: varchar("name", { length: 200 }).notNull(),
  manufacturer: varchar("manufacturer", { length: 150 }),
  model: varchar("model", { length: 150 }),
  serialNumber: varchar("serial_number", { length: 100 }).notNull(),
  status: equipmentStatusEnum("status").notNull().default("operational"),
  purchaseDate: timestamp("purchase_date"),
  lastCalibrationDate: timestamp("last_calibration_date"),
  nextCalibrationDate: timestamp("next_calibration_date"),
  calibrationFrequencyDays: integer("calibration_frequency_days").default(365),
  lastMaintenance: timestamp("last_maintenance"),
  nextMaintenance: timestamp("next_maintenance"),
  specifications: jsonb("specifications"),
  notes: text("notes"),
  location: varchar("location"),
  warrantyExpiration: timestamp("warranty_expiration"),
  maintenanceHistory: jsonb("maintenance_history").default('[]'),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_equipment_company").on(table.companyId),
  index("idx_equipment_test_room").on(table.testRoomId),
  index("idx_equipment_status").on(table.status),
  index("idx_equipment_next_calibration").on(table.nextCalibrationDate),
]);

// Notification system table is defined below with proper types

/* DUPLICATE - Moved to modular schema
export const orderTimeline = pgTable("order_timeline", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  status: varchar("status").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  metadata: jsonb("metadata"),
}); */

// DICOM tables
export const dicomReadings = pgTable(
  "dicom_readings",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    examinationId: varchar("examination_id").references(() => eyeExaminations.id).notNull(),
    studyInstanceUID: varchar("study_instance_uid").notNull(),
    seriesInstanceUID: varchar("series_instance_uid").notNull(),
    imageInstanceUID: varchar("image_instance_uid").notNull(),
    modality: varchar("modality").notNull(),
    equipmentId: varchar("equipment_id").references(() => equipment.id).notNull(),
    manufacturer: varchar("manufacturer"),
    modelName: varchar("model_name"),
    measurements: jsonb("measurements"),
    rawData: text("raw_data").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_dicom_readings_examination").on(table.examinationId),
    index("idx_dicom_readings_equipment").on(table.equipmentId)
  ]
);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "paid",
  "void"
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "card",
  "mixed"
]);

export const productTypeEnum = pgEnum("product_type", [
  "frame",
  "contact_lens",
  "solution",
  "service"
]);

// Notification Enums
export const notificationTypeEnum = pgEnum("notification_type", [
  "info",
  "warning",
  "error",
  "success",
]);

export const notificationSeverityEnum = pgEnum("notification_severity", [
  "low",
  "medium",
  "high",
]);

export const notificationTargetTypeEnum = pgEnum("notification_target_type", [
  "user",
  "role",
  "organization",
]);

// Notification Table
/* DUPLICATE - Moved to modular schema
export const notifications = pgTable(
  "notifications",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    severity: notificationSeverityEnum("severity").notNull(),
    target: jsonb("target").notNull(),
    read: boolean("read").default(false).notNull(),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_notifications_created_at").on(table.createdAt)],
); */

// ============== MULTI-TENANT COMPANY SYSTEM ==============

export const companyTypeEnum = pgEnum("company_type", [
  "ecp", // Eye Care Professional practice
  "lab", // Lens manufacturing lab
  "supplier", // Material/equipment supplier
  "hybrid" // Multiple capabilities
]);

export const companyStatusEnum = pgEnum("company_status", [
  "active",
  "suspended",
  "pending_approval",
  "deactivated"
]);

// Companies/Organizations table for multi-tenancy
/* DUPLICATE - Moved to modular schema (core domain)
/* DUPLICATE - Moved to modular schema
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: companyTypeEnum("type").notNull(),
  status: companyStatusEnum("status").notNull().default("pending_approval"),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  website: varchar("website"),
  address: jsonb("address"),
  
  // Registration details
  registrationNumber: varchar("registration_number"), // Company registration
  gocNumber: varchar("goc_number"), // GOC number for ECPs
  taxId: varchar("tax_id"),
  
  // Subscription and billing
  subscriptionPlan: subscriptionPlanEnum("subscription_plan").notNull().default("free_ecp"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  billingEmail: varchar("billing_email"),
  
  // Stripe integration
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  stripeSubscriptionStatus: varchar("stripe_subscription_status", { length: 50 }),
  stripeCurrentPeriodEnd: timestamp("stripe_current_period_end"),
  freeTrialEndDate: timestamp("free_trial_end_date"),
  subscriptionCancelledAt: timestamp("subscription_cancelled_at"),
  isSubscriptionExempt: boolean("is_subscription_exempt").default(false), // Master admin created
  
  // Branding
  companyLogoUrl: text("company_logo_url"),
  companyLetterheadUrl: text("company_letterhead_url"),
  brandingSettings: jsonb("branding_settings").default(sql`'{
    "primaryColor": "#0f172a",
    "secondaryColor": "#3b82f6",
    "logoPosition": "top-left",
    "showGocNumber": true,
    "includeAftercare": true,
    "dispenseSlipFooter": ""
  }'::jsonb`),
  
  // Settings and preferences
  settings: jsonb("settings").default(sql`'{}'::jsonb`),
  preferences: jsonb("preferences").default(sql`'{}'::jsonb`),
  
  // AI settings
  aiEnabled: boolean("ai_enabled").default(true),
  aiModel: varchar("ai_model").default("gpt-4"),
  useExternalAi: boolean("use_external_ai").default(true), // Initially uses external, learns over time
  aiLearningProgress: integer("ai_learning_progress").default(0), // 0-100%
  
  // Shopify Integration
  shopifyEnabled: boolean("shopify_enabled").default(false),
  shopifyShopUrl: varchar("shopify_shop_url"), // e.g., mystore.myshopify.com
  shopifyShopName: varchar("shopify_shop_name"), // Short name (e.g., mystore)
  shopifyAccessToken: varchar("shopify_access_token"), // Encrypted in production
  shopifyWebhookSecret: varchar("shopify_webhook_secret"), // For HMAC verification
  shopifyApiVersion: varchar("shopify_api_version").default("2024-10"),
  shopifyAutoSync: boolean("shopify_auto_sync").default(false), // Auto-sync customers as patients
  shopifyLastSyncAt: timestamp("shopify_last_sync_at"),
  shopifySyncSettings: jsonb("shopify_sync_settings").default(sql`'{}'::jsonb`), // Sync preferences
  
  // GOC Practice Details
  practiceGocNumber: varchar("practice_goc_number", { length: 50 }),
  practiceType: varchar("practice_type", { length: 50 }), // 'independent', 'multiple', 'hospital', 'domiciliary'
  primaryPractitionerName: varchar("primary_practitioner_name", { length: 255 }),
  primaryPractitionerGoc: varchar("primary_practitioner_goc", { length: 50 }),
  emergencyContactName: varchar("emergency_contact_name", { length: 255 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 50 }),
  outOfHoursContact: text("out_of_hours_contact"),
  insuranceProvider: varchar("insurance_provider", { length: 255 }),
  insurancePolicyNumber: varchar("insurance_policy_number", { length: 100 }),
  insuranceExpiryDate: timestamp("insurance_expiry_date"),
  hasEcpAccess: boolean("has_ecp_access").default(false),
  hasLabAccess: boolean("has_lab_access").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  
  // Timestamp tracking
  createdBy: varchar("created_by", { length: 255 }),
  updatedBy: varchar("updated_by", { length: 255 }),
  changeHistory: jsonb("change_history").default(sql`'[]'::jsonb`),
}, (table) => [
  index("idx_companies_status").on(table.status),
  index("idx_companies_type").on(table.type),
  index("idx_companies_stripe_customer").on(table.stripeCustomerId),
  index("idx_companies_stripe_subscription").on(table.stripeSubscriptionId),
]); */

// Subscription Plans table
/* DUPLICATE - Moved to modular schema
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 150 }).notNull(),
  description: text("description"),
  priceMonthlyGbp: decimal("price_monthly_gbp", { precision: 10, scale: 2 }),
  priceYearlyGbp: decimal("price_yearly_gbp", { precision: 10, scale: 2 }),
  stripePriceIdMonthly: varchar("stripe_price_id_monthly", { length: 255 }),
  stripePriceIdYearly: varchar("stripe_price_id_yearly", { length: 255 }),
  features: jsonb("features"),
  maxUsers: integer("max_users"),
  maxOrdersPerMonth: integer("max_orders_per_month"),
  aiEnabled: boolean("ai_enabled").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}); */

// Stripe Payment Intents table
/* DUPLICATE - Moved to modular schema
export const stripePaymentIntents = pgTable("stripe_payment_intents", {
  id: varchar("id", { length: 255 }).primaryKey(),
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: 'cascade' }),
  amount: integer("amount").notNull(), // Amount in pence/cents
  currency: varchar("currency", { length: 3 }).default("GBP"),
  status: varchar("status", { length: 50 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 255 }),
  customerId: varchar("customer_id", { length: 255 }),
  subscriptionId: varchar("subscription_id", { length: 255 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_payment_intents_company").on(table.companyId),
  index("idx_payment_intents_subscription").on(table.subscriptionId),
]); */

// Subscription History table
/* DUPLICATE - Moved to modular schema
export const subscriptionHistory = pgTable("subscription_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: 'cascade' }),
  eventType: varchar("event_type", { length: 100 }).notNull(), // created, updated, cancelled, expired, trial_ended
  oldPlan: varchar("old_plan", { length: 50 }),
  newPlan: varchar("new_plan", { length: 50 }),
  changedBy: varchar("changed_by", { length: 255 }).references(() => users.id),
  reason: text("reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_subscription_history_company").on(table.companyId),
  index("idx_subscription_history_event").on(table.eventType),
]); */

// Dispense Records table (audit trail)
export const dispenseRecords = pgTable("dispense_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id", { length: 255 }).notNull().references(() => orders.id, { onDelete: 'cascade' }),
  prescriptionId: varchar("prescription_id", { length: 255 }).references(() => prescriptions.id),
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: 'cascade' }),
  patientId: varchar("patient_id", { length: 255 }).notNull().references(() => patients.id),
  dispensedByUserId: varchar("dispensed_by_user_id", { length: 255 }).notNull().references(() => users.id),
  dispenserName: varchar("dispenser_name", { length: 255 }).notNull(),
  dispenserGocNumber: varchar("dispenser_goc_number", { length: 50 }),
  dispenseDate: timestamp("dispense_date").defaultNow().notNull(),
  printedAt: timestamp("printed_at"),
  patientSignature: text("patient_signature"), // Base64 encoded
  dispenserSignature: text("dispenser_signature"), // Base64 encoded
  specialInstructions: text("special_instructions"),
  aftercareProvided: boolean("aftercare_provided").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),

  // Import Tracking (for migrated records)
  externalId: varchar("external_id", { length: 255 }),
  importSource: varchar("import_source", { length: 100 }),
  importJobId: varchar("import_job_id", { length: 255 }),
  importedAt: timestamp("imported_at"),
}, (table) => [
  index("idx_dispense_records_order").on(table.orderId),
  index("idx_dispense_records_company").on(table.companyId),
  index("idx_dispense_records_patient").on(table.patientId),
]);

// Supplier approval/relationship table
export const companySupplierRelationships = pgTable("company_supplier_relationships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  supplierId: varchar("supplier_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_company_supplier_company").on(table.companyId),
  index("idx_company_supplier_supplier").on(table.supplierId),
]);

// ============== AI ASSISTANT SYSTEM ==============

export const aiConversationStatusEnum = pgEnum("ai_conversation_status", [
  "active",
  "resolved",
  "archived"
]);

export const aiMessageRoleEnum = pgEnum("ai_message_role", [
  "user",
  "assistant",
  "system"
]);

// AI Conversations - chat sessions with the AI assistant
/* DUPLICATE - Moved to modular schema
export const aiConversations = pgTable("ai_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  status: aiConversationStatusEnum("status").notNull().default("active"),
  context: jsonb("context"), // Store context about the conversation
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_conversations_company").on(table.companyId),
  index("idx_ai_conversations_user").on(table.userId),
]); */

// AI Messages - individual messages in conversations
/* DUPLICATE - Moved to modular schema
export const aiMessages = pgTable("ai_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => aiConversations.id, { onDelete: 'cascade' }),
  role: aiMessageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  usedExternalAi: boolean("used_external_ai").default(true), // Track if external AI was used
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // AI confidence score 0-1
  metadata: jsonb("metadata"), // Store tokens used, model version, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_messages_conversation").on(table.conversationId),
]); */

// AI Knowledge Base - documents and data uploaded by companies
/* DUPLICATE - Moved to modular schema
export const aiKnowledgeBase = pgTable("ai_knowledge_base", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  
  // Document details
  filename: text("filename").notNull(),
  fileType: varchar("file_type").notNull(), // pdf, docx, csv, json, etc.
  fileSize: integer("file_size"), // bytes
  fileUrl: text("file_url"), // Storage URL
  
  // Processed content
  content: text("content"), // Extracted text content
  summary: text("summary"), // AI-generated summary
  tags: jsonb("tags"), // Extracted tags/keywords

  // Embeddings (both formats during migration)
  embeddings: jsonb("embeddings"), // Legacy: JSONB format (will be deprecated)
  embedding: vector("embedding", 1536), // NEW: pgvector format for semantic search

  // Metadata
  category: varchar("category"), // pricing, procedures, policies, etc.
  isActive: boolean("is_active").default(true),
  processingStatus: varchar("processing_status").default("pending"), // pending, processing, completed, failed
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_knowledge_company").on(table.companyId),
  index("idx_ai_knowledge_category").on(table.category),
]); */

// AI Learning Data - track what the AI learns over time
/* DUPLICATE - Moved to modular schema
export const aiLearningData = pgTable("ai_learning_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Learning source
  sourceType: varchar("source_type").notNull(), // conversation, document, feedback, manual
  sourceId: varchar("source_id"), // Reference to source
  
  // Learned information
  question: text("question"),
  answer: text("answer"),
  context: jsonb("context"),
  category: varchar("category"),
  
  // Quality metrics
  useCount: integer("use_count").default(0), // How many times this learning was used
  successRate: decimal("success_rate", { precision: 3, scale: 2 }).default("1.00"), // User feedback
  lastUsed: timestamp("last_used"),
  
  // Confidence and validation
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.50"),
  isValidated: boolean("is_validated").default(false),
  validatedBy: varchar("validated_by").references(() => users.id),
  validatedAt: timestamp("validated_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_learning_company").on(table.companyId),
  index("idx_ai_learning_category").on(table.category),
  index("idx_ai_learning_confidence").on(table.confidence),
]); */

// AI Feedback - user feedback on AI responses
/* DUPLICATE - Moved to modular schema
export const aiFeedback = pgTable("ai_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => aiMessages.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  rating: integer("rating").notNull(), // 1-5 stars
  helpful: boolean("helpful"),
  accurate: boolean("accurate"),
  comments: text("comments"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_feedback_message").on(table.messageId),
  index("idx_ai_feedback_company").on(table.companyId),
]); */

// ============== MASTER AI TRAINING SYSTEM ==============

// AI Model Versions - master AI model version tracking
/* DUPLICATE - Moved to modular schema
export const aiModelVersions = pgTable("ai_model_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  versionNumber: varchar("version_number", { length: 50 }).notNull().unique(),
  modelName: varchar("model_name", { length: 255 }).notNull(),
  modelType: varchar("model_type", { length: 100 }),
  algorithm: varchar("algorithm", { length: 100 }),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  createdBy: varchar("created_by").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_model_versions_status").on(table.status),
  index("idx_ai_model_versions_created").on(table.createdAt),
]); */

// AI Model Deployments - track which companies have which AI versions
/* DUPLICATE - Moved to modular schema
export const aiModelDeployments = pgTable("ai_model_deployments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  modelVersionId: varchar("model_version_id").notNull().references(() => aiModelVersions.id, { onDelete: 'cascade' }),
  versionNumber: varchar("version_number", { length: 50 }).notNull(),
  deploymentStatus: varchar("deployment_status", { length: 50 }).notNull().default("active"),
  environment: varchar("environment", { length: 50 }),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  deployedAt: timestamp("deployed_at").defaultNow().notNull(),
  deactivatedAt: timestamp("deactivated_at"),
  performanceMetrics: jsonb("performance_metrics"),
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_ai_deployments_company").on(table.companyId),
  index("idx_ai_deployments_version").on(table.modelVersionId),
  index("idx_ai_deployments_status").on(table.deploymentStatus),
]); */

// Master Training Datasets - curated training data by platform admin
export const masterTrainingDatasets = pgTable("master_training_datasets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelVersionId: varchar("model_version_id").references(() => aiModelVersions.id),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  datasetType: varchar("dataset_type", { length: 100 }),
  category: varchar("category", { length: 100 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  contentType: varchar("content_type", { length: 100 }).notNull(),
  source: text("source"),
  qualityScore: decimal("quality_score", { precision: 3, scale: 2 }),
  tags: jsonb("tags"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdBy: varchar("created_by").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_master_training_category").on(table.category),
  index("idx_master_training_status").on(table.status),
  index("idx_master_training_version").on(table.modelVersionId),
]);

// Training Data Analytics - track effectiveness of training data
export const trainingDataAnalytics = pgTable("training_data_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  datasetId: varchar("dataset_id").notNull().references(() => masterTrainingDatasets.id, { onDelete: 'cascade' }),
  modelVersionId: varchar("model_version_id").notNull().references(() => aiModelVersions.id, { onDelete: 'cascade' }),
  usageCount: integer("usage_count").default(0),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }),
  avgConfidence: decimal("avg_confidence", { precision: 5, scale: 2 }),
  feedbackScore: decimal("feedback_score", { precision: 5, scale: 2 }),
  improvementMetrics: jsonb("improvement_metrics"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
}, (table) => [
  index("idx_training_analytics_dataset").on(table.datasetId),
  index("idx_training_analytics_version").on(table.modelVersionId),
]);

// Company AI Settings - per-company AI configuration
export const companyAiSettings = pgTable("company_ai_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().unique().references(() => companies.id, { onDelete: 'cascade' }),
  currentModelVersion: varchar("current_model_version", { length: 50 }),
  autoUpdateEnabled: boolean("auto_update_enabled").default(true),
  customTrainingEnabled: boolean("custom_training_enabled").default(false),
  dataRetentionDays: integer("data_retention_days").default(90),
  lastTrainingSync: timestamp("last_training_sync"),
  aiPreferences: jsonb("ai_preferences"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_company_ai_settings_company").on(table.companyId),
]);

// AI Training Jobs - background training process tracking
export const aiTrainingJobs = pgTable("ai_training_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelVersionId: varchar("model_version_id").notNull().references(() => aiModelVersions.id, { onDelete: 'cascade' }),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  modelType: varchar("model_type", { length: 100 }),
  algorithm: varchar("algorithm", { length: 100 }),
  jobType: varchar("job_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("queued"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  trainingDatasetIds: jsonb("training_dataset_ids"),
  trainingMetrics: jsonb("training_metrics"),
  errorLog: jsonb("error_log"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_training_jobs_version").on(table.modelVersionId),
  index("idx_ai_training_jobs_status").on(table.status),
]);

// AI Deployment Queue - scheduled deployments
export const aiDeploymentQueue = pgTable("ai_deployment_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelVersionId: varchar("model_version_id").notNull().references(() => aiModelVersions.id, { onDelete: 'cascade' }),
  companyIds: jsonb("company_ids"),
  deploymentType: varchar("deployment_type", { length: 50 }).notNull(),
  scheduledAt: timestamp("scheduled_at"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  priority: integer("priority").default(5),
  companiesDeployed: integer("companies_deployed").default(0),
  companiesFailed: integer("companies_failed").default(0),
  processedAt: timestamp("processed_at"),
  errorLog: jsonb("error_log"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_deployment_queue_version").on(table.modelVersionId),
  index("idx_ai_deployment_queue_status").on(table.status),
  index("idx_ai_deployment_queue_scheduled").on(table.scheduledAt),
]);

// User storage table with Replit Auth fields and local auth support
/* DUPLICATE - Moved to modular schema
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }), // Multi-tenant link
  accountStatus: accountStatusEnum("account_status").notNull().default("pending"),
  statusReason: text("status_reason"),
  organizationId: varchar("organization_id"), // Legacy field
  organizationName: text("organization_name"), // Legacy field
  email: varchar("email").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: roleEnum("role"),
  enhancedRole: roleEnum("enhanced_role"),
  subscriptionPlan: subscriptionPlanEnum("subscription_plan").notNull().default("full"),
  gocNumber: varchar("goc_number"), // General Optical Council registration number
  accountNumber: varchar("account_number"),
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  address: jsonb("address"),
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false),
  lastLoginAt: timestamp("last_login_at"),
  
  // GOC Practitioner Details
  gocRegistrationNumber: varchar("goc_registration_number", { length: 50 }),
  gocRegistrationType: varchar("goc_registration_type", { length: 50 }),
  professionalQualifications: varchar("professional_qualifications", { length: 255 }),
  gocRegistrationExpiry: timestamp("goc_registration_expiry"),
  indemnityInsuranceProvider: varchar("indemnity_insurance_provider", { length: 255 }),
  indemnityPolicyNumber: varchar("indemnity_policy_number", { length: 100 }),
  indemnityExpiryDate: timestamp("indemnity_expiry_date"),
  cpdCompleted: boolean("cpd_completed").default(true),
  cpdLastUpdated: timestamp("cpd_last_updated"),
  signatureImage: text("signature_image"),
  canPrescribe: boolean("can_prescribe").default(true),
  canDispense: boolean("can_dispense").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}); */

// Junction table to support multiple roles per user
/* DUPLICATE - Moved to modular schema
export const userRoles = pgTable("user_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: roleEnum("role").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
}, (table) => [
  index("idx_user_roles_user_id").on(table.userId),
]); */

// Enhanced Permission System Tables
/* DUPLICATE - Moved to modular schema
export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  permissionKey: varchar("permission_key").notNull().unique(),
  permissionName: varchar("permission_name").notNull(),
  category: varchar("category").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_permissions_category").on(table.category),
]); */

/* DUPLICATE - Moved to modular schema
export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  role: roleEnum("role").notNull(),
  permissionId: varchar("permission_id").notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_role_permissions_company").on(table.companyId),
  index("idx_role_permissions_role").on(table.role),
]); */

/* DUPLICATE - Moved to modular schema
export const userCustomPermissions = pgTable("user_custom_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  permissionId: varchar("permission_id").notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  granted: boolean("granted").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
}, (table) => [
  index("idx_user_custom_permissions_user").on(table.userId),
]); */

// ============== DYNAMIC RBAC SYSTEM ==============

// Dynamic Roles - Company-specific roles (both defaults and custom)
/* DUPLICATE - Moved to modular schema
export const dynamicRoles = pgTable("dynamic_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  
  // System Management
  isSystemDefault: boolean("is_system_default").notNull().default(false),
  isDeletable: boolean("is_deletable").notNull().default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
}, (table) => [
  index("idx_dynamic_roles_company").on(table.companyId),
  index("idx_dynamic_roles_name").on(table.name),
  index("idx_dynamic_roles_system_default").on(table.isSystemDefault),
  uniqueIndex("unique_role_per_company").on(table.companyId, table.name),
]); */

// Dynamic Role Permissions - Many-to-many: which permissions does each role have?
/* DUPLICATE - Moved to modular schema
export const dynamicRolePermissions = pgTable("dynamic_role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").notNull().references(() => dynamicRoles.id, { onDelete: 'cascade' }),
  permissionId: varchar("permission_id").notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  grantedBy: varchar("granted_by").references(() => users.id),
}, (table) => [
  index("idx_dynamic_role_permissions_role").on(table.roleId),
  index("idx_dynamic_role_permissions_permission").on(table.permissionId),
  uniqueIndex("unique_role_permission").on(table.roleId, table.permissionId),
]); */

// User Dynamic Roles - Many-to-many: which roles are assigned to each user?
/* DUPLICATE - Moved to modular schema
export const userDynamicRoles = pgTable("user_dynamic_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: varchar("role_id").notNull().references(() => dynamicRoles.id, { onDelete: 'cascade' }),
  
  isPrimary: boolean("is_primary").notNull().default(false),
  
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  assignedBy: varchar("assigned_by").references(() => users.id),
}, (table) => [
  index("idx_user_dynamic_roles_user").on(table.userId),
  index("idx_user_dynamic_roles_role").on(table.roleId),
  index("idx_user_dynamic_roles_primary").on(table.isPrimary),
  uniqueIndex("unique_user_role").on(table.userId, table.roleId),
]); */

// Role Change Audit - Track all permission/role changes for compliance
/* DUPLICATE - Moved to modular schema
export const roleChangeAudit = pgTable("role_change_audit", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  changedBy: varchar("changed_by").references(() => users.id),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
  
  actionType: varchar("action_type", { length: 50 }).notNull(), // 'role_created', 'role_deleted', 'permission_assigned', etc.
  
  roleId: varchar("role_id").references(() => dynamicRoles.id, { onDelete: 'set null' }),
  permissionId: varchar("permission_id").references(() => permissions.id, { onDelete: 'set null' }),
  
  details: jsonb("details"), // { old_value, new_value, reason }
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
}, (table) => [
  index("idx_role_change_audit_company").on(table.companyId),
  index("idx_role_change_audit_changed_by").on(table.changedBy),
  index("idx_role_change_audit_role").on(table.roleId),
  index("idx_role_change_audit_timestamp").on(table.changedAt),
  index("idx_role_change_audit_action").on(table.actionType),
]); */

// ============== AUDIT LOGS (HIPAA Compliance) ==============

export const auditEventTypeEnum = pgEnum("audit_event_type", [
  "access",
  "create",
  "read",
  "update",
  "delete",
  "login",
  "logout",
  "auth_attempt",
  "permission_change",
  "export",
  "print"
]);

/* DUPLICATE - Moved to modular schema
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  
  // Who performed the action
  userId: varchar("user_id").references(() => users.id),
  userEmail: varchar("user_email"),
  userRole: roleEnum("user_role"),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
  
  // What action was performed
  eventType: auditEventTypeEnum("event_type").notNull(),
  resourceType: varchar("resource_type").notNull(), // 'patient', 'order', 'prescription', 'user', etc.
  resourceId: varchar("resource_id"),
  action: text("action").notNull(), // Human-readable description
  
  // Where the action occurred
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  endpoint: varchar("endpoint"), // e.g., '/api/patients/123'
  method: varchar("method", { length: 10 }), // GET, POST, PUT, DELETE
  
  // Result of the action
  statusCode: integer("status_code"),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  
  // Data changes (for updates)
  changesBefore: jsonb("changes_before"), // State before update
  changesAfter: jsonb("changes_after"), // State after update
  metadata: jsonb("metadata"), // Additional context
  
  // HIPAA-specific fields
  phiAccessed: boolean("phi_accessed").default(false), // Protected Health Information flag
  phiFields: jsonb("phi_fields"), // List of PHI fields accessed (e.g., ['nhsNumber', 'dateOfBirth'])
  justification: text("justification"), // Business justification for PHI access
  
  // Retention
  retentionDate: timestamp("retention_date"), // When this log can be deleted (7+ years per GOC)
}, (table) => [
  index("idx_audit_logs_user").on(table.userId),
  index("idx_audit_logs_company").on(table.companyId),
  index("idx_audit_logs_timestamp").on(table.timestamp),
  index("idx_audit_logs_resource").on(table.resourceType, table.resourceId),
  index("idx_audit_logs_phi").on(table.phiAccessed),
  index("idx_audit_logs_event_type").on(table.eventType),
  index("idx_audit_logs_retention").on(table.retentionDate),
]); */

/* DUPLICATE - Moved to modular schema
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerNumber: varchar("customer_number", { length: 20 }).notNull().unique(),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  dateOfBirth: text("date_of_birth"),
  email: varchar("email"),
  
  // Contact Information
  phone: varchar("phone", { length: 50 }),
  mobilePhone: varchar("mobile_phone", { length: 50 }),
  workPhone: varchar("work_phone", { length: 50 }),
  
  // NHS & Reference Numbers
  nhsNumber: varchar("nhs_number"),
  customerReferenceLabel: text("customer_reference_label"),
  customerReferenceNumber: text("customer_reference_number"),
  
  // Address Information
  fullAddress: jsonb("full_address"),
  addressLine1: varchar("address_line_1", { length: 255 }),
  addressLine2: varchar("address_line_2", { length: 255 }),
  city: varchar("city", { length: 100 }),
  county: varchar("county", { length: 100 }),
  postcode: varchar("postcode", { length: 20 }),
  country: varchar("country", { length: 100 }).default("United Kingdom"),
  
  // Timezone & Location
  timezone: varchar("timezone", { length: 100 }), // Auto-detected timezone (e.g., "Europe/London")
  timezoneOffset: integer("timezone_offset"), // Offset in minutes from UTC
  locale: varchar("locale", { length: 20 }).default("en-GB"), // Language/region preference
  
  ecpId: varchar("ecp_id").notNull().references(() => users.id),
  
  // Enhanced Clinical Records
  previousOptician: varchar("previous_optician", { length: 255 }),
  gpName: varchar("gp_name", { length: 255 }),
  gpPractice: varchar("gp_practice", { length: 255 }),
  gpAddress: text("gp_address"),
  gpPhone: varchar("gp_phone", { length: 50 }),
  
  // Emergency Contact
  emergencyContactName: varchar("emergency_contact_name", { length: 255 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 50 }),
  emergencyContactRelationship: varchar("emergency_contact_relationship", { length: 100 }),
  emergencyContactEmail: varchar("emergency_contact_email", { length: 255 }),
  
  // Medical History & Current Health
  medicalHistory: jsonb("medical_history"), // Array of {condition, date, notes}
  currentMedications: text("current_medications"),
  allergies: text("allergies"), // Medications/substances patient is allergic to
  familyOcularHistory: text("family_ocular_history"),
  systemicConditions: jsonb("systemic_conditions"), // Diabetes, hypertension, etc.
  
  // Lifestyle & Visual Requirements
  occupation: varchar("occupation", { length: 255 }),
  hobbies: text("hobbies"),
  vduUser: boolean("vdu_user").default(false),
  vduHoursPerDay: decimal("vdu_hours_per_day", { precision: 4, scale: 1 }),
  drivingRequirement: boolean("driving_requirement").default(false),
  sportActivities: text("sport_activities"),
  readingHabits: text("reading_habits"),
  
  // Contact Lens Information
  contactLensWearer: boolean("contact_lens_wearer").default(false),
  contactLensType: varchar("contact_lens_type", { length: 100 }), // Daily, monthly, toric, etc.
  contactLensBrand: varchar("contact_lens_brand", { length: 100 }),
  contactLensCompliance: varchar("contact_lens_compliance", { length: 50 }), // Good, fair, poor
  
  // Communication Preferences
  preferredContactMethod: varchar("preferred_contact_method", { length: 50 }),
  preferredAppointmentTime: varchar("preferred_appointment_time", { length: 50 }), // Morning, afternoon, evening
  reminderPreference: varchar("reminder_preference", { length: 50 }), // Email, SMS, phone, none
  
  // Consent & Privacy
  marketingConsent: boolean("marketing_consent").default(false),
  dataSharingConsent: boolean("data_sharing_consent").default(true),
  thirdPartyConsent: boolean("third_party_consent").default(false),
  researchConsent: boolean("research_consent").default(false),
  
  // Examination Schedule
  lastExaminationDate: timestamp("last_examination_date"),
  nextExaminationDue: timestamp("next_examination_due"),
  recallSchedule: varchar("recall_schedule", { length: 50 }), // Annual, 6-months, 2-years, etc.
  
  // Financial & Insurance
  insuranceProvider: varchar("insurance_provider", { length: 255 }),
  insurancePolicyNumber: varchar("insurance_policy_number", { length: 100 }),
  nhsExemption: boolean("nhs_exemption").default(false),
  nhsExemptionType: varchar("nhs_exemption_type", { length: 100 }),
  
  // Patient Status & Notes
  status: varchar("status", { length: 50 }).default("active"), // active, inactive, deceased
  vipPatient: boolean("vip_patient").default(false),
  patientNotes: text("patient_notes"), // General notes about the patient
  internalNotes: text("internal_notes"), // Staff-only notes
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Audit Trail
  createdBy: varchar("created_by", { length: 255 }),
  updatedBy: varchar("updated_by", { length: 255 }),
  changeHistory: jsonb("change_history").default(sql`'[]'::jsonb`),

  // Import Tracking (for migrated records from Optix, Occuco, Acuity, etc.)
  externalId: varchar("external_id", { length: 255 }), // Original ID from legacy system
  importSource: varchar("import_source", { length: 100 }), // optix, occuco, acuity, manual_csv, etc.
  importJobId: varchar("import_job_id", { length: 255 }), // Reference to migration_jobs.id
  importedAt: timestamp("imported_at"), // When this record was imported

  // Soft Delete
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by", { length: 255 }),
}); */

/* DUPLICATE - Moved to modular schema
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  ecpId: varchar("ecp_id").notNull().references(() => users.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  
  odSphere: decimal("od_sphere", { precision: 6, scale: 3 }),
  odCylinder: decimal("od_cylinder", { precision: 6, scale: 3 }),
  odAxis: integer("od_axis"),
  odAdd: decimal("od_add", { precision: 4, scale: 2 }),
  osSphere: decimal("os_sphere", { precision: 6, scale: 3 }),
  osCylinder: decimal("os_cylinder", { precision: 6, scale: 3 }),
  osAxis: integer("os_axis"),
  osAdd: decimal("os_add", { precision: 4, scale: 2 }),
  pd: decimal("pd", { precision: 4, scale: 1 }),
  
  lensType: text("lens_type").notNull(),
  lensMaterial: text("lens_material").notNull(),
  coating: text("coating").notNull(),
  frameType: text("frame_type"),
  
  notes: text("notes"),
  traceFileUrl: text("trace_file_url"),
  trackingNumber: text("tracking_number"),
  shippedAt: timestamp("shipped_at"),
  
  customerReferenceLabel: text("customer_reference_label"),
  customerReferenceNumber: text("customer_reference_number"),
  
  omaFileContent: text("oma_file_content"),
  omaFilename: text("oma_filename"),
  omaParsedData: jsonb("oma_parsed_data"),
  
  // LIMS Integration Fields (Phase 1)
  jobId: varchar("job_id"),
  jobStatus: varchar("job_status"),
  sentToLabAt: timestamp("sent_to_lab_at"),
  jobErrorMessage: text("job_error_message"),
  // PDF generation fields (worker-updated)
  pdfUrl: text("pdf_url"),
  pdfErrorMessage: text("pdf_error_message"),
  // Analytics worker error metadata (worker-updated)
  analyticsErrorMessage: text("analytics_error_message"),
  
  orderDate: timestamp("order_date").defaultNow().notNull(),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  
  // Timestamp tracking
  createdBy: varchar("created_by", { length: 255 }),
  updatedBy: varchar("updated_by", { length: 255 }),
  changeHistory: jsonb("change_history").default(sql`'[]'::jsonb`),

  // Import Tracking (for migrated records)
  externalId: varchar("external_id", { length: 255 }), // Original order ID from legacy system
  importSource: varchar("import_source", { length: 100 }),
  importJobId: varchar("import_job_id", { length: 255 }),
  importedAt: timestamp("imported_at"),

  // Soft Delete
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by", { length: 255 }),
}); */

/* DUPLICATE - Moved to modular schema
export const consultLogs = pgTable("consult_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  ecpId: varchar("ecp_id").notNull().references(() => users.id),
  priority: consultPriorityEnum("priority").notNull().default("normal"),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  labResponse: text("lab_response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
}); */

// Patient Activity Log - Comprehensive history tracking
export const patientActivityTypeEnum = pgEnum("patient_activity_type", [
  "profile_created",
  "profile_updated",
  "examination_scheduled",
  "examination_completed",
  "prescription_issued",
  "order_placed",
  "order_updated",
  "order_completed",
  "contact_lens_fitted",
  "recall_sent",
  "appointment_booked",
  "appointment_cancelled",
  "payment_received",
  "refund_issued",
  "complaint_logged",
  "complaint_resolved",
  "consent_updated",
  "document_uploaded",
  "note_added",
  "referral_made",
  "communication_sent"
]);

export const patientActivityLog = pgTable("patient_activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: 'cascade' }),
  activityType: patientActivityTypeEnum("activity_type").notNull(),
  
  // Related records
  orderId: varchar("order_id").references(() => orders.id),
  examinationId: varchar("examination_id").references(() => eyeExaminations.id),
  prescriptionId: varchar("prescription_id").references(() => prescriptions.id),
  
  // Activity details
  activityTitle: varchar("activity_title", { length: 255 }).notNull(),
  activityDescription: text("activity_description"),
  activityData: jsonb("activity_data"), // Flexible JSON storage for activity-specific data
  
  // Change tracking
  changesBefore: jsonb("changes_before"), // Previous state (for updates)
  changesAfter: jsonb("changes_after"),   // New state (for updates)
  changedFields: jsonb("changed_fields"), // Array of field names that changed
  
  // Actor information
  performedBy: varchar("performed_by", { length: 255 }).notNull(), // User ID or system
  performedByName: varchar("performed_by_name", { length: 255 }), // User's name for display
  performedByRole: varchar("performed_by_role", { length: 100 }), // User's role
  
  // Metadata
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  source: varchar("source", { length: 100 }).default("web"), // web, mobile, api, system
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_patient_activity_patient").on(table.patientId),
  index("idx_patient_activity_type").on(table.activityType),
  index("idx_patient_activity_date").on(table.createdAt),
  index("idx_patient_activity_company").on(table.companyId),
]);

export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poNumber: text("po_number").notNull().unique(),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  supplierId: varchar("supplier_id").notNull().references(() => users.id),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  status: poStatusEnum("status").notNull().default("draft"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  notes: text("notes"),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  actualDeliveryDate: timestamp("actual_delivery_date"),
  trackingNumber: text("tracking_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const poLineItems = pgTable("po_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseOrderId: varchar("purchase_order_id").notNull().references(() => purchaseOrders.id),
  itemName: text("item_name").notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const technicalDocuments = pgTable("technical_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull().references(() => users.id),
  documentType: documentTypeEnum("document_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  materialName: text("material_name"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const organizationSettings = pgTable("organization_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name"),
  logoUrl: text("logo_url"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: jsonb("address"),
  orderNumberPrefix: text("order_number_prefix").default("ORD"),
  defaultLeadTimeDays: integer("default_lead_time_days").default(7),
  enableEmailNotifications: jsonb("enable_email_notifications").default(sql`'{"orderReceived": true, "orderShipped": true, "poCreated": true}'::jsonb`),
  businessHours: jsonb("business_hours"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedById: varchar("updated_by_id").references(() => users.id),
});

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  theme: text("theme").default("light"),
  language: text("language").default("en"),
  emailNotifications: jsonb("email_notifications").default(sql`'{"orderUpdates": true, "systemAlerts": true}'::jsonb`),
  dashboardLayout: jsonb("dashboard_layout"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* DUPLICATE - Moved to modular schema
export const eyeExaminations = pgTable("eye_examinations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  ecpId: varchar("ecp_id").notNull().references(() => users.id),
  examinationDate: timestamp("examination_date").defaultNow().notNull(),
  status: examinationStatusEnum("status").notNull().default("in_progress"),
  reasonForVisit: text("reason_for_visit"),
  
  // Legacy fields (kept for backward compatibility)
  medicalHistory: jsonb("medical_history"),
  visualAcuity: jsonb("visual_acuity"),
  refraction: jsonb("refraction"),
  binocularVision: jsonb("binocular_vision"),
  eyeHealth: jsonb("eye_health"),
  equipmentReadings: jsonb("equipment_readings"),
  
  // Comprehensive examination fields
  generalHistory: jsonb("general_history"),
  currentRx: jsonb("current_rx"),
  newRx: jsonb("new_rx"),
  ophthalmoscopy: jsonb("ophthalmoscopy"),
  slitLamp: jsonb("slit_lamp"),
  additionalTests: jsonb("additional_tests"),
  tonometry: jsonb("tonometry"),
  eyeSketch: jsonb("eye_sketch"),
  images: jsonb("images"),
  summary: jsonb("summary"),

  // Enhanced examination workflow fields
  preScreening: jsonb("pre_screening"), // AVMS, Focimetry, Phorias
  retinoscopy: jsonb("retinoscopy"), // Retinoscopy findings
  sectionNotes: jsonb("section_notes"), // 500-char notes per section
  gradingSystem: varchar("grading_system", { length: 20 }), // EFRON, CLRU, or other

  finalized: boolean("finalized").default(false),
  
  gosFormType: text("gos_form_type"),
  nhsVoucherCode: text("nhs_voucher_code"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Import Tracking (for migrated records)
  externalId: varchar("external_id", { length: 255 }), // Original exam ID from legacy system
  importSource: varchar("import_source", { length: 100 }),
  importJobId: varchar("import_job_id", { length: 255 }),
  importedAt: timestamp("imported_at"),

  // Soft Delete
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by", { length: 255 }),
}); */

/* DUPLICATE - Moved to modular schema
export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  examinationId: varchar("examination_id").references(() => eyeExaminations.id),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  ecpId: varchar("ecp_id").notNull().references(() => users.id),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  expiryDate: timestamp("expiry_date"),
  odSphere: decimal("od_sphere", { precision: 6, scale: 3 }),
  odCylinder: decimal("od_cylinder", { precision: 6, scale: 3 }),
  odAxis: integer("od_axis"),
  odAdd: decimal("od_add", { precision: 4, scale: 2 }),
  osSphere: decimal("os_sphere", { precision: 6, scale: 3 }),
  osCylinder: decimal("os_cylinder", { precision: 6, scale: 3 }),
  osAxis: integer("os_axis"),
  osAdd: decimal("os_add", { precision: 4, scale: 2 }),
  pd: decimal("pd", { precision: 4, scale: 1 }), // Legacy field - kept for backwards compatibility
  // British Standards - Separate L/R Pupillary Distances
  pdRight: decimal("pd_right", { precision: 4, scale: 1 }), // Right monocular PD (mm)
  pdLeft: decimal("pd_left", { precision: 4, scale: 1 }),   // Left monocular PD (mm)
  binocularPd: decimal("binocular_pd", { precision: 4, scale: 1 }), // Total binocular PD
  nearPd: decimal("near_pd", { precision: 4, scale: 1 }), // Near PD for reading
  // Prism prescription (British standards)
  odPrismHorizontal: decimal("od_prism_horizontal", { precision: 4, scale: 2 }),
  odPrismVertical: decimal("od_prism_vertical", { precision: 4, scale: 2 }),
  odPrismBase: varchar("od_prism_base", { length: 20 }), // IN, OUT, UP, DOWN
  osPrismHorizontal: decimal("os_prism_horizontal", { precision: 4, scale: 2 }),
  osPrismVertical: decimal("os_prism_vertical", { precision: 4, scale: 2 }),
  osPrismBase: varchar("os_prism_base", { length: 20 }),
  // Additional British standards compliance
  backVertexDistance: decimal("back_vertex_distance", { precision: 4, scale: 1 }), // BVD in mm
  prescriptionType: varchar("prescription_type", { length: 50 }), // distance, reading, bifocal, varifocal
  dispensingNotes: text("dispensing_notes"),
  gocCompliant: boolean("goc_compliant").default(true).notNull(),
  prescriberGocNumber: varchar("prescriber_goc_number", { length: 50 }),
  
  // British GOC Compliance & Test Room
  testRoomName: varchar("test_room_name", { length: 100 }),
  prescriberName: varchar("prescriber_name", { length: 255 }),
  prescriberQualifications: varchar("prescriber_qualifications", { length: 255 }),
  prescriberGocType: varchar("prescriber_goc_type", { length: 50 }), // 'optometrist', 'dispensing_optician', 'ophthalmologist'
  
  // Visual Acuity (British Standards)
  odVisualAcuityUnaided: varchar("od_visual_acuity_unaided", { length: 20 }),
  odVisualAcuityAided: varchar("od_visual_acuity_aided", { length: 20 }),
  odVisualAcuityPinhole: varchar("od_visual_acuity_pinhole", { length: 20 }),
  osVisualAcuityUnaided: varchar("os_visual_acuity_unaided", { length: 20 }),
  osVisualAcuityAided: varchar("os_visual_acuity_aided", { length: 20 }),
  osVisualAcuityPinhole: varchar("os_visual_acuity_pinhole", { length: 20 }),
  binocularVisualAcuity: varchar("binocular_visual_acuity", { length: 20 }),
  
  // Near Vision
  odNearVision: varchar("od_near_vision", { length: 20 }),
  osNearVision: varchar("os_near_vision", { length: 20 }),
  binocularNearVision: varchar("binocular_near_vision", { length: 20 }),
  
  // Intermediate Vision
  odIntermediateAdd: decimal("od_intermediate_add", { precision: 4, scale: 2 }),
  osIntermediateAdd: decimal("os_intermediate_add", { precision: 4, scale: 2 }),
  
  // Keratometry
  odKReading1: decimal("od_k_reading_1", { precision: 5, scale: 2 }),
  odKReading2: decimal("od_k_reading_2", { precision: 5, scale: 2 }),
  odKAxis: integer("od_k_axis"),
  osKReading1: decimal("os_k_reading_1", { precision: 5, scale: 2 }),
  osKReading2: decimal("os_k_reading_2", { precision: 5, scale: 2 }),
  osKAxis: integer("os_k_axis"),
  
  // Ocular Health
  intraocularPressureOd: varchar("intraocular_pressure_od", { length: 20 }),
  intraocularPressureOs: varchar("intraocular_pressure_os", { length: 20 }),
  ocularHealthNotes: text("ocular_health_notes"),
  clinicalRecommendations: text("clinical_recommendations"),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  followUpReason: text("follow_up_reason"),
  
  // Dispensing Recommendations
  recommendedLensType: varchar("recommended_lens_type", { length: 100 }),
  recommendedLensMaterial: varchar("recommended_lens_material", { length: 100 }),
  recommendedCoatings: text("recommended_coatings"),
  frameRecommendations: text("frame_recommendations"),
  specialInstructions: text("special_instructions"),
  
  // Usage & Restrictions
  usagePurpose: varchar("usage_purpose", { length: 100 }),
  wearTime: varchar("wear_time", { length: 100 }),
  drivingSuitable: boolean("driving_suitable").default(true),
  dvlaNotified: boolean("dvla_notified").default(false),
  
  // Verification
  verifiedByEcpId: varchar("verified_by_ecp_id").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  verificationNotes: text("verification_notes"),
  
  // GOC Record Keeping
  recordRetentionDate: timestamp("record_retention_date"),
  referralMade: boolean("referral_made").default(false),
  referralTo: varchar("referral_to", { length: 255 }),
  referralReason: text("referral_reason"),
  
  // Enhanced metadata
  examinationDurationMinutes: integer("examination_duration_minutes"),
  examinationType: varchar("examination_type", { length: 50 }),
  patientComplaint: text("patient_complaint"),
  previousPrescriptionId: varchar("previous_prescription_id"), // Self-reference handled at DB level
  
  // Digital signature
  isSigned: boolean("is_signed").default(false).notNull(),
  signedByEcpId: varchar("signed_by_ecp_id").references(() => users.id),
  digitalSignature: text("digital_signature"),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Timestamp tracking
  createdBy: varchar("created_by", { length: 255 }),
  updatedBy: varchar("updated_by", { length: 255 }),
  changeHistory: jsonb("change_history").default(sql`'[]'::jsonb`),

  // Import Tracking (for migrated records)
  externalId: varchar("external_id", { length: 255 }), // Original Rx ID from legacy system
  importSource: varchar("import_source", { length: 100 }),
  importJobId: varchar("import_job_id", { length: 255 }),
  importedAt: timestamp("imported_at"),

  // Soft Delete
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by", { length: 255 }),
}, (table) => [
  index("idx_prescriptions_test_room").on(table.testRoomName),
  index("idx_prescriptions_goc_number").on(table.prescriberGocNumber),
  index("idx_prescriptions_follow_up").on(table.followUpDate),
  index("idx_prescriptions_retention").on(table.recordRetentionDate),
  index("idx_prescriptions_verified").on(table.verifiedByEcpId),
]); */

// Test Rooms table - Enhanced with scheduling & equipment tracking
/* DUPLICATE - Moved to modular schema
export const testRooms = pgTable("test_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  roomName: varchar("room_name", { length: 100 }).notNull(),
  roomCode: varchar("room_code", { length: 20 }),
  locationDescription: text("location_description"),
  equipmentList: text("equipment_list"),
  
  // Enhanced features for web-based PMS
  capacity: integer("capacity").default(1), // Number of practitioners that can use simultaneously
  floorLevel: varchar("floor_level", { length: 50 }), // e.g., "Ground Floor", "First Floor"
  accessibility: boolean("accessibility").default(true), // Wheelchair accessible
  currentStatus: varchar("current_status", { length: 50 }).default("available"), // available, occupied, maintenance, offline
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  nextMaintenanceDate: timestamp("next_maintenance_date"),
  
  // Equipment calibration tracking
  equipmentDetails: jsonb("equipment_details"), // Detailed equipment list with calibration dates
  
  // Remote access & multi-location support
  allowRemoteAccess: boolean("allow_remote_access").default(false),
  locationId: varchar("location_id"), // For multi-location practices
  
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_test_rooms_company").on(table.companyId),
  index("idx_test_rooms_active").on(table.isActive),
  index("idx_test_rooms_status").on(table.currentStatus),
  index("idx_test_rooms_location").on(table.locationId),
]); */

// Test Room Bookings - For scheduling and conflict detection
export const testRoomBookings = pgTable("test_room_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testRoomId: varchar("test_room_id").notNull().references(() => testRooms.id, { onDelete: 'cascade' }),
  patientId: varchar("patient_id").references(() => patients.id, { onDelete: 'set null' }),
  userId: varchar("user_id").notNull().references(() => users.id), // Practitioner
  
  bookingDate: timestamp("booking_date").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  
  appointmentType: varchar("appointment_type", { length: 100 }), // e.g., "Routine Eye Test", "Contact Lens Fitting"
  status: varchar("status", { length: 50 }).default("scheduled"), // scheduled, in-progress, completed, cancelled
  
  notes: text("notes"),
  
  // Remote access tracking
  isRemoteSession: boolean("is_remote_session").default(false),
  remoteAccessUrl: text("remote_access_url"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Soft Delete
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by", { length: 255 }),
}, (table) => [
  index("idx_bookings_test_room").on(table.testRoomId),
  index("idx_bookings_date").on(table.bookingDate),
  index("idx_bookings_status").on(table.status),
  index("idx_bookings_user").on(table.userId),
]);

// Calibration Records table - for equipment compliance tracking
export const calibrationRecords = pgTable("calibration_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  equipmentId: varchar("equipment_id").notNull().references(() => equipment.id, { onDelete: 'cascade' }),
  
  calibrationDate: timestamp("calibration_date").notNull(),
  performedBy: varchar("performed_by", { length: 200 }).notNull(),
  certificateNumber: varchar("certificate_number", { length: 100 }),
  nextDueDate: timestamp("next_due_date").notNull(),
  
  results: text("results"),
  passed: boolean("passed").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_calibration_equipment").on(table.equipmentId),
  index("idx_calibration_date").on(table.calibrationDate),
]);

// Remote Sessions table - for secure remote prescription access
export const remoteSessions = pgTable("remote_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: 'cascade' }),
  prescriptionId: varchar("prescription_id").references(() => prescriptions.id, { onDelete: 'cascade' }),
  
  accessToken: varchar("access_token", { length: 255 }).unique().notNull(),
  
  requestedBy: varchar("requested_by").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  
  status: varchar("status", { length: 50 }).default("pending"), // pending, approved, expired, revoked
  
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  revokedAt: timestamp("revoked_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_remote_sessions_company").on(table.companyId),
  index("idx_remote_sessions_patient").on(table.patientId),
  index("idx_remote_sessions_token").on(table.accessToken),
  index("idx_remote_sessions_status").on(table.status),
  index("idx_remote_sessions_expires").on(table.expiresAt),
]);

// GOC Compliance Checks table
/* DUPLICATE - Moved to modular schema
export const gocComplianceChecks = pgTable("goc_compliance_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id),
  checkType: varchar("check_type", { length: 100 }).notNull(),
  checkDate: timestamp("check_date").defaultNow().notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  details: text("details"),
  actionRequired: text("action_required"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_goc_compliance_company").on(table.companyId),
  index("idx_goc_compliance_status").on(table.status),
  index("idx_goc_compliance_date").on(table.checkDate),
]); */

// Prescription Templates table
export const prescriptionTemplates = pgTable("prescription_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  templateName: varchar("template_name", { length: 150 }).notNull(),
  templateDescription: text("template_description"),
  prescriptionType: varchar("prescription_type", { length: 50 }),
  defaultValues: jsonb("default_values").notNull(),
  usageCount: integer("usage_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_prescription_templates_company").on(table.companyId),
]);

// Clinical Protocols table
/* DUPLICATE - Moved to modular schema
export const clinicalProtocols = pgTable("clinical_protocols", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  protocolName: varchar("protocol_name", { length: 255 }).notNull(),
  protocolType: varchar("protocol_type", { length: 100 }),
  description: text("description"),
  protocolSteps: jsonb("protocol_steps"),
  complianceNotes: text("compliance_notes"),
  isMandatory: boolean("is_mandatory").default(false),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_clinical_protocols_company").on(table.companyId),
]); */

/* DUPLICATE - Moved to modular schema
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  ecpId: varchar("ecp_id").notNull().references(() => users.id),
  productType: productTypeEnum("product_type").notNull(),
  sku: text("sku"),
  brand: text("brand"),
  model: text("model"),
  name: text("name"), // Product display name
  description: text("description"), // Product description
  category: text("category"), // 'frames', 'lenses', 'accessories', 'solutions', 'cases', 'cleaning'
  barcode: text("barcode"), // Barcode for scanning
  imageUrl: text("image_url"), // Product image
  colorOptions: jsonb("color_options").$type<string[]>(), // Available colors for the product
  cost: decimal("cost", { precision: 10, scale: 2 }), // Cost price for profit tracking
  stockQuantity: integer("stock_quantity").default(0).notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(10), // Alert when stock is low
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"), // Tax percentage
  isActive: boolean("is_active").default(true), // Product active status
  isPrescriptionRequired: boolean("is_prescription_required").default(false), // Requires Rx
  // Shopify integration fields
  shopifyProductId: varchar("shopify_product_id"),
  shopifyVariantId: varchar("shopify_variant_id"),
  shopifyInventoryItemId: varchar("shopify_inventory_item_id"),
  lastShopifySync: timestamp("last_shopify_sync"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_products_company_barcode").on(table.companyId, table.barcode),
  index("idx_products_category").on(table.category),
]); */

/* DUPLICATE - Moved to modular schema
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  patientId: varchar("patient_id").references(() => patients.id),
  ecpId: varchar("ecp_id").notNull().references(() => users.id),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  paymentMethod: paymentMethodEnum("payment_method"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0").notNull(),
  invoiceDate: timestamp("invoice_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Soft Delete
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by", { length: 255 }),
}); */

/* DUPLICATE - Moved to modular schema
export const invoiceLineItems = pgTable("invoice_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id),
  productId: varchar("product_id").references(() => products.id),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}); */

// Coupons table for discount codes
/* DUPLICATE - Moved to modular schema
export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  discountType: varchar("discount_type", { length: 20 }).notNull(), // "percentage" or "fixed"
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
  expiresAt: timestamp("expires_at"),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}); */

// Revenue Recognition Events for GAAP/IFRS compliance
/* DUPLICATE - Moved to modular schema
export const revenueRecognitionEvents = pgTable("revenue_recognition_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  recognitionDate: timestamp("recognition_date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  recognitionType: varchar("recognition_type", { length: 50 }).notNull(), // "full", "deferred", "partial"
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_revenue_recognition_invoice").on(table.invoiceId),
  index("idx_revenue_recognition_company").on(table.companyId),
  index("idx_revenue_recognition_date").on(table.recognitionDate),
]); */

// Enums for new features
export const adaptAlertSeverityEnum = pgEnum("adapt_alert_severity", [
  "info",
  "warning",
  "critical"
]);

// Predictive Non-Adapt Alert System Tables
export const rxFrameLensAnalytics = pgTable("rx_frame_lens_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lensType: text("lens_type").notNull(),
  lensMaterial: text("lens_material").notNull(),
  frameType: text("frame_type").notNull(),
  totalOrders: integer("total_orders").default(0).notNull(),
  nonAdaptCount: integer("non_adapt_count").default(0).notNull(),
  nonAdaptRate: decimal("non_adapt_rate", { precision: 5, scale: 4 }).default("0").notNull(), // 0-1 range
  remakeRate: decimal("remake_rate", { precision: 5, scale: 4 }).default("0").notNull(),
  averageRemakeDays: decimal("average_remake_days", { precision: 8, scale: 2 }).default("0"),
  historicalDataPoints: jsonb("historical_data_points").default('[]'),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  metadata: jsonb("metadata"),
});

export const prescriptionAlerts = pgTable("prescription_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  ecpId: varchar("ecp_id").references(() => users.id).notNull(),
  severity: adaptAlertSeverityEnum("severity").notNull(),
  alertType: text("alert_type").notNull(), // "high_wrap", "high_add", "high_power_progressive", etc.
  riskScore: decimal("risk_score", { precision: 5, scale: 4 }).notNull(), // 0-1 range
  historicalNonAdaptRate: decimal("historical_non_adapt_rate", { precision: 5, scale: 4 }),
  recommendedLensType: text("recommended_lens_type"),
  recommendedMaterial: text("recommended_material"),
  recommendedCoating: text("recommended_coating"),
  explanation: text("explanation").notNull(),
  dismissedAt: timestamp("dismissed_at"),
  dismissedBy: varchar("dismissed_by").references(() => users.id),
  actionTaken: text("action_taken"),
  actionTakenAt: timestamp("action_taken_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_prescription_alerts_order").on(table.orderId),
  index("idx_prescription_alerts_ecp").on(table.ecpId),
  index("idx_prescription_alerts_severity").on(table.severity),
]);

// Business Intelligence & Purchasing Recommendations Tables
export const eciProductSalesAnalytics = pgTable("ecp_product_sales_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ecpId: varchar("ecp_id").references(() => users.id).notNull(),
  productType: text("product_type").notNull(), // "frame", "lens", "contact_lens", etc.
  productBrand: text("product_brand"),
  productModel: text("product_model"),
  totalSalesCount: integer("total_sales_count").default(0).notNull(),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  averageOrderValue: decimal("average_order_value", { precision: 10, scale: 2 }).default("0"),
  monthlyTrend: jsonb("monthly_trend").default('{}'), // { "2025-10": 120, "2025-09": 115 }
  topPairings: jsonb("top_pairings").default('[]'), // [{ item1: "frame", item2: "lens", count: 45 }]
  lastAnalyzed: timestamp("last_analyzed").defaultNow().notNull(),
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_ecp_sales_analytics_ecp").on(table.ecpId),
]);

export const biRecommendations = pgTable("bi_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ecpId: varchar("ecp_id").references(() => users.id).notNull(),
  recommendationType: text("recommendation_type").notNull(), // "stocking", "upsell", "cross_sell", "breakage_reduction", "error_reduction"
  priority: text("priority").notNull().default("medium"), // "low", "medium", "high"
  title: text("title").notNull(),
  description: text("description").notNull(),
  impact: text("impact").notNull(), // Business impact statement
  actionItems: jsonb("action_items").default('[]'), // [{ action: string, details: string }]
  dataSource: jsonb("data_source").notNull(), // { posData: [...], limsData: [...] }
  estimatedRevenueLift: decimal("estimated_revenue_lift", { precision: 12, scale: 2 }),
  estimatedErrorReduction: decimal("estimated_error_reduction", { precision: 5, scale: 4 }), // 0-1 range
  acknowledged: boolean("acknowledged").default(false).notNull(),
  acknowledgedAt: timestamp("acknowledged_at"),
  acknowledgedBy: varchar("acknowledged_by").references(() => users.id),
  implementationStartedAt: timestamp("implementation_started_at"),
  implementationCompletedAt: timestamp("implementation_completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_bi_recommendations_ecp").on(table.ecpId),
  index("idx_bi_recommendations_type").on(table.recommendationType),
  index("idx_bi_recommendations_priority").on(table.priority),
]);

/* DUPLICATE - users table moved to core domain */
// export const upsertUserSchema = createInsertSchema(users);

/* DUPLICATE - patients table moved to modular schema */
// export const insertPatientSchema = createInsertSchema(patients).omit({
//   id: true,
//   customerNumber: true,  // Auto-generated
//   createdAt: true,
// });

/* DUPLICATE - orders table moved to modular schema */
// export const insertOrderSchema = createInsertSchema(orders).omit({
//   id: true,
//   orderNumber: true,
//   orderDate: true,
//   completedAt: true,
//   patientId: true,
//   ecpId: true,
// }).extend({
//   patientName: z.string().min(1, "Patient name is required"),
//   patientDOB: z.string().optional(),
// });

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "in_production", "quality_check", "shipped", "completed", "on_hold", "cancelled"]),
});

export type OrderStatus = z.infer<typeof updateOrderStatusSchema>['status'];

/* DUPLICATE - consultLogs moved to modular schema */
// export const insertConsultLogSchema = createInsertSchema(consultLogs).omit({
//   id: true,
//   createdAt: true,
//   respondedAt: true,
//   labResponse: true,
//   status: true,
//   ecpId: true,
// });

export const insertPatientActivityLogSchema = createInsertSchema(patientActivityLog).omit({
  id: true,
  createdAt: true,
}).extend({
  activityType: z.enum([
    "profile_created",
    "profile_updated",
    "examination_scheduled",
    "examination_completed",
    "prescription_issued",
    "order_placed",
    "order_updated",
    "order_completed",
    "contact_lens_fitted",
    "recall_sent",
    "appointment_booked",
    "appointment_cancelled",
    "payment_received",
    "refund_issued",
    "complaint_logged",
    "complaint_resolved",
    "consent_updated",
    "document_uploaded",
    "note_added",
    "referral_made",
    "communication_sent"
  ]),
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  poNumber: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
});

export const insertPOLineItemSchema = createInsertSchema(poLineItems).omit({
  id: true,
  createdAt: true,
  purchaseOrderId: true,
});

export const insertTechnicalDocumentSchema = createInsertSchema(technicalDocuments).omit({
  id: true,
  uploadedAt: true,
  supplierId: true,
});

export const updatePOStatusSchema = z.object({
  status: z.enum(["draft", "sent", "acknowledged", "in_transit", "delivered", "cancelled"]),
  trackingNumber: z.string().optional(),
  actualDeliveryDate: z.string().optional(),
});

export const insertSupplierSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  email: z.string().email("Valid email is required").optional(),
  accountNumber: z.string().optional(),
  contactEmail: z.string().email("Valid contact email required").optional(),
  contactPhone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

export const updateSupplierSchema = insertSupplierSchema.partial();

export const updateOrganizationSettingsSchema = createInsertSchema(organizationSettings).omit({
  id: true,
  updatedAt: true,
  updatedById: true,
}).extend({
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

export const updateUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  userId: true,
  updatedAt: true,
});

/* DUPLICATE - eyeExamination moved to modular schema */
// export const insertEyeExaminationSchema = createInsertSchema(eyeExaminations).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true,
//   ecpId: true,
// });

/* DUPLICATE - prescription moved to modular schema */
// export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
//   id: true,
//   createdAt: true,
//   ecpId: true,
//   isSigned: true,
//   signedByEcpId: true,
//   digitalSignature: true,
//   signedAt: true,
// });

/* DUPLICATE - products moved to modular schema */
// export const insertProductSchema = createInsertSchema(products).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true,
//   ecpId: true,
// });

/* DUPLICATE - invoices moved to modular schema */
// export const insertInvoiceSchema = createInsertSchema(invoices).omit({
//   id: true,
//   invoiceNumber: true,
//   createdAt: true,
//   updatedAt: true,
//   ecpId: true,
// });

/* DUPLICATE - invoiceLineItems moved to modular schema */
// export const insertInvoiceLineItemSchema = createInsertSchema(invoiceLineItems).omit({
//   id: true,
//   createdAt: true,
//   invoiceId: true,
// });

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

// export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

// export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type OrderWithDetails = Order & {
  patient: Patient;
  ecp: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    organizationName: string | null;
  };
};

// export type InsertConsultLog = z.infer<typeof insertConsultLogSchema>;
export type ConsultLog = typeof consultLogs.$inferSelect;

export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;

export type InsertPOLineItem = z.infer<typeof insertPOLineItemSchema>;
export type POLineItem = typeof poLineItems.$inferSelect;

export type PurchaseOrderWithDetails = PurchaseOrder & {
  supplier: {
    id: string;
    organizationName: string | null;
    email: string | null;
    accountNumber: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
  };
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
  lineItems: POLineItem[];
};

export type InsertTechnicalDocument = z.infer<typeof insertTechnicalDocumentSchema>;
export type TechnicalDocument = typeof technicalDocuments.$inferSelect;

export type TechnicalDocumentWithSupplier = TechnicalDocument & {
  supplier: {
    id: string;
    organizationName: string | null;
  };
};

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type UpdateSupplier = z.infer<typeof updateSupplierSchema>;

export type UpdateOrganizationSettings = z.infer<typeof updateOrganizationSettingsSchema>;
export type OrganizationSettings = typeof organizationSettings.$inferSelect;

export type UpdateUserPreferences = z.infer<typeof updateUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

export type RoleEnum = "ecp" | "admin" | "lab_tech" | "engineer" | "supplier" | "platform_admin" | "company_admin" | "dispenser" | "store_manager";
export type UserRole = typeof userRoles.$inferSelect;
export type UserWithRoles = User & {
  availableRoles: string[];
};

// export type InsertEyeExamination = z.infer<typeof insertEyeExaminationSchema>;
export type EyeExamination = typeof eyeExaminations.$inferSelect;

export type EyeExaminationWithDetails = EyeExamination & {
  patient: Patient;
  ecp: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
};

// export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Prescription = typeof prescriptions.$inferSelect;

export type PrescriptionWithDetails = Prescription & {
  patient: Patient;
  ecp: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
  examination?: EyeExamination;
};





// Types for the new tables
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

export type QualityIssue = typeof qualityIssues.$inferSelect;
export type InsertQualityIssue = typeof qualityIssues.$inferInsert;

export type Return = typeof returns.$inferSelect;
export type InsertReturn = typeof returns.$inferInsert;

export type NonAdapt = typeof nonAdapts.$inferSelect;
export type InsertNonAdapt = typeof nonAdapts.$inferInsert;

// export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// export type InsertInvoiceLineItem = z.infer<typeof insertInvoiceLineItemSchema>;
export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

export type RevenueRecognitionEvent = typeof revenueRecognitionEvents.$inferSelect;
export type InsertRevenueRecognitionEvent = typeof revenueRecognitionEvents.$inferInsert;

export type InvoiceWithDetails = Invoice & {
  patient?: Patient;
  ecp: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
  lineItems: InvoiceLineItem[];
};

// Schema validations for new features
export const createPrescriptionAlertSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  ecpId: z.string().min(1, "ECP ID is required"),
  severity: z.enum(["info", "warning", "critical"]),
  alertType: z.string().min(1, "Alert type is required"),
  riskScore: z.number().min(0).max(1),
  historicalNonAdaptRate: z.number().min(0).max(1).optional(),
  recommendedLensType: z.string().optional(),
  recommendedMaterial: z.string().optional(),
  recommendedCoating: z.string().optional(),
  explanation: z.string().min(1, "Explanation is required"),
  metadata: z.record(z.any()).optional(),
});

export const updatePrescriptionAlertSchema = z.object({
  dismissedAt: z.date().optional(),
  dismissedBy: z.string().optional(),
  actionTaken: z.string().optional(),
  actionTakenAt: z.date().optional(),
});

export const createBIRecommendationSchema = z.object({
  ecpId: z.string().min(1, "ECP ID is required"),
  recommendationType: z.enum(["stocking", "upsell", "cross_sell", "breakage_reduction", "error_reduction"]),
  priority: z.enum(["low", "medium", "high"]).optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  impact: z.string().min(1, "Impact statement is required"),
  actionItems: z.array(z.object({
    action: z.string(),
    details: z.string().optional(),
  })).optional(),
  dataSource: z.record(z.any()),
  estimatedRevenueLift: z.number().optional(),
  estimatedErrorReduction: z.number().min(0).max(1).optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateBIRecommendationSchema = z.object({
  acknowledged: z.boolean().optional(),
  acknowledgedBy: z.string().optional(),
  implementationStartedAt: z.date().optional(),
  implementationCompletedAt: z.date().optional(),
});

// Types for new features
export type RxFrameLensAnalytic = typeof rxFrameLensAnalytics.$inferSelect;
export type InsertRxFrameLensAnalytic = typeof rxFrameLensAnalytics.$inferInsert;

export type PrescriptionAlert = typeof prescriptionAlerts.$inferSelect;
export type InsertPrescriptionAlert = typeof prescriptionAlerts.$inferInsert;

export type EcpProductSalesAnalytic = typeof eciProductSalesAnalytics.$inferSelect;
export type InsertEcpProductSalesAnalytic = typeof eciProductSalesAnalytics.$inferInsert;

export type BIRecommendation = typeof biRecommendations.$inferSelect;
export type InsertBIRecommendation = typeof biRecommendations.$inferInsert;

export type CreatePrescriptionAlert = z.infer<typeof createPrescriptionAlertSchema>;
export type UpdatePrescriptionAlert = z.infer<typeof updatePrescriptionAlertSchema>;
export type CreateBIRecommendation = z.infer<typeof createBIRecommendationSchema>;
export type UpdateBIRecommendation = z.infer<typeof updateBIRecommendationSchema>;

// ============================================================
// CLINICAL AI ENGINE: AI DISPENSING ASSISTANT
// ============================================================
// The "Three-Legged" AI Model System:
// Leg 1: LIMS Manufacturing & Clinical Model (trained on anonymized job data)
// Leg 2: Optom NLP Intent Model (reads clinical notes and extracts clinical context)
// Leg 3: ECP Business Model (reads ECP's CSV catalog for inventory and pricing)
// ============================================================

// Enum for NLP Intent Tags extracted from clinical notes
export const nlpIntentTagEnum = pgEnum("nlp_intent_tag", [
  "first_time_pal",
  "first_time_progressive",
  "cvs_syndrome",
  "computer_heavy_use",
  "night_driving_complaint",
  "glare_complaint",
  "near_work_focus",
  "occupational_hazard",
  "sports_activity",
  "high_prescription",
  "presbyopia_onset",
  "astigmatism_high",
  "anisometropia",
  "monovision_candidate",
  "light_sensitive",
  "blue_light_concern",
  "uv_protection_needed",
  "anti_reflective_needed",
  "scratch_resistant_needed",
  "impact_resistant_needed"
]);

// Table: LIMS Clinical Analytics - stores patterns and outcomes
export const limsClinicalAnalytics = pgTable("lims_clinical_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lensType: text("lens_type").notNull(),
  lensMaterial: text("lens_material").notNull(),
  coating: text("coating").notNull(),
  frameWrapAngle: decimal("frame_wrap_angle", { precision: 5, scale: 2 }),
  prescriptionPower: jsonb("prescription_power"), // { odSphere, osCylinder, etc }
  
  // Clinical outcomes from anonymized LIMS data
  totalOrdersAnalyzed: integer("total_orders_analyzed").default(0).notNull(),
  nonAdaptCount: integer("non_adapt_count").default(0).notNull(),
  remakeCount: integer("remake_count").default(0).notNull(),
  successRate: decimal("success_rate", { precision: 5, scale: 4 }).default("0").notNull(), // 0-1
  nonAdaptRate: decimal("non_adapt_rate", { precision: 5, scale: 4 }).default("0").notNull(),
  remakeRate: decimal("remake_rate", { precision: 5, scale: 4 }).default("0").notNull(),
  
  // Pattern insights for specific clinical scenarios
  patternInsights: jsonb("pattern_insights"), // { axis_90_high_cylinder: { nonAdaptRate: 0.15, count: 150 }, ... }
  clinicalContext: jsonb("clinical_context"), // { bestFor: ["first_time_progressive"], worstFor: ["high_wrap"] }
  
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  metadata: jsonb("metadata"),
});

// Table: NLP Clinical Notes Analysis
export const nlpClinicalAnalysis = pgTable("nlp_clinical_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  
  // Original clinical notes
  rawClinicalNotes: text("raw_clinical_notes").notNull(),
  
  // Extracted intent tags
  intentTags: jsonb("intent_tags").notNull(), // [{ tag: "first_time_progressive", confidence: 0.95 }, ...]
  
  // Clinical context extraction
  patientLifestyle: text("patient_lifestyle"), // "heavy computer use", "outdoor sports", etc
  patientComplaints: jsonb("patient_complaints"), // ["glare during night driving", "eye strain"]
  clinicalFlags: jsonb("clinical_flags"), // ["high_rx", "new_wearer", "high_astigmatism"]
  
  // Summarized clinical intent
  clinicalSummary: text("clinical_summary"),
  recommendedLensCharacteristics: jsonb("recommended_lens_characteristics"), // { softDesign: true, blueLight: true }
  
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 4 }).default("0.8").notNull(),
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_nlp_analysis_order").on(table.orderId),
]);

// Table: ECP Catalog Integration - parsed from uploaded CSV
export const ecpCatalogData = pgTable("ecp_catalog_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ecpId: varchar("ecp_id").references(() => users.id).notNull(),
  
  // Product information
  productSku: text("product_sku").notNull(),
  productName: text("product_name").notNull(),
  brand: text("brand"),
  category: text("category"), // "lens", "frame", "coating", "material"
  
  // Lens specifications (if applicable)
  lensType: text("lens_type"),
  lensMaterial: text("lens_material"),
  coating: text("coating"),
  designFeatures: jsonb("design_features"), // { softDesign: true, antiGlare: true }
  
  // Business data
  retailPrice: decimal("retail_price", { precision: 10, scale: 2 }).notNull(),
  wholesalePrice: decimal("wholesale_price", { precision: 10, scale: 2 }),
  stockQuantity: integer("stock_quantity").default(0).notNull(),
  isInStock: boolean("is_in_stock").default(true).notNull(),
  
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_ecp_catalog_ecp_id").on(table.ecpId),
  index("idx_ecp_catalog_sku").on(table.productSku),
]);

// Table: AI Dispensing Recommendations - Good/Better/Best
/* DUPLICATE - Moved to modular schema
export const aiDispensingRecommendations = pgTable("ai_dispensing_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  ecpId: varchar("ecp_id").references(() => users.id).notNull(),
  nlpAnalysisId: varchar("nlp_analysis_id").references(() => nlpClinicalAnalysis.id),
  
  // Original prescription and clinical context
  rxData: jsonb("rx_data").notNull(), // { odSphere, odCylinder, ... }
  clinicalIntentTags: jsonb("clinical_intent_tags").notNull(), // Extracted from NLP
  clinicalNotesSummary: text("clinical_notes_summary"),
  
  // The three-tiered recommendation
  recommendations: jsonb("recommendations").notNull(), // [{ tier: "BEST", recommendation: {...} }, ...]
  
  // Recommendation structure for each tier:
  // {
  //   tier: "BEST" | "BETTER" | "GOOD",
  //   lens: { type, material, design },
  //   coating: { name, features },
  //   retailPrice: number,
  //   matchScore: number,
  //   clinicalJustification: string,
  //   lifeStyleJustification: string,
  //   clincialContext: { tag: "first_time_progressive", justification: "..." }
  // }
  
  // Analysis metadata
  limsPatternMatch: jsonb("lims_pattern_match"), // Links to LIMS analytics
  clinicalConfidenceScore: decimal("clinical_confidence_score", { precision: 5, scale: 4 }).notNull(),
  
  // Recommendation status
  recommendationStatus: text("recommendation_status").default("pending"), // pending, accepted, rejected, customized
  acceptedRecommation: jsonb("accepted_recommendation"), // If ECP selected one
  acceptedAt: timestamp("accepted_at"),
  customizationApplied: text("customization_applied"),
  customizedAt: timestamp("customized_at"),
  
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_ai_recommendations_order").on(table.orderId),
  index("idx_ai_recommendations_ecp").on(table.ecpId),
  index("idx_ai_recommendations_status").on(table.recommendationStatus),
]); */

// Validation Schemas for AI Engine

// Prescription data (from order)
// Updated to use numeric types matching database decimal columns
export const prescriptionDataSchema = z.object({
  odSphere: z.number().min(-20).max(20).optional().or(z.string().regex(/^-?\d+\.?\d*$/).transform(Number)),
  odCylinder: z.number().min(-10).max(0).optional().or(z.string().regex(/^-?\d+\.?\d*$/).transform(Number)),
  odAxis: z.number().int().min(0).max(180).optional().or(z.string().regex(/^\d+$/).transform(Number)),
  odAdd: z.number().min(0).max(4).optional().or(z.string().regex(/^\d+\.?\d*$/).transform(Number)),
  osSphere: z.number().min(-20).max(20).optional().or(z.string().regex(/^-?\d+\.?\d*$/).transform(Number)),
  osCylinder: z.number().min(-10).max(0).optional().or(z.string().regex(/^-?\d+\.?\d*$/).transform(Number)),
  osAxis: z.number().int().min(0).max(180).optional().or(z.string().regex(/^\d+$/).transform(Number)),
  osAdd: z.number().min(0).max(4).optional().or(z.string().regex(/^\d+\.?\d*$/).transform(Number)),
  pd: z.number().min(40).max(80).optional().or(z.string().regex(/^\d+\.?\d*$/).transform(Number)),
});

// Clinical notes input for NLP analysis
export const clinicalNotesInputSchema = z.object({
  rawNotes: z.string().min(10, "Clinical notes must be at least 10 characters"),
  patientAge: z.number().optional(),
  occupation: z.string().optional(),
});

// ECP catalog CSV upload schema
export const ecpCatalogUploadSchema = z.object({
  ecpId: z.string().min(1, "ECP ID required"),
  csvData: z.array(z.object({
    sku: z.string().min(1),
    name: z.string().min(1),
    brand: z.string().optional(),
    category: z.string().optional(),
    lensType: z.string().optional(),
    lensMaterial: z.string().optional(),
    coating: z.string().optional(),
    retailPrice: z.number().positive(),
    wholesalePrice: z.number().optional(),
    stockQuantity: z.number().nonnegative(),
  })),
});

// AI Analysis Request
export const aiAnalysisRequestSchema = z.object({
  orderId: z.string().min(1, "Order ID required"),
  ecpId: z.string().min(1, "ECP ID required"),
  prescription: prescriptionDataSchema,
  clinicalNotes: clinicalNotesInputSchema,
  frameData: z.object({
    wrapAngle: z.number().optional(),
    type: z.string().optional(),
  }).optional(),
});

// Response schema for recommendations
export const recommendationTierSchema = z.object({
  tier: z.enum(["BEST", "BETTER", "GOOD"]),
  lens: z.object({
    type: z.string(),
    material: z.string(),
    design: z.string().optional(),
  }),
  coating: z.object({
    name: z.string(),
    features: z.array(z.string()),
  }),
  retailPrice: z.number(),
  matchScore: z.number().min(0).max(1),
  clinicalJustification: z.string(),
  lifeStyleJustification: z.string(),
  clinicalContext: z.array(z.object({
    tag: z.string(),
    justification: z.string(),
  })),
});

export const aiRecommendationResponseSchema = z.object({
  orderId: z.string(),
  recommendations: z.array(recommendationTierSchema),
  clinicalConfidenceScore: z.number().min(0).max(1),
  analysisMetadata: z.object({
    nlpConfidence: z.number().min(0).max(1),
    limsMatchCount: z.number(),
    patternMatches: z.array(z.string()),
  }),
});

// Types for AI Engine
export type LimsClinicalAnalytic = typeof limsClinicalAnalytics.$inferSelect;
export type InsertLimsClinicialAnalytic = typeof limsClinicalAnalytics.$inferInsert;

export type NlpClinicalAnalysis = typeof nlpClinicalAnalysis.$inferSelect;
export type InsertNlpClinicalAnalysis = typeof nlpClinicalAnalysis.$inferInsert;

export type EcpCatalogData = typeof ecpCatalogData.$inferSelect;
export type InsertEcpCatalogData = typeof ecpCatalogData.$inferInsert;

export type AiDispensingRecommendation = typeof aiDispensingRecommendations.$inferSelect;
export type InsertAiDispensingRecommendation = typeof aiDispensingRecommendations.$inferInsert;

export type PrescriptionData = z.infer<typeof prescriptionDataSchema>;
export type ClinicalNotesInput = z.infer<typeof clinicalNotesInputSchema>;
export type AiAnalysisRequest = z.infer<typeof aiAnalysisRequestSchema>;
export type RecommendationTier = z.infer<typeof recommendationTierSchema>;
export type AiRecommendationResponse = z.infer<typeof aiRecommendationResponseSchema>;

// ============== COMPANY & AI SYSTEM SCHEMAS ==============

// Company schemas
/* DUPLICATE - company moved to modular schema */
// export const insertCompanySchema = createInsertSchema(companies);
// export const updateCompanySchema = insertCompanySchema.partial();

export type Company = typeof companies.$inferSelect;
// export type InsertCompany = typeof companies.$inferInsert;

// Company-Supplier relationship schemas
export const insertCompanySupplierRelationshipSchema = createInsertSchema(companySupplierRelationships);

export type CompanySupplierRelationship = typeof companySupplierRelationships.$inferSelect;
export type InsertCompanySupplierRelationship = typeof companySupplierRelationships.$inferInsert;

// AI Conversation schemas
/* DUPLICATE - aiConversation moved to modular schema */
// export const insertAiConversationSchema = createInsertSchema(aiConversations);
// export const updateAiConversationSchema = insertAiConversationSchema.partial();

export type AiConversation = typeof aiConversations.$inferSelect;
// export type InsertAiConversation = typeof aiConversations.$inferInsert;

// AI Message schemas
/* DUPLICATE - aiMessages moved to modular schema */
// export const insertAiMessageSchema = createInsertSchema(aiMessages);

export type AiMessage = typeof aiMessages.$inferSelect;
// export type InsertAiMessage = typeof aiMessages.$inferInsert;

// AI Knowledge Base schemas
/* DUPLICATE - aiKnowledgeBase moved to modular schema */
// export const insertAiKnowledgeBaseSchema = createInsertSchema(aiKnowledgeBase);
// export const updateAiKnowledgeBaseSchema = insertAiKnowledgeBaseSchema.partial();

export type AiKnowledgeBase = typeof aiKnowledgeBase.$inferSelect;
// export type InsertAiKnowledgeBase = typeof aiKnowledgeBase.$inferInsert;

// AI Learning Data schemas
/* DUPLICATE - aiLearningData moved to modular schema */
// export const insertAiLearningDataSchema = createInsertSchema(aiLearningData);
// export const updateAiLearningDataSchema = insertAiLearningDataSchema.partial();

export type AiLearningData = typeof aiLearningData.$inferSelect;
// export type InsertAiLearningData = typeof aiLearningData.$inferInsert;

// AI Feedback schemas
/* DUPLICATE - aiFeedback moved to modular schema */
// export const insertAiFeedbackSchema = createInsertSchema(aiFeedback);

export type AiFeedback = typeof aiFeedback.$inferSelect;

// Backwards-compatible aliases (some server modules reference 'AI' uppercase prefixes)
export type AIModelVersion = typeof aiModelVersions.$inferSelect;
export type InsertAIModelVersion = typeof aiModelVersions.$inferInsert;
export type AIModelDeployment = typeof aiModelDeployments.$inferSelect;
export type InsertAIModelDeployment = typeof aiModelDeployments.$inferInsert;
export type AITrainingJob = typeof aiTrainingJobs.$inferSelect;
export type InsertAITrainingJob = typeof aiTrainingJobs.$inferInsert;
export type MasterTrainingDataset = typeof masterTrainingDatasets.$inferSelect;
export type InsertMasterTrainingDataset = typeof masterTrainingDatasets.$inferInsert;
// export type InsertAiFeedback = typeof aiFeedback.$inferInsert;

// Permission schemas
/* DUPLICATE - permissions moved to modular schema */
// export const insertPermissionSchema = createInsertSchema(permissions);
// export const updatePermissionSchema = insertPermissionSchema.partial();

export type Permission = typeof permissions.$inferSelect;
// export type InsertPermission = typeof permissions.$inferInsert;

// Role Permission schemas
/* DUPLICATE - rolePermissions moved to modular schema */
// export const insertRolePermissionSchema = createInsertSchema(rolePermissions);

export type RolePermission = typeof rolePermissions.$inferSelect;
// export type InsertRolePermission = typeof rolePermissions.$inferInsert;

// User Custom Permission schemas
/* DUPLICATE - userCustomPermissions moved to modular schema */
// export const insertUserCustomPermissionSchema = createInsertSchema(userCustomPermissions);

export type UserCustomPermission = typeof userCustomPermissions.$inferSelect;
// export type InsertUserCustomPermission = typeof userCustomPermissions.$inferInsert;

// Dynamic Roles schemas
/* DUPLICATE - dynamicRoles moved to modular schema */
// export const insertDynamicRoleSchema = createInsertSchema(dynamicRoles).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true,
// });
// export const updateDynamicRoleSchema = insertDynamicRoleSchema.partial();

export type DynamicRole = typeof dynamicRoles.$inferSelect;
// export type InsertDynamicRole = z.infer<typeof insertDynamicRoleSchema>;

// Dynamic Role Permissions schemas
/* DUPLICATE - dynamicRolePermissions moved to modular schema */
// export const insertDynamicRolePermissionSchema = createInsertSchema(dynamicRolePermissions).omit({
//   id: true,
//   createdAt: true,
// });

export type DynamicRolePermission = typeof dynamicRolePermissions.$inferSelect;
// export type InsertDynamicRolePermission = z.infer<typeof insertDynamicRolePermissionSchema>;

// User Dynamic Roles schemas
/* DUPLICATE - userDynamicRoles moved to modular schema */
// export const insertUserDynamicRoleSchema = createInsertSchema(userDynamicRoles).omit({
//   id: true,
//   assignedAt: true,
// });

export type UserDynamicRole = typeof userDynamicRoles.$inferSelect;
// export type InsertUserDynamicRole = z.infer<typeof insertUserDynamicRoleSchema>;

// Role Change Audit schemas
/* DUPLICATE - roleChangeAudit moved to modular schema */
// export const insertRoleChangeAuditSchema = createInsertSchema(roleChangeAudit).omit({
//   id: true,
//   changedAt: true,
// });

export type RoleChangeAudit = typeof roleChangeAudit.$inferSelect;
// export type InsertRoleChangeAudit = z.infer<typeof insertRoleChangeAuditSchema>;

// Audit Log schemas
/* DUPLICATE - auditLogs moved to modular schema */
// export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
//   id: true,
//   timestamp: true,
// });

export type AuditLog = typeof auditLogs.$inferSelect;
// export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Test Rooms schemas
/* DUPLICATE - testRoom moved to modular schema */
// export const insertTestRoomSchema = createInsertSchema(testRooms);
// export const updateTestRoomSchema = insertTestRoomSchema.partial();

export type TestRoom = typeof testRooms.$inferSelect;
// export type InsertTestRoom = typeof testRooms.$inferInsert;

// Test Room Bookings schemas
export const insertTestRoomBookingSchema = createInsertSchema(testRoomBookings);
export const updateTestRoomBookingSchema = insertTestRoomBookingSchema.partial();

export type TestRoomBooking = typeof testRoomBookings.$inferSelect;
export type InsertTestRoomBooking = typeof testRoomBookings.$inferInsert;

// GOC Compliance Checks schemas
/* DUPLICATE - gocComplianceCheck moved to modular schema */
// export const insertGocComplianceCheckSchema = createInsertSchema(gocComplianceChecks);
// export const updateGocComplianceCheckSchema = insertGocComplianceCheckSchema.partial();

export type GocComplianceCheck = typeof gocComplianceChecks.$inferSelect;
// export type InsertGocComplianceCheck = typeof gocComplianceChecks.$inferInsert;

// Prescription Templates schemas
export const insertPrescriptionTemplateSchema = createInsertSchema(prescriptionTemplates);
export const updatePrescriptionTemplateSchema = insertPrescriptionTemplateSchema.partial();

export type PrescriptionTemplate = typeof prescriptionTemplates.$inferSelect;
export type InsertPrescriptionTemplate = typeof prescriptionTemplates.$inferInsert;

// Clinical Protocols schemas
/* DUPLICATE - clinicalProtocol moved to modular schema */
// export const insertClinicalProtocolSchema = createInsertSchema(clinicalProtocols);
// export const updateClinicalProtocolSchema = insertClinicalProtocolSchema.partial();

export type ClinicalProtocol = typeof clinicalProtocols.$inferSelect;
// export type InsertClinicalProtocol = typeof clinicalProtocols.$inferInsert;

// ============================================
// POS & Multi-Tenant Tables
// ============================================

// POS Transactions
export const posTransactions = pgTable("pos_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  transactionNumber: varchar("transaction_number", { length: 50 }).notNull(),
  staffId: varchar("staff_id").references(() => users.id).notNull(),
  patientId: varchar("patient_id").references(() => patients.id),
  
  // Transaction details
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  
  // Payment info
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // 'cash', 'card', 'insurance', 'split'
  paymentStatus: varchar("payment_status", { length: 50 }).default("completed"), // 'completed', 'refunded', 'partial_refund'
  cashReceived: decimal("cash_received", { precision: 10, scale: 2 }),
  changeGiven: decimal("change_given", { precision: 10, scale: 2 }),
  
  // Metadata
  notes: text("notes"),
  refundReason: text("refund_reason"),
  refundedAt: timestamp("refunded_at"),
  transactionDate: timestamp("transaction_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_pos_transactions_company_id").on(table.companyId),
  index("idx_pos_transactions_staff_id").on(table.staffId),
  index("idx_pos_transactions_date").on(table.transactionDate),
  index("idx_pos_transactions_status").on(table.paymentStatus),
]);

// POS Transaction Items
export const posTransactionItems = pgTable("pos_transaction_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").references(() => posTransactions.id, { onDelete: "cascade" }).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_pos_items_transaction_id").on(table.transactionId),
  index("idx_pos_items_product_id").on(table.productId),
]);

// PDF Templates
export const pdfTemplates = pgTable("pdf_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  
  name: varchar("name", { length: 100 }).notNull(),
  templateType: varchar("template_type", { length: 50 }).notNull(), // 'invoice', 'receipt', 'prescription', 'report', 'order'
  htmlTemplate: text("html_template").notNull(),
  cssStyles: text("css_styles"),
  
  // Branding
  headerLogoUrl: text("header_logo_url"),
  footerText: text("footer_text"),
  primaryColor: varchar("primary_color", { length: 7 }).default("#000000"),
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#666666"),
  
  // Settings
  isDefault: boolean("is_default").default(false),
  paperSize: varchar("paper_size", { length: 20 }).default("A4"), // 'A4', 'Letter', 'Receipt'
  orientation: varchar("orientation", { length: 20 }).default("portrait"), // 'portrait', 'landscape'
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_pdf_templates_company_id").on(table.companyId),
  index("idx_pdf_templates_type").on(table.templateType),
]);

// Insert and validation schemas
export const insertPosTransactionSchema = createInsertSchema(posTransactions, {
  subtotal: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid subtotal"),
  taxAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid tax amount").optional(),
  discountAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid discount amount").optional(),
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid total amount"),
  paymentMethod: z.enum(["cash", "card", "insurance", "split", "debit", "mobile_pay"]),
  paymentStatus: z.enum(["completed", "refunded", "partial_refund", "pending"]),
});

export const updatePosTransactionSchema = insertPosTransactionSchema.partial();

export const insertPosTransactionItemSchema = createInsertSchema(posTransactionItems, {
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price"),
  lineTotal: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid line total"),
});

export const insertPdfTemplateSchema = createInsertSchema(pdfTemplates, {
  templateType: z.enum(["invoice", "receipt", "prescription", "report", "order", "label"]),
  paperSize: z.enum(["A4", "Letter", "Receipt", "Label"]),
  orientation: z.enum(["portrait", "landscape"]),
});

export const updatePdfTemplateSchema = insertPdfTemplateSchema.partial();

// Type exports
export type PosTransaction = typeof posTransactions.$inferSelect;
export type InsertPosTransaction = typeof posTransactions.$inferInsert;

export type PosTransactionItem = typeof posTransactionItems.$inferSelect;
export type InsertPosTransactionItem = typeof posTransactionItems.$inferInsert;

export type PdfTemplate = typeof pdfTemplates.$inferSelect;
export type InsertPdfTemplate = typeof pdfTemplates.$inferInsert;

// ============================================
// Inventory Movement Audit Trail
// ============================================

export const movementTypeEnum = pgEnum("movement_type", [
  "sale",           // Product sold via POS
  "refund",         // Product returned/refunded
  "adjustment",     // Manual stock adjustment
  "received",       // Stock received from supplier
  "transfer_out",   // Transferred to another location
  "transfer_in",    // Received from another location
  "damaged",        // Marked as damaged/lost
  "initial"         // Initial stock entry
]);

/* DUPLICATE - Moved to modular schema
export const inventoryMovements = pgTable("inventory_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  productId: varchar("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  
  // Movement details
  movementType: movementTypeEnum("movement_type").notNull(),
  quantity: integer("quantity").notNull(), // Positive or negative
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  
  // Reference tracking
  referenceType: varchar("reference_type", { length: 50 }), // 'pos_transaction', 'manual_adjustment', 'purchase_order'
  referenceId: varchar("reference_id"), // ID of related transaction/order
  
  // Audit information
  reason: text("reason"),
  notes: text("notes"),
  performedBy: varchar("performed_by").references(() => users.id).notNull(),
  
  // Location tracking (for multi-location support)
  locationId: varchar("location_id"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_inventory_movements_company").on(table.companyId),
  index("idx_inventory_movements_product").on(table.productId),
  index("idx_inventory_movements_type").on(table.movementType),
  index("idx_inventory_movements_date").on(table.createdAt),
  index("idx_inventory_movements_performed_by").on(table.performedBy),
]); */

// Product Variants for SKU management
/* DUPLICATE - Moved to modular schema
export const productVariants = pgTable("product_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  
  // Variant details
  variantSku: varchar("variant_sku", { length: 100 }).notNull(),
  variantName: varchar("variant_name", { length: 255 }).notNull(),
  
  // Variant attributes
  color: varchar("color", { length: 50 }),
  size: varchar("size", { length: 50 }),
  style: varchar("style", { length: 100 }),
  attributes: jsonb("attributes"), // Additional custom attributes
  
  // Pricing (can override parent product)
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  
  // Stock tracking
  stockQuantity: integer("stock_quantity").default(0).notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(10),
  
  // Variant specific data
  barcode: varchar("barcode", { length: 100 }),
  imageUrl: text("image_url"),
  
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_product_variants_product").on(table.productId),
  index("idx_product_variants_company").on(table.companyId),
  index("idx_product_variants_sku").on(table.variantSku),
  index("idx_product_variants_barcode").on(table.barcode),
]); */

// Low Stock Alerts
export const lowStockAlerts = pgTable("low_stock_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  productId: varchar("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  variantId: varchar("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
  
  // Alert details
  alertType: varchar("alert_type", { length: 50 }).notNull(), // 'low_stock', 'out_of_stock', 'reorder_point'
  currentStock: integer("current_stock").notNull(),
  threshold: integer("threshold").notNull(),
  
  // Status
  status: varchar("status", { length: 50 }).default("active"), // 'active', 'acknowledged', 'resolved'
  acknowledgedBy: varchar("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
  
  // Auto-reorder suggestion
  suggestedReorderQuantity: integer("suggested_reorder_quantity"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_low_stock_alerts_company").on(table.companyId),
  index("idx_low_stock_alerts_product").on(table.productId),
  index("idx_low_stock_alerts_status").on(table.status),
]);

// ============================================
// Email Tracking & Communication System
// ============================================

// Email templates for reusable email content
/* DUPLICATE - Moved to modular schema
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id).notNull(),
  
  // Template details
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  emailType: emailTypeEnum("email_type").notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  
  // Template variables (e.g., {{customerName}}, {{invoiceNumber}})
  variables: jsonb("variables"), // Array of available variable names
  
  // Settings
  isActive: boolean("is_active").default(true).notNull(),
  isDefault: boolean("is_default").default(false), // Default template for this type
  
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_email_templates_company").on(table.companyId),
  index("idx_email_templates_type").on(table.emailType),
  index("idx_email_templates_active").on(table.isActive),
]); */

// Email logs - all sent emails with tracking
/* DUPLICATE - Moved to modular schema
export const emailLogs = pgTable("email_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id).notNull(),
  
  // Recipient info
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  recipientName: varchar("recipient_name", { length: 255 }),
  patientId: varchar("patient_id").references(() => patients.id),
  
  // Email details
  emailType: emailTypeEnum("email_type").notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  
  // Tracking
  status: emailStatusEnum("status").default("queued").notNull(),
  trackingId: varchar("tracking_id", { length: 100 }).unique(), // Unique tracking pixel ID
  
  // Related entities
  templateId: varchar("template_id").references(() => emailTemplates.id),
  relatedEntityType: varchar("related_entity_type", { length: 50 }), // 'invoice', 'appointment', 'prescription'
  relatedEntityId: varchar("related_entity_id"), // ID of invoice, appointment, etc.
  
  // Delivery info
  sentBy: varchar("sent_by").references(() => users.id).notNull(),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  
  // Engagement tracking
  openCount: integer("open_count").default(0).notNull(),
  firstOpenedAt: timestamp("first_opened_at"),
  lastOpenedAt: timestamp("last_opened_at"),
  clickCount: integer("click_count").default(0).notNull(),
  firstClickedAt: timestamp("first_clicked_at"),
  lastClickedAt: timestamp("last_clicked_at"),
  
  // Error handling
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0).notNull(),
  
  // Metadata
  metadata: jsonb("metadata"), // Store additional context
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_email_logs_company").on(table.companyId),
  index("idx_email_logs_recipient").on(table.recipientEmail),
  index("idx_email_logs_patient").on(table.patientId),
  index("idx_email_logs_type").on(table.emailType),
  index("idx_email_logs_status").on(table.status),
  index("idx_email_logs_sent_at").on(table.sentAt),
  index("idx_email_logs_tracking_id").on(table.trackingId),
  index("idx_email_logs_related").on(table.relatedEntityType, table.relatedEntityId),
]); */

// Email tracking events - detailed event log for analytics
/* DUPLICATE - Moved to modular schema
export const emailTrackingEvents = pgTable("email_tracking_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emailLogId: varchar("email_log_id").references(() => emailLogs.id).notNull(),
  
  // Event details
  eventType: emailEventTypeEnum("event_type").notNull(),
  eventData: jsonb("event_data"), // Click URL, bounce reason, etc.
  
  // User agent and location tracking
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  location: jsonb("location"), // City, country, coordinates if available
  device: varchar("device", { length: 50 }), // 'desktop', 'mobile', 'tablet'
  
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_email_tracking_events_log").on(table.emailLogId),
  index("idx_email_tracking_events_type").on(table.eventType),
  index("idx_email_tracking_events_timestamp").on(table.timestamp),
]); */

// Insert and validation schemas
/* DUPLICATE - inventoryMovements moved to modular schema */
// export const insertInventoryMovementSchema = createInsertSchema(inventoryMovements, {
//   quantity: z.number().int().refine(val => val !== 0, {
//     message: 'Quantity cannot be zero',
//   }),
//   movementType: z.enum(["sale", "refund", "adjustment", "received", "transfer_out", "transfer_in", "damaged", "initial"]),
// });

/* DUPLICATE - productVariants moved to modular schema */
// export const insertProductVariantSchema = createInsertSchema(productVariants, {
//   variantSku: z.string().min(1, "Variant SKU is required"),
//   variantName: z.string().min(1, "Variant name is required"),
// });

// export const updateProductVariantSchema = insertProductVariantSchema.partial();

export const insertLowStockAlertSchema = createInsertSchema(lowStockAlerts, {
  alertType: z.enum(["low_stock", "out_of_stock", "reorder_point"]),
  currentStock: z.number().int().min(0),
  threshold: z.number().int().min(0),
});

/* DUPLICATE - emailTemplates moved to modular schema */
// export const insertEmailTemplateSchema = createInsertSchema(emailTemplates, {
//   name: z.string().min(1, "Template name is required"),
//   subject: z.string().min(1, "Subject is required"),
//   htmlContent: z.string().min(1, "HTML content is required"),
//   emailType: z.enum(["invoice", "receipt", "prescription_reminder", "recall_notification", "appointment_reminder", "order_confirmation", "order_update", "marketing", "general"]),
// });

// export const updateEmailTemplateSchema = insertEmailTemplateSchema.partial();

/* DUPLICATE - emailLogs moved to modular schema */
// export const insertEmailLogSchema = createInsertSchema(emailLogs, {
//   recipientEmail: z.string().email("Valid email is required"),
//   subject: z.string().min(1, "Subject is required"),
//   htmlContent: z.string().min(1, "HTML content is required"),
//   emailType: z.enum(["invoice", "receipt", "prescription_reminder", "recall_notification", "appointment_reminder", "order_confirmation", "order_update", "marketing", "general"]),
// });

/* DUPLICATE - emailTrackingEvents moved to modular schema */
// export const insertEmailTrackingEventSchema = createInsertSchema(emailTrackingEvents, {
//   eventType: z.enum(["sent", "delivered", "opened", "clicked", "bounced", "spam", "unsubscribed"]),
// });

// Type exports
export type InventoryMovement = typeof inventoryMovements.$inferSelect;
// export type InsertInventoryMovement = typeof inventoryMovements.$inferInsert;

export type ProductVariant = typeof productVariants.$inferSelect;
// export type InsertProductVariant = typeof productVariants.$inferInsert;

export type LowStockAlert = typeof lowStockAlerts.$inferSelect;
export type InsertLowStockAlert = typeof lowStockAlerts.$inferInsert;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
// export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

export type EmailLog = typeof emailLogs.$inferSelect;
// export type InsertEmailLog = typeof emailLogs.$inferInsert;

export type EmailTrackingEvent = typeof emailTrackingEvents.$inferSelect;
// export type InsertEmailTrackingEvent = typeof emailTrackingEvents.$inferInsert;

export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = typeof equipment.$inferInsert;

// ============================================
// AI Notifications & Proactive Insights
// ============================================

export const aiNotificationTypeEnum = pgEnum("ai_notification_type", [
  "briefing",
  "alert",
  "reminder",
  "insight"
]);

export const aiNotificationPriorityEnum = pgEnum("ai_notification_priority", [
  "critical",
  "high", 
  "medium",
  "low"
]);

/**
 * AI-generated notifications and proactive insights
 * Stores daily briefings, alerts, and recommendations
 */
/* DUPLICATE - Moved to modular schema
export const aiNotifications = pgTable("ai_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id), // null = all users in company
  
  type: aiNotificationTypeEnum("type").notNull(),
  priority: aiNotificationPriorityEnum("priority").default("medium").notNull(),
  
  title: text("title").notNull(),
  message: text("message").notNull(),
  summary: text("summary"), // Short preview for list view
  
  recommendation: text("recommendation"), // AI-generated action recommendation
  actionUrl: text("action_url"), // Where to navigate when clicked
  actionLabel: text("action_label"), // Button text (e.g., "View Inventory")
  
  data: jsonb("data"), // Supporting data (e.g., product details, metrics)
  
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  
  isDismissed: boolean("is_dismissed").default(false).notNull(),
  dismissedAt: timestamp("dismissed_at"),
  
  expiresAt: timestamp("expires_at"), // Auto-hide after this date
  
  generatedBy: varchar("generated_by", { length: 50 }).default("proactive_insights"), // Which service created it
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_notifications_company").on(table.companyId, table.createdAt),
  index("idx_ai_notifications_user").on(table.userId, table.isRead),
  index("idx_ai_notifications_priority").on(table.priority, table.createdAt),
]); */

/* DUPLICATE - aiNotifications moved to modular schema */
// export const insertAiNotificationSchema = createInsertSchema(aiNotifications, {
//   type: z.enum(["briefing", "alert", "reminder", "insight"]),
//   priority: z.enum(["critical", "high", "medium", "low"]),
//   title: z.string().min(1, "Title is required"),
//   message: z.string().min(1, "Message is required"),
// });

// export const updateAiNotificationSchema = insertAiNotificationSchema.partial();

export type AiNotification = typeof aiNotifications.$inferSelect;
// export type InsertAiNotification = typeof aiNotifications.$inferInsert;

// ============================================
// AI Purchase Orders (Autonomous Purchasing)
// ============================================

export const aiPoStatusEnum = pgEnum("ai_po_status", ["draft", "pending_review", "approved", "rejected", "converted"]);

export const aiPurchaseOrders = pgTable("ai_purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // AI Generation Info
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  generatedBy: varchar("generated_by", { length: 50 }).default("autonomous_purchasing"),
  aiModel: varchar("ai_model", { length: 50 }), // Which AI model generated this
  
  // Purchase Order Details
  supplierId: varchar("supplier_id").references(() => users.id), // Suggested supplier
  supplierName: text("supplier_name"), // Cached for display
  estimatedTotal: decimal("estimated_total", { precision: 10, scale: 2 }),
  
  // AI Justification
  reason: text("reason").notNull(), // Why this PO is needed (e.g., "Low stock alert: 5 items below threshold")
  aiAnalysis: jsonb("ai_analysis"), // Full AI analysis data (metrics, trends, predictions)
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // AI confidence score (0-100)
  
  // Approval Workflow
  status: aiPoStatusEnum("status").default("pending_review").notNull(),
  reviewedById: varchar("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"), // Human feedback on approval/rejection
  
  // Conversion to Official PO
  convertedPoId: varchar("converted_po_id").references(() => purchaseOrders.id),
  convertedAt: timestamp("converted_at"),
  
  // Metadata
  expiresAt: timestamp("expires_at"), // Auto-expire old drafts
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_po_company_status").on(table.companyId, table.status),
  index("idx_ai_po_generated_at").on(table.generatedAt),
  index("idx_ai_po_supplier").on(table.supplierId),
]);

export const aiPurchaseOrderItems = pgTable("ai_purchase_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  aiPoId: varchar("ai_po_id").notNull().references(() => aiPurchaseOrders.id, { onDelete: 'cascade' }),
  
  // Product Info
  productId: varchar("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  productSku: varchar("product_sku", { length: 100 }),
  
  // Quantities
  currentStock: integer("current_stock"), // Current inventory level
  lowStockThreshold: integer("low_stock_threshold"), // Reorder point
  recommendedQuantity: integer("recommended_quantity").notNull(), // AI-calculated optimal order qty
  
  // Pricing
  estimatedUnitPrice: decimal("estimated_unit_price", { precision: 10, scale: 2 }),
  estimatedTotalPrice: decimal("estimated_total_price", { precision: 10, scale: 2 }),
  
  // AI Reasoning
  urgency: varchar("urgency", { length: 20 }).default("medium"), // critical, high, medium, low
  stockoutRisk: decimal("stockout_risk", { precision: 5, scale: 2 }), // Probability of running out (0-100)
  leadTimeDays: integer("lead_time_days"), // Expected delivery time
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_po_items_po").on(table.aiPoId),
  index("idx_ai_po_items_product").on(table.productId),
]);

export const insertAiPurchaseOrderSchema = createInsertSchema(aiPurchaseOrders, {
  status: z.enum(["draft", "pending_review", "approved", "rejected", "converted"]).optional(),
  reason: z.string().min(1, "Reason is required"),
  estimatedTotal: z.string().optional(),
  confidence: z.string().optional(),
});

export const insertAiPurchaseOrderItemSchema = createInsertSchema(aiPurchaseOrderItems, {
  recommendedQuantity: z.number().min(1, "Quantity must be at least 1"),
  productName: z.string().min(1, "Product name is required"),
});

export type AiPurchaseOrder = typeof aiPurchaseOrders.$inferSelect;
export type InsertAiPurchaseOrder = typeof aiPurchaseOrders.$inferInsert;
export type AiPurchaseOrderItem = typeof aiPurchaseOrderItems.$inferSelect;
export type InsertAiPurchaseOrderItem = typeof aiPurchaseOrderItems.$inferInsert;

// ============== CHUNK 5: DEMAND FORECASTING TABLES ==============

// Enum for forecast horizon
export const forecastHorizonEnum = pgEnum("forecast_horizon", ["week", "month", "quarter", "year"]);
export const forecastMethodEnum = pgEnum("forecast_method", ["moving_average", "exponential_smoothing", "linear_regression", "seasonal_decomposition", "ai_ml"]);

// Demand forecasts - ML predictions for future inventory needs
export const demandForecasts = pgTable("demand_forecasts", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  
  // Forecast details
  forecastDate: timestamp("forecast_date").notNull(), // Date being predicted
  predictedDemand: integer("predicted_demand").notNull(), // Predicted units
  confidenceInterval: decimal("confidence_interval", { precision: 5, scale: 2 }), // 0-100%
  
  // Methodology
  forecastMethod: forecastMethodEnum("forecast_method").default("ai_ml").notNull(),
  horizon: forecastHorizonEnum("horizon").default("week").notNull(),
  
  // Context data used for prediction
  historicalAverage: decimal("historical_average", { precision: 10, scale: 2 }),
  trendFactor: decimal("trend_factor", { precision: 5, scale: 2 }), // -100 to +100
  seasonalityFactor: decimal("seasonality_factor", { precision: 5, scale: 2 }), // 0-200
  
  // Actual results (filled in later for accuracy tracking)
  actualDemand: integer("actual_demand"),
  accuracyScore: decimal("accuracy_score", { precision: 5, scale: 2 }), // MAPE or MAE
  
  // Model metadata
  modelVersion: varchar("model_version", { length: 50 }),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(), // AI confidence 0-100
  
  // Timestamps
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_demand_forecasts_company").on(table.companyId),
  index("idx_demand_forecasts_product").on(table.productId),
  index("idx_demand_forecasts_date").on(table.forecastDate),
  index("idx_demand_forecasts_generated").on(table.generatedAt),
]);

// Seasonal patterns - detected recurring patterns
export const seasonalPatterns = pgTable("seasonal_patterns", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  productId: varchar("product_id").references(() => products.id), // null = company-wide
  
  // Pattern identification
  patternType: varchar("pattern_type", { length: 50 }).notNull(), // "weekly", "monthly", "yearly", "holiday"
  patternName: varchar("pattern_name", { length: 255 }).notNull(), // e.g., "Back to School", "Summer Peak"
  
  // Pattern details
  peakPeriod: varchar("peak_period", { length: 100 }), // e.g., "August", "Q4", "Week 12"
  demandMultiplier: decimal("demand_multiplier", { precision: 5, scale: 2 }).notNull(), // 0.5 = 50% below avg, 2.0 = 200% of avg
  
  // Statistical significance
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(), // 0-100%
  observationCount: integer("observation_count").notNull(), // Number of times pattern observed
  
  // Metadata
  firstObserved: timestamp("first_observed").notNull(),
  lastObserved: timestamp("last_observed").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_seasonal_patterns_company").on(table.companyId),
  index("idx_seasonal_patterns_product").on(table.productId),
  index("idx_seasonal_patterns_type").on(table.patternType),
]);

// Forecast accuracy tracking - measure model performance
export const forecastAccuracyMetrics = pgTable("forecast_accuracy_metrics", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  productId: varchar("product_id").references(() => products.id), // null = company-wide
  
  // Time period
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Accuracy metrics
  mape: decimal("mape", { precision: 5, scale: 2 }), // Mean Absolute Percentage Error
  mae: decimal("mae", { precision: 10, scale: 2 }), // Mean Absolute Error
  rmse: decimal("rmse", { precision: 10, scale: 2 }), // Root Mean Square Error
  
  // Counts
  totalForecasts: integer("total_forecasts").notNull(),
  accurateForecasts: integer("accurate_forecasts").notNull(), // Within 10% of actual
  
  // Model info
  forecastMethod: forecastMethodEnum("forecast_method").notNull(),
  modelVersion: varchar("model_version", { length: 50 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_forecast_accuracy_company").on(table.companyId),
  index("idx_forecast_accuracy_period").on(table.periodStart, table.periodEnd),
]);

// Export types
export const insertDemandForecastSchema = createInsertSchema(demandForecasts, {
  predictedDemand: z.number().min(0),
  confidence: z.string().optional(),
  forecastDate: z.date(),
});

export const insertSeasonalPatternSchema = createInsertSchema(seasonalPatterns, {
  patternName: z.string().min(1),
  demandMultiplier: z.string(),
  confidence: z.string(),
});

export const insertForecastAccuracyMetricSchema = createInsertSchema(forecastAccuracyMetrics, {
  totalForecasts: z.number().min(0),
  accurateForecasts: z.number().min(0),
});

export type DemandForecast = typeof demandForecasts.$inferSelect;
export type InsertDemandForecast = typeof demandForecasts.$inferInsert;
export type SeasonalPattern = typeof seasonalPatterns.$inferSelect;
export type InsertSeasonalPattern = typeof seasonalPatterns.$inferInsert;
export type ForecastAccuracyMetric = typeof forecastAccuracyMetrics.$inferSelect;
export type InsertForecastAccuracyMetric = typeof forecastAccuracyMetrics.$inferInsert;

// ============== CHUNK 6: COMPANY MARKETPLACE ==============

// Enums for marketplace
export const relationshipTypeEnum = pgEnum("relationship_type", [
  "ecp_to_lab",
  "lab_to_supplier", 
  "ecp_to_supplier",
  "lab_to_lab", // For lab networks
]);

export const connectionStatusEnum = pgEnum("connection_status", [
  "pending",
  "active",
  "rejected",
  "disconnected",
]);

// Company relationships - the network graph
export const companyRelationships = pgTable("company_relationships", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyAId: varchar("company_a_id").notNull().references(() => companies.id),
  companyBId: varchar("company_b_id").notNull().references(() => companies.id),
  relationshipType: relationshipTypeEnum("relationship_type").notNull(),
  status: connectionStatusEnum("status").notNull().default("pending"),
  
  // Connection metadata
  initiatedByCompanyId: varchar("initiated_by_company_id").notNull().references(() => companies.id),
  connectionTerms: text("connection_terms"), // Custom agreements, pricing notes
  connectionMessage: text("connection_message"), // Initial request message
  
  // Workflow tracking
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  disconnectedAt: timestamp("disconnected_at"),
  
  // Who reviewed the request
  reviewedByUserId: varchar("reviewed_by_user_id").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_company_relationships_a").on(table.companyAId),
  index("idx_company_relationships_b").on(table.companyBId),
  index("idx_company_relationships_status").on(table.status),
  index("idx_company_relationships_type").on(table.relationshipType),
]);

// Connection requests - pending approvals inbox
export const connectionRequests = pgTable("connection_requests", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fromCompanyId: varchar("from_company_id").notNull().references(() => companies.id),
  toCompanyId: varchar("to_company_id").notNull().references(() => companies.id),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  
  // Request details
  message: text("message"),
  requestedRelationshipType: relationshipTypeEnum("requested_relationship_type").notNull(),
  proposedTerms: text("proposed_terms"),
  
  // Status tracking
  status: connectionStatusEnum("status").notNull().default("pending"),
  reviewedByUserId: varchar("reviewed_by_user_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  responseMessage: text("response_message"),
  
  // Auto-expiration
  expiresAt: timestamp("expires_at"), // Auto-reject after 7 days
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_connection_requests_from").on(table.fromCompanyId),
  index("idx_connection_requests_to").on(table.toCompanyId),
  index("idx_connection_requests_status").on(table.status),
]);

// Company marketplace profiles (extends companies table)
export const companyProfiles = pgTable("company_profiles", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: varchar("company_id").notNull().references(() => companies.id).unique(),
  
  // Marketplace visibility
  isMarketplaceVisible: boolean("is_marketplace_visible").default(true).notNull(),
  marketplaceVerified: boolean("marketplace_verified").default(false).notNull(),
  featuredUntil: timestamp("featured_until"), // Premium feature
  
  // Profile content
  profileHeadline: varchar("profile_headline", { length: 200 }),
  profileDescription: text("profile_description"),
  tagline: varchar("tagline", { length: 100 }), // Short catchy phrase
  
  // Services and capabilities
  specialties: jsonb("specialties").default(sql`'[]'::jsonb`), // Array of service codes
  certifications: jsonb("certifications").default(sql`'[]'::jsonb`), // Licenses, accreditations
  equipment: jsonb("equipment").default(sql`'[]'::jsonb`), // Lab equipment list
  
  // Service details
  serviceArea: varchar("service_area", { length: 200 }), // "Greater London", "California, USA"
  turnaroundTimeDays: integer("turnaround_time_days"), // Average completion time
  minimumOrderValue: decimal("minimum_order_value", { precision: 10, scale: 2 }),
  rushServiceAvailable: boolean("rush_service_available").default(false),
  shippingMethods: jsonb("shipping_methods").default(sql`'[]'::jsonb`),
  
  // Media
  logoUrl: varchar("logo_url", { length: 500 }),
  bannerImageUrl: varchar("banner_image_url", { length: 500 }),
  galleryImages: jsonb("gallery_images").default(sql`'[]'::jsonb`), // Array of image URLs
  
  // Contact preferences
  websiteUrl: varchar("website_url", { length: 500 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  publicAddress: jsonb("public_address"), // May differ from billing address
  
  // Stats (denormalized for performance)
  totalConnections: integer("total_connections").default(0).notNull(),
  totalOrders: integer("total_orders").default(0).notNull(),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  totalReviews: integer("total_reviews").default(0).notNull(),
  
  // SEO
  slug: varchar("slug", { length: 255 }).unique(), // URL-friendly company name
  metaDescription: text("meta_description"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_company_profiles_visible").on(table.isMarketplaceVisible),
  index("idx_company_profiles_slug").on(table.slug),
  index("idx_company_profiles_service_area").on(table.serviceArea),
]);

// Export types
export const insertCompanyRelationshipSchema = createInsertSchema(companyRelationships);
export const insertConnectionRequestSchema = createInsertSchema(connectionRequests);
export const insertCompanyProfileSchema = createInsertSchema(companyProfiles);

export type CompanyRelationship = typeof companyRelationships.$inferSelect;
export type InsertCompanyRelationship = typeof companyRelationships.$inferInsert;
export type ConnectionRequest = typeof connectionRequests.$inferSelect;
export type InsertConnectionRequest = typeof connectionRequests.$inferInsert;
export type CompanyProfile = typeof companyProfiles.$inferSelect;
export type InsertCompanyProfile = typeof companyProfiles.$inferInsert;

// ============================================================================
// CHUNK 7: CROSS-TENANT ANALYTICS (Platform Admin Revenue Stream)
// ============================================================================
// Tables for aggregated, anonymized insights across all companies
// Enables platform to monetize industry data and market intelligence

/**
 * Market Insights - Aggregated industry data for monetization
 * Examples: "Average lens cost in UK", "Top-selling frame brands nationwide"
 */
export const marketInsights = pgTable("market_insights", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Insight metadata
  insightType: varchar("insight_type", { length: 100 }).notNull(), // 'pricing', 'inventory', 'patient_metrics', 'operational'
  category: varchar("category", { length: 100 }).notNull(), // 'lenses', 'frames', 'services', 'equipment'
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Time period
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Geographic scope
  region: varchar("region", { length: 100 }), // 'UK', 'London', 'North America', null = global
  country: varchar("country", { length: 100 }),
  
  // Data aggregation
  dataPoints: jsonb("data_points").$type<{
    metric: string;
    value: number;
    unit?: string;
    percentile?: number;
  }[]>().notNull(), // Array of metric values
  
  // Sample size (for transparency)
  companiesIncluded: integer("companies_included").notNull(), // Must be >= minimum threshold
  recordsAnalyzed: integer("records_analyzed").notNull(),
  
  // Confidence metrics
  confidenceLevel: decimal("confidence_level", { precision: 5, scale: 2 }), // 0-100%
  marginOfError: decimal("margin_of_error", { precision: 5, scale: 2 }),
  
  // Monetization
  accessLevel: varchar("access_level", { length: 50 }).notNull().default('free'), // 'free', 'premium', 'enterprise'
  price: decimal("price", { precision: 10, scale: 2 }), // Price in cents
  
  // Metadata
  generatedBy: varchar("generated_by", { length: 255 }), // 'system' or userId
  status: varchar("status", { length: 50 }).notNull().default('draft'), // 'draft', 'published', 'archived'
  publishedAt: timestamp("published_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_market_insights_type").on(table.insightType),
  index("idx_market_insights_category").on(table.category),
  index("idx_market_insights_region").on(table.region),
  index("idx_market_insights_period").on(table.periodStart, table.periodEnd),
  index("idx_market_insights_status").on(table.status),
  index("idx_market_insights_access").on(table.accessLevel),
]);

/**
 * Platform Statistics - High-level metrics for platform monitoring
 * Used for internal dashboards and investor reporting
 */
export const platformStatistics = pgTable("platform_statistics", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Time period
  date: date("date").notNull(), // Daily granularity
  periodType: varchar("period_type", { length: 50 }).notNull().default('daily'), // 'daily', 'weekly', 'monthly'
  
  // Company metrics
  totalCompanies: integer("total_companies").notNull().default(0),
  activeCompanies: integer("active_companies").notNull().default(0), // Active in last 30 days
  newCompaniesAdded: integer("new_companies_added").notNull().default(0),
  companiesByType: jsonb("companies_by_type").$type<{
    ecp: number;
    lab: number;
    supplier: number;
    hybrid: number;
  }>(),
  
  // User metrics
  totalUsers: integer("total_users").notNull().default(0),
  activeUsers: integer("active_users").notNull().default(0), // Active in last 30 days
  newUsersAdded: integer("new_users_added").notNull().default(0),
  
  // Subscription metrics
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).notNull().default('0'),
  mrr: decimal("mrr", { precision: 12, scale: 2 }).notNull().default('0'), // Monthly Recurring Revenue
  arr: decimal("arr", { precision: 12, scale: 2 }).notNull().default('0'), // Annual Recurring Revenue
  churnRate: decimal("churn_rate", { precision: 5, scale: 2 }), // Percentage
  subscriptionsByPlan: jsonb("subscriptions_by_plan").$type<Record<string, number>>(),
  
  // Engagement metrics
  ordersCreated: integer("orders_created").notNull().default(0),
  patientsAdded: integer("patients_added").notNull().default(0),
  invoicesGenerated: integer("invoices_generated").notNull().default(0),
  aiQueriesProcessed: integer("ai_queries_processed").notNull().default(0),
  
  // Platform health
  apiCallsTotal: integer("api_calls_total").notNull().default(0),
  apiErrorRate: decimal("api_error_rate", { precision: 5, scale: 2 }), // Percentage
  averageResponseTime: integer("average_response_time"), // Milliseconds
  uptimePercentage: decimal("uptime_percentage", { precision: 5, scale: 2 }),
  
  // Network effects (from Chunk 6)
  totalConnections: integer("total_connections").notNull().default(0),
  connectionRequestsCreated: integer("connection_requests_created").notNull().default(0),
  connectionApprovalRate: decimal("connection_approval_rate", { precision: 5, scale: 2 }),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_platform_statistics_date").on(table.date),
  index("idx_platform_statistics_period").on(table.periodType),
  uniqueIndex("idx_platform_statistics_date_period").on(table.date, table.periodType),
]);

/**
 * Aggregated Metrics - Pre-computed aggregations for fast queries
 * Refreshed periodically (hourly/daily) to avoid expensive real-time calculations
 */
export const aggregatedMetrics = pgTable("aggregated_metrics", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Metric identity
  metricType: varchar("metric_type", { length: 100 }).notNull(), // 'avg_lens_price', 'total_orders', etc.
  category: varchar("category", { length: 100 }).notNull(), // 'pricing', 'inventory', 'operations'
  
  // Dimensions (for drill-down)
  companyType: varchar("company_type", { length: 50 }), // 'ecp', 'lab', null = all
  region: varchar("region", { length: 100 }),
  productType: varchar("product_type", { length: 100 }), // 'single_vision', 'progressive', etc.
  
  // Time period
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  granularity: varchar("granularity", { length: 50 }).notNull(), // 'hourly', 'daily', 'weekly', 'monthly'
  
  // Aggregated values
  count: integer("count").notNull().default(0), // Number of records
  sum: decimal("sum", { precision: 15, scale: 2 }),
  average: decimal("average", { precision: 15, scale: 2 }),
  median: decimal("median", { precision: 15, scale: 2 }),
  min: decimal("min", { precision: 15, scale: 2 }),
  max: decimal("max", { precision: 15, scale: 2 }),
  stdDev: decimal("std_dev", { precision: 15, scale: 2 }), // Standard deviation
  
  // Distribution (for percentiles)
  percentile25: decimal("percentile_25", { precision: 15, scale: 2 }),
  percentile50: decimal("percentile_50", { precision: 15, scale: 2 }), // Same as median
  percentile75: decimal("percentile_75", { precision: 15, scale: 2 }),
  percentile90: decimal("percentile_90", { precision: 15, scale: 2 }),
  percentile95: decimal("percentile_95", { precision: 15, scale: 2 }),
  
  // Data quality
  sampleSize: integer("sample_size").notNull(), // Number of companies included
  completeness: decimal("completeness", { precision: 5, scale: 2 }), // % of companies that reported data
  
  // Refresh metadata
  lastRefreshed: timestamp("last_refreshed").notNull().defaultNow(),
  nextRefreshAt: timestamp("next_refresh_at"),
  refreshStatus: varchar("refresh_status", { length: 50 }).notNull().default('current'), // 'current', 'stale', 'error'
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_aggregated_metrics_type").on(table.metricType),
  index("idx_aggregated_metrics_category").on(table.category),
  index("idx_aggregated_metrics_period").on(table.periodStart, table.periodEnd),
  index("idx_aggregated_metrics_dimensions").on(table.companyType, table.region, table.productType),
  index("idx_aggregated_metrics_refresh").on(table.refreshStatus, table.nextRefreshAt),
]);

/**
 * ============================================================================
 * EVENT-DRIVEN ARCHITECTURE TABLES (Chunk 9)
 * ============================================================================
 * Event logging, webhooks, and event-driven integrations
 */

/**
 * Event Log - Stores all events published through the event bus
 * Used for audit trail, debugging, and event replay
 */
export const eventLog = pgTable("event_log", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Event identification
  type: varchar("type", { length: 100 }).notNull(), // 'order.created', 'user.login', etc.
  
  // Context
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
  companyId: varchar("company_id", { length: 255 }).references(() => companies.id),
  
  // Event payload
  data: jsonb("data").notNull(), // Event-specific data
  metadata: jsonb("metadata"), // Additional context (IP, user agent, etc.)
  
  // Timing
  timestamp: timestamp("timestamp").notNull(), // When event occurred
  createdAt: timestamp("created_at").notNull().defaultNow(), // When logged
}, (table) => [
  index("idx_event_log_type").on(table.type),
  index("idx_event_log_user").on(table.userId),
  index("idx_event_log_company").on(table.companyId),
  index("idx_event_log_timestamp").on(table.timestamp),
  index("idx_event_log_created").on(table.createdAt),
]);

/**
 * Webhook Subscriptions - External webhook configurations
 * Companies can subscribe to events and receive HTTP callbacks
 */
export const webhookSubscriptions = pgTable("webhook_subscriptions", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Subscription owner
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id),
  
  // Webhook configuration
  url: varchar("url", { length: 500 }).notNull(), // Target URL
  events: text("events").array().notNull(), // Array of event types to subscribe to
  secret: varchar("secret", { length: 100 }).notNull(), // HMAC secret for signature
  
  // Status
  active: boolean("active").notNull().default(true),
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_webhook_subscriptions_company").on(table.companyId),
  index("idx_webhook_subscriptions_active").on(table.active),
]);

/**
 * Webhook Deliveries - Delivery log for webhook callbacks
 * Tracks success/failure and retry attempts
 */
export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // References
  subscriptionId: varchar("subscription_id", { length: 255 }).notNull().references(() => webhookSubscriptions.id, { onDelete: "cascade" }),
  eventId: varchar("event_id", { length: 255 }).notNull().references(() => eventLog.id),
  
  // Delivery details
  status: varchar("status", { length: 20 }).notNull(), // 'success', 'failed', 'pending', 'retrying'
  responseCode: integer("response_code"), // HTTP status code
  errorMessage: text("error_message"), // Error details if failed
  
  // Timing
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  
  // Retry tracking
  attempts: integer("attempts").notNull().default(1),
  nextRetryAt: timestamp("next_retry_at"),
}, (table) => [
  index("idx_webhook_deliveries_subscription").on(table.subscriptionId),
  index("idx_webhook_deliveries_event").on(table.eventId),
  index("idx_webhook_deliveries_status").on(table.status),
  index("idx_webhook_deliveries_next_retry").on(table.nextRetryAt),
]);

// ============== AI FACE ANALYSIS & FRAME RECOMMENDATION ==============

/**
 * Face Shape Types Enum
 * Standard face shape classifications for frame recommendations
 */
export const faceShapeEnum = pgEnum("face_shape", [
  "oval",
  "round",
  "square",
  "heart",
  "diamond",
  "oblong",
  "triangle"
]);

/**
 * Frame Style Types Enum
 * Frame style classifications for matching with face shapes
 */
export const frameStyleEnum = pgEnum("frame_style", [
  "rectangle",
  "square",
  "round",
  "oval",
  "cat_eye",
  "aviator",
  "wayfarer",
  "browline",
  "rimless",
  "semi_rimless",
  "geometric",
  "wrap"
]);

/**
 * Frame Material Types Enum
 */
export const frameMaterialEnum = pgEnum("frame_material", [
  "metal",
  "plastic",
  "acetate",
  "titanium",
  "wood",
  "carbon_fiber",
  "mixed"
]);

/**
 * Patient Face Analysis Table
 * Stores AI-analyzed face shape data for patients
 */
export const patientFaceAnalysis = pgTable("patient_face_analysis", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  patientId: varchar("patient_id", { length: 255 }).notNull().references(() => patients.id, { onDelete: "cascade" }),
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),

  // Face analysis results
  faceShape: faceShapeEnum("face_shape").notNull(),
  faceShapeConfidence: decimal("face_shape_confidence", { precision: 5, scale: 2 }).notNull(), // 0-100%

  // Face measurements (in relative units)
  faceLength: decimal("face_length", { precision: 10, scale: 2 }),
  faceWidth: decimal("face_width", { precision: 10, scale: 2 }),
  jawlineWidth: decimal("jawline_width", { precision: 10, scale: 2 }),
  foreheadWidth: decimal("forehead_width", { precision: 10, scale: 2 }),
  cheekboneWidth: decimal("cheekbone_width", { precision: 10, scale: 2 }),

  // Additional characteristics
  skinTone: varchar("skin_tone", { length: 50 }), // warm, cool, neutral
  hairColor: varchar("hair_color", { length: 50 }),
  eyeColor: varchar("eye_color", { length: 50 }),

  // Photo metadata
  photoUrl: text("photo_url").notNull(), // Uploaded photo
  thumbnailUrl: text("thumbnail_url"),

  // AI processing metadata
  aiModel: varchar("ai_model", { length: 100 }).notNull().default("tensorflow-facemesh-v1"),
  processingTime: integer("processing_time"), // milliseconds
  landmarkPoints: jsonb("landmark_points"), // Facial landmark coordinates
  rawAnalysisData: jsonb("raw_analysis_data"), // Full AI response

  // Timestamps
  analyzedAt: timestamp("analyzed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_face_analysis_patient").on(table.patientId),
  index("idx_face_analysis_company").on(table.companyId),
  index("idx_face_analysis_face_shape").on(table.faceShape),
]);

/**
 * Frame Characteristics Table
 * Extended frame metadata for AI recommendations
 */
/* DUPLICATE - Moved to modular schema
export const frameCharacteristics = pgTable("frame_characteristics", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  productId: varchar("product_id", { length: 255 }).notNull().unique().references(() => products.id, { onDelete: "cascade" }),
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),

  // Frame style and characteristics
  frameStyle: frameStyleEnum("frame_style").notNull(),
  frameMaterial: frameMaterialEnum("frame_material").notNull(),
  frameSize: varchar("frame_size", { length: 50 }).notNull(), // small, medium, large

  // Recommended face shapes (best matches)
  recommendedFaceShapes: jsonb("recommended_face_shapes").$type<string[]>().notNull().default(sql`'[]'::jsonb`),

  // Physical measurements (mm)
  lensWidth: decimal("lens_width", { precision: 5, scale: 1 }), // e.g., 52.0 mm
  bridgeWidth: decimal("bridge_width", { precision: 5, scale: 1 }), // e.g., 18.0 mm
  templeLength: decimal("temple_length", { precision: 5, scale: 1 }), // e.g., 145.0 mm
  frameHeight: decimal("frame_height", { precision: 5, scale: 1 }), // e.g., 38.0 mm

  // Style attributes
  gender: varchar("gender", { length: 20 }), // men, women, unisex
  ageRange: varchar("age_range", { length: 50 }), // teen, young_adult, adult, senior
  style: varchar("style", { length: 100 }), // professional, casual, sporty, fashion, classic
  colorFamily: varchar("color_family", { length: 50 }), // black, brown, silver, gold, colorful

  // Features
  hasNosePads: boolean("has_nose_pads").default(false),
  isAdjustable: boolean("is_adjustable").default(false),
  isSunglasses: boolean("is_sunglasses").default(false),
  isPolarized: boolean("is_polarized").default(false),

  // AI recommendation score (calculated)
  popularityScore: decimal("popularity_score", { precision: 5, scale: 2 }).default("0"), // 0-100

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_frame_chars_product").on(table.productId),
  index("idx_frame_chars_company").on(table.companyId),
  index("idx_frame_chars_style").on(table.frameStyle),
  index("idx_frame_chars_material").on(table.frameMaterial),
]); */

/**
 * Frame Recommendations Table
 * Stores AI-generated frame recommendations for patients
 */
/* DUPLICATE - Moved to modular schema
export const frameRecommendations = pgTable("frame_recommendations", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  faceAnalysisId: varchar("face_analysis_id", { length: 255 }).notNull().references(() => patientFaceAnalysis.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id", { length: 255 }).notNull().references(() => patients.id, { onDelete: "cascade" }),
  productId: varchar("product_id", { length: 255 }).notNull().references(() => products.id, { onDelete: "cascade" }),
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),

  // Recommendation scoring
  matchScore: decimal("match_score", { precision: 5, scale: 2 }).notNull(), // 0-100, AI confidence
  matchReason: text("match_reason").notNull(), // Human-readable explanation

  // Ranking
  rank: integer("rank").notNull(), // 1 = best match

  // User interaction
  viewed: boolean("viewed").default(false),
  viewedAt: timestamp("viewed_at"),
  liked: boolean("liked").default(false),
  likedAt: timestamp("liked_at"),
  purchased: boolean("purchased").default(false),
  purchasedAt: timestamp("purchased_at"),
  dismissed: boolean("dismissed").default(false),
  dismissedAt: timestamp("dismissed_at"),

  // Analytics
  clickCount: integer("click_count").default(0),
  shareCount: integer("share_count").default(0),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_frame_recs_analysis").on(table.faceAnalysisId),
  index("idx_frame_recs_patient").on(table.patientId),
  index("idx_frame_recs_product").on(table.productId),
  index("idx_frame_recs_company").on(table.companyId),
  index("idx_frame_recs_match_score").on(table.matchScore),
  index("idx_frame_recs_rank").on(table.rank),
]); */

/**
 * Frame Recommendation Analytics Table
 * Tracks performance of frame recommendations
 */
/* DUPLICATE - Moved to modular schema
export const frameRecommendationAnalytics = pgTable("frame_recommendation_analytics", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
  productId: varchar("product_id", { length: 255 }).notNull().references(() => products.id, { onDelete: "cascade" }),

  // Aggregated metrics
  totalRecommendations: integer("total_recommendations").default(0),
  totalViews: integer("total_views").default(0),
  totalLikes: integer("total_likes").default(0),
  totalPurchases: integer("total_purchases").default(0),
  totalDismissals: integer("total_dismissals").default(0),

  // Calculated rates
  viewRate: decimal("view_rate", { precision: 5, scale: 2 }).default("0"), // views / recommendations
  likeRate: decimal("like_rate", { precision: 5, scale: 2 }).default("0"), // likes / views
  purchaseRate: decimal("purchase_rate", { precision: 5, scale: 2 }).default("0"), // purchases / views
  dismissalRate: decimal("dismissal_rate", { precision: 5, scale: 2 }).default("0"), // dismissals / views

  // Average metrics
  avgMatchScore: decimal("avg_match_score", { precision: 5, scale: 2 }).default("0"),
  avgRank: decimal("avg_rank", { precision: 5, scale: 2 }).default("0"),

  // Time-based metrics
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_frame_rec_analytics_company").on(table.companyId),
  index("idx_frame_rec_analytics_product").on(table.productId),
  index("idx_frame_rec_analytics_period").on(table.periodStart, table.periodEnd),
]); */

// Zod schemas for face analysis
export const createFaceAnalysisSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  companyId: z.string().min(1, "Company ID is required"),
  faceShape: z.enum(["oval", "round", "square", "heart", "diamond", "oblong", "triangle"]),
  faceShapeConfidence: z.number().min(0).max(100),
  faceLength: z.number().optional(),
  faceWidth: z.number().optional(),
  jawlineWidth: z.number().optional(),
  foreheadWidth: z.number().optional(),
  cheekboneWidth: z.number().optional(),
  skinTone: z.string().optional(),
  hairColor: z.string().optional(),
  eyeColor: z.string().optional(),
  photoUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  aiModel: z.string().default("tensorflow-facemesh-v1"),
  processingTime: z.number().optional(),
  landmarkPoints: z.any().optional(),
  rawAnalysisData: z.any().optional(),
});

export const createFrameCharacteristicsSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  companyId: z.string().min(1, "Company ID is required"),
  frameStyle: z.enum(["rectangle", "square", "round", "oval", "cat_eye", "aviator", "wayfarer", "browline", "rimless", "semi_rimless", "geometric", "wrap"]),
  frameMaterial: z.enum(["metal", "plastic", "acetate", "titanium", "wood", "carbon_fiber", "mixed"]),
  frameSize: z.enum(["small", "medium", "large"]),
  recommendedFaceShapes: z.array(z.string()),
  lensWidth: z.number().optional(),
  bridgeWidth: z.number().optional(),
  templeLength: z.number().optional(),
  frameHeight: z.number().optional(),
  gender: z.string().optional(),
  ageRange: z.string().optional(),
  style: z.string().optional(),
  colorFamily: z.string().optional(),
  hasNosePads: z.boolean().default(false),
  isAdjustable: z.boolean().default(false),
  isSunglasses: z.boolean().default(false),
  isPolarized: z.boolean().default(false),
  popularityScore: z.number().min(0).max(100).default(0),
});

// Export types
export type PatientFaceAnalysis = typeof patientFaceAnalysis.$inferSelect;
export type InsertPatientFaceAnalysis = typeof patientFaceAnalysis.$inferInsert;
export type FrameCharacteristics = typeof frameCharacteristics.$inferSelect;
// export type InsertFrameCharacteristics = typeof frameCharacteristics.$inferInsert;
export type FrameRecommendation = typeof frameRecommendations.$inferSelect;
export type InsertFrameRecommendation = typeof frameRecommendations.$inferInsert;
export type FrameRecommendationAnalytics = typeof frameRecommendationAnalytics.$inferSelect;
// export type InsertFrameRecommendationAnalytics = typeof frameRecommendationAnalytics.$inferInsert;

// Export schemas and types
export const insertMarketInsightSchema = createInsertSchema(marketInsights);
export const insertPlatformStatisticSchema = createInsertSchema(platformStatistics);
export const insertAggregatedMetricSchema = createInsertSchema(aggregatedMetrics);

export type MarketInsight = typeof marketInsights.$inferSelect;
export type InsertMarketInsight = typeof marketInsights.$inferInsert;
export type PlatformStatistic = typeof platformStatistics.$inferSelect;
export type InsertPlatformStatistic = typeof platformStatistics.$inferInsert;
export type AggregatedMetric = typeof aggregatedMetrics.$inferSelect;
export type InsertAggregatedMetric = typeof aggregatedMetrics.$inferInsert;

// Event-driven architecture types
export const insertEventLogSchema = createInsertSchema(eventLog);
export const insertWebhookSubscriptionSchema = createInsertSchema(webhookSubscriptions);
export const insertWebhookDeliverySchema = createInsertSchema(webhookDeliveries);

export type EventLog = typeof eventLog.$inferSelect;
export type InsertEventLog = typeof eventLog.$inferInsert;
export type WebhookSubscription = typeof webhookSubscriptions.$inferSelect;
export type InsertWebhookSubscription = typeof webhookSubscriptions.$inferInsert;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type InsertWebhookDelivery = typeof webhookDeliveries.$inferInsert;

// ============== NHS/PCSE INTEGRATION (UK) ==============

/**
 * NHS GOS Claim Types
 * General Ophthalmic Services claim types for NHS sight tests
 */
export const nhsGosClaimTypeEnum = pgEnum("nhs_gos_claim_type", [
  "GOS1", // Standard NHS sight test
  "GOS2", // NHS sight test (under 16 or full-time education)
  "GOS3", // Complex NHS sight test
  "GOS4", // Domiciliary NHS sight test
]);

/**
 * NHS Claim Status
 */
export const nhsClaimStatusEnum = pgEnum("nhs_claim_status", [
  "draft",
  "submitted",
  "accepted",
  "rejected",
  "paid",
  "queried",
]);

/**
 * NHS Voucher Types
 * Optical voucher categories based on prescription strength
 */
export const nhsVoucherTypeEnum = pgEnum("nhs_voucher_type", [
  "A", // Single vision - low power
  "B", // Single vision - high power or prism
  "C", // Bifocal - low power
  "D", // Bifocal - high power or prism
  "E", // Tinted or photochromic lenses
  "F", // Small frame supplement
  "G", // Prism-controlled bifocals
  "H", // Tinted lenses for medical condition
]);

/**
 * NHS Exemption Reasons
 */
export const nhsExemptionReasonEnum = pgEnum("nhs_exemption_reason", [
  "age_under_16",
  "age_16_18_education",
  "age_60_plus",
  "income_support",
  "jobseekers_allowance",
  "pension_credit",
  "universal_credit",
  "hc2_certificate",
  "hc3_certificate",
  "war_pension",
  "diabetes",
  "glaucoma",
  "registered_blind",
  "family_history_glaucoma",
]);

/**
 * NHS Practitioners Table
 * GOC-registered optometrists and dispensing opticians
 */
/* DUPLICATE - Moved to modular schema
export const nhsPractitioners = pgTable("nhs_practitioners", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // User reference
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),

  // GOC Registration
  gocNumber: varchar("goc_number", { length: 20 }).notNull().unique(),
  gocRegistrationType: varchar("goc_registration_type", { length: 50 }).notNull(), // "optometrist", "dispensing_optician"
  gocExpiryDate: date("goc_expiry_date").notNull(),

  // NHS Contract
  performerNumber: varchar("performer_number", { length: 20 }).notNull().unique(),
  nhsContractStartDate: date("nhs_contract_start_date"),
  nhsContractEndDate: date("nhs_contract_end_date"),

  // Professional Indemnity
  indemnityProvider: varchar("indemnity_provider", { length: 255 }),
  indemnityPolicyNumber: varchar("indemnity_policy_number", { length: 100 }),
  indemnityExpiryDate: date("indemnity_expiry_date"),

  // Status
  isActive: boolean("is_active").notNull().default(true),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_nhs_practitioners_user").on(table.userId),
  index("idx_nhs_practitioners_company").on(table.companyId),
  index("idx_nhs_practitioners_goc").on(table.gocNumber),
]); */

/**
 * NHS Contract Details
 * Practice-level NHS contract information
 */
/* DUPLICATE - Moved to modular schema
export const nhsContractDetails = pgTable("nhs_contract_details", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  companyId: varchar("company_id", { length: 255 }).notNull().unique().references(() => companies.id, { onDelete: "cascade" }),

  // Contract Details
  contractNumber: varchar("contract_number", { length: 50 }).notNull().unique(),
  contractHolderName: varchar("contract_holder_name", { length: 255 }).notNull(),
  contractStartDate: date("contract_start_date").notNull(),
  contractEndDate: date("contract_end_date"),

  // Practice Details
  odsCode: varchar("ods_code", { length: 20 }).notNull(), // Organisation Data Service code
  practiceAddress: jsonb("practice_address").notNull(),

  // PCSE Details
  pcseAccountNumber: varchar("pcse_account_number", { length: 50 }),
  pcseBankDetails: jsonb("pcse_bank_details"), // Encrypted

  // Claim Submission
  claimSubmissionEmail: varchar("claim_submission_email", { length: 255 }),
  claimSubmissionMethod: varchar("claim_submission_method", { length: 50 }), // "email", "portal", "api"

  // Status
  isActive: boolean("is_active").notNull().default(true),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_nhs_contracts_company").on(table.companyId),
  index("idx_nhs_contracts_ods").on(table.odsCode),
]); */

/**
 * NHS Claims
 * GOS sight test claims submitted to PCSE
 */
/* DUPLICATE - Moved to modular schema
export const nhsClaims = pgTable("nhs_claims", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id", { length: 255 }).notNull().references(() => patients.id),
  examinationId: varchar("examination_id", { length: 255 }).references(() => eyeExaminations.id),
  practitionerId: varchar("practitioner_id", { length: 255 }).notNull().references(() => nhsPractitioners.id),

  // Claim Details
  claimType: nhsGosClaimTypeEnum("claim_type").notNull(),
  claimNumber: varchar("claim_number", { length: 50 }).notNull().unique(),
  claimDate: date("claim_date").notNull(),
  testDate: date("test_date").notNull(),

  // Patient Details
  patientNhsNumber: varchar("patient_nhs_number", { length: 20 }),
  patientExemptionReason: nhsExemptionReasonEnum("patient_exemption_reason"),
  patientExemptionEvidence: varchar("patient_exemption_evidence", { length: 255 }), // HC2/HC3 number, etc.

  // Clinical Details
  prescriptionIssued: boolean("prescription_issued").notNull().default(false),
  referralMade: boolean("referral_made").notNull().default(false),
  referralUrgency: varchar("referral_urgency", { length: 50 }), // "routine", "urgent", "emergency"
  clinicalNotes: text("clinical_notes"),

  // GOS4 Domiciliary Claims (home visits)
  domiciliaryJustification: text("domiciliary_justification"), // Required for GOS4 claims

  // NHS Voucher (for optical vouchers)
  nhsVoucherCode: varchar("nhs_voucher_code", { length: 20 }),

  // Claim Submission
  status: nhsClaimStatusEnum("status").notNull().default("draft"),
  submittedAt: timestamp("submitted_at"),
  submittedBy: varchar("submitted_by", { length: 255 }).references(() => users.id),

  // PCSE Response
  pcseReference: varchar("pcse_reference", { length: 100 }),
  pcseStatus: varchar("pcse_status", { length: 50 }),
  pcseResponse: jsonb("pcse_response"),
  pcseError: text("pcse_error"), // PCSE API error messages
  rejectionReason: text("rejection_reason"),

  // Payment
  claimAmount: decimal("claim_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
  paidAt: timestamp("paid_at"),
  paymentReference: varchar("payment_reference", { length: 100 }),

  // Metadata
  metadata: jsonb("metadata"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Soft Delete
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by", { length: 255 }),
}, (table) => [
  index("idx_nhs_claims_company").on(table.companyId),
  index("idx_nhs_claims_patient").on(table.patientId),
  index("idx_nhs_claims_examination").on(table.examinationId),
  index("idx_nhs_claims_practitioner").on(table.practitionerId),
  index("idx_nhs_claims_status").on(table.status),
  index("idx_nhs_claims_date").on(table.claimDate),
]); */

/**
 * NHS Vouchers
 * Optical vouchers for glasses/contact lenses
 */
/* DUPLICATE - Moved to modular schema
export const nhsVouchers = pgTable("nhs_vouchers", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id", { length: 255 }).notNull().references(() => patients.id),
  prescriptionId: varchar("prescription_id", { length: 255 }).references(() => prescriptions.id),
  claimId: varchar("claim_id", { length: 255 }).references(() => nhsClaims.id),

  // Voucher Details
  voucherType: nhsVoucherTypeEnum("voucher_type").notNull(),
  voucherNumber: varchar("voucher_number", { length: 50 }).notNull().unique(),
  voucherValue: decimal("voucher_value", { precision: 10, scale: 2 }).notNull(),
  issueDate: date("issue_date").notNull(),
  expiryDate: date("expiry_date").notNull(),

  // Patient Eligibility
  exemptionReason: nhsExemptionReasonEnum("exemption_reason").notNull(),
  exemptionEvidence: varchar("exemption_evidence", { length: 255 }),

  // Prescription Requirements
  sphereOD: decimal("sphere_od", { precision: 5, scale: 2 }),
  sphereOS: decimal("sphere_os", { precision: 5, scale: 2 }),
  cylinderOD: decimal("cylinder_od", { precision: 5, scale: 2 }),
  cylinderOS: decimal("cylinder_os", { precision: 5, scale: 2 }),
  prismRequired: boolean("prism_required").default(false),
  tintRequired: boolean("tint_required").default(false),

  // Redemption
  isRedeemed: boolean("is_redeemed").notNull().default(false),
  redeemedAt: timestamp("redeemed_at"),
  redeemedAmount: decimal("redeemed_amount", { precision: 10, scale: 2 }),
  patientContribution: decimal("patient_contribution", { precision: 10, scale: 2 }),

  // Complex Lens Supplements
  hasComplexSupplement: boolean("has_complex_supplement").default(false),
  supplementAmount: decimal("supplement_amount", { precision: 10, scale: 2 }),
  supplementReason: text("supplement_reason"),

  // Status
  status: varchar("status", { length: 50 }).notNull().default("active"), // "active", "redeemed", "expired", "cancelled"

  // Metadata
  metadata: jsonb("metadata"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_nhs_vouchers_company").on(table.companyId),
  index("idx_nhs_vouchers_patient").on(table.patientId),
  index("idx_nhs_vouchers_status").on(table.status),
  index("idx_nhs_vouchers_expiry").on(table.expiryDate),
]); */

/**
 * NHS Patient Exemptions
 * Track patient NHS exemption status
 */
/* DUPLICATE - Moved to modular schema
export const nhsPatientExemptions = pgTable("nhs_patient_exemptions", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id", { length: 255 }).notNull().references(() => patients.id),

  // Exemption Details
  exemptionReason: nhsExemptionReasonEnum("exemption_reason").notNull(),
  evidenceType: varchar("evidence_type", { length: 100 }), // "HC2", "HC3", "Birth certificate", etc.
  evidenceNumber: varchar("evidence_number", { length: 100 }),
  evidenceDocumentUrl: text("evidence_document_url"),

  // Validity
  validFrom: date("valid_from").notNull(),
  validUntil: date("valid_until"),
  isLifelong: boolean("is_lifelong").default(false),

  // Verification
  verifiedBy: varchar("verified_by", { length: 255 }).references(() => users.id),
  verifiedAt: timestamp("verified_at"),

  // Status
  isActive: boolean("is_active").notNull().default(true),

  // Metadata
  notes: text("notes"),
  metadata: jsonb("metadata"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_nhs_exemptions_company").on(table.companyId),
  index("idx_nhs_exemptions_patient").on(table.patientId),
  index("idx_nhs_exemptions_status").on(table.isActive),
  index("idx_nhs_exemptions_expiry").on(table.validUntil),
]); */

/**
 * NHS Payments
 * Track PCSE payments received
 */
/* DUPLICATE - Moved to modular schema
export const nhsPayments = pgTable("nhs_payments", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),

  // Payment Details
  paymentReference: varchar("payment_reference", { length: 100 }).notNull().unique(),
  paymentDate: date("payment_date").notNull(),
  paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }).notNull(),

  // Period Covered
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),

  // Claims Included
  claimCount: integer("claim_count").notNull().default(0),
  claimIds: jsonb("claim_ids").$type<string[]>(),

  // Payment Method
  paymentMethod: varchar("payment_method", { length: 50 }), // "BACS", "cheque"
  bankAccount: varchar("bank_account", { length: 20 }), // Last 4 digits

  // Reconciliation
  isReconciled: boolean("is_reconciled").notNull().default(false),
  reconciledAt: timestamp("reconciled_at"),
  reconciledBy: varchar("reconciled_by", { length: 255 }).references(() => users.id),
  discrepancyAmount: decimal("discrepancy_amount", { precision: 10, scale: 2 }),
  discrepancyNotes: text("discrepancy_notes"),

  // Metadata
  metadata: jsonb("metadata"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_nhs_payments_company").on(table.companyId),
  index("idx_nhs_payments_date").on(table.paymentDate),
  index("idx_nhs_payments_reconciled").on(table.isReconciled),
]); */

/**
 * NHS Claims Retry Queue
 *
 * Manages automatic retry of failed PCSE claim submissions.
 * Implements exponential backoff strategy:
 * - 1st retry: 1 hour after failure
 * - 2nd retry: 4 hours after 1st retry
 * - 3rd retry: 24 hours after 2nd retry
 * - After 3 retries: Manual intervention required
 */
/* DUPLICATE - Moved to modular schema
export const nhsClaimsRetryQueue = pgTable("nhs_claims_retry_queue", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  claimId: varchar("claim_id", { length: 255 }).notNull().references(() => nhsClaims.id, { onDelete: "cascade" }),
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),

  // Retry Tracking
  retryCount: integer("retry_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),
  lastAttemptAt: timestamp("last_attempt_at"),
  nextRetryAt: timestamp("next_retry_at").notNull(),

  // Error Information
  errorMessage: text("error_message"),
  errorCode: varchar("error_code", { length: 50 }),
  pcseResponse: jsonb("pcse_response"),

  // Status
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, retrying, completed, failed
  completedAt: timestamp("completed_at"),
  failedAt: timestamp("failed_at"),

  // Metadata
  metadata: jsonb("metadata"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_retry_queue_next_retry").on(table.nextRetryAt),
  index("idx_retry_queue_claim").on(table.claimId),
  index("idx_retry_queue_company").on(table.companyId),
  index("idx_retry_queue_status").on(table.status),
]); */

// Zod schemas for NHS
/* DUPLICATE - Moved to NHS domain
export const createNhsPractitionerSchema = z.object({
  userId: z.string().min(1),
  companyId: z.string().min(1),
  gocNumber: z.string().min(1).max(20),
  gocRegistrationType: z.enum(["optometrist", "dispensing_optician"]),
  gocExpiryDate: z.string(), // ISO date
  performerNumber: z.string().min(1).max(20),
  nhsContractStartDate: z.string().optional(),
  nhsContractEndDate: z.string().optional(),
  indemnityProvider: z.string().optional(),
  indemnityPolicyNumber: z.string().optional(),
  indemnityExpiryDate: z.string().optional(),
});

/* DUPLICATE - Moved to NHS domain
export const createNhsClaimSchema = z.object({
  companyId: z.string().min(1),
  patientId: z.string().min(1),
  examinationId: z.string().optional(),
  practitionerId: z.string().min(1),
  claimType: z.enum(["GOS1", "GOS2", "GOS3", "GOS4"]),
  testDate: z.string(), // ISO date
  patientNhsNumber: z.string().optional(),
  patientExemptionReason: z.string().optional(),
  patientExemptionEvidence: z.string().optional(),
  prescriptionIssued: z.boolean().default(false),
  referralMade: z.boolean().default(false),
  referralUrgency: z.enum(["routine", "urgent", "emergency"]).optional(),
  clinicalNotes: z.string().optional(),
  claimAmount: z.number().positive(),
}); */

/* DUPLICATE - Moved to NHS domain
export const createNhsVoucherSchema = z.object({
  companyId: z.string().min(1),
  patientId: z.string().min(1),
  prescriptionId: z.string().optional(),
  claimId: z.string().optional(),
  voucherType: z.enum(["A", "B", "C", "D", "E", "F", "G", "H"]),
  voucherValue: z.number().positive(),
  issueDate: z.string(),
  expiryDate: z.string(),
  exemptionReason: z.string(),
  exemptionEvidence: z.string().optional(),
  sphereOD: z.number().optional(),
  sphereOS: z.number().optional(),
  cylinderOD: z.number().optional(),
  cylinderOS: z.number().optional(),
  prismRequired: z.boolean().default(false),
  tintRequired: z.boolean().default(false),
}); */

// Export types
export type NhsPractitioner = typeof nhsPractitioners.$inferSelect;
export type InsertNhsPractitioner = typeof nhsPractitioners.$inferInsert;
export type NhsContractDetails = typeof nhsContractDetails.$inferSelect;
// export type InsertNhsContractDetails = typeof nhsContractDetails.$inferInsert;
export type NhsClaim = typeof nhsClaims.$inferSelect;
export type InsertNhsClaim = typeof nhsClaims.$inferInsert;
export type NhsVoucher = typeof nhsVouchers.$inferSelect;
export type InsertNhsVoucher = typeof nhsVouchers.$inferInsert;
export type NhsPatientExemption = typeof nhsPatientExemptions.$inferSelect;
export type InsertNhsPatientExemption = typeof nhsPatientExemptions.$inferInsert;
export type NhsPayment = typeof nhsPayments.$inferSelect;
export type InsertNhsPayment = typeof nhsPayments.$inferInsert;

/**
 * =====================================================================
 * CONTACT LENS MODULE
 * Comprehensive contact lens assessment, fitting, and aftercare system
 * =====================================================================
 */

/* DUPLICATE - Contact Lens Enums (6 enums) moved to contactlens domain */
// Contact Lens Enums
// export const clWearingScheduleEnum = pgEnum("cl_wearing_schedule", [
//   "daily_wear",
//   "extended_wear",
//   "continuous_wear",
//   "occasional_wear"
// ]);
//
// export const clReplacementScheduleEnum = pgEnum("cl_replacement_schedule", [
//   "daily_disposable",
//   "two_weekly",
//   "monthly",
//   "quarterly",
//   "yearly"
// ]);
//
// export const clLensTypeEnum = pgEnum("cl_lens_type", [
//   "soft",
//   "rigid_gas_permeable",
//   "hybrid",
//   "scleral",
//   "orthokeratology"
// ]);
//
// export const clDesignEnum = pgEnum("cl_design", [
//   "spherical",
//   "toric",
//   "multifocal",
//   "monovision",
//   "custom"
// ]);
//
// export const clFitAssessmentEnum = pgEnum("cl_fit_assessment", [
//   "optimal",
//   "acceptable",
//   "too_tight",
//   "too_loose",
//   "decentered"
// ]);
//
// export const clAftercareStatusEnum = pgEnum("cl_aftercare_status", [
//   "scheduled",
//   "completed",
//   "cancelled",
//   "no_show",
//   "rescheduled"
// ]);

/**
 * Contact Lens Assessments
 * Initial patient evaluation for contact lens suitability
 */
/* DUPLICATE - contactLensAssessments table moved to contactlens domain */
// export const contactLensAssessments = pgTable("contact_lens_assessments", {
//   id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
//
  // References
//   companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
//   patientId: varchar("patient_id", { length: 255 }).notNull().references(() => patients.id),
//   practitionerId: varchar("practitioner_id", { length: 255 }).references(() => users.id),
//
  // Assessment Details
//   assessmentDate: date("assessment_date").notNull(),
//
  // Patient History
//   previousClWearer: boolean("previous_cl_wearer").notNull().default(false),
//   previousClType: varchar("previous_cl_type", { length: 100 }),
//   reasonForDiscontinuation: text("reason_for_discontinuation"),
//
  // Motivation & Lifestyle
//   motivationReason: text("motivation_reason"), // Sports, cosmetic, occupational, etc.
//   occupation: varchar("occupation", { length: 255 }),
//   hobbies: text("hobbies"),
//   screenTime: varchar("screen_time", { length: 50 }), // Low, moderate, high
//
  // Medical Suitability
//   dryEyes: boolean("dry_eyes").default(false),
//   allergies: text("allergies"),
//   medications: text("medications"),
//   contraindications: text("contraindications"),
//
  // Ocular Assessment
//   tearQuality: varchar("tear_quality", { length: 50 }), // Good, fair, poor
//   tearBreakupTime: decimal("tear_breakup_time", { precision: 4, scale: 1 }), // seconds
//   corneaCondition: text("cornea_condition"),
//   conjunctivaCondition: text("conjunctiva_condition"),
//   lidsCondition: text("lids_condition"),
//
  // Recommendation
//   suitable: boolean("suitable").notNull(),
//   recommendedLensType: clLensTypeEnum("recommended_lens_type"),
//   recommendedWearingSchedule: clWearingScheduleEnum("recommended_wearing_schedule"),
//   notes: text("notes"),
//
  // Metadata
//   createdAt: timestamp("created_at").notNull().defaultNow(),
//   updatedAt: timestamp("updated_at").notNull().defaultNow(),
// }, (table) => [
//   index("cl_assessments_company_idx").on(table.companyId),
//   index("cl_assessments_patient_idx").on(table.patientId),
//   index("cl_assessments_date_idx").on(table.assessmentDate),
// ]);

/**
 * Contact Lens Fittings
 * Trial lens fitting records
 */
/* DUPLICATE - contactLensFittings table moved to contactlens domain */
// export const contactLensFittings = pgTable("contact_lens_fittings", {
//   id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
//
  // References
//   companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
//   patientId: varchar("patient_id", { length: 255 }).notNull().references(() => patients.id),
//   assessmentId: varchar("assessment_id", { length: 255 }).references(() => contactLensAssessments.id),
//   practitionerId: varchar("practitioner_id", { length: 255 }).references(() => users.id),
//
  // Fitting Details
//   fittingDate: date("fitting_date").notNull(),
//   eye: varchar("eye", { length: 2 }).notNull(), // OD or OS
//
  // Trial Lens Details
//   trialLensBrand: varchar("trial_lens_brand", { length: 255 }).notNull(),
//   trialLensType: clLensTypeEnum("trial_lens_type").notNull(),
//   trialBaseCurve: decimal("trial_base_curve", { precision: 4, scale: 2 }), // mm
//   trialDiameter: decimal("trial_diameter", { precision: 4, scale: 1 }), // mm
//   trialPower: decimal("trial_power", { precision: 5, scale: 2 }), // D
//   trialCylinder: decimal("trial_cylinder", { precision: 5, scale: 2 }), // D (for toric)
//   trialAxis: integer("trial_axis"), // degrees (for toric)
//   trialAddition: decimal("trial_addition", { precision: 3, scale: 2 }), // D (for multifocal)
//
  // Over-Refraction
//   overRefractionSphere: decimal("over_refraction_sphere", { precision: 5, scale: 2 }),
//   overRefractionCylinder: decimal("over_refraction_cylinder", { precision: 5, scale: 2 }),
//   overRefractionAxis: integer("over_refraction_axis"),
//
  // Fit Assessment
//   centration: varchar("centration", { length: 50 }), // Central, superior, inferior, temporal, nasal
//   movement: varchar("movement", { length: 50 }), // Optimal, excessive, insufficient
//   coverage: varchar("coverage", { length: 50 }), // Full, partial
//   comfort: varchar("comfort", { length: 50 }), // Excellent, good, fair, poor
//   fitAssessment: clFitAssessmentEnum("fit_assessment").notNull(),
//
  // Vision Assessment
//   distanceVision: varchar("distance_vision", { length: 10 }), // e.g., "6/6", "20/20"
//   nearVision: varchar("near_vision", { length: 10 }),
//
  // Final Lens Parameters (if different from trial)
//   finalBaseCurve: decimal("final_base_curve", { precision: 4, scale: 2 }),
//   finalDiameter: decimal("final_diameter", { precision: 4, scale: 1 }),
//   finalPower: decimal("final_power", { precision: 5, scale: 2 }),
//   finalCylinder: decimal("final_cylinder", { precision: 5, scale: 2 }),
//   finalAxis: integer("final_axis"),
//   finalAddition: decimal("final_addition", { precision: 3, scale: 2 }),
//
  // Teaching & Handling
//   insertionTaught: boolean("insertion_taught").default(false),
//   removalTaught: boolean("removal_taught").default(false),
//   careTaught: boolean("care_taught").default(false),
//   patientDemonstrated: boolean("patient_demonstrated").default(false),
//
//   notes: text("notes"),
//
  // Metadata
//   createdAt: timestamp("created_at").notNull().defaultNow(),
//   updatedAt: timestamp("updated_at").notNull().defaultNow(),
// }, (table) => [
//   index("cl_fittings_company_idx").on(table.companyId),
//   index("cl_fittings_patient_idx").on(table.patientId),
//   index("cl_fittings_date_idx").on(table.fittingDate),
// ]);

/**
 * Contact Lens Prescriptions
 * Final CL prescription records
 */
/* DUPLICATE - contactLensPrescriptions table moved to contactlens domain */
// export const contactLensPrescriptions = pgTable("contact_lens_prescriptions", {
//   id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
//
  // References
//   companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
//   patientId: varchar("patient_id", { length: 255 }).notNull().references(() => patients.id),
//   fittingId: varchar("fitting_id", { length: 255 }).references(() => contactLensFittings.id),
//   practitionerId: varchar("practitioner_id", { length: 255 }).references(() => users.id),
//
  // Prescription Details
//   prescriptionDate: date("prescription_date").notNull(),
//   expiryDate: date("expiry_date"), // Usually 12 months from issue date
//
  // Right Eye (OD)
//   odBrand: varchar("od_brand", { length: 255 }).notNull(),
//   odLensType: clLensTypeEnum("od_lens_type").notNull(),
//   odDesign: clDesignEnum("od_design").notNull(),
//   odBaseCurve: decimal("od_base_curve", { precision: 4, scale: 2 }).notNull(),
//   odDiameter: decimal("od_diameter", { precision: 4, scale: 1 }).notNull(),
//   odPower: decimal("od_power", { precision: 5, scale: 2 }).notNull(),
//   odCylinder: decimal("od_cylinder", { precision: 5, scale: 2 }),
//   odAxis: integer("od_axis"),
//   odAddition: decimal("od_addition", { precision: 3, scale: 2 }),
//   odColor: varchar("od_color", { length: 100 }), // For cosmetic lenses
//
  // Left Eye (OS)
//   osBrand: varchar("os_brand", { length: 255 }).notNull(),
//   osLensType: clLensTypeEnum("os_lens_type").notNull(),
//   osDesign: clDesignEnum("os_design").notNull(),
//   osBaseCurve: decimal("os_base_curve", { precision: 4, scale: 2 }).notNull(),
//   osDiameter: decimal("os_diameter", { precision: 4, scale: 1 }).notNull(),
//   osPower: decimal("os_power", { precision: 5, scale: 2 }).notNull(),
//   osCylinder: decimal("os_cylinder", { precision: 5, scale: 2 }),
//   osAxis: integer("os_axis"),
//   osAddition: decimal("os_addition", { precision: 3, scale: 2 }),
//   osColor: varchar("os_color", { length: 100 }),
//
  // Wearing Instructions
//   wearingSchedule: clWearingScheduleEnum("wearing_schedule").notNull(),
//   replacementSchedule: clReplacementScheduleEnum("replacement_schedule").notNull(),
//   maxWearingTime: integer("max_wearing_time"), // hours per day
//
  // Care System Recommendation
//   careSystemBrand: varchar("care_system_brand", { length: 255 }),
//   careSystemType: varchar("care_system_type", { length: 100 }), // Multipurpose, peroxide, etc.
//
  // Follow-up Schedule
//   firstFollowUpDate: date("first_follow_up_date"), // Usually 1 day
//   weekFollowUpDate: date("week_follow_up_date"), // Usually 1 week
//   monthFollowUpDate: date("month_follow_up_date"), // Usually 1 month
//
  // Special Instructions
//   specialInstructions: text("special_instructions"),
//   notes: text("notes"),
//
  // NHS Funding (if applicable)
//   nhsFunded: boolean("nhs_funded").default(false),
//   nhsExemptionId: varchar("nhs_exemption_id", { length: 255 }).references(() => nhsPatientExemptions.id),
//
  // Status
//   isActive: boolean("is_active").notNull().default(true),
//
  // Metadata
//   createdAt: timestamp("created_at").notNull().defaultNow(),
//   updatedAt: timestamp("updated_at").notNull().defaultNow(),
// }, (table) => [
//   index("cl_prescriptions_company_idx").on(table.companyId),
//   index("cl_prescriptions_patient_idx").on(table.patientId),
//   index("cl_prescriptions_date_idx").on(table.prescriptionDate),
//   index("cl_prescriptions_active_idx").on(table.isActive),
// ]);

/**
 * Contact Lens Aftercare
 * Follow-up appointments and monitoring
 */
/* DUPLICATE - contactLensAftercare table moved to contactlens domain */
// export const contactLensAftercare = pgTable("contact_lens_aftercare", {
//   id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
//
  // References
//   companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
//   patientId: varchar("patient_id", { length: 255 }).notNull().references(() => patients.id),
//   prescriptionId: varchar("prescription_id", { length: 255 }).references(() => contactLensPrescriptions.id),
//   practitionerId: varchar("practitioner_id", { length: 255 }).references(() => users.id),
//
  // Appointment Details
//   appointmentDate: date("appointment_date").notNull(),
//   appointmentType: varchar("appointment_type", { length: 50 }).notNull(), // Initial, routine, problem
//   status: clAftercareStatusEnum("status").notNull().default("scheduled"),
//
  // Compliance Check
//   wearingTimeCompliance: varchar("wearing_time_compliance", { length: 50 }), // Good, fair, poor
//   replacementCompliance: varchar("replacement_compliance", { length: 50 }),
//   careSystemCompliance: varchar("care_system_compliance", { length: 50 }),
//   sleepingInLenses: boolean("sleeping_in_lenses"),
//   waterExposure: boolean("water_exposure"),
//
  // Clinical Assessment
//   visualAcuityOD: varchar("visual_acuity_od", { length: 10 }),
//   visualAcuityOS: varchar("visual_acuity_os", { length: 10 }),
//   comfort: varchar("comfort", { length: 50 }),
//   lensConditionOD: varchar("lens_condition_od", { length: 100 }),
//   lensConditionOS: varchar("lens_condition_os", { length: 100 }),
//   fitAssessmentOD: clFitAssessmentEnum("fit_assessment_od"),
//   fitAssessmentOS: clFitAssessmentEnum("fit_assessment_os"),
//
  // Ocular Health
//   corneaHealthOD: varchar("cornea_health_od", { length: 100 }),
//   corneaHealthOS: varchar("cornea_health_os", { length: 100 }),
//   conjunctivaHealthOD: varchar("conjunctiva_health_od", { length: 100 }),
//   conjunctivaHealthOS: varchar("conjunctiva_health_os", { length: 100 }),
//
  // Problems Reported
//   problemsReported: text("problems_reported"),
//   adverseEvents: text("adverse_events"),
//
  // Actions Taken
//   prescriptionChanged: boolean("prescription_changed").default(false),
//   lensesReplaced: boolean("lenses_replaced").default(false),
//   careSystemChanged: boolean("care_system_changed").default(false),
//   additionalTraining: boolean("additional_training").default(false),
//   referralMade: boolean("referral_made").default(false),
//
  // Next Appointment
//   nextAppointmentDate: date("next_appointment_date"),
//   nextAppointmentReason: text("next_appointment_reason"),
//
//   notes: text("notes"),
//
  // Metadata
//   createdAt: timestamp("created_at").notNull().defaultNow(),
//   updatedAt: timestamp("updated_at").notNull().defaultNow(),
// }, (table) => [
//   index("cl_aftercare_company_idx").on(table.companyId),
//   index("cl_aftercare_patient_idx").on(table.patientId),
//   index("cl_aftercare_date_idx").on(table.appointmentDate),
//   index("cl_aftercare_status_idx").on(table.status),
// ]);

/**
 * Contact Lens Inventory
 * Stock management for contact lenses
 */
/* DUPLICATE - contactLensInventory table moved to contactlens domain */
// export const contactLensInventory = pgTable("contact_lens_inventory", {
//   id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
//
  // References
//   companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
//
  // Product Details
//   brand: varchar("brand", { length: 255 }).notNull(),
//   productName: varchar("product_name", { length: 255 }).notNull(),
//   lensType: clLensTypeEnum("lens_type").notNull(),
//   design: clDesignEnum("design").notNull(),
//   replacementSchedule: clReplacementScheduleEnum("replacement_schedule").notNull(),
//
  // Parameters
//   baseCurve: decimal("base_curve", { precision: 4, scale: 2 }).notNull(),
//   diameter: decimal("diameter", { precision: 4, scale: 1 }).notNull(),
//   power: decimal("power", { precision: 5, scale: 2 }).notNull(),
//   cylinder: decimal("cylinder", { precision: 5, scale: 2 }),
//   axis: integer("axis"),
//   addition: decimal("addition", { precision: 3, scale: 2 }),
//
  // Stock Management
//   quantityInStock: integer("quantity_in_stock").notNull().default(0),
//   reorderLevel: integer("reorder_level").notNull().default(5),
//   reorderQuantity: integer("reorder_quantity").notNull().default(10),
//   unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
//   retailPrice: decimal("retail_price", { precision: 10, scale: 2 }),
//
  // Supplier Information
//   supplierId: varchar("supplier_id", { length: 255 }),
//   supplierProductCode: varchar("supplier_product_code", { length: 100 }),
//
  // Product Information
//   expiryDate: date("expiry_date"),
//   batchNumber: varchar("batch_number", { length: 100 }),
//
  // Status
//   isActive: boolean("is_active").notNull().default(true),
//   isTrialLens: boolean("is_trial_lens").default(false),
//
  // Metadata
//   createdAt: timestamp("created_at").notNull().defaultNow(),
//   updatedAt: timestamp("updated_at").notNull().defaultNow(),
// }, (table) => [
//   index("cl_inventory_company_idx").on(table.companyId),
//   index("cl_inventory_brand_idx").on(table.brand),
//   index("cl_inventory_stock_idx").on(table.quantityInStock),
//   index("cl_inventory_active_idx").on(table.isActive),
//   uniqueIndex("cl_inventory_unique").on(
//     table.companyId,
//     table.brand,
//     table.baseCurve,
//     table.diameter,
//     table.power,
//     table.cylinder,
//     table.axis,
//     table.addition
//   ),
// ]);

/**
 * Contact Lens Orders
 * Patient orders for contact lenses
 */
/* DUPLICATE - contactLensOrders table moved to contactlens domain */
// export const contactLensOrders = pgTable("contact_lens_orders", {
//   id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
//
  // References
//   companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
//   patientId: varchar("patient_id", { length: 255 }).notNull().references(() => patients.id),
//   prescriptionId: varchar("prescription_id", { length: 255 }).references(() => contactLensPrescriptions.id),
//
  // Order Details
//   orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
//   orderDate: date("order_date").notNull(),
//
  // Right Eye Order
//   odInventoryId: varchar("od_inventory_id", { length: 255 }).references(() => contactLensInventory.id),
//   odQuantity: integer("od_quantity").notNull(),
//   odUnitPrice: decimal("od_unit_price", { precision: 10, scale: 2 }).notNull(),
//
  // Left Eye Order
//   osInventoryId: varchar("os_inventory_id", { length: 255 }).references(() => contactLensInventory.id),
//   osQuantity: integer("os_quantity").notNull(),
//   osUnitPrice: decimal("os_unit_price", { precision: 10, scale: 2 }).notNull(),
//
  // Care System (if ordered)
//   careSystemInventoryId: varchar("care_system_inventory_id", { length: 255 }),
//   careSystemQuantity: integer("care_system_quantity"),
//   careSystemPrice: decimal("care_system_price", { precision: 10, scale: 2 }),
//
  // Pricing
//   subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
//   discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
//   tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
//   total: decimal("total", { precision: 10, scale: 2 }).notNull(),
//
  // NHS Funding
//   nhsFunded: boolean("nhs_funded").default(false),
//   nhsVoucherId: varchar("nhs_voucher_id", { length: 255 }), // If applicable
//
  // Status
//   status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, ordered, received, dispensed
//   orderedDate: date("ordered_date"),
//   receivedDate: date("received_date"),
//   dispensedDate: date("dispensed_date"),
//
//   notes: text("notes"),
//
  // Metadata
//   createdAt: timestamp("created_at").notNull().defaultNow(),
//   updatedAt: timestamp("updated_at").notNull().defaultNow(),
// }, (table) => [
//   index("cl_orders_company_idx").on(table.companyId),
//   index("cl_orders_patient_idx").on(table.patientId),
//   index("cl_orders_date_idx").on(table.orderDate),
//   index("cl_orders_status_idx").on(table.status),
// ]);

// ============================================================================
// SHOPIFY INTEGRATION
// ============================================================================

/**
 * Shopify Store Connections
 * Stores connected to ILS via Shopify app
 */
export const shopifyStoreStatusEnum = pgEnum("shopify_store_status", [
  "active",
  "inactive",
  "suspended",
  "expired"
]);

export const shopifyStores = pgTable("shopify_stores", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Company Reference
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),

  // Shopify Store Details
  shopifyDomain: varchar("shopify_domain", { length: 255 }).notNull().unique(),
  shopifyStoreId: varchar("shopify_store_id", { length: 255 }).notNull().unique(),
  storeName: varchar("store_name", { length: 255 }).notNull(),
  storeEmail: varchar("store_email", { length: 255 }),
  storeUrl: varchar("store_url", { length: 500 }).notNull(),

  // API Credentials (encrypted)
  accessToken: text("access_token").notNull(), // Encrypted Shopify API token
  apiKey: varchar("api_key", { length: 255 }).notNull(),
  apiSecretKey: text("api_secret_key").notNull(), // Encrypted

  // Webhook Configuration
  webhookSecret: text("webhook_secret"), // For verifying Shopify webhooks

  // Integration Settings
  enablePrescriptionVerification: boolean("enable_prescription_verification").default(true),
  enableAIRecommendations: boolean("enable_ai_recommendations").default(true),
  enableAutoOrderSync: boolean("enable_auto_order_sync").default(true),
  requirePrescriptionUpload: boolean("require_prescription_upload").default(false),

  // Pricing Settings
  markupPercentage: decimal("markup_percentage", { precision: 5, scale: 2 }).default("0"),

  // Status
  status: shopifyStoreStatusEnum("status").notNull().default("active"),
  installedAt: timestamp("installed_at").notNull().defaultNow(),
  lastSyncAt: timestamp("last_sync_at"),
  expiresAt: timestamp("expires_at"),

  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("shopify_stores_company_idx").on(table.companyId),
  index("shopify_stores_status_idx").on(table.status),
]);

/**
 * Shopify Orders
 * Orders synced from Shopify stores
 */
export const shopifyOrderSyncStatusEnum = pgEnum("shopify_order_sync_status", [
  "pending",
  "synced",
  "processing",
  "completed",
  "failed",
  "cancelled"
]);

export const shopifyOrders = pgTable("shopify_orders", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
  shopifyStoreId: varchar("shopify_store_id", { length: 255 }).notNull().references(() => shopifyStores.id, { onDelete: "cascade" }),
  ilsOrderId: varchar("ils_order_id", { length: 255 }).references(() => orders.id),
  patientId: varchar("patient_id", { length: 255 }).references(() => patients.id),
  prescriptionId: varchar("prescription_id", { length: 255 }).references(() => prescriptions.id),

  // Shopify Order Details
  shopifyOrderNumber: varchar("shopify_order_number", { length: 100 }).notNull(),
  shopifyOrderId: varchar("shopify_order_id", { length: 255 }).notNull().unique(),
  shopifyOrderName: varchar("shopify_order_name", { length: 100 }),

  // Customer Details
  customerEmail: varchar("customer_email", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 50 }),
  customerName: varchar("customer_name", { length: 255 }),
  shippingAddress: jsonb("shipping_address"),
  billingAddress: jsonb("billing_address"),

  // Order Items
  orderItems: jsonb("order_items").notNull(), // Array of line items

  // Prescription Data
  prescriptionData: jsonb("prescription_data"), // Uploaded prescription details
  prescriptionVerified: boolean("prescription_verified").default(false),
  prescriptionVerifiedAt: timestamp("prescription_verified_at"),
  prescriptionVerifiedBy: varchar("prescription_verified_by", { length: 255 }),

  // AI Recommendations
  aiRecommendations: jsonb("ai_recommendations"), // AI suggested products
  aiRecommendationUsed: boolean("ai_recommendation_used").default(false),

  // Pricing
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  shipping: decimal("shipping", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("GBP"),

  // Status
  syncStatus: shopifyOrderSyncStatusEnum("sync_status").notNull().default("pending"),
  shopifyFulfillmentStatus: varchar("shopify_fulfillment_status", { length: 50 }),
  shopifyFinancialStatus: varchar("shopify_financial_status", { length: 50 }),

  // Sync Details
  syncedAt: timestamp("synced_at"),
  lastSyncAttempt: timestamp("last_sync_attempt"),
  syncError: text("sync_error"),
  syncRetryCount: integer("sync_retry_count").default(0),

  // Fulfillment
  fulfilledAt: timestamp("fulfilled_at"),
  trackingNumber: varchar("tracking_number", { length: 255 }),
  trackingUrl: varchar("tracking_url", { length: 500 }),

  notes: text("notes"),

  // Metadata
  shopifyCreatedAt: timestamp("shopify_created_at"),
  shopifyUpdatedAt: timestamp("shopify_updated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("shopify_orders_company_idx").on(table.companyId),
  index("shopify_orders_store_idx").on(table.shopifyStoreId),
  index("shopify_orders_sync_status_idx").on(table.syncStatus),
  index("shopify_orders_shopify_id_idx").on(table.shopifyOrderId),
  index("shopify_orders_ils_order_idx").on(table.ilsOrderId),
]);

/**
 * Prescription Uploads
 * Customer-uploaded prescriptions from Shopify
 */
export const prescriptionVerificationStatusEnum = pgEnum("prescription_verification_status", [
  "pending",
  "verified",
  "rejected",
  "expired",
  "requires_review"
]);

export const prescriptionUploads = pgTable("prescription_uploads", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
  shopifyOrderId: varchar("shopify_order_id", { length: 255 }).references(() => shopifyOrders.id),
  patientId: varchar("patient_id", { length: 255 }).references(() => patients.id),

  // Upload Details
  fileUrl: text("file_url").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(), // pdf, jpg, png
  fileSize: integer("file_size"), // in bytes

  // AI Extraction
  aiExtractedData: jsonb("ai_extracted_data"), // Prescription data extracted by AI
  aiExtractionConfidence: decimal("ai_extraction_confidence", { precision: 5, scale: 2 }),

  // Parsed Prescription Data
  prescriptionData: jsonb("prescription_data"),
  prescriptionDate: date("prescription_date"),
  expiryDate: date("expiry_date"),
  practitionerName: varchar("practitioner_name", { length: 255 }),
  practitionerGocNumber: varchar("practitioner_goc_number", { length: 50 }),

  // Verification
  verificationStatus: prescriptionVerificationStatusEnum("verification_status").notNull().default("pending"),
  verifiedBy: varchar("verified_by", { length: 255 }), // User ID who verified
  verifiedAt: timestamp("verified_at"),
  rejectionReason: text("rejection_reason"),

  // Alerts
  requiresReview: boolean("requires_review").default(false),
  reviewNotes: text("review_notes"),

  // Metadata
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("prescription_uploads_company_idx").on(table.companyId),
  index("prescription_uploads_order_idx").on(table.shopifyOrderId),
  index("prescription_uploads_status_idx").on(table.verificationStatus),
  index("prescription_uploads_requires_review_idx").on(table.requiresReview),
]);

/**
 * Shopify Product Sync
 * Sync between ILS products and Shopify products
 */
export const shopifyProducts = pgTable("shopify_products", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
  shopifyStoreId: varchar("shopify_store_id", { length: 255 }).notNull().references(() => shopifyStores.id, { onDelete: "cascade" }),

  // Shopify Product Details
  shopifyProductId: varchar("shopify_product_id", { length: 255 }).notNull(),
  shopifyVariantId: varchar("shopify_variant_id", { length: 255 }),

  // Product Information
  productTitle: varchar("product_title", { length: 255 }).notNull(),
  productType: varchar("product_type", { length: 100 }), // frames, lenses, contact_lenses, accessories
  sku: varchar("sku", { length: 100 }),

  // ILS Product Mapping
  ilsProductId: varchar("ils_product_id", { length: 255 }),
  ilsProductType: varchar("ils_product_type", { length: 50 }), // frame, lens, coating, contact_lens

  // Pricing
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),

  // Inventory
  inventoryQuantity: integer("inventory_quantity").default(0),
  trackInventory: boolean("track_inventory").default(false),

  // Sync
  lastSyncedAt: timestamp("last_synced_at"),
  syncEnabled: boolean("sync_enabled").default(true),

  // Metadata
  productMetadata: jsonb("product_metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("shopify_products_company_idx").on(table.companyId),
  index("shopify_products_store_idx").on(table.shopifyStoreId),
  index("shopify_products_shopify_id_idx").on(table.shopifyProductId),
  uniqueIndex("shopify_products_unique").on(table.shopifyStoreId, table.shopifyProductId, table.shopifyVariantId),
]);

/**
 * Shopify Webhooks Log
 * Track all webhooks received from Shopify
 */
export const shopifyWebhooks = pgTable("shopify_webhooks", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  shopifyStoreId: varchar("shopify_store_id", { length: 255 }).references(() => shopifyStores.id, { onDelete: "cascade" }),

  // Webhook Details
  webhookTopic: varchar("webhook_topic", { length: 100 }).notNull(), // orders/create, orders/updated, etc.
  shopifyWebhookId: varchar("shopify_webhook_id", { length: 255 }),

  // Payload
  payload: jsonb("payload").notNull(),
  headers: jsonb("headers"),

  // Processing
  processed: boolean("processed").default(false),
  processedAt: timestamp("processed_at"),
  processingError: text("processing_error"),
  processingRetryCount: integer("processing_retry_count").default(0),

  // Verification
  signatureValid: boolean("signature_valid"),

  // Metadata
  receivedAt: timestamp("received_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("shopify_webhooks_store_idx").on(table.shopifyStoreId),
  index("shopify_webhooks_topic_idx").on(table.webhookTopic),
  index("shopify_webhooks_processed_idx").on(table.processed),
  index("shopify_webhooks_received_idx").on(table.receivedAt),
]);

// Export Shopify Types
export type ShopifyStore = typeof shopifyStores.$inferSelect;
export type InsertShopifyStore = typeof shopifyStores.$inferInsert;
export type ShopifyOrder = typeof shopifyOrders.$inferSelect;
export type InsertShopifyOrder = typeof shopifyOrders.$inferInsert;
export type PrescriptionUpload = typeof prescriptionUploads.$inferSelect;
export type InsertPrescriptionUpload = typeof prescriptionUploads.$inferInsert;
export type ShopifyProduct = typeof shopifyProducts.$inferSelect;
export type InsertShopifyProduct = typeof shopifyProducts.$inferInsert;
export type ShopifyWebhook = typeof shopifyWebhooks.$inferSelect;
export type InsertShopifyWebhook = typeof shopifyWebhooks.$inferInsert;

// Export Contact Lens Types
/* DUPLICATE - Contact Lens Types moved to contactlens domain */
// export type ContactLensAssessment = typeof contactLensAssessments.$inferSelect;
// export type InsertContactLensAssessment = typeof contactLensAssessments.$inferInsert;
// export type ContactLensFitting = typeof contactLensFittings.$inferSelect;
// export type InsertContactLensFitting = typeof contactLensFittings.$inferInsert;
// export type ContactLensPrescription = typeof contactLensPrescriptions.$inferSelect;
// export type InsertContactLensPrescription = typeof contactLensPrescriptions.$inferInsert;
// export type ContactLensAftercare = typeof contactLensAftercare.$inferSelect;
// export type InsertContactLensAftercare = typeof contactLensAftercare.$inferInsert;
// export type ContactLensInventoryItem = typeof contactLensInventory.$inferSelect;
// export type InsertContactLensInventoryItem = typeof contactLensInventory.$inferInsert;
// export type ContactLensOrder = typeof contactLensOrders.$inferSelect;
// export type InsertContactLensOrder = typeof contactLensOrders.$inferInsert;


// ========== RCM (Revenue Cycle Management) Tables ==========

/**
 * Insurance Payers
 * Stores information about insurance companies and payers
 */
/* DUPLICATE - insurancePayers table moved to insurance domain */
// export const insurancePayers = pgTable("insurance_payers", {
//   id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
//   companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
//
  // Payer Information
//   name: varchar("name", { length: 255 }).notNull(),
//   payerId: varchar("payer_id", { length: 100 }).notNull(), // Electronic payer ID
//   type: payerTypeEnum("type").notNull(),
//
  // Contact Information
//   contactInfo: jsonb("contact_info"), // { phone, fax, email, address }
//
  // Configuration
//   claimSubmissionMethod: claimSubmissionMethodEnum("claim_submission_method").default("electronic"),
//   timelyFilingLimitDays: integer("timely_filing_limit_days").default(365),
//
  // Status
//   active: boolean("active").default(true),
//
  // Metadata
//   metadata: jsonb("metadata"),
//
  // Timestamps
//   createdAt: timestamp("created_at").notNull().defaultNow(),
//   updatedAt: timestamp("updated_at").notNull().defaultNow(),
// }, (table) => [
//   index("insurance_payers_company_idx").on(table.companyId),
//   uniqueIndex("insurance_payers_company_payer_id").on(table.companyId, table.payerId),
// ]);
//
// /**
//  * Insurance Claims
//  * Generic insurance claims for US-style RCM
//  */
/* DUPLICATE - insuranceClaims table moved to insurance domain */
// export const insuranceClaims = pgTable("insurance_claims", {
//   id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
//
  // References
//   companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
//   patientId: varchar("patient_id", { length: 255 }).references(() => patients.id),
//   payerId: varchar("payer_id", { length: 255 }).references(() => insurancePayers.id),
//
  // Claim Details
//   claimNumber: varchar("claim_number", { length: 50 }).notNull().unique(),
//   claimType: claimTypeEnum("claim_type").notNull(),
//   status: claimStatusEnum("status").notNull().default("draft"),
//
  // Dates
//   serviceDate: date("service_date").notNull(),
//   submittedAt: timestamp("submitted_at"),
//   processedAt: timestamp("processed_at"),
//
  // Financial (in cents)
//   totalCharges: decimal("total_charges", { precision: 10, scale: 2 }).notNull(),
//   allowedAmount: decimal("allowed_amount", { precision: 10, scale: 2 }),
//   paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
//   patientResponsibility: decimal("patient_responsibility", { precision: 10, scale: 2 }),
//   adjustments: decimal("adjustments", { precision: 10, scale: 2 }).default("0"),
//
  // Provider Information
//   renderingProviderId: varchar("rendering_provider_id", { length: 255 }),
//   billingProviderId: varchar("billing_provider_id", { length: 255 }),
//
  // Place of Service
//   placeOfService: servicePlaceEnum("place_of_service"),
//
  // Diagnosis Codes
//   diagnosisCodes: jsonb("diagnosis_codes"), // Array of ICD-10 codes
//
  // Payer Response
//   payerResponse: jsonb("payer_response"),
//   rejectionReason: text("rejection_reason"),
//   remittanceAdviceNumber: varchar("remittance_advice_number", { length: 100 }),
//
  // Notes
//   notes: text("notes"),
//
  // Metadata
//   metadata: jsonb("metadata"),
//
  // Timestamps
//   createdAt: timestamp("created_at").notNull().defaultNow(),
//   updatedAt: timestamp("updated_at").notNull().defaultNow(),
// }, (table) => [
//   index("insurance_claims_company_idx").on(table.companyId),
//   index("insurance_claims_patient_idx").on(table.patientId),
//   index("insurance_claims_payer_idx").on(table.payerId),
//   index("insurance_claims_status_idx").on(table.status),
//   index("insurance_claims_service_date_idx").on(table.serviceDate),
// ]);
//
// /**
//  * Claim Line Items
//  * Individual procedure/service lines within a claim
//  */
/* DUPLICATE - claimLineItems table moved to insurance domain */
// export const claimLineItems = pgTable("claim_line_items", {
//   id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
//
  // References
//   companyId: varchar("company_id", { length: 255 }).references(() => companies.id, { onDelete: "cascade" }),
//   claimId: varchar("claim_id", { length: 255 }).notNull().references(() => insuranceClaims.id, { onDelete: "cascade" }),
//
  // Line Item Details
//   lineNumber: integer("line_number").notNull(),
//   serviceDate: date("service_date").notNull(),
//
  // Procedure
//   procedureCode: varchar("procedure_code", { length: 20 }).notNull(), // CPT/HCPCS code
//   modifiers: jsonb("modifiers"), // Array of modifiers
//   description: text("description"),
//
  // Diagnosis
//   diagnosisCodePointers: jsonb("diagnosis_code_pointers"),
//
  // Quantities and Amounts (in cents)
//   units: integer("units").notNull().default(1),
//   chargeAmount: decimal("charge_amount", { precision: 10, scale: 2 }).notNull(),
//   allowedAmount: decimal("allowed_amount", { precision: 10, scale: 2 }),
//   paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
//   adjustmentAmount: decimal("adjustment_amount", { precision: 10, scale: 2 }).default("0"),
//   patientResponsibility: decimal("patient_responsibility", { precision: 10, scale: 2 }),
//
  // Place of Service
//   placeOfService: servicePlaceEnum("place_of_service"),
//
  // Provider
//   renderingProviderId: varchar("rendering_provider_id", { length: 255 }),
//
  // Status
//   status: claimStatusEnum("status"),
//
  // Metadata
//   metadata: jsonb("metadata"),
//
  // Timestamps
//   createdAt: timestamp("created_at").notNull().defaultNow(),
//   updatedAt: timestamp("updated_at").notNull().defaultNow(),
// }, (table) => [
//   index("claim_line_items_claim_idx").on(table.claimId),
//   index("claim_line_items_service_date_idx").on(table.serviceDate),
// ]);
//
// /**
//  * Claim Submission Batches
//  * Tracks batches of claims submitted together
//  */
/* DUPLICATE - claimBatches table moved to insurance domain */
// export const claimBatches = pgTable("claim_batches", {
//   id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
//   companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
//
  // Batch Details
//   batchNumber: varchar("batch_number", { length: 100 }).notNull().unique(),
//   payerId: varchar("payer_id", { length: 255 }).references(() => insurancePayers.id),
//
  // Claim IDs in batch (stored as JSON array)
//   claimIds: jsonb("claim_ids").notNull().$type<string[]>(),
//
  // Statistics
//   totalClaims: integer("total_claims").notNull(),
//   succeeded: integer("succeeded").notNull().default(0),
//   totalChargeAmount: decimal("total_charge_amount", { precision: 12, scale: 2 }).notNull(),
//
  // Submission
//   submittedAt: timestamp("submitted_at").notNull(),
//   submittedBy: varchar("submitted_by", { length: 255 }).notNull(),
//   status: batchStatusEnum("status").notNull().default("processing"),
//
  // Clearinghouse Response
//   clearinghouseResponse: jsonb("clearinghouse_response"),
//
  // Timestamps
//   createdAt: timestamp("created_at").notNull().defaultNow(),
//   updatedAt: timestamp("updated_at").notNull().defaultNow(),
// }, (table) => [
//   index("claim_batches_company_idx").on(table.companyId),
//   index("claim_batches_payer_idx").on(table.payerId),
//   index("claim_batches_status_idx").on(table.status),
//   index("claim_batches_submitted_idx").on(table.submittedAt),
// ]);
//
// /**
//  * Claim Appeals
//  * Tracks appeals for denied or underpaid claims
//  */
/* DUPLICATE - claimAppeals table moved to insurance domain */
// export const claimAppeals = pgTable("claim_appeals", {
//   id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
//
  // References
//   claimId: varchar("claim_id", { length: 255 }).notNull().references(() => insuranceClaims.id, { onDelete: "cascade" }),
//
  // Appeal Details
//   appealNumber: integer("appeal_number").notNull(),
//   appealDate: timestamp("appeal_date").notNull(),
//   appealedBy: varchar("appealed_by", { length: 255 }).notNull(),
//   appealReason: text("appeal_reason").notNull(),
//   supportingDocuments: jsonb("supporting_documents").$type<string[]>(),
//
  // Status
//   status: appealStatusEnum("status").notNull().default("submitted"),
//
  // Resolution
//   resolutionDate: timestamp("resolution_date"),
//   resolutionAmount: decimal("resolution_amount", { precision: 10, scale: 2 }),
//   notes: text("notes"),
//
  // Timestamps
//   createdAt: timestamp("created_at").notNull().defaultNow(),
//   updatedAt: timestamp("updated_at").notNull().defaultNow(),
// }, (table) => [
//   index("claim_appeals_claim_idx").on(table.claimId),
//   index("claim_appeals_status_idx").on(table.status),
//   index("claim_appeals_date_idx").on(table.appealDate),
// ]);
//
// /**
//  * Electronic Remittance Advice (ERA)
//  * Tracks electronic payment remittance from payers
//  */
/* DUPLICATE - claimERAs table moved to insurance domain */
// export const claimERAs = pgTable("claim_eras", {
//   id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
//
  // ERA Details
//   eraNumber: varchar("era_number", { length: 100 }).notNull().unique(),
//   payerId: varchar("payer_id", { length: 255 }).references(() => insurancePayers.id),
//
  // Payment Information
//   paymentAmount: decimal("payment_amount", { precision: 12, scale: 2 }).notNull(),
//   paymentDate: date("payment_date").notNull(),
//   checkNumber: varchar("check_number", { length: 100 }),
//
  // Claim Payments (stored as JSON array)
//   claimPayments: jsonb("claim_payments").notNull().$type<Array<{
//     claimId: string;
//     claimNumber: string;
//     paidAmount: number;
//     allowedAmount: number;
//     adjustments: Array<{
//       code: string;
//       amount: number;
//       reason: string;
//     }>;
//   }>>(),
//
  // Processing
//   receivedAt: timestamp("received_at").notNull(),
//   processedAt: timestamp("processed_at"),
//
  // Metadata
//   metadata: jsonb("metadata"),
//
  // Timestamps
//   createdAt: timestamp("created_at").notNull().defaultNow(),
//   updatedAt: timestamp("updated_at").notNull().defaultNow(),
// }, (table) => [
//   index("claim_eras_payer_idx").on(table.payerId),
//   index("claim_eras_payment_date_idx").on(table.paymentDate),
//   index("claim_eras_received_idx").on(table.receivedAt),
// ]);
//
// ========== End RCM Tables ==========
//
/* DUPLICATE - qualityMeasures table moved to quality domain */
// ========== Quality Measures Tables ==========
//
// /**
//  * Quality Measures
//  * Definitions of quality measures (HEDIS, MIPS, CQM, etc.)
//  */
// export const qualityMeasures = pgTable("quality_measures", {
//   id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
//   companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
//
  // Measure Details
//   measureId: varchar("measure_id", { length: 100 }).notNull(),
//   name: varchar("name", { length: 255 }).notNull(),
//   type: measureTypeEnum("type").notNull(),
//   domain: measureDomainEnum("domain").notNull(),
//   description: text("description").notNull(),
//
  // Criteria
//   numeratorCriteria: text("numerator_criteria").notNull(),
//   denominatorCriteria: text("denominator_criteria").notNull(),
//   exclusionCriteria: text("exclusion_criteria"),
//
  // Target
//   targetRate: decimal("target_rate", { precision: 5, scale: 2 }).notNull(),
//   reportingYear: integer("reporting_year").notNull(),
//
  // Metadata
//   active: boolean("active").default(true),
//   evidenceSource: varchar("evidence_source", { length: 255 }).notNull(),
//   steward: varchar("steward", { length: 255 }).notNull(),
//
  // Timestamps
//   createdAt: timestamp("created_at").notNull().defaultNow(),
//   updatedAt: timestamp("updated_at").notNull().defaultNow(),
// }, (table) => [
//   index("quality_measures_company_idx").on(table.companyId),
//   index("quality_measures_type_idx").on(table.type),
//   uniqueIndex("quality_measures_company_measure_year").on(table.companyId, table.measureId, table.reportingYear),
/* DUPLICATE - measureCalculations table moved to quality domain */
// ]);
//
// /**
//  * Measure Calculations
//  * Results of quality measure calculations
//  */
// export const measureCalculations = pgTable("measure_calculations", {
//   id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
//   measureId: varchar("measure_id", { length: 255 }).notNull().references(() => qualityMeasures.id, { onDelete: "cascade" }),
//
  // Calculation Period
//   calculationDate: timestamp("calculation_date").notNull(),
//   reportingPeriodStart: date("reporting_period_start").notNull(),
//   reportingPeriodEnd: date("reporting_period_end").notNull(),
//
  // Results
//   numerator: integer("numerator").notNull(),
//   denominator: integer("denominator").notNull(),
//   exclusions: integer("exclusions").notNull().default(0),
//   rate: decimal("rate", { precision: 5, scale: 2 }).notNull(),
//   targetRate: decimal("target_rate", { precision: 5, scale: 2 }).notNull(),
//   performanceGap: decimal("performance_gap", { precision: 5, scale: 2 }).notNull(),
//   meetingTarget: boolean("meeting_target").notNull(),
//
  // Patient List (stored as JSONB)
//   patientList: jsonb("patient_list").notNull().$type<Array<{
//     patientId: string;
//     inDenominator: boolean;
//     inNumerator: boolean;
//     excluded: boolean;
//     exclusionReason?: string;
//     complianceDate?: string;
//     gapClosure?: {
//       gapIdentified: boolean;
//       gapClosureDate?: string;
//       interventions: string[];
//     };
//   }>>(),
//
  // Calculated By
//   calculatedBy: varchar("calculated_by", { length: 255 }).notNull(),
//
  // Timestamps
//   createdAt: timestamp("created_at").notNull().defaultNow(),
// }, (table) => [
//   index("measure_calculations_measure_idx").on(table.measureId),
//   index("measure_calculations_date_idx").on(table.calculationDate),
/* DUPLICATE - starRatings table moved to quality domain */
// ]);
//
// /**
//  * Star Ratings
//  * Medicare Star Ratings data
//  */
// export const starRatings = pgTable("star_ratings", {
//   id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
//   companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
//
  // Rating Details
//   contractId: varchar("contract_id", { length: 100 }).notNull(),
//   measurementYear: integer("measurement_year").notNull(),
//   partCRating: decimal("part_c_rating", { precision: 2, scale: 1 }).notNull(),
//   partDRating: decimal("part_d_rating", { precision: 2, scale: 1 }).notNull(),
//   overallRating: decimal("overall_rating", { precision: 2, scale: 1 }).notNull(),
//
  // Measures (stored as JSONB)
//   measures: jsonb("measures").notNull().$type<Array<{
//     measureId: string;
//     measureName: string;
//     domain: string;
//     weight: number;
//     score: number;
//     stars: number;
//     cut1: number;
//     cut2: number;
//     cut3: number;
//     cut4: number;
//     cut5: number;
//   }>>(),
//
  // Status
//   calculatedDate: timestamp("calculated_date").notNull(),
//   published: boolean("published").default(false),
//
  // Timestamps
//   createdAt: timestamp("created_at").notNull().defaultNow(),
//   updatedAt: timestamp("updated_at").notNull().defaultNow(),
// }, (table) => [
//   index("star_ratings_company_idx").on(table.companyId),
//   index("star_ratings_year_idx").on(table.measurementYear),
//   uniqueIndex("star_ratings_contract_year").on(table.contractId, table.measurementYear),
/* DUPLICATE - qualityGapAnalyses table moved to quality domain */
// ]);
//
// /**
//  * Quality Gap Analyses
//  * Gap analysis results for quality measures
//  */
// export const qualityGapAnalyses = pgTable("quality_gap_analyses", {
//   id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
//   measureId: varchar("measure_id", { length: 255 }).notNull().references(() => qualityMeasures.id, { onDelete: "cascade" }),
//
  // Analysis Details
//   analysisDate: timestamp("analysis_date").notNull(),
//   totalGaps: integer("total_gaps").notNull(),
//   closableGaps: integer("closable_gaps").notNull(),
//   potentialRateImprovement: decimal("potential_rate_improvement", { precision: 5, scale: 2 }).notNull(),
//
  // Gaps By Reason (stored as JSONB)
//   gapsByReason: jsonb("gaps_by_reason").notNull().$type<Array<{
//     reason: string;
//     count: number;
//     percentage: number;
//   }>>(),
//
  // Recommended Actions
//   recommendedActions: jsonb("recommended_actions").notNull().$type<string[]>(),
//
  // Projected Impact
//   projectedImpact: jsonb("projected_impact").notNull().$type<{
//     currentRate: number;
//     projectedRate: number;
//     rateImprovement: number;
//   }>(),
//
  // Created By
//   createdBy: varchar("created_by", { length: 255 }).notNull(),
//
  // Timestamps
//   createdAt: timestamp("created_at").notNull().defaultNow(),
// }, (table) => [
//   index("quality_gap_analyses_measure_idx").on(table.measureId),
//   index("quality_gap_analyses_date_idx").on(table.analysisDate),
/* DUPLICATE - qualityDashboards table moved to quality domain */
// ]);
//
// /**
//  * Quality Dashboards
//  * Dashboard configurations for quality measures
//  */
// export const qualityDashboards = pgTable("quality_dashboards", {
//   id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
//   companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
//
  // Dashboard Details
//   name: varchar("name", { length: 255 }).notNull(),
//   description: text("description"),
//
  // Configuration
//   measures: jsonb("measures").notNull().$type<string[]>(),
//   filters: jsonb("filters").$type<{
//     provider?: string;
//     location?: string;
//     payerType?: string;
//     dateRange?: {
//       start: string;
//       end: string;
//     };
//   }>(),
//
  // Created By
//   createdBy: varchar("created_by", { length: 255 }).notNull(),
//
  // Timestamps
//   createdAt: timestamp("created_at").notNull().defaultNow(),
//   updatedAt: timestamp("updated_at").notNull().defaultNow(),
// }, (table) => [
//   index("quality_dashboards_company_idx").on(table.companyId),
//   index("quality_dashboards_created_by_idx").on(table.createdBy),
// ]);

// ========== End Quality Measures Tables ==========

/* DUPLICATE - Insurance Zod schemas and types moved to insurance domain */
// // Zod Schemas for RCM
// export const insertPayerSchema = createInsertSchema(insurancePayers);
// export const updatePayerSchema = insertPayerSchema.partial();
//
// export const insertClaimSchema = createInsertSchema(insuranceClaims);
// export const updateClaimSchema = insertClaimSchema.partial();
//
// export const insertClaimLineItemSchema = createInsertSchema(claimLineItems);
// export const updateClaimLineItemSchema = insertClaimLineItemSchema.partial();
//
// export const insertClaimBatchSchema = createInsertSchema(claimBatches);
// export const updateClaimBatchSchema = insertClaimBatchSchema.partial();
//
// export const insertClaimAppealSchema = createInsertSchema(claimAppeals);
// export const updateClaimAppealSchema = insertClaimAppealSchema.partial();
//
// export const insertClaimERASchema = createInsertSchema(claimERAs);
// export const updateClaimERASchema = insertClaimERASchema.partial();
//
// // Export RCM Types
// export type InsurancePayer = typeof insurancePayers.$inferSelect;
// export type InsertInsurancePayer = typeof insurancePayers.$inferInsert;
// export type InsuranceClaim = typeof insuranceClaims.$inferSelect;
// export type InsertInsuranceClaim = typeof insuranceClaims.$inferInsert;
// export type ClaimLineItem = typeof claimLineItems.$inferSelect;
// export type InsertClaimLineItem = typeof claimLineItems.$inferInsert;
// export type ClaimBatch = typeof claimBatches.$inferSelect;
// export type InsertClaimBatch = typeof claimBatches.$inferInsert;
// export type ClaimAppeal = typeof claimAppeals.$inferSelect;
// export type InsertClaimAppeal = typeof claimAppeals.$inferInsert;
// export type ClaimERA = typeof claimERAs.$inferSelect;
// export type InsertClaimERA = typeof claimERAs.$inferInsert;

/* DUPLICATE - Quality Measures Zod schemas moved to quality domain */
// Zod Schemas for Quality Measures
// export const insertQualityMeasureSchema = createInsertSchema(qualityMeasures);
// export const updateQualityMeasureSchema = insertQualityMeasureSchema.partial();
//
// export const insertMeasureCalculationSchema = createInsertSchema(measureCalculations);
// export const updateMeasureCalculationSchema = insertMeasureCalculationSchema.partial();
//
// export const insertStarRatingSchema = createInsertSchema(starRatings);
// export const updateStarRatingSchema = insertStarRatingSchema.partial();
//
// export const insertQualityGapAnalysisSchema = createInsertSchema(qualityGapAnalyses);
// export const updateQualityGapAnalysisSchema = insertQualityGapAnalysisSchema.partial();
//
// export const insertQualityDashboardSchema = createInsertSchema(qualityDashboards);
// export const updateQualityDashboardSchema = insertQualityDashboardSchema.partial();
//
// Export Quality Measures Types
// export type QualityMeasure = typeof qualityMeasures.$inferSelect;
// export type InsertQualityMeasure = typeof qualityMeasures.$inferInsert;
// export type MeasureCalculation = typeof measureCalculations.$inferSelect;
// export type InsertMeasureCalculation = typeof measureCalculations.$inferInsert;
// export type StarRating = typeof starRatings.$inferSelect;
// export type InsertStarRating = typeof starRatings.$inferInsert;
// export type QualityGapAnalysis = typeof qualityGapAnalyses.$inferSelect;
// export type InsertQualityGapAnalysis = typeof qualityGapAnalyses.$inferInsert;
// export type QualityDashboard = typeof qualityDashboards.$inferSelect;
// export type InsertQualityDashboard = typeof qualityDashboards.$inferInsert;

// ========== Population Health Enums ==========

/* DUPLICATE - riskLevelEnum moved to populationhealth domain */
// export const riskLevelEnum = pgEnum("risk_level", [
//   "low",
//   "moderate",
//   "high",
//   "very_high"
// ]);
//
// export const riskCategoryEnum = pgEnum("risk_category", [
//   "clinical",
//   "financial",
//   "utilization",
//   "social",
//   "behavioral",
//   "functional"
// ]);
//
/* DUPLICATE - assessmentStatusEnum moved to populationhealth domain */
// export const assessmentStatusEnum = pgEnum("assessment_status", [
//   "pending",
//   "in_progress",
//   "completed",
//   "expired"
// ]);
//
/* DUPLICATE - socialDeterminantCategoryEnum moved to populationhealth domain */
// export const socialDeterminantCategoryEnum = pgEnum("social_determinant_category", [
//   "economic_stability",
//   "education",
//   "social_community",
//   "healthcare_access",
//   "neighborhood_environment"
// ]);
//
/* DUPLICATE - socialDeterminantStatusEnum moved to populationhealth domain */
// export const socialDeterminantStatusEnum = pgEnum("social_determinant_status", [
//   "identified",
//   "intervention_planned",
//   "intervention_active",
//   "resolved"
// ]);
//
/* DUPLICATE - severityEnum moved to populationhealth domain */
// export const severityEnum = pgEnum("severity", [
//   "low",
//   "moderate",
//   "high"
// ]);
//
// ========== End Population Health Enums ==========

// ========== Population Health Tables ==========

/**
 * Risk Scores Table
 * Stores calculated risk scores for patients with contributing factors
//  */
/* DUPLICATE - Moved to modular schema
export const riskScores = pgTable(
  "risk_scores",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    scoreType: text("score_type").notNull(), // e.g., "HCC", "LACE", "CHF_Readmission"
    score: numeric("score", { precision: 10, scale: 2 }).notNull(),
    riskLevel: riskLevelEnum("risk_level").notNull(),
    category: riskCategoryEnum("category").notNull(),
    factors: jsonb("factors").notNull().$type<Array<{
      factor: string;
      category: string;
      weight: number;
      value: any;
      impact: number;
      description: string;
    }>>(), // Array of RiskFactor objects
    calculatedDate: timestamp("calculated_date", { withTimezone: true }).notNull().defaultNow(),
    validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
    calculatedBy: text("calculated_by").notNull(), // User ID who triggered calculation
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("risk_scores_company_idx").on(table.companyId),
    patientIdx: index("risk_scores_patient_idx").on(table.patientId),
    riskLevelIdx: index("risk_scores_risk_level_idx").on(table.riskLevel),
    categoryIdx: index("risk_scores_category_idx").on(table.category),
    calculatedDateIdx: index("risk_scores_calculated_date_idx").on(table.calculatedDate),
  })
); */

/**
 * Health Risk Assessments Table
 * Stores structured health risk assessment questionnaires and responses
//  */
/* DUPLICATE - healthRiskAssessments table moved to populationhealth domain */
// export const healthRiskAssessments = pgTable(
//   "health_risk_assessments",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
//     assessmentType: text("assessment_type").notNull(), // e.g., "HRA", "PHQ-9", "GAD-7"
//     status: assessmentStatusEnum("status").notNull().default("pending"),
//     responses: jsonb("responses").notNull().$type<Array<{
//       questionId: string;
//       question: string;
//       response: any;
//       score: number;
//       category: string;
//     }>>(), // Array of AssessmentResponse objects
//     totalScore: numeric("total_score", { precision: 10, scale: 2 }).notNull().default("0"),
//     riskLevel: riskLevelEnum("risk_level").notNull(),
//     recommendations: jsonb("recommendations").notNull().$type<string[]>().default([]), // Array of recommendation strings
//     completedDate: timestamp("completed_date", { withTimezone: true }),
//     expirationDate: timestamp("expiration_date", { withTimezone: true }).notNull(),
//     administeredBy: text("administered_by"), // User ID who administered assessment
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("health_risk_assessments_company_idx").on(table.companyId),
//     patientIdx: index("health_risk_assessments_patient_idx").on(table.patientId),
//     statusIdx: index("health_risk_assessments_status_idx").on(table.status),
//     riskLevelIdx: index("health_risk_assessments_risk_level_idx").on(table.riskLevel),
//   })
// );

/**
 * Predictive Models Table
 * Stores ML/statistical models for predicting patient outcomes
//  */
/* DUPLICATE - predictiveModels table moved to populationhealth domain */
// export const predictiveModels = pgTable(
//   "predictive_models",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     name: text("name").notNull(),
//     version: text("version").notNull(),
//     modelType: text("model_type").notNull(), // e.g., "readmission", "mortality", "cost"
//     description: text("description").notNull(),
//     inputFeatures: jsonb("input_features").notNull().$type<string[]>(), // Array of feature names
//     outputMetric: text("output_metric").notNull(), // e.g., "probability", "risk_score", "cost"
//     accuracy: numeric("accuracy", { precision: 5, scale: 4 }).notNull(), // Model accuracy (0-1)
//     validFrom: timestamp("valid_from", { withTimezone: true }).notNull().defaultNow(),
//     validUntil: timestamp("valid_until", { withTimezone: true }),
//     isActive: boolean("is_active").notNull().default(true),
//     createdBy: text("created_by").notNull(), // User ID
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("predictive_models_company_idx").on(table.companyId),
//     activeIdx: index("predictive_models_active_idx").on(table.isActive),
//     modelTypeIdx: index("predictive_models_model_type_idx").on(table.modelType),
//   })
// );

/**
 * Predictive Analyses Table
 * Stores results of running predictive models on patient data
//  */
/* DUPLICATE - predictiveAnalyses table moved to populationhealth domain */
// export const predictiveAnalyses = pgTable(
//   "predictive_analyses",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
//     modelId: text("model_id").notNull().references(() => predictiveModels.id, { onDelete: "cascade" }),
//     modelName: text("model_name").notNull(),
//     predictedOutcome: text("predicted_outcome").notNull(), // e.g., "High risk of readmission"
//     probability: numeric("probability", { precision: 5, scale: 4 }).notNull(), // 0-1
//     confidence: numeric("confidence", { precision: 5, scale: 4 }).notNull(), // 0-1
//     riskLevel: riskLevelEnum("risk_level").notNull(),
//     contributingFactors: jsonb("contributing_factors").notNull().$type<Array<{
//       factor: string;
//       contribution: number;
//     }>>(), // Array of contributing factors with weights
//     recommendations: jsonb("recommendations").notNull().$type<string[]>(), // Array of action recommendations
//     analyzedDate: timestamp("analyzed_date", { withTimezone: true }).notNull().defaultNow(),
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("predictive_analyses_company_idx").on(table.companyId),
//     patientIdx: index("predictive_analyses_patient_idx").on(table.patientId),
//     modelIdx: index("predictive_analyses_model_idx").on(table.modelId),
//     riskLevelIdx: index("predictive_analyses_risk_level_idx").on(table.riskLevel),
//     analyzedDateIdx: index("predictive_analyses_analyzed_date_idx").on(table.analyzedDate),
//   })
// );

/**
 * Social Determinants Table
 * Tracks social determinants of health (SDOH) and interventions
//  */
/* DUPLICATE - socialDeterminants table moved to populationhealth domain */
// export const socialDeterminants = pgTable(
//   "social_determinants",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
//     category: socialDeterminantCategoryEnum("category").notNull(),
//     factor: text("factor").notNull(), // Specific SDOH factor identified
//     status: socialDeterminantStatusEnum("status").notNull().default("identified"),
//     severity: severityEnum("severity").notNull(),
//     description: text("description").notNull(),
//     impact: text("impact").notNull(), // Description of health impact
//     interventions: jsonb("interventions").notNull().$type<string[]>().default([]), // Array of intervention descriptions
//     identifiedDate: timestamp("identified_date", { withTimezone: true }).notNull().defaultNow(),
//     resolvedDate: timestamp("resolved_date", { withTimezone: true }),
//     identifiedBy: text("identified_by").notNull(), // User ID
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("social_determinants_company_idx").on(table.companyId),
//     patientIdx: index("social_determinants_patient_idx").on(table.patientId),
//     categoryIdx: index("social_determinants_category_idx").on(table.category),
//     statusIdx: index("social_determinants_status_idx").on(table.status),
//     severityIdx: index("social_determinants_severity_idx").on(table.severity),
//   })
// );

/**
 * Risk Stratification Cohorts Table
 * Defines patient cohorts based on risk criteria for population management
//  */
/* DUPLICATE - riskStratificationCohorts table moved to populationhealth domain */
// export const riskStratificationCohorts = pgTable(
//   "risk_stratification_cohorts",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     name: text("name").notNull(),
//     description: text("description").notNull(),
//     criteria: jsonb("criteria").notNull().$type<Array<{
//       field: string;
//       operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
//       value: any;
//     }>>(), // Array of CohortCriteria objects
//     riskLevels: jsonb("risk_levels").notNull().$type<Array<'low' | 'moderate' | 'high' | 'very_high'>>(), // Array of target risk levels
//     patientCount: integer("patient_count").notNull().default(0),
//     active: boolean("active").notNull().default(true),
//     createdBy: text("created_by").notNull(), // User ID
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("risk_stratification_cohorts_company_idx").on(table.companyId),
//     activeIdx: index("risk_stratification_cohorts_active_idx").on(table.active),
//     nameIdx: index("risk_stratification_cohorts_name_idx").on(table.name),
//   })
// );
//
// Zod validation schemas for Population Health tables
// /* DUPLICATE - riskScore moved to modular schema */
// export const insertRiskScoreSchema = createInsertSchema(riskScores);
// export const insertHealthRiskAssessmentSchema = createInsertSchema(healthRiskAssessments);
// export const insertPredictiveModelSchema = createInsertSchema(predictiveModels);
// export const insertPredictiveAnalysisSchema = createInsertSchema(predictiveAnalyses);
// export const insertSocialDeterminantSchema = createInsertSchema(socialDeterminants);
// export const insertRiskStratificationCohortSchema = createInsertSchema(riskStratificationCohorts);
//
// TypeScript types
export type RiskScore = typeof riskScores.$inferSelect;
// export type InsertRiskScore = typeof riskScores.$inferInsert;
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

// ========== End Population Health Tables ==========

// ========== Communications Enums ==========

export const communicationChannelEnum = pgEnum("communication_channel", [
  "email",
  "sms",
  "push",
  "in_app",
  "whatsapp"
]);

export const messageStatusEnum = pgEnum("message_status", [
  "draft",
  "queued",
  "sending",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "failed",
  "unsubscribed"
]);

export const messagePriorityEnum = pgEnum("message_priority", [
  "low",
  "normal",
  "high",
  "urgent"
]);

export const messageCategoryEnum = pgEnum("message_category", [
  "transactional",
  "marketing",
  "appointment",
  "clinical",
  "billing"
]);

export const recipientTypeEnum = pgEnum("recipient_type", [
  "patient",
  "user",
  "provider"
]);

// ========== End Communications Enums ==========

// ========== Communications Tables ==========

/**
 * Message Templates Table
 * Stores reusable message templates for email, SMS, push notifications
//  */
/* DUPLICATE - Moved to modular schema
export const messageTemplates = pgTable(
  "message_templates",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    channel: communicationChannelEnum("channel").notNull(),
    subject: text("subject"), // For email
    body: text("body").notNull(), // Supports template variables like {{firstName}}
    variables: jsonb("variables").notNull().$type<string[]>(), // List of required variables
    category: messageCategoryEnum("category").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("message_templates_company_idx").on(table.companyId),
    channelIdx: index("message_templates_channel_idx").on(table.channel),
    categoryIdx: index("message_templates_category_idx").on(table.category),
    activeIdx: index("message_templates_active_idx").on(table.active),
  })
); */

/**
 * Messages Table
 * Stores all sent messages with delivery tracking
//  */
/* DUPLICATE - Moved to modular schema
export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    channel: communicationChannelEnum("channel").notNull(),
    templateId: text("template_id").references(() => messageTemplates.id, { onDelete: "set null" }),

    // Recipients
    recipientId: text("recipient_id").notNull(), // Patient/User ID
    recipientType: recipientTypeEnum("recipient_type").notNull(),
    to: text("to").notNull(), // Email address, phone number, or device token

    // Content
    subject: text("subject"),
    body: text("body").notNull(),
    metadata: jsonb("metadata").$type<Record<string, any>>(),

    // Status
    status: messageStatusEnum("status").notNull().default("draft"),
    priority: messagePriorityEnum("priority").notNull().default("normal"),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    clickedAt: timestamp("clicked_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),

    // Error handling
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").notNull().default(0),
    maxRetries: integer("max_retries").notNull().default(3),

    // Tracking
    trackingId: text("tracking_id"),
    campaignId: text("campaign_id"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("messages_company_idx").on(table.companyId),
    recipientIdx: index("messages_recipient_idx").on(table.recipientId),
    statusIdx: index("messages_status_idx").on(table.status),
    channelIdx: index("messages_channel_idx").on(table.channel),
    templateIdx: index("messages_template_idx").on(table.templateId),
    campaignIdx: index("messages_campaign_idx").on(table.campaignId),
    scheduledForIdx: index("messages_scheduled_for_idx").on(table.scheduledFor),
    sentAtIdx: index("messages_sent_at_idx").on(table.sentAt),
  })
); */

/* DUPLICATE - unsubscribes table moved to communications domain */
// /**
//  * Unsubscribes Table
//  * Tracks user opt-outs from communications
//  */
// export const unsubscribes = pgTable(
//   "unsubscribes",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     recipientId: text("recipient_id").notNull(),
//     channel: communicationChannelEnum("channel").notNull(),
//     category: messageCategoryEnum("category"),
//     unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }).notNull().defaultNow(),
//     reason: text("reason"),
//   },
//   (table) => ({
//     companyIdx: index("unsubscribes_company_idx").on(table.companyId),
//     recipientIdx: index("unsubscribes_recipient_idx").on(table.recipientId),
//     channelIdx: index("unsubscribes_channel_idx").on(table.channel),
//     categoryIdx: index("unsubscribes_category_idx").on(table.category),
    // Unique constraint: one unsubscribe per recipient+channel+category
//     uniqueUnsubscribe: index("unsubscribes_unique_idx").on(
//       table.recipientId,
//       table.channel,
//       table.category
//     ),
//   })
// );

/* DUPLICATE - whatsappMessageStatusEnum + whatsappMessageEvents table moved to communications domain */
// /**
//  * WhatsApp Message Events Table
//  * Tracks WhatsApp-specific delivery events and provider data
//  */
// export const whatsappMessageStatusEnum = pgEnum("whatsapp_message_status", [
//   "queued",
//   "sent",
//   "delivered",
//   "read",
//   "failed",
//   "undelivered"
// ]);
//
// export const whatsappMessageEvents = pgTable(
//   "whatsapp_message_events",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     messageId: text("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
//
    // Twilio WhatsApp Business API data
//     twilioMessageSid: text("twilio_message_sid"), // Twilio unique message ID
//     twilioAccountSid: text("twilio_account_sid"), // Twilio account identifier
//     twilioStatus: whatsappMessageStatusEnum("twilio_status"), // Twilio delivery status
//
    // Phone numbers
//     from: text("from").notNull(), // Sender WhatsApp number (format: whatsapp:+1234567890)
//     to: text("to").notNull(), // Recipient WhatsApp number
//
    // Message data
//     numSegments: integer("num_segments"), // Number of message segments
//     numMedia: integer("num_media").default(0), // Number of media attachments
//     mediaUrls: jsonb("media_urls").$type<string[]>(), // Media attachment URLs
//
    // Pricing
//     price: decimal("price", { precision: 10, scale: 4 }), // Message cost
//     priceUnit: text("price_unit").default("USD"), // Currency
//
    // Status tracking
//     status: whatsappMessageStatusEnum("status").notNull().default("queued"),
//     errorCode: text("error_code"), // Error code if failed
//     errorMessage: text("error_message"), // Error description
//
    // Timestamps
//     queuedAt: timestamp("queued_at", { withTimezone: true }),
//     sentAt: timestamp("sent_at", { withTimezone: true }),
//     deliveredAt: timestamp("delivered_at", { withTimezone: true }),
//     readAt: timestamp("read_at", { withTimezone: true }),
//     failedAt: timestamp("failed_at", { withTimezone: true }),
//
    // Metadata
//     metadata: jsonb("metadata").$type<Record<string, any>>(),
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("whatsapp_events_company_idx").on(table.companyId),
//     messageIdx: index("whatsapp_events_message_idx").on(table.messageId),
//     twilioSidIdx: index("whatsapp_events_twilio_sid_idx").on(table.twilioMessageSid),
//     statusIdx: index("whatsapp_events_status_idx").on(table.status),
//     sentAtIdx: index("whatsapp_events_sent_at_idx").on(table.sentAt),
//   })
// );

/* DUPLICATE - smsMessageStatusEnum + smsMessageEvents table moved to communications domain */
// /**
//  * SMS Message Events Table
//  * Tracks SMS-specific delivery events and provider data
//  */
// export const smsMessageStatusEnum = pgEnum("sms_message_status", [
//   "queued",
//   "sent",
//   "delivered",
//   "failed",
//   "undelivered"
// ]);
//
// export const smsMessageEvents = pgTable(
//   "sms_message_events",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     messageId: text("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
//
    // Twilio SMS API data
//     twilioMessageSid: text("twilio_message_sid"), // Twilio unique message ID
//     twilioAccountSid: text("twilio_account_sid"), // Twilio account identifier
//     twilioStatus: smsMessageStatusEnum("twilio_status"), // Twilio delivery status
//
    // Phone numbers
//     from: text("from").notNull(), // Sender phone number
//     to: text("to").notNull(), // Recipient phone number
//
    // Message data
//     body: text("body").notNull(), // SMS body text
//     numSegments: integer("num_segments"), // Number of SMS segments
//     numMedia: integer("num_media").default(0), // Number of MMS attachments
//     mediaUrls: jsonb("media_urls").$type<string[]>(), // MMS attachment URLs
//
    // Carrier information
//     carrierName: text("carrier_name"), // Recipient's carrier
//     carrierType: text("carrier_type"), // mobile, landline, voip
//
    // Pricing
//     price: decimal("price", { precision: 10, scale: 4 }), // Message cost
//     priceUnit: text("price_unit").default("USD"), // Currency
//
    // Status tracking
//     status: smsMessageStatusEnum("status").notNull().default("queued"),
//     errorCode: text("error_code"), // Error code if failed
//     errorMessage: text("error_message"), // Error description
//
    // Timestamps
//     queuedAt: timestamp("queued_at", { withTimezone: true }),
//     sentAt: timestamp("sent_at", { withTimezone: true }),
//     deliveredAt: timestamp("delivered_at", { withTimezone: true }),
//     failedAt: timestamp("failed_at", { withTimezone: true }),
//
    // Metadata
//     metadata: jsonb("metadata").$type<Record<string, any>>(),
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("sms_events_company_idx").on(table.companyId),
//     messageIdx: index("sms_events_message_idx").on(table.messageId),
//     twilioSidIdx: index("sms_events_twilio_sid_idx").on(table.twilioMessageSid),
//     statusIdx: index("sms_events_status_idx").on(table.status),
//     sentAtIdx: index("sms_events_sent_at_idx").on(table.sentAt),
//     toIdx: index("sms_events_to_idx").on(table.to),
//   })
// );

// Zod validation schemas for Communications tables
/* DUPLICATE - messageTemplate moved to modular schema */
// export const insertMessageTemplateSchema = createInsertSchema(messageTemplates);
/* DUPLICATE - message moved to modular schema */
// export const insertMessageSchema = createInsertSchema(messages);
/* DUPLICATE - Zod validation schemas for messaging moved to communications domain */
// export const insertUnsubscribeSchema = createInsertSchema(unsubscribes);
// export const insertWhatsappMessageEventSchema = createInsertSchema(whatsappMessageEvents);
// export const insertSmsMessageEventSchema = createInsertSchema(smsMessageEvents);

// TypeScript types
export type MessageTemplate = typeof messageTemplates.$inferSelect;
// export type InsertMessageTemplate = typeof messageTemplates.$inferInsert;
export type Message = typeof messages.$inferSelect;
// export type InsertMessage = typeof messages.$inferInsert;
/* DUPLICATE - TypeScript types for messaging moved to communications domain */
// export type Unsubscribe = typeof unsubscribes.$inferSelect;
// export type InsertUnsubscribe = typeof unsubscribes.$inferInsert;
// export type WhatsappMessageEvent = typeof whatsappMessageEvents.$inferSelect;
// export type InsertWhatsappMessageEvent = typeof whatsappMessageEvents.$inferInsert;
// export type SmsMessageEvent = typeof smsMessageEvents.$inferSelect;
// export type InsertSmsMessageEvent = typeof smsMessageEvents.$inferInsert;

// ========== End Communications Tables ==========

// ========== GDPR & Data Privacy Tables ==========

/**
 * GDPR Deletion Request Status
//  */
export const gdprDeletionStatusEnum = pgEnum("gdpr_deletion_status", [
  "pending",
  "approved",
  "rejected",
  "processing",
  "completed",
  "failed"
]);

/**
 * GDPR Deletion Request Type
//  */
export const gdprDeletionTypeEnum = pgEnum("gdpr_deletion_type", [
  "anonymization", // Anonymize PII but keep records for analytics
  "hard_delete"     // Complete removal from database
]);

/**
 * GDPR Data Subject Type
//  */
export const gdprDataSubjectTypeEnum = pgEnum("gdpr_data_subject_type", [
  "patient",
  "user",
  "employee",
  "customer"
]);

/**
 * GDPR Deletion Requests Table
 * Tracks right-to-deletion requests under GDPR and UK GDPR compliance
//  */
export const gdprDeletionRequests = pgTable(
  "gdpr_deletion_requests",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),

    // Subject information
    dataSubjectId: text("data_subject_id").notNull(), // Patient/User ID to be deleted
    dataSubjectType: gdprDataSubjectTypeEnum("data_subject_type").notNull(),
    dataSubjectEmail: text("data_subject_email"), // For verification
    dataSubjectName: text("data_subject_name"), // Before anonymization

    // Request details
    requestedBy: text("requested_by").notNull().references(() => users.id), // User who submitted request
    deletionType: gdprDeletionTypeEnum("deletion_type").notNull().default("anonymization"),
    reason: text("reason"), // Optional reason for deletion
    legalBasis: text("legal_basis"), // GDPR Article 17, UK GDPR, etc.

    // Status tracking
    status: gdprDeletionStatusEnum("status").notNull().default("pending"),
    approvedBy: text("approved_by").references(() => users.id), // Admin who approved
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectedBy: text("rejected_by").references(() => users.id),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),

    // Processing details
    processingStartedAt: timestamp("processing_started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    errorMessage: text("error_message"),

    // Retention compliance
    retentionExpiresAt: timestamp("retention_expires_at", { withTimezone: true }), // Legal hold period

    // Deletion audit trail
    tablesProcessed: jsonb("tables_processed").$type<string[]>(), // List of tables where data was deleted
    recordsDeleted: integer("records_deleted").default(0), // Count of records deleted
    recordsAnonymized: integer("records_anonymized").default(0), // Count of records anonymized
    deletionLog: jsonb("deletion_log").$type<Array<{
      table: string;
      action: 'deleted' | 'anonymized';
      recordCount: number;
      timestamp: string;
    }>>(), // Detailed audit log

    // Verification
    verificationToken: text("verification_token"), // For email verification
    verifiedAt: timestamp("verified_at", { withTimezone: true }),

    // Metadata
    metadata: jsonb("metadata").$type<Record<string, any>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("gdpr_deletion_company_idx").on(table.companyId),
    dataSubjectIdx: index("gdpr_deletion_data_subject_idx").on(table.dataSubjectId),
    statusIdx: index("gdpr_deletion_status_idx").on(table.status),
    requestedByIdx: index("gdpr_deletion_requested_by_idx").on(table.requestedBy),
    createdAtIdx: index("gdpr_deletion_created_at_idx").on(table.createdAt),
  })
);

// Zod validation schemas
export const insertGdprDeletionRequestSchema = createInsertSchema(gdprDeletionRequests);

// TypeScript types
export type GdprDeletionRequest = typeof gdprDeletionRequests.$inferSelect;
export type InsertGdprDeletionRequest = typeof gdprDeletionRequests.$inferInsert;

// ========== End GDPR & Data Privacy Tables ==========

/* DUPLICATE - Campaign management enums moved to campaigns domain */
// ========== Campaign Management Enums ==========
//
// /**
//  * Campaign status lifecycle
//  */
// export const campaignStatusEnum = pgEnum("campaign_status", [
//   "draft",
//   "scheduled",
//   "running",
//   "paused",
//   "completed",
//   "cancelled"
// ]);
//
// /**
//  * Campaign type
//  */
// export const campaignTypeEnum = pgEnum("campaign_type", [
//   "one_time",
//   "recurring",
//   "triggered",
//   "drip"
// ]);
//
// /**
//  * Campaign frequency for recurring campaigns
//  */
// export const campaignFrequencyEnum = pgEnum("campaign_frequency", [
//   "daily",
//   "weekly",
//   "monthly"
// ]);
//
// /**
//  * A/B test variant
//  */
// export const abTestVariantEnum = pgEnum("ab_test_variant", ["A", "B"]);
//
// /**
//  * Audience segment criteria operators
//  */
// export const segmentOperatorEnum = pgEnum("segment_operator", [
//   "eq",
//   "ne",
//   "gt",
//   "gte",
//   "lt",
//   "lte",
//   "in",
//   "contains"
// ]);

// ========== End Campaign Management Enums ==========

/* DUPLICATE - audienceSegments table moved to campaigns domain */
// ========== Campaign Management Tables ==========
//
// /**
//  * Audience Segments Table
//  * Stores audience segmentation criteria for targeted campaigns
//  */
// export const audienceSegments = pgTable(
//   "audience_segments",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     name: text("name").notNull(),
//     description: text("description"),
//     criteria: jsonb("criteria").notNull().$type<Array<{
//       field: string;
//       operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
//       value: any;
//     }>>(), // Array of filtering criteria
//     size: integer("size"), // Estimated segment size
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("audience_segments_company_idx").on(table.companyId),
//     nameIdx: index("audience_segments_name_idx").on(table.name),
//   })
// );

/* DUPLICATE - campaigns table moved to campaigns domain */
// /**
//  * Campaigns Table
//  * Stores marketing campaign configuration and tracking metrics
//  */
// export const campaigns = pgTable(
//   "campaigns",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     name: text("name").notNull(),
//     description: text("description"),
//     type: campaignTypeEnum("type").notNull(),
//     status: campaignStatusEnum("status").notNull().default("draft"),
//
    // Audience
//     segmentIds: jsonb("segment_ids").notNull().$type<string[]>(), // Array of audience segment IDs
//     estimatedReach: integer("estimated_reach").notNull().default(0),
//
    // Content
//     channel: communicationChannelEnum("channel").notNull(),
//     templateId: text("template_id").references(() => messageTemplates.id, { onDelete: "set null" }),
//     variables: jsonb("variables").$type<Record<string, string>>(), // Default variable values
//
    // Scheduling
//     startDate: timestamp("start_date", { withTimezone: true }),
//     endDate: timestamp("end_date", { withTimezone: true }),
//     frequency: campaignFrequencyEnum("frequency"), // For recurring campaigns
//     sendTime: text("send_time"), // HH:MM format
//
    // Tracking metrics
//     sentCount: integer("sent_count").notNull().default(0),
//     deliveredCount: integer("delivered_count").notNull().default(0),
//     openedCount: integer("opened_count").notNull().default(0),
//     clickedCount: integer("clicked_count").notNull().default(0),
//     unsubscribedCount: integer("unsubscribed_count").notNull().default(0),
//
    // Settings
//     throttle: integer("throttle"), // Messages per hour
//     abTestEnabled: boolean("ab_test_enabled").notNull().default(false),
//     abTestVariant: abTestVariantEnum("ab_test_variant"),
//
    // Timestamps
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
//     launchedAt: timestamp("launched_at", { withTimezone: true }),
//     completedAt: timestamp("completed_at", { withTimezone: true }),
//   },
//   (table) => ({
//     companyIdx: index("campaigns_company_idx").on(table.companyId),
//     statusIdx: index("campaigns_status_idx").on(table.status),
//     typeIdx: index("campaigns_type_idx").on(table.type),
//     channelIdx: index("campaigns_channel_idx").on(table.channel),
//     startDateIdx: index("campaigns_start_date_idx").on(table.startDate),
//   })
// );

/* DUPLICATE - campaignRecipients table moved to campaigns domain */
// /**
//  * Campaign Recipients Table
//  * Junction table tracking which recipients received each campaign
//  */
// export const campaignRecipients = pgTable(
//   "campaign_recipients",
//   {
//     id: text("id").primaryKey(),
//     campaignId: text("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
//     recipientId: text("recipient_id").notNull(), // Patient/User ID
//     messageId: text("message_id").references(() => messages.id, { onDelete: "set null" }), // Link to sent message
//     sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     campaignIdx: index("campaign_recipients_campaign_idx").on(table.campaignId),
//     recipientIdx: index("campaign_recipients_recipient_idx").on(table.recipientId),
    // Unique constraint to prevent duplicate sends
//     uniqueCampaignRecipient: uniqueIndex("campaign_recipient_unique").on(table.campaignId, table.recipientId),
//   })
// );

/* DUPLICATE - Zod validation schemas for campaigns moved to campaigns domain */
// Zod validation schemas for Campaign tables
// export const insertAudienceSegmentSchema = createInsertSchema(audienceSegments);
// export const insertCampaignSchema = createInsertSchema(campaigns);
// export const insertCampaignRecipientSchema = createInsertSchema(campaignRecipients);

/* DUPLICATE - TypeScript types for campaigns moved to campaigns domain */
// TypeScript types
// export type AudienceSegment = typeof audienceSegments.$inferSelect;
// export type InsertAudienceSegment = typeof audienceSegments.$inferInsert;
// export type Campaign = typeof campaigns.$inferSelect;
// export type InsertCampaign = typeof campaigns.$inferInsert;
// export type CampaignRecipient = typeof campaignRecipients.$inferSelect;
// export type InsertCampaignRecipient = typeof campaignRecipients.$inferInsert;

// ========== End Campaign Management Tables ==========

/* DUPLICATE - Clinical Decision Support enums moved to cds domain */
// ========== Clinical Decision Support Enums ==========
//
// /**
//  * Alert severity levels
//  */
// export const alertSeverityEnum = pgEnum("alert_severity", [
//   "info",
//   "warning",
//   "critical"
// ]);
//
// /**
//  * Drug interaction severity
//  */
// export const interactionSeverityEnum = pgEnum("interaction_severity", [
//   "minor",
//   "moderate",
//   "major",
//   "contraindicated"
// ]);
//
// /**
//  * Recommendation confidence level
//  */
// export const confidenceLevelEnum = pgEnum("confidence_level", [
//   "low",
//   "medium",
//   "high",
//   "very_high"
// ]);
//
// /**
//  * Clinical alert types
//  */
// export const clinicalAlertTypeEnum = pgEnum("clinical_alert_type", [
//   "drug_interaction",
//   "allergy",
//   "lab_critical",
//   "guideline_deviation",
//   "risk_factor"
// ]);
//
// /**
//  * Guideline strength of recommendation
//  */
// export const recommendationStrengthEnum = pgEnum("recommendation_strength", [
//   "A", // Strong
//   "B", // Moderate
//   "C", // Weak
//   "D"  // Very weak
// ]);
//
// /**
//  * Quality of evidence
//  */
// export const evidenceQualityEnum = pgEnum("evidence_quality", [
//   "high",
//   "moderate",
//   "low",
//   "very_low"
// ]);
//
// /**
//  * Lab result status
//  */
// export const labStatusEnum = pgEnum("lab_status", [
//   "normal",
//   "low",
//   "high",
//   "critical"
// ]);
//
// /**
//  * Diagnostic urgency
//  */
// export const diagnosticUrgencyEnum = pgEnum("diagnostic_urgency", [
//   "routine",
//   "urgent",
//   "emergency"
// ]);
//
// ========== End Clinical Decision Support Enums ==========

/* DUPLICATE - drugs table moved to cds domain */
// ========== Clinical Decision Support Tables ==========
//
// /**
//  * Drugs Table
//  * Stores drug database for clinical decision support
//  */
// export const drugs = pgTable(
//   "drugs",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     name: text("name").notNull(),
//     genericName: text("generic_name").notNull(),
//     brandNames: jsonb("brand_names").notNull().$type<string[]>(),
//     drugClass: text("drug_class").notNull(),
//     interactions: jsonb("interactions").notNull().$type<string[]>(), // Drug IDs
//     contraindications: jsonb("contraindications").notNull().$type<string[]>(),
//     sideEffects: jsonb("side_effects").notNull().$type<string[]>(),
//     dosageRange: jsonb("dosage_range").$type<{
//       min: number;
//       max: number;
//       unit: string;
//     }>(),
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("drugs_company_idx").on(table.companyId),
//     nameIdx: index("drugs_name_idx").on(table.name),
//     genericNameIdx: index("drugs_generic_name_idx").on(table.genericName),
//   })
// );

/* DUPLICATE - drugInteractions table moved to cds domain */
// /**
//  * Drug Interactions Table
//  * Stores known drug-drug interactions
//  */
// export const drugInteractions = pgTable(
//   "drug_interactions",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     drug1Id: text("drug1_id").notNull().references(() => drugs.id, { onDelete: "cascade" }),
//     drug2Id: text("drug2_id").notNull().references(() => drugs.id, { onDelete: "cascade" }),
//     severity: interactionSeverityEnum("severity").notNull(),
//     description: text("description").notNull(),
//     clinicalEffects: jsonb("clinical_effects").notNull().$type<string[]>(),
//     management: text("management").notNull(),
//     references: jsonb("references").notNull().$type<string[]>(),
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("drug_interactions_company_idx").on(table.companyId),
//     drug1Idx: index("drug_interactions_drug1_idx").on(table.drug1Id),
//     drug2Idx: index("drug_interactions_drug2_idx").on(table.drug2Id),
//     severityIdx: index("drug_interactions_severity_idx").on(table.severity),
//   })
// );

/* DUPLICATE - clinicalGuidelines table moved to cds domain */
// /**
//  * Clinical Guidelines Table
//  * Stores clinical practice guidelines
//  */
// export const clinicalGuidelines = pgTable(
//   "clinical_guidelines",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     name: text("name").notNull(),
//     condition: text("condition").notNull(),
//     organization: text("organization").notNull(), // AAO, AHA, CDC, etc.
//     version: text("version").notNull(),
//     lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull(),
//     recommendations: jsonb("recommendations").notNull().$type<Array<{
//       id: string;
//       title: string;
//       description: string;
//       strengthOfRecommendation: 'A' | 'B' | 'C' | 'D';
//       qualityOfEvidence: 'high' | 'moderate' | 'low' | 'very_low';
//       applicableCriteria?: string[];
//       contraindications?: string[];
//     }>>(),
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("clinical_guidelines_company_idx").on(table.companyId),
//     conditionIdx: index("clinical_guidelines_condition_idx").on(table.condition),
//     organizationIdx: index("clinical_guidelines_organization_idx").on(table.organization),
//   })
// );

/* DUPLICATE - clinicalAlerts table moved to cds domain */
// /**
//  * Clinical Alerts Table
//  * Stores clinical alerts for patient safety
//  */
// export const clinicalAlerts = pgTable(
//   "clinical_alerts",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
//     type: clinicalAlertTypeEnum("type").notNull(),
//     severity: alertSeverityEnum("severity").notNull(),
//     message: text("message").notNull(),
//     details: text("details").notNull(),
//     recommendations: jsonb("recommendations").notNull().$type<string[]>(),
//     requiresAcknowledgment: boolean("requires_acknowledgment").notNull().default(false),
//     acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
//     acknowledgedBy: text("acknowledged_by"),
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("clinical_alerts_company_idx").on(table.companyId),
//     patientIdx: index("clinical_alerts_patient_idx").on(table.patientId),
//     typeIdx: index("clinical_alerts_type_idx").on(table.type),
//     severityIdx: index("clinical_alerts_severity_idx").on(table.severity),
//     createdAtIdx: index("clinical_alerts_created_at_idx").on(table.createdAt),
//   })
// );

/* DUPLICATE - treatmentRecommendations table moved to cds domain */
// /**
//  * Treatment Recommendations Table
//  * Stores AI-generated treatment recommendations
//  */
// export const treatmentRecommendations = pgTable(
//   "treatment_recommendations",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
//     condition: text("condition").notNull(),
//     diagnosis: text("diagnosis").notNull(),
//     recommendations: jsonb("recommendations").notNull().$type<Array<{
//       treatment: string;
//       rationale: string;
//       confidence: string;
//       evidenceLevel: string;
//       alternatives?: string[];
//       contraindications?: string[];
//       expectedOutcome?: string;
//       monitoringRequired?: string[];
//     }>>(),
//     guidelineReferences: jsonb("guideline_references").notNull().$type<string[]>(),
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("treatment_recommendations_company_idx").on(table.companyId),
//     patientIdx: index("treatment_recommendations_patient_idx").on(table.patientId),
//     conditionIdx: index("treatment_recommendations_condition_idx").on(table.condition),
//     createdAtIdx: index("treatment_recommendations_created_at_idx").on(table.createdAt),
//   })
// );

/* DUPLICATE - diagnosticSuggestions table moved to cds domain */
// /**
//  * Diagnostic Suggestions Table
//  * Stores AI-generated diagnostic suggestions
//  */
// export const diagnosticSuggestions = pgTable(
//   "diagnostic_suggestions",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
//     symptoms: jsonb("symptoms").notNull().$type<string[]>(),
//     labResults: jsonb("lab_results").$type<Record<string, any>>(),
//     vitalSigns: jsonb("vital_signs").$type<Record<string, number>>(),
//     possibleDiagnoses: jsonb("possible_diagnoses").notNull().$type<Array<{
//       condition: string;
//       icd10Code: string;
//       probability: number;
//       supportingFactors: string[];
//       differentialDiagnoses: string[];
//       recommendedTests?: string[];
//       urgency: 'routine' | 'urgent' | 'emergency';
//     }>>(),
//     confidence: confidenceLevelEnum("confidence").notNull(),
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("diagnostic_suggestions_company_idx").on(table.companyId),
//     patientIdx: index("diagnostic_suggestions_patient_idx").on(table.patientId),
//     confidenceIdx: index("diagnostic_suggestions_confidence_idx").on(table.confidence),
//     createdAtIdx: index("diagnostic_suggestions_created_at_idx").on(table.createdAt),
//   })
// );

/* DUPLICATE - Zod validation schemas for CDS moved to cds domain */
// Zod validation schemas for Clinical Decision Support tables
// export const insertDrugSchema = createInsertSchema(drugs);
// export const insertDrugInteractionSchema = createInsertSchema(drugInteractions);
// export const insertClinicalGuidelineSchema = createInsertSchema(clinicalGuidelines);
// export const insertClinicalAlertSchema = createInsertSchema(clinicalAlerts);
// export const insertTreatmentRecommendationSchema = createInsertSchema(treatmentRecommendations);
// export const insertDiagnosticSuggestionSchema = createInsertSchema(diagnosticSuggestions);

/* DUPLICATE - TypeScript types for CDS moved to cds domain */
// TypeScript types
// export type Drug = typeof drugs.$inferSelect;
// export type InsertDrug = typeof drugs.$inferInsert;
// export type DrugInteraction = typeof drugInteractions.$inferSelect;
// export type InsertDrugInteraction = typeof drugInteractions.$inferInsert;
// export type ClinicalGuideline = typeof clinicalGuidelines.$inferSelect;
// export type InsertClinicalGuideline = typeof clinicalGuidelines.$inferInsert;
// export type ClinicalAlert = typeof clinicalAlerts.$inferSelect;
// export type InsertClinicalAlert = typeof clinicalAlerts.$inferInsert;
// export type TreatmentRecommendation = typeof treatmentRecommendations.$inferSelect;
// export type InsertTreatmentRecommendation = typeof treatmentRecommendations.$inferInsert;
// export type DiagnosticSuggestion = typeof diagnosticSuggestions.$inferSelect;
// export type InsertDiagnosticSuggestion = typeof diagnosticSuggestions.$inferInsert;
//
// ========== End Clinical Decision Support Tables ==========

/* DUPLICATE - Engagement Workflows enums moved to workflows domain */
// ========== Engagement Workflows Enums ==========
//
// /**
//  * Workflow trigger types
//  */
// export const workflowTriggerEnum = pgEnum("workflow_trigger", [
//   "patient_registered",
//   "appointment_scheduled",
//   "appointment_reminder",
//   "appointment_completed",
//   "test_results_available",
//   "prescription_expiring",
//   "no_show",
//   "missed_appointment",
//   "payment_due",
//   "payment_overdue",
//   "birthday",
//   "annual_checkup_due",
//   "custom"
// ]);
//
// /**
//  * Workflow action types
//  */
// export const workflowActionTypeEnum = pgEnum("workflow_action_type", [
//   "send_message",
//   "wait",
//   "add_tag",
//   "remove_tag",
//   "create_task",
//   "branch"
// ]);
//
// /**
//  * Workflow status
//  */
// export const workflowStatusEnum = pgEnum("workflow_status", [
//   "active",
//   "paused",
//   "archived"
// ]);
//
// /**
//  * Workflow instance status
//  */
// export const workflowInstanceStatusEnum = pgEnum("workflow_instance_status", [
//   "pending",
//   "running",
//   "completed",
//   "failed",
//   "cancelled"
// ]);
//
// ========== End Engagement Workflows Enums ==========

/* DUPLICATE - workflows table moved to workflows domain */
// ========== Engagement Workflows Tables ==========
//
// /**
//  * Workflows Table
//  * Stores workflow definitions for automated patient engagement
//  */
// export const workflows = pgTable(
//   "workflows",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     name: text("name").notNull(),
//     description: text("description"),
//     trigger: workflowTriggerEnum("trigger").notNull(),
//     status: workflowStatusEnum("status").notNull().default("active"),
//
    // Conditions for workflow execution
//     conditions: jsonb("conditions").$type<Array<{
//       field: string;
//       operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains';
//       value: any;
//     }>>(),
//
    // Workflow actions
//     actions: jsonb("actions").notNull().$type<Array<{
//       id: string;
//       type: string;
//       order: number;
//       channel?: string;
//       templateId?: string;
//       variables?: Record<string, string>;
//       delayDays?: number;
//       delayHours?: number;
//       tags?: string[];
//       taskTitle?: string;
//       taskAssigneeId?: string;
//       condition?: {
//         field: string;
//         operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains';
//         value: any;
//       };
//       trueActions?: any[];
//       falseActions?: any[];
//     }>>(),
//
    // Settings
//     runOnce: boolean("run_once").notNull().default(false),
//     maxRuns: integer("max_runs"),
//
    // Statistics
//     totalRuns: integer("total_runs").notNull().default(0),
//     totalCompleted: integer("total_completed").notNull().default(0),
//     totalFailed: integer("total_failed").notNull().default(0),
//
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("workflows_company_idx").on(table.companyId),
//     triggerIdx: index("workflows_trigger_idx").on(table.trigger),
//     statusIdx: index("workflows_status_idx").on(table.status),
//   })
// );

/* DUPLICATE - workflowInstances table moved to workflows domain */
// /**
//  * Workflow Instances Table
//  * Stores individual workflow executions for patients
//  */
// export const workflowInstances = pgTable(
//   "workflow_instances",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     workflowId: text("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
//     patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
//
//     triggerData: jsonb("trigger_data").notNull().$type<Record<string, any>>(),
//
//     status: workflowInstanceStatusEnum("status").notNull().default("pending"),
//     currentActionIndex: integer("current_action_index").notNull().default(0),
//
//     startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
//     completedAt: timestamp("completed_at", { withTimezone: true }),
//     failedAt: timestamp("failed_at", { withTimezone: true }),
//     error: text("error"),
//
//     executionLog: jsonb("execution_log").notNull().$type<Array<{
//       actionId: string;
//       actionType: string;
//       executedAt: Date;
//       success: boolean;
//       error?: string;
//       result?: any;
//     }>>().default([]),
//   },
//   (table) => ({
//     companyIdx: index("workflow_instances_company_idx").on(table.companyId),
//     workflowIdx: index("workflow_instances_workflow_idx").on(table.workflowId),
//     patientIdx: index("workflow_instances_patient_idx").on(table.patientId),
//     statusIdx: index("workflow_instances_status_idx").on(table.status),
//     startedAtIdx: index("workflow_instances_started_at_idx").on(table.startedAt),
//   })
// );

/* DUPLICATE - workflowRunCounts table moved to workflows domain */
// /**
//  * Workflow Run Counts Table
//  * Tracks how many times each workflow has run for each patient
//  */
// export const workflowRunCounts = pgTable(
//   "workflow_run_counts",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     workflowId: text("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
//     patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
//     runCount: integer("run_count").notNull().default(0),
//     lastRunAt: timestamp("last_run_at", { withTimezone: true }),
//   },
//   (table) => ({
//     companyIdx: index("workflow_run_counts_company_idx").on(table.companyId),
//     workflowPatientIdx: uniqueIndex("workflow_run_counts_workflow_patient_unique").on(
//       table.workflowId,
//       table.patientId
//     ),
//   })
// );

/* DUPLICATE - Zod validation schemas for workflows moved to workflows domain */
// Zod validation schemas for Engagement Workflows tables
// export const insertWorkflowSchema = createInsertSchema(workflows);
// export const insertWorkflowInstanceSchema = createInsertSchema(workflowInstances);
// export const insertWorkflowRunCountSchema = createInsertSchema(workflowRunCounts);

/* DUPLICATE - TypeScript types for workflows moved to workflows domain */
// TypeScript types
// export type Workflow = typeof workflows.$inferSelect;
// export type InsertWorkflow = typeof workflows.$inferInsert;
// export type WorkflowInstance = typeof workflowInstances.$inferSelect;
// export type InsertWorkflowInstance = typeof workflowInstances.$inferInsert;
// export type WorkflowRunCount = typeof workflowRunCounts.$inferSelect;
// export type InsertWorkflowRunCount = typeof workflowRunCounts.$inferInsert;
//
// ========== End Engagement Workflows Tables ==========

/* DUPLICATE - Predictive Analytics enums moved to predictive domain */
// ========== Predictive Analytics Tables ==========
//
// /**
//  * Predictive Analytics Enums
//  * Note: Reusing riskLevelEnum from Population Health section
//  */
// export const predictionConfidenceEnum = pgEnum("prediction_confidence", ["low", "medium", "high"]);
// export const mlModelTypeEnum = pgEnum("ml_model_type", ["classification", "regression", "clustering"]);
// export const mlModelStatusEnum = pgEnum("ml_model_status", ["active", "testing", "deprecated"]);
// export const riskTypeEnum = pgEnum("risk_type", ["readmission", "disease_progression", "complication", "mortality"]);
// export const readmissionTimeframeEnum = pgEnum("readmission_timeframe", ["7_days", "30_days", "90_days"]);

/* DUPLICATE - mlModels table moved to predictive domain */
// /**
//  * ML Models Table
//  * Stores machine learning models for predictions
//  */
// export const mlModels = pgTable(
//   "ml_models",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     name: text("name").notNull(),
//     type: mlModelTypeEnum("type").notNull(),
//     version: text("version").notNull(),
//     trainedAt: timestamp("trained_at", { withTimezone: true }).notNull(),
//
    // Features and performance
//     features: jsonb("features").notNull().$type<string[]>(),
//     performance: jsonb("performance").notNull().$type<{
//       accuracy?: number;
//       precision?: number;
//       recall?: number;
//       f1Score?: number;
//       auc?: number;
//       rmse?: number;
//     }>(),
//
//     status: mlModelStatusEnum("status").notNull().default("active"),
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("ml_models_company_idx").on(table.companyId),
//     statusIdx: index("ml_models_status_idx").on(table.status),
//     typeIdx: index("ml_models_type_idx").on(table.type),
//   })
// );

/* DUPLICATE - riskStratifications table moved to predictive domain */
// /**
//  * Risk Stratifications Table
//  * Stores risk assessments for patients
//  */
// export const riskStratifications = pgTable(
//   "risk_stratifications",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
//
//     riskType: riskTypeEnum("risk_type").notNull(),
//     riskLevel: riskLevelEnum("risk_level").notNull(),
//     riskScore: integer("risk_score").notNull(), // 0-100
//     confidence: predictionConfidenceEnum("confidence").notNull(),
//
    // Complex data stored as JSONB
//     riskFactors: jsonb("risk_factors").notNull().$type<Array<{
//       factor: string;
//       weight: number;
//       value: any;
//       impact: 'positive' | 'negative' | 'neutral';
//       description: string;
//     }>>(),
//     interventions: jsonb("interventions").notNull().$type<string[]>(),
//
//     predictedTimeframe: text("predicted_timeframe"),
//     modelVersion: text("model_version").notNull(),
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("risk_stratifications_company_idx").on(table.companyId),
//     patientIdx: index("risk_stratifications_patient_idx").on(table.patientId),
//     riskTypeIdx: index("risk_stratifications_risk_type_idx").on(table.riskType),
//     riskLevelIdx: index("risk_stratifications_risk_level_idx").on(table.riskLevel),
//     createdAtIdx: index("risk_stratifications_created_at_idx").on(table.createdAt),
//   })
// );

/* DUPLICATE - readmissionPredictions table moved to predictive domain */
// /**
//  * Readmission Predictions Table
//  * Stores hospital readmission risk predictions
//  */
// export const readmissionPredictions = pgTable(
//   "readmission_predictions",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
//     admissionId: text("admission_id").notNull(),
//
//     probability: integer("probability").notNull(), // 0-100
//     riskLevel: riskLevelEnum("risk_level").notNull(),
//     timeframe: readmissionTimeframeEnum("timeframe").notNull(),
//
//     contributingFactors: jsonb("contributing_factors").notNull().$type<Array<{
//       factor: string;
//       weight: number;
//       value: any;
//       impact: 'positive' | 'negative' | 'neutral';
//       description: string;
//     }>>(),
//     preventiveActions: jsonb("preventive_actions").notNull().$type<string[]>(),
//
//     confidence: predictionConfidenceEnum("confidence").notNull(),
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("readmission_predictions_company_idx").on(table.companyId),
//     patientIdx: index("readmission_predictions_patient_idx").on(table.patientId),
//     admissionIdx: index("readmission_predictions_admission_idx").on(table.admissionId),
//     riskLevelIdx: index("readmission_predictions_risk_level_idx").on(table.riskLevel),
//     createdAtIdx: index("readmission_predictions_created_at_idx").on(table.createdAt),
//   })
// );

/* DUPLICATE - noShowPredictions table moved to predictive domain */
// /**
//  * No-Show Predictions Table
//  * Stores appointment no-show risk predictions
//  */
// export const noShowPredictions = pgTable(
//   "no_show_predictions",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
//     appointmentId: text("appointment_id").notNull(),
//
//     probability: integer("probability").notNull(), // 0-100
//     riskLevel: riskLevelEnum("risk_level").notNull(),
//
//     contributingFactors: jsonb("contributing_factors").notNull().$type<Array<{
//       factor: string;
//       weight: number;
//       value: any;
//       impact: 'positive' | 'negative' | 'neutral';
//       description: string;
//     }>>(),
//     recommendedActions: jsonb("recommended_actions").notNull().$type<string[]>(),
//
//     confidence: predictionConfidenceEnum("confidence").notNull(),
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("no_show_predictions_company_idx").on(table.companyId),
//     patientIdx: index("no_show_predictions_patient_idx").on(table.patientId),
//     appointmentIdx: index("no_show_predictions_appointment_idx").on(table.appointmentId),
//     riskLevelIdx: index("no_show_predictions_risk_level_idx").on(table.riskLevel),
//     createdAtIdx: index("no_show_predictions_created_at_idx").on(table.createdAt),
//   })
// );

/* DUPLICATE - diseaseProgressionPredictions table moved to predictive domain */
// /**
//  * Disease Progression Predictions Table
//  * Stores predictions for disease progression over time
//  */
// export const diseaseProgressionPredictions = pgTable(
//   "disease_progression_predictions",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
//
//     disease: text("disease").notNull(),
//     currentStage: text("current_stage").notNull(),
//
//     predictedStages: jsonb("predicted_stages").notNull().$type<Array<{
//       stage: string;
//       timeframe: string;
//       probability: number;
//       interventions?: string[];
//     }>>(),
//     riskFactors: jsonb("risk_factors").notNull().$type<Array<{
//       factor: string;
//       weight: number;
//       value: any;
//       impact: 'positive' | 'negative' | 'neutral';
//       description: string;
//     }>>(),
//
//     confidence: predictionConfidenceEnum("confidence").notNull(),
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("disease_progression_predictions_company_idx").on(table.companyId),
//     patientIdx: index("disease_progression_predictions_patient_idx").on(table.patientId),
//     diseaseIdx: index("disease_progression_predictions_disease_idx").on(table.disease),
//     createdAtIdx: index("disease_progression_predictions_created_at_idx").on(table.createdAt),
//   })
// );

/* DUPLICATE - treatmentOutcomePredictions table moved to predictive domain */
// /**
//  * Treatment Outcome Predictions Table
//  * Stores predictions for treatment outcomes
//  */
// export const treatmentOutcomePredictions = pgTable(
//   "treatment_outcome_predictions",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
//
//     treatment: text("treatment").notNull(),
//     condition: text("condition").notNull(),
//
//     predictedOutcomes: jsonb("predicted_outcomes").notNull().$type<Array<{
//       outcome: string;
//       probability: number;
//       timeframe: string;
//       confidenceInterval?: {
//         lower: number;
//         upper: number;
//       };
//     }>>(),
//     successProbability: integer("success_probability").notNull(), // 0-100
//     alternativeTreatments: jsonb("alternative_treatments").$type<Array<{
//       treatment: string;
//       successProbability: number;
//       rationale: string;
//     }>>(),
//
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("treatment_outcome_predictions_company_idx").on(table.companyId),
//     patientIdx: index("treatment_outcome_predictions_patient_idx").on(table.patientId),
//     treatmentIdx: index("treatment_outcome_predictions_treatment_idx").on(table.treatment),
//     createdAtIdx: index("treatment_outcome_predictions_created_at_idx").on(table.createdAt),
//   })
// );

/* DUPLICATE - Zod validation schemas for predictive analytics moved to predictive domain */
// Zod validation schemas for Predictive Analytics tables
// export const insertMlModelSchema = createInsertSchema(mlModels);
// export const insertRiskStratificationSchema = createInsertSchema(riskStratifications);
// export const insertReadmissionPredictionSchema = createInsertSchema(readmissionPredictions);
// export const insertNoShowPredictionSchema = createInsertSchema(noShowPredictions);
// export const insertDiseaseProgressionPredictionSchema = createInsertSchema(diseaseProgressionPredictions);
// export const insertTreatmentOutcomePredictionSchema = createInsertSchema(treatmentOutcomePredictions);

/* DUPLICATE - TypeScript types for predictive analytics moved to predictive domain */
// TypeScript types
// export type MlModel = typeof mlModels.$inferSelect;
// export type InsertMlModel = typeof mlModels.$inferInsert;
// export type RiskStratification = typeof riskStratifications.$inferSelect;
// export type InsertRiskStratification = typeof riskStratifications.$inferInsert;
// export type ReadmissionPrediction = typeof readmissionPredictions.$inferSelect;
// export type InsertReadmissionPrediction = typeof readmissionPredictions.$inferInsert;
// export type NoShowPrediction = typeof noShowPredictions.$inferSelect;
// export type InsertNoShowPrediction = typeof noShowPredictions.$inferInsert;
// export type DiseaseProgressionPrediction = typeof diseaseProgressionPredictions.$inferSelect;
// export type InsertDiseaseProgressionPrediction = typeof diseaseProgressionPredictions.$inferInsert;
// export type TreatmentOutcomePrediction = typeof treatmentOutcomePredictions.$inferSelect;
// export type InsertTreatmentOutcomePrediction = typeof treatmentOutcomePredictions.$inferInsert;
//
// ========== Appointment Booking Tables ==========
/**
 * Appointment Booking Enums
//  */
/* DUPLICATE - cancelledByEnum moved to appointments domain */
// export const cancelledByEnum = pgEnum("cancelled_by", ["patient", "provider", "system"]);

/**
 * Appointment Types Table
 * Defines types of appointments that can be booked
//  */
/* DUPLICATE - appointmentTypes table moved to appointments domain */
// export const appointmentTypes = pgTable(
//   "appointment_types",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     name: text("name").notNull(),
//     description: text("description").notNull(),
//     duration: integer("duration").notNull(), // minutes
//     price: integer("price"), // in cents
//     allowOnlineBooking: boolean("allow_online_booking").notNull().default(true),
//     requiresApproval: boolean("requires_approval").notNull().default(false),
//     color: text("color"),
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("appointment_types_company_idx").on(table.companyId),
//     nameIdx: index("appointment_types_name_idx").on(table.name),
//   })
// );

/**
 * Provider Availability Table
 * Stores provider schedules and available time slots
//  */
/* DUPLICATE - providerAvailability table moved to appointments domain */
// export const providerAvailability = pgTable(
//   "provider_availability",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     providerId: text("provider_id").notNull(),
//     providerName: text("provider_name").notNull(),
//     dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
//     startTime: text("start_time").notNull(), // HH:MM
//     endTime: text("end_time").notNull(), // HH:MM
//     slotDuration: integer("slot_duration").notNull(), // minutes
//     breakTimes: jsonb("break_times").$type<Array<{
//       start: string;
//       end: string;
//     }>>(),
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("provider_availability_company_idx").on(table.companyId),
//     providerIdx: index("provider_availability_provider_idx").on(table.providerId),
//     dayOfWeekIdx: index("provider_availability_day_of_week_idx").on(table.dayOfWeek),
//   })
// );

/**
 * Appointment Bookings Table
 * Stores patient appointment bookings
//  */
/* DUPLICATE - appointmentBookings table moved to appointments domain */
// export const appointmentBookings = pgTable(
//   "appointment_bookings",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
//     providerId: text("provider_id").notNull(),
//     providerName: text("provider_name").notNull(),
//     appointmentTypeId: text("appointment_type_id").notNull().references(() => appointmentTypes.id, { onDelete: "restrict" }),
//     appointmentType: text("appointment_type").notNull(),
//
//     date: timestamp("date", { withTimezone: true }).notNull(),
//     startTime: text("start_time").notNull(), // HH:MM
//     endTime: text("end_time").notNull(), // HH:MM
//     duration: integer("duration").notNull(), // minutes
//
//     status: appointmentStatusEnum("status").notNull().default("scheduled"),
//
//     reason: text("reason"),
//     notes: text("notes"),
//
    // Confirmation
//     confirmationCode: text("confirmation_code").notNull(),
//     confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
//
    // Reminders
//     reminderSent: boolean("reminder_sent").notNull().default(false),
//     reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
//
    // Cancellation
//     cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
//     cancelledBy: cancelledByEnum("cancelled_by"),
//     cancellationReason: text("cancellation_reason"),
//
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("appointment_bookings_company_idx").on(table.companyId),
//     patientIdx: index("appointment_bookings_patient_idx").on(table.patientId),
//     providerIdx: index("appointment_bookings_provider_idx").on(table.providerId),
//     dateIdx: index("appointment_bookings_date_idx").on(table.date),
//     statusIdx: index("appointment_bookings_status_idx").on(table.status),
//     confirmationCodeIdx: index("appointment_bookings_confirmation_code_idx").on(table.confirmationCode),
//     createdAtIdx: index("appointment_bookings_created_at_idx").on(table.createdAt),
//   })
// );

// Zod validation schemas for Appointment Booking tables
/* DUPLICATE - appointmentTypes/providerAvailability/appointmentBookings schemas and types moved to appointments domain */
// export const insertAppointmentTypeSchema = createInsertSchema(appointmentTypes);
// export const insertProviderAvailabilitySchema = createInsertSchema(providerAvailability);
// export const insertAppointmentBookingSchema = createInsertSchema(appointmentBookings);
//
// TypeScript types
// export type AppointmentType = typeof appointmentTypes.$inferSelect;
// export type InsertAppointmentType = typeof appointmentTypes.$inferInsert;
// export type ProviderAvailability = typeof providerAvailability.$inferSelect;
// export type InsertProviderAvailability = typeof providerAvailability.$inferInsert;
// export type AppointmentBooking = typeof appointmentBookings.$inferSelect;
// export type InsertAppointmentBooking = typeof appointmentBookings.$inferInsert;

/* DUPLICATE - Patient Portal Enums (4 enums) moved to patientportal domain */
// ========== Patient Portal Tables ==========
// /**
//  * Patient Portal Enums
//  */
// export const medicalRecordTypeEnum = pgEnum("medical_record_type", [
//   "exam",
//   "prescription",
//   "lab_result",
//   "document",
//   "image",
// ]);
//
// export const conversationStatusEnum = pgEnum("conversation_status", ["open", "closed"]);
//
// export const messageSenderTypeEnum = pgEnum("message_sender_type", ["patient", "provider"]);
//
// NOTE: Reusing existing paymentMethodEnum from line 378
//
// export const portalPaymentStatusEnum = pgEnum("portal_payment_status", [
//   "pending",
//   "completed",
//   "failed",
//   "refunded",
// ]);

/**
 * Medical Records Table
 * Patient portal medical records (exams, prescriptions, lab results, documents)
//  */
/* DUPLICATE - medicalRecords table moved to patientportal domain */
// export const medicalRecords = pgTable(
//   "medical_records",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
//     type: medicalRecordTypeEnum("type").notNull(),
//     title: text("title").notNull(),
//     date: timestamp("date", { withTimezone: true }).notNull(),
//     provider: text("provider").notNull(),
//     summary: text("summary"),
//     details: jsonb("details").$type<Record<string, any>>(),
//     attachments: jsonb("attachments").$type<Array<{
//       id: string;
//       filename: string;
//       fileType: string;
//       fileSize: number;
//       url: string;
//     }>>(),
//     viewable: boolean("viewable").notNull().default(true),
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("medical_records_company_idx").on(table.companyId),
//     patientIdx: index("medical_records_patient_idx").on(table.patientId),
//     typeIdx: index("medical_records_type_idx").on(table.type),
//     dateIdx: index("medical_records_date_idx").on(table.date),
//     createdAtIdx: index("medical_records_created_at_idx").on(table.createdAt),
//   })
// );

/**
 * Portal Conversations Table
 * Patient-provider messaging conversations
//  */
/* DUPLICATE - portalConversations table moved to patientportal domain */
// export const portalConversations = pgTable(
//   "portal_conversations",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
//     providerId: text("provider_id").notNull(),
//     providerName: text("provider_name").notNull(),
//     subject: text("subject").notNull(),
//     status: conversationStatusEnum("status").notNull().default("open"),
//     lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull(),
//     unreadCount: integer("unread_count").notNull().default(0),
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("portal_conversations_company_idx").on(table.companyId),
//     patientIdx: index("portal_conversations_patient_idx").on(table.patientId),
//     providerIdx: index("portal_conversations_provider_idx").on(table.providerId),
//     statusIdx: index("portal_conversations_status_idx").on(table.status),
//     lastMessageAtIdx: index("portal_conversations_last_message_at_idx").on(table.lastMessageAt),
//   })
// );

/**
 * Portal Messages Table
 * Individual messages within conversations
//  */
/* DUPLICATE - portalMessages table moved to patientportal domain */
// export const portalMessages = pgTable(
//   "portal_messages",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     conversationId: text("conversation_id").notNull().references(() => portalConversations.id, { onDelete: "cascade" }),
//     from: messageSenderTypeEnum("from").notNull(),
//     senderId: text("sender_id").notNull(),
//     senderName: text("sender_name").notNull(),
//     recipientId: text("recipient_id").notNull(),
//     subject: text("subject"),
//     body: text("body").notNull(),
//     attachments: jsonb("attachments").$type<Array<{
//       filename: string;
//       url: string;
//     }>>(),
//     read: boolean("read").notNull().default(false),
//     readAt: timestamp("read_at", { withTimezone: true }),
//     sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("portal_messages_company_idx").on(table.companyId),
//     conversationIdx: index("portal_messages_conversation_idx").on(table.conversationId),
//     senderIdx: index("portal_messages_sender_idx").on(table.senderId),
//     recipientIdx: index("portal_messages_recipient_idx").on(table.recipientId),
//     sentAtIdx: index("portal_messages_sent_at_idx").on(table.sentAt),
//   })
// );

/**
 * Portal Payments Table
 * Patient bill payments through portal
//  */
/* DUPLICATE - portalPayments table moved to patientportal domain */
// export const portalPayments = pgTable(
//   "portal_payments",
//   {
//     id: text("id").primaryKey(),
//     companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
//     billId: text("bill_id").notNull().references(() => invoices.id, { onDelete: "restrict" }),
//     patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
//     amount: integer("amount").notNull(), // in cents
//     method: paymentMethodEnum("method").notNull(),
//     status: portalPaymentStatusEnum("status").notNull().default("pending"),
//     transactionId: text("transaction_id"),
//     processedAt: timestamp("processed_at", { withTimezone: true }),
//     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
//   },
//   (table) => ({
//     companyIdx: index("portal_payments_company_idx").on(table.companyId),
//     billIdx: index("portal_payments_bill_idx").on(table.billId),
//     patientIdx: index("portal_payments_patient_idx").on(table.patientId),
//     statusIdx: index("portal_payments_status_idx").on(table.status),
//     createdAtIdx: index("portal_payments_created_at_idx").on(table.createdAt),
//   })
// );

// Zod validation schemas for Patient Portal tables
/* DUPLICATE - Patient Portal schemas and types (first 4 tables) moved to patientportal domain */
// export const insertMedicalRecordSchema = createInsertSchema(medicalRecords);
// export const insertPortalConversationSchema = createInsertSchema(portalConversations);
// export const insertPortalMessageSchema = createInsertSchema(portalMessages);
// export const insertPortalPaymentSchema = createInsertSchema(portalPayments);
//
// TypeScript types
// export type MedicalRecord = typeof medicalRecords.$inferSelect;
// export type InsertMedicalRecord = typeof medicalRecords.$inferInsert;
// export type PortalConversation = typeof portalConversations.$inferSelect;
// export type InsertPortalConversation = typeof portalConversations.$inferInsert;
// export type PortalMessage = typeof portalMessages.$inferSelect;
// export type InsertPortalMessage = typeof portalMessages.$inferInsert;
// export type PortalPayment = typeof portalPayments.$inferSelect;
// export type InsertPortalPayment = typeof portalPayments.$inferInsert;

// ========== End Predictive Analytics Tables ==========

// ========== Care Coordination Tables ==========

/**
 * Care Coordination Enums
//  */
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

/**
 * Care Plans Table
 * Comprehensive care plans for patients
//  */
/* DUPLICATE - Moved to modular schema
export const carePlans = pgTable(
  "care_plans",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    status: carePlanStatusEnum("status").notNull().default("draft"),
    category: carePlanCategoryEnum("category").notNull(),
    goals: jsonb("goals").notNull().$type<Array<{
      id: string;
      description: string;
      targetDate: string; // ISO date
      status: string;
      measurableOutcome: string;
      currentValue?: number;
      targetValue?: number;
      unit?: string;
      progress: number;
      barriers: string[];
      notes: string;
      createdAt: string;
      updatedAt: string;
    }>>(),
    interventions: jsonb("interventions").notNull().$type<Array<{
      id: string;
      type: string;
      description: string;
      frequency: string;
      assignedTo?: string;
      status: string;
      startDate: string;
      endDate?: string;
      outcomes: string[];
      createdAt: string;
      updatedAt: string;
    }>>(),
    careTeamId: text("care_team_id"),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }),
    reviewFrequency: reviewFrequencyEnum("review_frequency").notNull(),
    nextReviewDate: timestamp("next_review_date", { withTimezone: true }).notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("care_plans_company_idx").on(table.companyId),
    patientIdx: index("care_plans_patient_idx").on(table.patientId),
    statusIdx: index("care_plans_status_idx").on(table.status),
    categoryIdx: index("care_plans_category_idx").on(table.category),
    nextReviewIdx: index("care_plans_next_review_idx").on(table.nextReviewDate),
  })
); */

/**
 * Care Teams Table
 * Multi-disciplinary care teams for patients
//  */
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
//  */
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
//  */
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
//  */
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
//  */
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

// Zod validation schemas for Care Coordination tables
/* DUPLICATE - carePlan moved to modular schema */
// export const insertCarePlanSchema = createInsertSchema(carePlans);
export const insertCareTeamSchema = createInsertSchema(careTeams);
export const insertCareGapSchema = createInsertSchema(careGaps);
export const insertTransitionOfCareSchema = createInsertSchema(transitionsOfCare);
export const insertCareCoordinationTaskSchema = createInsertSchema(careCoordinationTasks);
export const insertPatientOutreachSchema = createInsertSchema(patientOutreach);

// TypeScript types
export type CarePlan = typeof carePlans.$inferSelect;
// export type InsertCarePlan = typeof carePlans.$inferInsert;
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

// ========== End Care Coordination Tables ==========

// ========== Chronic Disease Management Tables ==========

/**
 * Chronic Disease Management Enums
//  */
export const registryCriteriaTypeEnum = pgEnum("registry_criteria_type", ["diagnosis", "lab_value", "medication", "procedure", "risk_score"]);
export const criteriaOperatorEnum = pgEnum("criteria_operator", ["equals", "contains", "greater_than", "less_than", "in_range"]);
export const registryEnrollmentStatusEnum = pgEnum("registry_enrollment_status", ["active", "inactive", "graduated", "deceased", "transferred"]);
export const programCriteriaTypeEnum = pgEnum("program_criteria_type", ["clinical", "demographic", "behavioral", "financial"]);
export const programInterventionTypeEnum = pgEnum("program_intervention_type", ["education", "coaching", "monitoring", "medication_management", "lifestyle"]);
export const interventionDeliveryMethodEnum = pgEnum("intervention_delivery_method", ["in_person", "phone", "video", "online", "app"]);
export const measurementFrequencyEnum = pgEnum("measurement_frequency", ["monthly", "quarterly", "annually"]);
export const programEnrollmentStatusEnum = pgEnum("program_enrollment_status", ["active", "completed", "withdrawn", "failed"]);
export const engagementTypeEnum = pgEnum("engagement_type", ["education_completed", "coaching_session", "self_monitoring", "goal_set", "milestone_achieved"]);
export const outcomeTypeEnum = pgEnum("outcome_type", ["clinical", "functional", "behavioral", "quality_of_life", "cost"]);
export const preventiveCareTypeEnum = pgEnum("preventive_care_type", ["screening", "vaccination", "counseling", "medication"]);
export const preventiveCareStatusEnum = pgEnum("preventive_care_status", ["due", "overdue", "completed", "not_applicable", "refused"]);
export const preventiveCareImportanceEnum = pgEnum("preventive_care_importance", ["routine", "recommended", "essential"]);

/**
 * Disease Registries Table
 * Chronic disease registries for population management
//  */
export const diseaseRegistries = pgTable(
  "disease_registries",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    diseaseCode: text("disease_code").notNull(),
    description: text("description").notNull(),
    criteria: jsonb("criteria").notNull().$type<Array<{
      type: string;
      field: string;
      operator: string;
      value: any;
    }>>(),
    active: boolean("active").notNull().default(true),
    patientCount: integer("patient_count").notNull().default(0),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("disease_registries_company_idx").on(table.companyId),
    diseaseCodeIdx: index("disease_registries_disease_code_idx").on(table.diseaseCode),
    activeIdx: index("disease_registries_active_idx").on(table.active),
  })
);

/**
 * Registry Enrollments Table
 * Patient enrollments in disease registries
//  */
export const registryEnrollments = pgTable(
  "registry_enrollments",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    registryId: text("registry_id").notNull().references(() => diseaseRegistries.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    enrollmentDate: timestamp("enrollment_date", { withTimezone: true }).notNull(),
    status: registryEnrollmentStatusEnum("status").notNull().default("active"),
    enrollmentReason: text("enrollment_reason").notNull(),
    disenrollmentDate: timestamp("disenrollment_date", { withTimezone: true }),
    disenrollmentReason: text("disenrollment_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("registry_enrollments_company_idx").on(table.companyId),
    registryIdx: index("registry_enrollments_registry_idx").on(table.registryId),
    patientIdx: index("registry_enrollments_patient_idx").on(table.patientId),
    statusIdx: index("registry_enrollments_status_idx").on(table.status),
  })
);

/**
 * Disease Management Programs Table
 * Disease management programs and protocols
//  */
export const diseaseManagementPrograms = pgTable(
  "disease_management_programs",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    diseaseType: text("disease_type").notNull(),
    description: text("description").notNull(),
    objectives: jsonb("objectives").notNull().$type<string[]>(),
    eligibilityCriteria: jsonb("eligibility_criteria").notNull().$type<Array<{
      type: string;
      description: string;
      required: boolean;
    }>>(),
    interventions: jsonb("interventions").notNull().$type<Array<{
      id: string;
      type: string;
      name: string;
      description: string;
      frequency: string;
      duration: number;
      deliveryMethod: string;
    }>>(),
    qualityMeasures: jsonb("quality_measures").notNull().$type<Array<{
      id: string;
      name: string;
      description: string;
      numerator: string;
      denominator: string;
      targetValue: number;
      unit: string;
      measurementFrequency: string;
    }>>(),
    duration: integer("duration").notNull(), // days
    active: boolean("active").notNull().default(true),
    enrollmentCount: integer("enrollment_count").notNull().default(0),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("disease_programs_company_idx").on(table.companyId),
    diseaseTypeIdx: index("disease_programs_disease_type_idx").on(table.diseaseType),
    activeIdx: index("disease_programs_active_idx").on(table.active),
  })
);

/**
 * Program Enrollments Table
 * Patient enrollments in disease management programs
//  */
export const programEnrollments = pgTable(
  "program_enrollments",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    programId: text("program_id").notNull().references(() => diseaseManagementPrograms.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    enrollmentDate: timestamp("enrollment_date", { withTimezone: true }).notNull(),
    expectedEndDate: timestamp("expected_end_date", { withTimezone: true }).notNull(),
    status: programEnrollmentStatusEnum("status").notNull().default("active"),
    completionPercentage: integer("completion_percentage").notNull().default(0),
    interventionsCompleted: jsonb("interventions_completed").notNull().$type<string[]>(),
    outcomesAchieved: jsonb("outcomes_achieved").notNull().$type<string[]>(),
    withdrawalReason: text("withdrawal_reason"),
    endDate: timestamp("end_date", { withTimezone: true }),
    assignedCoach: text("assigned_coach"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("program_enrollments_company_idx").on(table.companyId),
    programIdx: index("program_enrollments_program_idx").on(table.programId),
    patientIdx: index("program_enrollments_patient_idx").on(table.patientId),
    statusIdx: index("program_enrollments_status_idx").on(table.status),
    coachIdx: index("program_enrollments_coach_idx").on(table.assignedCoach),
  })
);

/**
 * Clinical Metrics Table
 * Clinical measurements and outcomes tracking
//  */
export const clinicalMetrics = pgTable(
  "clinical_metrics",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    registryId: text("registry_id").references(() => diseaseRegistries.id, { onDelete: "set null" }),
    programId: text("program_id").references(() => diseaseManagementPrograms.id, { onDelete: "set null" }),
    metricType: text("metric_type").notNull(),
    metricName: text("metric_name").notNull(),
    value: real("value").notNull(),
    unit: text("unit").notNull(),
    targetValue: real("target_value"),
    isAtGoal: boolean("is_at_goal").notNull(),
    measurementDate: timestamp("measurement_date", { withTimezone: true }).notNull(),
    source: text("source").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("clinical_metrics_company_idx").on(table.companyId),
    patientIdx: index("clinical_metrics_patient_idx").on(table.patientId),
    registryIdx: index("clinical_metrics_registry_idx").on(table.registryId),
    programIdx: index("clinical_metrics_program_idx").on(table.programId),
    metricTypeIdx: index("clinical_metrics_metric_type_idx").on(table.metricType),
    measurementDateIdx: index("clinical_metrics_measurement_date_idx").on(table.measurementDate),
  })
);

/**
 * Patient Engagement Table
 * Patient engagement activities and milestones
//  */
export const patientEngagement = pgTable(
  "patient_engagement",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    programId: text("program_id").references(() => diseaseManagementPrograms.id, { onDelete: "set null" }),
    engagementType: engagementTypeEnum("engagement_type").notNull(),
    description: text("description").notNull(),
    engagementDate: timestamp("engagement_date", { withTimezone: true }).notNull(),
    score: integer("score"),
    notes: text("notes").notNull(),
    recordedBy: text("recorded_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("patient_engagement_company_idx").on(table.companyId),
    patientIdx: index("patient_engagement_patient_idx").on(table.patientId),
    programIdx: index("patient_engagement_program_idx").on(table.programId),
    engagementTypeIdx: index("patient_engagement_type_idx").on(table.engagementType),
    engagementDateIdx: index("patient_engagement_date_idx").on(table.engagementDate),
  })
);

/**
 * Outcome Tracking Table
 * Clinical and quality outcomes tracking
//  */
export const outcomeTracking = pgTable(
  "outcome_tracking",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    programId: text("program_id").references(() => diseaseManagementPrograms.id, { onDelete: "set null" }),
    registryId: text("registry_id").references(() => diseaseRegistries.id, { onDelete: "set null" }),
    outcomeType: outcomeTypeEnum("outcome_type").notNull(),
    measure: text("measure").notNull(),
    baselineValue: real("baseline_value").notNull(),
    currentValue: real("current_value").notNull(),
    targetValue: real("target_value"),
    improvement: real("improvement").notNull(),
    improvementPercentage: real("improvement_percentage").notNull(),
    unit: text("unit").notNull(),
    baselineDate: timestamp("baseline_date", { withTimezone: true }).notNull(),
    latestMeasurementDate: timestamp("latest_measurement_date", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("outcome_tracking_company_idx").on(table.companyId),
    patientIdx: index("outcome_tracking_patient_idx").on(table.patientId),
    programIdx: index("outcome_tracking_program_idx").on(table.programId),
    registryIdx: index("outcome_tracking_registry_idx").on(table.registryId),
    outcomeTypeIdx: index("outcome_tracking_outcome_type_idx").on(table.outcomeType),
  })
);

/**
 * Preventive Care Recommendations Table
 * Preventive care recommendations and tracking
//  */
export const preventiveCareRecommendations = pgTable(
  "preventive_care_recommendations",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    recommendationType: preventiveCareTypeEnum("recommendation_type").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    frequency: text("frequency").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    status: preventiveCareStatusEnum("status").notNull().default("due"),
    completedDate: timestamp("completed_date", { withTimezone: true }),
    nextDueDate: timestamp("next_due_date", { withTimezone: true }),
    evidence: text("evidence").notNull(),
    importance: preventiveCareImportanceEnum("importance").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("preventive_care_company_idx").on(table.companyId),
    patientIdx: index("preventive_care_patient_idx").on(table.patientId),
    typeIdx: index("preventive_care_type_idx").on(table.recommendationType),
    statusIdx: index("preventive_care_status_idx").on(table.status),
    dueDateIdx: index("preventive_care_due_date_idx").on(table.dueDate),
  })
);

// Zod validation schemas for Chronic Disease Management tables
export const insertDiseaseRegistrySchema = createInsertSchema(diseaseRegistries);
export const insertRegistryEnrollmentSchema = createInsertSchema(registryEnrollments);
export const insertDiseaseManagementProgramSchema = createInsertSchema(diseaseManagementPrograms);
export const insertProgramEnrollmentSchema = createInsertSchema(programEnrollments);
export const insertClinicalMetricSchema = createInsertSchema(clinicalMetrics);
export const insertPatientEngagementSchema = createInsertSchema(patientEngagement);
export const insertOutcomeTrackingSchema = createInsertSchema(outcomeTracking);
export const insertPreventiveCareRecommendationSchema = createInsertSchema(preventiveCareRecommendations);

// TypeScript types
export type DiseaseRegistry = typeof diseaseRegistries.$inferSelect;
export type InsertDiseaseRegistry = typeof diseaseRegistries.$inferInsert;
export type RegistryEnrollment = typeof registryEnrollments.$inferSelect;
export type InsertRegistryEnrollment = typeof registryEnrollments.$inferInsert;
export type DiseaseManagementProgram = typeof diseaseManagementPrograms.$inferSelect;
export type InsertDiseaseManagementProgram = typeof diseaseManagementPrograms.$inferInsert;
export type ProgramEnrollment = typeof programEnrollments.$inferSelect;
export type InsertProgramEnrollment = typeof programEnrollments.$inferInsert;
export type ClinicalMetric = typeof clinicalMetrics.$inferSelect;
export type InsertClinicalMetric = typeof clinicalMetrics.$inferInsert;
export type PatientEngagement = typeof patientEngagement.$inferSelect;
export type InsertPatientEngagement = typeof patientEngagement.$inferInsert;
export type OutcomeTracking = typeof outcomeTracking.$inferSelect;
export type InsertOutcomeTracking = typeof outcomeTracking.$inferInsert;
export type PreventiveCareRecommendation = typeof preventiveCareRecommendations.$inferSelect;
export type InsertPreventiveCareRecommendation = typeof preventiveCareRecommendations.$inferInsert;

// ========== End Chronic Disease Management Tables ==========

// ========== Quality Improvement Tables ==========

// Enums
export const qiProjectStatusEnum = pgEnum("qi_project_status", ["planning", "active", "on_hold", "completed", "cancelled"]);
export const qiPriorityEnum = pgEnum("qi_priority", ["low", "medium", "high", "critical"]);
export const qiInterventionTypeEnum = pgEnum("qi_intervention_type", ["process_change", "education", "technology", "policy", "workflow", "other"]);
export const qiInterventionStatusEnum = pgEnum("qi_intervention_status", ["planned", "implemented", "sustained", "abandoned"]);
export const qiImpactEnum = pgEnum("qi_impact", ["positive", "negative", "neutral", "unknown"]);
export const pdsaCycleStatusEnum = pgEnum("pdsa_cycle_status", ["plan", "do", "study", "act", "completed"]);
export const pdsaDecisionEnum = pgEnum("pdsa_decision", ["adopt", "adapt", "abandon"]);
export const piTrendEnum = pgEnum("pi_trend", ["improving", "declining", "stable"]);
export const piStatusEnum = pgEnum("pi_status", ["active", "met", "missed", "abandoned"]);
export const evidenceLevelEnum = pgEnum("evidence_level", ["Level_I", "Level_II", "Level_III", "Level_IV", "Level_V"]);
export const adoptionStatusEnum = pgEnum("adoption_status", ["proposed", "pilot", "adopted", "sustained"]);

// Quality Improvement Projects table
export const qualityImprovementProjects = pgTable(
  "quality_improvement_projects",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    projectNumber: text("project_number").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    aim: text("aim").notNull(),
    scope: text("scope").notNull(),
    status: qiProjectStatusEnum("status").notNull().default("planning"),
    priority: qiPriorityEnum("priority").notNull(),
    teamLead: text("team_lead").notNull(),
    teamMembers: jsonb("team_members").notNull().$type<string[]>(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    targetCompletionDate: timestamp("target_completion_date", { withTimezone: true }).notNull(),
    actualCompletionDate: timestamp("actual_completion_date", { withTimezone: true }),
    baseline: jsonb("baseline").notNull().$type<{
      metric: string;
      value: number;
      measurementDate: string;
      dataSource: string;
    }>(),
    target: jsonb("target").notNull().$type<{
      metric: string;
      targetValue: number;
      targetDate: string;
      stretchGoalValue?: number;
    }>(),
    pdsaCycles: jsonb("pdsa_cycles").notNull().default([]).$type<string[]>(),
    interventions: jsonb("interventions").notNull().default([]).$type<Array<{
      id: string;
      name: string;
      description: string;
      type: string;
      implementationDate: string;
      status: string;
      impact: string;
      notes: string;
    }>>(),
    barriers: jsonb("barriers").notNull().default([]).$type<string[]>(),
    successFactors: jsonb("success_factors").notNull().default([]).$type<string[]>(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("qi_projects_company_idx").on(table.companyId),
    statusIdx: index("qi_projects_status_idx").on(table.status),
    priorityIdx: index("qi_projects_priority_idx").on(table.priority),
    projectNumberIdx: index("qi_projects_project_number_idx").on(table.projectNumber),
  })
);

// PDSA Cycles table
/* DUPLICATE - Moved to modular schema
export const pdsaCycles = pgTable(
  "pdsa_cycles",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    projectId: text("project_id").notNull().references(() => qualityImprovementProjects.id, { onDelete: "cascade" }),
    cycleNumber: integer("cycle_number").notNull(),
    status: pdsaCycleStatusEnum("status").notNull().default("plan"),
    plan: jsonb("plan").notNull().$type<{
      objective: string;
      predictions: string[];
      measures: string[];
      plan: string[];
    }>(),
    do: jsonb("do").notNull().default({}).$type<{
      implementationDate?: string;
      observations: string[];
      dataCollected: Array<{
        dataPoint: string;
        value: number;
        collectionDate: string;
        notes: string;
      }>;
      issues: string[];
    }>(),
    study: jsonb("study").notNull().default({}).$type<{
      results: string[];
      comparedToObjective: string;
      learnings: string[];
      unexpectedFindings: string[];
    }>(),
    act: jsonb("act").notNull().default({}).$type<{
      decision: string;
      nextSteps: string[];
      changesAdopted: string[];
      nextCycleChanges: string[];
    }>(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    completionDate: timestamp("completion_date", { withTimezone: true }),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("pdsa_cycles_company_idx").on(table.companyId),
    projectIdx: index("pdsa_cycles_project_idx").on(table.projectId),
    statusIdx: index("pdsa_cycles_status_idx").on(table.status),
  })
); */

// Care Bundles table
export const careBundles = pgTable(
  "care_bundles",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    bundleId: text("bundle_id").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    elements: jsonb("elements").notNull().$type<Array<{
      id: string;
      elementNumber: number;
      description: string;
      specification: string;
      frequency: string;
      responsible: string;
      criticalElement: boolean;
    }>>(),
    evidenceBase: text("evidence_base").notNull(),
    targetPopulation: text("target_population").notNull(),
    active: boolean("active").notNull().default(true),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("care_bundles_company_idx").on(table.companyId),
    bundleIdIdx: index("care_bundles_bundle_id_idx").on(table.bundleId),
    categoryIdx: index("care_bundles_category_idx").on(table.category),
    activeIdx: index("care_bundles_active_idx").on(table.active),
  })
);

// Bundle Compliance table
export const bundleCompliance = pgTable(
  "bundle_compliance",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    bundleId: text("bundle_id").notNull().references(() => careBundles.id, { onDelete: "cascade" }),
    encounterId: text("encounter_id").notNull(),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    assessmentDate: timestamp("assessment_date", { withTimezone: true }).notNull(),
    elementCompliance: jsonb("element_compliance").notNull().$type<Array<{
      elementId: string;
      compliant: boolean;
      notApplicable: boolean;
      reason?: string;
      evidence?: string;
    }>>(),
    overallCompliance: boolean("overall_compliance").notNull(),
    complianceRate: numeric("compliance_rate", { precision: 5, scale: 2 }).notNull(),
    assessedBy: text("assessed_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("bundle_compliance_company_idx").on(table.companyId),
    bundleIdx: index("bundle_compliance_bundle_idx").on(table.bundleId),
    patientIdx: index("bundle_compliance_patient_idx").on(table.patientId),
    encounterIdx: index("bundle_compliance_encounter_idx").on(table.encounterId),
    assessmentDateIdx: index("bundle_compliance_assessment_date_idx").on(table.assessmentDate),
  })
);

// Performance Improvements table
export const performanceImprovements = pgTable(
  "performance_improvements",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    metric: text("metric").notNull(),
    baselineValue: numeric("baseline_value", { precision: 10, scale: 2 }).notNull(),
    baselineDate: timestamp("baseline_date", { withTimezone: true }).notNull(),
    targetValue: numeric("target_value", { precision: 10, scale: 2 }).notNull(),
    targetDate: timestamp("target_date", { withTimezone: true }).notNull(),
    currentValue: numeric("current_value", { precision: 10, scale: 2 }).notNull(),
    currentDate: timestamp("current_date", { withTimezone: true }).notNull(),
    improvement: numeric("improvement", { precision: 10, scale: 2 }).notNull(),
    improvementPercentage: numeric("improvement_percentage", { precision: 5, scale: 2 }).notNull(),
    trend: piTrendEnum("trend").notNull(),
    status: piStatusEnum("status").notNull(),
    dataPoints: jsonb("data_points").notNull().default([]).$type<Array<{
      date: string;
      value: number;
      notes: string;
    }>>(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("performance_improvements_company_idx").on(table.companyId),
    metricIdx: index("performance_improvements_metric_idx").on(table.metric),
    statusIdx: index("performance_improvements_status_idx").on(table.status),
    trendIdx: index("performance_improvements_trend_idx").on(table.trend),
  })
);

// Best Practices table
export const bestPractices = pgTable(
  "best_practices",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    practiceId: text("practice_id").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    clinicalArea: text("clinical_area").notNull(),
    evidenceLevel: evidenceLevelEnum("evidence_level").notNull(),
    evidenceSource: text("evidence_source").notNull(),
    implementation: text("implementation").notNull(),
    outcomes: jsonb("outcomes").notNull().$type<string[]>(),
    adoptionStatus: adoptionStatusEnum("adoption_status").notNull(),
    adoptionDate: timestamp("adoption_date", { withTimezone: true }),
    owner: text("owner").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("best_practices_company_idx").on(table.companyId),
    practiceIdIdx: index("best_practices_practice_id_idx").on(table.practiceId),
    categoryIdx: index("best_practices_category_idx").on(table.category),
    clinicalAreaIdx: index("best_practices_clinical_area_idx").on(table.clinicalArea),
    adoptionStatusIdx: index("best_practices_adoption_status_idx").on(table.adoptionStatus),
    activeIdx: index("best_practices_active_idx").on(table.active),
  })
);

// Zod validation schemas for Quality Improvement tables
export const insertQualityImprovementProjectSchema = createInsertSchema(qualityImprovementProjects);
/* DUPLICATE - pDSACycle moved to modular schema */
// export const insertPDSACycleSchema = createInsertSchema(pdsaCycles);
export const insertCareBundleSchema = createInsertSchema(careBundles);
export const insertBundleComplianceSchema = createInsertSchema(bundleCompliance);
export const insertPerformanceImprovementSchema = createInsertSchema(performanceImprovements);
export const insertBestPracticeSchema = createInsertSchema(bestPractices);

// TypeScript types
export type QualityImprovementProject = typeof qualityImprovementProjects.$inferSelect;
export type InsertQualityImprovementProject = typeof qualityImprovementProjects.$inferInsert;
export type PDSACycle = typeof pdsaCycles.$inferSelect;
// export type InsertPDSACycle = typeof pdsaCycles.$inferInsert;
export type CareBundle = typeof careBundles.$inferSelect;
export type InsertCareBundle = typeof careBundles.$inferInsert;
export type BundleCompliance = typeof bundleCompliance.$inferSelect;
export type InsertBundleCompliance = typeof bundleCompliance.$inferInsert;
export type PerformanceImprovement = typeof performanceImprovements.$inferSelect;
export type InsertPerformanceImprovement = typeof performanceImprovements.$inferInsert;
export type BestPractice = typeof bestPractices.$inferSelect;
export type InsertBestPractice = typeof bestPractices.$inferInsert;

// ========== End Quality Improvement Tables ==========

// ========== User Feedback & NPS Tables ==========

// Feedback type enum
export const feedbackTypeEnum = pgEnum("feedback_type", [
  "general",
  "feature",
  "bug",
  "improvement"
]);

// Feedback status enum
export const feedbackStatusEnum = pgEnum("feedback_status", [
  "new",
  "reviewed",
  "in_progress",
  "resolved",
  "ignored"
]);

// ============== SaaS-SPECIFIC TABLES ==============

// Pricing model enum - supports flexible SaaS pricing strategies
export const pricingModelEnum = pgEnum("pricing_model", [
  "flat_rate",        // Single fixed price
  "per_user",         // Price per active user
  "tiered",           // Multiple tiers with feature sets
  "usage_based",      // Pay as you go
  "freemium",         // Free + paid features
  "hybrid"            // Combination of per-user and usage
]);

// Subscription status enum
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trial",            // In free trial
  "active",           // Active subscription
  "past_due",         // Payment overdue
  "paused",           // Temporarily paused
  "cancelled",        // Cancelled (churned)
  "expired",          // Trial expired
  "downgraded"        // Plan downgraded
]);

// Feature usage tracking table
/* DUPLICATE - Moved to modular schema
export const featureUsageMetrics = pgTable("feature_usage_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  featureName: varchar("feature_name").notNull(), // e.g., "ai_recommendations", "advanced_reporting"
  usageCount: integer("usage_count").default(0), // Total uses
  activeUsers: integer("active_users").default(0), // Unique users using feature
  lastUsedAt: timestamp("last_used_at"),
  tier: varchar("tier", { length: 50 }), // Which pricing tier this feature is in
  metadata: jsonb("metadata"), // Custom metrics per feature
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_feature_usage_company").on(table.companyId),
  index("idx_feature_usage_name").on(table.featureName),
  index("idx_feature_usage_tier").on(table.tier),
  uniqueIndex("idx_feature_usage_unique").on(table.companyId, table.featureName),
]); */

// Customer health score table
/* DUPLICATE - Moved to modular schema
export const customerHealthScores = pgTable("customer_health_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Core health metrics (0-100)
  overallScore: integer("overall_score").notNull(), // 0-100
  engagementScore: integer("engagement_score").notNull(),
  adoptionScore: integer("adoption_score").notNull(),
  satisfactionScore: integer("satisfaction_score").notNull(),
  
  // Trend data
  scoreHistory: jsonb("score_history"), // Last 12 months of scores
  trend: varchar("trend", { length: 20 }), // 'improving', 'declining', 'stable'
  riskLevel: varchar("risk_level", { length: 20 }), // 'low', 'medium', 'high', 'critical'
  
  // Last calculated
  lastCalculatedAt: timestamp("last_calculated_at"),
  calculatedBy: varchar("calculated_by"), // Service name that calculated
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_health_scores_company").on(table.companyId),
  index("idx_health_scores_risk").on(table.riskLevel),
]); */

// Churn prediction table - ML model outputs
/* DUPLICATE - Moved to modular schema
export const churnPredictions = pgTable("churn_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Prediction data
  churnProbability: decimal("churn_probability", { precision: 5, scale: 4 }), // 0.0000 to 1.0000
  riskFactors: jsonb("risk_factors"), // Top factors contributing to churn risk
  recommendedActions: jsonb("recommended_actions"), // System-recommended retention actions
  
  // Prediction details
  modelVersion: varchar("model_version"),
  predictionScore: integer("prediction_score"), // 0-100 confidence
  predictedChurnDate: timestamp("predicted_churn_date"), // When they might churn
  
  // Tracking
  isPredictionAccurate: boolean("is_prediction_accurate"), // Updated after churn event occurs
  actualChurnDate: timestamp("actual_churn_date"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_churn_predictions_company").on(table.companyId),
  index("idx_churn_predictions_probability").on(table.churnProbability),
  index("idx_churn_predictions_risk").on(table.predictedChurnDate),
]); */

// Customer acquisition source tracking
/* DUPLICATE - Moved to modular schema
export const customerAcquisitionSources = pgTable("customer_acquisition_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Source details
  source: varchar("source").notNull(), // 'google_ads', 'organic', 'referral', 'sales', 'partnership', etc.
  campaign: varchar("campaign"), // Campaign name
  medium: varchar("medium"), // utm_medium: 'email', 'social', 'direct', etc.
  content: varchar("content"), // utm_content
  
  // Attribution data
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).default("0"),
  customersAcquired: integer("customers_acquired").default(0),
  revenueGenerated: decimal("revenue_generated", { precision: 14, scale: 2 }).default("0"),
  
  // Lifecycle metrics
  avgLifetimeValue: decimal("avg_lifetime_value", { precision: 12, scale: 2 }),
  avgMonthlyRetention: decimal("avg_monthly_retention", { precision: 5, scale: 4 }), // 0-1 (60% = 0.60)
  avgChurnRate: decimal("avg_churn_rate", { precision: 5, scale: 4 }), // 0-1
  
  // ROI calculations
  cac: decimal("cac", { precision: 10, scale: 2 }), // Customer Acquisition Cost
  roi: decimal("roi", { precision: 8, scale: 4 }), // (revenue - cost) / cost
  
  period: varchar("period"), // 'monthly', 'quarterly', 'yearly'
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_acq_source_company").on(table.companyId),
  index("idx_acq_source_name").on(table.source),
  index("idx_acq_source_period").on(table.periodStart),
]); */

// Cohort analysis tracking
/* DUPLICATE - Moved to modular schema
export const customerCohorts = pgTable("customer_cohorts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Cohort definition
  cohortName: varchar("cohort_name").notNull(), // e.g., "2024-Q1-Enterprise"
  cohortPeriod: varchar("cohort_period").notNull(), // 'monthly', 'quarterly', 'yearly'
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Size and segment
  totalCustomers: integer("total_customers").notNull(),
  segment: varchar("segment"), // 'free', 'pro', 'enterprise', 'customer_source', etc.
  
  // Retention curve (month 0, 1, 2, etc.)
  month0Retention: decimal("month_0_retention", { precision: 5, scale: 2 }), // 100% by definition
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
]); */

// Usage events for analytics
/* DUPLICATE - Moved to modular schema
export const usageEvents = pgTable("usage_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  
  // Event details
  eventType: varchar("event_type").notNull(), // 'feature_used', 'order_created', 'api_call', etc.
  eventName: varchar("event_name").notNull(), // Specific action
  
  // Event data
  properties: jsonb("properties"), // Custom event properties
  metadata: jsonb("metadata"), // Additional context
  
  // Revenue impact (if applicable)
  revenueImpact: decimal("revenue_impact", { precision: 12, scale: 2 }), // How much revenue this event contributed
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_usage_events_company").on(table.companyId),
  index("idx_usage_events_type").on(table.eventType),
  index("idx_usage_events_user").on(table.userId),
  index("idx_usage_events_created").on(table.createdAt),
]); */

// Monthly revenue tracking for MRR/ARR calculations
/* DUPLICATE - Moved to modular schema
export const monthlyRecurringRevenue = pgTable("monthly_recurring_revenue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Period
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  
  // Revenue breakdown by tier
  breakdown: jsonb("breakdown"), // { 'free': 0, 'pro': 5000, 'premium': 8000, 'enterprise': 15000 }
  
  // Totals
  totalMRR: decimal("total_mrr", { precision: 14, scale: 2 }).notNull(),
  arr: decimal("arr", { precision: 14, scale: 2 }).notNull(), // Annual recurring revenue
  
  // Movement metrics
  newMRR: decimal("new_mrr", { precision: 14, scale: 2 }), // From new customers
  expansionMRR: decimal("expansion_mrr", { precision: 14, scale: 2 }), // From upgrades
  contractionMRR: decimal("contraction_mrr", { precision: 14, scale: 2 }), // From downgrades
  churnMRR: decimal("churn_mrr", { precision: 14, scale: 2 }), // Lost to churn
  
  // Growth rate
  momGrowth: decimal("mom_growth", { precision: 8, scale: 4 }), // Month-over-month growth %
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_mrr_company").on(table.companyId),
  index("idx_mrr_period").on(table.year, table.month),
  uniqueIndex("idx_mrr_unique").on(table.companyId, table.year, table.month),
]); */

// NPS category enum
export const npsCategoryEnum = pgEnum("nps_category", [
  "promoter",
  "passive",
  "detractor"
]);

// User Feedback table
/* DUPLICATE - Moved to modular schema
export const feedback = pgTable(
  "feedback",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    type: feedbackTypeEnum("type").notNull(),
    message: text("message").notNull(),
    contactEmail: text("contact_email"),
    context: text("context"), // Page URL or context where feedback was given
    userAgent: text("user_agent"), // Browser/device info
    status: feedbackStatusEnum("status").notNull().default("new"),
    adminNotes: text("admin_notes"), // Internal notes from admin review
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedBy: text("resolved_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("feedback_user_id_idx").on(table.userId),
    typeIdx: index("feedback_type_idx").on(table.type),
    statusIdx: index("feedback_status_idx").on(table.status),
    createdAtIdx: index("feedback_created_at_idx").on(table.createdAt),
  })
); */

// NPS Surveys table
/* DUPLICATE - Moved to modular schema
export const npsSurveys = pgTable(
  "nps_surveys",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    score: integer("score").notNull(), // 0-10
    category: npsCategoryEnum("category").notNull(), // Auto-categorized based on score
    feedback: text("feedback"), // Optional text feedback
    trigger: text("trigger"), // What triggered this survey (e.g., "10-orders", "30-days")
    context: text("context"), // Page/feature context
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("nps_user_id_idx").on(table.userId),
    categoryIdx: index("nps_category_idx").on(table.category),
    scoreIdx: index("nps_score_idx").on(table.score),
    createdAtIdx: index("nps_created_at_idx").on(table.createdAt),
    triggerIdx: index("nps_trigger_idx").on(table.trigger),
  })
); */

// Zod validation schemas
/* DUPLICATE - feedback moved to modular schema */
// export const insertFeedbackSchema = createInsertSchema(feedback).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true,
//   resolvedAt: true,
//   resolvedBy: true,
//   adminNotes: true,
// });

// export const updateFeedbackSchema = insertFeedbackSchema.partial();

/* DUPLICATE - npsSurveys moved to modular schema */
// export const insertNPSSurveySchema = createInsertSchema(npsSurveys).omit({
//   id: true,
//   createdAt: true,
// });

// TypeScript types
export type Feedback = typeof feedback.$inferSelect;
// export type InsertFeedback = typeof feedback.$inferInsert;
export type NPSSurvey = typeof npsSurveys.$inferSelect;
export type InsertNPSSurvey = typeof npsSurveys.$inferInsert;

// ========== End User Feedback & NPS Tables ==========

// ========== Appointment Scheduling Tables ==========

// Appointments table
/* DUPLICATE - appointments table moved to appointments domain */
// export const appointments = pgTable(
//   "appointments",
//   {
//     id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//     companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
//     patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }),
//     practitionerId: varchar("practitioner_id").references(() => users.id, { onDelete: 'set null' }),
//
    // Appointment details
//     title: varchar("title", { length: 255 }).notNull(),
//     description: text("description"),
//     type: appointmentTypeEnum("appointment_type").notNull(),
//     status: appointmentStatusEnum("appointment_status").notNull().default("scheduled"),
//
    // Timing
//     startTime: timestamp("start_time", { withTimezone: true }).notNull(),
//     endTime: timestamp("end_time", { withTimezone: true }).notNull(),
//     duration: integer("duration").notNull(), // in minutes
//
    // Location and resources
//     location: varchar("location", { length: 255 }),
//     notes: text("notes"),
//     isVirtual: boolean("is_virtual").default(false),
//     virtualMeetingLink: text("virtual_meeting_link"),
//
    // Reminders
//     reminderSent: boolean("reminder_sent").default(false),
//     reminderType: reminderTypeEnum("reminder_type"),
//     reminderTime: timestamp("reminder_time", { withTimezone: true }),
//
    // Metadata
//     createdBy: varchar("created_by").references(() => users.id),
//     updatedBy: varchar("updated_by").references(() => users.id),
//     createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
//
    // Cancellation details
//     cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
//     cancelledBy: varchar("cancelled_by").references(() => users.id),
//     cancellationReason: text("cancellation_reason"),
//
    // Rescheduling details
//     rescheduledFrom: varchar("rescheduled_from").references(() => appointments.id),
//     rescheduledTo: varchar("rescheduled_to").references(() => appointments.id),
//
    // Import Tracking (for migrated records)
//     externalId: varchar("external_id", { length: 255 }), // Original appointment ID from legacy system
//     importSource: varchar("import_source", { length: 100 }),
//     importJobId: varchar("import_job_id", { length: 255 }),
//     importedAt: timestamp("imported_at", { withTimezone: true }),
//
    // Soft Delete
//     deletedAt: timestamp("deleted_at", { withTimezone: true }),
//     deletedBy: varchar("deleted_by").references(() => users.id),
//   },
//   (table) => [
//     index("idx_appointments_company").on(table.companyId),
//     index("idx_appointments_patient").on(table.patientId),
//     index("idx_appointments_practitioner").on(table.practitionerId),
//     index("idx_appointments_start_time").on(table.startTime),
//     index("idx_appointments_status").on(table.status),
//     index("idx_appointments_type").on(table.type),
//     index("idx_appointments_created_at").on(table.createdAt),
//   ],
// );

// Appointment Resources table (for booking test rooms, equipment, etc.)
/* DUPLICATE - appointmentResources table moved to appointments domain */
// export const appointmentResources = pgTable(
//   "appointment_resources",
//   {
//     id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//     appointmentId: varchar("appointment_id").references(() => appointments.id, { onDelete: 'cascade' }),
//     resourceId: varchar("resource_id").notNull(),
//     resourceType: resourceTypeEnum("resource_type").notNull(),
//     resourceName: varchar("resource_name", { length: 255 }).notNull(),
//
    // Resource availability
//     startTime: timestamp("start_time", { withTimezone: true }).notNull(),
//     endTime: timestamp("end_time", { withTimezone: true }).notNull(),
//
    // Resource details
//     location: varchar("location", { length: 255 }),
//     capacity: integer("capacity").default(1),
//
    // Metadata
//     createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
//   },
//   (table) => [
//     index("idx_appointment_resources_appointment").on(table.appointmentId),
//     index("idx_appointment_resources_resource").on(table.resourceId),
//     index("idx_appointment_resources_type").on(table.resourceType),
//     index("idx_appointment_resources_time").on(table.startTime, table.endTime),
//   ],
// );

// Appointment Availability (practitioner schedules, resource availability)
/* DUPLICATE - appointmentAvailability table moved to appointments domain */
// export const appointmentAvailability = pgTable(
//   "appointment_availability",
//   {
//     id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//     companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
//     resourceId: varchar("resource_id").notNull(),
//     resourceType: resourceTypeEnum("resource_type").notNull(),
//
    // Availability pattern
//     dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 6 = Saturday
//     startTime: timestamp("start_time", { withTimezone: true }).notNull(),
//     endTime: timestamp("end_time", { withTimezone: true }).notNull(),
//
    // Recurrence
//     isRecurring: boolean("is_recurring").default(true),
//     validFrom: date("valid_from").notNull(),
//     validUntil: date("valid_until"),
//
    // Exceptions (blocked times, holidays, etc.)
//     isBlocked: boolean("is_blocked").default(false),
//     blockReason: text("block_reason"),
//
    // Metadata
//     createdBy: varchar("created_by").references(() => users.id),
//     createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
//   },
//   (table) => [
//     index("idx_appointment_availability_company").on(table.companyId),
//     index("idx_appointment_availability_resource").on(table.resourceId),
//     index("idx_appointment_availability_type").on(table.resourceType),
//     index("idx_appointment_availability_day").on(table.dayOfWeek),
//     index("idx_appointment_availability_time").on(table.startTime, table.endTime),
//   ],
// );

// Appointment Reminders
/* DUPLICATE - appointmentReminders table moved to appointments domain */
// export const appointmentReminders = pgTable(
//   "appointment_reminders",
//   {
//     id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//     appointmentId: varchar("appointment_id").references(() => appointments.id, { onDelete: 'cascade' }),
//
    // Reminder configuration
//     type: reminderTypeEnum("type").notNull(),
//     scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
//     sentAt: timestamp("sent_at", { withTimezone: true }),
//
    // Recipient details
//     recipientEmail: varchar("recipient_email", { length: 255 }),
//     recipientPhone: varchar("recipient_phone", { length: 50 }),
//
    // Status
//     status: varchar("status", { length: 50 }).default("pending"), // pending, sent, failed
//     attempts: integer("attempts").default(0),
//     errorMessage: text("error_message"),
//
    // Message content
//     message: text("message"),
//     subject: varchar("subject", { length: 255 }),
//
    // Metadata
//     createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
//   },
//   (table) => [
//     index("idx_appointment_reminders_appointment").on(table.appointmentId),
//     index("idx_appointment_reminders_status").on(table.status),
//     index("idx_appointment_reminders_scheduled").on(table.scheduledFor),
//     index("idx_appointment_reminders_type").on(table.type),
//   ],
// );

// Appointment Waitlist
/* DUPLICATE - appointmentWaitlist table moved to appointments domain */
// export const appointmentWaitlist = pgTable(
//   "appointment_waitlist",
//   {
//     id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//     companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
//     patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }),
//
    // Waitlist request details
//     appointmentType: appointmentTypeEnum("appointment_type").notNull(),
//     preferredDate: date("preferred_date"),
//     preferredTimeRange: varchar("preferred_time_range", { length: 100 }), // morning, afternoon, evening
//     flexibility: integer("flexibility").default(3), // days willing to wait
//
    // Contact preferences
//     contactMethod: reminderTypeEnum("contact_method").notNull(),
//     contactValue: varchar("contact_value", { length: 255 }).notNull(),
//
    // Status
//     status: varchar("status", { length: 50 }).default("active"), // active, fulfilled, cancelled, expired
//     fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
//     fulfilledAppointmentId: varchar("fulfilled_appointment_id").references(() => appointments.id),
//
    // Notes
//     notes: text("notes"),
//     priority: integer("priority").default(5), // 1 = highest, 10 = lowest
//
    // Metadata
//     createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
//     expiresAt: timestamp("expires_at", { withTimezone: true }),
//   },
//   (table) => [
//     index("idx_appointment_waitlist_company").on(table.companyId),
//     index("idx_appointment_waitlist_patient").on(table.patientId),
//     index("idx_appointment_waitlist_status").on(table.status),
//     index("idx_appointment_waitlist_priority").on(table.priority),
//     index("idx_appointment_waitlist_created").on(table.createdAt),
//   ],
// );

// Calendar Settings - company-specific calendar and diary customization
/* DUPLICATE - calendarSettings table moved to appointments domain */
// export const calendarSettings = pgTable(
//   "calendar_settings",
//   {
//     id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//     companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
//     practitionerId: varchar("practitioner_id").references(() => users.id, { onDelete: 'cascade' }), // null for company-wide settings
//
    // Time slot configuration
//     defaultSlotDuration: integer("default_slot_duration").default(25), // in minutes
//     customSlotDurations: jsonb("custom_slot_durations"), // [15, 20, 25, 30, 45, 60] etc.
//
    // Working hours per day (stored as JSON for flexibility)
    // Format: { monday: { start: "09:00", end: "17:00", breaks: [{start: "12:00", end: "13:00"}] }, ... }
//     workingHours: jsonb("working_hours").default(sql`'{
//       "monday": {"start": "09:00", "end": "17:00", "breaks": [{"start": "12:00", "end": "13:00"}]},
//       "tuesday": {"start": "09:00", "end": "17:00", "breaks": [{"start": "12:00", "end": "13:00"}]},
//       "wednesday": {"start": "09:00", "end": "17:00", "breaks": [{"start": "12:00", "end": "13:00"}]},
//       "thursday": {"start": "09:00", "end": "17:00", "breaks": [{"start": "12:00", "end": "13:00"}]},
//       "friday": {"start": "09:00", "end": "17:00", "breaks": [{"start": "12:00", "end": "13:00"}]},
//       "saturday": {"start": "09:00", "end": "13:00", "breaks": []},
//       "sunday": {"start": null, "end": null, "breaks": []}
//     }'::jsonb`),
//
    // Display preferences
//     diaryViewMode: varchar("diary_view_mode", { length: 50 }).default("day"), // day, week, month
//     showWeekends: boolean("show_weekends").default(false),
//     timeFormat: varchar("time_format", { length: 10 }).default("24h"), // 12h or 24h
//     firstDayOfWeek: integer("first_day_of_week").default(1), // 0 = Sunday, 1 = Monday
//
    // Booking rules
//     minAdvanceBooking: integer("min_advance_booking").default(60), // in minutes
//     maxAdvanceBooking: integer("max_advance_booking").default(90), // in days
//     allowDoubleBooking: boolean("allow_double_booking").default(false),
//     requireDeposit: boolean("require_deposit").default(false),
//     depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 }),
//
    // Buffer times
//     bufferBefore: integer("buffer_before").default(0), // minutes before appointment
//     bufferAfter: integer("buffer_after").default(5), // minutes after appointment
//
    // Cancellation policy
//     cancellationWindow: integer("cancellation_window").default(24), // hours before appointment
//     allowPatientCancellation: boolean("allow_patient_cancellation").default(true),
//     allowPatientReschedule: boolean("allow_patient_reschedule").default(true),
//
    // Color coding for appointment types (JSON)
//     colorScheme: jsonb("color_scheme").default(sql`'{
//       "eye_examination": "#3b82f6",
//       "contact_lens_fitting": "#10b981",
//       "frame_selection": "#f59e0b",
//       "follow_up": "#8b5cf6",
//       "emergency": "#ef4444",
//       "consultation": "#06b6d4"
//     }'::jsonb`),
//
    // Metadata
//     createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
//   },
//   (table) => [
//     index("idx_calendar_settings_company").on(table.companyId),
//     index("idx_calendar_settings_practitioner").on(table.practitionerId),
//   ],
// );

// Zod schemas for validation
/* DUPLICATE - appointments/resources/availability/reminders/waitlist/calendar schemas and types moved to appointments domain */
// export const insertAppointmentSchema = createInsertSchema(appointments).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true,
//   cancelledAt: true,
//   cancelledBy: true,
//   rescheduledFrom: true,
//   rescheduledTo: true,
// });
//
// export const updateAppointmentSchema = insertAppointmentSchema.partial();
//
// export const insertAppointmentResourceSchema = createInsertSchema(appointmentResources).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true,
// });
//
// export const insertAppointmentAvailabilitySchema = createInsertSchema(appointmentAvailability).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true,
// });
//
// export const insertAppointmentReminderSchema = createInsertSchema(appointmentReminders).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true,
//   sentAt: true,
// });
//
// export const insertAppointmentWaitlistSchema = createInsertSchema(appointmentWaitlist).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true,
//   fulfilledAt: true,
// });
//
// export const insertCalendarSettingsSchema = createInsertSchema(calendarSettings).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true,
// });
//
// export const updateCalendarSettingsSchema = insertCalendarSettingsSchema.partial();
//
// TypeScript types
// export type Appointment = typeof appointments.$inferSelect;
// export type InsertAppointment = typeof appointments.$inferInsert;
// export type AppointmentResource = typeof appointmentResources.$inferSelect;
// export type InsertAppointmentResource = typeof appointmentResources.$inferInsert;
// export type AppointmentAvailability = typeof appointmentAvailability.$inferSelect;
// export type InsertAppointmentAvailability = typeof appointmentAvailability.$inferInsert;
// export type AppointmentReminder = typeof appointmentReminders.$inferSelect;
// export type InsertAppointmentReminder = typeof appointmentReminders.$inferInsert;
// export type AppointmentWaitlist = typeof appointmentWaitlist.$inferSelect;
// export type InsertAppointmentWaitlist = typeof appointmentWaitlist.$inferInsert;
export type CalendarSettings = typeof calendarSettings.$inferSelect;
export type InsertCalendarSettings = typeof calendarSettings.$inferInsert;

// ========== End Appointment Scheduling Tables ==========

// ========== EHR System Tables ==========

// EHR Enums
export const medicalRecordStatusEnum = pgEnum("medical_record_status", [
  "active",
  "inactive",
  "archived",
  "under_review"
]);

export const medicationStatusEnum = pgEnum("medication_status", [
  "active",
  "discontinued",
  "completed",
  "on_hold"
]);

export const allergySeverityEnum = pgEnum("allergy_severity", [
  "mild",
  "moderate",
  "severe",
  "life_threatening"
]);

export const clinicalNoteTypeEnum = pgEnum("clinical_note_type", [
  "consultation",
  "examination",
  "follow_up",
  "discharge_summary",
  "referral",
  "progress_note",
  "initial_evaluation",
  "treatment_plan"
]);

export const vitalSignTypeEnum = pgEnum("vital_sign_type", [
  "blood_pressure",
  "heart_rate",
  "respiratory_rate",
  "temperature",
  "oxygen_saturation",
  "height",
  "weight",
  "bmi",
  "visual_acuity",
  "intraocular_pressure"
]);

export const immunizationStatusEnum = pgEnum("immunization_status", [
  "administered",
  "refused",
  "contraindicated",
  "scheduled",
  "unknown"
]);

/* DUPLICATE - medications table moved to ehr domain */
// Medications
// export const medications = pgTable(
//   "medications",
//   {
//     id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//     companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
//     patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }),
//     practitionerId: varchar("practitioner_id").references(() => users.id, { onDelete: 'set null' }),
//
    // Medication details
//     medicationName: varchar("medication_name", { length: 255 }).notNull(),
//     genericName: varchar("generic_name", { length: 255 }),
//     ndcCode: varchar("ndc_code", { length: 20 }), // National Drug Code
//     dosage: varchar("dosage", { length: 100 }).notNull(),
//     route: varchar("route", { length: 50 }).notNull(), // oral, topical, etc.
//     frequency: varchar("frequency", { length: 100 }).notNull(),
//     instructions: text("instructions"),
//
    // Prescription details
//     prescribedDate: timestamp("prescribed_date", { withTimezone: true }).notNull(),
//     startDate: timestamp("start_date", { withTimezone: true }),
//     endDate: timestamp("end_date", { withTimezone: true }),
//     status: medicationStatusEnum("status").notNull().default("active"),
//
    // Prescribing information
//     reason: text("reason"),
//     quantity: integer("quantity"),
//     refills: integer("refills").default(0),
//     pharmacy: varchar("pharmacy", { length: 255 }),
//
    // Metadata
//     prescribedBy: varchar("prescribed_by").references(() => users.id),
//     createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
//
    // External identifiers
//     externalPrescriptionId: varchar("external_prescription_id", { length: 100 }),
//   },
//   (table) => [
//     index("idx_medications_company").on(table.companyId),
//     index("idx_medications_patient").on(table.patientId),
//     index("idx_medications_practitioner").on(table.practitionerId),
//     index("idx_medications_status").on(table.status),
//     index("idx_medications_name").on(table.medicationName),
//     index("idx_medications_prescribed_date").on(table.prescribedDate),
//   ],
// );

/* DUPLICATE - allergies table moved to ehr domain */
// Allergies
// export const allergies = pgTable(
//   "allergies",
//   {
//     id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//     companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
//     patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }),
//     practitionerId: varchar("practitioner_id").references(() => users.id, { onDelete: 'set null' }),
//
    // Allergy details
//     allergen: varchar("allergen", { length: 255 }).notNull(),
//     allergenType: varchar("allergen_type", { length: 50 }).notNull(), // medication, food, environmental
//     severity: allergySeverityEnum("severity").notNull(),
//     reaction: text("reaction").notNull(),
//
    // Status and dates
//     status: varchar("status", { length: 50 }).default("active"),
//     onsetDate: date("onset_date"),
//     reportedDate: timestamp("reported_date", { withTimezone: true }).defaultNow(),
//
    // Clinical notes
//     notes: text("notes"),
//
    // Metadata
//     reportedBy: varchar("reported_by").references(() => users.id),
//     createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
//   },
//   (table) => [
//     index("idx_allergies_company").on(table.companyId),
//     index("idx_allergies_patient").on(table.patientId),
//     index("idx_allergies_severity").on(table.severity),
//     index("idx_allergies_status").on(table.status),
//     index("idx_allergies_allergen").on(table.allergen),
//   ],
// );

/* DUPLICATE - clinicalNotes table moved to ehr domain */
// Clinical Notes
// export const clinicalNotes = pgTable(
//   "clinical_notes",
//   {
//     id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//     companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
//     patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }),
//     practitionerId: varchar("practitioner_id").references(() => users.id, { onDelete: 'set null' }),
//
    // Note details
//     noteType: clinicalNoteTypeEnum("note_type").notNull(),
//     title: varchar("title", { length: 255 }).notNull(),
//     content: text("content").notNull(),
//
    // SOAP structure (Subjective, Objective, Assessment, Plan)
//     subjective: text("subjective"),
//     objective: text("objective"),
//     assessment: text("assessment"),
//     plan: text("plan"),
//
    // Date and time
//     noteDate: timestamp("note_date", { withTimezone: true }).notNull(),
//     serviceDate: timestamp("service_date", { withTimezone: true }),
//
    // Status and workflow
//     status: varchar("status", { length: 50 }).default("draft"),
//     isSigned: boolean("is_signed").default(false),
//     signedAt: timestamp("signed_at", { withTimezone: true }),
//     signedBy: varchar("signed_by").references(() => users.id),
//
    // Metadata
//     createdBy: varchar("created_by").references(() => users.id),
//     createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
//
    // Attachments and references
//     appointmentId: varchar("appointment_id").references(() => appointments.id),
//     attachments: jsonb("attachments"), // Array of file references
//
    // Soft Delete
//     deletedAt: timestamp("deleted_at", { withTimezone: true }),
//     deletedBy: varchar("deleted_by").references(() => users.id),
//   },
//   (table) => [
//     index("idx_clinical_notes_company").on(table.companyId),
//     index("idx_clinical_notes_patient").on(table.patientId),
//     index("idx_clinical_notes_practitioner").on(table.practitionerId),
//     index("idx_clinical_notes_type").on(table.noteType),
//     index("idx_clinical_notes_date").on(table.noteDate),
//     index("idx_clinical_notes_status").on(table.status),
//     index("idx_clinical_notes_appointment").on(table.appointmentId),
//   ],
// );

/* DUPLICATE - vitalSigns table moved to ehr domain */
// Vital Signs
// export const vitalSigns = pgTable(
//   "vital_signs",
//   {
//     id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//     companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
//     patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }),
//     practitionerId: varchar("practitioner_id").references(() => users.id, { onDelete: 'set null' }),
//
    // Vital sign details
//     vitalType: vitalSignTypeEnum("vital_type").notNull(),
//     value: varchar("value", { length: 100 }).notNull(),
//     unit: varchar("unit", { length: 50 }).notNull(),
//
    // Measurement details
//     measurementDate: timestamp("measurement_date", { withTimezone: true }).notNull(),
//     method: varchar("method", { length: 100 }), // How it was measured
//     position: varchar("position", { length: 50 }), // Patient position during measurement
//
    // Clinical context
//     interpretation: varchar("interpretation", { length: 50 }), // normal, high, low, critical
//     notes: text("notes"),
//
    // Metadata
//     measuredBy: varchar("measured_by").references(() => users.id),
//     createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
//
    // Device information
//     deviceId: varchar("device_id", { length: 100 }),
//     deviceType: varchar("device_type", { length: 100 }),
//
    // Soft Delete
//     deletedAt: timestamp("deleted_at", { withTimezone: true }),
//     deletedBy: varchar("deleted_by").references(() => users.id),
//   },
//   (table) => [
//     index("idx_vital_signs_company").on(table.companyId),
//     index("idx_vital_signs_patient").on(table.patientId),
//     index("idx_vital_signs_type").on(table.vitalType),
//     index("idx_vital_signs_date").on(table.measurementDate),
//     index("idx_vital_signs_interpretation").on(table.interpretation),
//   ],
// );

/* DUPLICATE - immunizations table moved to ehr domain */
// Immunizations
// export const immunizations = pgTable(
//   "immunizations",
//   {
//     id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//     companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
//     patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }),
//     practitionerId: varchar("practitioner_id").references(() => users.id, { onDelete: 'set null' }),
//
    // Vaccine details
//     vaccineName: varchar("vaccine_name", { length: 255 }).notNull(),
//     vaccineType: varchar("vaccine_type", { length: 100 }).notNull(),
//     manufacturer: varchar("manufacturer", { length: 255 }),
//     lotNumber: varchar("lot_number", { length: 100 }),
//
    // Administration details
//     administrationDate: timestamp("administration_date", { withTimezone: true }).notNull(),
//     dose: varchar("dose", { length: 100 }),
//     route: varchar("route", { length: 50 }),
//     site: varchar("site", { length: 50 }), // Injection site
//
    // Status and dates
//     status: immunizationStatusEnum("status").notNull().default("administered"),
//     nextDueDate: timestamp("next_due_date", { withTimezone: true }),
//
    // Clinical information
//     indications: text("indications"),
//     adverseEvents: text("adverse_events"),
//     notes: text("notes"),
//
    // Metadata
//     administeredBy: varchar("administered_by").references(() => users.id),
//     createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
//
    // External identifiers
//     cvxCode: varchar("cvx_code", { length: 10 }), // CDC Vaccine Code
//   },
//   (table) => [
//     index("idx_immunizations_company").on(table.companyId),
//     index("idx_immunizations_patient").on(table.patientId),
//     index("idx_immunizations_vaccine").on(table.vaccineName),
//     index("idx_immunizations_date").on(table.administrationDate),
//     index("idx_immunizations_status").on(table.status),
//   ],
// );

/* DUPLICATE - labResults table moved to lab domain */
// Lab Results
// export const labResults = pgTable(
//   "lab_results",
//   {
//     id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//     companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
//     patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }),
//     practitionerId: varchar("practitioner_id").references(() => users.id, { onDelete: 'set null' }),
//
    // Test details
//     testName: varchar("test_name", { length: 255 }).notNull(),
//     testCategory: varchar("test_category", { length: 100 }),
//     loincCode: varchar("loinc_code", { length: 20 }), // LOINC code for standardization
//
    // Results
//     resultValue: varchar("result_value", { length: 255 }),
//     resultUnit: varchar("result_unit", { length: 50 }),
//     referenceRange: text("reference_range"),
//     abnormalFlag: varchar("abnormal_flag", { length: 10 }), // H, L, HH, LL, etc.
//     interpretation: text("interpretation"),
//
    // Dates and status
//     specimenDate: timestamp("specimen_date", { withTimezone: true }),
//     resultDate: timestamp("result_date", { withTimezone: true }).notNull(),
//     status: varchar("status", { length: 50 }).default("final"),
//
    // Laboratory information
//     performingLab: varchar("performing_lab", { length: 255 }),
//     orderingProvider: varchar("ordering_provider", { length: 255 }),
//
    // Clinical notes
//     clinicalNotes: text("clinical_notes"),
//
    // Metadata
//     createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
//
    // External identifiers
//     accessionNumber: varchar("accession_number", { length: 100 }),
//   },
//   (table) => [
//     index("idx_lab_results_company").on(table.companyId),
//     index("idx_lab_results_patient").on(table.patientId),
//     index("idx_lab_results_test").on(table.testName),
//     index("idx_lab_results_date").on(table.resultDate),
//     index("idx_lab_results_status").on(table.status),
//   ],
// );

/* DUPLICATE - labOrders table moved to lab domain */
// Lab Orders - for tracking laboratory test orders
// export const labOrders = pgTable(
//   "lab_orders",
//   {
//     id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//     companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
//     patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }),
//     practitionerId: varchar("practitioner_id").references(() => users.id, { onDelete: 'set null' }),
//
    // Order details
//     orderNumber: varchar("order_number", { length: 100 }).notNull(),
//     orderType: varchar("order_type", { length: 50 }),
//     priority: varchar("priority", { length: 20 }).default("routine"),
//
    // Dates
//     orderedDate: timestamp("ordered_date", { withTimezone: true }).notNull().defaultNow(),
//     scheduledDate: timestamp("scheduled_date", { withTimezone: true }),
//     completedDate: timestamp("completed_date", { withTimezone: true }),
//
    // Status
//     status: varchar("status", { length: 50 }).default("pending"),
//
    // Laboratory information
//     performingLab: varchar("performing_lab", { length: 255 }),
//
    // Clinical information
//     diagnosis: text("diagnosis"),
//     clinicalNotes: text("clinical_notes"),
//     specialInstructions: text("special_instructions"),
//
    // Metadata
//     createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
//   },
//   (table) => [
//     index("idx_lab_orders_company").on(table.companyId),
//     index("idx_lab_orders_patient").on(table.patientId),
//     index("idx_lab_orders_practitioner").on(table.practitionerId),
//     index("idx_lab_orders_order_number").on(table.orderNumber),
//     index("idx_lab_orders_status").on(table.status),
//     index("idx_lab_orders_ordered_date").on(table.orderedDate),
//   ],
// );

/* DUPLICATE - labTestCatalog table moved to lab domain */
// Lab Test Catalog - master list of available laboratory tests
// export const labTestCatalog = pgTable(
//   "lab_test_catalog",
//   {
//     id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//     companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }), // null for system-wide tests
//
    // Test identification
//     testCode: varchar("test_code", { length: 50 }).notNull(),
//     testName: varchar("test_name", { length: 255 }).notNull(),
//     category: varchar("category", { length: 100 }),
//     description: text("description"),
//
    // Specimen and logistics
//     specimenType: varchar("specimen_type", { length: 100 }),
//     specimenVolume: varchar("specimen_volume", { length: 50 }),
//     containerType: varchar("container_type", { length: 100 }),
//     turnaroundTime: varchar("turnaround_time", { length: 100 }),
//
    // Standardization
//     loincCode: varchar("loinc_code", { length: 20 }),
//     cptCode: varchar("cpt_code", { length: 20 }),
//
    // Pricing and availability
//     cost: numeric("cost", { precision: 10, scale: 2 }),
//     isActive: boolean("is_active").default(true),
//     requiresApproval: boolean("requires_approval").default(false),
//
    // Metadata
//     createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
//   },
//   (table) => [
//     index("idx_lab_test_catalog_company").on(table.companyId),
//     index("idx_lab_test_catalog_code").on(table.testCode),
//     index("idx_lab_test_catalog_category").on(table.category),
//     index("idx_lab_test_catalog_active").on(table.isActive),
//   ],
// );

/* DUPLICATE - labQualityControl table moved to lab domain */
// Lab Quality Control Tests - for tracking lab QC results
// export const labQualityControl = pgTable(
//   "lab_quality_control",
//   {
//     id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//     companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
//     technicianId: varchar("technician_id").references(() => users.id, { onDelete: 'set null' }),
//
    // Test identification
//     testCode: varchar("test_code", { length: 50 }).notNull(),
//     testName: varchar("test_name", { length: 255 }),
//
    // Control information
//     controlLot: varchar("control_lot", { length: 100 }).notNull(),
//     controlLevel: varchar("control_level", { length: 50 }),
//     expirationDate: timestamp("expiration_date", { withTimezone: true }),
//
    // Results
//     expectedValue: numeric("expected_value", { precision: 10, scale: 2 }).notNull(),
//     actualValue: numeric("actual_value", { precision: 10, scale: 2 }).notNull(),
//     unit: varchar("unit", { length: 50 }),
//     acceptableRangeMin: numeric("acceptable_range_min", { precision: 10, scale: 2 }),
//     acceptableRangeMax: numeric("acceptable_range_max", { precision: 10, scale: 2 }),
//     isWithinRange: boolean("is_within_range").notNull(),
//     deviation: numeric("deviation", { precision: 10, scale: 2 }),
//     percentDeviation: numeric("percent_deviation", { precision: 10, scale: 2 }),
//
    // Equipment and reagents
//     instrumentId: varchar("instrument_id", { length: 100 }),
//     instrumentName: varchar("instrument_name", { length: 255 }),
//     reagentLot: varchar("reagent_lot", { length: 100 }),
//
    // Test metadata
//     testDate: timestamp("test_date", { withTimezone: true }).notNull(),
//     performedBy: varchar("performed_by", { length: 255 }),
//     reviewedBy: varchar("reviewed_by", { length: 255 }),
//     reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
//
    // Actions and notes
//     actionTaken: text("action_taken"),
//     notes: text("notes"),
//
    // Metadata
//     createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
//   },
//   (table) => [
//     index("idx_lab_qc_company").on(table.companyId),
//     index("idx_lab_qc_test_code").on(table.testCode),
//     index("idx_lab_qc_test_date").on(table.testDate),
//     index("idx_lab_qc_instrument").on(table.instrumentId),
//     index("idx_lab_qc_within_range").on(table.isWithinRange),
//   ],
// );

/* DUPLICATE - Lab Zod schemas and types moved to lab domain */
// Zod schemas for validation
// export const insertLabOrderSchema = createInsertSchema(labOrders).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true
// });
//
// export const insertLabTestCatalogSchema = createInsertSchema(labTestCatalog).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true
// });
//
// export const insertLabQualityControlSchema = createInsertSchema(labQualityControl).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true
// });

/* DUPLICATE - EHR Zod schemas moved to ehr domain */
// export const insertMedicationSchema = createInsertSchema(medications).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true
// });
//
// export const insertAllergySchema = createInsertSchema(allergies).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true
// });
//
// export const insertClinicalNoteSchema = createInsertSchema(clinicalNotes).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true,
//   signedAt: true
// });
//
// export const insertVitalSignSchema = createInsertSchema(vitalSigns).omit({
//   id: true,
//   createdAt: true
// });
//
// export const insertImmunizationSchema = createInsertSchema(immunizations).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true
// });

// export const insertLabResultSchema = createInsertSchema(labResults).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true
// });

// TypeScript types
/* DUPLICATE - EHR TypeScript types moved to ehr domain */
// export type Medication = typeof medications.$inferSelect;
// export type InsertMedication = typeof medications.$inferInsert;
// export type Allergy = typeof allergies.$inferSelect;
// export type InsertAllergy = typeof allergies.$inferInsert;
// export type ClinicalNote = typeof clinicalNotes.$inferSelect;
// export type InsertClinicalNote = typeof clinicalNotes.$inferInsert;
// export type VitalSign = typeof vitalSigns.$inferSelect;
// export type InsertVitalSign = typeof vitalSigns.$inferInsert;
// export type Immunization = typeof immunizations.$inferSelect;
// export type InsertImmunization = typeof immunizations.$inferInsert;
// export type LabResult = typeof labResults.$inferSelect;
// export type InsertLabResult = typeof labResults.$inferInsert;
// export type LabOrder = typeof labOrders.$inferSelect;
// export type InsertLabOrder = typeof labOrders.$inferInsert;
// export type LabTestCatalog = typeof labTestCatalog.$inferSelect;
// export type InsertLabTestCatalog = typeof labTestCatalog.$inferInsert;
// export type LabQualityControl = typeof labQualityControl.$inferSelect;
// export type InsertLabQualityControl = typeof labQualityControl.$inferInsert;

// ========== End EHR System Tables ==========

// ========== Patient Portal Tables ==========

// Patient portal settings and preferences
/* DUPLICATE - patientPortalSettings table moved to patientportal domain */
// export const patientPortalSettings = pgTable("patient_portal_settings", {
// id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
// patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
// preferredLanguage: varchar("preferred_language").default("en"),
// timezone: varchar("timezone").default("UTC"),
// notificationPreferences: jsonb("notification_preferences"),
// privacySettings: jsonb("privacy_settings"),
// createdAt: timestamp("created_at").defaultNow().notNull(),
// updatedAt: timestamp("updated_at").defaultNow().notNull(),
// });

// Appointment requests from patients
/* DUPLICATE - appointmentRequests table moved to appointments domain */
// export const appointmentRequests = pgTable("appointment_requests", {
// id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
// patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
// companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
// providerId: varchar("provider_id").references(() => users.id, { onDelete: 'set null' }),
// serviceType: varchar("service_type"),
// preferredDate: timestamp("preferred_date"),
// preferredTime: varchar("preferred_time"),
// reasonForVisit: text("reason_for_visit"),
// notes: text("notes"),
// status: varchar("status").default("pending"), // pending, approved, denied, scheduled
// requestedAt: timestamp("requested_at").defaultNow().notNull(),
// processedAt: timestamp("processed_at"),
// processedBy: varchar("processed_by").references(() => users.id, { onDelete: 'set null' }),
// adminNotes: text("admin_notes"),
// });

// Patient documents and files
/* DUPLICATE - patientDocuments table moved to patientportal domain */
// export const patientDocuments = pgTable("patient_documents", {
// id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
// patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
// companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
// documentType: varchar("document_type").notNull(), // lab_result, imaging, prescription, insurance_card, id_document, other
// title: varchar("title").notNull(),
// description: text("description"),
// fileUrl: varchar("file_url").notNull(),
// fileName: varchar("file_name").notNull(),
// fileSize: integer("file_size").notNull(),
// mimeType: varchar("mime_type").notNull(),
// uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
// expiresAt: timestamp("expires_at"),
// isShared: boolean("is_shared").default(false).notNull(),
// status: varchar("status").default("active").notNull(), // active, archived, deleted
// uploadedBy: varchar("uploaded_by").references(() => users.id, { onDelete: 'set null' }),
// tags: jsonb("tags"),
// metadata: jsonb("metadata"),
// });

// Patient health metrics and wellness tracking
/* DUPLICATE - patientHealthMetrics table moved to patientportal domain */
// export const patientHealthMetrics = pgTable("patient_health_metrics", {
// id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
// patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
// companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
// metricType: varchar("metric_type").notNull(), // blood_pressure, weight, blood_sugar, temperature, heart_rate, oxygen_saturation, custom
// value: numeric("value").notNull(),
// unit: varchar("unit").notNull(),
// measuredAt: timestamp("measured_at").notNull(),
// notes: text("notes"),
// deviceInfo: varchar("device_info"),
// recordedAt: timestamp("recorded_at").defaultNow().notNull(),
// source: varchar("source").default("patient"), // patient, provider, device
// customMetricName: varchar("custom_metric_name"),
// metadata: jsonb("metadata"),
// });

// Patient portal access logs for audit
/* DUPLICATE - patientPortalAccessLogs table moved to patientportal domain */
// export const patientPortalAccessLogs = pgTable("patient_portal_access_logs", {
// id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
// patientId: varchar("patient_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
// companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
// accessTime: timestamp("access_time").defaultNow().notNull(),
// ipAddress: varchar("ip_address"),
// userAgent: text("user_agent"),
// action: varchar("action").notNull(), // login, logout, view_records, send_message, etc.
// resourceType: varchar("resource_type"), // appointment, medical_record, message, document
// resourceId: varchar("resource_id"),
// success: boolean("success").default(true).notNull(),
// failureReason: varchar("failure_reason"),
// sessionId: varchar("session_id"),
// location: jsonb("location"), // geolocation data
// deviceFingerprint: varchar("device_fingerprint"),
// });

// Export types for patient portal tables
/* DUPLICATE - Patient Portal types (last 4 tables) moved to patientportal domain */
// export type PatientPortalSetting = typeof patientPortalSettings.$inferSelect;
// export type InsertPatientPortalSetting = typeof patientPortalSettings.$inferInsert;
// /* DUPLICATE - appointmentRequests types moved to appointments domain */
// export type AppointmentRequest = typeof appointmentRequests.$inferSelect;
// export type InsertAppointmentRequest = typeof appointmentRequests.$inferInsert;
// Message and InsertMessage types are already exported above (Communications section)
// export type PatientDocument = typeof patientDocuments.$inferSelect;
// export type InsertPatientDocument = typeof patientDocuments.$inferInsert;
// export type PatientHealthMetric = typeof patientHealthMetrics.$inferSelect;
// export type InsertPatientHealthMetric = typeof patientHealthMetrics.$inferInsert;
// export type PatientPortalAccessLog = typeof patientPortalAccessLogs.$inferSelect;
// export type InsertPatientPortalAccessLog = typeof patientPortalAccessLogs.$inferInsert;

// ========== End Patient Portal Tables ==========

// ========== Backward Compatibility Tables & Aliases ==========
// These aliases and tables ensure backward compatibility with services
// that reference older table names or expected tables that were not yet created

// Alias: activityLogs -> auditLogs
// export const activityLogs = auditLogs;
export type ActivityLog = AuditLog;
export type InsertActivityLog = InsertAuditLog;

// Alias: examinations -> eyeExaminations
// export const examinations = eyeExaminations;
export type Examination = EyeExamination;
export type InsertExamination = InsertEyeExamination;

// Insurance Companies Table (for BillingService)
/* DUPLICATE - insuranceCompanies table moved to insurance domain */
// export const insuranceCompanies = pgTable("insurance_companies", {
//   id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//   companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
//   name: varchar("name", { length: 255 }).notNull(),
//   displayName: varchar("display_name", { length: 255 }),
//   payerId: varchar("payer_id", { length: 100 }),
//   npi: varchar("npi", { length: 20 }),
//   address: jsonb("address"),
//   phone: varchar("phone", { length: 50 }),
//   fax: varchar("fax", { length: 50 }),
//   email: varchar("email", { length: 255 }),
//   website: varchar("website", { length: 500 }),
//   ediTradingPartnerId: varchar("edi_trading_partner_id", { length: 100 }),
//   clearinghouse: varchar("clearinghouse", { length: 100 }),
//   claimSubmissionMethod: varchar("claim_submission_method", { length: 50 }),
//   attachmentRequirements: jsonb("attachment_requirements"),
//   isActive: boolean("is_active").default(true).notNull(),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
//   updatedAt: timestamp("updated_at").defaultNow().notNull(),
// });
//
// export type InsuranceCompany = typeof insuranceCompanies.$inferSelect;
// export type InsertInsuranceCompany = typeof insuranceCompanies.$inferInsert;
//
// Insurance Plans Table (for BillingService)
/* DUPLICATE - insurancePlans table moved to insurance domain */
// export const insurancePlans = pgTable("insurance_plans", {
//   id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//   companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
//   insuranceCompanyId: varchar("insurance_company_id").references(() => insuranceCompanies.id, { onDelete: 'cascade' }),
//   planName: varchar("plan_name", { length: 255 }).notNull(),
//   planType: varchar("plan_type", { length: 50 }).notNull(), // hmo, ppo, pos, epo, medicare, medicaid, etc.
//   planId: varchar("plan_id", { length: 100 }),
//   groupId: varchar("group_id", { length: 100 }),
//   copaymentAmount: decimal("copayment_amount", { precision: 10, scale: 2 }),
//   deductibleAmount: decimal("deductible_amount", { precision: 10, scale: 2 }),
//   coinsurancePercentage: decimal("coinsurance_percentage", { precision: 5, scale: 2 }),
//   outOfPocketMaximum: decimal("out_of_pocket_maximum", { precision: 10, scale: 2 }),
//   visionCoverage: jsonb("vision_coverage"),
//   examCoverage: jsonb("exam_coverage"),
//   materialsCoverage: jsonb("materials_coverage"),
//   preauthorizationRequired: boolean("preauthorization_required").default(false),
//   referralRequired: boolean("referral_required").default(false),
//   timelyFilingDays: integer("timely_filing_days"),
//   effectiveDate: timestamp("effective_date"),
//   terminationDate: timestamp("termination_date"),
//   isActive: boolean("is_active").default(true).notNull(),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
//   updatedAt: timestamp("updated_at").defaultNow().notNull(),
// });
//
// export type InsurancePlan = typeof insurancePlans.$inferSelect;
// export type InsertInsurancePlan = typeof insurancePlans.$inferInsert;
//
// AI Analyses Table (for AnalyticsService)
/* DUPLICATE - aiAnalyses table (insurance-related) moved to insurance domain */
// export const aiAnalyses = pgTable("ai_analyses", {
//   id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//   companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }),
//   modelType: varchar("model_type", { length: 100 }).notNull(),
//   analysisType: varchar("analysis_type", { length: 100 }).notNull(),
//   confidence: decimal("confidence", { precision: 5, scale: 4 }),
//   inputData: jsonb("input_data"),
//   outputData: jsonb("output_data"),
//   processingTimeMs: integer("processing_time_ms"),
//   errorMessage: text("error_message"),
//   userId: varchar("user_id").references(() => users.id),
//   resourceType: varchar("resource_type", { length: 50 }),
//   resourceId: varchar("resource_id"),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
// });
//
// export type AiAnalysis = typeof aiAnalyses.$inferSelect;
// export type InsertAiAnalysis = typeof aiAnalyses.$inferInsert;
//
// Patient Insurance Table (for BillingService)
/* DUPLICATE - patientInsurance table moved to insurance domain */
// export const patientInsurance = pgTable("patient_insurance", {
//   id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//   companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
//   patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: 'cascade' }),
//   insurancePlanId: varchar("insurance_plan_id").references(() => insurancePlans.id),
//   memberId: varchar("member_id", { length: 100 }),
//   subscriberId: varchar("subscriber_id", { length: 100 }),
//   groupNumber: varchar("group_number", { length: 100 }),
//   subscriberFirstName: varchar("subscriber_first_name", { length: 100 }),
//   subscriberLastName: varchar("subscriber_last_name", { length: 100 }),
//   subscriberDob: timestamp("subscriber_dob"),
//   relationshipToSubscriber: varchar("relationship_to_subscriber", { length: 50 }),
//   priority: integer("priority").default(1),
//   status: varchar("status", { length: 50 }).default("active"),
//   effectiveDate: timestamp("effective_date"),
//   terminationDate: timestamp("termination_date"),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
//   updatedAt: timestamp("updated_at").defaultNow().notNull(),
// });
//
// export type PatientInsurance = typeof patientInsurance.$inferSelect;
// export type InsertPatientInsurance = typeof patientInsurance.$inferInsert;
//
// Eligibility Verifications Table (for BillingService)
/* DUPLICATE - eligibilityVerifications table moved to insurance domain */
// export const eligibilityVerifications = pgTable("eligibility_verifications", {
//   id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//   companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
//   patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: 'cascade' }),
//   insurancePlanId: varchar("insurance_plan_id").references(() => insurancePlans.id),
//   verificationDate: timestamp("verification_date").defaultNow().notNull(),
//   verifiedBy: varchar("verified_by").references(() => users.id),
//   status: varchar("status", { length: 50 }).default("pending"),
//   eligibilityStatus: varchar("eligibility_status", { length: 50 }),
//   coverageDetails: jsonb("coverage_details"),
//   copayAmount: decimal("copay_amount", { precision: 10, scale: 2 }),
//   deductibleRemaining: decimal("deductible_remaining", { precision: 10, scale: 2 }),
//   outOfPocketRemaining: decimal("out_of_pocket_remaining", { precision: 10, scale: 2 }),
//   responseData: jsonb("response_data"),
//   errorMessage: text("error_message"),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
// });
//
// export type EligibilityVerification = typeof eligibilityVerifications.$inferSelect;
// export type InsertEligibilityVerification = typeof eligibilityVerifications.$inferInsert;
//
// Preauthorizations Table (for BillingService)
/* DUPLICATE - preauthorizations table moved to insurance domain */
// export const preauthorizations = pgTable("preauthorizations", {
//   id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//   companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
//   patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: 'cascade' }),
//   insurancePlanId: varchar("insurance_plan_id").references(() => insurancePlans.id),
//   requestDate: timestamp("request_date").defaultNow().notNull(),
//   requestedBy: varchar("requested_by").references(() => users.id),
//   serviceType: varchar("service_type", { length: 100 }),
//   procedureCodes: jsonb("procedure_codes"),
//   diagnosisCodes: jsonb("diagnosis_codes"),
//   status: varchar("status", { length: 50 }).default("pending"),
//   authorizationNumber: varchar("authorization_number", { length: 100 }),
//   approvedUnits: integer("approved_units"),
//   approvedAmount: decimal("approved_amount", { precision: 10, scale: 2 }),
//   effectiveDate: timestamp("effective_date"),
//   expirationDate: timestamp("expiration_date"),
//   denialReason: text("denial_reason"),
//   notes: text("notes"),
//   responseData: jsonb("response_data"),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
//   updatedAt: timestamp("updated_at").defaultNow().notNull(),
// });
//
// export type Preauthorization = typeof preauthorizations.$inferSelect;
// export type InsertPreauthorization = typeof preauthorizations.$inferInsert;
//
// Medical Claims Table (for BillingService)
/* DUPLICATE - medicalClaims table moved to insurance domain */
// export const medicalClaims = pgTable("medical_claims", {
//   id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//   companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
//   patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: 'cascade' }),
//   insurancePlanId: varchar("insurance_plan_id").references(() => insurancePlans.id),
//   claimNumber: varchar("claim_number", { length: 50 }).notNull(),
//   claimType: varchar("claim_type", { length: 50 }).default("professional"),
//   status: varchar("status", { length: 50 }).default("draft"),
//   serviceDate: timestamp("service_date").notNull(),
//   placeOfService: varchar("place_of_service", { length: 10 }),
//   diagnosisCodes: jsonb("diagnosis_codes"),
//   totalCharges: decimal("total_charges", { precision: 10, scale: 2 }),
//   allowedAmount: decimal("allowed_amount", { precision: 10, scale: 2 }),
//   paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
//   patientResponsibility: decimal("patient_responsibility", { precision: 10, scale: 2 }),
//   adjustmentAmount: decimal("adjustment_amount", { precision: 10, scale: 2 }),
//   adjustmentReasons: jsonb("adjustment_reasons"),
//   submittedAt: timestamp("submitted_at"),
//   processedAt: timestamp("processed_at"),
//   denialReason: text("denial_reason"),
//   notes: text("notes"),
//   createdBy: varchar("created_by").references(() => users.id),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
//   updatedAt: timestamp("updated_at").defaultNow().notNull(),
// });
//
// export type MedicalClaim = typeof medicalClaims.$inferSelect;
// export type InsertMedicalClaim = typeof medicalClaims.$inferInsert;
//
// Payments Table (for BillingService)
/* DUPLICATE - Moved to modular schema
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  patientId: varchar("patient_id").references(() => patients.id),
  claimId: varchar("claim_id").references(() => medicalClaims.id),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentSource: varchar("payment_source", { length: 50 }),
  checkNumber: varchar("check_number", { length: 50 }),
  referenceNumber: varchar("reference_number", { length: 100 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  processedDate: timestamp("processed_date"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}); */

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// Billing Codes Table (for BillingService)
/* DUPLICATE - Moved to modular schema
export const billingCodes = pgTable("billing_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  code: varchar("code", { length: 20 }).notNull(),
  codeType: varchar("code_type", { length: 20 }).notNull(), // CPT, HCPCS, ICD10
  description: text("description"),
  shortDescription: varchar("short_description", { length: 255 }),
  category: varchar("category", { length: 100 }),
  defaultFee: decimal("default_fee", { precision: 10, scale: 2 }),
  unitType: varchar("unit_type", { length: 20 }),
  modifiers: jsonb("modifiers"),
  isActive: boolean("is_active").default(true).notNull(),
  effectiveDate: timestamp("effective_date"),
  terminationDate: timestamp("termination_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}); */

export type BillingCode = typeof billingCodes.$inferSelect;
export type InsertBillingCode = typeof billingCodes.$inferInsert;

// ========== End Backward Compatibility Tables ==========
