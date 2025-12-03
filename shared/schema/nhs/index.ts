/**
 * NHS Domain Schema
 *
 * Tables for NHS/PCSE integration (UK healthcare) including:
 * - NHS Practitioners (GOC registered)
 * - NHS Contract Details
 * - NHS Claims (GOS sight tests)
 * - NHS Vouchers
 * - NHS Patient Exemptions
 * - NHS Payments
 *
 * @module shared/schema/nhs
 */

import { pgTable, text, varchar, timestamp, jsonb, index, pgEnum, integer, decimal, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod";

// ============================================
// NHS ENUMS
// ============================================

export const nhsGosClaimTypeEnum = pgEnum("nhs_gos_claim_type", [
  "GOS1", // Standard NHS sight test
  "GOS2", // NHS sight test (under 16 or full-time education)
  "GOS3", // Complex NHS sight test
  "GOS4", // Domiciliary NHS sight test
]);

export const nhsClaimStatusEnum = pgEnum("nhs_claim_status", [
  "draft",
  "submitted",
  "accepted",
  "rejected",
  "paid",
  "queried",
]);

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

// ============================================
// NHS PRACTITIONERS
// ============================================

export const nhsPractitioners = pgTable("nhs_practitioners", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),

  // User reference
  userId: varchar("user_id", { length: 255 }).notNull(),
  companyId: varchar("company_id", { length: 255 }).notNull(),

  // GOC Registration
  gocNumber: varchar("goc_number", { length: 20 }).notNull().unique(),
  gocRegistrationType: varchar("goc_registration_type", { length: 50 }).notNull(),
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

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_nhs_practitioners_user").on(table.userId),
  index("idx_nhs_practitioners_company").on(table.companyId),
  index("idx_nhs_practitioners_goc").on(table.gocNumber),
]);

// ============================================
// NHS CONTRACT DETAILS
// ============================================

export const nhsContractDetails = pgTable("nhs_contract_details", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),

  companyId: varchar("company_id", { length: 255 }).notNull().unique(),

  // Contract Details
  contractNumber: varchar("contract_number", { length: 50 }).notNull().unique(),
  contractHolderName: varchar("contract_holder_name", { length: 255 }).notNull(),
  contractStartDate: date("contract_start_date").notNull(),
  contractEndDate: date("contract_end_date"),

  // Practice Details
  odsCode: varchar("ods_code", { length: 20 }).notNull(),
  practiceAddress: jsonb("practice_address").notNull(),

  // PCSE Details
  pcseAccountNumber: varchar("pcse_account_number", { length: 50 }),
  pcseBankDetails: jsonb("pcse_bank_details"),

  // Claim Submission
  claimSubmissionEmail: varchar("claim_submission_email", { length: 255 }),
  claimSubmissionMethod: varchar("claim_submission_method", { length: 50 }),

  // Status
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_nhs_contracts_company").on(table.companyId),
  index("idx_nhs_contracts_ods").on(table.odsCode),
]);

// ============================================
// NHS CLAIMS
// ============================================

export const nhsClaims = pgTable("nhs_claims", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull(),
  patientId: varchar("patient_id", { length: 255 }).notNull(),
  examinationId: varchar("examination_id", { length: 255 }),
  practitionerId: varchar("practitioner_id", { length: 255 }).notNull(),

  // Claim Details
  claimType: nhsGosClaimTypeEnum("claim_type").notNull(),
  claimNumber: varchar("claim_number", { length: 50 }).notNull().unique(),
  claimDate: date("claim_date").notNull(),
  testDate: date("test_date").notNull(),

  // Patient Details
  patientNhsNumber: varchar("patient_nhs_number", { length: 20 }),
  patientExemptionReason: nhsExemptionReasonEnum("patient_exemption_reason"),
  patientExemptionEvidence: varchar("patient_exemption_evidence", { length: 255 }),

  // Clinical Details
  prescriptionIssued: boolean("prescription_issued").notNull().default(false),
  referralMade: boolean("referral_made").notNull().default(false),
  referralUrgency: varchar("referral_urgency", { length: 50 }),
  clinicalNotes: text("clinical_notes"),

  // GOS4 Domiciliary Claims (home visits)
  domiciliaryJustification: text("domiciliary_justification"), // Required for GOS4 claims

  // NHS Voucher (for optical vouchers)
  nhsVoucherCode: varchar("nhs_voucher_code", { length: 20 }),

  // Claim Submission
  status: nhsClaimStatusEnum("status").notNull().default("draft"),
  submittedAt: timestamp("submitted_at"),
  submittedBy: varchar("submitted_by", { length: 255 }),

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
]);

// ============================================
// NHS VOUCHERS
// ============================================

export const nhsVouchers = pgTable("nhs_vouchers", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull(),
  patientId: varchar("patient_id", { length: 255 }).notNull(),
  prescriptionId: varchar("prescription_id", { length: 255 }),
  claimId: varchar("claim_id", { length: 255 }),

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
  status: varchar("status", { length: 50 }).notNull().default("active"),

  // Metadata
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_nhs_vouchers_company").on(table.companyId),
  index("idx_nhs_vouchers_patient").on(table.patientId),
  index("idx_nhs_vouchers_status").on(table.status),
  index("idx_nhs_vouchers_expiry").on(table.expiryDate),
]);

// ============================================
// NHS PATIENT EXEMPTIONS
// ============================================

export const nhsPatientExemptions = pgTable("nhs_patient_exemptions", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull(),
  patientId: varchar("patient_id", { length: 255 }).notNull(),

  // Exemption Details
  exemptionReason: nhsExemptionReasonEnum("exemption_reason").notNull(),
  evidenceType: varchar("evidence_type", { length: 100 }),
  evidenceNumber: varchar("evidence_number", { length: 100 }),
  evidenceDocumentUrl: text("evidence_document_url"),

  // Validity
  validFrom: date("valid_from").notNull(),
  validUntil: date("valid_until"),
  isLifelong: boolean("is_lifelong").default(false),

  // Verification
  verifiedBy: varchar("verified_by", { length: 255 }),
  verifiedAt: timestamp("verified_at"),

  // Status
  isActive: boolean("is_active").notNull().default(true),

  // Metadata
  notes: text("notes"),
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_nhs_exemptions_company").on(table.companyId),
  index("idx_nhs_exemptions_patient").on(table.patientId),
  index("idx_nhs_exemptions_status").on(table.isActive),
  index("idx_nhs_exemptions_expiry").on(table.validUntil),
]);

// ============================================
// NHS PAYMENTS
// ============================================

export const nhsPayments = pgTable("nhs_payments", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull(),

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
  paymentMethod: varchar("payment_method", { length: 50 }),
  bankAccount: varchar("bank_account", { length: 20 }),

  // Reconciliation
  isReconciled: boolean("is_reconciled").notNull().default(false),
  reconciledAt: timestamp("reconciled_at"),
  reconciledBy: varchar("reconciled_by", { length: 255 }),
  discrepancyAmount: decimal("discrepancy_amount", { precision: 10, scale: 2 }),
  discrepancyNotes: text("discrepancy_notes"),

  // Metadata
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_nhs_payments_company").on(table.companyId),
  index("idx_nhs_payments_date").on(table.paymentDate),
  index("idx_nhs_payments_reconciled").on(table.isReconciled),
]);

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
export const nhsClaimsRetryQueue = pgTable("nhs_claims_retry_queue", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),

  // References
  claimId: varchar("claim_id", { length: 255 }).notNull(),
  companyId: varchar("company_id", { length: 255 }).notNull(),

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

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_retry_queue_next_retry").on(table.nextRetryAt),
  index("idx_retry_queue_claim").on(table.claimId),
  index("idx_retry_queue_company").on(table.companyId),
  index("idx_retry_queue_status").on(table.status),
]);

// ============================================
// ZOD SCHEMAS
// ============================================

export const insertNhsPractitionerSchema = createInsertSchema(nhsPractitioners);
export const insertNhsContractDetailsSchema = createInsertSchema(nhsContractDetails);
export const insertNhsClaimSchema = createInsertSchema(nhsClaims);
export const insertNhsVoucherSchema = createInsertSchema(nhsVouchers);
export const insertNhsPatientExemptionSchema = createInsertSchema(nhsPatientExemptions);
export const insertNhsPaymentSchema = createInsertSchema(nhsPayments);
export const insertNhsClaimsRetryQueueSchema = createInsertSchema(nhsClaimsRetryQueue);

// Custom validation schemas
export const createNhsPractitionerSchema = z.object({
  userId: z.string().min(1),
  companyId: z.string().min(1),
  gocNumber: z.string().min(1).max(20),
  gocRegistrationType: z.enum(["optometrist", "dispensing_optician"]),
  gocExpiryDate: z.string(),
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
  testDate: z.string(),
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
});

// ============================================
// TYPES
// ============================================

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
