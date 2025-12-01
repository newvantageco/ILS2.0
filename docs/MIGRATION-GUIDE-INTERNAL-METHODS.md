# Migration Guide: Replacing `_Internal` Methods

**Date:** December 1, 2025
**Status:** Ready for implementation
**Related:** P0-2 Security Audit

---

## Overview

This guide shows how to replace insecure `_Internal` method calls with secure, tenant-aware methods from `AuthRepository`.

**Why?** The `_Internal` methods bypass tenant isolation, creating a critical security vulnerability (P0-2).

**What changed?** New methods in `AuthRepository` that validate tenant isolation and audit all access.

---

## Quick Reference

| Old (INSECURE) | New (SECURE) | Use Case |
|----------------|--------------|----------|
| `storage.getUserById_Internal(userId)` | `authRepository.getUserByIdWithTenantCheck(userId, req.user!)` | Fetch user with tenant validation |
| `storage.getUserWithRoles_Internal(userId)` | `authRepository.getUserWithRolesWithTenantCheck(userId, req.user!)` | Fetch user with roles |

---

## Pattern 1: Fetching Authenticated User's Own Data

### Before (INSECURE):
```typescript
app.get('/api/my-data', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.claims?.sub || req.user!.id;
  const user = await storage.getUserById_Internal(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({ user });
});
```

### After (SECURE):
```typescript
app.get('/api/my-data', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.claims?.sub || req.user!.id;

  try {
    const user = await authRepository.getUserByIdWithTenantCheck(
      userId,
      {
        id: req.user!.id,
        companyId: req.user!.companyId || null,
        role: req.user!.role
      },
      {
        reason: 'Fetch authenticated user data',
        ip: req.ip
      }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    // Audit log already written by AuthRepository
    return res.status(403).json({ message: "Unauthorized" });
  }
});
```

**What changed:**
- ✅ Added tenant validation
- ✅ Audit logging enabled
- ✅ Cross-tenant access blocked
- ✅ Platform admin access logged

---

## Pattern 2: Fetching User with Roles

### Before (INSECURE):
```typescript
app.post('/api/auth/add-role', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.claims?.sub || req.user!.id;
  const { role } = req.body;

  const user = await storage.getUserById_Internal(userId);

  if (!user || user.accountStatus !== 'active') {
    return res.status(403).json({ message: "Invalid account" });
  }

  // Add role logic...
});
```

### After (SECURE):
```typescript
app.post('/api/auth/add-role', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.claims?.sub || req.user!.id;
  const { role } = req.body;

  try {
    const user = await authRepository.getUserByIdWithTenantCheck(
      userId,
      {
        id: req.user!.id,
        companyId: req.user!.companyId || null,
        role: req.user!.role
      },
      { reason: 'Add role to user' }
    );

    if (!user || user.accountStatus !== 'active') {
      return res.status(403).json({ message: "Invalid account" });
    }

    // Add role logic...
  } catch (error) {
    return res.status(403).json({ message: "Unauthorized" });
  }
});
```

---

## Pattern 3: Building the Requesting User Object

Most routes have `req.user` from authentication middleware. Build the requesting user object like this:

```typescript
// Helper function to extract requesting user context
function getRequestingUser(req: AuthenticatedRequest) {
  return {
    id: req.user!.id,
    companyId: req.user!.companyId || null,
    role: req.user!.role
  };
}

// Usage in route
app.get('/api/some-route', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  const requestingUser = getRequestingUser(req);
  const user = await authRepository.getUserByIdWithTenantCheck(
    targetUserId,
    requestingUser,
    { reason: 'Some operation', ip: req.ip }
  );
});
```

---

## Pattern 4: Platform Admin Operations

Platform admins can access any tenant's data, but it's audited:

```typescript
app.get('/api/admin/users/:userId', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;

  // Platform admin accessing potentially different tenant
  try {
    const user = await authRepository.getUserByIdWithTenantCheck(
      userId,
      {
        id: req.user!.id,
        companyId: req.user!.companyId || null,
        role: req.user!.role  // Must be 'platform_admin'
      },
      {
        reason: 'Platform admin user lookup',
        ip: req.ip
      }
    );

    res.json({ user });
  } catch (error) {
    // Non-admin trying to access different tenant - audit log written
    return res.status(403).json({ message: "Unauthorized" });
  }
});
```

**Audit Log Entry for Platform Admin:**
```json
{
  "action": "PLATFORM_ADMIN_CROSS_TENANT_ACCESS",
  "targetUserId": "user-123",
  "requestingUserId": "admin-456",
  "targetTenantId": "tenant-a",
  "requestingTenantId": "platform",
  "reason": "Platform admin user lookup",
  "timestamp": "2025-12-01T10:30:00Z",
  "success": true,
  "metadata": {
    "isPlatformAdmin": true,
    "isSameTenant": false
  }
}
```

---

## Pattern 5: Error Handling

The new methods throw errors for unauthorized access:

```typescript
app.get('/api/data', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await authRepository.getUserByIdWithTenantCheck(
      userId,
      getRequestingUser(req)
    );

    // Success - user is in same tenant or requester is platform admin
    res.json({ user });

  } catch (error) {
    // Error thrown - audit log already written
    // Possible reasons:
    // 1. Cross-tenant access by non-admin
    // 2. User not found
    // 3. Database error

    if (error instanceof Error && error.message.includes('Cannot access users from different tenant')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
});
```

---

## Audit Logging

All access attempts are logged with HIPAA compliance markers:

### Successful Same-Tenant Access:
```json
{
  "audit": true,
  "hipaa": true,
  "action": "GET_USER_BY_ID_SUCCESS",
  "targetUserId": "user-123",
  "requestingUserId": "user-123",
  "targetTenantId": "tenant-a",
  "requestingTenantId": "tenant-a",
  "reason": "Fetch authenticated user data",
  "timestamp": "2025-12-01T10:30:00Z",
  "success": true,
  "metadata": {
    "isPlatformAdmin": false,
    "isSameTenant": true
  }
}
```

### Blocked Cross-Tenant Access:
```json
{
  "audit": true,
  "hipaa": true,
  "action": "CROSS_TENANT_ACCESS_DENIED",
  "targetUserId": "user-123",
  "requestingUserId": "user-456",
  "targetTenantId": "tenant-a",
  "requestingTenantId": "tenant-b",
  "reason": "Unauthorized cross-tenant access attempt",
  "timestamp": "2025-12-01T10:30:00Z",
  "success": false,
  "metadata": {
    "severity": "HIGH"
  }
}
```

---

## Migration Checklist

### For Each Route Replacement:

1. ✅ Import `authRepository`:
   ```typescript
   import { authRepository } from './repositories/AuthRepository';
   ```

2. ✅ Replace `storage.getUserById_Internal()` with `authRepository.getUserByIdWithTenantCheck()`

3. ✅ Build requesting user object from `req.user`

4. ✅ Add try-catch for error handling

5. ✅ Test the route:
   - Same-tenant access works
   - Cross-tenant access blocked for non-admins
   - Platform admin access works with audit log

6. ✅ Verify audit logs appear in application logs

---

## Testing

### Test 1: Same-Tenant Access (Should Work)
```bash
# Login as user in tenant A
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@tenant-a.com","password":"password"}'

# Access own data
curl -X GET http://localhost:3000/api/my-data \
  -H "Cookie: connect.sid=<session-cookie>"

# Expected: 200 OK with user data
```

### Test 2: Cross-Tenant Access (Should Fail)
```bash
# Login as user in tenant A
# Try to access data from tenant B

# Expected: 403 Forbidden
# Expected: Audit log with "CROSS_TENANT_ACCESS_DENIED"
```

### Test 3: Platform Admin Cross-Tenant Access (Should Work with Audit)
```bash
# Login as platform admin
# Access user from any tenant

# Expected: 200 OK with user data
# Expected: Audit log with "PLATFORM_ADMIN_CROSS_TENANT_ACCESS"
```

---

## Files to Update

Based on P0-2 audit, update in this order:

### Priority 1 (High Risk):
1. **server/routes.ts** - ~140 calls
   - Pattern: `const user = await storage.getUserById_Internal(userId);`
   - Replace with tenant-aware methods

### Priority 2 (Medium Risk):
2. **server/controllers/order.controller.ts** - 6 calls
3. **server/routes/payments.ts** - 3 calls

### Priority 3 (Low Risk):
4. **server/services/*** - 5 calls
5. **server/workers/*** - 2 calls

---

## Automated Find & Replace

**WARNING:** Do NOT blindly find & replace. Each usage must be reviewed manually.

### Search Pattern:
```regex
storage\.getUserById_Internal\((.*?)\)
```

### Needs Manual Review:
- Is `req.user` available in this scope?
- What should the `reason` be for audit logging?
- Is error handling appropriate?

---

## After Migration

### Remove `_Internal` Methods:

1. Update `server/storage.ts`:
   ```typescript
   // Remove from interface:
   // getUserById_Internal(id: string): Promise<User | undefined>;
   // getUserWithRoles_Internal(id: string): Promise<UserWithRoles | undefined>;

   // Remove implementations
   ```

2. TypeScript will show errors if any calls remain

3. Run verification:
   ```bash
   npm run build
   # Should have 0 TypeScript errors

   grep -r "getUserById_Internal" server/
   # Should show 0 results
   ```

---

## Questions?

- **Q: What if I need to fetch a user for authentication?**
  - A: Use `AuthRepository.findUserById()` (no tenant check, used during session validation)

- **Q: What if I'm in a background worker?**
  - A: Workers should use appropriate repository methods or pass tenant context

- **Q: Can platform admins access any data?**
  - A: Yes, but all access is audit logged with HIPAA compliance markers

---

**Status:** Phase 1 complete - Tenant-aware methods implemented
**Next:** Begin replacing calls in routes.ts

*Migration guide by Claude Code Security Team*
*December 1, 2025*
