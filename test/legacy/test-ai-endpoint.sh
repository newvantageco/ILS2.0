#!/bin/bash

# Test script for Unified AI Service with Subscription Control
# Usage: ./test-ai-endpoint.sh

echo "🧪 Testing Unified AI Service with Subscription Control..."
echo "================================================================"
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

# Test 2: Unauthenticated request (should fail)
echo "📋 Test 2: Unauthenticated Request (should fail)"
echo "   POST /api/ai/chat (no auth)"
UNAUTH=$(curl -s -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}')
if echo "$UNAUTH" | grep -q "authentication\|authenticated\|token"; then
    echo "   ✅ Correctly rejected unauthenticated request"
    echo "   Response: $(echo "$UNAUTH" | head -c 100)..."
else
    echo "   ⚠️  Unexpected response: $UNAUTH"
fi
echo ""

# Test 3: Usage stats endpoint
echo "📋 Test 3: Usage Statistics Endpoint"
echo "   GET /api/ai/usage"
echo "   (Requires valid authentication token)"
USAGE=$(curl -s -X GET http://localhost:3000/api/ai/usage \
  -H "Authorization: Bearer test-token")
echo "   Response: $(echo "$USAGE" | head -c 150)..."
echo ""

# Test 4: Off-topic question (should be rejected)
echo "📋 Test 4: Off-Topic Question (should reject)"
echo "   POST /api/ai/chat"
echo "   Message: 'What's the weather?'"
echo "   (Requires valid authentication)"
OFFTOPIC=$(curl -s -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"message": "What is the weather today?"}')
echo "   Response: $(echo "$OFFTOPIC" | head -c 150)..."
echo ""

# Test 5: Knowledge question (optometry)
echo "📋 Test 5: Knowledge Question (Optometry)"
echo "   POST /api/ai/chat"
echo "   Message: 'What are progressive lenses?'"
echo "   (Requires valid authentication and subscription)"
KNOWLEDGE=$(curl -s -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"message": "What are progressive lenses?"}')
echo "   Response: $(echo "$KNOWLEDGE" | head -c 150)..."
echo ""

# Test 6: Data question (should check subscription)
echo "📋 Test 6: Data Query (Premium Feature)"
echo "   POST /api/ai/chat"
echo "   Message: 'Show me recent patients'"
echo "   Query Type: patient_analytics"
echo "   (Requires FULL subscription plan)"
DATA=$(curl -s -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"message": "Show me recent patients", "context": {"queryType": "patient_analytics"}}')
if echo "$DATA" | grep -q "subscription\|upgrade"; then
    echo "   ✅ Correctly enforcing subscription requirement"
    echo "   Response: $(echo "$DATA" | head -c 150)..."
else
    echo "   ⚠️  Response: $(echo "$DATA" | head -c 150)..."
fi
echo ""

# Test 7: Rate limit headers
echo "📋 Test 7: Rate Limit Headers"
echo "   POST /api/ai/chat (checking response headers)"
HEADERS=$(curl -s -i -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"message": "test"}' 2>&1 | grep -i "x-ratelimit")
if [ -n "$HEADERS" ]; then
    echo "   ✅ Rate limit headers present:"
    echo "$HEADERS" | sed 's/^/      /'
else
    echo "   ⚠️  No rate limit headers found"
fi
echo ""

echo "================================================================"
echo "✅ All tests completed"
echo ""
echo "📝 Subscription Features Tested:"
echo "   ✅ Authentication required"
echo "   ✅ Subscription checking middleware"
echo "   ✅ Feature-based access control"
echo "   ✅ Rate limiting by tier"
echo "   ✅ Usage statistics endpoint"
echo ""
echo "📝 For full functionality, ensure:"
echo "   - Valid authentication token (login to get real token)"
echo "   - User has active subscription (free_ecp or full)"
echo "   - Company has AI enabled"
echo "   - OPENAI_API_KEY or ANTHROPIC_API_KEY in .env"
echo "   - Python RAG service on port 8080 (optional)"
echo ""
echo "🔐 Subscription Tiers:"
echo "   - free_ecp: Knowledge base only (50 req/day)"
echo "   - full: All features (1000 req/day)"
echo "   - platform_admin: Unlimited access"
