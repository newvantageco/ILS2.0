#!/bin/bash

echo "==================================="
echo "Proprietary AI System Tests"
echo "==================================="
echo ""

BASE_URL="http://localhost:5000"

# You'll need a valid auth token - this is a placeholder
TOKEN="your-auth-token-here"

echo "Test 1: On-Topic Question (Should Accept)"
echo "Question: What lens material is best for high prescriptions?"
echo ""
curl -s -X POST "$BASE_URL/api/proprietary-ai/ask" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "question": "What lens material is best for high prescriptions?"
  }' | jq . || echo "Need authentication token"

echo ""
echo "==================================="
echo ""

echo "Test 2: Off-Topic Question (Should Reject)"
echo "Question: What is the weather like today?"
echo ""
curl -s -X POST "$BASE_URL/api/proprietary-ai/ask" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "question": "What is the weather like today?"
  }' | jq . || echo "Need authentication token"

echo ""
echo "==================================="
echo ""

echo "Test 3: Optometry Question (Should Accept)"
echo "Question: How do I measure pupillary distance?"
echo ""
curl -s -X POST "$BASE_URL/api/proprietary-ai/ask" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "question": "How do I measure pupillary distance?"
  }' | jq . || echo "Need authentication token"

echo ""
echo "==================================="
echo ""

echo "Test 4: Python Service Health Check"
echo ""
curl -s http://localhost:8000/health | jq .

echo ""
echo "==================================="
echo ""

echo "Test 5: Python Analytics"
echo ""
curl -s "http://localhost:8000/api/v1/analytics/order-trends?days=30" | jq .

echo ""
echo "==================================="
echo ""

echo "Test 6: Python ML Prediction"
echo ""
curl -s -X POST http://localhost:8000/api/v1/ml/predict-production-time \
  -H "Content-Type: application/json" \
  -d '{
    "lens_type":"progressive",
    "lens_material":"polycarbonate",
    "coating":"anti_reflective",
    "complexity_score":2
  }' | jq .

echo ""
echo "==================================="
echo "Tests Complete!"
echo "==================================="
