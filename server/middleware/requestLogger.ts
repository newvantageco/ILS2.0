/**
 * Request Logging Middleware with Correlation IDs
 * Adds correlation IDs to all requests for distributed tracing
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import pinoHttp from 'pino-http';
import logger from '../utils/logger';

/**
 * Generate correlation ID for request tracing
 */
export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Use existing correlation ID from header or generate new one
  const correlationId =
    (req.headers['x-correlation-id'] as string) ||
    (req.headers['x-request-id'] as string) ||
    randomUUID();

  // Attach to request for use in application
  (req as any).correlationId = correlationId;

  // Add to response headers for client tracing
  res.setHeader('X-Correlation-ID', correlationId);

  next();
}

/**
 * HTTP request/response logging middleware using pino-http
 */
export const httpLogger = pinoHttp({
  logger,

  // Use correlation ID as request ID
  genReqId: (req: Request) => (req as any).correlationId || randomUUID(),

  // Custom serializers
  serializers: {
    req: (req: any) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      params: req.params,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'accept': req.headers['accept'],
        'x-correlation-id': req.headers['x-correlation-id'],
      },
      remoteAddress: req.ip,
      userId: req.user?.id,
    }),
    res: (res: any) => ({
      statusCode: res.statusCode,
      headers: {
        'content-type': res.getHeader('content-type'),
        'content-length': res.getHeader('content-length'),
      },
    }),
  },

  // Custom log level based on status code
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    if (res.statusCode >= 300) {
      return 'info';
    }
    // Don't log successful health checks at info level
    if (req.url === '/api/health' || req.url === '/health') {
      return 'debug';
    }
    return 'info';
  },

  // Include response time
  customSuccessMessage: (req, res) => {
    const responseTime = res.getHeader('X-Response-Time');
    return `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`;
  },

  // Custom error message
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
  },

  // Attach custom attributes
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'duration',
  },

  // Don't log request/response bodies (security)
  autoLogging: {
    ignore: (req) => {
      // Don't log static assets
      return (
        req.url?.startsWith('/assets/') ||
        req.url?.startsWith('/static/') ||
        req.url?.endsWith('.js') ||
        req.url?.endsWith('.css') ||
        req.url?.endsWith('.map')
      );
    },
  },
});

/**
 * Middleware to add user context to logs after authentication
 */
export function userContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if ((req as any).user) {
    // Add user context to logger
    (req as any).log = logger.child({
      userId: (req as any).user.id,
      userEmail: (req as any).user.email,
      userRole: (req as any).user.role,
    });
  }
  next();
}

/**
 * Enhanced error logging middleware
 */
export function errorLoggingMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const logContext = {
    correlationId: (req as any).correlationId,
    method: req.method,
    url: req.url,
    userId: (req as any).user?.id,
    err: {
      message: err.message,
      stack: err.stack,
      name: err.name,
    },
  };

  // Log based on error type
  if (res.statusCode >= 500) {
    logger.error(logContext, 'Internal server error');
  } else if (res.statusCode >= 400) {
    logger.warn(logContext, 'Client error');
  } else {
    logger.error(logContext, 'Unhandled error');
  }

  next(err);
}

/**
 * Response time tracking middleware
 */
export function responseTimeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startTime = Date.now();

  // Capture original end function
  const originalEnd = res.end;

  // Override end function
  res.end = function (this: Response, ...args: any[]) {
    const duration = Date.now() - startTime;

    // Add response time header
    res.setHeader('X-Response-Time', duration.toString());

    // Log slow requests
    if (duration > 1000) {
      logger.warn(
        {
          correlationId: (req as any).correlationId,
          method: req.method,
          url: req.url,
          duration,
          statusCode: res.statusCode,
        },
        `Slow request: ${req.method} ${req.url} took ${duration}ms`
      );
    }

    // Call original end
    return originalEnd.apply(this, args as Parameters<typeof originalEnd>);
  };

  next();
}

/**
 * Request context logger
 * Creates a child logger with request context
 */
export function createRequestLogger(req: Request) {
  return logger.child({
    correlationId: (req as any).correlationId,
    method: req.method,
    url: req.url,
    userId: (req as any).user?.id,
  });
}

// Export types
export interface RequestWithLogger extends Request {
  correlationId: string;
  log: typeof logger;
}
