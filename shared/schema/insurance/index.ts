/**
 * Insurance & Claims Domain Schema
 *
 * Comprehensive Revenue Cycle Management (RCM) system for insurance claims,
 * payers, eligibility verification, and payment tracking.
 *
 * This domain handles:
 * - Insurance payers and companies
 * - Insurance plans and patient insurance
 * - Claims submission and processing (professional, institutional, vision)
 * - Claim line items with procedure codes
 * - Claim batches for bulk submission
 * - Claim appeals and denials
 * - Electronic Remittance Advice (ERA)
 * - Eligibility verifications
 * - Preauthorizations
 * - Medical claims
 * - Billing codes (CPT, HCPCS, ICD-10)
 *
 * @module shared/schema/insurance
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  pgEnum,
  integer,
  decimal,
  boolean,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { companies, users } from "../core/tables";
import { patients } from "../patients";
import { orders } from "../orders";

// ============================================
// INSURANCE & RCM ENUMS
// ============================================

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
  "voided",
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
  "vision",
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
  "assisted_living",
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
  "other",
]);

/**
 * Claim submission method
 * How claims are submitted to payers
 */
export const claimSubmissionMethodEnum = pgEnum("claim_submission_method", [
  "electronic",
  "paper",
  "clearinghouse",
  "portal",
]);

/**
 * Batch submission status
 * Status of claim submission batches
 */
export const batchStatusEnum = pgEnum("batch_status", [
  "processing",
  "completed",
  "failed",
]);

/**
 * Appeal status
 * Status of claim appeals
 */
export const appealStatusEnum = pgEnum("appeal_status", [
  "submitted",
  "pending",
  "approved",
  "denied",
]);

// ============================================
// INSURANCE PAYERS
// ============================================

/**
 * Insurance Payers
 * Stores information about insurance companies and payers
 */
export const insurancePayers = pgTable(
  "insurance_payers",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    companyId: varchar("company_id", { length: 255 })
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),

    // Payer Information
    name: varchar("name", { length: 255 }).notNull(),
    payerId: varchar("payer_id", { length: 100 }).notNull(), // Electronic payer ID
    type: payerTypeEnum("type").notNull(),

    // Contact Information
    contactInfo: jsonb("contact_info"), // { phone, fax, email, address }

    // Configuration
    claimSubmissionMethod: claimSubmissionMethodEnum(
      "claim_submission_method"
    ).default("electronic"),
    timelyFilingLimitDays: integer("timely_filing_limit_days").default(365),

    // Status
    active: boolean("active").default(true),

    // Metadata
    metadata: jsonb("metadata"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("insurance_payers_company_idx").on(table.companyId),
    uniqueIndex("insurance_payers_company_payer_id").on(
      table.companyId,
      table.payerId
    ),
  ]
);

// ============================================
// INSURANCE CLAIMS
// ============================================

/**
 * Insurance Claims
 * Generic insurance claims for US-style RCM
 */
export const insuranceClaims = pgTable(
  "insurance_claims",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // References
    companyId: varchar("company_id", { length: 255 })
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    patientId: varchar("patient_id", { length: 255 }).references(
      () => patients.id
    ),
    payerId: varchar("payer_id", { length: 255 }).references(
      () => insurancePayers.id
    ),

    // Claim Details
    claimNumber: varchar("claim_number", { length: 50 }).notNull().unique(),
    claimType: claimTypeEnum("claim_type").notNull(),
    status: claimStatusEnum("status").notNull().default("draft"),

    // Dates
    serviceDate: date("service_date").notNull(),
    submittedAt: timestamp("submitted_at"),
    processedAt: timestamp("processed_at"),

    // Financial (in cents)
    totalCharges: decimal("total_charges", { precision: 10, scale: 2 }).notNull(),
    allowedAmount: decimal("allowed_amount", { precision: 10, scale: 2 }),
    paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
    patientResponsibility: decimal("patient_responsibility", {
      precision: 10,
      scale: 2,
    }),
    adjustments: decimal("adjustments", { precision: 10, scale: 2 }).default(
      "0"
    ),

    // Provider Information
    renderingProviderId: varchar("rendering_provider_id", { length: 255 }),
    billingProviderId: varchar("billing_provider_id", { length: 255 }),

    // Place of Service
    placeOfService: servicePlaceEnum("place_of_service"),

    // Diagnosis Codes
    diagnosisCodes: jsonb("diagnosis_codes"), // Array of ICD-10 codes

    // Payer Response
    payerResponse: jsonb("payer_response"),
    rejectionReason: text("rejection_reason"),
    remittanceAdviceNumber: varchar("remittance_advice_number", {
      length: 100,
    }),

    // Notes
    notes: text("notes"),

    // Metadata
    metadata: jsonb("metadata"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("insurance_claims_company_idx").on(table.companyId),
    index("insurance_claims_patient_idx").on(table.patientId),
    index("insurance_claims_payer_idx").on(table.payerId),
    index("insurance_claims_status_idx").on(table.status),
    index("insurance_claims_service_date_idx").on(table.serviceDate),
  ]
);

// ============================================
// CLAIM LINE ITEMS
// ============================================

/**
 * Claim Line Items
 * Individual procedure/service lines within a claim
 */
export const claimLineItems = pgTable(
  "claim_line_items",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // References
    companyId: varchar("company_id", { length: 255 }).references(
      () => companies.id,
      { onDelete: "cascade" }
    ),
    claimId: varchar("claim_id", { length: 255 })
      .notNull()
      .references(() => insuranceClaims.id, { onDelete: "cascade" }),

    // Line Item Details
    lineNumber: integer("line_number").notNull(),
    serviceDate: date("service_date").notNull(),

    // Procedure
    procedureCode: varchar("procedure_code", { length: 20 }).notNull(), // CPT/HCPCS code
    modifiers: jsonb("modifiers"), // Array of modifiers
    description: text("description"),

    // Diagnosis
    diagnosisCodePointers: jsonb("diagnosis_code_pointers"),

    // Quantities and Amounts (in cents)
    units: integer("units").notNull().default(1),
    chargeAmount: decimal("charge_amount", { precision: 10, scale: 2 }).notNull(),
    allowedAmount: decimal("allowed_amount", { precision: 10, scale: 2 }),
    paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
    adjustmentAmount: decimal("adjustment_amount", {
      precision: 10,
      scale: 2,
    }).default("0"),
    patientResponsibility: decimal("patient_responsibility", {
      precision: 10,
      scale: 2,
    }),

    // Place of Service
    placeOfService: servicePlaceEnum("place_of_service"),

    // Provider
    renderingProviderId: varchar("rendering_provider_id", { length: 255 }),

    // Status
    status: claimStatusEnum("status"),

    // Metadata
    metadata: jsonb("metadata"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("claim_line_items_claim_idx").on(table.claimId),
    index("claim_line_items_service_date_idx").on(table.serviceDate),
  ]
);

// ============================================
// CLAIM BATCHES
// ============================================

/**
 * Claim Submission Batches
 * Tracks batches of claims submitted together
 */
export const claimBatches = pgTable(
  "claim_batches",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    companyId: varchar("company_id", { length: 255 })
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),

    // Batch Details
    batchNumber: varchar("batch_number", { length: 100 }).notNull().unique(),
    payerId: varchar("payer_id", { length: 255 }).references(
      () => insurancePayers.id
    ),

    // Claim IDs in batch (stored as JSON array)
    claimIds: jsonb("claim_ids").notNull().$type<string[]>(),

    // Statistics
    totalClaims: integer("total_claims").notNull(),
    succeeded: integer("succeeded").notNull().default(0),
    totalChargeAmount: decimal("total_charge_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    // Submission
    submittedAt: timestamp("submitted_at").notNull(),
    submittedBy: varchar("submitted_by", { length: 255 }).notNull(),
    status: batchStatusEnum("status").notNull().default("processing"),

    // Clearinghouse Response
    clearinghouseResponse: jsonb("clearinghouse_response"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("claim_batches_company_idx").on(table.companyId),
    index("claim_batches_payer_idx").on(table.payerId),
    index("claim_batches_status_idx").on(table.status),
    index("claim_batches_submitted_idx").on(table.submittedAt),
  ]
);

// ============================================
// CLAIM APPEALS
// ============================================

/**
 * Claim Appeals
 * Tracks appeals for denied or underpaid claims
 */
export const claimAppeals = pgTable(
  "claim_appeals",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // References
    claimId: varchar("claim_id", { length: 255 })
      .notNull()
      .references(() => insuranceClaims.id, { onDelete: "cascade" }),

    // Appeal Details
    appealNumber: integer("appeal_number").notNull(),
    appealDate: timestamp("appeal_date").notNull(),
    appealedBy: varchar("appealed_by", { length: 255 }).notNull(),
    appealReason: text("appeal_reason").notNull(),
    supportingDocuments: jsonb("supporting_documents").$type<string[]>(),

    // Status
    status: appealStatusEnum("status").notNull().default("submitted"),

    // Resolution
    resolutionDate: timestamp("resolution_date"),
    resolutionAmount: decimal("resolution_amount", { precision: 10, scale: 2 }),
    notes: text("notes"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("claim_appeals_claim_idx").on(table.claimId),
    index("claim_appeals_status_idx").on(table.status),
    index("claim_appeals_date_idx").on(table.appealDate),
  ]
);

// ============================================
// ELECTRONIC REMITTANCE ADVICE (ERA)
// ============================================

/**
 * Electronic Remittance Advice (ERA)
 * Tracks electronic payment remittance from payers
 */
export const claimERAs = pgTable(
  "claim_eras",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // ERA Details
    eraNumber: varchar("era_number", { length: 100 }).notNull().unique(),
    payerId: varchar("payer_id", { length: 255 }).references(
      () => insurancePayers.id
    ),

    // Payment Information
    paymentAmount: decimal("payment_amount", { precision: 12, scale: 2 }).notNull(),
    paymentDate: date("payment_date").notNull(),
    checkNumber: varchar("check_number", { length: 100 }),

    // Claim Payments (stored as JSON array)
    claimPayments: jsonb("claim_payments")
      .notNull()
      .$type<
        Array<{
          claimId: string;
          claimNumber: string;
          paidAmount: number;
          allowedAmount: number;
          adjustments: Array<{
            code: string;
            amount: number;
            reason: string;
          }>;
        }>
      >(),

    // Processing
    receivedAt: timestamp("received_at").notNull(),
    processedAt: timestamp("processed_at"),

    // Metadata
    metadata: jsonb("metadata"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("claim_eras_payer_idx").on(table.payerId),
    index("claim_eras_payment_date_idx").on(table.paymentDate),
  ]
);

// ============================================
// INSURANCE COMPANIES
// ============================================

/**
 * Insurance Companies
 * Backward compatibility table for billing service
 */
export const insuranceCompanies = pgTable("insurance_companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  payerId: varchar("payer_id", { length: 100 }),
  npi: varchar("npi", { length: 20 }),
  address: jsonb("address"),
  phone: varchar("phone", { length: 50 }),
  fax: varchar("fax", { length: 50 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 500 }),
  ediTradingPartnerId: varchar("edi_trading_partner_id", { length: 100 }),
  clearinghouse: varchar("clearinghouse", { length: 100 }),
  claimSubmissionMethod: varchar("claim_submission_method", { length: 50 }),
  attachmentRequirements: jsonb("attachment_requirements"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// INSURANCE PLANS
// ============================================

/**
 * Insurance Plans
 * Specific insurance plans from insurance companies
 */
export const insurancePlans = pgTable("insurance_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  insuranceCompanyId: varchar("insurance_company_id").references(
    () => insuranceCompanies.id,
    { onDelete: "cascade" }
  ),
  planName: varchar("plan_name", { length: 255 }).notNull(),
  planType: varchar("plan_type", { length: 50 }).notNull(), // hmo, ppo, pos, epo, medicare, medicaid, etc.
  planId: varchar("plan_id", { length: 100 }),
  groupId: varchar("group_id", { length: 100 }),
  copaymentAmount: decimal("copayment_amount", { precision: 10, scale: 2 }),
  deductibleAmount: decimal("deductible_amount", { precision: 10, scale: 2 }),
  coinsurancePercentage: decimal("coinsurance_percentage", {
    precision: 5,
    scale: 2,
  }),
  outOfPocketMaximum: decimal("out_of_pocket_maximum", {
    precision: 10,
    scale: 2,
  }),
  visionCoverage: jsonb("vision_coverage"),
  examCoverage: jsonb("exam_coverage"),
  materialsCoverage: jsonb("materials_coverage"),
  preauthorizationRequired: boolean("preauthorization_required").default(false),
  referralRequired: boolean("referral_required").default(false),
  timelyFilingDays: integer("timely_filing_days"),
  effectiveDate: timestamp("effective_date"),
  terminationDate: timestamp("termination_date"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// PATIENT INSURANCE
// ============================================

/**
 * Patient Insurance
 * Links patients to their insurance plans
 */
export const patientInsurance = pgTable("patient_insurance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  insurancePlanId: varchar("insurance_plan_id").references(
    () => insurancePlans.id
  ),
  memberId: varchar("member_id", { length: 100 }),
  subscriberId: varchar("subscriber_id", { length: 100 }),
  groupNumber: varchar("group_number", { length: 100 }),
  subscriberFirstName: varchar("subscriber_first_name", { length: 100 }),
  subscriberLastName: varchar("subscriber_last_name", { length: 100 }),
  subscriberDob: timestamp("subscriber_dob"),
  relationshipToSubscriber: varchar("relationship_to_subscriber", {
    length: 50,
  }),
  priority: integer("priority").default(1),
  status: varchar("status", { length: 50 }).default("active"),
  effectiveDate: timestamp("effective_date"),
  terminationDate: timestamp("termination_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// ELIGIBILITY VERIFICATIONS
// ============================================

/**
 * Eligibility Verifications
 * Tracks insurance eligibility verification requests and results
 */
export const eligibilityVerifications = pgTable("eligibility_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  insurancePlanId: varchar("insurance_plan_id").references(
    () => insurancePlans.id
  ),
  verificationDate: timestamp("verification_date").defaultNow().notNull(),
  verifiedBy: varchar("verified_by").references(() => users.id),
  status: varchar("status", { length: 50 }).default("pending"),
  eligibilityStatus: varchar("eligibility_status", { length: 50 }),
  coverageDetails: jsonb("coverage_details"),
  copayAmount: decimal("copay_amount", { precision: 10, scale: 2 }),
  deductibleRemaining: decimal("deductible_remaining", {
    precision: 10,
    scale: 2,
  }),
  outOfPocketRemaining: decimal("out_of_pocket_remaining", {
    precision: 10,
    scale: 2,
  }),
  responseData: jsonb("response_data"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// PREAUTHORIZATIONS
// ============================================

/**
 * Preauthorizations
 * Tracks preauthorization requests for services
 */
export const preauthorizations = pgTable("preauthorizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  insurancePlanId: varchar("insurance_plan_id").references(
    () => insurancePlans.id
  ),
  requestDate: timestamp("request_date").defaultNow().notNull(),
  requestedBy: varchar("requested_by").references(() => users.id),
  serviceType: varchar("service_type", { length: 100 }),
  procedureCodes: jsonb("procedure_codes"),
  diagnosisCodes: jsonb("diagnosis_codes"),
  status: varchar("status", { length: 50 }).default("pending"),
  authorizationNumber: varchar("authorization_number", { length: 100 }),
  approvedUnits: integer("approved_units"),
  approvedAmount: decimal("approved_amount", { precision: 10, scale: 2 }),
  effectiveDate: timestamp("effective_date"),
  expirationDate: timestamp("expiration_date"),
  denialReason: text("denial_reason"),
  notes: text("notes"),
  responseData: jsonb("response_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// MEDICAL CLAIMS
// ============================================

/**
 * Medical Claims
 * Alternative claims table for backward compatibility
 */
export const medicalClaims = pgTable("medical_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  insurancePlanId: varchar("insurance_plan_id").references(
    () => insurancePlans.id
  ),
  claimNumber: varchar("claim_number", { length: 50 }).notNull(),
  claimType: varchar("claim_type", { length: 50 }).default("professional"),
  status: varchar("status", { length: 50 }).default("draft"),
  serviceDate: timestamp("service_date").notNull(),
  placeOfService: varchar("place_of_service", { length: 10 }),
  diagnosisCodes: jsonb("diagnosis_codes"),
  totalCharges: decimal("total_charges", { precision: 10, scale: 2 }),
  allowedAmount: decimal("allowed_amount", { precision: 10, scale: 2 }),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
  patientResponsibility: decimal("patient_responsibility", {
    precision: 10,
    scale: 2,
  }),
  adjustmentAmount: decimal("adjustment_amount", { precision: 10, scale: 2 }),
  adjustmentReasons: jsonb("adjustment_reasons"),
  submittedAt: timestamp("submitted_at"),
  processedAt: timestamp("processed_at"),
  denialReason: text("denial_reason"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// ZOD SCHEMAS
// ============================================

export const insertInsurancePayerSchema = createInsertSchema(insurancePayers);
export const insertInsuranceClaimSchema = createInsertSchema(insuranceClaims);
export const insertClaimLineItemSchema = createInsertSchema(claimLineItems);
export const insertClaimBatchSchema = createInsertSchema(claimBatches);
export const insertClaimAppealSchema = createInsertSchema(claimAppeals);
export const insertClaimERASchema = createInsertSchema(claimERAs);
export const insertInsuranceCompanySchema = createInsertSchema(insuranceCompanies);
export const insertInsurancePlanSchema = createInsertSchema(insurancePlans);
export const insertPatientInsuranceSchema = createInsertSchema(patientInsurance);
export const insertEligibilityVerificationSchema = createInsertSchema(eligibilityVerifications);
export const insertPreauthorizationSchema = createInsertSchema(preauthorizations);
export const insertMedicalClaimSchema = createInsertSchema(medicalClaims);

// ============================================
// TYPES
// ============================================

export type InsurancePayer = typeof insurancePayers.$inferSelect;
export type InsertInsurancePayer = typeof insurancePayers.$inferInsert;
export type InsuranceClaim = typeof insuranceClaims.$inferSelect;
export type InsertInsuranceClaim = typeof insuranceClaims.$inferInsert;
export type ClaimLineItem = typeof claimLineItems.$inferSelect;
export type InsertClaimLineItem = typeof claimLineItems.$inferInsert;
export type ClaimBatch = typeof claimBatches.$inferSelect;
export type InsertClaimBatch = typeof claimBatches.$inferInsert;
export type ClaimAppeal = typeof claimAppeals.$inferSelect;
export type InsertClaimAppeal = typeof claimAppeals.$inferInsert;
export type ClaimERA = typeof claimERAs.$inferSelect;
export type InsertClaimERA = typeof claimERAs.$inferInsert;
export type InsuranceCompany = typeof insuranceCompanies.$inferSelect;
export type InsertInsuranceCompany = typeof insuranceCompanies.$inferInsert;
export type InsurancePlan = typeof insurancePlans.$inferSelect;
export type InsertInsurancePlan = typeof insurancePlans.$inferInsert;
export type PatientInsurance = typeof patientInsurance.$inferSelect;
export type InsertPatientInsurance = typeof patientInsurance.$inferInsert;
export type EligibilityVerification = typeof eligibilityVerifications.$inferSelect;
export type InsertEligibilityVerification = typeof eligibilityVerifications.$inferInsert;
export type Preauthorization = typeof preauthorizations.$inferSelect;
export type InsertPreauthorization = typeof preauthorizations.$inferInsert;
export type MedicalClaim = typeof medicalClaims.$inferSelect;
export type InsertMedicalClaim = typeof medicalClaims.$inferInsert;
