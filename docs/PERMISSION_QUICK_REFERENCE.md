# Permission System - Quick Reference Guide

## 🚀 Quick Start

Import the permission utilities in your code:

```typescript
// Client-side
import { isAdmin, isECP, canPerformExaminations } from '@/utils/permissions';

// Server-side
import { isAdmin, isECP, canPerformExaminations } from '../utils/permissions';
```

## 📋 Common Use Cases

### 1. Check if user can edit examinations

```typescript
import { canEditExaminations } from '@/utils/permissions';

if (canEditExaminations(user)) {
  // Show edit UI
}
```

### 2. Check if user is an admin

```typescript
import { isAdmin } from '@/utils/permissions';

if (isAdmin(user)) {
  // Show admin features
}
```

### 3. Check if user can manage test rooms

```typescript
import { canManageTestRooms } from '@/utils/permissions';

if (canManageTestRooms(user)) {
  // Show test room management
}
```

### 4. Express middleware example

```typescript
import { requireAdminMiddleware } from '../utils/permissions';

router.post('/admin-only-route', isAuthenticated, async (req: any, res) => {
  const user = req.user;
  
  if (!requireAdminMiddleware(user)) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  // Admin-only code
});
```

### 5. React component example

```tsx
import { canPerformExaminations } from '@/utils/permissions';
import { useAuth } from '@/hooks/useAuth';

function ExaminationButton() {
  const { user } = useAuth();
  
  if (!canPerformExaminations(user)) {
    return null; // Hide button
  }
  
  return <Button onClick={handleExam}>Start Examination</Button>;
}
```

## 🎯 Available Functions

### Admin Checks
| Function | Returns true for |
|----------|-----------------|
| `isAdmin(user)` | platform_admin, admin, company_admin |
| `isPlatformAdmin(user)` | platform_admin only |
| `isCompanyAdmin(user)` | company_admin, platform_admin |

### Role Checks
| Function | Returns true for |
|----------|-----------------|
| `isECP(user)` | ecp, optometrist, or any admin |

### Feature Checks
| Function | Purpose |
|----------|---------|
| `canPerformExaminations(user)` | Can conduct eye examinations |
| `canEditExaminations(user)` | Can edit examination records |
| `canCreateExaminations(user)` | Can create new examinations |
| `canManageTestRooms(user)` | Can manage test rooms |
| `canCreatePrescriptionTemplates(user)` | Can create Rx templates |
| `canManageClinicalProtocols(user)` | Can manage protocols |
| `canViewAuditLogs(user)` | Can view audit logs |
| `canTriggerScheduledEmails(user)` | Can trigger email campaigns |
| `canManageCompanySettings(user)` | Can manage company settings |
| `canManagePlatformSettings(user)` | Can manage platform settings |
| `canAccessIntelligentSystem(user)` | Can access AI features |

### Display Functions
| Function | Purpose |
|----------|---------|
| `getRoleDisplayName(role)` | Get human-readable role name |
| `getRoleBadgeColor(role)` | Get Tailwind classes for role badge |

## 🛡️ Role Permissions Matrix

| Feature | platform_admin | admin | company_admin | ecp | Other Roles |
|---------|---------------|-------|---------------|-----|-------------|
| Eye Examinations | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit Examinations | ✅ | ✅ | ✅ | ✅ | ❌ |
| Test Room Management | ✅ | ✅ | ✅ | ❌ | ❌ |
| Prescription Templates | ✅ | ✅ | ✅ | ✅ | ❌ |
| Clinical Protocols | ✅ | ✅ | ✅ | ✅ | ❌ |
| Audit Logs | ✅ | ✅ | ✅ | ❌ | ❌ |
| Scheduled Emails | ✅ | ✅ | ✅ | ❌ | ❌ |
| Company Settings | ✅ | ❌ | ✅ | ❌ | ❌ |
| Platform Settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| AI/Intelligent System | ✅ | ✅ | ✅ | ✅ | ❌ |

## ⚠️ Anti-Patterns (Don't Do This)

### ❌ Bad: Long role checks
```typescript
if (user?.role === 'ecp' || user?.role === 'admin' || user?.role === 'company_admin' || user?.role === 'platform_admin') {
  // This is hard to maintain
}
```

### ✅ Good: Use permission utilities
```typescript
if (canPerformExaminations(user)) {
  // Clean and maintainable
}
```

### ❌ Bad: Inconsistent checks
```typescript
// File 1
if (user.role === 'ecp' || user.role === 'admin') { }

// File 2
if (user.role === 'ecp' || user.role === 'company_admin') { }
```

### ✅ Good: Consistent utilities
```typescript
// Both files
if (canPerformExaminations(user)) { }
```

## 🔧 Migration Example

### Before:
```typescript
// Old way - inconsistent and error-prone
const canEdit = user?.enhancedRole === 'optometrist' || 
                user?.role === 'ecp' || 
                user?.role === 'platform_admin' || 
                user?.role === 'admin';
```

### After:
```typescript
// New way - clean and consistent
import { canEditExaminations } from '@/utils/permissions';

const canEdit = canEditExaminations(user);
```

## 📝 Type Safety

The permission utilities are fully typed:

```typescript
interface User {
  id?: string;
  role?: string;
  enhancedRole?: string;
  companyId?: string;
}

// All functions accept User | null | undefined
canPerformExaminations(user: User | null | undefined): boolean
```

This means you can safely call them without null checks:

```typescript
// Safe to call even if user is undefined
if (canPerformExaminations(user)) {
  // Will only execute if user exists and has permission
}
```

## 🎨 UI Component Examples

### Badge Component
```tsx
import { getRoleDisplayName, getRoleBadgeColor } from '@/utils/permissions';

function UserRoleBadge({ role }: { role: string }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${getRoleBadgeColor(role)}`}>
      {getRoleDisplayName(role)}
    </span>
  );
}
```

### Conditional Rendering
```tsx
import { isAdmin, canPerformExaminations } from '@/utils/permissions';

function ActionButtons({ user }) {
  return (
    <div className="flex gap-2">
      {canPerformExaminations(user) && (
        <Button>Start Examination</Button>
      )}
      {isAdmin(user) && (
        <Button>Admin Settings</Button>
      )}
    </div>
  );
}
```

## 🔐 Security Best Practices

1. **Always check on server-side** - Client-side checks are for UI only
2. **Use middleware** - Protect routes with authentication middleware
3. **Validate permissions** - Always validate permissions before database operations
4. **Log access attempts** - Log all permission checks for audit trail
5. **Fail secure** - Default to denying access if unsure

```typescript
// Server-side route protection example
router.post('/clinical-data', isAuthenticated, async (req: any, res) => {
  const user = req.user;
  
  // Double-check permissions
  if (!canPerformExaminations(user)) {
    // Log the attempt
    await auditLog.log({
      userId: user.id,
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      resource: 'clinical-data',
    });
    
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  
  // Proceed with authorized action
});
```

## 📚 Further Reading

- See `PERMISSION_FIXES_SUMMARY.md` for complete list of changes
- Check `server/utils/permissions.ts` for server-side implementation
- Check `client/src/utils/permissions.ts` for client-side implementation
