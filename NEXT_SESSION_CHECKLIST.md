# Next Session: Start Here
**Status**: Ready to implement actual storage methods
**Current Progress**: Interface declarations complete (77 methods)
**Next Step**: Add implementations to DbStorage class

---

## ✅ What's Complete

1. **Interface Definitions** (77 methods declared in IStorage)
   - CareCoordinationService: 24 methods ✅
   - QualityImprovementService: 4 methods ✅
   - ChronicDiseaseManagementService: 29 methods ✅
   - RiskStratificationService: 20 methods ✅

2. **Documentation**
   - MIGRATION_STATUS_AND_FIX_GUIDE.md ✅
   - SESSION_PROGRESS_REPORT.md ✅
   - IMPLEMENTATION_ROADMAP.md ✅

3. **All Progress Committed & Pushed** ✅

---

## 🚧 What's NOT Complete

**DbStorage Class Missing Implementations**

We declared methods in the interface but didn't implement them in the class:

```typescript
// ✅ DECLARED in IStorage interface (line 551-555)
createRegistryEnrollment(enrollment: InsertRegistryEnrollment): Promise<RegistryEnrollment>;
getRegistryEnrollment(id: string, companyId: string): Promise<RegistryEnrollment | null>;
getRegistryEnrollmentsByPatient(patientId: string, companyId: string): Promise<RegistryEnrollment[]>;
getRegistryEnrollmentsByRegistry(registryId: string, companyId: string): Promise<RegistryEnrollment[]>;
updateRegistryEnrollment(id: string, companyId: string, updates: Partial<RegistryEnrollment>): Promise<RegistryEnrollment | null>;

// ❌ NOT IMPLEMENTED in DbStorage class
// Need to add implementations starting around line 5000+
```

---

## 🎯 Exact Next Steps

### Step 1: Find Where to Add Implementations (2 minutes)

```bash
# Find where chronic disease methods should go
grep -n "async createDiseaseRegistry\|async createCarePlan" server/storage.ts
```

Look for the section where population health implementations are.

### Step 2: Add ChronicDisease Implementations (2-3 hours)

Add these 29 methods to DbStorage class (around line 5000+):

#### Disease Registries (4 methods)
```typescript
async createDiseaseRegistry(registry: InsertDiseaseRegistry): Promise<DiseaseRegistry> {
  const [result] = await db.insert(diseaseRegistries).values(registry).returning();
  return result;
}

async getDiseaseRegistry(id: string, companyId: string): Promise<DiseaseRegistry | null> {
  const [result] = await db.select()
    .from(diseaseRegistries)
    .where(and(
      eq(diseaseRegistries.id, id),
      eq(diseaseRegistries.companyId, companyId)
    ));
  return result || null;
}

async getDiseaseRegistries(companyId: string, filters?: { diseaseType?: string }): Promise<DiseaseRegistry[]> {
  const conditions = [eq(diseaseRegistries.companyId, companyId)];

  if (filters?.diseaseType) {
    conditions.push(eq(diseaseRegistries.diseaseType, filters.diseaseType));
  }

  return await db.select()
    .from(diseaseRegistries)
    .where(and(...conditions));
}

async updateDiseaseRegistry(id: string, companyId: string, updates: Partial<DiseaseRegistry>): Promise<DiseaseRegistry | null> {
  const [result] = await db.update(diseaseRegistries)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(
      eq(diseaseRegistries.id, id),
      eq(diseaseRegistries.companyId, companyId)
    ))
    .returning();
  return result || null;
}
```

#### Registry Enrollments (5 methods)
```typescript
async createRegistryEnrollment(enrollment: InsertRegistryEnrollment): Promise<RegistryEnrollment> {
  const [result] = await db.insert(registryEnrollments).values(enrollment).returning();
  return result;
}

async getRegistryEnrollment(id: string, companyId: string): Promise<RegistryEnrollment | null> {
  const [result] = await db.select()
    .from(registryEnrollments)
    .where(and(
      eq(registryEnrollments.id, id),
      eq(registryEnrollments.companyId, companyId)
    ));
  return result || null;
}

async getRegistryEnrollmentsByPatient(patientId: string, companyId: string): Promise<RegistryEnrollment[]> {
  return await db.select()
    .from(registryEnrollments)
    .where(and(
      eq(registryEnrollments.patientId, patientId),
      eq(registryEnrollments.companyId, companyId)
    ));
}

async getRegistryEnrollmentsByRegistry(registryId: string, companyId: string): Promise<RegistryEnrollment[]> {
  return await db.select()
    .from(registryEnrollments)
    .where(and(
      eq(registryEnrollments.registryId, registryId),
      eq(registryEnrollments.companyId, companyId)
    ));
}

async updateRegistryEnrollment(id: string, companyId: string, updates: Partial<RegistryEnrollment>): Promise<RegistryEnrollment | null> {
  const [result] = await db.update(registryEnrollments)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(
      eq(registryEnrollments.id, id),
      eq(registryEnrollments.companyId, companyId)
    ))
    .returning();
  return result || null;
}
```

#### Disease Management Programs (4 methods)
```typescript
async createDiseaseManagementProgram(program: InsertDiseaseManagementProgram): Promise<DiseaseManagementProgram> {
  const [result] = await db.insert(diseaseManagementPrograms).values(program).returning();
  return result;
}

async getDiseaseManagementProgram(id: string, companyId: string): Promise<DiseaseManagementProgram | null> {
  const [result] = await db.select()
    .from(diseaseManagementPrograms)
    .where(and(
      eq(diseaseManagementPrograms.id, id),
      eq(diseaseManagementPrograms.companyId, companyId)
    ));
  return result || null;
}

async getDiseaseManagementPrograms(companyId: string, filters?: { diseaseType?: string; status?: string }): Promise<DiseaseManagementProgram[]> {
  const conditions = [eq(diseaseManagementPrograms.companyId, companyId)];

  if (filters?.diseaseType) {
    conditions.push(eq(diseaseManagementPrograms.diseaseType, filters.diseaseType));
  }
  if (filters?.status) {
    conditions.push(eq(diseaseManagementPrograms.status, filters.status));
  }

  return await db.select()
    .from(diseaseManagementPrograms)
    .where(and(...conditions));
}

async updateDiseaseManagementProgram(id: string, companyId: string, updates: Partial<DiseaseManagementProgram>): Promise<DiseaseManagementProgram | null> {
  const [result] = await db.update(diseaseManagementPrograms)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(
      eq(diseaseManagementPrograms.id, id),
      eq(diseaseManagementPrograms.companyId, companyId)
    ))
    .returning();
  return result || null;
}
```

#### Program Enrollments (5 methods)
```typescript
async createProgramEnrollment(enrollment: InsertProgramEnrollment): Promise<ProgramEnrollment> {
  const [result] = await db.insert(programEnrollments).values(enrollment).returning();
  return result;
}

async getProgramEnrollment(id: string, companyId: string): Promise<ProgramEnrollment | null> {
  const [result] = await db.select()
    .from(programEnrollments)
    .where(and(
      eq(programEnrollments.id, id),
      eq(programEnrollments.companyId, companyId)
    ));
  return result || null;
}

async getProgramEnrollmentsByPatient(patientId: string, companyId: string): Promise<ProgramEnrollment[]> {
  return await db.select()
    .from(programEnrollments)
    .where(and(
      eq(programEnrollments.patientId, patientId),
      eq(programEnrollments.companyId, companyId)
    ));
}

async getProgramEnrollmentsByProgram(programId: string, companyId: string): Promise<ProgramEnrollment[]> {
  return await db.select()
    .from(programEnrollments)
    .where(and(
      eq(programEnrollments.programId, programId),
      eq(programEnrollments.companyId, companyId)
    ));
}

async updateProgramEnrollment(id: string, companyId: string, updates: Partial<ProgramEnrollment>): Promise<ProgramEnrollment | null> {
  const [result] = await db.update(programEnrollments)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(
      eq(programEnrollments.id, id),
      eq(programEnrollments.companyId, companyId)
    ))
    .returning();
  return result || null;
}
```

#### Clinical Metrics (2 methods)
```typescript
async createClinicalMetric(metric: InsertClinicalMetric): Promise<ClinicalMetric> {
  const [result] = await db.insert(clinicalMetrics).values(metric).returning();
  return result;
}

async getClinicalMetricsByPatient(patientId: string, companyId: string, filters?: { metricType?: string }): Promise<ClinicalMetric[]> {
  const conditions = [
    eq(clinicalMetrics.patientId, patientId),
    eq(clinicalMetrics.companyId, companyId)
  ];

  if (filters?.metricType) {
    conditions.push(eq(clinicalMetrics.metricType, filters.metricType));
  }

  return await db.select()
    .from(clinicalMetrics)
    .where(and(...conditions));
}
```

#### Patient Engagement (2 methods)
```typescript
async createPatientEngagement(engagement: InsertPatientEngagement): Promise<PatientEngagement> {
  const [result] = await db.insert(patientEngagement).values(engagement).returning();
  return result;
}

async getPatientEngagement(id: string, companyId: string): Promise<PatientEngagement | null> {
  const [result] = await db.select()
    .from(patientEngagement)
    .where(and(
      eq(patientEngagement.id, id),
      eq(patientEngagement.companyId, companyId)
    ));
  return result || null;
}
```

#### Outcome Tracking (3 methods)
```typescript
async createOutcomeTracking(outcome: InsertOutcomeTracking): Promise<OutcomeTracking> {
  const [result] = await db.insert(outcomeTracking).values(outcome).returning();
  return result;
}

async getOutcomeTrackingByPatient(patientId: string, companyId: string, filters?: { outcomeType?: string }): Promise<OutcomeTracking[]> {
  const conditions = [
    eq(outcomeTracking.patientId, patientId),
    eq(outcomeTracking.companyId, companyId)
  ];

  if (filters?.outcomeType) {
    conditions.push(eq(outcomeTracking.outcomeType, filters.outcomeType));
  }

  return await db.select()
    .from(outcomeTracking)
    .where(and(...conditions));
}

async updateOutcomeTracking(id: string, companyId: string, updates: Partial<OutcomeTracking>): Promise<OutcomeTracking | null> {
  const [result] = await db.update(outcomeTracking)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(
      eq(outcomeTracking.id, id),
      eq(outcomeTracking.companyId, companyId)
    ))
    .returning();
  return result || null;
}
```

#### Preventive Care (4 methods)
```typescript
async createPreventiveCareRecommendation(recommendation: InsertPreventiveCareRecommendation): Promise<PreventiveCareRecommendation> {
  const [result] = await db.insert(preventiveCareRecommendations).values(recommendation).returning();
  return result;
}

async getPreventiveCareRecommendation(id: string, companyId: string): Promise<PreventiveCareRecommendation | null> {
  const [result] = await db.select()
    .from(preventiveCareRecommendations)
    .where(and(
      eq(preventiveCareRecommendations.id, id),
      eq(preventiveCareRecommendations.companyId, companyId)
    ));
  return result || null;
}

async getPreventiveCareRecommendationsByPatient(patientId: string, companyId: string, filters?: { status?: string }): Promise<PreventiveCareRecommendation[]> {
  const conditions = [
    eq(preventiveCareRecommendations.patientId, patientId),
    eq(preventiveCareRecommendations.companyId, companyId)
  ];

  if (filters?.status) {
    conditions.push(eq(preventiveCareRecommendations.status, filters.status));
  }

  return await db.select()
    .from(preventiveCareRecommendations)
    .where(and(...conditions));
}

async updatePreventiveCareRecommendation(id: string, companyId: string, updates: Partial<PreventiveCareRecommendation>): Promise<PreventiveCareRecommendation | null> {
  const [result] = await db.update(preventiveCareRecommendations)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(
      eq(preventiveCareRecommendations.id, id),
      eq(preventiveCareRecommendations.companyId, companyId)
    ))
    .returning();
  return result || null;
}
```

### Step 3: Verify Compilation (5 minutes)

```bash
npx tsc --noEmit --skipLibCheck --project tsconfig.json 2>&1 | grep "ChronicDiseaseManagementService" | wc -l
```

Should go from ~31 errors to ~0 errors.

### Step 4: Repeat for Other Services (8-10 hours total)

Use the same pattern for:
- CareCoordinationService (24 methods)
- QualityImprovementService (4 methods + PDSA & bundles)
- RiskStratificationService (20 methods)

---

## 📊 Time Estimates

**ChronicDiseaseManagementService** (29 implementations):
- Copy-paste template: 30 minutes
- Adjust field names: 30 minutes
- Test compilation: 10 minutes
- Fix any errors: 30 minutes
- **Total**: 2 hours

**All 4 Services** (77 implementations):
- ChronicDiseaseManagementService: 2 hours
- CareCoordinationService: 2.5 hours
- RiskStratificationService: 2 hours
- QualityImprovementService: 1.5 hours (+ PDSA/bundles)
- **Total**: 8 hours

---

## ✅ Success Criteria

After adding all 77 implementations:

1. TypeScript compilation successful (or <100 errors)
2. ChronicDiseaseManagementService: 0 "Property does not exist" errors
3. CareCoordinationService: 0 "Property does not exist" errors
4. RiskStratificationService: 0 "Property does not exist" errors
5. QualityImprovementService: 0 "Property does not exist" errors

---

## 🚨 Common Pitfalls

1. **Wrong return type**: Interface says `null`, implementation returns `undefined`
   - **Fix**: Use `|| null` consistently

2. **Missing table imports**: Forgot to import `diseaseRegistries` table
   - **Fix**: Check imports at top of storage.ts

3. **Wrong field names**: Schema has `diseaseCode` but using `diseaseType`
   - **Fix**: Check schema definition

4. **Missing AND conditions**: Forgot `and(...)` wrapper
   - **Fix**: Always wrap multiple conditions

5. **Forgot updatedAt**: Update queries don't set updatedAt
   - **Fix**: Always `{ ...updates, updatedAt: new Date() }`

---

## 🎯 Quick Start Command

```bash
# 1. Open storage.ts
code server/storage.ts

# 2. Find where to add (search for "async createCarePlan")
# 3. Copy template from this file
# 4. Paste and modify for each method
# 5. Test: npx tsc --noEmit --skipLibCheck
```

---

**Status**: Ready to execute
**Next Session**: Add 77 method implementations to DbStorage class
**Estimated Time**: 8 hours
**Expected Outcome**: ~300-400 fewer TypeScript errors

---

Last Updated: November 13, 2025
Created By: Claude (Session 1)
