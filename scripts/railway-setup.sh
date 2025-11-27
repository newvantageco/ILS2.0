#!/bin/bash
# =============================================================================
# ILS 2.0 - Complete Railway Infrastructure Setup
# =============================================================================
# This script creates all required services for ILS 2.0 on Railway
#
# Prerequisites:
#   - Railway CLI installed: npm i -g @railway/cli
#   - Logged in: railway login
#   - Project linked: railway link (or this script creates one)
#
# Usage: ./scripts/railway-setup.sh
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    log_error "Railway CLI not found. Install with: npm i -g @railway/cli"
    exit 1
fi

log_info "🚂 ILS 2.0 Railway Infrastructure Setup"
echo ""

# Check if logged in
if ! railway whoami &> /dev/null; then
    log_warn "Not logged in to Railway. Running: railway login"
    railway login
fi

# Get or create project
PROJECT_NAME="ILS-2-0"
log_info "Checking for existing project..."

# Try to link to existing project or create new one
if ! railway status &> /dev/null 2>&1; then
    log_info "Creating new Railway project: $PROJECT_NAME"
    railway init --name "$PROJECT_NAME"
else
    log_success "Already linked to Railway project"
fi

echo ""
log_info "=========================================="
log_info "Step 1: Create PostgreSQL Database"
log_info "=========================================="

# Create PostgreSQL service
log_info "Adding PostgreSQL plugin..."
railway add --plugin postgresql 2>/dev/null || log_warn "PostgreSQL may already exist"
log_success "PostgreSQL service configured"

echo ""
log_info "=========================================="
log_info "Step 2: Create Redis Service"
log_info "=========================================="

# Create Redis service
log_info "Adding Redis plugin..."
railway add --plugin redis 2>/dev/null || log_warn "Redis may already exist"
log_success "Redis service configured"

echo ""
log_info "=========================================="
log_info "Step 3: Configure Main Backend Service"
log_info "=========================================="

# Set essential environment variables
log_info "Setting environment variables for main backend..."

# Generate secrets if not provided
SESSION_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 64)
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 64)
CSRF_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 64)

# Set variables
railway variables set \
    NODE_ENV=production \
    PORT=5000 \
    SESSION_SECRET="$SESSION_SECRET" \
    JWT_SECRET="$JWT_SECRET" \
    CSRF_SECRET="$CSRF_SECRET" \
    JWT_AUTH_ENABLED=true \
    JWT_AUTH_REQUIRED=false \
    WORKERS_ENABLED=true \
    LOG_LEVEL=info \
    METRICS_ENABLED=true \
    2>/dev/null || true

log_success "Core environment variables set"

echo ""
log_info "=========================================="
log_info "Step 4: Deploy Main Backend"
log_info "=========================================="

log_info "Deploying main backend service..."
railway up --detach

echo ""
log_info "=========================================="
log_info "Step 5: Get Service URLs"
log_info "=========================================="

# Wait for deployment
log_info "Waiting for deployment to complete..."
sleep 10

# Get the public domain
RAILWAY_DOMAIN=$(railway domain 2>/dev/null || echo "")

if [ -n "$RAILWAY_DOMAIN" ]; then
    log_success "Backend deployed at: https://$RAILWAY_DOMAIN"
    
    # Set CORS and APP_URL
    railway variables set \
        CORS_ORIGIN="https://$RAILWAY_DOMAIN" \
        APP_URL="https://$RAILWAY_DOMAIN" \
        BASE_URL="https://$RAILWAY_DOMAIN" \
        2>/dev/null || true
else
    log_warn "Could not get domain. Set CORS_ORIGIN manually in Railway dashboard."
fi

echo ""
log_info "=========================================="
log_info "📋 Setup Complete - Next Steps"
log_info "=========================================="

echo ""
echo -e "${GREEN}✅ REQUIRED SERVICES CREATED:${NC}"
echo "   • PostgreSQL (DATABASE_URL auto-injected)"
echo "   • Redis (REDIS_URL auto-injected)"
echo "   • Main Backend (Node.js)"
echo ""

echo -e "${YELLOW}⚠️  MANUAL CONFIGURATION NEEDED:${NC}"
echo ""
echo "1. Go to Railway Dashboard: https://railway.app/dashboard"
echo ""
echo "2. Set these REQUIRED variables in your backend service:"
echo ""
echo "   # Email (choose one):"
echo "   RESEND_API_KEY=re_xxxxxxxxxxxx"
echo "   MAIL_FROM=noreply@yourdomain.com"
echo ""
echo "   # OR SMTP:"
echo "   EMAIL_HOST=smtp.yourprovider.com"
echo "   EMAIL_PORT=587"
echo "   EMAIL_USER=your-email"
echo "   EMAIL_PASSWORD=your-password"
echo ""
echo "3. Set OPTIONAL variables for full features:"
echo ""
echo "   # Stripe (for subscriptions):"
echo "   STRIPE_SECRET_KEY=sk_live_xxx"
echo "   STRIPE_PUBLISHABLE_KEY=pk_live_xxx"
echo "   STRIPE_WEBHOOK_SECRET=whsec_xxx"
echo ""
echo "   # Google OAuth (for social login):"
echo "   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com"
echo "   GOOGLE_CLIENT_SECRET=xxx"
echo ""
echo "   # OpenAI (for AI features):"
echo "   OPENAI_API_KEY=sk-xxx"
echo ""
echo "   # Twilio (for SMS/WhatsApp):"
echo "   TWILIO_ACCOUNT_SID=xxx"
echo "   TWILIO_AUTH_TOKEN=xxx"
echo ""

echo -e "${BLUE}📊 OPTIONAL: Python Analytics Service${NC}"
echo "   To deploy python-analytics service:"
echo "   cd python-service && railway up"
echo ""

echo -e "${BLUE}🤖 OPTIONAL: Python RAG Service (AI)${NC}"
echo "   To deploy RAG service:"
echo "   cd python-rag-service && railway up"
echo ""

echo -e "${GREEN}🔗 Useful Commands:${NC}"
echo "   railway logs        # View logs"
echo "   railway status      # Check deployment status"
echo "   railway variables   # View all variables"
echo "   railway domain      # Get public URL"
echo "   railway open        # Open Railway dashboard"
echo ""

log_success "Railway setup complete! 🚀"
