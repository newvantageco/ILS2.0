# Route Integration Guide - Multi-Role Assignment System

This guide shows how to integrate the multi-role assignment UI into your application routes.

## Quick Integration

### Step 1: Add Routes to Your Router

Edit `client/src/App.tsx` or your routing configuration file:

```tsx
import UsersManagement from '@/pages/admin/UsersManagement';
import RoleManagement from '@/pages/admin/RoleManagement';

// Inside your Routes component
<Route path="/admin/users" element={<UsersManagement />} />
<Route path="/admin/roles" element={<RoleManagement />} />
```

### Step 2: Add Navigation Links

Add to your admin sidebar or navigation menu:

```tsx
import { Users, Shield } from 'lucide-react';

<NavLink to="/admin/users">
  <Users className="h-4 w-4 mr-2" />
  User Management
</NavLink>

<NavLink to="/admin/roles">
  <Shield className="h-4 w-4 mr-2" />
  Role Management
</NavLink>
```

### Step 3: Protect Routes (Optional)

Use permission gates to restrict access:

```tsx
import { RequirePermission } from '@/hooks/usePermissions';

<Route
  path="/admin/users"
  element={
    <RequirePermission permission="users:view">
      <UsersManagement />
    </RequirePermission>
  }
/>

<Route
  path="/admin/roles"
  element={
    <RequirePermission permission="users:manage_roles">
      <RoleManagement />
    </RequirePermission>
  }
/>
```

## Usage Flow

1. Navigate to `/admin/users`
2. Find a user in the list
3. Click "Manage Roles" button
4. Select **multiple roles** using checkboxes
5. Choose a primary role from dropdown
6. Click "Assign Roles"
7. User now has multiple roles with combined permissions!

## Complete Example

```tsx
// App.tsx or routing configuration
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RequirePermission } from '@/hooks/usePermissions';
import UsersManagement from '@/pages/admin/UsersManagement';
import RoleManagement from '@/pages/admin/RoleManagement';

function AppRoutes() {
  return (
    <Routes>
      {/* Admin Routes */}
      <Route path="/admin">
        <Route
          path="users"
          element={
            <RequirePermission permission="users:view">
              <UsersManagement />
            </RequirePermission>
          }
        />
        <Route
          path="roles"
          element={
            <RequirePermission permission="users:manage_roles">
              <RoleManagement />
            </RequirePermission>
          }
        />
      </Route>

      {/* Other routes */}
      <Route path="/" element={<Navigate to="/admin/users" replace />} />
    </Routes>
  );
}

export default AppRoutes;
```

## Navigation Sidebar Example

```tsx
// AdminSidebar.tsx
import { Users, Shield, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';

export function AdminSidebar() {
  const { hasPermission } = usePermissions();

  return (
    <nav className="space-y-2">
      {hasPermission('users:view') && (
        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg ${
              isActive ? 'bg-primary text-white' : 'hover:bg-gray-100'
            }`
          }
        >
          <Users className="h-5 w-5" />
          <span>User Management</span>
        </NavLink>
      )}

      {hasPermission('users:manage_roles') && (
        <NavLink
          to="/admin/roles"
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg ${
              isActive ? 'bg-primary text-white' : 'hover:bg-gray-100'
            }`
          }
        >
          <Shield className="h-5 w-5" />
          <span>Role Management</span>
        </NavLink>
      )}
    </nav>
  );
}
```

## Testing

After adding routes:

1. Start your application: `npm run dev`
2. Navigate to `/admin/users`
3. You should see the users list
4. Click "Manage Roles" on any user
5. Select multiple roles and assign them

## Troubleshooting

### Issue: Routes not found (404)

**Solution**: Ensure your routing configuration includes the admin routes. Check that `BrowserRouter` or `HashRouter` is wrapping your routes.

### Issue: Permission denied

**Solution**: The current user needs `users:view` permission to see the users page, and `users:manage_roles` to assign roles. Log in with an admin account.

### Issue: Components not rendering

**Solution**: Check that all imports are correct and that the component files exist in the correct locations:
- `client/src/pages/admin/UsersManagement.tsx`
- `client/src/pages/admin/RoleManagement.tsx`
- `client/src/components/admin/UserRoleAssignment.tsx`

## That's It!

You now have a fully functional multi-role assignment system integrated into your application. Users can be assigned multiple roles, and the system will automatically aggregate permissions from all assigned roles.

For more details, see `MULTI_ROLE_ASSIGNMENT_GUIDE.md`.
