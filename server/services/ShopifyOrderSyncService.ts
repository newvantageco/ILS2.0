import { db } from "../db";
import { shopifyOrders, shopifyStores, orders, patients } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { ShopifyService } from "./ShopifyService";
import { OphthalamicAIService } from "./OphthalamicAIService";

interface ShopifyOrderData {
  shopifyOrderId: string;
  shopifyOrderNumber: string;
  shopifyOrderName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerName: string;
  shippingAddress: any;
  billingAddress: any;
  orderItems: any[];
  subtotal: string;
  tax: string;
  shipping: string;
  total: string;
  currency: string;
  shopifyFulfillmentStatus: string | null;
  shopifyFinancialStatus: string;
  shopifyCreatedAt: string;
  shopifyUpdatedAt: string;
}

export class ShopifyOrderSyncService {
  /**
   * Sync order from Shopify to ILS
   */
  static async syncOrderFromShopify(
    storeId: string,
    companyId: string,
    orderData: ShopifyOrderData
  ) {
    // Check if order already exists
    const [existingOrder] = await db
      .select()
      .from(shopifyOrders)
      .where(
        and(
          eq(shopifyOrders.shopifyStoreId, storeId),
          eq(shopifyOrders.shopifyOrderId, orderData.shopifyOrderId)
        )
      )
      .limit(1);

    if (existingOrder) {
      // Update existing order
      return await this.updateShopifyOrder(existingOrder.id, orderData);
    }

    // Create new order
    return await this.createShopifyOrder(storeId, companyId, orderData);
  }

  /**
   * Create new Shopify order in ILS
   */
  private static async createShopifyOrder(
    storeId: string,
    companyId: string,
    orderData: ShopifyOrderData
  ) {
    // Check if customer exists as patient, create if not
    const patientId = await this.findOrCreatePatient(companyId, {
      email: orderData.customerEmail,
      name: orderData.customerName,
      phone: orderData.customerPhone,
      shippingAddress: orderData.shippingAddress,
    });

    // Analyze order items for prescription products
    const hasLensProducts = this.detectLensProducts(orderData.orderItems);

    // If order contains lenses, get AI recommendations
    let aiRecommendations = null;
    if (hasLensProducts) {
      try {
        aiRecommendations = await this.generateAIRecommendations(orderData.orderItems);
      } catch (error) {
        console.error("Failed to generate AI recommendations:", error);
      }
    }

    // Create Shopify order record
    const [shopifyOrder] = await db
      .insert(shopifyOrders)
      .values({
        companyId,
        shopifyStoreId: storeId,
        patientId,
        shopifyOrderNumber: orderData.shopifyOrderNumber,
        shopifyOrderId: orderData.shopifyOrderId,
        shopifyOrderName: orderData.shopifyOrderName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        customerName: orderData.customerName,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        orderItems: orderData.orderItems,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        shipping: orderData.shipping,
        total: orderData.total,
        currency: orderData.currency,
        syncStatus: "synced",
        shopifyFulfillmentStatus: orderData.shopifyFulfillmentStatus,
        shopifyFinancialStatus: orderData.shopifyFinancialStatus,
        aiRecommendations: aiRecommendations as any,
        shopifyCreatedAt: new Date(orderData.shopifyCreatedAt),
        shopifyUpdatedAt: new Date(orderData.shopifyUpdatedAt),
        syncedAt: new Date(),
      })
      .returning();

    // Check if prescription is required
    const store = await ShopifyService.getStore(storeId, companyId);
    if (store.requirePrescriptionUpload && hasLensProducts) {
      // Mark order as requiring prescription
      await db
        .update(shopifyOrders)
        .set({
          prescriptionVerified: false,
          updatedAt: new Date(),
        })
        .where(eq(shopifyOrders.id, shopifyOrder.id));
    }

    return shopifyOrder;
  }

  /**
   * Update existing Shopify order
   */
  private static async updateShopifyOrder(orderId: string, orderData: ShopifyOrderData) {
    const [updated] = await db
      .update(shopifyOrders)
      .set({
        shopifyOrderNumber: orderData.shopifyOrderNumber,
        shopifyOrderName: orderData.shopifyOrderName,
        orderItems: orderData.orderItems,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        shipping: orderData.shipping,
        total: orderData.total,
        shopifyFulfillmentStatus: orderData.shopifyFulfillmentStatus,
        shopifyFinancialStatus: orderData.shopifyFinancialStatus,
        shopifyUpdatedAt: new Date(orderData.shopifyUpdatedAt),
        syncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(shopifyOrders.id, orderId))
      .returning();

    return updated;
  }

  /**
   * Find existing patient or create new one
   */
  private static async findOrCreatePatient(
    companyId: string,
    customerData: {
      email: string;
      name: string;
      phone: string | null;
      shippingAddress: any;
    }
  ): Promise<string> {
    // Try to find existing patient by email
    if (customerData.email) {
      const [existingPatient] = await db
        .select()
        .from(patients)
        .where(
          and(
            eq(patients.companyId, companyId),
            eq(patients.email, customerData.email.toLowerCase())
          )
        )
        .limit(1);

      if (existingPatient) {
        return existingPatient.id;
      }
    }

    // Create new patient
    const [newPatient] = await db
      .insert(patients)
      .values({
        companyId,
        name: customerData.name,
        email: customerData.email?.toLowerCase() || null,
        phone: customerData.phone,
        fullAddress: customerData.shippingAddress
          ? {
              address: customerData.shippingAddress.address1,
              address2: customerData.shippingAddress.address2,
              city: customerData.shippingAddress.city,
              province: customerData.shippingAddress.province,
              country: customerData.shippingAddress.country,
              postcode: customerData.shippingAddress.zip,
            }
          : null,
        customerReferenceLabel: "Shopify Customer",
      })
      .returning();

    return newPatient.id;
  }

  /**
   * Detect if order contains lens products
   */
  private static detectLensProducts(orderItems: any[]): boolean {
    const lensKeywords = [
      "lens",
      "lenses",
      "glasses",
      "spectacles",
      "eyeglasses",
      "prescription",
      "progressive",
      "bifocal",
      "single vision",
      "varifocal",
    ];

    return orderItems.some((item) => {
      const title = item.title?.toLowerCase() || "";
      const productType = item.product_type?.toLowerCase() || "";
      return lensKeywords.some((keyword) => title.includes(keyword) || productType.includes(keyword));
    });
  }

  /**
   * Generate AI recommendations for order
   */
  private static async generateAIRecommendations(orderItems: any[]): Promise<any> {
    // Extract product information
    const productDescriptions = orderItems.map((item) => ({
      title: item.title,
      variant: item.variant_title,
      quantity: item.quantity,
      price: item.price,
    }));

    const question = `Based on these products ordered: ${JSON.stringify(productDescriptions)},
    what lens types, coatings, and features would you recommend? Consider:
    - Best lens material for the use case
    - Recommended coatings (anti-reflective, blue light filter, etc.)
    - Any additional features or upgrades
    Provide recommendations in JSON format.`;

    try {
      const recommendations = await OphthalamicAIService.query({
        question,
        context: {
          companyId: "", // Will be filled by caller
          conversationHistory: [],
        },
      });

      return recommendations;
    } catch (error) {
      console.error("AI recommendations failed:", error);
      return null;
    }
  }

  /**
   * Create ILS order from Shopify order
   */
  static async createILSOrder(shopifyOrderId: string, companyId: string) {
    // Get Shopify order
    const [shopifyOrder] = await db
      .select()
      .from(shopifyOrders)
      .where(
        and(eq(shopifyOrders.id, shopifyOrderId), eq(shopifyOrders.companyId, companyId))
      )
      .limit(1);

    if (!shopifyOrder) {
      throw new Error("Shopify order not found");
    }

    if (shopifyOrder.ilsOrderId) {
      throw new Error("ILS order already created for this Shopify order");
    }

    // Check if prescription is verified (if required)
    const store = await ShopifyService.getStore(shopifyOrder.shopifyStoreId, companyId);
    if (store.requirePrescriptionUpload && !shopifyOrder.prescriptionVerified) {
      throw new Error("Prescription verification required before creating order");
    }

    // Create ILS order
    const [ilsOrder] = await db
      .insert(orders)
      .values({
        companyId,
        patientId: shopifyOrder.patientId!,
        status: "pending",
        orderType: "retail",
        orderSource: "shopify",
        orderNotes: `Shopify Order: ${shopifyOrder.shopifyOrderName}`,
        totalAmount: shopifyOrder.total,
        // Additional order details would be mapped from Shopify order items
      })
      .returning();

    // Link Shopify order to ILS order
    await db
      .update(shopifyOrders)
      .set({
        ilsOrderId: ilsOrder.id,
        syncStatus: "processing",
        updatedAt: new Date(),
      })
      .where(eq(shopifyOrders.id, shopifyOrderId));

    return ilsOrder;
  }

  /**
   * Update Shopify order fulfillment status
   */
  static async fulfillShopifyOrder(
    shopifyOrderId: string,
    companyId: string,
    trackingNumber?: string,
    trackingUrl?: string
  ) {
    // Get Shopify order
    const [shopifyOrder] = await db
      .select()
      .from(shopifyOrders)
      .where(
        and(eq(shopifyOrders.id, shopifyOrderId), eq(shopifyOrders.companyId, companyId))
      )
      .limit(1);

    if (!shopifyOrder) {
      throw new Error("Shopify order not found");
    }

    // Update fulfillment in Shopify
    await ShopifyService.fulfillOrder(
      shopifyOrder.shopifyStoreId,
      companyId,
      shopifyOrder.shopifyOrderId,
      trackingNumber,
      trackingUrl
    );

    // Update local record
    const [updated] = await db
      .update(shopifyOrders)
      .set({
        syncStatus: "completed",
        shopifyFulfillmentStatus: "fulfilled",
        fulfilledAt: new Date(),
        trackingNumber,
        trackingUrl,
        updatedAt: new Date(),
      })
      .where(eq(shopifyOrders.id, shopifyOrderId))
      .returning();

    return updated;
  }

  /**
   * Get orders requiring prescription
   */
  static async getOrdersRequiringPrescription(companyId: string) {
    return await db
      .select()
      .from(shopifyOrders)
      .where(
        and(
          eq(shopifyOrders.companyId, companyId),
          eq(shopifyOrders.prescriptionVerified, false),
          eq(shopifyOrders.syncStatus, "synced")
        )
      )
      .orderBy(shopifyOrders.shopifyCreatedAt);
  }

  /**
   * Get orders by status
   */
  static async getOrdersByStatus(companyId: string, status: string) {
    return await db
      .select()
      .from(shopifyOrders)
      .where(and(eq(shopifyOrders.companyId, companyId), eq(shopifyOrders.syncStatus, status as any)))
      .orderBy(shopifyOrders.shopifyCreatedAt);
  }

  /**
   * Get orders for a store
   */
  static async getStoreOrders(storeId: string, companyId: string) {
    return await db
      .select()
      .from(shopifyOrders)
      .where(
        and(eq(shopifyOrders.shopifyStoreId, storeId), eq(shopifyOrders.companyId, companyId))
      )
      .orderBy(shopifyOrders.shopifyCreatedAt);
  }

  /**
   * Retry failed order sync
   */
  static async retryOrderSync(shopifyOrderId: string, companyId: string) {
    const [order] = await db
      .select()
      .from(shopifyOrders)
      .where(
        and(eq(shopifyOrders.id, shopifyOrderId), eq(shopifyOrders.companyId, companyId))
      )
      .limit(1);

    if (!order) {
      throw new Error("Shopify order not found");
    }

    // Reset sync status
    await db
      .update(shopifyOrders)
      .set({
        syncStatus: "pending",
        syncError: null,
        lastSyncAttempt: new Date(),
        syncRetryCount: order.syncRetryCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(shopifyOrders.id, shopifyOrderId));

    // Attempt to create ILS order
    try {
      return await this.createILSOrder(shopifyOrderId, companyId);
    } catch (error: any) {
      // Mark as failed
      await db
        .update(shopifyOrders)
        .set({
          syncStatus: "failed",
          syncError: error.message,
          updatedAt: new Date(),
        })
        .where(eq(shopifyOrders.id, shopifyOrderId));

      throw error;
    }
  }

  /**
   * Get order statistics
   */
  static async getOrderStatistics(companyId: string, storeId?: string) {
    const baseQuery = db.select().from(shopifyOrders).where(eq(shopifyOrders.companyId, companyId));

    const query = storeId
      ? baseQuery.where(eq(shopifyOrders.shopifyStoreId, storeId))
      : baseQuery;

    const allOrders = await query;

    return {
      total: allOrders.length,
      pending: allOrders.filter((o) => o.syncStatus === "pending").length,
      synced: allOrders.filter((o) => o.syncStatus === "synced").length,
      processing: allOrders.filter((o) => o.syncStatus === "processing").length,
      completed: allOrders.filter((o) => o.syncStatus === "completed").length,
      failed: allOrders.filter((o) => o.syncStatus === "failed").length,
      requiresPrescription: allOrders.filter((o) => !o.prescriptionVerified).length,
      totalRevenue: allOrders
        .reduce((sum, o) => sum + parseFloat(o.total), 0)
        .toFixed(2),
    };
  }

  // ========== Additional Methods ==========

  /**
   * Sync single order from Shopify (convenience wrapper)
   */
  static async syncOrder(storeId: string, companyId: string, shopifyOrderId: string) {
    // Fetch order from Shopify
    const orderData = await ShopifyService.syncOrder(storeId, companyId, shopifyOrderId);

    // Transform and sync to ILS
    const transformedData: ShopifyOrderData = {
      shopifyOrderId: orderData.id.toString(),
      shopifyOrderNumber: orderData.order_number?.toString() || orderData.id.toString(),
      shopifyOrderName: orderData.name || `#${orderData.order_number}`,
      customerEmail: orderData.customer?.email || '',
      customerPhone: orderData.customer?.phone || null,
      customerName: orderData.customer
        ? `${orderData.customer.first_name || ''} ${orderData.customer.last_name || ''}`.trim()
        : 'Guest Customer',
      shippingAddress: orderData.shipping_address || null,
      billingAddress: orderData.billing_address || null,
      orderItems: orderData.line_items || [],
      subtotal: orderData.subtotal_price || '0',
      tax: orderData.total_tax || '0',
      shipping: orderData.total_shipping_price_set?.shop_money?.amount || '0',
      total: orderData.total_price || '0',
      currency: orderData.currency || 'USD',
      shopifyFulfillmentStatus: orderData.fulfillment_status || null,
      shopifyFinancialStatus: orderData.financial_status || 'pending',
      shopifyCreatedAt: orderData.created_at,
      shopifyUpdatedAt: orderData.updated_at,
    };

    return await this.syncOrderFromShopify(storeId, companyId, transformedData);
  }

  /**
   * Get orders needing sync
   */
  static async getOrdersNeedingSync(companyId: string, storeId?: string) {
    const query = storeId
      ? and(
          eq(shopifyOrders.companyId, companyId),
          eq(shopifyOrders.shopifyStoreId, storeId),
          eq(shopifyOrders.syncStatus, 'pending')
        )
      : and(
          eq(shopifyOrders.companyId, companyId),
          eq(shopifyOrders.syncStatus, 'pending')
        );

    return await db
      .select()
      .from(shopifyOrders)
      .where(query)
      .orderBy(shopifyOrders.shopifyCreatedAt);
  }

  /**
   * Get sync history
   */
  static async getSyncHistory(companyId: string, limit: number = 50) {
    return await db
      .select()
      .from(shopifyOrders)
      .where(eq(shopifyOrders.companyId, companyId))
      .orderBy(shopifyOrders.syncedAt)
      .limit(limit);
  }

  /**
   * Link prescription to order
   */
  static async linkPrescription(shopifyOrderId: string, companyId: string, prescriptionId: string) {
    const [updated] = await db
      .update(shopifyOrders)
      .set({
        prescriptionId,
        prescriptionVerified: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(shopifyOrders.id, shopifyOrderId),
          eq(shopifyOrders.companyId, companyId)
        )
      )
      .returning();

    return updated;
  }

  /**
   * Process webhook for order
   */
  static async processWebhook(storeId: string, companyId: string, topic: string, payload: any) {
    // Handle different webhook topics
    switch (topic) {
      case 'orders/create':
      case 'orders/updated':
        return await this.syncOrder(storeId, companyId, payload.id.toString());

      case 'orders/fulfilled':
        // Mark order as fulfilled
        const [order] = await db
          .select()
          .from(shopifyOrders)
          .where(
            and(
              eq(shopifyOrders.shopifyStoreId, storeId),
              eq(shopifyOrders.shopifyOrderId, payload.id.toString())
            )
          )
          .limit(1);

        if (order) {
          return await this.updateOrderStatus(order.id, companyId, 'completed');
        }
        break;

      default:
        console.log(`Unhandled order webhook: ${topic}`);
    }

    return null;
  }

  /**
   * Sync multiple orders in bulk
   */
  static async syncBulk(storeId: string, companyId: string, orderIds: string[]) {
    const results = [];

    for (const orderId of orderIds) {
      try {
        const result = await this.syncOrder(storeId, companyId, orderId);
        results.push({ orderId, success: true, data: result });
      } catch (error) {
        results.push({ orderId, success: false, error: (error as Error).message });
      }
    }

    return results;
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    shopifyOrderId: string,
    companyId: string,
    status: 'pending' | 'synced' | 'processing' | 'completed' | 'failed'
  ) {
    const [updated] = await db
      .update(shopifyOrders)
      .set({
        syncStatus: status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(shopifyOrders.id, shopifyOrderId),
          eq(shopifyOrders.companyId, companyId)
        )
      )
      .returning();

    return updated;
  }
}
