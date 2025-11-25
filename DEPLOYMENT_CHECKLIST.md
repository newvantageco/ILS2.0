# ✅ Production Deployment Checklist
## ILS 2.0 - Railway Deployment

Use this checklist to ensure all steps are completed before and after production deployment.

---

## 🔴 CRITICAL - MUST DO BEFORE DEPLOYMENT

### 1. Fix Code Issues
- [ ] Fix all 79+ TypeScript errors in test files
- [ ] Run `npm run check` - must pass with 0 errors
- [ ] Run `npm run test:unit` - all tests must pass
- [ ] Run `npm run test:integration` - all tests must pass
- [ ] Update vulnerable packages: `npm audit fix`

### 2. Enable Security Features
- [ ] Add CSRF middleware to `server/index.ts`:
  ```typescript
  import { csrfProtection } from './middleware/csrfProtection';
  app.use(csrfProtection);
  ```
- [ ] Verify HTTPS enforcement is enabled (default in production)
- [ ] Verify rate limiting is active
- [ ] Review CORS configuration - no wildcards in production

---

## 🔧 RAILWAY CONFIGURATION

### 3. Environment Variables

#### Critical Variables (Application Won't Start Without These)
- [ ] `DATABASE_URL` (auto-provided by Railway Postgres addon)
- [ ] `SESSION_SECRET` - Generate: `openssl rand -hex 32`
- [ ] `CORS_ORIGIN` - Set to: `https://yourdomain.com`

#### Google OAuth
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] Add production redirect URI in Google Console:
  - `https://yourdomain.com/api/auth/google/callback`

#### Stripe Payment Processing
- [ ] `STRIPE_SECRET_KEY` (use LIVE key: `sk_live_xxx`)
- [ ] `STRIPE_PUBLISHABLE_KEY` (use LIVE key: `pk_live_xxx`)
- [ ] `STRIPE_WEBHOOK_SECRET` (from Stripe Dashboard)

#### Stripe Price IDs (Create in Stripe Dashboard)
- [ ] `STRIPE_PRICE_STARTER_MONTHLY`
- [ ] `STRIPE_PRICE_STARTER_YEARLY`
- [ ] `STRIPE_PRICE_PRO_MONTHLY`
- [ ] `STRIPE_PRICE_PRO_YEARLY`
- [ ] `STRIPE_PRICE_ENTERPRISE_MONTHLY`
- [ ] `STRIPE_PRICE_ENTERPRISE_YEARLY`

#### Email Service
- [ ] `RESEND_API_KEY`
- [ ] `MAIL_FROM` (e.g., `hello@yourdomain.com`)
- [ ] Verify domain in Resend dashboard

#### Optional but Recommended
- [ ] `REDIS_URL` (auto-provided by Railway Redis addon)
- [ ] `SENTRY_DSN` (error tracking)
- [ ] `POSTHOG_API_KEY` (analytics)
- [ ] `LOG_LEVEL=info`
- [ ] `METRICS_ENABLED=true`

---

## 🗄️ DATABASE SETUP

### 4. Railway Postgres
- [ ] Add Railway Postgres addon to project
- [ ] Verify `DATABASE_URL` is set automatically
- [ ] Test connection locally (optional):
  ```bash
  psql $DATABASE_URL
  ```

### 5. Migrations
- [ ] Migrations run automatically on startup via `docker-start.sh`
- [ ] Monitor first deployment logs for migration success
- [ ] Verify health check passes after migrations

---

## 🔌 THIRD-PARTY INTEGRATIONS

### 6. Google OAuth Setup
- [ ] Create OAuth 2.0 credentials in Google Cloud Console
- [ ] Add authorized JavaScript origins:
  - `https://yourdomain.com`
- [ ] Add authorized redirect URIs:
  - `https://yourdomain.com/api/auth/google/callback`
- [ ] Copy Client ID and Secret to Railway variables

### 7. Stripe Setup
- [ ] Switch Stripe account to LIVE mode
- [ ] Create 3 products in Stripe Dashboard:
  - Starter Plan
  - Professional Plan
  - Enterprise Plan
- [ ] For each product, create monthly and yearly prices
- [ ] Copy all 6 price IDs to Railway variables
- [ ] Set up webhook endpoint:
  - URL: `https://yourdomain.com/api/payments/webhook`
  - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] Copy webhook secret to Railway variables

### 8. Resend Email Setup
- [ ] Create Resend account
- [ ] Add and verify sending domain
- [ ] Generate API key
- [ ] Copy API key to Railway variables
- [ ] Test email delivery

---

## 📊 MONITORING SETUP

### 9. Error Tracking (Sentry)
- [ ] Create Sentry project
- [ ] Copy DSN to Railway variables
- [ ] Deploy and trigger test error
- [ ] Verify error appears in Sentry dashboard

### 10. Uptime Monitoring
- [ ] Set up external uptime monitor (UptimeRobot, Pingdom)
- [ ] Monitor: `https://yourdomain.com/health`
- [ ] Configure alerts (email, Slack)

### 11. Railway Notifications
- [ ] Enable deploy notifications in Railway dashboard
- [ ] Configure error alerts
- [ ] Set up resource usage alerts

---

## 🚀 DEPLOYMENT

### 12. Pre-Deployment Testing
- [ ] Deploy to Railway staging environment (if available)
- [ ] Run smoke tests:
  - [ ] Health check: `curl https://staging.yourdomain.com/health`
  - [ ] Login with email/password
  - [ ] Login with Google OAuth
  - [ ] Test Stripe checkout flow
  - [ ] Send test email
  - [ ] Create test order
  - [ ] Verify WebSocket connection
  - [ ] Check background workers in logs

### 13. Deploy to Production
- [ ] Connect GitHub repository to Railway
- [ ] Configure build settings:
  - Builder: `DOCKERFILE`
  - Dockerfile path: `Dockerfile`
- [ ] Add all environment variables
- [ ] Add Postgres addon
- [ ] Add Redis addon (optional but recommended)
- [ ] Click "Deploy"
- [ ] Monitor deployment logs
- [ ] Wait for health check to pass

---

## ✅ POST-DEPLOYMENT VERIFICATION

### 14. Verify Core Functionality
- [ ] Health check returns 200: `curl https://yourdomain.com/health`
- [ ] Database connection successful (check logs)
- [ ] Redis connection successful (check logs)
- [ ] Test user registration
- [ ] Test email/password login
- [ ] Test Google OAuth login
- [ ] Test password reset flow

### 15. Verify Integrations
- [ ] Stripe checkout flow (test mode)
- [ ] Stripe checkout flow (live mode with $0.50 test)
- [ ] Email delivery (welcome email)
- [ ] Email delivery (order confirmation)
- [ ] Google OAuth (create new user)
- [ ] Google OAuth (login existing user)

### 16. Verify Background Processing
- [ ] Check logs for worker startup:
  - Email worker
  - PDF worker
  - Notification worker
  - AI worker
- [ ] Verify cron jobs started:
  - Daily briefing
  - Inventory monitoring
  - Clinical anomaly detection
  - Usage reporting
  - Storage calculation

### 17. Performance Check
- [ ] Response time < 500ms for homepage
- [ ] Response time < 1s for dashboard
- [ ] Database query performance acceptable
- [ ] No memory leaks (monitor over 24 hours)
- [ ] CPU usage normal (< 50% average)

### 18. Security Verification
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers present:
  - `Strict-Transport-Security`
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Content-Security-Policy`
- [ ] Rate limiting active (test with 100 rapid requests)
- [ ] CSRF protection active
- [ ] Session cookies have `httpOnly` and `secure` flags

---

## 📝 DOCUMENTATION

### 19. Update Documentation
- [ ] Update README with production URL
- [ ] Document deployment process
- [ ] Document rollback procedure
- [ ] Create incident response plan
- [ ] Document API key rotation schedule

### 20. Team Communication
- [ ] Notify team of production deployment
- [ ] Share production URL and credentials
- [ ] Share monitoring dashboard links
- [ ] Schedule post-deployment review meeting

---

## 🚨 INCIDENT RESPONSE

### Emergency Contacts
- **Railway Support:** https://railway.app/help
- **Stripe Support:** https://support.stripe.com
- **Google OAuth Issues:** https://console.cloud.google.com/support

### Rollback Procedure
If critical issues occur:
1. Check Railway logs for errors
2. Verify environment variables
3. Check database connection
4. If necessary, rollback in Railway dashboard:
   - Go to Deployments
   - Select previous working deployment
   - Click "Redeploy"

### Common Issues
| Issue | Solution |
|-------|----------|
| Health check failing | Check DATABASE_URL, verify migrations ran |
| Login not working | Verify SESSION_SECRET is set |
| Google OAuth error | Check redirect URI in Google Console |
| Stripe webhook failing | Verify webhook secret matches |
| Emails not sending | Check RESEND_API_KEY, verify domain |

---

## ✅ DEPLOYMENT COMPLETE

### Final Steps
- [ ] Monitor error rates for 24 hours
- [ ] Review logs for anomalies
- [ ] Test critical user flows
- [ ] Verify background jobs running
- [ ] Update status page (if applicable)
- [ ] Celebrate! 🎉

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Production URL:** https://_______________
**All Items Checked:** ☐ YES / ☐ NO
