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

    interface User {
      id?: string;
      email?: string;
      companyId?: string;
      isOwner?: boolean;
      permissions?: string[];
      rolePermissions?: string[];
      roles?: Array<{ id: string; name: string; isPrimary: boolean }>;
      subscriptionPlan?: string;
      // Legacy fields (still needed for old code)
      local?: boolean;
      role?: string;
      expires_at?: number;
      claims?: {
        id?: string;
        sub?: string;
      };
    }
  }
}

export {};
