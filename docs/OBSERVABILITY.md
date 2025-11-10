# Observability & Monitoring Guide

Comprehensive guide to logging, monitoring, tracing, and alerting in ILS 2.0.

## Table of Contents

1. [Overview](#overview)
2. [Structured Logging](#structured-logging)
3. [Distributed Tracing](#distributed-tracing)
4. [Error Tracking](#error-tracking)
5. [Metrics & Monitoring](#metrics--monitoring)
6. [Alerting](#alerting)
7. [Dashboards](#dashboards)
8. [Best Practices](#best-practices)

## Overview

ILS 2.0 uses a comprehensive observability stack:

- **Logging**: Pino for structured JSON logging
- **Tracing**: OpenTelemetry for distributed tracing
- **Error Tracking**: Sentry for error monitoring and alerting
- **Metrics**: Prometheus for metrics collection
- **Visualization**: Grafana for dashboards
- **Alerting**: Prometheus Alertmanager

### The Three Pillars of Observability

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Logs       │      │   Metrics    │      │   Traces     │
│              │      │              │      │              │
│  Structured  │      │  Prometheus  │      │OpenTelemetry │
│  JSON logs   │      │   metrics    │      │   spans      │
└──────────────┘      └──────────────┘      └──────────────┘
       │                     │                     │
       └─────────────────────┴─────────────────────┘
                            │
                     ┌──────▼──────┐
                     │   Grafana   │
                     │  Dashboards │
                     └─────────────┘
```

## Structured Logging

### Overview

Pino-based structured logging with:
- JSON format in production
- Pretty-print in development
- Automatic sensitive data redaction
- Correlation IDs for request tracing
- Component-specific loggers

### Configuration

Set log level via environment variable:

```bash
# Development (default: debug)
LOG_LEVEL=debug

# Production (default: info)
LOG_LEVEL=info

# Available levels: trace, debug, info, warn, error, fatal
```

### Using the Logger

#### Basic Usage

```typescript
import logger from './utils/logger';

// Simple logging
logger.info('Application started');
logger.warn('Cache miss', { key: 'user:123' });
logger.error({ err: error }, 'Database connection failed');
```

#### Component Loggers

```typescript
import { loggers } from './utils/logger';

// Use component-specific loggers
loggers.database.info('Query executed', { duration: 45, query: 'SELECT...' });
loggers.auth.warn('Failed login attempt', { email: 'user@example.com' });
loggers.ai.info('AI request completed', { model: 'gpt-4', tokens: 1500 });
```

#### Performance Timing

```typescript
import { PerformanceTimer } from './utils/logger';

async function complexOperation() {
  const timer = new PerformanceTimer('complexOperation', { userId: '123' });

  try {
    // Do work
    await doWork();
    timer.end({ recordsProcessed: 100 });
  } catch (error) {
    timer.endWithError(error);
    throw error;
  }
}
```

#### Automatic Logging Wrapper

```typescript
import { loggedOperation } from './utils/logger';

const result = await loggedOperation(
  'fetchUserData',
  async () => {
    return await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  },
  { userId }
);
```

### Request Logging

Every HTTP request automatically gets:
- Correlation ID (`X-Correlation-ID` header)
- Request/response logging
- Response time tracking
- Automatic error logging

### Security Event Logging

```typescript
import { logSecurityEvent } from './utils/logger';

logSecurityEvent(
  'suspicious_login_attempt',
  'high',
  {
    userId: '123',
    ip: '192.168.1.1',
    reason: 'Multiple failed attempts',
  }
);
```

### Audit Logging

```typescript
import { logAudit } from './utils/logger';

logAudit(
  'user_deleted',
  currentUserId,
  `user:${targetUserId}`,
  { reason: 'User requested account deletion' }
);
```

### Log Format

**Development** (pretty-printed):
```
[10:30:45 AM] INFO: User logged in
    userId: "123"
    component: "auth"
```

**Production** (JSON):
```json
{
  "level": "info",
  "time": "2024-11-08T10:30:45.123Z",
  "msg": "User logged in",
  "userId": "123",
  "component": "auth",
  "service": "ils-api",
  "env": "production"
}
```

### Sensitive Data Redaction

Automatically redacted fields:
- `password`
- `token`
- `secret`
- `apiKey`
- `authorization` header
- `cookie` header

## Distributed Tracing

### Overview

OpenTelemetry provides distributed tracing across:
- HTTP requests
- Database queries
- Redis operations
- External API calls

### Configuration

Enable OpenTelemetry:

```bash
# Enable tracing
OTEL_ENABLED=true

# Prometheus metrics port
OTEL_PROMETHEUS_PORT=9464
```

### Automatic Instrumentation

OpenTelemetry automatically traces:
- Express routes
- PostgreSQL queries
- Redis commands
- HTTP client requests

No code changes required!

### Custom Spans

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('ils-api');

async function processOrder(orderId: string) {
  const span = tracer.startSpan('process_order');
  span.setAttribute('order.id', orderId);

  try {
    // Your code here
    const result = await doWork();
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    throw error;
  } finally {
    span.end();
  }
}
```

### Trace Context Propagation

Correlation IDs are automatically propagated:
- In HTTP headers (`X-Correlation-ID`)
- Across microservices
- To external systems

## Error Tracking

### Overview

Sentry provides:
- Real-time error tracking
- Performance monitoring
- Release tracking
- User context
- Breadcrumbs

### Configuration

```bash
# Enable Sentry
SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Optional: Enable in development
SENTRY_DEVELOPMENT=true
```

### Automatic Error Capture

All uncaught exceptions and unhandled rejections are automatically sent to Sentry.

### Manual Error Capture

```typescript
import { captureException, captureMessage } from './utils/sentry';

try {
  // Risky operation
} catch (error) {
  captureException(error, {
    tags: {
      component: 'payment',
      severity: 'high',
    },
    extra: {
      orderId: '123',
      amount: 99.99,
    },
    level: 'error',
  });
}

// Capture messages
captureMessage('Payment gateway timeout', 'warning', {
  tags: { gateway: 'stripe' },
  extra: { attemptNumber: 3 },
});
```

### User Context

```typescript
import { setUserContext, clearUserContext } from './utils/sentry';

// On login
setUserContext({
  id: user.id,
  email: user.email,
  role: user.role,
  organizationName: user.organizationName,
});

// On logout
clearUserContext();
```

### Breadcrumbs

```typescript
import { addBreadcrumb } from './utils/sentry';

addBreadcrumb(
  'User initiated checkout',
  'user-action',
  'info',
  { cartTotal: 299.99, itemCount: 3 }
);
```

### Performance Monitoring

```typescript
import { withTransaction } from './utils/sentry';

const result = await withTransaction(
  'process-payment',
  'payment',
  async (transaction) => {
    // Your code here
    const result = await processPayment();

    // Add custom data
    transaction?.setData('amount', amount);
    transaction?.setData('currency', 'GBP');

    return result;
  }
);
```

## Metrics & Monitoring

### Prometheus Metrics

Access Prometheus metrics:
```bash
curl http://localhost:9464/metrics
```

### Available Metrics

#### HTTP Metrics
- `http_requests_total` - Total HTTP requests
- `http_request_duration_ms` - Request duration histogram
- `http_requests_active` - Currently active requests

#### Database Metrics
- `db_query_duration_ms` - Database query duration
- `db_connections_active` - Active database connections
- `db_queries_total` - Total database queries

#### Application Metrics
- `nodejs_heap_size_total_bytes` - Node.js heap size
- `nodejs_heap_size_used_bytes` - Used heap size
- `nodejs_eventloop_lag_seconds` - Event loop lag

### Custom Metrics

```typescript
import { metrics } from './utils/metrics';

// Counter
metrics.counter('orders_created_total', {
  labels: { status: 'success' },
});

// Gauge
metrics.gauge('active_users', activeUserCount);

// Histogram
metrics.histogram('payment_amount', amount, {
  labels: { currency: 'GBP' },
});
```

## Alerting

### Alert Rules

Located in `monitoring/prometheus/alerts/ils-alerts.yml`:

#### Critical Alerts
- `HighErrorRate`: >5% error rate for 5 minutes
- `SLOAvailabilityBreach`: <99.9% availability over 30 days
- `LowDiskSpace`: <15% disk space remaining

#### Warning Alerts
- `SlowResponseTime`: P95 >1000ms for 10 minutes
- `HighRequestRate`: >1000 req/s for 2 minutes
- `DatabaseConnectionPoolHigh`: >80% connections used
- `HighCPUUsage`: >80% CPU for 10 minutes
- `HighMemoryUsage`: >85% memory for 5 minutes

### Alert Notifications

Configure Alertmanager for notifications:

```yaml
# alertmanager.yml
route:
  receiver: 'team-email'
  group_by: ['severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h

receivers:
  - name: 'team-email'
    email_configs:
      - to: 'alerts@ils.com'
        from: 'alertmanager@ils.com'

  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#alerts'
```

## Dashboards

### Grafana Dashboards

Pre-built dashboards in `monitoring/grafana-dashboards/`:

#### ILS Overview Dashboard
- Request rate and error rate
- Response time (P95, P99)
- Active users
- Database connections
- System resources

### Accessing Dashboards

1. **Local Development**:
   ```bash
   docker-compose up grafana
   # Access at http://localhost:3000
   ```

2. **Production**:
   - Access via your Grafana instance
   - Import dashboards from `monitoring/grafana-dashboards/`

### Creating Custom Dashboards

1. Create JSON dashboard in `monitoring/grafana-dashboards/`
2. Use Prometheus as data source
3. Query metrics using PromQL

Example query:
```promql
# Request rate by endpoint
rate(http_requests_total[5m])

# P95 response time
histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))

# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m]))
```

## Best Practices

### Logging

✅ **DO**:
- Use structured logging with context
- Use appropriate log levels
- Include correlation IDs
- Log business events
- Log performance metrics

❌ **DON'T**:
- Log sensitive data (passwords, tokens)
- Use `console.log` in production code
- Log every database query at info level
- Include stack traces at info level

### Tracing

✅ **DO**:
- Name spans descriptively
- Add relevant attributes
- Propagate trace context
- Sample appropriately (10% in production)

❌ **DON'T**:
- Create too many spans (noise)
- Include sensitive data in attributes
- Trace health check endpoints

### Error Tracking

✅ **DO**:
- Add context to errors
- Set user context
- Use breadcrumbs
- Tag errors appropriately
- Set severity levels

❌ **DON'T**:
- Capture expected errors
- Send sensitive data
- Capture too many events (stay within quota)

### Metrics

✅ **DO**:
- Use meaningful metric names
- Add labels for dimensions
- Document metric meanings
- Set appropriate buckets for histograms

❌ **DON'T**:
- Create high-cardinality labels
- Use metrics for logs
- Create too many metrics

### Alerting

✅ **DO**:
- Alert on symptoms, not causes
- Set appropriate thresholds
- Include runbook links
- Use severity levels
- Test alerts regularly

❌ **DON'T**:
- Alert on everything
- Set thresholds too low (noise)
- Alert without actionable steps
- Ignore flapping alerts

## Troubleshooting

### No Logs Appearing

```bash
# Check log level
echo $LOG_LEVEL

# Enable debug logging
export LOG_LEVEL=debug
```

### Traces Not Being Collected

```bash
# Verify OpenTelemetry is enabled
echo $OTEL_ENABLED

# Check Prometheus endpoint
curl http://localhost:9464/metrics
```

### Sentry Not Capturing Errors

```bash
# Verify DSN is set
echo $SENTRY_DSN

# Check Sentry is initialized
curl http://localhost:5000/api/observability/config
```

### High Memory Usage from Logging

```bash
# Reduce log level
export LOG_LEVEL=warn

# Disable pretty printing in production
export NODE_ENV=production
```

## SLIs and SLOs

### Service Level Indicators (SLIs)

- **Availability**: Percentage of successful requests (non-5xx)
- **Latency**: P95 response time
- **Error Rate**: Percentage of failed requests

### Service Level Objectives (SLOs)

| Metric | SLO | Measurement Window |
|--------|-----|-------------------|
| Availability | 99.9% | 30 days |
| P95 Latency | <500ms | 30 days |
| Error Rate | <1% | 7 days |

### Error Budget

- **99.9% availability** = 43.2 minutes downtime per month
- Monitor error budget burn rate
- Alert when burn rate is high

## References

- [Pino Documentation](https://getpino.io)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Sentry Documentation](https://docs.sentry.io/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

## Support

For observability issues:
- Platform Team: platform@ils.com
- DevOps Team: devops@ils.com
- On-call: See PagerDuty rotation
