# Integration Issues & Fixes Required

## 🔴 Critical Issues Found

### 1. Missing Marketplace Routes
**File:** `server/routes.ts:45`
**Error:** Cannot find module './routes/marketplace'

**Fix:** The marketplace routes file wasn't created. Either:
- Create the file, OR
- Comment out the import in `server/routes.ts`

```typescript
// Line 45 in server/routes.ts - Comment out:
// import { registerMarketplaceRoutes } from "./routes/marketplace";
// Line ~200 - Comment out:
// registerMarketplaceRoutes(router);
```

---

### 2. Database Schema - Shopify Fields Missing
**Files:** `server/services/EnhancedShopifyService.ts`
**Error:** Properties don't exist on products table

**Missing Fields:**
- `shopifyProductId`
- `shopifyVariantId`
- `shopifyInventoryItemId`
- `lastShopifySync`

**Fix:** Need to run the database migration we created:
```bash
psql -U postgres -d ils_db -f migrations/2025-11-05-world-class-transformation.sql
```

OR add to `shared/schema.ts`:
```typescript
export const products = pgTable("products", {
  // ... existing fields ...
  shopifyProductId: varchar("shopify_product_id"),
  shopifyVariantId: varchar("shopify_variant_id"),
  shopifyInventoryItemId: varchar("shopify_inventory_item_id"),
  lastShopifySync: timestamp("last_synced_at"),
});
```

---

### 3. Missing Storage Methods
**Files:** Multiple services
**Error:** Methods don't exist on DbStorage

**Missing Methods:**
```typescript
// In server/storage.ts - Need to add:

async getPatientByShopifyCustomerId(shopifyCustomerId: string)
async getProductByShopifyVariantId(variantId: string)
async updateProductStock(productId: string, quantity: number)
async getUsersByCompany(companyId: string)
async getAllCompanies() // or use getCompanies()
async createClinicalAnomaly(data: any)
async createNotification(data: any)
async createAPIKey(data: any)
async getAPIKeyByHash(hash: string)
async updateAPIKeyLastUsed(id: number)
async createWebhook(data: any)
async getWebhooksByCompanyAndEvent(companyId: string, event: string)
async createWebhookDelivery(data: any)
```

---

### 4. Type Definitions for Request Objects
**Files:** Various route files
**Error:** Property doesn't exist on Request type

**Fix:** Add type augmentation in `server/types.ts` or at top of files:

```typescript
declare global {
  namespace Express {
    interface Request {
      apiKey?: APIKey;
      isSandbox?: boolean;
      shopifyCompany?: Company;
    }
  }
}
```

---

### 5. Missing Event Types
**File:** `server/services/EnhancedShopifyService.ts:214`
**Error:** 'product.stock_updated' not in EventTypeMap

**Fix:** Add to `server/events/events.ts`:
```typescript
export interface EventTypeMap {
  // ... existing events ...
  'product.stock_updated': ProductStockUpdatedData;
}

export interface ProductStockUpdatedData {
  productId: string;
  companyId: string;
  oldStock: number;
  newStock: number;
  source: 'shopify' | 'manual' | 'order';
  timestamp: Date;
}
```

---

## 🟡 Non-Critical Issues

### 6. EnhancedShopifyService Export
**File:** `server/routes/webhooks/shopify.ts:13`
**Error:** Cannot find module

**Fix:** Export the service instance in `EnhancedShopifyService.ts`:
```typescript
// At bottom of EnhancedShopifyService.ts
export const enhancedShopifyService = new EnhancedShopifyService();
```

---

### 7. User Name Property
**File:** `server/services/ClinicalWorkflowService.ts:124`
**Error:** Property 'name' doesn't exist on user

**Fix:** Use correct property or add optional chaining:
```typescript
examinerName: examiner?.email || 'Unknown'
// OR add firstName/lastName if available
examinerName: `${examiner?.firstName || ''} ${examiner?.lastName || ''}`.trim() || examiner?.email || 'Unknown'
```

---

## ✅ Quick Fix Checklist

1. **Immediate (prevents compilation errors):**
   - [ ] Comment out marketplace routes import in `server/routes.ts`
   - [ ] Add type augmentation for Express.Request
   - [ ] Add 'product.stock_updated' event type
   - [ ] Export enhancedShopifyService instance

2. **Database (before running app):**
   - [ ] Run migration SQL script OR
   - [ ] Add Shopify fields to products schema in `shared/schema.ts`
   - [ ] Regenerate Drizzle types: `npm run db:generate`

3. **Storage Methods (for full functionality):**
   - [ ] Implement missing storage methods in `server/storage.ts`
   - [ ] OR create placeholder methods that log "Not implemented"

4. **Service Registration (in server/index.ts):**
   - [ ] Import and register all new routes
   - [ ] Setup cron jobs for nightly tasks
   - [ ] Initialize webhook listeners

---

## 🚀 Temporary Workaround (Get It Running)

To get the server running immediately without all features:

```typescript
// server/routes.ts - Comment out:
// import { registerMarketplaceRoutes } from "./routes/marketplace";

// server/services/EnhancedShopifyService.ts - Comment out lines that use missing fields:
// if (!product || !product.shopifyVariantId) { ... }

// server/routes/webhooks/shopify.ts - Don't import yet:
// Comment out the entire import

// server/routes/api/v1.ts - Don't import yet:
// Comment out the entire import
```

Then gradually uncomment as you:
1. Run database migration
2. Add storage methods
3. Fix type definitions

---

## 📝 Summary

**Total Errors:** ~50+ TypeScript compilation errors
**Critical:** 5 issues blocking compilation
**Non-Critical:** 2 minor issues

**Root Causes:**
1. Database schema not updated (need migration)
2. Storage interface not extended with new methods
3. Type definitions not augmented for Express
4. Services need to be properly exported/imported

**Recommendation:**
Either run the full integration (database migration + storage methods), OR disable the new features temporarily and enable them one by one after testing.
