#!/bin/bash

# Test AI Routes After Fix
# Tests all AI assistant endpoints after fixing authentication

set -e

API_URL="${TEST_API_URL:-http://localhost:3000}"
COOKIE_FILE="/tmp/test_cookies.txt"
EMAIL="${TEST_USER_EMAIL:-}"
PASSWORD="${TEST_USER_PASSWORD:-}"

# Check for required credentials
if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
  echo "Error: TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables must be set"
  echo "Usage: TEST_USER_EMAIL='user@example.com' TEST_USER_PASSWORD='password' $0"
  exit 1
fi

echo "=========================================="
echo "AI ROUTES VERIFICATION TEST"
echo "=========================================="
echo ""

# Clean up old cookies
rm -f "$COOKIE_FILE"

# Login
echo "1. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login-email" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  -c "$COOKIE_FILE" -b "$COOKIE_FILE")

if echo "$LOGIN_RESPONSE" | grep -q "Login successful"; then
  echo "   ✓ Login successful"
  USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "   User ID: $USER_ID"
else
  echo "   ✗ Login failed"
  echo "   Response: $LOGIN_RESPONSE"
  exit 1
fi
echo ""

# Test AI Stats
echo "2. Testing AI Stats Endpoint..."
STATS_RESPONSE=$(curl -s -X GET "$API_URL/api/ai-assistant/stats" \
  -b "$COOKIE_FILE" \
  -H "Content-Type: application/json")

if echo "$STATS_RESPONSE" | grep -q '"success":true'; then
  echo "   ✓ AI Stats working"
  echo "   Response: $STATS_RESPONSE"
else
  echo "   ✗ AI Stats failed"
  echo "   Response: $STATS_RESPONSE"
fi
echo ""

# Test Get Conversations
echo "3. Testing Get Conversations..."
CONV_RESPONSE=$(curl -s -X GET "$API_URL/api/ai-assistant/conversations" \
  -b "$COOKIE_FILE" \
  -H "Content-Type: application/json")

if echo "$CONV_RESPONSE" | grep -q '"success":true'; then
  echo "   ✓ Get Conversations working"
  CONV_COUNT=$(echo "$CONV_RESPONSE" | grep -o '"data":\[[^]]*\]' | grep -o '\[' | wc -l)
  echo "   Conversations found: $CONV_COUNT"
else
  echo "   ✗ Get Conversations failed"
  echo "   Response: $CONV_RESPONSE"
fi
echo ""

# Test Ask Question (Create conversation)
echo "4. Testing Ask Question (AI Chat)..."
ASK_RESPONSE=$(curl -s -X POST "$API_URL/api/ai-assistant/ask" \
  -b "$COOKIE_FILE" \
  -H "Content-Type: application/json" \
  -d '{"question":"What is the Integrated Lens System?","context":{"source":"test"}}')

if echo "$ASK_RESPONSE" | grep -q '"success":true\|"answer"'; then
  echo "   ✓ Ask Question working"
  CONVERSATION_ID=$(echo "$ASK_RESPONSE" | grep -o '"conversationId":"[^"]*"' | cut -d'"' -f4)
  echo "   Conversation ID: $CONVERSATION_ID"
else
  echo "   ✗ Ask Question failed"
  echo "   Response: $ASK_RESPONSE"
fi
echo ""

# Test Get Specific Conversation (if we created one)
if [ -n "$CONVERSATION_ID" ]; then
  echo "5. Testing Get Specific Conversation..."
  SINGLE_CONV_RESPONSE=$(curl -s -X GET "$API_URL/api/ai-assistant/conversations/$CONVERSATION_ID" \
    -b "$COOKIE_FILE" \
    -H "Content-Type: application/json")
  
  if echo "$SINGLE_CONV_RESPONSE" | grep -q '"id":"'$CONVERSATION_ID'"'; then
    echo "   ✓ Get Specific Conversation working"
  else
    echo "   ✗ Get Specific Conversation failed"
    echo "   Response: $SINGLE_CONV_RESPONSE"
  fi
  echo ""
fi

# Test Learning Data Upload
echo "6. Testing Learning Data Upload..."
# Create a test file
TEST_FILE="/tmp/test_learning.txt"
echo "This is test learning data for the Integrated Lens System. It contains information about lens orders and prescriptions." > "$TEST_FILE"

UPLOAD_RESPONSE=$(curl -s -X POST "$API_URL/api/ai-assistant/learning/upload" \
  -b "$COOKIE_FILE" \
  -F "file=@$TEST_FILE" \
  -F "metadata={\"title\":\"Test Learning Data\",\"type\":\"documentation\",\"category\":\"general\"}")

if echo "$UPLOAD_RESPONSE" | grep -q '"success":true'; then
  echo "   ✓ Learning Data Upload working"
  LEARNING_ID=$(echo "$UPLOAD_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "   Learning Data ID: $LEARNING_ID"
else
  echo "   ✗ Learning Data Upload failed"
  echo "   Response: $UPLOAD_RESPONSE"
fi
rm -f "$TEST_FILE"
echo ""

# Test Get Learning Data
echo "7. Testing Get Learning Data..."
LEARNING_RESPONSE=$(curl -s -X GET "$API_URL/api/ai-assistant/learning" \
  -b "$COOKIE_FILE" \
  -H "Content-Type: application/json")

if echo "$LEARNING_RESPONSE" | grep -q '"success":true\|"data"'; then
  echo "   ✓ Get Learning Data working"
  LEARNING_COUNT=$(echo "$LEARNING_RESPONSE" | grep -o '"id":"[^"]*"' | wc -l)
  echo "   Learning entries found: $LEARNING_COUNT"
else
  echo "   ✗ Get Learning Data failed"
  echo "   Response: $LEARNING_RESPONSE"
fi
echo ""

# Test Feedback Submission (if we have a conversation)
if [ -n "$CONVERSATION_ID" ]; then
  echo "8. Testing Feedback Submission..."
  FEEDBACK_RESPONSE=$(curl -s -X POST "$API_URL/api/ai-assistant/feedback" \
    -b "$COOKIE_FILE" \
    -H "Content-Type: application/json" \
    -d "{\"conversationId\":\"$CONVERSATION_ID\",\"rating\":5,\"comment\":\"Great answer, very helpful!\"}")
  
  if echo "$FEEDBACK_RESPONSE" | grep -q '"success":true'; then
    echo "   ✓ Feedback Submission working"
  else
    echo "   ✗ Feedback Submission failed"
    echo "   Response: $FEEDBACK_RESPONSE"
  fi
  echo ""
fi

# Final stats check
echo "9. Final Stats Check (should show activity)..."
FINAL_STATS=$(curl -s -X GET "$API_URL/api/ai-assistant/stats" \
  -b "$COOKIE_FILE" \
  -H "Content-Type: application/json")

if echo "$FINAL_STATS" | grep -q '"success":true'; then
  echo "   ✓ Final Stats retrieved"
  echo "   $FINAL_STATS"
else
  echo "   ✗ Final Stats failed"
fi
echo ""

echo "=========================================="
echo "AI ROUTES TEST COMPLETE"
echo "=========================================="
