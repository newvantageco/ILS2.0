# System Administration & Platform Management

Comprehensive platform administration tools for monitoring, configuration, and system operations.

## Overview

Phase 15 implements a complete system administration platform with:

- **System Monitoring**: Real-time health checks, performance metrics, and alerting
- **Configuration Management**: System-wide settings, feature flags, and environment configuration
- **Admin Operations**: User management, audit logging, and system maintenance
- **RESTful API**: 40+ endpoints for complete administrative control

## Architecture

```
server/
├── services/admin/
│   ├── SystemMonitoringService.ts      # Health monitoring & metrics
│   ├── ConfigurationService.ts         # Settings & feature flags
│   └── AdminOperationsService.ts       # User management & operations
└── routes/
    └── system-admin.ts                 # Admin API routes
```

## Features

### 1. System Monitoring

Real-time monitoring of system health, performance, and component status.

#### Component Registration

```typescript
SystemMonitoringService.registerComponent({
  id: 'api-server',
  name: 'API Server',
  type: 'api',
  status: 'healthy'
});
```

**Supported Component Types:**
- `service` - Application services
- `database` - Database systems
- `cache` - Caching layers (Redis)
- `queue` - Message queues
- `storage` - File storage systems
- `api` - API endpoints

#### Health Checks

Automated health checks run every 30 seconds:

```typescript
const health = SystemMonitoringService.getHealthStatus();
// Returns overall status + component details
```

**Health Statuses:**
- `healthy` - All systems operational
- `degraded` - Some components experiencing issues
- `unhealthy` - Multiple components failing
- `critical` - System-wide critical issues

#### Performance Metrics

```typescript
// Record custom metrics
SystemMonitoringService.recordMetric(
  'api_response_time',
  'gauge',
  125.5,
  'ms',
  { endpoint: '/api/patients', method: 'GET' }
);

// Query metrics
const metrics = SystemMonitoringService.getMetrics(
  'api_response_time',
  startDate,
  endDate
);
```

**Metric Types:**
- `counter` - Monotonically increasing values
- `gauge` - Point-in-time measurements
- `histogram` - Distribution of values

#### System Metrics

Automatically collected every 30 seconds:

```typescript
const metrics = SystemMonitoringService.collectSystemMetrics();
```

**Collected Metrics:**
- **CPU**: Usage percentage, load average, core count
- **Memory**: Total, used, free, usage percentage
- **Disk**: Total, used, free, usage percentage
- **Network**: Bytes in/out, active connections
- **Application**: Active requests, request rate, response times, error rates

#### Alerts

```typescript
const alert = SystemMonitoringService.createAlert(
  'critical',
  'api-server',
  'High CPU usage detected',
  'CPU usage at 95%',
  90,
  95
);
```

**Alert Severities:**
- `info` - Informational messages
- `warning` - Potential issues
- `error` - Confirmed problems
- `critical` - Urgent issues requiring immediate attention

**Alert Management:**
```typescript
// Acknowledge alert
SystemMonitoringService.acknowledgeAlert(alertId, userId);

// Resolve alert
SystemMonitoringService.resolveAlert(alertId, userId);

// Query alerts
const alerts = SystemMonitoringService.getAlerts('critical', 'api-server');
```

#### Monitoring Thresholds

**Default Thresholds:**
```typescript
{
  cpu: { warning: 70%, critical: 90% },
  memory: { warning: 80%, critical: 95% },
  disk: { warning: 80%, critical: 90% },
  responseTime: { warning: 1000ms, critical: 3000ms },
  errorRate: { warning: 1%, critical: 5% }
}
```

### 2. Configuration Management

System-wide configuration with versioning, validation, and audit trails.

#### Configuration Settings

**Pre-configured Settings:**

```typescript
// System settings
system.name = "ILS 2.0"
system.timezone = "America/New_York"
system.maintenance_mode = false

// Security settings
security.session_timeout = 86400000 (24 hours)
security.password_min_length = 8
security.mfa_enabled = false
security.max_login_attempts = 5

// Integration settings
integration.fhir_enabled = true
integration.hl7_enabled = true

// Communication settings
communication.email_enabled = true
communication.sms_enabled = true
communication.smtp_host = "smtp.example.com"

// Clinical settings
clinical.appointment_duration_default = 30 minutes
clinical.prescription_refill_days = 30

// UI settings
ui.theme = "light"
ui.items_per_page = 25
```

#### Managing Settings

```typescript
// Get setting
const setting = ConfigurationService.getSetting('security.session_timeout');

// Get value directly
const value = ConfigurationService.getValue('security.session_timeout');

// Update setting
ConfigurationService.updateSetting(
  'security.session_timeout',
  43200000, // 12 hours
  userId,
  'Updated for security compliance'
);

// Reset to default
ConfigurationService.resetSetting('security.session_timeout', userId);
```

#### Setting Categories

- `system` - Core system settings
- `security` - Authentication and authorization
- `integration` - Third-party integrations
- `communication` - Messaging and notifications
- `billing` - Payment and invoicing
- `clinical` - Clinical workflow settings
- `ui` - User interface preferences
- `feature_flags` - Feature toggles

#### Setting Validation

```typescript
{
  validation: {
    required: true,
    min: 300000,        // 5 minutes
    max: 604800000,     // 7 days
    allowedValues: ['USD', 'EUR', 'GBP'],
    pattern: '^[A-Z]{3}$'
  }
}
```

#### Encrypted Settings

Sensitive data is encrypted using AES-256-CBC:

```typescript
// Automatically encrypted
communication.smtp_password = "***ENCRYPTED***"

// Decrypted when retrieved
const password = ConfigurationService.getValue('communication.smtp_password');
```

#### Change History

```typescript
const history = ConfigurationService.getChangeHistory(
  'security.session_timeout',
  userId
);
```

**Retention:** 90 days

### 3. Feature Flags

Dynamic feature enablement with gradual rollout capabilities.

#### Default Feature Flags

```typescript
feature.telehealth = enabled
feature.patient_portal = enabled
feature.analytics = enabled
feature.ai_diagnostics = disabled (10% rollout)
feature.mobile_app = disabled (dev/staging only)
feature.campaigns = enabled
feature.integrations = enabled
```

#### Feature Management

```typescript
// Check if feature is enabled
const enabled = ConfigurationService.isFeatureEnabled(
  'feature.ai_diagnostics',
  userId,
  userRole
);

// Enable/disable feature
ConfigurationService.enableFeature('feature.mobile_app', adminId);
ConfigurationService.disableFeature('feature.ai_diagnostics', adminId);

// Gradual rollout
ConfigurationService.setRolloutPercentage('feature.ai_diagnostics', 25, adminId);
```

#### Targeting Options

**User-based:**
```typescript
{
  targetUserIds: ['user-123', 'user-456'],
  rolloutPercentage: 50  // 50% of users
}
```

**Role-based:**
```typescript
{
  targetRoles: ['admin', 'provider']
}
```

**Environment-based:**
```typescript
{
  targetEnvironments: ['development', 'staging']
}
```

**Scheduled:**
```typescript
{
  scheduleEnableAt: new Date('2025-01-01'),
  scheduleDisableAt: new Date('2025-12-31')
}
```

### 4. Admin Operations

User management, audit logging, and system maintenance operations.

#### User Management

**Roles:**
- `super_admin` - Full system access
- `admin` - Administrative access
- `manager` - Management functions
- `provider` - Clinical provider
- `staff` - General staff
- `user` - Basic user

**User Operations:**
```typescript
// Create user
const user = AdminOperationsService.createUser({
  email: 'admin@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'admin',
  password: 'SecurePass123',
  mfaEnabled: true
}, createdBy);

// Update user
AdminOperationsService.updateUser(userId, {
  role: 'manager',
  status: 'active'
}, updatedBy);

// Password management
await AdminOperationsService.changePassword(userId, oldPass, newPass);
await AdminOperationsService.resetPassword(userId, newPass, adminId);

// User status
AdminOperationsService.suspendUser(userId, adminId);
AdminOperationsService.unsuspendUser(userId, adminId);
AdminOperationsService.deleteUser(userId, adminId);
```

**User Statuses:**
- `active` - Normal active user
- `suspended` - Temporarily suspended
- `locked` - Locked due to failed attempts
- `pending` - Pending activation
- `deleted` - Soft deleted

#### Permissions

Role-based permission system:

```typescript
const hasPermission = AdminOperationsService.hasPermission(
  userId,
  'patients.write'
);
```

**Permission Types:**
- `users.*` - User management
- `patients.*` - Patient data access
- `appointments.*` - Appointment management
- `billing.*` - Billing operations
- `reports.*` - Report access
- `config.*` - Configuration management
- `system.admin` - System administration

#### Audit Logging

All administrative actions are automatically logged:

```typescript
// Query audit logs
const logs = AdminOperationsService.getAuditLogs({
  userId: 'admin-123',
  action: 'update_user',
  resource: 'user',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-31')
});
```

**Logged Information:**
- User ID and name
- Action performed
- Resource and resource ID
- Timestamp
- IP address and user agent
- Success/failure status
- Error messages

**Retention:** 365 days

#### System Operations

Execute administrative operations:

```typescript
const result = await AdminOperationsService.executeOperation(
  'clear_cache',
  adminId,
  { cacheType: 'all' }
);
```

**Available Operations:**

**Cache Management:**
- `clear_cache` - Clear system caches

**Database Maintenance:**
- `rebuild_indexes` - Rebuild database indexes
- `vacuum_database` - Reclaim storage space
- `run_migrations` - Execute pending migrations

**Data Operations:**
- `export_data` - Export data to file
- `import_data` - Import data from file

**Backup & Restore:**
- `backup_database` - Create database backup
- `restore_database` - Restore from backup

#### Bulk Operations

Process large batches of data:

```typescript
const operation = AdminOperationsService.createBulkOperation(
  'update',
  'users',
  { role: 'staff' },
  { status: 'active' },
  adminId
);

// Monitor progress
const status = AdminOperationsService.getBulkOperation(operation.id);
```

**Operation Types:**
- `delete` - Bulk delete records
- `update` - Bulk update records
- `export` - Bulk export data

**Status Tracking:**
- `pending` - Queued for execution
- `running` - Currently processing
- `completed` - Successfully completed
- `failed` - Failed with errors

## API Reference

### System Monitoring Endpoints

```
GET    /api/system-admin/health
GET    /api/system-admin/metrics/system
GET    /api/system-admin/metrics/performance
POST   /api/system-admin/metrics/record
GET    /api/system-admin/alerts
POST   /api/system-admin/alerts/:id/acknowledge
POST   /api/system-admin/alerts/:id/resolve
GET    /api/system-admin/statistics
```

### Configuration Endpoints

```
GET    /api/system-admin/config/settings
GET    /api/system-admin/config/settings/:key
GET    /api/system-admin/config/settings/:key/value
PUT    /api/system-admin/config/settings/:key
POST   /api/system-admin/config/settings/:key/reset
GET    /api/system-admin/config/history
GET    /api/system-admin/config/export
POST   /api/system-admin/config/import
```

### Feature Flag Endpoints

```
GET    /api/system-admin/features
GET    /api/system-admin/features/:key
GET    /api/system-admin/features/:key/enabled
PUT    /api/system-admin/features/:key
POST   /api/system-admin/features/:key/enable
POST   /api/system-admin/features/:key/disable
POST   /api/system-admin/features/:key/rollout
```

### User Management Endpoints

```
POST   /api/system-admin/users
GET    /api/system-admin/users
GET    /api/system-admin/users/:id
PUT    /api/system-admin/users/:id
DELETE /api/system-admin/users/:id
POST   /api/system-admin/users/:id/password/change
POST   /api/system-admin/users/:id/password/reset
POST   /api/system-admin/users/:id/suspend
POST   /api/system-admin/users/:id/unsuspend
GET    /api/system-admin/users/:id/permissions/:permission
```

### Audit & Operations Endpoints

```
GET    /api/system-admin/audit
POST   /api/system-admin/operations/:operation
POST   /api/system-admin/bulk
GET    /api/system-admin/bulk/:id
GET    /api/system-admin/bulk
GET    /api/system-admin/admin/statistics
```

## Usage Examples

### Monitor System Health

```typescript
// Check overall health
const health = await fetch('/api/system-admin/health')
  .then(r => r.json());

console.log(`System Status: ${health.health.overall}`);
console.log(`Uptime: ${health.health.uptime}s`);

// Check specific component
const apiServer = health.health.components.find(c => c.id === 'api-server');
console.log(`API Status: ${apiServer.status}`);
```

### Manage Feature Flags

```typescript
// Enable new feature
await fetch('/api/system-admin/features/feature.ai_diagnostics/enable', {
  method: 'POST',
  body: JSON.stringify({ userId: adminId })
});

// Gradual rollout
await fetch('/api/system-admin/features/feature.ai_diagnostics/rollout', {
  method: 'POST',
  body: JSON.stringify({
    percentage: 10,
    userId: adminId
  })
});

// Check if enabled for user
const response = await fetch(
  `/api/system-admin/features/feature.ai_diagnostics/enabled?userId=${userId}`
);
const { enabled } = await response.json();
```

### Update Configuration

```typescript
// Update session timeout
await fetch('/api/system-admin/config/settings/security.session_timeout', {
  method: 'PUT',
  body: JSON.stringify({
    value: 43200000, // 12 hours
    userId: adminId,
    reason: 'Security policy update'
  })
});

// View change history
const history = await fetch(
  '/api/system-admin/config/history?key=security.session_timeout'
).then(r => r.json());
```

### User Management

```typescript
// Create new admin user
const user = await fetch('/api/system-admin/users', {
  method: 'POST',
  body: JSON.stringify({
    userData: {
      email: 'newadmin@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'admin',
      password: 'SecurePass123'
    },
    createdBy: currentAdminId
  })
}).then(r => r.json());

// Suspend user
await fetch(`/api/system-admin/users/${userId}/suspend`, {
  method: 'POST',
  body: JSON.stringify({ suspendedBy: adminId })
});
```

### Execute System Operations

```typescript
// Clear cache
const result = await fetch('/api/system-admin/operations/clear_cache', {
  method: 'POST',
  body: JSON.stringify({
    userId: adminId,
    params: { cacheType: 'all' }
  })
}).then(r => r.json());

console.log(`Duration: ${result.result.duration}ms`);
console.log(`Message: ${result.result.message}`);

// Backup database
await fetch('/api/system-admin/operations/backup_database', {
  method: 'POST',
  body: JSON.stringify({
    userId: adminId,
    params: { compressed: true }
  })
});
```

## Security Considerations

### Authentication & Authorization

- All endpoints require authentication via `isAuthenticated` middleware
- Implement additional permission checks for sensitive operations
- Use role-based access control for user management

**Recommended Middleware:**
```typescript
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

app.use('/api/system-admin/operations', isAuthenticated, requireSuperAdmin);
```

### Audit Trail

All administrative actions are logged with:
- User identification
- Timestamp
- Action details
- IP address
- Success/failure status

### Password Security

- Passwords hashed using bcrypt with 10 salt rounds
- Account lockout after 5 failed attempts (30-minute lockout)
- Password complexity requirements enforced
- MFA support for enhanced security

### Data Encryption

- Sensitive configuration values encrypted using AES-256-CBC
- Encryption keys stored in environment variables
- Never expose encrypted values in API responses

## Production Deployment

### Database Migration

Replace in-memory storage with production database:

```typescript
// Instead of Map
private static settings = new Map<string, ConfigSetting>();

// Use database
import { db } from '../db';
const setting = await db.settings.findOne({ key });
```

### Caching

Implement Redis for distributed caching:

```typescript
import { redis } from '../cache';

// Cache configuration
await redis.set(`config:${key}`, JSON.stringify(setting), 'EX', 300);
```

### Monitoring Integration

Integrate with production monitoring tools:

```typescript
// Prometheus metrics export
app.get('/metrics', async (req, res) => {
  const metrics = SystemMonitoringService.collectSystemMetrics();
  res.set('Content-Type', 'text/plain');
  res.send(formatPrometheusMetrics(metrics));
});

// Datadog integration
import { StatsD } from 'node-dogstatsd';
const statsd = new StatsD();
statsd.gauge('system.cpu.usage', metrics.cpu.usage);
```

### Alert Notifications

Implement real-time alerting:

```typescript
// Email notifications
import { sendEmail } from '../email';
if (alert.severity === 'critical') {
  await sendEmail({
    to: 'ops@example.com',
    subject: `CRITICAL: ${alert.message}`,
    body: alert.details
  });
}

// Slack integration
import { webhook } from '@slack/webhook';
await webhook.send({
  text: `🚨 ${alert.severity.toUpperCase()}: ${alert.message}`
});

// PagerDuty integration
import { PagerDuty } from 'pdjs';
await pd.incidents.create({
  title: alert.message,
  urgency: alert.severity === 'critical' ? 'high' : 'low'
});
```

### Backup Strategy

Implement automated backups:

```typescript
// Daily backup cron job
import cron from 'node-cron';

cron.schedule('0 2 * * *', async () => {
  await AdminOperationsService.executeOperation(
    'backup_database',
    'system',
    { compressed: true }
  );
});
```

## Performance Optimization

### Caching Strategy

```typescript
// Cache frequently accessed settings
const CACHE_TTL = 300; // 5 minutes
const cache = new Map();

static getValue(key: string): any {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const value = this.settings.get(key)?.value;
  cache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL * 1000
  });

  return value;
}
```

### Batch Operations

Use bulk operations for large-scale changes:

```typescript
// Instead of individual updates
for (const user of users) {
  await updateUser(user.id, { status: 'active' });
}

// Use bulk operation
const operation = AdminOperationsService.createBulkOperation(
  'update',
  'users',
  { status: 'pending' },
  { status: 'active' },
  adminId
);
```

### Query Optimization

```typescript
// Index frequently queried fields
await db.collection('audit_logs').createIndex({ userId: 1, timestamp: -1 });
await db.collection('settings').createIndex({ category: 1, key: 1 });
```

## Best Practices

1. **Regular Health Checks**: Monitor system health continuously
2. **Audit Everything**: Log all administrative actions
3. **Gradual Rollouts**: Use feature flags for new features
4. **Configuration Versioning**: Track all configuration changes
5. **Backup Regularly**: Implement automated backup schedules
6. **Access Control**: Restrict admin access appropriately
7. **Monitor Alerts**: Set up real-time alert notifications
8. **Performance Metrics**: Track system performance over time
9. **Change Management**: Require reasons for configuration changes
10. **Security First**: Encrypt sensitive data, use MFA

## Integration with Other Phases

### Phase 13 (Analytics)

```typescript
// Track admin operations
AnalyticsEngineService.trackMetric({
  name: 'admin_operations',
  value: 1,
  dimensions: { operation: 'clear_cache', userId: adminId }
});
```

### Phase 14 (Communications)

```typescript
// Send alerts via communications
if (alert.severity === 'critical') {
  await CommunicationsService.sendMessage(
    'email',
    'ops-team',
    'user',
    'ops@example.com',
    { subject: 'Critical Alert', body: alert.message }
  );
}
```

### Phase 10 (Integrations)

```typescript
// Monitor integration health
SystemMonitoringService.updateComponentStatus(
  'epic-integration',
  integrationHealth.status,
  integrationHealth.message,
  { responseTime: integrationHealth.latency }
);
```

## Conclusion

Phase 15 provides comprehensive platform administration capabilities with:

- ✅ Real-time system monitoring and alerting
- ✅ Flexible configuration management
- ✅ Dynamic feature flag system
- ✅ Complete user management
- ✅ Detailed audit logging
- ✅ System maintenance operations
- ✅ 40+ REST API endpoints
- ✅ Security-first design
- ✅ Production-ready architecture

This provides platform administrators with all the tools needed to effectively monitor, configure, and maintain the ILS 2.0 healthcare platform.
