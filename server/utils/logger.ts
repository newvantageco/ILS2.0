/**
 * Structured Logging with Pino
 * Provides consistent, structured logging across the application
 */

import pino from 'pino';
import type { Logger } from 'pino';

// Re-export Logger type for use in other modules
export type { Logger };

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Custom serializers for sensitive data
const serializers = {
  req: (req: any) => ({
    id: req.id,
    method: req.method,
    url: req.url,
    query: req.query,
    params: req.params,
    remoteAddress: req.ip || req.connection?.remoteAddress,
    // Don't log headers that might contain sensitive data
    headers: {
      'user-agent': req.headers?.['user-agent'],
      'content-type': req.headers?.['content-type'],
      'accept': req.headers?.['accept'],
    },
  }),
  res: (res: any) => ({
    statusCode: res.statusCode,
    headers: {
      'content-type': res.getHeader('content-type'),
    },
  }),
  err: pino.stdSerializers.err,
};

// Base logger configuration
const baseConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  serializers,
  base: {
    env: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    service: 'ils-api',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'secret',
      'apiKey',
      '*.password',
      '*.token',
      '*.secret',
      '*.apiKey',
    ],
    remove: true,
  },
};

// Development: Pretty print
// Production: JSON output
const logger: Logger = isDevelopment
  ? pino({
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      },
    })
  : pino(baseConfig);

/**
 * Create a child logger with additional context
 */
export function createLogger(context: Record<string, any> | string): Logger {
  if (typeof context === 'string') {
    return logger.child({ component: context });
  }
  return logger.child(context);
}

/**
 * Log levels:
 * - trace (10): Very detailed, for debugging
 * - debug (20): Detailed info for debugging
 * - info (30): Important info (default in production)
 * - warn (40): Warning messages
 * - error (50): Error messages
 * - fatal (60): Fatal errors (application crash)
 */

export default logger;

/**
 * Utility functions for common logging patterns
 */

export const loggers = {
  /**
   * Database operations logger
   */
  database: createLogger({ component: 'database' }),

  /**
   * Authentication logger
   */
  auth: createLogger({ component: 'auth' }),

  /**
   * API request logger
   */
  api: createLogger({ component: 'api' }),

  /**
   * Background job logger
   */
  jobs: createLogger({ component: 'jobs' }),

  /**
   * Email service logger
   */
  email: createLogger({ component: 'email' }),

  /**
   * AI service logger
   */
  ai: createLogger({ component: 'ai' }),

  /**
   * Performance logger
   */
  performance: createLogger({ component: 'performance' }),

  /**
   * Security logger
   */
  security: createLogger({ component: 'security' }),
};

/**
 * Performance timing utility
 */
export class PerformanceTimer {
  private startTime: number;
  private logger: Logger;
  private operation: string;

  constructor(operation: string, context?: Record<string, any>) {
    this.operation = operation;
    this.logger = context ? logger.child(context) : logger;
    this.startTime = Date.now();
  }

  end(additionalContext?: Record<string, any>) {
    const duration = Date.now() - this.startTime;
    this.logger.info(
      {
        operation: this.operation,
        duration,
        ...additionalContext,
      },
      `${this.operation} completed in ${duration}ms`
    );
    return duration;
  }

  endWithError(error: Error, additionalContext?: Record<string, any>) {
    const duration = Date.now() - this.startTime;
    this.logger.error(
      {
        operation: this.operation,
        duration,
        err: error,
        ...additionalContext,
      },
      `${this.operation} failed after ${duration}ms`
    );
    return duration;
  }
}

/**
 * Async operation wrapper with automatic logging
 */
export async function loggedOperation<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  const timer = new PerformanceTimer(operation, context);
  try {
    const result = await fn();
    timer.end({ success: true });
    return result;
  } catch (error) {
    timer.endWithError(error as Error);
    throw error;
  }
}

/**
 * Log security events
 */
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: Record<string, any>
) {
  loggers.security[severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info'](
    {
      securityEvent: event,
      severity,
      ...details,
    },
    `Security event: ${event}`
  );
}

/**
 * Log audit trail
 */
export function logAudit(
  action: string,
  userId: string,
  resource: string,
  details?: Record<string, any>
) {
  logger.info(
    {
      audit: true,
      action,
      userId,
      resource,
      timestamp: new Date().toISOString(),
      ...details,
    },
    `Audit: ${action} on ${resource} by ${userId}`
  );
}

// For backward compatibility with old logger interface
export { logger };

// ============================================
// CONTEXT-AWARE LOGGING
// ============================================

/**
 * Get a logger with automatic request context
 *
 * Creates a child logger that automatically includes correlation ID,
 * tenant ID, and user ID from the current async context.
 *
 * Usage:
 * ```typescript
 * const log = getContextLogger();
 * log.info('Operation completed'); // Automatically includes correlationId
 * ```
 */
export function getContextLogger(additionalContext?: Record<string, any>): Logger {
  // Dynamic import to avoid circular dependency
  let ctx: Record<string, any> = {};
  try {
    // Try to get context from AsyncLocalStorage
    const { requestContext } = require('../context');
    ctx = requestContext?.toLogContext?.() || {};
  } catch {
    // Context not available, continue without it
  }

  return logger.child({
    ...ctx,
    ...additionalContext,
  });
}

/**
 * Log with automatic request context
 *
 * Convenience functions that automatically include request context.
 */
export const contextLog = {
  info(message: string, data?: Record<string, any>) {
    getContextLogger(data).info(message);
  },
  warn(message: string, data?: Record<string, any>) {
    getContextLogger(data).warn(message);
  },
  error(message: string, data?: Record<string, any>) {
    getContextLogger(data).error(message);
  },
  debug(message: string, data?: Record<string, any>) {
    getContextLogger(data).debug(message);
  },
};

/**
 * Wrap an operation with automatic context logging
 */
export async function loggedContextOperation<T>(
  operation: string,
  fn: () => Promise<T>,
  additionalContext?: Record<string, any>
): Promise<T> {
  const log = getContextLogger({ operation, ...additionalContext });
  const startTime = Date.now();

  try {
    log.debug(`Starting: ${operation}`);
    const result = await fn();
    const duration = Date.now() - startTime;
    log.info({ duration, success: true }, `Completed: ${operation} in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error({
      duration,
      success: false,
      err: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack,
      } : error,
    }, `Failed: ${operation} after ${duration}ms`);
    throw error;
  }
}
