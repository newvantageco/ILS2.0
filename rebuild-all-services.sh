#!/bin/bash
# ILS 2.0 - Complete Service Rebuild Script
# This script rebuilds all services with Python analytics and AI services

set -e  # Exit on error

echo "🚀 ILS 2.0 Complete Service Rebuild"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📦 Step 1: Stopping existing containers...${NC}"
docker-compose down
echo -e "${GREEN}✅ Containers stopped${NC}"
echo ""

echo -e "${YELLOW}🗑️  Step 2: Removing old images (optional)...${NC}"
docker rmi ils20-app 2>/dev/null || echo "Main app image not found (OK)"
docker rmi ils20-python-service 2>/dev/null || echo "Python service image not found (OK)"
docker rmi ils20-ai-service 2>/dev/null || echo "AI service image not found (OK)"
echo -e "${GREEN}✅ Old images removed${NC}"
echo ""

echo -e "${YELLOW}🏗️  Step 3: Building all services...${NC}"
echo "This may take 5-10 minutes for first build..."
docker-compose build --no-cache
echo -e "${GREEN}✅ All services built${NC}"
echo ""

echo -e "${YELLOW}🚀 Step 4: Starting all services...${NC}"
docker-compose up -d
echo -e "${GREEN}✅ Services started${NC}"
echo ""

echo -e "${YELLOW}⏳ Step 5: Waiting for services to be healthy...${NC}"
echo "Waiting 60 seconds for initialization..."
sleep 60
echo ""

echo -e "${YELLOW}🔍 Step 6: Checking service health...${NC}"
echo ""

# Check each service
echo "Checking PostgreSQL..."
docker exec ils-postgres pg_isready -U ils_user -d ils_db && echo -e "${GREEN}✅ PostgreSQL: HEALTHY${NC}" || echo -e "${RED}❌ PostgreSQL: FAILED${NC}"
echo ""

echo "Checking Redis..."
docker exec ils-redis redis-cli ping && echo -e "${GREEN}✅ Redis: HEALTHY${NC}" || echo -e "${RED}❌ Redis: FAILED${NC}"
echo ""

echo "Checking Python Analytics Service (port 8000)..."
curl -s http://localhost:8000/health > /dev/null 2>&1 && echo -e "${GREEN}✅ Python Service: HEALTHY${NC}" || echo -e "${RED}❌ Python Service: FAILED${NC}"
echo ""

echo "Checking AI Service (port 8082)..."
curl -s http://localhost:8082/health > /dev/null 2>&1 && echo -e "${GREEN}✅ AI Service: HEALTHY${NC}" || echo -e "${RED}❌ AI Service: FAILED (check logs)${NC}"
echo ""

echo "Checking Main Application (port 5005)..."
curl -s http://localhost:5005/api/health > /dev/null 2>&1 && echo -e "${GREEN}✅ Main App: HEALTHY${NC}" || echo -e "${RED}❌ Main App: FAILED${NC}"
echo ""

echo -e "${YELLOW}📊 Step 7: Service Status Summary${NC}"
docker-compose ps
echo ""

echo "======================================"
echo -e "${GREEN}🎉 Rebuild Complete!${NC}"
echo "======================================"
echo ""
echo "🌐 Access Points:"
echo "  • Frontend:        http://localhost:5005"
echo "  • API Health:      http://localhost:5005/api/health"
echo "  • Python Service:  http://localhost:8000"
echo "  • AI Service:      http://localhost:8082"
echo "  • Adminer (DB UI): http://localhost:8080"
echo "  • Redis UI:        http://localhost:8081"
echo ""
echo "📝 Useful Commands:"
echo "  • View logs:       docker logs ils-app -f"
echo "  • View all logs:   docker-compose logs -f"
echo "  • Stop services:   docker-compose down"
echo "  • Restart:         docker-compose restart"
echo ""
echo "⚠️  If services failed, check logs:"
echo "  docker logs ils-app --tail 100"
echo "  docker logs ils-python-service --tail 100"
echo "  docker logs ils-ai-service --tail 100"
echo ""
