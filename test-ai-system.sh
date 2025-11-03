#!/bin/bash

# AI System Comprehensive Testing Script
# Tests all AI providers and functionality

set -e

echo "=========================================="
echo "  AI SYSTEM COMPREHENSIVE TEST"
echo "  Integrated Lens System"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Function to print section header
section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to check if server is running
check_server() {
    if curl -s http://localhost:3000/api/health &> /dev/null || curl -s http://localhost:3000 &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# ==========================================
# TEST 1: Environment Configuration
# ==========================================
section "TEST 1: Environment Configuration"

# Check .env file exists
if [ -f .env ]; then
    test_result 0 ".env file exists"
else
    test_result 1 ".env file exists"
    echo -e "${RED}ERROR: .env file not found. Cannot continue testing.${NC}"
    exit 1
fi

# Check for AI configuration
if grep -q "OPENAI_API_KEY" .env; then
    test_result 0 "OPENAI_API_KEY configured in .env"
    OPENAI_KEY=$(grep "OPENAI_API_KEY=" .env | cut -d'=' -f2)
    if [[ $OPENAI_KEY =~ ^sk-proj- ]]; then
        echo -e "${GREEN}   → Valid OpenAI key format detected${NC}"
    elif [[ $OPENAI_KEY == "sk-proj-your-key-here" ]]; then
        echo -e "${YELLOW}   ⚠ Placeholder key detected - won't work for API calls${NC}"
    else
        echo -e "${YELLOW}   ⚠ Invalid or empty OpenAI key${NC}"
    fi
else
    test_result 1 "OPENAI_API_KEY in .env"
fi

if grep -q "ANTHROPIC_API_KEY" .env; then
    test_result 0 "ANTHROPIC_API_KEY configured in .env"
    ANTHROPIC_KEY=$(grep "ANTHROPIC_API_KEY=" .env | cut -d'=' -f2)
    if [[ $ANTHROPIC_KEY =~ ^sk-ant- ]]; then
        echo -e "${GREEN}   → Valid Anthropic key format detected${NC}"
    elif [[ $ANTHROPIC_KEY == "sk-ant-your-key-here" ]]; then
        echo -e "${YELLOW}   ⚠ Placeholder key detected - won't work for API calls${NC}"
    else
        echo -e "${YELLOW}   ⚠ Invalid or empty Anthropic key${NC}"
    fi
else
    test_result 1 "ANTHROPIC_API_KEY in .env"
fi

if grep -q "OLLAMA_BASE_URL" .env; then
    test_result 0 "OLLAMA_BASE_URL configured in .env"
    OLLAMA_URL=$(grep "OLLAMA_BASE_URL=" .env | cut -d'=' -f2)
    echo -e "   → Ollama URL: $OLLAMA_URL"
else
    test_result 1 "OLLAMA_BASE_URL in .env"
fi

if grep -q "USE_LOCAL_AI" .env; then
    USE_LOCAL=$(grep "USE_LOCAL_AI=" .env | cut -d'=' -f2)
    if [ "$USE_LOCAL" = "true" ]; then
        test_result 0 "USE_LOCAL_AI=true (prefers local AI)"
    else
        echo -e "${YELLOW}ℹ INFO${NC}: USE_LOCAL_AI=false (prefers cloud AI)"
    fi
fi

# ==========================================
# TEST 2: Ollama Installation & Status
# ==========================================
section "TEST 2: Ollama (Local Llama) Status"

if command -v ollama &> /dev/null; then
    test_result 0 "Ollama CLI installed"
    OLLAMA_VERSION=$(ollama --version 2>&1 | head -1)
    echo -e "   → Version: $OLLAMA_VERSION"
else
    test_result 1 "Ollama CLI installed"
    echo -e "${YELLOW}   ℹ Install with: curl -fsSL https://ollama.ai/install.sh | sh${NC}"
fi

# Check if Ollama server is running
if curl -s http://localhost:11434/api/tags &> /dev/null; then
    test_result 0 "Ollama server running on port 11434"
    
    # List available models
    MODELS=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | head -5)
    if [ ! -z "$MODELS" ]; then
        echo -e "${GREEN}   → Available models:${NC}"
        echo "$MODELS" | while read model; do
            echo -e "      • $model"
        done
    else
        echo -e "${YELLOW}   ⚠ No models downloaded${NC}"
        echo -e "   ℹ Download with: ollama pull llama3.1:latest"
    fi
else
    test_result 1 "Ollama server running"
    echo -e "${YELLOW}   ℹ Start with: ollama serve${NC}"
fi

# Test Ollama API directly
if command -v ollama &> /dev/null && curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo -e "\n${BLUE}Testing Ollama API directly...${NC}"
    OLLAMA_TEST=$(curl -s -X POST http://localhost:11434/api/generate -d '{
        "model": "llama3.1:latest",
        "prompt": "Say hello in exactly 3 words",
        "stream": false
    }' 2>&1)
    
    if echo "$OLLAMA_TEST" | grep -q "response"; then
        test_result 0 "Ollama API responds to test query"
        RESPONSE=$(echo "$OLLAMA_TEST" | grep -o '"response":"[^"]*"' | cut -d'"' -f4 | head -c 50)
        echo -e "   → Response: $RESPONSE..."
    else
        test_result 1 "Ollama API test query"
        if echo "$OLLAMA_TEST" | grep -q "model.*not found"; then
            echo -e "${YELLOW}   ℹ Model not found. Download with: ollama pull llama3.1:latest${NC}"
        fi
    fi
fi

# ==========================================
# TEST 3: Node.js Server Status
# ==========================================
section "TEST 3: Node.js Server Status"

if check_server; then
    test_result 0 "Development server running on port 3000"
else
    test_result 1 "Development server running"
    echo -e "${RED}   ERROR: Server not running. Start with: npm run dev${NC}"
    echo -e "${YELLOW}   Cannot continue API tests without server running.${NC}"
    echo ""
    echo "=========================================="
    echo "SUMMARY: $TESTS_PASSED passed, $TESTS_FAILED failed"
    echo "=========================================="
    exit 1
fi

# Check server logs for AI initialization
echo -e "\n${BLUE}Checking server logs for AI provider initialization...${NC}"
LATEST_LOG=$(find . -name "*.log" -type f -mmin -5 2>/dev/null | head -1)
if [ ! -z "$LATEST_LOG" ]; then
    echo -e "   → Checking: $LATEST_LOG"
    if grep -q "ExternalAIService.*initialized" "$LATEST_LOG" 2>/dev/null; then
        echo -e "${GREEN}   ✓ Found AI service initialization logs${NC}"
    fi
fi

# ==========================================
# TEST 4: AI Service Files
# ==========================================
section "TEST 4: AI Service Implementation Files"

FILES=(
    "server/services/ExternalAIService.ts"
    "server/services/AIAssistantService.ts"
    "server/routes/aiAssistant.ts"
    "client/src/pages/AIAssistantPage.tsx"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        test_result 0 "File exists: $file"
        # Check file size
        SIZE=$(wc -c < "$file" | xargs)
        echo -e "   → Size: $SIZE bytes"
    else
        test_result 1 "File exists: $file"
    fi
done

# Check for Ollama support in ExternalAIService
if grep -q "ollama" server/services/ExternalAIService.ts; then
    test_result 0 "Ollama support implemented in ExternalAIService"
else
    test_result 1 "Ollama support in ExternalAIService"
fi

# Check for provider types
if grep -q "type AIProvider = 'openai' | 'anthropic' | 'ollama'" server/services/ExternalAIService.ts; then
    test_result 0 "All three AI providers defined in types"
else
    test_result 1 "All three AI providers in types"
fi

# ==========================================
# TEST 5: API Endpoints (without auth)
# ==========================================
section "TEST 5: API Endpoint Availability"

# Test health endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>&1)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
    test_result 0 "Root endpoint responding (HTTP $HTTP_CODE)"
else
    echo -e "${YELLOW}ℹ INFO${NC}: Root endpoint returned HTTP $HTTP_CODE"
fi

# Test AI endpoint (should return 401 without auth)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/ai-assistant/learning-progress 2>&1)
if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    test_result 0 "AI Assistant endpoint exists (returns $HTTP_CODE as expected without auth)"
elif [ "$HTTP_CODE" = "404" ]; then
    test_result 1 "AI Assistant endpoint exists (got 404)"
else
    echo -e "${YELLOW}ℹ INFO${NC}: AI endpoint returned HTTP $HTTP_CODE"
fi

# ==========================================
# TEST 6: TypeScript Compilation
# ==========================================
section "TEST 6: TypeScript Compilation Check"

echo -e "${BLUE}Checking for TypeScript errors in AI files...${NC}"

# Check if tsc is available
if command -v npx &> /dev/null; then
    # Try to compile AI service files
    COMPILE_OUTPUT=$(npx tsc --noEmit server/services/ExternalAIService.ts 2>&1 || true)
    if [ -z "$COMPILE_OUTPUT" ]; then
        test_result 0 "ExternalAIService.ts compiles without errors"
    else
        ERROR_COUNT=$(echo "$COMPILE_OUTPUT" | grep -c "error TS" || echo "0")
        if [ "$ERROR_COUNT" = "0" ]; then
            test_result 0 "ExternalAIService.ts compiles"
        else
            test_result 1 "ExternalAIService.ts has $ERROR_COUNT TypeScript errors"
            echo -e "${RED}$COMPILE_OUTPUT${NC}" | head -10
        fi
    fi
else
    echo -e "${YELLOW}ℹ INFO${NC}: TypeScript compiler not available, skipping"
fi

# ==========================================
# TEST 7: AI Provider Configuration Summary
# ==========================================
section "TEST 7: AI Provider Configuration Summary"

echo -e "${BLUE}Configured AI Providers:${NC}"
echo ""

PROVIDERS_AVAILABLE=0

# Check OpenAI
OPENAI_KEY=$(grep "OPENAI_API_KEY=" .env | cut -d'=' -f2)
if [[ $OPENAI_KEY =~ ^sk-proj- ]] && [[ $OPENAI_KEY != "sk-proj-your-key-here" ]]; then
    echo -e "${GREEN}✓ OpenAI${NC}"
    echo -e "  Status: ${GREEN}Ready${NC}"
    echo -e "  Models: GPT-4, GPT-3.5-turbo"
    echo -e "  Cost: ~$0.03/1K tokens (GPT-4)"
    ((PROVIDERS_AVAILABLE++))
else
    echo -e "${YELLOW}○ OpenAI${NC}"
    echo -e "  Status: ${YELLOW}Not configured${NC}"
    echo -e "  Action: Add real API key to .env"
fi
echo ""

# Check Anthropic
ANTHROPIC_KEY=$(grep "ANTHROPIC_API_KEY=" .env | cut -d'=' -f2)
if [[ $ANTHROPIC_KEY =~ ^sk-ant- ]] && [[ $ANTHROPIC_KEY != "sk-ant-your-key-here" ]]; then
    echo -e "${GREEN}✓ Anthropic Claude${NC}"
    echo -e "  Status: ${GREEN}Ready${NC}"
    echo -e "  Models: Claude 3 Opus, Sonnet, Haiku"
    echo -e "  Cost: ~$3/1M tokens (Sonnet)"
    ((PROVIDERS_AVAILABLE++))
else
    echo -e "${YELLOW}○ Anthropic Claude${NC}"
    echo -e "  Status: ${YELLOW}Not configured${NC}"
    echo -e "  Action: Add real API key to .env"
fi
echo ""

# Check Ollama
if curl -s http://localhost:11434/api/tags &> /dev/null; then
    MODEL_COUNT=$(curl -s http://localhost:11434/api/tags | grep -c '"name":' || echo "0")
    if [ "$MODEL_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓ Ollama (Local Llama)${NC}"
        echo -e "  Status: ${GREEN}Ready${NC}"
        echo -e "  Models: $MODEL_COUNT installed"
        echo -e "  Cost: ${GREEN}FREE${NC}"
        echo -e "  Privacy: ${GREEN}100% local${NC}"
        ((PROVIDERS_AVAILABLE++))
    else
        echo -e "${YELLOW}○ Ollama (Local Llama)${NC}"
        echo -e "  Status: ${YELLOW}Server running but no models${NC}"
        echo -e "  Action: Run 'ollama pull llama3.1:latest'"
    fi
else
    echo -e "${YELLOW}○ Ollama (Local Llama)${NC}"
    echo -e "  Status: ${YELLOW}Not running${NC}"
    echo -e "  Action: Install and run 'ollama serve'"
fi
echo ""

if [ $PROVIDERS_AVAILABLE -eq 0 ]; then
    echo -e "${RED}⚠ WARNING: No AI providers are configured!${NC}"
    echo -e "${YELLOW}The AI Assistant will not work until you configure at least one provider.${NC}"
    test_result 1 "At least one AI provider configured"
else
    echo -e "${GREEN}✓ $PROVIDERS_AVAILABLE AI provider(s) available${NC}"
    test_result 0 "At least one AI provider configured"
fi

# ==========================================
# TEST 8: Frontend Files
# ==========================================
section "TEST 8: Frontend AI Integration"

# Check if AI Assistant page exists
if [ -f "client/src/pages/AIAssistantPage.tsx" ]; then
    test_result 0 "AIAssistantPage component exists"
    
    # Check for required imports
    if grep -q "useQuery" client/src/pages/AIAssistantPage.tsx; then
        test_result 0 "React Query integration in AI page"
    else
        test_result 1 "React Query integration"
    fi
    
    # Check for API endpoints
    if grep -q "/api/ai-assistant" client/src/pages/AIAssistantPage.tsx; then
        test_result 0 "AI Assistant API endpoints referenced"
    else
        test_result 1 "AI Assistant API endpoints"
    fi
else
    test_result 1 "AIAssistantPage component exists"
fi

# Check routing
if grep -q "ai-assistant" client/src/App.tsx; then
    test_result 0 "AI Assistant routes configured in App.tsx"
else
    test_result 1 "AI Assistant routes in App.tsx"
fi

# ==========================================
# FINAL SUMMARY
# ==========================================
echo ""
echo "=========================================="
echo -e "${BLUE}TEST SUMMARY${NC}"
echo "=========================================="
echo ""
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
TOTAL=$((TESTS_PASSED + TESTS_FAILED))
echo -e "Total Tests: $TOTAL"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo ""
    echo -e "${GREEN}✓ AI System is fully configured and ready to use${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Navigate to: http://localhost:3000/ecp/ai-assistant"
    echo "  2. Ask a question to test the AI"
    echo "  3. Check which provider responds"
else
    echo -e "${YELLOW}⚠ Some tests failed${NC}"
    echo ""
    echo "Common fixes:"
    if [ $PROVIDERS_AVAILABLE -eq 0 ]; then
        echo -e "  ${YELLOW}→${NC} No AI providers configured"
        echo "    Quick fix (FREE): ./setup-ai.sh (choose option 1)"
        echo "    Or manually: Edit .env and add API keys"
    fi
    echo ""
    echo "For detailed setup instructions, see: AI_SETUP_GUIDE.md"
fi

echo ""
echo "=========================================="

# Exit with appropriate code
if [ $TESTS_FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi
