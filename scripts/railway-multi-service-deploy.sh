#!/bin/bash

# ================================
# ILS 2.0 - Railway Multi-Service Deployment Script
# ================================
# This script automates the deployment of all ILS 2.0 services to Railway
#
# Prerequisites:
# - Railway CLI installed: npm i -g @railway/cli
# - Logged in to Railway: railway login
# - Railway project created
#
# Usage:
#   ./scripts/railway-multi-service-deploy.sh [options]
#
# Options:
#   --all          Deploy all services (main, ai, analytics, rag)
#   --main         Deploy main application only
#   --ai           Deploy AI service only
#   --analytics    Deploy analytics service only
#   --rag          Deploy RAG service only
#   --check        Check deployment status
#   --setup        Initial setup (create project and services)
#   --env          Set environment variables from template
#   --help         Show this help message
#
# Example:
#   ./scripts/railway-multi-service-deploy.sh --all
#   ./scripts/railway-multi-service-deploy.sh --main
#   ./scripts/railway-multi-service-deploy.sh --setup
# ================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_NAME="ils-2.0"
MAIN_SERVICE="ils-main-app"
AI_SERVICE="ils-ai-service"
ANALYTICS_SERVICE="ils-analytics-service"
RAG_SERVICE="ils-rag-service"

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Railway CLI is installed
check_railway_cli() {
    if ! command -v railway &> /dev/null; then
        log_error "Railway CLI is not installed"
        log_info "Install with: npm i -g @railway/cli"
        exit 1
    fi
    log_success "Railway CLI is installed"
}

# Check if logged in to Railway
check_railway_auth() {
    if ! railway whoami &> /dev/null; then
        log_error "Not logged in to Railway"
        log_info "Login with: railway login"
        exit 1
    fi
    log_success "Logged in to Railway"
}

# Initial setup - create project and services
setup_railway_project() {
    log_info "Setting up Railway project..."

    echo ""
    log_info "Step 1: Creating Railway project"
    echo "Please follow the Railway CLI prompts to create or link a project."
    echo ""

    railway init

    log_success "Project setup complete"

    echo ""
    log_info "Step 2: Adding PostgreSQL database"
    echo ""

    railway add -p postgresql
    log_success "PostgreSQL added"

    echo ""
    log_info "Step 3: Adding Redis (optional but recommended)"
    read -p "Do you want to add Redis? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        railway add -p redis
        log_success "Redis added"
    else
        log_warning "Skipping Redis - you can add it later"
    fi

    echo ""
    log_info "Step 4: Enabling pgvector extension"
    log_warning "You need to manually enable pgvector in PostgreSQL"
    echo "Run: railway run psql \$DATABASE_URL"
    echo "Then: CREATE EXTENSION IF NOT EXISTS vector;"
    echo ""
    read -p "Press enter when you've enabled pgvector..."

    log_success "Railway project setup complete!"
    echo ""
    log_info "Next steps:"
    echo "1. Set environment variables: ./scripts/railway-multi-service-deploy.sh --env"
    echo "2. Deploy services: ./scripts/railway-multi-service-deploy.sh --all"
}

# Set environment variables from template
set_environment_variables() {
    log_info "Setting environment variables..."

    if [ ! -f "railway.env.template" ]; then
        log_error "railway.env.template not found"
        exit 1
    fi

    echo ""
    log_warning "This will guide you through setting required environment variables"
    log_info "You can also set these manually in Railway dashboard"
    echo ""

    # Generate secrets
    log_info "Generating security secrets..."
    SESSION_SECRET=$(openssl rand -hex 32)
    CSRF_SECRET=$(openssl rand -hex 32)
    JWT_SECRET=$(openssl rand -hex 32)

    echo "SESSION_SECRET=$SESSION_SECRET"
    echo "CSRF_SECRET=$CSRF_SECRET"
    echo "JWT_SECRET=$JWT_SECRET"
    echo ""

    # Set core variables
    log_info "Setting core variables..."
    railway variables set NODE_ENV=production
    railway variables set PORT=5000
    railway variables set HOST=0.0.0.0
    railway variables set SESSION_SECRET="$SESSION_SECRET"
    railway variables set CSRF_SECRET="$CSRF_SECRET"
    railway variables set JWT_SECRET="$JWT_SECRET"

    # Get Railway domain
    log_info "Generating Railway domain..."
    DOMAIN=$(railway domain 2>&1 || echo "")

    if [ -n "$DOMAIN" ]; then
        railway variables set APP_URL="https://$DOMAIN"
        railway variables set CORS_ORIGIN="https://$DOMAIN"
        log_success "Domain configured: https://$DOMAIN"
    else
        log_warning "Could not generate domain automatically"
        log_info "Set APP_URL and CORS_ORIGIN manually after deployment"
    fi

    echo ""
    log_warning "Required: Set the following variables manually in Railway dashboard:"
    echo "- RESEND_API_KEY or SMTP credentials"
    echo "- STRIPE_SECRET_KEY and related Stripe variables"
    echo "- Storage provider credentials (AWS S3, R2, etc.)"
    echo ""
    log_info "Optional: Set AI service keys (OPENAI_API_KEY, ANTHROPIC_API_KEY)"
    echo ""

    log_success "Basic environment variables set!"
}

# Deploy main application
deploy_main() {
    log_info "Deploying main application..."

    cd "$(git rev-parse --show-toplevel)"

    log_info "Building and deploying..."
    railway up --detach

    log_success "Main application deployed!"
    log_info "View logs: railway logs"
}

# Deploy AI service
deploy_ai() {
    log_info "Deploying AI service..."

    if [ ! -d "ai-service" ]; then
        log_error "ai-service directory not found"
        exit 1
    fi

    cd ai-service

    log_info "Deploying AI service..."
    railway up --detach

    # Set PORT if not set
    railway variables set PORT=8080

    cd ..
    log_success "AI service deployed!"
}

# Deploy Analytics service
deploy_analytics() {
    log_info "Deploying Analytics service..."

    if [ ! -d "python-service" ]; then
        log_error "python-service directory not found"
        exit 1
    fi

    cd python-service

    log_info "Deploying Analytics service..."
    railway up --detach

    # Set PORT if not set
    railway variables set PORT=8000

    cd ..
    log_success "Analytics service deployed!"
}

# Deploy RAG service
deploy_rag() {
    log_info "Deploying RAG service..."

    if [ ! -d "python-rag-service" ]; then
        log_error "python-rag-service directory not found"
        exit 1
    fi

    cd python-rag-service

    log_info "Deploying RAG service..."
    railway up --detach

    # Set PORT if not set
    railway variables set PORT=8001

    cd ..
    log_success "RAG service deployed!"
}

# Deploy all services
deploy_all() {
    log_info "Deploying all services..."
    echo ""

    deploy_main
    echo ""

    read -p "Deploy AI service? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_ai
        echo ""
    fi

    read -p "Deploy Analytics service? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_analytics
        echo ""
    fi

    read -p "Deploy RAG service? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_rag
        echo ""
    fi

    log_success "All selected services deployed!"
    echo ""
    log_info "Check deployment status: railway status"
    log_info "View logs: railway logs"
}

# Check deployment status
check_status() {
    log_info "Checking deployment status..."
    echo ""

    railway status

    echo ""
    log_info "Recent deployments:"
    railway list

    echo ""
    log_info "To view logs: railway logs"
    log_info "To view variables: railway variables"
}

# Show help
show_help() {
    cat << EOF
ILS 2.0 - Railway Multi-Service Deployment Script

This script automates the deployment of all ILS 2.0 services to Railway.

Prerequisites:
  - Railway CLI installed: npm i -g @railway/cli
  - Logged in to Railway: railway login
  - Railway project created

Usage:
  ./scripts/railway-multi-service-deploy.sh [options]

Options:
  --all          Deploy all services (main, ai, analytics, rag)
  --main         Deploy main application only
  --ai           Deploy AI service only
  --analytics    Deploy analytics service only
  --rag          Deploy RAG service only
  --check        Check deployment status
  --setup        Initial setup (create project and services)
  --env          Set environment variables from template
  --help         Show this help message

Examples:
  ./scripts/railway-multi-service-deploy.sh --setup       # Initial setup
  ./scripts/railway-multi-service-deploy.sh --env         # Set environment variables
  ./scripts/railway-multi-service-deploy.sh --all         # Deploy all services
  ./scripts/railway-multi-service-deploy.sh --main        # Deploy main app only
  ./scripts/railway-multi-service-deploy.sh --check       # Check status

Deployment Flow:
  1. Run --setup to create Railway project and add databases
  2. Enable pgvector extension in PostgreSQL
  3. Run --env to set environment variables
  4. Set additional required variables in Railway dashboard:
     - Email service credentials (Resend or SMTP)
     - Stripe payment credentials
     - Storage provider credentials
  5. Run --all to deploy all services
  6. Configure Stripe webhooks with your Railway URL
  7. Test your deployment

For more information, see RAILWAY_DEPLOYMENT.md

EOF
}

# Main script
main() {
    echo ""
    echo "================================"
    echo "ILS 2.0 - Railway Deployment"
    echo "================================"
    echo ""

    # Check prerequisites
    check_railway_cli

    # Parse arguments
    if [ $# -eq 0 ]; then
        log_error "No arguments provided"
        echo ""
        show_help
        exit 1
    fi

    case "$1" in
        --setup)
            check_railway_auth
            setup_railway_project
            ;;
        --env)
            check_railway_auth
            set_environment_variables
            ;;
        --all)
            check_railway_auth
            deploy_all
            ;;
        --main)
            check_railway_auth
            deploy_main
            ;;
        --ai)
            check_railway_auth
            deploy_ai
            ;;
        --analytics)
            check_railway_auth
            deploy_analytics
            ;;
        --rag)
            check_railway_auth
            deploy_rag
            ;;
        --check)
            check_railway_auth
            check_status
            ;;
        --help)
            show_help
            ;;
        *)
            log_error "Unknown option: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac

    echo ""
    log_success "Done!"
    echo ""
}

# Run main script
main "$@"
