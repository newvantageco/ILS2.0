import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { ShopifyService } from "../services/ShopifyService";
import { PrescriptionVerificationService } from "../services/PrescriptionVerificationService";
import { ShopifyOrderSyncService } from "../services/ShopifyOrderSyncService";
import { ShopifyWebhookHandler } from "../services/ShopifyWebhookHandler";

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const connectStoreSchema = z.object({
  shopifyDomain: z.string().min(1),
  shopifyStoreId: z.string().min(1),
  storeName: z.string().min(1),
  storeEmail: z.string().email().optional(),
  storeUrl: z.string().url(),
  accessToken: z.string().min(1),
  apiKey: z.string().min(1),
  apiSecretKey: z.string().min(1),
});

const updateStoreSettingsSchema = z.object({
  enablePrescriptionVerification: z.boolean().optional(),
  enableAIRecommendations: z.boolean().optional(),
  enableAutoOrderSync: z.boolean().optional(),
  requirePrescriptionUpload: z.boolean().optional(),
  markupPercentage: z.number().min(0).max(100).optional(),
});

const uploadPrescriptionSchema = z.object({
  shopifyOrderId: z.string().optional(),
  patientId: z.string().optional(),
  fileUrl: z.string().url(),
  fileName: z.string().min(1),
  fileType: z.enum(["pdf", "jpg", "jpeg", "png"]),
  fileSize: z.number(),
});

const verifyPrescriptionSchema = z.object({
  prescriptionData: z.object({
    sphereOD: z.number().nullable(),
    cylinderOD: z.number().nullable(),
    axisOD: z.number().nullable(),
    addOD: z.number().nullable(),
    sphereOS: z.number().nullable(),
    cylinderOS: z.number().nullable(),
    axisOS: z.number().nullable(),
    addOS: z.number().nullable(),
    pd: z.number().nullable(),
    prescriptionDate: z.string().nullable(),
    expiryDate: z.string().nullable(),
    practitionerName: z.string().nullable(),
    practitionerGocNumber: z.string().nullable(),
  }).optional(),
});

const rejectPrescriptionSchema = z.object({
  rejectionReason: z.string().min(1),
});

// ============================================================================
// STORE MANAGEMENT ROUTES
// ============================================================================

/**
 * @swagger
 * /api/shopify/stores:
 *   get:
 *     summary: Get all connected Shopify stores
 *     description: Retrieve all Shopify stores connected to your optical practice
 *     tags:
 *       - Shopify Integration
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of connected stores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   shopifyDomain:
 *                     type: string
 *                   storeName:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [active, inactive, error]
 *                   storeUrl:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/stores", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;

    const stores = await ShopifyService.getStores(companyId);

    res.json(stores);
  } catch (error: any) {
    console.error("Error fetching stores:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shopify/stores/:storeId
 * Get store by ID
 */
router.get("/stores/:storeId", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const { storeId } = req.params;

    const store = await ShopifyService.getStore(storeId, companyId);

    res.json(store);
  } catch (error: any) {
    console.error("Error fetching store:", error);
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/shopify/stores/connect:
 *   post:
 *     summary: Connect a new Shopify store
 *     description: |
 *       Connect your Shopify store to ILS for automated order sync,
 *       prescription verification, and lens recommendations.
 *     tags:
 *       - Shopify Integration
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shopifyDomain
 *               - shopifyStoreId
 *               - storeName
 *               - storeUrl
 *               - accessToken
 *               - apiKey
 *               - apiSecretKey
 *             properties:
 *               shopifyDomain:
 *                 type: string
 *                 example: "mystore.myshopify.com"
 *               shopifyStoreId:
 *                 type: string
 *                 example: "12345678"
 *               storeName:
 *                 type: string
 *                 example: "My Optical Store"
 *               storeEmail:
 *                 type: string
 *                 format: email
 *               storeUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://mystore.com"
 *               accessToken:
 *                 type: string
 *                 description: Shopify access token
 *               apiKey:
 *                 type: string
 *                 description: Shopify API key
 *               apiSecretKey:
 *                 type: string
 *                 description: Shopify API secret
 *     responses:
 *       200:
 *         description: Store connected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 shopifyDomain:
 *                   type: string
 *                 storeName:
 *                   type: string
 *                 status:
 *                   type: string
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/stores/connect", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const validatedData = connectStoreSchema.parse(req.body);

    const store = await ShopifyService.connectStore({
      ...validatedData,
      companyId,
    });

    res.json(store);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error connecting store:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/shopify/stores/:storeId/settings
 * Update store settings
 */
router.put("/stores/:storeId/settings", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const { storeId } = req.params;
    const validatedData = updateStoreSettingsSchema.parse(req.body);

    const store = await ShopifyService.updateStore(storeId, companyId, validatedData);

    res.json(store);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error updating store settings:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shopify/stores/:storeId/disconnect
 * Disconnect a Shopify store
 */
router.post("/stores/:storeId/disconnect", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const { storeId } = req.params;

    const store = await ShopifyService.disconnectStore(storeId, companyId);

    res.json(store);
  } catch (error: any) {
    console.error("Error disconnecting store:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shopify/stores/:storeId/sync-products
 * Sync products from Shopify
 */
router.post("/stores/:storeId/sync-products", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const { storeId } = req.params;

    const result = await ShopifyService.syncProducts(storeId, companyId);

    res.json(result);
  } catch (error: any) {
    console.error("Error syncing products:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shopify/stores/:storeId/products
 * Get products for a store
 */
router.get("/stores/:storeId/products", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const { storeId } = req.params;

    const products = await ShopifyService.getProducts(storeId, companyId);

    res.json(products);
  } catch (error: any) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PRESCRIPTION VERIFICATION ROUTES
// ============================================================================

/**
 * @swagger
 * /api/shopify/prescriptions/upload:
 *   post:
 *     summary: Upload prescription for AI verification
 *     description: |
 *       Upload a patient's prescription image for AI-powered OCR and verification.
 *       Uses GPT-4 Vision to extract prescription data automatically.
 *     tags:
 *       - Shopify Integration
 *       - Prescription Verification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileUrl
 *               - fileName
 *               - fileType
 *               - fileSize
 *             properties:
 *               shopifyOrderId:
 *                 type: string
 *                 description: Associated Shopify order ID
 *                 example: "999888777"
 *               patientId:
 *                 type: string
 *                 description: Patient ID in ILS
 *               fileUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL of the uploaded prescription image
 *                 example: "https://cdn.example.com/rx-12345.jpg"
 *               fileName:
 *                 type: string
 *                 example: "prescription-2024.jpg"
 *               fileType:
 *                 type: string
 *                 enum: [pdf, jpg, jpeg, png]
 *                 example: "jpeg"
 *               fileSize:
 *                 type: number
 *                 description: File size in bytes
 *                 example: 1024000
 *     responses:
 *       200:
 *         description: Prescription uploaded and processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 verificationStatus:
 *                   type: string
 *                   enum: [verified, needs_review, rejected]
 *                 extractedData:
 *                   type: object
 *                   description: AI-extracted prescription data
 *                 confidence:
 *                   type: number
 *                   description: AI confidence score (0-1)
 *                 requiresReview:
 *                   type: boolean
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/prescriptions/upload", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const validatedData = uploadPrescriptionSchema.parse(req.body);

    const upload = await PrescriptionVerificationService.uploadPrescription({
      ...validatedData,
      companyId,
    });

    res.json(upload);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error uploading prescription:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shopify/prescriptions/:uploadId
 * Get prescription upload by ID
 */
router.get("/prescriptions/:uploadId", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const { uploadId } = req.params;

    const upload = await PrescriptionVerificationService.getUpload(uploadId, companyId);

    res.json(upload);
  } catch (error: any) {
    console.error("Error fetching prescription:", error);
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/shopify/prescriptions/review/pending
 * Get prescriptions requiring review
 */
router.get("/prescriptions/review/pending", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;

    const uploads = await PrescriptionVerificationService.getUploadsRequiringReview(companyId);

    res.json(uploads);
  } catch (error: any) {
    console.error("Error fetching prescriptions for review:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shopify/prescriptions/:uploadId/verify
 * Verify/approve prescription
 */
router.post("/prescriptions/:uploadId/verify", requireAuth, async (req, res) => {
  try {
    const { companyId, id: userId } = req.user!;
    const { uploadId } = req.params;
    const validatedData = verifyPrescriptionSchema.parse(req.body);

    const verified = await PrescriptionVerificationService.verifyPrescription(
      uploadId,
      companyId,
      userId,
      validatedData.prescriptionData as any
    );

    res.json(verified);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error verifying prescription:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shopify/prescriptions/:uploadId/reject
 * Reject prescription
 */
router.post("/prescriptions/:uploadId/reject", requireAuth, async (req, res) => {
  try {
    const { companyId, id: userId } = req.user!;
    const { uploadId } = req.params;
    const { rejectionReason } = rejectPrescriptionSchema.parse(req.body);

    const rejected = await PrescriptionVerificationService.rejectPrescription(
      uploadId,
      companyId,
      userId,
      rejectionReason
    );

    res.json(rejected);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error rejecting prescription:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shopify/prescriptions/status/:status
 * Get prescriptions by status
 */
router.get("/prescriptions/status/:status", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const { status } = req.params;

    const uploads = await PrescriptionVerificationService.getUploadsByStatus(companyId, status);

    res.json(uploads);
  } catch (error: any) {
    console.error("Error fetching prescriptions by status:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ORDER SYNCHRONIZATION ROUTES
// ============================================================================

/**
 * @swagger
 * /api/shopify/orders:
 *   get:
 *     summary: Get Shopify orders
 *     description: |
 *       Retrieve synchronized Shopify orders. Can filter by store or status.
 *     tags:
 *       - Shopify Integration
 *       - Order Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Filter by specific store
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [synced, pending, failed, processing]
 *         description: Filter by sync status
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   shopifyOrderId:
 *                     type: string
 *                   ilsOrderId:
 *                     type: string
 *                   status:
 *                     type: string
 *                   awaitingPrescription:
 *                     type: boolean
 *                   prescriptionId:
 *                     type: string
 *                   customerEmail:
 *                     type: string
 *                   totalPrice:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/orders", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const { storeId, status } = req.query;

    let orders;
    if (storeId) {
      orders = await ShopifyOrderSyncService.getStoreOrders(storeId as string, companyId);
    } else if (status) {
      orders = await ShopifyOrderSyncService.getOrdersByStatus(companyId, status as string);
    } else {
      // Get all orders for company
      orders = await ShopifyOrderSyncService.getOrdersByStatus(companyId, "synced");
    }

    res.json(orders);
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shopify/orders/requiring-prescription
 * Get orders that require prescription verification
 */
router.get("/orders/requiring-prescription", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;

    const orders = await ShopifyOrderSyncService.getOrdersRequiringPrescription(companyId);

    res.json(orders);
  } catch (error: any) {
    console.error("Error fetching orders requiring prescription:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shopify/orders/:orderId/create-ils-order
 * Create ILS order from Shopify order
 */
router.post("/orders/:orderId/create-ils-order", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const { orderId } = req.params;

    const ilsOrder = await ShopifyOrderSyncService.createILSOrder(orderId, companyId);

    res.json(ilsOrder);
  } catch (error: any) {
    console.error("Error creating ILS order:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shopify/orders/:orderId/fulfill
 * Fulfill Shopify order
 */
router.post("/orders/:orderId/fulfill", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const { orderId } = req.params;
    const { trackingNumber, trackingUrl } = req.body;

    const fulfilled = await ShopifyOrderSyncService.fulfillShopifyOrder(
      orderId,
      companyId,
      trackingNumber,
      trackingUrl
    );

    res.json(fulfilled);
  } catch (error: any) {
    console.error("Error fulfilling order:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shopify/orders/:orderId/retry-sync
 * Retry failed order sync
 */
router.post("/orders/:orderId/retry-sync", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const { orderId } = req.params;

    const result = await ShopifyOrderSyncService.retryOrderSync(orderId, companyId);

    res.json(result);
  } catch (error: any) {
    console.error("Error retrying order sync:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shopify/orders/statistics
 * Get order statistics
 */
router.get("/orders/statistics", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const { storeId } = req.query;

    const stats = await ShopifyOrderSyncService.getOrderStatistics(
      companyId,
      storeId as string | undefined
    );

    res.json(stats);
  } catch (error: any) {
    console.error("Error fetching order statistics:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// WEBHOOK ROUTES (Public - No Auth)
// ============================================================================

/**
 * POST /api/shopify/webhooks
 * Receive webhooks from Shopify
 */
router.post("/webhooks", async (req, res) => {
  try {
    const topic = req.headers["x-shopify-topic"] as string;
    const hmac = req.headers["x-shopify-hmac-sha256"] as string;
    const shopDomain = req.headers["x-shopify-shop-domain"] as string;

    if (!topic || !hmac || !shopDomain) {
      return res.status(400).json({ error: "Missing required headers" });
    }

    // Find store by domain
    const stores = await db.query.shopifyStores.findMany({
      where: (stores, { eq }) => eq(stores.shopifyDomain, shopDomain),
      limit: 1,
    });

    if (stores.length === 0) {
      return res.status(404).json({ error: "Store not found" });
    }

    const store = stores[0];

    // Verify webhook signature
    const body = JSON.stringify(req.body);
    const webhookSecret = ShopifyService.decryptCredential(store.webhookSecret!);
    const signatureValid = ShopifyService.verifyWebhookSignature(body, hmac, webhookSecret);

    // Log webhook
    const webhook = await ShopifyService.logWebhook({
      shopifyStoreId: store.id,
      webhookTopic: topic,
      payload: req.body,
      headers: req.headers as any,
      signatureValid,
    });

    if (!signatureValid) {
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    // Process webhook asynchronously
    ShopifyWebhookHandler.processWebhook(webhook.id).catch((error) => {
      console.error("Webhook processing failed:", error);
    });

    res.json({ success: true, webhookId: webhook.id });
  } catch (error: any) {
    console.error("Error handling webhook:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shopify/webhooks/process-unprocessed
 * Process unprocessed webhooks (background job)
 */
router.post("/webhooks/process-unprocessed", requireAuth, async (req, res) => {
  try {
    const result = await ShopifyWebhookHandler.processUnprocessedWebhooks();

    res.json(result);
  } catch (error: any) {
    console.error("Error processing unprocessed webhooks:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ANALYTICS & STATISTICS ROUTES
// ============================================================================

/**
 * GET /api/shopify/analytics/dashboard
 * Get Shopify integration dashboard analytics
 */
router.get("/analytics/dashboard", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;

    // Get all relevant statistics
    const stores = await ShopifyService.getStores(companyId);
    const orderStats = await ShopifyOrderSyncService.getOrderStatistics(companyId);
    const prescriptionsRequiringReview =
      await PrescriptionVerificationService.getUploadsRequiringReview(companyId);

    const analytics = {
      stores: {
        total: stores.length,
        active: stores.filter((s) => s.status === "active").length,
        inactive: stores.filter((s) => s.status === "inactive").length,
      },
      orders: orderStats,
      prescriptions: {
        requiresReview: prescriptionsRequiringReview.length,
      },
      lastUpdated: new Date(),
    };

    res.json(analytics);
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

// Need to import db for webhook route
import { db } from "../db";
