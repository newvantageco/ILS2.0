/**
 * Centralized Error Handler Middleware
 * Handles all errors thrown in the application
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError, toApiError, isOperationalError } from '../utils/ApiError';
import { ZodError } from 'zod';
import { createLogger } from '../utils/logger';

const logger = createLogger('ErrorHandler');

/**
 * Format Zod validation errors
 */
function formatZodError(error: ZodError): ApiError {
  const details = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return new ApiError(
    400,
    'VALIDATION_ERROR',
    'Request validation failed',
    details
  );
}

/**
 * Global error handler middleware
 * Must be registered after all routes
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const apiError = formatZodError(err);
    res.status(apiError.statusCode).json(apiError.toJSON());
    return;
  }

  // Convert to ApiError if needed
  let apiError: ApiError;
  try {
    apiError = err instanceof ApiError ? err : toApiError(err);
  } catch (conversionError) {
    // Fallback if conversion fails
    apiError = new ApiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
  }

  // Log error details (wrapped in try-catch to prevent logging from crashing the handler)
  try {
    const errorLog = {
      code: apiError.code,
      message: apiError.message,
      statusCode: apiError.statusCode,
      path: req?.path || 'unknown',
      method: req?.method || 'unknown',
      ip: req?.ip || 'unknown',
      userId: (req as any)?.user?.id || (req as any)?.user?.claims?.sub,
      isOperational: apiError.isOperational,
      stack: apiError.stack,
    };

    if (apiError.isOperational) {
      logger.warn('Operational error occurred: ' + JSON.stringify(errorLog));
    } else {
      logger.error('Non-operational error occurred: ' + JSON.stringify(errorLog));
    }
  } catch (logError) {
    // If logging fails, just console.error it
    console.error('Error handler logging failed:', logError);
  }

  // Send error response
  try {
    if (!res.headersSent) {
      res.status(apiError.statusCode).json(apiError.toJSON());
    }
  } catch (responseError) {
    console.error('Error sending response:', responseError);
  }
}

/**
 * 404 Not Found handler
 * Should be registered before error handler but after all routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const error = new ApiError(
    404,
    'NOT_FOUND',
    `Route ${req.method} ${req.path} not found`
  );

  res.status(404).json(error.toJSON());
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch rejected promises
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Handle uncaught exceptions and unhandled rejections
 */
export function setupGlobalErrorHandlers(): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception: ' + error.message + '\nStack: ' + error.stack);

    // For production, keep the process alive
    // In development, we might want to crash
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    const msg = reason?.message || String(reason);
    const stack = reason?.stack || '';
    logger.error('Unhandled Promise Rejection: ' + msg + '\nStack: ' + stack);

    // Don't exit the process in production
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });

  // Handle SIGTERM gracefully
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    
    // Close server and database connections
    // This will be handled by the main server file
  });

  // Handle SIGINT (Ctrl+C) gracefully
  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
}

/**
 * Express middleware to set request timeout
 */
export function requestTimeout(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.setTimeout(timeoutMs, () => {
      const error = new ApiError(
        408,
        'REQUEST_TIMEOUT',
        'Request timeout exceeded',
        { timeoutMs }
      );
      
      if (!res.headersSent) {
        res.status(error.statusCode).json(error.toJSON());
      }
    });
    
    next();
  };
}

export default errorHandler;
