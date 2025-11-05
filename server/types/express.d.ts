/**
 * Type augmentation for Express Request
 * Extends Express.Request to include custom properties used in our services
 */

import type { APIKey } from "../services/PublicAPIService";

declare global {
  namespace Express {
    interface Request {
      // Public API authentication
      apiKey?: APIKey;
      isSandbox?: boolean;
      
      // Shopify webhook authentication
      shopifyCompany?: {
        id: string;
        name: string | null;
        shopifyShopName?: string;
        shopifyAccessToken?: string;
        defaultEcpId?: string;
      };
    }
  }
}

export {};
