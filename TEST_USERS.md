# Test Users Documentation

This document describes the test user accounts available for development and testing.

## ⚠️ Security Warning

**NEVER use these accounts in production!** These are test accounts with publicly known passwords.

## Test Accounts

### 1. Company Admin User

**Purpose**: Testing company-level features with admin permissions

- **Email**: `admin@testoptical.com`
- **Password**: `TestAdmin123!`
- **User ID**: `test-user-company-admin`
- **Company ID**: `test-company-001`
- **Company Name**: Test Optical Practice
- **Role**: `admin`
- **Permissions**:
  - Full access to company data
  - Can manage users within the company
  - Can approve/reject requests
  - Cannot access other companies' data
  - Cannot access platform-level features

### 2. Platform Admin User

**Purpose**: Testing platform-level features and cross-tenant administration

- **Email**: `platform@ils.com`
- **Password**: `PlatformAdmin123!`
- **User ID**: `test-user-platform-admin`
- **Company ID**: `platform-admin-company`
- **Company Name**: ILS Platform Administration
- **Role**: `platform_admin`
- **Permissions**:
  - Access to all companies' data
  - Can view/manage any tenant
  - Can approve/reject system-wide requests
  - Can access platform statistics
  - Full administrative privileges

## Usage

### Method 1: Run TypeScript Seed Script (Recommended)

```bash
# Run the seed script
npx tsx server/scripts/seed-test-users.ts
```

This will:
- Create both test companies
- Create both test users with hashed passwords
- Display a summary of created accounts
- Handle conflicts (safe to run multiple times)

### Method 2: Run SQL Seed File

```bash
# Connect to your database and run:
psql $DATABASE_URL -f migrations/seeds/test-users.sql
```

**Note**: SQL method uses pre-generated password hashes. TypeScript method is preferred.

## Using Test IDs in Code

The TypeScript script exports constants for use in tests:

```typescript
import { TEST_USER_IDS, TEST_COMPANY_IDS } from './server/scripts/seed-test-users';

// Use in tests
const companyAdminId = TEST_USER_IDS.COMPANY_ADMIN; // 'test-user-company-admin'
const platformAdminId = TEST_USER_IDS.PLATFORM_ADMIN; // 'test-user-platform-admin'
const testCompanyId = TEST_COMPANY_IDS.TEST_OPTICAL; // 'test-company-001'
```

## Testing Scenarios

### Company-Level Features

Use the **Company Admin** account to test:
- Patient management
- Appointment booking
- Prescription handling
- Order management
- Company settings
- User management within company
- Billing and usage tracking

### Platform-Level Features

Use the **Platform Admin** account to test:
- Cross-tenant data access
- System-wide statistics
- Company management
- Platform configuration
- GDPR deletion requests (approval)
- Audit logging
- Platform monitoring

### Tenant Isolation Testing

1. Log in as Company Admin
2. Try to access another company's data (should fail)
3. Log in as Platform Admin
4. Access the same data (should succeed)

### GDPR Deletion Testing

1. Create deletion request as Company Admin
2. Log in as Platform Admin
3. Approve and process the deletion request
4. Verify data was anonymized/deleted correctly

## Environment Configuration

These test accounts are automatically exempt from subscription checks:

```typescript
isSubscriptionExempt: true
```

This allows testing without Stripe integration in development.

## Resetting Test Data

To reset test users to default state:

```bash
# Re-run the seed script (safe - uses upsert)
npx tsx server/scripts/seed-test-users.ts
```

## Integration with Tests

Example test setup:

```typescript
import { TEST_USER_IDS, TEST_CREDENTIALS } from './server/scripts/seed-test-users';

describe('Company Admin Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    // Ensure test users exist
    await seedTestUsers();

    // Login as company admin
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: TEST_CREDENTIALS.COMPANY_ADMIN.email,
        password: TEST_CREDENTIALS.COMPANY_ADMIN.password
      });

    authToken = response.body.token;
  });

  it('should only access own company data', async () => {
    const response = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    // All patients should belong to test-company-001
  });
});
```

## Troubleshooting

### "User already exists" error

This is expected. The seed script uses `onConflictDoUpdate` to safely update existing records.

### Cannot login with test credentials

1. Verify the seed script ran successfully
2. Check database connection
3. Verify `bcryptjs` is installed: `npm install bcryptjs`
4. Check authentication middleware is working

### Test user has wrong permissions

Re-run the seed script to reset user roles:

```bash
npx tsx server/scripts/seed-test-users.ts
```

## Constants Reference

```typescript
// User IDs
TEST_USER_IDS.COMPANY_ADMIN = 'test-user-company-admin'
TEST_USER_IDS.PLATFORM_ADMIN = 'test-user-platform-admin'

// Company IDs
TEST_COMPANY_IDS.TEST_OPTICAL = 'test-company-001'
TEST_COMPANY_IDS.PLATFORM_ADMIN = 'platform-admin-company'

// Credentials
TEST_CREDENTIALS.COMPANY_ADMIN.email = 'admin@testoptical.com'
TEST_CREDENTIALS.COMPANY_ADMIN.password = 'TestAdmin123!'
TEST_CREDENTIALS.PLATFORM_ADMIN.email = 'platform@ils.com'
TEST_CREDENTIALS.PLATFORM_ADMIN.password = 'PlatformAdmin123!'
```

## Related Documentation

- [Tenant Isolation Guide](./docs/tenant-isolation.md)
- [RBAC Documentation](./docs/rbac.md)
- [Testing Guide](./docs/testing.md)
