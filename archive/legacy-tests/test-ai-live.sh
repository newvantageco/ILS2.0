#!/bin/bash

echo "🧪 Testing AI Assistant - Live System"
echo "======================================"
echo ""

# Test 1: Check if server is running
echo "1️⃣ Checking server status..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Server is running on port 3000"
else
    echo "❌ Server is NOT running"
    exit 1
fi
echo ""

# Test 2: Test AI chat endpoint
echo "2️⃣ Testing AI chat with Ollama..."
echo "Question: 'What does sphere mean in a prescription?'"
echo ""

RESPONSE=$(curl -s -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What does sphere mean in a prescription?",
    "conversationId": null
  }')

echo "Response:"
echo "$RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(f\"✅ Message: {data.get('response', 'N/A')[:200]}...\"); print(f\"✅ Provider: {data.get('provider', 'N/A')}\"); print(f\"✅ Model: {data.get('model', 'N/A')}\"); print(f\"✅ Cost: ${data.get('usage', {}).get('cost', 0)}\"); print(f\"✅ Tokens: {data.get('usage', {}).get('totalTokens', 0)}\")"
echo ""

# Test 3: Check available providers
echo "3️⃣ Checking available AI providers..."
PROVIDERS=$(curl -s http://localhost:3000/api/ai/status)
echo "$PROVIDERS" | python3 -c "import sys, json; data = json.load(sys.stdin); print(f\"Available providers: {', '.join(data.get('availableProviders', []))}\")"
echo ""

echo "======================================"
echo "🎉 AI System Test Complete!"
echo ""
echo "Next steps:"
echo "1. Open browser: http://localhost:3000/ecp/ai-assistant"
echo "2. Login with: saban@newvantageco.com"
echo "3. Ask questions and verify responses come from Ollama (free!)"
