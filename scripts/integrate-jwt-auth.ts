/**
 * JWT Authentication Integration Guide
 *
 * This file demonstrates how to integrate JWT authentication into existing routes.
 * Follow the steps below to migrate from session-based to JWT-based authentication.
 *
 * IMPORTANT: This creates PARALLEL authentication (both session and JWT work)
 * to allow gradual migration without breaking existing sessions.
 */

/**
 * STEP 1: Update server/routes.ts
 *
 * Add JWT routes alongside existing session routes:
 */

/*
// At the top of server/routes.ts, add imports:
import { authenticateJWT, requireRole, requirePermission } from './middleware/auth-jwt.js';
import authJWTRoutes from './routes/auth-jwt.js';
import { jwtService } from './services/JWTService.js';

// Register JWT auth routes (around line 439):
app.use('/api/auth/jwt', authJWTRoutes);

// Example: Protect a route with JWT (parallel to session auth):
app.get('/api/user/profile',
  // Try JWT first, fall back to session
  async (req, res, next) => {
    try {
      authenticateJWT(req, res, next);
    } catch (error) {
      // Fall back to session auth
      isAuthenticated(req, res, next);
    }
  },
  async (req, res) => {
    const user = req.user;
    res.json({ user });
  }
);
*/

/**
 * STEP 2: Update login endpoint to return JWT tokens
 *
 * Modify the existing /api/login endpoint:
 */

/*
// In server/routes.ts, update login handler:
app.post("/api/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // ... existing validation ...

    const user = await storage.getUserByUsername(username);

    // ... existing password check ...

    // Get user permissions
    const permissions = await getUserPermissions(user);

    // EXISTING: Create session (keep for backward compatibility)
    await loginUser(req, user.id);

    // NEW: Also generate JWT tokens
    const tokens = jwtService.generateTokenPair({
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role,
      permissions
    });

    // Return both session cookie AND JWT tokens
    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      },
      // NEW: JWT tokens in response
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn
    });
  } catch (error) {
    next(error);
  }
});
*/

/**
 * STEP 3: Create hybrid authentication middleware
 *
 * This middleware tries JWT first, then falls back to session
 */

// Create: server/middleware/auth-hybrid.ts

/*
import { Request, Response, NextFunction } from 'express';
import { authenticateJWT, type AuthenticatedRequest } from './auth-jwt.js';
import { isAuthenticated } from './auth.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('auth-hybrid');

export const authenticateHybrid = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Check if Authorization header with JWT exists
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Try JWT authentication
    try {
      authenticateJWT(req, res, next);
      logger.debug('Authenticated via JWT');
      return;
    } catch (error) {
      logger.debug('JWT auth failed, trying session:', error);
    }
  }

  // Fall back to session authentication
  try {
    isAuthenticated(req, res, next);
    logger.debug('Authenticated via session');
  } catch (error) {
    logger.debug('Session auth failed');
    res.status(401).json({ error: 'Authentication required' });
  }
};
*/

/**
 * STEP 4: Update frontend to use JWT
 *
 * Modify client/src/lib/api.ts:
 */

/*
// Store JWT tokens
let accessToken: string | null = localStorage.getItem('access_token');
let refreshToken: string | null = localStorage.getItem('refresh_token');

export function setAuthTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

export function clearAuthTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// Updated API request with JWT
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
    ...options.headers
  };

  let response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
    credentials: 'include' // Still send cookies for fallback
  });

  // Handle token expiration
  if (response.status === 401) {
    const errorData = await response.json();

    if (errorData.code === 'TOKEN_EXPIRED' && refreshToken) {
      // Try to refresh token
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry original request with new token
        return apiRequest(endpoint, options);
      }
    }

    // Token refresh failed or no refresh token
    clearAuthTokens();
    window.location.href = '/login';
  }

  return response;
}

// Token refresh
async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/jwt/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      setAuthTokens(data.accessToken, data.refreshToken);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}

// Update login function
export async function login(username: string, password: string) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const data = await response.json();

  // Store JWT tokens
  if (data.accessToken && data.refreshToken) {
    setAuthTokens(data.accessToken, data.refreshToken);
  }

  return data;
}
*/

/**
 * STEP 5: Environment variables
 *
 * Add to .env:
 */

/*
# JWT Configuration
JWT_SECRET=your-256-bit-secret-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Optional: Feature flag for gradual rollout
JWT_AUTH_ENABLED=true
JWT_AUTH_REQUIRED=false  # Set to true to disable session auth
*/

/**
 * STEP 6: Testing checklist
 */

export const INTEGRATION_CHECKLIST = {
  backend: [
    '✅ JWT service imported in routes.ts',
    '✅ JWT routes registered at /api/auth/jwt',
    '✅ Login endpoint returns JWT tokens',
    '✅ Hybrid authentication middleware created',
    '✅ Protected routes use hybrid auth',
    '✅ Environment variables configured'
  ],
  frontend: [
    '✅ JWT token storage in localStorage',
    '✅ Authorization header in API requests',
    '✅ Token refresh logic implemented',
    '✅ Login function stores JWT tokens',
    '✅ Logout clears JWT tokens',
    '✅ 401 handling with token refresh'
  ],
  testing: [
    '✅ Login returns JWT tokens',
    '✅ API requests work with JWT',
    '✅ Token refresh works',
    '✅ Expired token handled correctly',
    '✅ Invalid token rejected',
    '✅ Session auth still works (fallback)',
    '✅ Both auth methods work in parallel'
  ],
  migration: [
    '⏸️ Monitor JWT usage metrics',
    '⏸️ Gradually increase JWT adoption',
    '⏸️ After 90%+ JWT usage, disable sessions',
    '⏸️ Remove session middleware',
    '⏸️ Remove session database table'
  ]
};

/**
 * STEP 7: Rollout strategy
 */

export const ROLLOUT_STRATEGY = `
Phase 1: Parallel Authentication (Week 1)
- Deploy JWT implementation
- Login returns both session + JWT
- All routes accept both auth methods
- Monitor for issues
- JWT usage: 0-10%

Phase 2: Encourage JWT (Week 2)
- Update documentation to recommend JWT
- Update frontend to prefer JWT
- Keep session fallback
- JWT usage: 10-50%

Phase 3: JWT Default (Week 3)
- New users get JWT only
- Existing users migrate on next login
- Session still works for legacy clients
- JWT usage: 50-90%

Phase 4: JWT Only (Week 4+)
- When JWT usage > 90%, disable sessions
- Remove session middleware
- Clean up database
- JWT usage: 100%
`;

console.log('JWT Integration Guide');
console.log('====================\n');
console.log('This file contains step-by-step instructions for integrating JWT authentication.');
console.log('\nKey files to modify:');
console.log('  - server/routes.ts (add JWT routes)');
console.log('  - server/middleware/auth-hybrid.ts (create hybrid auth)');
console.log('  - client/src/lib/api.ts (add JWT token management)');
console.log('\nSee inline comments above for detailed code examples.\n');
console.log('Checklist:');
Object.entries(INTEGRATION_CHECKLIST).forEach(([category, items]) => {
  console.log(`\n${category.toUpperCase()}:`);
  items.forEach(item => console.log(`  ${item}`));
});

export default INTEGRATION_CHECKLIST;
