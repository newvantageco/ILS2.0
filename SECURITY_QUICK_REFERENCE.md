# Security Quick Reference - ILS 2.0
**Assessment Date:** November 28, 2025  
**Overall Security Score:** B+ (83/100)

---

## 🚨 Critical Actions Required (P0 - Within 1 Week)

### 1. Enable Database Encryption at Rest ❌
**Risk:** HIPAA violation, PHI exposure  
**Effort:** 16 hours  
**Implementation:**
```sql
-- Install pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive columns
ALTER TABLE patients ALTER COLUMN nhs_number 
  TYPE bytea USING pgp_sym_encrypt(nhs_number::text, :encryption_key);
```

### 2. Implement Secrets Manager ❌
**Risk:** Hardcoded credentials exposure  
**Effort:** 24 hours  
**Implementation:**
```bash
# Use AWS Secrets Manager
aws secretsmanager create-secret \
  --name ils-api/jwt-secret \
  --secret-string "$(openssl rand -hex 32)"
```

### 3. Enforce MFA for Admin Accounts ❌
**Risk:** Privilege escalation, unauthorized access  
**Effort:** 8 hours  
**File:** `server/middleware/auth-jwt.ts`
```typescript
export const requireMFA = async (req, res, next) => {
  if (['admin', 'platform_admin'].includes(req.user.role)) {
    const mfaVerified = await checkMFAVerification(req.sessionID);
    if (!mfaVerified) {
      return res.status(403).json({ error: 'MFA required' });
    }
  }
  next();
};
```

### 4. Fix Auth Rate Limiter (Currently 50, Should Be 5) ⚠️
**Risk:** Brute force attacks  
**Effort:** 5 minutes  
**File:** `server/middleware/rateLimiter.ts` Line 58
```typescript
// BEFORE (VULNERABLE):
max: 50,  // ❌ Too permissive

// AFTER (SECURE):
max: 5,   // ✅ Brute force protection
```

---

## 📊 Security Scorecard

| Category | Score | Status |
|----------|-------|--------|
| **Authentication & Authorization** | 90/100 | ✅ Strong |
| **Secrets Management** | 40/100 | ❌ Critical Gap |
| **Encryption (Transit)** | 95/100 | ✅ TLS 1.3 |
| **Encryption (At Rest)** | 30/100 | ❌ Not Implemented |
| **Input Validation** | 95/100 | ✅ Zod + Drizzle ORM |
| **CSRF Protection** | 100/100 | ✅ Double-submit + auto-retry |
| **Rate Limiting** | 95/100 | ✅ Multi-tier |
| **Security Headers** | 90/100 | ✅ Helmet.js + CSP |
| **Logging & Monitoring** | 70/100 | ⚠️ No SIEM integration |
| **CI/CD Security** | 75/100 | ⚠️ Missing DAST |
| **Dependency Management** | 85/100 | ✅ npm audit + CodeQL |

---

## ✅ What's Working Well

### 1. CSRF Protection (100/100)
- **Implementation:** Double-submit cookie pattern via `csrf-csrf`
- **Feature:** Auto-retry on token expiration
- **Coverage:** All state-changing endpoints protected
- **File:** `server/middleware/csrfProtection.ts`

### 2. Rate Limiting (95/100)
- **Global:** 100 req/15min per IP
- **Auth:** 5 attempts/15min per IP (⚠️ currently 50 - needs fix)
- **AI:** 20 req/hour per IP
- **Redis-backed:** Distributed rate limiting support
- **File:** `server/middleware/rateLimiter.ts`

### 3. Security Headers (90/100)
```
✅ Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
✅ X-Frame-Options: DENY
✅ X-Content-Type-Options: nosniff
✅ Content-Security-Policy: restrictive directives
⚠️  script-src: uses 'unsafe-inline' (needs nonce-based CSP)
```

### 4. SQL Injection Protection (95/100)
- **ORM:** Drizzle with parameterized queries
- **Evidence:** 891 uses of `eq()`, `and()`, `or()` - all safe
- **No raw SQL:** No string concatenation found
- **File:** `server/storage.ts`

### 5. Structured Logging with PII Redaction (85/100)
```typescript
// @server/utils/logger.ts
redact: {
  paths: [
    'req.headers.authorization',
    'req.headers.cookie',
    'password',
    'token',
    'secret',
    'apiKey',
  ],
  remove: true,
}
```

---

## ❌ Critical Security Gaps

### 1. No Data-at-Rest Encryption
**Impact:** HIPAA violation, regulatory non-compliance  
**Risk Level:** CRITICAL  
**Affected Data:**
- NHS numbers
- Patient DOB
- Medical records
- Prescription data

**Remediation:**
```sql
-- PostgreSQL TDE
CREATE EXTENSION pgcrypto;

-- Encrypt existing data
UPDATE patients 
SET nhs_number_encrypted = pgp_sym_encrypt(nhs_number, :key);
```

---

### 2. Secrets in Environment Variables
**Impact:** Credential leakage if env vars exposed  
**Risk Level:** CRITICAL  
**Current State:**
```env
JWT_SECRET=
SESSION_SECRET=
STRIPE_SECRET_KEY=
AWS_SECRET_ACCESS_KEY=
OPENAI_API_KEY=
```

**Remediation:**
- Migrate to AWS Secrets Manager
- Implement automatic rotation (90-day cycle)
- Remove `MASTER_USER_*` env vars post-deployment

---

### 3. No MFA for Privileged Accounts
**Impact:** Account takeover of admin users  
**Risk Level:** HIGH  
**Current State:** Optional MFA (not enforced)

**Remediation:**
- Mandatory MFA for `platform_admin`, `admin`
- TOTP-based (Google Authenticator)
- Backup codes for recovery

---

### 4. No DAST in CI Pipeline
**Impact:** Vulnerabilities only found in production  
**Risk Level:** MEDIUM  
**Current Testing:**
- ✅ SAST (CodeQL)
- ✅ Dependency scan (npm audit)
- ✅ Secret scan (TruffleHog)
- ❌ DAST (missing)

**Remediation:**
```yaml
# Add to .github/workflows/security.yml
- name: OWASP ZAP Scan
  uses: zaproxy/action-full-scan@v0.4.0
  with:
    target: 'https://staging.yourdomain.com'
```

---

## 🔐 Compliance Status

### HIPAA
- [x] Access controls (RBAC/ABAC)
- [x] Audit logging (8-year retention)
- [ ] **Encryption at rest** ❌
- [x] Encryption in transit (TLS 1.3)
- [x] Data backup and recovery
- [ ] Business Associate Agreements (BAAs)
- [ ] Annual risk assessment

**Status:** 60% compliant (encryption at rest blocking)

---

### GDPR
- [x] Lawful basis for processing
- [x] Right to erasure
- [x] Right to portability
- [x] Data retention policies
- [x] Privacy by design
- [ ] Data Protection Impact Assessment (DPIA)
- [ ] Data Processing Agreements (DPAs)

**Status:** 70% compliant

---

### NHS Digital API
- [x] NHS API authentication (RS512 JWT)
- [x] Audit logging for PDS/ERS access
- [x] Data minimization
- [ ] DSPT (Data Security and Protection Toolkit) submission
- [ ] Clinical safety assessment (DCB0129/DCB0160)

**Status:** 60% compliant

---

## 🛠️ Quick Fixes (< 1 Hour Each)

### 1. Fix Auth Rate Limiter (5 minutes)
```diff
// server/middleware/rateLimiter.ts:58
-  max: 50,
+  max: 5,
```

### 2. Remove CSP unsafe-eval (30 minutes)
```diff
// server/middleware/security.ts:50
-  scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
+  scriptSrc: ["'self'", "'nonce-{RANDOM}'"],
```

### 3. Add Permissions-Policy Header (10 minutes)
```typescript
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=(), payment=(self)'
  );
  next();
});
```

### 4. Enable Dependabot (15 minutes)
```yaml
# Create .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
```

---

## 📋 Testing Checklist

### Before Production Deployment:
- [ ] All P0 issues resolved
- [ ] Third-party penetration test completed
- [ ] DPIA (Data Protection Impact Assessment) completed
- [ ] BAAs signed with all third-party vendors
- [ ] Incident response plan tested
- [ ] Database encryption verified
- [ ] Secrets migrated to secrets manager
- [ ] MFA enabled for all admin accounts
- [ ] Security headers validated (securityheaders.com)
- [ ] OWASP ZAP scan passed (no HIGH/CRITICAL)

---

## 🚀 Deployment Security Checklist

### Pre-Deployment:
```bash
# 1. Run security scans
npm audit
npm run test:all

# 2. Scan Docker image
trivy image --severity HIGH,CRITICAL ils-api:latest

# 3. Validate environment variables
npm run validate:env

# 4. Check secrets rotation
aws secretsmanager list-secrets --query 'SecretList[?LastRotatedDate<`2024-08-01`]'

# 5. Verify HTTPS enforcement
curl -I http://yourdomain.com | grep -i strict-transport-security
```

### Post-Deployment:
```bash
# 1. Verify health endpoint
curl https://yourdomain.com/api/health

# 2. Test CSRF protection
curl -X POST https://yourdomain.com/api/orders \
  -H "Content-Type: application/json" \
  -d '{}' \
  # Should return 403 CSRF error

# 3. Test rate limiting
for i in {1..6}; do 
  curl -X POST https://yourdomain.com/api/auth/login \
    -d '{"email":"test@example.com","password":"wrong"}'; 
done
# 6th request should return 429 Too Many Requests

# 4. Verify security headers
curl -I https://yourdomain.com | grep -E "(X-Frame|X-Content|Strict-Transport)"
```

---

## 📞 Security Contacts

### Incident Response:
- **Email:** security@yourdomain.com
- **Phone:** TBD (24/7 hotline)
- **PagerDuty:** TBD

### Reporting Vulnerabilities:
- **Bug Bounty:** bugbounty@yourdomain.com
- **PGP Key:** https://yourdomain.com/pgp-key.txt
- **Response SLA:** < 24 hours

---

## 📚 Key Documentation

### Internal:
- [Full Security Assessment](./SECURITY_BASELINE_ASSESSMENT.md)
- [Incident Response Playbook](./docs/INCIDENT_RESPONSE.md)
- [Threat Model](./docs/THREAT_MODEL.md)

### External Standards:
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [GDPR Requirements](https://gdpr.eu/checklist/)
- [NHS DSPT](https://www.dsptoolkit.nhs.uk/)

---

## 🎯 Success Metrics

### Target KPIs:
- **Mean Time to Detect (MTTD):** < 15 minutes
- **Mean Time to Respond (MTTR):** < 4 hours for P0
- **Vulnerability Resolution:** < 7 days for CRITICAL
- **Security Test Coverage:** > 80%
- **Dependency Update Lag:** < 14 days

### Current Status:
- MTTD: **TBD** (implement monitoring)
- MTTR: **TBD** (implement alerting)
- Test Coverage: **TBD** (run `npm run test:coverage`)

---

**Next Security Review:** February 28, 2026 (Quarterly)  
**Version:** 1.0  
**Last Updated:** November 28, 2025
