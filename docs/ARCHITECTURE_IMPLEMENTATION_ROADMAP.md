# Implementation Roadmap: User Tenant Architecture Improvements

## Current State Assessment

### ✅ What You Already Have (Strong Foundation)

1. **Multi-Tenant Database Architecture**
   - PostgreSQL Row-Level Security (RLS) implemented
   - Company-scoped data isolation
   - Migration: `/home/user/ILS2.0/migrations/2025-11-25-implement-row-level-security.sql`

2. **Authentication System**
   - JWT with access/refresh tokens
   - Service: `/home/user/ILS2.0/server/services/JWTService.ts`
   - Routes: `/home/user/ILS2.0/server/routes/auth.ts`

3. **Authorization Middleware**
   - Role-based access control
   - Tenant context middleware
   - Files:
     - `/home/user/ILS2.0/server/middleware/auth.ts`
     - `/home/user/ILS2.0/server/middleware/tenantContext.ts`
     - `/home/user/ILS2.0/server/middleware/companyIsolation.ts`

4. **User Management**
   - Multi-role support
   - Dynamic roles per company
   - Routes: `/home/user/ILS2.0/server/routes/userManagement.ts`

5. **Frontend Protection**
   - Protected routes
   - Role-based navigation
   - Component: `/home/user/ILS2.0/client/src/components/auth/ProtectedRoute.tsx`

---

## 🎯 Recommended Improvements (Priority Order)

### Phase 1: Security & Compliance (Weeks 1-2)

#### 1.1 Audit Logging System

**Priority:** HIGH
**Effort:** Medium
**Impact:** Compliance, Security

**Implementation:**

```typescript
// File: server/middleware/auditLog.ts
import { db } from '../db';
import { auditLogsTable } from '../../shared/schema';

export interface AuditLogOptions {
  action: string;
  resourceType: string;
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
}

export function auditLog(options: AuditLogOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalJson = res.json.bind(res);

    res.json = function (data: any) {
      const duration = Date.now() - startTime;

      // Async logging (don't block response)
      setImmediate(async () => {
        try {
          await db.insert(auditLogsTable).values({
            id: crypto.randomUUID(),
            companyId: req.user?.companyId || null,
            userId: req.user?.id || null,
            action: options.action,
            resourceType: options.resourceType,
            resourceId: data?.id || null,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.get('user-agent'),
            requestBody: options.includeRequestBody ? req.body : null,
            responseBody: options.includeResponseBody ? data : null,
            duration,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error('Audit log failed:', error);
        }
      });

      return originalJson(data);
    };

    next();
  };
}
```

**Database Schema Addition:**

```sql
-- File: migrations/YYYY-MM-DD-add-audit-logging.sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  method VARCHAR(10),
  path TEXT,
  status_code INTEGER,
  ip_address INET,
  user_agent TEXT,
  request_body JSONB,
  response_body JSONB,
  duration INTEGER, -- milliseconds
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Partitioning by month for performance (optional, for high volume)
CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see audit logs for their company
CREATE POLICY audit_logs_company_isolation ON audit_logs
FOR SELECT
USING (
  company_id = current_setting('app.current_tenant', true)::uuid
  OR current_setting('app.current_user_role', true) = 'platform_admin'
);

-- Policy: Platform admin can see all
CREATE POLICY audit_logs_platform_admin ON audit_logs
FOR ALL
USING (current_setting('app.current_user_role', true) = 'platform_admin');
```

**Usage in Routes:**

```typescript
// server/routes/patients.ts
import { auditLog } from '../middleware/auditLog';

router.post(
  '/api/patients',
  authenticateJWT,
  setTenantContext,
  requireRole(['ecp', 'company_admin']),
  auditLog({
    action: 'create_patient',
    resourceType: 'patient',
    includeRequestBody: true, // Log patient creation details
  }),
  createPatientHandler
);

router.put(
  '/api/patients/:id',
  authenticateJWT,
  setTenantContext,
  requireRole(['ecp', 'company_admin']),
  auditLog({
    action: 'update_patient',
    resourceType: 'patient',
    includeRequestBody: true,
  }),
  updatePatientHandler
);

router.delete(
  '/api/patients/:id',
  authenticateJWT,
  setTenantContext,
  requireRole(['company_admin']),
  auditLog({
    action: 'delete_patient',
    resourceType: 'patient',
  }),
  deletePatientHandler
);
```

**Schema Update:**

```typescript
// shared/schema.ts - Add audit logs table
export const auditLogsTable = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companiesTable.id, { onDelete: 'set null' }),
  userId: uuid('user_id').references(() => usersTable.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  resourceId: uuid('resource_id'),
  method: varchar('method', { length: 10 }),
  path: text('path'),
  statusCode: integer('status_code'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  requestBody: jsonb('request_body'),
  responseBody: jsonb('response_body'),
  duration: integer('duration'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
});
```

---

#### 1.2 Rate Limiting Per Tenant

**Priority:** HIGH
**Effort:** Low
**Impact:** Security, Fair Usage

**Implementation:**

```typescript
// File: server/middleware/rateLimiting.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { db } from '../db';
import { companiesTable } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Tenant-level rate limiting
export const tenantRateLimit = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:tenant:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: async (req) => {
    if (!req.user?.companyId) return 100; // Default for unauthenticated

    // Fetch company subscription plan
    const [company] = await db
      .select({ subscriptionPlan: companiesTable.subscriptionPlan })
      .from(companiesTable)
      .where(eq(companiesTable.id, req.user.companyId))
      .limit(1);

    // Rate limits based on subscription tier
    const limits: Record<string, number> = {
      free_ecp: 100,
      full: 1000,
      pro: 5000,
      premium: 10000,
      enterprise: 50000,
    };

    return limits[company?.subscriptionPlan || 'free_ecp'] || 100;
  },
  keyGenerator: (req) => req.user?.companyId || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests from your organization',
      message: 'Please upgrade your subscription for higher rate limits',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
  skip: (req) => req.user?.role === 'platform_admin', // Platform admin bypass
  standardHeaders: true,
  legacyHeaders: false,
});

// User-level rate limiting
export const userRateLimit = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:user:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 300, // Per user
  keyGenerator: (req) => `${req.user?.companyId || 'anon'}:${req.user?.id || req.ip}`,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests from your account',
      message: 'Please slow down your requests',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
  skip: (req) => req.user?.role === 'platform_admin',
  standardHeaders: true,
  legacyHeaders: false,
});

// Endpoint-specific rate limiting (e.g., login)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  keyGenerator: (req) => req.body.email || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'Please try again later',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

**Apply to Routes:**

```typescript
// server/index.ts or server/app.ts
import { tenantRateLimit, userRateLimit, authRateLimit } from './middleware/rateLimiting';

// Apply globally to all API routes
app.use('/api', tenantRateLimit, userRateLimit);

// Apply specific limit to auth routes
app.use('/api/auth/login', authRateLimit);
```

**Package Installation:**

```bash
npm install express-rate-limit rate-limit-redis ioredis
npm install --save-dev @types/ioredis
```

---

#### 1.3 Enhanced Session Security

**Priority:** MEDIUM
**Effort:** Low
**Impact:** Security

**Implementation:**

```typescript
// File: server/middleware/sessionSecurity.ts

export function sessionSecurity(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) return next();

  // Check if user is still active
  if (!user.isActive) {
    return res.status(401).json({
      error: 'Account deactivated',
      message: 'Your account has been deactivated',
    });
  }

  // Check if user is verified
  if (!user.isVerified) {
    return res.status(401).json({
      error: 'Email not verified',
      message: 'Please verify your email address',
    });
  }

  // Check account status
  if (user.accountStatus === 'suspended') {
    return res.status(401).json({
      error: 'Account suspended',
      message: 'Your account has been suspended. Contact support.',
    });
  }

  // Check company status
  if (user.companyId) {
    const company = await db
      .select()
      .from(companiesTable)
      .where(eq(companiesTable.id, user.companyId))
      .limit(1);

    if (company[0]?.status === 'suspended') {
      return res.status(401).json({
        error: 'Company suspended',
        message: 'Your company account has been suspended',
      });
    }

    if (company[0]?.status === 'deactivated') {
      return res.status(401).json({
        error: 'Company deactivated',
        message: 'Your company account is no longer active',
      });
    }
  }

  next();
}
```

---

### Phase 2: User Experience Enhancements (Weeks 3-4)

#### 2.1 Multi-Role Context Switching

**Priority:** MEDIUM
**Effort:** Medium
**Impact:** UX

**Implementation:**

```typescript
// File: server/routes/auth.ts

router.get('/api/auth/available-roles', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all roles for the user
    const userRoles = await db
      .select({
        role: userRolesTable.role,
      })
      .from(userRolesTable)
      .where(eq(userRolesTable.userId, userId));

    // Include primary role
    const allRoles = [
      req.user.role,
      ...userRoles.map((r) => r.role),
    ].filter((value, index, self) => self.indexOf(value) === index); // Unique

    res.json({
      currentRole: req.user.role,
      availableRoles: allRoles,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

router.post('/api/auth/switch-role', authenticateJWT, async (req, res) => {
  try {
    const { targetRole } = req.body;
    const userId = req.user.id;

    // Verify user has this role
    const hasRole = await db
      .select()
      .from(userRolesTable)
      .where(
        and(
          eq(userRolesTable.userId, userId),
          eq(userRolesTable.role, targetRole)
        )
      )
      .limit(1);

    // Check primary role
    const [user] = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!hasRole[0] && user.role !== targetRole) {
      return res.status(403).json({
        error: 'You do not have this role',
      });
    }

    // Generate new token with different active role
    const newToken = generateAccessToken({
      userId: req.user.id,
      companyId: req.user.companyId,
      email: req.user.email,
      role: targetRole, // Switch to target role
      permissions: await getPermissionsForRole(targetRole, req.user.companyId),
    });

    res.json({
      accessToken: newToken,
      activeRole: targetRole,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to switch role' });
  }
});
```

**Frontend Implementation:**

```typescript
// client/src/components/RoleSwitcher.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../lib/api';

interface RoleSwitcherProps {
  className?: string;
}

export function RoleSwitcher({ className }: RoleSwitcherProps) {
  const { user, updateToken } = useAuth();
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAvailableRoles();
  }, []);

  async function fetchAvailableRoles() {
    try {
      const response = await apiRequest('/api/auth/available-roles');
      setAvailableRoles(response.availableRoles);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  }

  async function switchRole(targetRole: string) {
    setLoading(true);
    try {
      const response = await apiRequest('/api/auth/switch-role', {
        method: 'POST',
        body: JSON.stringify({ targetRole }),
      });

      // Update token in auth context
      updateToken(response.accessToken);

      // Reload to refresh UI with new role
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch role:', error);
      alert('Failed to switch role');
    } finally {
      setLoading(false);
    }
  }

  if (availableRoles.length <= 1) return null; // Don't show if only one role

  return (
    <div className={className}>
      <label>Active Role:</label>
      <select
        value={user?.role}
        onChange={(e) => switchRole(e.target.value)}
        disabled={loading}
      >
        {availableRoles.map((role) => (
          <option key={role} value={role}>
            {role.replace('_', ' ').toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
```

---

#### 2.2 Resource-Level Access Control

**Priority:** MEDIUM
**Effort:** High
**Impact:** Privacy, Compliance

**Implementation:**

```typescript
// File: server/middleware/resourceAccess.ts

export interface ResourceAccessOptions {
  resourceType: 'patient' | 'order' | 'prescription' | 'invoice';
  paramName?: string; // Default: 'id'
  checkOwnership?: boolean;
}

export function checkResourceAccess(options: ResourceAccessOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const resourceId = req.params[options.paramName || 'id'];
    const user = req.user;

    if (!resourceId) {
      return res.status(400).json({ error: 'Resource ID required' });
    }

    // Platform admin: full access
    if (user.role === 'platform_admin') {
      return next();
    }

    try {
      let resource;

      // Fetch resource based on type
      switch (options.resourceType) {
        case 'patient':
          [resource] = await db
            .select()
            .from(patientsTable)
            .where(eq(patientsTable.id, resourceId))
            .limit(1);
          break;
        case 'order':
          [resource] = await db
            .select()
            .from(ordersTable)
            .where(eq(ordersTable.id, resourceId))
            .limit(1);
          break;
        case 'prescription':
          [resource] = await db
            .select()
            .from(prescriptionsTable)
            .where(eq(prescriptionsTable.id, resourceId))
            .limit(1);
          break;
        default:
          return res.status(400).json({ error: 'Invalid resource type' });
      }

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      // Check company isolation
      if (resource.companyId !== user.companyId) {
        return res.status(404).json({ error: 'Resource not found' }); // Don't leak existence
      }

      // Check ownership if required
      if (options.checkOwnership) {
        const [company] = await db
          .select()
          .from(companiesTable)
          .where(eq(companiesTable.id, user.companyId))
          .limit(1);

        // If company has resource privacy enabled
        if (company?.settings?.resourcePrivacy) {
          // Company admin can access all
          if (user.role === 'company_admin') {
            return next();
          }

          // Others must own the resource
          if (resource.createdBy !== user.id) {
            return res.status(403).json({
              error: 'Access denied',
              message: 'You can only access resources you created',
            });
          }
        }
      }

      // Attach resource to request for downstream use
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Resource access check failed:', error);
      res.status(500).json({ error: 'Access check failed' });
    }
  };
}
```

**Usage:**

```typescript
// server/routes/patients.ts
import { checkResourceAccess } from '../middleware/resourceAccess';

router.get(
  '/api/patients/:id',
  authenticateJWT,
  setTenantContext,
  checkResourceAccess({
    resourceType: 'patient',
    checkOwnership: true, // Enable ownership check
  }),
  (req, res) => {
    // req.resource is already validated and attached
    res.json(req.resource);
  }
);

router.put(
  '/api/patients/:id',
  authenticateJWT,
  setTenantContext,
  requireRole(['ecp', 'company_admin']),
  checkResourceAccess({
    resourceType: 'patient',
    checkOwnership: true,
  }),
  updatePatientHandler
);
```

**Company Settings Schema Update:**

```typescript
// shared/schema.ts - Update companies table settings
settings: jsonb('settings').$type<{
  resourcePrivacy?: boolean; // Enable resource-level ownership checks
  ecpPatientPrivacy?: boolean; // ECPs can only see their own patients
  // ... other settings
}>(),
```

---

### Phase 3: Performance & Scalability (Weeks 5-6)

#### 3.1 Caching Layer

**Priority:** HIGH
**Effort:** Medium
**Impact:** Performance

**Implementation:**

```typescript
// File: server/services/CacheService.ts
import Redis from 'ioredis';

class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  // Cache company settings (rarely change)
  async getCompanySettings(companyId: string) {
    const cacheKey = `company:${companyId}:settings`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const [company] = await db
      .select()
      .from(companiesTable)
      .where(eq(companiesTable.id, companyId))
      .limit(1);

    if (company) {
      // Cache for 1 hour
      await this.redis.setex(cacheKey, 3600, JSON.stringify(company));
    }

    return company;
  }

  // Invalidate company cache
  async invalidateCompanyCache(companyId: string) {
    await this.redis.del(`company:${companyId}:settings`);
  }

  // Cache user permissions
  async getUserPermissions(userId: string) {
    const cacheKey = `user:${userId}:permissions`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const permissions = await getPermissionsForUser(userId);

    // Cache for 15 minutes
    await this.redis.setex(cacheKey, 900, JSON.stringify(permissions));

    return permissions;
  }

  // Invalidate user cache
  async invalidateUserCache(userId: string) {
    await this.redis.del(`user:${userId}:permissions`);
  }

  // Cache commonly accessed data
  async getCached<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    const data = await fetchFn();
    await this.redis.setex(key, ttl, JSON.stringify(data));

    return data;
  }

  // Clear cache by pattern
  async clearPattern(pattern: string) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

export const cacheService = new CacheService();
```

---

#### 3.2 Database Query Optimization

**Priority:** HIGH
**Effort:** Low
**Impact:** Performance

**Database Indexes:**

```sql
-- File: migrations/YYYY-MM-DD-add-performance-indexes.sql

-- Multi-tenant query optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_company_id
  ON users(company_id) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_company_id
  ON patients(company_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_company_id
  ON orders(company_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prescriptions_company_id
  ON prescriptions(company_id);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_company_status
  ON orders(company_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_company_created
  ON orders(company_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_company_name
  ON patients(company_id, last_name, first_name);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prescriptions_company_patient
  ON prescriptions(company_id, patient_id);

-- User authentication
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower
  ON users(LOWER(email));

-- Audit log queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_company_timestamp
  ON audit_logs(company_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_timestamp
  ON audit_logs(user_id, timestamp DESC);

-- Session lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_id
  ON sessions(user_id) WHERE expires_at > NOW();
```

---

### Phase 4: Monitoring & Observability (Week 7)

#### 4.1 Health Check Endpoints

**Implementation:**

```typescript
// File: server/routes/health.ts
import { Router } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const router = Router();

// Basic health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Detailed health check (for monitoring)
router.get('/health/detailed', async (req, res) => {
  const checks = {
    database: 'unknown',
    redis: 'unknown',
    timestamp: new Date().toISOString(),
  };

  try {
    // Check database
    await db.execute(sql`SELECT 1`);
    checks.database = 'ok';
  } catch (error) {
    checks.database = 'error';
  }

  try {
    // Check Redis
    await redis.ping();
    checks.redis = 'ok';
  } catch (error) {
    checks.redis = 'error';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok' || typeof v === 'string');

  res.status(allOk ? 200 : 503).json(checks);
});

export default router;
```

---

## Implementation Checklist

### Week 1-2: Security & Compliance
- [ ] Implement audit logging system
  - [ ] Create audit_logs table migration
  - [ ] Create auditLog middleware
  - [ ] Add to critical routes (patient, order, prescription CRUD)
  - [ ] Create admin UI to view audit logs
- [ ] Implement rate limiting
  - [ ] Install Redis and rate-limit packages
  - [ ] Create rate limiting middleware
  - [ ] Apply tenant-level limits
  - [ ] Apply user-level limits
  - [ ] Apply auth endpoint limits
- [ ] Enhance session security
  - [ ] Add session validation middleware
  - [ ] Implement account status checks
  - [ ] Add company status validation

### Week 3-4: UX Enhancements
- [ ] Implement multi-role switching
  - [ ] Create /api/auth/available-roles endpoint
  - [ ] Create /api/auth/switch-role endpoint
  - [ ] Build RoleSwitcher frontend component
  - [ ] Update navigation based on active role
- [ ] Implement resource-level access control
  - [ ] Create checkResourceAccess middleware
  - [ ] Add company settings for resource privacy
  - [ ] Apply to patient routes
  - [ ] Apply to order routes
  - [ ] Apply to prescription routes
- [ ] Build admin dashboard for company settings
  - [ ] Privacy controls
  - [ ] Feature toggles
  - [ ] User management

### Week 5-6: Performance
- [ ] Implement caching layer
  - [ ] Set up Redis connection
  - [ ] Create CacheService
  - [ ] Cache company settings
  - [ ] Cache user permissions
  - [ ] Cache frequently accessed data
- [ ] Optimize database queries
  - [ ] Add performance indexes
  - [ ] Review slow queries
  - [ ] Implement query result caching
- [ ] Load testing
  - [ ] Test with 100 concurrent users
  - [ ] Test with 1000 concurrent users
  - [ ] Identify bottlenecks
  - [ ] Optimize as needed

### Week 7: Monitoring
- [ ] Health check endpoints
- [ ] Performance metrics
- [ ] Error tracking setup
- [ ] Usage analytics

---

## Success Metrics

### Security
- ✅ Zero cross-tenant data leaks
- ✅ 100% of sensitive operations audited
- ✅ Rate limiting active on all endpoints
- ✅ Failed auth attempts logged

### Performance
- ✅ API response time < 200ms (p95)
- ✅ Database query time < 50ms (p95)
- ✅ Cache hit rate > 80% for common queries
- ✅ Support 1000+ concurrent users

### Compliance
- ✅ Full audit trail for PHI access
- ✅ GDPR data export capability
- ✅ NHS Digital API compliance
- ✅ GOC registration validation

---

## Testing Strategy

### Unit Tests
```typescript
// Test tenant isolation
describe('Tenant Isolation', () => {
  it('prevents cross-tenant data access');
  it('allows platform admin to access all tenants');
  it('enforces RLS at database level');
});

// Test role-based access
describe('Role-Based Access', () => {
  it('enforces role requirements');
  it('validates permissions');
  it('allows multi-role switching');
});
```

### Integration Tests
```typescript
// Test full request flow
describe('API Tenant Isolation', () => {
  it('enforces tenant isolation via API');
  it('validates JWT tokens');
  it('applies rate limiting');
});
```

### Load Tests
```bash
# Using Artillery or k6
artillery quick --count 100 --num 10 http://localhost:3000/api/patients
```

---

## Rollout Plan

### Phase 1: Beta (Week 8)
- Deploy to staging environment
- Test with 5-10 beta companies
- Monitor for issues
- Gather feedback

### Phase 2: Gradual Rollout (Week 9-10)
- Deploy to production
- Enable for 25% of companies
- Monitor metrics
- Increase to 50%, then 100%

### Phase 3: Full Production (Week 11)
- All companies on new architecture
- Monitor and optimize
- Continuous improvement

---

## Cost Estimate

### Infrastructure
- Redis (caching): $20-50/month
- Increased database storage (audit logs): $10-20/month
- Monitoring tools: $50-100/month

### Development
- 7 weeks × 1 developer = ~$15,000 - $25,000

### Total Estimated Cost
- One-time: $15,000 - $25,000
- Monthly recurring: $80 - $170

### ROI
- Improved security → Reduced breach risk
- Better performance → Higher user satisfaction
- Compliance → Ability to serve NHS/enterprise customers
- Scalability → Support 10x growth without infrastructure changes
