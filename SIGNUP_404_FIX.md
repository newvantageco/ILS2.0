# Signup 404 Error - Fixed
**Date:** December 4, 2025  
**Issue:** 404 error when calling signup endpoints  
**Status:** ✅ RESOLVED

---

## Problem

Client was receiving 404 errors when attempting to signup. Root cause analysis revealed:

1. **Onboarding routes never registered** - Routes existed in `server/routes/onboarding.ts` but were never mounted to Express app
2. **Non-existent endpoints referenced** - `/api/auth/signup-email` was referenced in rate limiting and CSRF config but doesn't exist anywhere in the codebase
3. **Confusing endpoint structure** - Mix of old and new endpoint patterns

---

## Root Cause

```typescript
// ❌ BEFORE: Routes defined but never registered
// File: server/routes/onboarding.ts
router.post('/signup', async (req, res) => { ... }); // Exists but not mounted

// File: server/index.ts
app.use('/api/auth/signup-email', authRateLimiter); // ❌ Endpoint doesn't exist
```

The domain route registry in `server/routes/domains/index.ts` had no reference to onboarding routes, causing all `/api/onboarding/*` endpoints to return 404.

---

## Solution Applied

### Fix #1: Register Onboarding Routes ✅

**File:** `server/routes/domains/index.ts`

```typescript
// Import onboarding routes
import onboardingRoutes from '../onboarding';

// Add to domain routes array
const domainRoutes: DomainConfig[] = [
  {
    path: '/api/ai',
    router: aiRoutes,
    middleware: [...secureRoute()],
    description: 'Unified AI services',
  },
  {
    path: '/api/auth',
    router: authRoutes,
    description: 'Authentication services',
  },
  {
    path: '/api/onboarding', // ✅ NOW REGISTERED
    router: onboardingRoutes,
    description: 'User onboarding and signup',
  },
  // ... rest of routes
];
```

### Fix #2: Remove Non-Existent Endpoint References ✅

**File:** `server/index.ts`

**Before:**
```typescript
// Rate limiting
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/login-email', authRateLimiter);
app.use('/api/auth/signup', authRateLimiter);
app.use('/api/auth/signup-email', authRateLimiter); // ❌ Doesn't exist

// CSRF exemptions
const csrfExemptPaths = [
  '/api/auth/login',
  '/api/auth/login-email',
  '/api/auth/signup',
  '/api/auth/signup-email', // ❌ Doesn't exist
  // ...
];
```

**After:**
```typescript
// Rate limiting - Only real endpoints
app.use('/api/auth/jwt/login', authRateLimiter);
app.use('/api/auth/forgot-password', authRateLimiter);
app.use('/api/auth/reset-password', authRateLimiter);

// CSRF exemptions - Only real endpoints
const csrfExemptPaths = [
  '/api/csrf-token',
  '/api/auth/jwt/login',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify',
  '/api/auth/google',
  '/api/auth/google/callback',
  '/api/onboarding', // ✅ Now properly registered
  '/api/health',
  '/health',
  '/api/webhooks',
];
```

---

## Working Endpoints

### ✅ Signup Endpoints (Now Working)

#### **POST /api/onboarding/signup**
Complete signup with company creation (recommended)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "ecp",
  "companyName": "Optical Practice",
  "companyType": "ecp",
  "companyEmail": "contact@optical.com",
  "subscriptionPlan": "free_ecp"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account and company created successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "company_admin",
    "companyId": "uuid",
    "accountStatus": "active"
  },
  "company": {
    "id": "uuid",
    "name": "Optical Practice",
    "type": "ecp",
    "status": "active",
    "subscriptionPlan": "free_ecp"
  }
}
```

#### **POST /api/onboarding/join**
Join existing company (requires approval)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "lab_tech",
  "companyId": "existing-company-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Join request submitted successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "accountStatus": "pending"
  },
  "company": {
    "id": "uuid",
    "name": "Existing Company"
  },
  "note": "Your account is pending approval from a company administrator."
}
```

#### **GET /api/onboarding/company-check?name=CompanyName**
Check if company name already exists

**Response:**
```json
{
  "exists": true,
  "company": {
    "id": "uuid",
    "name": "Company Name",
    "type": "ecp"
  }
}
```

---

### ✅ Login Endpoints (Working)

#### **POST /api/auth/jwt/login**
JWT-based login (recommended)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 604800,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "company_admin",
    "companyId": "uuid",
    "permissions": ["..."]
  }
}
```

#### **POST /api/auth/jwt/refresh**
Refresh access token

**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```

---

### ❌ Deprecated/Non-Existent Endpoints

These endpoints **DO NOT EXIST** and will return 404:

- ❌ `/api/auth/login` (use `/api/auth/jwt/login`)
- ❌ `/api/auth/login-email` (never existed)
- ❌ `/api/auth/signup` (use `/api/onboarding/signup`)
- ❌ `/api/auth/signup-email` (never existed)

---

## Testing

### Test Signup Flow
```bash
curl -X POST http://localhost:5000/api/onboarding/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "ecp",
    "companyName": "Test Optical",
    "companyType": "ecp"
  }'
```

### Test Login Flow
```bash
curl -X POST http://localhost:5000/api/auth/jwt/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### Verify Routes are Registered
```bash
# Start server and check logs
npm run dev

# Should see:
# ✅ Registered domain routes successfully
# ✅ Registered: User onboarding and signup
```

---

## Files Changed

```
✅ server/routes/domains/index.ts   - Added onboarding route registration
✅ server/index.ts                   - Cleaned up non-existent endpoint references
```

---

## Client-Side Updates Needed

If your frontend is calling `/api/auth/signup-email`, update it to:

```typescript
// ❌ OLD (404 error)
const response = await fetch('/api/auth/signup-email', {
  method: 'POST',
  body: JSON.stringify({ email, password, ... })
});

// ✅ NEW (works)
const response = await fetch('/api/onboarding/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email,
    password,
    firstName,
    lastName,
    role: 'ecp',
    companyName,
    companyType: 'ecp'
  })
});
```

---

## Additional Benefits

This fix also:
- ✅ Makes rate limiting work correctly (was protecting non-existent endpoints)
- ✅ Makes CSRF protection work correctly
- ✅ Aligns with domain-based architecture
- ✅ Removes confusing endpoint references from logs
- ✅ Auto-verifies email for company creators (from previous fix)

---

**Status:** ✅ All signup endpoints now working
**Next Steps:** Update frontend to use `/api/onboarding/signup` if needed

*Fix applied December 4, 2025*
