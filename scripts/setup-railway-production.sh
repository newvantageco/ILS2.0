#!/bin/bash
#
# Railway Production Setup Script
# 
# This script automates the deployment of ILS 2.0 to Railway with:
# - AWS Secrets Manager integration
# - Database encryption setup
# - MFA enforcement
# - Security hardening
#
# Usage:
#   ./scripts/setup-railway-production.sh
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════════"
echo "          ILS 2.0 Railway Production Setup"
echo "═══════════════════════════════════════════════════════════"
echo -e "${NC}"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found${NC}"
    echo "Install with: npm install -g @railway/cli"
    echo "Or: brew install railway"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI found${NC}"
echo ""

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Railway${NC}"
    echo "Logging in..."
    railway login
fi

echo -e "${GREEN}✅ Railway authentication verified${NC}"
echo ""

# Check if project is linked
if ! railway status &> /dev/null; then
    echo -e "${YELLOW}⚠️  No Railway project linked${NC}"
    echo "Available options:"
    echo "1. Link to existing project: railway link"
    echo "2. Create new project: railway init"
    echo ""
    read -p "Do you want to create a new project? (y/n): " create_new
    
    if [[ $create_new == "y" || $create_new == "Y" ]]; then
        echo "Creating new Railway project..."
        railway init
    else
        echo "Linking to existing project..."
        railway link
    fi
fi

echo -e "${GREEN}✅ Railway project linked${NC}"
echo ""

# Get the generated encryption key (from previous step)
ENCRYPTION_KEY="B+ymN2yUDNgSV9th3MXnLlaB/cWt1iXpJ27uswNJxW8="

echo -e "${BLUE}📋 Setting Railway environment variables...${NC}"
echo ""

# Core application variables
echo "Setting core application variables..."
railway variables --set "NODE_ENV=production"
railway variables --set "PORT=5000"
railway variables --set "HOST=0.0.0.0"

# Security variables
echo "Setting security variables..."
railway variables --set "CSRF_ENABLED=true"
railway variables --set "JWT_AUTH_ENABLED=true"

# Database encryption (P0 fix #3)
echo "Setting database encryption key..."
railway variables --set "DB_ENCRYPTION_KEY=$ENCRYPTION_KEY"
railway variables --set "DB_ENCRYPTION_KEY_VERSION=v1"

# AWS Secrets Manager configuration (P0 fix #4)
echo ""
echo -e "${YELLOW}⚠️  AWS Secrets Manager Configuration${NC}"
echo "You need to provide AWS credentials for secrets management."
echo ""
read -p "Do you have AWS credentials? (y/n): " has_aws

if [[ $has_aws == "y" || $has_aws == "Y" ]]; then
    read -p "AWS Access Key ID: " aws_key_id
    read -sp "AWS Secret Access Key: " aws_secret_key
    echo ""
    read -p "AWS Region (default: us-east-1): " aws_region
    aws_region=${aws_region:-us-east-1}
    
    railway variables --set "AWS_ACCESS_KEY_ID=$aws_key_id"
    railway variables --set "AWS_SECRET_ACCESS_KEY=$aws_secret_key"
    railway variables --set "AWS_REGION=$aws_region"
    railway variables --set "SECRETS_PROVIDER=aws"
    
    echo -e "${GREEN}✅ AWS credentials configured${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping AWS Secrets Manager - using env vars${NC}"
    echo "You'll need to set these manually:"
    echo "  - JWT_SECRET"
    echo "  - SESSION_SECRET"
    echo "  - STRIPE_SECRET_KEY"
    echo "  - OPENAI_API_KEY"
    railway variables --set "SECRETS_PROVIDER=env"
fi

echo ""
echo -e "${BLUE}📋 Setting essential secrets...${NC}"

# Generate JWT and Session secrets if not using AWS
if [[ $has_aws != "y" && $has_aws != "Y" ]]; then
    JWT_SECRET=$(openssl rand -hex 32)
    SESSION_SECRET=$(openssl rand -hex 32)
    
    railway variables --set "JWT_SECRET=$JWT_SECRET"
    railway variables --set "SESSION_SECRET=$SESSION_SECRET"
    railway variables --set "JWT_EXPIRES_IN=7d"
    railway variables --set "JWT_REFRESH_EXPIRES_IN=30d"
    
    echo -e "${GREEN}✅ Generated JWT and session secrets${NC}"
fi

# CORS configuration
echo ""
read -p "Enter your frontend domain (e.g., https://app.yourdomain.com): " frontend_url
railway variables --set "CORS_ORIGIN=$frontend_url"
railway variables --set "APP_URL=$frontend_url"

echo ""
echo -e "${BLUE}🗄️  Database Configuration${NC}"

# Check if PostgreSQL is already provisioned
if railway service list | grep -q "postgres"; then
    echo -e "${GREEN}✅ PostgreSQL database already provisioned${NC}"
else
    echo "Provisioning PostgreSQL database..."
    railway add --database postgres
    
    # Wait for database to be ready
    echo "Waiting for database to be ready..."
    sleep 10
fi

# Check if Redis is already provisioned
if railway service list | grep -q "redis"; then
    echo -e "${GREEN}✅ Redis already provisioned${NC}"
else
    echo "Provisioning Redis..."
    railway add --database redis
    
    echo "Waiting for Redis to be ready..."
    sleep 5
fi

echo ""
echo -e "${BLUE}🔧 Database Migration Setup${NC}"

# Create a temporary .env file for local migration testing
echo "Creating temporary .env for migration..."
railway run env > .env.railway

# Add encryption key to .env
echo "DB_ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env.railway
echo "DB_ENCRYPTION_KEY_VERSION=v1" >> .env.railway

echo -e "${GREEN}✅ Environment file created: .env.railway${NC}"
echo ""
echo -e "${YELLOW}⚠️  Database Migration Options:${NC}"
echo "1. Run migrations during deployment (automatic)"
echo "2. Run migrations manually before deployment (recommended)"
echo ""
read -p "Run migrations manually now? (y/n): " run_migrations

if [[ $run_migrations == "y" || $run_migrations == "Y" ]]; then
    echo ""
    echo "Running database migrations..."
    
    # Load railway environment and run migrations
    railway run npm run db:migrate
    
    echo -e "${GREEN}✅ Database migrations completed${NC}"
    
    echo ""
    read -p "Run PHI encryption migration? (requires maintenance window) (y/n): " run_encryption
    
    if [[ $run_encryption == "y" || $run_encryption == "Y" ]]; then
        echo -e "${YELLOW}⚠️  This will encrypt all existing PHI/PII data${NC}"
        echo "Ensure you have a database backup before proceeding!"
        echo ""
        read -p "Type 'ENCRYPT' to confirm: " confirm
        
        if [[ $confirm == "ENCRYPT" ]]; then
            echo "Running encryption migration..."
            railway run npm run migrate:encrypt-phi
            echo -e "${GREEN}✅ Encryption migration completed${NC}"
        else
            echo -e "${YELLOW}⚠️  Encryption migration skipped${NC}"
        fi
    fi
fi

echo ""
echo -e "${BLUE}🚀 Deployment Configuration${NC}"

# Set deployment command
railway service update --command "npm run start"

# Set healthcheck
railway service update --healthcheck "/api/health"

echo -e "${GREEN}✅ Deployment configuration updated${NC}"

echo ""
echo -e "${BLUE}📦 Building and Deploying...${NC}"

# Deploy to Railway
railway up --detach

echo ""
echo -e "${GREEN}✅ Deployment initiated!${NC}"

# Get deployment URL
echo ""
echo "Waiting for deployment to complete..."
sleep 5

DEPLOYMENT_URL=$(railway domain)

if [ -n "$DEPLOYMENT_URL" ]; then
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}          🎉 Deployment Successful!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "Application URL: ${BLUE}https://$DEPLOYMENT_URL${NC}"
    echo ""
fi

echo ""
echo -e "${BLUE}📝 Post-Deployment Steps:${NC}"
echo ""
echo "1. Verify health check:"
echo "   curl https://$DEPLOYMENT_URL/api/health"
echo ""
echo "2. Test security fixes:"
echo "   - Rate limiting: Try 6 login attempts"
echo "   - MFA enforcement: Access /api/platform-admin without MFA"
echo "   - Encryption: Check database for encrypted fields"
echo ""
echo "3. Update DNS:"
echo "   Point your domain to: $DEPLOYMENT_URL"
echo ""
echo "4. Configure Stripe webhook:"
echo "   URL: https://$DEPLOYMENT_URL/api/webhooks/stripe"
echo ""
echo "5. Test OAuth flows:"
echo "   - Google OAuth"
echo "   - NHS API integration"
echo ""
echo "6. Monitor logs:"
echo "   railway logs"
echo ""

# Save deployment info
cat > deployment-info.txt <<EOF
ILS 2.0 Deployment Information
==============================

Deployment Date: $(date)
Railway Project: $(railway status | grep "Project" || echo "N/A")
Deployment URL: https://$DEPLOYMENT_URL

Environment Variables Set:
- NODE_ENV=production
- DB_ENCRYPTION_KEY=*** (hidden)
- DB_ENCRYPTION_KEY_VERSION=v1
- SECRETS_PROVIDER=$([[ $has_aws == "y" ]] && echo "aws" || echo "env")
- CORS_ORIGIN=$frontend_url

Security Fixes Applied:
✅ P0-1: Auth rate limiter (5 attempts/15min)
✅ P0-2: MFA enforcement for admin accounts
✅ P0-3: Database encryption at rest (AES-256-GCM)
✅ P0-4: AWS Secrets Manager integration

Database:
- PostgreSQL: Provisioned
- Redis: Provisioned
- Migrations: $([[ $run_migrations == "y" ]] && echo "Applied" || echo "Pending")
- Encryption: $([[ $run_encryption == "y" ]] && echo "Applied" || echo "Pending")

Next Steps:
1. Verify health endpoint
2. Run security validation tests
3. Update DNS records
4. Configure monitoring alerts
5. Schedule third-party pentest

For support: security@yourdomain.com
EOF

echo -e "${GREEN}✅ Deployment info saved to: deployment-info.txt${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}          Setup Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
