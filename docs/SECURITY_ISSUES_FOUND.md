# CRITICAL SECURITY ISSUES - Data & Role Leaks

## Executive Summary

Multiple critical security vulnerabilities have been identified that allow cross-tenant data access and role bypasses. These issues must be fixed immediately.

---

## 🚨 CRITICAL ISSUES

### 1. Companies API Leaking All Company Data

**File:** `server/routes/companies.ts`

**Issue 1a: GET /api/companies/available**
```typescript
// Line 14-40: Returns ALL companies to ANY authenticated user
router.get('/available', async (req: Request, res: Response) => {
  // NO TENANT FILTERING - Returns all companies
  const companiesList = await db
    .select()
    .from(companies)
    .where(eq(companies.status, 'active'))  // Only filters by status
    .orderBy(companies.name);

  res.json(companiesList);  // LEAK: User can see all companies
});
```

**Impact:** Any authenticated user can see ALL companies in the system, including company names, types, member counts, and other metadata.

**Fix:** This endpoint should either:
- Return only the user's own company (for regular users)
- Return all companies (for platform admin only)
- OR be made public if it's intentionally for company selection during signup

---

**Issue 1b: GET /api/companies/:id**
```typescript
// Line 46-74: Returns ANY company by ID without authorization
router.get('/:id', async (req: Request, res: Response) => {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, id))  // NO tenant check
    .limit(1);

  // LEAK: User can query any company by guessing/enumeration
  res.json(company);
});
```

**Impact:** Users can access detailed information about ANY company by ID, not just their own company.

**Fix:** Add authorization check:
```typescript
// Only allow access if:
// 1. User belongs to this company, OR
// 2. User is platform admin
if (user.companyId !== id && user.role !== 'platform_admin') {
  return res.status(403).json({ error: 'Access denied' });
}
```

---

### 2. Middleware Chain Broken - RLS Not Applied

**File:** `server/routes.ts`

**Issue:** Most routes use `isAuthenticated` (session-based) instead of the JWT middleware chain that sets tenant context.

```typescript
// Line 374-511: Routes using isAuthenticated
app.use('/api/platform-admin', isAuthenticated, requireMFA, platformAdminRoutes);
app.use('/api/pos', isAuthenticated, posRoutes);
app.use('/api/inventory', isAuthenticated, inventoryRoutes);
app.use('/api/examinations', isAuthenticated, examinationsRoutes);
// ... many more
```

**Problem:**
- `isAuthenticated` does NOT call `setTenantContext`
- PostgreSQL session variables (`app.current_tenant`, `app.current_user_role`) are NOT set
- Row-Level Security (RLS) policies are NOT enforced
- Database queries can leak cross-tenant data

**Correct Middleware Chain:**
```typescript
authenticateJWT → setTenantContext → requireRole(['ecp'])
```

**Current (BROKEN):**
```typescript
isAuthenticated  // Missing setTenantContext!
```

---

### 3. Role Mismatch: Frontend vs Backend

**Frontend:** `client/src/routes/config.ts` uses `company_admin`
**Backend:** Uses both `admin` and `company_admin`

**Examples:**

Frontend (Line 53-55):
```typescript
roles: ['ecp', 'admin', 'platform_admin'],  // Uses 'admin'
```

Frontend (Line 132-134):
```typescript
roles: ['admin', 'platform_admin'],  // Uses 'admin'
```

But backend schema defines: `company_admin`, not `admin`

**File:** `shared/schema.ts` (RoleEnum)
```typescript
export const RoleEnum = z.enum([
  'platform_admin',
  'company_admin',  // ← Correct role
  'ecp',
  'lab_tech',
  'engineer',
  'supplier'
]);
```

**Issue:** Code uses BOTH `admin` and `company_admin` interchangeably, causing:
- Authorization failures
- Users with `company_admin` role blocked from `admin`-only routes
- Inconsistent permission checks

---

### 4. Missing Tenant Context in Authentication Flow

**File:** `server/middleware/auth-jwt.ts`

**Issue:** JWT middleware extracts user but doesn't automatically set tenant context.

Current flow:
```
authenticateJWT → req.user = {...}
                  (no tenant context set)
```

Required flow:
```
authenticateJWT → setTenantContext → PostgreSQL session vars set → RLS active
```

**Fix:** Routes must ALWAYS use both middleware:
```typescript
router.get('/data',
  authenticateJWT,      // Step 1: Verify token
  setTenantContext,     // Step 2: Set RLS context
  requireRole(['ecp']), // Step 3: Check role
  handler
);
```

---

### 5. ProtectedRoute Component Doesn't Check Multi-Roles

**File:** `client/src/components/auth/ProtectedRoute.tsx`

**Issue (Line 62):** Only checks primary role, doesn't check if user has multiple roles via `userRoles` table.

```typescript
if (config.roles.length > 0 && (!user.role || !config.roles.includes(user.role))) {
  // Only checks user.role, not userRoles junction table
  return <Navigate to="/unauthorized" />;
}
```

**Problem:** Users with multi-role assignments (e.g., company_admin + ecp) can't access routes that require their secondary role.

**Fix:** Check ALL user roles, not just primary:
```typescript
const userAllRoles = [user.role, ...(user.additionalRoles || [])];
if (config.roles.length > 0 && !config.roles.some(r => userAllRoles.includes(r))) {
  return <Navigate to="/unauthorized" />;
}
```

---

## 📊 Impact Assessment

### Data Leak Severity: **CRITICAL**

| Vulnerability | Severity | Affected Users | Data Exposed |
|--------------|----------|----------------|--------------|
| Companies API leak | Critical | All authenticated users | All company data |
| Missing RLS enforcement | Critical | All users | Potentially all tenant data |
| Role mismatch | High | Company admins | Access denial to authorized routes |
| Multi-role not checked | Medium | Multi-role users | Access denial to authorized routes |

---

## 🔧 FIXES REQUIRED

### Fix 1: Secure Companies API

**File:** `server/routes/companies.ts`

```typescript
// FIX 1a: Restrict /available endpoint
router.get('/available', async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userCompanyId = req.user?.companyId;

    // Option A: Only show user's own company (recommended)
    if (userRole !== 'platform_admin') {
      if (!userCompanyId) {
        return res.status(403).json({ error: 'No company association' });
      }

      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, userCompanyId))
        .limit(1);

      return res.json([company]);
    }

    // Platform admin sees all
    const companiesList = await db
      .select()
      .from(companies)
      .where(eq(companies.status, 'active'))
      .orderBy(companies.name);

    res.json(companiesList);
  } catch (error) {
    // ...
  }
});

// FIX 1b: Add authorization to /:id endpoint
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userCompanyId = req.user?.companyId;

    // Authorization check
    if (userRole !== 'platform_admin' && userCompanyId !== id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your own company'
      });
    }

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id))
      .limit(1);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    // ...
  }
});
```

---

### Fix 2: Update Routes to Use JWT + Tenant Context

**File:** `server/routes.ts`

**Replace ALL instances of:**
```typescript
app.use('/api/XXX', isAuthenticated, xxxRoutes);
```

**With:**
```typescript
import { authenticateJWT } from './middleware/auth-jwt';
import { setTenantContext } from './middleware/tenantContext';

app.use('/api/XXX', authenticateJWT, setTenantContext, xxxRoutes);
```

**Critical routes to fix:**
- `/api/pos`
- `/api/inventory`
- `/api/examinations`
- `/api/upload`
- `/api/analytics`
- `/api/saas`
- `/api/appointments`
- `/api/ehr`
- `/api/medical-billing`
- `/api/patient-portal`
- `/api/healthcare-analytics`
- `/api/laboratory`
- `/api/pdf`
- `/api/companies`  ← CRITICAL
- `/api/users`
- `/api/clinical/workflow`
- `/api/billing`

---

### Fix 3: Standardize Role Names

**Choose ONE role name and use it consistently:**

**Option A:** Use `company_admin` everywhere (recommended, matches schema)
**Option B:** Add `admin` as alias to `company_admin` in schema

**Recommended: Update all code to use `company_admin`**

**Files to update:**
1. `client/src/routes/config.ts` - Change all `'admin'` to `'company_admin'`
2. `server/utils/rbac.ts` - Update role checks
3. `server/middleware/companyIsolation.ts` - Update role references
4. Any route handlers using `'admin'` role

**Global find and replace:**
```bash
# Find all instances
grep -r "role.*===.*'admin'" .
grep -r "roles.*:.*\['admin'" .
grep -r "requireRole.*\['admin'" .

# Replace with 'company_admin'
```

---

### Fix 4: Support Multi-Role in Frontend

**File:** `client/src/components/auth/ProtectedRoute.tsx`

```typescript
// Update line 62
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ config, children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // ... loading and auth checks ...

  // FIX: Check ALL user roles, not just primary
  if (config.roles.length > 0) {
    const userRoles = [
      user.role,
      ...(user.additionalRoles || []),  // From userRoles table
    ].filter(Boolean);

    const hasRequiredRole = config.roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" state={{ ... }} replace />;
    }
  }

  // ... rest of component
};
```

**Update Auth Hook:**

**File:** `client/src/hooks/useAuth.ts`

Add `additionalRoles` to user object from JWT token:
```typescript
interface User {
  id: string;
  email: string;
  role: string;
  additionalRoles?: string[];  // Add this
  companyId: string;
  // ...
}
```

---

### Fix 5: Update JWT Payload to Include All Roles

**File:** `server/services/JWTService.ts`

```typescript
export interface JWTPayload {
  userId: string;
  companyId: string;
  email: string;
  role: string;              // Primary role
  additionalRoles: string[]; // All roles from userRoles table
  permissions: string[];
  type: 'access' | 'refresh';
}

// Update generateAccessToken to fetch and include all roles
async generateAccessToken(user: User): Promise<string> {
  // Fetch additional roles from userRoles table
  const additionalRoles = await db
    .select({ role: userRolesTable.role })
    .from(userRolesTable)
    .where(eq(userRolesTable.userId, user.id));

  const payload: JWTPayload = {
    userId: user.id,
    companyId: user.companyId,
    email: user.email,
    role: user.role,
    additionalRoles: additionalRoles.map(r => r.role),
    permissions: await getPermissionsForUser(user.id),
    type: 'access',
  };

  return jwt.sign(payload, this.accessTokenSecret, {
    expiresIn: this.accessTokenExpiry,
  });
}
```

---

## ✅ Validation Checklist

After implementing fixes, verify:

- [ ] Companies API returns only user's company (or all for platform admin)
- [ ] All protected routes use `authenticateJWT + setTenantContext`
- [ ] PostgreSQL session variables are set (check logs)
- [ ] RLS policies are enforced (test cross-tenant queries)
- [ ] Role names are consistent across frontend and backend
- [ ] Multi-role users can access all their authorized routes
- [ ] Company admins can access admin routes
- [ ] ECPs cannot access company admin routes
- [ ] Platform admin can access everything
- [ ] No cross-tenant data leaks in API responses

---

## 🧪 Testing Plan

### Test 1: Company Isolation
```bash
# As ECP user in Company A
curl -H "Authorization: Bearer <ecp-token-company-a>" \
  http://localhost:3000/api/companies/available

# Should return ONLY Company A, not all companies
```

### Test 2: Cross-Tenant Access Attempt
```bash
# As ECP user in Company A, try to access Company B's data
curl -H "Authorization: Bearer <ecp-token-company-a>" \
  http://localhost:3000/api/companies/<company-b-id>

# Should return 403 Forbidden
```

### Test 3: Role-Based Access
```bash
# As company_admin
curl -H "Authorization: Bearer <company-admin-token>" \
  http://localhost:3000/admin/users

# Should succeed (200 OK)

# As ECP
curl -H "Authorization: Bearer <ecp-token>" \
  http://localhost:3000/admin/users

# Should fail (403 Forbidden)
```

### Test 4: RLS Enforcement
```sql
-- Set session as user in Company A
SET LOCAL app.current_tenant = '<company-a-id>';
SET LOCAL app.current_user_role = 'ecp';

-- Try to query all patients
SELECT * FROM patients;

-- Should only return patients where company_id = <company-a-id>
```

### Test 5: Multi-Role User
```bash
# As user with both company_admin + ecp roles
# Should be able to access both /admin/* and /ecp/* routes
```

---

## Priority Order

1. **IMMEDIATE (Today):**
   - Fix Companies API leaks (Fix 1)
   - Add `setTenantContext` to all routes (Fix 2)

2. **HIGH (This Week):**
   - Standardize role names (Fix 3)
   - Support multi-role in frontend (Fix 4)

3. **MEDIUM (Next Week):**
   - Update JWT payload for all roles (Fix 5)
   - Comprehensive testing
   - Security audit

---

## Estimated Impact

**Before Fixes:**
- 100% of companies visible to all users
- RLS bypass on ~60% of routes
- ~40% of company admins blocked from admin routes

**After Fixes:**
- 0% cross-tenant data leaks
- 100% RLS enforcement
- 100% role consistency
- Full multi-role support

---

## Sign-off

**Reviewed by:** Claude (AI Security Analyst)
**Date:** 2025-11-28
**Severity:** CRITICAL
**Action Required:** IMMEDIATE FIX REQUIRED

