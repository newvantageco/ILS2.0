#!/bin/sh
# Docker Development Startup Script
# Runs both Vite frontend and Node.js backend

echo "🚀 Starting ILS Development Services..."

# Start Vite frontend in background
echo "📦 Starting Vite frontend on port 5173..."
npx vite --host 0.0.0.0 --port 5173 &
VITE_PID=$!

# Give Vite a moment to start
sleep 2

# Start Node.js backend
echo "🔧 Starting Node.js backend on port 5000..."
NODE_ENV=development npx tsx server/index.ts &
NODE_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down services..."
    kill $VITE_PID 2>/dev/null
    kill $NODE_PID 2>/dev/null
    exit 0
}

trap cleanup SIGTERM SIGINT

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✨ Development Environment Ready!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  🌐 Frontend (Vite):  http://localhost:5173"
echo "  🔌 Backend API:      http://localhost:5001"
echo ""
echo "═══════════════════════════════════════════════════════════"

# Wait for both processes
wait
