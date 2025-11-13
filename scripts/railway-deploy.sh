#!/bin/bash

# ========================================
# Railway Deployment Script for ILS 2.0
# ========================================
# This script helps deploy ILS 2.0 to Railway with validation checks

set -e  # Exit on error

echo "🚂 Railway Deployment Script for ILS 2.0"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to print success
print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
print_error() {
  echo -e "${RED}✗${NC} $1"
}

# Function to print warning
print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists railway; then
  print_error "Railway CLI not found!"
  echo "   Install it with: npm install -g @railway/cli"
  echo "   Or visit: https://docs.railway.app/develop/cli"
  exit 1
fi
print_success "Railway CLI installed"

if ! command_exists node; then
  print_error "Node.js not found!"
  exit 1
fi
print_success "Node.js installed ($(node --version))"

if ! command_exists npm; then
  print_error "npm not found!"
  exit 1
fi
print_success "npm installed ($(npm --version))"

echo ""

# Check if we're logged in to Railway
echo "🔐 Checking Railway authentication..."
if ! railway whoami &>/dev/null; then
  print_warning "Not logged in to Railway"
  echo "   Running: railway login"
  railway login
fi
print_success "Logged in to Railway"

echo ""

# Check if project is linked
echo "🔗 Checking Railway project link..."
if ! railway status &>/dev/null; then
  print_warning "Project not linked to Railway"
  echo "   Would you like to:"
  echo "   1) Link to existing project"
  echo "   2) Create new project"
  read -p "   Enter choice (1 or 2): " choice

  if [ "$choice" = "1" ]; then
    railway link
  else
    railway init
  fi
fi
print_success "Project linked to Railway"

echo ""

# Run type checking
echo "🔍 Running TypeScript type check..."
if npm run check; then
  print_success "TypeScript compilation passed"
else
  print_error "TypeScript compilation failed"
  read -p "   Continue anyway? (y/N): " continue_choice
  if [ "$continue_choice" != "y" ] && [ "$continue_choice" != "Y" ]; then
    exit 1
  fi
fi

echo ""

# Check for .env.example
echo "📄 Checking environment configuration..."
if [ -f ".env.example" ]; then
  print_success ".env.example found"
  print_warning "Make sure all required environment variables are set in Railway!"
  echo "   Visit: railway open"
else
  print_warning ".env.example not found"
fi

echo ""

# Confirm deployment
echo "🚀 Ready to deploy to Railway!"
echo ""
echo "   This will:"
echo "   • Build your Docker image"
echo "   • Deploy to Railway"
echo "   • Run database migrations (if configured)"
echo ""
read -p "   Continue with deployment? (y/N): " deploy_choice

if [ "$deploy_choice" != "y" ] && [ "$deploy_choice" != "Y" ]; then
  echo "Deployment cancelled."
  exit 0
fi

echo ""
echo "📦 Deploying to Railway..."

# Deploy using Railway
if railway up; then
  print_success "Deployment initiated successfully!"
  echo ""
  echo "📊 Checking deployment status..."
  railway status
  echo ""
  print_success "Deployment complete!"
  echo ""
  echo "Useful commands:"
  echo "  • View logs:    railway logs"
  echo "  • Open app:     railway open"
  echo "  • Check status: railway status"
else
  print_error "Deployment failed!"
  echo "   Check logs with: railway logs"
  exit 1
fi
