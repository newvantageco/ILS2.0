# Railway Quick Start Guide

**Deploy ILS 2.0 to Railway in 10 minutes**

## 🚀 5-Step Deployment

### Step 1: Create Railway Project (2 minutes)

1. Go to https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Select **`newvantageco/ILS2.0`**
4. Select **`main`** branch

### Step 2: Add Databases (1 minute)

**Add PostgreSQL:**
1. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**

**Add Redis (optional but recommended):**
1. Click **"+ New"** → **"Database"** → **"Add Redis"**

### Step 3: Set Environment Variables (5 minutes)

Go to your app service → **"Variables"** tab → Add these:

```bash
# Required
NODE_ENV=production
SESSION_SECRET=<run: openssl rand -hex 32>
ADMIN_SETUP_KEY=<run: openssl rand -hex 32>
CORS_ORIGIN=https://your-app-name.up.railway.app
NEW_PASSWORD=SecurePassword123!

# Optional (add if needed)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Generate secrets:**
```bash
openssl rand -hex 32
```

### Step 4: Deploy (2 minutes)

Railway will automatically deploy. Wait for:
- ✅ Build complete
- ✅ Deploy complete
- ✅ Health check passing

### Step 5: Initialize Database (1 minute)

**Option A: Railway Shell**
1. Click your service → **"..."** → **"Shell"**
2. Run: `npm run db:push`

**Option B: Railway CLI**
```bash
railway login
railway link
railway run npm run db:push
```

## ✅ Verify Deployment

Visit your app URL (shown in Railway dashboard):
- [ ] Application loads
- [ ] Can log in with admin credentials
- [ ] No errors in logs

## 🎉 Done!

Your app is now live at: `https://your-app-name.up.railway.app`

---

## 📚 Next Steps

- **Full Guide:** See `RAILWAY_DEPLOYMENT.md` for detailed instructions
- **Environment Variables:** See `.env.railway.example` for all options
- **Troubleshooting:** See `RAILWAY_DEPLOYMENT.md` → "Troubleshooting" section

## 💰 Cost Estimate

- Small app: ~$15-20/month
- Medium app: ~$40-70/month
- Railway charges based on usage (CPU, memory, network)

## 🔒 Important Security Notes

1. **Generate unique secrets** - Don't use the example values!
2. **Update CORS_ORIGIN** - Must match your Railway domain
3. **Use strong admin password** - Minimum 12 characters
4. **Enable 2FA** on Railway account

## 🆘 Need Help?

- **Railway Support:** https://discord.gg/railway
- **Full Docs:** `RAILWAY_DEPLOYMENT.md`
- **GitHub Issues:** https://github.com/newvantageco/ILS2.0/issues
