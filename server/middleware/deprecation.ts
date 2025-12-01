/**
 * Route Deprecation Middleware
 *
 * Provides middleware to mark routes as deprecated with:
 * - Deprecation HTTP header with sunset date
 * - Logging of deprecated endpoint usage
 * - Optional response warning message
 *
 * Usage:
 * ```typescript
 * import { deprecate } from '../middleware/deprecation';
 *
 * // Deprecate a route with 30 day sunset
 * app.use('/api/old-endpoint', deprecate({
 *   sunsetDays: 30,
 *   replacement: '/api/new-endpoint',
 *   logUsage: true,
 * }), oldRouter);
 * ```
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('Deprecation');

export interface DeprecationOptions {
  /** Number of days until the endpoint is removed (default: 30) */
  sunsetDays?: number;
  /** The replacement endpoint path */
  replacement?: string;
  /** Whether to log usage of deprecated endpoints (default: true) */
  logUsage?: boolean;
  /** Custom deprecation message */
  message?: string;
  /** Include warning in response body (default: false) */
  includeInResponse?: boolean;
}

/**
 * Calculate sunset date from now
 */
function getSunsetDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/**
 * Deprecation middleware factory
 */
export function deprecate(options: DeprecationOptions = {}): RequestHandler {
  const {
    sunsetDays = 30,
    replacement,
    logUsage = true,
    message,
    includeInResponse = false,
  } = options;

  const sunsetDate = getSunsetDate(sunsetDays);
  const deprecationMessage = message ||
    `This endpoint is deprecated and will be removed after ${sunsetDate}.${replacement ? ` Use ${replacement} instead.` : ''}`;

  return (req: Request, res: Response, next: NextFunction) => {
    // Set deprecation headers
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', sunsetDate);

    if (replacement) {
      res.setHeader('Link', `<${replacement}>; rel="successor-version"`);
    }

    // Add warning header
    res.setHeader('Warning', `299 - "${deprecationMessage}"`);

    // Log usage if enabled
    if (logUsage) {
      logger.warn({
        deprecated: true,
        path: req.path,
        method: req.method,
        replacement,
        sunsetDate,
        userId: (req as any).user?.id,
        companyId: (req as any).user?.companyId || (req as any).tenantId,
        userAgent: req.headers['user-agent'],
      }, `Deprecated endpoint accessed: ${req.method} ${req.path}`);
    }

    // Optionally modify response to include deprecation warning
    if (includeInResponse) {
      const originalJson = res.json.bind(res);
      res.json = function(body: any) {
        if (typeof body === 'object' && body !== null) {
          body._deprecation = {
            deprecated: true,
            message: deprecationMessage,
            sunset: sunsetDate,
            replacement,
          };
        }
        return originalJson(body);
      };
    }

    next();
  };
}

/**
 * Create deprecation middleware for AI routes specifically
 * Uses standard 30-day sunset and logs to AI deprecation metrics
 */
export function deprecateAIRoute(
  oldPath: string,
  newPath: string
): RequestHandler {
  return deprecate({
    sunsetDays: 30,
    replacement: newPath,
    logUsage: true,
    message: `This AI endpoint is deprecated. Please migrate to ${newPath}. Sunset date: ${getSunsetDate(30)}`,
  });
}

/**
 * Wrapper to apply deprecation to an entire router
 */
export function wrapWithDeprecation(
  router: any,
  options: DeprecationOptions
): RequestHandler[] {
  return [deprecate(options), router];
}

export default deprecate;
