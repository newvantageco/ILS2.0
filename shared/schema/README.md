# Schema Modularization Guide

## Overview

The ILS 2.0 schema contains **214 tables** and **159 enums** in a single 10,000+ line file.
This document outlines the modular schema architecture for better maintainability.

## Current State

- **Main Schema**: `shared/schema.ts` (10,099 lines)
- **Tables**: 214 tables
- **Enums**: 159 enums
- **Status**: Partially modularized

## Target Architecture

```
shared/schema/
├── index.ts              # Unified exports
├── README.md             # This file
├── core/
│   ├── enums.ts          # Shared enums
│   └── types.ts          # Common types
├── ai/
│   └── index.ts          # AI tables (conversations, messages, etc.)
├── clinical/
│   └── index.ts          # Clinical tables (examinations, prescriptions)
├── billing/
│   └── index.ts          # Billing tables (invoices, claims)
├── inventory/
│   └── index.ts          # Inventory tables (products, stock)
├── analytics/
│   └── index.ts          # Analytics tables (events, metrics)
├── nhs/
│   └── index.ts          # NHS integration tables
└── communications/
    └── index.ts          # Email, SMS, notifications
```

## Domain Breakdown

### Core (15 tables)
- sessions
- users
- userRoles
- permissions
- rolePermissions
- userCustomPermissions
- dynamicRoles
- dynamicRolePermissions
- userDynamicRoles
- roleChangeAudit
- auditLogs
- companies
- companySupplierRelationships
- subscriptionPlans
- subscriptionHistory

### AI (15 tables)
- aiConversations
- aiMessages
- aiKnowledgeBase
- aiLearningData
- aiFeedback
- aiModelVersions
- aiModelDeployments
- masterTrainingDatasets
- trainingDataAnalytics
- companyAiSettings
- aiTrainingJobs
- aiDeploymentQueue
- aiNotifications
- aiPurchaseOrders
- aiPurchaseOrderItems

### Clinical (25+ tables)
- eyeExaminations
- prescriptions
- prescriptionTemplates
- clinicalProtocols
- consultLogs
- testRooms
- testRoomBookings
- calibrationRecords
- remoteSessions
- gocComplianceChecks
- patients
- patientActivityLog
- dicomReadings
- limsClinicalAnalytics
- nlpClinicalAnalysis

### Billing (20+ tables)
- invoices
- invoiceLineItems
- posTransactions
- posTransactionItems
- stripePaymentIntents
- insurancePayers
- insuranceClaims
- claimLineItems
- claimBatches
- claimAppeals
- claimERAs

### Inventory (15+ tables)
- products
- productVariants
- inventoryMovements
- lowStockAlerts
- equipment
- purchaseOrders
- poLineItems
- demandForecasts
- seasonalPatterns

### Analytics (20+ tables)
- analyticsEvents
- qualityIssues
- rxFrameLensAnalytics
- prescriptionAlerts
- ecpProductSalesAnalytics
- biRecommendations
- forecastAccuracyMetrics
- platformStatistics
- aggregatedMetrics
- eventLog

### NHS Integration (10+ tables)
- nhsPractitioners
- nhsContractDetails
- nhsClaims
- nhsVouchers
- nhsPatientExemptions
- nhsPayments

### Communications (15+ tables)
- emailTemplates
- emailLogs
- emailTrackingEvents
- notifications
- messageTemplates
- messages
- campaigns
- campaignRecipients

## Migration Strategy

### Phase 1: Create Structure (Complete)
- [x] Create domain folders
- [x] Create core/enums.ts
- [x] Create ai/index.ts example

### Phase 2: Extract Enums
- [ ] Move all enums to core/enums.ts
- [ ] Update imports in main schema.ts

### Phase 3: Extract Domains
- [ ] Extract AI tables to ai/index.ts
- [ ] Extract Clinical tables
- [ ] Extract Billing tables
- [ ] Continue with other domains

### Phase 4: Update Imports
- [ ] Update all server imports
- [ ] Update all client imports
- [ ] Remove duplicates from main schema.ts

### Phase 5: Cleanup
- [ ] Remove migrated code from schema.ts
- [ ] Update drizzle config
- [ ] Test all migrations

## Usage

### Current (Backward Compatible)
```typescript
// Works with both old and new structure
import { users, orders, aiConversations } from '@shared/schema';
```

### New (Domain Import)
```typescript
// Import from specific domain
import { aiConversations, aiMessages } from '@shared/schema/ai';
import { roleEnum, orderStatusEnum } from '@shared/schema/core/enums';
```

## Adding New Tables

1. Identify the appropriate domain
2. Add to the domain's index.ts
3. Export from shared/schema/index.ts
4. Add Zod schemas and types
5. Run `npm run db:generate` if needed

## Best Practices

1. **One domain per file** - Keep related tables together
2. **Export types** - Always export TypeScript types
3. **Zod schemas** - Create insert schemas for validation
4. **Indexes** - Define indexes in table definition
5. **Comments** - Document complex relationships
