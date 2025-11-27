# ILS 2.0 - Railway Deployment Guide

Complete guide to deploying the ILS 2.0 Healthcare Operating System on Railway with all services, databases, and AI capabilities.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Service Configuration](#service-configuration)
6. [Environment Variables](#environment-variables)
7. [Database Setup](#database-setup)
8. [AI Services Configuration](#ai-services-configuration)
9. [Testing & Verification](#testing--verification)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

ILS 2.0 is a multi-service healthcare platform that requires the following Railway services:

### Required Services
1. **Main Application** (Node.js 22 + React 19)
2. **PostgreSQL Database** (15+ with pgvector)
3. **Redis** (7+) - Caching, sessions, job queues

### Optional but Recommended Services
4. **Python AI Service** (FastAPI - Port 8080)
5. **Python Analytics Service** (FastAPI - Port 8000)
6. **Python RAG Service** (FastAPI - Port 8001)

### External Services Required
- **Email**: Resend (recommended) or SMTP
- **Payments**: Stripe account
- **Storage**: AWS S3, Cloudflare R2, or Railway Volumes

---

## ✅ Prerequisites

### 1. Railway Account
- Sign up at [railway.app](https://railway.app)
- Install Railway CLI: `npm i -g @railway/cli`
- Login: `railway login`

### 2. External Service Accounts
- [ ] Resend API key (email)
- [ ] Stripe account (payments)
- [ ] OpenAI API key (optional - for AI features)
- [ ] Anthropic API key (optional - for Claude AI)
- [ ] AWS S3 or Cloudflare R2 (file storage)

### 3. Required Secrets
Generate the following secrets locally:

```bash
# Session secret (32 bytes)
openssl rand -hex 32

# CSRF secret (32 bytes)
openssl rand -hex 32

# JWT secret (32 bytes)
openssl rand -hex 32
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Railway Project                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Main App   │  │  PostgreSQL  │  │    Redis     │  │
│  │  (Node.js)   │──│   Database   │  │   (Cache)    │  │
│  │   Port 5000  │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                                                │
│         │  Internal Network                             │
│         │                                                │
│  ┌──────┴───────┬──────────────┬──────────────┐        │
│  │              │              │              │        │
│  │  AI Service  │  Analytics   │  RAG Service │        │
│  │  (Python)    │  (Python)    │  (Python)    │        │
│  │  Port 8080   │  Port 8000   │  Port 8001   │        │
│  └──────────────┴──────────────┴──────────────┘        │
│                                                          │
└─────────────────────────────────────────────────────────┘
         │
         │  External APIs
         │
    ┌────┴────┬─────────┬─────────┬─────────┐
    │ Resend  │ Stripe  │ OpenAI  │  AWS S3 │
    └─────────┴─────────┴─────────┴─────────┘
```

---

## 🚀 Step-by-Step Deployment

### Phase 1: Create Railway Project

```bash
# Create a new Railway project
railway init

# Or link to existing project
railway link
```

### Phase 2: Add Database Services

#### 1. Add PostgreSQL Database

```bash
# From Railway dashboard or CLI
railway add postgresql

# This creates a DATABASE_URL variable automatically
```

**Important PostgreSQL Setup:**
After adding PostgreSQL, enable the pgvector extension:

```bash
# Connect to your Railway PostgreSQL
railway run psql $DATABASE_URL

# In psql:
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

#### 2. Add Redis (Optional but Recommended)

```bash
# From Railway dashboard
railway add redis

# This creates REDIS_URL variable automatically
```

### Phase 3: Deploy Main Application

#### 1. Create Main Service

```bash
# From your project root
railway up
```

This will:
- Build using Dockerfile
- Run database migrations
- Start the Node.js server on port 5000

#### 2. Configure Domain (Optional)

```bash
# Generate a Railway domain
railway domain

# Or add custom domain in Railway dashboard
```

### Phase 4: Deploy Python Services

#### 1. Deploy AI Service

```bash
# Navigate to ai-service directory
cd ai-service

# Create a new service
railway up

# Set the PORT variable to 8080
railway variables set PORT=8080
```

#### 2. Deploy Analytics Service

```bash
# Navigate to python-service directory
cd ../python-service

# Create a new service
railway up

# Set the PORT variable to 8000
railway variables set PORT=8000
```

#### 3. Deploy RAG Service

```bash
# Navigate to python-rag-service directory
cd ../python-rag-service

# Create a new service
railway up

# Set the PORT variable to 8001
railway variables set PORT=8001
```

### Phase 5: Configure Service Networking

In Railway dashboard, note the internal URLs for each service:
- Main App: `${{RAILWAY_STATIC_URL}}`
- AI Service: Internal service name (e.g., `ai-service.railway.internal:8080`)
- Analytics: Internal service name (e.g., `python-service.railway.internal:8000`)
- RAG Service: Internal service name (e.g., `python-rag-service.railway.internal:8001`)

---

## ⚙️ Service Configuration

### Main Application (Node.js)

**Service Name:** `ils-main-app`

**Build Configuration:**
- Builder: Dockerfile
- Context: Root directory
- Dockerfile: `./Dockerfile`

**Deploy Configuration:**
- Start Command: `node dist/index.js`
- Health Check: `/api/health`
- Replicas: 1 (scale as needed)

**Recommended Resources:**
- Memory: 2GB minimum (4GB for production)
- CPU: 2 vCPU

**Environment Variables:** See [Environment Variables](#environment-variables) section

---

### AI Service (Python/FastAPI)

**Service Name:** `ils-ai-service`

**Build Configuration:**
- Builder: Nixpacks
- Context: `./ai-service`

**Deploy Configuration:**
- Start Command: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
- Health Check: `/health`
- Replicas: 1

**Recommended Resources:**
- Memory: 4GB (AI workloads)
- CPU: 2 vCPU

**Required Variables:**
```env
PORT=8080
DATABASE_URL=${{Postgres.DATABASE_URL}}
OPENAI_API_KEY=<your-key>
ANTHROPIC_API_KEY=<your-key>
```

---

### Analytics Service (Python/FastAPI)

**Service Name:** `ils-analytics-service`

**Build Configuration:**
- Builder: Nixpacks
- Context: `./python-service`

**Deploy Configuration:**
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Health Check: `/health`
- Replicas: 1

**Recommended Resources:**
- Memory: 2GB
- CPU: 2 vCPU

**Required Variables:**
```env
PORT=8000
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

---

### RAG Service (Python/FastAPI)

**Service Name:** `ils-rag-service`

**Build Configuration:**
- Builder: Nixpacks
- Context: `./python-rag-service`

**Deploy Configuration:**
- Start Command: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
- Health Check: `/health`
- Replicas: 1

**Recommended Resources:**
- Memory: 4GB (vector operations)
- CPU: 2 vCPU

**Required Variables:**
```env
PORT=8001
DATABASE_URL=${{Postgres.DATABASE_URL}}
QDRANT_URL=<optional>
```

---

## 🔐 Environment Variables

### Core Application Variables

Copy from `.env.example` and set in Railway dashboard:

#### Essential Variables (Required)

```env
# Database - Auto-populated by Railway PostgreSQL plugin
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
APP_URL=https://your-app.railway.app

# Security (Generate using: openssl rand -hex 32)
SESSION_SECRET=<generate-32-byte-hex>
CSRF_SECRET=<generate-32-byte-hex>
JWT_SECRET=<generate-32-byte-hex>

# CORS Configuration
CORS_ORIGIN=https://your-app.railway.app
```

#### Email Configuration (Required)

```env
# Resend (Recommended)
RESEND_API_KEY=<your-resend-api-key>
EMAIL_FROM=noreply@yourdomain.com

# Or SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email>
SMTP_PASS=<your-password>
```

#### Payment Configuration (Required)

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

#### Redis Configuration (Optional but Recommended)

```env
# Auto-populated if using Railway Redis plugin
REDIS_URL=${{Redis.REDIS_URL}}

# Or manual configuration
REDIS_HOST=containers-us-west-1.railway.app
REDIS_PORT=6379
REDIS_PASSWORD=<password>
REDIS_TLS=true
```

#### AI Services Configuration (Optional)

```env
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-opus-20240229

# Internal AI Service URLs
AI_SERVICE_URL=http://ils-ai-service.railway.internal:8080
ANALYTICS_SERVICE_URL=http://ils-analytics-service.railway.internal:8000
RAG_SERVICE_URL=http://ils-rag-service.railway.internal:8001
```

#### Storage Configuration (Choose One)

**Option 1: AWS S3**
```env
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_REGION=us-east-1
AWS_S3_BUCKET=ils-production
STORAGE_PROVIDER=s3
```

**Option 2: Cloudflare R2**
```env
R2_ACCOUNT_ID=<your-account-id>
R2_ACCESS_KEY_ID=<your-access-key>
R2_SECRET_ACCESS_KEY=<your-secret-key>
R2_BUCKET_NAME=ils-production
STORAGE_PROVIDER=r2
```

**Option 3: Railway Volumes**
```env
STORAGE_PROVIDER=local
UPLOAD_DIR=/app/uploads
```

#### Monitoring (Optional)

```env
# Sentry Error Tracking
SENTRY_DSN=https://...@sentry.io/...

# PostHog Analytics
POSTHOG_API_KEY=phc_...
POSTHOG_HOST=https://app.posthog.com

# Logging
LOG_LEVEL=info
```

#### OAuth (Optional)

```env
# Google OAuth
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_CALLBACK_URL=https://your-app.railway.app/api/auth/google/callback
```

#### Feature Flags

```env
# Feature toggles
JWT_AUTH_ENABLED=true
JWT_AUTH_REQUIRED=false
ENABLE_AI_FEATURES=true
ENABLE_ANALYTICS=true
ENABLE_SHOPIFY_INTEGRATION=false
ENABLE_NHS_INTEGRATION=false
```

---

## 🗄️ Database Setup

### 1. PostgreSQL Configuration

**Automatic via Railway Plugin:**
Railway PostgreSQL comes with optimal settings. The `DATABASE_URL` is automatically injected.

**Manual Configuration Checklist:**
- ✅ PostgreSQL version 15 or higher
- ✅ pgvector extension enabled
- ✅ SSL mode: require
- ✅ Max connections: 200+
- ✅ Shared buffers: 256MB+

### 2. Run Database Migrations

Migrations run automatically on deployment via:
- Dockerfile `CMD` includes migration
- Or nixpacks.toml start command

**Manual Migration:**
```bash
# From Railway CLI
railway run npm run db:migrate

# Or via Railway dashboard shell
npm run db:migrate
```

### 3. Database Studio (Development)

```bash
# Open Drizzle Studio locally
npm run db:studio

# Access at: http://localhost:4983
```

### 4. Seed Data (Optional)

```bash
# If you have a seed script
railway run npm run db:seed
```

### 5. Database Backups

Railway PostgreSQL includes automatic daily backups.

**Manual Backup:**
```bash
# Export database
railway run pg_dump $DATABASE_URL > backup.sql

# Restore database
railway run psql $DATABASE_URL < backup.sql
```

---

## 🤖 AI Services Configuration

### OpenAI Integration

1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Set environment variable:
   ```env
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4-turbo-preview
   ```

### Anthropic Claude Integration

1. Get API key from [console.anthropic.com](https://console.anthropic.com)
2. Set environment variable:
   ```env
   ANTHROPIC_API_KEY=sk-ant-...
   ANTHROPIC_MODEL=claude-3-opus-20240229
   ```

### Vector Database (Optional)

For advanced RAG capabilities, you can use Qdrant:

1. Create Qdrant Cloud account
2. Set environment variable:
   ```env
   QDRANT_URL=https://your-cluster.qdrant.io
   QDRANT_API_KEY=<your-key>
   ```

---

## ✅ Testing & Verification

### 1. Health Checks

After deployment, verify all services are healthy:

```bash
# Main application
curl https://your-app.railway.app/api/health

# AI Service (via internal network)
railway run curl http://ils-ai-service.railway.internal:8080/health

# Analytics Service
railway run curl http://ils-analytics-service.railway.internal:8000/health

# RAG Service
railway run curl http://ils-rag-service.railway.internal:8001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "uptime": 123.45
}
```

### 2. Database Connection

```bash
# Check database connection
railway run node -e "const { db } = require('./dist/db'); db.execute('SELECT 1').then(() => console.log('DB OK'))"
```

### 3. Redis Connection

```bash
# Check Redis connection
railway run node -e "const redis = require('./dist/lib/redis'); redis.ping().then(() => console.log('Redis OK'))"
```

### 4. Email Service

```bash
# Test email sending
railway run npm run test:email
```

### 5. AI Services

```bash
# Test AI service
railway run npm run test:ai
```

---

## 📊 Monitoring & Maintenance

### Railway Dashboard Monitoring

1. **Metrics Tab:**
   - CPU usage
   - Memory usage
   - Network traffic
   - Request rate

2. **Logs Tab:**
   - Real-time logs
   - Error tracking
   - Request logs

3. **Deployments Tab:**
   - Deployment history
   - Rollback capability
   - Build logs

### Log Aggregation

```bash
# View logs in real-time
railway logs

# Follow logs
railway logs --follow

# Filter by service
railway logs --service ils-main-app
```

### Alerting

Set up alerts in Railway dashboard for:
- High memory usage (>80%)
- High CPU usage (>80%)
- Service restarts
- Failed health checks
- Error rate spikes

### Performance Monitoring

If using Sentry:
1. View error trends
2. Performance insights
3. Release tracking

If using PostHog:
1. User analytics
2. Feature usage
3. Conversion funnels

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Build Failures

**Issue:** Dockerfile build fails

**Solutions:**
```bash
# Check build logs
railway logs --deployment <deployment-id>

# Try local build first
docker build -t ils-test .

# Check Node.js version
node --version  # Should be 22.x
```

#### 2. Database Connection Errors

**Issue:** Cannot connect to PostgreSQL

**Solutions:**
```bash
# Verify DATABASE_URL is set
railway variables

# Check PostgreSQL service is running
railway status

# Test connection
railway run psql $DATABASE_URL -c "SELECT 1"
```

#### 3. Migration Failures

**Issue:** Database migrations fail on deploy

**Solutions:**
```bash
# Run migrations manually
railway run npm run db:migrate

# Reset database (CAUTION: destroys data)
railway run npm run db:push

# Check migration status
railway run npm run db:studio
```

#### 4. Out of Memory Errors

**Issue:** Service crashes with OOM

**Solutions:**
1. Increase memory allocation in Railway dashboard
2. Enable Redis for session storage
3. Optimize database queries
4. Add caching layer

#### 5. Python Service Import Errors

**Issue:** FastAPI service fails to start

**Solutions:**
```bash
# Check Python version
railway run python --version  # Should be 3.11

# Verify requirements are installed
railway run pip list

# Check logs for specific error
railway logs --service ils-ai-service
```

#### 6. CORS Errors

**Issue:** Frontend cannot connect to backend

**Solutions:**
```env
# Set correct CORS_ORIGIN
CORS_ORIGIN=https://your-app.railway.app

# For development (NOT production)
CORS_ORIGIN=*
```

#### 7. Redis Connection Issues

**Issue:** Redis timeouts or connection errors

**Solutions:**
```bash
# Verify Redis URL
railway variables | grep REDIS

# Test Redis connection
railway run redis-cli -u $REDIS_URL ping

# Check TLS settings
REDIS_TLS=true  # Required for Railway Redis
```

---

## 🚦 Deployment Checklist

Before going to production:

### Security
- [ ] All secrets are set in Railway (not hardcoded)
- [ ] SESSION_SECRET is a strong random value
- [ ] CSRF_SECRET is set
- [ ] JWT_SECRET is set
- [ ] SSL/TLS is enabled for database
- [ ] CORS_ORIGIN is set to production domain
- [ ] Rate limiting is enabled
- [ ] Helmet security headers are enabled

### Database
- [ ] PostgreSQL 15+ is running
- [ ] pgvector extension is enabled
- [ ] Database migrations have run successfully
- [ ] Backups are configured
- [ ] Connection pooling is optimized

### Services
- [ ] Main app health check returns 200
- [ ] AI service is accessible
- [ ] Analytics service is accessible
- [ ] RAG service is accessible (if using)
- [ ] Redis is connected (if using)

### External Integrations
- [ ] Email service is configured and tested
- [ ] Stripe webhooks are configured
- [ ] Storage provider is configured
- [ ] AI API keys are set (if using)
- [ ] OAuth providers are configured (if using)

### Monitoring
- [ ] Error tracking is configured (Sentry)
- [ ] Analytics are configured (PostHog)
- [ ] Railway alerts are set up
- [ ] Log aggregation is working

### Performance
- [ ] Resources are appropriately sized
- [ ] Caching is enabled
- [ ] CDN is configured (if needed)
- [ ] Database queries are optimized
- [ ] Background jobs are processing

---

## 🔗 Useful Links

- [Railway Documentation](https://docs.railway.app)
- [Railway CLI Reference](https://docs.railway.app/develop/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

---

## 📝 Additional Notes

### Scaling Considerations

**Horizontal Scaling:**
- Increase replicas in Railway dashboard
- Ensure session affinity with Redis
- Use connection pooling for database

**Vertical Scaling:**
- Increase memory/CPU allocation
- Monitor resource usage patterns
- Optimize before scaling

### Cost Optimization

1. **Development Environment:**
   - Use smaller resources
   - Scale down replicas
   - Use development-tier databases

2. **Production Environment:**
   - Right-size resources based on metrics
   - Use caching to reduce database load
   - Implement CDN for static assets
   - Monitor and optimize slow queries

### Maintenance Windows

Plan for:
- Database maintenance (Railway handles this)
- Dependency updates
- Security patches
- Feature deployments

Use Railway's blue-green deployment for zero-downtime updates.

---

## 🆘 Support

For issues:
1. Check Railway status page
2. Review Railway community forums
3. Contact Railway support
4. Check ILS 2.0 repository issues

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0
**Maintained By:** ILS 2.0 Development Team
