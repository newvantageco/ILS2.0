# 🔐 Role-Based Access Control (RBAC) Implementation

## Overview
Implemented a comprehensive RBAC system with company isolation that separates platform administration from company administration.

---

## 🎭 Roles Hierarchy

### Platform Level
**`platform_admin`** - Master Administrator
- Full system access across ALL companies
- Can create, edit, delete any user in any company
- Can manage all companies and their settings
- No rate limits, unlimited access
- **Isolation**: NONE (sees everything)

### Company Level
**`company_admin`** - Company Administrator  
- Full access within THEIR company only
- Can create, edit, delete users in their company
- Can manage company settings and billing
- Can access all company data and reports
- **Isolation**: COMPANY (only sees their company)

**`ecp`** - Eye Care Professional (Subscribed User)
- Standard operational access within their company
- Can create/edit orders, patients, prescriptions
- Can view company users (read-only)
- Limited by subscription plan for AI features
- **Isolation**: COMPANY

**`lab_tech`** - Laboratory Technician
- Production and inventory management
- Can update order status and production queue
- View-only access to orders and inventory
- **Isolation**: COMPANY

**`engineer`** - Engineer
- Equipment and technical management
- Can manage equipment and maintenance logs
- View-only access to orders and inventory
- **Isolation**: COMPANY

**`supplier`** - Supplier
- Supplier portal access
- Limited order visibility
- Can manage their catalog
- **Isolation**: COMPANY

**`admin`** - Legacy Admin (deprecated)
- Mapped to `company_admin` for backward compatibility
- **Isolation**: COMPANY

---

## 🏗️ Architecture

### Files Created:

1. **`server/utils/rbac.ts`**
   - Central RBAC configuration
   - Permission definitions for each role
   - Helper functions for permission checks

2. **`server/middleware/companyIsolation.ts`**
   - Enforces company data isolation
   - Validates company access
   - Provides helper functions for queries

3. **`server/routes/userManagement.ts`**
   - User CRUD operations with RBAC
   - Company-isolated user management
   - Role-based user creation restrictions

### Files Modified:

1. **`server/middleware/subscription.ts`**
   - Updated to use RBAC helper functions
   - Cleaner platform admin detection

---

## 🔑 Key Features

### 1. Company Isolation
```typescript
// Platform admin sees ALL users
GET /api/users
Response: [user1@companyA.com, user2@companyB.com, user3@companyC.com]

// Company admin sees ONLY their company users
GET /api/users (as company_admin@companyA.com)
Response: [user1@companyA.com, user4@companyA.com]
```

### 2. Permission Checks
```typescript
// Check specific permission
hasPermission(userRole, 'create_company_user')

// Check company access
canAccessCompany(userRole, userCompanyId, targetCompanyId)

// Check user management permission
canManageUsers(userRole, userCompanyId, targetUserCompanyId)
```

### 3. Role-Based User Creation
```typescript
// Platform admin can create ANY role
platform_admin -> [platform_admin, company_admin, ecp, lab_tech, engineer, supplier]

// Company admin can create COMPANY roles only
company_admin -> [company_admin, ecp, lab_tech, engineer, supplier]

// Regular users CANNOT create users
ecp -> []
```

### 4. Middleware Stack
```typescript
router.use(enforceCompanyIsolation);  // 1. Load user & company context
router.use(validateCompanyAccess());   // 2. Validate access to target company
router.use(requireCompanyOrPlatformAdmin); // 3. Check admin permissions
```

---

## 📋 API Endpoints

### User Management (`/api/users`)

#### **GET /api/users**
List users with company isolation
- **Platform Admin**: Sees all users from all companies
- **Company Admin**: Sees only users from their company
- **Regular Users**: Sees only users from their company (if permission granted)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-123",
      "email": "john@company.com",
      "role": "ecp",
      "companyId": "company-456",
      "companyName": "Acme Optical",
      "isActive": true
    }
  ],
  "meta": {
    "total": 15,
    "isPlatformAdmin": false
  }
}
```

#### **GET /api/users/:id**
Get specific user details
- Validates company access before returning
- Returns 403 if user from different company (unless platform admin)

#### **POST /api/users**
Create new user (admin only)
- **Platform Admin**: Can create users in ANY company
- **Company Admin**: Can only create users in their own company
- Auto-verifies admin-created users
- Validates role permissions

**Request:**
```json
{
  "email": "newuser@company.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "ecp",
  "companyId": "company-456"  // Optional for platform admin
}
```

#### **PUT /api/users/:id**
Update user (admin only)
- Validates company access
- Prevents unauthorized role changes
- Company admin cannot promote to platform_admin

**Request:**
```json
{
  "firstName": "Jane",
  "role": "company_admin",
  "isActive": true
}
```

#### **DELETE /api/users/:id**
Delete user (admin only)
- Soft delete (deactivates user)
- Prevents self-deletion
- Validates company access

#### **GET /api/users/roles/allowed**
Get roles current user can assign
- Returns roles based on user's permissions
- Used for user creation forms

---

## 🔒 Permission Matrix

| Action | Platform Admin | Company Admin | ECP | Lab Tech | Engineer | Supplier |
|--------|---------------|---------------|-----|----------|----------|----------|
| View All Companies | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Own Company | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Company | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit Any Company | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View All Users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Company Users | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Create User (Any Company) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create User (Own Company) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit User (Any Company) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit User (Own Company) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete User | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Full AI Access | ✅ | ✅* | ✅* | ❌ | ❌ | ❌ |
| View All Orders | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Company Orders | ✅ | ✅ | ✅ | ✅ | ✅ | Limited |
| Create Order | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Company Patients | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Inventory | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |

*Subject to subscription plan

---

## 🧪 Testing

### Test Company Isolation

**1. Login as Platform Admin**
```bash
# Should see ALL users from ALL companies
curl -X GET http://localhost:3000/api/users \
  -H "Cookie: session=platform_admin_session"
```

**2. Login as Company Admin (Company A)**
```bash
# Should see ONLY Company A users
curl -X GET http://localhost:3000/api/users \
  -H "Cookie: session=company_a_admin_session"
```

**3. Try to access other company's user**
```bash
# Should return 403 Forbidden
curl -X GET http://localhost:3000/api/users/user_from_company_b \
  -H "Cookie: session=company_a_admin_session"
```

### Test User Creation

**1. Company Admin creates user in own company**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Cookie: session=company_admin_session" \
  -d '{
    "email": "newuser@mycompany.com",
    "password": "SecurePass123",
    "firstName": "New",
    "lastName": "User",
    "role": "ecp"
  }'
# ✅ Success - user created in admin's company
```

**2. Company Admin tries to create platform_admin**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Cookie: session=company_admin_session" \
  -d '{
    "email": "hacker@evil.com",
    "role": "platform_admin"
  }'
# ❌ 403 Forbidden - cannot create platform_admin
```

**3. Regular user tries to create user**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Cookie: session=ecp_user_session" \
  -d '{"email": "test@test.com", ...}'
# ❌ 403 Forbidden - insufficient permissions
```

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  role role_enum NOT NULL,  -- ecp, company_admin, platform_admin, etc.
  company_id VARCHAR REFERENCES companies(id),  -- NULL for platform admins
  subscription_plan subscription_plan_enum,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  ...
);
```

### Roles Enum
```sql
CREATE TYPE role AS ENUM (
  'ecp',
  'admin',           -- legacy, mapped to company_admin
  'lab_tech',
  'engineer',
  'supplier',
  'platform_admin',  -- master admin
  'company_admin'    -- company owner/manager
);
```

---

## 🚀 Migration Guide

### For Existing Systems

#### 1. Update Existing Admins
```sql
-- Convert existing admins to company_admin
UPDATE users 
SET role = 'company_admin' 
WHERE role = 'admin' 
  AND company_id IS NOT NULL;

-- Ensure platform admins have no company
UPDATE users 
SET company_id = NULL 
WHERE role = 'platform_admin';
```

#### 2. Update Routes
```typescript
// OLD (insecure)
router.get('/users', isAuthenticated, async (req, res) => {
  const users = await db.select().from(users);
  res.json(users); // ❌ Returns ALL users to everyone!
});

// NEW (secure)
router.get('/users', enforceCompanyIsolation, async (req, res) => {
  const authReq = req as any;
  let query = db.select().from(users);
  
  if (!authReq.isPlatformAdmin) {
    query = query.where(eq(users.companyId, authReq.userCompanyId));
  }
  
  const users = await query;
  res.json(users); // ✅ Returns only authorized users
});
```

#### 3. Update Frontend
```typescript
// Check if current user can create users
const canCreateUsers = user.role === 'platform_admin' || 
                       user.role === 'company_admin';

// Filter available roles based on current user
const availableRoles = await fetch('/api/users/roles/allowed');
```

---

## 🎯 Usage Examples

### Backend Examples

#### Check Permission
```typescript
import { hasPermission } from '../utils/rbac';

if (hasPermission(user.role, 'create_company_user')) {
  // Allow user creation
}
```

#### Validate Company Access
```typescript
import { canAccessCompany } from '../utils/rbac';

if (!canAccessCompany(user.role, user.companyId, targetCompanyId)) {
  return res.status(403).json({ error: 'Access denied' });
}
```

#### Filter Database Query
```typescript
import { getCompanyFilter } from '../middleware/companyIsolation';

const filter = getCompanyFilter(req);
const orders = await db
  .select()
  .from(orders)
  .where(filter.companyId ? eq(orders.companyId, filter.companyId) : undefined);
```

#### Apply Middleware
```typescript
import { 
  enforceCompanyIsolation, 
  requireCompanyOrPlatformAdmin 
} from '../middleware/companyIsolation';

router.post('/sensitive-action',
  enforceCompanyIsolation,
  requireCompanyOrPlatformAdmin,
  async (req, res) => {
    // Only admins can access this
  }
);
```

---

## 🔧 Configuration

### Environment Variables
No additional environment variables required. Uses existing:
- `DATABASE_URL` - PostgreSQL connection
- `SESSION_SECRET` - Session encryption

### Feature Flags
Can be added to enable/disable RBAC features:
```typescript
// .env
ENABLE_COMPANY_ISOLATION=true
ENFORCE_ROLE_PERMISSIONS=true
```

---

## 📈 Benefits

1. **Security**: Company data is isolated by default
2. **Flexibility**: Easy to add new roles and permissions
3. **Scalability**: Works for single company or multi-tenant setups
4. **Auditability**: Clear permission structure for compliance
5. **Maintainability**: Centralized permission logic

---

## 🐛 Troubleshooting

### User can't see their own company's data
```typescript
// Check user has companyId set
SELECT id, email, role, company_id FROM users WHERE email = 'user@example.com';

// Should return company_id populated
```

### Company admin can't create users
```typescript
// Verify role is set correctly
UPDATE users SET role = 'company_admin' WHERE email = 'admin@company.com';

// Check company_id matches
SELECT company_id FROM users WHERE email = 'admin@company.com';
```

### Platform admin seeing filtered data
```typescript
// Ensure role is platform_admin (not admin)
UPDATE users SET role = 'platform_admin' WHERE email = 'master@platform.com';

// Ensure company_id is NULL for platform admins
UPDATE users SET company_id = NULL WHERE role = 'platform_admin';
```

---

## ✅ Summary

**Implemented:**
- ✅ Complete RBAC system with 7 roles
- ✅ Company isolation for all non-platform-admin users
- ✅ Secure user management endpoints
- ✅ Permission checking middleware
- ✅ Role-based user creation restrictions
- ✅ Company access validation

**Result:**
- 🔒 Platform admins can manage everything across all companies
- 🏢 Company admins can manage only their company's users and data
- 👥 Regular users can only view their company's data
- 🚫 No cross-company data leakage
- ✅ Production-ready with comprehensive error handling

The system is now ready for multi-tenant operation with proper role-based access control and company isolation! 🎉
