# Railway Deployment - Quick Start

**Complete deployment in 15 minutes!**

## Prerequisites

- [x] Railway account: [railway.app](https://railway.app)
- [x] Code pushed to GitHub
- [x] Build passes locally: `npm run build`

---

## Step 1: Create Project (2 minutes)

1. Go to [railway.app/new](https://railway.app/new)
2. Click **"Deploy from GitHub repo"**
3. Select your ILS2.0 repository
4. Railway auto-detects Node.js and Dockerfile ✅

## Step 2: Add Services (3 minutes)

### Add PostgreSQL

1. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway auto-configures `DATABASE_URL` ✅

### Add Redis

1. Click **"+ New"** → **"Database"** → **"Redis"**
2. Railway auto-configures `REDIS_URL` ✅

## Step 3: Configure Environment (5 minutes)

Click your app service → **"Variables"** → Add these:

### Required Variables

```env
NODE_ENV=production
PORT=5000
SESSION_SECRET=<copy-from-generator-below>
ADMIN_SETUP_KEY=<copy-from-generator-below>
```

### Master User (Recommended)

```env
MASTER_USER_EMAIL=admin@yourdomain.com
MASTER_USER_PASSWORD=<min-12-chars>
MASTER_USER_FIRST_NAME=Admin
MASTER_USER_LAST_NAME=User
MASTER_USER_ORGANIZATION=ILS Platform
```

### Generate Secure Secrets

```bash
# Generate SESSION_SECRET (64 chars)
openssl rand -base64 48

# Generate ADMIN_SETUP_KEY (32 chars)
openssl rand -base64 24
```

---

## Step 4: Deploy (3 minutes)

### Trigger Deployment

```bash
git add .
git commit -m "deploy: Railway production deployment"
git push origin main
```

Railway will:
1. Build Docker image (~2-3 minutes)
2. Run health checks
3. Deploy with zero downtime
4. Provide public URL

### Watch Deployment

In Railway dashboard:
- Click your app service
- Go to **"Deployments"** tab
- Watch logs in real-time

---

## Step 5: Initialize Database (2 minutes)

### Via Railway Shell

1. Click your app service
2. Go to **"Shell"** tab
3. Run:

```bash
npm run db:push
```

This creates all 90+ database tables using Drizzle ORM.

### Verify

Check health endpoint:

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

## Step 6: Verify Deployment (2 minutes)

### Quick Tests

```bash
# 1. Health check
curl https://your-app.railway.app/api/health

# 2. Frontend loads
curl -I https://your-app.railway.app

# 3. Login page
open https://your-app.railway.app
```

### Login with Master User

1. Open your app URL
2. Click **"Sign in"**
3. Use credentials from `MASTER_USER_EMAIL` and `MASTER_USER_PASSWORD`

---

## Optional: Custom Domain (5 minutes)

1. Go to your app → **"Settings"** → **"Domains"**
2. Click **"Custom Domain"**
3. Add your domain (e.g., `app.yourdomain.com`)
4. Update DNS:

```
CNAME  app  <your-app>.railway.app
```

Railway automatically provisions SSL certificate ✅

---

## Troubleshooting

### Build Fails

```bash
# Test locally first
npm run build

# Check Railway logs
railway logs --tail 100
```

### Database Connection Issues

```bash
# Verify DATABASE_URL is set
railway variables | grep DATABASE_URL

# Should output: DATABASE_URL=postgresql://...
```

### Application Won't Start

Check logs for errors:

```bash
railway logs | grep ERROR
```

Common issues:
- Missing environment variables
- Database not initialized (`npm run db:push`)
- Port binding (ensure app uses `process.env.PORT`)

---

## Next Steps

✅ **Production is live!**

Now:
1. Set up monitoring: [./docs/OBSERVABILITY.md](./docs/OBSERVABILITY.md)
2. Configure backups: See [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)
3. Add team members: Railway → "Settings" → "Members"
4. Review security: [./docs/SECURITY_IMPLEMENTATION.md](./docs/SECURITY_IMPLEMENTATION.md)

---

## Essential Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs

# Run commands in production
railway run npm run db:push

# Open shell
railway shell
```

---

## Need Help?

- **Full Guide**: [./RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Platform Docs**: [./README.md](./README.md)
- **Support**: Railway Discord or support@railway.app

---

**Estimated Total Time**: 15-20 minutes

**Status**: ✅ Production Ready

**Last Updated**: November 2025
