# Phase 3 Schema Extraction Analysis
## Table Usage Analysis from schemaLegacy.ts

**Analysis Date:** 2025-12-04
**Total Server Files Analyzed:** 420 TypeScript files
**Methodology:** Searched for table name references across all server code

---

## Executive Summary

Based on usage frequency analysis across the server codebase, the following domains should be prioritized for Phase 3 extraction:

### Top Priority Domains (by total usage count):
1. **Communications Domain** - 91 references (10 tables)
2. **Scheduling Domain** - 40 references (10 tables)
3. **Clinical Domain (remaining)** - 50 references (19 tables)
4. **Inventory Domain (remaining)** - 25 references (4 tables)
5. **Workflow Domain** - 15 references (3 tables)

---

## Top 20 Most-Used Tables (Not Yet Extracted)

| Rank | Table Name | Usage Count | Target Domain | Priority |
|------|-----------|-------------|---------------|----------|
| 1 | notifications | 46 | Communications | CRITICAL |
| 2 | messages | 36 | Communications | CRITICAL |
| 3 | appointments | 32 | Scheduling | CRITICAL |
| 4 | equipment | 21 | Inventory | HIGH |
| 5 | workflows | 15 | Workflow | HIGH |
| 6 | medications | 12 | Clinical | HIGH |
| 7 | campaigns | 9 | Communications | MEDIUM |
| 8 | allergies | 9 | Clinical | MEDIUM |
| 9 | clinicalNotes | 8 | Clinical | MEDIUM |
| 10 | vitalSigns | 7 | Clinical | MEDIUM |
| 11 | labResults | 6 | Clinical | MEDIUM |
| 12 | posTransactions | 5 | POS | MEDIUM |
| 13 | posTransactionItems | 5 | POS | MEDIUM |
| 14 | purchaseOrders | 4 | Inventory | MEDIUM |
| 15 | appointmentReminders | 4 | Scheduling | MEDIUM |
| 16 | providerAvailability | 4 | Scheduling | MEDIUM |
| 17 | shopifyStores | 4 | E-commerce | MEDIUM |
| 18 | qualityMeasures | 4 | Quality | MEDIUM |
| 19 | immunizations | 4 | Clinical | MEDIUM |
| 20 | nonAdapts | 4 | Clinical | MEDIUM |

---

## Detailed Domain Breakdown

### 1. COMMUNICATIONS DOMAIN (Priority: CRITICAL)
**Total References:** 91
**Tables to Extract:** 10
**Recommended Schema File:** `/Users/saban/ILS2.0/shared/schema/communications/index.ts` (already exists)

**Tables:**
- notifications (46 refs) ⚠️ CRITICAL
- messages (36 refs) ⚠️ CRITICAL
- campaigns (9 refs)
- messageTemplates
- smsMessageEvents
- whatsappMessageEvents
- unsubscribes
- campaignRecipients
- audienceSegments
- gdprDeletionRequests

**Note:** emailTemplates, emailLogs, and emailTrackingEvents are already in schema/communications but notifications, messages, and campaigns are NOT.

---

### 2. SCHEDULING DOMAIN (Priority: CRITICAL)
**Total References:** 40+
**Tables to Extract:** 10
**Recommended Schema File:** `/Users/saban/ILS2.0/shared/schema/scheduling/index.ts` (NEW)

**Tables:**
- appointments (32 refs) ⚠️ CRITICAL
- appointmentReminders (4 refs)
- providerAvailability (4 refs)
- appointmentTypes
- appointmentBookings
- appointmentAvailability
- appointmentWaitlist
- appointmentResources
- appointmentRequests
- calendarSettings

**Impact:** Appointments are heavily used across multiple services. This should be a Phase 3a priority.

---

### 3. CLINICAL DOMAIN - Remaining Tables (Priority: HIGH)
**Total References:** 50+
**Tables to Extract:** 19
**Recommended Schema File:** `/Users/saban/ILS2.0/shared/schema/clinical/index.ts` (already exists)

**High-Priority Tables:**
- medications (12 refs)
- allergies (9 refs)
- clinicalNotes (8 refs)
- vitalSigns (7 refs)
- labResults (6 refs)
- immunizations (4 refs)
- nonAdapts (4 refs)

**Additional Tables:**
- labOrders
- labTestCatalog
- labQualityControl
- dicomReadings
- dispenseRecords
- clinicalAlerts
- clinicalGuidelines
- clinicalMetrics
- diagnosticSuggestions
- treatmentRecommendations
- drugs
- drugInteractions

**Note:** prescriptions and eyeExaminations already extracted. These are the remaining clinical tables.

---

### 4. INVENTORY DOMAIN - Remaining Tables (Priority: HIGH)
**Total References:** 25
**Tables to Extract:** 4
**Recommended Schema File:** `/Users/saban/ILS2.0/shared/schema/inventory/index.ts` (already exists)

**Tables:**
- equipment (21 refs) ⚠️ HIGH PRIORITY
- purchaseOrders (4 refs)
- poLineItems (2 refs)
- lowStockAlerts

**Note:** products, productVariants, and inventoryMovements already extracted.

---

### 5. WORKFLOW DOMAIN (Priority: HIGH)
**Total References:** 15
**Tables to Extract:** 3
**Recommended Schema File:** `/Users/saban/ILS2.0/shared/schema/workflow/index.ts` (NEW)

**Tables:**
- workflows (15 refs)
- workflowInstances
- workflowRunCounts

---

### 6. POS (Point of Sale) DOMAIN (Priority: MEDIUM)
**Total References:** 10
**Tables to Extract:** 3
**Recommended Schema File:** `/Users/saban/ILS2.0/shared/schema/pos/index.ts` (NEW)

**Tables:**
- posTransactions (5 refs)
- posTransactionItems (5 refs)
- pdfTemplates (2 refs)

---

### 7. PATIENT PORTAL DOMAIN (Priority: MEDIUM)
**Total References:** 10+
**Tables to Extract:** 10
**Recommended Schema File:** `/Users/saban/ILS2.0/shared/schema/patient-portal/index.ts` (NEW)

**Tables:**
- patientPortalSettings
- portalConversations
- portalMessages
- portalPayments
- patientDocuments
- patientHealthMetrics
- patientPortalAccessLogs
- medicalRecords
- patientOutreach
- patientEngagement

---

### 8. INSURANCE DOMAIN (Priority: MEDIUM)
**Total References:** 12+
**Tables to Extract:** 12
**Recommended Schema File:** `/Users/saban/ILS2.0/shared/schema/insurance/index.ts` (NEW)

**Tables:**
- insuranceCompanies
- insurancePlans
- insurancePayers
- insuranceClaims
- patientInsurance
- eligibilityVerifications
- preauthorizations
- medicalClaims
- claimLineItems
- claimBatches
- claimAppeals
- claimERAs

---

### 9. CONTACT LENS DOMAIN (Priority: LOW)
**Total References:** 6+
**Tables to Extract:** 6
**Recommended Schema File:** `/Users/saban/ILS2.0/shared/schema/contact-lens/index.ts` (NEW)

**Tables:**
- contactLensAssessments
- contactLensFittings
- contactLensPrescriptions
- contactLensAftercare
- contactLensInventory
- contactLensOrders

---

### 10. E-COMMERCE DOMAIN (Priority: MEDIUM)
**Total References:** 4+
**Tables to Extract:** 5
**Recommended Schema File:** `/Users/saban/ILS2.0/shared/schema/ecommerce/index.ts` (NEW)

**Tables:**
- shopifyStores (4 refs)
- shopifyOrders
- shopifyProducts
- shopifyWebhooks
- prescriptionUploads

---

### 11. QUALITY DOMAIN (Priority: LOW)
**Total References:** 4+
**Tables to Extract:** 9
**Recommended Schema File:** `/Users/saban/ILS2.0/shared/schema/quality/index.ts` (NEW)

**Tables:**
- qualityMeasures (4 refs)
- measureCalculations
- starRatings
- qualityGapAnalyses
- qualityDashboards
- qualityImprovementProjects
- bestPractices
- performanceImprovements
- bundleCompliance

---

### 12. CARE MANAGEMENT DOMAIN (Priority: LOW)
**Tables to Extract:** 10
**Recommended Schema File:** `/Users/saban/ILS2.0/shared/schema/care-management/index.ts` (NEW)

**Tables:**
- carePlans (already extracted)
- careTeams
- careGaps
- transitionsOfCare
- careCoordinationTasks
- diseaseRegistries
- registryEnrollments
- diseaseManagementPrograms
- programEnrollments
- outcomeTracking
- preventiveCareRecommendations

---

### Additional Domains (Lower Priority):

**FORECASTING DOMAIN** (3 tables):
- demandForecasts, seasonalPatterns, forecastAccuracyMetrics

**TESTING DOMAIN** (3 tables):
- testRoomBookings, calibrationRecords, remoteSessions

**NETWORK DOMAIN** (7 tables):
- companyRelationships, companyProfiles, connectionRequests, companySupplierRelationships, marketInsights, platformStatistics, aggregatedMetrics

**PREDICTIVE DOMAIN** (11 tables):
- mlModels, riskStratifications, readmissionPredictions, noShowPredictions, diseaseProgressionPredictions, treatmentOutcomePredictions, predictiveModels, predictiveAnalyses, socialDeterminants, riskStratificationCohorts, healthRiskAssessments

**BI ANALYTICS DOMAIN** (7 tables):
- rxFrameLensAnalytics, eciProductSalesAnalytics, biRecommendations, limsClinicalAnalytics, nlpClinicalAnalysis, ecpCatalogData, patientFaceAnalysis

---

## Recommended Phase 3 Extraction Plan

### Phase 3a (Week 1-2): Critical Communications & Scheduling
**Impact:** 131 references
1. Extract Communications tables (notifications, messages, campaigns)
2. Extract Scheduling tables (appointments and related tables)

### Phase 3b (Week 3-4): Clinical & Inventory Completion
**Impact:** 75 references
3. Extract remaining Clinical tables (medications, allergies, labs, etc.)
4. Extract remaining Inventory tables (equipment, purchaseOrders)

### Phase 3c (Week 5-6): Workflow & POS
**Impact:** 25 references
5. Extract Workflow domain
6. Extract POS domain

### Phase 3d (Week 7-8): Patient Portal & Insurance
**Impact:** 22+ tables
7. Extract Patient Portal domain
8. Extract Insurance domain

### Phase 4 (Later): Specialized Domains
- Contact Lens
- E-commerce
- Quality
- Care Management
- Predictive Analytics
- BI Analytics
- Forecasting
- Testing
- Network

---

## Migration Strategy

For each domain extraction:

1. **Create domain schema file** (e.g., `schema/scheduling/index.ts`)
2. **Copy table definitions** from schemaLegacy.ts
3. **Export from schema/index.ts**
4. **Keep schemaLegacy.ts re-export** for backward compatibility
5. **Update imports gradually** in server code (optional, not required)
6. **Verify tests pass** after each domain extraction

The schema.ts shim provides backward compatibility, so no immediate code changes are required.

---

## Success Metrics

- ✅ Phase 1-2 Complete: 24+ tables extracted (core, orders, patients, system)
- 🎯 Phase 3 Target: Extract 60-80 high-usage tables
- 🎯 Phase 4 Target: Extract remaining specialized domain tables
- 🎯 Final Goal: Empty schemaLegacy.ts, delete schema.ts shim

---

**Generated:** 2025-12-04
**Analysis Tool:** Custom Python script analyzing grep results across 420 server TypeScript files
**Data Source:** /Users/saban/ILS2.0/shared/schemaLegacy.ts (434KB, 10,418 lines)
