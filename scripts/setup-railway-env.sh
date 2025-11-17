#!/bin/bash

# ILS 2.0 - Railway Environment Setup Script
# Generates secure values for all required environment variables

set -e

echo "🔧 ILS 2.0 - Railway Environment Setup"
echo "======================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Generate secure random values
SESSION_SECRET=$(openssl rand -hex 32)
ADMIN_SETUP_KEY=$(openssl rand -hex 16)
ENCRYPTION_KEY=$(openssl rand -hex 16)

echo ""
print_info "Generated secure values:"
echo "  SESSION_SECRET=$SESSION_SECRET"
echo "  ADMIN_SETUP_KEY=$ADMIN_SETUP_KEY"
echo "  ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo ""

print_info "Add these environment variables to your Railway project:"

cat << 'EOF'

# ===== CORE APPLICATION =====
NODE_ENV=production
PORT=5000
SESSION_SECRET=YOUR_SESSION_SECRET_HERE
ADMIN_SETUP_KEY=YOUR_ADMIN_SETUP_KEY_HERE
APP_URL=https://your-app.railway.app
CORS_ORIGIN=https://your-app.railway.app

# ===== DATABASE & REDIS =====
# These are auto-provided by Railway:
# DATABASE_URL=postgresql://...
# REDIS_URL=redis://...

# ===== AI SERVICES =====
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
PYTHON_SERVICE_URL=http://localhost:8000
AI_SERVICE_URL=http://localhost:8080

# ===== SHOPIFY INTEGRATION =====
SHOPIFY_WEBHOOK_URL=https://your-app.railway.app/api/shopify/webhooks
ENCRYPTION_KEY=YOUR_ENCRYPTION_KEY_HERE

# ===== EMAIL SERVICE =====
RESEND_API_KEY=re_your-resend-api-key
MAIL_FROM=hello@yourdomain.com

# ===== FILE STORAGE =====
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=ils-production-files

# ===== MONITORING =====
LOG_LEVEL=info
METRICS_ENABLED=true

# ===== MASTER USER (Optional) =====
MASTER_USER_EMAIL=admin@yourdomain.com
MASTER_USER_PASSWORD=YourStrongPassword123!
MASTER_USER_FIRST_NAME=Admin
MASTER_USER_LAST_NAME=User
MASTER_USER_ORGANIZATION=ILS Platform

EOF

echo ""
print_warning "Replace the placeholder values with your actual API keys:"
echo "  • OpenAI API Key: Get from https://platform.openai.com/api-keys"
echo "  • Anthropic API Key: Get from https://console.anthropic.com/"
echo "  • Resend API Key: Get from https://resend.com/api-keys"
echo "  • AWS Credentials: Get from AWS IAM Console"
echo ""

print_info "Quick setup steps:"
echo "1. Copy the generated SESSION_SECRET and ADMIN_SETUP_KEY"
echo "2. Go to your Railway project → Variables"
echo "3. Add all the environment variables above"
echo "4. Replace placeholder values with your actual keys"
echo "5. Save and Railway will automatically redeploy"
echo ""

print_success "Environment setup guide ready!"
echo ""
echo "📋 Next steps:"
echo "1. Set up environment variables in Railway"
echo "2. Wait for automatic deployment"
echo "3. Run database migrations"
echo "4. Test service verification dashboard"
echo ""
echo "🔧 Commands for next steps:"
echo "# After deployment, run migrations:"
echo "railway run npm run db:push"
echo ""
echo "# Test service status:"
echo "curl https://your-app.railway.app/api/verification/status"
