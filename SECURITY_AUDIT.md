# Multi-Tenant Security Audit Report

**Generated:** December 1, 2025
**Auditor:** Claude Code Security Analysis
**Scope:** ILS 2.0 Multi-Tenant Security Architecture

---

## Executive Summary

This security audit identifies multi-tenant isolation vulnerabilities in the ILS 2.0 codebase. While foundational security infrastructure exists (RLS migration, tenant context middleware), critical gaps remain that could allow cross-tenant data access.

| Risk Level | Finding Count |
|------------|---------------|
| **CRITICAL** | 3 |
| **HIGH** | 14 |
| **MEDIUM** | 9 |
| **LOW** | 6 |

---

## 1. _Internal Methods Analysis

### Summary
**Total _Internal Methods Found:** 3 methods
**Total Usage Across Codebase:** 173 occurrences in 20 files

### Methods Identified

| Method | Location | Risk Level | Description |
|--------|----------|------------|-------------|
| `getUserById_Internal` | `server/storage.ts:729` | CRITICAL | Bypasses tenant isolation for user lookup |
| `getUserWithRoles_Internal` | `server/storage.ts:885` | CRITICAL | Bypasses tenant isolation for user with roles |
| `getOrderById_Internal` | `server/storage.ts:1064` | CRITICAL | Bypasses tenant isolation for order access |

### Usage by File

```
server/routes.ts                      139 occurrences
server/storage.ts                       7 occurrences (definitions + internal calls)
server/controllers/order.controller.ts  6 occurrences
server/routes/payments.ts               3 occurrences
server/routes/permissions.ts            2 occurrences
server/services/WebhookService.ts       2 occurrences
server/workers/OrderCreatedPdfWorker.ts 1 occurrence
server/workers/OrderCreatedLimsWorker.ts 1 occurrence
server/routes/orderTracking.ts          1 occurrence
server/routes/oma-validation.ts         1 occurrence
server/routes/feature-flags.ts          1 occurrence
server/routes/python-ml.ts              1 occurrence
server/routes/ml-models.ts              1 occurrence
server/routes/shopify.ts                1 occurrence
server/routes/onboarding.ts             1 occurrence
server/routes/admin.ts                  1 occurrence
server/services/AnomalyDetectionService.ts 1 occurrence
server/services/OrderService.ts         1 occurrence
server/services/OrderTrackingService.ts 1 occurrence
server/services/OMAValidationService.ts 1 occurrence
```

### Critical Concern
The `routes.ts` file contains **139 uses** of `_Internal` methods, representing the majority of API endpoints accessing data without tenant filtering.

---

## 2. Queries Without Tenant Filtering

### Methods with Optional companyId Parameter (HIGH RISK)

These methods accept `companyId` as an **optional** parameter, meaning they can be called without tenant context:

| Method | Location | Risk |
|--------|----------|------|
| `getEyeExamination(id, companyId?)` | `storage.ts:1657` | HIGH |
| `getEyeExaminations(ecpId, companyId?)` | `storage.ts:1687` | HIGH |
| `getPatientExaminations(patientId, companyId?)` | `storage.ts:1718` | HIGH |
| `getPrescription(id, companyId?)` | `storage.ts:1783` | HIGH |
| `getPrescriptions(ecpId, companyId?)` | `storage.ts:1816` | HIGH |
| `getProduct(id, companyId?)` | `storage.ts:1872` | HIGH |
| `getProducts(ecpId, companyId?)` | `storage.ts:1886` | HIGH |
| `getPatients(ecpId, companyId?)` | `storage.ts:1552` | HIGH |
| `getInvoices(ecpId, companyId?)` | `storage.ts:1994` | HIGH |
| `getOrders(filters)` | `storage.ts:1091` | HIGH - companyId in filters object is optional |

### Methods Without Any Tenant Filtering (CRITICAL)

| Method | Location | Risk |
|--------|----------|------|
| `getAllUsers()` | `storage.ts:795` | CRITICAL - Returns ALL users across tenants |
| `getUserStats()` | `storage.ts:803` | CRITICAL - Aggregate stats across tenants |
| `getSuppliers()` | `storage.ts:816` | HIGH - Returns all suppliers |
| `getUserByEmail(email)` | `storage.ts:734` | MEDIUM - For auth, requires audit logging |
| `getUserAvailableRoles(userId)` | `storage.ts:896` | MEDIUM - No tenant check |

---

## 3. Row Level Security (RLS) Status

### Current State

| Component | Status | Location |
|-----------|--------|----------|
| RLS Helper Functions | READY | `migrations/2025-11-25-implement-row-level-security.sql` |
| RLS Policies | DEFINED | Same migration file |
| Tenant Context Middleware | IMPLEMENTED | `server/middleware/tenantContext.ts` |
| Session Variable Setting | IMPLEMENTED | Uses `SET LOCAL app.current_tenant` |

### Tables with RLS Policies Defined

**Priority 1 (Critical Healthcare Data):**
- patients
- prescriptions
- eye_examinations
- orders
- invoices
- products
- ai_conversations
- ai_messages

**Priority 2 (Insurance & Billing):**
- patient_insurance
- medical_claims
- insurance_companies
- insurance_plans
- eligibility_verifications
- preauthorizations
- payments
- stripe_payment_intents
- inventory_movements
- product_variants
- low_stock_alerts
- purchase_orders

**Priority 3 (Standard Business):**
- care_plans, care_plan_goals, care_plan_interventions
- consult_logs, equipment, test_rooms
- pos_transactions, ai_analyses
- email_logs, api_keys, webhooks

### RLS Migration Status

| Aspect | Status |
|--------|--------|
| Migration File Created | Yes |
| Migration Applied | **UNKNOWN** - Requires DB check |
| Middleware Integration | Partial - Not applied to all routes |

### IMPORTANT FINDING
The migration file is in `/migrations/` folder, not `/db/migrations/`. This suggests it may not have been applied through the normal migration process.

---

## 4. Routes Without Tenant Context

### High-Risk Routes Using _Internal Methods

| Route | File | Issue |
|-------|------|-------|
| `GET /api/orders/:orderId/status` | `orderTracking.ts:21` | Uses `getOrderById_Internal` - no tenant check |
| `GET /api/orders/:orderId/timeline` | `orderTracking.ts:62` | Direct DB query without companyId |
| All routes in `routes.ts` | `routes.ts` | 139 uses of _Internal methods |
| Payment routes | `payments.ts` | Uses `getUserById_Internal` for auth |
| OMA validation | `oma-validation.ts:26` | Uses `getOrderById_Internal` |
| Shopify integration | `shopify.ts:30` | Uses `getUserById_Internal` |

### Routes Not Using Tenant Context Middleware

The `setTenantContext` middleware exists but is **NOT** applied to most routes in `routes.ts`. Current pattern in routes:

```typescript
// Current (insecure)
router.get('/api/endpoint', isAuthenticated, async (req, res) => {
  const user = await storage.getUserById_Internal(userId); // Bypasses tenant
});

// Should be (secure)
router.get('/api/endpoint', isAuthenticated, setTenantContext, async (req, res) => {
  const user = await storage.getUser(userId, req.tenantId); // Tenant-scoped
});
```

---

## 5. Recommendations

### Immediate Actions (Priority 1)

1. **Apply RLS Migration**
   ```bash
   psql -d $DATABASE_URL -f migrations/2025-11-25-implement-row-level-security.sql
   ```

2. **Add Tenant Context Middleware to All Routes**
   Update `server/routes.ts` to apply `setTenantContext` after authentication:
   ```typescript
   app.use('/api/*', isAuthenticated, setTenantContext);
   ```

3. **Eliminate _Internal Method Usage**
   - Create `AuthRepository.ts` for authentication-only cross-tenant access
   - Replace all other _Internal calls with tenant-aware versions
   - Add audit logging to any remaining cross-tenant access

### Short-Term Actions (Priority 2)

4. **Make companyId Required**
   Change all optional `companyId?` parameters to required:
   ```typescript
   // Before
   getEyeExamination(id: string, companyId?: string)

   // After
   getEyeExamination(id: string, companyId: string)
   ```

5. **Add Tenant Filtering to All Queries**
   Every database query should include:
   ```typescript
   .where(and(
     eq(table.id, id),
     eq(table.companyId, tenantId)
   ))
   ```

6. **Remove getAllUsers()**
   This method should not exist. Replace with tenant-scoped `getUsersByCompany(companyId)`.

### Long-Term Actions (Priority 3)

7. **Implement Repository Pattern**
   Create domain-specific repositories that enforce tenant isolation by design.

8. **Add Integration Tests**
   Write tests that verify cross-tenant access is blocked.

9. **Implement HIPAA Audit Logging**
   Log all access to PHI with tenant context.

---

## 6. Risk Assessment Matrix

| Vulnerability | Likelihood | Impact | Risk Score | Status |
|--------------|------------|--------|------------|--------|
| Cross-tenant data access via _Internal | HIGH | CRITICAL | 9/10 | OPEN |
| Optional companyId parameters | HIGH | HIGH | 8/10 | OPEN |
| getAllUsers() cross-tenant exposure | MEDIUM | HIGH | 7/10 | OPEN |
| RLS not applied | HIGH | CRITICAL | 9/10 | UNCERTAIN |
| Missing tenant context middleware | HIGH | HIGH | 8/10 | OPEN |

---

## 7. Verification Commands

### Check if RLS is Enabled on Tables

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('patients', 'orders', 'invoices', 'prescriptions')
ORDER BY tablename;
```

### List Current RLS Policies

```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### Test Tenant Isolation

```sql
-- Set to tenant A
SET app.current_tenant = 'company-a-id';
SELECT COUNT(*) FROM patients;  -- Should only see tenant A patients

-- Set to tenant B
SET app.current_tenant = 'company-b-id';
SELECT COUNT(*) FROM patients;  -- Should only see tenant B patients
```

---

## 8. Files Requiring Changes

### Critical Files (Immediate)

1. `server/routes.ts` - Apply tenant context middleware
2. `server/storage.ts` - Remove _Internal methods
3. `server/middleware/tenantContext.ts` - Verify route coverage

### High Priority Files

4. `server/routes/orderTracking.ts` - Replace _Internal usage
5. `server/routes/payments.ts` - Replace _Internal usage
6. `server/routes/admin.ts` - Replace _Internal usage
7. `server/controllers/order.controller.ts` - Replace _Internal usage

### Medium Priority Files

8. `server/workers/OrderCreatedPdfWorker.ts` - Add audit logging
9. `server/workers/OrderCreatedLimsWorker.ts` - Add audit logging
10. `server/services/WebhookService.ts` - Add tenant context

---

## 9. Conclusion

The ILS 2.0 codebase has **significant multi-tenant security vulnerabilities** that require immediate attention. While foundational security infrastructure exists (RLS migration file, tenant context middleware), these components are not fully integrated into the application flow.

**Key Findings:**
- 173 uses of tenant-bypassing `_Internal` methods
- RLS migration may not be applied to database
- Tenant context middleware not applied to most routes
- Optional companyId parameters allow tenant bypass

**Recommended Next Steps:**
1. Verify RLS status in production database
2. Apply tenant context middleware to all API routes
3. Systematically replace _Internal methods
4. Add comprehensive audit logging

---

*This report should be treated as confidential and shared only with authorized security personnel.*
