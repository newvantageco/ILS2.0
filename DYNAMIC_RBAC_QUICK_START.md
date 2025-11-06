# 🚀 Dynamic RBAC Quick Start

## TL;DR - Get Started in 5 Steps

This is the express version of implementing your world-class RBAC system.

---

## Step 1: Database Setup (5 minutes)

```bash
# Run the migration
psql $DATABASE_URL -f migrations/20241105_dynamic_rbac.sql

# Seed permissions
tsx server/scripts/seedPermissions.ts
```

**Verify:**
```sql
SELECT COUNT(*) FROM permissions;  -- Should return ~70
SELECT COUNT(*) FROM permission_categories;  -- Should return 14
```

---

## Step 2: Create Roles for Existing Companies (2 minutes)

Create a one-time script: `server/scripts/migrateToDynamicRBAC.ts`

```typescript
import { createDefaultRoles } from '../services/DefaultRolesService';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function migrate() {
  // Get all companies
  const companies = await db.execute(sql`SELECT id, name FROM companies`);
  
  console.log(`Creating default roles for ${companies.rows.length} companies...`);
  
  for (const company of companies.rows) {
    try {
      await createDefaultRoles(company.id as string);
      console.log(`✅ ${company.name}`);
    } catch (error) {
      console.error(`❌ ${company.name}:`, error);
    }
  }
  
  console.log('\n✅ Migration complete!');
}

migrate();
```

Run it:
```bash
tsx server/scripts/migrateToD dynamicRBAC.ts
```

---

## Step 3: Migrate User Roles (1 minute)

```sql
-- Map old user.role to new dynamic_roles
INSERT INTO user_dynamic_roles (user_id, role_id, is_primary)
SELECT 
  u.id,
  dr.id,
  true
FROM users u
JOIN dynamic_roles dr ON dr.company_id = u.company_id
WHERE 
  (u.role = 'ecp' AND dr.name LIKE '%ECP%')
  OR (u.role = 'admin' AND dr.name = 'Admin')
  OR (u.role = 'lab_tech' AND dr.name = 'Lab Technician')
  OR (u.role = 'engineer' AND dr.name = 'Engineer')
  OR (u.role = 'supplier' AND dr.name = 'Supplier')
ON CONFLICT DO NOTHING;

-- Mark owners
UPDATE users SET is_owner = true 
WHERE role IN ('company_admin', 'owner');
```

---

## Step 4: Update Authentication (3 minutes)

In `server/middleware/auth.ts`:

```typescript
import { attachPermissions } from './dynamicPermissions';
import { DynamicPermissionService } from '../services/DynamicPermissionService';

// Add to your authenticateUser middleware
export const authenticateUser = async (req, res, next) => {
  // ... your existing authentication ...
  
  // Verify token, get user from DB, etc.
  const user = /* your user object */;
  req.user = user;
  
  // ✨ NEW: Load and cache permissions
  await attachPermissions(req, res, next);
};
```

In `server/routes.ts`, mount the roles API:

```typescript
import dynamicRolesRouter from './routes/dynamicRoles';

app.use('/api/roles', authenticateUser, dynamicRolesRouter);
```

---

## Step 5: Start Using Permissions (ongoing)

### In Routes

**Before:**
```typescript
router.post('/orders', requireRole(['ecp', 'admin']), createOrder);
```

**After:**
```typescript
import { requirePermission } from './middleware/dynamicPermissions';

router.post('/orders', requirePermission('orders:create'), createOrder);
```

### In Frontend

Update `useUser` hook:

```typescript
export function useUser() {
  const { data: user } = useSWR('/api/user', fetcher);
  
  return {
    ...user,
    hasPermission: (slug: string) => user?.permissions?.includes(slug) || false,
    isFeatureLocked: (slug: string) => 
      user?.rolePermissions?.includes(slug) && !user?.permissions?.includes(slug)
  };
}
```

Use in components:

```typescript
const user = useUser();

{user.hasPermission('users:manage_roles') && (
  <Button>Manage Team</Button>
)}

{user.isFeatureLocked('analytics:view') && (
  <LockedFeatureBadge plan="Analytics Add-On" />
)}
```

---

## 🎯 Permission Slug Reference

Quick reference for common permissions:

### Company
- `company:view` - View company profile
- `company:edit` - Edit company settings
- `company:manage_billing` - Access billing

### Users
- `users:view` - View team members
- `users:create` - Invite users
- `users:edit` - Edit user details
- `users:manage_roles` - Assign roles
- `users:delete` - Remove users

### Patients
- `patients:view` - View patients
- `patients:create` - Add patients
- `patients:edit` - Edit patient records
- `patients:delete` - Remove patients
- `patients:export` - Export data

### Orders
- `orders:view` - View orders
- `orders:create` - Create orders
- `orders:edit` - Edit orders
- `orders:delete` - Cancel orders
- `orders:update_status` - Update status (lab)
- `orders:view_all` - See all company orders

### Analytics (upsell opportunity!)
- `analytics:view` - Analytics dashboard (requires add_on_analytics plan)
- `analytics:export` - Export analytics (requires add_on_analytics plan)

### AI Features (upsell opportunity!)
- `ai:basic` - Basic AI (free plan)
- `ai:full` - Full AI (full plan)
- `ai:insights` - AI insights (add_on_analytics plan)

See `server/scripts/seedPermissions.ts` for complete list.

---

## 📋 Testing Checklist

- [ ] Can create a new role via API
- [ ] Can assign permissions to a role
- [ ] Can assign role to a user
- [ ] User gets permissions from all their roles (sum)
- [ ] Free plan user cannot access `analytics:view`
- [ ] Full plan user CAN access `analytics:view` (if role has it)
- [ ] Owner has all permissions automatically
- [ ] Permission cache is invalidated when roles change
- [ ] Cannot delete a role with active users
- [ ] Cannot delete a non-deletable role (Admin)

---

## 🐛 Common Issues

### "Permission not found" errors
**Cause:** Permissions not seeded or misspelled slug  
**Fix:** Run `tsx server/scripts/seedPermissions.ts` again

### Users have no permissions
**Cause:** User roles not migrated or no roles assigned  
**Fix:** Run the user role migration SQL from Step 3

### Permissions not updating in session
**Cause:** Cache not invalidated  
**Fix:** Call `DynamicPermissionService.invalidatePermissionCache(userId)`

### Free users can access paid features
**Cause:** Permission doesn't have correct `plan_level`  
**Fix:** Update permission in database: `UPDATE permissions SET plan_level = 'full' WHERE permission_key = 'your:permission'`

---

## 🎉 You're Live!

Test your new system:

1. **Create a custom role:**
   ```bash
   curl -X POST http://localhost:3000/api/roles \
     -H "Cookie: session=..." \
     -d '{"name":"Senior Optometrist","permissionIds":["perm-1","perm-2"]}'
   ```

2. **Assign role to user:**
   ```bash
   curl -X POST http://localhost:3000/api/roles/users/USER_ID/assign \
     -d '{"roleIds":["ROLE_ID"]}'
   ```

3. **Check user's permissions:**
   ```bash
   curl http://localhost:3000/api/user
   # Should include: { permissions: [...], rolePermissions: [...], roles: [...] }
   ```

**Next:** Build the UI (see `DYNAMIC_RBAC_IMPLEMENTATION_GUIDE.md` for Tab 1 & Tab 2 examples)

---

## 📚 Full Documentation

For complete details, architecture diagrams, and UI examples:
- `DYNAMIC_RBAC_IMPLEMENTATION_GUIDE.md` - Complete implementation guide
- `migrations/20241105_dynamic_rbac.sql` - Database schema
- `server/scripts/seedPermissions.ts` - Permission catalog
- `server/services/DefaultRolesService.ts` - Role templates

---

**Questions?** All the code is documented with inline comments. Happy coding! 🚀
