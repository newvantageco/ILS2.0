# Database Schema Documentation - ILS 2.0

Complete reference for the ILS 2.0 PostgreSQL database schema.

## Table of Contents

- [Overview](#overview)
- [Database Architecture](#database-architecture)
- [Entity Categories](#entity-categories)
- [Core Tables](#core-tables)
- [Multi-Tenancy](#multi-tenancy)
- [Relationships](#relationships)
- [Indexes and Performance](#indexes-and-performance)
- [Best Practices](#best-practices)
- [Schema Migrations](#schema-migrations)
- [Appendix: All Tables](#appendix-all-tables)

---

## Overview

ILS 2.0 uses PostgreSQL 15+ with Drizzle ORM for type-safe database access. The schema supports a multi-tenant SaaS architecture for the UK optical industry.

### Key Statistics

- **Total Tables:** 110+
- **Database:** PostgreSQL 15+
- **ORM:** Drizzle ORM
- **Schema Location:** `shared/schema.ts`
- **Migrations:** `drizzle/migrations/`

### Database Features

- ✅ **Multi-tenancy** - Complete data isolation per company
- ✅ **ACID compliance** - Full transactional support
- ✅ **Row-level security** - Via companyId filtering
- ✅ **Audit trails** - Change tracking and history
- ✅ **Optimized indexes** - Performance-tuned queries
- ✅ **Foreign key constraints** - Data integrity
- ✅ **JSON fields** - Flexible metadata storage
- ✅ **Enums** - Type-safe status fields

---

## Database Architecture

### High-Level Schema Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      MULTI-TENANT CORE                      │
│  ┌────────────┐    ┌─────────────┐    ┌──────────────┐     │
│  │ companies  │───▶│    users    │───▶│ userRoles    │     │
│  └────────────┘    └─────────────┘    └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├──────────────────────────┐
                              │                          │
               ┌──────────────▼───────┐    ┌─────────────▼────────┐
               │   CLINICAL DOMAIN    │    │   BUSINESS DOMAIN    │
               │                      │    │                      │
               │  • patients          │    │  • orders            │
               │  • prescriptions     │    │  • invoices          │
               │  • eyeExaminations   │    │  • posTransactions   │
               │  • contactLens*      │    │  • products          │
               │  • testRooms         │    │  • inventory*        │
               └──────────────────────┘    └──────────────────────┘
                              │
               ┌──────────────▼───────────────────────┐
               │         SUPPORT DOMAINS              │
               ├───────────────┬──────────────────────┤
               │ AI/ML         │  NHS Compliance      │
               │ • ai*         │  • nhs*              │
               │               │                      │
               ├───────────────┼──────────────────────┤
               │ Shopify       │  Quality Control     │
               │ • shopify*    │  • quality*          │
               │               │  • returns           │
               ├───────────────┼──────────────────────┤
               │ Analytics     │  Equipment           │
               │ • analytics*  │  • equipment         │
               │ • bi*         │  • dicomReadings     │
               └───────────────┴──────────────────────┘
```

---

## Entity Categories

The database is organized into 12 main categories:

### 1. Core Multi-Tenant (5 tables)
- **companies** - Organizations/practices
- **users** - User accounts
- **userRoles** - User role assignments
- **permissions** - System permissions
- **sessions** - Authentication sessions

### 2. Clinical Management (17 tables)
- **patients** - Patient records
- **prescriptions** - Optical prescriptions
- **eyeExaminations** - Eye examination records
- **consultLogs** - Consultation records
- **testRooms** - Examination rooms
- **testRoomBookings** - Room scheduling
- **contactLens*** - Contact lens management (6 tables)
- **prescriptionTemplates** - Templates
- **clinicalProtocols** - Clinical workflows
- **remoteSessions** - Remote consultations
- **gocComplianceChecks** - GOC compliance
- **prescriptionAlerts** - Alert system

### 3. Order Management (8 tables)
- **orders** - Lens/product orders
- **orderTimeline** - Order status history
- **dispenseRecords** - Dispense audit trail
- **returns** - Product returns
- **qualityIssues** - Quality control
- **nonAdapts** - Non-adaptation cases
- **purchaseOrders** - PO management
- **poLineItems** - PO line items

### 4. Point of Sale (6 tables)
- **posTransactions** - POS sales
- **posTransactionItems** - Transaction line items
- **invoices** - Invoices
- **invoiceLineItems** - Invoice line items
- **products** - Product catalog
- **productVariants** - Product variations

### 5. Inventory Management (4 tables)
- **contactLensInventory** - Contact lens stock
- **inventoryMovements** - Stock movements
- **lowStockAlerts** - Stock alerts
- **demandForecasts** - ML-based forecasting

### 6. AI/ML System (24 tables)
- **aiConversations** - AI chat sessions
- **aiMessages** - Chat messages
- **aiKnowledgeBase** - Knowledge repository
- **aiLearningData** - Learning dataset
- **aiFeedback** - User feedback
- **aiModelVersions** - Model versions
- **aiModelDeployments** - Deployment tracking
- **masterTrainingDatasets** - Training data
- **trainingDataAnalytics** - Training metrics
- **companyAiSettings** - AI configuration
- **aiTrainingJobs** - Training jobs
- **aiDeploymentQueue** - Deployment queue
- **ai*** - Additional AI tables (12 more)

### 7. NHS Integration (7 tables)
- **nhsPractitioners** - GOC registered practitioners
- **nhsContractDetails** - NHS contracts
- **nhsClaims** - NHS claims
- **nhsVouchers** - NHS voucher system
- **nhsPatientExemptions** - Patient exemptions
- **nhsPayments** - NHS payment tracking

### 8. Shopify Integration (5 tables)
- **shopifyStores** - Connected stores
- **shopifyOrders** - Synced orders
- **shopifyProducts** - Product sync
- **shopifyWebhooks** - Webhook subscriptions
- **prescriptionUploads** - Prescription uploads

### 9. Analytics & BI (12 tables)
- **analyticsEvents** - Event tracking
- **rxFrameLensAnalytics** - Rx analytics
- **eciProductSalesAnalytics** - Sales analytics
- **biRecommendations** - BI insights
- **limsClinicalAnalytics** - LIMS analytics
- **nlpClinicalAnalysis** - NLP analysis
- **ecpCatalogData** - Catalog analytics
- **forecastAccuracyMetrics** - Forecast metrics
- **seasonalPatterns** - Seasonal trends
- **aggregatedMetrics** - Aggregated data
- **platformStatistics** - Platform stats
- **marketInsights** - Market analysis

### 10. Equipment & DICOM (4 tables)
- **equipment** - Medical equipment
- **calibrationRecords** - Calibration tracking
- **dicomReadings** - DICOM imaging data
- **technicalDocuments** - Equipment docs

### 11. Communication (8 tables)
- **emailTemplates** - Email templates
- **emailLogs** - Email tracking
- **emailTrackingEvents** - Email events
- **notifications** - System notifications
- **aiNotifications** - AI-generated alerts
- **webhookSubscriptions** - Webhook config
- **webhookDeliveries** - Webhook logs
- **eventLog** - System event log

### 12. Supporting Tables (10 tables)
- **rolePermissions** - Role-permission mapping
- **userCustomPermissions** - Custom permissions
- **auditLogs** - Audit trail
- **organizationSettings** - Organization config
- **userPreferences** - User preferences
- **pdfTemplates** - PDF templates
- **companyRelationships** - Company connections
- **connectionRequests** - Connection requests
- **companyProfiles** - Company profiles
- **subscriptionPlans** - Subscription tiers

---

## Core Tables

### companies

Central multi-tenant table for organizations.

**Purpose:** Stores all organizations (ECPs, labs, suppliers) with complete isolation.

**Key Fields:**
- `id` (PK) - Unique company identifier
- `name` - Company name
- `type` - Company type (ecp, lab, supplier, hybrid)
- `status` - Account status (active, suspended, pending_approval)
- `subscriptionPlan` - Subscription tier (full, free_ecp)
- `stripeCustomerId` - Stripe integration
- `shopifyShopUrl` - Shopify store URL
- `gocNumber` - GOC registration number
- `aiEnabled` - AI features enabled
- `settings` (JSONB) - Company settings
- `brandingSettings` (JSONB) - Branding configuration

**Indexes:**
- `idx_companies_status` - Status queries
- `idx_companies_type` - Type filtering
- `idx_companies_stripe_customer` - Stripe lookups
- `idx_companies_stripe_subscription` - Subscription queries

**Relationships:**
- **1:N** → `users` (company employees)
- **1:N** → `patients` (company patients)
- **1:N** → `orders` (company orders)
- **1:N** → `aiConversations` (AI chats)
- **1:N** → `shopifyStores` (Shopify connections)

---

### users

User accounts and authentication.

**Purpose:** Stores all user accounts with role-based access.

**Key Fields:**
- `id` (PK) - Unique user identifier
- `companyId` (FK) - Associated company (multi-tenancy)
- `email` - Login email (unique)
- `password` - Hashed password
- `role` - Primary role (admin, ecp, lab_tech, etc.)
- `enhancedRole` - Detailed role (optometrist, dispenser, etc.)
- `status` - Account status (pending, active, suspended)
- `firstName`, `lastName` - User name
- `gocNumber` - GOC registration (for practitioners)
- `permissions` (JSONB) - Custom permissions
- `settings` (JSONB) - User settings
- `lastLogin` - Last login timestamp

**Indexes:**
- `idx_users_company` - Company filtering
- `idx_users_email` - Login queries
- `idx_users_status` - Status filtering

**Relationships:**
- **N:1** → `companies` (belongs to company)
- **1:N** → `orders` (created orders)
- **1:N** → `patients` (managed patients)
- **1:N** → `aiConversations` (AI chats)

---

### patients

Patient/customer records.

**Purpose:** Central patient management with complete medical history.

**Key Fields:**
- `id` (PK) - Unique patient identifier
- `companyId` (FK) - Company (multi-tenancy)
- `ecpId` (FK) - Primary ECP user
- `customerNumber` - Human-readable ID
- `firstName`, `lastName` - Patient name
- `dateOfBirth` - Birth date
- `nhsNumber` - NHS number
- `email`, `phone` - Contact info
- `address` (JSONB) - Address details
- `medicalHistory` (JSONB) - Medical history
- `allergies` (JSONB) - Known allergies
- `currentMedications` (JSONB) - Current medications
- `shopifyCustomerId` - Shopify sync

**Indexes:**
- `idx_patients_company` - Company filtering
- `idx_patients_ecp` - ECP assignment
- `idx_patients_email` - Email lookup
- `idx_patients_nhs_number` - NHS lookup

**Relationships:**
- **N:1** → `companies` (belongs to company)
- **N:1** → `users` (primary ECP)
- **1:N** → `prescriptions` (prescriptions)
- **1:N** → `orders` (orders)
- **1:N** → `eyeExaminations` (examinations)
- **1:N** → `contactLensAssessments` (CL assessments)

---

### prescriptions

Optical prescriptions.

**Purpose:** Stores spectacle and contact lens prescriptions.

**Key Fields:**
- `id` (PK) - Unique prescription ID
- `companyId` (FK) - Company (multi-tenancy)
- `patientId` (FK) - Associated patient
- `prescriptionType` - Type (spectacles, contact_lenses)
- `odSphere`, `odCylinder`, `odAxis` - Right eye values
- `osSphere`, `osCylinder`, `osAxis` - Left eye values
- `pd` - Pupillary distance
- `add` - Addition (for progressives)
- `prism` (JSONB) - Prism values
- `issuedDate` - Issue date
- `expiryDate` - Expiry date (UK: 2 years spectacles, 1 year CL)
- `prescriberId` (FK) - Prescribing practitioner
- `notes` - Clinical notes

**Indexes:**
- `idx_prescriptions_company` - Company filtering
- `idx_prescriptions_patient` - Patient prescriptions
- `idx_prescriptions_issued_date` - Date queries

**Relationships:**
- **N:1** → `companies` (belongs to company)
- **N:1** → `patients` (for patient)
- **N:1** → `users` (prescribed by)
- **1:N** → `orders` (used in orders)

---

### orders

Lens and product orders.

**Purpose:** Complete order lifecycle management.

**Key Fields:**
- `id` (PK) - Unique order ID
- `companyId` (FK) - Company (multi-tenancy)
- `orderNumber` - Human-readable order number
- `patientId` (FK) - Associated patient
- `prescriptionId` (FK) - Prescription used
- `status` - Order status (pending, in_production, shipped, etc.)
- `lensType` - Lens type (single_vision, bifocal, progressive)
- `lensMaterial` - Material (cr39, polycarbonate, high_index)
- `coating` - Coating type (anti-reflective, blue_light, etc.)
- `tint` (JSONB) - Tint specifications
- `jobType` (JSONB) - Job details
- `totalPrice` - Total price (decimal)
- `dueDate` - Expected completion date
- `completedAt` - Completion timestamp
- `notes` - Order notes
- `shopifyOrderId` - Shopify sync

**Indexes:**
- `idx_orders_company` - Company filtering
- `idx_orders_patient` - Patient orders
- `idx_orders_status` - Status queries
- `idx_orders_due_date` - Due date sorting

**Relationships:**
- **N:1** → `companies` (belongs to company)
- **N:1** → `patients` (for patient)
- **N:1** → `prescriptions` (uses prescription)
- **N:1** → `users` (created by)
- **1:N** → `orderTimeline` (status history)
- **1:N** → `qualityIssues` (quality tracking)
- **1:N** → `returns` (returns)
- **1:1** → `dispenseRecords` (dispense audit)

---

### eyeExaminations

Eye examination records.

**Purpose:** Complete eye exam workflow and records.

**Key Fields:**
- `id` (PK) - Examination ID
- `companyId` (FK) - Company (multi-tenancy)
- `patientId` (FK) - Patient examined
- `examinerId` (FK) - Examining practitioner
- `testRoomId` (FK) - Test room used
- `examinationDate` - Date of exam
- `chiefComplaint` - Patient complaint
- `visualAcuity` (JSONB) - VA measurements
- `refraction` (JSONB) - Refraction results
- `binocularVision` (JSONB) - BV assessment
- `anteriorSegment` (JSONB) - Anterior exam
- `posteriorSegment` (JSONB) - Posterior exam
- `intraocularPressure` (JSONB) - IOP readings
- `diagnosis` - Clinical diagnosis
- `management` - Management plan
- `recall` - Recall period
- `status` - Status (in_progress, finalized)

**Indexes:**
- `idx_examinations_company` - Company filtering
- `idx_examinations_patient` - Patient history
- `idx_examinations_date` - Date queries

**Relationships:**
- **N:1** → `companies` (belongs to company)
- **N:1** → `patients` (for patient)
- **N:1** → `users` (examiner)
- **N:1** → `testRooms` (test room)
- **1:N** → `dicomReadings` (DICOM images)
- **1:N** → `prescriptions` (resulting prescriptions)

---

### aiConversations

AI assistant chat sessions.

**Purpose:** Track AI assistant interactions and context.

**Key Fields:**
- `id` (PK) - Conversation ID
- `companyId` (FK) - Company (multi-tenancy)
- `userId` (FK) - User chatting
- `title` - Conversation title
- `status` - Status (active, resolved, archived)
- `context` (JSONB) - Conversation context
- `createdAt`, `updatedAt` - Timestamps

**Indexes:**
- `idx_ai_conversations_company` - Company filtering
- `idx_ai_conversations_user` - User's conversations

**Relationships:**
- **N:1** → `companies` (belongs to company)
- **N:1** → `users` (user's chat)
- **1:N** → `aiMessages` (messages in conversation)

---

### aiMessages

Individual messages in AI conversations.

**Purpose:** Store complete AI chat history.

**Key Fields:**
- `id` (PK) - Message ID
- `conversationId` (FK) - Parent conversation
- `role` - Role (user, assistant, system)
- `content` - Message content
- `usedExternalAi` - Used external AI (GPT/Claude)
- `confidence` - AI confidence score (0-1)
- `tokens` - Token usage
- `model` - AI model used
- `metadata` (JSONB) - Additional data

**Indexes:**
- `idx_ai_messages_conversation` - Conversation messages

**Relationships:**
- **N:1** → `aiConversations` (belongs to conversation)

---

## Multi-Tenancy

### Implementation Strategy

ILS 2.0 uses **row-level multi-tenancy** with the `companyId` foreign key pattern.

### Multi-Tenancy Rules

1. **Every tenant table** includes `companyId` field
2. **All queries** must filter by `companyId`
3. **Foreign keys** respect tenant boundaries
4. **Indexes** include `companyId` for performance

### Example Query Pattern

```typescript
// ✅ CORRECT - Includes companyId filter
const patients = await db.select()
  .from(schema.patients)
  .where(eq(schema.patients.companyId, userCompanyId));

// ❌ WRONG - Missing companyId filter (security issue!)
const patients = await db.select()
  .from(schema.patients);
```

### Tenant Isolation

```typescript
// Backend middleware ensures companyId is available
export const isAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // User's companyId is available in req.user.companyId
  next();
};

// Helper to get companyId safely
const getCompanyId = (req: Request): string => {
  const companyId = req.user?.companyId;
  if (!companyId) {
    throw new Error('Company ID is required');
  }
  return companyId;
};
```

### Shared vs Tenant Tables

**Tenant Tables (95%)** - Include `companyId`:
- `patients`, `orders`, `prescriptions`
- `users`, `invoices`, `products`
- `aiConversations`, `shopifyStores`
- Most application tables

**Shared Tables (5%)** - No `companyId`:
- `companies` - Company registry
- `subscriptionPlans` - Platform-wide plans
- `platformStatistics` - Platform analytics

---

## Relationships

### Entity Relationship Diagrams

#### Core Clinical Workflow

```
┌────────────┐
│ companies  │
└──────┬─────┘
       │
       ├──────────┐
       │          │
   ┌───▼────┐  ┌─▼────┐
   │ users  │  │ patients │
   └────────┘  └──┬───────┘
                  │
       ┌──────────┼──────────┐
       │          │          │
  ┌────▼───┐  ┌──▼──────┐  ┌▼────────────┐
  │eyeExams│  │prescript│  │consultLogs  │
  └────────┘  └────┬────┘  └─────────────┘
                   │
              ┌────▼─────┐
              │ orders   │
              └──────────┘
```

#### Order Lifecycle

```
┌─────────┐      ┌────────────┐      ┌──────────┐
│ orders  │─────▶│orderTimeline│      │ returns  │
└────┬────┘      └────────────┘      └────▲─────┘
     │                                     │
     ├──────────────┬──────────────────────┤
     │              │                      │
┌────▼─────┐  ┌────▼────────┐  ┌──────────▼─────┐
│dispense  │  │qualityIssues│  │  nonAdapts     │
│Records   │  └─────────────┘  └────────────────┘
└──────────┘
```

#### AI System

```
┌────────────┐      ┌─────────────┐
│aiConversat.│─────▶│ aiMessages  │
└──────┬─────┘      └─────────────┘
       │
       ├─────────────┬──────────────┐
       │             │              │
┌──────▼────┐  ┌────▼──────┐  ┌────▼────────┐
│aiKnowledge│  │aiFeedback │  │aiLearning   │
│   Base    │  └───────────┘  │   Data      │
└───────────┘                 └─────────────┘
```

---

## Indexes and Performance

### Indexing Strategy

**All tenant tables** have compound indexes:
```sql
CREATE INDEX idx_table_company ON table_name(company_id);
CREATE INDEX idx_table_status ON table_name(status);
CREATE INDEX idx_table_created ON table_name(created_at);
```

### Common Indexes

**Users:**
- `idx_users_company` - Company filtering
- `idx_users_email` - Login queries
- `idx_users_status` - Active user queries

**Patients:**
- `idx_patients_company` - Company filtering
- `idx_patients_ecp` - ECP assignment
- `idx_patients_email` - Email search
- `idx_patients_nhs_number` - NHS lookup

**Orders:**
- `idx_orders_company` - Company filtering
- `idx_orders_patient` - Patient orders
- `idx_orders_status` - Status filtering
- `idx_orders_due_date` - Due date sorting

**Prescriptions:**
- `idx_prescriptions_company` - Company filtering
- `idx_prescriptions_patient` - Patient history
- `idx_prescriptions_issued_date` - Date range queries

### Query Performance Tips

**1. Always filter by companyId first:**
```typescript
// ✅ Efficient - Uses index
.where(and(
  eq(schema.orders.companyId, companyId),
  eq(schema.orders.status, 'pending')
))

// ❌ Slow - Scans all companies
.where(eq(schema.orders.status, 'pending'))
```

**2. Use joins instead of N+1 queries:**
```typescript
// ✅ Efficient - Single query
const ordersWithPatients = await db.select()
  .from(schema.orders)
  .leftJoin(schema.patients, eq(schema.orders.patientId, schema.patients.id))
  .where(eq(schema.orders.companyId, companyId));

// ❌ Slow - N+1 problem
const orders = await db.select().from(schema.orders);
for (const order of orders) {
  order.patient = await db.select().from(schema.patients)
    .where(eq(schema.patients.id, order.patientId));
}
```

**3. Limit result sets:**
```typescript
// ✅ Good - Paginated results
.limit(50)
.offset(page * 50)

// ❌ Bad - Loads all data
.select()
```

---

## Best Practices

### 1. Multi-Tenancy Enforcement

```typescript
// ✅ ALWAYS include companyId in queries
const getPatient = async (patientId: string, companyId: string) => {
  return db.select()
    .from(schema.patients)
    .where(and(
      eq(schema.patients.id, patientId),
      eq(schema.patients.companyId, companyId) // REQUIRED
    ));
};
```

### 2. Type-Safe Queries

```typescript
// ✅ Use Drizzle's type-safe queries
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '@shared/schema';

const orders = await db.select()
  .from(schema.orders)
  .where(and(
    eq(schema.orders.companyId, companyId),
    eq(schema.orders.status, 'pending')
  ))
  .orderBy(desc(schema.orders.createdAt))
  .limit(50);
```

### 3. Validation with Zod

```typescript
// ✅ Use schema validation
import { createInsertSchema } from 'drizzle-zod';
import { patients } from '@shared/schema';

const insertPatientSchema = createInsertSchema(patients, {
  email: (schema) => schema.email.email(),
  nhsNumber: (schema) => schema.nhsNumber.length(10),
});

// Validate before insert
const validatedData = insertPatientSchema.parse(patientData);
```

### 4. Transactions

```typescript
// ✅ Use transactions for multi-table operations
await db.transaction(async (tx) => {
  const order = await tx.insert(schema.orders).values(orderData);
  await tx.insert(schema.orderTimeline).values({
    orderId: order.id,
    status: 'pending',
    userId: userId,
  });
});
```

### 5. Soft Deletes (when needed)

```typescript
// ✅ Use deletedAt for soft deletes (where required)
await db.update(schema.patients)
  .set({ deletedAt: new Date() })
  .where(eq(schema.patients.id, patientId));

// Filter out deleted records
.where(and(
  eq(schema.patients.companyId, companyId),
  isNull(schema.patients.deletedAt)
))
```

### 6. JSONB Fields

```typescript
// ✅ Use JSONB for flexible data
const patient = await db.insert(schema.patients).values({
  ...patientData,
  address: {
    line1: '123 High Street',
    city: 'London',
    postcode: 'SW1A 1AA',
    country: 'United Kingdom'
  },
  medicalHistory: {
    diabetes: false,
    hypertension: true,
    medications: ['Lisinopril']
  }
});

// Query JSONB fields (PostgreSQL)
.where(sql`${schema.patients.address}->>'city' = 'London'`)
```

---

## Schema Migrations

### Development Workflow

**1. Edit schema:**
```typescript
// shared/schema.ts
export const myNewTable = pgTable('my_new_table', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar('company_id').notNull().references(() => companies.id),
  name: varchar('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

**2. Push to development database:**
```bash
npm run db:push
```

This directly syncs schema to database (no migration files needed for dev).

**3. For production, generate migration:**
```bash
npm run db:generate
# Creates: drizzle/migrations/0001_migration.sql
```

**4. Apply migration:**
```bash
npm run db:migrate
```

### Migration Best Practices

- ✅ **Test migrations** on staging first
- ✅ **Backup database** before migrations
- ✅ **Use transactions** for migrations
- ✅ **Version control** migration files
- ❌ **Never modify** existing migration files
- ❌ **Don't skip** migration numbers

---

## Appendix: All Tables

Complete list of all 110+ tables organized by category:

### Core (5 tables)
1. `companies` - Organizations
2. `users` - User accounts
3. `userRoles` - Role assignments
4. `permissions` - System permissions
5. `sessions` - Auth sessions

### Clinical (17 tables)
6. `patients` - Patient records
7. `prescriptions` - Prescriptions
8. `eyeExaminations` - Eye exams
9. `consultLogs` - Consultations
10. `testRooms` - Exam rooms
11. `testRoomBookings` - Room bookings
12. `contactLensAssessments` - CL assessments
13. `contactLensFittings` - CL fittings
14. `contactLensPrescriptions` - CL Rx
15. `contactLensAftercare` - CL aftercare
16. `contactLensInventory` - CL stock
17. `contactLensOrders` - CL orders
18. `prescriptionTemplates` - Templates
19. `clinicalProtocols` - Protocols
20. `remoteSessions` - Remote consults
21. `gocComplianceChecks` - GOC compliance
22. `prescriptionAlerts` - Alerts

### Orders (8 tables)
23. `orders` - Orders
24. `orderTimeline` - Status history
25. `dispenseRecords` - Dispense audit
26. `returns` - Returns
27. `qualityIssues` - Quality control
28. `nonAdapts` - Non-adaptations
29. `purchaseOrders` - Purchase orders
30. `poLineItems` - PO items

### POS (6 tables)
31. `posTransactions` - POS sales
32. `posTransactionItems` - POS items
33. `invoices` - Invoices
34. `invoiceLineItems` - Invoice items
35. `products` - Products
36. `productVariants` - Variants

### Inventory (4 tables)
37. `inventoryMovements` - Stock moves
38. `lowStockAlerts` - Stock alerts
39. `demandForecasts` - Forecasts
40. `seasonalPatterns` - Patterns

### AI/ML (24 tables)
41. `aiConversations` - AI chats
42. `aiMessages` - Chat messages
43. `aiKnowledgeBase` - Knowledge
44. `aiLearningData` - Learning data
45. `aiFeedback` - Feedback
46. `aiModelVersions` - Model versions
47. `aiModelDeployments` - Deployments
48. `masterTrainingDatasets` - Training
49. `trainingDataAnalytics` - Analytics
50. `companyAiSettings` - AI config
51. `aiTrainingJobs` - Training jobs
52. `aiDeploymentQueue` - Deploy queue
53. `aiNotifications` - AI alerts
54. `aiPurchaseOrders` - AI POs
55. `aiPurchaseOrderItems` - AI PO items
56. `aiDispensingRecommendations` - Dispense AI
57. `biRecommendations` - BI AI
58. `limsClinicalAnalytics` - LIMS AI
59. `nlpClinicalAnalysis` - NLP AI
60. `ecpCatalogData` - Catalog AI
61. `patientFaceAnalysis` - Face AI
62. `frameCharacteristics` - Frame data
63. `frameRecommendations` - Frame AI
64. `frameRecommendationAnalytics` - Frame analytics

### NHS (7 tables)
65. `nhsPractitioners` - Practitioners
66. `nhsContractDetails` - Contracts
67. `nhsClaims` - Claims
68. `nhsVouchers` - Vouchers
69. `nhsPatientExemptions` - Exemptions
70. `nhsPayments` - Payments

### Shopify (5 tables)
71. `shopifyStores` - Stores
72. `shopifyOrders` - Orders
73. `shopifyProducts` - Products
74. `shopifyWebhooks` - Webhooks
75. `prescriptionUploads` - Rx uploads

### Analytics (12 tables)
76. `analyticsEvents` - Events
77. `rxFrameLensAnalytics` - Rx analytics
78. `eciProductSalesAnalytics` - Sales
79. `forecastAccuracyMetrics` - Metrics
80. `aggregatedMetrics` - Aggregates
81. `platformStatistics` - Platform stats
82. `marketInsights` - Market data
83. `eventLog` - Event log

### Equipment (4 tables)
84. `equipment` - Equipment
85. `calibrationRecords` - Calibration
86. `dicomReadings` - DICOM
87. `technicalDocuments` - Tech docs

### Communication (8 tables)
88. `emailTemplates` - Templates
89. `emailLogs` - Email logs
90. `emailTrackingEvents` - Tracking
91. `notifications` - Notifications
92. `webhookSubscriptions` - Webhooks
93. `webhookDeliveries` - Webhook logs

### Supporting (17 tables)
94. `rolePermissions` - Role perms
95. `userCustomPermissions` - Custom perms
96. `auditLogs` - Audit trail
97. `organizationSettings` - Org config
98. `userPreferences` - User prefs
99. `pdfTemplates` - PDF templates
100. `companyRelationships` - Relationships
101. `connectionRequests` - Connections
102. `companyProfiles` - Profiles
103. `subscriptionPlans` - Plans
104. `subscriptionHistory` - History
105. `stripePaymentIntents` - Payments
106. `companySupplierRelationships` - Suppliers

---

## Quick Reference

### Common Queries

**Get patient with prescriptions:**
```typescript
const patient = await db.select()
  .from(schema.patients)
  .leftJoin(schema.prescriptions,
    eq(schema.patients.id, schema.prescriptions.patientId))
  .where(and(
    eq(schema.patients.id, patientId),
    eq(schema.patients.companyId, companyId)
  ));
```

**Get orders with timeline:**
```typescript
const orders = await db.select()
  .from(schema.orders)
  .leftJoin(schema.orderTimeline,
    eq(schema.orders.id, schema.orderTimeline.orderId))
  .where(eq(schema.orders.companyId, companyId))
  .orderBy(desc(schema.orders.createdAt));
```

**Get AI conversations with messages:**
```typescript
const conversations = await db.select()
  .from(schema.aiConversations)
  .leftJoin(schema.aiMessages,
    eq(schema.aiConversations.id, schema.aiMessages.conversationId))
  .where(and(
    eq(schema.aiConversations.companyId, companyId),
    eq(schema.aiConversations.userId, userId)
  ));
```

---

**Last Updated:** November 2024
**Schema Version:** 2.0
**Total Tables:** 110+
