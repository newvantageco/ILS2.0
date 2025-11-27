#!/bin/bash

# =================================================================
# ILS 2.0 - Full Stack Railway Provisioning Guide
# =================================================================
# This script guides you through creating the complete infrastructure
# on Railway:
# 1. Main Web Service (Node.js)
# 2. Postgres Database (with pgvector support)
# 3. Redis (for queues)
# 4. AI Service (Python)
# 5. Analytics Service (Python)
# =================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 ILS 2.0 - Railway Full Stack Setup${NC}"
echo "========================================"

# Check if logged in
if ! railway whoami &>/dev/null; then
    echo "Please login first:"
    railway login
fi

echo -e "\n${YELLOW}Step 1: Create or Select Project${NC}"
echo "Run the following to link to your project:"
echo -e "${GREEN}railway link${NC}"
echo "(Select 'ILS.2.0' or create a new one)"
echo ""
read -p "Press Enter after you have run 'railway link'..."

echo -e "\n${YELLOW}Step 2: Provision Databases${NC}"
echo "You need to add PostgreSQL and Redis via the Railway Dashboard or CLI."
echo "Go to https://railway.app/project/$(railway status --json | grep projectId | cut -d '"' -f 4)"
echo "1. Click 'New' -> 'Database' -> 'PostgreSQL'"
echo "2. Click 'New' -> 'Database' -> 'Redis'"
echo ""
read -p "Press Enter after you have provisioned Postgres and Redis..."

echo -e "\n${YELLOW}Step 3: Deploy Main Web Service${NC}"
echo "This directory is the root of the Monorepo. We will deploy it as the Main Service."
echo "Run:"
echo -e "${GREEN}railway up --service web${NC}"
echo "(If prompted to create a service, name it 'web')"
echo ""
read -p "Press Enter to continue to AI Service setup..."

echo -e "\n${YELLOW}Step 4: Deploy AI Service${NC}"
echo "We will now deploy the Python AI Service."
echo "1. Create a new service in Railway named 'ai-service'"
echo "2. Link this directory to it, but with a subfolder root."
echo "   Run:"
echo -e "${GREEN}railway service${NC} (Select 'ai-service' or create it)"
echo -e "${GREEN}railway up --service ai-service${NC}"
echo "   *IMPORTANT*: In Railway Dashboard -> ai-service -> Settings -> Root Directory, set it to: /ai-service"
echo ""
read -p "Press Enter to continue to Analytics Service setup..."

echo -e "\n${YELLOW}Step 5: Deploy Analytics Service${NC}"
echo "1. Create a new service in Railway named 'python-service'"
echo "2. Link/Deploy:"
echo -e "${GREEN}railway service${NC} (Select 'python-service' or create it)"
echo -e "${GREEN}railway up --service python-service${NC}"
echo "   *IMPORTANT*: In Railway Dashboard -> python-service -> Settings -> Root Directory, set it to: /python-service"

echo -e "\n${BLUE}🎉 Configuration Complete!${NC}"
echo "Don't forget to run 'npm run validate:railway' to check your environment variables!"
