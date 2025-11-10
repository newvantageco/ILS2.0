import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, pgEnum, integer, decimal, boolean, date, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["ecp", "admin", "lab_tech", "engineer", "supplier", "platform_admin", "company_admin", "dispenser"]);
export const subscriptionPlanEnum = pgEnum("subscription_plan", ["full", "free_ecp"]);

// Session storage table for Replit Auth
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
);

export const userRoleEnum = pgEnum("user_role", ["ecp", "lab_tech", "engineer", "supplier", "admin", "platform_admin", "company_admin", "dispenser"]);
export const userRoleEnhancedEnum = pgEnum("user_role_enhanced", [
  "owner",
  "admin", 
  "optometrist",
  "dispenser",
  "retail_assistant",
  "lab_tech",
  "engineer",
  "supplier"
]);
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
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: analyticsEventTypeEnum("event_type").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  sourceId: varchar("source_id").notNull(),
  sourceType: varchar("source_type").notNull(),
  data: jsonb("data").notNull(),
  metadata: jsonb("metadata"),
  organizationId: varchar("organization_id").notNull(),
});

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
});

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
});

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

export const orderTimeline = pgTable("order_timeline", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  status: varchar("status").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  metadata: jsonb("metadata"),
});

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
);

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
]);

// Subscription Plans table
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
});

// Stripe Payment Intents table
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
]);

// Subscription History table
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
]);

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
]);

// AI Messages - individual messages in conversations
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
]);

// AI Knowledge Base - documents and data uploaded by companies
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
  embeddings: jsonb("embeddings"), // Vector embeddings for semantic search
  
  // Metadata
  category: varchar("category"), // pricing, procedures, policies, etc.
  isActive: boolean("is_active").default(true),
  processingStatus: varchar("processing_status").default("pending"), // pending, processing, completed, failed
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_knowledge_company").on(table.companyId),
  index("idx_ai_knowledge_category").on(table.category),
]);

// AI Learning Data - track what the AI learns over time
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
]);

// AI Feedback - user feedback on AI responses
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
]);

// ============== MASTER AI TRAINING SYSTEM ==============

// AI Model Versions - master AI model version tracking
export const aiModelVersions = pgTable("ai_model_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  versionNumber: varchar("version_number", { length: 50 }).notNull().unique(),
  modelName: varchar("model_name", { length: 255 }).notNull(),
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
]);

// AI Model Deployments - track which companies have which AI versions
export const aiModelDeployments = pgTable("ai_model_deployments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  modelVersionId: varchar("model_version_id").notNull().references(() => aiModelVersions.id, { onDelete: 'cascade' }),
  versionNumber: varchar("version_number", { length: 50 }).notNull(),
  deploymentStatus: varchar("deployment_status", { length: 50 }).notNull().default("active"),
  deployedAt: timestamp("deployed_at").defaultNow().notNull(),
  deactivatedAt: timestamp("deactivated_at"),
  performanceMetrics: jsonb("performance_metrics"),
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_ai_deployments_company").on(table.companyId),
  index("idx_ai_deployments_version").on(table.modelVersionId),
  index("idx_ai_deployments_status").on(table.deploymentStatus),
]);

// Master Training Datasets - curated training data by platform admin
export const masterTrainingDatasets = pgTable("master_training_datasets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelVersionId: varchar("model_version_id").references(() => aiModelVersions.id),
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
  enhancedRole: userRoleEnhancedEnum("enhanced_role"),
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
});

// Junction table to support multiple roles per user
export const userRoles = pgTable("user_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: userRoleEnum("role").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
}, (table) => [
  index("idx_user_roles_user_id").on(table.userId),
]);

// Enhanced Permission System Tables
export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  permissionKey: varchar("permission_key").notNull().unique(),
  permissionName: varchar("permission_name").notNull(),
  category: varchar("category").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_permissions_category").on(table.category),
]);

export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  role: userRoleEnhancedEnum("role").notNull(),
  permissionId: varchar("permission_id").notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_role_permissions_company").on(table.companyId),
  index("idx_role_permissions_role").on(table.role),
]);

export const userCustomPermissions = pgTable("user_custom_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  permissionId: varchar("permission_id").notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  granted: boolean("granted").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
}, (table) => [
  index("idx_user_custom_permissions_user").on(table.userId),
]);

// ============== DYNAMIC RBAC SYSTEM ==============

// Dynamic Roles - Company-specific roles (both defaults and custom)
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
]);

// Dynamic Role Permissions - Many-to-many: which permissions does each role have?
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
]);

// User Dynamic Roles - Many-to-many: which roles are assigned to each user?
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
]);

// Role Change Audit - Track all permission/role changes for compliance
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
]);

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

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  
  // Who performed the action
  userId: varchar("user_id").references(() => users.id),
  userEmail: varchar("user_email"),
  userRole: userRoleEnum("user_role"),
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
]);

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
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  ecpId: varchar("ecp_id").notNull().references(() => users.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  
  odSphere: text("od_sphere"),
  odCylinder: text("od_cylinder"),
  odAxis: text("od_axis"),
  odAdd: text("od_add"),
  osSphere: text("os_sphere"),
  osCylinder: text("os_cylinder"),
  osAxis: text("os_axis"),
  osAdd: text("os_add"),
  pd: text("pd"),
  
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
});

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
});

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
  finalized: boolean("finalized").default(false),
  
  gosFormType: text("gos_form_type"),
  nhsVoucherCode: text("nhs_voucher_code"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  examinationId: varchar("examination_id").references(() => eyeExaminations.id),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  ecpId: varchar("ecp_id").notNull().references(() => users.id),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  expiryDate: timestamp("expiry_date"),
  odSphere: text("od_sphere"),
  odCylinder: text("od_cylinder"),
  odAxis: text("od_axis"),
  odAdd: text("od_add"),
  osSphere: text("os_sphere"),
  osCylinder: text("os_cylinder"),
  osAxis: text("os_axis"),
  osAdd: text("os_add"),
  pd: text("pd"), // Legacy field - kept for backwards compatibility
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
}, (table) => [
  index("idx_prescriptions_test_room").on(table.testRoomName),
  index("idx_prescriptions_goc_number").on(table.prescriberGocNumber),
  index("idx_prescriptions_follow_up").on(table.followUpDate),
  index("idx_prescriptions_retention").on(table.recordRetentionDate),
  index("idx_prescriptions_verified").on(table.verifiedByEcpId),
]);

// Test Rooms table - Enhanced with scheduling & equipment tracking
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
]);

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
]);

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
]);

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
]);

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
});

export const invoiceLineItems = pgTable("invoice_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id),
  productId: varchar("product_id").references(() => products.id),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

export const upsertUserSchema = createInsertSchema(users);
export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  customerNumber: true,  // Auto-generated
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  orderDate: true,
  completedAt: true,
  patientId: true,
  ecpId: true,
}).extend({
  patientName: z.string().min(1, "Patient name is required"),
  patientDOB: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "in_production", "quality_check", "shipped", "completed", "on_hold", "cancelled"]),
});

export const insertConsultLogSchema = createInsertSchema(consultLogs).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
  labResponse: true,
  status: true,
  ecpId: true,
});

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

export const insertEyeExaminationSchema = createInsertSchema(eyeExaminations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  ecpId: true,
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
  ecpId: true,
  isSigned: true,
  signedByEcpId: true,
  digitalSignature: true,
  signedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  ecpId: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  invoiceNumber: true,
  createdAt: true,
  updatedAt: true,
  ecpId: true,
});

export const insertInvoiceLineItemSchema = createInsertSchema(invoiceLineItems).omit({
  id: true,
  createdAt: true,
  invoiceId: true,
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
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

export type InsertConsultLog = z.infer<typeof insertConsultLogSchema>;
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

export type UserRole = typeof userRoles.$inferSelect;
export type UserWithRoles = User & {
  availableRoles: string[];
};

export type InsertEyeExamination = z.infer<typeof insertEyeExaminationSchema>;
export type EyeExamination = typeof eyeExaminations.$inferSelect;

export type EyeExaminationWithDetails = EyeExamination & {
  patient: Patient;
  ecp: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
};

export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
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

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertInvoiceLineItem = z.infer<typeof insertInvoiceLineItemSchema>;
export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;

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
]);

// Validation Schemas for AI Engine

// Prescription data (from order)
export const prescriptionDataSchema = z.object({
  odSphere: z.string().optional(),
  odCylinder: z.string().optional(),
  odAxis: z.string().optional(),
  odAdd: z.string().optional(),
  osSphere: z.string().optional(),
  osCylinder: z.string().optional(),
  osAxis: z.string().optional(),
  osAdd: z.string().optional(),
  pd: z.string().optional(),
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
export const insertCompanySchema = createInsertSchema(companies);
export const updateCompanySchema = insertCompanySchema.partial();

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

// Company-Supplier relationship schemas
export const insertCompanySupplierRelationshipSchema = createInsertSchema(companySupplierRelationships);

export type CompanySupplierRelationship = typeof companySupplierRelationships.$inferSelect;
export type InsertCompanySupplierRelationship = typeof companySupplierRelationships.$inferInsert;

// AI Conversation schemas
export const insertAiConversationSchema = createInsertSchema(aiConversations);
export const updateAiConversationSchema = insertAiConversationSchema.partial();

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = typeof aiConversations.$inferInsert;

// AI Message schemas
export const insertAiMessageSchema = createInsertSchema(aiMessages);

export type AiMessage = typeof aiMessages.$inferSelect;
export type InsertAiMessage = typeof aiMessages.$inferInsert;

// AI Knowledge Base schemas
export const insertAiKnowledgeBaseSchema = createInsertSchema(aiKnowledgeBase);
export const updateAiKnowledgeBaseSchema = insertAiKnowledgeBaseSchema.partial();

export type AiKnowledgeBase = typeof aiKnowledgeBase.$inferSelect;
export type InsertAiKnowledgeBase = typeof aiKnowledgeBase.$inferInsert;

// AI Learning Data schemas
export const insertAiLearningDataSchema = createInsertSchema(aiLearningData);
export const updateAiLearningDataSchema = insertAiLearningDataSchema.partial();

export type AiLearningData = typeof aiLearningData.$inferSelect;
export type InsertAiLearningData = typeof aiLearningData.$inferInsert;

// AI Feedback schemas
export const insertAiFeedbackSchema = createInsertSchema(aiFeedback);

export type AiFeedback = typeof aiFeedback.$inferSelect;
export type InsertAiFeedback = typeof aiFeedback.$inferInsert;

// Permission schemas
export const insertPermissionSchema = createInsertSchema(permissions);
export const updatePermissionSchema = insertPermissionSchema.partial();

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

// Role Permission schemas
export const insertRolePermissionSchema = createInsertSchema(rolePermissions);

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;

// User Custom Permission schemas
export const insertUserCustomPermissionSchema = createInsertSchema(userCustomPermissions);

export type UserCustomPermission = typeof userCustomPermissions.$inferSelect;
export type InsertUserCustomPermission = typeof userCustomPermissions.$inferInsert;

// Dynamic Roles schemas
export const insertDynamicRoleSchema = createInsertSchema(dynamicRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateDynamicRoleSchema = insertDynamicRoleSchema.partial();

export type DynamicRole = typeof dynamicRoles.$inferSelect;
export type InsertDynamicRole = z.infer<typeof insertDynamicRoleSchema>;

// Dynamic Role Permissions schemas
export const insertDynamicRolePermissionSchema = createInsertSchema(dynamicRolePermissions).omit({
  id: true,
  createdAt: true,
});

export type DynamicRolePermission = typeof dynamicRolePermissions.$inferSelect;
export type InsertDynamicRolePermission = z.infer<typeof insertDynamicRolePermissionSchema>;

// User Dynamic Roles schemas
export const insertUserDynamicRoleSchema = createInsertSchema(userDynamicRoles).omit({
  id: true,
  assignedAt: true,
});

export type UserDynamicRole = typeof userDynamicRoles.$inferSelect;
export type InsertUserDynamicRole = z.infer<typeof insertUserDynamicRoleSchema>;

// Role Change Audit schemas
export const insertRoleChangeAuditSchema = createInsertSchema(roleChangeAudit).omit({
  id: true,
  changedAt: true,
});

export type RoleChangeAudit = typeof roleChangeAudit.$inferSelect;
export type InsertRoleChangeAudit = z.infer<typeof insertRoleChangeAuditSchema>;

// Audit Log schemas
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Test Rooms schemas
export const insertTestRoomSchema = createInsertSchema(testRooms);
export const updateTestRoomSchema = insertTestRoomSchema.partial();

export type TestRoom = typeof testRooms.$inferSelect;
export type InsertTestRoom = typeof testRooms.$inferInsert;

// Test Room Bookings schemas
export const insertTestRoomBookingSchema = createInsertSchema(testRoomBookings);
export const updateTestRoomBookingSchema = insertTestRoomBookingSchema.partial();

export type TestRoomBooking = typeof testRoomBookings.$inferSelect;
export type InsertTestRoomBooking = typeof testRoomBookings.$inferInsert;

// GOC Compliance Checks schemas
export const insertGocComplianceCheckSchema = createInsertSchema(gocComplianceChecks);
export const updateGocComplianceCheckSchema = insertGocComplianceCheckSchema.partial();

export type GocComplianceCheck = typeof gocComplianceChecks.$inferSelect;
export type InsertGocComplianceCheck = typeof gocComplianceChecks.$inferInsert;

// Prescription Templates schemas
export const insertPrescriptionTemplateSchema = createInsertSchema(prescriptionTemplates);
export const updatePrescriptionTemplateSchema = insertPrescriptionTemplateSchema.partial();

export type PrescriptionTemplate = typeof prescriptionTemplates.$inferSelect;
export type InsertPrescriptionTemplate = typeof prescriptionTemplates.$inferInsert;

// Clinical Protocols schemas
export const insertClinicalProtocolSchema = createInsertSchema(clinicalProtocols);
export const updateClinicalProtocolSchema = insertClinicalProtocolSchema.partial();

export type ClinicalProtocol = typeof clinicalProtocols.$inferSelect;
export type InsertClinicalProtocol = typeof clinicalProtocols.$inferInsert;

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
]);

// Product Variants for SKU management
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
]);

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
]);

// Email logs - all sent emails with tracking
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
]);

// Email tracking events - detailed event log for analytics
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
]);

// Insert and validation schemas
export const insertInventoryMovementSchema = createInsertSchema(inventoryMovements, {
  quantity: z.number().int().refine(val => val !== 0, {
    message: 'Quantity cannot be zero',
  }),
  movementType: z.enum(["sale", "refund", "adjustment", "received", "transfer_out", "transfer_in", "damaged", "initial"]),
});

export const insertProductVariantSchema = createInsertSchema(productVariants, {
  variantSku: z.string().min(1, "Variant SKU is required"),
  variantName: z.string().min(1, "Variant name is required"),
});

export const updateProductVariantSchema = insertProductVariantSchema.partial();

export const insertLowStockAlertSchema = createInsertSchema(lowStockAlerts, {
  alertType: z.enum(["low_stock", "out_of_stock", "reorder_point"]),
  currentStock: z.number().int().min(0),
  threshold: z.number().int().min(0),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates, {
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  htmlContent: z.string().min(1, "HTML content is required"),
  emailType: z.enum(["invoice", "receipt", "prescription_reminder", "recall_notification", "appointment_reminder", "order_confirmation", "order_update", "marketing", "general"]),
});

export const updateEmailTemplateSchema = insertEmailTemplateSchema.partial();

export const insertEmailLogSchema = createInsertSchema(emailLogs, {
  recipientEmail: z.string().email("Valid email is required"),
  subject: z.string().min(1, "Subject is required"),
  htmlContent: z.string().min(1, "HTML content is required"),
  emailType: z.enum(["invoice", "receipt", "prescription_reminder", "recall_notification", "appointment_reminder", "order_confirmation", "order_update", "marketing", "general"]),
});

export const insertEmailTrackingEventSchema = createInsertSchema(emailTrackingEvents, {
  eventType: z.enum(["sent", "delivered", "opened", "clicked", "bounced", "spam", "unsubscribed"]),
});

// Type exports
export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type InsertInventoryMovement = typeof inventoryMovements.$inferInsert;

export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = typeof productVariants.$inferInsert;

export type LowStockAlert = typeof lowStockAlerts.$inferSelect;
export type InsertLowStockAlert = typeof lowStockAlerts.$inferInsert;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

export type EmailTrackingEvent = typeof emailTrackingEvents.$inferSelect;
export type InsertEmailTrackingEvent = typeof emailTrackingEvents.$inferInsert;

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
]);

export const insertAiNotificationSchema = createInsertSchema(aiNotifications, {
  type: z.enum(["briefing", "alert", "reminder", "insight"]),
  priority: z.enum(["critical", "high", "medium", "low"]),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
});

export const updateAiNotificationSchema = insertAiNotificationSchema.partial();

export type AiNotification = typeof aiNotifications.$inferSelect;
export type InsertAiNotification = typeof aiNotifications.$inferInsert;

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
]);

/**
 * Frame Recommendations Table
 * Stores AI-generated frame recommendations for patients
 */
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
]);

/**
 * Frame Recommendation Analytics Table
 * Tracks performance of frame recommendations
 */
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
]);

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
export type InsertFrameCharacteristics = typeof frameCharacteristics.$inferInsert;
export type FrameRecommendation = typeof frameRecommendations.$inferSelect;
export type InsertFrameRecommendation = typeof frameRecommendations.$inferInsert;
export type FrameRecommendationAnalytics = typeof frameRecommendationAnalytics.$inferSelect;
export type InsertFrameRecommendationAnalytics = typeof frameRecommendationAnalytics.$inferInsert;

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
]);

/**
 * NHS Contract Details
 * Practice-level NHS contract information
 */
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
]);

/**
 * NHS Claims
 * GOS sight test claims submitted to PCSE
 */
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

  // Claim Submission
  status: nhsClaimStatusEnum("status").notNull().default("draft"),
  submittedAt: timestamp("submitted_at"),
  submittedBy: varchar("submitted_by", { length: 255 }).references(() => users.id),

  // PCSE Response
  pcseReference: varchar("pcse_reference", { length: 100 }),
  pcseStatus: varchar("pcse_status", { length: 50 }),
  pcseResponse: jsonb("pcse_response"),
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
}, (table) => [
  index("idx_nhs_claims_company").on(table.companyId),
  index("idx_nhs_claims_patient").on(table.patientId),
  index("idx_nhs_claims_examination").on(table.examinationId),
  index("idx_nhs_claims_practitioner").on(table.practitionerId),
  index("idx_nhs_claims_status").on(table.status),
  index("idx_nhs_claims_date").on(table.claimDate),
]);

/**
 * NHS Vouchers
 * Optical vouchers for glasses/contact lenses
 */
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
]);

/**
 * NHS Patient Exemptions
 * Track patient NHS exemption status
 */
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
]);

/**
 * NHS Payments
 * Track PCSE payments received
 */
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
]);

// Zod schemas for NHS
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
});

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
});

// Export types
export type NhsPractitioner = typeof nhsPractitioners.$inferSelect;
export type InsertNhsPractitioner = typeof nhsPractitioners.$inferInsert;
export type NhsContractDetails = typeof nhsContractDetails.$inferSelect;
export type InsertNhsContractDetails = typeof nhsContractDetails.$inferInsert;
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

// Contact Lens Enums
export const clWearingScheduleEnum = pgEnum("cl_wearing_schedule", [
  "daily_wear",
  "extended_wear",
  "continuous_wear",
  "occasional_wear"
]);

export const clReplacementScheduleEnum = pgEnum("cl_replacement_schedule", [
  "daily_disposable",
  "two_weekly",
  "monthly",
  "quarterly",
  "yearly"
]);

export const clLensTypeEnum = pgEnum("cl_lens_type", [
  "soft",
  "rigid_gas_permeable",
  "hybrid",
  "scleral",
  "orthokeratology"
]);

export const clDesignEnum = pgEnum("cl_design", [
  "spherical",
  "toric",
  "multifocal",
  "monovision",
  "custom"
]);

export const clFitAssessmentEnum = pgEnum("cl_fit_assessment", [
  "optimal",
  "acceptable",
  "too_tight",
  "too_loose",
  "decentered"
]);

export const clAftercareStatusEnum = pgEnum("cl_aftercare_status", [
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
  "rescheduled"
]);

/**
 * Contact Lens Assessments
 * Initial patient evaluation for contact lens suitability
 */
export const contactLensAssessments = pgTable("contact_lens_assessments", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id", { length: 255 }).notNull().references(() => patients.id),
  practitionerId: varchar("practitioner_id", { length: 255 }).references(() => users.id),

  // Assessment Details
  assessmentDate: date("assessment_date").notNull(),

  // Patient History
  previousClWearer: boolean("previous_cl_wearer").notNull().default(false),
  previousClType: varchar("previous_cl_type", { length: 100 }),
  reasonForDiscontinuation: text("reason_for_discontinuation"),

  // Motivation & Lifestyle
  motivationReason: text("motivation_reason"), // Sports, cosmetic, occupational, etc.
  occupation: varchar("occupation", { length: 255 }),
  hobbies: text("hobbies"),
  screenTime: varchar("screen_time", { length: 50 }), // Low, moderate, high

  // Medical Suitability
  dryEyes: boolean("dry_eyes").default(false),
  allergies: text("allergies"),
  medications: text("medications"),
  contraindications: text("contraindications"),

  // Ocular Assessment
  tearQuality: varchar("tear_quality", { length: 50 }), // Good, fair, poor
  tearBreakupTime: decimal("tear_breakup_time", { precision: 4, scale: 1 }), // seconds
  corneaCondition: text("cornea_condition"),
  conjunctivaCondition: text("conjunctiva_condition"),
  lidsCondition: text("lids_condition"),

  // Recommendation
  suitable: boolean("suitable").notNull(),
  recommendedLensType: clLensTypeEnum("recommended_lens_type"),
  recommendedWearingSchedule: clWearingScheduleEnum("recommended_wearing_schedule"),
  notes: text("notes"),

  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("cl_assessments_company_idx").on(table.companyId),
  index("cl_assessments_patient_idx").on(table.patientId),
  index("cl_assessments_date_idx").on(table.assessmentDate),
]);

/**
 * Contact Lens Fittings
 * Trial lens fitting records
 */
export const contactLensFittings = pgTable("contact_lens_fittings", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id", { length: 255 }).notNull().references(() => patients.id),
  assessmentId: varchar("assessment_id", { length: 255 }).references(() => contactLensAssessments.id),
  practitionerId: varchar("practitioner_id", { length: 255 }).references(() => users.id),

  // Fitting Details
  fittingDate: date("fitting_date").notNull(),
  eye: varchar("eye", { length: 2 }).notNull(), // OD or OS

  // Trial Lens Details
  trialLensBrand: varchar("trial_lens_brand", { length: 255 }).notNull(),
  trialLensType: clLensTypeEnum("trial_lens_type").notNull(),
  trialBaseCurve: decimal("trial_base_curve", { precision: 4, scale: 2 }), // mm
  trialDiameter: decimal("trial_diameter", { precision: 4, scale: 1 }), // mm
  trialPower: decimal("trial_power", { precision: 5, scale: 2 }), // D
  trialCylinder: decimal("trial_cylinder", { precision: 5, scale: 2 }), // D (for toric)
  trialAxis: integer("trial_axis"), // degrees (for toric)
  trialAddition: decimal("trial_addition", { precision: 3, scale: 2 }), // D (for multifocal)

  // Over-Refraction
  overRefractionSphere: decimal("over_refraction_sphere", { precision: 5, scale: 2 }),
  overRefractionCylinder: decimal("over_refraction_cylinder", { precision: 5, scale: 2 }),
  overRefractionAxis: integer("over_refraction_axis"),

  // Fit Assessment
  centration: varchar("centration", { length: 50 }), // Central, superior, inferior, temporal, nasal
  movement: varchar("movement", { length: 50 }), // Optimal, excessive, insufficient
  coverage: varchar("coverage", { length: 50 }), // Full, partial
  comfort: varchar("comfort", { length: 50 }), // Excellent, good, fair, poor
  fitAssessment: clFitAssessmentEnum("fit_assessment").notNull(),

  // Vision Assessment
  distanceVision: varchar("distance_vision", { length: 10 }), // e.g., "6/6", "20/20"
  nearVision: varchar("near_vision", { length: 10 }),

  // Final Lens Parameters (if different from trial)
  finalBaseCurve: decimal("final_base_curve", { precision: 4, scale: 2 }),
  finalDiameter: decimal("final_diameter", { precision: 4, scale: 1 }),
  finalPower: decimal("final_power", { precision: 5, scale: 2 }),
  finalCylinder: decimal("final_cylinder", { precision: 5, scale: 2 }),
  finalAxis: integer("final_axis"),
  finalAddition: decimal("final_addition", { precision: 3, scale: 2 }),

  // Teaching & Handling
  insertionTaught: boolean("insertion_taught").default(false),
  removalTaught: boolean("removal_taught").default(false),
  careTaught: boolean("care_taught").default(false),
  patientDemonstrated: boolean("patient_demonstrated").default(false),

  notes: text("notes"),

  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("cl_fittings_company_idx").on(table.companyId),
  index("cl_fittings_patient_idx").on(table.patientId),
  index("cl_fittings_date_idx").on(table.fittingDate),
]);

/**
 * Contact Lens Prescriptions
 * Final CL prescription records
 */
export const contactLensPrescriptions = pgTable("contact_lens_prescriptions", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id", { length: 255 }).notNull().references(() => patients.id),
  fittingId: varchar("fitting_id", { length: 255 }).references(() => contactLensFittings.id),
  practitionerId: varchar("practitioner_id", { length: 255 }).references(() => users.id),

  // Prescription Details
  prescriptionDate: date("prescription_date").notNull(),
  expiryDate: date("expiry_date"), // Usually 12 months from issue date

  // Right Eye (OD)
  odBrand: varchar("od_brand", { length: 255 }).notNull(),
  odLensType: clLensTypeEnum("od_lens_type").notNull(),
  odDesign: clDesignEnum("od_design").notNull(),
  odBaseCurve: decimal("od_base_curve", { precision: 4, scale: 2 }).notNull(),
  odDiameter: decimal("od_diameter", { precision: 4, scale: 1 }).notNull(),
  odPower: decimal("od_power", { precision: 5, scale: 2 }).notNull(),
  odCylinder: decimal("od_cylinder", { precision: 5, scale: 2 }),
  odAxis: integer("od_axis"),
  odAddition: decimal("od_addition", { precision: 3, scale: 2 }),
  odColor: varchar("od_color", { length: 100 }), // For cosmetic lenses

  // Left Eye (OS)
  osBrand: varchar("os_brand", { length: 255 }).notNull(),
  osLensType: clLensTypeEnum("os_lens_type").notNull(),
  osDesign: clDesignEnum("os_design").notNull(),
  osBaseCurve: decimal("os_base_curve", { precision: 4, scale: 2 }).notNull(),
  osDiameter: decimal("os_diameter", { precision: 4, scale: 1 }).notNull(),
  osPower: decimal("os_power", { precision: 5, scale: 2 }).notNull(),
  osCylinder: decimal("os_cylinder", { precision: 5, scale: 2 }),
  osAxis: integer("os_axis"),
  osAddition: decimal("os_addition", { precision: 3, scale: 2 }),
  osColor: varchar("os_color", { length: 100 }),

  // Wearing Instructions
  wearingSchedule: clWearingScheduleEnum("wearing_schedule").notNull(),
  replacementSchedule: clReplacementScheduleEnum("replacement_schedule").notNull(),
  maxWearingTime: integer("max_wearing_time"), // hours per day

  // Care System Recommendation
  careSystemBrand: varchar("care_system_brand", { length: 255 }),
  careSystemType: varchar("care_system_type", { length: 100 }), // Multipurpose, peroxide, etc.

  // Follow-up Schedule
  firstFollowUpDate: date("first_follow_up_date"), // Usually 1 day
  weekFollowUpDate: date("week_follow_up_date"), // Usually 1 week
  monthFollowUpDate: date("month_follow_up_date"), // Usually 1 month

  // Special Instructions
  specialInstructions: text("special_instructions"),
  notes: text("notes"),

  // NHS Funding (if applicable)
  nhsFunded: boolean("nhs_funded").default(false),
  nhsExemptionId: varchar("nhs_exemption_id", { length: 255 }).references(() => nhsPatientExemptions.id),

  // Status
  isActive: boolean("is_active").notNull().default(true),

  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("cl_prescriptions_company_idx").on(table.companyId),
  index("cl_prescriptions_patient_idx").on(table.patientId),
  index("cl_prescriptions_date_idx").on(table.prescriptionDate),
  index("cl_prescriptions_active_idx").on(table.isActive),
]);

/**
 * Contact Lens Aftercare
 * Follow-up appointments and monitoring
 */
export const contactLensAftercare = pgTable("contact_lens_aftercare", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id", { length: 255 }).notNull().references(() => patients.id),
  prescriptionId: varchar("prescription_id", { length: 255 }).references(() => contactLensPrescriptions.id),
  practitionerId: varchar("practitioner_id", { length: 255 }).references(() => users.id),

  // Appointment Details
  appointmentDate: date("appointment_date").notNull(),
  appointmentType: varchar("appointment_type", { length: 50 }).notNull(), // Initial, routine, problem
  status: clAftercareStatusEnum("status").notNull().default("scheduled"),

  // Compliance Check
  wearingTimeCompliance: varchar("wearing_time_compliance", { length: 50 }), // Good, fair, poor
  replacementCompliance: varchar("replacement_compliance", { length: 50 }),
  careSystemCompliance: varchar("care_system_compliance", { length: 50 }),
  sleepingInLenses: boolean("sleeping_in_lenses"),
  waterExposure: boolean("water_exposure"),

  // Clinical Assessment
  visualAcuityOD: varchar("visual_acuity_od", { length: 10 }),
  visualAcuityOS: varchar("visual_acuity_os", { length: 10 }),
  comfort: varchar("comfort", { length: 50 }),
  lensConditionOD: varchar("lens_condition_od", { length: 100 }),
  lensConditionOS: varchar("lens_condition_os", { length: 100 }),
  fitAssessmentOD: clFitAssessmentEnum("fit_assessment_od"),
  fitAssessmentOS: clFitAssessmentEnum("fit_assessment_os"),

  // Ocular Health
  corneaHealthOD: varchar("cornea_health_od", { length: 100 }),
  corneaHealthOS: varchar("cornea_health_os", { length: 100 }),
  conjunctivaHealthOD: varchar("conjunctiva_health_od", { length: 100 }),
  conjunctivaHealthOS: varchar("conjunctiva_health_os", { length: 100 }),

  // Problems Reported
  problemsReported: text("problems_reported"),
  adverseEvents: text("adverse_events"),

  // Actions Taken
  prescriptionChanged: boolean("prescription_changed").default(false),
  lensesReplaced: boolean("lenses_replaced").default(false),
  careSystemChanged: boolean("care_system_changed").default(false),
  additionalTraining: boolean("additional_training").default(false),
  referralMade: boolean("referral_made").default(false),

  // Next Appointment
  nextAppointmentDate: date("next_appointment_date"),
  nextAppointmentReason: text("next_appointment_reason"),

  notes: text("notes"),

  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("cl_aftercare_company_idx").on(table.companyId),
  index("cl_aftercare_patient_idx").on(table.patientId),
  index("cl_aftercare_date_idx").on(table.appointmentDate),
  index("cl_aftercare_status_idx").on(table.status),
]);

/**
 * Contact Lens Inventory
 * Stock management for contact lenses
 */
export const contactLensInventory = pgTable("contact_lens_inventory", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),

  // Product Details
  brand: varchar("brand", { length: 255 }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  lensType: clLensTypeEnum("lens_type").notNull(),
  design: clDesignEnum("design").notNull(),
  replacementSchedule: clReplacementScheduleEnum("replacement_schedule").notNull(),

  // Parameters
  baseCurve: decimal("base_curve", { precision: 4, scale: 2 }).notNull(),
  diameter: decimal("diameter", { precision: 4, scale: 1 }).notNull(),
  power: decimal("power", { precision: 5, scale: 2 }).notNull(),
  cylinder: decimal("cylinder", { precision: 5, scale: 2 }),
  axis: integer("axis"),
  addition: decimal("addition", { precision: 3, scale: 2 }),

  // Stock Management
  quantityInStock: integer("quantity_in_stock").notNull().default(0),
  reorderLevel: integer("reorder_level").notNull().default(5),
  reorderQuantity: integer("reorder_quantity").notNull().default(10),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  retailPrice: decimal("retail_price", { precision: 10, scale: 2 }),

  // Supplier Information
  supplierId: varchar("supplier_id", { length: 255 }),
  supplierProductCode: varchar("supplier_product_code", { length: 100 }),

  // Product Information
  expiryDate: date("expiry_date"),
  batchNumber: varchar("batch_number", { length: 100 }),

  // Status
  isActive: boolean("is_active").notNull().default(true),
  isTrialLens: boolean("is_trial_lens").default(false),

  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("cl_inventory_company_idx").on(table.companyId),
  index("cl_inventory_brand_idx").on(table.brand),
  index("cl_inventory_stock_idx").on(table.quantityInStock),
  index("cl_inventory_active_idx").on(table.isActive),
  uniqueIndex("cl_inventory_unique").on(
    table.companyId,
    table.brand,
    table.baseCurve,
    table.diameter,
    table.power,
    table.cylinder,
    table.axis,
    table.addition
  ),
]);

/**
 * Contact Lens Orders
 * Patient orders for contact lenses
 */
export const contactLensOrders = pgTable("contact_lens_orders", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id", { length: 255 }).notNull().references(() => patients.id),
  prescriptionId: varchar("prescription_id", { length: 255 }).references(() => contactLensPrescriptions.id),

  // Order Details
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  orderDate: date("order_date").notNull(),

  // Right Eye Order
  odInventoryId: varchar("od_inventory_id", { length: 255 }).references(() => contactLensInventory.id),
  odQuantity: integer("od_quantity").notNull(),
  odUnitPrice: decimal("od_unit_price", { precision: 10, scale: 2 }).notNull(),

  // Left Eye Order
  osInventoryId: varchar("os_inventory_id", { length: 255 }).references(() => contactLensInventory.id),
  osQuantity: integer("os_quantity").notNull(),
  osUnitPrice: decimal("os_unit_price", { precision: 10, scale: 2 }).notNull(),

  // Care System (if ordered)
  careSystemInventoryId: varchar("care_system_inventory_id", { length: 255 }),
  careSystemQuantity: integer("care_system_quantity"),
  careSystemPrice: decimal("care_system_price", { precision: 10, scale: 2 }),

  // Pricing
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),

  // NHS Funding
  nhsFunded: boolean("nhs_funded").default(false),
  nhsVoucherId: varchar("nhs_voucher_id", { length: 255 }), // If applicable

  // Status
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, ordered, received, dispensed
  orderedDate: date("ordered_date"),
  receivedDate: date("received_date"),
  dispensedDate: date("dispensed_date"),

  notes: text("notes"),

  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("cl_orders_company_idx").on(table.companyId),
  index("cl_orders_patient_idx").on(table.patientId),
  index("cl_orders_date_idx").on(table.orderDate),
  index("cl_orders_status_idx").on(table.status),
]);

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
export type ContactLensAssessment = typeof contactLensAssessments.$inferSelect;
export type InsertContactLensAssessment = typeof contactLensAssessments.$inferInsert;
export type ContactLensFitting = typeof contactLensFittings.$inferSelect;
export type InsertContactLensFitting = typeof contactLensFittings.$inferInsert;
export type ContactLensPrescription = typeof contactLensPrescriptions.$inferSelect;
export type InsertContactLensPrescription = typeof contactLensPrescriptions.$inferInsert;
export type ContactLensAftercare = typeof contactLensAftercare.$inferSelect;
export type InsertContactLensAftercare = typeof contactLensAftercare.$inferInsert;
export type ContactLensInventoryItem = typeof contactLensInventory.$inferSelect;
export type InsertContactLensInventoryItem = typeof contactLensInventory.$inferInsert;
export type ContactLensOrder = typeof contactLensOrders.$inferSelect;
export type InsertContactLensOrder = typeof contactLensOrders.$inferInsert;

