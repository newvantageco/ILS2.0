# Schema Migration Plan - Phase 1, Task 2

**Status:** In Progress (31% Complete)
**Started:** December 1, 2025
**Last Updated:** December 4, 2025
**Owner:** Development Team
**Priority:** HIGH (Foundation Tables Missing)

---

## Executive Summary

The ILS 2.0 database schema is transitioning from a monolithic 10,439-line `schema.ts` file to a modular domain-based architecture. The modular structure exists but is incomplete - **only 31% of tables have been migrated**, and critically, **the 4 foundation tables** (users, companies, orders, patients) were never extracted.

**Current State:**
- ✅ Monolithic schema.ts: 220 tables (10,439 lines)
- ✅ Modular schemas: 69 tables across 7 domains
- ❌ **Foundation tables still in monolith: users, companies, orders, patients**
- ❌ 151 tables remaining to extract
- ⚠️ Migration stalled due to missing foundation tables

---

## Problem Statement

### The Blocker

The `/shared/schema/index.ts` file contains:
```typescript
// Line 61 - THE PROBLEM:
export * from '../schema';  // Re-exports entire monolith!
```

This causes:
1. Modular schemas are **ignored** (monolith "wins" in export priority)
2. All 63 imports still use monolithic schema.ts
3. Migration appears complete but isn't actually active
4. Foundation tables never migrated to core domain

### Foundation Tables Status

**CRITICAL - Most-Used Tables Missing from Modular Schema:**

| Table | Imports | Status | Domain | Priority |
|-------|---------|--------|---------|----------|
| `users` | 13x | ❌ In monolith | core | CRITICAL |
| `companies` | 7x | ❌ In monolith | core | CRITICAL |
| `orders` | 9x | ❌ In monolith | orders | CRITICAL |
| `patients` | 9x | ❌ In monolith | patients | CRITICAL |
| `products` | 2x | ✅ Modular | inventory | Complete |
| `eyeExaminations` | 3x | ✅ Modular | clinical | Complete |
| `invoices` | 1x | ✅ Modular | billing | Complete |
| `prescriptions` | 1x | ✅ Modular | clinical | Complete |

---

## Migration Strategy

### Approach: Hybrid (Compiler-Driven)

**Rationale:** Balance speed with safety by migrating only actively-used tables and letting the compiler identify what's truly needed.

**Steps:**

#### Phase 1: Foundation Tables (CRITICAL - 2 hours)
1. Create `/shared/schema/core/tables.ts`
2. Extract core tables:
   - `users` + related (userRoles, sessions, userPreferences)
   - `companies` + related (companySettings, changeHistory)
3. Create `/shared/schema/orders/index.ts`
4. Extract orders tables:
   - `orders` + related (orderTimeline, orderEvents)
5. Create `/shared/schema/patients/index.ts`
6. Extract patients tables:
   - `patients` + related (patientNotes, patientDocuments)
7. Update `/shared/schema/core/index.ts` to export tables
8. **Test compilation** - fix any missing dependencies

#### Phase 2: High-Usage Tables (1 hour)
9. Analyze remaining high-usage tables (10+ imports)
10. Extract to appropriate domains:
    - System domain: permissions, roles, dynamicRoles
    - Orders domain: dispenseRecords, labWorkTickets
    - Clinical domain: referrals, clinicalRules
11. **Test compilation** after each domain

#### Phase 3: Remaining Used Tables (2 hours)
12. Use TypeScript compiler to identify remaining imports
13. Extract tables on-demand as compiler reports errors
14. Group related tables by domain
15. **Test compilation** continuously

#### Phase 4: Cleanup & Finalization (30 mins)
16. Identify unused tables (never imported)
17. Document unused tables in `UNUSED_TABLES.md`
18. Remove `export * from '../schema'` from schema/index.ts
19. **Final compilation test** - should pass with 0 errors
20. Archive schema.ts → schema.ts.OLD
21. Git commit with detailed message

---

## Domain Structure

### Existing Domains (69 tables extracted)

```
/shared/schema/
├── core/
│   ├── enums.ts (✅ Complete - 165 enums)
│   └── index.ts (❌ Missing - 0 tables)
├── ai/ (✅ 8 tables)
│   └── aiConversations, aiMessages, aiKnowledgeBase, etc.
├── clinical/ (✅ 12 tables)
│   └── eyeExaminations, prescriptions, testRooms, etc.
├── billing/ (✅ 9 tables)
│   └── invoices, invoiceLineItems, subscriptionPlans, etc.
├── inventory/ (✅ 15 tables)
│   └── products, stockMovements, suppliers, etc.
├── analytics/ (✅ 18 tables)
│   └── auditLogs, usageEvents, saasMetrics, etc.
├── nhs/ (✅ 6 tables)
│   └── nhsClaims, nhsPractitioners, nhsVouchers, etc.
└── communications/ (✅ 1 table)
    └── emailTemplates
```

### Domains to Create

```
/shared/schema/
├── core/
│   └── tables.ts (NEW - users, companies, sessions, etc.)
├── orders/ (NEW - 10+ tables)
│   └── orders, orderTimeline, orderEvents, dispenseRecords, etc.
├── patients/ (NEW - 8+ tables)
│   └── patients, patientNotes, patientDocuments, etc.
├── system/ (NEW - 8+ tables)
│   └── permissions, roles, dynamicRoles, etc.
└── equipment/ (NEW - 5+ tables)
    └── equipment, equipmentMaintenance, calibrationRecords, etc.
```

---

## Table Dependencies Map

### Critical Dependency Chains

```
companies (root)
  └─> users
      ├─> sessions
      ├─> userRoles → roles
      ├─> userPreferences
      └─> orders
          ├─> orderTimeline
          ├─> orderEvents
          └─> dispenseRecords
              └─> patients
                  ├─> patientNotes
                  ├─> patientDocuments
                  └─> eyeExaminations
                      └─> prescriptions
```

**Migration Order MUST respect this hierarchy:**
1. companies (no dependencies)
2. users (depends on companies)
3. sessions, userRoles (depend on users)
4. orders (depends on users, companies)
5. patients (depends on companies)
6. Clinical tables (depend on patients)

---

## Risk Assessment

### HIGH RISK
- **Foundation table extraction** - Complex interdependencies
- **Type definition changes** - May break imports across codebase
- **Foreign key relationships** - Must maintain referential integrity
- **Multi-tenant isolation** - RLS policies reference these tables

### MEDIUM RISK
- **Compilation errors** - Expected during migration (use as guide)
- **Import path updates** - Some files may need refactoring
- **Test coverage** - Limited tests to catch regressions

### LOW RISK
- **Runtime behavior** - Table definitions don't affect logic
- **Database schema** - No actual DB changes, only TS definitions
- **Rollback** - Easy to revert to schema.ts.OLD if needed

---

## Testing Strategy

### Continuous Validation

After EACH phase:
```bash
# 1. TypeScript compilation
npm run check

# 2. Build test
npm run build

# 3. Server startup test
npm run dev:node
# Watch for: "Domain routes registered successfully"
# Kill with Ctrl+C after startup confirmation

# 4. Specific endpoint test
curl http://localhost:5000/health
```

### Pre-Commit Validation

Before final commit:
```bash
# Full test suite (when available)
npm test

# Lint check
npm run lint

# Build verification
npm run build

# Server full startup
npm run dev:node
# Test critical endpoints:
# - /api/auth/user
# - /api/orders (requires auth)
# - /api/patients (requires auth)
```

---

## Rollback Plan

If migration fails:
```bash
# 1. Restore monolithic schema
git restore shared/schema.ts

# 2. Revert schema/index.ts changes
git restore shared/schema/index.ts

# 3. Remove extracted files (if any)
rm -rf shared/schema/core/tables.ts
rm -rf shared/schema/orders/
rm -rf shared/schema/patients/

# 4. Test compilation
npm run check

# 5. Document why it failed in this file
```

---

## Success Criteria

✅ Migration complete when:
1. All 220 tables categorized (used vs unused)
2. All used tables extracted to appropriate domains
3. `export * from '../schema'` removed from schema/index.ts
4. TypeScript compilation passes (0 errors)
5. Server starts successfully
6. All existing imports work (backward compatible)
7. schema.ts archived as schema.ts.OLD
8. Git commit created with detailed message

---

## Estimated Timeline

| Phase | Tasks | Time | Complexity |
|-------|-------|------|------------|
| Phase 1 | Foundation tables | 2h | HIGH |
| Phase 2 | High-usage tables | 1h | MEDIUM |
| Phase 3 | Remaining tables | 2h | MEDIUM |
| Phase 4 | Cleanup & commit | 30m | LOW |
| **TOTAL** | **Full migration** | **5.5h** | **HIGH** |

**Recommended:** Split across 2 sessions (3h + 2.5h)

---

## Next Session Checklist

Before starting:
- [ ] Read this document fully
- [ ] Review `/shared/schema.ts` structure (lines 1-100)
- [ ] Check `/shared/schema/core/` current state
- [ ] Verify dev environment works (npm run dev:node)
- [ ] Create feature branch: `git checkout -b schema-migration-foundation`

During session:
- [ ] Start with Phase 1, Step 1
- [ ] Test compilation after EACH table extraction
- [ ] Commit after each phase completes
- [ ] Take breaks every hour

---

## Related Documentation

- [Codebase Audit Report](./CODEBASE_AUDIT_REPORT.md) - Full system analysis
- [Refactoring Plan](./REFACTORING_PLAN_2025-12-01.md) - Overall refactoring strategy
- [Routes Migration Success](../server/routes.ts.OLD) - Previous successful migration

---

## Questions & Answers

**Q: Why not migrate all 220 tables?**
A: Analysis shows ~30-40% of tables may be unused legacy code. Compiler-driven approach migrates only what's actively used, naturally cleaning up dead code.

**Q: Can we use the old schema.ts during migration?**
A: Yes! The `export * from '../schema'` line provides backward compatibility. We can migrate incrementally without breaking existing code.

**Q: What if we find circular dependencies?**
A: Extract shared types/enums to `/shared/schema/core/types.ts` first, then import into domain modules. Similar to how we fixed ApiError.ts circular dependency.

**Q: How do we handle `import * as schema`?**
A: These will continue working as schema/index.ts re-exports everything. No changes needed to those files.

---

**Status:** Ready for Phase 1 execution
**Next Action:** Create `/shared/schema/core/tables.ts` and extract foundation tables
**Blocked By:** None - ready to proceed
**Last Verified:** December 4, 2025
