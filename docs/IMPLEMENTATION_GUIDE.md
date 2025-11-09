# Integrated Lens System - Implementation Guide
## Following the Architecture Strategy Document

**Date**: October 28, 2025  
**Status**: Phase 0 - Foundation Planning  
**Current Deployment**: Replit (Development)  
**Target Deployment**: AWS EKS (Production)

---

## Executive Summary

This guide translates the strategic architecture document into a concrete implementation roadmap. The ILS is evolving from a monolithic Replit deployment into a microservice architecture with AWS EKS as the target platform. The system maintains LIMS (Lab Information Management System) as the single source of truth for all manufacturing intelligence.

### Current State
- ✅ Phase 1-6 completed: Core order management, supplier management, user roles, OMA support
- ✅ Monolithic Express/React application running on Replit
- ✅ PostgreSQL database (Neon serverless)
- ✅ Basic admin dashboard and role-based access control
- ❌ No LIMS integration
- ❌ No microservices architecture
- ❌ No AWS infrastructure
- ❌ No webhook handlers for status updates

---

## Phase 0: Foundation & Architecture Setup (Months 0-3)

### 0.1 Hire and Onboard Principal Engineer
- **Responsibility**: Oversee LIMS governance, encode manufacturing rules, audit production signals
- **Key Activities**:
  - Review existing ILS codebase and architecture
  - Establish LIMS platform selection criteria
  - Define manufacturing rules vocabulary and rule deployment process
  - Create LIMS API contract specifications

### 0.2 Select and Stand Up LIMS

**Action Items**:
1. **Evaluate LIMS Platforms**
   - Research options: Thermo Fisher SampleManager, LabVantage, Freezpoint, custom build
   - Criteria: API maturity, rule engine capabilities, audit trail, pricing model
   - Recommendation: Custom build vs. third-party depends on budget and timeline

2. **LIMS API Design Specification**
   ```
   LIMS must expose endpoints:
   - POST /api/jobs/create - Accept CreateJob payload, return job_id
   - GET /api/jobs/:jobId/status - Return current job state
   - GET /api/rules - Fetch current manufacturing rules and catalog
   - POST /api/webhooks/status - Register webhook endpoint
   - GET /api/catalog - Complete lens/frame/material availability
   - GET /api/validation - Validate configuration against rules
   ```

3. **LIMS Deployment Infrastructure**
   - Database: PostgreSQL (managed RDS on AWS recommended)
   - API: RESTful with OpenAPI/Swagger documentation
   - Authentication: API key + mutual TLS for service-to-service
   - Rate limiting: 1000 req/min per service
   - SLA: 99.9% uptime, <100ms response time for catalog queries

### 0.3 Build Shared LIMS Client Package

**Location**: `packages/lims-client/` (new monorepo structure)

```typescript
// packages/lims-client/src/index.ts
export interface LimsCreateJobRequest {
  ecpId: string;
  patientId: string;
  prescription: PrescriptionData;
  frameSpecs: FrameSpecification;
  lensType: string;
  coating: string;
  urgency: 'standard' | 'expedited' | 'rush';
  metadata?: Record<string, any>;
}

export interface LimsCreateJobResponse {
  jobId: string;
  status: JobStatus;
  estimatedCompletionDate: Date;
  queuePosition: number;
}

export class LimsClient {
  // Retry logic with exponential backoff
  // Circuit breaker for API failures
  // Request/response logging
  // Type-safe methods for all endpoints
  // Contract test infrastructure
}
```

**Includes**:
- Type-safe API client with retry semantics
- Circuit breaker pattern for resilience
- Request validation before sending
- Response schema validation with Zod
- Comprehensive error handling
- Health check utilities
- Contract test factory
- Event serialization for audit trails

**Implementation Steps**:
1. Create `packages/` directory structure
2. Set up TypeScript monorepo with workspace configuration
3. Implement LimsClient class with retry/circuit breaker
4. Add Zod schemas for all LIMS payloads
5. Write contract tests for LIMS API
6. Document API contract with examples
7. Set up npm workspace for shared publishing

### 0.4 Create Auth Service Integration

**Current State**: Using Replit Auth + local email auth  
**Target State**: AWS Cognito or Auth0 with thin adapter

**Migration Plan**:
1. **Set Up Auth Provider**
   ```bash
   # AWS Cognito setup
   - Create User Pool in AWS
   - Configure OpenID Connect scopes
   - Set up federation for social login (optional)
   - Configure MFA policies
   ```

2. **Build Auth Adapter Service**
   ```typescript
   // server/services/AuthService.ts
   export class AuthService {
     // Extract role claims from token
     // Map external roles to ILS roles
     // Handle tenant scoping
     // Validate token signatures
     // Refresh token management
   }
   ```

3. **Update Session Management**
   - Keep Express sessions for backward compatibility
   - Add support for JWT tokens
   - Implement token refresh logic
   - Store claims in session context

4. **Migrate Existing Users**
   - Create migration script to seed external auth provider
   - Map existing local auth to new system
   - Test rollback procedure

---

## Phase 1: MVP Internal (Months 4-6)

### 1.1 Implement Order Service with LIMS Validation

**Flow 1 - Order Submission** (Real-time LIMS validation):

```typescript
// server/services/OrderService.ts
export class OrderService {
  async submitOrder(orderData: OrderSubmissionRequest): Promise<Order> {
    // 1. Validate against LIMS rules in real-time
    const validationResult = await this.limsClient.validateConfiguration({
      prescription: orderData.prescription,
      lensType: orderData.lensType,
      coating: orderData.coating,
      frameType: orderData.frameType,
    });

    if (!validationResult.isValid) {
      throw new ValidationError(validationResult.errors);
    }

    // 2. Create order in local database
    const order = await storage.createOrder(orderData);

    // 3. Emit CreateJob payload to LIMS
    const limsJob = await this.limsClient.createJob({
      ecpId: orderData.ecpId,
      patientId: orderData.patientId,
      prescription: orderData.prescription,
      frameSpecs: orderData.frameSpecs,
      lensType: orderData.lensType,
      coating: orderData.coating,
      urgency: orderData.urgency || 'standard',
    });

    // 4. Store job_id and update order state to "Order Sent to Lab"
    order.jobId = limsJob.jobId;
    order.status = 'in_production';
    order.sentToLabAt = new Date();
    await storage.updateOrder(order);

    // 5. Emit OrderCreated event for analytics
    await events.publish({
      type: 'order.created',
      orderId: order.id,
      jobId: limsJob.jobId,
      timestamp: new Date(),
      metadata: { ecpId: orderData.ecpId },
    });

    return order;
  }
}
```

**Implementation Steps**:
1. Add `jobId` and `jobStatus` fields to orders table
2. Implement Order Service class
3. Update API endpoint `/api/orders` POST to use OrderService
4. Add LIMS client error handling
5. Implement order validation against LIMS rules
6. Add logging for LIMS integration points
7. Write integration tests

### 1.2 Build SPA with Basic Order Submission

**Update existing UI**:
- Modify `/new-order` to call Order Service
- Add validation feedback from LIMS
- Show job queue position to user
- Add order status tracking

### 1.3 Set Up Event System

**Event Architecture**:
```typescript
// shared/events.ts
export interface Event {
  id: string;
  type: string;
  version: number;
  aggregateId: string;
  aggregateType: string;
  timestamp: Date;
  data: Record<string, any>;
  metadata: Record<string, any>;
}

// Event types
export const EventTypes = {
  ORDER_CREATED: 'order.created',
  ORDER_STATUS_CHANGED: 'order.status_changed',
  JOB_CREATED: 'job.created',
  QUALITY_ISSUE_DETECTED: 'quality_issue.detected',
} as const;
```

**Event Publisher** (simple in-process for MVP):
```typescript
// server/services/EventPublisher.ts
export class EventPublisher {
  async publish(event: Event): Promise<void> {
    // Store event in database
    // Notify subscribers (webhook handlers)
    // Log to analytics pipeline
  }
}
```

---

## Phase 2: MVP ECP (Months 7-12)

### 2.1 Implement LIMS Webhook Handler (Flow 2)

**Webhook Handler Service**:
```typescript
// server/services/WebhookService.ts
export class WebhookService {
  async handleLimsStatusUpdate(payload: LimsStatusUpdatePayload): Promise<void> {
    // 1. Validate webhook signature (HMAC-SHA256)
    const isValid = this.validateSignature(payload, signature);
    if (!isValid) throw new UnauthorizedError('Invalid webhook signature');

    // 2. Fetch local order by jobId
    const order = await storage.getOrderByJobId(payload.jobId);
    if (!order) {
      log.warn(`Received webhook for unknown job: ${payload.jobId}`);
      return;
    }

    // 3. Map LIMS status to ILS order status
    const newStatus = this.mapLimsStatusToOrderStatus(payload.status);

    // 4. Update order if status changed
    if (newStatus !== order.status) {
      order.status = newStatus;
      order.statusUpdatedAt = new Date();
      await storage.updateOrder(order);

      // 5. Push live update to SPA via WebSocket
      await this.notificationService.broadcastOrderStatusUpdate({
        orderId: order.id,
        newStatus: newStatus,
        updatedAt: new Date(),
      });

      // 6. Emit OrderStatusChanged event
      await events.publish({
        type: 'order.status_changed',
        orderId: order.id,
        previousStatus: order.status,
        newStatus: newStatus,
        jobId: payload.jobId,
        timestamp: new Date(),
      });

      // 7. Trigger downstream notifications
      if (newStatus === 'shipped') {
        await this.emailService.sendOrderShippedNotification(order);
      }
    }
  }
}
```

**Implementation Steps**:
1. Create webhook endpoint: `POST /api/webhooks/lims-status`
2. Add webhook signature validation
3. Implement WebhookService class
4. Set up WebSocket server for real-time updates
5. Update SPA to subscribe to order status WebSocket
6. Add webhook retry logic (exponential backoff)
7. Add webhook logging and monitoring

### 2.2 Launch POS Service (Order Till)

**POS Service Architecture**:
```typescript
// server/services/PosService.ts
export class PosService {
  async createTransaction(request: TransactionRequest): Promise<Transaction> {
    // 1. Validate order totals against LIMS pricing rules
    // 2. Initialize Stripe session
    // 3. Record transaction in DynamoDB ledger
    // 4. Return payment intent
  }

  async recordPaymentCallback(event: StripeWebhookEvent): Promise<void> {
    // 1. Validate webhook signature
    // 2. Update transaction status in DynamoDB
    // 3. Trigger payout processing
    // 4. Emit PaymentProcessed event
  }
}
```

**Database Setup**:
- DynamoDB table: `transactions`
  - Primary key: `transactionId`
  - Sort key: `timestamp`
  - Indexes: `ecpId-status`, `status-timestamp`

**Integration Steps**:
1. Create AWS DynamoDB table
2. Set up Stripe Connect account
3. Implement POS Service with Stripe integration
4. Create payment endpoints
5. Handle Stripe webhooks
6. Add transaction reconciliation
7. Implement payout scheduling

### 2.3 Launch Billing Service

**Billing Service**:
```typescript
// server/services/BillingService.ts
export class BillingService {
  async handleStripeWebhook(event: StripeEvent): Promise<void> {
    // 1. Validate webhook signature
    // 2. Based on event type:
    //    - charge.succeeded: Generate invoice PDF
    //    - charge.failed: Send retry notification
    //    - payout.paid: Send payment confirmation
    // 3. Store event in database for audit
    // 4. Trigger email notifications
  }

  async generateInvoicePdf(transaction: Transaction): Promise<Buffer> {
    // Use existing pdfService
    // Enhanced with line items, tax, discount information
  }
}
```

**Webhook Setup**:
1. Configure Stripe webhook endpoint
2. Implement webhook event handler
3. Add webhook validation
4. Set up event processing queue (optional: Bull for async processing)

---

## Phase 3: All-in-One Platform (Months 12-18)

### 3.1 Ship Practice Service

**Practice Service**:
```typescript
// server/services/PracticeService.ts
export interface Practice {
  id: string;
  name: string;
  licenseNumber: string;
  primaryPhysician: string;
  address: Address;
  contactEmail: string;
  contactPhone: string;
  staffRoster: Staff[];
  supplierRegistry: Supplier[];
  settings: PracticeSettings;
  createdAt: Date;
}

export class PracticeService {
  async getPracticeProfile(ecpId: string): Promise<Practice> {
    // Return practice metadata
  }

  async updatePracticeProfile(
    ecpId: string,
    updates: Partial<Practice>
  ): Promise<Practice> {
    // Update practice information
  }

  async manageStaffRoster(practiceId: string): Promise<Staff[]> {
    // CRUD operations for staff members
  }

  async manageSupplierRegistry(practiceId: string): Promise<Supplier[]> {
    // Manage preferred suppliers
  }
}
```

**Database Tables**:
- `practices`: Core practice information
- `practice_staff`: Staff roster with roles
- `practice_suppliers`: Preferred supplier relationships

### 3.2 Ship Supplier Service

**Supplier Service**:
```typescript
// server/services/SupplierService.ts
export class SupplierService {
  async generatePurchaseOrder(
    supplierId: string,
    items: OrderItem[],
    practiceData: Practice
  ): Promise<PurchaseOrder> {
    // 1. Validate items availability
    // 2. Calculate totals
    // 3. Generate PO document
    // 4. Create database record
    // 5. Send to supplier
  }

  async trackDelivery(poId: string): Promise<DeliveryStatus> {
    // Query supplier tracking system
    // Update local delivery status
  }
}
```

### 3.3 Implement OTC Till

- Point-of-sale interface for over-the-counter sales
- Integrate with POS Service and Stripe Connect
- Add inventory tracking for retail items

---

## Phase 4: Innovation Loop (Ongoing)

### 4.1 Flow 3 - Catalog Innovation

**Catalog Update Flow**:
```typescript
// When Principal Engineer publishes new rules in LIMS:
// 1. LIMS triggers webhook: POST /api/webhooks/lims-catalog-update
// 2. Order Service receives notification
// 3. Activates new catalog entries in order form
// 4. SPA receives updated catalog via WebSocket
// 5. ECPs see new options instantly (zero-lag distribution)

export class CatalogService {
  async handleCatalogUpdate(payload: CatalogUpdatePayload): Promise<void> {
    // 1. Fetch latest rules from LIMS
    const rules = await this.limsClient.fetchRules(payload.rulesVersion);

    // 2. Transform rules into catalog entries
    const catalog = this.transformRulesToCatalog(rules);

    // 3. Store in cache (Redis recommended)
    await this.cache.set(`catalog:v${payload.rulesVersion}`, catalog);

    // 4. Broadcast to all connected clients
    await this.notificationService.broadcastCatalogUpdate(catalog);

    // 5. Emit CatalogUpdated event
    await events.publish({
      type: 'catalog.updated',
      rulesVersion: payload.rulesVersion,
      timestamp: new Date(),
    });
  }
}
```

### 4.2 Principal Engineer Dashboard

**Dashboard Features**:
```typescript
// server/services/EngineeringDashboardService.ts
export interface DashboardMetrics {
  failureRates: Map<string, number>;        // By lens type, material, etc.
  orderingTrends: OrderTrend[];              // Volume over time
  qualityIssues: QualityIssue[];             // Recent issues
  productionBottlenecks: Bottleneck[];       // Where orders are stuck
  rdOpportunities: RdOpportunity[];          // Innovation signals
}

export class EngineeringDashboardService {
  async getMetrics(timeRange: TimeRange): Promise<DashboardMetrics> {
    // 1. Query analytics events database
    // 2. Query quality issues
    // 3. Query LIMS telemetry
    // 4. Compute failure rates and trends
    // 5. Identify bottlenecks and opportunities
    return metrics;
  }
}
```

**Frontend Dashboard** (React):
- Real-time production metrics
- Quality issue tracking and trending
- Order volume and velocity charts
- Failure analysis by manufacturing stage
- R&D opportunity recommendations
- Rule deployment history and audit trail

### 4.3 Analytics & Reporting

**Analytics Pipeline**:
1. Events published by services → Event store (PostgreSQL)
2. Analytics workers process events → Aggregations table
3. Dashboard queries aggregations for display
4. Export capabilities (CSV, PDF reports)

---

## Infrastructure Setup

### AWS Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Route 53 (DNS)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              API Gateway (REST)                             │
│              - Rate limiting                                │
│              - CORS configuration                           │
│              - Authorization                                │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼──────────┐ ┌──▼────────────┐ ┌──▼────────────┐
    │  Auth Service │ │ Order Service │ │ POS Service  │
    │  (Container)  │ │  (Container)  │ │ (Container)  │
    └────┬──────────┘ └──┬────────────┘ └──┬────────────┘
         │                │                  │
    ┌────┴────────────────┼──────────────────┴─────┐
    │                     │                        │
┌───▼────────────────┐ ┌──▼────────────────────┐  │
│   RDS Postgres     │ │   ElastiCache Redis   │  │
│  - Core database   │ │  - Session storage    │  │
│  - User data       │ │  - Catalog cache      │  │
│  - Orders          │ │  - Rate limiting      │  │
└────────────────────┘ └───────────────────────┘  │
                                                    │
                                          ┌─────────▼──────┐
                                          │   DynamoDB     │
                                          │ - Transactions │
                                          │ - Ledger       │
                                          └────────────────┘
         │
    ┌────▼──────────────┐
    │  S3 Buckets       │
    │  - OMA files      │
    │  - PDFs           │
    │  - Documents      │
    └───────────────────┘
```

### Kubernetes Configuration

```yaml
# EKS Cluster Setup
- Cluster version: 1.29+
- Node groups: Autoscaling (2-10 nodes)
- Add-ons:
  - EBS CSI Driver (for persistent volumes)
  - VPC CNI Plugin
  - CoreDNS
  - kube-proxy

# Namespaces
- production: Live services
- staging: Pre-production testing
- monitoring: Observability stack (Prometheus, Grafana)
- ingress: NGINX Ingress Controller
```

### Deployment Strategy

1. **Containerization**: Each service in its own Docker image
2. **Registry**: AWS ECR (Elastic Container Registry)
3. **CI/CD**: GitHub Actions
   - Build on push to main
   - Run tests
   - Build and push Docker image
   - Deploy to staging
   - Smoke tests
   - Promote to production (manual approval)
4. **Rollout**: Blue-green deployments for zero-downtime updates

---

## Development & Testing

### Unit Testing

- Jest for all services
- >80% code coverage target
- Mock LIMS client for service tests

### Integration Testing

- Docker Compose environment for local testing
- Test harness with real PostgreSQL + Redis
- Contract tests for LIMS API integration

### End-to-End Testing

- Selenium or Playwright for UI automation
- Test flows: Order submission → Status updates → Payment
- Run against staging environment

### Load Testing

- k6 or Apache JMeter
- Target: 1000 concurrent orders
- Monitor response times, error rates
- Stress test LIMS webhook handler

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code review completed
- [ ] Security scan passed (OWASP, dependency scan)
- [ ] Database migrations tested
- [ ] Rollback procedure documented and tested
- [ ] Monitoring alerts configured

### Deployment
- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Get approval from Principal Engineer
- [ ] Deploy to production (off-peak hours recommended)
- [ ] Monitor error rates and latency
- [ ] Verify LIMS integration
- [ ] Verify webhook handlers working
- [ ] Spot-check a few live orders

### Post-Deployment
- [ ] Monitor for 24-48 hours
- [ ] Verify analytics events flowing correctly
- [ ] Check performance metrics
- [ ] Gather stakeholder feedback
- [ ] Document any issues or learnings

---

## Environment Variables

### Production Secrets
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
DYNAMODB_TABLE_TRANSACTIONS=...
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

LIMS_API_BASE_URL=https://lims.company.com/api
LIMS_API_KEY=...
LIMS_WEBHOOK_SECRET=...

AUTH_PROVIDER=cognito | auth0
COGNITO_USER_POOL_ID=...
COGNITO_CLIENT_ID=...

STRIPE_API_KEY=...
STRIPE_WEBHOOK_SECRET=...

SENDGRID_API_KEY=... # or RESEND_API_KEY
SESSION_SECRET=...
ADMIN_SETUP_KEY=...
```

---

## Success Metrics

### Technical
- P99 latency: <500ms for all API endpoints
- Error rate: <0.1%
- LIMS integration uptime: 99.95%
- Webhook delivery: 99.99% (with retries)
- Deployment frequency: Multiple per day
- Lead time for changes: <1 hour
- Change failure rate: <10%
- Mean time to recovery: <15 minutes

### Business
- Order submission to LIMS: <2 minutes
- Status update propagation: <1 second
- User adoption: >80% of ECPs active within 30 days
- Reduction in manual order entry: 90%
- Improvement in order accuracy: 99%+
- Cost savings vs. legacy system: >40%

---

## Next Steps

1. **Immediately**:
   - [ ] Hire Principal Engineer
   - [ ] Review this implementation guide
   - [ ] Create AWS account and set up initial resources

2. **Week 1-2**:
   - [ ] Select LIMS platform
   - [ ] Begin LIMS API integration planning
   - [ ] Set up AWS infrastructure foundation

3. **Week 3-4**:
   - [ ] Stand up LIMS instance
   - [ ] Begin shared LIMS client package development
   - [ ] Create service scaffolding

4. **Month 2-3**:
   - [ ] Complete LIMS Client Package
   - [ ] Implement Order Service with LIMS validation
   - [ ] Set up basic webhook handler
   - [ ] Containerize services

5. **Month 4+**:
   - [ ] Deploy to AWS EKS
   - [ ] Complete Phase 1 (MVP Internal)
   - [ ] Begin Phase 2 (MVP ECP)

---

## References

- **Architecture Strategy**: `docs/architecture.md`
- **Current Implementation**: `PROJECT_OVERVIEW.txt`
- **AWS EKS Best Practices**: https://docs.aws.amazon.com/eks/latest/userguide/best-practices.html
- **Drizzle ORM**: https://orm.drizzle.team/
- **Fastify**: https://www.fastify.io/
- **TanStack Query**: https://tanstack.com/query/

---

**Document maintained by**: Architecture Team  
**Last updated**: October 28, 2025  
**Next review**: November 28, 2025
