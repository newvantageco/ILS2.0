#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}ILS 2.0 Methodical Docker Fix${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Step 1: Pre-flight checks
echo -e "${YELLOW}STEP 1: Pre-flight Checks${NC}"
echo "Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker installed: $(docker --version)${NC}"

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose installed: $(docker-compose --version)${NC}"

if ! docker ps &> /dev/null; then
    echo -e "${RED}❌ Docker daemon not running${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker daemon running${NC}"
echo ""

# Step 2: Check files
echo -e "${YELLOW}STEP 2: Verify Required Files${NC}"
files=("Dockerfile" ".env.docker" "docker-compose.yml" "package.json")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ Missing: $file${NC}"
        exit 1
    fi
done
echo ""

# Step 3: Validate database config
echo -e "${YELLOW}STEP 3: Validate Configuration${NC}"
if grep -q "DATABASE_URL.*ils_db" .env.docker; then
    echo -e "${GREEN}✅ Database URL looks correct${NC}"
else
    echo -e "${YELLOW}⚠️  Check DATABASE_URL in .env.docker${NC}"
fi
echo ""

# Step 4: Clean slate
echo -e "${YELLOW}STEP 4: Clean Previous Deployment${NC}"
docker-compose down -v 2>/dev/null || true
echo -e "${GREEN}✅ Cleaned up${NC}"
echo ""

# Step 5: Build
echo -e "${YELLOW}STEP 5: Build Application Image${NC}"
echo "Building (this takes 5-10 minutes)..."
if docker-compose build app; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# Step 6: Start infrastructure
echo -e "${YELLOW}STEP 6: Start PostgreSQL${NC}"
docker-compose up -d postgres
echo "Waiting for PostgreSQL..."
sleep 10

for i in {1..20}; do
    if docker-compose exec -T postgres pg_isready -U ils_user 2>/dev/null; then
        echo -e "${GREEN}✅ PostgreSQL ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

echo -e "${YELLOW}Starting Redis...${NC}"
docker-compose up -d redis
sleep 5
echo -e "${GREEN}✅ Redis started${NC}"
echo ""

# Step 7: Start app
echo -e "${YELLOW}STEP 7: Start Application${NC}"
docker-compose up -d app
echo "Waiting 30 seconds for app to initialize..."
sleep 30
echo ""

# Step 8: Check status
echo -e "${YELLOW}STEP 8: Check Status${NC}"
docker-compose ps
echo ""

if docker ps | grep -q ils-app; then
    echo -e "${GREEN}✅ App container running${NC}"
else
    echo -e "${RED}❌ App container not running${NC}"
    echo "Logs:"
    docker logs ils-app 2>&1 | tail -30
    exit 1
fi

echo "Testing health endpoint..."
if docker-compose exec -T app curl -sf http://localhost:5000/api/health 2>/dev/null; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Health check not ready${NC}"
    echo "App logs:"
    docker logs ils-app 2>&1 | tail -20
fi
echo ""

# Step 9: Start UIs
echo -e "${YELLOW}STEP 9: Start Management UIs${NC}"
docker-compose up -d adminer
echo -e "${GREEN}✅ Adminer started${NC}"
echo ""

# Summary
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo "📍 Access URLs:"
echo "  • Main App: http://localhost:5005"
echo "  • Health:   http://localhost:5005/api/health"
echo "  • Adminer:  http://localhost:8080"
echo ""
echo "📝 Commands:"
echo "  • Logs:     docker-compose logs -f app"
echo "  • Stop:     docker-compose down"
echo ""
echo "Try: curl http://localhost:5005/api/health"
