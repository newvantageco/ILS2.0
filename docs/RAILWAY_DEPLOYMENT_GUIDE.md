# Railway Deployment Guide - ILS 2.0

**Last Updated:** November 27, 2025
**Status:** Production-Ready
**Estimated Setup Time:** 15-20 minutes

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Environment Variables](#environment-variables)
5. [Post-Deployment](#post-deployment)
6. [Monitoring & Health Checks](#monitoring--health-checks)
7. [Troubleshooting](#troubleshooting)
8. [Security Checklist](#security-checklist)

---

## Prerequisites

- [ ] Railway account (sign up at https://railway.app)
- [ ] GitHub repository access
- [ ] Payment method added to Railway (for production services)
- [ ] Resend API key (for emails) - https://resend.com
- [ ] Stripe account (for payments) - https://stripe.com
- [ ] 15-20 minutes for setup

---

## Quick Start

### Option 1: Deploy Button (Fastest)

1. Click the Deploy button below:

   [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/newvantageco/ILS2.0)

2. Follow the Railway wizard to:
   - Connect your GitHub account
   - Set required environment variables
   - Deploy services

### Option 2: Manual Setup (Recommended for Production)

Follow the [Step-by-Step Deployment](#step-by-step-deployment) section below.

---

## Step-by-Step Deployment

### Step 1: Create New Railway Project

1. Log in to Railway: https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose **`newvantageco/ILS2.0`** repository
5. Select branch: `main` (or your branch)

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically:
   - Provision a PostgreSQL 16 instance
   - Set `DATABASE_URL` environment variable
   - Enable backups

**Recommended Settings:**
- **Plan:** Production Plan (for automatic backups)
- **Region:** Choose closest to your users
- **Version:** PostgreSQL 16

### Step 3: Add Redis (Recommended)

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add Redis"**
3. Railway will automatically:
   - Provision a Redis 7 instance
   - Set `REDIS_URL` environment variable

**Note:** Redis is optional but highly recommended for:
- Session storage (fallback to memory if unavailable)
- Background job processing (BullMQ)
- Caching layer

### Step 4: Configure Web Application Service

Railway should auto-detect your application. Verify these settings:

**Build Settings:**
- **Builder:** Dockerfile
- **Dockerfile Path:** `./Dockerfile`
- **Build Command:** (automatic from Dockerfile)

**Deploy Settings:**
- **Start Command:** `node dist/index.js`
- **Health Check Path:** `/api/health`
- **Health Check Timeout:** 300 seconds (5 minutes)
- **Restart Policy:** On Failure
- **Max Retries:** 10

**Resource Settings:**
- **Memory:** 2GB minimum (4GB recommended)
- **CPU:** Shared (or dedicated for better performance)

### Step 5: Set Environment Variables

In Railway project → Web service → **"Variables"** tab:

#### 🔴 Required Variables

```bash
# Auto-provided by Railway
DATABASE_URL=         # ✅ Auto-set by PostgreSQL service
REDIS_URL=           # ✅ Auto-set by Redis service (if added)
PORT=                # ✅ Auto-set by Railway
RAILWAY_PUBLIC_DOMAIN= # ✅ Auto-set by Railway

# You must set these
SESSION_SECRET=       # Generate: openssl rand -hex 32
RESEND_API_KEY=      # Get from https://resend.com
MAIL_FROM=           # Your verified email (e.g., noreply@yourdomain.com)

# Payment Processing (if using Stripe)
STRIPE_SECRET_KEY=        # Use LIVE keys: sk_live_xxx
STRIPE_PUBLISHABLE_KEY=   # Use LIVE keys: pk_live_xxx
STRIPE_WEBHOOK_SECRET=    # From Stripe webhook setup
```

#### 🟡 Recommended Variables

```bash
# CORS Configuration
APP_URL=https://your-app.railway.app  # Your Railway domain
CORS_ORIGIN=https://your-app.railway.app

# Email Configuration
SMTP_HOST=           # Backup email provider
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# AI Services (optional)
OPENAI_API_KEY=      # For GPT-4 features
ANTHROPIC_API_KEY=   # For Claude AI features

# Monitoring (optional)
SENTRY_DSN=          # Error tracking
POSTHOG_API_KEY=     # Product analytics
```

#### ⚪ First-Time Setup Only

```bash
# Bootstrap admin account (REMOVE after first deploy!)
MASTER_USER_EMAIL=admin@yourdomain.com
MASTER_USER_PASSWORD=YourSecurePassword123!
MASTER_USER_FIRST_NAME=Admin
MASTER_USER_LAST_NAME=User
MASTER_USER_ORGANIZATION=Your Company

# ⚠️ SECURITY: Remove these immediately after first successful deploy!
```

**How to Generate Secrets:**

```bash
# Session Secret (copy output)
openssl rand -hex 32

# CSRF Secret (copy output)
openssl rand -hex 32
```

### Step 6: Deploy

1. Click **"Deploy"** in Railway
2. Watch build logs for any errors
3. Wait for health check to pass (may take 3-5 minutes on first deploy due to migrations)
4. Look for success message:
   ```
   ✅ Server running on port XXXX
   ✅ CSRF protection enabled
   ✅ Database connected
   ✅ Redis connected
   ```

### Step 7: Verify Deployment

1. Visit your Railway URL: `https://your-app.railway.app`
2. You should see the ILS 2.0 landing page
3. Click "Login" and use your master user credentials
4. Verify you can access the dashboard

---

## Environment Variables Reference

### Critical Variables

| Variable | Required | Description | Default | Example |
|----------|----------|-------------|---------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection | Railway auto-sets | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | ✅ | Session encryption | None | `abc123...` (32+ chars) |
| `RESEND_API_KEY` | ✅ | Email service | None | `re_xxx` |
| `MAIL_FROM` | ✅ | Sender email | None | `noreply@yourdomain.com` |
| `APP_URL` | ✅ | Application URL | Railway domain | `https://ils.railway.app` |
| `CORS_ORIGIN` | ✅ | CORS origin | Railway domain | `https://ils.railway.app` |

### Payment Processing

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | If using Stripe | Live secret key (sk_live_xxx) |
| `STRIPE_PUBLISHABLE_KEY` | If using Stripe | Live publishable key (pk_live_xxx) |
| `STRIPE_WEBHOOK_SECRET` | If using webhooks | Webhook signing secret |
| `STRIPE_PRICE_STARTER_MONTHLY` | Optional | Price ID for starter plan |
| `STRIPE_PRICE_PRO_MONTHLY` | Optional | Price ID for pro plan |
| `STRIPE_PRICE_ENTERPRISE_MONTHLY` | Optional | Price ID for enterprise plan |

### Redis Configuration

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `REDIS_URL` | Optional | Redis connection | Railway auto-sets |
| `REDIS_HOST` | Optional | Alternative | `localhost` |
| `REDIS_PORT` | Optional | Alternative | `6379` |
| `REDIS_PASSWORD` | Optional | Alternative | None |

**Note:** If Redis is unavailable, the application will:
- Fall back to memory-based sessions
- Disable BullMQ job queue
- Process background tasks synchronously

### AI Services

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Optional | GPT-4 API access |
| `ANTHROPIC_API_KEY` | Optional | Claude API access |
| `PYTHON_SERVICE_URL` | Optional | Python ML service URL |
| `AI_SERVICE_URL` | Optional | AI RAG service URL |

### Security & Monitoring

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `CSRF_ENABLED` | Optional | Enable CSRF protection | `true` |
| `CSRF_SECRET` | Optional | CSRF token secret | Auto-generated |
| `SENTRY_DSN` | Optional | Error tracking | None |
| `POSTHOG_API_KEY` | Optional | Product analytics | None |
| `LOG_LEVEL` | Optional | Logging level | `info` |

### Feature Flags

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `ENABLE_JWT_AUTH` | Optional | Enable JWT tokens | `false` |
| `ENABLE_2FA` | Optional | Enable 2FA | `true` |
| `ENABLE_AI_FEATURES` | Optional | Enable AI features | `true` |
| `ENABLE_SHOPIFY_INTEGRATION` | Optional | Enable Shopify | `true` |

---

## Post-Deployment

### 1. Remove Master User Credentials

⚠️ **CRITICAL SECURITY STEP**

After successful first deployment:

1. Go to Railway project → Web service → **"Variables"**
2. Delete these variables:
   - `MASTER_USER_EMAIL`
   - `MASTER_USER_PASSWORD`
   - `MASTER_USER_FIRST_NAME`
   - `MASTER_USER_LAST_NAME`
   - `MASTER_USER_ORGANIZATION`
3. Railway will auto-redeploy
4. Check logs - security warnings should stop

**Why?** Leaving these set is a security risk if credentials leak.

### 2. Set Up Custom Domain (Optional)

1. In Railway → Your project → **"Settings"**
2. Click **"Generate Domain"** (free Railway subdomain)
3. Or add custom domain:
   - Click **"Add Domain"**
   - Enter your domain (e.g., `app.yourdomain.com`)
   - Update DNS with Railway's CNAME
4. Update `APP_URL` and `CORS_ORIGIN` environment variables

### 3. Configure Stripe Webhooks

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Set URL: `https://your-app.railway.app/api/webhooks/stripe`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy **Signing Secret** to `STRIPE_WEBHOOK_SECRET` env var

### 4. Configure Email DNS (Resend)

1. Go to Resend Dashboard → **Domains**
2. Add your domain
3. Add DNS records to your domain provider:
   - SPF record
   - DKIM record
   - DMARC record (optional)
4. Wait for verification (can take 24-48 hours)

### 5. Set Up Monitoring

**Railway Metrics:**
- Railway Dashboard → Your project → **"Metrics"**
- Monitor: CPU, Memory, Network, Response Times

**Application Metrics:**
- Visit: `https://your-app.railway.app/metrics`
- Prometheus-compatible metrics endpoint

**Health Check:**
- Visit: `https://your-app.railway.app/api/health`
- Should return: `{"status":"ok","database":"connected"}`

**Error Tracking (Optional):**
1. Sign up for Sentry: https://sentry.io
2. Create new project
3. Copy DSN to `SENTRY_DSN` env var
4. Errors will auto-report to Sentry

---

## Monitoring & Health Checks

### Health Check Endpoint

Railway automatically monitors: `GET /api/health`

**Healthy Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2025-11-27T10:30:00.000Z",
  "environment": "production",
  "uptime": 123456
}
```

**Unhealthy Response:**
```json
{
  "status": "error",
  "database": "disconnected",
  "error": "Connection timeout"
}
```

### Metrics Endpoint

Access Prometheus metrics: `GET /metrics`

**Available Metrics:**
- HTTP request duration histogram
- HTTP request count by status code
- Database query duration
- Active connections
- Memory usage
- CPU usage

### Log Monitoring

**View Logs:**
1. Railway Dashboard → Your project → **"Deployments"**
2. Click latest deployment
3. View real-time logs

**Important Log Messages:**

✅ **Success:**
```
✅ Server running on port 5000
✅ Database connected
✅ CSRF protection enabled
```

⚠️ **Warnings:**
```
⚠️ Redis unavailable, using memory store
⚠️ MASTER_USER_* variables still set (security risk!)
```

❌ **Errors:**
```
❌ Database connection failed
❌ CORS_ORIGIN not set in production
```

---

## Troubleshooting

### Build Failures

**Error:** `npm install` fails

**Solutions:**
1. Check Node.js version: Should be 22.x
2. Clear build cache: Railway Settings → "Clear Build Cache"
3. Check package.json for dependency conflicts

---

**Error:** Native module build fails

**Solution:**
- Native builds are optional
- Application will work without them
- Look for: `Native build skipped` in logs (this is OK)

### Deployment Failures

**Error:** Health check timeout

**Possible Causes:**
1. Database migrations taking too long
2. DATABASE_URL not set correctly
3. Port binding issue

**Solutions:**
1. Increase health check timeout to 300 seconds
2. Check DATABASE_URL in Railway variables
3. Ensure `PORT` env var is set (Railway auto-sets this)
4. Check logs for migration errors

---

**Error:** CORS errors in browser

**Solution:**
1. Set `CORS_ORIGIN` to your Railway domain
2. Or remove it to auto-detect from `RAILWAY_PUBLIC_DOMAIN`
3. Redeploy after changing

### Runtime Errors

**Error:** "Session secret not set"

**Solution:**
```bash
# Generate and set SESSION_SECRET
openssl rand -hex 32
# Copy to Railway variables
```

---

**Error:** "CSRF token validation failed"

**Possible Causes:**
1. Frontend not fetching CSRF token
2. Browser blocking cookies
3. CORS misconfiguration

**Solutions:**
1. Check browser console for errors
2. Ensure cookies are enabled
3. Verify CORS_ORIGIN matches your domain

---

**Error:** Email sending fails

**Solutions:**
1. Verify RESEND_API_KEY is correct
2. Check MAIL_FROM is verified in Resend
3. Check Resend logs for delivery issues

### Database Issues

**Error:** Connection pool exhausted

**Solution:**
- Railway PostgreSQL has connection limits
- Upgrade to larger plan if needed
- Check for connection leaks in logs

---

**Error:** Disk space full

**Solution:**
- Upgrade Railway plan for more storage
- Enable automatic backups
- Consider archiving old data

### Performance Issues

**Symptom:** Slow response times

**Solutions:**
1. Check Railway metrics for CPU/memory usage
2. Upgrade to dedicated CPU plan
3. Enable Redis for caching
4. Monitor `/metrics` endpoint for bottlenecks

---

**Symptom:** Out of memory

**Solutions:**
1. Increase memory limit in Railway
2. Check for memory leaks in logs
3. Restart application: Railway → Deployments → "Restart"

---

## Security Checklist

Use this checklist before going live:

### Pre-Launch Security

- [ ] `SESSION_SECRET` is set (32+ characters)
- [ ] `CSRF_ENABLED=true` (default)
- [ ] `CORS_ORIGIN` is set to your domain
- [ ] Using HTTPS (Railway provides automatically)
- [ ] `NODE_ENV=production` (Railway sets automatically)
- [ ] Master user credentials removed from env vars
- [ ] Stripe live keys (not test keys)
- [ ] Webhook secrets configured
- [ ] Resend domain verified

### Post-Launch Security

- [ ] Force HTTPS redirect enabled
- [ ] Security headers enabled (Helmet.js)
- [ ] Rate limiting active
- [ ] Audit logging enabled
- [ ] Regular database backups
- [ ] Error tracking configured (Sentry)
- [ ] Log monitoring set up
- [ ] 2FA enabled for admin accounts

### Compliance

- [ ] GDPR compliance reviewed
- [ ] HIPAA considerations (if applicable)
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie consent banner (if in EU)

---

## Additional Resources

### Railway Documentation
- Main Docs: https://docs.railway.app
- PostgreSQL: https://docs.railway.app/databases/postgresql
- Redis: https://docs.railway.app/databases/redis
- Environment Variables: https://docs.railway.app/develop/variables

### ILS 2.0 Documentation
- Main README: `/README.md`
- API Documentation: `/docs/API_QUICK_REFERENCE.md`
- Known Issues: `/docs/KNOWN_ISSUES.md`
- Architecture: `/docs/LEAD_ARCHITECT_OVERVIEW.md`

### External Services
- Resend (Email): https://resend.com/docs
- Stripe (Payments): https://stripe.com/docs
- Sentry (Errors): https://docs.sentry.io

---

## Support

**Issues or Questions?**

1. Check [Known Issues](/docs/KNOWN_ISSUES.md)
2. Review [Troubleshooting](#troubleshooting) section
3. Check Railway logs for errors
4. Open GitHub issue with:
   - Railway deployment logs
   - Environment variables (redact secrets!)
   - Error messages
   - Steps to reproduce

---

## Next Steps

After successful deployment:

1. ✅ **Test all core workflows:**
   - User registration & login
   - Order creation
   - Patient management
   - Billing/invoicing

2. ✅ **Set up monitoring:**
   - Configure alerts for downtime
   - Set up error tracking
   - Monitor resource usage

3. ✅ **Configure integrations:**
   - Shopify (if using)
   - NHS systems (if UK)
   - AI services

4. ✅ **Train your team:**
   - Admin panel walkthrough
   - User management
   - Reporting & analytics

---

**🎉 Congratulations! ILS 2.0 is now live on Railway!**

For ongoing updates, see the [main README](/README.md) and [production readiness report](/docs/PRODUCTION_READINESS_REPORT.md).
