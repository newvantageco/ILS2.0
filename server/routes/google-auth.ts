/**
 * Google OAuth Authentication Routes
 *
 * Provides Sign-in with Google functionality using passport-google-oauth20
 * Enhanced with tenant selection flow:
 * - New users are directed to tenant selection
 * - Existing users with company go to dashboard
 * - Users pending approval go to pending page
 */

import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { storage } from "../storage";
import { createLogger } from "../utils/logger";
import { normalizeEmail } from "../utils/normalizeEmail";
import { db } from "../db";
import { companies, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { jwtService } from "../services/JWTService.js";

const router = Router();
const logger = createLogger("google-auth");

// Verify required environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.APP_URL || "http://localhost:5000";

// Check if Google OAuth is configured
const isGoogleAuthConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

/**
 * Get permissions for a role - consistent with auth-jwt.ts
 */
function getUserPermissions(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    'platform_admin': [
      'admin.all',
      'company.all',
      'user.all',
      'data.all',
      'settings.all',
      'reports.all',
      'ai.all'
    ],
    'company_admin': [
      'company.manage',
      'user.manage',
      'data.all',
      'settings.manage',
      'reports.all',
      'ai.use'
    ],
    'admin': [
      'company.manage',
      'user.manage',
      'data.all',
      'settings.manage',
      'reports.all',
      'ai.use'
    ],
    'ecp': [
      'data.view',
      'data.create',
      'data.update',
      'reports.view',
      'ai.use'
    ],
    'lab_tech': [
      'data.view',
      'data.create',
      'data.update',
      'reports.view',
      'ai.use'
    ],
    'dispenser': [
      'data.view',
      'data.create',
      'data.update',
      'reports.view',
      'ai.use'
    ],
    'engineer': [
      'data.view',
      'data.create',
      'data.update',
      'reports.view',
      'ai.use'
    ],
    'supplier': [
      'data.view',
      'reports.view'
    ]
  };

  return rolePermissions[role] || ['data.view'];
}

if (isGoogleAuthConfigured) {
  logger.info("Google OAuth is configured and enabled");

  // Configure Google Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID!,
        clientSecret: GOOGLE_CLIENT_SECRET!,
        callbackURL: `${APP_URL}/api/auth/google/callback`,
        scope: ["profile", "email"],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: Error | null, user?: Express.User | false) => void
      ) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            logger.warn("Google login failed: No email provided");
            return done(null, false);
          }

          const normalizedEmail = normalizeEmail(email);

          // Check if user exists
          let user = await storage.getUserByEmail(normalizedEmail);

          if (user) {
            // Update user's Google profile info if needed
            const updates: any = {};
            if (!user.profileImageUrl && profile.photos?.[0]?.value) {
              updates.profileImageUrl = profile.photos[0].value;
            }
            if (!user.firstName && profile.name?.givenName) {
              updates.firstName = profile.name.givenName;
            }
            if (!user.lastName && profile.name?.familyName) {
              updates.lastName = profile.name.familyName;
            }

            if (Object.keys(updates).length > 0) {
              await storage.updateUser(user.id, updates);
              user = { ...user, ...updates };
            }

            // Update last login
            await db
              .update(users)
              .set({ lastLoginAt: new Date() })
              .where(eq(users.id, user.id));

            logger.info(`Existing user logged in via Google: ${normalizedEmail}`);
          } else {
            // NEW USER: Create user without company association
            // They will be directed to tenant selection
            const firstName = profile.name?.givenName || profile.displayName?.split(" ")[0] || "User";
            const lastName = profile.name?.familyName || profile.displayName?.split(" ").slice(1).join(" ") || "";

            // Create new user WITHOUT company - they must select/create one
            user = await storage.upsertUser({
              email: normalizedEmail,
              firstName,
              lastName,
              profileImageUrl: profile.photos?.[0]?.value || null,
              role: null, // Will be set during company join/create
              roles: [],
              companyId: null, // Must select/create company
              accountStatus: "pending", // Pending until company approval
            } as any);

            if (!user) {
              logger.error("Failed to create user via Google OAuth");
              return done(new Error("Failed to create user"));
            }

            logger.info(`New user created via Google OAuth: ${normalizedEmail}`);
          }

          // Create session user object
          const sessionUser = {
            claims: {
              sub: user.id,
              email: user.email,
              first_name: user.firstName,
              last_name: user.lastName,
              profile_image_url: user.profileImageUrl,
            },
            google: true,
            id: user.id,
            email: user.email || "",
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
            role: user.role || undefined,
            companyId: user.companyId || undefined,
            accountStatus: user.accountStatus,
          };

          return done(null, sessionUser);
        } catch (error) {
          logger.error("Google OAuth error: " + (error instanceof Error ? error.message : String(error)));
          return done(error as Error);
        }
      }
    )
  );
} else {
  logger.warn("Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable.");
}

/**
 * GET /api/auth/google
 * Initiates Google OAuth flow
 */
router.get(
  "/google",
  (req: Request, res: Response, next: NextFunction) => {
    if (!isGoogleAuthConfigured) {
      return res.status(503).json({
        error: "Google Sign-In is not configured",
        message: "Please contact the administrator to enable Google authentication.",
      });
    }
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/**
 * GET /api/auth/google/callback
 * Google OAuth callback handler
 */
router.get(
  "/google/callback",
  (req: Request, res: Response, next: NextFunction) => {
    if (!isGoogleAuthConfigured) {
      return res.redirect("/login?error=google_not_configured");
    }
    next();
  },
  passport.authenticate("google", {
    failureRedirect: "/login?error=google_auth_failed",
    session: true,
  }),
  async (req: Request, res: Response) => {
    try {
      // Successful authentication
      const user = req.user as Express.User & {
        id: string;
        email?: string;
        role?: string;
        companyId?: string;
        accountStatus?: string;
      };

      if (!user) {
        return res.redirect("/login?error=no_user");
      }

      // Get permissions based on role
      const permissions = getUserPermissions(user.role || 'user');

      // Generate token pair using JWT service (consistent with auth-jwt.ts)
      const tokens = jwtService.generateTokenPair({
        userId: user.id,
        companyId: user.companyId || '',
        email: user.email || '',
        role: user.role || 'user',
        permissions
      });

      // Set access token in cookie
      res.cookie("auth_token", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: tokens.expiresIn * 1000, // Convert seconds to ms
      });

      // Set refresh token in separate, stricter cookie
      res.cookie("refresh_token", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", // Stricter for refresh token
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/api/auth/refresh", // Only sent to refresh endpoint
      });

      // Determine redirect based on user state
      let redirectUrl = "/welcome";

      if (!user.companyId) {
        // No company - go to tenant selection
        redirectUrl = "/tenant-selection";
      } else if (user.accountStatus === "pending") {
        // Pending approval
        redirectUrl = "/pending-approval";
      } else if (user.accountStatus === "suspended") {
        // Suspended
        redirectUrl = "/account-suspended";
      } else if (!user.role) {
        // Has company but no role - needs signup
        redirectUrl = "/signup";
      } else {
        // Full user - go to welcome/dashboard
        redirectUrl = "/welcome";
      }

      logger.info(`Google auth redirect: ${user.email} -> ${redirectUrl} (tokens issued)`);
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error("Error in Google callback: " + (error instanceof Error ? error.message : String(error)));
      res.redirect("/login?error=callback_error");
    }
  }
);

/**
 * GET /api/auth/google/status
 * Check if Google OAuth is configured
 */
router.get("/google/status", (_req: Request, res: Response) => {
  res.json({
    enabled: isGoogleAuthConfigured,
    message: isGoogleAuthConfigured
      ? "Google Sign-In is available"
      : "Google Sign-In is not configured",
  });
});

export function registerGoogleAuthRoutes(app: Router): void {
  app.use("/api/auth", router);
  logger.info("Google Auth routes registered");
}

export { router as googleAuthRouter };
