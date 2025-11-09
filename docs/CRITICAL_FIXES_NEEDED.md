# Critical Fixes Needed - Platform Design Alignment

**Date:** 2025-01-27  
**Priority:** 🔴 HIGH - Platform cannot function as designed without these fixes

---

## 🔴 CRITICAL ISSUE #1: Order Service Not Connected

### Problem
The `POST /api/orders` route in `server/routes.ts` (line 618) **does NOT use OrderService**. It directly calls `storage.createOrder()` instead of `OrderService.submitOrder()`, which means:

- ❌ LIMS validation is NOT happening
- ❌ Orders are NOT being submitted to LIMS
- ❌ No job_id is being stored
- ❌ Flow 1 (Order Submission) is broken

### Current Code (BROKEN)
```typescript
// server/routes.ts line 618
app.post('/api/orders', isAuthenticated, async (req: any, res) => {
  // ... validation ...
  
  // ❌ WRONG: Directly creates order without LIMS
  const order = await storage.createOrder({
    ...orderData,
    companyId: user.companyId,
    patientId: patient.id,
    ecpId: userId,
  } as any);
  
  res.status(201).json(order);
});
```

### Fix Required
```typescript
// server/routes.ts line 618
app.post('/api/orders', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    if (!user || user.role !== 'ecp') {
      return res.status(403).json({ message: "Only ECPs can create orders" });
    }

    if (!user.companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    // ... patient creation and OMA parsing ...

    // ✅ FIX: Use OrderService instead of direct storage
    const { OrderService } = await import('./services/OrderService');
    const { LimsClient } = await import('@ils/lims-client');
    
    const limsClient = new LimsClient({
      baseUrl: process.env.LIMS_API_BASE_URL || '',
      apiKey: process.env.LIMS_API_KEY || '',
    });
    
    const orderService = new OrderService(limsClient, storage, {
      enableLimsValidation: process.env.ENABLE_LIMS_VALIDATION !== 'false',
    });
    
    const order = await orderService.submitOrder({
      ...orderData,
      companyId: user.companyId,
      patientId: patient.id,
      ecpId: userId,
      omaFileContent: omaFileContent || null,
      omaFilename: omaFilename || null,
      omaParsedData: omaParsedData as any,
    }, userId);
    
    res.status(201).json(order);
  } catch (error: any) {
    console.error("Error creating order:", error);
    
    // Handle LIMS validation errors
    if (error.message?.includes('LIMS') || error.message?.includes('validation')) {
      return res.status(400).json({ 
        message: "Order validation failed", 
        error: error.message 
      });
    }
    
    res.status(500).json({ message: "Failed to create order" });
  }
});
```

### Environment Variables Needed
```bash
LIMS_API_BASE_URL=https://your-lims-api.com
LIMS_API_KEY=your-api-key
LIMS_WEBHOOK_SECRET=your-webhook-secret
ENABLE_LIMS_VALIDATION=true  # Set to false for testing without LIMS
```

---

## 🟡 MEDIUM PRIORITY: Verify Webhook Route is Registered

### Status
✅ Webhook route exists at `/api/webhooks/lims-status` (line 3664 in routes.ts)

### Action Required
- [ ] Verify webhook endpoint is accessible
- [ ] Test webhook signature verification
- [ ] Configure LIMS to send webhooks to this endpoint
- [ ] Test webhook processing with mock payload

---

## 🟡 MEDIUM PRIORITY: Verify Multi-Tenancy on All Routes

### Status
✅ Most routes enforce company scoping, but need verification

### Action Required
- [ ] Audit all POST/PUT/DELETE routes to ensure `requireCompany()` or `setTenantContext()` is used
- [ ] Verify all GET routes filter by `companyId`
- [ ] Test cross-tenant access prevention
- [ ] Verify admin routes properly scope access

---

## 🟢 LOW PRIORITY: POS Page Restoration

### Status
✅ `OpticalPOSPage.tsx` exists and appears functional

### Action Required
- [ ] Verify all features from deleted `POSPage.tsx` are present
- [ ] Test product browsing with images
- [ ] Test color selection
- [ ] Test add-to-basket with/without Rx
- [ ] Test checkout flow

---

## Implementation Checklist

### Immediate (Today)
- [ ] Fix order creation route to use OrderService
- [ ] Add LIMS environment variables to `.env.example`
- [ ] Test order creation with LIMS validation (if LIMS available)
- [ ] Document LIMS setup process

### Short-term (This Week)
- [ ] Verify webhook endpoint works
- [ ] Complete multi-tenancy audit
- [ ] Test POS page functionality
- [ ] Create LIMS integration test suite

### Medium-term (This Month)
- [ ] Plan microservices migration
- [ ] Set up infrastructure as code
- [ ] Create deployment guide
- [ ] Update documentation

---

## Files to Modify

1. **`server/routes.ts`** (Line 618)
   - Replace direct `storage.createOrder()` with `OrderService.submitOrder()`
   - Add LIMS client initialization
   - Add error handling for LIMS validation

2. **`.env.example`**
   - Add LIMS configuration variables
   - Document required Stripe keys

3. **`README.md`**
   - Update with LIMS setup instructions
   - Document architecture (monolithic vs microservices)

---

## Testing Plan

### Order Creation with LIMS
1. Set up test LIMS instance or mock
2. Create test order via API
3. Verify LIMS validation is called
4. Verify job_id is returned and stored
5. Verify order status is updated

### Webhook Processing
1. Send test webhook payload
2. Verify signature validation
3. Verify order status update
4. Verify WebSocket broadcast (if implemented)

### Multi-Tenancy
1. Create two test companies
2. Create orders for each
3. Verify Company A cannot see Company B orders
4. Test admin cross-company access

---

## Next Steps

1. **Fix Order Service Integration** (Priority 1)
   - This is blocking LIMS integration
   - Without this, orders don't go to LIMS

2. **Configure LIMS Connection** (Priority 2)
   - Set up LIMS API endpoint
   - Configure API keys
   - Test connectivity

3. **Test Webhook Flow** (Priority 3)
   - Verify webhook endpoint
   - Test status updates
   - Verify real-time updates

---

*Generated by platform design audit - 2025-01-27*

