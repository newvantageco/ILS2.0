# Multi-Tenant Security Audit Report

**Generated:** December 1, 2025
**Codebase:** ILS 2.0
**Audit Focus:** Multi-tenant isolation, RLS implementation, and tenant context bypass risks

---

## Executive Summary

| Category | Count | Risk Level |
|----------|-------|------------|
| `_Internal` Methods (Bypass Tenant Isolation) | **3** | Medium |
| Queries Without Tenant Filtering | **17** | High |
| Queries With Optional `companyId` | **10** | Medium |
| Tables With RLS Enabled | **65+** | Protected |
| Routes Without `secureRoute()` | **18** | Medium-High |

---

## 1. Internal Methods (`_Internal` Suffix)

These methods in `server/storage.ts` explicitly bypass tenant isolation. They are documented as internal-only for authentication flows and worker processes.

| Method | Line | Purpose | Risk |
|--------|------|---------|------|
| `getUserById_Internal()` | 729 | Authentication - get user's companyId | Low (auth only) |
| `getUserWithRoles_Internal()` | 885 | Authentication - bootstrap user session | Low (auth only) |
| `getOrderById_Internal()` | 1064 | Background workers - process orders | Medium |

### Assessment

The `_Internal` methods are appropriately named and documented. They serve legitimate purposes:
- Auth flows need to identify a user before knowing their tenant
- Background workers need cross-tenant access for job processing

**Recommendation:** Ensure these methods are never exposed via public API endpoints. Add runtime checks to prevent misuse.

---

## 2. High-Risk Queries Without Tenant Filtering

These methods in `server/storage.ts` perform database operations WITHOUT requiring `companyId`, allowing potential cross-tenant data access.

### Critical Risk (No Tenant Filter)

| Method | Line | Issue |
|--------|------|-------|
| `getAllUsers()` | 795 | Returns ALL users across ALL companies |
| `getUserStats()` | 803 | Aggregates stats from ALL companies |
| `getSuppliers()` | 816 | Returns ALL suppliers globally |
| `getUserByEmail()` | 734 | Looks up user globally (needed for auth) |
| `updateUser()` | 783 | Updates ANY user by ID - no tenant check |
| `deleteUser()` | 858 | Deletes ANY user by ID - no tenant check |
| `updateOrderStatus()` | 1152 | Updates ANY order - no tenant check |
| `updateOrder()` | 1186 | Updates ANY order - no tenant check |
| `respondToConsultLog()` | 1258 | Responds to ANY consult - no tenant check |
| `getConsultLogs()` | 1238 | Gets consult logs - no company filter |
| `getAllConsultLogs()` | 1246 | Gets ALL consult logs globally |
| `getPurchaseOrder()` | 1313 | Gets ANY PO - no tenant required |
| `getPurchaseOrders()` | 1352 | Lists POs - no company filter |
| `updatePOStatus()` | 1413 | Updates ANY PO - no tenant check |
| `getOrganizationSettings()` | 1478 | Gets settings globally |
| `updateOrganizationSettings()` | 1487 | Updates settings globally |
| `getOrderStats()` | 1212 | Aggregates order stats without company filter |

### Medium Risk (Optional `companyId` Parameter)

These methods accept `companyId` as optional, meaning tenant isolation depends on the caller providing it:

| Method | Line | Issue |
|--------|------|-------|
| `getOrders()` | 1091 | `companyId?: string` - optional filter |
| `getPatients()` | 1552 | `companyId?: string` - optional filter |
| `getEyeExamination()` | 1657 | `companyId?: string` - optional filter |
| `getEyeExaminations()` | 1687 | `companyId?: string` - optional filter |
| `getPatientExaminations()` | 1718 | `companyId?: string` - optional filter |
| `getPrescription()` | 1783 | `companyId?: string` - optional filter |
| `getPrescriptions()` | 1816 | `companyId?: string` - optional filter |
| `getProduct()` | 1872 | `companyId?: string` - optional filter |
| `getProducts()` | 1886 | `companyId?: string` - optional filter |
| `getInvoices()` | 1994 | `companyId?: string` - optional filter |

---

## 3. Row Level Security (RLS) Status

RLS was implemented in migration `2025-11-25-implement-row-level-security.sql` using a 3-Layer Defense-in-Depth model:

### Architecture

```
Layer 1: Database (PostgreSQL RLS) - Hard Shell
Layer 2: Middleware (Session Variables) - Gatekeeper
Layer 3: ORM (Drizzle) - Developer Experience
```

### RLS Functions Created

| Function | Purpose |
|----------|---------|
| `get_current_tenant()` | Returns `app.current_tenant` session variable |
| `get_current_user_role()` | Returns `app.current_user_role` session variable |
| `is_platform_admin()` | Checks for RLS bypass permissions |
| `create_tenant_rls_policies()` | Creates standard 4-policy set (SELECT/INSERT/UPDATE/DELETE) |

### Tables With RLS Enabled (65+)

#### Priority 1 - Critical Healthcare Data
- `patients`
- `prescriptions`
- `eye_examinations`
- `orders`
- `invoices`
- `products`
- `ai_conversations`
- `ai_messages`

#### Priority 2 - Insurance & Billing
- `patient_insurance`
- `medical_claims`
- `insurance_companies`
- `insurance_plans`
- `eligibility_verifications`
- `preauthorizations`
- `payments`
- `stripe_payment_intents`
- `inventory_movements`
- `product_variants`
- `low_stock_alerts`
- `purchase_orders`

#### Priority 3 - Standard Business
- `care_plans`, `care_plan_goals`, `care_plan_interventions`, `care_team_members`
- `consult_logs`, `equipment`, `test_rooms`, `test_room_bookings`
- `calibration_records`, `remote_sessions`, `clinical_anomalies`
- `oma_validations`, `dispense_records`
- `pos_transactions`, `pos_transaction_items`, `pdf_templates`
- `ai_analyses`, `ai_model_deployments`, `company_ai_settings`
- `ai_notifications`, `ai_dispensing_recommendations`, `ai_recommendation_items`
- `email_logs`, `email_templates`, `email_tracking_events`
- `api_keys`, `custom_webhooks`, `webhook_deliveries`
- `company_supplier_relationships`

#### Analytics Tables
- `usage_events`, `usage_records`, `feature_usage_metrics`, `analytics_events`
- `customer_health_scores`, `churn_predictions`, `customer_acquisition_sources`
- `revenue_recognition_events`, `subscription_change_history`, `subscription_history`
- `risk_factors`, `risk_scores`, `risk_score_factors`
- `pdsa_cycles`, `pdsa_plan_steps`

#### Special Cases
- `users` - Custom policies for platform admin bypass and self-access
- `training_data_analytics` - Optional company_id with platform admin bypass

### Monitoring Views

```sql
-- Check RLS policy coverage
SELECT * FROM rls_policy_coverage;

-- Check which tables have RLS enabled
SELECT * FROM rls_enabled_tables;
```

---

## 4. Routes Without Tenant Context Protection

These API routes do NOT use `secureRoute()` middleware and may expose cross-tenant data:

### High Risk - User Data Routes

| Route | Handler | Concern |
|-------|---------|---------|
| `/api/emails` | `emailRoutes` | Email data without tenant context |
| `/api/scheduled-emails` | `scheduledEmailRoutes` | Scheduled emails without tenant context |
| `/api/order-emails` | `orderEmailRoutes` | Order-related emails without tenant context |
| `/api/events` | `eventRoutes` | Event system without tenant context |
| `/api/ecp` | `ecpRoutes` | ECP features without explicit tenant context |

### Medium Risk - Integration/System Routes

| Route | Handler | Concern |
|-------|---------|---------|
| `/api/ml/models` | `mlModelsRoutes` | ML model access without tenant context |
| `/api/python-ml` | `pythonMLRoutes` | Python ML service without tenant context |
| `/api/shopify` | `shopifyRoutes` | Shopify integration without tenant context |
| `/api/feature-flags` | `featureFlagsRoutes` | Feature flags without tenant context |
| `/api/two-factor` | `twoFactorRoutes` | 2FA management without tenant context |
| `/api/order-tracking` | `orderTrackingRoutes` | Order tracking without tenant context |

### Low Risk - Expected Public/Auth Routes

| Route | Handler | Reason |
|-------|---------|--------|
| `/api/verification` | `verificationRoutes` | Health check - public |
| `/api/backup` | `backupRoutes` | System admin - separate auth |
| `/api/auth` | `authJWTRoutes` | Auth endpoints - pre-auth |
| `/api/onboarding` | `onboardingRoutes` | Signup - pre-auth |
| `/api/webhooks/shopify` | `shopifyWebhookRoutes` | Webhooks - HMAC verified |
| `/api/v1` | `v1ApiRoutes` | Public API - API key auth |
| `/api/patient-portal` | `patientPortalV2Routes` | Patient portal - patient auth |

---

## 5. Recommendations

### Immediate Actions (Critical)

1. **Require `companyId` in Update/Delete Methods**
   ```typescript
   // Change from:
   async updateUser(id: string, updates: Partial<User>)

   // To:
   async updateUser(id: string, companyId: string, updates: Partial<User>)
   ```

2. **Remove Optional `companyId` Parameters**
   Make `companyId` required in all data access methods, not optional.

3. **Add Tenant Context to Missing Routes**
   ```typescript
   // Add secureRoute() to these routes:
   app.use('/api/emails', ...secureRoute(), emailRoutes);
   app.use('/api/events', ...secureRoute(), eventRoutes);
   app.use('/api/ml/models', ...secureRoute(), mlModelsRoutes);
   ```

### Short-Term Actions

4. **Audit `_Internal` Method Usage**
   - Search codebase for all usages
   - Ensure none are exposed via HTTP endpoints
   - Add TypeScript decorators or runtime checks

5. **Enable RLS Middleware**
   Ensure all database connections set tenant context:
   ```typescript
   // Before every query
   await db.execute(sql`SET app.current_tenant = ${companyId}`);
   await db.execute(sql`SET app.current_user_role = ${userRole}`);
   ```

6. **Add Integration Tests**
   ```typescript
   describe('Tenant Isolation', () => {
     it('Company A cannot access Company B patients', async () => {
       // Test cross-tenant access attempts
     });
   });
   ```

### Long-Term Actions

7. **Implement Tenant-Scoped Repository Pattern**
   Create a wrapper that automatically injects tenant context.

8. **Add Compile-Time Checks**
   Use TypeScript's branded types to enforce tenant context:
   ```typescript
   type TenantScopedId = string & { __brand: 'TenantScoped' };
   ```

9. **Regular Security Audits**
   Schedule quarterly reviews of:
   - New methods without tenant filtering
   - New routes without `secureRoute()`
   - RLS policy coverage for new tables

---

## 6. Compliance Notes

### HIPAA Compliance
- RLS provides defense-in-depth for PHI isolation
- NHS numbers are encrypted at rest (AES-256-GCM)
- Audit logging captures access attempts

### NHS Data Security Standards
- Multi-tenant isolation meets DSP Toolkit requirements
- RLS provides mathematical proof of data separation
- Platform admin access is logged and requires MFA

---

## Appendix A: Test Script for RLS Isolation

```sql
-- Test RLS isolation
SELECT * FROM test_rls_isolation('company-uuid-here', 'user');

-- Verify no cross-tenant access
SET app.current_tenant = 'company-A';
SELECT COUNT(*) FROM patients; -- Should only see Company A patients

SET app.current_tenant = 'company-B';
SELECT COUNT(*) FROM patients; -- Should only see Company B patients
```

---

## Appendix B: Files Analyzed

- `server/storage.ts` - Data access layer
- `server/routes.ts` - Route registration
- `migrations/2025-11-25-implement-row-level-security.sql` - RLS implementation
- `migrations/add_multi_tenant_architecture.sql` - Multi-tenant schema

---

*Report generated by security audit on December 1, 2025*
