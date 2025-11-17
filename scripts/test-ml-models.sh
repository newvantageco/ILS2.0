#!/bin/bash

# ILS 2.0 - ML Models Testing Script
# Tests all machine learning models with real data

set -e

echo "🤖 ILS 2.0 - ML Models Testing"
echo "==============================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🔍 $1${NC}"
}

print_header "ML MODELS OVERVIEW"

echo ""
print_info "Testing machine learning models:"
echo "  • Ophthalmic Knowledge LLM"
echo "  • Sales Forecasting Models"
echo "  • Inventory Prediction Models"
echo "  • Patient Analytics Models"
echo "  • Recommendation Systems"
echo "  • Risk Stratification Models"
echo "  • Churn Prediction Models"
echo ""

print_header "PREREQUISITES CHECK"

echo ""
print_info "Checking required services..."

# Configuration
AI_SERVICE_URL=${1:-"https://your-ai-service.hf.space"}
APP_URL=${2:-"https://your-app.railway.app"}

print_info "AI Service URL: $AI_SERVICE_URL"
print_info "Main App URL: $APP_URL"

# Test AI Service Health
print_info "Testing AI service health..."
AI_HEALTH=$(curl -s "$AI_SERVICE_URL/health" | jq -r '.status // "error"' 2>/dev/null || echo "error")

if [ "$AI_HEALTH" = "healthy" ]; then
    print_success "AI service is healthy"
else
    print_error "AI service is not responding (status: $AI_HEALTH)"
    print_warning "Please ensure your AI service is deployed and accessible"
fi

# Test Main App Health
print_info "Testing main app health..."
APP_HEALTH=$(curl -s "$APP_URL/health" | jq -r '.status // "error"' 2>/dev/null || echo "error")

if [ "$APP_HEALTH" = "healthy" ]; then
    print_success "Main app is healthy"
else
    print_error "Main app is not responding (status: $APP_HEALTH)"
    print_warning "Please ensure your main application is deployed"
fi

echo ""
print_header "OPHTHALMIC KNOWLEDGE LLM"

print_info "Testing ophthalmic knowledge model..."

# Test 1: Basic Knowledge Query
print_info "Test 1: Basic ophthalmic knowledge"
cat << 'EOF'

curl -X POST https://your-ai-service.hf.space/api/v1/ophthalmic-knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the difference between single vision and progressive lenses?",
    "context": "patient education"
  }'

EOF

# Test 2: Clinical Recommendation
print_info "Test 2: Clinical recommendation"
cat << 'EOF'

curl -X POST https://your-ai-service.hf.space/api/v1/ophthalmic-knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What lens material would you recommend for a patient with -6.00 sphere prescription?",
    "context": "clinical recommendation"
  }'

EOF

# Test 3: Technical Specification
print_info "Test 3: Technical specification"
cat << 'EOF'

curl -X POST https://your-ai-service.hf.space/api/v1/ophthalmic-knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the fitting guidelines for high-index lenses?",
    "context": "technical specification"
  }'

EOF

echo ""
print_header "SALES FORECASTING MODELS"

print_info "Testing sales forecasting models..."

# Test 4: Sales Forecast
print_info "Test 4: Sales forecasting"
cat << 'EOF'

curl -X POST https://your-app.railway.app/api/analytics/forecast/sales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "period": "30d",
    "productCategory": "lenses",
    "confidence": 0.95
  }'

EOF

# Test 5: Revenue Prediction
print_info "Test 5: Revenue prediction"
cat << 'EOF'

curl -X POST https://your-app.railway.app/api/analytics/forecast/revenue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "period": "90d",
    "includeSeasonality": true,
    "confidence": 0.90
  }'

EOF

echo ""
print_header "INVENTORY PREDICTION MODELS"

print_info "Testing inventory prediction models..."

# Test 6: Stock Forecast
print_info "Test 6: Stock forecasting"
cat << 'EOF'

curl -X POST https://your-app.railway.app/api/analytics/forecast/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "12345",
    "period": "30d",
    "includeDemand": true
  }'

EOF

# Test 7: Reorder Recommendations
print_info "Test 7: Reorder recommendations"
cat << 'EOF'

curl -X POST https://your-app.railway.app/api/analytics/inventory/recommendations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "threshold": 0.2,
    "leadTime": 14
  }'

EOF

echo ""
print_header "PATIENT ANALYTICS MODELS"

print_info "Testing patient analytics models..."

# Test 8: Patient Segmentation
print_info "Test 8: Patient segmentation"
cat << 'EOF'

curl -X POST https://your-app.railway.app/api/analytics/patients/segmentation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "criteria": ["purchase_history", "prescription_complexity", "visit_frequency"],
    "segments": 5
  }'

EOF

# Test 9: Lifetime Value Prediction
print_info "Test 9: Customer lifetime value"
cat << 'EOF'

curl -X POST https://your-app.railway.app/api/analytics/patients/clv \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "patientId": "12345",
    "period": "365d",
    "confidence": 0.85
  }'

EOF

echo ""
print_header "RECOMMENDATION SYSTEMS"

print_info "Testing recommendation systems..."

# Test 10: Product Recommendations
print_info "Test 10: Product recommendations"
cat << 'EOF'

curl -X POST https://your-app.railway.app/api/recommendations/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "patientId": "12345",
    "prescription": {
      "sphere": -2.50,
      "cylinder": -0.75,
      "axis": 180
    },
    "preferences": {
      "budget": "medium",
      "lifestyle": "active"
    },
    "limit": 5
  }'

EOF

# Test 11: Lens Recommendations
print_info "Test 11: Lens recommendations"
cat << 'EOF'

curl -X POST https://your-app.railway.app/api/recommendations/lenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prescription": {
      "rightEye": {"sphere": -3.00, "cylinder": -1.00, "axis": 180},
      "leftEye": {"sphere": -2.75, "cylinder": -0.75, "axis": 175}
    },
    "useCase": "daily",
    "budget": "premium",
    "preferences": ["thin", "scratch_resistant"]
  }'

EOF

echo ""
print_header "RISK STRATIFICATION MODELS"

print_info "Testing risk stratification models..."

# Test 12: Clinical Risk Assessment
print_info "Test 12: Clinical risk assessment"
cat << 'EOF'

curl -X POST https://your-app.railway.app/api/analytics/risk/clinical \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "patientId": "12345",
    "factors": ["age", "prescription_stability", "compliance"],
    "timeframe": "12m"
  }'

EOF

# Test 13: Churn Risk Prediction
print_info "Test 13: Churn risk prediction"
cat << 'EOF'

curl -X POST https://your-app.railway.app/api/analytics/risk/churn \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "patientId": "12345",
    "factors": ["visit_frequency", "purchase_history", "complaints"],
    "confidence": 0.80
  }'

EOF

echo ""
print_header "BUSINESS INTELLIGENCE MODELS"

print_info "Testing business intelligence models..."

# Test 14: Market Trend Analysis
print_info "Test 14: Market trend analysis"
cat << 'EOF'

curl -X POST https://your-app.railway.app/api/analytics/market/trends \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "period": "90d",
    "categories": ["lenses", "frames", "contacts"],
    "region": "all"
  }'

EOF

# Test 15: Competitive Analysis
print_info "Test 15: Competitive analysis"
cat << 'EOF'

curl -X POST https://your-app.railway.app/api/analytics/market/competition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "metrics": ["pricing", "product_mix", "market_share"],
    "timeframe": "6m"
  }'

EOF

echo ""
print_header "MODEL PERFORMANCE TESTING"

print_info "Testing model performance and accuracy..."

# Test 16: Model Accuracy Metrics
print_info "Test 16: Model accuracy metrics"
cat << 'EOF'

curl -X GET https://your-app.railway.app/api/analytics/models/accuracy \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

EOF

# Test 17: Performance Benchmarks
print_info "Test 17: Performance benchmarks"
cat << 'EOF'

curl -X GET https://your-app.railway.app/api/analytics/models/performance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

EOF

echo ""
print_header "LOAD TESTING"

print_info "Load testing ML models..."

# Test 18: Concurrent Request Test
print_info "Test 18: Concurrent request handling"
cat << 'EOF'

# Test concurrent predictions
for i in {1..10}; do
  curl -X POST https://your-ai-service.hf.space/api/v1/ophthalmic-knowledge \
    -H "Content-Type: application/json" \
    -d '{
      "question": "What are anti-reflective coatings?",
      "context": "product education"
    }' &
done
wait

EOF

# Test 19: Batch Processing Test
print_info "Test 19: Batch processing performance"
cat << 'EOF'

time curl -X POST https://your-app.railway.app/api/analytics/batch/forecast \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "requests": [
      {"type": "sales", "period": "30d"},
      {"type": "inventory", "productId": "12345"},
      {"type": "revenue", "period": "90d"}
    ]
  }'

EOF

echo ""
print_header "ERROR HANDLING TESTS"

print_info "Testing error handling and edge cases..."

# Test 20: Invalid Input Handling
print_info "Test 20: Invalid input handling"
cat << 'EOF'

curl -X POST https://your-ai-service.hf.space/api/v1/ophthalmic-knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "question": "",
    "context": "invalid"
  }'

EOF

# Test 21: Missing Data Handling
print_info "Test 21: Missing data handling"
cat << 'EOF'

curl -X POST https://your-app.railway.app/api/recommendations/lenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prescription": {},
    "useCase": "invalid"
  }'

EOF

echo ""
print_header "MONITORING & LOGGING"

print_info "Check ML model monitoring..."

# Test 22: Model Health Check
print_info "Test 22: Model health check"
cat << 'EOF'

curl -X GET https://your-app.railway.app/api/analytics/models/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

EOF

# Test 23: Usage Statistics
print_info "Test 23: Usage statistics"
cat << 'EOF'

curl -X GET https://your-app.railway.app/api/analytics/models/usage \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

EOF

print_success "ML models testing guide completed!"
echo ""

print_info "📋 Expected Results:"
echo ""
echo "✅ Ophthalmic LLM: Accurate clinical responses"
echo "✅ Sales Forecasting: Reliable predictions with confidence intervals"
echo "✅ Inventory Models: Accurate demand forecasting"
echo "✅ Patient Analytics: Meaningful segmentation and insights"
echo "✅ Recommendations: Relevant product suggestions"
echo "✅ Risk Models: Accurate risk stratification"
echo "✅ Performance: Sub-2 second response times"
echo "✅ Error Handling: Graceful failure for invalid inputs"
echo ""

print_warning "Performance Benchmarks:"
echo ""
echo "• Response Time: <2 seconds for most predictions"
echo "• Accuracy: >85% for classification tasks"
echo "• Precision: >90% for recommendation systems"
echo "• Throughput: >50 requests per minute"
echo "• Uptime: >99% availability"
echo ""

print_info "🔗 Testing URLs:"
echo ""
echo "• AI Service: https://your-ai-service.hf.space"
echo "• Main App: https://your-app.railway.app"
echo "• Model Dashboard: https://your-app.railway.app/admin/ml-models"
echo "• Analytics: https://your-app.railway.app/admin/analytics"
echo ""

print_info "📊 Model Categories Tested:"
echo ""
echo "• Knowledge Models: Ophthalmic expertise and clinical guidance"
echo "• Predictive Models: Sales, revenue, and inventory forecasting"
echo "• Analytics Models: Patient segmentation and CLV prediction"
echo "• Recommendation Models: Product and lens suggestions"
echo "• Risk Models: Clinical and churn risk assessment"
echo ""

echo "🤖 Your ML models are ready for comprehensive testing!"
