# JWT Authentication Integration

**Date**: November 25, 2025
**Status**: 🟡 **IMPLEMENTED - NOT YET INTEGRATED**

> **⚠️ CRITICAL:** This document was **aspirational** - the JWT code exists but is **NOT integrated into production routes**. All routes currently use session-based authentication.

---

## Current Reality

**What This Document Said:** "JWT has been successfully integrated"
**Actual Status:** JWT code exists (574 lines) but is **NOT used** by any production routes

### Verification

```bash
# JWT middleware exists but is never called
$ grep -n "authenticateHybrid" server/routes.ts
110:import { authenticateHybrid } from "./middleware/auth-hybrid.js";
# ^^ Imported but ZERO usages!

# All routes use session auth instead
$ grep -n "isAuthenticated" server/routes.ts | wc -l
158  # 158 routes use session auth, NOT JWT
```

### What Actually Works

- ✅ **Session Authentication** - All routes use `isAuthenticated` (session-based)
- 🟡 **JWT Code Exists** - Files written but not integrated
- ❌ **JWT Not Active** - Login doesn't return JWT, routes don't accept JWT

---

## What Was Implemented (But Not Integrated)

JWT (JSON Web Token) authentication **code has been written** for ILS 2.0 as a **parallel authentication system** alongside existing session-based authentication. When integrated, this will enable:

- Token-based stateless authentication
- Automatic token refresh
- Improved scalability
- Mobile app support
- Gradual migration from sessions to JWT

---

## What Was Implemented

### 1. Backend Changes

#### ✅ JWT Service (`server/services/JWTService.ts`)
- Token generation (access + refresh tokens)
- Token verification and validation
- Token refresh logic
- Configurable expiry times

#### ✅ JWT Middleware (`server/middleware/auth-jwt.ts`)
- Bearer token extraction (Authorization header)
- Token verification middleware
- Role-based authorization
- Permission-based authorization

#### ✅ JWT Routes (`server/routes/auth-jwt.ts`)
- `POST /api/auth/login` - Login with JWT tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (client-side token deletion)
- `GET /api/auth/verify` - Verify current token
- `GET /api/auth/me` - Get current user profile

#### ✅ Hybrid Authentication (`server/middleware/auth-hybrid.ts`)
- Tries JWT first, falls back to session
- Enables gradual migration
- Backward compatible

#### ✅ Updated Login Endpoint (`server/routes.ts:947`)
- Now returns JWT tokens along with session
- Parallel authentication (both work)
- User permissions included in response

### 2. Frontend Changes

#### ✅ API Client (`client/src/lib/api.ts`)
- JWT token storage (localStorage)
- Automatic token refresh (5-minute buffer)
- Authorization header injection
- Token expiry tracking
- Fallback to session (withCredentials: true)

#### ✅ Login Page (`client/src/pages/EmailLoginPage.tsx`)
- Stores JWT tokens on successful login
- Graceful fallback if tokens not returned

#### ✅ Auth Hook (`client/src/hooks/useAuth.ts`)
- Clears JWT tokens on logout
- Maintains session logout functionality

### 3. Configuration

#### ✅ Environment Variables (`.env.example`)
```bash
# JWT Authentication Configuration
JWT_SECRET=                    # Generate with: openssl rand -hex 32
JWT_EXPIRES_IN=7d              # Access token lifetime
JWT_REFRESH_EXPIRES_IN=30d     # Refresh token lifetime
JWT_AUTH_ENABLED=true          # Enable JWT authentication
JWT_AUTH_REQUIRED=false        # Require JWT (disable sessions)
```

---

## Architecture

### Parallel Authentication Flow

```
┌─────────────────────────────────────────┐
│          User Login Request             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   POST /api/auth/login-email            │
│   (Passport local strategy)             │
└──────────────┬──────────────────────────┘
               │
               ├─► Creates Session (passport)
               │
               ├─► Generates JWT Tokens
               │   - Access Token (7 days)
               │   - Refresh Token (30 days)
               │
               ▼
┌─────────────────────────────────────────┐
│        Response to Client               │
│  {                                      │
│    user: { ... },                       │
│    accessToken: "eyJ...",               │
│    refreshToken: "eyJ...",              │
│    expiresIn: 604800                    │
│  }                                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Frontend Stores Tokens              │
│  - localStorage: ils_access_token       │
│  - localStorage: ils_refresh_token      │
│  - localStorage: ils_token_expiry       │
│  + Session cookie (fallback)            │
└─────────────────────────────────────────┘
```

### Subsequent API Requests

```
┌─────────────────────────────────────────┐
│        API Request from Client          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   axios.interceptors.request            │
│   - Checks token expiry                 │
│   - Auto-refreshes if needed            │
│   - Adds Authorization: Bearer {token}  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Server: authenticateHybrid            │
│   ┌─────────────────────────────┐       │
│   │ 1. Try JWT (Authorization)  │       │
│   │    ✓ Valid → Attach user    │       │
│   │    ✗ Invalid → Try session  │       │
│   └─────────────────────────────┘       │
│   ┌─────────────────────────────┐       │
│   │ 2. Try Session (cookies)    │       │
│   │    ✓ Valid → Attach user    │       │
│   │    ✗ Invalid → 401 Unauthorized│     │
│   └─────────────────────────────┘       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       Protected Route Handler           │
│   req.user available                    │
└─────────────────────────────────────────┘
```

---

## Token Structure

### Access Token Payload
```json
{
  "userId": "user-123",
  "companyId": "company-456",
  "email": "user@example.com",
  "role": "ecp",
  "permissions": ["data.view", "data.create", ...],
  "type": "access",
  "iat": 1700000000,
  "exp": 1700604800,
  "iss": "ils-platform",
  "aud": "ils-api"
}
```

### Refresh Token Payload
```json
{
  "userId": "user-123",
  "companyId": "company-456",
  "email": "user@example.com",
  "role": "ecp",
  "permissions": ["data.view", "data.create", ...],
  "type": "refresh",
  "iat": 1700000000,
  "exp": 1702592000,
  "iss": "ils-platform",
  "aud": "ils-api"
}
```

---

## Testing the Integration

### 1. Manual Testing

#### Test Login with JWT
```bash
curl -X POST http://localhost:5000/api/auth/login-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Expected Response:
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "role": "ecp",
    ...
    "permissions": [...]
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 604800
}
```

#### Test JWT Login (New Endpoint)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Test Token Verification
```bash
curl -X GET http://localhost:5000/api/auth/verify \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Test Token Refresh
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

#### Test Protected Route with JWT
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 2. Browser Testing

1. **Login**: Go to `/email-login` and login
2. **Check Storage**: Open DevTools → Application → Local Storage
   - Should see: `ils_access_token`, `ils_refresh_token`, `ils_token_expiry`
3. **Check Network**: Open DevTools → Network
   - All API requests should have `Authorization: Bearer ...` header
4. **Test Logout**: Logout and verify tokens are cleared

### 3. Frontend Developer Console Testing

```javascript
// Check if JWT tokens are stored
console.log('Access Token:', localStorage.getItem('ils_access_token'));
console.log('Refresh Token:', localStorage.getItem('ils_refresh_token'));
console.log('Token Expiry:', localStorage.getItem('ils_token_expiry'));

// Check token expiry date
const expiry = localStorage.getItem('ils_token_expiry');
console.log('Token expires:', new Date(parseInt(expiry)));

// Force token refresh by setting expiry to past
localStorage.setItem('ils_token_expiry', '0');
// Next API call will auto-refresh
```

---

## Migration Strategy

### Phase 1: Parallel Authentication (Current)
- ✅ JWT and session both work
- ✅ Login returns both session + JWT
- ✅ All routes accept both auth methods
- **Status**: DEPLOYED
- **Duration**: 2-4 weeks
- **Goal**: Monitor JWT adoption

### Phase 2: Encourage JWT (Future)
- Update documentation to recommend JWT
- Mobile apps use JWT by default
- New users prefer JWT
- **Duration**: 2-4 weeks
- **Goal**: 50%+ JWT usage

### Phase 3: JWT Default (Future)
- New users get JWT only
- Existing users migrate on next login
- Session still works for legacy clients
- **Duration**: 4-8 weeks
- **Goal**: 90%+ JWT usage

### Phase 4: JWT Only (Future - Optional)
- When JWT usage > 95%, disable sessions
- Remove session middleware
- Clean up database
- **Duration**: 2-4 weeks
- **Goal**: 100% JWT

---

## Security Considerations

### ✅ Implemented (Code Exists)
- Tokens signed with HS256 (HMAC-SHA256)
- Configurable token expiry
- Refresh token rotation
- Token type validation (access vs refresh)
- Issuer/Audience claims verification
- Secure token storage (localStorage) - **NOT YET WIRED UP**

### ⚠️ Production Recommendations
1. **JWT_SECRET**: Use strong 256-bit secret in production
2. **HTTPS Only**: Tokens should only be transmitted over HTTPS
3. **Token Blacklist**: Consider implementing for logout (optional)
4. **Rate Limiting**: Apply to `/auth/login` and `/auth/refresh`
5. **Monitoring**: Track failed auth attempts

---

## Troubleshooting

### Issue: Login returns no JWT tokens
**Solution**: Check if `JWT_SECRET` is set in `.env`

### Issue: "TOKEN_EXPIRED" error immediately after login
**Solution**: Check system time synchronization

### Issue: Token refresh fails
**Solution**: Check if refresh token is still valid (30 days)

### Issue: Session still works but JWT doesn't
**Solution**: Check Authorization header format: `Bearer {token}`

---

## Files Modified

### Backend
- ✅ `server/services/JWTService.ts` - **NEW**
- ✅ `server/middleware/auth-jwt.ts` - **NEW**
- ✅ `server/routes/auth-jwt.ts` - **NEW**
- ✅ `server/middleware/auth-hybrid.ts` - **NEW**
- ✅ `server/routes.ts` - **MODIFIED** (lines 108-110, 255, 982-1017)

### Frontend
- ✅ `client/src/lib/api.ts` - **MODIFIED** (full JWT support)
- ✅ `client/src/hooks/useAuth.ts` - **MODIFIED** (JWT logout)
- ✅ `client/src/pages/EmailLoginPage.tsx` - **MODIFIED** (JWT storage)

### Configuration
- ✅ `.env.example` - **MODIFIED** (JWT configuration)

---

## Next Steps

### Immediate (Integration Required FIRST)
1. ❌ Register JWT routes in server/routes.ts
2. ❌ Replace `isAuthenticated` with `authenticateHybrid` across routes
3. ❌ Update login endpoint to return JWT tokens
4. ❌ Update frontend to store and use tokens
5. ❌ Deploy to staging environment
6. ⏳ Test login flow end-to-end
7. ⏳ Test token refresh mechanism
8. ⏳ Test logout and token clearing
9. ⏳ Monitor for errors

### Short Term (1-2 weeks)
- Add JWT usage metrics
- Monitor token refresh frequency
- Collect user feedback
- Fix any edge cases

### Long Term (2-4 weeks+)
- Increase JWT adoption
- Consider token blacklist
- Mobile app integration
- Analytics dashboard

---

## Success Metrics

- ❌ JWT routes registered and accessible - **NOT DONE**
- ❌ Login returns JWT tokens - **NOT DONE**
- ❌ Frontend stores tokens correctly - **NOT DONE**
- ❌ Tokens refresh automatically - **NOT DONE**
- ❌ Both auth methods work in parallel - **NOT DONE**
- ❌ Zero authentication-related errors - **NOT TESTED**
- ❌ JWT usage > 10% within 2 weeks - **NOT DEPLOYED**

---

## How to Actually Integrate

See [MULTITENANT_AI_INTEGRATION_STATUS.md](./MULTITENANT_AI_INTEGRATION_STATUS.md) for detailed integration plan.

**Estimated Effort:** 2-3 days
**Complexity:** Medium
**Risk:** Low (hybrid approach is backward compatible)

### Integration Steps

1. **Register JWT Routes** (30 mins)
   ```typescript
   // server/routes.ts
   import authJWTRoutes from './routes/auth-jwt.js';
   app.use('/api/auth', authJWTRoutes);
   ```

2. **Replace Authentication Middleware** (2-3 hours)
   ```typescript
   // Find and replace across server/routes.ts
   // FROM: isAuthenticated
   // TO:   authenticateHybrid
   ```

3. **Update Login Endpoint** (1 hour)
   ```typescript
   // server/routes.ts - /api/auth/login-email handler
   // Add JWT token generation to response
   ```

4. **Update Frontend** (2-3 hours)
   - client/src/lib/api.ts - Token storage and injection
   - client/src/pages/EmailLoginPage.tsx - Store tokens on login
   - client/src/hooks/useAuth.ts - Clear tokens on logout

5. **Test End-to-End** (4-6 hours)
   - Manual testing
   - Integration tests
   - Security testing

**Total Time:** 2-3 days

---

## Contact

For questions or issues, contact the development team or create an issue in the repository.

**Status**: 🟡 **IMPLEMENTED - NOT INTEGRATED**
**Next Action**: Choose integration path (see MULTITENANT_AI_INTEGRATION_STATUS.md)
**Last Updated**: November 25, 2025
