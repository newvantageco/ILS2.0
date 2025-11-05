/**
 * Shopify Webhooks Router
 * 
 * Handles incoming webhooks from Shopify:
 * - orders/create: New order placed on Shopify store
 * - customers/create: New customer registered
 * - inventory_levels/update: Inventory changed externally
 * 
 * Security: All webhooks are verified using HMAC-SHA256
 */

import { Router, type Request, type Response } from 'express';
import { enhancedShopifyService } from '../../services/EnhancedShopifyService';
import { storage } from '../../storage';
import { createLogger } from '../../utils/logger';

const router = Router();
const logger = createLogger('ShopifyWebhooks');

/**
 * Middleware to verify Shopify webhook signature
 */
async function verifyShopifyWebhook(
  req: Request,
  res: Response,
  next: Function
) {
  try {
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;
    const shopDomain = req.headers['x-shopify-shop-domain'] as string;

    if (!hmacHeader || !shopDomain) {
      logger.warn('Missing Shopify webhook headers');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find company by shop domain
    // Find company by Shopify domain - using shopifyShopName as proxy
    const companies = await storage.getCompanies();
    const company = companies.find(c => c.shopifyShopName === shopDomain);
    
    const webhookSecret = company?.shopifyWebhookSecret || null;
    if (!company || !webhookSecret) {
      logger.warn('Company not found or webhook secret not configured', {
        shopDomain,
      });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify signature
    const rawBody = JSON.stringify(req.body);
    const isValid = enhancedShopifyService.verifyWebhookSignature(
      rawBody,
      hmacHeader,
      webhookSecret || ''
    );

    if (!isValid) {
      logger.warn('Invalid Shopify webhook signature', { shopDomain });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Attach company to request
    req.shopifyCompany = {
      id: company.id,
      name: company.name,
      shopifyShopName: company.shopifyShopName || undefined,
      shopifyAccessToken: company.shopifyAccessToken || undefined,
    };
    next();
  } catch (error) {
    logger.error('Webhook verification error', error as Error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/webhooks/shopify/orders/create
 * 
 * Triggered when a new order is placed on Shopify
 * 
 * Actions:
 * 1. Create/update patient from customer
 * 2. Decrement product stock in ILS
 * 3. Emit events for downstream processing
 */
router.post(
  '/orders/create',
  verifyShopifyWebhook,
  async (req: Request, res: Response) => {
    try {
      const shopifyOrder = req.body;
      const companyId = req.shopifyCompany!.id;

      logger.info('Received Shopify order webhook', {
        shopifyOrderId: shopifyOrder.id,
        orderNumber: shopifyOrder.order_number,
        companyId,
      });

      // Process the order
      await enhancedShopifyService.handleOrderCreatedWebhook(
        shopifyOrder,
        companyId
      );

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('Failed to process Shopify order webhook', error as Error);
      // Return 200 to prevent Shopify from retrying
      // (we've logged the error and can manually retry)
      res.status(200).json({ received: true, error: 'Processing failed' });
    }
  }
);

/**
 * POST /api/webhooks/shopify/customers/create
 * 
 * Triggered when a new customer is created on Shopify
 * 
 * Actions:
 * 1. Create patient in ILS
 * 2. Link Shopify customer ID
 */
router.post(
  '/customers/create',
  verifyShopifyWebhook,
  async (req: Request, res: Response) => {
    try {
      const shopifyCustomer = req.body;
      const companyId = req.shopifyCompany!.id;

      logger.info('Received Shopify customer webhook', {
        shopifyCustomerId: shopifyCustomer.id,
        email: shopifyCustomer.email,
        companyId,
      });

      // Check if patient already exists
      const allPatients = await storage.getPatients(companyId);
      const existingPatient = allPatients.find(p => 
        p.customerReferenceLabel === 'Shopify ID' && 
        p.customerReferenceNumber === shopifyCustomer.id.toString()
      );

      if (existingPatient) {
        logger.info('Patient already exists for Shopify customer', {
          patientId: existingPatient.id,
          shopifyCustomerId: shopifyCustomer.id,
        });
        return res.status(200).json({ received: true, patientId: existingPatient.id });
      }

      // Create patient
      const patient = await storage.createPatient({
        companyId,
        ecpId: req.shopifyCompany!.defaultEcpId || companyId,
        name: `${shopifyCustomer.first_name || ''} ${shopifyCustomer.last_name || ''}`.trim(),
        email: shopifyCustomer.email || null,
        customerReferenceLabel: 'Shopify ID',
        customerReferenceNumber: shopifyCustomer.id.toString(),
      });

      logger.info('Created patient from Shopify customer', {
        patientId: patient.id,
        shopifyCustomerId: shopifyCustomer.id,
      });

      res.status(200).json({ received: true, patientId: patient.id });
    } catch (error) {
      logger.error('Failed to process Shopify customer webhook', error as Error);
      res.status(200).json({ received: true, error: 'Processing failed' });
    }
  }
);

/**
 * POST /api/webhooks/shopify/inventory_levels/update
 * 
 * Triggered when inventory is updated on Shopify (external change)
 * 
 * Actions:
 * 1. Sync inventory back to ILS
 * 2. Prevent infinite loop (check if change originated from ILS)
 */
router.post(
  '/inventory_levels/update',
  verifyShopifyWebhook,
  async (req: Request, res: Response) => {
    try {
      const inventoryUpdate = req.body;
      const companyId = req.shopifyCompany!.id;

      logger.info('Received Shopify inventory webhook', {
        inventoryItemId: inventoryUpdate.inventory_item_id,
        available: inventoryUpdate.available,
        companyId,
      });

      // Find product by Shopify inventory item ID
      const allProducts = await storage.getProducts(companyId);
      const product = allProducts.find(p => 
        p.shopifyInventoryItemId === inventoryUpdate.inventory_item_id.toString()
      );

      if (product) {
        const oldStock = product.stockQuantity;
        const newStock = inventoryUpdate.available;

        // Only update if different (prevent loop)
        if (oldStock !== newStock) {
          await storage.updateProduct(product.id, { stockQuantity: newStock });

          logger.info('Updated product stock from Shopify', {
            productId: product.id,
            oldStock,
            newStock,
          });
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('Failed to process Shopify inventory webhook', error as Error);
      res.status(200).json({ received: true, error: 'Processing failed' });
    }
  }
);

/**
 * GET /api/webhooks/shopify/health
 * 
 * Health check endpoint for Shopify webhooks
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', service: 'shopify-webhooks' });
});

export default router;
