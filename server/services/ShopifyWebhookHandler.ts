import { ShopifyService } from "./ShopifyService";
import { ShopifyOrderSyncService } from "./ShopifyOrderSyncService";
import { db } from "../db";
import { shopifyStores, shopifyProducts, shopifyOrders } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export class ShopifyWebhookHandler {
  /**
   * Process webhook event
   */
  static async processWebhook(webhookId: string) {
    const webhook = await db.query.shopifyWebhooks.findFirst({
      where: (webhooks, { eq }) => eq(webhooks.id, webhookId),
    });

    if (!webhook) {
      throw new Error("Webhook not found");
    }

    if (webhook.processed) {
      return { success: true, message: "Webhook already processed" };
    }

    try {
      // Route to appropriate handler based on topic
      switch (webhook.webhookTopic) {
        case "orders/create":
          await this.handleOrderCreated(webhook.payload, webhook.shopifyStoreId!);
          break;

        case "orders/updated":
          await this.handleOrderUpdated(webhook.payload, webhook.shopifyStoreId!);
          break;

        case "orders/fulfilled":
          await this.handleOrderFulfilled(webhook.payload, webhook.shopifyStoreId!);
          break;

        case "orders/cancelled":
          await this.handleOrderCancelled(webhook.payload, webhook.shopifyStoreId!);
          break;

        case "products/create":
        case "products/update":
          await this.handleProductSync(webhook.payload, webhook.shopifyStoreId!);
          break;

        case "products/delete":
          await this.handleProductDelete(webhook.payload, webhook.shopifyStoreId!);
          break;

        default:
          console.log(`Unhandled webhook topic: ${webhook.webhookTopic}`);
      }

      // Mark as processed
      await ShopifyService.markWebhookProcessed(webhookId);

      return { success: true, message: "Webhook processed successfully" };
    } catch (error: any) {
      console.error("Webhook processing error:", error);

      // Increment retry count
      await ShopifyService.incrementWebhookRetry(webhookId);

      // If retry count exceeds threshold, mark as failed
      if (webhook.processingRetryCount >= 3) {
        await ShopifyService.markWebhookProcessed(webhookId, error.message);
      }

      throw error;
    }
  }

  /**
   * Handle order created webhook
   */
  private static async handleOrderCreated(payload: any, storeId: string) {
    // Get store to get companyId
    const [store] = await db
      .select()
      .from(shopifyStores)
      .where(eq(shopifyStores.id, storeId))
      .limit(1);

    if (!store) {
      throw new Error("Store not found");
    }

    // Extract order data from payload
    const orderData = {
      shopifyOrderId: String(payload.id),
      shopifyOrderNumber: String(payload.order_number),
      shopifyOrderName: payload.name,
      customerEmail: payload.customer?.email || payload.email || "",
      customerPhone: payload.customer?.phone || payload.phone || null,
      customerName: `${payload.customer?.first_name || ""} ${payload.customer?.last_name || ""}`.trim() || "Guest",
      shippingAddress: payload.shipping_address || null,
      billingAddress: payload.billing_address || null,
      orderItems: payload.line_items || [],
      subtotal: payload.subtotal_price || "0",
      tax: payload.total_tax || "0",
      shipping: payload.total_shipping_price_set?.shop_money?.amount || "0",
      total: payload.total_price || "0",
      currency: payload.currency || "GBP",
      shopifyFulfillmentStatus: payload.fulfillment_status,
      shopifyFinancialStatus: payload.financial_status,
      shopifyCreatedAt: payload.created_at,
      shopifyUpdatedAt: payload.updated_at,
    };

    // Sync order to ILS
    await ShopifyOrderSyncService.syncOrderFromShopify(
      storeId,
      store.companyId,
      orderData
    );

    console.log(`Order created: ${orderData.shopifyOrderName}`);
  }

  /**
   * Handle order updated webhook
   */
  private static async handleOrderUpdated(payload: any, storeId: string) {
    // Get store to get companyId
    const [store] = await db
      .select()
      .from(shopifyStores)
      .where(eq(shopifyStores.id, storeId))
      .limit(1);

    if (!store) {
      throw new Error("Store not found");
    }

    // Extract order data
    const orderData = {
      shopifyOrderId: String(payload.id),
      shopifyOrderNumber: String(payload.order_number),
      shopifyOrderName: payload.name,
      customerEmail: payload.customer?.email || payload.email || "",
      customerPhone: payload.customer?.phone || payload.phone || null,
      customerName: `${payload.customer?.first_name || ""} ${payload.customer?.last_name || ""}`.trim() || "Guest",
      shippingAddress: payload.shipping_address || null,
      billingAddress: payload.billing_address || null,
      orderItems: payload.line_items || [],
      subtotal: payload.subtotal_price || "0",
      tax: payload.total_tax || "0",
      shipping: payload.total_shipping_price_set?.shop_money?.amount || "0",
      total: payload.total_price || "0",
      currency: payload.currency || "GBP",
      shopifyFulfillmentStatus: payload.fulfillment_status,
      shopifyFinancialStatus: payload.financial_status,
      shopifyCreatedAt: payload.created_at,
      shopifyUpdatedAt: payload.updated_at,
    };

    // Sync order (will update if exists, create if not)
    await ShopifyOrderSyncService.syncOrderFromShopify(
      storeId,
      store.companyId,
      orderData
    );

    console.log(`Order updated: ${orderData.shopifyOrderName}`);
  }

  /**
   * Handle order fulfilled webhook
   */
  private static async handleOrderFulfilled(payload: any, storeId: string) {
    // Find order by Shopify ID
    const [order] = await db.query.shopifyOrders.findMany({
      where: (orders, { and, eq }) => and(
        eq(orders.shopifyStoreId, storeId),
        eq(orders.shopifyOrderId, String(payload.id))
      ),
      limit: 1,
    });

    if (order) {
      // Update fulfillment status
      await db
        .update(shopifyOrders)
        .set({
          shopifyFulfillmentStatus: "fulfilled",
          fulfilledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(shopifyOrders.id, order.id));

      console.log(`Order fulfilled: ${order.shopifyOrderName}`);
    }
  }

  /**
   * Handle order cancelled webhook
   */
  private static async handleOrderCancelled(payload: any, storeId: string) {
    // Find order by Shopify ID
    const [order] = await db.query.shopifyOrders.findMany({
      where: (orders, { and, eq }) => and(
        eq(orders.shopifyStoreId, storeId),
        eq(orders.shopifyOrderId, String(payload.id))
      ),
      limit: 1,
    });

    if (order) {
      // Update sync status to cancelled
      await db
        .update(shopifyOrders)
        .set({
          syncStatus: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(shopifyOrders.id, order.id));

      console.log(`Order cancelled: ${order.shopifyOrderName}`);
    }
  }

  /**
   * Handle product sync webhook (create/update)
   */
  private static async handleProductSync(payload: any, storeId: string) {
    // Get store to get companyId
    const [store] = await db
      .select()
      .from(shopifyStores)
      .where(eq(shopifyStores.id, storeId))
      .limit(1);

    if (!store) {
      throw new Error("Store not found");
    }

    // Trigger product sync
    await ShopifyService.syncProducts(storeId, store.companyId);

    console.log(`Product synced: ${payload.title}`);
  }

  /**
   * Handle product delete webhook
   */
  private static async handleProductDelete(payload: any, storeId: string) {
    // Get store to get companyId
    const [store] = await db
      .select()
      .from(shopifyStores)
      .where(eq(shopifyStores.id, storeId))
      .limit(1);

    if (!store) {
      throw new Error("Store not found");
    }

    // Find and deactivate products
    const productsToDelete = await db
      .select()
      .from(shopifyProducts)
      .where(
        and(
          eq(shopifyProducts.shopifyStoreId, storeId),
          eq(shopifyProducts.shopifyProductId, String(payload.id))
        )
      );

    for (const product of productsToDelete) {
      await db
        .update(shopifyProducts)
        .set({
          syncEnabled: false,
          updatedAt: new Date(),
        })
        .where(eq(shopifyProducts.id, product.id));
    }

    console.log(`Product deleted: ${payload.title}`);
  }

  /**
   * Process unprocessed webhooks (background job)
   */
  static async processUnprocessedWebhooks() {
    const unprocessedWebhooks = await db.query.shopifyWebhooks.findMany({
      where: (webhooks, { eq }) => eq(webhooks.processed, false),
      limit: 50,
      orderBy: (webhooks, { asc }) => [asc(webhooks.receivedAt)],
    });

    console.log(`Processing ${unprocessedWebhooks.length} unprocessed webhooks`);

    for (const webhook of unprocessedWebhooks) {
      try {
        await this.processWebhook(webhook.id);
      } catch (error) {
        console.error(`Failed to process webhook ${webhook.id}:`, error);
        // Continue with next webhook
      }
    }

    return {
      processed: unprocessedWebhooks.length,
    };
  }
}
