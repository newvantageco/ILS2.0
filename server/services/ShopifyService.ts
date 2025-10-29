import { storage } from "../storage";
import type { User } from "@shared/schema";

interface ShopifyCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
  addresses: {
    address1?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
  }[];
  tags?: string;
  note?: string;
}

interface ShopifyConfig {
  shopUrl: string;
  accessToken: string;
  apiVersion: string;
}

interface SyncResult {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
}

/**
 * Shopify Integration Service
 * Syncs Shopify customers as patients in the ILS system
 */
export class ShopifyService {
  /**
   * Fetch customers from Shopify store
   */
  private async fetchShopifyCustomers(config: ShopifyConfig, limit: number = 250): Promise<ShopifyCustomer[]> {
    const url = `https://${config.shopUrl}/admin/api/${config.apiVersion}/customers.json?limit=${limit}`;
    
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': config.accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Shopify API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.customers || [];
  }

  /**
   * Verify Shopify credentials by making a test API call
   */
  async verifyConnection(config: ShopifyConfig): Promise<{ valid: boolean; error?: string }> {
    try {
      const url = `https://${config.shopUrl}/admin/api/${config.apiVersion}/shop.json`;
      
      const response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': config.accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          valid: false,
          error: `Connection failed: ${response.status} - ${error}`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync Shopify customers to patients
   */
  async syncCustomers(companyId: string, ecpUser: User): Promise<SyncResult> {
    const result: SyncResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    try {
      // Get company Shopify settings
      const company = await storage.getCompany(companyId);
      if (!company || !company.shopifyEnabled) {
        throw new Error('Shopify integration not enabled for this company');
      }

      if (!company.shopifyShopUrl || !company.shopifyAccessToken) {
        throw new Error('Shopify credentials not configured');
      }

      const config: ShopifyConfig = {
        shopUrl: company.shopifyShopUrl,
        accessToken: company.shopifyAccessToken,
        apiVersion: company.shopifyApiVersion || '2024-10',
      };

      // Fetch customers from Shopify
      const shopifyCustomers = await this.fetchShopifyCustomers(config);

      // Get existing patients to avoid duplicates
      const existingPatients = await storage.getPatients(ecpUser.id, companyId);
      const existingEmails = new Set(
        existingPatients.filter((p: any) => p.email).map((p: any) => p.email!.toLowerCase())
      );

      // Sync each customer
      for (const customer of shopifyCustomers) {
        try {
          const email = customer.email?.toLowerCase();
          
          // Skip if patient already exists with this email
          if (email && existingEmails.has(email)) {
            result.skipped++;
            continue;
          }

          const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
          if (!fullName) {
            result.skipped++;
            continue;
          }

          // Get primary address if available
          const primaryAddress = customer.addresses?.[0];

          // Create patient
          await storage.createPatient({
            companyId,
            ecpId: ecpUser.id,
            name: fullName,
            email: customer.email || null,
            dateOfBirth: null, // Shopify doesn't typically store DOB
            nhsNumber: null,
            fullAddress: primaryAddress ? {
              address: primaryAddress.address1 || null,
              city: primaryAddress.city || null,
              postcode: primaryAddress.zip || null,
              province: primaryAddress.province || null,
              country: primaryAddress.country || null,
            } : null,
            customerReferenceLabel: 'Shopify ID',
            customerReferenceNumber: customer.id.toString(),
          });

          result.success++;
        } catch (error) {
          result.failed++;
          result.errors.push(
            `Failed to sync ${customer.first_name} ${customer.last_name}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }

      // Update last sync timestamp (Note: This requires adding method to storage)
      // await storage.updateCompanyShopifySync(companyId, new Date());

      return result;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Get sync status for a company
   */
  async getSyncStatus(companyId: string): Promise<{
    enabled: boolean;
    lastSyncAt: Date | null;
    shopUrl: string | null;
    autoSync: boolean;
  }> {
    const company = await storage.getCompany(companyId);
    
    return {
      enabled: company?.shopifyEnabled || false,
      lastSyncAt: company?.shopifyLastSyncAt || null,
      shopUrl: company?.shopifyShopUrl || null,
      autoSync: company?.shopifyAutoSync || false,
    };
  }
}

export const shopifyService = new ShopifyService();
