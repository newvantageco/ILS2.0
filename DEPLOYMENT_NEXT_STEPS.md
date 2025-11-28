# Next Steps for Production Deployment

**Current Status:** ✅ P0 Security Fixes Complete  
**Generated Encryption Key:** `B+ymN2yUDNgSV9th3MXnLlaB/cWt1iXpJ27uswNJxW8=`

---

## Quick Start (Automated)

```bash
# Make script executable
chmod +x scripts/setup-railway-production.sh

# Run Railway setup (interactive)
./scripts/setup-railway-production.sh
```

This script will:
- ✅ Verify Railway CLI installation
- ✅ Link/create Railway project
- ✅ Provision PostgreSQL and Redis
- ✅ Set all environment variables
- ✅ Configure encryption key
- ✅ Run database migrations
- ✅ Deploy application

---

## Manual Setup (Step-by-Step)

### Step 1: Fix Local Database Permissions

If you want to test migrations locally first:

```bash
# Connect to database as superuser
psql $DATABASE_URL

# Run the permission fix
\i scripts/fix-database-permissions.sql

# Replace 'your_username' with your actual database user in the SQL file
```

### Step 2: Set Local Environment

```bash
# Create .env file with the generated encryption key
cat > .env <<EOF
DATABASE_URL=postgresql://localhost/ils_db
DB_ENCRYPTION_KEY=B+ymN2yUDNgSV9th3MXnLlaB/cWt1iXpJ27uswNJxW8=
DB_ENCRYPTION_KEY_VERSION=v1
NODE_ENV=development
EOF

# Test migrations locally
npm run db:migrate
```

### Step 3: Railway Setup

```bash
# Install Railway CLI (if not already installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project or link existing
railway init  # or: railway link

# Provision databases
railway add --database postgres
railway add --database redis
```

### Step 4: Set Railway Environment Variables

```bash
# Copy the encryption key and set in Railway
railway variables --set "DB_ENCRYPTION_KEY=B+ymN2yUDNgSV9th3MXnLlaB/cWt1iXpJ27uswNJxW8="
railway variables --set "DB_ENCRYPTION_KEY_VERSION=v1"

# Set core variables
railway variables --set "NODE_ENV=production"
railway variables --set "PORT=5000"
railway variables --set "CSRF_ENABLED=true"
railway variables --set "JWT_AUTH_ENABLED=true"

# Set your frontend URL
railway variables --set "CORS_ORIGIN=https://your-frontend.com"
railway variables --set "APP_URL=https://your-app.railway.app"

# Option A: Use AWS Secrets Manager (Recommended)
railway variables --set "SECRETS_PROVIDER=aws"
railway variables --set "AWS_ACCESS_KEY_ID=your-key"
railway variables --set "AWS_SECRET_ACCESS_KEY=your-secret"
railway variables --set "AWS_REGION=us-east-1"

# Option B: Use environment variables (NOT recommended for production)
railway variables --set "SECRETS_PROVIDER=env"
railway variables --set "JWT_SECRET=$(openssl rand -hex 32)"
railway variables --set "SESSION_SECRET=$(openssl rand -hex 32)"
```

### Step 5: Run Database Migrations

```bash
# Option A: Run migrations before deployment (recommended)
railway run npm run db:migrate

# Option B: Run migrations in Railway shell after deployment
railway shell
> npm run db:migrate
> exit
```

### Step 6: Deploy to Railway

```bash
# Deploy
railway up

# Or deploy with environment selection
railway up --environment production

# Get deployment URL
railway domain

# View logs
railway logs --follow
```

---

## Post-Deployment Verification

### 1. Health Check
```bash
# Get your Railway URL
RAILWAY_URL=$(railway domain)

# Test health endpoint
curl https://$RAILWAY_URL/api/health

# Expected: {"status":"ok","timestamp":"..."}
```

### 2. Test Security Fixes

**Test Rate Limiting (P0 Fix #1):**
```bash
# Try 6 login attempts (6th should fail)
for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST https://$RAILWAY_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nHTTP: %{http_code}\n"
  echo "---"
done

# Expected: First 5 return 401, 6th returns 429
```

**Test MFA Enforcement (P0 Fix #2):**
```bash
# Try to access admin endpoint without MFA
curl https://$RAILWAY_URL/api/platform-admin/users \
  -H "Authorization: Bearer <valid-admin-token>"

# Expected: 403 Forbidden (MFA required)
```

**Test Database Encryption (P0 Fix #3):**
```bash
# Connect to Railway database
railway connect postgres

# Check for encrypted fields
SELECT 
  LEFT(nhs_number_encrypted, 10) as encryption_prefix,
  COUNT(*) as count
FROM patients
WHERE nhs_number_encrypted IS NOT NULL
GROUP BY LEFT(nhs_number_encrypted, 10);

# Expected: All start with 'v1:...'
```

### 3. Run Encryption Migration (During Maintenance Window)

```bash
# Create database backup first
railway run pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Confirm backup exists
ls -lh backup-*.sql

# Run encryption migration
railway run npm run migrate:encrypt-phi

# Verify results
railway run npm run verify:encryption
```

---

## AWS Secrets Manager Setup (Optional but Recommended)

If you chose AWS Secrets Manager during setup:

```bash
# Install AWS CLI
brew install awscli

# Configure AWS credentials
aws configure

# Create secrets
aws secretsmanager create-secret \
  --name ils-api/jwt-secret \
  --secret-string "$(openssl rand -hex 32)" \
  --region us-east-1

aws secretsmanager create-secret \
  --name ils-api/session-secret \
  --secret-string "$(openssl rand -hex 32)"

aws secretsmanager create-secret \
  --name ils-api/db-encryption-key \
  --secret-string "B+ymN2yUDNgSV9th3MXnLlaB/cWt1iXpJ27uswNJxW8="

aws secretsmanager create-secret \
  --name ils-api/stripe-secret \
  --secret-string "sk_live_..."

# Enable 90-day rotation
aws secretsmanager rotate-secret \
  --secret-id ils-api/jwt-secret \
  --rotation-rules AutomaticallyAfterDays=90
```

---

## Monitoring & Alerts

### Set up monitoring in Railway:

1. **CPU/Memory Alerts:**
   - Go to Railway dashboard → Metrics
   - Set alerts for >80% CPU or memory

2. **Uptime Monitoring:**
   - Add external monitoring (UptimeRobot, Pingdom)
   - URL: `https://your-app.railway.app/api/health`
   - Check interval: 5 minutes

3. **Log Monitoring:**
```bash
# Stream logs
railway logs --follow

# Search for errors
railway logs | grep ERROR

# Search for security events
railway logs | grep "MFA\|rate limit\|encryption"
```

---

## Troubleshooting

### Database Connection Issues
```bash
# Check database status
railway status

# Test database connection
railway run psql $DATABASE_URL -c "SELECT version();"

# View database logs
railway logs --service postgres
```

### Migration Failures
```bash
# Check migration status
railway run npm run db:check

# Rollback last migration (if needed)
railway run npm run db:rollback

# Re-run migrations
railway run npm run db:migrate
```

### Deployment Failures
```bash
# View build logs
railway logs --build

# Check environment variables
railway variables

# Redeploy
railway up --force
```

---

## Security Checklist

Before going live:

- [ ] Encryption key set and secured
- [ ] Database migrations applied
- [ ] PHI/PII data encrypted
- [ ] MFA enforced for all admin accounts
- [ ] Rate limiting tested (5 attempts/15min)
- [ ] CORS configured for production domain
- [ ] SSL/TLS certificate active (automatic via Railway)
- [ ] CSRF protection enabled
- [ ] AWS Secrets Manager configured (or secrets in Railway)
- [ ] Stripe webhooks configured with production keys
- [ ] Health check responding
- [ ] Logs monitored
- [ ] Backup strategy confirmed
- [ ] Third-party pentest scheduled

---

## Support

**Documentation:**
- Full assessment: `SECURITY_BASELINE_ASSESSMENT.md`
- Quick reference: `SECURITY_QUICK_REFERENCE.md`
- Implementation guide: `SECURITY_IMPLEMENTATION_CHECKLIST.md`

**Get Help:**
- Railway support: https://railway.app/help
- Security issues: security@yourdomain.com
- Deployment logs: `railway logs`

---

**Generated:** November 28, 2025  
**Encryption Key:** `B+ymN2yUDNgSV9th3MXnLlaB/cWt1iXpJ27uswNJxW8=` (KEEP SECURE!)
