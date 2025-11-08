# ILS 2.0 - System Architecture

Comprehensive architecture documentation for the Integrated Laboratory System 2.0.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [AI/ML Services](#aiml-services)
- [Multi-Tenancy](#multi-tenancy)
- [Deployment Architecture](#deployment-architecture)

---

## Overview

ILS 2.0 is a comprehensive SaaS platform for the UK optical industry, providing:

- 👁️ Clinical eye examination management
- 🤖 AI-powered assistance (GPT-4, Claude)
- 📋 Prescription and order management
- 🛍️ Shopify e-commerce integration
- 📊 Business intelligence & analytics
- 🏥 NHS compliance (vouchers, exemptions, GOC registration)
- 📄 Professional PDF generation

### Architecture Principles

1. **Multi-Tenant** - Complete data isolation per company
2. **Role-Based Access** - 7+ role types with granular permissions
3. **AI-First** - Integrated AI throughout the platform
4. **Scalable** - Horizontal scaling for growth
5. **Secure** - GDPR compliant, encrypted data
6. **Modular** - Service-oriented architecture

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
├─────────────────────────────────────────────────────────────┤
│  Web App (React + Vite)  │  Mobile (Future)  │  API Clients │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       API Gateway                            │
│         Express.js + Authentication + Rate Limiting          │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Services                      │
├──────────────────┬──────────────────┬──────────────────────┤
│   Core Services  │   AI Services    │  Integration Services│
│  - OrderService  │  - MasterAI      │  - ShopifyService    │
│  - PatientMgmt   │  - OphthalmicAI  │  - EmailService      │
│  - Prescription  │  - ExternalAI    │  - PDFService        │
│  - Inventory     │  - Vision AI     │  - PaymentService    │
└──────────────────┴──────────────────┴──────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
├──────────────────┬──────────────────┬──────────────────────┤
│   PostgreSQL     │   Python ML      │   External APIs      │
│   (Drizzle ORM)  │   Service        │   - OpenAI GPT-4     │
│                  │   - RAG System   │   - Anthropic Claude │
│                  │   - ML Models    │   - Shopify          │
└──────────────────┴──────────────────┴──────────────────────┘
```

---

## Technology Stack

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI framework | 18.x |
| TypeScript | Type safety | 5.x |
| Vite | Build tool | 5.x |
| Wouter | Routing | Latest |
| TanStack Query | Data fetching | 5.x |
| shadcn/ui | UI components | Latest |
| Tailwind CSS | Styling | 3.x |

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| Node.js | Runtime | 20.x |
| Express.js | Web framework | 4.x |
| TypeScript | Type safety | 5.x |
| Drizzle ORM | Database ORM | Latest |
| PostgreSQL | Database | 15.x |
| Passport | Authentication | Latest |

### AI/ML

| Service | Purpose | Provider |
|---------|---------|----------|
| GPT-4 | General intelligence | OpenAI |
| GPT-4 Vision | Image analysis | OpenAI |
| Claude | Alternative AI | Anthropic |
| Python ML Service | RAG, embeddings | Custom |

### Testing

| Tool | Purpose |
|------|---------|
| Vitest | Component testing |
| Playwright | E2E testing |
| Jest | Backend testing |
| React Testing Library | Component utilities |

### DevOps

| Tool | Purpose |
|------|---------|
| GitHub Actions | CI/CD |
| Docker | Containerization |
| PostgreSQL | Production database |

---

## Data Flow

### Order Creation Flow

```
User (ECP) creates order
        ↓
Frontend validates form
        ↓
POST /api/orders
        ↓
Authentication middleware
        ↓
Request validation (Zod)
        ↓
OrderService.createOrder()
        ↓
├─ Generate order number
├─ Validate prescription
├─ Create order record (companyId isolation)
├─ Create timeline entry
├─ Send email notification
└─ Return order confirmation
        ↓
Frontend updates UI
```

### AI Query Flow

```
User asks AI question
        ↓
POST /api/master-ai/chat
        ↓
Topic validation
        ↓
Is question about optometry/eyecare?
        ├─ No → Reject with message
        └─ Yes → Continue
                ↓
        Python RAG Service
                ↓
        ├─ Generate embeddings
        ├─ Search knowledge base
        └─ Retrieve context
                ↓
        OpenAI GPT-4 / Claude
                ↓
        ├─ Context + knowledge
        ├─ Generate response
        └─ Stream back to user
                ↓
        Frontend displays response
```

### Shopify Sync Flow

```
Shopify Order Created
        ↓
Webhook → /api/webhooks/shopify
        ↓
Verify webhook signature
        ↓
ShopifyOrderSyncService
        ↓
├─ Extract order data
├─ Find/create patient
├─ Parse prescription from metafields
└─ Create ILS order
        ↓
PrescriptionVerificationService
        ↓
├─ Validate prescription values
├─ Check NHS voucher eligibility
└─ Flag anomalies
        ↓
Notify ECP of new order
```

---

## Security Architecture

### Authentication

```typescript
// Multi-strategy authentication
passport.use(new LocalStrategy(/* email/password */));
passport.use(new ReplitAuthStrategy(/* Replit OAuth */));

// Session-based auth with secure cookies
app.use(session({
  secret: process.env.SESSION_SECRET,
  secure: true, // HTTPS only
  httpOnly: true, // No JavaScript access
  sameSite: 'strict',
}));
```

### Authorization

```typescript
// Role-based access control
const roles = [
  'platform_admin',  // Full system access
  'company_admin',   // Company management
  'ecp',            // Eye care practitioner
  'optometrist',    // Clinical examinations
  'lab_tech',       // Production queue
  'customer_service', // Support
  'accountant',     // Financial data
];

// Permission middleware
function requireRole(allowedRoles: string[]) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

### Data Isolation (Multi-Tenancy)

```typescript
// All queries automatically filtered by companyId
const orders = await db.select()
  .from(ordersTable)
  .where(eq(ordersTable.companyId, req.user!.companyId));

// Row-level security ensures no cross-tenant data access
```

### Input Validation

```typescript
// Zod schemas for runtime validation
const createOrderSchema = z.object({
  patientName: z.string().min(1).max(100),
  odSphere: z.string().regex(/^[+-]\d+\.\d{2}$/),
  odAxis: z.number().min(0).max(180),
  // ... all fields validated
});

// Validation middleware
app.post('/api/orders',
  validateRequest(createOrderSchema),
  async (req, res) => {
    // req.body is type-safe and validated
  }
);
```

### SQL Injection Prevention

```typescript
// Drizzle ORM with parameterized queries
const patient = await db.select()
  .from(patientsTable)
  .where(eq(patientsTable.id, patientId)); // Automatically parameterized

// ❌ NEVER do this:
// db.execute(`SELECT * FROM patients WHERE id = '${patientId}'`);
```

### XSS Prevention

```typescript
// React automatically escapes output
<div>{userInput}</div> // Safe

// DOMPurify for raw HTML
import DOMPurify from 'dompurify';
const cleanHTML = DOMPurify.sanitize(dirtyHTML);
```

---

## AI/ML Services

### Master AI Service

**Purpose:** Tenant-specific AI intelligence with knowledge base

**Architecture:**
```
User Query
    ↓
MasterAI Service (TypeScript)
    ↓
Python RAG Service
    ↓
├─ Embedding Generation (OpenAI)
├─ Vector Search (Knowledge Base)
└─ Context Retrieval
    ↓
OpenAI GPT-4 / Claude
    ↓
Intelligent Response
```

**Features:**
- Topic validation (optometry only)
- Progressive learning from interactions
- Multi-provider failover (OpenAI ↔ Claude)
- Conversation context management
- Database tool access for data queries

### Ophthalmic AI Service

**Purpose:** Specialized optical/optometry assistance

**Capabilities:**
- Lens recommendations (Good/Better/Best tiers)
- Prescription interpretation
- Frame fitting advice
- Coating recommendations
- Lifestyle-based suggestions

**Example:**
```typescript
const recommendation = await ophthalamicAI.getLensRecommendation({
  prescription: { odSphere: '+2.00', odCylinder: '-0.50' },
  lifestyle: 'computer_work',
  budget: 'mid_range',
});

// Returns: {
//   tier: 'better',
//   lensType: 'progressive',
//   material: 'polycarbonate',
//   coatings: ['anti-reflective', 'blue_light_filter'],
//   reasoning: '...'
// }
```

### Vision AI (GPT-4 Vision)

**Purpose:** Image analysis for optical applications

**Use Cases:**
- Frame analysis from photos
- Face shape detection
- Facial measurements for frame fitting
- OMA file visualization
- Prescription image OCR

---

## Multi-Tenancy

### Data Isolation Strategy

**1. Company-Based Partitioning**

Every table includes `companyId`:

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  patient_id UUID NOT NULL,
  -- ... other fields

  -- Ensure data isolation
  CONSTRAINT orders_company_fk FOREIGN KEY (company_id)
    REFERENCES companies(id) ON DELETE CASCADE
);

-- Index for performance
CREATE INDEX idx_orders_company ON orders(company_id);
```

**2. Middleware Enforcement**

```typescript
// Automatically inject companyId filter
function requireAuthentication(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // All subsequent queries use req.user.companyId
  next();
}
```

**3. Query Pattern**

```typescript
// ✅ Correct - Always filter by companyId
const patients = await db.select()
  .from(patientsTable)
  .where(eq(patientsTable.companyId, req.user!.companyId));

// ❌ Wrong - Missing companyId filter
const patients = await db.select()
  .from(patientsTable); // Would return all companies' data!
```

**4. Unique Constraints**

```sql
-- Customer numbers unique per company, not globally
CREATE UNIQUE INDEX idx_patients_customer_number_company
  ON patients(customer_number, company_id);
```

---

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────┐
│              Load Balancer                   │
│            (NGINX / Cloudflare)             │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│         Web Servers (Node.js)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Server 1 │  │ Server 2 │  │ Server 3 │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│      Database Cluster (PostgreSQL)          │
│  ┌──────────┐          ┌──────────┐         │
│  │ Primary  │  ──────▶ │ Replica  │         │
│  └──────────┘          └──────────┘         │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│          External Services                   │
│  OpenAI │ Anthropic │ Shopify │ Payment    │
└─────────────────────────────────────────────┘
```

### Scaling Strategy

**Horizontal Scaling:**
- Multiple Node.js servers behind load balancer
- Stateless servers (session in database/Redis)
- Database read replicas for analytics queries

**Caching:**
```typescript
// Redis cache for frequently accessed data
const cachedMetrics = await cache.get(`analytics:${companyId}`);
if (cachedMetrics) {
  return cachedMetrics;
}

const metrics = await calculateMetrics(companyId);
await cache.set(`analytics:${companyId}`, metrics, { ttl: 300 }); // 5 min
```

**Background Jobs:**
```typescript
// Queue system for async tasks
await queue.add('send-email', {
  to: customer.email,
  template: 'order-confirmation',
  data: orderData,
});

await queue.add('generate-pdf', {
  orderId: order.id,
  type: 'invoice',
});
```

---

## Database Schema

### Core Tables

**companies** - Multi-tenant root
- id, name, settings, subscription_tier

**users** - Authentication & authorization
- id, email, password_hash, role, company_id

**patients** - Patient records
- id, customer_number, name, dob, nhs_number, company_id

**orders** - Order management
- id, order_number, status, prescription, company_id

**examinations** - Clinical eye exams
- id, patient_id, practitioner_id, findings, company_id

**inventory** - Stock management
- id, sku, quantity, reorder_level, company_id

### Relationships

```
companies
    ├── users (1:many)
    ├── patients (1:many)
    ├── orders (1:many)
    └── inventory (1:many)

patients
    ├── examinations (1:many)
    └── orders (1:many)

orders
    ├── order_line_items (1:many)
    └── order_timeline (1:many)
```

---

## API Design

### RESTful Endpoints

```
GET    /api/orders              # List orders
POST   /api/orders              # Create order
GET    /api/orders/:id          # Get order details
PATCH  /api/orders/:id/status   # Update status
DELETE /api/orders/:id          # Cancel order

GET    /api/patients            # List patients
POST   /api/patients            # Create patient
GET    /api/patients/:id        # Get patient
PATCH  /api/patients/:id        # Update patient
DELETE /api/patients/:id        # Delete patient
```

### Response Format

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-12345678",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Error Format

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid prescription data",
    "details": [
      {
        "field": "odAxis",
        "message": "Must be between 0 and 180"
      }
    ]
  }
}
```

---

## Performance Considerations

### Database Optimization

```sql
-- Indexes for common queries
CREATE INDEX idx_orders_company_status ON orders(company_id, status);
CREATE INDEX idx_orders_company_created ON orders(company_id, created_at DESC);
CREATE INDEX idx_patients_company_name ON patients(company_id, name);

-- Partial indexes for specific queries
CREATE INDEX idx_active_orders ON orders(company_id)
  WHERE status IN ('pending', 'in_production');
```

### Query Optimization

```typescript
// ✅ Efficient - Use select() to limit columns
const orders = await db.select({
  id: ordersTable.id,
  orderNumber: ordersTable.orderNumber,
  status: ordersTable.status,
}).from(ordersTable);

// ❌ Inefficient - Loads all columns including large JSON fields
const orders = await db.select().from(ordersTable);
```

### Caching Strategy

- **Static data:** Cache for 24 hours (lens types, coatings)
- **Analytics:** Cache for 5 minutes
- **User data:** Cache for 1 minute
- **Real-time data:** No cache (order status)

---

## Monitoring & Observability

### Logging

```typescript
import { createLogger } from './utils/logger';

const logger = createLogger('OrderService');

logger.info('Order created', { orderId, companyId });
logger.warn('Low inventory', { sku, quantity });
logger.error('Payment failed', { error, orderId });
```

### Metrics

```typescript
// Track API performance
const startTime = Date.now();
const result = await processOrder(orderData);
const duration = Date.now() - startTime;

metrics.recordLatency('orders.create', duration);
metrics.increment('orders.created');
```

### Health Checks

```typescript
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    uptime: process.uptime(),
    database: await checkDatabase(),
    ai_services: await checkAIServices(),
  };

  res.json(health);
});
```

---

## Future Architecture

### Planned Enhancements

1. **Microservices Migration**
   - Split monolith into domain services
   - API gateway with service mesh

2. **Event-Driven Architecture**
   - Event sourcing for audit trails
   - CQRS for read/write optimization

3. **Real-Time Features**
   - WebSocket for live updates
   - Production queue real-time status

4. **Mobile Apps**
   - React Native mobile app
   - Offline-first architecture

5. **Advanced Analytics**
   - Data warehouse for BI
   - Machine learning predictions

---

## Resources

- [API Documentation](/api-docs) - Swagger UI
- [Database Schema](./DATABASE.md) - Detailed schema docs
- [Testing Guide](./TESTING.md) - Test documentation
- [Deployment Guide](./DEPLOYMENT.md) - Deploy instructions

---

**Last Updated:** November 2024
**Version:** 2.0
**Status:** Production
