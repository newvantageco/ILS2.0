#!/bin/bash

# ILS 2.0 - File Storage Testing Script
# Tests S3 file upload, download, and processing functionality

set -e

echo "🧪 ILS 2.0 - File Storage Testing"
echo "================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Configuration
APP_URL=${1:-"https://your-app.railway.app"}
TEST_FILE="/tmp/test-prescription.jpg"

# Create test file (simple image)
print_info "Creating test prescription file..."
echo "Test prescription image data" > "$TEST_FILE"

# Function to test endpoint
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local file="$3"
    local expected_status="$4"
    local description="$5"
    
    print_info "Testing: $description"
    
    local cmd="curl -s -o /dev/null -w '%{http_code}' -X $method"
    
    if [ -n "$file" ]; then
        cmd="$cmd -F 'file=@$file' -F 'patientId=test123' -F 'type=prescription'"
    fi
    
    cmd="$cmd '$APP_URL$endpoint'"
    
    local status_code=$(eval "$cmd" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "$expected_status" ]; then
        print_success "$description (HTTP $status_code)"
        return 0
    else
        print_error "$description (HTTP $status_code, expected $expected_status)"
        return 1
    fi
}

echo ""
print_info "Testing file storage at: $APP_URL"

# Test 1: Health Check
test_endpoint "GET" "/health" "" "200" "Application Health Check"

# Test 2: File Upload Endpoint
test_endpoint "POST" "/api/upload" "$TEST_FILE" "401" "File Upload (expected 401 without auth)"

echo ""
print_info "📋 Manual Testing Instructions:"
echo ""

cat << 'EOF'
To test file storage functionality manually:

1. **Test S3 Connectivity** (in your Railway shell):
   aws s3 ls s3://ils-production-files

2. **Test File Upload** (with authentication):
   curl -X POST https://your-app.railway.app/api/upload \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "file=@prescription.jpg" \
     -F "patientId=patient123" \
     -F "type=prescription"

3. **Test File Download**:
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://your-app.railway.app/api/files/FILE_ID

4. **Test Prescription Processing**:
   curl -X POST https://your-app.railway.app/api/prescriptions/process \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "image=@prescription.jpg" \
     -F "patientId=patient123"

5. **Test AI OCR Integration**:
   curl -X POST https://your-app.railway.app/api/prescriptions/ocr \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "image=@prescription.jpg" \
     -F "useAI=true"

EOF

print_info "🔍 Storage Verification Commands:"
echo ""

cat << 'EOF'
# Check S3 bucket contents:
aws s3 ls s3://ils-production-files --recursive

# Check specific folder:
aws s3 ls s3://ils-production-files/prescriptions/

# Verify encryption:
aws s3api head-object --bucket ils-production-files --key test/file.txt

# Check versioning:
aws s3api get-bucket-versioning --bucket ils-production-files

# Test CORS:
curl -H "Origin: https://your-app.railway.app" \
     -H "Access-Control-Request-Method: PUT" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://ils-production-files.s3.amazonaws.com/test-file

EOF

print_info "📊 File Storage Features to Test:"
echo ""

cat << 'EOF'
✅ File Upload (prescriptions, documents, avatars)
✅ File Download (secure access)
✅ File Processing (OCR, AI analysis)
✅ Thumbnail Generation
✅ Version Control
✅ Encryption at Rest
✅ Access Control (tenant isolation)
✅ CORS Configuration
✅ Backup and Restore
✅ Lifecycle Management

EOF

print_info "🔧 Environment Variables to Verify:"
echo ""

cat << 'EOF'
In your Railway project, ensure these are set:

STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=ils-production-files

EOF

print_info "🎯 Test Scenarios:"
echo ""

cat << 'EOF'
1. **Basic Upload**: Upload a prescription image
2. **Secure Download**: Download with proper authentication
3. **AI Processing**: Upload and process with GPT-4 Vision
4. **Multi-tenant**: Verify tenant isolation
5. **Large Files**: Test with high-resolution images
6. **Concurrent Uploads**: Test multiple simultaneous uploads
7. **Error Handling**: Test invalid files, oversized files
8. **Security**: Test unauthorized access attempts

EOF

print_success "File storage testing guide ready!"
echo ""

print_warning "Remember to:"
echo "• Set up AWS credentials in Railway environment"
echo "• Configure CORS origins for your actual domain"
echo "• Test with real prescription images"
echo "• Verify AI processing integration"
echo ""

echo "📁 Your file storage system is ready for testing!"
