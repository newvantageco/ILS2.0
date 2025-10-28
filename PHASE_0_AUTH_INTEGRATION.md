# Auth Service Integration - Phase 0 Implementation

## Overview

Phase 0 authentication service provides a unified adapter for:
- **AWS Cognito** (primary production provider)
- **Auth0** (alternative provider)
- **Local development** (for testing)

The integration enables **zero-downtime migration** from Replit-based auth to cloud-based providers.

---

## Architecture

### Components

```
┌─────────────────────────────────────┐
│  Express Application                 │
│  (existing routes & middleware)      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  AuthIntegration (middleware)        │
│  - Route to correct auth handler     │
│  - Support gradual migration         │
│  - Fallback between providers        │
└──────────────┬──────────────────────┘
         ┌─────┴─────┐
         ▼           ▼
    ┌────────┐   ┌─────────────┐
    │ Legacy │   │  AuthService│
    │ Auth   │   │  (Cognito/  │
    │(Replit)│   │   Auth0)    │
    └────────┘   └─────────────┘
         │           │
         └─────┬─────┘
               ▼
        ┌────────────────┐
        │ User Database  │
        │ (normalized)   │
        └────────────────┘
```

### Authentication Flow

```
1. Client sends request with Authorization header
                    │
                    ▼
2. AuthIntegration middleware intercepts
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
    New Auth Available?    Legacy Auth Available?
         │                     │
    YES  │  NO            YES  │  NO
         │                     │
         ▼                     ▼
    Verify Token          Passport Session
    (JWT decode)          (Session cookie)
         │                     │
         └──────────┬──────────┘
                    ▼
        Normalize to AuthClaims
                    │
                    ▼
        Upsert user in database
                    │
                    ▼
        Attach to request context
                    │
                    ▼
        next() → Route handler
```

---

## Configuration

### Environment Variables

```bash
# Auth Provider Selection
AUTH_PROVIDER=cognito              # cognito | auth0 | local
FORCE_NEW_AUTH=false               # Force new auth even if legacy available
LEGACY_AUTH_ENABLED=true           # Keep legacy auth during migration

# Auth Service Configuration
AUTH_CLIENT_ID=...                 # Cognito Client ID
AUTH_CLIENT_SECRET=...             # Cognito Client Secret (if needed)
AUTH_ISSUER=...                    # Auth provider issuer URL
AUTH_JWKS_URL=...                  # JWKS endpoint URL
AUTH_AUDIENCE=...                  # Expected audience claim (optional)

# Session Management
SESSION_SECRET=...                 # For session store encryption
SESSION_TTL=604800                 # 7 days in seconds
```

### Development Mode

```bash
# Enable local auth for development
AUTH_PROVIDER=local
LEGACY_AUTH_ENABLED=true
```

### Production - Cognito

```bash
AUTH_PROVIDER=cognito
AUTH_CLIENT_ID=your-cognito-client-id
AUTH_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX
AUTH_JWKS_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX/.well-known/jwks.json
AUTH_AUDIENCE=your-api-identifier
FORCE_NEW_AUTH=true                # Switch to new auth
LEGACY_AUTH_ENABLED=false
```

### Production - Auth0

```bash
AUTH_PROVIDER=auth0
AUTH_CLIENT_ID=your-auth0-client-id
AUTH_CLIENT_SECRET=your-auth0-client-secret
AUTH_ISSUER=https://your-tenant.auth0.com
AUTH_JWKS_URL=https://your-tenant.auth0.com/.well-known/jwks.json
AUTH_AUDIENCE=https://your-api.example.com
FORCE_NEW_AUTH=true
LEGACY_AUTH_ENABLED=false
```

---

## Usage

### Basic Integration

```typescript
import { createAuthIntegration } from "./services/AuthIntegration";

const app = express();

// Create auth integration
const authIntegration = createAuthIntegration();

// Add auth middleware to protected routes
app.get("/api/orders", authIntegration.authenticateUser(), async (req, res) => {
  const user = (req as any).user;
  const { tenantContext } = (req as any).auth;
  
  console.log(`User ${user.id} from tenant ${tenantContext.tenantId}`);
  
  // Get orders for this tenant
  const orders = await storage.getOrders({
    ecpId: tenantContext.tenantId,
  });
  
  res.json(orders);
});
```

### Tenant-Scoped Queries

```typescript
// Extract tenant from auth context
const user = (req as any).user;
const tenantContext = (req as any).auth?.tenantContext;

// All queries automatically scoped to tenant
const userOrders = await storage.getOrders({
  ecpId: tenantContext.tenantId,
});

// Verify tenant access before operations
if (order.ecpId !== tenantContext.tenantId) {
  return res.status(403).json({ error: "Access denied" });
}
```

### Token Refresh

```typescript
// Check if token needs refresh
const refreshed = await authIntegration.authService?.refreshTokenIfNeeded(
  bearerToken,
  refreshToken
);

if (refreshed) {
  // Update client with new tokens
  res.json({ token: refreshed.token });
} else if (refreshed === null) {
  // Token refresh needed at provider level
  res.status(401).json({ error: "Re-authentication required" });
}
```

### Health Check

```typescript
app.get("/health/auth", async (req, res) => {
  const status = await authIntegration.healthCheck();
  res.json(status);
  // Response:
  // {
  //   legacyAuth: true,
  //   newAuth: false,
  //   activeProvider: "legacy"
  // }
});
```

---

## Migration Strategy

### Phase 1: Prepare New Auth

1. **Deploy AuthService** without forcing it active
   ```bash
   AUTH_PROVIDER=cognito
   FORCE_NEW_AUTH=false
   LEGACY_AUTH_ENABLED=true
   ```

2. **Monitor new auth** in logs while legacy continues
   - Track auth method in application metrics
   - Verify Cognito/Auth0 connection

### Phase 2: Gradual Migration

3. **Enable new auth alongside legacy** (default behavior)
   ```
   Request → Try New Auth → Success → Use new
             → Fail → Try Legacy Auth → Success → Use legacy
             → All fail → 401
   ```

4. **Migrate users gradually**
   - Use `/api/auth/migrate` endpoint
   - Batch migrate low-traffic users first
   - Monitor error rates

5. **Switch default** to new auth
   ```bash
   # Make new auth the primary
   AUTH_PROVIDER=cognito
   FORCE_NEW_AUTH=false
   LEGACY_AUTH_ENABLED=true
   ```

### Phase 3: Cutover

6. **Disable legacy auth** (optional)
   ```bash
   FORCE_NEW_AUTH=true
   LEGACY_AUTH_ENABLED=false
   ```

---

## Token Claims Structure

### Standard Claims (All Providers)

```typescript
interface AuthClaims {
  sub: string;              // Subject (user ID)
  email: string;            // Email address
  email_verified: boolean;  // Email verification status
  name?: string;            // Full name
  picture?: string;         // Profile picture URL
  given_name?: string;      // First name
  family_name?: string;     // Last name
  phone_number?: string;    // Phone number
  
  // Token metadata
  iss: string;              // Issuer
  aud: string;              // Audience
  exp: number;              // Expiration (Unix timestamp)
  iat: number;              // Issued at (Unix timestamp)
}
```

### Custom Claims - Cognito

```typescript
// Cognito uses "custom:" prefix
interface CognitoClaims extends AuthClaims {
  "custom:tenant_id": string;
  "custom:organization_id"?: string;
  "custom:role": string;
}
```

### Custom Claims - Auth0

```typescript
// Auth0 can use custom namespace
interface Auth0Claims extends AuthClaims {
  "https://myapp.com/tenant_id": string;
  "https://myapp.com/organization_id"?: string;
  "https://myapp.com/role": string;
  // Or org_id / org_name for built-in org support
  org_id?: string;
  org_name?: string;
}
```

---

## Error Handling

### Common Errors

**Error: "Missing bearer token"**
```
Status: 401
Cause: No Authorization header or wrong format
Fix: Add header: Authorization: Bearer <token>
```

**Error: "Invalid token"**
```
Status: 401
Cause: Token expired, malformed, or invalid signature
Fix: Refresh token via auth provider
```

**Error: "Issuer mismatch"**
```
Status: 401
Cause: Token from different auth provider
Fix: Verify AUTH_ISSUER environment variable
```

**Error: "No authentication available"**
```
Status: 401
Cause: Both new and legacy auth disabled
Fix: Enable AUTH_PROVIDER or LEGACY_AUTH_ENABLED
```

---

## Tenant Isolation

### Automatic Tenant Scoping

```typescript
// Extract from auth context
const tenantId = (req as any).auth.tenantContext.tenantId;

// Verify user belongs to tenant before access
if (order.ecpId !== tenantId) {
  return res.status(403).json({ error: "Not your tenant" });
}
```

### Role-Based Access Control (RBAC)

```typescript
const roles = (req as any).auth.tenantContext.roles;

if (!roles.includes("admin")) {
  return res.status(403).json({ error: "Admin role required" });
}
```

### Organization-Level Queries

```typescript
const orgId = (req as any).auth.tenantContext.organizationId;

// Query scoped to organization
const results = await db
  .select()
  .from(users)
  .where(eq(users.organizationId, orgId));
```

---

## Testing

### Unit Tests

```typescript
import { AuthService } from "./AuthService";

describe("AuthService", () => {
  test("decodes valid token", () => {
    const authService = new AuthService({
      provider: "local",
      clientId: "test",
      issuer: "http://localhost",
    });

    const token = "eyJhbGc..."; // Valid test token
    const claims = authService.decodeToken(token);

    expect(claims.sub).toBeDefined();
    expect(claims.email).toBeDefined();
  });

  test("rejects expired token", () => {
    const authService = new AuthService({
      provider: "local",
      clientId: "test",
      issuer: "http://localhost",
    });

    const expiredToken = "eyJhbGc..."; // Expired token
    expect(() => authService.verifyToken(expiredToken)).rejects.toThrow();
  });

  test("extracts tenant context", () => {
    const authService = new AuthService({
      provider: "cognito",
      clientId: "test",
      issuer: "http://localhost",
    });

    const claims: AuthClaims = {
      sub: "user-123",
      email: "user@example.com",
      email_verified: true,
      "custom:tenant_id": "tenant-456",
      "custom:role": "admin",
      iss: "http://localhost",
      aud: "client-123",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    };

    const tenantContext = authService.extractTenantContext(claims);
    expect(tenantContext.tenantId).toBe("tenant-456");
    expect(tenantContext.roles).toContain("admin");
  });
});
```

### Integration Tests

```typescript
import request from "supertest";
import app from "./app";

describe("Auth Integration", () => {
  test("POST /api/orders requires authentication", async () => {
    const response = await request(app)
      .post("/api/orders")
      .send({ /* order data */ });

    expect(response.status).toBe(401);
  });

  test("authenticated request includes user context", async () => {
    const token = generateTestToken();

    const response = await request(app)
      .get("/api/auth/user")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBeDefined();
  });

  test("respects tenant isolation", async () => {
    const tenant1Token = generateTestToken("tenant-1");
    const tenant2Token = generateTestToken("tenant-2");

    // Tenant 1 creates order
    const createResponse = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${tenant1Token}`)
      .send(orderData);

    const orderId = createResponse.body.id;

    // Tenant 2 cannot access tenant 1's order
    const getResponse = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${tenant2Token}`);

    expect(getResponse.status).toBe(403);
  });
});
```

---

## Monitoring & Debugging

### Enable Debug Logging

```bash
LOG_LEVEL=debug npm run dev
```

### Monitor Auth Flows

```typescript
// Check which auth method is being used
// Look for logs:
// [AuthIntegration:INFO] New auth verification successful
// [AuthIntegration:INFO] Falling back to legacy auth
// [AuthIntegration:INFO] User authenticated via <provider>
```

### Audit Token Usage

```typescript
// Log all auth events
app.use((req, res, next) => {
  const user = (req as any).user;
  const provider = (req as any).auth?.provider || "none";
  
  res.on("finish", () => {
    console.log(`[AUTH] ${req.method} ${req.path} - User: ${user?.id} - Provider: ${provider}`);
  });
  
  next();
});
```

---

## Performance Considerations

### Token Caching

- JWKS keys are cached for 1 hour
- Token expiration check is local (no network call)
- Decode operation is O(1) base64 parsing

### Session Management

- Sessions stored in PostgreSQL (persistent across restarts)
- Session TTL: 7 days (configurable)
- Automatic cleanup of expired sessions

### Scalability

- Stateless token verification (can be load balanced)
- JWKS cache shared across processes
- No database queries for auth verification (only for user sync)

---

## Security Best Practices

### Secrets Management

```bash
# ✅ Store in environment variables or secrets manager
AUTH_CLIENT_SECRET=$(aws secretsmanager get-secret-value --secret-id auth-client-secret)

# ❌ Never commit to repository
# git add -A && git commit -m "Add client secret" # DON'T DO THIS
```

### HTTPS Enforcement

```typescript
// Auth middleware should run over HTTPS in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && !req.secure) {
    return res.status(403).json({ error: "HTTPS required" });
  }
  next();
});
```

### Token Inspection

```typescript
// NEVER log full tokens
// ❌ console.log("Token:", token);

// ✅ Log token metadata only
const claims = authService.decodeToken(token);
console.log("User:", claims.sub, "Expires:", new Date(claims.exp * 1000));
```

---

## Troubleshooting

### "Issuer mismatch" Error

```
Check:
1. AUTH_ISSUER matches your Cognito/Auth0 domain
2. Token was issued by the same provider
3. No typos in AUTH_ISSUER environment variable

Debug:
const claims = authService.decodeToken(token);
console.log("Token issuer:", claims.iss);
console.log("Expected:", process.env.AUTH_ISSUER);
```

### "JWKS fetch failed"

```
Check:
1. AUTH_JWKS_URL is correct
2. Network connectivity to JWKS endpoint
3. Endpoint is publicly accessible (no VPN/IP restrictions)

Debug:
curl -v https://auth-provider.com/.well-known/jwks.json
```

### "Token expired immediately"

```
Check:
1. Server time is synced (run `ntpdate`)
2. Token exp claim is in seconds (not milliseconds)
3. Clock skew tolerance is sufficient

Typical fix:
systemctl restart ntpd
```

---

## Next Steps

1. **Deploy to Staging** - Test with actual Cognito/Auth0
2. **Gradual Migration** - Follow Phase 1-3 migration strategy
3. **Monitor Cutover** - Watch error rates and logs
4. **Celebrate** - Zero-downtime auth migration complete!

For questions, refer to:
- IMPLEMENTATION_GUIDE.md - Architecture overview
- AuthService.ts - Implementation details
- Integration tests - Code examples
