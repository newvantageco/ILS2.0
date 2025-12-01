/**
 * Type augmentation for Express Request
 * Extends Express.Request to include custom properties used in our services
 *
 * SECURITY: This file defines the tenant context types used for multi-tenant isolation.
 * The tenantId and tenantContext properties are set by the setTenantContext middleware.
 */

import type { APIKey } from "../services/PublicAPIService";
import type { Company } from "@shared/schema";

/**
 * Tenant context interface for multi-tenant operations
 * Contains tenant-specific settings, limits, and feature flags
 */
export interface TenantContext {
  /** The company ID (tenant identifier) */
  tenantId: string;
  /** Optional short code for the tenant */
  tenantCode?: string;
  /** Subscription tier: basic, professional, enterprise */
  subscriptionTier?: string;
  /** Maximum AI queries allowed per billing period */
  aiQueriesLimit?: number;
  /** AI queries used in current billing period */
  aiQueriesUsed?: number;
  /** Feature flags for this tenant */
  features?: Record<string, boolean>;
}

/**
 * Repository interfaces for tenant-scoped data access
 * These will be populated by the repository factory middleware
 *
 * Note: Import TypedRepositories from server/repositories for full typing
 */
export interface Repositories {
  orders?: import('../repositories/OrderRepository').OrderRepository;
  patients?: import('../repositories/PatientRepository').PatientRepository;
  users?: import('../repositories/UserRepository').UserRepository;
  ai?: import('../repositories/AIRepository').AIRepository;
  invoices?: any; // TODO: Create InvoiceRepository
  products?: any; // TODO: Create ProductRepository
}

declare global {
  namespace Express {
    interface Request {
      // ============================================
      // MULTI-TENANT CONTEXT
      // Set by setTenantContext middleware
      // ============================================

      /** The current tenant's company ID */
      tenantId?: string;

      /** Full company data for the current tenant */
      companyData?: Company;

      /** Enhanced tenant context with subscription info and feature flags */
      tenantContext?: TenantContext;

      /** Tenant-scoped repositories for data access */
      repos?: Repositories;

      // ============================================
      // PUBLIC API AUTHENTICATION
      // ============================================

      /** API key data for public API requests */
      apiKey?: APIKey;

      /** Whether this is a sandbox API request */
      isSandbox?: boolean;

      // ============================================
      // SHOPIFY WEBHOOK AUTHENTICATION
      // ============================================

      /** Shopify company data for webhook requests */
      shopifyCompany?: {
        id: string;
        name: string | null;
        shopifyShopName?: string;
        shopifyAccessToken?: string;
        defaultEcpId?: string;
      };
    }

    interface User {
      // ============================================
      // CORE IDENTITY (Required)
      // ============================================

      /** User's unique identifier */
      id: string;

      /** User's email address (normalized) */
      email: string;

      /** User's current active role */
      role: string;

      // ============================================
      // TENANT ASSOCIATION
      // ============================================

      /** The company this user belongs to */
      companyId?: string;

      /** Whether user is the company owner */
      isOwner?: boolean;

      // ============================================
      // PERMISSIONS
      // ============================================

      /** Direct permissions assigned to user */
      permissions?: string[];

      /** Permissions inherited from roles */
      rolePermissions?: string[];

      /** All roles the user can switch between */
      roles?: Array<{ id: string; name: string; isPrimary: boolean }>;

      // ============================================
      // SUBSCRIPTION
      // ============================================

      /** User's subscription plan */
      subscriptionPlan?: string;

      // ============================================
      // LEGACY FIELDS
      // Still needed for backward compatibility
      // ============================================

      /** Whether user authenticated via local auth */
      local?: boolean;

      /** Token expiration timestamp */
      expires_at?: number;

      /** Legacy claims object */
      claims?: {
        id?: string;
        sub?: string;
      };
    }
  }
}

export {};
