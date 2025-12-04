/**
 * Auth Integration Adapter
 *
 * Bridges between existing local auth and new unified AuthService
 * Enables zero-downtime migration to Cognito/Auth0
 */

import type { Express, Request, Response, NextFunction } from "express";
import { AuthService, type AuthProvider } from "./AuthService";
import { createLogger, type Logger } from "../utils/logger";
import { storage } from "../storage";

interface AuthIntegrationConfig {
  legacyAuthEnabled: boolean;
  newAuthProvider?: AuthProvider;
  forceNewAuth?: boolean;
}

export class AuthIntegration {
  private logger: Logger;
  private authService?: AuthService;
  private legacyAuthEnabled: boolean;
  private forceNewAuth: boolean;

  constructor(
    private config: AuthIntegrationConfig,
    newAuthService?: AuthService
  ) {
    this.logger = createLogger("AuthIntegration");
    this.authService = newAuthService;
    this.legacyAuthEnabled = config.legacyAuthEnabled;
    this.forceNewAuth = config.forceNewAuth ?? false;

    this.logger.info("Auth integration initialized", {
      legacyAuthEnabled: this.legacyAuthEnabled,
      newAuthProvider: config.newAuthProvider,
      forceNewAuth: this.forceNewAuth,
    });
  }

  /**
   * Unified authentication middleware
   * Tries new auth first (if enabled), falls back to legacy auth
   */
  authenticateUser() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // If new auth is forced, use it exclusively
        if (this.forceNewAuth && this.authService) {
          return this.authenticateWithNewAuth(req, res, next);
        }

        // Try new auth first if available
        if (this.authService && !this.legacyAuthEnabled) {
          try {
            return this.authenticateWithNewAuth(req, res, next);
          } catch (error) {
            this.logger.warn("New auth attempt failed", {
              error: error instanceof Error ? error.message : String(error),
            });

            // If new auth fails and legacy is available, try it
            if (this.legacyAuthEnabled) {
              this.logger.info("Falling back to legacy auth");
              return this.authenticateWithLegacy(req, res, next);
            }

            throw error;
          }
        }

        // Use legacy auth
        if (this.legacyAuthEnabled) {
          return this.authenticateWithLegacy(req, res, next);
        }

        return res.status(401).json({ error: "No authentication available" });
      } catch (error) {
        this.logger.error("Authentication failed", error as Error);
        return res.status(401).json({ error: "Authentication failed" });
      }
    };
  }

  /**
   * Authenticate using new auth service (Cognito/Auth0)
   */
  private async authenticateWithNewAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (!this.authService) {
      throw new Error("Auth service not configured");
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing bearer token" });
    }

    const token = authHeader.slice(7);

    try {
      const claims = await this.authService.verifyToken(token);
      const tenantContext = this.authService.extractTenantContext(claims);

      // Upsert user in database
      await storage.upsertUser({
        id: claims.sub,
        email: claims.email,
        firstName: claims.given_name,
        lastName: claims.family_name,
        profileImageUrl: claims.picture,
      });

      // Attach auth info to request
      (req as any).user = {
        id: claims.sub,
        email: claims.email,
        claims,
        tenantContext,
      };

      next();
    } catch (error) {
      this.logger.warn("New auth verification failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return res.status(401).json({ error: "Invalid token" });
    }
  }

  /**
   * Authenticate using legacy auth (local/existing)
   * This is called by existing passport middleware
   */
  private async authenticateWithLegacy(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    // Expect legacy auth middleware (passport) to have set req.user
    if (!(req as any).user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Extract user info from passport session
    const user = (req as any).user;
    const claims = user.claims || {};

    // Attach normalized auth context
    (req as any).auth = {
      claims: {
        sub: user.id,
        email: user.email,
        ...claims,
      },
      tenantContext: {
        tenantId: user.id,
        roles: user.roles || [],
      },
    };

    next();
  }

  /**
   * Migrate user to new auth provider
   * Called during gradual migration phase
   */
  async migrateUser(userId: string, newAuthToken: string): Promise<boolean> {
    try {
      if (!this.authService) {
        throw new Error("Auth service not configured");
      }

      // Verify new token
      const claims = await this.authService.verifyToken(newAuthToken);

      // Update user record to link new auth provider
      const updatedUser = await storage.updateUser(userId, {
        externalAuthId: claims.sub,
        // Store which provider the user is now using
        authProvider: this.config.newAuthProvider,
      } as any);

      this.logger.info("User migrated to new auth provider", {
        userId,
        provider: this.config.newAuthProvider,
      });

      return !!updatedUser;
    } catch (error) {
      this.logger.error("User migration failed", error as Error, { userId });
      return false;
    }
  }

  /**
   * Health check for auth system
   */
  async healthCheck(): Promise<{
    legacyAuth: boolean;
    newAuth: boolean;
    activeProvider: string;
  }> {
    const legacyHealthy = this.legacyAuthEnabled; // Could add actual check
    const newAuthHealthy = this.authService ? await this.authService.healthCheck() : false;

    return {
      legacyAuth: legacyHealthy,
      newAuth: newAuthHealthy,
      activeProvider: this.forceNewAuth ? "new" : "legacy",
    };
  }
}

/**
 * Factory function to create auth integration
 */
export function createAuthIntegration(): AuthIntegration {
  const newAuthProvider = (process.env.AUTH_PROVIDER || "local") as AuthProvider;
  const legacyAuthEnabled = process.env.LEGACY_AUTH_ENABLED !== "false";
  const forceNewAuth = process.env.FORCE_NEW_AUTH === "true";

  // Create new auth service if configured
  let authService: AuthService | undefined;
  if (newAuthProvider !== "local" || forceNewAuth) {
    const { createAuthService } = require("./AuthService");
    authService = createAuthService();
  }

  const config: AuthIntegrationConfig = {
    legacyAuthEnabled,
    newAuthProvider,
    forceNewAuth,
  };

  return new AuthIntegration(config, authService);
}

export default AuthIntegration;
