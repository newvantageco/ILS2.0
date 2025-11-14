#!/bin/bash

# ==========================================
# ILS 2.0 Deployment Status Checker
# ==========================================
# Run this script to verify your deployment

set -e

echo "🔍 ILS 2.0 Deployment Status Checker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Railway CLI is installed
echo "📦 Checking Railway CLI..."
if command -v railway &> /dev/null; then
    RAILWAY_VERSION=$(railway --version)
    echo "   ✅ Railway CLI installed: $RAILWAY_VERSION"
else
    echo "   ❌ Railway CLI not installed"
    echo "   Run: brew install railway"
    exit 1
fi
echo ""

# Check if logged in
echo "🔐 Checking Railway authentication..."
if railway whoami &> /dev/null; then
    RAILWAY_USER=$(railway whoami 2>&1)
    echo "   ✅ $RAILWAY_USER"
else
    echo "   ❌ Not logged in to Railway"
    echo "   Run: railway login"
    exit 1
fi
echo ""

# Check project status
echo "📊 Checking Railway project status..."
if railway status &> /dev/null; then
    echo "   ✅ Project linked"
    railway status 2>&1 || true
else
    echo "   ⚠️  No project linked"
    echo "   Project URL: https://railway.com/project/0038b820-2ece-411b-9118-7771b275dafa"
    echo "   Run: railway link"
fi
echo ""

# Prompt for deployment URL
echo "🌐 Enter your Railway deployment URL (or press Enter to skip):"
read -r DEPLOY_URL

if [ -z "$DEPLOY_URL" ]; then
    echo "   ⏭️  Skipping deployment checks"
else
    echo ""
    echo "🏥 Testing health endpoint..."
    HEALTH_URL="${DEPLOY_URL}/api/health"

    if curl -s -f "$HEALTH_URL" > /dev/null; then
        echo "   ✅ Health endpoint responding"
        echo ""
        echo "   Response:"
        curl -s "$HEALTH_URL" | jq '.' 2>/dev/null || curl -s "$HEALTH_URL"
    else
        echo "   ❌ Health endpoint not responding"
        echo "   URL tested: $HEALTH_URL"
    fi

    echo ""
    echo "🌍 Testing main application..."
    if curl -s -f "$DEPLOY_URL" > /dev/null; then
        echo "   ✅ Application accessible"
    else
        echo "   ❌ Application not accessible"
        echo "   URL tested: $DEPLOY_URL"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Deployment Checklist:"
echo "   - [ ] PostgreSQL database added and in Production Mode"
echo "   - [ ] Redis cache added"
echo "   - [ ] Web service connected to GitHub"
echo "   - [ ] Environment variables configured"
echo "   - [ ] Application deployed successfully"
echo "   - [ ] Health endpoint returns 200 OK"
echo "   - [ ] Database migrations run (railway run npm run db:push)"
echo "   - [ ] Master user can login"
echo ""
echo "📚 Full checklist: ./DEPLOYMENT_CHECKLIST.md"
echo "📖 Deployment guide: ./DEPLOYMENT_GUIDE.md"
echo ""
echo "🚀 Railway Dashboard: https://railway.com/project/0038b820-2ece-411b-9118-7771b275dafa"
echo ""
