#!/bin/bash

# Test script for Unified AI Service
# Usage: ./test-ai-endpoint.sh

echo "🧪 Testing Unified AI Service..."
echo "================================"
echo ""

# Check if server is running
if ! lsof -ti:3000 > /dev/null 2>&1; then
    echo "❌ Server not running on port 3000"
    echo "   Run: npm run dev"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Test 1: Health Check
echo "📋 Test 1: Health Check"
echo "   GET /api/ai/health"
HEALTH=$(curl -s http://localhost:3000/api/ai/health)
if [ $? -eq 0 ]; then
    echo "   ✅ Health endpoint accessible"
    echo "   Response: $HEALTH"
else
    echo "   ❌ Health endpoint failed"
fi
echo ""

# Test 2: Off-topic question (should be rejected)
echo "📋 Test 2: Off-Topic Question (should reject)"
echo "   POST /api/ai/chat"
echo "   Message: 'What's the weather?'"
OFFTOPIC=$(curl -s -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"message": "What is the weather today?"}')
if echo "$OFFTOPIC" | grep -q "optometry\|eye care"; then
    echo "   ✅ Correctly rejected off-topic question"
    echo "   Response snippet: $(echo "$OFFTOPIC" | head -c 100)..."
else
    echo "   ⚠️  Response: $OFFTOPIC"
fi
echo ""

# Test 3: Knowledge question (optometry)
echo "📋 Test 3: Knowledge Question"
echo "   POST /api/ai/chat"
echo "   Message: 'What are progressive lenses?'"
KNOWLEDGE=$(curl -s -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"message": "What are progressive lenses?"}')
echo "   Response: $(echo "$KNOWLEDGE" | head -c 150)..."
echo ""

# Test 4: Data question (would need auth)
echo "📋 Test 4: Data Question (needs authentication)"
echo "   POST /api/ai/chat"
echo "   Message: 'Show me recent patients'"
DATA=$(curl -s -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"message": "Show me recent patients"}')
echo "   Response: $(echo "$DATA" | head -c 150)..."
echo ""

echo "================================"
echo "✅ All tests completed"
echo ""
echo "📝 Note: For full functionality, configure:"
echo "   - OPENAI_API_KEY or ANTHROPIC_API_KEY in .env"
echo "   - Valid authentication token"
echo "   - Python RAG service on port 8080 (optional)"
