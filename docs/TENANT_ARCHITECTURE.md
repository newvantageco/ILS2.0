# User Tenant Architecture - ILS 2.0 Platform

## Overview

This document outlines the recommended architecture for user tenancy and platform interaction, optimized for multi-company healthcare SaaS with ECPs, Company Admins, Lab Techs, Suppliers, and Platform Admins.

---

## 1. Multi-Tenancy Model: **Shared Database, Isolated Data**

### Pattern: Row-Level Security (RLS) + Application Filtering

```
┌─────────────────────────────────────────────────────────────┐
│                     PLATFORM LAYER                          │
│  (Platform Admins - Cross-tenant visibility)                │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼───────┐  ┌────────▼────────┐  ┌──────▼──────┐
│  TENANT A      │  │   TENANT B      │  │  TENANT C   │
│  (Company)     │  │   (Company)     │  │  (Company)  │
│                │  │                 │  │             │
│  ┌──────────┐  │  │  ┌──────────┐   │  │ ┌────────┐  │
│  │ Admin    │  │  │  │ Admin    │   │  │ │ Admin  │  │
│  └──────────┘  │  │  └──────────┘   │  │ └────────┘  │
│  ┌──────────┐  │  │  ┌──────────┐   │  │ ┌────────┐  │
│  │ ECP      │  │  │  │ Lab Tech │   │  │ │ ECP    │  │
│  └──────────┘  │  │  └──────────┘   │  │ └────────┘  │
│  ┌──────────┐  │  │  ┌──────────┐   │  │             │
│  │ ECP      │  │  │  │ Supplier │   │  │             │
│  └──────────┘  │  │  └──────────┘   │  │             │
└────────────────┘  └─────────────────┘  └─────────────┘
```

### Benefits:
- ✅ **Cost-effective**: Single database, lower infrastructure costs
- ✅ **Efficient**: Shared resources, better utilization
- ✅ **Secure**: RLS provides kernel-level isolation
- ✅ **Scalable**: Can support thousands of tenants
- ✅ **Maintainable**: Single schema, easier migrations

### Implementation:
```sql
-- Row-Level Security on critical tables
CREATE POLICY tenant_isolation ON patients
  USING (
    company_id = current_setting('app.current_tenant')::uuid
    OR current_setting('app.current_user_role') = 'platform_admin'
  );
```

---

## 2. User Role Hierarchy

### Recommended Role Structure:

```
┌─────────────────────────────────────────────────────────┐
│ Level 1: PLATFORM ADMIN                                 │
│ ├─ Full system access                                   │
│ ├─ Cross-tenant visibility                              │
│ ├─ Company creation/deletion                            │
│ └─ System configuration                                 │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼─────────────────────────────────┐
│ Level 2: COMPANY ADMIN (tenant-scoped)                   │
│ ├─ User management (within company)                      │
│ ├─ Company settings                                      │
│ ├─ Subscription management                               │
│ ├─ Role assignment                                       │
│ └─ Can also have operational roles (multi-role)          │
└───────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┬───────────────┐
        │                 │                 │               │
┌───────▼───────┐ ┌───────▼───────┐ ┌───────▼──────┐ ┌─────▼─────┐
│ Level 3: ECP  │ │ LAB TECH      │ │ ENGINEER     │ │ SUPPLIER  │
│               │ │               │ │              │ │           │
│ - Patients    │ │ - Orders      │ │ - Equipment  │ │ - Catalog │
│ - Prescrip.   │ │ - Production  │ │ - Maintenance│ │ - Orders  │
│ - Orders      │ │ - QC          │ │ - Inventory  │ │           │
│ - AI Access   │ │ - Inventory   │ │              │ │           │
└───────────────┘ └───────────────┘ └──────────────┘ └───────────┘
```

### Role Capabilities Matrix:

| Capability | Platform Admin | Company Admin | ECP | Lab Tech | Engineer | Supplier |
|-----------|---------------|---------------|-----|----------|----------|----------|
| Cross-tenant access | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage users | ✅ All | ✅ Company | ❌ | ❌ | ❌ | ❌ |
| Create company | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Company settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage subscriptions | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create patients | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create orders | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View all orders | ✅ | ✅ | ✅ | ✅ | ❌ | Own orders |
| Update order status | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Manage equipment | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| AI features | ✅ | ✅ | ✅ (if enabled) | ❌ | ❌ | ❌ |
| Analytics | ✅ All | ✅ Company | ✅ Own | ✅ Production | ❌ | ❌ |

---

## 3. Recommended Authentication Flow

### JWT-Based with Refresh Tokens (Current Implementation ✅)

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │  Server  │
└─────┬────┘                                    └─────┬────┘
      │                                               │
      │  1. POST /api/auth/login                      │
      │     { email, password }                       │
      ├──────────────────────────────────────────────►│
      │                                               │
      │                                          2. Validate
      │                                          credentials
      │                                          & company
      │                                               │
      │  3. { accessToken, refreshToken, user }       │
      │◄──────────────────────────────────────────────┤
      │                                               │
 4. Store tokens                                      │
    localStorage                                      │
      │                                               │
      │  5. API Request + Authorization header        │
      │     Bearer <accessToken>                      │
      ├──────────────────────────────────────────────►│
      │                                               │
      │                                     6. Verify JWT
      │                                     7. Set tenant context
      │                                     8. Apply RLS
      │                                               │
      │  9. Response (tenant-scoped data)             │
      │◄──────────────────────────────────────────────┤
      │                                               │
      │  10. (Token expired) 401 Unauthorized         │
      │◄──────────────────────────────────────────────┤
      │                                               │
      │  11. POST /api/auth/refresh                   │
      │      { refreshToken }                         │
      ├──────────────────────────────────────────────►│
      │                                               │
      │  12. New { accessToken }                      │
      │◄──────────────────────────────────────────────┤
      │                                               │
```

### Token Payload Structure:
```typescript
{
  userId: string;          // User UUID
  companyId: string;       // Tenant UUID (null for platform admin)
  email: string;
  role: string;            // Primary role
  permissions: string[];   // Effective permissions
  iat: number;             // Issued at
  exp: number;             // Expiry (7 days for access, 30 days for refresh)
}
```

---

## 4. Request Authorization Middleware Chain

### Recommended Order:

```
Incoming Request
      │
      ▼
┌─────────────────────────────────────┐
│ 1. authenticateJWT                  │
│    - Verify token signature         │
│    - Extract user, companyId, role  │
│    - Attach to req.user             │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ 2. setTenantContext                 │
│    - Set PostgreSQL session vars:   │
│      • app.current_tenant           │
│      • app.current_user_role        │
│    - Enables RLS enforcement        │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ 3. enforceCompanyIsolation          │
│    - Validate companyId in request  │
│    - Add company context            │
│    - Platform admin bypass          │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ 4. requireRole / requirePermission  │
│    - Check role requirements        │
│    - Verify specific permissions    │
│    - Return 403 if unauthorized     │
└─────────────────┬───────────────────┘
                  │
                  ▼
         Route Handler
```

### Example Implementation:
```typescript
// Route with full middleware chain
router.get(
  '/api/patients',
  authenticateJWT,           // Layer 1: Authenticate
  setTenantContext,          // Layer 2: Set RLS context
  enforceCompanyIsolation,   // Layer 3: Validate tenant
  requireRole(['ecp', 'company_admin', 'platform_admin']), // Layer 4
  async (req, res) => {
    // Database query - RLS automatically filters by company
    const patients = await db.select().from(patientsTable);
    res.json(patients);
  }
);
```

---

## 5. Data Access Patterns by User Type

### A. Platform Admin Pattern (Cross-Tenant Access)

```typescript
// Platform admin can view/manage all companies
const companies = await db
  .select()
  .from(companiesTable)
  .where(sql`1=1`); // No company filter

// View all users across all companies
const allUsers = await db
  .select()
  .from(usersTable)
  .orderBy(usersTable.companyId);

// RLS automatically bypassed when app.current_user_role = 'platform_admin'
```

**Use Cases:**
- System monitoring and analytics
- Company onboarding/offboarding
- Cross-tenant reporting
- Subscription management
- Support and troubleshooting

---

### B. Company Admin Pattern (Single-Tenant Management)

```typescript
// Company admin sees only their company's data
const companyUsers = await db
  .select()
  .from(usersTable)
  .where(eq(usersTable.companyId, req.user.companyId));

// Can create users in their company
const newUser = await db.insert(usersTable).values({
  email: 'new.ecp@example.com',
  companyId: req.user.companyId, // Must match their company
  role: 'ecp',
  // ...
});

// Can update company settings
await db
  .update(companiesTable)
  .set({ aiEnabled: true })
  .where(eq(companiesTable.id, req.user.companyId));
```

**Use Cases:**
- User management within company
- Company profile management
- Team settings and configuration
- Subscription/billing management
- Role assignment to team members

---

### C. ECP Pattern (Clinical Operations)

```typescript
// ECPs access patients in their company
const myPatients = await db
  .select()
  .from(patientsTable)
  .where(eq(patientsTable.companyId, req.user.companyId))
  .orderBy(desc(patientsTable.createdAt));

// Create prescriptions
const prescription = await db.insert(prescriptionsTable).values({
  patientId: validatedPatientId,
  companyId: req.user.companyId,
  prescriberId: req.user.id,
  // RLS ensures patient belongs to same company
  // ...
});

// Optional: View only patients they created
const ownPatients = await db
  .select()
  .from(patientsTable)
  .where(
    and(
      eq(patientsTable.companyId, req.user.companyId),
      eq(patientsTable.createdBy, req.user.id)
    )
  );
```

**Use Cases:**
- Patient management
- Prescription creation
- Order placement
- Test room usage
- AI-assisted diagnostics (if enabled)

---

### D. Lab Tech Pattern (Production Operations)

```typescript
// Lab techs view orders for their company
const orders = await db
  .select()
  .from(ordersTable)
  .where(
    and(
      eq(ordersTable.companyId, req.user.companyId),
      inArray(ordersTable.status, ['pending', 'in_production'])
    )
  );

// Update order production status
await db
  .update(ordersTable)
  .set({
    status: 'completed',
    completedAt: new Date(),
    updatedBy: req.user.id
  })
  .where(
    and(
      eq(ordersTable.id, orderId),
      eq(ordersTable.companyId, req.user.companyId) // Ensure same company
    )
  );

// Manage inventory
const inventory = await db
  .select()
  .from(inventoryTable)
  .where(eq(inventoryTable.companyId, req.user.companyId));
```

**Use Cases:**
- Order processing
- Production status updates
- Quality control
- Inventory management
- Equipment usage tracking

---

### E. Supplier Pattern (Limited Partner Access)

```typescript
// Suppliers see only orders where they are the supplier
const supplierOrders = await db
  .select()
  .from(ordersTable)
  .where(
    and(
      eq(ordersTable.supplierId, req.user.companyId), // Supplier's company
      inArray(ordersTable.status, ['pending', 'confirmed', 'shipped'])
    )
  );

// Update shipping status
await db
  .update(ordersTable)
  .set({
    status: 'shipped',
    trackingNumber: 'ABC123',
    shippedAt: new Date()
  })
  .where(
    and(
      eq(ordersTable.id, orderId),
      eq(ordersTable.supplierId, req.user.companyId)
    )
  );
```

**Use Cases:**
- Order fulfillment
- Inventory catalog management
- Shipping updates
- Invoice management

---

## 6. Frontend Route Protection

### Route Configuration Pattern (Current ✅):

```typescript
// client/src/routes/config.ts
export const routeConfig: RouteConfig[] = [
  // Platform Admin Only
  {
    path: '/platform-admin/*',
    roles: ['platform_admin'],
    requireCompany: false, // Platform admin doesn't need company
    component: PlatformAdminLayout
  },

  // Company Admin
  {
    path: '/admin/users',
    roles: ['company_admin', 'platform_admin'],
    requireCompany: true,
    requireActiveSubscription: true,
    component: UserManagement
  },

  // ECP Routes
  {
    path: '/ecp/dashboard',
    roles: ['ecp', 'company_admin', 'platform_admin'],
    requireCompany: true,
    requireGocCompliance: true, // Additional check for UK healthcare
    component: ECPDashboard
  },

  // Lab Tech Routes
  {
    path: '/lab/production',
    roles: ['lab_tech', 'company_admin', 'platform_admin'],
    requireCompany: true,
    component: ProductionDashboard
  },

  // Multi-role access
  {
    path: '/orders',
    roles: ['ecp', 'lab_tech', 'company_admin', 'platform_admin'],
    requireCompany: true,
    component: OrdersList
  }
];
```

### Protected Route Component Logic:

```typescript
// client/src/components/auth/ProtectedRoute.tsx
function ProtectedRoute({ children, route }: Props) {
  const { user, isLoading } = useAuth();

  // 1. Check authentication
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;

  // 2. Check role authorization
  if (route.roles && !hasAnyRole(user, route.roles)) {
    return <Navigate to="/unauthorized" />;
  }

  // 3. Check company association (if required)
  if (route.requireCompany && !user.companyId) {
    return <Navigate to="/onboarding/company" />;
  }

  // 4. Check subscription status (if required)
  if (route.requireActiveSubscription && !hasActiveSubscription(user)) {
    return <Navigate to="/subscription/expired" />;
  }

  // 5. Check GOC compliance (healthcare-specific)
  if (route.requireGocCompliance && !user.gocRegistrationNumber) {
    return <Navigate to="/compliance/goc-registration" />;
  }

  // All checks passed
  return <>{children}</>;
}
```

---

## 7. Permission Management System

### Granular Permissions Model (Current ✅):

```
┌──────────────────────────────────────────────────────┐
│                  Permissions Table                   │
│  (Global catalog of all permissions)                 │
│                                                      │
│  - view_company_patients                             │
│  - create_patient                                    │
│  - edit_company_patient                              │
│  - delete_company_patient                            │
│  - view_company_orders                               │
│  - create_order                                      │
│  - etc...                                            │
└─────────────────────┬────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │                           │
┌───────▼──────────────┐  ┌─────────▼──────────────────┐
│  rolePermissions     │  │ userCustomPermissions      │
│  (Company + Role)    │  │ (User-specific overrides)  │
│                      │  │                            │
│  companyId: ABC      │  │  userId: user123           │
│  role: ecp           │  │  permissionId: xyz         │
│  permissionId: xyz   │  │  granted: true/false       │
└──────────────────────┘  └────────────────────────────┘
```

### Permission Resolution Order:

```typescript
// 1. Start with role-based permissions
const rolePermissions = await getRolePermissions(user.role, user.companyId);

// 2. Apply user-specific overrides
const customPermissions = await getUserCustomPermissions(user.id);

// 3. Merge (custom permissions take precedence)
const effectivePermissions = mergePermissions(rolePermissions, customPermissions);

// 4. Check permission
function hasPermission(user: User, permission: string): boolean {
  return effectivePermissions.includes(permission);
}
```

### Dynamic Roles (Per-Company Custom Roles):

```typescript
// Company admin can create custom roles
const customRole = await db.insert(dynamicRolesTable).values({
  companyId: req.user.companyId,
  name: 'Senior ECP',
  description: 'ECPs with advanced privileges',
  isSystemDefault: false,
  isDeletable: true
});

// Assign specific permissions to custom role
await db.insert(rolePermissionsTable).values([
  {
    companyId: req.user.companyId,
    role: 'Senior ECP',
    permissionId: 'view_company_analytics' // Extra permission
  },
  {
    companyId: req.user.companyId,
    role: 'Senior ECP',
    permissionId: 'create_patient'
  }
  // ... other permissions
]);
```

---

## 8. Recommended Improvements

### A. Implement Tenant Context Header

**Current**: Tenant context inferred from JWT token
**Recommended**: Add explicit `X-Tenant-ID` header for clarity

```typescript
// Middleware to validate tenant context
export function validateTenantHeader(req, res, next) {
  const headerTenant = req.headers['x-tenant-id'];
  const tokenTenant = req.user.companyId;

  // Platform admin can specify any tenant
  if (req.user.role === 'platform_admin') {
    const targetTenant = headerTenant || tokenTenant;
    req.tenantId = targetTenant;
    return next();
  }

  // Other users must match their token company
  if (headerTenant && headerTenant !== tokenTenant) {
    return res.status(403).json({
      error: 'Tenant mismatch'
    });
  }

  req.tenantId = tokenTenant;
  next();
}
```

**Benefits:**
- Explicit tenant targeting for platform admins
- Prevents accidental cross-tenant operations
- Better audit logging

---

### B. Implement Resource-Level Access Control

**Current**: Company-level isolation
**Recommended**: Add resource-level ownership checks

```typescript
// Example: Patient privacy - ECPs can only see their own patients
export function canAccessPatient(user: User, patient: Patient): boolean {
  // Platform admin: full access
  if (user.role === 'platform_admin') return true;

  // Company admin: all patients in company
  if (user.role === 'company_admin' && user.companyId === patient.companyId) {
    return true;
  }

  // ECP: only patients they created (if privacy setting enabled)
  if (user.role === 'ecp' && user.companyId === patient.companyId) {
    const company = await getCompany(user.companyId);

    if (company.settings?.ecpPatientPrivacy) {
      return patient.createdBy === user.id;
    }

    return true; // No privacy restriction
  }

  return false;
}
```

**Benefits:**
- Enhanced privacy controls
- Support for multi-ECP practices
- Configurable per company

---

### C. Implement Audit Logging

**Recommended**: Comprehensive audit trail for compliance

```typescript
// Audit log table
auditLogs {
  id: uuid
  companyId: uuid (indexed)
  userId: uuid
  action: string ('create_patient', 'update_prescription', 'view_order')
  resourceType: string ('patient', 'order', 'prescription')
  resourceId: uuid
  changes: jsonb (before/after values)
  ipAddress: string
  userAgent: string
  timestamp: timestamp
}

// Audit middleware
export function auditLog(action: string, resourceType: string) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      // Log successful operation
      db.insert(auditLogsTable).values({
        companyId: req.tenantId,
        userId: req.user.id,
        action,
        resourceType,
        resourceId: data?.id,
        changes: data,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date()
      });

      return originalJson(data);
    };

    next();
  };
}

// Usage
router.post(
  '/api/prescriptions',
  authenticateJWT,
  setTenantContext,
  requireRole(['ecp']),
  auditLog('create_prescription', 'prescription'),
  createPrescriptionHandler
);
```

**Benefits:**
- Regulatory compliance (HIPAA, GDPR, NHS)
- Security incident investigation
- User activity tracking
- Data access transparency

---

### D. Implement API Rate Limiting Per Tenant

**Recommended**: Prevent abuse and ensure fair usage

```typescript
// Rate limiting by tenant and user
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Tenant-level rate limiting
export const tenantRateLimit = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:tenant:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: async (req) => {
    const company = await getCompany(req.tenantId);

    // Different limits based on subscription plan
    const limits = {
      free_ecp: 100,
      full: 1000,
      pro: 5000,
      premium: 10000,
      enterprise: 50000
    };

    return limits[company.subscriptionPlan] || 100;
  },
  keyGenerator: (req) => req.tenantId,
  message: 'Too many requests from this company'
});

// User-level rate limiting
export const userRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // Per user
  keyGenerator: (req) => `${req.tenantId}:${req.user.id}`,
  message: 'Too many requests from this user'
});

// Apply to routes
app.use('/api', tenantRateLimit, userRateLimit);
```

---

### E. Implement Multi-Role Context Switching

**Current**: Users have primary role
**Recommended**: Allow active role switching for multi-role users

```typescript
// Enhanced JWT with active role
interface EnhancedToken {
  userId: string;
  companyId: string;
  primaryRole: string;
  availableRoles: string[];  // All roles user has
  activeRole: string;        // Currently active role
}

// Endpoint to switch active role
router.post('/api/auth/switch-role', authenticateJWT, async (req, res) => {
  const { targetRole } = req.body;

  // Verify user has this role
  const userRoles = await getUserRoles(req.user.id);
  if (!userRoles.includes(targetRole)) {
    return res.status(403).json({ error: 'You do not have this role' });
  }

  // Issue new token with different active role
  const newToken = generateToken({
    ...req.user,
    activeRole: targetRole
  });

  res.json({ accessToken: newToken });
});
```

**Benefits:**
- Company admins can switch to ECP view
- Better UX for multi-role users
- Clearer permission context

---

## 9. Scalability Considerations

### Horizontal Scaling Strategy:

```
                    ┌──────────────┐
                    │ Load Balancer│
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐        ┌────▼────┐       ┌────▼────┐
   │ API     │        │ API     │       │ API     │
   │ Server 1│        │ Server 2│       │ Server 3│
   └────┬────┘        └────┬────┘       └────┬────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼────────┐
                    │   PostgreSQL  │
                    │  (with RLS)   │
                    │               │
                    │  Read Replicas│
                    └───────────────┘
```

### Database Optimization:

```sql
-- Indexes for multi-tenant queries
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_patients_company_id ON patients(company_id);
CREATE INDEX idx_orders_company_id ON orders(company_id);
CREATE INDEX idx_orders_company_status ON orders(company_id, status);

-- Composite indexes for common queries
CREATE INDEX idx_orders_company_created ON orders(company_id, created_at DESC);
CREATE INDEX idx_patients_company_name ON patients(company_id, last_name, first_name);

-- Partial indexes for active records
CREATE INDEX idx_active_users ON users(company_id) WHERE is_active = true;
CREATE INDEX idx_active_companies ON companies(id) WHERE status = 'active';
```

### Caching Strategy:

```typescript
// Redis caching for tenant-specific data
import Redis from 'ioredis';
const redis = new Redis();

// Cache company settings (rarely change)
async function getCompanySettings(companyId: string) {
  const cacheKey = `company:${companyId}:settings`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Fetch from database
  const company = await db
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.id, companyId))
    .limit(1);

  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(company));

  return company;
}

// Invalidate cache on update
async function updateCompanySettings(companyId: string, settings: any) {
  await db
    .update(companiesTable)
    .set(settings)
    .where(eq(companiesTable.id, companyId));

  // Invalidate cache
  await redis.del(`company:${companyId}:settings`);
}
```

---

## 10. Security Best Practices Checklist

### ✅ Implemented:
- [x] Row-Level Security (RLS) for data isolation
- [x] JWT with refresh tokens
- [x] Password hashing (bcryptjs)
- [x] Role-based access control (RBAC)
- [x] Soft deletes (no hard deletion)
- [x] Company-scoped user management
- [x] Platform admin bypass for support
- [x] Session validation (active/verified users)

### 🔧 Recommended Additions:
- [ ] Audit logging for all sensitive operations
- [ ] Rate limiting per tenant and user
- [ ] API key management for integrations
- [ ] Two-factor authentication (2FA)
- [ ] IP whitelisting for sensitive endpoints
- [ ] Encryption at rest for PHI (Protected Health Information)
- [ ] Regular security audits
- [ ] Automated vulnerability scanning
- [ ] OWASP Top 10 compliance checks

---

## 11. Migration Path for Existing Data

If you need to migrate existing non-tenant-scoped data:

```sql
-- Step 1: Add companyId to tables (if missing)
ALTER TABLE legacy_table ADD COLUMN company_id UUID;

-- Step 2: Backfill companyId based on existing relationships
UPDATE legacy_table lt
SET company_id = u.company_id
FROM users u
WHERE lt.user_id = u.id;

-- Step 3: Make companyId NOT NULL after backfill
ALTER TABLE legacy_table ALTER COLUMN company_id SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE legacy_table
ADD CONSTRAINT fk_legacy_company
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Step 5: Enable RLS
ALTER TABLE legacy_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON legacy_table
USING (
  company_id = current_setting('app.current_tenant')::uuid
  OR current_setting('app.current_user_role') = 'platform_admin'
);
```

---

## 12. Summary: Best Practices

### DO ✅
- Use Row-Level Security for kernel-level enforcement
- Implement defense-in-depth (DB + middleware + application)
- Scope all queries to `companyId` (except platform admin)
- Use JWT with short-lived access tokens + long-lived refresh tokens
- Implement granular permissions with role-based defaults
- Allow platform admin to bypass tenant isolation for support
- Use soft deletes to maintain audit trails
- Index all foreign keys and commonly filtered columns
- Cache tenant-specific settings
- Log all sensitive operations
- Rate limit per tenant based on subscription plan

### DON'T ❌
- Never trust client-provided `companyId` - always use token value
- Never expose other tenants' data (except to platform admin)
- Never allow hard deletes of critical data (patients, orders, etc.)
- Never skip authentication middleware on protected routes
- Never use role strings in client code - always verify on server
- Never bypass RLS policies in application code (they're your safety net)
- Never allow users to change their own `companyId`
- Never use sequential integer IDs - use UUIDs to prevent enumeration

---

## 13. Testing Strategy

### Unit Tests:
```typescript
describe('Tenant Isolation', () => {
  it('should prevent cross-tenant data access', async () => {
    const companyA = await createCompany({ name: 'Company A' });
    const companyB = await createCompany({ name: 'Company B' });

    const userA = await createUser({ companyId: companyA.id, role: 'ecp' });
    const userB = await createUser({ companyId: companyB.id, role: 'ecp' });

    const patientA = await createPatient({ companyId: companyA.id });

    // User B should NOT see User A's patients
    const result = await getPatients(userB);
    expect(result).not.toContainEqual(patientA);
  });

  it('should allow platform admin to see all tenants', async () => {
    const admin = await createUser({ role: 'platform_admin' });

    const allPatients = await getPatients(admin);
    expect(allPatients.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests:
```typescript
describe('API Tenant Isolation', () => {
  it('should enforce tenant isolation via API', async () => {
    const companyA = await createCompany({ name: 'Company A' });
    const companyB = await createCompany({ name: 'Company B' });

    const tokenA = await login(ecpUserA);
    const tokenB = await login(ecpUserB);

    const patientA = await api
      .post('/api/patients')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ firstName: 'John', lastName: 'Doe' });

    // Attempt to access with User B's token
    const response = await api
      .get(`/api/patients/${patientA.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404); // RLS blocks access
  });
});
```

---

## Conclusion

Your platform already implements a **robust multi-tenant architecture** with strong security foundations. The recommended improvements focus on:

1. **Enhanced auditing** for compliance
2. **Rate limiting** for fairness and abuse prevention
3. **Resource-level access control** for fine-grained privacy
4. **Multi-role switching** for better UX
5. **Performance optimization** for scale

The defense-in-depth approach (RLS + middleware + application filtering) provides military-grade isolation suitable for healthcare applications with sensitive patient data.
