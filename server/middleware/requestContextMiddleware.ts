/**
 * Request Context Middleware
 *
 * Integrates AsyncLocalStorage-based request context with Express.
 * Automatically captures correlation ID, tenant, and user information.
 *
 * @module server/middleware/requestContextMiddleware
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { requestContext, type RequestContext } from '../context';
import logger from '../utils/logger';

// ============================================
// TYPE EXTENSIONS
// ============================================

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      requestContext: RequestContext;
    }
  }
}

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Request context middleware
 *
 * Sets up AsyncLocalStorage context for the entire request lifecycle.
 * All downstream async operations will have access to correlation ID,
 * tenant, and user information without explicit parameter passing.
 *
 * Usage:
 * ```typescript
 * app.use(requestContextMiddleware);
 * ```
 */
export function requestContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Extract or generate correlation ID
  const correlationId =
    (req.headers['x-correlation-id'] as string) ||
    (req.headers['x-request-id'] as string) ||
    randomUUID();

  // Extract client IP
  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.ip ||
    req.socket?.remoteAddress;

  // Build initial context
  const context: Partial<RequestContext> = {
    correlationId,
    startTime: Date.now(),
    method: req.method,
    path: req.path,
    clientIp,
  };

  // Attach to request object for backward compatibility
  req.correlationId = correlationId;

  // Set response header for client tracing
  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Request-ID', correlationId);

  // Run the rest of the request in the context
  requestContext.run(context, () => {
    // Store reference on request for easy access
    req.requestContext = requestContext.get()!;
    next();
  });
}

/**
 * User context enrichment middleware
 *
 * Call this AFTER authentication middleware to add user context.
 * Updates the existing request context with authenticated user info.
 */
export function enrichUserContext(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const user = (req as any).user;
  const tenantId = (req as any).tenantId || user?.companyId;

  if (user || tenantId) {
    requestContext.update({
      tenantId,
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
    });
  }

  next();
}

/**
 * Request timing middleware
 *
 * Logs request completion with timing information.
 * Should be added early in the middleware chain.
 * Uses 'finish' event instead of overriding res.end to avoid header conflicts.
 */
export function requestTimingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  // Set header early (before response starts)
  res.setHeader('X-Response-Time', '0ms');

  // Listen for 'finish' event - fires when response has been sent
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Log request completion
    const ctx = requestContext.toLogContext();
    const logData = {
      ...ctx,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('content-length'),
    };

    // Log at appropriate level based on status code
    if (res.statusCode >= 500) {
      logger.error(logData, `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    } else if (res.statusCode >= 400) {
      logger.warn(logData, `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    } else if (duration > 1000) {
      // Warn on slow requests
      logger.warn(logData, `Slow request: ${req.method} ${req.path} - ${duration}ms`);
    } else if (req.path !== '/health' && req.path !== '/api/health') {
      logger.info(logData, `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    }
  });

  // Also listen for 'close' event - fires if connection terminated early
  res.on('close', () => {
    if (!res.writableFinished) {
      const duration = Date.now() - startTime;
      logger.debug({
        ...requestContext.toLogContext(),
        duration,
      }, `Request connection closed early: ${req.method} ${req.path}`);
    }
  });

  next();
}

/**
 * Get context-aware logger for current request
 *
 * Creates a child logger with all request context fields attached.
 * Useful for logging within route handlers.
 */
export function getRequestLogger(req: Request) {
  return logger.child({
    correlationId: req.correlationId,
    ...requestContext.toLogContext(),
  });
}

/**
 * Error context middleware
 *
 * Enriches errors with request context for better debugging.
 */
export function errorContextMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Add context to error
  const ctx = requestContext.get();
  (err as any).correlationId = ctx?.correlationId;
  (err as any).requestContext = ctx;

  // Log error with full context
  logger.error({
    ...requestContext.toLogContext(),
    err: {
      message: err.message,
      name: err.name,
      stack: err.stack,
    },
    statusCode: (err as any).statusCode || 500,
  }, `Error: ${err.message}`);

  next(err);
}

export default requestContextMiddleware;
