import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, pgEnum, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["ecp", "admin", "lab_tech", "engineer", "supplier", "platform_admin", "company_admin"]);
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

export const userRoleEnum = pgEnum("user_role", ["ecp", "lab_tech", "engineer", "supplier", "admin", "platform_admin", "company_admin"]);
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
  name: varchar("name").notNull(),
  model: varchar("model").notNull(),
  serialNumber: varchar("serial_number").notNull(),
  status: equipmentStatusEnum("status").notNull().default("operational"),
  lastMaintenance: timestamp("last_maintenance"),
  nextMaintenance: timestamp("next_maintenance"),
  specifications: jsonb("specifications"),
  location: varchar("location"),
  purchaseDate: timestamp("purchase_date"),
  warrantyExpiration: timestamp("warranty_expiration"),
  maintenanceHistory: jsonb("maintenance_history").default('[]'),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
  shopifyAccessToken: varchar("shopify_access_token"), // Encrypted in production
  shopifyApiVersion: varchar("shopify_api_version").default("2024-10"),
  shopifyAutoSync: boolean("shopify_auto_sync").default(false), // Auto-sync customers as patients
  shopifyLastSyncAt: timestamp("shopify_last_sync_at"),
  shopifySyncSettings: jsonb("shopify_sync_settings").default(sql`'{}'::jsonb`), // Sync preferences
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerNumber: varchar("customer_number", { length: 20 }).notNull().unique(),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  dateOfBirth: text("date_of_birth"),
  email: varchar("email"),
  nhsNumber: varchar("nhs_number"),
  fullAddress: jsonb("full_address"),
  customerReferenceLabel: text("customer_reference_label"),
  customerReferenceNumber: text("customer_reference_number"),
  ecpId: varchar("ecp_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  
  orderDate: timestamp("order_date").defaultNow().notNull(),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
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
  medicalHistory: jsonb("medical_history"),
  visualAcuity: jsonb("visual_acuity"),
  refraction: jsonb("refraction"),
  binocularVision: jsonb("binocular_vision"),
  eyeHealth: jsonb("eye_health"),
  equipmentReadings: jsonb("equipment_readings"), // Store equipment measurement data
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
  // Digital signature
  isSigned: boolean("is_signed").default(false).notNull(),
  signedByEcpId: varchar("signed_by_ecp_id").references(() => users.id),
  digitalSignature: text("digital_signature"),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  ecpId: varchar("ecp_id").notNull().references(() => users.id),
  productType: productTypeEnum("product_type").notNull(),
  sku: text("sku"),
  brand: text("brand"),
  model: text("model"),
  stockQuantity: integer("stock_quantity").default(0).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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

