/**
 * Billing Domain Schema
 *
 * Tables for billing and payment management including:
 * - Invoices and line items
 * - Payments
 * - Subscription plans
 * - Stripe payment intents
 * - Billing codes
 *
 * @module shared/schema/billing
 */

import { pgTable, text, varchar, timestamp, jsonb, index, pgEnum, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";

// ============================================
// BILLING ENUMS
// ============================================

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

// ============================================
// SUBSCRIPTION PLANS
// ============================================

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

// ============================================
// STRIPE PAYMENT INTENTS
// ============================================

export const stripePaymentIntents = pgTable("stripe_payment_intents", {
  id: varchar("id", { length: 255 }).primaryKey(),
  companyId: varchar("company_id", { length: 255 }).notNull(),
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

// ============================================
// SUBSCRIPTION HISTORY
// ============================================

export const subscriptionHistory = pgTable("subscription_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(), // created, updated, cancelled, expired, trial_ended
  oldPlan: varchar("old_plan", { length: 50 }),
  newPlan: varchar("new_plan", { length: 50 }),
  changedBy: varchar("changed_by", { length: 255 }),
  reason: text("reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_subscription_history_company").on(table.companyId),
  index("idx_subscription_history_event").on(table.eventType),
]);

// ============================================
// INVOICES
// ============================================

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  companyId: varchar("company_id").notNull(),
  patientId: varchar("patient_id"),
  ecpId: varchar("ecp_id").notNull(),
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
}, (table) => [
  index("idx_invoices_company").on(table.companyId),
  index("idx_invoices_patient").on(table.patientId),
  index("idx_invoices_ecp").on(table.ecpId),
  index("idx_invoices_status").on(table.status),
]);

// ============================================
// INVOICE LINE ITEMS
// ============================================

export const invoiceLineItems = pgTable("invoice_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull(),
  productId: varchar("product_id"),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_invoice_line_items_invoice").on(table.invoiceId),
]);

// ============================================
// PAYMENTS
// ============================================

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  patientId: varchar("patient_id"),
  claimId: varchar("claim_id"),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentSource: varchar("payment_source", { length: 50 }),
  checkNumber: varchar("check_number", { length: 50 }),
  referenceNumber: varchar("reference_number", { length: 100 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  processedDate: timestamp("processed_date"),
  notes: text("notes"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_payments_company").on(table.companyId),
  index("idx_payments_patient").on(table.patientId),
  index("idx_payments_claim").on(table.claimId),
  index("idx_payments_status").on(table.status),
]);

// ============================================
// BILLING CODES
// ============================================

export const billingCodes = pgTable("billing_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
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
}, (table) => [
  index("idx_billing_codes_company").on(table.companyId),
  index("idx_billing_codes_code").on(table.code),
  index("idx_billing_codes_type").on(table.codeType),
]);

// ============================================
// ZOD SCHEMAS
// ============================================

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);
export const insertStripePaymentIntentSchema = createInsertSchema(stripePaymentIntents);
export const insertSubscriptionHistorySchema = createInsertSchema(subscriptionHistory);
export const insertInvoiceSchema = createInsertSchema(invoices);
export const insertInvoiceLineItemSchema = createInsertSchema(invoiceLineItems);
export const insertPaymentSchema = createInsertSchema(payments);
export const insertBillingCodeSchema = createInsertSchema(billingCodes);

// ============================================
// TYPES
// ============================================

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type StripePaymentIntent = typeof stripePaymentIntents.$inferSelect;
export type InsertStripePaymentIntent = typeof stripePaymentIntents.$inferInsert;
export type SubscriptionHistory = typeof subscriptionHistory.$inferSelect;
export type InsertSubscriptionHistory = typeof subscriptionHistory.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type InsertInvoiceLineItem = typeof invoiceLineItems.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type BillingCode = typeof billingCodes.$inferSelect;
export type InsertBillingCode = typeof billingCodes.$inferInsert;
