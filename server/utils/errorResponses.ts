/**
 * Standardized Error Response Utility
 * 
 * Provides consistent error responses across all API endpoints
 * with proper error codes, messages, and debugging information
 */

import { Response } from 'express';
import logger from '../utils/logger';


export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Business Logic
  CLAIM_NOT_FOUND = 'CLAIM_NOT_FOUND',
  CLAIM_ALREADY_SUBMITTED = 'CLAIM_ALREADY_SUBMITTED',
  CLAIM_VALIDATION_FAILED = 'CLAIM_VALIDATION_FAILED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  
  // External Services
  PCSE_API_ERROR = 'PCSE_API_ERROR',
  PCSE_SUBMISSION_FAILED = 'PCSE_SUBMISSION_FAILED',
  STRIPE_ERROR = 'STRIPE_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  
  // System Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Equipment & Hardware
  EQUIPMENT_CONNECTION_FAILED = 'EQUIPMENT_CONNECTION_FAILED',
  EQUIPMENT_NOT_FOUND = 'EQUIPMENT_NOT_FOUND',
  EQUIPMENT_CALIBRATION_FAILED = 'EQUIPMENT_CALIBRATION_FAILED',
  UNSUPPORTED_EQUIPMENT_PROTOCOL = 'UNSUPPORTED_EQUIPMENT_PROTOCOL',
  
  // File Operations
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  FILE_SIZE_EXCEEDED = 'FILE_SIZE_EXCEEDED',
  
  // Prescription & Clinical
  PRESCRIPTION_VALIDATION_FAILED = 'PRESCRIPTION_VALIDATION_FAILED',
  INVALID_PRESCRIPTION_DATA = 'INVALID_PRESCRIPTION_DATA',
  PRESCRIPTION_OUT_OF_RANGE = 'PRESCRIPTION_OUT_OF_RANGE',
  DIGITAL_SIGNATURE_REQUIRED = 'DIGITAL_SIGNATURE_REQUIRED'
}

export interface ErrorDetails {
  field?: string;
  value?: any;
  expected?: string;
  received?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetails;
    timestamp: string;
    requestId?: string;
    stack?: string; // Only in development
  };
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: ErrorDetails;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: ErrorDetails
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Send standardized error response
 */
export function sendError(
  res: Response,
  code: ErrorCode,
  message: string,
  statusCode: number = 500,
  details?: ErrorDetails,
  requestId?: string
): Response {
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: new Error().stack 
      })
    }
  };

  return res.status(statusCode).json(errorResponse);
}

/**
 * Common error response builders
 */
export const ErrorResponses = {
  // Authentication Errors
  unauthorized: (res: Response, message: string = 'Authentication required') => 
    sendError(res, ErrorCode.UNAUTHORIZED, message, 401),
    
  forbidden: (res: Response, message: string = 'Access denied') => 
    sendError(res, ErrorCode.FORBIDDEN, message, 403),
    
  invalidToken: (res: Response, details?: ErrorDetails) => 
    sendError(res, ErrorCode.INVALID_TOKEN, 'Invalid or expired authentication token', 401, details),
  
  // Validation Errors
  validationError: (res: Response, message: string, details?: ErrorDetails) => 
    sendError(res, ErrorCode.VALIDATION_ERROR, message, 400, details),
    
  invalidInput: (res: Response, field: string, value: any, expected: string) => 
    sendError(res, ErrorCode.INVALID_INPUT, `Invalid input for field: ${field}`, 400, {
      field,
      value,
      expected
    }),
    
  missingField: (res: Response, field: string) => 
    sendError(res, ErrorCode.MISSING_REQUIRED_FIELD, `Required field missing: ${field}`, 400, {
      field,
      expected: 'non-null value'
    }),
  
  // Business Logic Errors
  notFound: (res: Response, resource: string, id?: string) => 
    sendError(res, ErrorCode.RESOURCE_NOT_FOUND, `${resource}${id ? ` with ID ${id}` : ''} not found`, 404),
    
  alreadyExists: (res: Response, resource: string, identifier: string) => 
    sendError(res, ErrorCode.RESOURCE_ALREADY_EXISTS, `${resource} already exists: ${identifier}`, 409),
    
  claimNotFound: (res: Response, claimId: string) => 
    sendError(res, ErrorCode.CLAIM_NOT_FOUND, `NHS claim not found: ${claimId}`, 404),
    
  claimValidationFailed: (res: Response, errors: string[]) => 
    sendError(res, ErrorCode.CLAIM_VALIDATION_FAILED, `Claim validation failed: ${errors.join(', ')}`, 400),
  
  // External Service Errors
  pcseError: (res: Response, message: string, details?: ErrorDetails) => 
    sendError(res, ErrorCode.PCSE_API_ERROR, `PCSE API error: ${message}`, 502, details),
    
  pcseSubmissionFailed: (res: Response, claimId: string, reason: string) => 
    sendError(res, ErrorCode.PCSE_SUBMISSION_FAILED, `PCSE submission failed for claim ${claimId}: ${reason}`, 502, {
      field: 'claimId',
      value: claimId,
      expected: 'valid PCSE submission'
    }),
    
  stripeError: (res: Response, message: string) => 
    sendError(res, ErrorCode.STRIPE_ERROR, `Payment processing error: ${message}`, 502),
    
  emailError: (res: Response, message: string) => 
    sendError(res, ErrorCode.EMAIL_SERVICE_ERROR, `Email service error: ${message}`, 502),
    
  aiError: (res: Response, message: string) => 
    sendError(res, ErrorCode.AI_SERVICE_ERROR, `AI service error: ${message}`, 502),
  
  // System Errors
  databaseError: (res: Response, operation: string, details?: ErrorDetails) => 
    sendError(res, ErrorCode.DATABASE_ERROR, `Database operation failed: ${operation}`, 500, details),
    
  internalError: (res: Response, message: string = 'Internal server error') => 
    sendError(res, ErrorCode.INTERNAL_SERVER_ERROR, message, 500),
    
  serviceUnavailable: (res: Response, service: string) => 
    sendError(res, ErrorCode.SERVICE_UNAVAILABLE, `Service temporarily unavailable: ${service}`, 503),
    
  rateLimitExceeded: (res: Response, limit: number, window: string) => 
    sendError(res, ErrorCode.RATE_LIMIT_EXCEEDED, `Rate limit exceeded: ${limit} requests per ${window}`, 429),
  
  // Equipment Errors
  equipmentConnectionFailed: (res: Response, equipmentId: string, reason: string) => 
    sendError(res, ErrorCode.EQUIPMENT_CONNECTION_FAILED, `Failed to connect to equipment ${equipmentId}: ${reason}`, 503, {
      field: 'equipmentId',
      value: equipmentId,
      expected: 'connectable equipment'
    }),
    
  equipmentNotFound: (res: Response, equipmentId: string) => 
    sendError(res, ErrorCode.EQUIPMENT_NOT_FOUND, `Equipment not found: ${equipmentId}`, 404),
    
  unsupportedProtocol: (res: Response, protocol: string) => 
    sendError(res, ErrorCode.UNSUPPORTED_EQUIPMENT_PROTOCOL, `Unsupported equipment protocol: ${protocol}`, 400),
  
  // File Errors
  fileUploadFailed: (res: Response, reason: string) => 
    sendError(res, ErrorCode.FILE_UPLOAD_FAILED, `File upload failed: ${reason}`, 400),
    
  fileNotFound: (res: Response, filename: string) => 
    sendError(res, ErrorCode.FILE_NOT_FOUND, `File not found: ${filename}`, 404),
    
  invalidFileFormat: (res: Response, format: string, expected: string[]) => 
    sendError(res, ErrorCode.INVALID_FILE_FORMAT, `Invalid file format: ${format}. Expected: ${expected.join(', ')}`, 400),
    
  fileSizeExceeded: (res: Response, size: number, maxSize: number) => 
    sendError(res, ErrorCode.FILE_SIZE_EXCEEDED, `File size ${size} bytes exceeds maximum allowed size ${maxSize} bytes`, 400),
  
  // Prescription Errors
  prescriptionValidationFailed: (res: Response, errors: string[]) => 
    sendError(res, ErrorCode.PRESCRIPTION_VALIDATION_FAILED, `Prescription validation failed: ${errors.join(', ')}`, 400),
    
  prescriptionOutOfRange: (res: Response, field: string, value: number, range: string) => 
    sendError(res, ErrorCode.PRESCRIPTION_OUT_OF_RANGE, `${field} value ${value} is outside valid range (${range})`, 400),
    
  digitalSignatureRequired: (res: Response) => 
    sendError(res, ErrorCode.DIGITAL_SIGNATURE_REQUIRED, 'Digital signature required for prescription', 400)
};

/**
 * Error handling middleware
 */
export function errorHandler(
  error: Error,
  req: any,
  res: Response,
  next: any
): Response | void {
  const requestId = req.headers['x-request-id'] as string || 
                    req.id || 
                    `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  if (error instanceof ApiError) {
    return sendError(res, error.code, error.message, error.statusCode, error.details, requestId);
  }

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return ErrorResponses.validationError(res, error.message, {
      field: 'validation',
      expected: 'valid input'
    });
  }

  if (error.name === 'CastError') {
    return ErrorResponses.invalidInput(res, 'data', error.message, 'valid format');
  }

  // Default internal server error
  logger.error('Unhandled error:', error);
  return ErrorResponses.internalError(
    res, 
    process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : error.message
  );
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
