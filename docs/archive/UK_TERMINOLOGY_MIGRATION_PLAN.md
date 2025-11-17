# UK Clinical Terminology Migration Plan

## Scope Analysis

**Total Impact:** 1,818 matches across 351 files

## Migration Strategy

### Phase 2A: Critical User-Facing (PRIORITY 1) ⚡
*Duration: 3-4 hours*

**Files to Update:**
1. `client/src/pages/EyeTestPage.tsx` (65 matches) - Main examination UI
2. `client/src/data/examTemplates.ts` (42 matches) - Exam templates
3. `client/src/components/eye-exam/AdditionalTestsTab.tsx` (12 matches)
4. `client/src/components/AIDispensingAssistant.tsx` (7 matches)
5. `client/src/pages/OpticalPOSPage.tsx` (7 matches)

**Impact:** Users will see UK-compliant terminology immediately

### Phase 2B: Database Schema (PRIORITY 2) 🗄️
*Duration: 2 hours*

**Files to Update:**
1. `shared/schema.ts` (38 matches) - Column names consideration
2. Database naming strategy decision

**Decision Required:**
- **Option A:** Keep database columns as `od_sphere`, `os_sphere` (internal consistency)
- **Option B:** Rename to `r_sphere`, `l_sphere` (full UK compliance)
- **Recommendation:** Option A + UI label mapping (less disruptive)

### Phase 2C: Backend Services (PRIORITY 3) 🔧
*Duration: 4-5 hours*

**Files to Update:**
1. `server/services/PrescriptionVerificationService.ts` (48 matches)
2. `server/services/NhsVoucherService.ts` (39 matches)
3. `server/services/ClinicalAnomalyDetectionService.ts` (33 matches)
4. `server/services/NhsClaimsService.ts` (29 matches)
5. `server/services/ContactLensService.ts` (20 matches)

**Approach:** Update display labels, keep internal variable names for now

### Phase 2D: Tests (PRIORITY 4) 🧪
*Duration: 3 hours*

**Files to Update:**
1. `test/services/PrescriptionVerificationService.test.ts` (72 matches)
2. `test/integration/healthcare-analytics-api.test.ts` (60 matches)
3. Other test files (200+ matches)

**Approach:** Update test assertions and mock data

## Recommended Approach

### Quick Win Strategy (Today):

**Focus on User-Facing Components Only**
- Update 5 critical frontend files
- Create terminology mapping utility
- Update labels/placeholders in UI
- ~3-4 hours of work

**Benefits:**
- Users see UK terminology immediately
- No database migration required
- Low risk, high visibility
- Can test incrementally

### Full Migration (Future Sprint):

- Backend services update
- Database column renaming (if desired)
- Complete test suite update
- API response format changes

## Implementation Plan

### Step 1: Create Terminology Utility

```typescript
// shared/terminology.ts
export const TERMINOLOGY = {
  UK: {
    RIGHT: 'R',
    LEFT: 'L',
    RIGHT_EYE: 'Right Eye',
    LEFT_EYE: 'Left Eye',
    BOTH_EYES: 'Both Eyes',
  },
  US: {
    RIGHT: 'OD',
    LEFT: 'OS',
    RIGHT_EYE: 'OD (Right Eye)',
    LEFT_EYE: 'OS (Left Eye)',
    BOTH_EYES: 'OU (Both Eyes)',
  },
};

// Use UK by default
export const EYE_TERMINOLOGY = TERMINOLOGY.UK;
```

### Step 2: Update EyeTestPage.tsx

Replace:
- "OD" → "R"
- "OS" → "L"
- "OD Sphere" → "R Sphere"
- "OS Sphere" → "L Sphere"
- All labels, placeholders, headers

### Step 3: Update Exam Templates

Replace terminology in:
- Visual acuity labels
- Refraction labels
- Prescription labels
- Instructions and tooltips

### Step 4: Update AI Components

Update AI Dispensing Assistant to use UK terminology in:
- Recommendations
- Clinical justifications
- Analysis descriptions

### Step 5: Update POS/Order Entry

Ensure prescription display uses UK terminology in:
- Order creation
- Prescription review
- Customer-facing displays

## Testing Checklist

- [ ] Eye examination form displays R/L
- [ ] Prescription templates use R/L
- [ ] AI assistant uses UK terms
- [ ] POS displays UK terms
- [ ] Print/PDF outputs use UK terms
- [ ] NHS forms use correct terminology
- [ ] No mixing of US/UK terms

## Rollout Strategy

### Day 1 (Today):
1. Create terminology utility
2. Update EyeTestPage.tsx
3. Update exam templates
4. Test manually

### Day 2 (Tomorrow):
5. Update AI components
6. Update POS components
7. Run integration tests

### Week 2:
8. Backend service updates
9. Test suite updates
10. Documentation updates

## Risk Assessment

### LOW RISK ✅
- UI label changes
- Display terminology
- New user-facing components

### MEDIUM RISK ⚠️
- Backend service updates (internal logic)
- API response format changes
- Test suite updates

### HIGH RISK ⚠️⚠️
- Database column renaming
- Migration scripts
- Breaking changes to integrations

## Success Criteria

- ✅ All user-facing text uses R/L notation
- ✅ No OD/OS visible to UK optometrists
- ✅ College of Optometrists compliant
- ✅ Consistent terminology across app
- ✅ NHS forms use correct notation
- ✅ Print prescriptions use UK format

## College of Optometrists Requirements

### Prescription Format (BS EN ISO 21987:2017):

```
Right Eye (R):
  Sphere: +1.50
  Cylinder: -0.50
  Axis: 90
  Add: +2.00

Left Eye (L):
  Sphere: +1.25
  Cylinder: -0.75
  Axis: 85
  Add: +2.00

Pupillary Distance: 64mm
```

### GOC Registration Requirements:
- Practitioner GOC number must be displayed
- UK terminology (R/L) must be used
- Date of examination required
- Prescription expiry (2 years standard)

## Next Steps

1. **Decision:** Approve quick win strategy vs full migration
2. **Start:** Create terminology utility
3. **Update:** 5 critical frontend files
4. **Test:** Manual testing of key flows
5. **Deploy:** Incremental rollout

---

**Estimated Time for Quick Win:** 3-4 hours  
**Estimated Time for Full Migration:** 15-20 hours  
**Recommendation:** Start with quick win, schedule full migration for next sprint
