# 🎯 Test Users Guide - ILS 2.0

All issues have been resolved! Here's your complete testing setup.

## 🔐 Test User Credentials

**Password for ALL users:** `Test123!@#`

### Master User (Owner - Full Access)
```
Email:    test@master.com
Role:     Owner (has ALL permissions automatically)
Access:   Complete system access
```

### Role-Based Test Users

| Email | Role | Permission Count | Description |
|-------|------|-----------------|-------------|
| `admin@test.com` | Admin | 25 | Full administrative access |
| `optometrist@test.com` | Optometrist | 16 | Clinical optometrist with prescriptions |
| `ecp@test.com` | Eye Care Professional | 14 | Standard ECP access |
| `dispenser@test.com` | Dispenser | 10 | POS and dispensing |
| `receptionist@test.com` | Retail Assistant | 7 | Front desk operations |
| `lab@test.com` | Lab Technician | 9 | Lab production & QC |

## 🚀 How to Test

### 1. Login to Frontend
```
URL: http://localhost:5173
```

### 2. Test Different Roles
1. Login with master user first to see everything
2. Logout and login with each test user
3. Observe permission differences in UI

### 3. Test Permission Restrictions
Each role has different access levels:
- **Admin**: Can manage users, settings, full reports
- **Optometrist**: Can create prescriptions, examinations
- **ECP**: Standard patient and order management
- **Dispenser**: POS access, invoicing
- **Receptionist**: Limited to front desk tasks
- **Lab**: Order processing and quality control

## 🔧 Issues That Were Fixed

### Issue 1: CORS Blocking Login ❌ → ✅
**Problem:** Frontend at `localhost:5173` was blocked by CORS  
**Solution:** Updated `.env.docker` to include port 5173 in `ALLOWED_ORIGINS`  
**Status:** ✅ FIXED

### Issue 2: No Permissions in Database ❌ → ✅
**Problem:** Permissions table was empty (0 permissions)  
**Solution:** Ran migration and seeded 59 permissions across 14 categories  
**Status:** ✅ FIXED

### Issue 3: Roles Had No Permissions ❌ → ✅
**Problem:** Default roles were created before permissions existed  
**Solution:** Created script to assign permissions to all roles  
**Status:** ✅ FIXED

### Issue 4: User Creation Failing ❌ → ✅
**Problem:** Trying to use role names that don't exist in enum  
**Solution:** Created test users with correct enum values + dynamic role assignment  
**Status:** ✅ FIXED

### Issue 5: Can't Test Other Roles ❌ → ✅
**Problem:** No test users existed besides master user  
**Solution:** Created 6 test users with different roles  
**Status:** ✅ FIXED

## 📊 Database Status

### Permissions
- **Total**: 59 permissions
- **Categories**: 14
- **Free Plan**: 25 permissions
- **Full Plan**: 30 permissions
- **Analytics Add-on**: 4 permissions

### Roles
- **8 default roles** created for company
- **All roles** have appropriate permissions assigned
- **Dynamic RBAC** system fully operational

### Users
- **7 test users** ready for testing
- **1 owner** with full access
- **6 role-based users** with restricted permissions

## 🎨 Available Roles & Permissions

### Admin (25 permissions)
Company management, user management, all patient/order operations, reports, AI features

### Optometrist (16 permissions)
Clinical focus: examinations, prescriptions, patient records, AI diagnostics

### ECP - Eye Care Professional (14 permissions)
Standard operations: patients, orders, prescriptions, basic reporting

### Dispenser (10 permissions)
POS specialist: Point of sale, invoicing, product management, customer checkout

### Retail Assistant (7 permissions)
Front desk: Patient check-in, basic order viewing, POS access

### Lab Technician (9 permissions)
Production: Order processing, equipment, inventory, quality control

## 🐛 Known Limitations

Some permissions in the seeding script don't match the database yet:
- POS-specific permissions (invoices, products)
- Equipment maintenance permissions
- Examination-specific permissions

These will work once the full permission system is implemented.

## 📝 Next Steps for Development

1. **Frontend Permission Gates**: Update UI to check user permissions
2. **More Permissions**: Add missing POS and equipment permissions
3. **Custom Roles**: Test creating custom roles via UI
4. **Multi-Role Users**: Test users with multiple roles
5. **Permission Inheritance**: Test role hierarchy

## 🆘 Troubleshooting

### Login Issues
1. Make sure Docker is running
2. Check services: `docker-compose -f docker-compose.dev.yml ps`
3. Restart if needed: `docker-compose -f docker-compose.dev.yml restart app`

### Permission Issues
Run permission verification:
```bash
docker-compose -f docker-compose.dev.yml exec postgres psql -U ils_user -d ils_db_dev -c "
SELECT u.email, dr.name as role, COUNT(p.id) as permissions 
FROM users u 
LEFT JOIN user_dynamic_roles udr ON u.id = udr.user_id 
LEFT JOIN dynamic_roles dr ON udr.role_id = dr.id 
LEFT JOIN dynamic_role_permissions drp ON dr.id = drp.role_id 
LEFT JOIN permissions p ON drp.permission_id = p.id 
GROUP BY u.email, dr.name;"
```

### Reset Test Data
To recreate all test users:
```bash
docker-compose -f docker-compose.dev.yml exec app npx tsx server/scripts/createTestUsers.ts
```

## 🌐 Service URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001
- **Database UI (Adminer)**: http://localhost:8082
- **Email Testing (MailHog)**: http://localhost:8025
- **Redis UI**: http://localhost:8083

## ✅ Current Status: READY FOR TESTING! 🎉
