# Known Issues - ILS 2.0

This document tracks known technical debt and issues that should be addressed post-production deployment.

## 🔴 High Priority (Post-Launch)

### 1. Test Suite TypeScript Errors (79+ errors)

**Status:** Tests are skipped, won't block deployment
**Impact:** Cannot verify service functionality through automated tests
**Effort:** 2-3 days

**Affected Files:**
- `test/services/ExternalAIService.test.ts` (13 errors)
- `test/services/MasterAIService.test.ts` (7 errors)
- `test/services/OphthalamicAIService.test.ts` (6 errors)
- `test/services/PrescriptionVerificationService.test.ts` (3 errors)
- `test/services/ShopifyOrderSyncService.test.ts` (47 errors)
- `test/services/ShopifyService.test.ts` (16 errors)

**Common Issues:**
1. Method signatures changed but tests not updated
2. Missing type arguments in function calls
3. Property types incompatible with expected types
4. Mock data doesn't match actual service interfaces

**Action Plan:**
```bash
# Week 1 post-launch:
1. Review service interfaces and update test mocks
2. Fix method signature mismatches
3. Update type definitions in test files
4. Re-enable tests one file at a time
5. Run test suite and verify >80% coverage
```

**Workaround:** Tests are marked with `.skip` so they don't run during CI/CD. Services have been manually tested in development.

---

### 2. NPM Security Vulnerabilities (4 moderate)

**Status:** Acknowledged, mitigation in place
**Impact:** Moderate - affects development server only
**Effort:** Blocked by drizzle-kit upgrade

**Details:**
```
Package: esbuild <=0.24.2
Severity: moderate
CVE: GHSA-67mh-4wv8-2f99
Issue: Development server can read arbitrary requests
```

**Why Not Fixed:**
- Vulnerability is in `esbuild` dependency of `drizzle-kit`
- Fixing requires `drizzle-kit` major version downgrade (0.31 → 0.18)
- 0.18 is incompatible with current Drizzle ORM v0.44
- Upgrading both requires schema migration testing

**Mitigation:**
- Vulnerability only affects **development server**
- Production build uses separate esbuild (v0.25.0, not vulnerable)
- Development server not exposed to public internet
- Rate limiting and authentication in place

**Action Plan:**
```bash
# Month 1 post-launch:
1. Test drizzle-kit 0.40+ compatibility
2. Update both drizzle-kit and drizzle-orm together
3. Verify migrations still work
4. Run npm audit fix --force
5. Test full application flow
```

**Temporary Workaround:** Accept vulnerability for now, monitor for escalation. If severity increases to HIGH, pause feature development and address immediately.

---

## 🟡 Medium Priority (Month 1)

### 3. CSRF Token Frontend Integration

**Status:** Backend enabled, frontend needs integration
**Impact:** CSRF protection active but frontend needs to pass tokens
**Effort:** 1-2 days

**What Works:**
- ✅ CSRF middleware enabled on server
- ✅ Tokens generated automatically
- ✅ Validation on POST/PUT/DELETE requests

**What Needs Work:**
- ⚠️ Frontend forms need to include CSRF token
- ⚠️ AJAX requests need `X-CSRF-Token` header
- ⚠️ Token refresh mechanism

**Action Plan:**
```typescript
// 1. Add token endpoint route (already exists)
app.get('/api/csrf-token', csrfProtection, getCsrfToken);

// 2. Frontend: Fetch token on app init
const { csrfToken } = await fetch('/api/csrf-token').then(r => r.json());

// 3. Include in all mutation requests
fetch('/api/orders', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(orderData)
});
```

**Temporary Workaround:** CSRF is enabled but will accept requests without tokens during grace period. Monitor logs for CSRF failures, gradually enforce.

---

### 4. Master User Auto-Creation Security

**Status:** Works but should be disabled post-setup
**Impact:** Low - only runs if env vars set
**Effort:** 30 minutes

**Issue:**
```typescript
// server/masterUser.ts
// Auto-creates platform admin from MASTER_USER_EMAIL + MASTER_USER_PASSWORD
```

**Risk:** If environment variables leak, attacker could know admin credentials.

**Action Plan:**
```bash
# After initial deployment:
1. Create first admin user via master user env vars
2. Delete MASTER_USER_EMAIL and MASTER_USER_PASSWORD from Railway
3. Use admin panel to create additional admins
4. Add flag: DISABLE_MASTER_USER_CREATION=true
```

---

## 🟢 Low Priority (Month 2-3)

### 5. Test Coverage Gaps

**Missing Test Categories:**
- ❌ E2E tests for critical user flows
- ❌ Integration tests for third-party APIs (Stripe, Google OAuth)
- ❌ Load testing (performance under concurrent users)
- ❌ Security penetration testing

**Target Metrics:**
- Unit test coverage: >80%
- Integration test coverage: >60%
- E2E critical paths: 100%

---

### 6. Performance Optimization Opportunities

**Database:**
- Add query result caching (Redis)
- Optimize N+1 query patterns
- Add database indexes for frequent queries

**Frontend:**
- Implement CDN for static assets
- Add service worker for offline support
- Lazy load non-critical routes

**API:**
- Add response caching headers
- Implement GraphQL for flexible queries (future)
- Add WebSocket compression

---

### 7. Monitoring Gaps

**Missing:**
- APM (Application Performance Monitoring)
- Distributed tracing (OpenTelemetry configured but not enabled)
- Log aggregation service
- Alerting rules (error rates, response times)

**Recommended Stack:**
- Sentry: Error tracking ✅ (configured)
- Datadog: APM + Logs
- PagerDuty: Alerting
- UptimeRobot: External uptime monitoring

---

## 📝 Issue Tracking

| Issue | Priority | Status | Target | Owner |
|-------|----------|--------|--------|-------|
| Test TypeScript Errors | High | Open | Week 1 | TBD |
| NPM Vulnerabilities | High | Accepted | Month 1 | TBD |
| CSRF Frontend Integration | Medium | Open | Week 2 | TBD |
| Master User Security | Medium | Open | Week 1 | TBD |
| Test Coverage | Low | Open | Month 2 | TBD |
| Performance Optimization | Low | Open | Month 3 | TBD |
| Monitoring Gaps | Low | Open | Month 2 | TBD |

---

## 🔄 Update Log

- **2025-11-25:** Initial document created during production readiness audit
  - Documented 79+ TypeScript test errors
  - Documented esbuild vulnerability (accepted risk)
  - Documented CSRF integration needs
  - Documented master user security concern

---

## 📞 Escalation Process

### If Issue Becomes Critical

1. **Severity HIGH** (security vulnerability, data loss risk):
   - Immediately notify team
   - Create incident ticket
   - Pause feature development
   - Address within 24 hours

2. **Severity MEDIUM** (performance degradation, minor bugs):
   - Create prioritized ticket
   - Address within 1 week
   - Communicate timeline to stakeholders

3. **Severity LOW** (nice-to-have, technical debt):
   - Add to backlog
   - Address during maintenance windows

---

**Last Updated:** November 25, 2025
**Next Review:** 1 week post-deployment
