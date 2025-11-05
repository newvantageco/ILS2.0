/**
 * Enhanced Shopify Service
 * 
 * Extends the base ShopifyService with:
 * 1. Bidirectional product/inventory sync (ILS ↔ Shopify)
 * 2. Webhook receivers for Shopify orders
 * 3. Prescription validation integration
 * 4. Real-time event-driven sync
 */

import { ShopifyService } from './ShopifyService';
import { storage } from '../storage';
import { eventBus } from './EventBus';
import { createLogger, type Logger } from '../utils/logger';
import type { User } from '@shared/schema';
import crypto from 'crypto';

interface ShopifyProduct {
  id: number;
  title: string;
  variants: {
    id: number;
    price: string;
    sku: string;
    inventory_quantity: number;
    inventory_item_id: number;
  }[];
  metafields?: {
    namespace: string;
    key: string;
    value: string;
    type: string;
  }[];
}

interface ShopifyOrder {
  id: number;
  order_number: string;
  email: string;
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  line_items: {
    id: number;
    product_id: number;
    variant_id: number;
    title: string;
    quantity: number;
    price: string;
    sku: string;
  }[];
  total_price: string;
  created_at: string;
}

interface ShopifyConfig {
  shopUrl: string;
  accessToken: string;
  apiVersion: string;
}

export class EnhancedShopifyService extends ShopifyService {
  private logger: Logger;

  constructor() {
    super();
    this.logger = createLogger('EnhancedShopifyService');
    this.initializeEventHandlers();
  }

  /**
   * Initialize event handlers for real-time sync
   */
  private initializeEventHandlers(): void {
    // Listen for product stock updates in ILS
    eventBus.subscribe('product.updated', async (data) => {
      // Only sync if stock changed
      if (data.changes.some((c) => c.field === 'stockQuantity')) {
        await this.syncProductStockToShopify(
          data.productId,
          data.companyId
        );
      }
    });

    this.logger.info('Shopify event handlers initialized');
  }

  /**
   * Sync ILS product stock to Shopify
   * Triggered automatically by product.updated event
   */
  async syncProductStockToShopify(
    productId: string,
    companyId: string
  ): Promise<void> {
    try {
      // 1. Get product from ILS
      const product = await storage.getProduct(productId);
      if (!product || !product.shopifyVariantId) {
        this.logger.debug('Product not configured for Shopify sync', {
          productId,
        });
        return;
      }

      // 2. Get company Shopify config
      const config = await this.getShopifyConfig(companyId);
      if (!config) {
        this.logger.warn('Shopify not configured for company', { companyId });
        return;
      }

      // 3. Update Shopify inventory
      const url = `https://${config.shopUrl}/admin/api/${config.apiVersion}/inventory_levels/set.json`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': config.accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location_id: await this.getLocationId(config),
          inventory_item_id: product.shopifyInventoryItemId,
          available: product.stockQuantity,
        }),
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status}`);
      }

      // 4. Update last sync timestamp
      await storage.updateProduct(productId, {
        lastShopifySync: new Date(),
      });

      // 5. Emit sync event
      eventBus.publish('shopify.inventory_synced', {
        productId,
        companyId,
        stockQuantity: product.stockQuantity,
        shopifyProductId: product.shopifyProductId!,
        syncedAt: new Date(),
      });

      this.logger.info('Product synced to Shopify', {
        productId,
        stockQuantity: product.stockQuantity,
      });
    } catch (error) {
      this.logger.error('Failed to sync product to Shopify', error as Error, {
        productId,
        companyId,
      });
    }
  }

  /**
   * Handle incoming Shopify order webhook
   * Webhook endpoint: POST /api/webhooks/shopify/orders/create
   */
  async handleOrderCreatedWebhook(
    shopifyOrder: ShopifyOrder,
    companyId: string
  ): Promise<void> {
    try {
      this.logger.info('Processing Shopify order webhook', {
        shopifyOrderId: shopifyOrder.id,
        companyId,
      });

      // 1. Verify customer exists as patient, create if not
      const allPatients = await storage.getPatients(companyId);
      let patient = allPatients.find(p => 
        p.customerReferenceLabel === 'Shopify ID' && 
        p.customerReferenceNumber === shopifyOrder.customer.id.toString()
      );

      if (!patient) {
        // Create patient from Shopify customer
        patient = await storage.createPatient({
          companyId,
          ecpId: await this.getDefaultEcpId(companyId),
          name: `${shopifyOrder.customer.first_name} ${shopifyOrder.customer.last_name}`.trim(),
          email: shopifyOrder.customer.email || null,
          customerReferenceLabel: 'Shopify ID',
          customerReferenceNumber: shopifyOrder.customer.id.toString(),
        });

        this.logger.info('Created patient from Shopify customer', {
          patientId: patient.id,
          shopifyCustomerId: shopifyOrder.customer.id,
        });
      }

      // 2. Update inventory for each line item
      for (const lineItem of shopifyOrder.line_items) {
        const allProducts = await storage.getProducts(companyId);
        const product = allProducts.find(p => 
          p.shopifyVariantId === lineItem.variant_id.toString()
        );

        if (product) {
          const oldStock = product.stockQuantity;
          const newStock = Math.max(0, oldStock - lineItem.quantity);

          await storage.updateProduct(product.id, { stockQuantity: newStock });

          // Emit event
          eventBus.publish('product.stock_updated', {
            productId: product.id,
            companyId,
            oldStock,
            newStock,
            source: 'shopify',
            timestamp: new Date(),
          });

          this.logger.info('Updated product stock from Shopify order', {
            productId: product.id,
            oldStock,
            newStock,
            quantity: lineItem.quantity,
          });
        }
      }

      // 3. Emit Shopify order event for downstream processing
      eventBus.publish('shopify.order_received', {
        shopifyOrderId: shopifyOrder.id.toString(),
        companyId,
        customerId: shopifyOrder.customer.id.toString(),
        lineItems: shopifyOrder.line_items.map((item) => ({
          productId: item.product_id.toString(),
          quantity: item.quantity,
          price: parseFloat(item.price),
        })),
        totalAmount: parseFloat(shopifyOrder.total_price),
      });

      this.logger.info('Shopify order processed successfully', {
        shopifyOrderId: shopifyOrder.id,
      });
    } catch (error) {
      this.logger.error('Failed to process Shopify order', error as Error, {
        shopifyOrderId: shopifyOrder.id,
      });
      throw error;
    }
  }

  /**
   * Verify Shopify webhook signature
   * Ensures webhook is genuinely from Shopify
   */
  verifyWebhookSignature(
    body: string,
    hmacHeader: string,
    secret: string
  ): boolean {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('base64');

    return hash === hmacHeader;
  }

  /**
   * Push product to Shopify (create or update)
   */
  async pushProductToShopify(
    productId: string,
    companyId: string
  ): Promise<{ shopifyProductId: string; shopifyVariantId: string }> {
    const product = await storage.getProduct(productId);
    const config = await this.getShopifyConfig(companyId);

    if (!config || !product) {
      throw new Error('Shopify not configured or product not found');
    }

    const shopifyProduct: Partial<ShopifyProduct> = {
      title: product.name || `${product.brand} ${product.model}`,
      variants: [
        {
          price: product.unitPrice.toString(),
          sku: product.sku || undefined,
          inventory_quantity: product.stockQuantity,
        } as any,
      ],
      metafields: [
        {
          namespace: 'ils',
          key: 'prescription_required',
          value: product.isPrescriptionRequired ? 'true' : 'false',
          type: 'boolean',
        },
        {
          namespace: 'ils',
          key: 'ils_product_id',
          value: product.id,
          type: 'single_line_text_field',
        },
      ],
    };

    const url = product.shopifyProductId
      ? `https://${config.shopUrl}/admin/api/${config.apiVersion}/products/${product.shopifyProductId}.json`
      : `https://${config.shopUrl}/admin/api/${config.apiVersion}/products.json`;

    const method = product.shopifyProductId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'X-Shopify-Access-Token': config.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product: shopifyProduct }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Shopify API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const createdProduct = data.product;

    // Update ILS product with Shopify IDs
    await storage.updateProduct(productId, {
      shopifyProductId: createdProduct.id.toString(),
      shopifyVariantId: createdProduct.variants[0].id.toString(),
      shopifyInventoryItemId:
        createdProduct.variants[0].inventory_item_id.toString(),
    });

    return {
      shopifyProductId: createdProduct.id.toString(),
      shopifyVariantId: createdProduct.variants[0].id.toString(),
    };
  }

  /**
   * Get Shopify config for a company
   */
  private async getShopifyConfig(
    companyId: string
  ): Promise<ShopifyConfig | null> {
    const company = await storage.getCompany(companyId);

    if (
      !company ||
      !company.shopifyEnabled ||
      !company.shopifyShopUrl ||
      !company.shopifyAccessToken
    ) {
      return null;
    }

    return {
      shopUrl: company.shopifyShopUrl,
      accessToken: company.shopifyAccessToken,
      apiVersion: company.shopifyApiVersion || '2024-10',
    };
  }

  /**
   * Get Shopify location ID (primary location)
   */
  private async getLocationId(config: ShopifyConfig): Promise<number> {
    const url = `https://${config.shopUrl}/admin/api/${config.apiVersion}/locations.json`;

    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': config.accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get Shopify locations: ${response.status}`);
    }

    const data = await response.json();
    return data.locations[0].id; // Use primary location
  }

  /**
   * Get default ECP user ID for a company
   */
  private async getDefaultEcpId(companyId: string): Promise<string> {
    // Get company and find admin user
    const company = await storage.getCompany(companyId);
    if (!company) return companyId;
    
    // Return company ID as fallback
    return companyId;
  }
}

// Singleton instance
export const enhancedShopifyService = new EnhancedShopifyService();
