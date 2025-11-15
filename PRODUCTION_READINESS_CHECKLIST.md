# ILS 2.0 - Production Readiness Checklist
**Complete verification before deploying to production**

---

## ✅ **Pre-Deployment Checklist**

### 🔐 Security & Authentication

#### Environment Variables
- [ ] `SESSION_SECRET` is set to a cryptographically secure random value (32+ bytes)
- [ ] `ADMIN_SETUP_KEY` is set to a strong random value (24+ bytes)
- [ ] `DATABASE_URL` uses strong password (not default)
- [ ] `REDIS_PASSWORD` is set (if using Redis)
- [ ] All `.env` files are in `.gitignore`
- [ ] No secrets committed to git repository

#### API Keys & Credentials
- [ ] Stripe uses **LIVE keys** (sk_live_*, pk_live_*), not test keys
- [ ] Resend API key is valid and quota sufficient
- [ ] OpenAI/Anthropic keys have appropriate rate limits
- [ ] Master user password is 12+ characters (if using MASTER_USER_PASSWORD)

#### Application Security
- [ ] CORS origins properly configured (not wildcard `*`)
- [ ] Rate limiting enabled on API endpoints
- [ ] Helmet security headers configured
- [ ] HTTPS/SSL certificate valid
- [ ] Security headers tested (securityheaders.com)

---

### 🗄️ Database & Data

#### Database Setup
- [ ] PostgreSQL version 15+ installed
- [ ] Database migrations run (`npm run db:push`)
- [ ] Database connection pooling configured
- [ ] Database backup strategy implemented
- [ ] Backup restoration tested successfully

#### Data Integrity
- [ ] Soft delete fields added (deletedAt, deletedBy)
- [ ] Foreign key constraints verified
- [ ] Indexes created on frequently queried columns
- [ ] Data retention policies documented

#### Database Security
- [ ] Database password is strong (20+ characters)
- [ ] Database not exposed to public internet
- [ ] Connection uses SSL/TLS
- [ ] Database user has minimum required permissions

---

### 📦 Application Build

#### Code Quality
- [ ] TypeScript compilation passes (`npm run check`)
- [ ] No console.log statements in production code
- [ ] Error handling implemented for all critical paths
- [ ] All TODO comments addressed or scheduled

#### Tests
- [ ] Integration tests passing (112 test cases)
- [ ] Component tests passing (83/88 minimum)
- [ ] Critical user journeys tested
- [ ] Load testing performed (if expecting high traffic)

#### Build Process
- [ ] Production build successful (`npm run build`)
- [ ] Build artifacts optimized (minified, tree-shaken)
- [ ] Source maps generated (for debugging)
- [ ] Build size reasonable (<10MB for dist/index.js)

---

### 🐳 Docker Configuration

#### Dockerfile
- [ ] Multi-stage build configured
- [ ] Non-root user configured (nodejs:1001)
- [ ] Health check defined
- [ ] Environment variables properly set
- [ ] Build cache optimized

#### Docker Compose
- [ ] PostgreSQL health check working
- [ ] Redis health check working (if using)
- [ ] App depends_on configured correctly
- [ ] Volumes defined for persistence
- [ ] Network isolation configured

#### .dockerignore
- [ ] node_modules excluded
- [ ] .env files excluded
- [ ] test files excluded
- [ ] Documentation excluded
- [ ] .git folder excluded

---

### 🌐 Infrastructure

#### Hosting Platform
- [ ] Domain name registered
- [ ] DNS configured correctly
- [ ] SSL certificate installed and auto-renewing
- [ ] CDN configured (if needed)
- [ ] Load balancer configured (if needed)

#### Compute Resources
- [ ] Sufficient CPU allocated (2+ cores recommended)
- [ ] Sufficient RAM allocated (4GB minimum, 8GB recommended)
- [ ] Disk space adequate (20GB+ recommended)
- [ ] Auto-scaling configured (if on cloud platform)

#### Network
- [ ] Firewall rules configured (only ports 80, 443 exposed)
- [ ] DDoS protection enabled
- [ ] Rate limiting configured
- [ ] Static assets served via CDN (optional)

---

### 📊 Monitoring & Observability

#### Health Checks
- [ ] `/api/health` endpoint responding correctly
- [ ] Health check includes database status
- [ ] Health check includes Redis status (if using)
- [ ] Uptime monitoring configured (UptimeRobot, Pingdom, etc.)

#### Logging
- [ ] Application logs being captured
- [ ] Error logs being captured
- [ ] Log rotation configured
- [ ] Log aggregation service configured (optional: Logtail, Datadog)

#### Metrics
- [ ] Prometheus metrics endpoint working (`/api/metrics`)
- [ ] Key metrics tracked (requests/sec, response time, errors)
- [ ] Dashboards configured (Grafana, Railway dashboard, etc.)
- [ ] Alerts configured for critical errors

#### Error Tracking
- [ ] Sentry (or similar) configured (optional)
- [ ] Error notifications set up
- [ ] Stack traces preserved
- [ ] Source maps uploaded

---

### 📧 External Services

#### Email (Resend)
- [ ] Resend API key valid
- [ ] Domain verified in Resend
- [ ] Email templates tested
- [ ] SPF/DKIM/DMARC configured
- [ ] Sending limits understood

#### Payments (Stripe)
- [ ] Stripe account verified
- [ ] Live API keys configured
- [ ] Webhook endpoint configured
- [ ] Webhook secret set
- [ ] Test transactions successful
- [ ] Refund process tested

#### AI Services (Optional)
- [ ] OpenAI API key has sufficient quota
- [ ] Anthropic API key has sufficient quota
- [ ] Rate limits understood
- [ ] Fallback strategy for API failures

---

### 📋 Documentation

#### Internal Documentation
- [ ] README.md updated with accurate information
- [ ] API documentation current
- [ ] Architecture diagrams created
- [ ] Database schema documented
- [ ] Deployment process documented

#### User Documentation
- [ ] User guide created (if applicable)
- [ ] Admin guide created
- [ ] API reference published (if public API)
- [ ] Changelog maintained

#### Operations
- [ ] Runbook created for common issues
- [ ] Incident response plan documented
- [ ] Contact list maintained (oncall, escalation)
- [ ] Disaster recovery plan tested

---

### 🚀 Deployment Process

#### Pre-Deployment
- [ ] Code review completed
- [ ] QA testing completed
- [ ] Staging environment tested
- [ ] Database backup taken
- [ ] Rollback plan documented

#### Deployment Steps
- [ ] Blue-green deployment configured (or rolling update)
- [ ] Zero-downtime deployment possible
- [ ] Database migrations run before app deployment
- [ ] Cache invalidation strategy in place

#### Post-Deployment
- [ ] Health check passing
- [ ] Critical user journeys tested in production
- [ ] Error rate monitored (< 0.1% expected)
- [ ] Performance metrics within acceptable range
- [ ] Team notified of deployment

---

### ✅ Compliance & Legal

#### Data Protection
- [ ] GDPR compliance reviewed (if serving EU users)
- [ ] Data retention policies implemented
- [ ] Privacy policy published
- [ ] Cookie consent implemented (if applicable)
- [ ] Data processing agreements signed

#### Healthcare Compliance (for optical industry)
- [ ] HIPAA compliance reviewed (if in US)
- [ ] Patient data encrypted at rest
- [ ] Patient data encrypted in transit
- [ ] Access controls implemented
- [ ] Audit logging enabled

#### Legal
- [ ] Terms of service published
- [ ] Acceptable use policy published
- [ ] Licenses verified (all dependencies)
- [ ] Copyright notices present

---

## 🎯 **Critical Path Items** (Must Complete)

These items are **CRITICAL** and must be completed before production deployment:

1. **🔴 CRITICAL: Change all default passwords**
   - Database password
   - Redis password
   - SESSION_SECRET
   - ADMIN_SETUP_KEY

2. **🔴 CRITICAL: Use production API keys**
   - Stripe: sk_live_* (not sk_test_*)
   - Email: Production Resend key
   - AI: Production quotas configured

3. **🔴 CRITICAL: Database backup**
   - Automated backups configured
   - Restoration tested successfully
   - Backup retention policy set

4. **🔴 CRITICAL: SSL/HTTPS**
   - Valid SSL certificate installed
   - HTTP redirects to HTTPS
   - HSTS header configured

5. **🔴 CRITICAL: Error monitoring**
   - Uptime monitoring active
   - Error alerting configured
   - On-call rotation established

---

## 📊 **Verification Commands**

Run these commands to verify production readiness:

### 1. Environment Variables
```bash
# Verify required vars are set
node -e "const required = ['DATABASE_URL', 'SESSION_SECRET', 'NODE_ENV']; required.forEach(v => { if (!process.env[v]) console.error('❌ Missing:', v); else console.log('✅', v); })"
```

### 2. Database Connection
```bash
# Test database connectivity
npm run db:push
```

### 3. Build Process
```bash
# Verify production build works
npm run build
ls -lh dist/index.js  # Should be ~3-5MB
```

### 4. Docker Build
```bash
# Test Docker image builds
docker build -t ils-test .

# Run container
docker run --rm -p 5000:5000 \
  -e DATABASE_URL=$DATABASE_URL \
  -e SESSION_SECRET=test_secret \
  ils-test

# Test health endpoint
curl http://localhost:5000/api/health
```

### 5. Security Headers
```bash
# Check security headers
curl -I https://your-domain.com | grep -E "(Strict-Transport-Security|X-Frame-Options|X-Content-Type)"
```

### 6. SSL Certificate
```bash
# Verify SSL is valid
curl -vI https://your-domain.com 2>&1 | grep -E "(SSL|certificate)"

# OR use online tool
# https://www.ssllabs.com/ssltest/
```

### 7. Load Test (Optional)
```bash
# Install k6 or Apache Bench
# Test with 100 concurrent users
ab -n 1000 -c 100 https://your-domain.com/api/health
```

---

## 🔧 **Common Issues & Solutions**

### Issue: "Database connection failed"
**Solution:**
```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Test connection manually
psql $DATABASE_URL -c "SELECT 1"

# Check if database is reachable
pg_isready -d $DATABASE_URL
```

### Issue: "Port already in use"
**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# OR change port in environment
export PORT=8000
```

### Issue: "Module not found" errors
**Solution:**
```bash
# Rebuild dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild Docker image
docker-compose build --no-cache
```

### Issue: "Health check failing"
**Solution:**
```bash
# Check app logs
docker-compose logs app

# Test health endpoint manually
curl http://localhost:5000/api/health

# Check if database/redis are healthy
docker-compose ps
```

---

## 📅 **Go-Live Schedule**

### 1 Week Before
- [ ] Complete all security checklist items
- [ ] Run full test suite
- [ ] Perform load testing
- [ ] Brief team on deployment plan

### 3 Days Before
- [ ] Deploy to staging
- [ ] Run smoke tests on staging
- [ ] Verify all integrations (Stripe, email, etc.)
- [ ] Prepare rollback plan

### 1 Day Before
- [ ] Final code freeze
- [ ] Backup production database (if upgrading)
- [ ] Verify SSL certificate
- [ ] Test monitoring and alerts

### Deployment Day
- [ ] Deploy during low-traffic window
- [ ] Monitor error rates
- [ ] Test critical user journeys
- [ ] Announce deployment to users (if needed)

### Post-Deployment
- [ ] Monitor for 24 hours
- [ ] Address any issues immediately
- [ ] Document any problems encountered
- [ ] Conduct post-mortem (if issues occurred)

---

## ✅ **Final Sign-Off**

**I certify that:**
- [ ] All critical checklist items are complete
- [ ] All verification commands pass successfully
- [ ] Team is briefed and ready for go-live
- [ ] Rollback plan is documented and tested
- [ ] Monitoring and alerts are configured

**Signed:** ___________________
**Date:** ___________________
**Role:** ___________________

---

**Status:** 🟢 Ready for Production
**Last Updated:** November 15, 2025
