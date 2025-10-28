# Initial Setup Guide

## ⚠️ Important First-Time Setup

Before using the AI Assistant and Company Management features, users must be assigned to companies.

### Quick Setup Steps

#### Option 1: SQL Direct Setup (Fastest)

```sql
-- 1. Create a test company
INSERT INTO companies (id, name, type, status, contact_email)
VALUES (
  gen_random_uuid(),
  'Test Optical Lab',
  'dispenser',
  'active',
  'contact@testlab.com'
)
RETURNING id;

-- Copy the returned company ID, then:

-- 2. Assign user to company
UPDATE users 
SET company_id = 'PASTE_COMPANY_ID_HERE'
WHERE email = 'your-email@example.com';

-- 3. Verify setup
SELECT 
  u.email, 
  u.company_id,
  c.name as company_name,
  c.type as company_type
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.email = 'your-email@example.com';
```

#### Option 2: Use the Setup Script

```bash
cd /Users/saban/Downloads/IntegratedLensSystem
npm run setup-companies
```

#### Option 3: Manual via psql

```bash
# Connect to database
psql postgres://neon:npg@localhost:5432/ils_db

# Run the SQL commands from Option 1
```

### Why This Is Needed

The AI Assistant and Company Management features require:
- ✅ User must have `company_id` set
- ✅ Company must exist in `companies` table
- ✅ Multi-tenant data isolation enforced

### Current Error Message

If you see:
```
403 Forbidden: "User must belong to a company"
```

This means the user's `company_id` is NULL. Follow the setup steps above.

### Test Data Script

Create multiple test companies for testing:

```sql
-- Create Dispenser Company
INSERT INTO companies (id, name, type, status, contact_email, contact_phone, address)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Vision Care Dispensers',
  'dispenser',
  'active',
  'contact@visioncare.com',
  '+1234567890',
  '123 Main Street, City, State 12345'
);

-- Create Supplier Company
INSERT INTO companies (id, name, type, status, contact_email, contact_phone, address)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Global Lens Suppliers',
  'supplier',
  'active',
  'sales@globallens.com',
  '+0987654321',
  '456 Supply Blvd, City, State 54321'
);

-- Create Lab Company
INSERT INTO companies (id, name, type, status, contact_email)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Premium Optical Lab',
  'manufacturer',
  'active',
  'lab@premiumoptical.com'
);

-- Assign test users to companies
UPDATE users SET company_id = '11111111-1111-1111-1111-111111111111' WHERE role = 'ecp';
UPDATE users SET company_id = '22222222-2222-2222-2222-222222222222' WHERE role = 'supplier';
UPDATE users SET company_id = '33333333-3333-3333-3333-333333333333' WHERE role IN ('lab_tech', 'engineer');
```

### Verification Checklist

After setup, verify:

```bash
# 1. Check companies exist
psql postgres://neon:npg@localhost:5432/ils_db -c "SELECT id, name, type FROM companies;"

# 2. Check users have company_id
psql postgres://neon:npg@localhost:5432/ils_db -c "SELECT email, company_id FROM users WHERE company_id IS NOT NULL;"

# 3. Test AI Assistant endpoint
curl -b cookies.txt http://localhost:3000/api/ai-assistant/conversations
# Should return [] (empty array) instead of 403

# 4. Test Company endpoint
curl -b cookies.txt http://localhost:3000/api/companies/YOUR_COMPANY_ID
# Should return company details
```

### Quick Test After Setup

1. Log out and log back in (to refresh session)
2. Navigate to "AI Assistant" page
3. Should see:
   - Learning progress card (not 403 error)
   - Empty conversation list
   - Chat interface ready
4. Navigate to "Company" page
5. Should see:
   - Company profile with editable fields
   - No 403 errors

### Production Setup

For production, you would typically:

1. **During User Registration:**
   - Collect company information
   - Create company record
   - Set user's `company_id` automatically

2. **For Existing Users:**
   - Admin creates companies
   - Admin assigns users to companies
   - Or users request company association

3. **Company Creation API:**
   ```http
   POST /api/companies
   {
     "name": "New Company",
     "type": "dispenser",
     "contactEmail": "contact@company.com"
   }
   ```

### Troubleshooting

**Issue**: Still getting 403 after setup
- **Solution**: Log out and log back in to refresh session

**Issue**: Can't find user email
- **Solution**: Check actual user email with:
  ```sql
  SELECT email FROM users;
  ```

**Issue**: Migration didn't add company_id column
- **Solution**: Re-run migration:
  ```bash
  psql postgres://neon:npg@localhost:5432/ils_db -f migrations/add_companies_and_ai_assistant.sql
  ```

**Issue**: BI Dashboard works but AI Assistant doesn't
- **Solution**: BI Dashboard doesn't require company_id yet, but AI Assistant does. Set company_id.

### Environment Setup Complete?

Run this verification:

```bash
# All should return success (not 403)
curl -b cookies.txt http://localhost:3000/api/ai-assistant/stats
curl -b cookies.txt http://localhost:3000/api/companies/relationships/suppliers
curl -b cookies.txt http://localhost:3000/api/ai-intelligence/dashboard
```

### Next Steps After Setup

1. ✅ Users have company_id
2. ✅ Companies created
3. ✅ No 403 errors
4. → Start testing from `TEST_SCENARIOS.md`
5. → Follow `FRONTEND_INTEGRATION_COMPLETE.md` user guide

---

**Quick Setup Command:**

```bash
# One-line setup for current logged-in user
psql postgres://neon:npg@localhost:5432/ils_db << 'EOF'
BEGIN;
INSERT INTO companies (id, name, type, status, contact_email)
VALUES ('99999999-9999-9999-9999-999999999999', 'Test Company', 'dispenser', 'active', 'test@example.com')
ON CONFLICT DO NOTHING;

UPDATE users 
SET company_id = '99999999-9999-9999-9999-999999999999'
WHERE id = (SELECT id FROM users ORDER BY created_at DESC LIMIT 1);
COMMIT;
EOF
```

Then refresh your browser and test!
