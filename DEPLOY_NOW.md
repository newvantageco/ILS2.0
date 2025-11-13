# Deploy to Railway - Step by Step

## Quick Deploy (2 Options)

### Option 1: Manual Steps (Recommended - Full Control)

#### Step 1: Get Railway Token

1. Go to: https://railway.app/account/tokens
2. Click **"Create Token"**
3. Copy the token
4. Set it in your terminal:

```bash
export RAILWAY_TOKEN='your-token-here'
```

#### Step 2: Open Railway in Browser

Go to https://railway.app and:

1. Create new project (or use existing)
2. Click **"Deploy from GitHub"**
3. Select your **ILS2.0** repository
4. Railway will auto-detect Node.js

#### Step 3: Add Services

In your Railway project:

**Add PostgreSQL:**
1. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway auto-sets `DATABASE_URL`

**Add Redis:**
1. Click **"+ New"** → **"Database"** → **"Redis"**
2. Railway auto-sets `REDIS_URL`

#### Step 4: Set Environment Variables

Click your app service → **"Variables"**:

```env
NODE_ENV=production
PORT=5000
SESSION_SECRET=<generate-with-command-below>
ADMIN_SETUP_KEY=<generate-with-command-below>

# Master User
MASTER_USER_EMAIL=admin@yourdomain.com
MASTER_USER_PASSWORD=<strong-password>
MASTER_USER_FIRST_NAME=Admin
MASTER_USER_LAST_NAME=User
MASTER_USER_ORGANIZATION=ILS Platform
```

**Generate Secrets:**
```bash
# SESSION_SECRET (64 chars)
openssl rand -base64 48

# ADMIN_SETUP_KEY (32 chars)
openssl rand -base64 24
```

#### Step 5: Deploy

Railway automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "deploy: Railway production deployment"
git push origin main
```

**Or deploy manually from your machine:**

```bash
# Link to your project
npx @railway/cli link

# Deploy
npx @railway/cli up
```

#### Step 6: Initialize Database

After deployment completes:

```bash
# Link to project (if not done)
npx @railway/cli link

# Initialize database schema
npx @railway/cli run npm run db:push
```

#### Step 7: Verify

```bash
# Get your app URL
npx @railway/cli domain

# Check health
curl https://your-app.railway.app/api/health

# View logs
npx @railway/cli logs

# Open shell
npx @railway/cli shell
```

---

### Option 2: Automated Script

Use the deployment script for automated deployment:

```bash
# 1. Get Railway token
# Go to: https://railway.app/account/tokens
# Copy your token

# 2. Set token
export RAILWAY_TOKEN='your-token-here'

# 3. Run deployment script
./deploy-railway.sh
```

The script will:
- ✅ Check Railway token
- ✅ Link/create project
- ✅ Verify build
- ✅ Check environment variables
- ✅ Deploy application
- ✅ Initialize database
- ✅ Show deployment status

---

## Post-Deployment

### Check Deployment

```bash
# View real-time logs
npx @railway/cli logs --follow

# Check status
npx @railway/cli status

# Test health endpoint
curl https://your-app.railway.app/api/health
```

### Expected Response

```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2025-11-13T..."
}
```

### Access Your App

1. Get URL: `npx @railway/cli domain`
2. Open in browser: `https://your-app.railway.app`
3. Login with master user credentials

---

## Railway CLI Commands Reference

```bash
# Authentication
npx @railway/cli login          # Login via browser
npx @railway/cli whoami          # Check current user

# Project Management
npx @railway/cli init            # Create new project
npx @railway/cli link            # Link to existing project
npx @railway/cli status          # Show project status
npx @railway/cli list            # List all projects

# Deployment
npx @railway/cli up              # Deploy current directory
npx @railway/cli up -d           # Deploy with detached logs

# Environment Variables
npx @railway/cli variables                    # List all variables
npx @railway/cli variables set KEY=VALUE      # Set variable
npx @railway/cli variables delete KEY         # Delete variable

# Database Operations
npx @railway/cli run npm run db:push    # Initialize schema
npx @railway/cli run psql               # Connect to PostgreSQL
npx @railway/cli run redis-cli          # Connect to Redis

# Monitoring
npx @railway/cli logs            # View logs
npx @railway/cli logs -f         # Follow logs
npx @railway/cli logs --tail 100 # Last 100 lines

# Shell Access
npx @railway/cli shell           # Open shell in production
npx @railway/cli run <command>   # Run single command

# Domain Management
npx @railway/cli domain          # Show current domain
```

---

## Environment Variables Needed

### Required (Core)

```env
NODE_ENV=production
PORT=5000
SESSION_SECRET=<64-char-secret>
ADMIN_SETUP_KEY=<32-char-key>
```

### Recommended (Master User)

```env
MASTER_USER_EMAIL=admin@yourdomain.com
MASTER_USER_PASSWORD=<min-12-chars>
MASTER_USER_FIRST_NAME=Admin
MASTER_USER_LAST_NAME=User
MASTER_USER_ORGANIZATION=ILS Platform
```

### Optional (Features)

```env
# Email
RESEND_API_KEY=re_xxxxx
FROM_EMAIL=noreply@yourdomain.com

# Payments
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# AI
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Shopify
SHOPIFY_SHOP_NAME=your-shop
SHOPIFY_API_KEY=xxxxx
SHOPIFY_API_SECRET=xxxxx
SHOPIFY_ACCESS_TOKEN=xxxxx
```

### Auto-Configured by Railway

These are automatically set by Railway:

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
RAILWAY_ENVIRONMENT=production
```

---

## Troubleshooting

### Build Fails

```bash
# Test build locally
npm run build

# Check Railway logs
npx @railway/cli logs --tail 100
```

### Database Connection Issues

```bash
# Verify DATABASE_URL is set
npx @railway/cli variables | grep DATABASE_URL

# Test connection
npx @railway/cli run npm run db:push
```

### Application Won't Start

```bash
# Check logs for errors
npx @railway/cli logs | grep ERROR

# Common issues:
# - Missing environment variables
# - Database not initialized
# - Port binding issues (ensure app uses process.env.PORT)
```

### Environment Variable Issues

```bash
# List all current variables
npx @railway/cli variables

# Set missing variables
npx @railway/cli variables set SESSION_SECRET="$(openssl rand -base64 48)"
npx @railway/cli variables set ADMIN_SETUP_KEY="$(openssl rand -base64 24)"
```

---

## Success Checklist

After deployment, verify:

- [ ] Health endpoint returns 200 OK
- [ ] Database connected (`"database": "connected"`)
- [ ] Redis connected (`"redis": "connected"`)
- [ ] Frontend loads correctly
- [ ] Can login with master user
- [ ] No errors in logs

---

## Need Help?

- **Full Guide**: [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)
- **Quick Start**: [RAILWAY_QUICK_START.md](./RAILWAY_QUICK_START.md)
- **Checklist**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Support**: Discord or support@railway.app

---

## What's Next?

After successful deployment:

1. **Custom Domain**: Add your domain in Railway settings
2. **Monitoring**: Set up error tracking (Sentry)
3. **Backups**: Configure automated backups
4. **Team Access**: Invite team members
5. **CI/CD**: Set up GitHub Actions

---

**Deployment Time**: ~15-20 minutes
**Status**: Ready to Deploy ✅

**Last Updated**: November 2025
