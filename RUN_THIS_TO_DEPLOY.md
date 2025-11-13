
# 🚀 DEPLOY TO RAILWAY - RUN THIS NOW

## Quick Deploy (Copy & Paste)

### Option 1: Run the Deployment Script

Open your terminal in this directory and run:

```bash
./DEPLOY_RAILWAY_NOW.sh
```

The script will:
1. ✅ Authenticate with Railway
2. ✅ Create/link project
3. ✅ Set all environment variables (including your generated secrets)
4. ✅ Build the application
5. ✅ Deploy to Railway
6. ✅ Initialize database
7. ✅ Verify deployment

**Time**: ~10-15 minutes

---

### Option 2: Manual Step-by-Step

If you prefer manual control, run these commands:

#### 1. Login to Railway
```bash
npx @railway/cli login
```
*This will open your browser for authentication*

#### 2. Create New Project
```bash
npx @railway/cli init
```

#### 3. Add PostgreSQL & Redis
Go to https://railway.app/dashboard and:
- Click "+ New" → "Database" → "PostgreSQL"
- Click "+ New" → "Database" → "Redis"

#### 4. Set Environment Variables
```bash
# Core variables
npx @railway/cli variables set NODE_ENV=production
npx @railway/cli variables set PORT=5000
npx @railway/cli variables set SESSION_SECRET="F2VHuRe01NCsiZV971FmZJdcsLlLgfSsb5OT4a7ZIwvIOse2RCl4qNIpXMcAHpbL"
npx @railway/cli variables set ADMIN_SETUP_KEY="sxRbYCLjGYVDEkDHfaqU/TIidCmZ5qQn"

# Master user (customize these)
npx @railway/cli variables set MASTER_USER_EMAIL="admin@yourdomain.com"
npx @railway/cli variables set MASTER_USER_PASSWORD="YourStrongPassword123"
npx @railway/cli variables set MASTER_USER_FIRST_NAME="Admin"
npx @railway/cli variables set MASTER_USER_LAST_NAME="User"
npx @railway/cli variables set MASTER_USER_ORGANIZATION="ILS Platform"
```

#### 5. Deploy
```bash
npx @railway/cli up
```

#### 6. Initialize Database
```bash
npx @railway/cli run npm run db:push
```

#### 7. Get Your URL
```bash
npx @railway/cli domain
```

#### 8. Test
```bash
# Replace with your actual URL
curl https://your-app.railway.app/api/health
```

Expected response:
```json
{"status":"ok","database":"connected","redis":"connected"}
```

---

## Your Generated Secrets

**Save these securely!**

```env
SESSION_SECRET=F2VHuRe01NCsiZV971FmZJdcsLlLgfSsb5OT4a7ZIwvIOse2RCl4qNIpXMcAHpbL
ADMIN_SETUP_KEY=sxRbYCLjGYVDEkDHfaqU/TIidCmZ5qQn
```

---

## Troubleshooting

### "Cannot login in non-interactive mode"
**Solution**: Run `npx @railway/cli login` in your terminal (not through a script)

### "No project linked"
**Solution**: Run `npx @railway/cli init` or `npx @railway/cli link`

### "DATABASE_URL not found"
**Solution**: Add PostgreSQL via Railway Dashboard (+ New → Database → PostgreSQL)

### Build fails
**Solution**: Test locally first with `npm run build`

### Deployment not responding
**Solution**:
- Check logs: `npx @railway/cli logs`
- Verify environment variables: `npx @railway/cli variables`
- Make sure database is initialized: `npx @railway/cli run npm run db:push`

---

## After Deployment

### View Logs
```bash
npx @railway/cli logs
```

### Check Status
```bash
npx @railway/cli status
```

### Open Shell
```bash
npx @railway/cli shell
```

### Update Variables
```bash
npx @railway/cli variables set KEY=value
```

### Redeploy
```bash
npx @railway/cli up
```

---

## Success Checklist

- [ ] Railway CLI authenticated
- [ ] Project created/linked
- [ ] PostgreSQL added
- [ ] Redis added
- [ ] Environment variables set
- [ ] Application deployed
- [ ] Database initialized
- [ ] Health check passing
- [ ] Can log in with master user

---

## Need Help?

- **Quick Start**: [RAILWAY_QUICK_START.md](./RAILWAY_QUICK_START.md)
- **Complete Guide**: [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)
- **Full Details**: [DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md)
- **Railway Docs**: https://docs.railway.app

---

## Quick Commands Reference

```bash
# Authentication
npx @railway/cli login
npx @railway/cli whoami

# Project
npx @railway/cli init          # New project
npx @railway/cli link          # Link existing
npx @railway/cli status        # Show status

# Deploy
npx @railway/cli up            # Deploy

# Variables
npx @railway/cli variables                 # List
npx @railway/cli variables set KEY=VALUE   # Set

# Database
npx @railway/cli run npm run db:push       # Initialize
npx @railway/cli run psql                  # Connect

# Monitoring
npx @railway/cli logs          # View logs
npx @railway/cli logs -f       # Follow logs
npx @railway/cli domain        # Get URL
```

---

**Ready to deploy? Run:**

```bash
./DEPLOY_RAILWAY_NOW.sh
```

**Or follow Option 2 above for manual deployment.**

---

**Estimated Time**: 10-15 minutes
**Difficulty**: Easy
**Status**: Ready ✅
