# Queue System Integration Examples

## Quick Reference: Before & After Migration

This document shows real-world examples of migrating existing synchronous code to use the background job queue system.

---

## Example 1: Order Creation

### Before (Synchronous - 5-15s response time)

```typescript
// File: /server/routes.ts or order routes

app.post('/api/orders', isAuthenticated, async (req, res) => {
  try {
    // Validate order data
    const validatedData = insertOrderSchema.parse(req.body);
    
    // Create order in database
    const order = await storage.createOrder({
      ...validatedData,
      userId: req.user.id,
      companyId: req.user.companyId
    });
    
    // Send confirmation email (2-5 seconds - BLOCKS RESPONSE)
    await sendOrderConfirmationEmail(order.id, req.user.id);
    
    // Generate PDF order sheet (3-10 seconds - BLOCKS RESPONSE)
    await generateOrderSheetPDF(order.id);
    
    // Finally send response (total: 5-15 seconds)
    res.json({ 
      success: true, 
      order 
    });
    
  } catch (error) {
    console.error('Order creation failed:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});
```

**Problems**:
- ❌ User waits 5-15 seconds for response
- ❌ Server thread blocked during email/PDF generation
- ❌ If email fails, entire request fails
- ❌ No retry mechanism
- ❌ Limits concurrent users to ~100

---

### After (Asynchronous - 500ms response time)

```typescript
// File: /server/routes.ts or order routes

// Add import at top of file
import { 
  queueOrderConfirmationEmail, 
  queueOrderSheetPDF 
} from './queue/helpers';

app.post('/api/orders', isAuthenticated, async (req, res) => {
  try {
    // Validate order data
    const validatedData = insertOrderSchema.parse(req.body);
    
    // Create order in database
    const order = await storage.createOrder({
      ...validatedData,
      userId: req.user.id,
      companyId: req.user.companyId
    });
    
    // Queue email (non-blocking, <50ms)
    await queueOrderConfirmationEmail(order.id, req.user.id);
    
    // Queue PDF generation (non-blocking, <50ms)
    await queueOrderSheetPDF(order.id);
    
    // Send immediate response (total: ~500ms)
    res.json({ 
      success: true, 
      order,
      message: 'Order created. Confirmation email and PDF will be sent shortly.'
    });
    
  } catch (error) {
    console.error('Order creation failed:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Background workers handle email and PDF asynchronously:
// - Email worker processes the email (2-5s)
// - PDF worker generates the PDF (3-10s)
// - Both have automatic retry on failure
// - User already has their response!
```

**Benefits**:
- ✅ User gets response in ~500ms (10-30x faster)
- ✅ Server thread freed immediately
- ✅ Email/PDF failures don't affect order creation
- ✅ Automatic retry (3-5 attempts)
- ✅ Supports 1000+ concurrent users

---

## Example 2: Shipment Notification

### Before (Synchronous)

```typescript
app.patch('/api/orders/:id/ship', isAuthenticated, async (req, res) => {
  try {
    const { trackingNumber } = req.body;
    
    // Update order status
    const order = await storage.updateOrderStatus(
      parseInt(req.params.id),
      'shipped'
    );
    
    // Send shipment notification (2-5s - BLOCKS)
    await sendShipmentNotificationEmail(
      order.id, 
      order.userId, 
      trackingNumber
    );
    
    res.json({ success: true, order });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});
```

---

### After (Asynchronous)

```typescript
import { queueShipmentNotificationEmail } from './queue/helpers';

app.patch('/api/orders/:id/ship', isAuthenticated, async (req, res) => {
  try {
    const { trackingNumber } = req.body;
    
    // Update order status
    const order = await storage.updateOrderStatus(
      parseInt(req.params.id),
      'shipped'
    );
    
    // Queue shipment notification (non-blocking)
    await queueShipmentNotificationEmail(
      order.id, 
      order.userId, 
      trackingNumber
    );
    
    res.json({ 
      success: true, 
      order,
      message: 'Order marked as shipped. Customer will receive tracking info shortly.'
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});
```

---

## Example 3: Invoice Generation

### Before (Synchronous)

```typescript
app.post('/api/invoices', isAuthenticated, async (req, res) => {
  try {
    // Create invoice
    const invoice = await storage.createInvoice(req.body);
    
    // Generate PDF (3-10s - BLOCKS)
    const pdfPath = await generateInvoicePDF(invoice.id);
    
    // Send email with PDF (2-5s - BLOCKS)
    await sendInvoiceEmail(invoice.id, req.user.id, pdfPath);
    
    res.json({ success: true, invoice });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});
```

---

### After (Asynchronous)

```typescript
import { queueInvoicePDF } from './queue/helpers';

app.post('/api/invoices', isAuthenticated, async (req, res) => {
  try {
    // Create invoice
    const invoice = await storage.createInvoice(req.body);
    
    // Queue PDF generation and email (non-blocking)
    await queueInvoicePDF(invoice.id);
    
    res.json({ 
      success: true, 
      invoice,
      message: 'Invoice created. PDF will be generated and emailed shortly.'
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Note: PDF worker automatically generates PDF and triggers email
// See /server/workers/pdfWorker.ts - processPDFInvoice function
```

---

## Example 4: Marketplace Connection Request

### Before (Synchronous)

```typescript
app.post('/api/marketplace/connections', isAuthenticated, async (req, res) => {
  try {
    const { targetCompanyId } = req.body;
    
    // Create connection request
    const connection = await storage.createConnectionRequest({
      requesterCompanyId: req.user.companyId,
      targetCompanyId,
      status: 'pending'
    });
    
    // Send notification email (2-5s - BLOCKS)
    await sendConnectionRequestEmail(connection.id);
    
    res.json({ success: true, connection });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to create connection' });
  }
});
```

---

### After (Asynchronous)

```typescript
import { 
  queueMarketplaceConnectionEmail,
  queueMarketplaceNotification 
} from './queue/helpers';

app.post('/api/marketplace/connections', isAuthenticated, async (req, res) => {
  try {
    const { targetCompanyId } = req.body;
    
    // Create connection request
    const connection = await storage.createConnectionRequest({
      requesterCompanyId: req.user.companyId,
      targetCompanyId,
      status: 'pending'
    });
    
    // Get companies for notification
    const requesterCompany = await storage.getCompany(req.user.companyId);
    const targetCompany = await storage.getCompany(targetCompanyId);
    
    // Queue email notification (non-blocking)
    await queueMarketplaceConnectionEmail(
      connection.id,
      req.user.companyId,
      targetCompanyId
    );
    
    // Queue in-app notification (non-blocking)
    const targetUsers = await storage.getCompanyAdmins(targetCompanyId);
    for (const targetUser of targetUsers) {
      await queueMarketplaceNotification(
        targetUser.id,
        connection.id,
        'request',
        requesterCompany.name
      );
    }
    
    res.json({ 
      success: true, 
      connection,
      message: `Connection request sent to ${targetCompany.name}`
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to create connection' });
  }
});
```

---

## Example 5: Daily AI Briefing (Cron Job)

### Before (Synchronous Cron)

```typescript
// File: /server/jobs/dailyBriefingCron.ts

import cron from 'node-cron';

// Daily at 8am
cron.schedule('0 8 * * *', async () => {
  console.log('Starting daily briefing generation...');
  
  const companies = await getAllActiveCompanies();
  
  // Process each company synchronously (30-60s each)
  for (const company of companies) {
    try {
      // Generate briefing (30-60s - BLOCKS CRON THREAD)
      const briefing = await generateDailyBriefing(company.id);
      
      // Send to all company users
      const users = await getCompanyUsers(company.id);
      for (const user of users) {
        // Send notification (2-5s each - BLOCKS)
        await sendBriefingNotification(user.id, briefing);
      }
      
      console.log(`✅ Briefing sent for company ${company.id}`);
    } catch (error) {
      console.error(`❌ Failed to generate briefing for ${company.id}:`, error);
    }
  }
  
  console.log('Daily briefing generation complete');
});

// Problems:
// - If you have 100 companies, this takes 50-100 minutes!
// - Blocks cron thread entire time
// - If one company fails, continues anyway
// - No retry mechanism
```

---

### After (Asynchronous Queue)

```typescript
// File: /server/jobs/dailyBriefingCron.ts

import cron from 'node-cron';
import { queueDailyBriefing } from '../queue/helpers';

// Daily at 8am
cron.schedule('0 8 * * *', async () => {
  console.log('Queueing daily briefing generation...');
  
  const companies = await getAllActiveCompanies();
  
  // Queue briefing generation for each company (fast)
  const today = new Date().toISOString().split('T')[0];
  
  for (const company of companies) {
    try {
      // Get company admin users
      const users = await getCompanyUsers(company.id);
      const userIds = users.map(u => u.id);
      
      // Queue briefing generation (non-blocking, <50ms)
      await queueDailyBriefing(company.id, today, userIds);
      
      console.log(`✅ Briefing queued for company ${company.id}`);
    } catch (error) {
      console.error(`❌ Failed to queue briefing for ${company.id}:`, error);
    }
  }
  
  console.log(`Daily briefing jobs queued for ${companies.length} companies`);
});

// Benefits:
// - Cron completes in seconds instead of minutes
// - AI worker processes briefings asynchronously (2 at a time)
// - Automatic retry on failure (2 attempts)
// - Can monitor progress via /api/queue/stats
// - Doesn't block other cron jobs
```

---

## Example 6: Bulk Notifications

### Before (Synchronous Loop)

```typescript
app.post('/api/notifications/bulk', isAuthenticated, async (req, res) => {
  try {
    const { userIds, title, message } = req.body;
    
    const results = [];
    
    // Send to each user synchronously (1-2s per user)
    for (const userId of userIds) {
      try {
        await sendNotification(userId, title, message);
        results.push({ userId, success: true });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }
    
    // If sending to 100 users, this takes 100-200 seconds!
    res.json({ success: true, results });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});
```

---

### After (Asynchronous Queue)

```typescript
import { queueSystemNotification } from './queue/helpers';

app.post('/api/notifications/bulk', isAuthenticated, async (req, res) => {
  try {
    const { userIds, title, message, priority } = req.body;
    
    // Queue all notifications (fast - 100 users in ~1 second)
    const queuedJobs = [];
    
    for (const userId of userIds) {
      const jobId = await queueSystemNotification(
        userId,
        title,
        message,
        priority || 'medium'
      );
      queuedJobs.push(jobId);
    }
    
    // Response in ~1 second instead of 100-200 seconds
    res.json({ 
      success: true, 
      queued: queuedJobs.length,
      message: `${queuedJobs.length} notifications queued for delivery`
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to queue notifications' });
  }
});

// Notification worker processes 10 at a time with automatic retry
```

---

## Example 7: Demand Forecasting Request

### Before (Synchronous)

```typescript
app.post('/api/ai/forecast', isAuthenticated, async (req, res) => {
  try {
    const { productIds, days } = req.body;
    
    // Generate forecast (30-45s - BLOCKS)
    const forecast = await generateDemandForecast(
      req.user.companyId,
      productIds,
      days
    );
    
    res.json({ success: true, forecast });
    
  } catch (error) {
    res.status(500).json({ error: 'Forecast generation failed' });
  }
});
```

---

### After (Asynchronous)

```typescript
import { queueDemandForecast } from './queue/helpers';

app.post('/api/ai/forecast', isAuthenticated, async (req, res) => {
  try {
    const { productIds, days } = req.body;
    
    // Queue forecast generation (non-blocking)
    const jobId = await queueDemandForecast(
      req.user.companyId,
      days || 30,
      productIds
    );
    
    res.json({ 
      success: true, 
      jobId,
      message: 'Forecast generation started. You will be notified when complete.',
      estimatedTime: '30-45 seconds'
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to queue forecast' });
  }
});

// Later, you can check job status:
app.get('/api/ai/forecast/:jobId/status', isAuthenticated, async (req, res) => {
  const status = await getJobStatus(req.params.jobId);
  res.json(status);
});
```

---

## Common Patterns

### Pattern 1: Queue and Forget
Use when you don't need immediate feedback:

```typescript
// Just queue the job and move on
await queueOrderConfirmationEmail(orderId, userId);
await queueOrderSheetPDF(orderId);
res.json({ success: true });
```

### Pattern 2: Queue with Status Check
Use when you want to allow checking job status:

```typescript
// Queue job and return job ID
const jobId = await queueDemandForecast(companyId, 30, productIds);

res.json({ 
  success: true, 
  jobId,
  statusUrl: `/api/jobs/${jobId}/status`
});

// Client can poll /api/jobs/:jobId/status endpoint
```

### Pattern 3: Queue Multiple Jobs
Use when you need to queue several related jobs:

```typescript
// Queue multiple related jobs
await Promise.all([
  queueOrderConfirmationEmail(orderId, userId),
  queueOrderSheetPDF(orderId),
  queueOrderNotification(userId, orderId, 'confirmed', 'Your order has been confirmed')
]);

res.json({ success: true, message: 'Order processing started' });
```

### Pattern 4: Priority Queue
Use when some jobs are more urgent:

```typescript
// High priority notification
await queueSystemNotification(
  userId,
  'Urgent: Low Stock Alert',
  'Product XYZ is running low',
  'urgent', // priority: urgent, high, medium, low
  '/inventory/alerts'
);
```

---

## Migration Checklist

When migrating existing code to use queues:

### Step 1: Identify Blocking Operations
- [ ] Find all email sending code
- [ ] Find all PDF generation code
- [ ] Find all long-running AI operations
- [ ] Find all notification sending code

### Step 2: Add Queue Imports
```typescript
import { 
  queueOrderConfirmationEmail,
  queueOrderSheetPDF,
  // ... other helpers
} from './queue/helpers';
```

### Step 3: Replace Blocking Calls
```typescript
// Before
await sendEmail(...);

// After
await queueOrderConfirmationEmail(...);
```

### Step 4: Update Response Messages
```typescript
// Add helpful message about background processing
res.json({ 
  success: true, 
  data,
  message: 'Email will be sent shortly'
});
```

### Step 5: Test Both Scenarios
- [ ] Test with Redis running (jobs queued)
- [ ] Test without Redis (immediate execution fallback)
- [ ] Test with Redis disconnecting mid-operation
- [ ] Check `/api/queue/stats` to verify jobs are processing

---

## Performance Comparison Table

| Operation | Before (Sync) | After (Queue) | Improvement |
|-----------|--------------|---------------|-------------|
| Create Order | 5-15s | 500ms | 10-30x faster |
| Ship Order | 2-7s | 300ms | 7-23x faster |
| Generate Invoice | 5-12s | 400ms | 12-30x faster |
| Send Bulk Notifications (100) | 100-200s | 1-2s | 50-200x faster |
| Daily Briefing (100 companies) | 50-100min | 30-60s | 50-200x faster |
| Demand Forecast | 30-45s | 200ms | 150-225x faster |

---

## Error Handling

### Graceful Degradation
The queue system automatically falls back to immediate execution if Redis is unavailable:

```typescript
// You write the same code:
await queueOrderConfirmationEmail(orderId, userId);

// If Redis is available:
// - Job queued for background processing
// - Returns immediately

// If Redis is NOT available:
// - Executes immediately (fallback)
// - Still works, just slower
```

### Monitoring Failed Jobs
Check failed jobs via API:

```bash
# Get queue stats
curl http://localhost:3000/api/queue/stats

# Response includes failed count:
{
  "email": {
    "waiting": 5,
    "active": 2,
    "completed": 100,
    "failed": 3  # <-- Failed jobs
  }
}
```

Failed jobs automatically retry with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: After 30 seconds
- Attempt 3: After 90 seconds
- Attempt 4: After 270 seconds
- Attempt 5: After 810 seconds (if configured)

---

## Best Practices

### DO ✅
- Queue all email sending
- Queue all PDF generation
- Queue all long-running AI operations
- Queue all notification sending
- Provide user feedback ("Email will be sent shortly")
- Monitor queue health via `/api/queue/stats`

### DON'T ❌
- Don't queue database operations (already fast)
- Don't queue critical operations that must complete before response
- Don't queue operations that need immediate user feedback
- Don't queue operations that are faster than queueing overhead (<50ms)

### When to Use Queues
✅ Email sending (2-5s)
✅ PDF generation (3-10s)
✅ AI processing (30-60s)
✅ External API calls (variable)
✅ Bulk operations (minutes)
✅ Scheduled tasks
✅ Webhook processing

### When NOT to Use Queues
❌ Database reads (<100ms)
❌ Simple calculations (<10ms)
❌ Authentication checks (<50ms)
❌ Data validation (<10ms)
❌ Operations requiring immediate feedback

---

## Next Steps

1. **Install Redis** (if not already):
   ```bash
   brew install redis  # macOS
   brew services start redis
   ```

2. **Update Your Routes**: Follow examples above for your specific routes

3. **Test Thoroughly**: 
   - Test with Redis running
   - Test without Redis (fallback)
   - Monitor `/api/queue/stats`

4. **Deploy to Production**: Follow `CHUNK_8_BACKGROUND_JOBS_COMPLETE.md` for production setup

---

**Need Help?**
- Check `BACKGROUND_JOB_QUEUE_GUIDE.md` for detailed implementation
- Check `QUEUE_SYSTEM_QUICK_START.md` for quick reference
- Check `/server/queue/helpers.ts` for all available queue functions
- Monitor queue health at `/api/queue/stats`

---

**Last Updated**: December 2024
**Status**: Ready for Integration
