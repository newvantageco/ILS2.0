# Chunk 9: Event-Driven Architecture - Implementation Plan

**Date**: November 5, 2025  
**Status**: 🚀 Ready to Start  
**Estimated Time**: 12-16 hours  
**Complexity**: High  
**Business Impact**: 🔥🔥🔥 VERY HIGH

---

## 🎯 Overview

Transform the Integrated Lens System from a request-response architecture to an event-driven architecture, enabling real-time features, better scalability, and comprehensive audit trails.

### Why Event-Driven Architecture?

**Current Problems**:
- Tight coupling between components
- No audit trail of state changes
- Difficult to add new features without modifying existing code
- No real-time notifications
- Hard to debug complex workflows

**Event-Driven Benefits**:
- **Loose Coupling**: Components don't know about each other
- **Extensibility**: Add new features by subscribing to events
- **Audit Trail**: Every state change is recorded
- **Real-time Updates**: WebSocket notifications for live updates
- **Debugging**: Event replay shows exactly what happened
- **Scalability**: Distribute event processing across workers

---

## 📐 Architecture

### Event Flow
```
Action → Event Emitted → Event Bus → Event Handlers → Side Effects
                              ↓
                         Event Store (Audit)
                              ↓
                         WebSocket (Real-time)
                              ↓
                         Webhooks (External)
```

### Example: Order Creation
```typescript
1. User creates order via POST /api/orders
2. Order stored in database
3. Event emitted: OrderCreated { orderId, userId, companyId, total }
4. Event Bus distributes to handlers:
   ├─> Email Handler: Send confirmation email
   ├─> PDF Handler: Generate order sheet
   ├─> Notification Handler: Create in-app notification
   ├─> Metrics Handler: Update analytics
   ├─> Audit Handler: Log to event store
   ├─> WebSocket Handler: Notify connected clients
   └─> Webhook Handler: Send to external systems
5. Response sent to user (non-blocking)
```

---

## 🏗️ Components to Build

### 1. Event Bus Core (`/server/events/EventBus.ts`)

**Purpose**: Central message broker for publishing and subscribing to events

```typescript
import { EventEmitter } from 'events';
import { storage } from '../storage';

// Event types
export type EventType = 
  // Orders
  | 'order.created'
  | 'order.updated'
  | 'order.shipped'
  | 'order.delivered'
  | 'order.cancelled'
  
  // Users
  | 'user.created'
  | 'user.updated'
  | 'user.login'
  | 'user.logout'
  
  // Inventory
  | 'product.created'
  | 'product.updated'
  | 'product.low_stock'
  | 'product.out_of_stock'
  
  // AI
  | 'ai.briefing_generated'
  | 'ai.forecast_completed'
  | 'ai.anomaly_detected'
  
  // Marketplace
  | 'marketplace.connection_requested'
  | 'marketplace.connection_approved'
  | 'marketplace.connection_rejected';

// Event payload interface
export interface DomainEvent {
  id: string;                    // Unique event ID
  type: EventType;              // Event type
  timestamp: Date;              // When it happened
  userId?: string;              // Who triggered it
  companyId?: string;           // Which company
  data: Record<string, any>;    // Event-specific data
  metadata?: Record<string, any>; // Additional context
}

class EventBusClass extends EventEmitter {
  private eventStore: DomainEvent[] = [];
  private isRecording = true;

  // Publish an event
  async publish(type: EventType, data: Record<string, any>, metadata?: Record<string, any>): Promise<void> {
    const event: DomainEvent = {
      id: crypto.randomUUID(),
      type,
      timestamp: new Date(),
      userId: metadata?.userId,
      companyId: metadata?.companyId,
      data,
      metadata,
    };

    // Store for audit
    if (this.isRecording) {
      await this.storeEvent(event);
    }

    // Emit to all handlers
    this.emit(type, event);
    this.emit('*', event); // Wildcard for global handlers
    
    console.log(`📢 Event published: ${type}`, { eventId: event.id });
  }

  // Subscribe to event type
  subscribe(type: EventType | '*', handler: (event: DomainEvent) => void | Promise<void>): void {
    this.on(type, async (event: DomainEvent) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`❌ Event handler error for ${type}:`, error);
        // Optionally: publish error event
        await this.publish('system.error', {
          originalEvent: event,
          error: error.message,
        });
      }
    });
  }

  // Store event for audit trail
  private async storeEvent(event: DomainEvent): Promise<void> {
    try {
      // Store in memory (for development)
      this.eventStore.push(event);
      
      // Store in database (for production)
      await storage.db.insert(eventLog).values({
        id: event.id,
        type: event.type,
        userId: event.userId,
        companyId: event.companyId,
        data: event.data,
        metadata: event.metadata,
        timestamp: event.timestamp,
      });
    } catch (error) {
      console.error('Failed to store event:', error);
    }
  }

  // Get event history
  async getEvents(filter?: {
    type?: EventType;
    userId?: string;
    companyId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<DomainEvent[]> {
    // Query from database with filters
    return this.eventStore.filter(event => {
      if (filter?.type && event.type !== filter.type) return false;
      if (filter?.userId && event.userId !== filter.userId) return false;
      if (filter?.companyId && event.companyId !== filter.companyId) return false;
      if (filter?.startDate && event.timestamp < filter.startDate) return false;
      if (filter?.endDate && event.timestamp > filter.endDate) return false;
      return true;
    });
  }

  // Replay events (for debugging)
  async replayEvents(eventIds: string[]): Promise<void> {
    this.isRecording = false; // Don't record replayed events
    
    for (const id of eventIds) {
      const event = this.eventStore.find(e => e.id === id);
      if (event) {
        this.emit(event.type, event);
      }
    }
    
    this.isRecording = true;
  }
}

export const EventBus = new EventBusClass();
```

### 2. Event Definitions (`/server/events/events.ts`)

**Purpose**: Strongly-typed event definitions

```typescript
// Order Events
export interface OrderCreatedData {
  orderId: string;
  customerId: string;
  items: { productId: string; quantity: number }[];
  total: number;
  status: string;
}

export interface OrderShippedData {
  orderId: string;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: Date;
}

// User Events
export interface UserCreatedData {
  userId: string;
  email: string;
  role: string;
  companyId: string;
}

// Product Events
export interface ProductLowStockData {
  productId: string;
  currentStock: number;
  reorderPoint: number;
  productName: string;
}

// AI Events
export interface AnomalyDetectedData {
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
}

// Helper functions
export const createOrderEvent = (type: string, orderId: string, data: any) => ({
  type,
  data: { orderId, ...data },
});
```

### 3. Event Handlers (`/server/events/handlers/`)

**Purpose**: Business logic triggered by events

```typescript
// /server/events/handlers/emailHandler.ts
import { EventBus } from '../EventBus';
import { queueOrderConfirmationEmail, queueShipmentNotificationEmail } from '../../queue/helpers';

// Register email event handlers
export function registerEmailHandlers(): void {
  // Order confirmation
  EventBus.subscribe('order.created', async (event) => {
    const { orderId, userId } = event.data;
    await queueOrderConfirmationEmail(orderId, userId);
  });

  // Shipment notification
  EventBus.subscribe('order.shipped', async (event) => {
    const { orderId, userId, trackingNumber } = event.data;
    await queueShipmentNotificationEmail(orderId, userId, trackingNumber);
  });

  // Low stock alert
  EventBus.subscribe('product.low_stock', async (event) => {
    const { productName, currentStock } = event.data;
    // Send email to procurement team
  });

  console.log('✅ Email event handlers registered');
}

// /server/events/handlers/notificationHandler.ts
import { EventBus } from '../EventBus';
import { queueOrderNotification, queueSystemNotification } from '../../queue/helpers';

export function registerNotificationHandlers(): void {
  // Order status notifications
  EventBus.subscribe('order.created', async (event) => {
    const { orderId, userId } = event.data;
    await queueOrderNotification(userId, orderId, 'confirmed', 'Your order has been confirmed');
  });

  EventBus.subscribe('order.shipped', async (event) => {
    const { orderId, userId, trackingNumber } = event.data;
    await queueOrderNotification(userId, orderId, 'shipped', `Your order has shipped. Tracking: ${trackingNumber}`);
  });

  // AI insights
  EventBus.subscribe('ai.anomaly_detected', async (event) => {
    const { companyId, metric, severity } = event.data;
    const companyUsers = await getCompanyAdmins(companyId);
    
    for (const user of companyUsers) {
      await queueSystemNotification(
        user.id,
        `Anomaly Detected: ${metric}`,
        `Unusual ${metric} detected. Click to investigate.`,
        severity === 'high' ? 'urgent' : 'high',
        '/analytics/anomalies'
      );
    }
  });

  console.log('✅ Notification event handlers registered');
}

// /server/events/handlers/metricsHandler.ts
export function registerMetricsHandlers(): void {
  // Track order metrics
  EventBus.subscribe('order.created', async (event) => {
    // Increment order count
    // Update revenue metrics
  });

  // Track user activity
  EventBus.subscribe('user.login', async (event) => {
    // Increment active user count
  });

  console.log('✅ Metrics event handlers registered');
}

// /server/events/handlers/auditHandler.ts
export function registerAuditHandlers(): void {
  // Log all events for compliance
  EventBus.subscribe('*', async (event) => {
    // Events are already stored by EventBus
    // This handler can add additional audit logic
    if (isSecurityRelevant(event)) {
      await createAuditLog(event);
    }
  });

  console.log('✅ Audit event handlers registered');
}
```

### 4. Webhook System (`/server/events/webhooks/`)

**Purpose**: Send events to external systems

```typescript
// /server/events/webhooks/WebhookManager.ts
import axios from 'axios';
import { EventBus, DomainEvent } from '../EventBus';

interface WebhookSubscription {
  id: string;
  url: string;
  events: string[]; // Event types to send
  companyId: string;
  secret: string; // For HMAC signature
  active: boolean;
}

class WebhookManagerClass {
  private subscriptions: WebhookSubscription[] = [];

  // Register webhook for a company
  async register(companyId: string, url: string, events: string[], secret: string): Promise<string> {
    const subscription: WebhookSubscription = {
      id: crypto.randomUUID(),
      url,
      events,
      companyId,
      secret,
      active: true,
    };

    this.subscriptions.push(subscription);
    
    // Store in database
    await storage.db.insert(webhookSubscriptions).values(subscription);

    return subscription.id;
  }

  // Send event to webhooks
  async send(event: DomainEvent): Promise<void> {
    const relevantSubs = this.subscriptions.filter(sub => 
      sub.active &&
      sub.companyId === event.companyId &&
      (sub.events.includes(event.type) || sub.events.includes('*'))
    );

    for (const sub of relevantSubs) {
      try {
        const signature = this.generateSignature(event, sub.secret);
        
        await axios.post(sub.url, event, {
          headers: {
            'X-Webhook-Signature': signature,
            'X-Event-Type': event.type,
            'X-Event-Id': event.id,
          },
          timeout: 5000,
        });

        console.log(`✅ Webhook sent: ${event.type} to ${sub.url}`);
      } catch (error) {
        console.error(`❌ Webhook failed: ${sub.url}`, error.message);
        // Queue for retry
      }
    }
  }

  private generateSignature(event: DomainEvent, secret: string): string {
    const crypto = require('crypto');
    const payload = JSON.stringify(event);
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }
}

export const WebhookManager = new WebhookManagerClass();

// Register webhook handler
EventBus.subscribe('*', async (event) => {
  await WebhookManager.send(event);
});
```

### 5. WebSocket Integration (`/server/events/websocket/`)

**Purpose**: Real-time notifications to connected clients

```typescript
// /server/events/websocket/WebSocketBroadcaster.ts
import { EventBus, DomainEvent } from '../EventBus';
import { websocketService } from '../../websocket';

class WebSocketBroadcasterClass {
  // Broadcast event to user
  async broadcastToUser(userId: string, event: DomainEvent): Promise<void> {
    websocketService.sendToUser(userId, {
      type: 'event',
      event: event.type,
      data: event.data,
    });
  }

  // Broadcast event to company
  async broadcastToCompany(companyId: string, event: DomainEvent): Promise<void> {
    websocketService.sendToCompany(companyId, {
      type: 'event',
      event: event.type,
      data: event.data,
    });
  }

  // Broadcast to all
  async broadcastToAll(event: DomainEvent): Promise<void> {
    websocketService.broadcast({
      type: 'event',
      event: event.type,
      data: event.data,
    });
  }
}

export const WebSocketBroadcaster = new WebSocketBroadcasterClass();

// Register WebSocket handlers
export function registerWebSocketHandlers(): void {
  // Order updates
  EventBus.subscribe('order.created', async (event) => {
    await WebSocketBroadcaster.broadcastToUser(event.userId!, event);
  });

  EventBus.subscribe('order.updated', async (event) => {
    await WebSocketBroadcaster.broadcastToUser(event.userId!, event);
  });

  // Marketplace notifications
  EventBus.subscribe('marketplace.connection_requested', async (event) => {
    // Notify target company admins
    const targetCompanyId = event.data.targetCompanyId;
    await WebSocketBroadcaster.broadcastToCompany(targetCompanyId, event);
  });

  // AI insights
  EventBus.subscribe('ai.anomaly_detected', async (event) => {
    await WebSocketBroadcaster.broadcastToCompany(event.companyId!, event);
  });

  console.log('✅ WebSocket event handlers registered');
}
```

### 6. Database Schema

```sql
-- Event log table (audit trail)
CREATE TABLE event_log (
  id VARCHAR PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  user_id VARCHAR REFERENCES users(id),
  company_id VARCHAR REFERENCES companies(id),
  data JSONB NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_event_log_type ON event_log(type);
CREATE INDEX idx_event_log_user ON event_log(user_id);
CREATE INDEX idx_event_log_company ON event_log(company_id);
CREATE INDEX idx_event_log_timestamp ON event_log(timestamp DESC);

-- Webhook subscriptions
CREATE TABLE webhook_subscriptions (
  id VARCHAR PRIMARY KEY,
  company_id VARCHAR REFERENCES companies(id),
  url VARCHAR(500) NOT NULL,
  events TEXT[] NOT NULL, -- Array of event types
  secret VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhooks_company ON webhook_subscriptions(company_id);
CREATE INDEX idx_webhooks_active ON webhook_subscriptions(active) WHERE active = true;

-- Webhook delivery log
CREATE TABLE webhook_deliveries (
  id VARCHAR PRIMARY KEY,
  subscription_id VARCHAR REFERENCES webhook_subscriptions(id),
  event_id VARCHAR REFERENCES event_log(id),
  status VARCHAR(20), -- 'success', 'failed', 'pending'
  response_code INTEGER,
  error_message TEXT,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 Integration Points

### Modify Existing Routes

**Before (Direct operations)**:
```typescript
app.post('/api/orders', async (req, res) => {
  const order = await storage.createOrder(req.body);
  
  // Direct email sending
  await sendEmail(order.customerEmail, 'Order Confirmation', ...);
  
  res.json(order);
});
```

**After (Event-driven)**:
```typescript
import { EventBus } from './events/EventBus';

app.post('/api/orders', async (req, res) => {
  const order = await storage.createOrder(req.body);
  
  // Publish event
  await EventBus.publish('order.created', {
    orderId: order.id,
    userId: req.user.id,
    customerId: order.customerId,
    items: order.items,
    total: order.total,
    status: order.status,
  }, {
    userId: req.user.id,
    companyId: req.user.companyId,
  });
  
  res.json(order);
});
```

### Event Handler Registration

```typescript
// /server/events/index.ts
import { registerEmailHandlers } from './handlers/emailHandler';
import { registerNotificationHandlers } from './handlers/notificationHandler';
import { registerMetricsHandlers } from './handlers/metricsHandler';
import { registerAuditHandlers } from './handlers/auditHandler';
import { registerWebSocketHandlers } from './websocket/WebSocketBroadcaster';

export function initializeEventSystem(): void {
  console.log('🚀 Initializing event system...');
  
  registerEmailHandlers();
  registerNotificationHandlers();
  registerMetricsHandlers();
  registerAuditHandlers();
  registerWebSocketHandlers();
  
  console.log('✅ Event system initialized');
}

// Call in server/index.ts
import { initializeEventSystem } from './events';

// After Redis initialization
initializeEventSystem();
```

---

## 📊 Monitoring & Debugging

### Event Dashboard API

```typescript
// /server/routes/events.ts
import express from 'express';
import { EventBus } from '../events/EventBus';

const router = express.Router();

// Get event history
router.get('/api/events', isAuthenticated, async (req, res) => {
  const events = await EventBus.getEvents({
    companyId: req.user.companyId,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    type: req.query.type,
  });
  
  res.json(events);
});

// Get event statistics
router.get('/api/events/stats', isAuthenticated, async (req, res) => {
  const stats = await getEventStats(req.user.companyId);
  res.json(stats);
});

// Replay events (admin only)
router.post('/api/events/replay', isAdmin, async (req, res) => {
  const { eventIds } = req.body;
  await EventBus.replayEvents(eventIds);
  res.json({ success: true });
});

export default router;
```

---

## ✅ Success Metrics

- **Event Throughput**: 1000+ events/minute
- **Handler Latency**: <100ms per handler
- **Webhook Delivery**: 99%+ success rate
- **Audit Coverage**: 100% of state changes logged
- **Real-time Latency**: <200ms for WebSocket delivery

---

## 🎯 Implementation Order

1. **Event Bus Core** (2-3 hours) - Central infrastructure
2. **Event Definitions** (1 hour) - Type definitions
3. **Database Schema** (1 hour) - Event storage
4. **Basic Handlers** (2-3 hours) - Email, notifications, audit
5. **Webhook System** (2-3 hours) - External integrations
6. **WebSocket Integration** (2 hours) - Real-time updates
7. **Event Dashboard** (2 hours) - Monitoring UI
8. **Testing & Documentation** (2-3 hours) - Ensure quality

**Total**: 12-16 hours

---

## 🚀 Benefits

### Immediate
- **Audit Trail**: Complete history of all state changes
- **Real-time Updates**: WebSocket notifications
- **Loose Coupling**: Components can be added/removed easily

### Short-term
- **Extensibility**: Add new features by subscribing to events
- **Debugging**: Event replay shows exactly what happened
- **Integration**: Webhooks for external systems

### Long-term
- **Microservices**: Events enable service-to-service communication
- **CQRS**: Separate read/write models
- **Event Sourcing**: Rebuild state from event history
- **Scalability**: Distribute event processing

---

## 📚 Documentation to Create

1. **Event Catalog**: List of all event types and payloads
2. **Integration Guide**: How to subscribe to events
3. **Webhook Guide**: How to set up webhooks
4. **Debugging Guide**: How to use event replay
5. **Best Practices**: When to use events vs direct calls

---

Ready to start? Say "**start chunk 9**" to begin building the event-driven architecture! 🎉
