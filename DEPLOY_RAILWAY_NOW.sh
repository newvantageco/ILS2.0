#!/bin/bash
set -e

# ILS 2.0 - Railway Deployment Script
# Run this script in your terminal to deploy to Railway

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     ILS 2.0 - Railway Deployment via CLI                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Generated secrets for this deployment
SESSION_SECRET="F2VHuRe01NCsiZV971FmZJdcsLlLgfSsb5OT4a7ZIwvIOse2RCl4qNIpXMcAHpbL"
ADMIN_SETUP_KEY="sxRbYCLjGYVDEkDHfaqU/TIidCmZ5qQn"

echo -e "${BLUE}Step 1: Authentication${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -z "$RAILWAY_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Railway token not found${NC}"
    echo ""
    echo "Please authenticate with Railway:"
    echo ""
    echo -e "${CYAN}npx @railway/cli login${NC}"
    echo ""
    read -p "Press Enter after you've logged in..."
    echo ""
else
    echo -e "${GREEN}✅ Railway token found${NC}"
    echo ""
fi

echo -e "${BLUE}Step 2: Initialize/Link Project${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -f ".railway/config.json" ]; then
    echo -e "${YELLOW}No Railway project linked${NC}"
    echo ""
    echo "Options:"
    echo "  1) Create new project"
    echo "  2) Link to existing project"
    echo ""
    read -p "Choose (1 or 2): " choice

    if [ "$choice" = "1" ]; then
        echo ""
        echo -e "${CYAN}Creating new Railway project...${NC}"
        npx @railway/cli init
    else
        echo ""
        echo -e "${CYAN}Linking to existing project...${NC}"
        npx @railway/cli link
    fi
    echo ""
else
    echo -e "${GREEN}✅ Project already linked${NC}"
    echo ""
fi

# Show project info
echo -e "${BLUE}Current Project:${NC}"
npx @railway/cli status
echo ""

echo -e "${BLUE}Step 3: Add Services (PostgreSQL & Redis)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}⚠️  Important: Add these services via Railway Dashboard${NC}"
echo ""
echo "1. Go to your project: https://railway.app/dashboard"
echo "2. Click '+ New' → 'Database' → 'PostgreSQL'"
echo "3. Click '+ New' → 'Database' → 'Redis'"
echo ""
echo "Railway will automatically set DATABASE_URL and REDIS_URL"
echo ""
read -p "Press Enter after adding PostgreSQL and Redis..."
echo ""

echo -e "${BLUE}Step 4: Set Environment Variables${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${CYAN}Setting core variables...${NC}"
npx @railway/cli variables set NODE_ENV=production
npx @railway/cli variables set PORT=5000
npx @railway/cli variables set SESSION_SECRET="$SESSION_SECRET"
npx @railway/cli variables set ADMIN_SETUP_KEY="$ADMIN_SETUP_KEY"
echo ""

echo -e "${YELLOW}Setting master user variables...${NC}"
echo ""
echo "Enter master user details:"
read -p "Email (default: admin@ils.local): " MASTER_EMAIL
MASTER_EMAIL=${MASTER_EMAIL:-admin@ils.local}

read -sp "Password (min 12 chars): " MASTER_PASSWORD
echo ""

read -p "First Name (default: Admin): " MASTER_FIRST
MASTER_FIRST=${MASTER_FIRST:-Admin}

read -p "Last Name (default: User): " MASTER_LAST
MASTER_LAST=${MASTER_LAST:-User}

read -p "Organization (default: ILS Platform): " MASTER_ORG
MASTER_ORG=${MASTER_ORG:-ILS Platform}

echo ""
echo -e "${CYAN}Setting master user variables...${NC}"
npx @railway/cli variables set MASTER_USER_EMAIL="$MASTER_EMAIL"
npx @railway/cli variables set MASTER_USER_PASSWORD="$MASTER_PASSWORD"
npx @railway/cli variables set MASTER_USER_FIRST_NAME="$MASTER_FIRST"
npx @railway/cli variables set MASTER_USER_LAST_NAME="$MASTER_LAST"
npx @railway/cli variables set MASTER_USER_ORGANIZATION="$MASTER_ORG"

echo ""
echo -e "${GREEN}✅ Environment variables set${NC}"
echo ""

# Optional services
echo -e "${YELLOW}Optional: Configure additional services${NC}"
echo ""
read -p "Configure email service (Resend)? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Resend API Key: " RESEND_KEY
    npx @railway/cli variables set RESEND_API_KEY="$RESEND_KEY"
    read -p "From Email: " FROM_EMAIL
    npx @railway/cli variables set FROM_EMAIL="$FROM_EMAIL"
    echo -e "${GREEN}✅ Email service configured${NC}"
    echo ""
fi

echo -e "${BLUE}Step 5: Build Application${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -f "dist/index.js" ]; then
    echo -e "${CYAN}Building application...${NC}"
    npm run build
    echo -e "${GREEN}✅ Build complete${NC}"
else
    echo -e "${GREEN}✅ Build artifacts found${NC}"
fi
echo ""

echo -e "${BLUE}Step 6: Deploy to Railway${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${CYAN}Deploying application...${NC}"
echo ""
npx @railway/cli up

echo ""
echo -e "${GREEN}✅ Deployment triggered!${NC}"
echo ""

echo -e "${BLUE}Step 7: Wait for Deployment${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Waiting for deployment to complete..."
echo ""

# Wait a bit for deployment to start
sleep 10

echo "Checking deployment status..."
npx @railway/cli status
echo ""

echo -e "${BLUE}Step 8: Initialize Database${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Initialize database schema now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${CYAN}Initializing database (this creates 90+ tables)...${NC}"
    npx @railway/cli run npm run db:push
    echo ""
    echo -e "${GREEN}✅ Database initialized${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  Remember to initialize database later:${NC}"
    echo "   npx @railway/cli run npm run db:push"
fi
echo ""

echo -e "${BLUE}Step 9: Get Deployment URL${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

DEPLOYMENT_URL=$(npx @railway/cli domain 2>/dev/null || echo "")

if [ -n "$DEPLOYMENT_URL" ]; then
    echo -e "${GREEN}✅ Your app is deployed at:${NC}"
    echo ""
    echo -e "   ${CYAN}$DEPLOYMENT_URL${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  No domain set yet${NC}"
    echo ""
    echo "To generate a domain:"
    echo "  1. Go to Railway Dashboard"
    echo "  2. Click your app service"
    echo "  3. Settings → Domains → Generate Domain"
    echo ""
fi

echo -e "${BLUE}Step 10: Verify Deployment${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -n "$DEPLOYMENT_URL" ]; then
    echo "Testing health endpoint..."
    sleep 5

    HEALTH_RESPONSE=$(curl -s "$DEPLOYMENT_URL/api/health" || echo "")

    if [ -n "$HEALTH_RESPONSE" ]; then
        echo ""
        echo -e "${GREEN}✅ Health check response:${NC}"
        echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"
        echo ""
    else
        echo ""
        echo -e "${YELLOW}⚠️  Health check not responding yet${NC}"
        echo "Wait a minute and try: curl $DEPLOYMENT_URL/api/health"
        echo ""
    fi
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  🎉 DEPLOYMENT COMPLETE! 🎉                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ -n "$DEPLOYMENT_URL" ]; then
    echo -e "${GREEN}Your ILS 2.0 Platform:${NC}"
    echo ""
    echo "  🌐 URL:        $DEPLOYMENT_URL"
    echo "  🏥 Health:     $DEPLOYMENT_URL/api/health"
    echo "  👤 Login:      $MASTER_EMAIL"
    echo ""
fi

echo -e "${CYAN}Useful Commands:${NC}"
echo ""
echo "  View logs:     npx @railway/cli logs"
echo "  View status:   npx @railway/cli status"
echo "  Open shell:    npx @railway/cli shell"
echo "  Run command:   npx @railway/cli run <command>"
echo ""

echo -e "${CYAN}Next Steps:${NC}"
echo ""
echo "  1. Open your app in browser"
echo "  2. Login with master user credentials"
echo "  3. Explore the platform"
echo "  4. Add team members"
echo "  5. Configure custom domain (optional)"
echo ""

echo -e "${GREEN}Deployment Information Saved:${NC}"
echo ""
echo "  📄 DEPLOYMENT_READY.md - Complete guide with secrets"
echo "  📄 RAILWAY_DEPLOYMENT_GUIDE.md - Full reference"
echo "  📄 DEPLOY_NOW.md - Step-by-step instructions"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Thank you for deploying ILS 2.0! 🚀"
echo ""
