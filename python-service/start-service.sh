#!/bin/bash

# Start Python Analytics Service
# This script ensures the service starts correctly with proper environment

cd "$(dirname "$0")"

echo "=== Python Analytics Service Startup ==="
echo "Working directory: $(pwd)"

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"

# Check if requirements are installed
echo "Checking dependencies..."
python3 -c "import fastapi" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing dependencies..."
    python3 -m pip install --user -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
fi

echo "✓ Dependencies installed"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✓ Environment variables loaded"
fi

# Set default port if not specified
export PORT=${PORT:-8000}

echo ""
echo "Starting Python Analytics Service on port $PORT..."
echo "Health check: http://localhost:$PORT/health"
echo ""

# Start the service
python3 main.py
