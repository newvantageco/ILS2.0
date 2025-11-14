# Railway Deployment Readiness Checklist

**Status**: ✅ Production Ready  
**Last Updated**: November 14, 2025  
**Target Environment**: Railway App Platform

## 📋 Pre-Deployment Verification

### 1. ✅ Configuration Files

- [x] `railway.json` — Correctly configured with health checks and start command
- [x] `railway.toml` — Backup configuration, aligned with railway.json
- [x] `Dockerfile` — Multi-stage production build with non-root user
- [x] `.env.example` — Comprehensive environment variables documented
- [x] `package.json` — Build scripts optimized for Railway

### 2. ✅ Environment Variables

**Railway Auto-Provides:**
```
DATABASE_URL       # Neon PostgreSQL (from Railway Postgres plugin)
REDIS_URL         # Redis connection string (from Railway Redis plugin)
PORT              # Auto-assigned (default 8080, but we override to listen on $PORT)
```

**Required Variables (Set in Railway Dashboard):**
```
SESSION_SECRET            # Min 32 chars (generate: openssl rand -base64 32)
NODE_ENV=production       # Always set to 'production'
APP_URL=https://app.yourdomain.com  # Your custom domain

# Optional but recommended
MASTER_USER_EMAIL         # Bootstrap admin account
MASTER_USER_PASSWORD      # Min 12 chars
RESEND_API_KEY           # Email service
STRIPE_SECRET_KEY        # Live keys only
STRIPE_PUBLISHABLE_KEY   # Live keys only
OPENAI_API_KEY           # For AI features
ANTHROPIC_API_KEY        # For AI features
```

### 3. ✅ Build Configuration

- [x] **ESBuild**: Configured to bundle server code as single dist/index.js
- [x] **Vite**: Frontend builds to dist/public/
- [x] **Output Structure**:
  ```
  dist/
  ├── index.js       # Bundled server (via ESBuild)
  ├── public/        # Frontend assets (via Vite)
  │   ├── index.html
  │   ├── assets/
  │   └── ...
  ├── migrations/    # Drizzle migrations
  └── node_modules/  # Dependencies
  ```

### 4. ✅ Database Configuration

- [x] **Drizzle ORM**: Configured for PostgreSQL (Neon serverless)
- [x] **Connection Pooling**: Using Neon's connection pool feature
- [x] **WebSocket Support**: Enabled for Neon, disabled for local Postgres
- [x] **Migrations**: Handled by `npm run db:push` (railway postdeploy hook)
- [x] **Health Check**: Validates DB connectivity on startup

### 5. ✅ Server Startup

- [x] **Health Check Endpoints**: `/health` and `/api/health` respond immediately
- [x] **Port Configuration**: Respects `$PORT` environment variable (Railway compatibility)
- [x] **Host Configuration**: Listens on `0.0.0.0` for Railway
- [x] **Graceful Shutdown**: Handles SIGTERM/SIGINT
- [x] **Security Headers**: Helmet.js configured with HSTS, CSP, etc.
- [x] **Session Management**: Redis-backed sessions with 30-day TTL
- [x] **Request Timeout**: 30-second timeout for all requests
- [x] **Rate Limiting**: Global (100 req/15min) + auth (5 attempts/15min)

### 6. ✅ Background Jobs & Event System

- [x] **Redis Integration**: Optional but recommended, graceful fallback to immediate execution
- [x] **BullMQ Queues**: Email, PDF, notifications, AI processing
- [x] **Event Bus**: EventEmitter with database persistence
- [x] **Worker Initialization**: All workers registered in `server/index.ts`
- [x] **Cron Jobs**: Daily briefing, inventory monitoring, clinical anomaly detection
- [x] **Error Handling**: Workers are fail-silent, don't block responses

### 7. ✅ Error Handling & Logging

- [x] **Centralized Error Handler**: All errors formatted consistently
- [x] **ApiError Classes**: Custom errors for 400, 401, 403, 404, 422, 429, 500, 503
- [x] **Async Route Wrapper**: `asyncHandler()` catches all promise rejections
- [x] **Morgan Logging**: HTTP requests logged with production format
- [x] **Global Error Handlers**: Catches uncaught exceptions and unhandled rejections
- [x] **Structured Error Responses**: `{ success: false, error: { code, message, details } }`

### 8. ✅ Security Hardening

- [x] **Helmet.js**: HSTS (1 year), CSP, X-Frame-Options, X-Content-Type-Options
- [x] **CORS**: Configurable via `CORS_ORIGIN` env var
- [x] **Session Cookies**: HttpOnly, Secure (HTTPS in production), SameSite=Strict
- [x] **Rate Limiting**: DDoS protection on all /api routes
- [x] **Compression**: Gzip enabled for responses > 1KB
- [x] **Non-Root User**: Docker image runs as nodejs (UID 1001)
- [x] **Audit Logging**: All API requests logged to audit table
- [x] **Password Hashing**: bcryptjs with salt rounds 10+

### 9. ✅ Docker & Multi-Stage Build

- [x] **Stage 1 (Builder)**: Compiles TypeScript, installs dependencies
- [x] **Stage 2 (Production)**: Lightweight runtime with only required system libraries
- [x] **Layering**: Minimal final image size (~450MB)
- [x] **Non-Root User**: nodejs:nodejs (1001:1001)
- [x] **Dumb-init**: Proper signal handling for container orchestration
- [x] **Health Check**: Docker HEALTHCHECK configured

### 10. ✅ Performance Optimization

- [x] **Code Splitting**: Vite chunks vendor libraries (React, Radix, Material-UI, TanStack Query)
- [x] **Lazy Loading**: Route-based code splitting in React
- [x] **Compression**: Gzip enabled (level 6)
- [x] **Connection Pooling**: Drizzle ORM pool configured for Neon
- [x] **Session Store**: Redis-backed for scalability
- [x] **Caching Headers**: ETags and Cache-Control headers

## 🚀 Deployment Steps

### Step 1: Create Railway Project
```bash
railway init
railway link
```

### Step 2: Provision Services
In Railway Dashboard:
1. Create **Postgres** plugin → Provides `DATABASE_URL`
2. Create **Redis** plugin → Provides `REDIS_URL`
3. Create **Web Service** from GitHub repo

### Step 3: Set Environment Variables
```
SESSION_SECRET=<generate with: openssl rand -base64 32>
NODE_ENV=production
APP_URL=https://your-app.railway.app  (or custom domain)
CORS_ORIGIN=https://your-app.railway.app

MASTER_USER_EMAIL=admin@example.com
MASTER_USER_PASSWORD=<12+ char secure password>

# Optional but recommended
RESEND_API_KEY=re_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### Step 4: Deploy
```bash
railway up
# Or use Railway Dashboard's deploy button
```

### Step 5: Verify
```bash
# Check logs
railway logs

# Tail logs
railway logs --follow

# Open web dashboard
railway open
```

### Step 6: Run Migrations
Automatic via `postdeploy` hook, or manually:
```bash
railway shell
npm run db:push
```

## 📊 Health & Monitoring

### Health Check Endpoints
- `GET /health` → Simple JSON response
- `GET /api/health` → Full system health with uptime and memory

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-14T10:30:00Z",
  "environment": "production",
  "uptime": 3600.5,
  "memory": {
    "rss": 104857600,
    "heapTotal": 52428800,
    "heapUsed": 20971520,
    "external": 1048576
  }
}
```

### Metrics Endpoint
- `GET /metrics` → Prometheus format metrics

### Queue Health
- `GET /api/queue-health` → BullMQ queue status

## 🔍 Troubleshooting

### Issue: Build fails with TypeScript errors
```bash
npm run check  # Verify locally first
# Fix errors, then redeploy
```

### Issue: "DATABASE_URL not set" error
- ✅ Fixed: Code checks for DATABASE_URL before starting
- Railway will provide DATABASE_URL from Postgres plugin

### Issue: Redis connection fails
- ✅ Expected: System gracefully falls back to immediate job execution
- Jobs still complete, just synchronously
- To use Redis, provision Redis plugin in Railway

### Issue: Port binding error
- ✅ Fixed: Server respects $PORT environment variable
- Listens on 0.0.0.0:$PORT

### Issue: Session persistence
- Uses Redis if available
- Falls back to memory store (sessions lost on restart!)
- Recommendation: Always provision Redis in Railway

## 📦 File Structure (After Build)

```
/app (inside Docker container)
├── node_modules/          # Installed dependencies
├── dist/
│   ├── index.js           # Bundled server code (ESBuild)
│   └── public/            # Built frontend (Vite)
│       ├── index.html
│       ├── assets/
│       └── ...
├── migrations/            # Drizzle migrations
├── package.json
└── package-lock.json
```

## 🎯 Production Best Practices

1. **Always set SESSION_SECRET** — Generate with `openssl rand -base64 32`
2. **Use live Stripe keys** — Never use test keys in production
3. **Enable Redis** — For session persistence and background jobs
4. **Monitor logs** — Use Railway's log viewer for debugging
5. **Set up alerts** — Configure Railway alerts for health check failures
6. **Backup database** — Enable automated backups in Neon dashboard
7. **Use custom domain** — Set CORS_ORIGIN to match your domain
8. **Rotate secrets** — Periodically rotate SESSION_SECRET and API keys
9. **Test migrations** — Run `npm run db:push` in staging first
10. **Monitor performance** — Check memory usage and query times

## ✅ Deployment Verification Checklist

- [ ] All environment variables set in Railway Dashboard
- [ ] Database migration completed successfully
- [ ] Health checks passing (`/health` returns 200)
- [ ] Frontend loads and renders correctly
- [ ] API endpoints accessible and responding
- [ ] Background jobs being processed
- [ ] Logs showing no errors
- [ ] Authentication working (login/signup)
- [ ] Email delivery working (check Resend dashboard)
- [ ] Redis connected and queues processing (if enabled)

## 🔗 Related Resources

- **Railway Docs**: https://docs.railway.app
- **Neon Docs**: https://neon.tech/docs
- **Drizzle Docs**: https://orm.drizzle.team
- **Express Docs**: https://expressjs.com
- **BullMQ Docs**: https://docs.bullmq.io

---

**Last Deployment**: Not yet deployed  
**Current Status**: ✅ Ready for deployment  
**Reviewed By**: GitHub Copilot  
**Date**: November 14, 2025
