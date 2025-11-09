# Phase 1 Integration Guide

## Quick Start: Using the Order Service

### Basic Order Submission

```typescript
import { OrderService } from "./services/OrderService";
import { storage } from "./storage";

// Initialize the service
const orderService = new OrderService(limsClient, storage, {
  enableLimsValidation: true
});

// Submit an order
const order = await orderService.submitOrder({
  patientId: "patient-123",
  ecpId: "ecp-456",
  lensType: "progressive",
  lensMaterial: "polycarbonate",
  coating: "anti-glare",
  frameType: "full-rim",
  odSphere: "-2.0",
  odCylinder: "-0.5",
  odAxis: "180",
  odAdd: "1.5",
  osSphere: "-1.75",
  osCylinder: "-0.25",
  osAxis: "180",
  osAdd: "1.5",
  pd: "65",
  orderNumber: "ORD-20250101-001"
}, "ecp-456");

console.log(`Order created with job ID: ${order.jobId}`);
console.log(`Status: ${order.jobStatus}`);
console.log(`Submitted at: ${order.sentToLabAt}`);
```

### Polling for Order Status

```typescript
// Get current status from LIMS
const status = await orderService.getOrderStatus("order-123");

if (status) {
  console.log(`Job ID: ${status.jobId}`);
  console.log(`Status: ${status.status}`);
  console.log(`Progress: ${status.progress}%`);
} else {
  console.log("Order not found or not submitted to LIMS");
}
```

### Health Check

```typescript
// Check LIMS connectivity
const isHealthy = await orderService.healthCheck();
console.log(`LIMS status: ${isHealthy ? "healthy" : "unavailable"}`);
```

---

## Database Schema Changes

### New Order Fields

All new fields are nullable to support backwards compatibility:

```sql
ALTER TABLE orders ADD COLUMN job_id VARCHAR;
ALTER TABLE orders ADD COLUMN job_status VARCHAR;
ALTER TABLE orders ADD COLUMN sent_to_lab_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN job_error_message TEXT;
```

### Query Examples

```typescript
// Get all orders waiting for LIMS processing
const pendingOrders = db
  .select()
  .from(orders)
  .where(and(
    eq(orders.status, "pending"),
    isNull(orders.jobId)
  ));

// Get orders processed by LIMS
const limsOrders = db
  .select()
  .from(orders)
  .where(isNotNull(orders.jobId));

// Find failed submissions
const failedOrders = db
  .select()
  .from(orders)
  .where(isNotNull(orders.jobErrorMessage));
```

---

## Webhook Configuration

### LIMS Webhook URL

Configure in your LIMS system:

```
POST https://your-domain.com/api/webhooks/lims-status
```

### Required Headers

LIMS must send:
- `X-LIMS-Signature`: HMAC-SHA256 signature of request body
- `Content-Type: application/json`

### Webhook Payload Format

```json
{
  "jobId": "job-uuid-from-lims",
  "jobStatus": "completed",
  "orderId": "order-uuid-local",
  "progress": 100,
  "estimatedCompletion": "2025-01-15T14:30:00Z",
  "errorMessage": null,
  "metadata": {
    "completionTime": "2 hours 15 minutes",
    "qualityScore": 98.5
  }
}
```

### Signature Generation (LIMS Side)

```python
import hmac
import hashlib
import json

payload = json.dumps(webhook_data)
secret = os.getenv('LIMS_WEBHOOK_SECRET')
signature = hmac.new(
  secret.encode(),
  payload.encode(),
  hashlib.sha256
).hexdigest()

headers = {
  'X-LIMS-Signature': signature,
  'Content-Type': 'application/json'
}

requests.post(
  'https://your-domain.com/api/webhooks/lims-status',
  json=webhook_data,
  headers=headers
)
```

---

## Error Handling

### Order Submission Errors

```typescript
try {
  const order = await orderService.submitOrder(orderData, ecpId);
} catch (error) {
  if (error.message.includes("Configuration validation failed")) {
    // LIMS rejected the configuration
    console.error("Invalid lens configuration");
  } else if (error.message.includes("Failed to update order")) {
    // Database update failed - order may be partially created
    console.error("Database error - manual review required");
  } else {
    // Unknown error
    console.error("Order submission failed:", error.message);
  }
}
```

### Webhook Processing Errors

Webhook errors are logged but don't cause HTTP errors. Check logs:

```bash
# View webhook processing logs
LOG_LEVEL=debug npm run dev | grep "WebhookService"

# For production
tail -f /var/log/ils/webhook.log
```

---

## Monitoring & Observability

### Key Metrics

**OrderService**
- `order_submission_duration_ms` - Time to submit order
- `order_submission_success_rate` - Successful submissions
- `lims_validation_errors` - Configuration validation failures
- `lims_submission_errors` - LIMS API errors

**WebhookService**
- `webhook_processing_duration_ms` - Time to process webhook
- `webhook_signature_failures` - Invalid signatures
- `webhook_status_update_failures` - Update failures

### Log Examples

```
[OrderService:INFO] Submitting order to LIMS {orderNumber: "ORD-001", ecpId: "ecp-123"}
[OrderService:DEBUG] Order created locally {orderId: "order-uuid"}
[OrderService:INFO] Order submitted to LIMS {orderId: "order-uuid", jobId: "job-uuid"}
[WebhookService:INFO] Processing LIMS webhook status update {jobId: "job-uuid", jobStatus: "completed", orderId: "order-uuid"}
[WebhookService:INFO] Order status updated from webhook {orderId: "order-uuid", newStatus: "completed", limsStatus: "completed"}
```

---

## Testing

### Unit Tests

```typescript
import { OrderService } from "./services/OrderService";

describe("OrderService", () => {
  let orderService: OrderService;
  let mockLimsClient: LimsClientInterface;
  let mockStorage: IStorage;

  beforeEach(() => {
    mockLimsClient = {
      createJob: jest.fn().mockResolvedValue({
        jobId: "job-123",
        status: "accepted",
        createdAt: new Date().toISOString()
      }),
      getJobStatus: jest.fn(),
      validateConfiguration: jest.fn().mockResolvedValue({
        valid: true,
        rules: {}
      }),
      healthCheck: jest.fn().mockResolvedValue(true)
    };

    mockStorage = {
      createOrder: jest.fn(),
      updateOrderWithLimsJob: jest.fn(),
      // ... other mock methods
    };

    orderService = new OrderService(mockLimsClient, mockStorage);
  });

  test("submitOrder validates configuration", async () => {
    await orderService.submitOrder(orderData, "ecp-123");
    expect(mockLimsClient.validateConfiguration).toHaveBeenCalled();
  });

  test("submitOrder stores job ID", async () => {
    await orderService.submitOrder(orderData, "ecp-123");
    expect(mockStorage.updateOrderWithLimsJob).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        jobId: "job-123"
      })
    );
  });
});
```

### Integration Tests

```typescript
// Test with real database and mock LIMS
describe("Order Submission Integration", () => {
  test("full order submission flow", async () => {
    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send(testOrderData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("jobId");
    expect(response.body.status).toBe("in_production");

    // Verify database state
    const order = await storage.getOrder(response.body.id);
    expect(order.jobId).toBeDefined();
    expect(order.sentToLabAt).toBeDefined();
  });
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Code review approved
- [ ] LIMS endpoint verified (staging or dev)
- [ ] `LIMS_WEBHOOK_SECRET` configured
- [ ] Database migrations tested
- [ ] Error monitoring configured (Sentry/DataDog)

### Deployment Steps

```bash
# 1. Run database migrations
npm run migrate

# 2. Deploy code
npm run build
npm run deploy

# 3. Verify endpoints
curl http://localhost:5000/health

# 4. Test order submission
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d @test-order.json

# 5. Monitor logs
tail -f logs/application.log
```

### Post-Deployment

- [ ] Monitor error rates in first hour
- [ ] Verify webhook processing in logs
- [ ] Test manual webhook with curl
- [ ] Check database for new order fields
- [ ] Verify LIMS job IDs stored correctly

---

## Troubleshooting

### Order Submission Fails

**Error: "Configuration validation failed"**
```
Solution: Check LIMS rules for lens type/material/coating combination
Debug: Enable debug logging to see validation response
```

**Error: "Failed to update order with LIMS job ID"**
```
Solution: Database may have constraint issues
Debug: Check order record exists with correct ID
```

**Error: LIMS timeout**
```
Solution: Check LIMS system status
Debug: Run healthCheck() to verify connectivity
```

### Webhook Issues

**Webhook returns 401 Unauthorized**
```
Solution: Signature verification failed
Debug: Verify LIMS_WEBHOOK_SECRET matches LIMS configuration
      Verify payload format matches exactly
      Check signature generation algorithm
```

**Webhook returns 400 Bad Request**
```
Solution: Missing or invalid fields in payload
Debug: Check webhook payload has all required fields
      Verify orderId exists in local database
      Verify jobId matches order.jobId
```

---

## Performance Considerations

### Connection Pooling

OrderService reuses LIMS client connection:
```typescript
// Good - reuses connection
const orderService = new OrderService(limsClient, storage);
const order1 = await orderService.submitOrder(...);
const order2 = await orderService.submitOrder(...);
```

### Batch Operations

For bulk order submission:
```typescript
// Process in batches to avoid overwhelming LIMS
const BATCH_SIZE = 10;
for (let i = 0; i < orders.length; i += BATCH_SIZE) {
  const batch = orders.slice(i, i + BATCH_SIZE);
  await Promise.all(
    batch.map(order => orderService.submitOrder(order, ecpId))
  );
  await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit
}
```

### Webhook Load

Webhook endpoint is stateless and can be load balanced:
```
HTTP Load Balancer
    ↓         ↓         ↓
[Pod1]    [Pod2]    [Pod3]
  ↓         ↓         ↓
    Database (with connection pooling)
```

---

## Security Considerations

### Webhook Signature Verification

Always verify signatures to prevent spoofed webhooks:
```typescript
// ✅ Correct - signature verified
if (!webhookService.verifyWebhookSignature(payload, signature)) {
  return res.status(401).json({ message: 'Invalid signature' });
}

// ❌ Wrong - no verification
await webhookService.handleStatusUpdate(payload); // Vulnerable!
```

### Secret Management

```bash
# ✅ Good - from environment
LIMS_WEBHOOK_SECRET=<secure-random-value>

# ❌ Bad - hardcoded
const secret = "my-secret"; // Don't do this!
```

### Order Access Control

Ensure users can only access their own orders:
```typescript
// ✅ Correct - user-scoped query
const order = await storage.getOrder(orderId);
if (order.ecp.id !== currentUser.id) {
  throw new Error("Unauthorized");
}

// ❌ Bad - no access control
const order = await storage.getOrder(orderId);
```

---

## Next Steps

1. **Phase 2**: Authentication Service integration
2. **Phase 3**: Microservices deployment to AWS EKS
3. **Phase 4**: Advanced features and analytics

For questions or issues, refer to:
- Main documentation: `IMPLEMENTATION_GUIDE.md`
- Architecture overview: `ARCHITECTURE_DELIVERABLES_SUMMARY.md`
- Visual diagrams: `ARCHITECTURE_VISUAL_SUMMARY.md`
