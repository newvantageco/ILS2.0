# Railway Deployment Guide for ILS 2.0

Complete guide to deploying this application on Railway.app

## 🚀 Quick Start

### Prerequisites
- Railway account (sign up at https://railway.app)
- GitHub account
- This repository pushed to GitHub

---

## 📋 Step-by-Step Deployment

### Step 1: Create New Railway Project

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select the **`newvantageco/ILS2.0`** repository
6. Select the **`main`** branch

### Step 2: Add PostgreSQL Database

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database" → "Add PostgreSQL"**
3. Railway will automatically create a PostgreSQL database
4. The `DATABASE_URL` environment variable will be automatically injected

### Step 3: Add Redis (Optional but Recommended)

Redis is needed for:
- WebSocket authentication
- Session storage
- Background job queues

**To add Redis:**
1. Click **"+ New"** in your project
2. Select **"Database" → "Add Redis"**
3. Railway will automatically create a Redis instance
4. The `REDIS_URL` environment variable will be automatically injected

**Alternative:** The app will work without Redis in development mode, but WebSocket authentication will use query parameters instead of sessions.

### Step 4: Configure Environment Variables

In the Railway dashboard, go to your app service → **Variables** tab and add:

#### Required Variables

```bash
# Application
NODE_ENV=production
PORT=3000  # Railway will inject this automatically, but good to have

# Security Secrets (generate random strings)
SESSION_SECRET=<generate-secure-random-64-character-string>
ADMIN_SETUP_KEY=<generate-secure-random-64-character-string>

# CORS Configuration
CORS_ORIGIN=https://your-app-name.up.railway.app

# Database (auto-injected by Railway PostgreSQL)
# DATABASE_URL=postgresql://... (automatically set)

# Redis (auto-injected by Railway Redis)
# REDIS_URL=redis://... (automatically set)
```

#### Optional Variables (Add as needed)

```bash
# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# LIMS Integration
LIMS_WEBHOOK_SECRET=<your-webhook-secret>

# Admin Password (for initial setup)
NEW_PASSWORD=<secure-password-minimum-12-chars>

# AWS S3 (for file uploads - optional)
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_REGION=us-east-1
AWS_S3_BUCKET=<your-bucket-name>

# AI Services (optional)
ANTHROPIC_API_KEY=<your-anthropic-key>
OPENAI_API_KEY=<your-openai-key>

# Stripe (for payments - optional)
STRIPE_SECRET_KEY=<your-stripe-secret>
STRIPE_WEBHOOK_SECRET=<your-webhook-secret>
```

#### Generate Random Secrets

Use these commands to generate secure secrets:

```bash
# On Mac/Linux
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Step 5: Configure Build Settings

Railway should auto-detect the settings, but verify:

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Root Directory:** `/` (leave default)

**Watch Paths:** `.` (leave default)

### Step 6: Add Railway Configuration File (Optional)

Create `railway.json` in the root of your project for better control:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 7: Configure Custom Domain (Optional)

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"** to get a free Railway subdomain
3. Or click **"Custom Domain"** to add your own domain
4. Update `CORS_ORIGIN` environment variable to match your domain

### Step 8: Deploy!

1. Railway will automatically deploy when you push to the `main` branch
2. Monitor the deployment logs in the Railway dashboard
3. Wait for the build and deployment to complete (5-10 minutes)

---

## 🔧 Post-Deployment Configuration

### 1. Run Database Migrations

After first deployment, you may need to push the database schema:

**Option A: Using Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npm run db:push
```

**Option B: Using Railway Shell**
1. Go to your service in Railway dashboard
2. Click the **"..."** menu → **"Shell"**
3. Run: `npm run db:push`

### 2. Create Master Admin User

The app will automatically create a master user on first run if `NEW_PASSWORD` is set.

**To manually set admin password:**
```bash
# In Railway shell or via CLI
NEW_PASSWORD=your-secure-password npx tsx server/scripts/setNewVantagePassword.ts
```

### 3. Verify Deployment

Visit your Railway app URL and check:
- [ ] Application loads successfully
- [ ] Can access login page
- [ ] Can log in with admin credentials
- [ ] Database connection working
- [ ] WebSocket connections working (check browser console)
- [ ] No errors in Railway logs

---

## 📊 Monitoring and Scaling

### View Logs
1. Go to Railway dashboard → Your service
2. Click **"Logs"** tab to see real-time logs
3. Monitor for errors or issues

### View Metrics
1. Click **"Metrics"** tab to see:
   - CPU usage
   - Memory usage
   - Network traffic
   - Request count

### Auto-Scaling
Railway automatically scales based on your plan:
- **Hobby Plan:** $5/month, single instance
- **Pro Plan:** $20/month + usage, auto-scaling enabled

### Configure Resource Limits
1. Go to **Settings** → **Resources**
2. Adjust CPU and memory limits as needed

---

## 🔒 Security Checklist

After deployment, verify:

- [ ] All environment variables are set correctly
- [ ] `NODE_ENV=production` is set
- [ ] `SESSION_SECRET` is a strong random string (not the default)
- [ ] `ADMIN_SETUP_KEY` is a strong random string
- [ ] `CORS_ORIGIN` matches your actual domain
- [ ] HTTPS is enabled (Railway does this automatically)
- [ ] Database connection uses SSL (Railway does this automatically)
- [ ] Admin password is secure (minimum 12 characters)
- [ ] Rate limiting is working (check logs)
- [ ] No sensitive data in logs

---

## 🐛 Troubleshooting

### Build Fails

**Problem:** Build command fails with errors

**Solutions:**
1. Check build logs for specific errors
2. Verify all dependencies are in `package.json`
3. Try rebuilding: Click **"..."** → **"Redeploy"**
4. Check Node version compatibility

### App Crashes on Startup

**Problem:** App starts but immediately crashes

**Solutions:**
1. Check logs for error messages
2. Verify `DATABASE_URL` is set correctly
3. Verify `SESSION_SECRET` is set
4. Run database migrations: `npm run db:push`
5. Check that all required environment variables are set

### Database Connection Fails

**Problem:** Cannot connect to PostgreSQL

**Solutions:**
1. Verify PostgreSQL service is running
2. Check `DATABASE_URL` environment variable
3. Ensure database is in the same Railway project
4. Check database service logs

### WebSocket Connection Fails

**Problem:** Real-time features not working

**Solutions:**
1. Verify Redis is running (if using Redis mode)
2. Check browser console for WebSocket errors
3. Verify `REDIS_URL` is set correctly
4. Check firewall/proxy settings
5. In development mode, WebSocket will work without Redis

### Memory Issues

**Problem:** App runs out of memory

**Solutions:**
1. Increase memory limit in Railway settings
2. Check for memory leaks in logs
3. Optimize database queries
4. Consider upgrading Railway plan

### Port Binding Issues

**Problem:** App cannot bind to port

**Solutions:**
1. Do NOT set `PORT` manually - Railway injects this
2. Verify app uses `process.env.PORT`
3. Check start command is correct: `npm start`

---

## 💰 Cost Estimation

### Railway Pricing

**Hobby Plan:** $5/month
- $5 credit included
- Pay for what you use
- Single environment

**Pro Plan:** $20/month
- $20 credit included
- Pay for usage above credit
- Multiple environments
- Team features

### Estimated Monthly Costs

**Small Application (< 100 users):**
- App Service: ~$5-10
- PostgreSQL: ~$5
- Redis: ~$5
- **Total:** ~$15-20/month

**Medium Application (100-1000 users):**
- App Service: ~$20-40
- PostgreSQL: ~$10-20
- Redis: ~$10
- **Total:** ~$40-70/month

**Note:** Railway charges based on:
- CPU usage
- Memory usage
- Network egress
- Storage

---

## 🔄 Continuous Deployment

### Auto-Deploy from GitHub

Railway automatically deploys when you push to the connected branch.

**To configure:**
1. Go to **Settings** → **Service**
2. Under **Source**, verify the correct branch is selected
3. Enable **"Auto Deploy"** (enabled by default)

### Deploy from Pull Request

1. Go to **Settings** → **Service**
2. Enable **"PR Deploys"**
3. Railway will create preview deployments for each PR

### Manual Deploy

1. Go to your service in Railway dashboard
2. Click **"..."** → **"Redeploy"**
3. Choose "Latest commit" or specific commit

---

## 📚 Additional Resources

### Railway Documentation
- General: https://docs.railway.app
- Databases: https://docs.railway.app/databases/postgresql
- Environment Variables: https://docs.railway.app/develop/variables

### Application Documentation
- Deployment Checklist: `docs/DEPLOYMENT_CHECKLIST.md`
- Environment Variables: `.env.example`
- Remaining TODOs: `docs/REMAINING_TODOS.md`

### Support
- Railway Discord: https://discord.gg/railway
- Railway Support: support@railway.app
- GitHub Issues: https://github.com/newvantageco/ILS2.0/issues

---

## ✅ Deployment Checklist

Use this checklist to ensure everything is configured correctly:

### Pre-Deployment
- [ ] Code pushed to GitHub main branch
- [ ] All critical issues fixed (see PR description)
- [ ] Environment variables documented
- [ ] Build and start commands verified

### Railway Setup
- [ ] Railway project created
- [ ] GitHub repository connected
- [ ] PostgreSQL database added
- [ ] Redis database added (optional)
- [ ] All environment variables configured
- [ ] Custom domain configured (optional)

### Post-Deployment
- [ ] Application deployed successfully
- [ ] Database migrations run
- [ ] Master admin user created
- [ ] Application accessible via URL
- [ ] Login functionality working
- [ ] WebSocket connections working
- [ ] No errors in logs
- [ ] SSL/HTTPS enabled
- [ ] Monitoring configured

### Production Readiness
- [ ] Strong secrets configured
- [ ] CORS configured correctly
- [ ] Rate limiting verified
- [ ] Error logging working
- [ ] Backups configured (Railway auto-backups)
- [ ] Team access configured

---

## 🎉 Success!

Once all checklist items are complete, your application is live on Railway!

**Next Steps:**
1. Test all critical features
2. Set up monitoring and alerts
3. Configure backups (Railway does this automatically)
4. Add team members if needed
5. Set up CI/CD pipelines
6. Plan for scaling as user base grows

**Your application is now production-ready!** 🚀
