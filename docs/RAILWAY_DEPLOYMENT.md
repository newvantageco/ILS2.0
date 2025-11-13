# Railway SaaS Deployment Guide

Complete guide for deploying ILS 2.0 as a production SaaS application on Railway.

## Table of Contents

1. [Overview](#overview)
2. [Choose Your Host Model](#1-choose-your-host-model-in-railway)
3. [Environment Variables](#2-use-environment-variables-railway-variables-panel)
4. [Databases on Railway](#3-databases-on-railway)
5. [Domain + SSL](#4-domain--ssl)
6. [Multi-Tenant SaaS Structure](#5-multi-tenant-saas-structure)
7. [Deployment Workflow](#6-deployment-workflow)
8. [Scaling](#7-scaling)
9. [Logs & Monitoring](#8-logs--monitoring)
10. [Example Full Setup](#9-example-full-setup-recommended)
11. [Troubleshooting](#troubleshooting)

---

## Overview

Railway is an excellent platform for deploying container-based and buildpack-based applications. This guide walks you through deploying ILS 2.0 as a production-ready SaaS application on Railway.

### Why Railway for ILS 2.0?

- **Automatic deployments** from GitHub
- **Built-in PostgreSQL** with production mode
- **Redis support** for sessions and job queues
- **Automatic SSL** certificates
- **Simple scaling** configuration
- **Cost-effective** for SaaS applications

---

## 1. Choose Your Host Model in Railway

Railway is great for container-based or buildpack-based apps.

### ILS 2.0 Service Architecture

You will typically deploy one or more of the following:

| Service Type | Example | ILS 2.0 Component |
|--------------|---------|-------------------|
| **Web App (API + Frontend)** | Node.js, Next.js, Django, Laravel | Main ILS application (Express + React) |
| **Database** | PostgreSQL or MySQL | PostgreSQL 16 |
| **Cache/Session Store** | Redis | Redis 7 for sessions & BullMQ |
| **Worker / Queue Processor** | BullMQ / Sidekiq / Celery | BullMQ workers (email, PDF, AI tasks) |
| **Background Cron Jobs** | Automated cleanups, email sends | Daily briefings, inventory monitoring, anomaly detection |

### Minimum Recommended Setup

Most SaaS apps at minimum have:
- ✅ **Web Service** (ILS 2.0 main application)
- ✅ **Database** (Postgres recommended)
- ✅ **Optional: Redis** for caching or job queues

---

## 2. Use Environment Variables (Railway Variables Panel)

Railway provides a clean **Variables** section per service.

### Required Environment Variables for ILS 2.0

Configure these in Railway's Variables panel for your web service:

#### Core Application

| Variable | Value Example | Description |
|----------|---------------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `5000` | Application port (Railway auto-assigns) |
| `HOST` | `0.0.0.0` | Bind to all interfaces |
| `APP_URL` | `https://myapp.up.railway.app` | Your Railway app URL or custom domain |

#### Database

| Variable | Value Example | Description |
|----------|---------------|-------------|
| `DATABASE_URL` | Provided by Railway Postgres | PostgreSQL connection string |

#### Security & Sessions

| Variable | Value Example | Description |
|----------|---------------|-------------|
| `SESSION_SECRET` | Generate with `openssl rand -base64 32` | Session encryption key (256-bit) |
| `ADMIN_SETUP_KEY` | Generate yourself | Admin account setup key |
| `JWT_SECRET` | Generate yourself | JWT token signing key (if using JWT) |

#### Redis (Optional but Recommended)

| Variable | Value Example | Description |
|----------|---------------|-------------|
| `REDIS_HOST` | Provided by Railway Redis | Redis hostname |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | Provided by Railway Redis | Redis password |
| `REDIS_URL` | `redis://:password@host:6379` | Full Redis connection URL |

#### Email (Resend)

| Variable | Value Example | Description |
|----------|---------------|-------------|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxx` | Resend API key |
| `MAIL_FROM` | `hello@yourdomain.com` | Default sender email |

#### Payments (Stripe)

| Variable | Value Example | Description |
|----------|---------------|-------------|
| `STRIPE_SECRET_KEY` | `sk_live_xxxxxxxxxxxx` | Stripe secret key (use live keys) |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_xxxxxxxxxxxx` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxxxxxxxxxxx` | Stripe webhook endpoint secret |

#### AI Services (Optional)

| Variable | Value Example | Description |
|----------|---------------|-------------|
| `OPENAI_API_KEY` | `sk-xxxxxxxxxxxx` | OpenAI API key |
| `ANTHROPIC_API_KEY` | `sk-ant-xxxxxxxxxxxx` | Anthropic Claude API key |

#### Storage (Optional - AWS S3)

| Variable | Value Example | Description |
|----------|---------------|-------------|
| `STORAGE_PROVIDER` | `local` or `s3` | Storage backend |
| `AWS_REGION` | `us-east-1` | AWS region |
| `AWS_ACCESS_KEY_ID` | Your AWS key | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret | AWS secret key |
| `AWS_S3_BUCKET` | `ils-files-production` | S3 bucket name |

#### Master User (Optional - Auto-provisioned Admin)

| Variable | Value Example | Description |
|----------|---------------|-------------|
| `MASTER_USER_EMAIL` | `admin@example.com` | Master admin email |
| `MASTER_USER_PASSWORD` | Secure password (12+ chars) | Master admin password |
| `MASTER_USER_FIRST_NAME` | `Admin` | First name |
| `MASTER_USER_LAST_NAME` | `User` | Last name |
| `MASTER_USER_ORGANIZATION` | `Platform Control` | Organization name |

### How Your App Reads These Values

Your application reads environment variables using `process.env`:

```typescript
const databaseUrl = process.env.DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET;
const stripeKey = process.env.STRIPE_SECRET_KEY;
```

---

## 3. Databases on Railway

### Recommended: Railway's PostgreSQL

Railway provides managed PostgreSQL databases with:
- Automatic backups
- Connection pooling
- High availability
- Easy scaling

#### Important Database Settings

1. **Production Mode**
   - Turn on "Production Mode" in Railway dashboard
   - Ensures DB persists and doesn't sleep
   - Prevents data loss

2. **Backups**
   - Enable weekly backups (available on paid plans)
   - Retention period: 7-30 days
   - Test restore procedures regularly

3. **Connection Pooling**
   - Railway provides connection pooling by default
   - ILS 2.0 uses Neon serverless driver with built-in pooling

### Multi-Tenant Database Strategy

ILS 2.0 uses a **single database with tenant isolation** strategy:

#### Database Schema

Every user and resource record has a `companyId` column for tenant isolation:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  patient_id INTEGER,
  status TEXT,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);
```

#### Query Pattern

Always filter by `companyId` in queries:

```typescript
// TypeScript example from ILS 2.0
const orders = await db
  .select()
  .from(ordersTable)
  .where(eq(ordersTable.companyId, currentTenantId));
```

#### Multi-Tenant Architecture Comparison

| Architecture | When to Use | Notes |
|--------------|-------------|-------|
| **Single DB, tenant_id separation** | Most SaaS (ILS 2.0 uses this) | Easiest + cost-effective |
| **One DB per customer** | Large enterprise clients | Harder to manage, higher cost |

### Database Connection String

Railway automatically provides `DATABASE_URL`:

```
postgresql://user:password@hostname:5432/database?sslmode=require
```

ILS 2.0 automatically uses this via `process.env.DATABASE_URL`.

---

## 4. Domain + SSL

Railway makes domain and SSL setup incredibly simple.

### Step 1: Add Custom Domain

1. Go to **Railway Dashboard** → Your Web Service → **Settings** → **Domains**
2. Click **Add Domain**
3. Enter your custom domain: `app.yourdomain.com`

### Step 2: Configure DNS

In your domain registrar (Cloudflare, GoDaddy, Namecheap, etc.):

1. Add a **CNAME record**:
   - **Name**: `app` (or your subdomain)
   - **Value**: `your-service.up.railway.app` (provided by Railway)
   - **TTL**: Automatic or 3600

Example:
```
CNAME app.ils.example.com → ils-production.up.railway.app
```

### Step 3: SSL Certificate (Automatic)

Railway **automatically** provisions SSL certificates using Let's Encrypt:
- ✅ No manual setup required
- ✅ Auto-renewal
- ✅ HTTP → HTTPS redirect
- ✅ HSTS headers

### Update Environment Variables

After adding your domain, update `APP_URL`:

```bash
APP_URL=https://app.yourdomain.com
```

This ensures:
- Correct CORS configuration
- Proper callback URLs for OAuth
- Accurate email links
- Correct Stripe webhook URLs

---

## 5. Multi-Tenant SaaS Structure

ILS 2.0 is architected as a **multi-tenant SaaS platform** from the ground up.

### Tenant Isolation Strategy

ILS 2.0 uses the **single database, row-level isolation** approach:

#### How It Works

1. **Every entity** has a `companyId` foreign key
2. **All queries** filter by `companyId`
3. **Storage layer** enforces tenant isolation
4. **Middleware** validates tenant access

#### Example: Order Management

```typescript
// server/storage.ts - Data access layer
async getOrdersByCompany(companyId: number) {
  return await this.db
    .select()
    .from(orders)
    .where(eq(orders.companyId, companyId));
}

// Middleware ensures user can only access their company's data
app.get('/api/orders', authenticateUser, async (req, res) => {
  const companyId = req.user.companyId; // From session
  const orders = await storage.getOrdersByCompany(companyId);
  res.json(orders);
});
```

### Multi-Tenant Architecture Benefits

✅ **Cost-Effective**: Single database for all tenants
✅ **Easy Scaling**: Add tenants without infrastructure changes
✅ **Simplified Backups**: One backup includes all tenant data
✅ **Centralized Updates**: Schema changes apply to all tenants
✅ **Cross-Tenant Analytics**: Easy to aggregate metrics

### Security Considerations

- 🔒 **Row-Level Security**: Enforced in application layer
- 🔒 **Tenant Validation**: Middleware checks on every request
- 🔒 **Data Isolation**: No cross-tenant data leakage
- 🔒 **Audit Logging**: Track tenant-specific actions

---

## 6. Deployment Workflow

Railway provides seamless GitHub integration for automatic deployments.

### Recommended Workflow: GitHub → Railway Auto Deploy

```
┌─────────────────┐
│  Push to main   │
│  (GitHub)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Railway        │
│  Auto-detects   │
│  changes        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Build Docker   │
│  Image          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Run Tests      │
│  (optional)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Deploy to      │
│  Production     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Health Check   │
│  Validation     │
└─────────────────┘
```

### Setup Steps

#### 1. Connect Railway to GitHub

1. Log in to Railway dashboard
2. Create new project
3. Select **"Deploy from GitHub repo"**
4. Choose your ILS 2.0 repository
5. Grant Railway access

#### 2. Enable Auto Deploy

Railway automatically enables this. Every push to `main` triggers a deployment.

To configure:
1. Go to **Settings** → **Deployment**
2. Enable **"Auto-deploy"**
3. Select branch: `main` (or your production branch)

#### 3. Deployment Triggers

| Trigger | Action |
|---------|--------|
| Push to `main` | Auto-deploy to production |
| Pull request | Create preview environment (optional) |
| Manual trigger | Deploy specific commit |

### Manual Deployment

```bash
# Using Railway CLI
railway up

# Deploy specific service
railway up --service web

# Rollback to previous deployment
railway rollback
```

### Deployment Strategy

**Recommended for ILS 2.0:**

- **Main branch** → Production environment
- **Develop branch** → Staging environment (separate Railway project)
- **Feature branches** → Preview deployments (optional)

---

## 7. Scaling

Railway allows scaling in two dimensions:

### 1. Vertical Scaling (Resource Size)

Increase CPU and memory per instance:

| Component | Minimum | Recommended | High Load |
|-----------|---------|-------------|-----------|
| **Web App** | 512MB RAM | 1GB RAM | 2GB RAM |
| **Database** | 512MB RAM | 1GB RAM | 2GB+ RAM |
| **Redis** | 256MB RAM | 512MB RAM | 1GB RAM |

#### How to Scale Resources

1. Go to **Service Settings** → **Resources**
2. Adjust **Memory** slider (512MB → 2GB)
3. Adjust **CPU** allocation
4. Save and redeploy

### 2. Horizontal Scaling (Multiple Instances)

Run multiple instances of your web service:

1. Go to **Service Settings** → **Scaling**
2. Set **Replicas**: `1` → `3` (or more)
3. Railway load-balances traffic automatically

#### When to Scale Horizontally

- High concurrent user traffic
- CPU-bound workloads
- Need high availability

### Auto-Scaling (Enterprise Plans)

Railway Enterprise supports auto-scaling based on:
- CPU usage
- Memory usage
- Request rate

### Performance Optimization

#### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| **Out of memory** | Increase service memory size |
| **Slow database queries** | Add indexes, enable query caching |
| **High response latency** | Enable Redis caching, optimize queries |
| **Job queue backlog** | Scale worker instances |

#### Monitoring Resource Usage

Railway provides built-in metrics:
- CPU usage over time
- Memory usage over time
- Network I/O
- Request rate

Access via: **Service Dashboard** → **Metrics** tab

---

## 8. Logs & Monitoring

Railway provides comprehensive logging and monitoring out of the box.

### Built-in Railway Features

#### 1. Logs Viewer

Access logs in Railway dashboard:
- **Real-time logs** (live tail)
- **Historical logs** (past 7 days)
- **Search and filter** by keyword
- **Download logs** for offline analysis

Navigate to: **Service** → **Deployments** → **Logs**

#### 2. Deploy History

Track all deployments:
- Deployment status (success/failed)
- Commit hash and message
- Deploy duration
- Rollback capability

Navigate to: **Service** → **Deployments**

#### 3. Performance Metrics

Monitor service health:
- CPU usage %
- Memory usage %
- Network ingress/egress
- Request rate

Navigate to: **Service** → **Metrics**

### Additional Monitoring Tools

For production SaaS, integrate these tools:

#### Error Tracking

**Sentry** (recommended for ILS 2.0)

```bash
# Install Sentry
npm install @sentry/node @sentry/tracing

# Add to server/index.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

Environment variable:
```
SENTRY_DSN=https://xxx@sentry.io/xxx
```

#### Product Analytics

**PostHog** (recommended for ILS 2.0)

```bash
npm install posthog-node
```

```typescript
import { PostHog } from 'posthog-node';

const posthog = new PostHog(process.env.POSTHOG_API_KEY);

// Track events
posthog.capture({
  distinctId: userId,
  event: 'order_created',
  properties: { orderId, companyId }
});
```

Environment variable:
```
POSTHOG_API_KEY=phc_xxx
```

#### Uptime Monitoring

**UptimeRobot** or **Better Uptime**

Monitor:
- ✅ `https://app.yourdomain.com/api/health`
- ✅ Alert on downtime (email, Slack, SMS)
- ✅ Response time tracking
- ✅ SSL certificate expiry

### ILS 2.0 Built-in Monitoring

ILS already includes Prometheus metrics endpoint:

```
GET /api/monitoring/metrics
GET /api/monitoring/health
GET /api/monitoring/recent
```

Access these endpoints for:
- Request duration histograms
- Error rates
- Database query performance
- Cache hit rates

---

## 9. Example Full Setup (Recommended)

Here's the complete Railway configuration for ILS 2.0 production deployment.

### Railway Services

Create these services in your Railway project:

```
Project: ILS Production
├── Web App (Node.js + Express + React)
├── PostgreSQL (Railway Database)
├── Redis (Railway Redis)
└── (Optional) Worker Service (BullMQ workers)
```

### Service: Web App

**Build Configuration:**
- **Builder**: Dockerfile
- **Dockerfile Path**: `./Dockerfile`
- **Root Directory**: `/`

**Environment Variables:**

```bash
# Core
NODE_ENV=production
PORT=${{PORT}}  # Railway auto-assigns
HOST=0.0.0.0
APP_URL=https://app.yourdomain.com

# Database (auto-provided by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (auto-provided by Railway)
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}

# Security
SESSION_SECRET=<generate-with-openssl-rand-base64-32>
ADMIN_SETUP_KEY=<your-secure-admin-key>
JWT_SECRET=<your-jwt-secret>

# Payments
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email
RESEND_API_KEY=re_xxx
MAIL_FROM=hello@yourdomain.com

# AI Services (Optional)
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# Storage (Optional)
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=ils-production

# Master User
MASTER_USER_EMAIL=admin@yourdomain.com
MASTER_USER_PASSWORD=<secure-password-12+chars>
MASTER_USER_FIRST_NAME=Admin
MASTER_USER_LAST_NAME=User
MASTER_USER_ORGANIZATION=Platform Control
```

**Health Check:**
- **Path**: `/api/health`
- **Interval**: 30s
- **Timeout**: 10s

**Resources:**
- **Memory**: 1GB
- **CPU**: Shared
- **Replicas**: 2 (for high availability)

### Service: PostgreSQL

Railway's managed Postgres service:

**Configuration:**
- **Version**: PostgreSQL 16
- **Storage**: 10GB (scale as needed)
- **Backups**: Enabled (daily)
- **Production Mode**: Enabled

**Connection:**
Railway auto-provides `DATABASE_URL` to linked services.

### Service: Redis

Railway's managed Redis service:

**Configuration:**
- **Version**: Redis 7
- **Memory**: 512MB
- **Eviction Policy**: `allkeys-lru`

**Connection:**
Railway auto-provides `REDIS_URL`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.

### Domains

**Primary Domain:**
```
app.yourdomain.com → Web App Service
```

**DNS Configuration (Cloudflare/GoDaddy/etc):**
```
CNAME app ils-production.up.railway.app
```

### Scaling Configuration

**Web App:**
- **Replicas**: 2-3 instances
- **Memory**: 1GB per instance
- **Auto-restart**: Enabled

**Database:**
- **Memory**: 1GB
- **Backups**: Daily
- **Connection Pooling**: Enabled

**Redis:**
- **Memory**: 512MB
- **Persistence**: Enabled

---

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Symptom**: Deployment fails during build phase

**Solutions**:
- Check build logs in Railway dashboard
- Verify `Dockerfile` is valid
- Ensure all dependencies are in `package.json`
- Check for syntax errors in source code

```bash
# Test build locally
docker build -t ils-test .
docker run -p 5000:5000 ils-test
```

#### 2. Database Connection Errors

**Symptom**: `Cannot connect to database` or `ECONNREFUSED`

**Solutions**:
- Verify `DATABASE_URL` is set correctly
- Check database service is running in Railway
- Ensure database is in "Production Mode"
- Check network connectivity

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"
```

#### 3. Redis Connection Issues

**Symptom**: Jobs not processing, session errors

**Solutions**:
- ILS 2.0 gracefully degrades without Redis
- Verify Redis service is running
- Check `REDIS_URL` format: `redis://:password@host:port`
- Review Redis connection code

**ILS 2.0 Fallback**: If Redis unavailable, jobs execute synchronously.

#### 4. Memory Errors (OOM)

**Symptom**: Service crashes with `JavaScript heap out of memory`

**Solutions**:
- Increase service memory (512MB → 1GB → 2GB)
- Check for memory leaks
- Optimize database queries
- Implement pagination for large datasets

```bash
# Increase Node.js heap size
NODE_OPTIONS="--max-old-space-size=1024"
```

#### 5. Domain Not Working

**Symptom**: Custom domain shows "Not Found" or doesn't load

**Solutions**:
- Verify DNS propagation (can take up to 48 hours)
- Check CNAME record points to correct Railway URL
- Ensure domain is added in Railway settings
- Clear browser cache

```bash
# Check DNS propagation
dig app.yourdomain.com
nslookup app.yourdomain.com
```

#### 6. Slow Performance

**Symptom**: High response times, timeouts

**Solutions**:
- Enable Redis caching
- Add database indexes
- Optimize slow queries
- Scale horizontally (add replicas)
- Use CDN for static assets

**Check ILS 2.0 metrics**:
```
GET https://app.yourdomain.com/api/monitoring/metrics
```

#### 7. SSL Certificate Issues

**Symptom**: Browser shows "Not Secure" warning

**Solutions**:
- Railway auto-provisions SSL (wait 1-5 minutes)
- Ensure domain DNS is correct
- Check Railway domain settings
- Force HTTPS redirect

Railway automatically handles:
- ✅ SSL provisioning (Let's Encrypt)
- ✅ Certificate renewal
- ✅ HTTP → HTTPS redirect

### Getting Help

**Railway Support:**
- Documentation: https://docs.railway.app
- Discord: https://discord.gg/railway
- Support email: team@railway.app

**ILS 2.0 Support:**
- GitHub Issues: https://github.com/newvantageco/ILS2.0/issues
- Email: support@newvantageco.com

---

## Additional Resources

- **Railway Documentation**: https://docs.railway.app
- **ILS 2.0 Documentation**: `/docs` folder
- **ILS 2.0 Infrastructure Guide**: `/docs/INFRASTRUCTURE.md`
- **ILS 2.0 Development Guide**: `/docs/DEVELOPMENT.md`
- **ILS 2.0 Testing Guide**: `/docs/TESTING.md`

---

## Deployment Checklist

Before going live, verify:

- [ ] Railway project created
- [ ] GitHub repository connected
- [ ] PostgreSQL database provisioned (Production Mode ON)
- [ ] Redis service provisioned
- [ ] All environment variables configured
- [ ] Custom domain added and DNS configured
- [ ] SSL certificate active
- [ ] Database migrations run (`npm run db:push`)
- [ ] Master user provisioned
- [ ] Health check endpoint working (`/api/health`)
- [ ] Monitoring configured (Sentry, PostHog, UptimeRobot)
- [ ] Stripe webhooks configured
- [ ] Email sending tested (Resend)
- [ ] Backup strategy in place
- [ ] Load testing completed
- [ ] Security review completed

---

**Last Updated**: November 2025
**ILS Version**: 2.0
**Railway Platform**: V2

For questions or issues, contact the ILS 2.0 team or open a GitHub issue.
