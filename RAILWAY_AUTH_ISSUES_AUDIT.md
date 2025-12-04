# Railway CLI & Authentication Issues Audit
**Date:** December 4, 2025  
**Status:** CRITICAL ISSUES IDENTIFIED ⚠️

---

## Executive Summary

Found **8 critical** and **6 high-priority** issues in Railway CLI setup and authentication flows that could prevent successful login/signup on Railway deployments.

| Category | Critical | High | Medium | Status |
|----------|----------|------|--------|--------|
| Railway CLI | 2 | 2 | 1 | ⚠️ |
| Login Flow | 3 | 1 | 2 | ⚠️ |
| Signup Flow | 2 | 2 | 1 | ⚠️ |
| JWT Auth | 1 | 1 | 0 | ⚠️ |
| **Total** | **8** | **6** | **4** | **NEEDS FIXES** |

---

## 🔴 CRITICAL ISSUES - Fix Immediately

### C1: In-Memory Account Lockout Won't Work on Railway

**Location:** `server/routes/auth-jwt.ts:34-100`

```typescript
// IN-MEMORY STORAGE - WILL NOT WORK ACROSS RAILWAY INSTANCES
const loginAttempts: Map<string, LoginAttemptTracker> = new Map();
```

**Problem:**
- Railway auto-scales with multiple instances
- Each instance has its own memory
- User could bypass lockout by hitting different instance
- Account lockout counter resets on deployment

**Impact:** Security bypass - brute force attacks not prevented

**Fix:**
```typescript
// Use Redis for distributed lockout tracking
import { redis } from '../redis';

async function recordFailedAttempt(email: string) {
  const key = `lockout:${email}`;
  const attempts = await redis.incr(key);
  await redis.expire(key, ATTEMPT_WINDOW_MS / 1000);
  
  if (attempts >= MAX_FAILED_ATTEMPTS) {
    await redis.setex(`locked:${email}`, LOCKOUT_DURATION_MS / 1000, '1');
    return { locked: true, attemptsLeft: 0 };
  }
  
  return { locked: false, attemptsLeft: MAX_FAILED_ATTEMPTS - attempts };
}
```

**Effort:** 4 hours  
**Priority:** P0 - Deploy blocker

---

### C2: JWT Secret Falls Back to Default in Production

**Location:** `server/services/JWTService.ts:14-24`

```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'change-this-secret-in-production') {
  throw new Error('JWT_SECRET environment variable must be set in production.');
}
```

**Problem:**
- Code throws error but AFTER assignment
- If `JWT_SECRET` env var is missing, server crashes on startup
- Railway deployment might have `NODE_ENV=production` but no `JWT_SECRET`

**Impact:** Server won't start on Railway without manual env var setup

**Railway Setup Missing:**
- `scripts/railway-setup.sh` generates secrets but doesn't set `JWT_SECRET` explicitly
- Only sets `SESSION_SECRET`, `JWT_SECRET`, `CSRF_SECRET` locally
- Variables aren't persisted to Railway dashboard

**Fix:**
Add to `scripts/railway-setup.sh:90-96`:
```bash
railway variables set \
    NODE_ENV=production \
    PORT=5000 \
    SESSION_SECRET="$SESSION_SECRET" \
    JWT_SECRET="$JWT_SECRET" \          # ← EXPLICITLY SET THIS
    CSRF_SECRET="$CSRF_SECRET" \
    JWT_AUTH_ENABLED=true \
```

**Effort:** 30 minutes  
**Priority:** P0 - Deploy blocker

---

### C3: Email Verification Blocks All Local Signups

**Location:** `server/routes/auth-jwt.ts:214-227`

```typescript
// Skip verification for platform admins and Google OAuth users
const isPlatformAdmin = user.role === 'platform_admin';
const isGoogleOAuthUser = !user.passwordHash;

if (!user.isEmailVerified && !isPlatformAdmin && !isGoogleOAuthUser) {
  return res.status(403).json({
    error: 'Please verify your email address before logging in.',
    code: 'EMAIL_NOT_VERIFIED'
  });
}
```

**Problem:**
- ALL new signups via `/api/onboarding/signup` are **auto-activated** (`accountStatus: 'active'`)
- But `isEmailVerified` defaults to `false` in database
- Users can signup successfully but **cannot login** until they verify email
- Email verification flow might not be working on Railway (no `RESEND_API_KEY` or SMTP configured)

**Impact:** Users signup but cannot login - appears as "broken login"

**Fix:**
Option 1: Auto-verify on company creation
```typescript
// server/routes/onboarding.ts:144
const newUser = await storage.upsertUser({
  email: normalizedEmail,
  password: hashedPassword,
  // ...
  accountStatus: 'active',
  isEmailVerified: true, // ← AUTO-VERIFY COMPANY CREATORS
  // ...
});
```

Option 2: Add clear error message directing to verification
```typescript
if (!user.isEmailVerified) {
  return res.status(403).json({
    error: 'Please verify your email address before logging in.',
    code: 'EMAIL_NOT_VERIFIED',
    instructions: 'Check your inbox for a verification email. Resend at /api/auth/verify/resend'
  });
}
```

**Effort:** 1 hour  
**Priority:** P0 - User experience blocker

---

### C4: Password Validation Inconsistency

**Location:** 
- Signup: `server/routes/onboarding.ts:31` (requires 12 chars)
- Login: `server/routes/auth-jwt.ts:105` (requires 1 char)

```typescript
// SIGNUP: Requires 12+ characters
const signupWithCompanySchema = z.object({
  password: z.string().min(12, 'Password must be at least 12 characters'),
  // ...
});

// LOGIN: Only requires 1+ character
const loginSchema = z.object({
  password: z.string().min(1, 'Password is required')
});
```

**Problem:**
- Signup enforces strong passwords (good!)
- Login accepts ANY password (allows brute force attempts)
- Inconsistent UX - confusing error messages

**Impact:** 
- Legitimate users might try short passwords and get locked out
- Attackers can try unlimited 1-character passwords before lockout triggers

**Fix:**
Standardize to 12 characters everywhere:
```typescript
// server/routes/auth-jwt.ts
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(12, 'Password must be at least 12 characters')
});
```

**Effort:** 15 minutes  
**Priority:** P0 - Security issue

---

### C5: Railway Admin Creation Script Has Hardcoded Credentials

**Location:** `railway-create-admin.js:49-87`

```javascript
// HARDCODED PASSWORD HASH - SECURITY RISK
const hashedPassword = '$2b$10$Nntnf2NncPMEZ2qo5opUIuEVFmGFaWRD67ac/GGKdLVkJ0HA5bLCS';

// HARDCODED EMAIL
email: 'care@newvantageco.com',

// PASSWORD PRINTED IN LOGS
console.log('   Password: Eyecloud123');
```

**Problem:**
- Password hash is hardcoded → everyone who deploys has same admin password
- Password is printed in Railway logs (visible to anyone with access)
- If someone gets Railway logs, they have admin credentials
- Hash appears to be for password "Eyecloud123" (weak password)

**Impact:** Critical security vulnerability - hardcoded admin credentials

**Fix:**
```javascript
// Use environment variables for admin creation
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('❌ ERROR: ADMIN_PASSWORD environment variable required');
  process.exit(1);
}

const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

// DON'T PRINT PASSWORD IN LOGS
console.log('✅ Admin user created');
console.log('📧 Email:', ADMIN_EMAIL);
console.log('🔒 Password: <set via environment variable>');
```

**Effort:** 1 hour  
**Priority:** P0 - Critical security issue

---

### C6: Railway Setup Script Doesn't Verify CLI Installation

**Location:** `scripts/railway-setup.sh:29-33`

```bash
if ! command -v railway &> /dev/null; then
    log_error "Railway CLI not found. Install with: npm i -g @railway/cli"
    exit 1
fi
```

**Problem:**
- Script checks if CLI exists but doesn't verify:
  - User is logged in (`railway whoami`)
  - User has project access
  - Project has necessary permissions
  - DATABASE_URL and REDIS_URL will be injected correctly

**Impact:** Script fails mid-execution with cryptic errors

**Fix:**
```bash
# Verify CLI installation
if ! command -v railway &> /dev/null; then
    log_error "Railway CLI not found. Install with: npm i -g @railway/cli"
    exit 1
fi

# Verify login
if ! railway whoami &> /dev/null; then
    log_error "Not logged in. Run: railway login"
    exit 1
fi

# Verify project link
if ! railway status &> /dev/null 2>&1; then
    log_warn "No project linked. Will create or link..."
fi

# Test Railway API access
if ! railway variables &> /dev/null 2>&1; then
    log_error "Cannot access Railway API. Check permissions."
    exit 1
fi
```

**Effort:** 30 minutes  
**Priority:** P0 - Deployment usability

---

### C7: Session vs JWT Mixed Authentication Strategy

**Location:** Multiple files

**Problem:**
1. `/api/onboarding/signup` creates **session-based** auth:
```typescript
// server/routes/onboarding.ts:158-192
req.login({ claims: { sub: newUser.id }, email: newUser.email }, (err) => {
  // Creates Passport session
});
```

2. `/api/auth/jwt/login` creates **JWT** auth:
```typescript
// server/routes/auth-jwt.ts:236-242
const tokens = jwtService.generateTokenPair({ userId, email, role });
res.json({ accessToken, refreshToken, user });
```

3. Frontend might expect JWT but get session cookie (or vice versa)

**Impact:** 
- User signup succeeds but frontend can't find JWT token
- Refreshing page logs user out
- Mobile apps won't work (can't use session cookies)

**Fix:**
Standardize to JWT for all auth endpoints:
```typescript
// server/routes/onboarding.ts - Replace session with JWT
const tokens = jwtService.generateTokenPair({
  userId: newUser.id,
  companyId: newUser.companyId,
  email: newUser.email,
  role: newUser.role,
  permissions: getUserPermissions(newUser.role)
});

res.status(201).json({
  success: true,
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken,
  expiresIn: tokens.expiresIn,
  user: { /* user data */ }
});
```

**Effort:** 2 hours  
**Priority:** P0 - Auth consistency

---

### C8: Token Revocation Uses In-Memory Storage

**Location:** `server/services/JWTService.ts:288-344`

```typescript
// IN-MEMORY STORAGE - LOST ON RESTART
private revokedTokens: Map<string, number> = new Map();
private revokedUsers: Map<string, number> = new Map();
```

**Problem:**
- Revoked tokens stored in memory
- Railway restarts instances regularly
- After restart, revoked tokens become valid again
- User who logged out can access system again
- Password change doesn't invalidate old tokens

**Impact:** 
- Logout doesn't work reliably
- Security risk for compromised tokens
- Password changes don't invalidate sessions

**Fix:**
Use Redis for token revocation:
```typescript
async revokeToken(token: string): Promise<void> {
  const decoded = this.decodeToken(token);
  if (!decoded?.exp) return;
  
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  await redis.setex(`revoked:${this.hashToken(token)}`, ttl, '1');
}

async isTokenRevoked(token: string): Promise<boolean> {
  const tokenHash = this.hashToken(token);
  const revoked = await redis.get(`revoked:${tokenHash}`);
  return revoked === '1';
}
```

**Effort:** 3 hours  
**Priority:** P0 - Security issue

---

## 🟠 HIGH PRIORITY ISSUES

### H1: No Rate Limiting on Signup Endpoints

**Location:** `server/index.ts:210-219`

```typescript
// Rate limiting applied to:
app.use('/api/auth/login', authRateLimiter);         // ✅ Protected
app.use('/api/auth/login-email', authRateLimiter);   // ✅ Protected
app.use('/api/auth/signup', authRateLimiter);        // ✅ Protected
app.use('/api/auth/signup-email', authRateLimiter);  // ✅ Protected
app.use('/api/onboarding', authRateLimiter);         // ✅ Protected

// BUT these endpoints don't exist - actual endpoints are:
// POST /api/onboarding/signup     ← Protected ✅
// POST /api/onboarding/join       ← Protected ✅
```

**Status:** Actually protected - false alarm

---

### H2: Railway Setup Doesn't Create Required Indexes

**Location:** `scripts/railway-setup.sh` - Missing database initialization

**Problem:**
- Script creates PostgreSQL service
- But doesn't run migrations or create indexes
- First deployment will be slow without indexes
- Queries will timeout on production data

**Fix:**
Add to railway-setup.sh:
```bash
echo ""
log_info "=========================================="
log_info "Step 6: Run Database Migrations"
log_info "=========================================="

railway run --service=server npm run db:migrate
log_success "Database migrations applied"
```

**Effort:** 1 hour  
**Priority:** P1 - Performance

---

### H3: Password Reset Flow Not Verified

**Location:** Email templates and reset endpoints exist but not tested

**Problem:**
- Password reset requires email service
- Railway might not have `RESEND_API_KEY` or SMTP configured
- Users who forget password are locked out permanently

**Fix:**
1. Add email service check on Railway:
```bash
railway variables get RESEND_API_KEY
# or
railway variables get EMAIL_HOST
```

2. Add admin password reset endpoint:
```typescript
// Emergency password reset for platform admins
router.post('/admin/reset-user-password',
  authenticateJWT,
  requireRole(['platform_admin']),
  async (req, res) => {
    const { userId, newPassword } = req.body;
    // Hash and update password
    // Log audit event
  }
);
```

**Effort:** 2 hours  
**Priority:** P1 - User recovery

---

### H4: No Health Check for Authentication Service

**Location:** Missing from `/api/health`

**Problem:**
- Railway can't verify if JWT service is working
- If JWT_SECRET is missing, health check still passes
- Deployment appears successful but login fails

**Fix:**
```typescript
// server/routes/health.ts
app.get('/api/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabaseConnection(),
      redis: await checkRedisConnection(),
      jwt: jwtService.getConfig().secretConfigured, // ← Add this
      email: !!process.env.RESEND_API_KEY || !!process.env.EMAIL_HOST,
    }
  };
  
  const allHealthy = Object.values(health.services).every(v => v);
  res.status(allHealthy ? 200 : 503).json(health);
});
```

**Effort:** 1 hour  
**Priority:** P1 - Observability

---

### H5: Railway Domain Not Set in CORS_ORIGIN

**Location:** `scripts/railway-setup.sh:129-133`

```bash
railway variables set \
    CORS_ORIGIN="https://$RAILWAY_DOMAIN" \
    APP_URL="https://$RAILWAY_DOMAIN"
```

**Problem:**
- Script tries to get domain: `RAILWAY_DOMAIN=$(railway domain 2>/dev/null)`
- But domain might not exist yet on first deploy
- CORS will be misconfigured
- Frontend can't make API calls

**Fix:**
```bash
# Try multiple times to get domain
for i in {1..5}; do
  RAILWAY_DOMAIN=$(railway domain 2>/dev/null)
  if [ -n "$RAILWAY_DOMAIN" ]; then
    break
  fi
  log_warn "Domain not ready yet, retrying in 10s... ($i/5)"
  sleep 10
done

if [ -z "$RAILWAY_DOMAIN" ]; then
  log_error "Could not get Railway domain after 5 attempts"
  log_warn "MANUAL ACTION REQUIRED:"
  log_warn "1. Go to Railway dashboard"
  log_warn "2. Generate domain for your service"
  log_warn "3. Run: railway variables set CORS_ORIGIN=https://your-domain.railway.app"
  exit 1
fi
```

**Effort:** 30 minutes  
**Priority:** P1 - CORS errors

---

### H6: Google OAuth Redirect URI Not Configured for Railway

**Location:** `server/routes/google-auth.ts` - Callback URL hardcoded

**Problem:**
- Google OAuth requires exact redirect URI match
- Local dev uses `http://localhost:5000/api/auth/google/callback`
- Railway uses `https://your-app.railway.app/api/auth/google/callback`
- OAuth will fail with "redirect_uri_mismatch"

**Fix:**
```typescript
// server/routes/google-auth.ts
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 
  `${process.env.APP_URL}/api/auth/google/callback`;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: GOOGLE_CALLBACK_URL
}, ...));
```

Add to Railway setup:
```bash
railway variables set GOOGLE_CALLBACK_URL="https://$RAILWAY_DOMAIN/api/auth/google/callback"
```

**Effort:** 1 hour  
**Priority:** P1 - OAuth failure

---

## 🟡 MEDIUM PRIORITY ISSUES

### M1: Railway Logs Will Contain Sensitive Data

**Problem:**
- Login failures log email addresses
- Admin creation logs credentials
- Audit logs might contain PHI

**Fix:**
Use structured logging with redaction:
```typescript
logger.info({
  event: 'login_failed',
  email: maskEmail(email), // admin@example.com → a***n@e*****e.com
  reason: 'invalid_password'
});
```

**Effort:** 3 hours  
**Priority:** P2 - Compliance

---

### M2: No Automated Cleanup of Expired Sessions

**Problem:**
- Sessions stored in database/Redis
- Never cleaned up automatically
- Database grows indefinitely

**Fix:**
Add cron job or worker:
```typescript
// Cleanup expired sessions every hour
cron.schedule('0 * * * *', async () => {
  await db.delete(sessions)
    .where(lt(sessions.expiresAt, new Date()));
});
```

**Effort:** 2 hours  
**Priority:** P2 - Maintenance

---

### M3: Railway Deployment Scripts Don't Test Authentication

**Problem:**
- Setup script deploys but doesn't verify login works
- Could deploy broken auth

**Fix:**
Add smoke test to railway-setup.sh:
```bash
# Test signup and login
curl -X POST "https://$RAILWAY_DOMAIN/api/onboarding/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"TestPassword123!","...}'

if [ $? -eq 0 ]; then
  log_success "Authentication smoke test passed"
else
  log_error "Authentication smoke test FAILED"
fi
```

**Effort:** 2 hours  
**Priority:** P2 - Quality assurance

---

### M4: Missing Documentation for Railway-Specific Setup

**Problem:**
- `RAILWAY_ADMIN_SETUP.md` exists but doesn't mention JWT_SECRET issue
- No troubleshooting guide for common Railway errors

**Fix:**
Create `docs/RAILWAY_AUTH_TROUBLESHOOTING.md` with:
- Common error messages and fixes
- How to verify JWT_SECRET is set
- How to reset admin password
- How to check logs for auth errors

**Effort:** 2 hours  
**Priority:** P2 - Documentation

---

## 📋 Recommended Fix Priority

### Week 1 (Critical - Must Fix Before Railway Deploy)
1. **C5:** Remove hardcoded credentials from railway-create-admin.js
2. **C2:** Fix JWT_SECRET Railway setup
3. **C3:** Fix email verification blocking logins
4. **C7:** Standardize to JWT authentication
5. **C4:** Fix password validation inconsistency

### Week 2 (Security & Reliability)
6. **C1:** Move account lockout to Redis
7. **C8:** Move token revocation to Redis
8. **H4:** Add auth health checks
9. **H5:** Fix CORS domain configuration

### Week 3 (Polish & Recovery)
10. **H3:** Verify password reset works
11. **H6:** Fix Google OAuth redirect
12. **H2:** Add database migrations to setup

---

## 🧪 Testing Checklist Before Railway Deploy

```bash
# 1. Verify JWT_SECRET is set
railway variables | grep JWT_SECRET

# 2. Test signup flow
curl -X POST https://your-app.railway.app/api/onboarding/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!","firstName":"Test","lastName":"User","role":"ecp","companyName":"Test Optical","companyType":"ecp"}'

# 3. Test login flow
curl -X POST https://your-app.railway.app/api/auth/jwt/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'

# 4. Test token refresh
curl -X POST https://your-app.railway.app/api/auth/jwt/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<token-from-login>"}'

# 5. Test protected endpoint
curl -X GET https://your-app.railway.app/api/users/me \
  -H "Authorization: Bearer <access-token>"

# 6. Test logout
curl -X POST https://your-app.railway.app/api/auth/jwt/logout \
  -H "Authorization: Bearer <access-token>"
```

---

## 📊 Impact Summary

| Issue | Severity | Impact | Users Affected | Fix Effort |
|-------|----------|--------|----------------|------------|
| C5: Hardcoded credentials | CRITICAL | Security breach | All deployments | 1 hour |
| C2: JWT_SECRET missing | CRITICAL | Server won't start | All users | 30 min |
| C3: Email verification blocks | CRITICAL | Can't login after signup | 100% new users | 1 hour |
| C7: Mixed auth strategy | CRITICAL | Auth inconsistency | 100% users | 2 hours |
| C1: In-memory lockout | HIGH | Security bypass | Attackers | 4 hours |
| C8: In-memory revocation | HIGH | Logout doesn't work | 100% users | 3 hours |

**Total Estimated Fix Time:** 2-3 days for all critical issues

---

## ✅ Quick Fixes (Do These First)

### Fix #1: Remove Hardcoded Credentials (15 minutes)

```bash
# Delete the insecure script
rm railway-create-admin.js

# Use the environment variable version from RAILWAY_ADMIN_SETUP.md
railway run --service=server bash -c "ADMIN_EMAIL=admin@yourcompany.com ADMIN_PASSWORD='YourSecurePassword123!' npx tsx server/scripts/create-platform-admin.ts"
```

### Fix #2: Set JWT_SECRET on Railway (5 minutes)

```bash
# Generate strong secret
JWT_SECRET=$(openssl rand -hex 32)

# Set on Railway
railway variables set JWT_SECRET="$JWT_SECRET"

# Verify
railway variables | grep JWT_SECRET
```

### Fix #3: Auto-verify Company Creators (5 minutes)

```typescript
// server/routes/onboarding.ts:144
const newUser = await storage.upsertUser({
  // ... existing fields ...
  isEmailVerified: true, // ← Add this line
  // ... rest of fields ...
});
```

---

*Report generated December 4, 2025*
