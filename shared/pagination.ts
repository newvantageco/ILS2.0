/**
 * Pagination Utilities
 * Standard pagination helpers for list endpoints
 * Ensures consistent pagination across the platform
 */

import { z } from 'zod';

/**
 * Standard pagination parameters schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * Pagination metadata for responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Get SQL offset from page number
 */
export function getOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    meta: calculatePagination(page, limit, total),
  };
}

/**
 * Extract pagination params from request query
 */
export function extractPaginationParams(query: any): PaginationParams {
  try {
    return paginationSchema.parse(query);
  } catch (error) {
    // Return defaults if parsing fails
    return {
      page: 1,
      limit: 100,
      sortOrder: 'desc' as const,
    };
  }
}

/**
 * Validate and sanitize pagination parameters
 */
export function validatePagination(params: Partial<PaginationParams>): PaginationParams {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(1000, Math.max(1, params.limit || 100));
  const sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc';

  return {
    page,
    limit,
    sortBy: params.sortBy,
    sortOrder,
  };
}

/**
 * Cursor-based pagination parameters
 * More efficient for large datasets
 */
export interface CursorParams {
  cursor?: string;
  limit: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
}

export interface CursorPaginationMeta {
  nextCursor: string | null;
  prevCursor: string | null;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  meta: CursorPaginationMeta;
}

/**
 * Encode cursor (base64 encode the ID)
 */
export function encodeCursor(id: string): string {
  return Buffer.from(id).toString('base64');
}

/**
 * Decode cursor
 */
export function decodeCursor(cursor: string): string | null {
  try {
    return Buffer.from(cursor, 'base64').toString('utf-8');
  } catch (error) {
    return null;
  }
}

/**
 * Create cursor-based paginated response
 */
export function createCursorPaginatedResponse<T extends { id: string }>(
  data: T[],
  limit: number,
  requestedCursor?: string
): CursorPaginatedResponse<T> {
  const hasNext = data.length > limit;
  const items = hasNext ? data.slice(0, limit) : data;

  const nextCursor = hasNext && items.length > 0
    ? encodeCursor(items[items.length - 1].id)
    : null;

  const prevCursor = requestedCursor || null;

  return {
    data: items,
    meta: {
      nextCursor,
      prevCursor,
      hasNext,
      hasPrev: !!requestedCursor,
      limit,
    },
  };
}

/**
 * Drizzle pagination helper
 * Works with Drizzle ORM queries
 */
export function applyPagination<T>(
  query: any,
  params: PaginationParams
) {
  const offset = getOffset(params.page, params.limit);
  return query.limit(params.limit).offset(offset);
}

/**
 * Pagination constants
 */
export const PaginationDefaults = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 100,
  MAX_LIMIT: 1000,
  MIN_LIMIT: 1,
} as const;

/**
 * Common pagination limits for different resource types
 */
export const ResourceLimits = {
  // Small resources (users, companies)
  SMALL: {
    default: 50,
    max: 100,
  },
  // Medium resources (orders, patients)
  MEDIUM: {
    default: 100,
    max: 500,
  },
  // Large resources (transactions, logs)
  LARGE: {
    default: 100,
    max: 1000,
  },
  // Very large (analytics, metrics)
  XLARGE: {
    default: 500,
    max: 5000,
  },
} as const;

/**
 * Helper to apply resource-specific limits
 */
export function getResourceLimit(
  resourceType: keyof typeof ResourceLimits,
  requestedLimit?: number
): number {
  const limits = ResourceLimits[resourceType];
  if (!requestedLimit) return limits.default;
  return Math.min(limits.max, Math.max(1, requestedLimit));
}
