import { db } from "../db";
import { shopifyStores, shopifyProducts, shopifyWebhooks } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";
import logger from '../utils/logger';


interface ShopifyStoreConfig {
  shopifyDomain: string;
  shopifyStoreId: string;
  storeName: string;
  storeEmail?: string;
  storeUrl: string;
  accessToken: string;
  apiKey: string;
  apiSecretKey: string;
  companyId: string;
}

interface ShopifyAPIConfig {
  storeDomain: string;
  accessToken: string;
  apiVersion?: string;
}

export class ShopifyService {
  private static readonly API_VERSION = "2024-01";

  /**
   * Install/Connect a Shopify store
   */
  static async connectStore(config: ShopifyStoreConfig) {
    // Encrypt sensitive credentials
    const encryptedAccessToken = this.encryptCredential(config.accessToken);
    const encryptedApiSecret = this.encryptCredential(config.apiSecretKey);

    // Generate webhook secret for verification
    const webhookSecret = crypto.randomBytes(32).toString("hex");

    const [store] = await db
      .insert(shopifyStores)
      .values({
        companyId: config.companyId,
        shopifyDomain: config.shopifyDomain,
        shopifyStoreId: config.shopifyStoreId,
        storeName: config.storeName,
        storeEmail: config.storeEmail,
        storeUrl: config.storeUrl,
        accessToken: encryptedAccessToken,
        apiKey: config.apiKey,
        apiSecretKey: encryptedApiSecret,
        webhookSecret: this.encryptCredential(webhookSecret),
        status: "active",
      })
      .returning();

    // Register webhooks with Shopify
    await this.registerWebhooks(store.id, {
      storeDomain: config.shopifyDomain,
      accessToken: config.accessToken,
    });

    return store;
  }

  /**
   * Update store connection
   */
  static async updateStore(storeId: string, companyId: string, updates: Partial<ShopifyStoreConfig>) {
    const updateData: any = {};

    if (updates.accessToken) {
      updateData.accessToken = this.encryptCredential(updates.accessToken);
    }
    if (updates.apiSecretKey) {
      updateData.apiSecretKey = this.encryptCredential(updates.apiSecretKey);
    }
    if (updates.storeName) updateData.storeName = updates.storeName;
    if (updates.storeEmail) updateData.storeEmail = updates.storeEmail;

    updateData.updatedAt = new Date();

    const [store] = await db
      .update(shopifyStores)
      .set(updateData)
      .where(and(eq(shopifyStores.id, storeId), eq(shopifyStores.companyId, companyId)))
      .returning();

    if (!store) {
      throw new Error("Store not found");
    }

    return store;
  }

  /**
   * Get store by ID
   */
  static async getStore(storeId: string, companyId: string) {
    const [store] = await db
      .select()
      .from(shopifyStores)
      .where(and(eq(shopifyStores.id, storeId), eq(shopifyStores.companyId, companyId)))
      .limit(1);

    if (!store) {
      throw new Error("Store not found");
    }

    return store;
  }

  /**
   * Get all stores for a company
   */
  static async getStores(companyId: string) {
    return await db
      .select()
      .from(shopifyStores)
      .where(eq(shopifyStores.companyId, companyId));
  }

  /**
   * Disconnect/Deactivate store
   */
  static async disconnectStore(storeId: string, companyId: string) {
    const [store] = await db
      .update(shopifyStores)
      .set({
        status: "inactive",
        updatedAt: new Date(),
      })
      .where(and(eq(shopifyStores.id, storeId), eq(shopifyStores.companyId, companyId)))
      .returning();

    if (!store) {
      throw new Error("Store not found");
    }

    // Unregister webhooks
    const apiConfig = await this.getStoreAPIConfig(storeId, companyId);
    await this.unregisterWebhooks(apiConfig);

    return store;
  }

  /**
   * Register webhooks with Shopify
   */
  private static async registerWebhooks(storeId: string, apiConfig: ShopifyAPIConfig) {
    const webhookTopics = [
      "orders/create",
      "orders/updated",
      "orders/fulfilled",
      "orders/cancelled",
      "products/create",
      "products/update",
      "products/delete",
    ];

    const callbackUrl = process.env.SHOPIFY_WEBHOOK_URL || `${process.env.APP_URL}/api/shopify/webhooks`;

    for (const topic of webhookTopics) {
      try {
        await this.makeShopifyRequest(apiConfig, "POST", "/admin/api/webhooks.json", {
          webhook: {
            topic,
            address: callbackUrl,
            format: "json",
          },
        });
      } catch (error: any) {
        logger.error(`Failed to register webhook ${topic}:`, error.message);
      }
    }
  }

  /**
   * Unregister webhooks from Shopify
   */
  private static async unregisterWebhooks(apiConfig: ShopifyAPIConfig) {
    try {
      const webhooks = await this.makeShopifyRequest(apiConfig, "GET", "/admin/api/webhooks.json");

      for (const webhook of webhooks.webhooks || []) {
        await this.makeShopifyRequest(apiConfig, "DELETE", `/admin/api/webhooks/${webhook.id}.json`);
      }
    } catch (error: any) {
      logger.error("Failed to unregister webhooks:", error.message);
    }
  }

  /**
   * Make API request to Shopify
   */
  static async makeShopifyRequest(
    config: ShopifyAPIConfig,
    method: string,
    endpoint: string,
    body?: any
  ): Promise<any> {
    const apiVersion = config.apiVersion || this.API_VERSION;
    const url = `https://${config.storeDomain}/admin/api/${apiVersion}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": config.accessToken,
      },
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify API error (${response.status}): ${errorText}`);
    }

    if (response.status === 204) {
      return {}; // No content
    }

    return await response.json();
  }

  /**
   * Get store API configuration
   */
  static async getStoreAPIConfig(storeId: string, companyId: string): Promise<ShopifyAPIConfig> {
    const store = await this.getStore(storeId, companyId);

    return {
      storeDomain: store.shopifyDomain,
      accessToken: this.decryptCredential(store.accessToken),
    };
  }

  /**
   * Verify webhook signature from Shopify
   */
  static verifyWebhookSignature(body: string, hmacHeader: string, secret: string): boolean {
    const hash = crypto.createHmac("sha256", secret).update(body, "utf8").digest("base64");
    return hash === hmacHeader;
  }

  /**
   * Sync products from Shopify
   */
  static async syncProducts(storeId: string, companyId: string) {
    const apiConfig = await this.getStoreAPIConfig(storeId, companyId);

    // Fetch products from Shopify
    const response = await this.makeShopifyRequest(apiConfig, "GET", "/admin/api/products.json?limit=250");

    const products = response.products || [];
    const syncedProducts = [];

    for (const shopifyProduct of products) {
      for (const variant of shopifyProduct.variants || []) {
        // Check if product already exists
        const [existingProduct] = await db
          .select()
          .from(shopifyProducts)
          .where(
            and(
              eq(shopifyProducts.shopifyStoreId, storeId),
              eq(shopifyProducts.shopifyProductId, String(shopifyProduct.id)),
              eq(shopifyProducts.shopifyVariantId, String(variant.id))
            )
          )
          .limit(1);

        const productData = {
          companyId,
          shopifyStoreId: storeId,
          shopifyProductId: String(shopifyProduct.id),
          shopifyVariantId: String(variant.id),
          productTitle: shopifyProduct.title,
          productType: shopifyProduct.product_type || "unknown",
          sku: variant.sku || "",
          price: String(variant.price),
          compareAtPrice: variant.compare_at_price ? String(variant.compare_at_price) : null,
          inventoryQuantity: variant.inventory_quantity || 0,
          trackInventory: variant.inventory_management === "shopify",
          productMetadata: {
            vendor: shopifyProduct.vendor,
            tags: shopifyProduct.tags,
            variantTitle: variant.title,
          },
          lastSyncedAt: new Date(),
        };

        if (existingProduct) {
          // Update existing product
          const [updated] = await db
            .update(shopifyProducts)
            .set({...productData, updatedAt: new Date()})
            .where(eq(shopifyProducts.id, existingProduct.id))
            .returning();
          syncedProducts.push(updated);
        } else {
          // Create new product
          const [created] = await db
            .insert(shopifyProducts)
            .values(productData)
            .returning();
          syncedProducts.push(created);
        }
      }
    }

    // Update store last sync time
    await db
      .update(shopifyStores)
      .set({ lastSyncAt: new Date() })
      .where(eq(shopifyStores.id, storeId));

    return {
      syncedCount: syncedProducts.length,
      products: syncedProducts,
    };
  }

  /**
   * Get products for a store
   */
  static async getProducts(storeId: string, companyId: string) {
    return await db
      .select()
      .from(shopifyProducts)
      .where(
        and(eq(shopifyProducts.shopifyStoreId, storeId), eq(shopifyProducts.companyId, companyId))
      );
  }

  /**
   * Update product inventory in Shopify
   */
  static async updateProductInventory(
    storeId: string,
    companyId: string,
    shopifyInventoryItemId: string,
    quantity: number
  ) {
    const apiConfig = await this.getStoreAPIConfig(storeId, companyId);

    const response = await this.makeShopifyRequest(apiConfig, "POST", "/admin/api/inventory_levels/set.json", {
      location_id: await this.getDefaultLocationId(apiConfig),
      inventory_item_id: shopifyInventoryItemId,
      available: quantity,
    });

    return response;
  }

  /**
   * Get default location ID from Shopify
   */
  private static async getDefaultLocationId(apiConfig: ShopifyAPIConfig): Promise<string> {
    const response = await this.makeShopifyRequest(apiConfig, "GET", "/admin/api/locations.json");
    const locations = response.locations || [];

    if (locations.length === 0) {
      throw new Error("No locations found in Shopify store");
    }

    return String(locations[0].id);
  }

  /**
   * Update order fulfillment in Shopify
   */
  static async fulfillOrder(
    storeId: string,
    companyId: string,
    shopifyOrderId: string,
    trackingNumber?: string,
    trackingUrl?: string
  ) {
    const apiConfig = await this.getStoreAPIConfig(storeId, companyId);

    const fulfillmentData: any = {
      location_id: await this.getDefaultLocationId(apiConfig),
      tracking_number: trackingNumber,
      tracking_urls: trackingUrl ? [trackingUrl] : [],
      notify_customer: true,
    };

    const response = await this.makeShopifyRequest(
      apiConfig,
      "POST",
      `/admin/api/orders/${shopifyOrderId}/fulfillments.json`,
      { fulfillment: fulfillmentData }
    );

    return response.fulfillment;
  }

  /**
   * Encrypt credential for storage
   */
  private static encryptCredential(credential: string): string {
    const algorithm = "aes-256-cbc";
    const key = Buffer.from(process.env.ENCRYPTION_KEY || crypto.randomBytes(32));
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(credential, "utf8", "hex");
    encrypted += cipher.final("hex");

    return iv.toString("hex") + ":" + encrypted;
  }

  /**
   * Decrypt credential from storage
   */
  private static decryptCredential(encryptedCredential: string): string {
    const algorithm = "aes-256-cbc";
    const key = Buffer.from(process.env.ENCRYPTION_KEY || crypto.randomBytes(32));

    const parts = encryptedCredential.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = parts[1];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  /**
   * Log webhook event
   */
  static async logWebhook(data: {
    shopifyStoreId: string;
    webhookTopic: string;
    payload: any;
    headers: any;
    signatureValid: boolean;
  }) {
    const [webhook] = await db
      .insert(shopifyWebhooks)
      .values({
        shopifyStoreId: data.shopifyStoreId,
        webhookTopic: data.webhookTopic,
        payload: data.payload,
        headers: data.headers,
        signatureValid: data.signatureValid,
        processed: false,
      })
      .returning();

    return webhook;
  }

  /**
   * Mark webhook as processed
   */
  static async markWebhookProcessed(webhookId: string, error?: string) {
    const [webhook] = await db
      .update(shopifyWebhooks)
      .set({
        processed: true,
        processedAt: new Date(),
        processingError: error || null,
      })
      .where(eq(shopifyWebhooks.id, webhookId))
      .returning();

    return webhook;
  }

  /**
   * Increment webhook retry count
   */
  static async incrementWebhookRetry(webhookId: string) {
    await db
      .update(shopifyWebhooks)
      .set({
        processingRetryCount: sql`processing_retry_count + 1`,
      })
      .where(eq(shopifyWebhooks.id, webhookId));
  }

  // ========== Additional Methods ==========

  /**
   * Get orders from Shopify
   */
  static async getOrders(storeId: string, companyId: string, filters?: {
    status?: string;
    limit?: number;
    sinceId?: string;
  }) {
    const apiConfig = await this.getStoreAPIConfig(storeId, companyId);

    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sinceId) params.append('since_id', filters.sinceId);

    const response = await this.makeShopifyRequest(
      apiConfig,
      'GET',
      `/admin/api/${this.API_VERSION}/orders.json?${params.toString()}`
    );

    return response.orders || [];
  }

  /**
   * Sync a single order
   */
  static async syncOrder(storeId: string, companyId: string, orderId: string) {
    const apiConfig = await this.getStoreAPIConfig(storeId, companyId);

    const response = await this.makeShopifyRequest(
      apiConfig,
      'GET',
      `/admin/api/${this.API_VERSION}/orders/${orderId}.json`
    );

    return response.order;
  }

  /**
   * Create fulfillment (alias for fulfillOrder)
   */
  static async createFulfillment(
    storeId: string,
    companyId: string,
    orderId: string,
    fulfillmentData: {
      trackingNumber?: string;
      trackingUrl?: string;
      trackingCompany?: string;
      lineItems: { id: string; quantity: number }[];
    }
  ) {
    return this.fulfillOrder(storeId, companyId, orderId, fulfillmentData);
  }

  /**
   * Generate webhook signature for verification
   */
  static generateWebhookSignature(body: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('base64');
  }

  /**
   * Verify webhook request
   */
  static verifyWebhook(body: string, hmacHeader: string, secret: string): boolean {
    return this.verifyWebhookSignature(body, hmacHeader, secret);
  }

  /**
   * Handle incoming webhook
   */
  static async handleWebhook(
    storeId: string,
    companyId: string,
    topic: string,
    payload: any
  ) {
    // Log the webhook
    const webhook = await this.logWebhook({
      storeId,
      topic,
      payload,
      receivedAt: new Date(),
    });

    // Process based on topic
    try {
      switch (topic) {
        case 'orders/create':
        case 'orders/updated':
          // Handle order webhook
          await this.syncOrder(storeId, companyId, payload.id.toString());
          break;
        case 'products/create':
        case 'products/update':
          // Handle product webhook
          await this.syncProducts(storeId, companyId);
          break;
        default:
          logger.info(`Unhandled webhook topic: ${topic}`);
      }

      await this.markWebhookProcessed(webhook.id);
    } catch (error) {
      await this.markWebhookProcessed(webhook.id, (error as Error).message);
      throw error;
    }

    return webhook;
  }
}

// Backwards-compatible service object used by routes via dynamic import
export const shopifyService = {
  async getSyncStatus(companyId: string) {
    const stores = await ShopifyService.getStores(companyId);
    return {
      storeCount: stores.length,
      stores: stores.map((s: any) => ({ id: s.id, shopifyDomain: s.shopifyDomain, status: s.status })),
    };
  },

  async verifyConnection(opts: { shopUrl: string; accessToken: string; apiVersion?: string }) {
    try {
      await ShopifyService.makeShopifyRequest({ storeDomain: opts.shopUrl, accessToken: opts.accessToken, apiVersion: opts.apiVersion }, 'GET', '/admin/api/shop.json');
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || String(err) };
    }
  },

  async syncCustomers(companyId: string, user: any) {
    // Minimal placeholder implementation: caller should implement full sync logic.
    // For now, return a safe, typed response indicating no-op.
    return { synced: 0, message: 'syncCustomers not implemented in this environment' } as const;
  }
};
