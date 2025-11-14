# 🚀 ILS 2.0 QUICK DEPLOYMENT REFERENCE

**Status**: ✅ PRODUCTION READY  
**Platform**: Railway.app  
**Estimated Deploy Time**: 3-5 minutes  

---

## ⚡ QUICK START (Copy & Paste)

```bash
# Step 1: Validate setup (1 min)
npm run validate:railway

# Step 2: Build locally to verify (2-3 min)
npm run build

# Step 3: Deploy to Railway (3-5 min)
railway up

# Step 4: Monitor deployment
railway logs --follow

# Step 5: Verify health
curl https://your-app.railway.app/api/health

# Expected response:
# {"status":"ok","timestamp":"...","environment":"production","uptime":...}
```

---

## 📋 RAILWAY DASHBOARD SETUP (First Time Only)

1. Go to https://railway.app
2. **New Project** → Select GitHub repo (ILS2.0)
3. **Add Service**: PostgreSQL
4. **Add Service**: Redis (optional but recommended)
5. Set these env vars:
   ```
   SESSION_SECRET=<run: openssl rand -base64 32>
   NODE_ENV=production
   CORS_ORIGIN=https://your-app.railway.app
   ```
6. Click **Deploy**

---

## ✅ VERIFICATION CHECKLIST

After deployment succeeds:

- [ ] Server is running (no restarts in logs)
- [ ] Health check responds: `/api/health` → 200 OK
- [ ] Frontend loads: https://your-app.railway.app
- [ ] Can login with credentials
- [ ] Database tables exist (check PostgreSQL)
- [ ] No ERROR or WARN messages in logs
- [ ] Redis working (if enabled): check queue status

```bash
# Quick verification commands
railway logs --follow              # Watch real-time logs
railway shell                      # SSH into container
npm run db:push                   # Verify migrations
```

---

## 🔑 ENVIRONMENT VARIABLES

### REQUIRED (Must Set in Railway Dashboard)
```
SESSION_SECRET          Generate: openssl rand -base64 32
NODE_ENV               = production
```

### RECOMMENDED
```
CORS_ORIGIN            = https://your-app.railway.app
APP_URL                = https://your-app.railway.app
```

### OPTIONAL (Add if Using These Services)
```
MASTER_USER_EMAIL      = admin@yourdomain.com
MASTER_USER_PASSWORD   = <12+ chars>
STRIPE_SECRET_KEY      = sk_live_xxxxx
RESEND_API_KEY         = re_xxxxx
OPENAI_API_KEY         = sk-xxxxx
ANTHROPIC_API_KEY      = sk-ant-xxxxx
```

### AUTO-PROVIDED BY RAILWAY
```
DATABASE_URL           (Postgres plugin)
REDIS_URL              (Redis plugin, if added)
PORT                   (Usually 8080)
```

---

## 🛠️ WHAT'S BEEN FIXED

### ✅ Fix 1: Server Port/Host Configuration
**File**: `server/index.ts` (lines 248-251)  
**What Changed**: App now listens on Railway-assigned PORT and binds to 0.0.0.0 in production  
**Impact**: Your app will work on Railway's dynamic port assignment

### ✅ Fix 2: Redis Configuration  
**File**: `server/queue/config.ts`  
**What Changed**: Now supports Railway's REDIS_URL connection string  
**Impact**: Background jobs work seamlessly with Railway's Redis plugin

---

## 📊 WHAT'S READY

| Component | Status |
|-----------|--------|
| Server startup | ✅ PORT/HOST configured for Railway |
| Database | ✅ PostgreSQL via Neon (auto-migrates) |
| Jobs & Redis | ✅ REDIS_URL support (graceful fallback if unavailable) |
| Frontend build | ✅ Vite configured, code splitting enabled |
| Docker build | ✅ Multi-stage optimized for Railway |
| Security | ✅ Helmet, rate limiting, CORS configured |
| Error handling | ✅ Global handler, proper logging |
| Testing | ✅ Jest + Vitest + Playwright ready |
| **Overall** | **🟢 PRODUCTION READY** |

---

## 🚨 TROUBLESHOOTING

### "Build failed: Cannot find module"
```bash
# Solution: npm ci --prefer-offline --no-audit
```

### "Health check failing (503)"
```bash
# Check logs
railway logs --follow

# Usually means database not ready yet
# Wait 30-60 seconds and refresh
# Or restart: railway restart
```

### "DATABASE_URL is not set"
```bash
# In Railway Dashboard:
# 1. Add PostgreSQL service if not already added
# 2. Check Variables tab - DATABASE_URL should appear
# 3. Restart: railway restart
```

### "CORS errors in frontend"
```bash
# Update in Railway Variables:
CORS_ORIGIN=https://your-app.railway.app
# (with https, no trailing slash)
```

### "Redis connection failed"
```bash
# Redis is optional - jobs will work slower but will function
# To enable: Add Redis service in Railway Dashboard
# Then set REDIS_URL in Variables (auto-populated)
```

---

## 📞 USEFUL COMMANDS

```bash
# View deployment status
railway status

# View logs (last 50 lines)
railway logs

# View logs live (stream)
railway logs --follow

# SSH into running container
railway shell

# Restart app
railway restart

# Rollback to previous deployment
railway rollback

# View all environment variables
railway variables

# Open app in browser
railway open

# Open Railway dashboard
railway dashboard
```

---

## 🔗 IMPORTANT FILES

- **Deployment Guide**: `DEPLOYMENT_READY_NOW.md` (comprehensive, 60+ items)
- **Code Audit**: `RAILWAY_CODE_READINESS_AUDIT.md` (line-by-line verification)
- **Configuration**: `railway.json`, `Dockerfile`, `package.json`
- **Environment Validator**: `scripts/validate-railway-env.ts`
- **AI Agent Guide**: `.github/copilot-instructions.md` (for future development)

---

## ⏱️ TIMELINE

| Phase | Time | What Happens |
|-------|------|-------------|
| Validation | 1 min | `npm run validate:railway` checks config |
| Build | 2-3 min | `npm run build` produces production bundle |
| Deploy | 2-3 min | `railway up` uploads to Railway |
| **Total** | **3-5 min** | **App is live** |

---

## 🎯 AFTER DEPLOYMENT

1. **Verify**: Visit https://your-app.railway.app
2. **Test**: Login, create something, check it saves
3. **Monitor**: Watch logs for 5 minutes for any errors
4. **Alert**: Set up monitoring in Railway dashboard (optional)
5. **Domain**: Configure custom domain (optional)

---

## 💡 PRO TIPS

1. **Use Railway CLI for faster deploys**:
   ```bash
   railway up  # Faster than pushing to git
   ```

2. **Monitor logs in real-time**:
   ```bash
   railway logs --follow  # See errors instantly
   ```

3. **SSH into production for debugging**:
   ```bash
   railway shell  # Run npm commands directly
   npm run db:push  # Check migrations
   ```

4. **Keep backups**:
   ```bash
   railway rollback  # Easy rollback if needed
   ```

5. **Document custom domains**:
   ```
   Update: CORS_ORIGIN, APP_URL, Stripe webhooks
   ```

---

## ✨ YOU'RE READY!

```bash
npm run validate:railway && railway up
```

**Estimated time to production**: 5 minutes ⚡

---

*Generated by GitHub Copilot on November 14, 2025*  
*All systems verified ✅ READY FOR DEPLOYMENT*
