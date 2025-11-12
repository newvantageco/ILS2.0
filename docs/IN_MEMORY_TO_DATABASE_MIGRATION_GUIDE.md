# In-Memory to Database Migration Guide

**Purpose**: Systematic guide for migrating in-memory services (Map storage) to database-backed persistence.

**Status**: Based on ClaimsManagementService migration analysis (November 2025)

---

## 📊 Current Situation

### Services Requiring Migration

| Service | Lines | Storage | Impact | Priority |
|---------|-------|---------|--------|----------|
| ClaimsManagementService | 1,206 | In-memory Map | Claims data lost on restart | **HIGH** |
| RiskStratificationService | 1,673 | In-memory Map | Risk scores lost on restart | **HIGH** |
| CareCoordinationService | 1,100+ | In-memory Map | Care plans lost on restart | MEDIUM |
| Chronic Disease Mgmt | 1,300+ | In-memory Map | Patient programs lost on restart | MEDIUM |
| Clinical Decision Support | 800+ | Hardcoded data | Mock drug database | LOW |

**Total**: ~8,000 lines of code with no persistence

---

## 🔍 DISCOVERY: Schema Gap Analysis

### Problem Identified

When analyzing ClaimsManagementService for database migration, we discovered:

❌ **Missing Schema Tables**: The service expects generic insurance claims tables (US-style RCM with CPT codes, ICD-10, ERA processing), but the schema only contains `nhsClaims` (UK-specific).

✅ **NHS Claims**: Fully implemented with database persistence (4162-4209 lines in schema.ts)

### Gap Assessment

```
ClaimsManagementService needs:
- insuranceClaims table (generic claims)
- insurancePayers table (payer information)
- claimLineItems table (procedure codes)
- claimBatches table (batch submissions)
- claimAppeals table (appeal tracking)
- electronicRemittanceAdvice table (ERA processing)

Currently available:
- nhsClaims ✅ (UK optical-specific)
- No generic RCM tables ❌
```

**Root Cause**: Service was architected with in-memory prototypes before schema was designed for specific market (UK optical vs US insurance).

---

## 📋 SYSTEMATIC MIGRATION PATTERN

### Step 1: Analyze Current Implementation

**What to check**:
1. Data structures used (Maps, arrays, objects)
2. CRUD operations implemented
3. Business logic vs data access code
4. Dependencies on other services

**Example from ClaimsManagementService**:
```typescript
// Current in-memory storage
private static claims = new Map<string, Claim>();
private static payers = new Map<string, Payer>();
private static batches: ClaimSubmissionBatch[] = [];

// CRUD operations
static async createClaim(claim: Claim): Promise<Claim> {
  this.claims.set(claim.id, claim);
  return claim;
}

static async getClaim(claimId: string): Promise<Claim | undefined> {
  return this.claims.get(claimId);
}
```

### Step 2: Check Existing Schema

**Search for related tables**:
```bash
# Search schema for related tables
grep -n "export const.*Table\|export const [a-z]*Claims" shared/schema.ts | grep -i "claim"

# Check existing patterns
grep "pgTable" shared/schema.ts | head -20
```

**Questions to answer**:
- Do matching database tables exist?
- Are column names compatible?
- Are relationships defined correctly?
- Do enums match the service types?

### Step 3: Create Missing Schema (if needed)

**A. Add enum types first**:
```typescript
// Add to shared/schema.ts near other enums
export const claimStatusEnum = pgEnum("claim_status", [
  "draft",
  "ready_to_submit",
  "submitted",
  "pending",
  "accepted",
  "rejected",
  "partially_paid",
  "paid",
  "denied",
  "appealed",
  "voided"
]);

export const claimTypeEnum = pgEnum("claim_type", [
  "professional",
  "institutional",
  "pharmacy",
  "dental",
  "vision"
]);
```

**B. Create table definitions**:
```typescript
/**
 * Insurance Claims (Generic RCM)
 * For US-style insurance claim processing
 */
export const insuranceClaims = pgTable("insurance_claims", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

  // References
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id", { length: 255 }).references(() => patients.id),
  payerId: varchar("payer_id", { length: 255 }).references(() => insurancePayers.id),

  // Claim Details
  claimNumber: varchar("claim_number", { length: 50 }).notNull().unique(),
  claimType: claimTypeEnum("claim_type").notNull(),
  status: claimStatusEnum("status").notNull().default("draft"),

  // Dates
  serviceDate: date("service_date").notNull(),
  submittedAt: timestamp("submitted_at"),

  // Financial
  totalCharges: decimal("total_charges", { precision: 10, scale: 2 }).notNull(),
  allowedAmount: decimal("allowed_amount", { precision: 10, scale: 2 }),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
  patientResponsibility: decimal("patient_responsibility", { precision: 10, scale: 2 }),

  // Provider Info
  renderingProviderId: varchar("rendering_provider_id", { length: 255 }),
  billingProviderId: varchar("billing_provider_id", { length: 255 }),

  // Response
  payerResponse: jsonb("payer_response"),
  rejectionReason: text("rejection_reason"),

  // Metadata
  metadata: jsonb("metadata"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("insurance_claims_company_idx").on(table.companyId),
  index("insurance_claims_patient_idx").on(table.patientId),
  index("insurance_claims_status_idx").on(table.status),
  index("insurance_claims_service_date_idx").on(table.serviceDate),
]);

/**
 * Insurance Payers
 */
export const insurancePayers = pgTable("insurance_payers", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: varchar("company_id", { length: 255 }).notNull().references(() => companies.id),

  name: varchar("name", { length: 255 }).notNull(),
  payerId: varchar("payer_id", { length: 100 }).notNull(), // Electronic payer ID
  type: varchar("type", { length: 50 }).notNull(), // commercial, medicare, medicaid

  // Contact
  contactInfo: jsonb("contact_info"), // phone, fax, email, address

  // Configuration
  claimSubmissionMethod: varchar("claim_submission_method", { length: 50 }).default("electronic"),
  timelyFilingLimitDays: integer("timely_filing_limit_days").default(365),

  // Status
  active: boolean("active").default(true),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("insurance_payers_company_idx").on(table.companyId),
  uniqueIndex("insurance_payers_company_payer_id").on(table.companyId, table.payerId),
]);
```

**C. Add Zod schemas**:
```typescript
export const insertClaimSchema = createInsertSchema(insuranceClaims);
export const selectClaimSchema = createSelectSchema(insuranceClaims);
export const updateClaimSchema = insertClaimSchema.partial();

export const insertPayerSchema = createInsertSchema(insurancePayers);
export const selectPayerSchema = createSelectSchema(insurancePayers);
```

**D. Run migration**:
```bash
npm run db:push
```

### Step 4: Add Storage Layer Methods

**Add to `server/storage.ts`**:
```typescript
import { insuranceClaims, insurancePayers } from '../shared/schema.js';

class DbStorage {
  // ... existing methods ...

  // ===== Insurance Claims =====

  async createClaim(claim: InsertClaim): Promise<Claim> {
    const [newClaim] = await this.db
      .insert(insuranceClaims)
      .values(claim)
      .returning();
    return newClaim;
  }

  async getClaim(claimId: string): Promise<Claim | undefined> {
    const [claim] = await this.db
      .select()
      .from(insuranceClaims)
      .where(eq(insuranceClaims.id, claimId))
      .limit(1);
    return claim;
  }

  async getClaimsByCompany(companyId: string): Promise<Claim[]> {
    return await this.db
      .select()
      .from(insuranceClaims)
      .where(eq(insuranceClaims.companyId, companyId))
      .orderBy(desc(insuranceClaims.createdAt));
  }

  async updateClaim(claimId: string, updates: Partial<Claim>): Promise<Claim> {
    const [updated] = await this.db
      .update(insuranceClaims)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(insuranceClaims.id, claimId))
      .returning();
    return updated;
  }

  async deleteClaim(claimId: string): Promise<void> {
    await this.db
      .delete(insuranceClaims)
      .where(eq(insuranceClaims.id, claimId));
  }

  // ===== Insurance Payers =====

  async createPayer(payer: InsertPayer): Promise<Payer> {
    const [newPayer] = await this.db
      .insert(insurancePayers)
      .values(payer)
      .returning();
    return newPayer;
  }

  async getPayer(payerId: string): Promise<Payer | undefined> {
    const [payer] = await this.db
      .select()
      .from(insurancePayers)
      .where(eq(insurancePayers.id, payerId))
      .limit(1);
    return payer;
  }

  async getPayersByCompany(companyId: string): Promise<Payer[]> {
    return await this.db
      .select()
      .from(insurancePayers)
      .where(eq(insurancePayers.companyId, companyId))
      .orderBy(insurancePayers.name);
  }
}
```

### Step 5: Refactor Service to Use Storage

**Replace in-memory Maps with storage calls**:

**BEFORE**:
```typescript
export class ClaimsManagementService {
  private static claims = new Map<string, Claim>();

  static async createClaim(claim: Claim): Promise<Claim> {
    this.claims.set(claim.id, claim);
    logger.info('Claim created (in-memory)', { claimId: claim.id });
    return claim;
  }

  static async getClaim(claimId: string): Promise<Claim | undefined> {
    return this.claims.get(claimId);
  }
}
```

**AFTER**:
```typescript
import { storage } from '../../storage.js';

export class ClaimsManagementService {
  // Remove: private static claims = new Map<string, Claim>();

  static async createClaim(companyId: string, claimData: Omit<InsertClaim, 'id' | 'companyId'>): Promise<Claim> {
    const claim = await storage.createClaim({
      ...claimData,
      companyId,
      id: crypto.randomUUID(),
    });

    logger.info('Claim created (database)', { claimId: claim.id, companyId });
    return claim;
  }

  static async getClaim(claimId: string): Promise<Claim | undefined> {
    return await storage.getClaim(claimId);
  }

  static async getClaimsByCompany(companyId: string): Promise<Claim[]> {
    return await storage.getClaimsByCompany(companyId);
  }
}
```

### Step 6: Update Route Handlers

**Update to use new service signatures**:

```typescript
// routes/rcm.ts
app.post('/api/rcm/claims', authenticateUser, asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;

  // Validate input
  const validatedData = insertClaimSchema.parse(req.body);

  // Create via service (now database-backed)
  const claim = await ClaimsManagementService.createClaim(companyId, validatedData);

  res.status(201).json(claim);
}));

app.get('/api/rcm/claims', authenticateUser, asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;

  // Get claims from database
  const claims = await ClaimsManagementService.getClaimsByCompany(companyId);

  res.json(claims);
}));
```

### Step 7: Test Migration

**A. Unit tests**:
```typescript
describe('ClaimsManagementService (Database)', () => {
  it('should create claim in database', async () => {
    const claim = await ClaimsManagementService.createClaim(testCompanyId, {
      claimNumber: 'TEST-001',
      claimType: 'professional',
      serviceDate: new Date(),
      totalCharges: 10000, // $100.00
    });

    expect(claim.id).toBeDefined();
    expect(claim.companyId).toBe(testCompanyId);

    // Verify persistence
    const retrieved = await ClaimsManagementService.getClaim(claim.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.claimNumber).toBe('TEST-001');
  });

  it('should survive server restart', async () => {
    // Create claim
    const claim = await ClaimsManagementService.createClaim(testCompanyId, {
      claimNumber: 'TEST-002',
      claimType: 'vision',
      serviceDate: new Date(),
      totalCharges: 5000,
    });

    // Simulate restart by clearing any caches
    // ...

    // Data should still exist
    const retrieved = await ClaimsManagementService.getClaim(claim.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.claimNumber).toBe('TEST-002');
  });
});
```

**B. Integration tests**:
```bash
npm test  # Should pass with database
```

### Step 8: Update Documentation

**Remove warnings**:
```typescript
/**
 * Claims Management Service
 *
 * ✅ DATABASE-BACKED (Migrated November 2025)
 *
 * Manages insurance claims lifecycle from creation through adjudication,
 * including submission, tracking, and appeals.
 *
 * PERSISTENCE: All data stored in PostgreSQL
 * TENANT ISOLATION: Enforced via companyId
 */
```

**Update HONEST_STATUS.md**:
```markdown
## ✅ PRODUCTION-READY FEATURES

### Revenue Cycle Management (90% Complete) ✅
- ✅ **Claims Management**: Database-backed, full CRUD
- ✅ **Payer Management**: Database-backed
- 🚧 **Batch Processing**: In development
- 🚧 **ERA Processing**: In development
```

---

## 🎯 MIGRATION CHECKLIST

Use this checklist for each service migration:

### Planning Phase
- [ ] Analyze current in-memory implementation
- [ ] Identify all data structures (Maps, arrays, objects)
- [ ] List all CRUD operations
- [ ] Check for existing schema tables
- [ ] Identify schema gaps

### Schema Phase
- [ ] Create missing enum types
- [ ] Create database tables
- [ ] Add Zod validation schemas
- [ ] Add indexes for performance
- [ ] Run `npm run db:push`

### Storage Phase
- [ ] Add CRUD methods to storage layer
- [ ] Add tenant isolation (companyId filtering)
- [ ] Add proper error handling
- [ ] Add TypeScript types

### Service Phase
- [ ] Remove Map/array storage
- [ ] Replace with storage layer calls
- [ ] Update method signatures (add companyId)
- [ ] Add logging
- [ ] Handle errors properly

### Route Phase
- [ ] Update route handlers
- [ ] Add input validation (Zod)
- [ ] Add authentication checks
- [ ] Add tenant isolation checks
- [ ] Update API documentation

### Testing Phase
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Test data persistence
- [ ] Test multi-tenant isolation
- [ ] Test error scenarios

### Documentation Phase
- [ ] Remove "in-memory" warnings
- [ ] Update service documentation
- [ ] Update HONEST_STATUS.md
- [ ] Update API documentation
- [ ] Add migration notes

---

## 📊 ESTIMATED EFFORT

### Per Service

| Phase | Time | Difficulty |
|-------|------|------------|
| Planning & Analysis | 1 hour | Easy |
| Schema Creation | 2-3 hours | Medium |
| Storage Layer | 2-3 hours | Easy |
| Service Refactor | 3-5 hours | Medium |
| Route Updates | 1-2 hours | Easy |
| Testing | 2-4 hours | Medium |
| Documentation | 1 hour | Easy |
| **TOTAL** | **12-19 hours** | **Medium** |

### All Services

| Service | Estimated Time | Priority |
|---------|---------------|----------|
| ClaimsManagementService | 15 hours | HIGH |
| RiskStratificationService | 18 hours | HIGH |
| CareCoordinationService | 14 hours | MEDIUM |
| ChronicDiseaseManagement | 16 hours | MEDIUM |
| ClinicalDecisionSupport | 10 hours (API integration) | LOW |

**Total for all 5 services**: ~73 hours (~2 weeks for 1 developer)

---

## 🚀 QUICK START

To migrate a service right now:

```bash
# 1. Check schema
grep -n "export const.*Table" shared/schema.ts | grep -i "yourService"

# 2. Add missing tables to schema.ts
# (see Step 3 above)

# 3. Push schema
npm run db:push

# 4. Add storage methods to server/storage.ts
# (see Step 4 above)

# 5. Refactor service
# (see Step 5 above)

# 6. Test
npm test

# 7. Commit
git add shared/schema.ts server/storage.ts server/services/yourService.ts
git commit -m "feat: migrate yourService from in-memory to database"
```

---

## 📞 HELP & RESOURCES

- **Database Schema**: `/home/user/ILS2.0/shared/schema.ts`
- **Storage Layer**: `/home/user/ILS2.0/server/storage.ts`
- **Example (NHS Claims)**: Lines 4162-4209 in schema.ts (fully implemented)
- **Drizzle ORM Docs**: https://orm.drizzle.team/docs/overview

---

**Last Updated**: November 2025
**Status**: Template ready for use
**Next Service to Migrate**: ClaimsManagementService (HIGH priority)
