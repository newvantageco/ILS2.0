import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";

const router = Router();

// Validation schemas
const configureShopifySchema = z.object({
  shopUrl: z.string().url(),
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
  accessToken: z.string().min(1),
  webhookSecret: z.string().optional(),
});

const syncOptionsSchema = z.object({
  syncProducts: z.boolean().optional().default(true),
  syncOrders: z.boolean().optional().default(true),
  syncInventory: z.boolean().optional().default(true),
  syncCustomers: z.boolean().optional().default(false),
});

// Helper to check admin access
const requireAdmin = async (req: any, res: any, next: any) => {
  const userId = req.user.claims.sub;
  const user = await storage.getUser(userId);
  
  if (!user || (user.role !== 'admin' && user.role !== 'platform_admin')) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  (req as any).currentUser = user;
  next();
};

// Apply auth middleware to all routes
router.use(isAuthenticated, requireAdmin);

/**
 * GET /api/shopify/config
 * Get Shopify integration configuration
 */
router.get("/config", async (req, res) => {
  try {
    const userId = (req as any).currentUser.id;

    // Mock config - in production would fetch from database
    const config = {
      isConfigured: true,
      shopUrl: "your-store.myshopify.com",
      isConnected: true,
      lastSync: new Date(Date.now() - 3600000),
      syncStatus: "active",
      webhooks: {
        products: true,
        orders: true,
        inventory: true,
        customers: false,
      },
      configuredAt: new Date("2025-09-15"),
      configuredBy: userId,
    };

    res.json(config);
  } catch (error) {
    console.error("Error fetching Shopify config:", error);
    res.status(500).json({ message: "Failed to fetch Shopify configuration" });
  }
});

/**
 * POST /api/shopify/configure
 * Configure Shopify integration
 */
router.post("/configure", async (req, res) => {
  try {
    const validation = configureShopifySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validation.error.errors 
      });
    }

    const configData = validation.data;

    // In production, would:
    // 1. Validate Shopify credentials
    // 2. Test API connection
    // 3. Store encrypted credentials
    // 4. Set up webhooks

    const config = {
      isConfigured: true,
      shopUrl: configData.shopUrl,
      isConnected: true,
      syncStatus: "active",
      webhooks: {
        products: true,
        orders: true,
        inventory: true,
        customers: false,
      },
      configuredAt: new Date(),
      configuredBy: (req as any).currentUser.id,
    };

    res.json(config);
  } catch (error) {
    console.error("Error configuring Shopify:", error);
    res.status(500).json({ message: "Failed to configure Shopify integration" });
  }
});

/**
 * POST /api/shopify/disconnect
 * Disconnect Shopify integration
 */
router.post("/disconnect", async (req, res) => {
  try {
    // In production, would:
    // 1. Remove webhooks
    // 2. Clear stored credentials
    // 3. Update status

    res.json({ 
      message: "Shopify integration disconnected successfully",
      disconnectedAt: new Date()
    });
  } catch (error) {
    console.error("Error disconnecting Shopify:", error);
    res.status(500).json({ message: "Failed to disconnect Shopify" });
  }
});

/**
 * POST /api/shopify/sync
 * Trigger manual sync
 */
router.post("/sync", async (req, res) => {
  try {
    const validation = syncOptionsSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validation.error.errors 
      });
    }

    const options = validation.data;

    // In production, would queue sync job
    const syncJob = {
      id: `sync-${Date.now()}`,
      status: "queued",
      options,
      startedAt: new Date(),
      estimatedCompletion: new Date(Date.now() + 300000), // 5 minutes
    };

    res.json(syncJob);
  } catch (error) {
    console.error("Error starting sync:", error);
    res.status(500).json({ message: "Failed to start sync" });
  }
});

/**
 * GET /api/shopify/sync/status
 * Get current sync status
 */
router.get("/sync/status", async (req, res) => {
  try {
    // Mock sync status
    const status = {
      isRunning: false,
      lastSync: new Date(Date.now() - 3600000),
      lastSyncDuration: 245, // seconds
      nextScheduledSync: new Date(Date.now() + 18000000), // 5 hours
      stats: {
        productsProcessed: 1234,
        ordersProcessed: 567,
        inventoryUpdates: 890,
        errors: 3,
      },
    };

    res.json(status);
  } catch (error) {
    console.error("Error fetching sync status:", error);
    res.status(500).json({ message: "Failed to fetch sync status" });
  }
});

/**
 * GET /api/shopify/products
 * Get synced products
 */
router.get("/products", async (req, res) => {
  try {
    const { limit = "50", offset = "0", search, status } = req.query;

    // Mock product data
    const products = [
      {
        id: "prod-001",
        shopifyId: "12345678901",
        title: "Progressive Lens - Premium",
        sku: "PROG-PREM-001",
        price: 299.99,
        inventoryQuantity: 45,
        status: "active",
        syncStatus: "synced",
        lastSyncedAt: new Date(Date.now() - 3600000),
        shopifyUrl: "https://your-store.myshopify.com/admin/products/12345678901",
      },
      {
        id: "prod-002",
        shopifyId: "12345678902",
        title: "Single Vision Lens - Standard",
        sku: "SV-STD-001",
        price: 149.99,
        inventoryQuantity: 128,
        status: "active",
        syncStatus: "synced",
        lastSyncedAt: new Date(Date.now() - 3600000),
        shopifyUrl: "https://your-store.myshopify.com/admin/products/12345678902",
      },
      {
        id: "prod-003",
        shopifyId: "12345678903",
        title: "Anti-Reflective Coating",
        sku: "COAT-AR-001",
        price: 49.99,
        inventoryQuantity: 0,
        status: "active",
        syncStatus: "error",
        lastSyncedAt: new Date(Date.now() - 7200000),
        syncError: "Inventory mismatch",
        shopifyUrl: "https://your-store.myshopify.com/admin/products/12345678903",
      },
    ];

    // Apply filters
    let filtered = products;
    
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower)
      );
    }
    
    if (status) {
      filtered = filtered.filter(p => p.syncStatus === status);
    }

    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

    res.json({
      products: paginated,
      total: filtered.length,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

/**
 * GET /api/shopify/orders
 * Get synced orders
 */
router.get("/orders", async (req, res) => {
  try {
    const { limit = "50", offset = "0", status } = req.query;

    // Mock order data
    const orders = [
      {
        id: "order-001",
        shopifyId: "98765432101",
        orderNumber: "#1001",
        customerName: "John Smith",
        customerEmail: "john@example.com",
        totalPrice: 449.98,
        status: "fulfilled",
        syncStatus: "synced",
        orderDate: new Date(Date.now() - 86400000),
        lastSyncedAt: new Date(Date.now() - 3600000),
        shopifyUrl: "https://your-store.myshopify.com/admin/orders/98765432101",
      },
      {
        id: "order-002",
        shopifyId: "98765432102",
        orderNumber: "#1002",
        customerName: "Jane Doe",
        customerEmail: "jane@example.com",
        totalPrice: 299.99,
        status: "pending",
        syncStatus: "synced",
        orderDate: new Date(Date.now() - 43200000),
        lastSyncedAt: new Date(Date.now() - 3600000),
        shopifyUrl: "https://your-store.myshopify.com/admin/orders/98765432102",
      },
    ];

    // Apply filters
    let filtered = orders;
    
    if (status) {
      filtered = filtered.filter(o => o.status === status);
    }

    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

    res.json({
      orders: paginated,
      total: filtered.length,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

/**
 * GET /api/shopify/sync/history
 * Get sync history
 */
router.get("/sync/history", async (req, res) => {
  try {
    const { limit = "20", offset = "0" } = req.query;

    // Mock sync history
    const history = [
      {
        id: "sync-001",
        type: "full",
        status: "completed",
        startedAt: new Date(Date.now() - 3600000),
        completedAt: new Date(Date.now() - 3355000),
        duration: 245,
        stats: {
          productsProcessed: 1234,
          ordersProcessed: 567,
          inventoryUpdates: 890,
          errors: 0,
        },
      },
      {
        id: "sync-002",
        type: "incremental",
        status: "completed",
        startedAt: new Date(Date.now() - 86400000),
        completedAt: new Date(Date.now() - 86340000),
        duration: 60,
        stats: {
          productsProcessed: 45,
          ordersProcessed: 23,
          inventoryUpdates: 67,
          errors: 0,
        },
      },
      {
        id: "sync-003",
        type: "full",
        status: "failed",
        startedAt: new Date(Date.now() - 172800000),
        completedAt: new Date(Date.now() - 172500000),
        duration: 300,
        stats: {
          productsProcessed: 234,
          ordersProcessed: 0,
          inventoryUpdates: 0,
          errors: 15,
        },
        error: "API rate limit exceeded",
      },
    ];

    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginated = history.slice(offsetNum, offsetNum + limitNum);

    res.json({
      history: paginated,
      total: history.length,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    console.error("Error fetching sync history:", error);
    res.status(500).json({ message: "Failed to fetch sync history" });
  }
});

/**
 * GET /api/shopify/webhooks
 * Get configured webhooks
 */
router.get("/webhooks", async (req, res) => {
  try {
    // Mock webhook configuration
    const webhooks = [
      {
        id: "webhook-001",
        topic: "products/create",
        address: "https://your-domain.com/api/webhooks/shopify/products/create",
        isActive: true,
        createdAt: new Date("2025-09-15"),
      },
      {
        id: "webhook-002",
        topic: "products/update",
        address: "https://your-domain.com/api/webhooks/shopify/products/update",
        isActive: true,
        createdAt: new Date("2025-09-15"),
      },
      {
        id: "webhook-003",
        topic: "orders/create",
        address: "https://your-domain.com/api/webhooks/shopify/orders/create",
        isActive: true,
        createdAt: new Date("2025-09-15"),
      },
      {
        id: "webhook-004",
        topic: "inventory_levels/update",
        address: "https://your-domain.com/api/webhooks/shopify/inventory/update",
        isActive: true,
        createdAt: new Date("2025-09-15"),
      },
    ];

    res.json({ webhooks });
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    res.status(500).json({ message: "Failed to fetch webhooks" });
  }
});

/**
 * GET /api/shopify/stats
 * Get Shopify integration statistics
 */
router.get("/stats", async (req, res) => {
  try {
    // Mock statistics
    const stats = {
      products: {
        total: 1234,
        synced: 1228,
        errors: 6,
        lastSync: new Date(Date.now() - 3600000),
      },
      orders: {
        total: 567,
        synced: 564,
        errors: 3,
        lastSync: new Date(Date.now() - 3600000),
      },
      inventory: {
        totalUpdates: 890,
        lastUpdate: new Date(Date.now() - 1800000),
      },
      sync: {
        totalSyncs: 145,
        successfulSyncs: 142,
        failedSyncs: 3,
        averageDuration: 187, // seconds
      },
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
});

export default router;
