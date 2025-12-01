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
 * Fixed sunset dates for deprecated AI routes
 * These dates are tracked for migration planning
 */
const AI_ROUTE_SUNSET_DATES: Record<string, string> = {
  '/api/master-ai': '2026-03-01',
  '/api/platform-ai': '2026-03-01',
  '/api/ai-notifications': '2026-03-01',
  '/api/ai-purchase-orders': '2026-03-01',
  '/api/demand-forecasting': '2026-03-01',
  '/api/ai-ml': '2026-03-01',
  '/api/ophthalmic-ai': '2026-03-01',
};

/**
 * Create deprecation middleware for AI routes specifically
 * Uses fixed sunset dates for migration tracking
 */
export function deprecateAIRoute(
  oldPath: string,
  newPath: string
): RequestHandler {
  const sunsetDate = AI_ROUTE_SUNSET_DATES[oldPath] || getSunsetDate(90);

  return (req: Request, res: Response, next: NextFunction) => {
    // Set deprecation headers with fixed sunset date
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', new Date(sunsetDate).toISOString());
    res.setHeader('Link', `<${newPath}>; rel="successor-version"`);
    res.setHeader('Warning', `299 - "This AI endpoint is deprecated. Please migrate to ${newPath}. Sunset: ${sunsetDate}"`);

    // Log usage for migration tracking
    logger.warn({
      deprecated: true,
      path: req.path,
      fullPath: oldPath + req.path,
      method: req.method,
      replacement: newPath,
      sunsetDate,
      userId: (req as any).user?.id,
      companyId: (req as any).user?.companyId || (req as any).tenantId,
      userAgent: req.headers['user-agent'],
    }, `Deprecated AI endpoint accessed: ${req.method} ${oldPath}${req.path} → ${newPath}`);

    next();
  };
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
