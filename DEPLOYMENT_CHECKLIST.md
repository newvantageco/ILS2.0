# ILS 2.0 Production Deployment Checklist

**Project**: ILS-2.0-Production
**Railway URL**: https://railway.com/project/0038b820-2ece-411b-9118-7771b275dafa
**Date**: November 14, 2025

---

## ✅ Completed Setup

- [x] Railway CLI installed (v4.11.0)
- [x] Railway account authenticated (New Vantage Co)
- [x] Railway project created (ILS-2.0-Production)
- [x] Secure secrets generated
- [x] Deployment documentation created

---

## 🚀 Next Steps - Complete in Railway Dashboard

### Phase 1: Add Services (https://railway.com/project/0038b820-2ece-411b-9118-7771b275dafa)

- [ ] Add PostgreSQL Database (+ New → Database → PostgreSQL)
- [ ] Enable Production Mode on Postgres
- [ ] Add Redis (+ New → Database → Redis)
- [ ] Add Web Service (+ New → GitHub Repo → newvantageco/ILS2.0)

### Phase 2: Configure Variables (Web Service → Variables)

**Required**:
- [ ] SESSION_SECRET=Yl/goPtE6DHlSEvXkECwfSlSKfIBhNoonVNzGbg2y10=
- [ ] ADMIN_SETUP_KEY=O4msyb1N0Ptvv1lMIqEPj5m91nW+gNi0
- [ ] NODE_ENV=production
- [ ] HOST=0.0.0.0
- [ ] APP_URL=(update after first deploy)
- [ ] DATABASE_URL=${{Postgres.DATABASE_URL}}
- [ ] REDIS_URL=${{Redis.REDIS_URL}}

**Optional - Master User**:
- [ ] MASTER_USER_EMAIL=admin@newvantageco.com
- [ ] MASTER_USER_PASSWORD=(create secure password)
- [ ] MASTER_USER_FIRST_NAME=Admin
- [ ] MASTER_USER_LAST_NAME=User

### Phase 3: Deploy & Verify

- [ ] Trigger deployment (auto or manual)
- [ ] Test health: https://your-app.up.railway.app/api/health
- [ ] Access app: https://your-app.up.railway.app
- [ ] Login with master user

### Phase 4: Database Setup

- [ ] Run: railway run npm run db:push
- [ ] Verify 90+ tables created

### Phase 5: Custom Domain (Optional)

- [ ] Add domain in Railway
- [ ] Configure DNS CNAME
- [ ] Update APP_URL variable

---

## 📚 Full Documentation

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

**Generated**: November 14, 2025
