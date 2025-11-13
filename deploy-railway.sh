#!/bin/bash
set -e

# Railway Deployment Script for ILS 2.0
# This script automates the deployment process to Railway

echo "🚂 ILS 2.0 - Railway Deployment Script"
echo "======================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Railway token is set
if [ -z "$RAILWAY_TOKEN" ]; then
    echo -e "${RED}❌ RAILWAY_TOKEN not set${NC}"
    echo ""
    echo "To deploy, you need a Railway API token:"
    echo ""
    echo "1. Go to: https://railway.app/account/tokens"
    echo "2. Click 'Create Token'"
    echo "3. Copy the token"
    echo "4. Run: export RAILWAY_TOKEN='your-token-here'"
    echo "5. Run this script again"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Railway token found${NC}"
echo ""

# Check if project is linked
if [ ! -f ".railway/config.json" ]; then
    echo -e "${YELLOW}⚠️  No Railway project linked${NC}"
    echo ""
    echo "Options:"
    echo "  1. Link to existing project: npx @railway/cli link"
    echo "  2. Create new project: npx @railway/cli init"
    echo ""
    read -p "Do you want to create a new project? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Creating new Railway project...${NC}"
        npx @railway/cli init
    else
        echo -e "${RED}Please link to a Railway project first${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Railway project linked${NC}"
echo ""

# Show current project info
echo -e "${BLUE}📋 Current Railway Project:${NC}"
npx @railway/cli status
echo ""

# Pre-deployment checks
echo -e "${BLUE}🔍 Running pre-deployment checks...${NC}"

# Check if build works
if [ ! -d "dist" ] || [ ! -f "dist/index.js" ]; then
    echo -e "${YELLOW}Building application...${NC}"
    npm run build
    echo -e "${GREEN}✅ Build completed${NC}"
else
    echo -e "${GREEN}✅ Build artifacts found${NC}"
fi

# Check environment variables
echo ""
echo -e "${BLUE}🔐 Checking environment variables...${NC}"

REQUIRED_VARS=(
    "NODE_ENV"
    "PORT"
    "SESSION_SECRET"
    "ADMIN_SETUP_KEY"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! npx @railway/cli variables | grep -q "^$var="; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Missing environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Set them with:"
    echo "  npx @railway/cli variables set $var=value"
    echo ""
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}✅ Environment variables checked${NC}"
echo ""

# Deploy
echo -e "${BLUE}🚀 Deploying to Railway...${NC}"
echo ""

npx @railway/cli up

echo ""
echo -e "${GREEN}✅ Deployment triggered!${NC}"
echo ""

# Wait for deployment to complete
echo -e "${BLUE}⏳ Waiting for deployment to complete...${NC}"
sleep 10

# Show deployment status
echo ""
echo -e "${BLUE}📊 Deployment Status:${NC}"
npx @railway/cli status
echo ""

# Get the URL
echo -e "${BLUE}🌐 Getting deployment URL...${NC}"
URL=$(npx @railway/cli domain 2>/dev/null || echo "Not set yet")
echo "URL: $URL"
echo ""

# Offer to initialize database
echo -e "${YELLOW}📦 Database Initialization${NC}"
echo ""
read -p "Initialize database schema now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Initializing database...${NC}"
    npx @railway/cli run npm run db:push
    echo -e "${GREEN}✅ Database initialized${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Check deployment: npx @railway/cli logs"
echo "  2. Open your app: $URL"
echo "  3. Check health: curl $URL/api/health"
echo ""
echo "For monitoring:"
echo "  - Logs: npx @railway/cli logs"
echo "  - Status: npx @railway/cli status"
echo "  - Shell: npx @railway/cli shell"
echo ""
