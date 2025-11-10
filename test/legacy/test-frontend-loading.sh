#!/bin/bash

echo "=== Frontend Loading Diagnostics ==="
echo ""

# Test home page
echo "1. Testing Home Page (/)..."
RESPONSE=$(curl -s http://localhost:3000/)
if echo "$RESPONSE" | grep -q '<div id="root">'; then
    echo "   ✓ HTML container found"
else
    echo "   ✗ HTML container missing"
fi

if echo "$RESPONSE" | grep -q 'Integrated Lens System'; then
    echo "   ✓ Page title found"
else
    echo "   ✗ Page title missing"
fi

if echo "$RESPONSE" | grep -q 'vite/client'; then
    echo "   ✓ Vite client script found"
else
    echo "   ✗ Vite client script missing"
fi
echo ""

# Test login page
echo "2. Testing Login Page (/login)..."
RESPONSE=$(curl -s http://localhost:3000/login)
if echo "$RESPONSE" | grep -q '<div id="root">'; then
    echo "   ✓ HTML container found"
else
    echo "   ✗ HTML container missing"
fi
echo ""

# Test API health
echo "3. Testing API Health..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
echo "   Status: $STATUS"
if [ "$STATUS" = "200" ]; then
    echo "   ✓ API is healthy"
else
    echo "   ✗ API returned $STATUS"
fi
echo ""

# Test authentication endpoint
echo "4. Testing Auth Endpoint..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/user)
echo "   Status: $STATUS (should be 401 - unauthorized)"
if [ "$STATUS" = "401" ]; then
    echo "   ✓ Auth endpoint working"
else
    echo "   ✗ Auth endpoint returned $STATUS"
fi
echo ""

# Test static assets
echo "5. Testing Static Assets..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/@vite/client)
echo "   Vite client: $STATUS"
if [ "$STATUS" = "200" ] || [ "$STATUS" = "304" ]; then
    echo "   ✓ Vite client loading"
else
    echo "   ✗ Vite client returned $STATUS"
fi
echo ""

# Check for JavaScript console errors via simple test
echo "6. Checking for Common Issues..."
RESPONSE=$(curl -s http://localhost:3000/)
if echo "$RESPONSE" | grep -q 'type="module"'; then
    echo "   ✓ ES modules configured"
else
    echo "   ✗ ES modules not found"
fi

if echo "$RESPONSE" | grep -q 'manifest.json'; then
    echo "   ✓ PWA manifest linked"
else
    echo "   ✗ PWA manifest missing"
fi
echo ""

echo "=== Diagnostic Complete ==="
echo ""
echo "Open browser to: http://localhost:3000"
echo "Check browser console (F12) for JavaScript errors"
