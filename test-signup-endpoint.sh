#!/bin/bash
# Test signup endpoint availability
# Run this after starting the server: npm run dev

echo "Testing signup endpoints..."
echo ""

# Test if onboarding routes are registered
echo "1. Testing POST /api/onboarding/signup (should return 400 with validation error, not 404)"
curl -X POST http://localhost:5000/api/onboarding/signup \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "2. Testing GET /api/onboarding/company-check (should return 200 or 400, not 404)"
curl -X GET "http://localhost:5000/api/onboarding/company-check?name=Test" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "3. Testing POST /api/auth/jwt/login (should return 400 validation error, not 404)"
curl -X POST http://localhost:5000/api/auth/jwt/login \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "================================================"
echo "Expected Results:"
echo "  - If you see 404: Routes NOT registered ❌"
echo "  - If you see 400: Routes ARE registered ✅"
echo "  - If you see 200: Routes working perfectly ✅"
echo "================================================"
