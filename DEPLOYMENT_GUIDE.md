# 🚀 ILS 2.0 Deployment Guide

**UK NHS Transformation - Production Deployment**

This guide covers deploying ILS 2.0 with all NHS integration, Contact Lens Management, AI Assistant, and modern UI features.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Service Configuration](#service-configuration)
5. [Deployment Steps](#deployment-steps)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### System Requirements
- **Node.js**: v18+ (LTS recommended)
- **PostgreSQL**: v14+ with pgvector extension
- **Redis**: v7+ (for caching and sessions)
- **Memory**: Minimum 4GB RAM (8GB+ recommended)
- **Storage**: 20GB+ SSD

### Required API Keys
- **OpenAI API Key**: GPT-4 Turbo access required
  - Features: Face Analysis, AI Assistant, Lens Recommendations
  - Cost: ~$0.01 per GPT-4 Turbo request
  - Get key: https://platform.openai.com/api-keys

### Optional Services
- **Email Service** (SendGrid/AWS SES): For NHS notifications
- **SMS Service** (Twilio): For appointment reminders
- **CDN** (CloudFlare): For static assets
- **Monitoring** (Sentry/DataDog): For error tracking

---

## Environment Setup

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd ILS2.0

# Install dependencies
npm install

# Or using pnpm (recommended for speed)
pnpm install
```

### 2. Environment Variables

Create `.env` file in project root:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ils2_production"

# OpenAI (REQUIRED for AI features)
OPENAI_API_KEY="sk-..."

# Session Secret
SESSION_SECRET="your-secure-random-string-min-32-chars"

# Application
NODE_ENV="production"
PORT="5000"

# Frontend URL
VITE_API_URL="https://your-domain.com"

# Optional: Email Service (for NHS notifications)
SENDGRID_API_KEY="SG...."
EMAIL_FROM="noreply@your-practice.com"

# Optional: SMS Service (for CL aftercare reminders)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+44..."

# Optional: Monitoring
SENTRY_DSN="https://..."

# Optional: File Storage (for face photos, documents)
AWS_S3_BUCKET="ils-uploads"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="eu-west-2"  # UK region
```

### 3. Build Application

```bash
# Build frontend and backend
npm run build

# Verify build output
ls -la dist/
```

---

## Database Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ils2_production;

# Create user (if needed)
CREATE USER ils_user WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE ils2_production TO ils_user;
```

### 2. Enable Required Extensions

```sql
-- Connect to your database
\c ils2_production

-- Enable pgvector (for AI embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 3. Run Migrations

```bash
# Generate migration from schema
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

### 4. Verify Tables

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should include:
-- - contact_lens_assessments
-- - contact_lens_fittings
-- - contact_lens_prescriptions
-- - contact_lens_aftercare
-- - contact_lens_inventory
-- - contact_lens_orders
-- - nhs_practitioners
-- - nhs_contract_details
-- - nhs_claims
-- - nhs_vouchers
-- - nhs_patient_exemptions
-- - nhs_payments
-- - patient_face_analysis
-- - frame_characteristics
-- - frame_recommendations
-- - frame_recommendation_analytics
-- + all existing ILS tables
```

---

## Service Configuration

### 1. NHS Integration Setup

#### GOC Practitioner Registration

```sql
-- Add NHS-registered practitioners
INSERT INTO nhs_practitioners (
  company_id,
  user_id,
  goc_number,
  goc_expiry_date,
  full_name,
  is_active
) VALUES (
  'your-company-id',
  'practitioner-user-id',
  '12345',  -- GOC registration number
  '2025-12-31',
  'Dr. Jane Smith',
  true
);
```

#### NHS Contract Details

```sql
-- Add practice NHS contract
INSERT INTO nhs_contract_details (
  company_id,
  contractor_name,
  contractor_number,
  contract_start_date,
  practice_address,
  is_active
) VALUES (
  'your-company-id',
  'Your Practice Name',
  'NHS-12345',
  '2024-01-01',
  '123 High Street, London, UK',
  true
);
```

### 2. AI Configuration

The AI features are pre-configured but require the OpenAI API key.

**Features enabled:**
- ✅ Face shape analysis (Smart Frame Finder)
- ✅ Frame recommendations
- ✅ Ophthalmic AI Assistant
- ✅ Lens recommendations
- ✅ Contact lens recommendations
- ✅ Prescription explanations
- ✅ NHS guidance
- ✅ Business insights

**Cost optimization:**
- Responses are cached for identical queries
- Temperature set to 0.6-0.7 for consistent results
- Max tokens limited to prevent excessive usage
- Structured JSON responses for reliability

### 3. Contact Lens Inventory Setup

```sql
-- Example: Add trial lenses to inventory
INSERT INTO contact_lens_inventory (
  company_id,
  brand,
  product_name,
  lens_type,
  design,
  replacement_schedule,
  base_curve,
  diameter,
  power,
  quantity_in_stock,
  reorder_level,
  is_trial_lens
) VALUES (
  'your-company-id',
  'Acuvue',
  'Acuvue Oasys',
  'soft',
  'spherical',
  'two_weekly',
  8.4,
  14.0,
  -2.00,
  20,
  5,
  true
);
```

---

## Deployment Steps

### Option 1: Traditional Server (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start dist/index.js --name ils2-production

# Enable auto-restart on system boot
pm2 startup
pm2 save

# Monitor
pm2 monit

# View logs
pm2 logs ils2-production
```

### Option 2: Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY dist ./dist
COPY public ./public

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "dist/index.js"]
```

```bash
# Build image
docker build -t ils2-production .

# Run container
docker run -d \
  --name ils2 \
  -p 5000:5000 \
  --env-file .env \
  --restart unless-stopped \
  ils2-production
```

### Option 3: Platform Deployment (Render/Railway/Fly.io)

**Render.com Example:**

1. Connect GitHub repository
2. Create new Web Service
3. Build command: `npm run build`
4. Start command: `node dist/index.js`
5. Add environment variables from `.env`
6. Deploy

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# Check server is running
curl https://your-domain.com/api/health

# Expected response:
# {"status": "ok", "timestamp": "..."}
```

### 2. Verify API Endpoints

```bash
# Test authentication
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Test NHS endpoints (with auth token)
curl https://your-domain.com/api/nhs/claims \
  -H "Authorization: Bearer <token>"

# Test Contact Lens endpoints
curl https://your-domain.com/api/contact-lens/inventory/low-stock \
  -H "Authorization: Bearer <token>"

# Test AI endpoints
curl -X POST https://your-domain.com/api/ophthalmic-ai/query \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"question":"What are the benefits of progressive lenses?"}'
```

### 3. Test Critical Features

- [ ] User authentication & authorization
- [ ] Patient creation and search
- [ ] Prescription creation
- [ ] NHS exemption checking
- [ ] Contact lens assessment
- [ ] AI Assistant queries
- [ ] Face analysis upload
- [ ] Inventory management
- [ ] Report generation

### 4. Performance Checks

```bash
# Check response times
ab -n 100 -c 10 https://your-domain.com/api/stats

# Monitor database connections
psql -U postgres -d ils2_production -c "SELECT count(*) FROM pg_stat_activity;"

# Check memory usage
free -h
```

---

## Monitoring & Maintenance

### 1. Logging

```bash
# PM2 logs
pm2 logs ils2-production --lines 100

# Docker logs
docker logs -f ils2

# Application logs location
tail -f logs/app.log
tail -f logs/error.log
```

### 2. Database Maintenance

```sql
-- Vacuum database weekly
VACUUM ANALYZE;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Archive old data (example: NHS claims older than 7 years)
CREATE TABLE nhs_claims_archive AS
SELECT * FROM nhs_claims
WHERE claim_date < NOW() - INTERVAL '7 years';

DELETE FROM nhs_claims
WHERE claim_date < NOW() - INTERVAL '7 years';
```

### 3. Backup Strategy

```bash
# Daily database backup
pg_dump -U postgres ils2_production | gzip > backup_$(date +%Y%m%d).sql.gz

# Automated backup script (cron)
0 2 * * * /usr/local/bin/backup_ils.sh

# Backup script example:
#!/bin/bash
BACKUP_DIR="/backups/ils2"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres ils2_production | gzip > "$BACKUP_DIR/ils2_$DATE.sql.gz"
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete  # Keep 30 days
```

### 4. Monitoring Checklist

- [ ] **Uptime**: 99.9% target
- [ ] **Response time**: <500ms average
- [ ] **Error rate**: <0.1%
- [ ] **Database connections**: <80% of max
- [ ] **Disk space**: >20% free
- [ ] **Memory usage**: <80%
- [ ] **CPU usage**: <70% average
- [ ] **SSL certificate**: Valid and auto-renewing
- [ ] **Backups**: Daily, tested monthly
- [ ] **OpenAI API**: Monitor usage and costs

### 5. Cost Monitoring

**OpenAI API Usage:**
- Track monthly spend: https://platform.openai.com/usage
- Set spending limits in OpenAI dashboard
- Expected costs: ~£50-200/month for 1000-5000 AI queries

**Infrastructure Costs (example):**
- Server: £20-50/month (2GB-4GB VPS)
- Database: £15-30/month (managed PostgreSQL)
- CDN: £5-10/month (CloudFlare)
- Total: £40-90/month

---

## Security Checklist

- [ ] HTTPS enabled (SSL certificate)
- [ ] Environment variables secured (not in code)
- [ ] Database backups encrypted
- [ ] Strong session secret (32+ characters)
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] SQL injection protection (Drizzle ORM parameterized queries)
- [ ] XSS protection (React escapes by default)
- [ ] CSRF tokens for mutations
- [ ] GOC practitioner verification
- [ ] NHS data encryption at rest
- [ ] GDPR compliance (patient data)
- [ ] Audit logging enabled
- [ ] Regular security updates

---

## Troubleshooting

### Issue: OpenAI API errors

```
Error: OpenAI API key not configured
```

**Solution:**
```bash
# Add to .env
OPENAI_API_KEY="sk-..."

# Restart application
pm2 restart ils2-production
```

### Issue: Database connection failed

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check DATABASE_URL in .env
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Issue: Face analysis uploads failing

```
Error: Failed to upload face photo
```

**Solution:**
```bash
# Check upload directory exists and is writable
mkdir -p uploads/face-analysis
chmod 755 uploads/face-analysis

# Or configure S3 storage
# AWS_S3_BUCKET=...
```

### Issue: NHS claims not submitting

```
Error: GOC registration expired
```

**Solution:**
```sql
-- Update practitioner GOC expiry
UPDATE nhs_practitioners
SET goc_expiry_date = '2026-12-31'
WHERE goc_number = '12345';
```

---

## Support & Resources

- **Documentation**: `/docs` folder
- **API Documentation**: `API_DOCUMENTATION.md`
- **Feature Summary**: `FEATURES_SUMMARY.md`
- **Master Plan**: `UK_NHS_TRANSFORMATION_MASTER_PLAN.md`

---

## Next Steps

1. ✅ Deploy to production
2. ✅ Configure NHS integration
3. ✅ Import practitioner GOC numbers
4. ✅ Set up contact lens inventory
5. ✅ Train staff on AI Assistant features
6. ✅ Configure automated backups
7. ✅ Set up monitoring alerts
8. 📱 Future: Build Shopify plugin (Phase 4)
9. 📱 Future: Mobile app
10. 📱 Future: Patient portal

---

**Congratulations! Your practice now has a world-class, AI-powered, NHS-integrated optical management system.** 🎉
