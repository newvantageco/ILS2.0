# _Internal Method Migration Guide

This document outlines how to migrate from the legacy `_Internal` methods to proper tenant-aware patterns.

## Background

The `_Internal` methods in `storage.ts` bypass multi-tenant security:
- `getUserById_Internal` - 139+ usages across codebase
- `getUserWithRoles_Internal` - Used in many auth flows
- `getOrderById_Internal` - Used in workers and some routes

These must be replaced with:
1. **AuthRepository** - For authentication flows (login, session validation)
2. **WorkerRepository** - For background workers
3. **Tenant-aware storage methods** - For regular API routes

## Migration Patterns

### Pattern 1: API Routes (Most Common)

**Before (Insecure):**
```typescript
router.get('/api/endpoint', authenticateUser, async (req, res) => {
  const user = await storage.getUserById_Internal(req.user.id);
  // ... handle request
});
```

**After (Secure):**
```typescript
import { setTenantContext } from '../middleware/tenantContext';

router.get('/api/endpoint', authenticateUser, setTenantContext, async (req, res) => {
  const companyId = req.tenantId;
  if (!companyId) {
    return res.status(403).json({ error: 'Tenant context required' });
  }

  const user = await storage.getUser(req.user.id, companyId);
  // ... handle request
});
```

### Pattern 2: Background Workers

**Before (Insecure):**
```typescript
import { storage } from '../storage';

eventBus.subscribe('order.created', async (payload) => {
  const order = await storage.getOrderById_Internal(orderId);
});
```

**After (Secure with Audit Logging):**
```typescript
import { createWorkerRepository } from '../repositories/WorkerRepository';
import crypto from 'crypto';

eventBus.subscribe('order.created', async (payload) => {
  const workerId = `worker-${crypto.randomUUID().slice(0, 8)}`;
  const workerRepo = createWorkerRepository(workerId, 'OrderCreatedWorker');

  const order = await workerRepo.getOrderWithDetails(orderId);
  // All access is audit logged automatically
});
```

### Pattern 3: Authentication Flows

**Before (Insecure - no audit trail):**
```typescript
const user = await storage.getUserByEmail(email);
const userWithRoles = await storage.getUserWithRoles_Internal(user.id);
```

**After (Secure with Audit Trail):**
```typescript
import { authRepository } from '../repositories/AuthRepository';

const user = await authRepository.findUserByEmail(email, {
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  reason: 'Login attempt'
});

const userWithRoles = await authRepository.findUserWithRoles(user.id, {
  ip: req.ip,
  reason: 'Session establishment'
});
```

### Pattern 4: Platform Admin Operations

**Before (Insecure):**
```typescript
// Admin looking up any user
const user = await storage.getUserById_Internal(targetUserId);
```

**After (Secure with Admin Verification + Audit):**
```typescript
import { authRepository } from '../repositories/AuthRepository';

const user = await authRepository.platformAdminFindUser(
  targetUserId,
  req.user.id,  // Admin's ID for audit
  'Support ticket #12345'  // Business reason required
);
```

## Files Requiring Migration

### High Priority (Routes using _Internal frequently)

| File | _Internal Usages | Notes |
|------|------------------|-------|
| `server/routes.ts` | 139 | Main routes file - highest priority |
| `server/controllers/order.controller.ts` | 6 | Order management |
| `server/routes/payments.ts` | 3 | Subscription/payment flows |
| `server/routes/permissions.ts` | 2 | Role management |

### Workers

| File | Migration |
|------|-----------|
| `server/workers/OrderCreatedPdfWorker.ts` | Use WorkerRepository |
| `server/workers/OrderCreatedLimsWorker.ts` | Use WorkerRepository |

### Services

| File | Migration |
|------|-----------|
| `server/services/WebhookService.ts` | Use WorkerRepository pattern |
| `server/services/OrderTrackingService.ts` | Accept tenantId parameter |
| `server/services/AnomalyDetectionService.ts` | Use WorkerRepository pattern |
| `server/services/OMAValidationService.ts` | Accept tenantId parameter |

### Auth-Related Routes

| File | Migration |
|------|-----------|
| `server/routes/auth-jwt.ts` | Use AuthRepository |
| `server/routes/google-auth.ts` | Use AuthRepository |
| `server/routes/onboarding.ts` | Use AuthRepository |

## Step-by-Step Migration for routes.ts

The main `routes.ts` file has 139 usages. Here's the systematic approach:

### Step 1: Add Tenant Context Middleware

At the top of the file, add:
```typescript
import { setTenantContext } from './middleware/tenantContext';
import { authRepository } from './repositories/AuthRepository';
```

### Step 2: Identify Route Categories

1. **Public routes** (no auth): Skip tenant context
2. **Auth routes** (login/register): Use AuthRepository
3. **Protected routes**: Add setTenantContext middleware

### Step 3: Update Route Registrations

For protected routes, change:
```typescript
app.post('/api/orders', ...secureRoute(), async (req, res) => {
```

To:
```typescript
app.post('/api/orders', ...secureRoute(), setTenantContext, async (req, res) => {
```

### Step 4: Replace _Internal Calls

In each handler, replace:
```typescript
const user = await storage.getUserById_Internal(userId);
```

With:
```typescript
const user = await storage.getUser(userId, req.tenantId!);
```

## Verification Checklist

After migration, verify:

- [ ] All routes have appropriate tenant context middleware
- [ ] No direct calls to `_Internal` methods remain
- [ ] Workers use WorkerRepository with audit logging
- [ ] Auth flows use AuthRepository
- [ ] Platform admin operations include reason and admin ID

## Testing

Run these commands to verify no _Internal methods remain in use:

```bash
# Should return 0 matches when migration is complete
grep -r "getUserById_Internal\|getUserWithRoles_Internal\|getOrderById_Internal" \
  server/routes/*.ts \
  server/controllers/*.ts \
  --include="*.ts" \
  | grep -v "// DEPRECATED"
```

## Timeline

| Phase | Target | Files |
|-------|--------|-------|
| Week 1 | Critical routes in routes.ts | ~50 routes |
| Week 2 | Remaining routes.ts + controllers | ~90 routes |
| Week 3 | Services and workers | ~10 files |
| Week 4 | Cleanup and verification | All |

## Related Documents

- [SECURITY_AUDIT.md](../SECURITY_AUDIT.md) - Initial security audit findings
- [migrations/2025-11-25-implement-row-level-security.sql](../migrations/2025-11-25-implement-row-level-security.sql) - RLS implementation
