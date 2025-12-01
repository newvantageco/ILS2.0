/**
 * Security Utilities Index
 *
 * Centralized exports for all security-related utilities:
 * - Error classes (ApiError, DomainErrors)
 * - UK validation (NHS, postcodes, phone numbers)
 * - Input sanitization
 * - Security helpers
 *
 * @module server/utils/security
 */

// ============================================
// ERROR CLASSES
// ============================================

export {
  // Base error classes
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  DatabaseError,
  DatabaseConnectionError,
  // Auth errors
  InvalidCredentialsError,
  AccountSuspendedError,
  AccountPendingError,
  EmailNotVerifiedError,
  SessionExpiredError,
  // Payment errors
  PaymentRequiredError,
  SubscriptionExpiredError,
  InsufficientCreditsError,
  // Service errors
  StripeError,
  AIServiceError,
  EmailServiceError,
  StorageServiceError,
  // Utilities
  isOperationalError,
  toApiError,
} from '../ApiError';

// ============================================
// DOMAIN-SPECIFIC ERRORS
// ============================================

export {
  ErrorCodes,
  type ErrorCode,
  // Patient errors
  PatientNotFoundError,
  PatientDuplicateError,
  PatientNHSNumberInvalidError,
  PatientConsentRequiredError,
  PatientGDPRDeletionError,
  // Clinical errors
  ExaminationNotFoundError,
  PrescriptionExpiredError,
  PrescriptionInvalidError,
  ReferralRequiredError,
  // Inventory errors
  ProductNotFoundError,
  ProductOutOfStockError,
  InsufficientStockError,
  ProductDiscontinuedError,
  InventoryLockedError,
  DuplicateBarcodeError,
  // Order errors
  OrderNotFoundError,
  OrderCannotModifyError,
  OrderCannotCancelError,
  OrderDispensingError,
  // Billing errors
  InvoiceNotFoundError,
  InvoiceAlreadyPaidError,
  InvoiceVoidedError,
  PaymentAmountInvalidError,
  RefundExceedsPaidError,
  // NHS errors
  NHSNumberInvalidError,
  NHSClaimInvalidError,
  NHSVoucherExpiredError,
  NHSExemptionInvalidError,
  NHSPractitionerNotFoundError,
  NHSPCSESubmissionError,
  // Tenant isolation errors
  CrossTenantAccessError,
  TenantContextMissingError,
  TenantMismatchError,
  TenantQuotaExceededError,
  TenantFeatureDisabledError,
} from '../DomainErrors';

// ============================================
// UK VALIDATION
// ============================================

export {
  // NHS
  validateNHSNumber,
  formatNHSNumber,
  nhsNumberSchema,
  // Postcodes
  validateUKPostcode,
  formatUKPostcode,
  ukPostcodeSchema,
  // Phone numbers
  validateUKPhoneNumber,
  formatUKPhoneE164,
  ukPhoneSchema,
  // GOC (General Optical Council)
  validateGOCNumber,
  getGOCPractitionerType,
  gocNumberSchema,
  // National Insurance
  validateNINO,
  formatNINO,
  ninoSchema,
  // Dates
  ukDateSchema,
  // Complex schemas
  ukAddressSchema,
  ukPatientSchema,
  gocPractitionerSchema,
  nhsGOSFormSchema,
} from '../ukValidation';

// ============================================
// INPUT SANITIZATION
// ============================================

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeString(item) :
        typeof item === 'object' && item !== null ? sanitizeObject(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Remove sensitive fields from object for logging
 */
export function redactSensitiveFields<T extends Record<string, any>>(
  obj: T,
  sensitiveFields: string[] = ['password', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken', 'authorization']
): T {
  const redacted: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveFields.some(f => lowerKey.includes(f.toLowerCase()));

    if (isSensitive) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      redacted[key] = redactSensitiveFields(value, sensitiveFields);
    } else {
      redacted[key] = value;
    }
  }

  return redacted as T;
}

// ============================================
// SECURITY HELPERS
// ============================================

/**
 * Check if IP is in private range
 */
export function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^localhost$/i,
    /^::1$/,
    /^fc00:/i,
    /^fe80:/i,
  ];

  return privateRanges.some(pattern => pattern.test(ip));
}

/**
 * Mask sensitive data for display
 */
export function maskSensitiveData(value: string, showLast: number = 4): string {
  if (!value || value.length <= showLast) {
    return '*'.repeat(value?.length || 4);
  }
  return '*'.repeat(value.length - showLast) + value.slice(-showLast);
}

/**
 * Generate secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const crypto = require('crypto');
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (!/(.)\1{2,}/.test(password)) score += 1; // No repeated chars

  if (password.length < 8) feedback.push('Password should be at least 8 characters');
  if (!/[a-z]/.test(password)) feedback.push('Add lowercase letters');
  if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters');
  if (!/\d/.test(password)) feedback.push('Add numbers');
  if (!/[^A-Za-z0-9]/.test(password)) feedback.push('Add special characters');
  if (/(.)\1{2,}/.test(password)) feedback.push('Avoid repeated characters');

  return { score, feedback };
}

/**
 * Rate limit key generator
 */
export function generateRateLimitKey(
  identifier: string,
  action: string,
  windowMs: number = 60000
): string {
  const window = Math.floor(Date.now() / windowMs);
  return `ratelimit:${action}:${identifier}:${window}`;
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  // Sanitization
  sanitizeString,
  sanitizeObject,
  redactSensitiveFields,
  // Security helpers
  isPrivateIP,
  maskSensitiveData,
  generateSecureToken,
  checkPasswordStrength,
  generateRateLimitKey,
};
