# 🎯 Dynamic RBAC - Quick Reference Cheat Sheet

## 📝 Common Commands

### Database Setup
```bash
# Run migration
psql $DATABASE_URL -f migrations/20241105_dynamic_rbac.sql

# Seed permissions
tsx server/scripts/seedPermissions.ts

# Create default roles for company
createDefaultRoles('company-id')
```

### Check User Permissions (SQL)
```sql
-- View all permissions for a user
SELECT * FROM user_effective_permissions WHERE user_id = 'user-id';

-- Check specific permission
SELECT EXISTS (
  SELECT 1 FROM user_effective_permissions
  WHERE user_id = 'user-id'
  AND permission_keys @> '["orders:create"]'
);
```

---

## 🔌 Backend Usage

### Middleware
```typescript
import { requirePermission } from './middleware/dynamicPermissions';

// Single permission
router.post('/orders', requirePermission('orders:create'), handler);

// Multiple permissions (AND)
router.put('/company', 
  requireAllPermissions(['company:edit', 'company:manage_billing']), 
  handler
);

// Multiple permissions (OR)
router.get('/reports', 
  requireAnyPermission(['reports:view', 'analytics:view']), 
  handler
);

// Owner only
router.post('/promote-admin', requireOwner(), handler);
```

### In Route Handlers
```typescript
import { hasPermissionSync } from './middleware/dynamicPermissions';

function myHandler(req: AuthRequest, res) {
  // Synchronous check
  if (hasPermissionSync(req, 'orders:delete')) {
    // Can delete
  }
  
  // Check if feature is locked (for upsell)
  if (isFeatureLocked(req, 'analytics:view')) {
    return res.json({
      locked: true,
      upgradePlan: 'Analytics Add-On'
    });
  }
}
```

### Permission Service
```typescript
import { DynamicPermissionService } from './services/DynamicPermissionService';

// Get all user permissions
const perms = await DynamicPermissionService.getUserPermissions(userId);
// Returns: { sessionPermissions, rolePermissions, roles, isOwner, subscriptionPlan }

// Simple check
const hasAccess = await DynamicPermissionService.hasPermission(userId, 'orders:create');

// Invalidate cache (call when roles change)
await DynamicPermissionService.invalidatePermissionCache(userId);
```

---

## 🎨 Frontend Usage

### useUser Hook
```typescript
const user = useUser();

// Check permission
if (user.hasPermission('orders:create')) {
  // Show button
}

// Check multiple
if (user.hasAllPermissions(['orders:create', 'patients:view'])) {
  // ...
}

// Check if locked (for upsell)
if (user.isFeatureLocked('analytics:view')) {
  // Show upgrade prompt
}

// Access data
user.permissions         // ['orders:create', ...]
user.rolePermissions     // ['analytics:view', ...] (may include locked)
user.roles              // [{ id, name, isPrimary }, ...]
user.isOwner            // boolean
user.subscriptionPlan   // 'free' | 'full' | 'add_on_analytics'
```

### Conditional Rendering
```tsx
{user.hasPermission('users:manage_roles') && (
  <Button>Manage Team</Button>
)}

{user.isFeatureLocked('analytics:view') && (
  <Badge>
    <Lock /> Upgrade to Analytics
  </Badge>
)}

{!user.hasPermission('orders:create') && (
  <p>Contact admin for access</p>
)}
```

---

## 📊 API Endpoints

### Roles Management
```bash
# List all company roles
GET /api/roles

# Get role details
GET /api/roles/:roleId

# Create role
POST /api/roles
Body: { name, description, permissionIds }

# Update role
PUT /api/roles/:roleId
Body: { name, description, permissionIds }

# Clone role
POST /api/roles/:roleId/clone
Body: { newName }

# Delete role
DELETE /api/roles/:roleId
```

### Permissions Catalog
```bash
# Get all permissions (grouped by category)
GET /api/roles/permissions/all
```

### User Role Assignments
```bash
# Get user's roles
GET /api/roles/users/:userId

# Assign roles to user
POST /api/roles/users/:userId/assign
Body: { roleIds: ['role-1', 'role-2'], setPrimaryRoleId: 'role-1' }

# Remove role from user
DELETE /api/roles/users/:userId/remove/:roleId
```

---

## 🔑 Permission Slug Reference

### High-Level Categories
- `company:*` - Company settings
- `users:*` - User management
- `patients:*` - Patient records
- `orders:*` - Order management
- `prescriptions:*` - Prescriptions
- `examinations:*` - Clinical exams
- `inventory:*` - Inventory
- `lab:*` - Lab production
- `equipment:*` - Equipment
- `suppliers:*` - Suppliers
- `purchasing:*` - Purchase orders
- `reports:*` - Basic reports
- `analytics:*` - Analytics dashboard (UPSELL)
- `ai:*` - AI features (UPSELL)
- `integrations:*` - Third-party integrations
- `pos:*` - Point of sale

### Most Common Permissions
```
✅ FREE PLAN:
- orders:view
- orders:create
- users:view
- company:view
- reports:view

💰 FULL PLAN:
- patients:create
- prescriptions:create
- inventory:manage
- pos:access
- ai:full

⭐ ANALYTICS ADD-ON:
- analytics:view
- analytics:export
- ai:insights
- ai:predictive
```

---

## 🔧 Troubleshooting

### User has no permissions
```sql
-- Check if user has roles
SELECT * FROM user_dynamic_roles WHERE user_id = 'user-id';

-- Check role permissions
SELECT p.permission_key
FROM dynamic_role_permissions drp
JOIN permissions p ON p.id = drp.permission_id
WHERE drp.role_id = 'role-id';

-- Manually assign role
INSERT INTO user_dynamic_roles (user_id, role_id, is_primary)
VALUES ('user-id', 'admin-role-id', true);
```

### Permission not working
```typescript
// Invalidate cache
await DynamicPermissionService.invalidatePermissionCache(userId);

// Or force logout/login
```

### Feature still locked after upgrade
```sql
-- Update company plan
UPDATE companies SET subscription_plan = 'full' WHERE id = 'company-id';

-- Clear all sessions for this company's users
UPDATE sessions SET cached_permissions = NULL
WHERE user_id IN (SELECT id FROM users WHERE company_id = 'company-id');
```

---

## 🎨 Example: Creating a Custom Role

### 1. Backend
```typescript
// Create role
const result = await fetch('/api/roles', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Senior Optometrist',
    description: 'Advanced clinical access with mentoring',
    permissionIds: [
      'patients:view', 'patients:create', 'patients:edit',
      'examinations:view', 'examinations:create',
      'prescriptions:view', 'prescriptions:create', 'prescriptions:sign',
      'users:view', 'reports:view'
    ]
  })
});

const { roleId } = await result.json();

// Assign to user
await fetch(`/api/roles/users/${userId}/assign`, {
  method: 'POST',
  body: JSON.stringify({
    roleIds: [roleId],
    setPrimaryRoleId: roleId
  })
});
```

### 2. UI (Complete Flow)
```tsx
// Step 1: User clicks "Create Role"
<Button onClick={() => setShowModal(true)}>Create New Role</Button>

// Step 2: Modal with name/description
<Dialog>
  <Input value={name} onChange={e => setName(e.target.value)} />
  <Textarea value={desc} onChange={e => setDesc(e.target.value)} />
  <Button onClick={handleCreate}>Create</Button>
</Dialog>

// Step 3: Permission editor opens
<PermissionEditor roleId={roleId}>
  {categories.map(cat => (
    <CategorySection>
      {cat.permissions.map(perm => (
        <Checkbox
          checked={selected.includes(perm.id)}
          onChange={handleToggle}
        >
          {perm.name}
        </Checkbox>
      ))}
    </CategorySection>
  ))}
</PermissionEditor>

// Step 4: Save
<Button onClick={async () => {
  await fetch(`/api/roles/${roleId}`, {
    method: 'PUT',
    body: JSON.stringify({ permissionIds: selected })
  });
}}>Save</Button>
```

---

## 🚦 Migration Checklist

### Phase 1: Setup
- [ ] Run database migration
- [ ] Seed permissions
- [ ] Create default roles for companies
- [ ] Migrate existing user roles

### Phase 2: Backend
- [ ] Update auth middleware to attach permissions
- [ ] Mount `/api/roles` routes
- [ ] Replace 5 routes: `requireRole()` → `requirePermission()`
- [ ] Test API endpoints with Postman

### Phase 3: Frontend
- [ ] Update `useUser` hook
- [ ] Replace role checks with permission checks
- [ ] Add locked feature indicators
- [ ] Build Team & Roles settings page

### Phase 4: Testing
- [ ] Test permission flows end-to-end
- [ ] Test role creation/editing
- [ ] Test plan-level filtering
- [ ] Test cache invalidation
- [ ] Test company isolation

---

## 🔍 Debugging Queries

### Most Useful Queries
```sql
-- User's effective permissions
SELECT u.email, p.permission_key, p.plan_level
FROM users u
JOIN user_dynamic_roles udr ON udr.user_id = u.id
JOIN dynamic_role_permissions drp ON drp.role_id = udr.role_id
JOIN permissions p ON p.id = drp.permission_id
WHERE u.id = 'user-id';

-- Roles in a company
SELECT dr.name, COUNT(udr.user_id) as user_count
FROM dynamic_roles dr
LEFT JOIN user_dynamic_roles udr ON udr.role_id = dr.id
WHERE dr.company_id = 'company-id'
GROUP BY dr.id, dr.name;

-- Permissions by plan level
SELECT plan_level, COUNT(*) as permission_count
FROM permissions
GROUP BY plan_level;

-- Recent role changes
SELECT * FROM role_change_audit
WHERE company_id = 'company-id'
ORDER BY timestamp DESC
LIMIT 20;
```

---

## 💡 Pro Tips

### Performance
- ✅ Permissions are cached in session (no DB queries)
- ✅ Invalidate cache when roles/permissions change
- ✅ Use `hasPermissionSync(req, slug)` inside handlers (fast)

### Security
- ✅ Always check company_id in queries
- ✅ Owners bypass all checks (be careful)
- ✅ Protected roles (is_deletable = false) can't be deleted

### UX
- ✅ Show locked features (don't hide them)
- ✅ Provide clear upgrade paths
- ✅ Use badges to indicate plan requirements

### Maintenance
- ✅ Add new features by adding permissions
- ✅ Document permission slugs
- ✅ Version control your permission catalog

---

## 📚 Documentation Links

- **Complete Guide:** `DYNAMIC_RBAC_IMPLEMENTATION_GUIDE.md`
- **Quick Start:** `DYNAMIC_RBAC_QUICK_START.md`
- **Architecture:** `DYNAMIC_RBAC_ARCHITECTURE.txt`
- **Summary:** `DYNAMIC_RBAC_COMPLETE_SUMMARY.md`

---

## 🆘 Getting Help

1. Check this cheat sheet first
2. Review the implementation guide
3. Search the codebase (all files are commented)
4. Check audit logs for role changes
5. Test with different user roles

**Remember:** All code is documented. Every service has inline comments. You got this! 🚀
