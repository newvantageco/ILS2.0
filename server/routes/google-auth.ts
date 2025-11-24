/**
 * Google OAuth Authentication Routes
 * 
 * Provides Sign-in with Google functionality using passport-google-oauth20
 */

import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { storage } from "../storage";
import { createLogger } from "../utils/logger";
import { normalizeEmail } from "../utils/normalizeEmail";

const router = Router();
const logger = createLogger("google-auth");

// Verify required environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.APP_URL || "http://localhost:5000";

// Check if Google OAuth is configured
const isGoogleAuthConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

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
            logger.warn("Google login failed: No email provided", { profileId: profile.id });
            return done(null, false);
          }

          const normalizedEmail = normalizeEmail(email);
          
          // Check if user exists
          let user = await storage.getUserByEmail(normalizedEmail);
          
          if (user) {
            // Update user's Google profile info if needed
            if (!user.profileImageUrl && profile.photos?.[0]?.value) {
              await storage.updateUser(user.id, {
                profileImageUrl: profile.photos[0].value,
              });
            }
            
            logger.info("User logged in via Google", { 
              userId: user.id, 
              email: normalizedEmail 
            });
          } else {
            // Create new user from Google profile
            const newUserData = {
              email: normalizedEmail,
              firstName: profile.name?.givenName || profile.displayName?.split(" ")[0] || "",
              lastName: profile.name?.familyName || profile.displayName?.split(" ").slice(1).join(" ") || "",
              profileImageUrl: profile.photos?.[0]?.value || null,
              googleId: profile.id,
              accountStatus: "active" as const,
              emailVerified: true, // Google emails are verified
            };
            
            user = await storage.createUser(newUserData);
            
            logger.info("New user created via Google OAuth", { 
              userId: user.id, 
              email: normalizedEmail 
            });
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
            google: true, // Flag to identify Google auth users
            id: user.id,
            email: user.email || "",
            role: user.role || undefined,
            companyId: user.companyId || undefined,
            accountStatus: user.accountStatus,
          };

          return done(null, sessionUser);
        } catch (error) {
          logger.error("Google OAuth error", error as Error);
          return done(error as Error);
        }
      }
    )
  );
} else {
  logger.warn(
    "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable."
  );
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
  }),
  (req: Request, res: Response) => {
    // Successful authentication
    const user = req.user as Express.User & { role?: string };
    
    // Redirect based on user state
    if (!user.role) {
      // New user needs to select role
      res.redirect("/select-role");
    } else {
      // Existing user - redirect to dashboard
      res.redirect("/dashboard");
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
