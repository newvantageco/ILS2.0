# Multi-Tenant Architecture Issues & Fixes

## Critical Issues Identified

### Issue 1: Role Overwriting on Company Creation ❌
**Location**: `server/routes/companies.ts:131`

**Problem**: When a user creates a company, their functional role (ecp, lab_tech, admin) gets replaced with `company_admin`. This breaks dashboard routing and functionality.

**Current Code**:
```typescript
await db.update(users).set({ 
  companyId: newCompany.id,
  role: 'company_admin',  // ❌ OVERWRITES functional role
  accountStatus: 'active'
})
```

**Impact**: 
- ECP user creates company → loses access to ECP dashboard
- Lab tech creates company → loses access to Lab dashboard  
- User gets wrong dashboard and features

---

### Issue 2: Missing Company Assignment for Existing Users ❌
**Problem**: Test users created without `companyId` cannot access tenant-scoped features.

**Current State**:
```
admin@test.com - role: admin, companyId: NULL
lab@test.com   - role: lab_tech, companyId: NULL  
```

**Impact**:
- Users see "complete onboarding" loop
- Cannot create orders (requires companyId)
- Data isolation fails

---

### Issue 3: Incorrect Multi-Tenant Pattern ❌
**Problem**: The system mixes two concepts:
1. **Functional Role**: What the user DOES (ecp, lab_tech, dispenser)
2. **Administrative Role**: Company admin privileges

**Current Approach** (WRONG):
- Uses single `role` field
- Replaces functional role with `company_admin`
- User loses their job function

**Correct Approach** (NEEDED):
- Keep functional role in `role` field
- Add `isCompanyAdmin` boolean flag OR
- Use existing `user_dynamic_roles` table for multiple roles

---

### Issue 4: No Default Company for Test Users ❌
**Problem**: When creating test users directly in DB, no company is assigned.

**Impact**: Users hit onboarding flow immediately after login.

---

### Issue 5: Dashboard Routing Confusion ❌
**Problem**: `company_admin` role routes to `/company-admin` dashboard, but this should be accessible ALONGSIDE functional dashboards.

**Current Routing**:
```typescript
case "company_admin":
  return "/company-admin";  // ❌ User loses their real dashboard
```

**Expected Behavior**:
- User keeps their functional dashboard (ecp, lab, etc.)
- Company admin features accessible via sidebar/menu
- Multi-role support

---

## Recommended Solution Architecture

### Option A: Boolean Flag Approach (SIMPLEST)

**Database Changes**:
```sql
ALTER TABLE users ADD COLUMN is_company_admin BOOLEAN DEFAULT FALSE;
```

**Benefits**:
- Minimal code changes
- Clear separation of concerns
- Preserves functional roles

**Company Creation Fix**:
```typescript
await db.update(users).set({ 
  companyId: newCompany.id,
  isCompanyAdmin: true,  // ✅ Flag instead of role change
  accountStatus: 'active'
  // role stays unchanged
})
```

---

### Option B: Multi-Role Approach (MORE FLEXIBLE)

Use the existing `user_dynamic_roles` table:

**Benefits**:
- Supports multiple roles per user
- Better RBAC
- More scalable

**Implementation**:
```typescript
// Assign primary functional role
await db.insert(userDynamicRoles).values({
  userId: user.id,
  roleId: functionalRoleId,
  isPrimary: true
});

// Add company admin role
await db.insert(userDynamicRoles).values({
  userId: user.id,  
  roleId: companyAdminRoleId,
  isPrimary: false
});
```

---

## Immediate Fixes Required

### Fix 1: Stop Overwriting Roles
**File**: `server/routes/companies.ts`

```typescript
// BEFORE (line 126-134)
await db.update(users).set({ 
  companyId: newCompany.id,
  role: 'company_admin',  // ❌ REMOVE THIS
  accountStatus: 'active'
})

// AFTER
await db.update(users).set({ 
  companyId: newCompany.id,
  isCompanyAdmin: true,  // ✅ ADD THIS
  accountStatus: 'active'
  // Keep existing role
})
```

---

### Fix 2: Create Default Company for Test Environment

**File**: `server/scripts/createTestCompany.ts` (NEW)

```typescript
// Create a default test company
const defaultCompany = await db.insert(companies).values({
  name: "Test Company",
  type: "ecp",
  status: "active",
  email: "company@test.com",
  subscriptionPlan: "full"
}).returning();

// Assign all test users to this company
await db.update(users)
  .set({ companyId: defaultCompany.id })
  .where(sql`email LIKE '%@test.com'`);
```

---

### Fix 3: Update Dashboard Routing Logic

**File**: `client/src/App.tsx`

```typescript
// Remove company_admin from role-based routing
// Instead, add company admin menu items conditionally

const getRoleBasePath = () => {
  switch (userRole) {
    case "ecp": return "/ecp";
    case "lab_tech": return "/lab";
    case "admin": return "/admin";
    // Remove company_admin case - it's not a functional role
    default: return "/welcome";
  }
};
```

---

### Fix 4: Add Company Admin Permissions Check

**File**: `client/src/hooks/usePermissions.ts` (NEW or UPDATE)

```typescript
export function usePermissions() {
  const { user } = useAuth();
  
  return {
    canManageCompany: user?.isCompanyAdmin || user?.role === 'admin',
    canInviteUsers: user?.isCompanyAdmin || user?.role === 'admin',
    canManageBilling: user?.isCompanyAdmin,
    functionalRole: user?.role,
  };
}
```

---

### Fix 5: Update Sidebar to Show Company Admin Options

**File**: `client/src/components/AppSidebar.tsx`

```typescript
const { user } = useAuth();
const canManageCompany = user?.isCompanyAdmin || user?.role === 'admin';

// Show company management link for admins
{canManageCompany && (
  <SidebarMenuItem>
    <SidebarMenuButton asChild>
      <Link href="/company">Company Settings</Link>
    </SidebarMenuButton>
  </SidebarMenuItem>
)}
```

---

## Migration Plan

### Phase 1: Database (IMMEDIATE)
1. Add `is_company_admin` column to users table
2. Migrate existing `company_admin` role users
3. Update onboarding company creation logic

### Phase 2: Backend (DAY 1)
1. Fix `POST /api/companies` endpoint
2. Create default test company script
3. Update authentication middleware

### Phase 3: Frontend (DAY 1-2)
1. Remove `company_admin` from routing
2. Add permission-based company management access
3. Update sidebar with conditional company admin menu

### Phase 4: Testing (DAY 2)
1. Test user creation flow
2. Test company creation flow  
3. Verify multi-tenant data isolation
4. Test role-based dashboard access

---

## Data Validation Queries

```sql
-- Check for users without companies (should be empty)
SELECT email, role, company_id FROM users WHERE company_id IS NULL;

-- Check for company_admin role users (needs migration)
SELECT email, role, company_id FROM users WHERE role = 'company_admin';

-- Verify tenant isolation
SELECT c.name, COUNT(u.id) as user_count 
FROM companies c 
LEFT JOIN users u ON c.id = u.company_id 
GROUP BY c.id, c.name;
```

---

## Expected Behavior After Fixes

✅ User creates company → keeps functional role (ecp, lab_tech, etc.)
✅ User gets `isCompanyAdmin` flag for admin features  
✅ Dashboard routing based on functional role
✅ Company admin features accessible via sidebar
✅ Test users belong to default test company
✅ Multi-tenant data isolation works correctly
✅ Role-based permissions work as expected
