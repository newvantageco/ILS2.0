# 🐳 Docker Quickstart Guide - ILS 2.0

**Last Updated:** November 21, 2025  
**Status:** ✅ Ready for local development

---

## ⚡ Super Quick Start (2 Minutes)

```bash
# 1. Generate secrets and create .env
cp .env.example .env
echo "SESSION_SECRET=$(openssl rand -hex 32)" >> .env
echo "INTEGRATION_ENCRYPTION_KEY=$(openssl rand -hex 32)" >> .env
echo "DATABASE_URL=postgresql://postgres:postgres@db:5432/ils_db" >> .env

# 2. Start everything
docker-compose up -d

# 3. Wait for startup (30 seconds)
sleep 30

# 4. Run migrations
docker-compose exec app npm run db:push

# 5. Verify it works
curl http://localhost:5000/api/health

# 6. Access the app
open http://localhost:5000
```

**Done!** Your ILS 2.0 is running.

---

## 📋 What You Get

When you run `docker-compose up -d`, you get:

- **PostgreSQL 16** - Database on port 5432
- **Redis 7** - Cache/sessions on port 6379  
- **ILS App** - Web application on port 5000
- **Health Checks** - Automatic monitoring
- **Auto-restart** - Containers restart on failure

---

## 🔐 Required Environment Variables

### Minimum for Docker Development

```bash
# Core (REQUIRED)
SESSION_SECRET=<generated-32-byte-hex>
DATABASE_URL=postgresql://postgres:postgres@db:5432/ils_db

# Security (REQUIRED for production features)
INTEGRATION_ENCRYPTION_KEY=<generated-32-byte-hex>

# Optional but recommended
CONFIG_ENCRYPTION_KEY=<generated-32-byte-hex>
CSRF_SECRET=<generated-32-byte-hex>
```

### Generate All Secrets at Once

```bash
cat >> .env << EOF
SESSION_SECRET=$(openssl rand -hex 32)
INTEGRATION_ENCRYPTION_KEY=$(openssl rand -hex 32)
CONFIG_ENCRYPTION_KEY=$(openssl rand -hex 32)
CSRF_SECRET=$(openssl rand -hex 32)
DATABASE_URL=postgresql://postgres:postgres@db:5432/ils_db
NODE_ENV=development
EOF
```

---

## 🧪 Validate Security Fixes

Run the automated security test suite:

```bash
./scripts/docker-security-test.sh
```

This tests:
- ✅ Path traversal protection
- ✅ Admin route authentication
- ✅ No hardcoded secrets
- ✅ Database connectivity
- ✅ Health checks

---

## 📝 Common Commands

### Start Environment
```bash
docker-compose up -d
```

### View Logs
```bash
# All services
docker-compose logs -f

# Just the app
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app
```

### Stop Environment
```bash
docker-compose down
```

### Restart After Code Changes
```bash
docker-compose restart app
```

### Rebuild After Package Changes
```bash
docker-compose build app
docker-compose up -d
```

### Database Operations
```bash
# Run migrations
docker-compose exec app npm run db:push

# Access database
docker-compose exec db psql -U postgres -d ils_db

# Backup database
docker-compose exec db pg_dump -U postgres ils_db > backup.sql
```

### Execute Commands in Container
```bash
# Run TypeScript check
docker-compose exec app npm run check

# Run tests
docker-compose exec app npm run test

# Open shell
docker-compose exec app /bin/bash
```

---

## 🔍 Troubleshooting

### Application Won't Start

**Problem:** Container exits immediately

```bash
# Check logs for errors
docker-compose logs app

# Common issues:
# - Missing SESSION_SECRET
# - Database not ready
# - Port 5000 already in use
```

**Fix:**
```bash
# Ensure secrets are set
grep SESSION_SECRET .env

# Check if port is in use
lsof -i :5000

# Kill existing process
kill -9 $(lsof -t -i:5000)
```

### Database Connection Fails

**Problem:** "Cannot connect to database"

```bash
# Check database is running
docker-compose ps

# Verify DATABASE_URL is correct
grep DATABASE_URL .env

# Expected: postgresql://postgres:postgres@db:5432/ils_db
```

**Fix:**
```bash
# Restart database
docker-compose restart db

# Wait 10 seconds
sleep 10

# Restart app
docker-compose restart app
```

### Hardcoded Secret Warnings

**Problem:** Seeing warnings about development secrets

```
⚠️  WARNING: Using development-only CSRF secret. Set CSRF_SECRET in production!
```

**This is NORMAL in development mode.**

To remove warnings:
```bash
# Add all recommended secrets
echo "CSRF_SECRET=$(openssl rand -hex 32)" >> .env
echo "CONFIG_ENCRYPTION_KEY=$(openssl rand -hex 32)" >> .env

# Restart
docker-compose restart app
```

### Port Already in Use

**Problem:** "port is already allocated"

```bash
# Find process using port 5000
lsof -i :5000

# Kill it
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "5001:5000"  # Use 5001 instead
```

---

## 🎯 Development Workflow

### 1. Make Code Changes
Edit files locally. Changes sync to container via volumes.

### 2. Restart Application
```bash
docker-compose restart app
```

### 3. View Logs
```bash
docker-compose logs -f app
```

### 4. Test Changes
```bash
curl http://localhost:5000/api/health
```

### 5. Run Tests
```bash
docker-compose exec app npm run test
```

---

## 🏗️ Production Deployment

**Do NOT use `docker-compose.yml` for production!**

Use one of these instead:

### Option 1: Railway (Recommended)
```bash
railway init
railway add --database postgres
railway add --database redis
railway variables set SESSION_SECRET=$(openssl rand -hex 32)
railway variables set INTEGRATION_ENCRYPTION_KEY=$(openssl rand -hex 32)
railway up
```

### Option 2: Production Docker
Use the production-ready `Dockerfile`:

```bash
# Build
docker build -t ils-app:latest .

# Run with production environment
docker run -p 5000:5000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=$DATABASE_URL \
  -e SESSION_SECRET=$SESSION_SECRET \
  -e INTEGRATION_ENCRYPTION_KEY=$INTEGRATION_ENCRYPTION_KEY \
  ils-app:latest
```

---

## 📊 Health Monitoring

### Check Application Health
```bash
curl http://localhost:5000/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-21T07:36:00.000Z"
}
```

### Check Docker Container Health
```bash
docker-compose ps

# Look for "healthy" status
```

### View Metrics
```bash
curl http://localhost:5000/api/metrics
```

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] All secrets generated with `openssl rand -hex 32`
- [ ] `SESSION_SECRET` set and unique
- [ ] `INTEGRATION_ENCRYPTION_KEY` set  
- [ ] `DATABASE_URL` points to production database
- [ ] `NODE_ENV=production`
- [ ] CORS origins configured (not wildcard)
- [ ] SSL/TLS enabled
- [ ] Run `./scripts/docker-security-test.sh` and all tests pass

---

## 📚 Additional Resources

- **Full Documentation:** `README.md`
- **Security Fixes:** `SECURITY_FIXES_APPLIED.md`
- **Environment Variables:** `.env.example`
- **Docker Configuration:** `docker-compose.yml`
- **Production Dockerfile:** `Dockerfile`

---

## 🆘 Getting Help

### Check Logs First
```bash
docker-compose logs --tail=100 app
```

### Common Log Patterns

**Success:**
```
Server starting...
Database connected successfully
Server running on port 5000
```

**Missing Secret:**
```
Error: INTEGRATION_ENCRYPTION_KEY must be set in production environment
```

**Database Not Ready:**
```
Error: Connection refused - connect ECONNREFUSED db:5432
```

**Fix:** Wait 10-15 seconds and retry

---

## ✅ Success Indicators

Your environment is working when:

1. ✅ `docker-compose ps` shows all containers "Up" and "healthy"
2. ✅ `curl http://localhost:5000/api/health` returns 200 OK
3. ✅ No error messages in `docker-compose logs app`
4. ✅ Can access http://localhost:5000 in browser
5. ✅ `./scripts/docker-security-test.sh` passes all tests

---

**🎉 Happy developing!**

For questions or issues, check the logs and refer to `SECURITY_FIXES_APPLIED.md` for recent changes.
