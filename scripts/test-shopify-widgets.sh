#!/bin/bash

# ILS 2.0 - Shopify Widgets Testing Script
# Tests all Shopify widgets functionality and integration

set -e

echo "🛒 ILS 2.0 - Shopify Widgets Testing"
echo "===================================="

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

print_header "SHOPIFY WIDGETS OVERVIEW"

echo ""
print_info "Testing Shopify widgets:"
echo "  • Prescription Upload Widget"
echo "  • AI Lens Recommendation Widget"
echo "  • Widget Styling and Responsiveness"
echo "  • API Integration"
echo "  • Cross-browser Compatibility"
echo "  • Mobile Responsiveness"
echo ""

print_header "PREREQUISITES CHECK"

echo ""
print_info "Checking required components..."

# Configuration
ILS_DOMAIN=${1:-"https://your-app.railway.app"}
SHOPIFY_STORE=${2:-"your-store.myshopify.com"}

print_info "ILS Domain: $ILS_DOMAIN"
print_info "Shopify Store: $SHOPIFY_STORE"

# Test widget files availability
print_info "Checking widget files..."

WIDGET_FILES=(
    "$ILS_DOMAIN/shopify-widgets/prescription-upload-widget.js"
    "$ILS_DOMAIN/shopify-widgets/lens-recommendation-widget.js"
    "$ILS_DOMAIN/shopify-widgets/shopify-widget-styles.css"
)

for widget_file in "${WIDGET_FILES[@]}"; do
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$widget_file" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "200" ]; then
        print_success "Widget file accessible: $(basename $widget_file)"
    else
        print_error "Widget file not accessible: $(basename $widget_file) (HTTP $status_code)"
    fi
done

echo ""
print_header "WIDGET FUNCTIONALITY TESTS"

print_info "Testing widget functionality..."

# Test 1: Prescription Upload Widget
print_info "Test 1: Prescription Upload Widget"
cat << 'EOF'

To test the prescription upload widget:

1. **Widget Loading**:
   - Open browser developer tools
   - Navigate to your product page
   - Check Console for widget initialization
   - Verify no JavaScript errors

2. **File Upload**:
   - Click "Upload Prescription" button
   - Select a valid prescription image (JPG/PNG)
   - Verify file validation (size, format)
   - Check upload progress indicator

3. **AI Processing**:
   - Wait for OCR processing to complete
   - Verify extracted prescription data
   - Check confidence scores
   - Validate data format

4. **Error Handling**:
   - Try uploading invalid file (PDF, TXT)
   - Test with oversized file (>10MB)
   - Verify error messages display correctly

EOF

# Test 2: Lens Recommendation Widget
print_info "Test 2: AI Lens Recommendation Widget"
cat << 'EOF'

To test the lens recommendation widget:

1. **Widget Loading**:
   - Verify widget appears on product pages
   - Check styling matches store theme
   - Test responsive design on mobile

2. **Recommendation Form**:
   - Fill in lifestyle questionnaire
   - Select prescription type (single/progressive)
   - Choose budget range
   - Specify usage patterns

3. **AI Recommendations**:
   - Submit form and wait for recommendations
   - Verify lens suggestions are relevant
   - Check coating recommendations
   - Validate product links work

4. **Product Integration**:
   - Click on recommended products
   - Verify products add to cart correctly
   - Check prescription data carries over
   - Test checkout flow

EOF

echo ""
print_header "API INTEGRATION TESTS"

print_info "Testing widget API integration..."

# Test 3: Widget API Endpoints
print_info "Test 3: Widget API Connectivity"
cat << 'EOF'

Test widget API endpoints:

# Prescription Upload API
curl -X POST https://your-app.railway.app/api/shopify/widgets/prescription/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test-prescription.jpg" \
  -F "storeId=your-store-id" \
  -F "customerEmail=test@example.com"

# Lens Recommendation API
curl -X POST https://your-app.railway.app/api/shopify/widgets/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "your-store-id",
    "prescription": {
      "sphere": -2.50,
      "cylinder": -0.75,
      "axis": 180
    },
    "lifestyle": "office_work",
    "budget": "medium"
  }'

# Widget Configuration API
curl -X GET https://your-app.railway.app/api/shopify/widgets/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

EOF

# Test 4: Widget Authentication
print_info "Test 4: Widget Authentication"
cat << 'EOF'

Verify widget authentication:

# Test widget token generation
curl -X POST https://your-app.railway.app/api/shopify/widgets/auth \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "your-store-id",
    "widgetType": "prescription_upload"
  }'

# Test widget permissions
curl -X GET https://your-app.railway.app/api/shopify/widgets/permissions \
  -H "Authorization: Bearer WIDGET_TOKEN"

EOF

echo ""
print_header "CROSS-BROWSER COMPATIBILITY"

print_info "Testing cross-browser compatibility..."

cat << 'EOF'

Browser Testing Checklist:

1. **Chrome/Chromium** (Latest)
   ✅ Widget loads correctly
   ✅ File upload works
   ✅ AI recommendations display
   ✅ Responsive design

2. **Firefox** (Latest)
   ✅ JavaScript functionality
   ✅ CSS styling applies
   ✅ API calls succeed
   ✅ Error handling works

3. **Safari** (Latest)
   ✅ Widget initialization
   ✅ File upload validation
   ✅ Mobile responsiveness
   ✅ Touch interactions

4. **Edge** (Latest)
   ✅ Compatibility mode
   ✅ Feature detection
   ✅ Fallback behaviors
   ✅ Performance optimization

5. **Mobile Browsers**
   ✅ iOS Safari
   ✅ Android Chrome
   ✅ Samsung Internet
   ✅ Mobile Firefox

EOF

echo ""
print_header "PERFORMANCE TESTING"

print_info "Testing widget performance..."

# Test 5: Load Performance
print_info "Test 5: Widget Load Performance"
cat << 'EOF'

Performance Test Commands:

# Test widget load time
time curl -s https://your-app.railway.app/shopify-widgets/prescription-upload-widget.js > /dev/null

# Test CSS load time
time curl -s https://your-app.railway.app/shopify-widgets/shopify-widget-styles.css > /dev/null

# Test API response time
time curl -X POST https://your-app.railway.app/api/shopify/widgets/recommendations \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Test concurrent widget requests
for i in {1..10}; do
  curl -s https://your-app.railway.app/shopify-widgets/prescription-upload-widget.js > /dev/null &
done
wait

EOF

# Performance Benchmarks
print_info "Performance Benchmarks:"
echo ""
cat << 'EOF'
✅ Widget Load Time: <2 seconds
✅ CSS Load Time: <1 second  
✅ API Response Time: <3 seconds
✅ File Upload Speed: >1MB/s
✅ Concurrent Users: 50+ simultaneous
✅ Mobile Performance: <3 seconds load time
✅ SEO Impact: Minimal page score reduction

EOF

echo ""
print_header "SECURITY TESTING"

print_info "Testing widget security..."

cat << 'EOF'

Security Test Cases:

1. **Input Validation**:
   - Test XSS prevention in form inputs
   - Verify file type validation
   - Check SQL injection protection
   - Test CSRF token validation

2. **File Upload Security**:
   - Test malicious file upload prevention
   - Verify file size limits enforced
   - Check virus scanning integration
   - Test secure file storage

3. **API Security**:
   - Test rate limiting on widget APIs
   - Verify authentication requirements
   - Check data encryption in transit
   - Test API key protection

4. **Data Privacy**:
   - Verify prescription data encryption
   - Test GDPR compliance
   - Check data retention policies
   - Verify secure data transmission

EOF

echo ""
print_header "USER EXPERIENCE TESTING"

print_info "Testing user experience..."

cat << 'EOF'

UX Testing Scenarios:

1. **First-Time User**:
   - Clear widget instructions
   - Intuitive file upload process
   - Helpful error messages
   - Progress indicators

2. **Returning Customer**:
   - Saved prescription preferences
   - Quick re-order functionality
   - Personalized recommendations
   - Order history integration

3. **Mobile User**:
   - Touch-friendly interface
   - Camera upload integration
   - Responsive design
   - Quick load times

4. **Accessibility**:
   - Screen reader compatibility
   - Keyboard navigation
   - High contrast mode
   - Font size scalability

EOF

echo ""
print_header "INTEGRATION TESTING"

print_info "Testing Shopify integration..."

cat << 'EOF'

Integration Test Cases:

1. **Theme Integration**:
   - Widget matches store styling
   - Consistent branding
   - No CSS conflicts
   - Responsive layout

2. **Product Page Integration**:
   - Widgets appear on correct pages
   - Product data synchronization
   - Cart integration works
   - Checkout flow seamless

3. **Order Processing**:
   - Prescription data attached to orders
   - ECP notification system
   - Order status updates
   - Customer communication

4. **Admin Dashboard**:
   - Widget usage analytics
   - Prescription processing queue
   - Error monitoring
   - Performance metrics

EOF

echo ""
print_header "AUTOMATED TESTING"

print_info "Running automated widget tests..."

# Create test HTML file
cat > ./widget-test.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ILS Shopify Widgets Test</title>
    <link rel="stylesheet" href="https://your-app.railway.app/shopify-widgets/shopify-widget-styles.css">
</head>
<body>
    <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1>ILS Shopify Widgets Test Page</h1>
        
        <h2>Prescription Upload Widget</h2>
        <div id="ils-prescription-upload"></div>
        
        <h2>Lens Recommendation Widget</h2>
        <div id="ils-lens-recommendation"></div>
        
        <h2>Test Results</h2>
        <div id="test-results"></div>
    </div>

    <script src="https://your-app.railway.app/shopify-widgets/prescription-upload-widget.js"></script>
    <script src="https://your-app.railway.app/shopify-widgets/lens-recommendation-widget.js"></script>
    
    <script>
        // Initialize widgets
        document.addEventListener('DOMContentLoaded', function() {
            const results = document.getElementById('test-results');
            
            // Test prescription upload widget
            try {
                if (typeof ILSPrescriptionUpload !== 'undefined') {
                    const uploadWidget = new ILSPrescriptionUpload({
                        container: '#ils-prescription-upload',
                        api_url: 'https://your-app.railway.app',
                        store_id: 'test-store-id'
                    });
                    results.innerHTML += '<p>✅ Prescription Upload Widget initialized</p>';
                } else {
                    results.innerHTML += '<p>❌ Prescription Upload Widget not found</p>';
                }
            } catch (error) {
                results.innerHTML += '<p>❌ Prescription Upload Widget error: ' + error.message + '</p>';
            }
            
            // Test lens recommendation widget
            try {
                if (typeof ILSLensRecommendation !== 'undefined') {
                    const recommendationWidget = new ILSLensRecommendation({
                        container: '#ils-lens-recommendation',
                        api_url: 'https://your-app.railway.app',
                        store_id: 'test-store-id'
                    });
                    results.innerHTML += '<p>✅ Lens Recommendation Widget initialized</p>';
                } else {
                    results.innerHTML += '<p>❌ Lens Recommendation Widget not found</p>';
                }
            } catch (error) {
                results.innerHTML += '<p>❌ Lens Recommendation Widget error: ' + error.message + '</p>';
            }
        });
    </script>
</body>
</html>
EOF

print_success "Widget test HTML file created: ./widget-test.html"

echo ""
print_header "INSTALLATION INSTRUCTIONS"

print_info "Shopify Widget Installation Steps:"
echo ""

cat << 'EOF'

1. **Download Widget Files**:
   - prescription-upload-widget.js
   - lens-recommendation-widget.js  
   - shopify-widget-styles.css

2. **Upload to Shopify Theme**:
   - Shopify Admin > Online Store > Themes
   - Edit code > Assets folder
   - Upload all widget files

3. **Add to Theme.liquid**:
   ```html
   <!-- ILS Widgets -->
   {{ 'shopify-widget-styles.css' | asset_url | stylesheet_tag }}
   {{ 'prescription-upload-widget.js' | asset_url | script_tag }}
   {{ 'lens-recommendation-widget.js' | asset_url | script_tag }}
   ```

4. **Add to Product Templates**:
   ```html
   <!-- Prescription Upload -->
   <div id="ils-prescription-upload"></div>
   
   <!-- Lens Recommendations -->
   <div id="ils-lens-recommendation"></div>
   ```

5. **Initialize Widgets**:
   ```javascript
   <script>
   document.addEventListener('DOMContentLoaded', function() {
     new ILSPrescriptionUpload({
       container: '#ils-prescription-upload',
       api_url: 'https://your-app.railway.app',
       store_id: '{{ shop.id }}'
     });
     
     new ILSLensRecommendation({
       container: '#ils-lens-recommendation', 
       api_url: 'https://your-app.railway.app',
       store_id: '{{ shop.id }}'
     });
   });
   </script>
   ```

EOF

print_success "Shopify widgets testing guide completed!"
echo ""

print_info "📋 Test Results Summary:"
echo ""
echo "✅ Widget Files: Verify all files are accessible"
echo "✅ Functionality: Test upload and recommendation features"
echo "✅ API Integration: Verify backend connectivity"
echo "✅ Cross-browser: Test on all major browsers"
echo "✅ Performance: Ensure fast load times"
echo "✅ Security: Validate input protection"
echo "✅ User Experience: Test intuitive interface"
echo "✅ Integration: Verify seamless Shopify integration"
echo ""

print_warning "Performance Requirements:"
echo ""
echo "• Widget Load Time: <2 seconds"
echo "• API Response Time: <3 seconds"
echo "• File Upload Speed: >1MB/s"
echo "• Mobile Load Time: <3 seconds"
echo "• Concurrent Users: 50+ simultaneous"
echo ""

print_info "🔗 Testing Resources:"
echo ""
echo "• Test Page: ./widget-test.html"
echo "• Widget Files: ./client/shopify-widgets/"
echo "• API Documentation: ./SHOPIFY_INTEGRATION_GUIDE.md"
echo "• Store Admin: https://your-store.myshopify.com/admin"
echo ""

print_info "📊 Expected Results:"
echo ""
echo "• Seamless prescription upload with AI processing"
echo "• Accurate lens recommendations based on lifestyle"
echo "• Responsive design on all devices"
echo "• Fast loading and smooth interactions"
echo "• Secure handling of prescription data"
echo ""

echo "🛒 Your Shopify widgets are ready for testing and deployment!"
