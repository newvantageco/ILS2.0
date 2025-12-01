# P0-2: _Internal Methods Security Audit
## Critical Security Issue - Tenant Isolation Bypass

**Date:** December 1, 2025
**Severity:** P0 (Critical)
**Risk:** Cross-tenant data access without audit logging

---

## Executive Summary

Found **170 calls** to `_Internal` methods that bypass tenant isolation:
- `getUserById_Internal()`: ~155 calls
- `getUserWithRoles_Internal()`: ~10 calls
- `getOrderById_Internal()`: ~5 calls

These methods allow cross-tenant access without:
1. ❌ Tenant context validation
2. ❌ Audit logging
3. ❌ Authorization checks

---

## Files Affected (20 files)

### Critical - High Usage (>50 calls)
1. **server/routes.ts** - ~140 calls
   - Pattern: `const user = await storage.getUserById_Internal(userId);`
   - Used in almost every route handler
   - **Risk**: Any route can access any user regardless of tenant

### High Priority (10-50 calls)
2. **server/controllers/order.controller.ts** - 6 calls
   - Order creation, updates, deletions
   - **Risk**: Orders from different tenants accessible

### Medium Priority (5-10 calls)
3. **server/routes/payments.ts** - 3 calls
4. **server/services/OrderService.ts** - 1 call
5. **server/services/OrderTrackingService.ts** - 1 call

### Low Priority (<5 calls)
6. server/workers/OrderCreatedLimsWorker.ts - 1 call
7. server/routes/feature-flags.ts - 1 call
8. server/routes/ml-models.ts - 1 call
9. server/routes/python-ml.ts - 1 call
10. server/routes/permissions.ts - 2 calls
11. server/routes/admin.ts - 1 call
12. server/routes/oma-validation.ts - 1 call
13. server/routes/onboarding.ts - 1 call
14. server/routes/shopify.ts - 1 call
15. server/services/OMAValidationService.ts - ?
16. server/services/WebhookService.ts - ?
17. server/services/AnomalyDetectionService.ts - ?
18. server/workers/OrderCreatedPdfWorker.ts - 1 (has TODO comment!)

### Definition
19. **server/storage.ts** - Defines the _Internal methods (3 definitions + implementations)

---

## Method Definitions

```typescript
// storage.ts interface
getUserById_Internal(id: string): Promise<User | undefined>;
getUserWithRoles_Internal(id: string): Promise<UserWithRoles | undefined>;
getOrderById_Internal(id: string): Promise<OrderWithDetails | undefined>;
```

---

## Common Usage Pattern

### Current (INSECURE):
```typescript
// In routes.ts (repeated ~140 times)
const user = await storage.getUserById_Internal(userId);
if (!user) return res.status(404).send("User not found");

// Problem: No tenant validation!
// Any authenticated user can access any other user's data
```

### What It Should Be:
```typescript
// Using AuthRepository with audit
const user = await authRepository.getUserById(userId);
// AuthRepository checks:
// 1. Is requesting user in same tenant?
// 2. Or is requesting user platform_admin?
// 3. Logs cross-tenant access attempts
```

---

## Security Impact

### Attack Scenario:
```
1. Attacker: Authenticated user in Tenant A
2. Target: User data in Tenant B
3. Attack: Call any API endpoint with Tenant B user ID
4. Result: ✅ Access granted (no tenant check)
5. Detection: ❌ No audit log
```

### Real Example:
```typescript
// server/routes.ts line 950
app.get("/api/invoices", async (req, res) => {
  const userId = req.user!.claims.sub;
  const user = await storage.getUserById_Internal(userId);
  // INSECURE: userId could be from different tenant!
});
```

---

## Replacement Plan

### Phase 1: Update AuthRepository (1 day)
Add methods with audit logging:
```typescript
// server/repositories/AuthRepository.ts
class AuthRepository extends BaseRepository {
  /**
   * Get user by ID with tenant isolation
   * Allows platform admins to access any user (with audit)
   */
  async getUserById(
    id: string,
    options?: { bypassTenantCheck?: boolean }
  ): Promise<User | undefined> {
    const requestingUser = this.getCurrentUser();

    // Check if cross-tenant access
    if (user.companyId !== requestingUser.companyId) {
      if (!this.isPlatformAdmin(requestingUser)) {
        await this.auditService.logUnauthorizedAccess({
          requestingUserId: requestingUser.id,
          targetUserId: id,
          action: 'getUserById',
        });
        throw new UnauthorizedError('Cross-tenant access denied');
      }

      // Platform admin accessing other tenant - audit it
      await this.auditService.logPlatformAdminAccess({
        adminUserId: requestingUser.id,
        targetUserId: id,
        targetTenantId: user.companyId,
        action: 'getUserById',
        reason: options?.reason,
      });
    }

    return user;
  }
}
```

### Phase 2: Replace All Calls (1 week)

#### Automated Replacement (server/routes.ts):
```bash
# Find & replace pattern
OLD: const user = await storage.getUserById_Internal(userId);
NEW: const user = await authRepository.getUserById(userId);
```

#### Manual Review Needed:
- **Controllers**: 6 files need context review
- **Services**: 3 files need context review
- **Workers**: 2 files need context review

### Phase 3: Remove _Internal Methods (1 day)
After all calls replaced:
1. Remove from IStorage interface
2. Remove implementations
3. Add TypeScript error if anyone tries to use them

---

## Verification Steps

### Step 1: Create Test
```typescript
// Test cross-tenant access is blocked
it('should block cross-tenant user access', async () => {
  const tenantAUser = await createUser({ companyId: 'tenant-a' });
  const tenantBUser = await createUser({ companyId: 'tenant-b' });

  // Authenticate as tenant A user
  const token = generateToken(tenantAUser);

  // Try to access tenant B user
  const response = await request(app)
    .get(`/api/users/${tenantBUser.id}`)
    .set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(403); // Should be forbidden
  expect(auditLog).toContainCrossTenantAttempt();
});
```

### Step 2: Run Migration
```bash
npm run migrate-storage:verify
# Should show 0 _Internal calls remaining
```

### Step 3: Monitor Audit Logs
```sql
SELECT * FROM audit_logs
WHERE action LIKE '%cross_tenant%'
ORDER BY created_at DESC
LIMIT 100;
```

---

## Timeline

| Phase | Task | Duration | Priority |
|-------|------|----------|----------|
| 1 | Update AuthRepository | 1 day | P0 |
| 2a | Replace routes.ts (140 calls) | 2 days | P0 |
| 2b | Replace controllers (6 calls) | 1 day | P0 |
| 2c | Replace services (5 calls) | 1 day | P1 |
| 2d | Replace workers (2 calls) | 1 day | P1 |
| 3 | Remove _Internal methods | 1 day | P1 |
| 4 | Testing & verification | 2 days | P0 |
| **Total** | | **9 days** | |

---

## Estimated Effort
- **Minimum (automated)**: 1 week
- **Realistic (with testing)**: 2 weeks
- **Safe (with careful review)**: 3 weeks

---

## Recommendation

**Start immediately with Phase 1** (Update AuthRepository).
This can be done in parallel with other work and provides the foundation for safe replacements.

**Critical Files First**:
1. server/routes.ts (140 calls) - Highest risk
2. server/controllers/order.controller.ts (6 calls) - Payment data
3. server/routes/payments.ts (3 calls) - Financial data

---

*Report generated by Claude Code Security Audit*
*December 1, 2025*
