# EventBus Usage Guide

## Quick Start: Publishing Events

The EventBus is now integrated into your server. Here's how to use it:

### 1. Import EventBus

```typescript
import { EventBus } from '../events';
```

### 2. Publish Events

```typescript
await EventBus.publish('order.created', {
  orderId: order.id,
  userId: req.user.id,
  companyId: req.user.companyId,
  patientId: order.patientId,
  total: order.total,
  items: order.items.length,
  status: order.status
});
```

## Complete Integration Example

### Example: Order Creation Route

```typescript
// server/routes/pos.ts (or wherever you handle orders)
import { Router } from 'express';
import { db } from '../db';
import { orders } from '../../shared/schema';
import { EventBus } from '../events';

const router = Router();

router.post('/orders', async (req, res) => {
  try {
    // Create the order
    const [order] = await db.insert(orders).values({
      id: generateId(),
      userId: req.user.id,
      companyId: req.user.companyId,
      patientId: req.body.patientId,
      total: req.body.total,
      status: 'pending',
      // ... other fields
    }).returning();

    // Publish event - handlers run automatically in background
    await EventBus.publish('order.created', {
      orderId: order.id,
      userId: req.user.id,
      companyId: req.user.companyId,
      patientId: order.patientId,
      total: order.total,
      items: req.body.items.length,
      status: order.status
    });

    // Return immediately - don't wait for emails/notifications
    res.json({ success: true, order });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## What Happens When You Publish?

When you call `EventBus.publish('order.created', data)`, the system automatically:

1. **Stores the event** in the `event_log` table (for history/replay)
2. **Triggers email handler** → Queues order confirmation email (Chunk 8 queue system)
3. **Triggers notification handler** → Creates in-app notification
4. **Triggers metrics handler** → Records analytics
5. **Triggers audit handler** → Logs security event
6. **Triggers webhook handler** → Sends to subscribed external systems
7. **Triggers WebSocket handler** → Broadcasts real-time update to UI

**All handlers run in parallel and don't block your API response!**

## Available Event Types

### Order Events

```typescript
// Order created
await EventBus.publish('order.created', {
  orderId, userId, companyId, patientId, total, items, status
});

// Order updated
await EventBus.publish('order.updated', {
  orderId, userId, companyId,
  changes: [{ field: 'status', oldValue: 'pending', newValue: 'processing' }]
});

// Order shipped
await EventBus.publish('order.shipped', {
  orderId, userId, companyId,
  trackingNumber: 'TRACK123',
  carrier: 'UPS',
  estimatedDelivery: new Date('2025-11-10')
});

// Order delivered
await EventBus.publish('order.delivered', {
  orderId, userId, companyId,
  deliveredAt: new Date()
});

// Order cancelled
await EventBus.publish('order.cancelled', {
  orderId, userId, companyId,
  reason: 'Customer request',
  refundAmount: 150.00
});
```

### User Events

```typescript
// User created
await EventBus.publish('user.created', {
  userId, companyId, email, role
});

// User login
await EventBus.publish('user.login', {
  userId, companyId, ipAddress: req.ip, userAgent: req.headers['user-agent']
});

// User logout
await EventBus.publish('user.logout', {
  userId, companyId
});
```

### Inventory Events

```typescript
// Low stock alert
await EventBus.publish('product.low_stock', {
  productId, companyId, currentStock: 5, threshold: 10
});

// Out of stock alert
await EventBus.publish('product.out_of_stock', {
  productId, companyId, lastStockDate: new Date()
});
```

### AI Events

```typescript
// Daily briefing generated
await EventBus.publish('ai.briefing_generated', {
  userId, companyId, briefingId, date: new Date()
});

// Anomaly detected
await EventBus.publish('ai.anomaly_detected', {
  companyId, type: 'high_error_rate', severity: 'high',
  description: 'Error rate increased 300% in last hour',
  data: { errorRate: 0.15, baseline: 0.05 }
});
```

### Payment Events

```typescript
// Payment successful
await EventBus.publish('payment.success', {
  orderId, userId, companyId, amount: 150.00,
  paymentMethod: 'credit_card', transactionId: 'txn_123'
});

// Payment failed
await EventBus.publish('payment.failed', {
  orderId, userId, companyId, amount: 150.00,
  paymentMethod: 'credit_card', reason: 'Insufficient funds'
});
```

### Marketplace Events

```typescript
// Connection requested
await EventBus.publish('marketplace.connection_requested', {
  requesterId, targetId, message: 'Would like to connect'
});

// Connection approved
await EventBus.publish('marketplace.connection_approved', {
  requesterId, targetId
});
```

## Performance Benefits

### Before (Synchronous)
```typescript
// Total time: ~2700ms
await sendOrderConfirmationEmail(order);  // 600ms
await createNotification(order);          // 100ms
await updateMetrics(order);               // 50ms
await sendToExternalWebhook(order);       // 2000ms
res.json({ order });  // User waits 2.7 seconds!
```

### After (Event-Driven)
```typescript
// Total time: ~10ms
await EventBus.publish('order.created', orderData);  // 5-10ms
res.json({ order });  // User gets response immediately!
// All handlers run in background
```

**Result: 50-200x faster API responses!**

## Querying Event History

```typescript
import { EventBus } from '../events';

// Get all order events for a company
const events = await EventBus.getEvents({
  types: ['order.created', 'order.shipped', 'order.delivered'],
  companyId: company.id,
  limit: 100
});

// Get events for a specific user
const userEvents = await EventBus.getEvents({
  userId: user.id,
  startDate: new Date('2025-11-01'),
  endDate: new Date('2025-11-30')
});

// Get event statistics
const stats = await EventBus.getEventStats(
  new Date('2025-11-01'),
  new Date('2025-11-30')
);
// Returns: { 'order.created': 45, 'order.shipped': 32, ... }
```

## Monitoring Endpoints

### Query Events
```bash
GET /api/events?type=order.created&companyId=abc123&limit=50
```

### Get Statistics
```bash
GET /api/events/stats?startDate=2025-11-01&endDate=2025-11-30
```

### Replay Events (Admin Only)
```bash
POST /api/events/replay
{
  "eventIds": ["evt_123", "evt_456"]
}
```

### Manage Webhooks
```bash
# List webhooks
GET /api/events/webhooks

# Register webhook
POST /api/events/webhooks
{
  "url": "https://external-system.com/webhook",
  "events": ["order.created", "order.shipped"],
  "secret": "webhook-signing-secret"
}

# Delete webhook
DELETE /api/events/webhooks/:id
```

### WebSocket Stats
```bash
GET /api/events/websocket/stats
```

## Migration Strategy

### Step 1: Add Events Without Removing Old Code

```typescript
router.post('/orders', async (req, res) => {
  const order = await createOrder(req.body);
  
  // Keep existing email/notification code for now
  await sendOrderConfirmationEmail(order);
  await createNotification(order);
  
  // Add event publishing (handlers will run in parallel)
  await EventBus.publish('order.created', {
    orderId: order.id,
    userId: req.user.id,
    companyId: req.user.companyId,
    total: order.total,
    items: order.items.length,
    status: order.status
  });
  
  res.json({ order });
});
```

### Step 2: Remove Old Code After Testing

```typescript
router.post('/orders', async (req, res) => {
  const order = await createOrder(req.body);
  
  // Old code removed - event handlers handle everything now
  await EventBus.publish('order.created', {
    orderId: order.id,
    userId: req.user.id,
    companyId: req.user.companyId,
    total: order.total,
    items: order.items.length,
    status: order.status
  });
  
  res.json({ order });
});
```

## Type Safety

All event types are strongly typed. TypeScript will catch errors:

```typescript
// ✅ Correct
await EventBus.publish('order.created', {
  orderId: order.id,
  userId: req.user.id,
  companyId: req.user.companyId,
  total: order.total,
  items: order.items.length,
  status: order.status
});

// ❌ TypeScript error - missing required fields
await EventBus.publish('order.created', {
  orderId: order.id
  // Error: Missing userId, companyId, total, items, status
});

// ❌ TypeScript error - wrong type
await EventBus.publish('order.created', {
  orderId: order.id,
  userId: req.user.id,
  companyId: req.user.companyId,
  total: "invalid", // Error: total must be number
  items: order.items.length,
  status: order.status
});
```

## Testing Events

```typescript
// In your tests
import { EventBus } from '../events';

describe('Order creation', () => {
  it('should publish order.created event', async () => {
    const events = [];
    
    // Subscribe to events in test
    EventBus.subscribe('order.created', (data) => {
      events.push(data);
    });
    
    // Create order
    const response = await request(app)
      .post('/api/orders')
      .send(orderData);
    
    // Verify event was published
    expect(events).toHaveLength(1);
    expect(events[0].orderId).toBe(response.body.order.id);
  });
});
```

## Best Practices

1. **Always include userId and companyId** for proper routing and security
2. **Publish events after successful database operations** (inside try/catch)
3. **Use specific event types** rather than generic ones
4. **Include enough context** in event data for handlers to work independently
5. **Don't wait for event handlers** - let them run in background
6. **Log event publishing failures** but don't block the main operation

## Next Steps

1. Identify routes that send emails/notifications/webhooks
2. Add `EventBus.publish()` calls to those routes
3. Test that handlers execute correctly
4. Monitor event logs via `/api/events` endpoints
5. Gradually remove old synchronous code

The event system is now fully operational and ready to use! 🚀
