#!/bin/bash

# ================================================================
# Set Railway Environment Variables
# ================================================================
# This script configures all required environment variables
# for the ILS 2.0 production deployment on Railway
# ================================================================

set -e  # Exit on error

echo "🔧 Setting Railway Environment Variables..."
echo ""

# Core Application Variables
echo "Setting core application variables..."
railway variables --set "NODE_ENV=production" --skip-deploys || echo "❌ Failed to set NODE_ENV"
railway variables --set "HOST=0.0.0.0" --skip-deploys || echo "❌ Failed to set HOST"

# Security Secrets
echo "Setting security secrets..."
# NOTE: Generate unique secrets before deployment
# Example: openssl rand -base64 32
if [ -z "$SESSION_SECRET" ] || [ -z "$ADMIN_SETUP_KEY" ]; then
  echo "❌ Error: SESSION_SECRET and ADMIN_SETUP_KEY environment variables must be set"
  echo "Generate them with: openssl rand -base64 32"
  exit 1
fi
railway variables --set "SESSION_SECRET=$SESSION_SECRET" --skip-deploys || echo "❌ Failed to set SESSION_SECRET"
railway variables --set "ADMIN_SETUP_KEY=$ADMIN_SETUP_KEY" --skip-deploys || echo "❌ Failed to set ADMIN_SETUP_KEY"

# Optional: Master User
echo "Setting master user configuration..."
railway variables --set "MASTER_USER_EMAIL=admin@newvantageco.com" --skip-deploys || echo "⚠️  Failed to set MASTER_USER_EMAIL"
railway variables --set "MASTER_USER_FIRST_NAME=Admin" --skip-deploys || echo "⚠️  Failed to set MASTER_USER_FIRST_NAME"
railway variables --set "MASTER_USER_LAST_NAME=User" --skip-deploys || echo "⚠️  Failed to set MASTER_USER_LAST_NAME"
railway variables --set "MASTER_USER_ORGANIZATION=New Vantage Co" --skip-deploys || echo "⚠️  Failed to set MASTER_USER_ORGANIZATION"

echo ""
echo "✅ Environment variable configuration complete!"
echo ""
echo "📋 Current variables:"
railway variables

echo ""
echo "🚀 To trigger deployment with new variables:"
echo "   railway up --detach"
echo ""
