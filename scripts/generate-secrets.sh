#!/bin/bash

# ===================================
# Generate Secure Secrets for Railway
# ===================================

echo "🔐 Generating secure secrets for ILS 2.0 deployment..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Generate SESSION_SECRET (32 bytes = 44 chars base64)
SESSION_SECRET=$(openssl rand -base64 32)
echo "✅ SESSION_SECRET (copy this to Railway variables):"
echo "   SESSION_SECRET=$SESSION_SECRET"
echo ""

# Generate ADMIN_SETUP_KEY (24 bytes = 32 chars base64)
ADMIN_SETUP_KEY=$(openssl rand -base64 24)
echo "✅ ADMIN_SETUP_KEY (copy this to Railway variables):"
echo "   ADMIN_SETUP_KEY=$ADMIN_SETUP_KEY"
echo ""

# Generate JWT_SECRET (optional, 32 bytes)
JWT_SECRET=$(openssl rand -base64 32)
echo "✅ JWT_SECRET (optional, if using JWT auth):"
echo "   JWT_SECRET=$JWT_SECRET"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Quick Copy Format (all in one):"
echo ""
echo "SESSION_SECRET=$SESSION_SECRET"
echo "ADMIN_SETUP_KEY=$ADMIN_SETUP_KEY"
echo "JWT_SECRET=$JWT_SECRET"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Next Steps:"
echo "   1. Copy these to Railway Dashboard → Variables"
echo "   2. Add required integrations (Stripe, Resend, etc.)"
echo "   3. Deploy your application"
echo ""
echo "📚 Full deployment guide: ./DEPLOYMENT_GUIDE.md"
echo ""
