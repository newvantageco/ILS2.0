/**
 * Auth Service Adapter - Phase 0
 * 
 * Unified authentication adapter supporting:
 * - AWS Cognito (primary)
 * - Auth0 (fallback)
 * - Local development mode
 * 
 * Provides consistent interface for:
 * - User identity verification
 * - Role claim extraction
 * - Tenant/organization scoping
 * - Token validation and refresh
 * - Multi-factor authentication setup
 */

import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import { createLogger, type Logger } from "../utils/logger";

/**
 * Supported auth providers
 */
export type AuthProvider = "cognito" | "auth0" | "local";

/**
 * Unified auth claims format
 */
export interface AuthClaims {
  sub: string;           // Subject (user ID)
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  phone_number?: string;
  phone_number_verified?: boolean;
  
  // Custom claims
  "custom:tenant_id"?: string;
  "custom:organization_id"?: string;
  "custom:role"?: string;
  tenant_id?: string;
  organization_id?: string;
  role?: string;
  
  // Auth0 specific
  org_id?: string;
  org_name?: string;
  
  // Standard
  iss: string;
  aud: string;
  exp: number;
  iat: number;
}

/**
 * Auth service configuration
 */
export interface AuthServiceConfig {
  provider: AuthProvider;
  clientId: string;
  clientSecret?: string;
  issuer: string;
  jwksUrl?: string;
  audience?: string;
}

/**
 * Tenant context extracted from auth claims
 */
export interface TenantContext {
  tenantId: string;
  organizationId?: string;
  roles: string[];
}

/**
 * Cached JWKS keys
 */
interface CachedJwks {
  keys: any[];
  timestamp: number;
  ttl: number;
}

/**
 * Auth Service Adapter
 */
export class AuthService {
  private logger: Logger;
  private provider: AuthProvider;
  private clientId: string;
  private clientSecret?: string;
  private issuer: string;
  private jwksUrl?: string;
  private audience?: string;
  private jwksCache: Map<string, CachedJwks> = new Map();
  private jwksCacheTTL = 3600 * 1000; // 1 hour

  constructor(config: AuthServiceConfig) {
    this.logger = createLogger("AuthService");
    this.provider = config.provider;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.issuer = config.issuer;
    this.jwksUrl = config.jwksUrl;
    this.audience = config.audience;

    this.logger.info(
      { provider: this.provider, issuer: this.issuer },
      'Auth service initialized'
    );
  }

  /**
   * Get JWKS from cache or fetch from provider
   */
  private async getJwks(forceRefresh = false): Promise<any[]> {
    const cacheKey = `${this.provider}:${this.issuer}`;
    const cached = this.jwksCache.get(cacheKey);

    if (cached && !forceRefresh && Date.now() - cached.timestamp < cached.ttl) {
      return cached.keys;
    }

    if (!this.jwksUrl) {
      throw new Error("JWKS URL not configured");
    }

    try {
      const response = await fetch(this.jwksUrl);
      if (!response.ok) {
        throw new Error(`JWKS endpoint returned ${response.status}`);
      }

      const data = await response.json();
      const keys = data.keys || [];

      this.jwksCache.set(cacheKey, {
        keys,
        timestamp: Date.now(),
        ttl: this.jwksCacheTTL,
      });

      return keys;
    } catch (error) {
      this.logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to fetch JWKS');
      throw error;
    }
  }

  /**
   * Decode JWT token without verification (for client-side claims extraction)
   * Token verification should be done by auth provider or API gateway
   */
  decodeToken(token: string): AuthClaims {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid token format");
      }

      // Decode payload (second part)
      const payload = JSON.parse(
        Buffer.from(parts[1], "base64").toString("utf-8")
      ) as AuthClaims;

      return payload;
    } catch (error) {
      this.logger.warn(
        { error: error instanceof Error ? error.message : String(error) },
        'Token decoding failed'
      );
      throw error;
    }
  }

  /**
   * Verify token expiration
   */
  isTokenExpired(claims: AuthClaims): boolean {
    return claims.exp * 1000 < Date.now();
  }

  /**
   * Verify and validate token claims
   * Note: Actual JWT signature verification should be done by auth provider
   * This validates expiration and claim structure
   */
  async verifyToken(token: string): Promise<AuthClaims> {
    try {
      const claims = this.decodeToken(token);

      // Check expiration
      if (this.isTokenExpired(claims)) {
        throw new Error("Token expired");
      }

      // For local development, minimal validation
      if (this.provider === "local") {
        if (!claims.sub || !claims.email) {
          throw new Error("Missing required claims");
        }
        return claims;
      }

      // Verify issuer matches
      if (claims.iss !== this.issuer) {
        throw new Error(`Issuer mismatch: expected ${this.issuer}, got ${claims.iss}`);
      }

      // Verify audience if configured
      if (this.audience && claims.aud !== this.audience) {
        throw new Error(`Audience mismatch: expected ${this.audience}, got ${claims.aud}`);
      }

      return claims;
    } catch (error) {
      this.logger.warn(
        {
          error: error instanceof Error ? error.message : String(error),
          provider: this.provider,
        },
        'Token verification failed'
      );
      throw error;
    }
  }

  /**
   * Extract public key from JWKS key object
   */
  private getPublicKey(key: any): string {
    if (key.x5c && key.x5c.length > 0) {
      return `-----BEGIN CERTIFICATE-----\n${key.x5c[0]}\n-----END CERTIFICATE-----`;
    }

    if (key.kty === "RSA") {
      // For RSA keys, we'd need a library to construct the PEM
      // For now, return as-is and let jwt library handle it
      return JSON.stringify(key);
    }

    throw new Error("Unsupported key type");
  }

  /**
   * Extract tenant context from auth claims
   */
  extractTenantContext(claims: AuthClaims): TenantContext {
    // Try different claim paths depending on provider
    const tenantId =
      claims["custom:tenant_id"] ||
      claims.tenant_id ||
      (this.provider === "auth0" && claims.org_id) ||
      claims.sub; // Fallback to user ID as tenant

    const organizationId: string | undefined =
      (claims["custom:organization_id"] as string | undefined) ||
      (claims.organization_id as string | undefined) ||
      (this.provider === "auth0" && claims.org_id) ||
      undefined;

    // Extract roles - vary by provider
    let roles: string[] = [];
    if (claims["custom:role"]) {
      roles = [claims["custom:role"]];
    } else if (claims.role) {
      roles = Array.isArray(claims.role) ? claims.role : [claims.role];
    }

    return {
      tenantId,
      organizationId,
      roles,
    };
  }

  /**
   * Create Express middleware for token verification
   */
  verifyTokenMiddleware(): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return res.status(401).json({ error: "Missing or invalid authorization header" });
        }

        const token = authHeader.slice(7);

        // Verify token
        const claims = await this.verifyToken(token);

        // Attach to request
        (req as any).auth = {
          claims,
          tenantContext: this.extractTenantContext(claims),
        };

        next();
      } catch (error) {
        this.logger.warn(
          { error: error instanceof Error ? error.message : String(error) },
          'Token verification middleware failed'
        );
        return res.status(401).json({ error: "Invalid token" });
      }
    };
  }

  /**
   * Refresh token using AWS Cognito token endpoint
   */
  private async refreshCognitoToken(
    refreshToken: string
  ): Promise<{ token: string; refreshToken?: string } | null> {
    try {
      const tokenEndpoint = `${this.issuer}/oauth2/token`;
      
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.clientId,
          client_secret: this.clientSecret || '',
          refresh_token: refreshToken,
        }).toString(),
      });

      if (!response.ok) {
        this.logger.error({ status: response.status }, `Cognito token refresh failed`);
        return null;
      }

      const data = await response.json();
      this.logger.info({ provider: 'cognito' }, 'Token refreshed successfully');
      return {
        token: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
      };
    } catch (error) {
      this.logger.error({ error: error instanceof Error ? error.message : String(error), provider: 'cognito' }, 'Cognito token refresh error');
      return null;
    }
  }

  /**
   * Refresh token using Auth0 token endpoint
   */
  private async refreshAuth0Token(
    refreshToken: string
  ): Promise<{ token: string; refreshToken?: string } | null> {
    try {
      // Auth0 token endpoint is typically at: https://{domain}/oauth/token
      const tokenEndpoint = `${this.issuer}/oauth/token`;
      
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          audience: this.audience,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        this.logger.error({ status: response.status }, `Auth0 token refresh failed`);
        return null;
      }

      const data = await response.json();
      this.logger.info({ provider: 'auth0' }, 'Token refreshed successfully');
      return {
        token: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
      };
    } catch (error) {
      this.logger.error({ error: error instanceof Error ? error.message : String(error), provider: 'auth0' }, 'Auth0 token refresh error');
      return null;
    }
  }

  /**
   * Refresh token if close to expiration
   * Note: For production, tokens are typically refreshed at auth provider level
   * This method checks if refresh is needed and coordinates with provider
   */
  async refreshTokenIfNeeded(
    token: string,
    refreshToken?: string
  ): Promise<{ token: string; refreshToken?: string } | null> {
    try {
      const claims = this.decodeToken(token);
      const expiresIn = claims.exp * 1000 - Date.now();
      const threshold = 5 * 60 * 1000; // 5 minutes

      // If not close to expiration, return as-is
      if (expiresIn > threshold) {
        return null;
      }

      this.logger.info({ provider: this.provider, expiresIn }, 'Token refresh needed');

      // For Cognito/Auth0, refresh token endpoint should be called at provider level
      // This is a signal to the application that refresh is needed
      if (!refreshToken) {
        // No refresh token available - client should re-authenticate
        this.logger.warn({ provider: this.provider }, 'No refresh token available');
        return null;
      }

      // Implement provider-specific token refresh
      switch (this.provider) {
        case "cognito": {
          return await this.refreshCognitoToken(refreshToken);
        }
        case "auth0": {
          return await this.refreshAuth0Token(refreshToken);
        }
        case "local": {
          // Local auth doesn't need refresh
          return null;
        }
        default: {
          this.logger.warn({ provider: this.provider }, 'Unknown auth provider for token refresh');
          return null;
        }
      }
    } catch (error) {
      this.logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Token refresh check failed');
      return null;
    }
  }

  /**
   * Get health status of auth provider
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (this.provider === "local") {
        return true;
      }

      // Try to fetch JWKS
      await this.getJwks();
      return true;
    } catch (error) {
      this.logger.warn(
        { error: error instanceof Error ? error.message : String(error), provider: this.provider },
        'Auth provider health check failed'
      );
      return false;
    }
  }
}

/**
 * Factory function to create auth service based on environment
 */
export function createAuthService(): AuthService {
  const provider = (process.env.AUTH_PROVIDER || "local") as AuthProvider;

  const config: AuthServiceConfig = {
    provider,
    clientId: process.env.AUTH_CLIENT_ID || "local-client",
    clientSecret: process.env.AUTH_CLIENT_SECRET,
    issuer: process.env.AUTH_ISSUER || "http://localhost:5000",
    jwksUrl: process.env.AUTH_JWKS_URL,
    audience: process.env.AUTH_AUDIENCE,
  };

  return new AuthService(config);
}

/**
 * Type-safe request augmentation
 */
declare global {
  namespace Express {
    interface Request {
      auth?: {
        claims: AuthClaims;
        tenantContext: TenantContext;
      };
    }
  }
}

export default AuthService;
