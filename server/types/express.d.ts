/**
 * Type augmentation for Express Request
 * Extends Express.Request to include custom properties used in our services
 *
 * This file is the central source of truth for Express type extensions.
 * It supports:
 * - Multi-tenant context (tenantId, companyData)
 * - Repository pattern (repos)
 * - Public API authentication
 * - Shopify integration
 */

import type { APIKey } from "../services/PublicAPIService";

/**
 * Tenant context interface for AI and multi-tenant operations
 * Contains tenant-specific configuration and limits
 */
export interface TenantContext {
  tenantId: string;
  tenantCode?: string;
  subscriptionTier?: string;
  aiQueriesLimit?: number;
  aiQueriesUsed?: number;
  features?: Record<string, boolean>;
}

/**
 * Repositories interface - placeholder for dependency injection pattern
 * This will be populated with actual repository instances when created
 *
 * Example usage after implementation:
 * ```typescript
 * interface Repositories {
 *   users: UserRepository;
 *   orders: OrderRepository;
 *   patients: PatientRepository;
 *   // ... other repositories
 * }
 * ```
 */
export interface Repositories {
  // Placeholder - will be populated with actual repository types
  [key: string]: unknown;
}

declare global {
  namespace Express {
    interface Request {
      // ============================================
      // Multi-Tenant Context (Layer 2 - RLS Support)
      // ============================================

      /**
       * The tenant/company ID for the current request
       * Set by setTenantContext middleware after authentication
       * Used for Row-Level Security (RLS) at the database level
       */
      tenantId: string;

      /**
       * Full company data loaded from database
       * Contains company settings, branding, subscription info
       */
      companyData?: {
        id: string;
        name: string;
        code?: string;
        subscriptionStatus?: string;
        subscriptionTier?: string;
        [key: string]: unknown;
      };

      /**
       * Enhanced tenant context for AI operations
       * Contains limits, usage tracking, and feature flags
       */
      tenantContext?: TenantContext;

      // ============================================
      // Repository Pattern (Dependency Injection)
      // ============================================

      /**
       * Repository instances scoped to the current tenant
       * Provides type-safe database access with tenant isolation
       */
      repos: Repositories;

      // ============================================
      // Public API Authentication
      // ============================================

      /**
       * API key information for public API requests
       */
      apiKey?: APIKey;

      /**
       * Whether the request is using sandbox/test mode
       */
      isSandbox?: boolean;

      // ============================================
      // Shopify Integration
      // ============================================

      /**
       * Company information from Shopify webhook authentication
       */
      shopifyCompany?: {
        id: string;
        name: string | null;
        shopifyShopName?: string;
        shopifyAccessToken?: string;
        defaultEcpId?: string;
      };

      // ============================================
      // Company Isolation (Layer 3 - Application Guards)
      // ============================================

      /**
       * User's company ID (alias for tenantId, used by companyIsolation middleware)
       */
      userCompanyId?: string;

      /**
       * Whether the current user is a platform administrator
       */
      isPlatformAdmin?: boolean;
    }

    interface User {
      // Make core identity fields required to align with AuthenticatedUser
      id: string;
      email: string;
      role: string;
      companyId?: string;
      isOwner?: boolean;
      permissions?: string[];
      rolePermissions?: string[];
      roles?: Array<{ id: string; name: string; isPrimary: boolean }>;
      subscriptionPlan?: string;
      // Legacy fields (still needed for old code)
      local?: boolean;
      expires_at?: number;
      claims?: {
        id?: string;
        sub?: string;
      };
    }
  }
}

export {};
