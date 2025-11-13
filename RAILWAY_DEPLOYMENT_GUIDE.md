# Railway Deployment Guide - ILS 2.0

Complete guide for deploying the ILS 2.0 Healthcare Operating System to Railway.

## Overview

This guide walks you through deploying ILS 2.0 to [Railway](https://railway.app), a modern platform-as-a-service that simplifies deployment with:

- **Automatic deployments** from GitHub
- **Built-in PostgreSQL** database
- **Redis** for caching and sessions
- **Environment variable** management
- **Zero-downtime deployments**
- **Automatic SSL/HTTPS**
- **Monitoring and logging**

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Railway CLI** (optional): `npm install -g @railway/cli`
3. **GitHub Repository**: Your code must be in a GitHub repo
4. **Domain** (optional): For custom domain setup

## Architecture on Railway

```
┌─────────────────────────────────────────────┐
│          Railway Project                     │
│                                              │
│  ┌──────────────┐      ┌──────────────┐    │
│  │   ILS App    │──────│  PostgreSQL   │    │
│  │  (Node.js)   │      │   Database    │    │
│  └──────┬───────┘      └───────────────┘    │
│         │                                     │
│         │              ┌──────────────┐      │
│         └──────────────│    Redis     │      │
│                        │    Cache     │      │
│                        └──────────────┘      │
└─────────────────────────────────────────────┘
```

---

## Part 1: Initial Setup

### Step 1: Create a New Project on Railway

1. Go to [railway.app/new](https://railway.app/new)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select your ILS2.0 repository

### Step 2: Add Database Services

Railway will automatically detect your app needs PostgreSQL. If not:

1. Click **"+ New"** in your project
2. Select **"Database"**
3. Choose **"Add PostgreSQL"**
4. Railway will automatically provision and connect the database

Repeat for Redis:
1. Click **"+ New"**
2. Select **"Database"**
3. Choose **"Add Redis"**

Railway automatically sets these environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

---

## Part 2: Environment Configuration

### Required Environment Variables

Set these in Railway's dashboard (Project → Variables):

#### Core Application
```env
NODE_ENV=production
PORT=5000
SESSION_SECRET=<generate-random-64-char-string>
ADMIN_SETUP_KEY=<generate-random-32-char-string>
```

#### Master User (Optional but Recommended)
```env
MASTER_USER_EMAIL=admin@yourdomain.com
MASTER_USER_PASSWORD=<strong-password-min-12-chars>
MASTER_USER_FIRST_NAME=Admin
MASTER_USER_LAST_NAME=User
MASTER_USER_ORGANIZATION=ILS Platform
```

#### Email Service (Resend)
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
```

#### Payment Processing (Stripe)
```env
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

#### AI Services (Optional)
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
```

#### Shopify Integration (Optional)
```env
SHOPIFY_SHOP_NAME=your-shop-name
SHOPIFY_API_KEY=xxxxxxxxxxxxxxxxxxxxx
SHOPIFY_API_SECRET=xxxxxxxxxxxxxxxxxxxxx
SHOPIFY_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxx
```

#### Storage (Optional - for S3 uploads)
```env
AWS_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=ils-production-uploads
```

### Auto-Configured by Railway

These are automatically set by Railway and don't need manual configuration:

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
RAILWAY_ENVIRONMENT=production
RAILWAY_PROJECT_ID=...
RAILWAY_SERVICE_ID=...
```

---

## Part 3: Build Configuration

### Verify Dockerfile

Your [Dockerfile](./Dockerfile) is already optimized for Railway. It uses:

1. **Multi-stage build**: Builder stage + production stage
2. **Debian base**: For TensorFlow.js compatibility
3. **Non-root user**: Security best practice
4. **Health checks**: For monitoring
5. **Proper static file serving**: From `dist/public/`

Key sections:

```dockerfile
# Stage 1: Builder
FROM node:20-slim AS builder
# ... builds the application

# Stage 2: Production
FROM node:20-slim AS production
# ... runs the application

# Exposes port 5000
EXPOSE 5000
```

### Build Commands

Railway uses these commands (configured in [package.json](./package.json)):

```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

Railway automatically:
1. Detects the Dockerfile
2. Builds the Docker image
3. Runs `npm start` in production

---

## Part 4: Database Setup

### Initialize Database Schema

Railway will automatically connect the database, but you need to push the schema:

**Option 1: Via Railway CLI**
```bash
railway login
railway link <your-project-id>
railway run npm run db:push
```

**Option 2: Via Web Terminal**
1. Go to your Railway project
2. Click on your app service
3. Go to **"Shell"** tab
4. Run: `npm run db:push`

This will create all 90+ tables using Drizzle ORM.

### Verify Database Connection

After deployment, check the health endpoint:
```bash
curl https://your-app.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2025-11-13T..."
}
```

---

## Part 5: Deployment

### Automatic Deployment

Railway automatically deploys when you push to your main branch:

```bash
git add .
git commit -m "feat: ready for Railway deployment"
git push origin main
```

Railway will:
1. ✅ Clone your repository
2. ✅ Build Docker image
3. ✅ Run health checks
4. ✅ Deploy with zero downtime
5. ✅ Provide a public URL

### Monitor Deployment

1. Go to Railway dashboard
2. Click on your app service
3. Watch the **"Deployments"** tab
4. View real-time logs in **"Logs"** tab

### Manual Deployment (Railway CLI)

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Deploy current directory
railway up

# Run commands in production
railway run npm run db:push

# View logs
railway logs
```

---

## Part 6: Domain Configuration

### Custom Domain Setup

1. Go to your Railway project
2. Click on your app service
3. Go to **"Settings"** → **"Domains"**
4. Click **"Generate Domain"** for a free `.railway.app` subdomain
   - OR -
5. Click **"Custom Domain"** and add your domain

#### DNS Configuration for Custom Domain

Add these DNS records to your domain provider:

**For root domain** (example.com):
```
A     @     <Railway-IP-Address>
AAAA  @     <Railway-IPv6-Address>
```

**For subdomain** (app.example.com):
```
CNAME app   <your-app>.railway.app
```

Railway automatically provisions SSL certificates via Let's Encrypt.

---

## Part 7: Production Verification

### Run Production Checklist

After deployment, verify everything works:

```bash
# 1. Health Check
curl https://your-app.railway.app/api/health

# 2. API Check
curl https://your-app.railway.app/api/companies

# 3. Frontend Check
curl -I https://your-app.railway.app

# 4. Database Check (via Railway shell)
railway run npm run db:push
```

### Smoke Tests

Run the comprehensive smoke test script:

```bash
./scripts/production-readiness/smoke-tests.sh https://your-app.railway.app
```

This checks:
- ✅ Health endpoints
- ✅ API responses
- ✅ Static assets
- ✅ Security headers
- ✅ CORS configuration
- ✅ Database connectivity
- ✅ Performance

---

## Part 8: Monitoring & Logging

### Built-in Railway Monitoring

Railway provides:
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Health Checks**: Automatic monitoring
- **Alerts**: Email notifications on failures

Access via:
1. Railway Dashboard → Your Service
2. Click **"Metrics"** tab
3. Click **"Logs"** tab

### Application Monitoring

Your app includes custom monitoring at:
- `/api/monitoring/health` - Health status
- `/api/monitoring/metrics` - Performance metrics
- `/api/monitoring/recent` - Recent requests

### External Monitoring (Optional)

Consider adding:
- **Sentry**: Error tracking
- **Datadog**: Comprehensive monitoring
- **Prometheus + Grafana**: Custom metrics

---

## Part 9: Scaling & Performance

### Horizontal Scaling

Railway supports scaling to multiple instances:

1. Go to **"Settings"** → **"Instances"**
2. Adjust **"Replicas"** count
3. Railway handles load balancing automatically

Recommended for production:
- **Development**: 1 instance
- **Production**: 2-3 instances (high availability)

### Vertical Scaling

Adjust resources:

1. Go to **"Settings"** → **"Resources"**
2. Adjust:
   - CPU allocation
   - Memory limit
   - Disk size

Recommended resources:
```
CPU: 2 vCPU
Memory: 4 GB
Disk: 10 GB
```

### Database Scaling

For high-traffic production:

1. Upgrade PostgreSQL plan in Railway
2. Enable **connection pooling**
3. Add **read replicas** if needed

---

## Part 10: Maintenance & Updates

### Rolling Updates

Railway performs zero-downtime deployments:

1. Push to GitHub
2. Railway builds new version
3. Health checks pass
4. Old instances drained
5. New instances take over

### Database Migrations

Run migrations safely:

```bash
# 1. Backup database first
railway run npm run backup

# 2. Run migration
railway run npm run db:push

# 3. Verify
railway run npm run db:verify
```

### Rollback

If deployment fails:

1. Go to **"Deployments"** tab
2. Find previous successful deployment
3. Click **"Redeploy"**
4. Railway rolls back instantly

---

## Part 11: Security Best Practices

### Environment Variables

✅ **DO**:
- Use Railway's encrypted variable storage
- Rotate secrets regularly
- Use strong, random passwords (64+ chars for secrets)
- Enable Railway's secret scanning

❌ **DON'T**:
- Commit secrets to Git
- Use weak passwords
- Share credentials in plaintext

### Network Security

Railway provides:
- ✅ Automatic HTTPS/TLS
- ✅ DDoS protection
- ✅ Rate limiting (app-level)
- ✅ Private networking between services

### Database Security

```bash
# Verify DATABASE_URL uses SSL
railway variables | grep DATABASE_URL
# Should include: ?sslmode=require
```

---

## Part 12: Troubleshooting

### Common Issues

#### 1. Build Fails

**Error**: `npm ERR! build failed`

**Solution**:
```bash
# Test build locally first
npm run build

# Check logs in Railway
railway logs --tail 100
```

#### 2. Database Connection Errors

**Error**: `ECONNREFUSED` or `Connection timeout`

**Solution**:
```bash
# Verify DATABASE_URL is set
railway variables

# Check database is running
railway ps

# Test connection
railway run npm run db:test
```

#### 3. Application Won't Start

**Error**: Port binding issues

**Solution**:
Ensure your app uses Railway's PORT:
```typescript
const PORT = process.env.PORT || 5000;
```

#### 4. Static Files Not Found

**Error**: `404 on /assets/*`

**Solution**:
Check build output includes `dist/public/`:
```bash
npm run build
ls -la dist/public/
```

### View Logs

```bash
# Real-time logs
railway logs

# Last 100 lines
railway logs --tail 100

# Filter by keyword
railway logs | grep ERROR
```

---

## Part 13: Cost Optimization

### Railway Pricing

Railway charges based on:
- **Usage**: CPU, Memory, Network (pay-as-you-go)
- **Starter Plan**: $5/month (includes $5 credit)
- **Pro Plan**: $20/month (includes $20 credit)

### Optimization Tips

1. **Right-size instances**: Don't over-provision
2. **Use Redis caching**: Reduce database queries
3. **Enable compression**: Reduce bandwidth
4. **Optimize images**: Use CDN for static assets
5. **Monitor usage**: Track in Railway dashboard

Estimated costs for ILS 2.0:
```
Small deployment (1 instance):   $15-25/month
Medium deployment (2 instances): $40-60/month
Large deployment (3+ instances): $100+/month
```

---

## Part 14: Backup & Disaster Recovery

### Automated Backups

Railway provides automatic database backups:
- **Frequency**: Daily
- **Retention**: 7 days (Starter), 30 days (Pro)
- **Location**: Railway-managed storage

### Manual Backup

Create a backup before major changes:

```bash
# Via Railway CLI
railway run npm run backup

# Or use pg_dump directly
railway run pg_dump $DATABASE_URL > backup.sql
```

### Restore from Backup

```bash
# List available backups
railway backups list

# Restore specific backup
railway backups restore <backup-id>

# Or manual restore
railway run psql $DATABASE_URL < backup.sql
```

---

## Part 15: Quick Reference

### Essential Commands

```bash
# Login and link project
railway login
railway link

# Deploy
git push origin main  # Automatic
railway up            # Manual

# Environment
railway variables              # List all
railway variables set KEY=val  # Set variable

# Database
railway run npm run db:push    # Initialize schema
railway run psql               # Connect to DB

# Logs and monitoring
railway logs                   # View logs
railway status                 # Service status
railway ps                     # Running services

# Shell access
railway shell                  # Open shell in production
```

### Important URLs

After deployment, your app will be available at:

```
Public URL:     https://your-app.railway.app
Health Check:   https://your-app.railway.app/api/health
API Docs:       https://your-app.railway.app/api
Admin Panel:    https://your-app.railway.app/admin
```

---

## Part 16: Pre-Deployment Checklist

### Before Deploying to Railway

- [ ] Repository pushed to GitHub
- [ ] Dockerfile tested locally
- [ ] Build completes successfully (`npm run build`)
- [ ] All environment variables prepared
- [ ] Database schema ready (`shared/schema.ts`)
- [ ] Master user credentials ready
- [ ] Email service API keys obtained
- [ ] Payment integration configured (if using Stripe)
- [ ] Domain DNS configured (if using custom domain)

### Initial Deployment

- [ ] Railway project created
- [ ] PostgreSQL database added
- [ ] Redis cache added
- [ ] Environment variables configured
- [ ] First deployment triggered
- [ ] Database schema initialized
- [ ] Health check passing
- [ ] Master user can log in
- [ ] API endpoints responding

### Post-Deployment

- [ ] Smoke tests passed
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Monitoring configured
- [ ] Backup strategy verified
- [ ] Team access configured
- [ ] Documentation updated

---

## Part 17: Support & Resources

### Railway Resources

- **Documentation**: [docs.railway.app](https://docs.railway.app)
- **Community**: [Discord](https://discord.gg/railway)
- **Status**: [status.railway.app](https://status.railway.app)
- **Support**: support@railway.app

### ILS 2.0 Resources

- **Platform Docs**: [./README.md](./README.md)
- **API Reference**: [./docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)
- **Deployment Guide**: [./docs/PRODUCTION_CUTOVER_PLAN.md](./docs/PRODUCTION_CUTOVER_PLAN.md)
- **Troubleshooting**: [./docs/RUNBOOKS.md](./docs/RUNBOOKS.md)

### Getting Help

1. Check Railway logs first
2. Review [./docs/INFRASTRUCTURE.md](./docs/INFRASTRUCTURE.md)
3. Run smoke tests to isolate issues
4. Contact Railway support for platform issues
5. Check GitHub issues for known problems

---

## Appendix: Railway CLI Reference

### Installation

```bash
npm install -g @railway/cli
```

### Authentication

```bash
railway login           # Login to Railway
railway logout          # Logout
railway whoami          # Current user
```

### Project Management

```bash
railway init            # Initialize new project
railway link            # Link to existing project
railway unlink          # Unlink from project
railway list            # List all projects
```

### Deployment

```bash
railway up              # Deploy current directory
railway up -d           # Deploy with detached logs
railway up --service=app # Deploy specific service
```

### Environment Variables

```bash
railway variables                    # List all variables
railway variables set KEY=VALUE      # Set variable
railway variables delete KEY         # Delete variable
railway variables --environment prod # Specify environment
```

### Database Operations

```bash
railway run psql                # Connect to PostgreSQL
railway run redis-cli           # Connect to Redis
railway run npm run db:push     # Run migrations
```

### Monitoring

```bash
railway logs                    # View logs
railway logs -f                 # Follow logs
railway logs --tail 100         # Last 100 lines
railway status                  # Service status
railway ps                      # Running services
```

### Shell Access

```bash
railway shell                   # Open shell
railway run <command>           # Run single command
railway run -- <command>        # Run complex command
```

---

## Success Checklist

After completing this guide, you should have:

✅ Railway project created and configured
✅ PostgreSQL and Redis services running
✅ All environment variables set
✅ Database schema initialized
✅ Application deployed and accessible
✅ Health checks passing
✅ Master user can log in
✅ Custom domain configured (optional)
✅ Monitoring and logging active
✅ Backup strategy in place

**Your ILS 2.0 Healthcare Operating System is now live on Railway!** 🚀

---

**Last Updated**: November 2025
**Version**: 1.0
**Author**: ILS Platform Team
**Status**: Production Ready
