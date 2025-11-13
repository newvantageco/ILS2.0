# Railway Deployment Checklist

Complete this checklist before deploying ILS 2.0 to Railway for production.

## Pre-Deployment Checklist

### 1. Code Quality ✅

- [ ] All TypeScript compilation errors resolved (`npm run check`)
- [ ] All tests passing (`npm run test:all`)
- [ ] No critical security vulnerabilities (`npm audit`)
- [ ] Code reviewed and approved
- [ ] Latest changes committed to repository

### 2. Environment Variables ⚙️

Run `npm run validate:env` to check, then verify these are set in Railway:

#### Core Application
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` (Railway auto-assigns)
- [ ] `HOST` = `0.0.0.0`
- [ ] `APP_URL` (your custom domain URL)

#### Database
- [ ] `DATABASE_URL` (Railway Postgres connection string)
- [ ] Database is in Production Mode
- [ ] Backups enabled

#### Security & Sessions
- [ ] `SESSION_SECRET` (generated with `openssl rand -base64 32`)
- [ ] `ADMIN_SETUP_KEY` (secure key for admin setup)
- [ ] `JWT_SECRET` (if using JWT auth)

#### Redis (Recommended)
- [ ] `REDIS_URL` or individual Redis variables
- [ ] Redis service provisioned in Railway

#### Email (Resend)
- [ ] `RESEND_API_KEY` (production API key)
- [ ] `MAIL_FROM` (verified domain email)
- [ ] Domain verified in Resend dashboard

#### Payments (Stripe)
- [ ] `STRIPE_SECRET_KEY` (live key: `sk_live_...`)
- [ ] `STRIPE_PUBLISHABLE_KEY` (live key: `pk_live_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` (production webhook secret)
- [ ] Webhook endpoint configured in Stripe dashboard

#### AI Services (Optional)
- [ ] `OPENAI_API_KEY` (if using OpenAI)
- [ ] `ANTHROPIC_API_KEY` (if using Claude)

#### Storage (Optional)
- [ ] `STORAGE_PROVIDER` (local, s3, cloudflare-r2, azure-blob)
- [ ] AWS credentials if using S3
- [ ] Bucket created and accessible

#### Master User (Optional)
- [ ] `MASTER_USER_EMAIL`
- [ ] `MASTER_USER_PASSWORD` (12+ characters)
- [ ] Other master user details

### 3. Railway Configuration 🚂

- [ ] Railway CLI installed (`npm install -g @railway/cli`)
- [ ] Logged in to Railway (`railway login`)
- [ ] Project created in Railway dashboard
- [ ] GitHub repository connected
- [ ] Auto-deploy enabled for main branch
- [ ] railway.json and railway.toml present
- [ ] Dockerfile optimized for production
- [ ] nixpacks.toml configured

### 4. Database Setup 🗄️

- [ ] PostgreSQL service provisioned
- [ ] Database in Production Mode (prevents sleep)
- [ ] Schema pushed (`npm run db:push`)
- [ ] Sample data loaded (if needed)
- [ ] Database backup schedule configured
- [ ] Connection pooling enabled

### 5. Domain & SSL 🌐

- [ ] Custom domain added in Railway
- [ ] DNS CNAME record configured
- [ ] SSL certificate active (automatic via Railway)
- [ ] Domain propagated (check with `dig` or `nslookup`)
- [ ] `APP_URL` environment variable updated

### 6. Health Checks & Monitoring 🏥

- [ ] Health check endpoint working (`/api/health`)
- [ ] Health check configured in Railway (`railway.json`)
- [ ] Uptime monitoring set up (UptimeRobot, Better Uptime)
- [ ] Error tracking configured (Sentry)
- [ ] Analytics configured (PostHog)
- [ ] Metrics endpoint accessible (`/api/monitoring/metrics`)

### 7. External Integrations 🔌

- [ ] Stripe webhook endpoint configured
- [ ] Shopify webhooks configured (if applicable)
- [ ] Email sending tested
- [ ] SMS notifications tested (if applicable)
- [ ] AI services tested

### 8. Security 🔒

- [ ] Rate limiting configured
- [ ] CORS origins set correctly
- [ ] Helmet security headers active
- [ ] CSRF protection enabled
- [ ] Session security configured
- [ ] All secrets using Railway environment variables (not hardcoded)
- [ ] No sensitive data in git repository
- [ ] API keys rotated if previously exposed

### 9. Performance 🚀

- [ ] Build size optimized
- [ ] Static assets compressed
- [ ] Database indexes created
- [ ] Redis caching enabled
- [ ] Image optimization configured
- [ ] CDN configured (if applicable)

### 10. Documentation 📚

- [ ] README updated with deployment instructions
- [ ] API documentation current
- [ ] Environment variables documented
- [ ] Deployment procedures documented
- [ ] Rollback procedures documented
- [ ] Team notified of deployment

### 11. Testing 🧪

- [ ] Health check responds correctly
- [ ] User registration works
- [ ] User login works
- [ ] Order creation works
- [ ] Payment processing works
- [ ] Email sending works
- [ ] WebSocket connections work
- [ ] Background jobs process correctly
- [ ] Mobile responsiveness verified
- [ ] Browser compatibility tested

### 12. Scaling & Reliability ⚖️

- [ ] Resource limits configured
- [ ] Auto-restart enabled
- [ ] Number of replicas set (minimum 2 for production)
- [ ] Health check timeout configured
- [ ] Graceful shutdown implemented
- [ ] Load balancing configured (automatic via Railway)

### 13. Compliance & Legal ⚖️

- [ ] GDPR compliance verified (if applicable)
- [ ] HIPAA compliance verified (for healthcare data)
- [ ] Terms of Service updated
- [ ] Privacy Policy updated
- [ ] Cookie consent implemented
- [ ] Data retention policies configured

### 14. Post-Deployment ✅

- [ ] Deployment successful
- [ ] Health check passing
- [ ] Logs reviewed for errors
- [ ] Database migrations completed
- [ ] Master user can log in
- [ ] Critical workflows tested
- [ ] Team notified of successful deployment
- [ ] Monitoring dashboards configured
- [ ] Incident response plan ready

## Quick Commands

```bash
# Validate environment variables
npm run validate:env

# Check TypeScript compilation
npm run check

# Run all tests
npm run test:all

# Deploy to Railway
npm run railway:deploy
# OR
./scripts/railway-deploy.sh

# View Railway logs
npm run railway:logs

# Check Railway status
npm run railway:status

# Open Railway dashboard
railway open

# Rollback deployment
railway rollback
```

## Emergency Rollback

If deployment fails or critical issues arise:

```bash
# Rollback to previous deployment
railway rollback

# Check logs for errors
railway logs

# Restart service
railway restart
```

## Support

- Railway Documentation: https://docs.railway.app
- ILS 2.0 Deployment Guide: `docs/RAILWAY_DEPLOYMENT.md`
- Railway Discord: https://discord.gg/railway
- Emergency Contact: [Your support email]

---

**Last Updated**: November 2025
**Version**: 2.0
**Status**: Production Ready
