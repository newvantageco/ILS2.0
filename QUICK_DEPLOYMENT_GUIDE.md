# 🚀 ILS 2.0 - Quick Deployment Guide

## **STEP 1: PUSH TO GITHUB** ⚡

### Option A: Automated Script
```bash
# Run the deployment script
./scripts/deploy-to-production.sh
```

### Option B: Manual Commands
```bash
# 1. Initialize git repository
git init
git add .
git commit -m "feat: ILS 2.0 production-ready with AI/ML and Shopify"

# 2. Create GitHub repository
# Go to https://github.com/new → Create "ILS2.0"

# 3. Connect and push
git remote add origin https://github.com/YOUR_USERNAME/ILS2.0.git
git branch -M main
git push -u origin main
```

---

## **STEP 2: RAILWAY DEPLOYMENT** 🛠️

### 2.1 Create Project (2 minutes)
1. Go to [railway.app/new](https://railway.app/new)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your ILS2.0 repository

### 2.2 Add Services (3 minutes)
1. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Click **"+ New"** → **"Database"** → **"Add Redis"**

### 2.3 Environment Variables (5 minutes)
Go to **Project → Variables** and add:

```env
# Core
NODE_ENV=production
SESSION_SECRET=your-64-char-random-secret
APP_URL=https://your-app.railway.app
CORS_ORIGIN=https://your-app.railway.app

# AI Services
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Shopify
ENCRYPTION_KEY=your-32-byte-encryption-key

# Email
RESEND_API_KEY=re_your-resend-key
MAIL_FROM=hello@yourdomain.com
```

### 2.4 Deploy (Automatic)
Railway will automatically deploy when you save the variables.

---

## **STEP 3: DATABASE SETUP** 🗄️

Once deployed, run migrations:

```bash
# Option 1: Railway web terminal
# Go to your app → "Shell" tab → Run:
npm run db:push

# Option 2: Railway CLI
railway run npm run db:push
```

---

## **STEP 4: VERIFY DEPLOYMENT** ✅

### Health Checks
```bash
# Main application
curl https://your-app.railway.app/api/health

# Expected response:
{
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

### Create Admin User
1. Visit: `https://your-app.railway.app/admin/setup`
2. Create your platform administrator account

### Test Features
- **AI Assistant**: Navigate to AI Assistant → Test queries
- **ML Dashboard**: Check model monitoring
- **Shopify Integration**: Connect test store

---

## **STEP 5: AI SERVICE DEPLOYMENT** 🤖

### Option A: Railway (Simple)
1. Create new Railway service
2. Point to `ai-service` directory
3. Add environment variables:
   ```env
   OPENAI_API_KEY=sk-your-key
   ANTHROPIC_API_KEY=sk-ant-your-key
   ```

### Option B: Hugging Face Spaces (Recommended)
1. Go to [huggingface.co/spaces](https://huggingface.co/spaces)
2. Create new Space → "Python" + "Docker"
3. Upload `ai-service` directory
4. Set environment variables

---

## **STEP 6: CUSTOM DOMAIN** 🌐

### Configure Domain
1. Railway → **Settings** → **Domains**
2. Add custom domain (e.g., `app.yourdomain.com`)
3. Update DNS:
   ```
   CNAME app → your-app.railway.app
   ```

### SSL Certificate
Railway provides automatic SSL certificates.

---

## **COST ESTIMATES** 💰

| Service | Cost/Month |
|---------|-----------|
| Railway (Main) | $20-100 |
| AI Service | $15-30 |
| OpenAI API | $10-50 |
| Anthropic API | $10-30 |
| AWS S3 | $5-15 |
| **Total** | **$60-225** |

---

## **TROUBLESHOOTING** 🔧

### Common Issues

**Build Failed**
```bash
# Check build locally first
npm run build
# View Railway logs
railway logs --tail 100
```

**Database Connection Error**
```bash
# Verify DATABASE_URL
railway variables | grep DATABASE_URL
# Test connection
railway run npm run db:test
```

**Environment Variables Not Working**
```bash
# List all variables
railway variables
# Restart service after changes
railway restart
```

### Get Help
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **ILS Documentation**: `./docs/`
- **Issues**: Check GitHub Issues

---

## **SUCCESS CHECKLIST** ✅

- [ ] GitHub repository created and pushed
- [ ] Railway project with PostgreSQL and Redis
- [ ] Environment variables configured
- [ ] Application deployed and healthy
- [ ] Database migrations applied
- [ ] Admin user created
- [ ] AI/ML features tested
- [ ] Shopify integration working
- [ ] Custom domain configured
- [ ] Monitoring active

---

## **NEXT STEPS** 🎯

After successful deployment:

1. **Test Everything**: Upload prescriptions, connect Shopify store
2. **Add Users**: Create accounts for your team
3. **Configure Integrations**: Set up payment gateways, email services
4. **Monitor Performance**: Check logs and metrics
5. **Scale**: Adjust resources based on usage

---

## **QUICK COMMANDS** ⚡

```bash
# Railway CLI
npm install -g @railway/cli
railway login
railway link

# Common commands
railway logs              # View logs
railway run npm run db:push    # Database migrations
railway variables         # List environment variables
railway restart           # Restart service

# Local testing
npm run dev              # Development server
npm run build            # Production build
npm run test             # Run tests
```

---

**🎉 Your ILS 2.0 Healthcare Operating System will be live in under 30 minutes!**

---

*For detailed instructions, see: `./RAILWAY_DEPLOYMENT_GUIDE.md`*
