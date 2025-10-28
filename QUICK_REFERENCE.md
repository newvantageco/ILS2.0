# ILS Microservices Architecture - Quick Reference

## What Changed?

The ILS has transitioned from a **monolithic Replit application** to a **microservices architecture** with LIMS (Lab Information Management System) as the single source of truth.

**Old Model**: ECP → ILS Monolith → Lab Workflow  
**New Model**: ECP → API Gateway → [Multiple Services] → LIMS (Single Source of Truth)

---

## Three Key Documents to Read

1. **`docs/architecture.md`** - Strategic vision and system philosophy (read first)
2. **`IMPLEMENTATION_GUIDE.md`** - Concrete Phase 0-4 roadmap with timelines (read second)
3. **`PHASE_0_STATUS.md`** - Current progress and deliverables (read for status updates)

---

## Phase Overview

```
Phase 0 (NOW)     : Foundation & Architecture Setup
├─ Hire Principal Engineer
├─ Select & stand up LIMS
├─ Build Shared LIMS Client Package ✅ Started
└─ Integrate Auth Service

Phase 1 (4-6 mo)  : MVP Internal
├─ Order Service with LIMS validation
├─ Basic webhook handler for Flow 2
└─ SPA with order submission

Phase 2 (7-12 mo) : MVP ECP
├─ Automate Flow 2 (status webhooks)
├─ Launch POS Service (Stripe Connect)
└─ Launch Billing Service

Phase 3 (12-18 mo): All-in-One Platform
├─ Practice Service
├─ Supplier Service
└─ OTC Till

Phase 4 (Ongoing) : Innovation Loop
├─ Flow 3 (Catalog Innovation)
├─ Principal Engineer Dashboard
└─ Analytics & continuous improvement
```

---

## Current System State (Phase 1-6 Complete)

✅ **Core Features**:
- Order management with patient tracking
- Lab workflow dashboard
- Supplier management
- User roles (ECP, Lab, Supplier, Admin, Engineer)
- OMA file support
- Purchase orders with PDF generation
- Settings management
- Admin dashboard

❌ **NOT YET IMPLEMENTED**:
- LIMS integration
- Microservices separation
- AWS infrastructure
- Webhook handlers
- Payment integration (Stripe)
- Practice Service
- Supplier Service
- Principal Engineer dashboard

---

## LIMS Integration (What's New)

### The Three Flows

**Flow 1: Order Submission** (Real-time LIMS validation)
```
Order Form (SPA)
  ↓
Order Service validates with LIMS
  ↓
LIMS checks rules: Is this configuration valid?
  ↓
Order Service creates job in LIMS
  ↓
LIMS returns job_id and estimated completion
  ↓
Order saved locally with job_id
  ↓
Order status = "in_production"
```

**Flow 2: Status Updates** (LIMS webhooks)
```
LIMS job state changes
  ↓
LIMS triggers webhook: { job_id, new_status }
  ↓
Order Service WebhookHandler receives
  ↓
Order Service updates local order
  ↓
SPA notified via WebSocket (real-time update)
  ↓
ECP sees order status change live
```

**Flow 3: Catalog Innovation** (Zero-lag distribution)
```
Principal Engineer updates rules in LIMS
  ↓
LIMS triggers catalog update webhook
  ↓
Order Service receives new catalog
  ↓
SPA receives updated options via WebSocket
  ↓
ECPs instantly see new products available
```

---

## Shared LIMS Client Package

**Location**: `packages/lims-client/`

**What It Is**: A type-safe API client for all service-to-LIMS communication

**Key Features**:
- ✅ Retry logic with exponential backoff
- ✅ Circuit breaker pattern
- ✅ Request/response validation (Zod)
- ✅ Webhook signature verification
- ✅ Built-in caching (catalog with 5-min TTL)
- ✅ Comprehensive error handling
- ✅ Full TypeScript support

**Usage Example**:
```typescript
import { LimsClient } from '@ils/lims-client';

const client = new LimsClient({
  baseUrl: process.env.LIMS_API_BASE_URL,
  apiKey: process.env.LIMS_API_KEY,
  webhookSecret: process.env.LIMS_WEBHOOK_SECRET,
});

// Create a job
const job = await client.createJob({
  ecpId: 'ecp-123',
  patientId: 'patient-456',
  prescription: { odSphere: -2.0, osSphere: -1.5, pd: 64 },
  lensType: 'progressive',
  coating: 'anti-reflective',
});

// Validate before submitting
const validation = await client.validateConfiguration({
  prescription: job.prescription,
  lensType: 'progressive',
  coating: 'anti-reflective',
});

// Get catalog
const catalog = await client.fetchCatalog(); // Cached for 5 minutes

// Verify webhook signature
const isValid = client.verifyWebhookSignature(payload, signature);
```

---

## Microservices Architecture (Target)

### Services to Build

1. **Order Service** (Priority 1)
   - Validates orders against LIMS
   - Emits CreateJob to LIMS
   - Consumes status webhooks
   - Tracks orders through production

2. **POS Service** (Priority 2)
   - Stripe Connect integration
   - Transaction ledger (DynamoDB)
   - Payment processing

3. **Billing Service** (Priority 2)
   - Consumes Stripe webhooks
   - Generates invoices (PDFs)
   - Sends emails

4. **Practice Service** (Priority 3)
   - ECP practice metadata
   - Staff roster management
   - Supplier relationships

5. **Supplier Service** (Priority 3)
   - Generates purchase orders
   - Tracks delivery
   - Manages supplier documents

---

## Technology Stack (Production Target)

### Infrastructure
- **Cloud**: AWS
- **Orchestration**: Kubernetes (AWS EKS)
- **API Gateway**: AWS API Gateway
- **Load Balancing**: Network Load Balancer (NLB)

### Data
- **Relational**: AWS RDS PostgreSQL (managed)
- **Cache**: AWS ElastiCache Redis
- **Transactions**: AWS DynamoDB
- **File Storage**: AWS S3

### Monitoring
- **Metrics**: Prometheus
- **Visualization**: Grafana
- **Logs**: AWS CloudWatch
- **Tracing**: AWS X-Ray

### Deployment
- **Container Registry**: AWS ECR
- **CI/CD**: GitHub Actions
- **IaC**: Terraform or CloudFormation

---

## Important Environment Variables (Phase 1+)

```bash
# LIMS Integration
LIMS_API_BASE_URL=https://lims.company.com/api
LIMS_API_KEY=...
LIMS_WEBHOOK_SECRET=...

# AWS Services
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Database
DATABASE_URL=postgresql://...  # RDS connection
REDIS_URL=redis://...          # ElastiCache

# Authentication
AUTH_PROVIDER=cognito|auth0
COGNITO_USER_POOL_ID=...
COGNITO_CLIENT_ID=...

# Payment Processing
STRIPE_API_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Email
RESEND_API_KEY=... # or SENDGRID_API_KEY

# Session & Security
SESSION_SECRET=...
ADMIN_SETUP_KEY=...
```

---

## What You Need to Know

### For Backend Developers
- Read: `docs/architecture.md` → `IMPLEMENTATION_GUIDE.md`
- Services use shared LIMS Client for all LIMS communication
- Each service is independently deployable
- Database schema in `shared/schema.ts`
- API validation with Zod schemas

### For Frontend Developers
- Current SPA continues in React + TanStack Query
- New WebSocket subscriptions for real-time order updates
- Order status now comes from LIMS (via Order Service)
- Catalog can change instantly (Flow 3)

### For DevOps/Infra Teams
- Target: AWS EKS with multi-AZ deployment
- Database: Managed RDS (handles backups, scaling)
- CI/CD: GitHub Actions → AWS ECR → EKS
- Monitoring: Prometheus + Grafana stack
- Infrastructure as Code: Terraform recommended

### For QA/Testing
- Unit tests: >80% coverage required
- Integration tests: Against mock LIMS server
- Contract tests: Validate LIMS API contract
- E2E tests: Full user workflows
- Load tests: 1000+ concurrent orders

---

## How to Get Started

### If You're the Principal Engineer
1. Read `docs/architecture.md`
2. Review `IMPLEMENTATION_GUIDE.md` sections 0.2-0.3
3. Evaluate LIMS platforms
4. Create detailed LIMS API contract

### If You're a Backend Developer
1. Read `docs/architecture.md` and `IMPLEMENTATION_GUIDE.md`
2. Explore `packages/lims-client/` to understand shared client
3. Start building Order Service (Phase 1)
4. Contribute to LIMS Client Package

### If You're a DevOps Engineer
1. Read infrastructure section in `IMPLEMENTATION_GUIDE.md`
2. Review AWS architecture diagram
3. Begin Terraform/CloudFormation code
4. Set up GitHub Actions pipeline

### If You're Product/Project Manager
1. Read `docs/architecture.md` executive summary
2. Review Phase 0-4 timeline in `IMPLEMENTATION_GUIDE.md`
3. Track progress in `PHASE_0_STATUS.md`
4. Coordinate with Principal Engineer on LIMS decisions

---

## Common Questions

**Q: When will this be live?**  
A: Phase 1 MVP in 4-6 months (if we start immediately)

**Q: Do I need to migrate my order data?**  
A: Not immediately. Phase 1 will run in parallel with current system. Full migration in Phase 2.

**Q: Will my customers see any changes?**  
A: No. All changes are internal. SPA interface remains the same.

**Q: What's the budget for this?**  
A: Depends on LIMS choice. AWS EKS: ~$15k/month. LIMS platform: varies ($50k-500k annually depending on vendor)

**Q: Who decides the technical direction?**  
A: Principal Engineer (manufacturing expert) + CTO (technical strategy)

---

## Quick Links

| Document | Purpose |
|----------|---------|
| `docs/architecture.md` | Strategic vision |
| `IMPLEMENTATION_GUIDE.md` | Detailed roadmap |
| `PHASE_0_STATUS.md` | Current progress |
| `PROJECT_OVERVIEW.txt` | Current system state |
| `LIMS_CLIENT_SCHEMAS.md` | API schemas |
| `README.md` | Project overview |

## Key Contacts

- **Architecture Lead**: [Your Name]
- **Principal Engineer**: [To Be Hired]
- **CTO**: [Executive Leadership]
- **Product Manager**: [Product Team]
- **Slack Channel**: #ils-development

---

**Last Updated**: October 28, 2025  
**Version**: 1.0  
**Status**: Ready for Phase 1 Planning
