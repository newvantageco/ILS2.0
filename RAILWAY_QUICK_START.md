# Railway Quick Start Guide

Get ILS 2.0 deployed to Railway in under 10 minutes.

## Prerequisites

- Railway account (sign up at https://railway.app)
- GitHub account
- Node.js 20+ installed locally

## 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

## 2. Login to Railway

```bash
railway login
```

This opens your browser for authentication.

## 3. Create New Railway Project

```bash
# Navigate to your ILS 2.0 directory
cd /path/to/ILS2.0

# Initialize Railway project
railway init
```

Follow the prompts to:
- Create a new project
- Name your project (e.g., "ILS-Production")
- Select empty project

## 4. Add Services

### Add PostgreSQL Database

```bash
railway add --database postgres
```

Enable Production Mode:
1. Go to Railway dashboard
2. Select PostgreSQL service
3. Settings → Enable "Production Mode"

### Add Redis (Recommended)

```bash
railway add --database redis
```

## 5. Configure Environment Variables

Go to Railway dashboard → Your Project → Web Service → Variables

Add the following (minimum required):

```bash
NODE_ENV=production
APP_URL=https://your-app.up.railway.app  # Update after domain setup
SESSION_SECRET=<generate-with-openssl-rand-base64-32>
ADMIN_SETUP_KEY=<your-secure-admin-key>
```

Railway automatically provides:
- `DATABASE_URL` (from PostgreSQL service)
- `REDIS_URL` (from Redis service)
- `PORT` (Railway auto-assigns)

**Generate secure secrets:**

```bash
# Generate SESSION_SECRET
openssl rand -base64 32

# Generate ADMIN_SETUP_KEY
openssl rand -base64 24
```

### Optional but Recommended Variables

Add these for full functionality:

```bash
# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
MAIL_FROM=hello@yourdomain.com

# Payments (Stripe) - Use test keys initially
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

# AI Services (Optional)
OPENAI_API_KEY=sk-xxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx

# Master User (Auto-provisioned admin)
MASTER_USER_EMAIL=admin@example.com
MASTER_USER_PASSWORD=<secure-password-min-12-chars>
MASTER_USER_FIRST_NAME=Admin
MASTER_USER_LAST_NAME=User
MASTER_USER_ORGANIZATION=Platform Control
```

## 6. Connect GitHub Repository

1. Go to Railway dashboard
2. Select your project
3. Click "New" → "GitHub Repo"
4. Select `newvantageco/ILS2.0`
5. Choose branch (typically `main`)

Railway will automatically:
- Detect the Dockerfile
- Build your application
- Deploy to production

## 7. Wait for Deployment

Watch deployment progress:

```bash
railway logs
```

Or in the Railway dashboard: Deployments tab

Deployment typically takes 3-5 minutes.

## 8. Verify Deployment

Check health endpoint:

```bash
curl https://your-app.up.railway.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-11-13T...",
  "environment": "production"
}
```

## 9. Run Database Migrations

After first deployment:

```bash
railway run npm run db:push
```

This creates all database tables.

## 10. Access Your Application

Your app is now live at:
```
https://your-app-name.up.railway.app
```

## Next Steps

### Add Custom Domain

1. Railway dashboard → Service → Settings → Domains
2. Click "Add Domain"
3. Enter: `app.yourdomain.com`
4. Add CNAME record in your DNS:
   ```
   CNAME app your-app.up.railway.app
   ```
5. Wait for SSL (automatic, 1-5 minutes)
6. Update `APP_URL` environment variable

### Enable Auto-Deploy

Already enabled by default! Every push to `main` branch deploys automatically.

To deploy manually:
```bash
railway up
```

### Configure Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://app.yourdomain.com/api/stripe/webhooks`
3. Select events: `payment_intent.succeeded`, `customer.subscription.updated`, etc.
4. Copy webhook signing secret
5. Add to Railway variables: `STRIPE_WEBHOOK_SECRET`

### Set Up Monitoring

1. **Uptime Monitoring**: Add https://app.yourdomain.com/api/health to UptimeRobot
2. **Error Tracking**: Configure Sentry (add `SENTRY_DSN` to Railway variables)
3. **Analytics**: Configure PostHog (add `POSTHOG_API_KEY` to Railway variables)

## Useful Commands

```bash
# View logs (real-time)
railway logs

# Check deployment status
railway status

# Open Railway dashboard
railway open

# Deploy manually
railway up

# Rollback to previous deployment
railway rollback

# Restart service
railway restart

# Run command in Railway environment
railway run <command>

# SSH into running container
railway shell
```

## Troubleshooting

### Build Fails

1. Check logs: `railway logs`
2. Verify Dockerfile exists
3. Test build locally: `docker build -t ils-test .`

### Database Connection Error

1. Verify `DATABASE_URL` is set (Railway provides this automatically)
2. Check database service is running
3. Enable Production Mode on database

### Application Won't Start

1. Check logs: `railway logs`
2. Verify health check endpoint: `/api/health`
3. Check `PORT` environment variable (Railway sets this automatically)
4. Verify build completed successfully

### Out of Memory

1. Railway dashboard → Service → Settings → Resources
2. Increase memory allocation (512MB → 1GB → 2GB)

## Production Checklist

Before going live:

- [ ] Custom domain configured with SSL
- [ ] Production database backups enabled
- [ ] Environment variables validated (`npm run validate:env`)
- [ ] Master user can log in
- [ ] Stripe live keys configured
- [ ] Uptime monitoring set up
- [ ] Error tracking configured
- [ ] CORS origins configured correctly
- [ ] Rate limiting tested

## Quick Start Scripts

We've included helper scripts:

```bash
# Validate environment variables
npm run validate:env

# Deploy with validation
./scripts/railway-deploy.sh

# Check Railway status
npm run railway:status
```

## Support

- **Railway Docs**: https://docs.railway.app
- **ILS 2.0 Full Guide**: [docs/RAILWAY_DEPLOYMENT.md](docs/RAILWAY_DEPLOYMENT.md)
- **Deployment Checklist**: [RAILWAY_CHECKLIST.md](RAILWAY_CHECKLIST.md)
- **Railway Discord**: https://discord.gg/railway

---

**Estimated Time**: 10 minutes
**Difficulty**: Beginner
**Cost**: $5-20/month (Railway pricing)

You're all set! 🚀
