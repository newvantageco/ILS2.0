# Railway Deployment - Complete Setup Guide

## Current Status
- ✅ Dockerfile fixed and pushed to GitHub
- ✅ Railway project exists: **ILS-2.0-Healthcare-Platform**
- ✅ Railway CLI authenticated
- ✅ Secure secrets generated

## Step-by-Step Deployment

### 1. Open Railway Dashboard

Go to: https://railway.app/project/ILS-2.0-Healthcare-Platform

### 2. Add PostgreSQL Database

1. Click **"+ New"** button
2. Select **"Database"**
3. Choose **"Add PostgreSQL"**
4. Railway will automatically:
   - Create the database
   - Generate `DATABASE_URL` environment variable
   - Link it to your project

### 3. Add Redis Cache

1. Click **"+ New"** button again
2. Select **"Database"**
3. Choose **"Add Redis"**
4. Railway will automatically:
   - Create Redis instance
   - Generate `REDIS_URL` environment variable
   - Link it to your project

### 4. Add Web Service (Your App)

1. Click **"+ New"** button
2. Select **"GitHub Repo"**
3. Choose **"newvantageco/ILS2.0"**
4. Select branch: **main**
5. Railway will automatically:
   - Detect the Dockerfile
   - Start building your application

### 5. Configure Environment Variables

Click on your **web service** → **Variables** tab → Add these:

#### Required Variables:
```bash
NODE_ENV=production
SESSION_SECRET=Owo925AOHO+LA/PORsxu3iwFOiKLlkaBfKpsQAP5nptz+aPCmQ15VYhnHeNgfPoL
ADMIN_SETUP_KEY=/vgrTzFtKPBTXNdf6p3MkpAmSqDGTlHg
```

#### Master User (Recommended):
```bash
MASTER_USER_EMAIL=admin@newvantageco.com
MASTER_USER_PASSWORD=<YOUR-SECURE-PASSWORD-MIN-12-CHARS>
MASTER_USER_FIRST_NAME=Admin
MASTER_USER_LAST_NAME=User
MASTER_USER_ORGANIZATION=New Vantage Co
```

#### Optional but Recommended:
```bash
STORAGE_PROVIDER=local
```

**Note:** Railway automatically provides these (don't add them manually):
- `DATABASE_URL` - from PostgreSQL service
- `REDIS_URL` - from Redis service
- `PORT` - Railway auto-assigns
- `RAILWAY_ENVIRONMENT` - Railway sets this

### 6. Wait for Deployment

The deployment will:
1. Build Docker image (~3-5 minutes)
2. Run health checks
3. Deploy automatically

**Watch progress:**
- In Railway dashboard: Click your service → **"Deployments"** tab
- View logs in real-time

### 7. Initialize Database

Once deployed (status shows "Active"):

**Option A - Via Railway Dashboard:**
1. Click your web service
2. Go to **"Shell"** tab (or "Terminal")
3. Run:
```bash
npm run db:push
```

**Option B - Via CLI:**
```bash
npx @railway/cli run npm run db:push
```

This creates all 90+ database tables using Drizzle ORM.

### 8. Verify Deployment

**Check health endpoint:**
```bash
curl https://<your-app>.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2025-11-14T..."
}
```

**Test the frontend:**
1. Open your Railway app URL (shown in dashboard)
2. You should see the login page
3. Login with your master user credentials

### 9. Optional: Add Custom Domain

1. Click your web service → **"Settings"** → **"Domains"**
2. Click **"Custom Domain"**
3. Enter: `app.yourdomain.com`
4. Add DNS record:
   ```
   CNAME  app  <your-app>.railway.app
   ```
5. Railway automatically provisions SSL certificate (1-5 minutes)

### 10. Enable Production Features (Optional)

Add these environment variables for full functionality:

```bash
# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
MAIL_FROM=hello@newvantageco.com

# Payments (Stripe - use test keys first!)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

# AI Services (Optional)
OPENAI_API_KEY=sk-xxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
```

## Troubleshooting

### Build Fails
1. Check logs in Railway dashboard
2. Verify Dockerfile exists in repo
3. Check that all dependencies are in package.json

### Database Connection Error
1. Verify PostgreSQL service is running
2. Check that `DATABASE_URL` is auto-generated
3. Restart the web service

### Application Won't Start
1. Check logs for errors
2. Verify health check endpoint: `/api/health`
3. Ensure all required environment variables are set
4. Check that database was initialized (`npm run db:push`)

### Health Check Failing
1. Wait for full startup (40 seconds - see Dockerfile HEALTHCHECK)
2. Check if database is connected
3. Verify Redis is connected
4. Review application logs

## Useful Commands

```bash
# View real-time logs
npx @railway/cli logs --follow

# Check deployment status
npx @railway/cli status

# Open Railway dashboard
npx @railway/cli open

# Run commands in production
npx @railway/cli run <command>

# Access production shell
npx @railway/cli shell

# Redeploy
npx @railway/cli up

# Rollback to previous deployment
npx @railway/cli rollback
```

## Summary

**Services Required:**
1. ✅ PostgreSQL Database
2. ✅ Redis Cache
3. ✅ Web Service (ILS 2.0 App)

**Minimum Environment Variables:**
- `NODE_ENV=production`
- `SESSION_SECRET=<generated>`
- `ADMIN_SETUP_KEY=<generated>`
- `MASTER_USER_EMAIL=<your-email>`
- `MASTER_USER_PASSWORD=<min-12-chars>`

**Auto-Provided by Railway:**
- `DATABASE_URL`
- `REDIS_URL`
- `PORT`

**Deployment Time:** ~5-10 minutes
**Cost:** ~$5-20/month (Railway pricing)

---

**Next Steps After Deployment:**
1. ✅ Test login with master user
2. ✅ Create additional users/organizations
3. ✅ Configure Stripe for payments
4. ✅ Set up monitoring (uptime, errors)
5. ✅ Configure backups for database

**Support:**
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- ILS 2.0 Docs: See [README.md](./README.md)

---

**Last Updated:** November 14, 2025
**Status:** Ready for Production Deployment 🚀
