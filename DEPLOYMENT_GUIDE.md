# ILS 2.0 Production Deployment Guide

**Project Created**: ✅ ILS-2.0-Production
**Railway URL**: https://railway.com/project/0038b820-2ece-411b-9118-7771b275dafa
**Status**: Ready for service provisioning and deployment

---

## Quick Start: Complete Your Deployment

### Step 1: Add Services via Railway Dashboard

Open your Railway project: https://railway.com/project/0038b820-2ece-411b-9118-7771b275dafa

#### Add PostgreSQL Database

1. Click **"+ New"** button
2. Select **"Database"** → **"PostgreSQL"**
3. Wait for provisioning (~30 seconds)
4. Click on the Postgres service → **Settings** → **Production Mode** → Enable
5. Note: Railway automatically provides `DATABASE_URL` variable

#### Add Redis

1. Click **"+ New"** button
2. Select **"Database"** → **"Redis"**
3. Wait for provisioning (~30 seconds)
4. Note: Railway automatically provides `REDIS_URL`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

#### Add Web Service (Main Application)

1. Click **"+ New"** button
2. Select **"GitHub Repo"**
3. Choose repository: **newvantageco/ILS2.0**
4. Select branch: **main**
5. Railway will auto-detect the Dockerfile

---

### Step 2: Configure Environment Variables

In your **Web Service** → **Variables** tab, add these variables:

#### Required Variables

```bash
# Core Application
NODE_ENV=production
HOST=0.0.0.0
APP_URL=https://ils-20-production-production.up.railway.app  # Update after deployment

# Security (GENERATE THESE!)
SESSION_SECRET=<GENERATE_WITH_COMMAND_BELOW>
ADMIN_SETUP_KEY=<GENERATE_WITH_COMMAND_BELOW>
```

**Generate secure secrets:**
```bash
# Run these locally to generate secrets:
openssl rand -base64 32  # For SESSION_SECRET
openssl rand -base64 24  # For ADMIN_SETUP_KEY
```

#### Auto-Provided by Railway (Reference these)

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
PORT=${{PORT}}  # Railway auto-assigns
```

#### Optional: Master Admin User (Recommended)

```bash
MASTER_USER_EMAIL=admin@newvantageco.com
MASTER_USER_PASSWORD=<SECURE_PASSWORD_12_CHARS_MIN>
MASTER_USER_FIRST_NAME=Admin
MASTER_USER_LAST_NAME=User
MASTER_USER_ORGANIZATION=New Vantage Co
```

#### Optional: Email Notifications (Resend)

```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
MAIL_FROM=hello@newvantageco.com
```

#### Optional: Payments (Stripe)

```bash
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
```

#### Optional: AI Features

```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
```

---

### Step 3: Deploy Application

Railway will automatically deploy when you:
1. Add the GitHub repository
2. Configure environment variables
3. Save changes

Or manually trigger deployment:
- Click **"Deploy"** button in Railway dashboard
- Watch build logs in real-time

---

### Step 4: Verify Deployment

Once deployment completes (2-5 minutes):

1. **Get your Railway URL**:
   - In Railway dashboard → Web Service → **Settings** → **Domains**
   - Copy the auto-generated URL: `https://ils-20-production-production.up.railway.app`

2. **Test health endpoint**:
   ```bash
   curl https://your-app.up.railway.app/api/health
   ```

   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-11-14T...",
     "environment": "production",
     "services": {
       "database": "connected",
       "redis": "connected"
     }
   }
   ```

3. **Access the application**:
   - Open browser: `https://your-app.up.railway.app`
   - You should see the ILS 2.0 landing page

4. **Login with master user** (if configured):
   - Email: admin@newvantageco.com
   - Password: (the one you set in MASTER_USER_PASSWORD)

---

### Step 5: Run Database Migrations

After first deployment, run migrations:

```bash
# Option 1: Using Railway CLI (from project directory)
railway run npm run db:push

# Option 2: Via Railway Shell (in dashboard)
# Click Web Service → Shell tab → Run:
npm run db:push
```

This creates all 90+ database tables in your production PostgreSQL.

---

### Step 6: Add Custom Domain (Optional)

1. **In Railway Dashboard**:
   - Web Service → **Settings** → **Domains**
   - Click **"Add Custom Domain"**
   - Enter: `app.newvantageco.com` (or your domain)

2. **In Your DNS Provider** (Cloudflare, GoDaddy, etc.):
   - Add CNAME record:
     - **Name**: `app`
     - **Value**: `ils-20-production-production.up.railway.app`
     - **TTL**: Auto or 3600

3. **Update APP_URL**:
   ```bash
   APP_URL=https://app.newvantageco.com
   ```

4. **Wait for SSL** (automatic, 1-5 minutes):
   - Railway auto-provisions Let's Encrypt SSL
   - Auto-renewal enabled

---

### Step 7: Configure Stripe Webhooks (If Using Payments)

1. **Get webhook URL**: `https://app.newvantageco.com/api/stripe/webhooks`

2. **In Stripe Dashboard**:
   - Developers → Webhooks → **Add endpoint**
   - URL: `https://app.newvantageco.com/api/stripe/webhooks`
   - Events to listen:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

3. **Copy webhook secret**:
   - Copy the `whsec_xxx` key
   - Add to Railway variables: `STRIPE_WEBHOOK_SECRET=whsec_xxx`

---

### Step 8: Set Up Monitoring (Recommended)

#### Enable Built-in Metrics

Your app already exposes Prometheus metrics:
- **Endpoint**: `https://app.newvantageco.com/api/monitoring/metrics`
- **Health**: `https://app.newvantageco.com/api/monitoring/health`

#### Add External Monitoring (Optional)

**Sentry (Error Tracking)**:
1. Create Sentry account: https://sentry.io
2. Get DSN key
3. Add to Railway: `SENTRY_DSN=https://xxx@sentry.io/xxx`
4. Install: Already included in dependencies

**UptimeRobot (Uptime Monitoring)**:
1. Create account: https://uptimerobot.com
2. Add HTTP(s) monitor: `https://app.newvantageco.com/api/health`
3. Set alert email/Slack

**PostHog (Product Analytics)**:
1. Create account: https://posthog.com
2. Get API key
3. Add to Railway: `POSTHOG_API_KEY=phc_xxx`

---

## Production Checklist

Before going live, verify:

### Infrastructure
- [x] Railway project created
- [ ] PostgreSQL database provisioned (Production Mode ON)
- [ ] Redis provisioned
- [ ] Web service connected to GitHub
- [ ] Auto-deploy enabled for `main` branch

### Configuration
- [ ] All required environment variables set
- [ ] SESSION_SECRET generated (32+ chars)
- [ ] ADMIN_SETUP_KEY generated
- [ ] DATABASE_URL connected
- [ ] REDIS_URL connected
- [ ] APP_URL configured

### Deployment
- [ ] Initial deployment successful
- [ ] Database migrations run (`npm run db:push`)
- [ ] Health endpoint responding (200 OK)
- [ ] Application accessible via Railway URL
- [ ] Master admin user can login

### Optional Features
- [ ] Custom domain configured
- [ ] SSL certificate active (automatic)
- [ ] Stripe webhooks configured
- [ ] Email sending tested (Resend)
- [ ] AI services configured (if needed)
- [ ] Monitoring tools added (Sentry, UptimeRobot)

### Security
- [ ] All secrets are strong and unique
- [ ] No secrets committed to Git
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] Session management tested

### Performance
- [ ] Service resources adequate (1GB RAM recommended)
- [ ] Database connection pooling enabled
- [ ] Redis caching working
- [ ] Response times acceptable (<500ms)

---

## Scaling Your Deployment

### Vertical Scaling (More Resources)

In Railway Dashboard → Web Service → **Settings** → **Resources**:
- **Memory**: Start with 1GB, scale to 2GB if needed
- **CPU**: Shared (default) → Dedicated if needed

### Horizontal Scaling (Multiple Instances)

In Railway Dashboard → Web Service → **Settings** → **Scaling**:
- **Replicas**: 1 → 2-3 for high availability
- Railway auto-balances traffic

### Database Scaling

In Railway Dashboard → Postgres → **Settings**:
- **Storage**: Auto-scales
- **Backups**: Enable daily backups (paid plans)
- **Connection Pooling**: Enabled by default

---

## Troubleshooting

### Build Failures

**Check build logs**:
- Railway Dashboard → Web Service → **Deployments** → Latest deploy → **Logs**

**Common issues**:
- Missing dependencies → Check `package.json`
- TypeScript errors → Run `npm run check` locally
- Dockerfile errors → Test locally: `docker build -t ils-test .`

### Database Connection Errors

**Verify**:
- DATABASE_URL is set and referenced correctly
- Postgres service is running
- Production Mode is enabled

**Test connection**:
```bash
railway run -- psql $DATABASE_URL -c "SELECT version();"
```

### Application Crashes

**Check logs**:
```bash
railway logs --follow
```

**Common issues**:
- Out of memory → Increase service memory
- Missing env vars → Check all required variables set
- Database migrations not run → Run `npm run db:push`

### Slow Performance

**Solutions**:
- Enable Redis (if not already)
- Add database indexes
- Scale resources (1GB → 2GB RAM)
- Add replicas (horizontal scaling)

---

## Deployment Commands

### Using Railway CLI

```bash
# Check status
railway status

# View logs
railway logs
railway logs --follow  # Live tail

# Run commands in production
railway run npm run db:push
railway run npm test

# Deploy manually
railway up

# Rollback deployment
railway rollback

# Open in browser
railway open

# Get environment variables
railway variables

# SSH into container
railway shell
```

### Update Environment Variables

```bash
# Set variable
railway variables set SESSION_SECRET=your_secret_here

# Delete variable
railway variables delete OLD_VAR

# List all variables
railway variables
```

---

## Next Steps After Deployment

1. **Test all features**:
   - User registration & login
   - Order creation
   - Production queue
   - Analytics dashboard
   - Payment processing (if enabled)

2. **Set up backups**:
   - Enable Railway database backups (Settings → Backups)
   - Test restore procedure
   - Document recovery process

3. **Configure monitoring alerts**:
   - UptimeRobot → Email/Slack on downtime
   - Sentry → Error notifications
   - Railway → Deploy notifications

4. **Load testing** (recommended):
   ```bash
   # Install k6
   brew install k6

   # Run load test
   k6 run scripts/load-test.js
   ```

5. **Security audit**:
   - Review all environment variables
   - Test RBAC permissions
   - Verify CORS settings
   - Check rate limiting

6. **Documentation**:
   - Update team on production URLs
   - Document deployment process
   - Create runbook for common issues

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **ILS 2.0 Docs**: `/docs` folder in repository
- **Railway Project**: https://railway.com/project/0038b820-2ece-411b-9118-7771b275dafa
- **GitHub Repo**: https://github.com/newvantageco/ILS2.0

---

## Costs & Billing

**Railway Pricing**:
- **Hobby Plan** ($5/month):
  - $5 credit
  - Good for development/staging

- **Pro Plan** ($20/month):
  - $20 credit
  - Production features
  - Daily backups
  - Better support

**Typical ILS 2.0 Usage** (Pro Plan recommended):
- Web Service (1GB RAM): ~$7-10/month
- PostgreSQL: ~$5-8/month
- Redis: ~$2-5/month
- **Total**: ~$15-25/month on Pro Plan

Monitor usage in Railway Dashboard → **Usage** tab

---

**Deployment Guide Generated**: November 14, 2025
**Railway CLI Version**: 4.11.0
**ILS Version**: 2.0
**Status**: ✅ Ready for production deployment

Good luck with your deployment! 🚀
