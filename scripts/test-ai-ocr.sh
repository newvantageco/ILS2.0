#!/bin/bash

# ILS 2.0 - AI OCR Prescription Testing Script
# Tests GPT-4 Vision prescription processing functionality

set -e

echo "👁️ ILS 2.0 - AI OCR Prescription Testing"
echo "========================================"

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

print_header "AI OCR PRESCRIPTION PROCESSING"

echo ""
print_info "Testing GPT-4 Vision for prescription extraction:"
echo "  • Image upload and processing"
echo "  • OCR text extraction"
echo "  • Prescription data parsing"
echo "  • Clinical validation"
echo "  • Confidence scoring"
echo "  • Error handling"
echo ""

print_header "PREREQUISITES CHECK"

echo ""
print_info "Checking required services..."

# Check if AI service is running
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
print_header "AI OCR ENDPOINT TESTING"

# Function to test OCR endpoint
test_ocr_endpoint() {
    local endpoint="$1"
    local description="$2"
    
    print_info "Testing: $description"
    
    # Test with a simple text request first
    local response=$(curl -s -X POST "$endpoint" \
        -H "Content-Type: application/json" \
        -d '{
            "test": true,
            "message": "OCR endpoint health check"
        }' 2>/dev/null || echo '{"error": "connection_failed"}')
    
    local status=$(echo "$response" | jq -r '.status // "error"' 2>/dev/null || echo "error")
    
    if [ "$status" != "error" ]; then
        print_success "$description (status: $status)"
        return 0
    else
        print_error "$description (connection failed)"
        return 1
    fi
}

# Test AI Service OCR Endpoint
test_ocr_endpoint "$AI_SERVICE_URL/api/v1/ocr/prescription" "AI Service OCR Endpoint"

# Test Main App OCR Integration
test_ocr_endpoint "$APP_URL/api/ai/ocr/prescription" "Main App OCR Integration"

echo ""
print_header "PRESCRIPTION IMAGE TESTS"

print_info "Creating test prescription images..."

# Create a test directory
TEST_DIR="./test-prescriptions"
mkdir -p "$TEST_DIR"

# Generate sample prescription images (text-based for testing)
cat > "$TEST_DIR/sample-prescription-1.txt" << 'EOF'
PATIENT PRESCRIPTION
===================

Patient: John Doe
Date: 2024-01-15
Doctor: Dr. Sarah Smith

RIGHT EYE (OD):
Sphere: -2.50
Cylinder: -0.75
Axis: 180
Add: +1.25

LEFT EYE (OS):
Sphere: -2.75
Cylinder: -1.00
Axis: 170
Add: +1.25

PD: 63mm
Notes: Progressive lenses recommended
EOF

cat > "$TEST_DIR/sample-prescription-2.txt" << 'EOF'
OPTICAL PRESCRIPTION
====================

Patient: Jane Smith
DOB: 1985-06-15
Exam Date: 2024-01-10

OD (Right Eye):
SPH: -1.25
CYL: -0.50
AXIS: 090

OS (Left Eye):
SPH: -1.50
CYL: -0.75
AXIS: 095

Near Add: +2.00
Distance PD: 62mm
Near PD: 60mm

Valid until: 2025-01-10
Dr. Michael Johnson
License: OD12345
EOF

print_success "Test prescription samples created"

echo ""
print_header "OCR PROCESSING TESTS"

print_info "Testing OCR with sample prescriptions..."

# Test 1: Basic OCR Processing
print_info "Test 1: Basic text extraction"
cat << 'EOF'

To test basic OCR processing:

curl -X POST https://your-ai-service.hf.space/api/v1/ocr/prescription \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/prescription.jpg",
    "extract_text": true,
    "parse_prescription": false
  }'

EOF

# Test 2: Full Prescription Processing
print_info "Test 2: Full prescription parsing"
cat << 'EOF'

curl -X POST https://your-ai-service.hf.space/api/v1/ocr/prescription \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/prescription.jpg",
    "extract_text": true,
    "parse_prescription": true,
    "validate_data": true,
    "include_confidence": true
  }'

EOF

# Test 3: Batch Processing
print_info "Test 3: Batch prescription processing"
cat << 'EOF'

curl -X POST https://your-ai-service.hf.space/api/v1/ocr/batch \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      "https://example.com/prescription1.jpg",
      "https://example.com/prescription2.jpg"
    ],
    "parse_prescription": true,
    "validate_data": true
  }'

EOF

echo ""
print_header "INTEGRATION TESTS"

print_info "Testing end-to-end prescription workflow..."

# Test 4: Upload via Main App
print_info "Test 4: Prescription upload via main application"
cat << 'EOF'

curl -X POST https://your-app.railway.app/api/prescriptions/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@./test-prescriptions/prescription.jpg" \
  -F "patientId=12345" \
  -F "processWithAI=true" \
  -F "validateData=true"

EOF

# Test 5: AI Analysis Integration
print_info "Test 5: AI analysis of extracted prescription"
cat << 'EOF'

curl -X POST https://your-app.railway.app/api/ai/analyze-prescription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prescriptionData": {
      "rightEye": {
        "sphere": -2.50,
        "cylinder": -0.75,
        "axis": 180
      },
      "leftEye": {
        "sphere": -2.75,
        "cylinder": -1.00,
        "axis": 170
      },
      "pd": 63
    },
    "patientAge": 45,
    "useCase": "progressive"
  }'

EOF

echo ""
print_header "ACCURACY VALIDATION"

print_info "Expected OCR accuracy metrics:"
echo ""

cat << 'EOF'
✅ Text Extraction Accuracy: >95%
✅ Prescription Field Parsing: >90%
✅ Numerical Value Accuracy: >95%
✅ Confidence Score Reliability: >85%
✅ Error Detection Rate: >90%
✅ Processing Speed: <5 seconds per image

EOF

print_info "Validation test cases:"
echo ""

cat << 'EOF'
1. **Clear Handwriting**: High accuracy expected
2. **Printed Prescriptions**: Near-perfect accuracy
3. **Faded Images**: Moderate accuracy with confidence scoring
4. **Multiple Formats**: Robust parsing of different layouts
5. **Edge Cases**: Proper handling of unusual prescriptions
6. **Error Cases**: Graceful failure for invalid images

EOF

echo ""
print_header "PERFORMANCE TESTING"

print_info "Load testing AI OCR processing:"
echo ""

cat << 'EOF'

# Concurrent OCR Processing Test
for i in {1..5}; do
  curl -X POST https://your-ai-service.hf.space/api/v1/ocr/prescription \
    -H "Content-Type: application/json" \
    -d '{
      "image_url": "https://example.com/test-prescription.jpg",
      "extract_text": true,
      "parse_prescription": true
    }' &
done
wait

# Measure processing time
time curl -X POST https://your-ai-service.hf.space/api/v1/ocr/prescription \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/prescription.jpg",
    "extract_text": true,
    "parse_prescription": true
  }'

EOF

echo ""
print_header "ERROR HANDLING TESTS"

print_info "Testing error scenarios:"
echo ""

cat << 'EOF'

1. **Invalid Image URL**:
   curl -X POST https://your-ai-service.hf.space/api/v1/ocr/prescription \
     -H "Content-Type: application/json" \
     -d '{"image_url": "invalid-url"}'

2. **Corrupted Image**:
   curl -X POST https://your-ai-service.hf.space/api/v1/ocr/prescription \
     -H "Content-Type: application/json" \
     -d '{"image_url": "https://example.com/corrupted.jpg"}'

3. **No Prescription Data**:
   curl -X POST https://your-ai-service.hf.space/api/v1/ocr/prescription \
     -H "Content-Type: application/json" \
     -d '{"image_url": "https://example.com/blank.jpg"}'

4. **Large File Size**:
   curl -X POST https://your-ai-service.hf.space/api/v1/ocr/prescription \
     -H "Content-Type: application/json" \
     -d '{"image_url": "https://example.com/huge-resolution.jpg"}'

EOF

echo ""
print_header "MONITORING & LOGGING"

print_info "Check AI OCR performance metrics:"
echo ""

cat << 'EOF'

# AI Service Metrics
curl https://your-ai-service.hf.space/metrics

# OCR Processing Stats
curl https://your-ai-service.hf.space/api/v1/ocr/stats

# Error Logs
curl https://your-ai-service.hf.space/api/v1/ocr/errors

# Performance Dashboard
curl https://your-app.railway.app/admin/ai-analytics

EOF

print_success "AI OCR testing guide completed!"
echo ""

print_info "📋 Test Results Summary:"
echo ""
echo "✅ AI Service Health: Verify service is running"
echo "✅ OCR Endpoint: Test prescription processing"
echo "✅ Integration Tests: End-to-end workflow"
echo "✅ Accuracy Validation: Measure extraction quality"
echo "✅ Performance Testing: Load and speed tests"
echo "✅ Error Handling: Test failure scenarios"
echo ""

print_warning "Important Notes:"
echo ""
echo "• Ensure OpenAI API key is configured in AI service"
echo "• Test with real prescription images for accuracy"
echo "• Monitor processing costs and rate limits"
echo "• Validate extracted data with ECP review"
echo "• Implement confidence thresholds for automation"
echo ""

print_info "🔗 Testing URLs:"
echo ""
echo "• AI Service: https://your-ai-service.hf.space"
echo "• OCR Endpoint: https://your-ai-service.hf.space/api/v1/ocr/prescription"
echo "• Main App: https://your-app.railway.app"
echo "• Admin Dashboard: https://your-app.railway.app/admin/ai-analytics"
echo ""

print_info "📊 Expected Results:"
echo ""
echo "• Text extraction accuracy: >95%"
echo "• Prescription parsing accuracy: >90%"
echo "• Processing speed: <5 seconds per image"
echo "• Error rate: <5% for clear images"
echo "• Confidence scoring: Reliable threshold detection"
echo ""

echo "👁️ Your AI OCR prescription processing is ready for testing!"
