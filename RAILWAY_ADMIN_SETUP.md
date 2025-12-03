# Railway Platform Admin Setup Guide

This guide shows you how to create a platform admin user on your Railway production environment.

## Prerequisites

1. Railway CLI installed: `npm install -g @railway/cli`
2. Railway account with access to your ILS2.0 project
3. Strong password ready (min 8 characters, use a password manager!)

## Option 1: Using Railway CLI (Recommended)

### Step 1: Login to Railway

```bash
railway login
```

### Step 2: Link to Your Project

```bash
railway link
# Select your ILS2.0 project
```

### Step 3: Run the Admin Creation Script

```bash
# Set your admin credentials
railway run --service=server bash -c "ADMIN_EMAIL=your-email@company.com ADMIN_PASSWORD='YourSecurePassword123!' npx tsx server/scripts/create-platform-admin.ts"
```

**Important**: Replace:
- `your-email@company.com` with your actual email
- `YourSecurePassword123!` with a strong, unique password

**Optional**: Add first and last name:
```bash
railway run --service=server bash -c "ADMIN_EMAIL=your-email@company.com ADMIN_PASSWORD='YourSecurePassword123!' ADMIN_FIRST_NAME=John ADMIN_LAST_NAME=Doe npx tsx server/scripts/create-platform-admin.ts"
```

### Step 4: Verify Creation

The script will output:
```
✅ Platform Admin Created

📋 Details:
   Email: your-email@company.com
   Name: John Doe
   User ID: [generated-uuid]
   Role: platform_admin
   Company: ILS Platform Administration
```

---

## Option 2: Using Railway Dashboard + SQL

If Railway CLI doesn't work, use the database directly:

### Step 1: Access Railway Database

1. Go to Railway Dashboard: https://railway.app
2. Select your ILS2.0 project
3. Click on your PostgreSQL database
4. Click "Query" tab or get connection string

### Step 2: Generate Password Hash

On your local machine:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourSecurePassword123!', 10, (err, hash) => console.log(hash));"
```

Copy the output hash (starts with `$2a$10$...`)

### Step 3: Run SQL Commands

Replace placeholders with your values:

```sql
-- 1. Create platform admin company
INSERT INTO companies (
  id,
  name,
  type,
  status,
  email,
  subscription_plan,
  is_subscription_exempt,
  created_at,
  updated_at
) VALUES (
  'platform-admin-company',
  'ILS Platform Administration',
  'hybrid',
  'active',
  'your-email@company.com',  -- YOUR EMAIL HERE
  'enterprise',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- 2. Create platform admin user
INSERT INTO users (
  id,
  company_id,
  account_status,
  email,
  password,
  first_name,
  last_name,
  role,
  subscription_plan,
  is_active,
  is_verified,
  last_login_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'platform-admin-company',
  'active',
  'your-email@company.com',  -- YOUR EMAIL HERE
  '$2a$10$PASTE_YOUR_BCRYPT_HASH_HERE',  -- PASTE HASH FROM STEP 2
  'Platform',  -- YOUR FIRST NAME
  'Admin',     -- YOUR LAST NAME
  'platform_admin',
  'enterprise',
  true,
  true,
  NOW(),
  NOW(),
  NOW()
);

-- 3. Verify creation
SELECT
  id,
  email,
  first_name,
  last_name,
  role,
  company_id,
  is_active
FROM users
WHERE email = 'your-email@company.com';
```

---

## Option 3: Update Existing User to Platform Admin

If you already have a user account and want to promote it:

### Using Railway CLI:
```bash
railway run --service=server bash -c "psql \$DATABASE_URL -c \"UPDATE users SET role = 'platform_admin', account_status = 'active', is_active = true, is_verified = true WHERE email = 'your-email@company.com';\""
```

### Using SQL in Railway Dashboard:
```sql
UPDATE users
SET
  role = 'platform_admin',
  account_status = 'active',
  is_active = true,
  is_verified = true,
  updated_at = NOW()
WHERE email = 'your-email@company.com';
```

---

## Verification & Testing

### 1. Test Login

Try logging in at your app URL:
```
https://your-app.railway.app/login
```

Use:
- Email: your-email@company.com
- Password: YourSecurePassword123!

### 2. Verify Platform Admin Access

After login, you should have access to:
- All companies' data
- Platform statistics dashboard
- System-wide settings
- GDPR deletion approvals
- Cross-tenant features

### 3. Check Role in Database

```sql
SELECT
  email,
  role,
  account_status,
  is_active,
  company_id
FROM users
WHERE email = 'your-email@company.com';
```

Should show:
- `role`: `platform_admin`
- `account_status`: `active`
- `is_active`: `true`

---

## Troubleshooting

### "Command not found: tsx"

Railway might not have tsx installed. Use this instead:
```bash
railway run --service=server node --loader tsx server/scripts/create-platform-admin.ts
```

Or build first:
```bash
railway run --service=server bash -c "npm run build && node dist/server/scripts/create-platform-admin.js"
```

### "Permission denied"

Make sure you're linked to the correct Railway project:
```bash
railway status
railway link  # Re-link if needed
```

### "User already exists"

The script will automatically update the existing user to platform_admin role. Just run it again.

### "Cannot connect to database"

Verify DATABASE_URL is set in Railway:
```bash
railway variables
```

---

## Security Best Practices

### ✅ DO:
- Use a strong, unique password (20+ characters)
- Store password in a password manager
- Use your real work email
- Enable 2FA on Railway account
- Regularly rotate passwords

### ❌ DON'T:
- Use test credentials (admin@testoptical.com) in production
- Share admin credentials
- Use simple passwords
- Commit passwords to git
- Leave admin accounts unused

---

## Post-Setup

### 1. Document Admin User

Add to your internal docs:
- Admin email
- Creation date
- Purpose
- Who has access

### 2. Set Up Monitoring

Monitor admin actions:
```sql
SELECT * FROM audit_logs
WHERE user_id = (SELECT id FROM users WHERE role = 'platform_admin')
ORDER BY created_at DESC
LIMIT 100;
```

### 3. Create Additional Admins (if needed)

Run the script again with different email:
```bash
railway run --service=server bash -c "ADMIN_EMAIL=second-admin@company.com ADMIN_PASSWORD='AnotherSecurePassword!' npx tsx server/scripts/create-platform-admin.ts"
```

---

## Need Help?

1. Check Railway logs: `railway logs`
2. Check database connection: `railway run --service=server printenv DATABASE_URL`
3. Contact Railway support: https://railway.app/help

---

## Quick Reference

```bash
# Create platform admin (one command)
railway run --service=server bash -c "ADMIN_EMAIL=admin@company.com ADMIN_PASSWORD='SecurePass123!' npx tsx server/scripts/create-platform-admin.ts"

# Check if admin exists
railway run --service=server bash -c "psql \$DATABASE_URL -c \"SELECT email, role FROM users WHERE role = 'platform_admin';\""

# Update existing user to admin
railway run --service=server bash -c "psql \$DATABASE_URL -c \"UPDATE users SET role = 'platform_admin' WHERE email = 'your@email.com';\""
```
