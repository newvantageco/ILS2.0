/**
 * Core Schema - Foundation Tables
 *
 * Core tables that form the foundation of the multi-tenant architecture:
 * - companies: Root multi-tenant table
 * - users: Authentication and user management
 * - sessions: Session storage for authentication
 * - userRoles: Many-to-many user-role assignments
 *
 * These tables are referenced by virtually all other domains and must be
 * extracted first to enable proper modular schema organization.
 *
 * @module shared/schema/core/tables
 */

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, integer, decimal, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import {
  roleEnum,
  accountStatusEnum,
  subscriptionPlanEnum,
  companyTypeEnum,
  companyStatusEnum,
} from "./enums";

// ============================================
// COMPANIES - Root Multi-Tenant Table
// ============================================

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

// ============================================
// USERS - Authentication & User Management
// ============================================

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
});

// ============================================
// SESSIONS - Authentication Session Storage
// ============================================

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

// ============================================
// USER ROLES - Many-to-Many Role Assignments
// ============================================

export const userRoles = pgTable("user_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: roleEnum("role").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
}, (table) => [
  index("idx_user_roles_user_id").on(table.userId),
]);
