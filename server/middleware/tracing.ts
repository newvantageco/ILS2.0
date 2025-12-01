/**
 * Distributed Tracing Middleware
 *
 * Provides request tracing with span management that integrates with
 * the existing AsyncLocalStorage correlation ID system.
 *
 * This is a lightweight implementation that:
 * - Creates trace/span hierarchies for request flows
 * - Propagates trace context via W3C Trace Context headers
 * - Integrates with existing correlation IDs
 * - Exports traces to logs (can be extended to Jaeger/Zipkin)
 *
 * When @opentelemetry packages are installed, this can be upgraded
 * to use the full OpenTelemetry SDK.
 *
 * @module server/middleware/tracing
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import crypto from 'crypto';
import { requestContext, RequestContextData } from '../context';
import { createLogger } from '../utils/logger';

const logger = createLogger('Tracing');
const enabled = process.env.TRACING_ENABLED === 'true' || process.env.OTEL_ENABLED === 'true';

// ============================================
// TRACE CONTEXT TYPES
// ============================================

export interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  traceFlags: number;
  traceState?: string;
}

export interface Span {
  name: string;
  context: SpanContext;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'ok' | 'error' | 'unset';
  attributes: Record<string, string | number | boolean>;
  events: SpanEvent[];
  kind: SpanKind;
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, string | number | boolean>;
}

export type SpanKind = 'internal' | 'server' | 'client' | 'producer' | 'consumer';

// ============================================
// TRACE ID GENERATION
// ============================================

/**
 * Generate a 128-bit trace ID (32 hex chars)
 */
function generateTraceId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate a 64-bit span ID (16 hex chars)
 */
function generateSpanId(): string {
  return crypto.randomBytes(8).toString('hex');
}

// ============================================
// W3C TRACE CONTEXT PARSING
// ============================================

/**
 * Parse W3C traceparent header
 * Format: {version}-{trace-id}-{parent-id}-{trace-flags}
 * Example: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
 */
function parseTraceparent(header: string): SpanContext | null {
  const parts = header.split('-');
  if (parts.length !== 4) return null;

  const [version, traceId, parentId, flags] = parts;

  // Only support version 00
  if (version !== '00') return null;

  // Validate lengths
  if (traceId.length !== 32 || parentId.length !== 16 || flags.length !== 2) {
    return null;
  }

  return {
    traceId,
    spanId: generateSpanId(),
    parentSpanId: parentId,
    traceFlags: parseInt(flags, 16),
  };
}

/**
 * Format span context as W3C traceparent header
 */
function formatTraceparent(context: SpanContext): string {
  const flags = context.traceFlags.toString(16).padStart(2, '0');
  return `00-${context.traceId}-${context.spanId}-${flags}`;
}

// ============================================
// SPAN MANAGEMENT
// ============================================

// Active spans storage (keyed by spanId)
const activeSpans = new Map<string, Span>();

/**
 * Create a new span
 */
export function startSpan(
  name: string,
  options: {
    kind?: SpanKind;
    parentContext?: SpanContext;
    attributes?: Record<string, string | number | boolean>;
  } = {}
): Span {
  const ctx = requestContext.get();
  const parentContext = options.parentContext || ctx?.traceContext;

  const span: Span = {
    name,
    context: {
      traceId: parentContext?.traceId || generateTraceId(),
      spanId: generateSpanId(),
      parentSpanId: parentContext?.spanId,
      traceFlags: parentContext?.traceFlags ?? 1,
    },
    startTime: Date.now(),
    status: 'unset',
    attributes: options.attributes || {},
    events: [],
    kind: options.kind || 'internal',
  };

  activeSpans.set(span.context.spanId, span);

  if (enabled) {
    logger.debug({
      traceId: span.context.traceId,
      spanId: span.context.spanId,
      parentSpanId: span.context.parentSpanId,
      name,
      kind: span.kind,
    }, `Span started: ${name}`);
  }

  return span;
}

/**
 * End a span
 */
export function endSpan(span: Span, status?: 'ok' | 'error'): void {
  span.endTime = Date.now();
  span.duration = span.endTime - span.startTime;
  span.status = status || 'ok';

  activeSpans.delete(span.context.spanId);

  if (enabled) {
    logger.info({
      traceId: span.context.traceId,
      spanId: span.context.spanId,
      parentSpanId: span.context.parentSpanId,
      name: span.name,
      duration: span.duration,
      status: span.status,
      attributes: span.attributes,
      events: span.events,
      kind: span.kind,
    }, `Span completed: ${span.name}`);
  }
}

/**
 * Add an event to a span
 */
export function addSpanEvent(
  span: Span,
  name: string,
  attributes?: Record<string, string | number | boolean>
): void {
  span.events.push({
    name,
    timestamp: Date.now(),
    attributes,
  });
}

/**
 * Set span attributes
 */
export function setSpanAttributes(
  span: Span,
  attributes: Record<string, string | number | boolean>
): void {
  Object.assign(span.attributes, attributes);
}

/**
 * Set span status to error
 */
export function setSpanError(span: Span, error: Error): void {
  span.status = 'error';
  setSpanAttributes(span, {
    'error.type': error.name,
    'error.message': error.message,
  });
  addSpanEvent(span, 'exception', {
    'exception.type': error.name,
    'exception.message': error.message,
  });
}

// ============================================
// TRACING MIDDLEWARE
// ============================================

/**
 * Express middleware for distributed tracing
 * Creates a root span for each request and propagates trace context
 */
export function tracingMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!enabled) return next();

    // Parse incoming trace context or create new
    const traceparent = req.headers['traceparent'] as string;
    let spanContext: SpanContext;

    if (traceparent) {
      const parsed = parseTraceparent(traceparent);
      spanContext = parsed || {
        traceId: generateTraceId(),
        spanId: generateSpanId(),
        traceFlags: 1,
      };
    } else {
      spanContext = {
        traceId: generateTraceId(),
        spanId: generateSpanId(),
        traceFlags: 1,
      };
    }

    // Create root span for this request
    const span = startSpan(`${req.method} ${normalizePath(req.path)}`, {
      kind: 'server',
      parentContext: spanContext.parentSpanId ? spanContext : undefined,
      attributes: {
        'http.method': req.method,
        'http.url': req.originalUrl,
        'http.route': req.route?.path || req.path,
        'http.user_agent': req.headers['user-agent'] || '',
        'http.client_ip': req.ip || '',
        'service.name': 'ils-api',
      },
    });

    // Store trace context in request context
    const ctx = requestContext.get();
    if (ctx) {
      (ctx as any).traceContext = span.context;
      (ctx as any).rootSpan = span;
    }

    // Set response headers for trace propagation
    res.setHeader('traceparent', formatTraceparent(span.context));
    res.setHeader('X-Trace-Id', span.context.traceId);

    // Capture response
    res.on('finish', () => {
      setSpanAttributes(span, {
        'http.status_code': res.statusCode,
        'http.response_content_length': parseInt(res.getHeader('content-length') as string) || 0,
      });

      if (res.statusCode >= 400) {
        span.status = 'error';
        setSpanAttributes(span, {
          'error.type': res.statusCode >= 500 ? 'server_error' : 'client_error',
        });
      }

      endSpan(span, res.statusCode < 400 ? 'ok' : 'error');
    });

    next();
  };
}

/**
 * Normalize path for span names (remove IDs)
 */
function normalizePath(path: string): string {
  return path
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    .replace(/\/\d+/g, '/:id');
}

// ============================================
// SPAN DECORATORS FOR COMMON OPERATIONS
// ============================================

/**
 * Trace a database operation
 */
export async function traceDbOperation<T>(
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!enabled) return fn();

  const span = startSpan(`db.${operation}`, {
    kind: 'client',
    attributes: {
      'db.system': 'postgresql',
      'db.operation': operation,
      'db.sql.table': table,
    },
  });

  try {
    const result = await fn();
    endSpan(span, 'ok');
    return result;
  } catch (error) {
    if (error instanceof Error) {
      setSpanError(span, error);
    }
    endSpan(span, 'error');
    throw error;
  }
}

/**
 * Trace an external HTTP call
 */
export async function traceHttpCall<T>(
  service: string,
  method: string,
  url: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!enabled) return fn();

  const span = startSpan(`http.${service}`, {
    kind: 'client',
    attributes: {
      'http.method': method,
      'http.url': url,
      'peer.service': service,
    },
  });

  try {
    const result = await fn();
    endSpan(span, 'ok');
    return result;
  } catch (error) {
    if (error instanceof Error) {
      setSpanError(span, error);
    }
    endSpan(span, 'error');
    throw error;
  }
}

/**
 * Trace an AI service call
 */
export async function traceAiCall<T>(
  provider: string,
  model: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!enabled) return fn();

  const span = startSpan(`ai.${provider}.${operation}`, {
    kind: 'client',
    attributes: {
      'ai.provider': provider,
      'ai.model': model,
      'ai.operation': operation,
    },
  });

  try {
    const result = await fn();
    endSpan(span, 'ok');
    return result;
  } catch (error) {
    if (error instanceof Error) {
      setSpanError(span, error);
    }
    endSpan(span, 'error');
    throw error;
  }
}

/**
 * Trace a cache operation
 */
export async function traceCacheOperation<T>(
  operation: 'get' | 'set' | 'delete',
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!enabled) return fn();

  const span = startSpan(`cache.${operation}`, {
    kind: 'client',
    attributes: {
      'cache.operation': operation,
      'cache.key': key,
    },
  });

  try {
    const result = await fn();
    setSpanAttributes(span, {
      'cache.hit': result !== null && result !== undefined,
    });
    endSpan(span, 'ok');
    return result;
  } catch (error) {
    if (error instanceof Error) {
      setSpanError(span, error);
    }
    endSpan(span, 'error');
    throw error;
  }
}

/**
 * Create a child span within the current trace
 */
export function withSpan<T>(
  name: string,
  fn: (span: Span) => T | Promise<T>,
  options?: {
    kind?: SpanKind;
    attributes?: Record<string, string | number | boolean>;
  }
): Promise<T> {
  if (!enabled) return Promise.resolve(fn({} as Span));

  const span = startSpan(name, options);

  try {
    const result = fn(span);

    if (result instanceof Promise) {
      return result
        .then((value) => {
          endSpan(span, 'ok');
          return value;
        })
        .catch((error) => {
          if (error instanceof Error) {
            setSpanError(span, error);
          }
          endSpan(span, 'error');
          throw error;
        });
    }

    endSpan(span, 'ok');
    return Promise.resolve(result);
  } catch (error) {
    if (error instanceof Error) {
      setSpanError(span, error);
    }
    endSpan(span, 'error');
    throw error;
  }
}

// ============================================
// TRACE CONTEXT UTILITIES
// ============================================

/**
 * Get current trace context from request context
 */
export function getCurrentTraceContext(): SpanContext | undefined {
  const ctx = requestContext.get();
  return (ctx as any)?.traceContext;
}

/**
 * Get current trace ID
 */
export function getCurrentTraceId(): string | undefined {
  return getCurrentTraceContext()?.traceId;
}

/**
 * Inject trace context into outgoing headers
 */
export function injectTraceContext(headers: Record<string, string>): void {
  const context = getCurrentTraceContext();
  if (context) {
    headers['traceparent'] = formatTraceparent(context);
    if (context.traceState) {
      headers['tracestate'] = context.traceState;
    }
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  tracingMiddleware,
  startSpan,
  endSpan,
  addSpanEvent,
  setSpanAttributes,
  setSpanError,
  traceDbOperation,
  traceHttpCall,
  traceAiCall,
  traceCacheOperation,
  withSpan,
  getCurrentTraceContext,
  getCurrentTraceId,
  injectTraceContext,
};
