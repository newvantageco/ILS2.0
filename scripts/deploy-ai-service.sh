#!/bin/bash

# ILS 2.0 - AI Service Deployment Script
# Deploys AI service to Hugging Face Spaces with GPU support

set -e

echo "🤖 ILS 2.0 - AI Service Deployment"
echo "==================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🔍 $1${NC}"
}

# Check if huggingface_hub is installed
if ! command -v huggingface-cli &> /dev/null; then
    print_info "Installing huggingface_hub..."
    pip install huggingface_hub
fi

# Check if user is logged in to Hugging Face
if ! huggingface-cli whoami &> /dev/null; then
    print_error "You need to login to Hugging Face first"
    echo ""
    print_info "Run: huggingface-cli login"
    print_info "Get your token from: https://huggingface.co/settings/tokens"
    exit 1
fi

HF_USERNAME=$(huggingface-cli whoami)
print_success "Logged in as: $HF_USERNAME"

# Configuration
SPACE_NAME="ils-ai-service"
SPACE_ID="$HF_USERNAME/$SPACE_NAME"

echo ""
print_header "AI SERVICE DEPLOYMENT CONFIGURATION"
echo "Space ID: $SPACE_ID"
echo "Directory: ./ai-service"
echo ""

# Check if ai-service directory exists
if [ ! -d "ai-service" ]; then
    print_error "ai-service directory not found"
    exit 1
fi

# Check if required files exist
REQUIRED_FILES=("ai-service/main.py" "ai-service/requirements.txt" "ai-service/README.md")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file missing: $file"
        exit 1
    fi
done

print_success "All required files found"

# Create space if it doesn't exist
print_info "Creating Hugging Face Space..."
if huggingface-cli space create $SPACE_ID --space-type docker --public 2>/dev/null; then
    print_success "Space created: $SPACE_ID"
else
    print_warning "Space may already exist"
fi

# Deploy to Hugging Face Spaces
print_info "Deploying AI service to Hugging Face Spaces..."
cd ai-service

# Use git to push to Hugging Face Space
if [ ! -d ".git" ]; then
    print_info "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial AI service deployment"
fi

# Add Hugging Face remote
git remote add space https://huggingface.co/spaces/$SPACE_ID 2>/dev/null || true

# Push to Hugging Face
print_info "Pushing to Hugging Face Spaces..."
git push space main --force

cd ..

print_success "Deployment initiated!"

echo ""
print_header "NEXT STEPS"
echo ""
print_info "1. Wait for build to complete (5-10 minutes)"
print_info "2. Visit: https://huggingface.co/spaces/$SPACE_ID"
print_info "3. Set environment variables in Space settings:"
echo ""

cat << EOF
REQUIRED ENVIRONMENT VARIABLES:
-------------------------------
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
JWT_SECRET_KEY=your-jwt-secret-key
ENCRYPTION_KEY=your-encryption-key
CORS_ORIGIN=https://your-railway-app.railway.app

EOF

print_info "4. Test the service:"
echo "   Health: https://$SPACE_ID.hf.space/health"
echo "   API: https://$SPACE_ID.hf.space/api/v1/query"
echo ""

print_info "5. Update your main application:"
echo "   Set AI_SERVICE_URL=https://$SPACE_ID.hf.space"
echo ""

print_header "TESTING COMMANDS"
echo ""
echo "# Test health endpoint:"
echo "curl https://$SPACE_ID.hf.space/health"
echo ""
echo "# Test with authentication:"
echo "curl -X POST https://$SPACE_ID.hf.space/api/v1/auth/token \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"tenant_id\": \"test\", \"user_id\": \"test\"}'"
echo ""

print_success "AI Service deployment script completed!"
echo ""
print_warning "Remember to:"
echo "• Set environment variables in Hugging Face Space"
echo "• Update AI_SERVICE_URL in your main Railway app"
echo "• Test all AI endpoints after deployment"
echo ""

echo "🔗 Your AI Service will be available at:"
echo "https://$SPACE_ID.hf.space"
