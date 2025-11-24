/**
 * Type utilities for Express 5 request body handling
 * Express 5 types req.body as `unknown` for type safety
 * These utilities provide proper typing while maintaining safety
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type * as qs from 'qs';
import type { z } from 'zod';

/**
 * Typed Request interface for Express 5
 * Provides proper typing for request body, params, and query
 */
export interface TypedRequest<
  TBody = unknown,
  TParams extends Record<string, string> = Record<string, string>,
  TQuery = qs.ParsedQs
> extends Request<TParams, unknown, TBody, TQuery> {
  body: TBody;
}

/**
 * Typed Request Handler for Express 5
 */
export type TypedRequestHandler<
  TBody = unknown,
  TParams extends Record<string, string> = Record<string, string>,
  TQuery = qs.ParsedQs
> = (
  req: TypedRequest<TBody, TParams, TQuery>,
  res: Response,
  next: NextFunction
) => void | Promise<void> | Response | Promise<Response>;

/**
 * Helper to safely parse request body with type assertion
 * Use when you have validated the body shape elsewhere
 */
export function parseBody<T>(req: Request): T {
  return req.body as T;
}

/**
 * Helper to extract typed body with runtime check
 */
export function getBody<T extends object>(req: Request): T {
  if (typeof req.body !== 'object' || req.body === null) {
    throw new Error('Request body must be an object');
  }
  return req.body as T;
}

/**
 * Infer body type from Zod schema
 */
export type InferBody<T extends z.ZodType> = z.infer<T>;

// ============================================================
// Common Request Body Types
// ============================================================

/** Role selection body */
export interface RoleSelectionBody {
  role: string;
  organizationName?: string;
  adminSetupKey?: string;
  subscriptionPlan?: string;
  gocNumber?: string;
}

/** User update body */
export interface UserUpdateBody {
  role?: string;
  accountStatus?: string;
  statusReason?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  enhancedRole?: string;
  gocNumber?: string;
  gocRegistrationNumber?: string;
  gocRegistrationType?: string;
  professionalQualifications?: string;
  contactPhone?: string;
  password?: string;
}

/** Password update body */
export interface PasswordUpdateBody {
  password: string;
}

/** OMA file upload body */
export interface OMAFileBody {
  fileContent: string;
  filename: string;
}

/** Email body */
export interface EmailBody {
  recipientEmail: string;
  subject?: string;
  message?: string;
}

/** Feedback response body */
export interface FeedbackResponseBody {
  response: string;
}

/** Invoice body */
export interface InvoiceBody {
  lineItems: unknown[];
  [key: string]: unknown;
}

/** Shopify config body */
export interface ShopifyConfigBody {
  shopUrl: string;
  accessToken: string;
  apiVersion?: string;
}

/** POS transaction body */
export interface POSTransactionBody {
  lineItems: unknown[];
  paymentMethod: string;
  [key: string]: unknown;
}

/** Status update body */
export interface StatusUpdateBody {
  status: string;
}

/** Amount body */
export interface AmountBody {
  amount: number;
}

/** Action body */
export interface ActionBody {
  actionTaken: string;
}

/** Lens parameters body */
export interface LensParametersBody {
  lensType?: string;
  lensMaterial?: string;
  [key: string]: unknown;
}

/** Generic ID params */
export interface IdParams {
  id: string;
}

/** Order ID params */
export interface OrderIdParams {
  orderId: string;
}

/** User ID params */
export interface UserIdParams {
  userId: string;
}

/** Company ID params */
export interface CompanyIdParams {
  companyId: string;
}

/** Patient ID params */
export interface PatientIdParams {
  patientId: string;
}

/** Examination ID params */
export interface ExaminationIdParams {
  examinationId: string;
}

/** Product ID params */
export interface ProductIdParams {
  productId: string;
}
