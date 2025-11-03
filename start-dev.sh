#!/bin/bash

# Integrated Lens System - Full Development Server Startup
# Starts both Node.js backend and Python analytics service

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   Integrated Lens System - Development Environment       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    pkill -f "python.*main.py" 2>/dev/null || true
    pkill -f "tsx server" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    echo -e "${GREEN}✓ Services stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Kill any existing instances
echo -e "${YELLOW}Cleaning up existing processes...${NC}"
pkill -f "python.*main.py" 2>/dev/null || true
pkill -f "tsx server" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 1

# Check Node.js
echo -e "${YELLOW}Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

# Check Python
echo -e "${YELLOW}Checking Python...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python $(python3 --version)${NC}"

# Install Python dependencies if needed
echo -e "${YELLOW}Checking Python dependencies...${NC}"
cd python-service
python3 -c "import fastapi" 2>/dev/null || {
    echo -e "${YELLOW}Installing Python dependencies...${NC}"
    python3 -m pip install --user -r requirements.txt > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Python dependencies installed${NC}"
    else
        echo -e "${RED}✗ Failed to install Python dependencies${NC}"
        exit 1
    fi
}
echo -e "${GREEN}✓ Python dependencies OK${NC}"

# Load Python environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Start Python service
echo -e "${YELLOW}Starting Python Analytics Service...${NC}"
python3 main.py > ../logs/python-service.log 2>&1 &
PYTHON_PID=$!
cd ..

# Wait for Python service to be ready
echo -e "${YELLOW}Waiting for Python service to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Python service ready on http://localhost:8000${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ Python service failed to start${NC}"
        echo -e "${YELLOW}Check logs at: logs/python-service.log${NC}"
        kill $PYTHON_PID 2>/dev/null || true
        exit 1
    fi
    sleep 0.5
done

# Start Node.js development server
echo -e "${YELLOW}Starting Node.js Development Server...${NC}"
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                   Services Running                        ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║  Frontend:        http://localhost:5000                   ║"
echo "║  Backend API:     http://localhost:5000/api               ║"
echo "║  Python Service:  http://localhost:8000                   ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Press Ctrl+C to stop all services${NC}"
echo ""

# Run Node.js server (this will block)
npm run dev
