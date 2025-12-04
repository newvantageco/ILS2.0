import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import { normalizeEmail } from "./utils/normalizeEmail";

let sessionSerializationConfigured = false;

function ensurePassportSerialization() {
  if (sessionSerializationConfigured) {
    return;
  }

  passport.serializeUser((user: any, done) => done(null, user));
  passport.deserializeUser((user: any, done) => done(null, user));
  sessionSerializationConfigured = true;
}

// Configure passport-local strategy for email/password authentication
export function setupLocalAuth() {
  ensurePassportSerialization();

  passport.use('local', new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        if (typeof email !== "string" || typeof password !== "string") {
          return done(null, false, { message: "Invalid email or password" });
        }

        const trimmedEmail = email.trim();
        if (!trimmedEmail || !password) {
          return done(null, false, { message: "Invalid email or password" });
        }

        const normalizedEmail = normalizeEmail(trimmedEmail);
        const user = await storage.getUserByEmail(normalizedEmail);
        
        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }

        if (!user.password) {
          return done(null, false, { message: "This account requires password setup. Please contact your administrator." });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
          return done(null, false, { message: "Invalid email or password" });
        }

        // Verify account is active
        if (user.accountStatus !== 'active') {
          return done(null, false, { message: "Account is not active. Please contact support." });
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
          local: true, // Flag to identify local auth users
          id: user.id,
          // Mirror email at top-level for compatibility with Express.User augmentation
          // Coalesce to empty string if DB value is null to satisfy express.User typing
          email: user.email || '',
          role: user.role || undefined,
          companyId: user.companyId || undefined,
          accountStatus: user.accountStatus,
        };

        return done(null, sessionUser);
      } catch (error) {
        return done(error);
      }
    }
  ));
}

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Middleware to check if user is authenticated
export function isAuthenticatedLocal(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // For local auth users, no token refresh needed
  if (req.user.local) {
    return next();
  }

  // For other auth methods, check token expiration
  // (This will be handled by the existing isAuthenticated middleware)
  return next();
}
