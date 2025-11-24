/**
 * Sentry Error Tracking Integration
 * Provides error tracking, performance monitoring, and alerting
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Express, Request, Response, NextFunction } from 'express';
import logger from './logger';

const isProduction = process.env.NODE_ENV === 'production';
const isEnabled = process.env.SENTRY_DSN && process.env.SENTRY_DSN !== '';

/**
 * Initialize Sentry
 */
export function initSentry(app: Express) {
  if (!isEnabled) {
    logger.info('Sentry is disabled (no SENTRY_DSN configured)');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '1.0.0',

    // Performance monitoring
    tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in prod, 100% in dev

    // Profiling
    profilesSampleRate: isProduction ? 0.1 : 1.0,

    integrations: [
      // HTTP integration for Express
      new Sentry.Integrations.Http({ tracing: true }),

      // Express integration
      new Sentry.Integrations.Express({ app }),

      // Profiling
      nodeProfilingIntegration(),

      // Additional integrations
      new Sentry.Integrations.OnUncaughtException({
        onFatalError: async (err) => {
          logger.fatal({ err }, 'Uncaught exception, shutting down');
          if (isProduction) {
            console.error('Fatal error:', err);
            process.exit(1);
          }
        },
      }),
      new Sentry.Integrations.OnUnhandledRejection({ mode: 'warn' }),
    ],

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Don't send events in development unless explicitly enabled
      if (!isProduction && !process.env.SENTRY_DEVELOPMENT) {
        return null;
      }

      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }

      // Remove sensitive data from request body
      if (event.request?.data) {
        const data = event.request.data;
        if (typeof data === 'object') {
          delete (data as any).password;
          delete (data as any).token;
          delete (data as any).secret;
          delete (data as any).apiKey;
        }
      }

      return event;
    },

    // Set user context
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
        return null;
      }
      return breadcrumb;
    },

    // Ignore certain errors
    ignoreErrors: [
      'AbortError',
      'NetworkError',
      'Non-Error promise rejection captured',
      /^Timeout/,
    ],

    // Ignore certain URLs
    denyUrls: [
      /localhost/,
      /127\.0\.0\.1/,
    ],
  });

  logger.info({ environment: process.env.NODE_ENV }, 'Sentry initialized');
}

/**
 * Request handler middleware (must be first)
 */
export const sentryRequestHandler = () => {
  if (!isEnabled) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }
  return Sentry.Handlers.requestHandler({
    ip: true,
    user: ['id', 'email', 'username'],
  });
};

/**
 * Tracing middleware
 */
export const sentryTracingHandler = () => {
  if (!isEnabled) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }
  return Sentry.Handlers.tracingHandler();
};

/**
 * Error handler middleware (must be after routes)
 */
export const sentryErrorHandler = () => {
  if (!isEnabled) {
    return (err: Error, req: Request, res: Response, next: NextFunction) => next(err);
  }
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Only send 5xx errors to Sentry
      return true;
    },
  });
};

/**
 * Set user context for error tracking
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  role?: string;
  organizationName?: string;
}) {
  if (!isEnabled) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.email,
    role: user.role,
    organization: user.organizationName,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  if (!isEnabled) return;
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) {
  if (!isEnabled) return;

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture exception manually
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
  }
) {
  if (!isEnabled) {
    logger.error({ err: error, context }, 'Exception captured (Sentry disabled)');
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureException(error);
  });

  logger.error({ err: error, context }, 'Exception captured by Sentry');
}

/**
 * Capture message manually
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) {
  if (!isEnabled) {
    logger[level]({ context }, message);
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    scope.setLevel(level);
    Sentry.captureMessage(message, level);
  });
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(
  name: string,
  op: string,
  description?: string
) {
  if (!isEnabled) return null;

  return Sentry.startTransaction({
    name,
    op,
    description,
  });
}

/**
 * Wrap async function with Sentry performance monitoring
 */
export async function withTransaction<T>(
  name: string,
  op: string,
  fn: (transaction: Sentry.Transaction | null) => Promise<T>
): Promise<T> {
  if (!isEnabled) {
    return fn(null);
  }

  const transaction = Sentry.startTransaction({ name, op });

  try {
    const result = await fn(transaction);
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
}

/**
 * Flush Sentry events (useful before shutdown)
 */
export async function flushSentry(timeout = 2000): Promise<boolean> {
  if (!isEnabled) return true;

  try {
    return await Sentry.flush(timeout);
  } catch (error) {
    logger.error({ err: error }, 'Failed to flush Sentry events');
    return false;
  }
}

// Re-export Sentry for direct access if needed
export { Sentry };
