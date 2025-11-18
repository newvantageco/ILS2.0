# Next Actions for ILS 2.0

**Generated:** November 17, 2025
**Based on:** Repository audit, security findings, REMAINING_TODOS.md, and documentation review

---

## 🎯 **Immediate Priorities (Next Session)**

### 1. **Run ESLint and Fix Warnings** 🔴
**Why:** Now that ESLint is configured, identify and fix code quality issues
```bash
npm run lint
```

**Expected Issues:**
- ~250 console.log statements (use structured logger)
- ~878 TypeScript 'any' types (mostly in routes.ts, storage.ts)
- Unused imports/variables
- React best practices violations

**Action:** Create issues for top 10 violations, fix quick wins

---

### 2. **Enable and Update Shopify Integration Tests** 🟡
**Status:** 3 test suites skipped with "needs API refactor" comment
**Files:**
- `test/services/ShopifyService.test.ts`
- `test/services/ShopifyOrderSyncService.test.ts`
- `test/integration/shopify-to-prescription-workflow.test.ts`

**Investigation Needed:**
- ShopifyService.ts exists and appears functional
- Tests may be outdated for current API structure
- Un-skip and update tests OR remove/archive if feature unused

**Action:** Determine if Shopify integration is active, then fix or remove tests

---

### 3. **Enable Disabled Platform AI Features** 🟡
**From:** docs/REMAINING_TODOS.md

**Disabled Features:**
- Platform AI routes (server/routes.ts:72) - schema issues
- Platform AI analytics (server/routes.ts:192)
- Booking pattern analysis (PlatformAIService.ts:230, 237, 258) - missing table

**Action:**
1. Investigate schema issues for Platform AI routes
2. Determine if booking_patterns table needs creation
3. Enable features or document why they're intentionally disabled

---

### 4. **Run TypeScript Compiler Check** 🔴
**Why:** Verify all code compiles cleanly
```bash
npm run check
```

**Expected:**
- Should pass after our type safety improvements
- May reveal issues in unmodified files
- Identifies areas needing type definitions

**Action:** Fix any compilation errors, document complex type issues

---

### 5. **Run Test Suites** 🟡
**From:** docs/TESTING.md

**Current Status (per documentation):**
- Component Tests: 72 passing ✅
- Integration Tests: 4/5 suites passing (96/112 cases)
- E2E Tests: Unknown status

**Run:**
```bash
npm run test:components     # Should pass (72 tests)
npm run test:integration    # Check which suite fails
npm run test:e2e           # Verify E2E infrastructure
```

**Action:** Identify failing tests, create issues for failures

---

## 📊 **High Impact, Medium Effort (This Sprint)**

### 6. **Implement Security Test Cases for xlsx** 🔴
**Why:** Validate security mitigations work correctly

**Test Scenarios:**
- File with `__proto__` sheet name → rejected
- File exceeding 5MB → rejected
- File with 100K+ cells → rejected
- File with malformed magic bytes → rejected
- Valid file processes successfully
- Parse timeout triggers correctly

**Action:** Create `test/security/xlsx-security.test.ts`

---

### 7. **Add Rate Limiting to File Upload Endpoints** 🔴
**Why:** Additional security layer for xlsx endpoints

**Endpoints:**
- POST `/api/import/preview`
- POST `/api/import/start`

**Implementation:**
- Per-user rate limit (e.g., 10 uploads/hour)
- Use express-rate-limit (already installed)
- Document limits in API docs

**Action:** Add rate limiting middleware, test, document

---

### 8. **Consolidate Remaining Large Files** 🟡
**From:** docs/REMAINING_TODOS.md

**Large Files:**
- `server/routes.ts` (5,469 lines) - Route registry
- `server/storage.ts` (1,885 lines) - Data access layer
- 67 React components >400 lines

**Priority:** routes.ts (also has 441 'any' types)

**Action:**
- Create refactoring plan
- Start with extracting 2-3 route modules
- Document patterns for future refactoring

---

## 🔄 **Code Quality Improvements (Ongoing)**

### 9. **Logger Migration (250+ remaining)** 🟡
**From:** docs/guides/LOGGER_MIGRATION_GUIDE.md

**Remaining Locations:**
- Verification scripts (7 files, ~1912 lines)
- Various server files
- Some client utilities

**Priority Order:**
1. Server-side production code
2. Client-side production code
3. Scripts and tools

**Action:** Migrate 20-30 statements per session using guide

---

### 10. **Fix TypeScript 'any' Types** 🟡
**From:** docs/REMAINING_TODOS.md

**High-Impact Files:**
- server/routes.ts - 441 instances ⚠️
- server/storage.ts - 22 instances
- server/services/ProprietaryAIService.ts - 14 instances

**Action:** Fix 10-20 'any' types per file per session

---

## 📚 **Documentation & Maintenance**

### 11. **Update CHANGELOG.md** 📝
**Add entries for:**
- Repository reorganization (102 → 4 root files)
- xlsx security mitigations
- TypeScript type safety improvements
- ESLint configuration
- Hardcoded credential removal

**Action:** Document all recent changes in CHANGELOG

---

### 12. **Create Pull Request** 🚀
**Current Branch:** `claude/repo-improvements-01FGESiHEL4mbR4tTDmqHVra`

**3 Commits:**
1. feat: comprehensive repository improvements and cleanup
2. feat: comprehensive security mitigations for xlsx vulnerabilities
3. refactor: improve TypeScript type safety and code quality

**PR Description Should Include:**
- Summary of 147 files changed
- Security improvements (HIGH → LOW-MEDIUM risk)
- Documentation organization (98% reduction)
- Breaking changes (async Excel parsing)
- Testing instructions

**Action:** Create PR, request review

---

## 🔮 **Future Enhancements (Backlog)**

### 13. **Set Up CI/CD Security Scanning** 🔵
- npm audit in CI pipeline
- Dependabot for dependency updates
- Snyk or similar for vulnerability scanning
- Automated security regression tests

### 14. **Implement Security Metrics Dashboard** 🔵
- Track validation failures
- Monitor parse timeouts
- Alert on attack patterns
- Log aggregation for security events

### 15. **Evaluate xlsx Alternative** 🔵
- Check if exceljs supports XLS format
- Performance comparison
- Migration effort assessment
- Cost-benefit analysis

### 16. **Microservice Isolation for File Processing** 🔵
- Isolate xlsx parsing in separate service
- Sandboxed execution environment
- Resource limits per request
- Reduces blast radius of vulnerabilities

---

## 📈 **Success Metrics**

### Code Quality
- [ ] ESLint passing with 0 warnings
- [ ] TypeScript compilation passing
- [ ] <100 console.log statements remaining
- [ ] <500 'any' types remaining

### Testing
- [ ] All test suites passing
- [ ] Security test coverage >80%
- [ ] Integration test coverage >90%
- [ ] E2E critical paths covered

### Security
- [ ] No HIGH-severity npm vulnerabilities in production deps
- [ ] Rate limiting on all file upload endpoints
- [ ] Security monitoring configured
- [ ] Monthly security audit schedule

### Documentation
- [ ] All features documented
- [ ] API documentation generated
- [ ] Security procedures documented
- [ ] Runbooks for common issues

---

## 🎬 **Suggested Session Plan**

### Session 1 (Current - Completed ✅)
- ✅ ESLint configuration
- ✅ Security hardening (xlsx, credentials)
- ✅ Documentation reorganization
- ✅ TypeScript bypasses removed
- ✅ Type safety improvements

### Session 2 (Next)
1. Run `npm run lint` → identify top issues
2. Run `npm run check` → fix compilation errors
3. Run test suites → identify failing tests
4. Create issues for findings
5. Fix quick wins (5-10 issues)
6. Update CHANGELOG.md
7. Create pull request

### Session 3
1. Review PR feedback
2. Implement security tests for xlsx
3. Add rate limiting to upload endpoints
4. Continue logger migration (20-30 instances)
5. Fix TypeScript any types (10-20 instances)

### Session 4+
1. Enable/fix Shopify integration tests
2. Enable disabled Platform AI features
3. Begin routes.ts refactoring
4. Continue logger migration
5. Continue type safety improvements

---

## 🔗 **Related Documentation**

- [SECURITY_AUDIT_FINDINGS.md](docs/SECURITY_AUDIT_FINDINGS.md) - Security status
- [XLSX_SECURITY_MITIGATIONS.md](docs/XLSX_SECURITY_MITIGATIONS.md) - Security implementation
- [REMAINING_TODOS.md](docs/REMAINING_TODOS.md) - Codebase TODOs
- [LOGGER_MIGRATION_GUIDE.md](docs/guides/LOGGER_MIGRATION_GUIDE.md) - Logger patterns
- [TESTING.md](docs/TESTING.md) - Test infrastructure
- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) - All documentation

---

**Last Updated:** November 17, 2025
**Owner:** Development Team
**Review Frequency:** Weekly
