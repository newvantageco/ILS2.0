/**
 * Domain-Specific Error Classes
 *
 * Specialized error classes for ILS business domains:
 * - Patient management
 * - Clinical/Examinations
 * - Inventory management
 * - Billing/Invoicing
 * - NHS integration
 *
 * @module server/utils/DomainErrors
 */

import { ApiError } from './ApiError';

// ============================================
// ERROR CODE CONSTANTS
// ============================================

export const ErrorCodes = {
  // Patient errors (PAT_*)
  PATIENT_NOT_FOUND: 'PAT_001',
  PATIENT_DUPLICATE: 'PAT_002',
  PATIENT_NHS_INVALID: 'PAT_003',
  PATIENT_DOB_INVALID: 'PAT_004',
  PATIENT_CONSENT_REQUIRED: 'PAT_005',
  PATIENT_GDPR_DELETION: 'PAT_006',

  // Clinical errors (CLN_*)
  EXAMINATION_NOT_FOUND: 'CLN_001',
  PRESCRIPTION_EXPIRED: 'CLN_002',
  PRESCRIPTION_INVALID: 'CLN_003',
  CLINICAL_DATA_INCOMPLETE: 'CLN_004',
  REFERRAL_REQUIRED: 'CLN_005',

  // Inventory errors (INV_*)
  PRODUCT_NOT_FOUND: 'INV_001',
  PRODUCT_OUT_OF_STOCK: 'INV_002',
  INSUFFICIENT_STOCK: 'INV_003',
  PRODUCT_DISCONTINUED: 'INV_004',
  INVENTORY_LOCKED: 'INV_005',
  BARCODE_DUPLICATE: 'INV_006',
  SKU_DUPLICATE: 'INV_007',

  // Order errors (ORD_*)
  ORDER_NOT_FOUND: 'ORD_001',
  ORDER_CANNOT_MODIFY: 'ORD_002',
  ORDER_CANNOT_CANCEL: 'ORD_003',
  ORDER_ITEMS_INVALID: 'ORD_004',
  ORDER_PAYMENT_REQUIRED: 'ORD_005',
  ORDER_DISPENSING_FAILED: 'ORD_006',

  // Billing errors (BIL_*)
  INVOICE_NOT_FOUND: 'BIL_001',
  INVOICE_ALREADY_PAID: 'BIL_002',
  INVOICE_VOIDED: 'BIL_003',
  PAYMENT_FAILED: 'BIL_004',
  PAYMENT_AMOUNT_INVALID: 'BIL_005',
  REFUND_EXCEEDS_PAID: 'BIL_006',

  // NHS errors (NHS_*)
  NHS_NUMBER_INVALID: 'NHS_001',
  NHS_CLAIM_INVALID: 'NHS_002',
  NHS_VOUCHER_EXPIRED: 'NHS_003',
  NHS_EXEMPTION_INVALID: 'NHS_004',
  NHS_PRACTITIONER_NOT_FOUND: 'NHS_005',
  NHS_GOS_FORM_INCOMPLETE: 'NHS_006',
  NHS_PCSE_SUBMISSION_FAILED: 'NHS_007',

  // Tenant errors (TEN_*)
  TENANT_NOT_FOUND: 'TEN_001',
  TENANT_SUSPENDED: 'TEN_002',
  TENANT_QUOTA_EXCEEDED: 'TEN_003',
  TENANT_FEATURE_DISABLED: 'TEN_004',

  // Multi-tenant isolation errors (ISO_*)
  CROSS_TENANT_ACCESS: 'ISO_001',
  TENANT_CONTEXT_MISSING: 'ISO_002',
  TENANT_MISMATCH: 'ISO_003',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ============================================
// PATIENT ERRORS
// ============================================

export class PatientNotFoundError extends ApiError {
  constructor(identifier?: string) {
    super(
      404,
      ErrorCodes.PATIENT_NOT_FOUND,
      identifier ? `Patient not found: ${identifier}` : 'Patient not found'
    );
  }
}

export class PatientDuplicateError extends ApiError {
  constructor(field: string, value: string) {
    super(
      409,
      ErrorCodes.PATIENT_DUPLICATE,
      `A patient with this ${field} already exists`,
      { field, value }
    );
  }
}

export class PatientNHSNumberInvalidError extends ApiError {
  constructor(nhsNumber: string) {
    super(
      400,
      ErrorCodes.PATIENT_NHS_INVALID,
      'Invalid NHS number format',
      { nhsNumber, format: 'NHS numbers must be 10 digits with valid checksum' }
    );
  }
}

export class PatientConsentRequiredError extends ApiError {
  constructor(consentType: string) {
    super(
      403,
      ErrorCodes.PATIENT_CONSENT_REQUIRED,
      `Patient consent required for ${consentType}`,
      { consentType }
    );
  }
}

export class PatientGDPRDeletionError extends ApiError {
  constructor(reason: string) {
    super(
      403,
      ErrorCodes.PATIENT_GDPR_DELETION,
      'Cannot delete patient data',
      { reason, retention: 'GOC requires 10-year retention of clinical records' }
    );
  }
}

// ============================================
// CLINICAL ERRORS
// ============================================

export class ExaminationNotFoundError extends ApiError {
  constructor(examId?: string) {
    super(
      404,
      ErrorCodes.EXAMINATION_NOT_FOUND,
      examId ? `Examination not found: ${examId}` : 'Examination not found'
    );
  }
}

export class PrescriptionExpiredError extends ApiError {
  constructor(expiryDate: Date) {
    super(
      400,
      ErrorCodes.PRESCRIPTION_EXPIRED,
      'Prescription has expired',
      { expiryDate: expiryDate.toISOString(), maxValidity: '2 years from issue' }
    );
  }
}

export class PrescriptionInvalidError extends ApiError {
  constructor(issues: string[]) {
    super(
      400,
      ErrorCodes.PRESCRIPTION_INVALID,
      'Prescription validation failed',
      { issues }
    );
  }
}

export class ReferralRequiredError extends ApiError {
  constructor(condition: string, referralType: string) {
    super(
      400,
      ErrorCodes.REFERRAL_REQUIRED,
      `Referral required for ${condition}`,
      { condition, referralType }
    );
  }
}

// ============================================
// INVENTORY ERRORS
// ============================================

export class ProductNotFoundError extends ApiError {
  constructor(identifier?: string) {
    super(
      404,
      ErrorCodes.PRODUCT_NOT_FOUND,
      identifier ? `Product not found: ${identifier}` : 'Product not found'
    );
  }
}

export class ProductOutOfStockError extends ApiError {
  constructor(productId: string, productName?: string) {
    super(
      400,
      ErrorCodes.PRODUCT_OUT_OF_STOCK,
      productName ? `${productName} is out of stock` : 'Product is out of stock',
      { productId }
    );
  }
}

export class InsufficientStockError extends ApiError {
  constructor(productId: string, requested: number, available: number) {
    super(
      400,
      ErrorCodes.INSUFFICIENT_STOCK,
      `Insufficient stock: requested ${requested}, available ${available}`,
      { productId, requested, available, shortfall: requested - available }
    );
  }
}

export class ProductDiscontinuedError extends ApiError {
  constructor(productId: string, alternatives?: string[]) {
    super(
      400,
      ErrorCodes.PRODUCT_DISCONTINUED,
      'Product has been discontinued',
      { productId, alternatives }
    );
  }
}

export class InventoryLockedError extends ApiError {
  constructor(reason: string) {
    super(
      423,
      ErrorCodes.INVENTORY_LOCKED,
      'Inventory operation blocked',
      { reason }
    );
  }
}

export class DuplicateBarcodeError extends ApiError {
  constructor(barcode: string, existingProductId: string) {
    super(
      409,
      ErrorCodes.BARCODE_DUPLICATE,
      'Barcode already assigned to another product',
      { barcode, existingProductId }
    );
  }
}

// ============================================
// ORDER ERRORS
// ============================================

export class OrderNotFoundError extends ApiError {
  constructor(orderId?: string) {
    super(
      404,
      ErrorCodes.ORDER_NOT_FOUND,
      orderId ? `Order not found: ${orderId}` : 'Order not found'
    );
  }
}

export class OrderCannotModifyError extends ApiError {
  constructor(orderId: string, status: string) {
    super(
      400,
      ErrorCodes.ORDER_CANNOT_MODIFY,
      `Cannot modify order in '${status}' status`,
      { orderId, status, allowedStatuses: ['draft', 'pending'] }
    );
  }
}

export class OrderCannotCancelError extends ApiError {
  constructor(orderId: string, reason: string) {
    super(
      400,
      ErrorCodes.ORDER_CANNOT_CANCEL,
      `Cannot cancel order: ${reason}`,
      { orderId, reason }
    );
  }
}

export class OrderDispensingError extends ApiError {
  constructor(orderId: string, issues: string[]) {
    super(
      400,
      ErrorCodes.ORDER_DISPENSING_FAILED,
      'Order dispensing failed',
      { orderId, issues }
    );
  }
}

// ============================================
// BILLING ERRORS
// ============================================

export class InvoiceNotFoundError extends ApiError {
  constructor(invoiceId?: string) {
    super(
      404,
      ErrorCodes.INVOICE_NOT_FOUND,
      invoiceId ? `Invoice not found: ${invoiceId}` : 'Invoice not found'
    );
  }
}

export class InvoiceAlreadyPaidError extends ApiError {
  constructor(invoiceId: string, paidAt: Date) {
    super(
      400,
      ErrorCodes.INVOICE_ALREADY_PAID,
      'Invoice has already been paid',
      { invoiceId, paidAt: paidAt.toISOString() }
    );
  }
}

export class InvoiceVoidedError extends ApiError {
  constructor(invoiceId: string) {
    super(
      400,
      ErrorCodes.INVOICE_VOIDED,
      'Cannot process voided invoice',
      { invoiceId }
    );
  }
}

export class PaymentAmountInvalidError extends ApiError {
  constructor(amount: number, remaining: number) {
    super(
      400,
      ErrorCodes.PAYMENT_AMOUNT_INVALID,
      `Payment amount exceeds remaining balance`,
      { paymentAmount: amount, remainingBalance: remaining }
    );
  }
}

export class RefundExceedsPaidError extends ApiError {
  constructor(refundAmount: number, paidAmount: number) {
    super(
      400,
      ErrorCodes.REFUND_EXCEEDS_PAID,
      'Refund amount exceeds total paid',
      { refundAmount, paidAmount }
    );
  }
}

// ============================================
// NHS ERRORS
// ============================================

export class NHSNumberInvalidError extends ApiError {
  constructor(nhsNumber: string, reason?: string) {
    super(
      400,
      ErrorCodes.NHS_NUMBER_INVALID,
      reason || 'Invalid NHS number',
      { nhsNumber, format: '10 digits with valid Modulus 11 checksum' }
    );
  }
}

export class NHSClaimInvalidError extends ApiError {
  constructor(claimId: string, issues: string[]) {
    super(
      400,
      ErrorCodes.NHS_CLAIM_INVALID,
      'NHS claim validation failed',
      { claimId, issues }
    );
  }
}

export class NHSVoucherExpiredError extends ApiError {
  constructor(voucherId: string, expiryDate: Date) {
    super(
      400,
      ErrorCodes.NHS_VOUCHER_EXPIRED,
      'NHS voucher has expired',
      { voucherId, expiryDate: expiryDate.toISOString() }
    );
  }
}

export class NHSExemptionInvalidError extends ApiError {
  constructor(exemptionType: string, reason: string) {
    super(
      400,
      ErrorCodes.NHS_EXEMPTION_INVALID,
      `NHS exemption not valid: ${reason}`,
      { exemptionType, reason }
    );
  }
}

export class NHSPractitionerNotFoundError extends ApiError {
  constructor(gocNumber?: string) {
    super(
      404,
      ErrorCodes.NHS_PRACTITIONER_NOT_FOUND,
      gocNumber ? `NHS practitioner not found: GOC ${gocNumber}` : 'NHS practitioner not found'
    );
  }
}

export class NHSPCSESubmissionError extends ApiError {
  constructor(batchId: string, errors: string[]) {
    super(
      502,
      ErrorCodes.NHS_PCSE_SUBMISSION_FAILED,
      'PCSE submission failed',
      { batchId, errors },
      false
    );
  }
}

// ============================================
// TENANT ISOLATION ERRORS
// ============================================

export class CrossTenantAccessError extends ApiError {
  constructor(resourceType: string, resourceId: string) {
    super(
      403,
      ErrorCodes.CROSS_TENANT_ACCESS,
      'Access denied: resource belongs to another tenant',
      { resourceType, resourceId }
    );
  }
}

export class TenantContextMissingError extends ApiError {
  constructor(operation: string) {
    super(
      400,
      ErrorCodes.TENANT_CONTEXT_MISSING,
      'Tenant context required for this operation',
      { operation }
    );
  }
}

export class TenantMismatchError extends ApiError {
  constructor(expected: string, actual: string) {
    super(
      403,
      ErrorCodes.TENANT_MISMATCH,
      'Tenant mismatch detected',
      { expected, actual }
    );
  }
}

export class TenantQuotaExceededError extends ApiError {
  constructor(quotaType: string, limit: number, used: number) {
    super(
      429,
      ErrorCodes.TENANT_QUOTA_EXCEEDED,
      `${quotaType} quota exceeded`,
      { quotaType, limit, used, overage: used - limit }
    );
  }
}

export class TenantFeatureDisabledError extends ApiError {
  constructor(feature: string, requiredPlan?: string) {
    super(
      403,
      ErrorCodes.TENANT_FEATURE_DISABLED,
      `Feature '${feature}' is not available on your plan`,
      { feature, requiredPlan }
    );
  }
}

// ============================================
// EXPORT ALL
// ============================================

export default {
  ErrorCodes,
  // Patient
  PatientNotFoundError,
  PatientDuplicateError,
  PatientNHSNumberInvalidError,
  PatientConsentRequiredError,
  PatientGDPRDeletionError,
  // Clinical
  ExaminationNotFoundError,
  PrescriptionExpiredError,
  PrescriptionInvalidError,
  ReferralRequiredError,
  // Inventory
  ProductNotFoundError,
  ProductOutOfStockError,
  InsufficientStockError,
  ProductDiscontinuedError,
  InventoryLockedError,
  DuplicateBarcodeError,
  // Orders
  OrderNotFoundError,
  OrderCannotModifyError,
  OrderCannotCancelError,
  OrderDispensingError,
  // Billing
  InvoiceNotFoundError,
  InvoiceAlreadyPaidError,
  InvoiceVoidedError,
  PaymentAmountInvalidError,
  RefundExceedsPaidError,
  // NHS
  NHSNumberInvalidError,
  NHSClaimInvalidError,
  NHSVoucherExpiredError,
  NHSExemptionInvalidError,
  NHSPractitionerNotFoundError,
  NHSPCSESubmissionError,
  // Tenant
  CrossTenantAccessError,
  TenantContextMissingError,
  TenantMismatchError,
  TenantQuotaExceededError,
  TenantFeatureDisabledError,
};
