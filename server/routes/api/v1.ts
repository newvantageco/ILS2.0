/**
 * Public API v1 Routes
 * 
 * RESTful API for third-party integrations
 * Base path: /api/v1
 * 
 * Authentication: x-api-key header
 * Rate Limiting: 100 requests/minute (default)
 * Documentation: /api/v1/docs (Swagger UI)
 */

import { Router } from "express";
import { PublicAPIService } from "../../services/PublicAPIService";
import { storage } from "../../storage";

const router = Router();
const publicAPI = new PublicAPIService();

// Apply authentication middleware to all routes
router.use(publicAPI.createAuthenticationMiddleware());

// ============================================================================
// API KEY MANAGEMENT
// ============================================================================

/**
 * GET /api/v1/keys
 * List all API keys for authenticated company
 */
router.get("/keys", async (req, res) => {
  try {
    const companyId = req.apiKey!.company_id;
    
    // In production, query api_keys table
    res.json({
      success: true,
      keys: [],
      message: "API keys endpoint (implementation pending)",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to list API keys",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/v1/keys
 * Create a new API key
 * Body: { name, scopes, rateLimit?, expiresInDays? }
 */
router.post("/keys", async (req, res) => {
  try {
    const companyId = req.apiKey!.company_id;
    const { name, scopes, rateLimit, expiresInDays } = req.body;

    const result = await publicAPI.createAPIKey(
      companyId,
      name,
      scopes,
      rateLimit,
      false, // Not sandbox
      expiresInDays
    );

    res.json({
      success: true,
      apiKey: {
        id: result.apiKey.id,
        name: result.apiKey.name,
        key: result.rawKey, // SHOW ONLY ONCE
        scopes: result.apiKey.scopes,
        rateLimit: result.apiKey.rate_limit,
        createdAt: result.apiKey.created_at,
        expiresAt: result.apiKey.expires_at,
      },
      warning: "Save this key now - it will not be shown again",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to create API key",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ============================================================================
// ORDERS
// ============================================================================

/**
 * GET /api/v1/orders
 * List orders with pagination and filtering
 * Query params: page, limit, status, startDate, endDate
 */
router.get(
  "/orders",
  publicAPI.createScopeMiddleware("orders:read"),
  async (req, res) => {
    try {
      const companyId = req.apiKey!.company_id;
      const { page = 1, limit = 50, status, startDate, endDate } = req.query;

      // Get orders from storage
      let orders = await storage.getOrders();
      
      // Filter by company
      orders = orders.filter((o: any) => o.companyId === companyId);

      // Apply filters
      if (status) {
        orders = orders.filter((o: any) => o.status === status);
      }
      if (startDate) {
        orders = orders.filter((o: any) => new Date(o.orderDate) >= new Date(startDate as string));
      }
      if (endDate) {
        orders = orders.filter((o: any) => new Date(o.orderDate) <= new Date(endDate as string));
      }

      // Pagination
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedOrders = orders.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedOrders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: orders.length,
          pages: Math.ceil(orders.length / Number(limit)),
        },
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to list orders",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/v1/orders/:id
 * Get a specific order by ID
 */
router.get(
  "/orders/:id",
  publicAPI.createScopeMiddleware("orders:read"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const companyId = req.apiKey!.company_id;

      const order = await storage.getOrder(id);

      if (!order) {
        return res.status(404).json({
          error: "Order not found",
        });
      }

      // Verify order belongs to company
      if (order.companyId !== companyId) {
        return res.status(403).json({
          error: "Access denied",
        });
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to get order",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * POST /api/v1/orders
 * Create a new order
 * Body: { patientId, ecpId, prescription, lensType, etc. }
 */
router.post(
  "/orders",
  publicAPI.createScopeMiddleware("orders:write"),
  async (req, res) => {
    try {
      const companyId = req.apiKey!.company_id;

      // Sandbox mode: Don't create real data
      if (req.isSandbox) {
        return res.json({
          success: true,
          data: {
            id: "sandbox_order_123",
            orderNumber: "ORD-SANDBOX-001",
            status: "pending",
            message: "Sandbox mode - order not actually created",
          },
        });
      }

      // Create order
      const orderData = {
        ...req.body,
        companyId,
      };

      const order = await storage.createOrder(orderData);

      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to create order",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * PATCH /api/v1/orders/:id
 * Update an order
 * Body: { status?, notes?, trackingNumber?, etc. }
 */
router.patch(
  "/orders/:id",
  publicAPI.createScopeMiddleware("orders:write"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const companyId = req.apiKey!.company_id;

      // Verify order exists and belongs to company
      const order = await storage.getOrder(id);
      if (!order || order.companyId !== companyId) {
        return res.status(404).json({
          error: "Order not found",
        });
      }

      // Sandbox mode
      if (req.isSandbox) {
        return res.json({
          success: true,
          data: { ...order, ...req.body },
          message: "Sandbox mode - order not actually updated",
        });
      }

      // Update order
      const updated = await storage.updateOrder(id, req.body);

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to update order",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// ============================================================================
// PRODUCTS
// ============================================================================

/**
 * GET /api/v1/products
 * List products with pagination
 */
router.get(
  "/products",
  publicAPI.createScopeMiddleware("products:read"),
  async (req, res) => {
    try {
      const companyId = req.apiKey!.company_id;
      const { page = 1, limit = 50, category, inStock } = req.query;

      let products = await storage.getProducts(companyId);

      // Filters
      if (category) {
        products = products.filter((p: any) => p.category === category);
      }
      if (inStock === "true") {
        products = products.filter(p => (p.stockQuantity || 0) > 0);
      }

      // Pagination
      const startIndex = (Number(page) - 1) * Number(limit);
      const paginatedProducts = products.slice(startIndex, startIndex + Number(limit));

      res.json({
        success: true,
        data: paginatedProducts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: products.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to list products",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/v1/products/:id
 * Get a specific product
 */
router.get(
  "/products/:id",
  publicAPI.createScopeMiddleware("products:read"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const companyId = req.apiKey!.company_id;

      const product = await storage.getProduct(id);

      if (!product || product.companyId !== companyId) {
        return res.status(404).json({
          error: "Product not found",
        });
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to get product",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// ============================================================================
// PATIENTS
// ============================================================================

/**
 * GET /api/v1/patients
 * List patients with pagination
 */
router.get(
  "/patients",
  publicAPI.createScopeMiddleware("patients:read"),
  async (req, res) => {
    try {
      const companyId = req.apiKey!.company_id;
      const { page = 1, limit = 50, search } = req.query;

      let patients = await storage.getPatients(companyId);

      // Search
      if (search) {
        const searchLower = (search as string).toLowerCase();
        patients = patients.filter(
          (p: any) =>
            p.name?.toLowerCase().includes(searchLower) ||
            p.email?.toLowerCase().includes(searchLower)
        );
      }

      // Pagination
      const startIndex = (Number(page) - 1) * Number(limit);
      const paginatedPatients = patients.slice(startIndex, startIndex + Number(limit));

      res.json({
        success: true,
        data: paginatedPatients,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: patients.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to list patients",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// ============================================================================
// INVOICES
// ============================================================================

/**
 * GET /api/v1/invoices
 * List invoices with pagination
 */
router.get(
  "/invoices",
  publicAPI.createScopeMiddleware("invoices:read"),
  async (req, res) => {
    try {
      const companyId = req.apiKey!.company_id;
      const { page = 1, limit = 50, status } = req.query;

      let invoices = await storage.getInvoices(companyId);

      if (status) {
        invoices = invoices.filter((inv: any) => inv.status === status);
      }

      // Pagination
      const startIndex = (Number(page) - 1) * Number(limit);
      const paginatedInvoices = invoices.slice(startIndex, startIndex + Number(limit));

      res.json({
        success: true,
        data: paginatedInvoices,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: invoices.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to list invoices",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// ============================================================================
// WEBHOOKS
// ============================================================================

/**
 * GET /api/v1/webhooks
 * List registered webhooks
 */
router.get("/webhooks", async (req, res) => {
  try {
    const companyId = req.apiKey!.company_id;

    // In production, query custom_webhooks table
    res.json({
      success: true,
      webhooks: [],
      message: "Webhooks endpoint (implementation pending)",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to list webhooks",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/v1/webhooks
 * Register a new webhook
 * Body: { url, events: string[] }
 */
router.post("/webhooks", async (req, res) => {
  try {
    const companyId = req.apiKey!.company_id;
    const { url, events } = req.body;

    if (!url || !events || !Array.isArray(events)) {
      return res.status(400).json({
        error: "Invalid request",
        message: "url and events array required",
      });
    }

    const result = await publicAPI.registerWebhook(companyId, url, events);

    res.status(201).json({
      success: true,
      webhook: {
        id: result.id,
        url,
        events,
        secret: result.secret,
      },
      message: "Webhook registered successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to register webhook",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ============================================================================
// API INFO & HEALTH
// ============================================================================

/**
 * GET /api/v1
 * API information and version
 */
router.get("/", (req, res) => {
  res.json({
    name: "Integrated Lens System Public API",
    version: "1.0.0",
    documentation: "/api/v1/docs",
    endpoints: {
      orders: "/api/v1/orders",
      products: "/api/v1/products",
      patients: "/api/v1/patients",
      invoices: "/api/v1/invoices",
      webhooks: "/api/v1/webhooks",
    },
    authentication: "x-api-key header required",
    rateLimit: `${req.apiKey?.rate_limit || 100} requests/minute`,
  });
});

/**
 * GET /api/v1/health
 * Health check endpoint
 */
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "Public API v1",
    timestamp: new Date().toISOString(),
    sandbox: req.isSandbox || false,
  });
});

export default router;
