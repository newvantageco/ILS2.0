# Master Test User Script

This script creates a test user with **full owner privileges** for testing all frontend features.

## Quick Start

### Default User (Recommended)
```bash
npm run create-master-user
```

This creates:
- **Email**: `test@master.com`
- **Password**: `Test123!@#`
- **Company**: `Master Test Company`
- **Permissions**: ALL (Owner privileges)

### Custom User
```bash
npx tsx server/scripts/createMasterTestUser.ts --email admin@test.com --password MyPass123
```

### All Options
```bash
npx tsx server/scripts/createMasterTestUser.ts \
  --email custom@email.com \
  --password YourPassword123 \
  --first-name John \
  --last-name Doe \
  --company "My Test Company"
```

## What This Creates

1. **Test Company** (if doesn't exist)
   - Status: Active
   - Subscription: Enterprise (full access)
   - Has both ECP and Lab access enabled

2. **Master Test User**
   - Status: Active & Verified
   - Owner privileges (`is_owner = true`)
   - All permissions automatically granted
   - Can prescribe and dispense
   - GOC registered (test data)

3. **Default Roles** for the company
   - Admin
   - Manager  
   - Optometrist
   - Dispensing Optician
   - Receptionist
   - And more...

## Why Owner = Full Access?

The permission system works like this:

```typescript
if (user.is_owner) {
  // Gets ALL permissions automatically
  return allPermissions;
}
```

This means the master test user can:
- ✅ Access all frontend routes
- ✅ View all data
- ✅ Create, edit, delete anything
- ✅ Manage users and roles
- ✅ Access admin features
- ✅ Test all permissions
- ✅ Access enterprise features

## Testing Different Roles

While the master user has owner privileges, you can also:

1. Create additional test users with specific roles
2. Assign those users to different dynamic roles
3. Test permission restrictions

For role-specific testing, you'll need to create users via the frontend or database.

## Security Notes

⚠️ **This is for TESTING ONLY**
- Do NOT run this in production
- The default password is weak intentionally (for testing)
- Delete test users before deploying to production

## Troubleshooting

### User Already Exists
```
⚠️ User already exists with email: test@master.com
```
**Solution**: Use a different email or delete the existing user first.

### Cannot Find Module Error
```
Error: Cannot find module 'bcryptjs'
```
**Solution**: Run `npm install` first.

### Database Connection Error
```
Error: connect ECONNREFUSED
```
**Solution**: Make sure your database is running and DATABASE_URL is set correctly.

## Next Steps

After creating the master user:

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the login page

3. Login with:
   - Email: `test@master.com`
   - Password: `Test123!@#`

4. You should have access to ALL features! 🎉

## Related Files

- Script: `/server/scripts/createMasterTestUser.ts`
- Permission Service: `/server/services/DynamicPermissionService.ts`
- Role Service: `/server/services/DefaultRolesService.ts`
- Schema: `/shared/schema.ts`
