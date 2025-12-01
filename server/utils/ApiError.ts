/**
 * Standardized API Error Classes
 * Provides consistent error handling across the application
 */

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad Request', details?: any) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(401, 'UNAUTHORIZED', message, details);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(403, 'FORBIDDEN', message, details);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource', details?: any) {
    super(404, 'NOT_FOUND', `${resource} not found`, details);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Conflict', details?: any) {
    super(409, 'CONFLICT', message, details);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(422, 'VALIDATION_ERROR', message, details);
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(429, 'RATE_LIMIT_EXCEEDED', message, { retryAfter });
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal Server Error', details?: any) {
    super(500, 'INTERNAL_ERROR', message, details, false);
  }
}

export class ServiceUnavailableError extends ApiError {
  constructor(service: string, details?: any) {
    super(503, 'SERVICE_UNAVAILABLE', `${service} is currently unavailable`, details, false);
  }
}

// Database-specific errors
export class DatabaseError extends ApiError {
  constructor(message: string = 'Database error occurred', details?: any) {
    super(500, 'DATABASE_ERROR', message, details, false);
  }
}

export class DatabaseConnectionError extends ApiError {
  constructor(details?: any) {
    super(503, 'DATABASE_CONNECTION_ERROR', 'Failed to connect to database', details, false);
  }
}

// Authentication-specific errors
export class InvalidCredentialsError extends ApiError {
  constructor() {
    super(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
}

export class AccountSuspendedError extends ApiError {
  constructor() {
    super(403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended. Please contact support.');
  }
}

export class AccountPendingError extends ApiError {
  constructor() {
    super(403, 'ACCOUNT_PENDING', 'Your account is pending approval');
  }
}

export class EmailNotVerifiedError extends ApiError {
  constructor() {
    super(403, 'EMAIL_NOT_VERIFIED', 'Please verify your email address');
  }
}

export class SessionExpiredError extends ApiError {
  constructor() {
    super(401, 'SESSION_EXPIRED', 'Your session has expired. Please login again');
  }
}

// Payment-specific errors
export class PaymentRequiredError extends ApiError {
  constructor(message: string = 'Payment required to access this feature') {
    super(402, 'PAYMENT_REQUIRED', message);
  }
}

export class SubscriptionExpiredError extends ApiError {
  constructor() {
    super(402, 'SUBSCRIPTION_EXPIRED', 'Your subscription has expired');
  }
}

export class InsufficientCreditsError extends ApiError {
  constructor(required: number, available: number) {
    super(402, 'INSUFFICIENT_CREDITS', 'Insufficient credits', {
      required,
      available,
      shortfall: required - available,
    });
  }
}

// External service errors
export class StripeError extends ApiError {
  constructor(message: string, details?: any) {
    super(502, 'STRIPE_ERROR', `Payment processing error: ${message}`, details, false);
  }
}

export class AIServiceError extends ApiError {
  constructor(provider: string, message: string, details?: any) {
    super(502, 'AI_SERVICE_ERROR', `AI service (${provider}) error: ${message}`, details, false);
  }
}

export class EmailServiceError extends ApiError {
  constructor(message: string, details?: any) {
    super(502, 'EMAIL_SERVICE_ERROR', `Email service error: ${message}`, details, false);
  }
}

export class StorageServiceError extends ApiError {
  constructor(message: string, details?: any) {
    super(502, 'STORAGE_SERVICE_ERROR', `Storage service error: ${message}`, details, false);
  }
}

// Helper function to determine if error is operational
export function isOperationalError(error: any): boolean {
  if (error instanceof ApiError) {
    return error.isOperational;
  }
  return false;
}

// Convert common errors to ApiError
export function toApiError(error: any): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  // Database errors
  if (error.code === '23505') { // Unique violation
    return new ConflictError('Resource already exists');
  }
  if (error.code === '23503') { // Foreign key violation
    return new BadRequestError('Referenced resource does not exist');
  }
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return new DatabaseConnectionError({ originalError: error.message });
  }

  // Default to internal server error
  return new InternalServerError(
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error.message,
    process.env.NODE_ENV !== 'production' ? { stack: error.stack } : undefined
  );
}

// ============================================
// DOMAIN-SPECIFIC ERROR RE-EXPORTS
// ============================================

export {
  ErrorCodes,
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
} from './DomainErrors';
