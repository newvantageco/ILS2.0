/**
 * API Analytics Middleware
 *
 * Automatically logs API requests for analytics and monitoring
 */

import { Request, Response, NextFunction } from 'express';
import { APIAnalyticsService } from '../services/api/APIAnalyticsService.js';
import logger from '../utils/logger';


/**
 * Middleware to log API requests to analytics service
 */
export function apiAnalyticsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startTime = Date.now();

  // Capture request size
  const requestSize = req.headers['content-length']
    ? parseInt(req.headers['content-length'], 10)
    : 0;

  // Override res.end to capture response
  const originalEnd = res.end;
  let responseSize = 0;

  res.end = function (chunk?: any, ...args: any[]): any {
    if (chunk) {
      responseSize = Buffer.byteLength(chunk);
    }

    // Log the request after response is sent
    const responseTime = Date.now() - startTime;
    const apiKey = (req as any).apiKey;

    if (apiKey) {
      // Only log if request has valid API key
      APIAnalyticsService.logRequest({
        apiKeyId: apiKey.id?.toString() || 'unknown',
        companyId: apiKey.company_id,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime,
        requestSize: requestSize > 0 ? requestSize : undefined,
        responseSize: responseSize > 0 ? responseSize : undefined,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.socket.remoteAddress,
        errorMessage: res.statusCode >= 400 ? res.statusMessage : undefined,
        timestamp: new Date(),
      }).catch((error) => {
        logger.error('Failed to log API request:', error);
      });
    }

    // Call original end
    return originalEnd.apply(res, [chunk, ...args] as Parameters<typeof originalEnd>);
  };

  next();
}

/**
 * Middleware to add rate limit headers to response
 */
export async function rateLimitHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const apiKey = (req as any).apiKey;

  if (apiKey && apiKey.id) {
    try {
      const rateLimitUsage = await APIAnalyticsService.getRateLimitUsage(
        apiKey.id.toString()
      );

      res.setHeader('X-RateLimit-Limit', rateLimitUsage.limit);
      res.setHeader('X-RateLimit-Remaining', rateLimitUsage.remaining);
      res.setHeader('X-RateLimit-Reset', rateLimitUsage.resetAt.toISOString());
    } catch (error) {
      // Silently fail - don't break the request
      logger.error('Failed to get rate limit usage:', error);
    }
  }

  next();
}
