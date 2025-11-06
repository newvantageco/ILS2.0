# 🌟 Dynamic RBAC Implementation Guide

## Overview

This guide documents the complete implementation of your **world-class Dynamic, Database-Driven RBAC system**. This enhancement transforms your hardcoded roles into a flexible, tenant-managed permission system.

---

## 🏗️ Architecture Summary

### The Four Pillars

1. **📊 Database-Driven Schema** - Roles and permissions live in the database
2. **➕ Sum of Permissions Logic** - No more "active role" switching
3. **💰 Unified Feature Gating** - Permissions = Product tiers
4. **🎨 Ease-of-Use UI** - Intuitive role management for tenants

---

## 📁 Files Created

### Database Layer
- `migrations/20241105_dynamic_rbac.sql` - Complete schema migration
  - New tables: `dynamic_roles`, `dynamic_role_permissions`, `user_dynamic_roles`
  - Helper tables: `permission_categories`, `role_change_audit`
  - Views and triggers for optimization

### Backend Services
- `server/scripts/seedPermissions.ts` - Master permission catalog (70+ permissions)
- `server/services/DefaultRolesService.ts` - Creates default roles for new companies
- `server/services/DynamicPermissionService.ts` - Core "sum of permissions" logic
- `server/middleware/dynamicPermissions.ts` - Simplified permission middleware
- `server/routes/dynamicRoles.ts` - Complete CRUD API for role management

---

## 🚀 Implementation Steps

### Step 1: Run Database Migration

```bash
# Connect to your database
psql $DATABASE_URL -f migrations/20241105_dynamic_rbac.sql
```

**What this does:**
- Creates all new tables for dynamic RBAC
- Adds `is_owner` flag to users table
- Creates audit logging infrastructure
- Sets up performance indices

### Step 2: Seed Permissions

```bash
# Run the permission seeding script
tsx server/scripts/seedPermissions.ts
```

**What you get:**
- 14 permission categories
- 70+ granular permissions
- Each permission has a `plan_level` (free, full, add_on_analytics)
- Categories organized for UI display

### Step 3: Create Default Roles for Existing Companies

```typescript
// In your server initialization or as a one-time script
import { createDefaultRoles } from './server/services/DefaultRolesService';

// For each existing company
const companies = await db.query.companies.findMany();

for (const company of companies) {
  await createDefaultRoles(company.id);
  console.log(`✅ Created default roles for ${company.name}`);
}
```

**What this creates for each company:**
- Admin (protected, cannot be deleted)
- Eye Care Professional (ECP)
- Lab Technician
- Engineer
- Supplier
- Optometrist
- Dispenser
- Retail Assistant

### Step 4: Migrate Existing User Roles

```sql
-- Map old user.role to new dynamic_roles system
INSERT INTO user_dynamic_roles (user_id, role_id, is_primary)
SELECT 
  u.id,
  dr.id,
  true
FROM users u
JOIN dynamic_roles dr ON dr.company_id = u.company_id
WHERE 
  (u.role = 'ecp' AND dr.name = 'Eye Care Professional (ECP)')
  OR (u.role = 'admin' AND dr.name = 'Admin')
  OR (u.role = 'lab_tech' AND dr.name = 'Lab Technician')
  OR (u.role = 'engineer' AND dr.name = 'Engineer')
  OR (u.role = 'supplier' AND dr.name = 'Supplier')
ON CONFLICT DO NOTHING;

-- Mark company owners
UPDATE users u
SET is_owner = true
WHERE u.role = 'company_admin'
  OR u.id IN (
    SELECT u2.id
    FROM users u2
    JOIN companies c ON c.id = u2.company_id
    WHERE u2.email = c.owner_email
  );
```

### Step 5: Update Authentication Flow

In your login/authentication middleware (e.g., `server/middleware/auth.ts`):

```typescript
import { attachPermissions } from './dynamicPermissions';
import { DynamicPermissionService } from '../services/DynamicPermissionService';

// After successful login
export const authenticateUser = async (req, res, next) => {
  // ... your existing auth logic ...
  
  // NEW: Attach permissions to request
  await attachPermissions(req, res, next);
  
  // NEW: Cache permissions in session
  if (req.session && req.user?.id) {
    await DynamicPermissionService.cachePermissionsInSession(
      req.session.id,
      req.user.id
    );
  }
};
```

### Step 6: Update Routes to Use New Middleware

**BEFORE (old way):**
```typescript
// Using requireRole
router.post('/orders', 
  requireRole(['ecp', 'admin']), 
  createOrder
);

// Using denyFreePlanAccess
router.get('/analytics', 
  denyFreePlanAccess('analytics'),
  getAnalytics
);
```

**AFTER (new way):**
```typescript
import { requirePermission } from './middleware/dynamicPermissions';

// Permission-based (granular)
router.post('/orders', 
  requirePermission('orders:create'), 
  createOrder
);

// Feature gating is now BUILT-IN to permissions
router.get('/analytics', 
  requirePermission('analytics:view'), // Automatically checks plan
  getAnalytics
);
```

### Step 7: Mount the Roles API

In `server/routes.ts` or your main router:

```typescript
import dynamicRolesRouter from './routes/dynamicRoles';

// Mount the roles management API
app.use('/api/roles', authenticateUser, dynamicRolesRouter);
```

### Step 8: Update Company Registration

When a new company signs up:

```typescript
import { createDefaultRoles, assignDefaultAdminRole } from './services/DefaultRolesService';

async function createNewCompany(companyData, ownerData) {
  // 1. Create the company
  const company = await db.insert(companies).values(companyData).returning();
  
  // 2. Create the owner user
  const owner = await db.insert(users).values({
    ...ownerData,
    company_id: company.id
  }).returning();
  
  // 3. Create default roles for this company
  await createDefaultRoles(company.id);
  
  // 4. Assign Admin role to owner and mark as owner
  await assignDefaultAdminRole(owner.id, company.id);
  
  return { company, owner };
}
```

---

## 🎯 Key Features

### 1. Sum of Permissions (No More Role Switching!)

**Old System:**
- User has roles: `['ecp', 'admin']`
- Must "switch" active role to access different features
- Confusing UX: "Why can't I see both dashboards?"

**New System:**
- User has permissions: `['orders:create', 'users:manage', 'patients:view', ...]`
- Gets the UNION of all permissions from all their roles
- Seamless experience: "I can do everything I'm allowed to do"

```typescript
// Example: User with both ECP and Admin roles
const permissions = await getUserPermissions(userId);

// permissions.sessionPermissions = [
//   'orders:create', 'orders:edit', 'orders:view',
//   'patients:create', 'patients:edit', 'patients:view',
//   'users:create', 'users:edit', 'users:manage_roles',
//   'company:edit', ...
// ]

// Simple check
if (permissions.sessionPermissions.includes('users:manage_roles')) {
  // Show "Manage Team" button
}
```

### 2. Plan-Level Feature Gating

Permissions have a `plan_level` field:
- `free` - Available to all users
- `full` - Requires paid plan
- `add_on_analytics` - Requires analytics add-on
- `enterprise` - Enterprise features

**During login, permissions are automatically filtered by the company's plan:**

```typescript
// User's role includes 'analytics:view' permission
// But company is on 'free' plan
// Result: 'analytics:view' is NOT in sessionPermissions

// This powers the smart upsell!
```

### 3. Smart Upsell UI

```typescript
// Frontend code
const user = useUser();

// Check if feature is "locked"
const isLocked = user.rolePermissions.includes('analytics:view') && 
                 !user.sessionPermissions.includes('analytics:view');

if (isLocked) {
  return (
    <LockedFeatureButton 
      feature="Analytics Dashboard"
      upgradePlan="Analytics Add-On"
    />
  );
}
```

### 4. Company-Specific Roles

Every company gets their own copy of default roles:
- Can customize permissions for their roles
- Can create brand new roles ("Junior Optometrist", "Front Desk Manager", etc.)
- Can clone and modify existing roles

**Example:**
```sql
-- Company A has a custom "Senior ECP" role
SELECT * FROM dynamic_roles WHERE company_id = 'company-a';
-- Result: [Admin, ECP, Lab Tech, ..., Senior ECP (custom)]

-- Company B doesn't see Company A's custom roles
SELECT * FROM dynamic_roles WHERE company_id = 'company-b';
-- Result: [Admin, ECP, Lab Tech, ...]  (just defaults)
```

---

## 📊 Database Schema

### Core Tables

```sql
-- Company-specific roles
dynamic_roles (
  id,
  company_id,  -- KEY: Multi-tenancy
  name,
  description,
  is_system_default,  -- True for default roles
  is_deletable        -- False for protected roles like "Admin"
)

-- Permissions (global catalog)
permissions (
  id,
  permission_key,      -- e.g., "orders:create"
  permission_name,     -- e.g., "Create Orders"
  plan_level,          -- 'free', 'full', 'add_on_analytics'
  category_id
)

-- Role -> Permission mapping
dynamic_role_permissions (
  role_id,
  permission_id
)

-- User -> Role mapping (many-to-many!)
user_dynamic_roles (
  user_id,
  role_id,
  is_primary  -- For UI display purposes
)
```

### The Magic View

```sql
CREATE VIEW user_effective_permissions AS
SELECT 
  u.id AS user_id,
  u.is_owner,
  COALESCE(
    -- Owners get ALL permissions
    CASE WHEN u.is_owner THEN (SELECT json_agg(p.permission_key) FROM permissions p)
    ELSE (
      -- Regular users get union of all their roles' permissions
      SELECT json_agg(DISTINCT p.permission_key)
      FROM user_dynamic_roles udr
      JOIN dynamic_role_permissions drp ON drp.role_id = udr.role_id
      JOIN permissions p ON p.id = drp.permission_id
      WHERE udr.user_id = u.id
    )
    END,
    '[]'::json
  ) AS permission_keys
FROM users u;
```

---

## 🔌 API Endpoints

### Roles Management

```
GET    /api/roles                      # List all company roles
GET    /api/roles/:roleId              # Get role details + permissions
POST   /api/roles                      # Create new role
PUT    /api/roles/:roleId              # Update role
DELETE /api/roles/:roleId              # Delete role (if deletable)
POST   /api/roles/:roleId/clone        # Clone a role
```

### Permissions Catalog

```
GET    /api/roles/permissions/all      # Get all permissions (grouped by category)
```

### User Role Assignments

```
GET    /api/roles/users/:userId                    # Get user's roles
POST   /api/roles/users/:userId/assign             # Assign roles to user
DELETE /api/roles/users/:userId/remove/:roleId     # Remove role from user
```

---

## 🎨 Frontend Integration

### Update `useUser` Hook

```typescript
// client/src/hooks/useUser.ts
export function useUser() {
  const { data: user } = useSWR('/api/user', fetcher);
  
  return {
    ...user,
    // NEW: Permission checking
    hasPermission: (slug: string) => 
      user?.permissions?.includes(slug) || false,
    
    hasAllPermissions: (slugs: string[]) =>
      slugs.every(s => user?.permissions?.includes(s)),
    
    // NEW: Check if feature is locked (for upsell)
    isFeatureLocked: (slug: string) => 
      user?.rolePermissions?.includes(slug) && 
      !user?.permissions?.includes(slug),
    
    // NEW: No more activeRole!
    roles: user?.roles || [],
    isOwner: user?.isOwner || false
  };
}
```

### Conditional Rendering

```typescript
// Before
{user.role === 'admin' && <ManageUsersButton />}

// After (granular)
{user.hasPermission('users:manage_roles') && <ManageUsersButton />}
```

### Smart Upsell Component

```typescript
interface FeatureButtonProps {
  permission: string;
  children: React.ReactNode;
  onUpgrade?: () => void;
}

function FeatureButton({ permission, children, onUpgrade }: FeatureButtonProps) {
  const user = useUser();
  
  const hasAccess = user.hasPermission(permission);
  const isLocked = user.isFeatureLocked(permission);
  
  if (isLocked) {
    return (
      <Tooltip content="Upgrade to unlock this feature">
        <button 
          disabled 
          className="opacity-50"
          onClick={onUpgrade}
        >
          {children}
          <LockIcon className="ml-2" />
        </button>
      </Tooltip>
    );
  }
  
  if (!hasAccess) {
    return null; // User's role doesn't include this permission at all
  }
  
  return <button>{children}</button>;
}

// Usage
<FeatureButton 
  permission="analytics:view"
  onUpgrade={() => navigate('/billing/upgrade')}
>
  View Analytics Dashboard
</FeatureButton>
```

---

## 🎭 Building the UI

### Tab 1: Team Members

**Route:** `/settings/team`

**Features:**
- List all users in company
- Show each user's roles (badges)
- [Invite User] button
- Edit user roles (modal with checkboxes)
- Designate user as owner (with confirmation)

**API Calls:**
```typescript
// Get all users
GET /api/users?companyId={companyId}

// Get user's roles
GET /api/roles/users/{userId}

// Assign roles
POST /api/roles/users/{userId}/assign
Body: { roleIds: ['role-1', 'role-2'], setPrimaryRoleId: 'role-1' }

// Remove role
DELETE /api/roles/users/{userId}/remove/{roleId}
```

### Tab 2: Roles

**Route:** `/settings/roles`

**Features:**
- List all company roles (table with name, description, user count, permission count)
- [Create New Role] button
- For each role:
  - [Edit] button -> Opens permission editor modal
  - [Clone] button -> Duplicate role
  - [Delete] button (if is_deletable)

**The Permission Editor Modal:**
```typescript
interface PermissionEditorProps {
  roleId: string;
  onSave: () => void;
}

function PermissionEditor({ roleId, onSave }: PermissionEditorProps) {
  const { data: allPermissions } = useSWR('/api/roles/permissions/all');
  const { data: roleData } = useSWR(`/api/roles/${roleId}`);
  
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  return (
    <Modal>
      <h2>Edit Permissions for {roleData.role.name}</h2>
      
      {allPermissions.categories.map(category => (
        <div key={category.id} className="mb-6">
          <h3>{category.name}</h3>
          <p className="text-sm text-gray-600">{category.description}</p>
          
          <div className="grid grid-cols-2 gap-2 mt-2">
            {category.permissions.map(perm => (
              <label key={perm.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(perm.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPermissions([...selectedPermissions, perm.id]);
                    } else {
                      setSelectedPermissions(selectedPermissions.filter(p => p !== perm.id));
                    }
                  }}
                />
                <span className="ml-2">{perm.name}</span>
                {perm.planLevel !== 'free' && (
                  <Badge variant="premium">{perm.planLevel}</Badge>
                )}
              </label>
            ))}
          </div>
        </div>
      ))}
      
      <button onClick={async () => {
        await fetch(`/api/roles/${roleId}`, {
          method: 'PUT',
          body: JSON.stringify({ permissionIds: selectedPermissions })
        });
        onSave();
      }}>
        Save Changes
      </button>
    </Modal>
  );
}
```

---

## 🔄 Migration Checklist

- [ ] Run database migration
- [ ] Seed permissions
- [ ] Create default roles for existing companies
- [ ] Migrate existing user roles to new system
- [ ] Mark company owners (set `is_owner = true`)
- [ ] Update authentication middleware to attach permissions
- [ ] Update `useUser` hook to include permissions
- [ ] Replace `requireRole()` calls with `requirePermission()`
- [ ] Remove `denyFreePlanAccess()` calls (now handled by plan_level)
- [ ] Remove "active role" switching UI
- [ ] Build Team & Roles settings page
- [ ] Test permission flows end-to-end
- [ ] Document for your team

---

## 🚨 Important Notes

### Performance

**Permissions are cached!**
- On login, permissions are fetched once and stored in session
- Middleware checks use cached array (no DB queries)
- Cache is invalidated when:
  - User's roles change
  - Role's permissions change
  - Company's subscription plan changes

### Security

**Company Isolation:**
- All queries include `company_id` filter
- API endpoints verify user's company matches target resource's company
- Platform admins can access all companies (check `is_owner` or special platform_admin logic)

**Audit Logging:**
- All role/permission changes are logged in `role_change_audit`
- Includes: who made the change, what changed, old/new values
- For compliance and rollback

### Backward Compatibility

During migration, you can support both systems:
```typescript
// Check old and new permission systems
if (hasPermissionSync(req, 'orders:create') || req.user?.role === 'ecp') {
  // Allow
}
```

Gradually migrate routes over time.

---

## 📈 Benefits

1. **For You (Platform Owner):**
   - Easy to add new features (just add a permission)
   - Easy to create new subscription tiers (just change plan_level)
   - Complete audit trail
   - Scales to any number of roles/permissions

2. **For Your Tenants:**
   - Create custom roles for their org structure
   - Granular control over what each team member can do
   - No confusion about "switching roles"
   - Clear upgrade path when features are locked

3. **For End Users:**
   - One dashboard with everything they can do
   - No need to remember which "hat" to wear
   - Intuitive locked feature indicators

---

## 🎉 You're Done!

You now have a **world-class, database-driven RBAC system** that rivals enterprise SaaS platforms!

Your tenants can:
- ✅ Create custom roles
- ✅ Assign granular permissions
- ✅ Manage their team with ease
- ✅ See clear upgrade paths

Your codebase:
- ✅ Is future-proof and scalable
- ✅ Has unified feature gating
- ✅ Has comprehensive audit logging
- ✅ Performs permission checks blazing fast

**Welcome to the big leagues!** 🚀
