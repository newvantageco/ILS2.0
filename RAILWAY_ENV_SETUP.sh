#!/bin/bash

# ================================
# Railway Environment Setup Script
# ================================
# This script helps you set up all required environment variables for Railway deployment
# Run this locally to generate the commands you'll paste into Railway dashboard

set -e

echo "🚂 ILS 2.0 - Railway Environment Variable Setup"
echo "================================================"
echo ""
echo "This script will help you configure all required environment variables."
echo "Copy the output and paste into Railway Dashboard → Variables"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================
# 1. Generate Security Secrets
# ============================================
echo "📋 STEP 1: Generating Security Secrets..."
echo ""

SESSION_SECRET=$(openssl rand -hex 32)
CSRF_SECRET=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)

echo "✅ Security secrets generated"
echo ""

# ============================================
# 2. Collect Required Information
# ============================================
echo "📋 STEP 2: Configuration Information"
echo ""
echo "Please provide the following information:"
echo ""

# Production domain
read -p "Production domain (e.g., app.yourdomain.com): " PROD_DOMAIN
PROD_DOMAIN=${PROD_DOMAIN:-app.yourdomain.com}

# CORS origin
read -p "CORS origin (usually https://$PROD_DOMAIN): " CORS_ORIGIN
CORS_ORIGIN=${CORS_ORIGIN:-https://$PROD_DOMAIN}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================
# 3. Google OAuth Configuration
# ============================================
echo "📋 STEP 3: Google OAuth Configuration"
echo ""
echo "Get credentials from: https://console.cloud.google.com/apis/credentials"
echo "Redirect URI should be: https://$PROD_DOMAIN/api/auth/google/callback"
echo ""

read -p "Google Client ID: " GOOGLE_CLIENT_ID
read -p "Google Client Secret: " GOOGLE_CLIENT_SECRET

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================
# 4. Stripe Configuration
# ============================================
echo "📋 STEP 4: Stripe Configuration"
echo ""
echo "Get credentials from: https://dashboard.stripe.com/apikeys"
echo "Use LIVE mode keys (sk_live_* and pk_live_*)"
echo ""

read -p "Stripe Secret Key (sk_live_...): " STRIPE_SECRET_KEY
read -p "Stripe Publishable Key (pk_live_...): " STRIPE_PUBLISHABLE_KEY
read -p "Stripe Webhook Secret (whsec_...): " STRIPE_WEBHOOK_SECRET

echo ""
echo "Now enter the 6 Stripe Price IDs (create in Stripe Dashboard):"
echo ""

read -p "Starter Monthly Price ID: " STRIPE_PRICE_STARTER_MONTHLY
read -p "Starter Yearly Price ID: " STRIPE_PRICE_STARTER_YEARLY
read -p "Pro Monthly Price ID: " STRIPE_PRICE_PRO_MONTHLY
read -p "Pro Yearly Price ID: " STRIPE_PRICE_PRO_YEARLY
read -p "Enterprise Monthly Price ID: " STRIPE_PRICE_ENTERPRISE_MONTHLY
read -p "Enterprise Yearly Price ID: " STRIPE_PRICE_ENTERPRISE_YEARLY

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================
# 5. Email Configuration (Resend)
# ============================================
echo "📋 STEP 5: Email Configuration (Resend)"
echo ""
echo "Get API key from: https://resend.com/api-keys"
echo ""

read -p "Resend API Key: " RESEND_API_KEY
read -p "Mail From Address (e.g., hello@$PROD_DOMAIN): " MAIL_FROM
MAIL_FROM=${MAIL_FROM:-hello@$PROD_DOMAIN}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================
# 6. Optional Services
# ============================================
echo "📋 STEP 6: Optional Services (press Enter to skip)"
echo ""

read -p "Sentry DSN (error tracking): " SENTRY_DSN
read -p "PostHog API Key (analytics): " POSTHOG_API_KEY
read -p "OpenAI API Key: " OPENAI_API_KEY
read -p "Anthropic API Key: " ANTHROPIC_API_KEY

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================
# 7. Generate Railway Commands
# ============================================
echo "✅ Configuration Complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 COPY THE FOLLOWING TO RAILWAY DASHBOARD"
echo ""
echo "Railway Dashboard → Your Project → Variables → RAW Editor"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Output in Railway format (KEY=value, one per line)
cat <<EOF
# ================================
# ILS 2.0 Production Environment Variables
# Generated: $(date)
# ================================

# Core Application
NODE_ENV=production
APP_URL=https://$PROD_DOMAIN
BASE_URL=https://$PROD_DOMAIN
PORTAL_URL=https://$PROD_DOMAIN
COMPANY_NAME=ILS 2.0

# Security
SESSION_SECRET=$SESSION_SECRET
CSRF_SECRET=$CSRF_SECRET
CSRF_ENABLED=true
CORS_ORIGIN=$CORS_ORIGIN

# Google OAuth
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET

# Stripe Payments
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_STARTER_MONTHLY=$STRIPE_PRICE_STARTER_MONTHLY
STRIPE_PRICE_STARTER_YEARLY=$STRIPE_PRICE_STARTER_YEARLY
STRIPE_PRICE_PRO_MONTHLY=$STRIPE_PRICE_PRO_MONTHLY
STRIPE_PRICE_PRO_YEARLY=$STRIPE_PRICE_PRO_YEARLY
STRIPE_PRICE_ENTERPRISE_MONTHLY=$STRIPE_PRICE_ENTERPRISE_MONTHLY
STRIPE_PRICE_ENTERPRISE_YEARLY=$STRIPE_PRICE_ENTERPRISE_YEARLY

# Email (Resend)
RESEND_API_KEY=$RESEND_API_KEY
MAIL_FROM=$MAIL_FROM

# Background Workers
WORKERS_ENABLED=true

# Logging & Monitoring
LOG_LEVEL=info
METRICS_ENABLED=true
EOF

# Optional services (only if provided)
if [ -n "$SENTRY_DSN" ]; then
  echo "SENTRY_DSN=$SENTRY_DSN"
fi

if [ -n "$POSTHOG_API_KEY" ]; then
  echo "POSTHOG_API_KEY=$POSTHOG_API_KEY"
fi

if [ -n "$OPENAI_API_KEY" ]; then
  echo "OPENAI_API_KEY=$OPENAI_API_KEY"
fi

if [ -n "$ANTHROPIC_API_KEY" ]; then
  echo "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 NOTES:"
echo ""
echo "1. DATABASE_URL - Automatically provided by Railway Postgres addon"
echo "2. REDIS_URL - Automatically provided by Railway Redis addon (recommended)"
echo "3. PORT - Automatically set by Railway"
echo ""
echo "🔒 IMPORTANT NEXT STEPS:"
echo ""
echo "1. Add Railway Postgres addon to your project"
echo "2. Add Railway Redis addon (optional but recommended)"
echo "3. Copy the variables above to Railway Dashboard"
echo "4. Configure Google OAuth redirect URI:"
echo "   → https://$PROD_DOMAIN/api/auth/google/callback"
echo "5. Configure Stripe webhook endpoint:"
echo "   → https://$PROD_DOMAIN/api/payments/webhook"
echo "6. Verify domain in Resend dashboard"
echo "7. Deploy!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Setup complete! Follow the deployment checklist in DEPLOYMENT_CHECKLIST.md"
echo ""
