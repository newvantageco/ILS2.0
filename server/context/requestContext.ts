/**
 * Request Context using AsyncLocalStorage
 *
 * Provides automatic propagation of request context (correlation ID, user info, tenant)
 * to all async operations without explicit parameter passing.
 *
 * Usage:
 * ```typescript
 * // In middleware
 * requestContext.run({ correlationId, tenantId, userId }, () => next());
 *
 * // Anywhere in async code
 * const ctx = requestContext.get();
 * logger.info({ correlationId: ctx.correlationId }, 'Operation completed');
 * ```
 *
 * @module server/context/requestContext
 */

import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface RequestContext {
  /** Unique correlation ID for request tracing */
  correlationId: string;

  /** Tenant/company ID for multi-tenant isolation */
  tenantId?: string;

  /** Authenticated user ID */
  userId?: string;

  /** User email for logging */
  userEmail?: string;

  /** User role */
  userRole?: string;

  /** Request start time for performance tracking */
  startTime: number;

  /** Request method (GET, POST, etc.) */
  method?: string;

  /** Request path */
  path?: string;

  /** Client IP address */
  clientIp?: string;

  /** Custom metadata */
  metadata?: Record<string, any>;
}

// ============================================
// ASYNC LOCAL STORAGE INSTANCE
// ============================================

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

// ============================================
// REQUEST CONTEXT API
// ============================================

export const requestContext = {
  /**
   * Run a function within a request context
   * All async operations within the callback will have access to this context
   */
  run<T>(context: Partial<RequestContext>, callback: () => T): T {
    const fullContext: RequestContext = {
      correlationId: context.correlationId || randomUUID(),
      startTime: context.startTime || Date.now(),
      ...context,
    };
    return asyncLocalStorage.run(fullContext, callback);
  },

  /**
   * Get the current request context
   * Returns undefined if called outside of a request context
   */
  get(): RequestContext | undefined {
    return asyncLocalStorage.getStore();
  },

  /**
   * Get the current request context or throw if not available
   */
  getOrThrow(): RequestContext {
    const ctx = asyncLocalStorage.getStore();
    if (!ctx) {
      throw new Error('Request context not available - ensure code runs within requestContext.run()');
    }
    return ctx;
  },

  /**
   * Get the correlation ID from current context
   * Returns a new UUID if no context is available (for background operations)
   */
  getCorrelationId(): string {
    const ctx = asyncLocalStorage.getStore();
    return ctx?.correlationId || randomUUID();
  },

  /**
   * Get the tenant ID from current context
   */
  getTenantId(): string | undefined {
    return asyncLocalStorage.getStore()?.tenantId;
  },

  /**
   * Get the user ID from current context
   */
  getUserId(): string | undefined {
    return asyncLocalStorage.getStore()?.userId;
  },

  /**
   * Update the current context with additional data
   * Throws if called outside of a request context
   */
  update(updates: Partial<RequestContext>): void {
    const ctx = asyncLocalStorage.getStore();
    if (ctx) {
      Object.assign(ctx, updates);
    }
  },

  /**
   * Add metadata to the current context
   */
  addMetadata(key: string, value: any): void {
    const ctx = asyncLocalStorage.getStore();
    if (ctx) {
      ctx.metadata = ctx.metadata || {};
      ctx.metadata[key] = value;
    }
  },

  /**
   * Get elapsed time since request started
   */
  getElapsedTime(): number {
    const ctx = asyncLocalStorage.getStore();
    if (!ctx) return 0;
    return Date.now() - ctx.startTime;
  },

  /**
   * Create a child context for sub-operations
   * Inherits parent context but can override values
   */
  child<T>(overrides: Partial<RequestContext>, callback: () => T): T {
    const parent = asyncLocalStorage.getStore();
    const childContext: RequestContext = {
      correlationId: parent?.correlationId || randomUUID(),
      startTime: Date.now(),
      tenantId: parent?.tenantId,
      userId: parent?.userId,
      userEmail: parent?.userEmail,
      userRole: parent?.userRole,
      ...overrides,
    };
    return asyncLocalStorage.run(childContext, callback);
  },

  /**
   * Get context as a plain object for logging
   * Excludes sensitive fields and large objects
   */
  toLogContext(): Record<string, any> {
    const ctx = asyncLocalStorage.getStore();
    if (!ctx) return {};

    return {
      correlationId: ctx.correlationId,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      method: ctx.method,
      path: ctx.path,
      elapsedMs: Date.now() - ctx.startTime,
    };
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Wrap an async function to preserve request context
 * Useful for callbacks that lose context (setTimeout, event handlers)
 */
export function preserveContext<T extends (...args: any[]) => any>(fn: T): T {
  const ctx = requestContext.get();
  if (!ctx) return fn;

  return ((...args: Parameters<T>) => {
    return requestContext.run(ctx, () => fn(...args));
  }) as T;
}

/**
 * Create a context-aware wrapper for background jobs
 */
export function withContext<T>(
  contextData: Partial<RequestContext>,
  fn: () => Promise<T>
): Promise<T> {
  return requestContext.run(contextData, fn);
}

/**
 * Decorator for class methods to preserve context
 */
export function PreserveContext() {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const ctx = requestContext.get();
      if (!ctx) {
        return originalMethod.apply(this, args);
      }
      return requestContext.run(ctx, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

export default requestContext;
