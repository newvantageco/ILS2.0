#!/bin/bash

# ILS 2.0 - Shopify Integration Testing Script
# Tests all Shopify integration functionality

set -e

echo "🧪 ILS 2.0 - Shopify Integration Testing"
echo "========================================"

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
SHOPIFY_STORE=${2:-"your-store.myshopify.com"}

echo ""
print_info "Testing Shopify integration at: $APP_URL"
print_info "Shopify Store: $SHOPIFY_STORE"

# Function to test endpoint
test_endpoint() {
    local endpoint="$1"
    local method="$2"
    local data="$3"
    local expected_status="$4"
    local description="$5"
    
    print_info "Testing: $description"
    
    local cmd="curl -s -o /dev/null -w '%{http_code}' -X $method"
    
    if [ -n "$data" ]; then
        cmd="$cmd -H 'Content-Type: application/json' -d '$data'"
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
print_info "🔍 Basic Shopify Connection Tests"

# Test 1: Shopify Service Status
test_endpoint "/api/shopify/status" "GET" "" "200" "Shopify Service Status"

# Test 2: Shopify Integration Health
test_endpoint "/api/verification/shopify" "GET" "" "200" "Shopify Integration Health"

echo ""
print_info "🔧 API Connection Tests"

# Test 3: Test Shopify API Connection
test_endpoint "/api/shopify/test-connection" "POST" "{\"shopDomain\":\"$SHOPIFY_STORE\"}" "200" "Shopify API Connection Test"

echo ""
print_info "📦 Product Synchronization Tests"

# Test 4: Product Sync Status
test_endpoint "/api/shopify/sync/products/status" "GET" "" "200" "Product Sync Status"

# Test 5: Trigger Product Sync
test_endpoint "/api/shopify/sync/products" "POST" "{\"fullSync\":true}" "401" "Product Sync (expected 401 without auth)"

echo ""
print_info "📋 Order Synchronization Tests"

# Test 6: Order Sync Status
test_endpoint "/api/shopify/sync/orders/status" "GET" "" "200" "Order Sync Status"

# Test 7: Trigger Order Sync
test_endpoint "/api/shopify/sync/orders" "POST" "{\"dateRange\":\"7d\"}" "401" "Order Sync (expected 401 without auth)"

echo ""
print_info "👤 Customer Synchronization Tests"

# Test 8: Customer Sync Status
test_endpoint "/api/shopify/sync/customers/status" "GET" "" "200" "Customer Sync Status"

echo ""
print_info "📊 Inventory Management Tests"

# Test 9: Inventory Sync Status
test_endpoint "/api/shopify/sync/inventory/status" "GET" "" "200" "Inventory Sync Status"

echo ""
print_info "🔗 Webhook Tests"

# Test 10: Webhook Status
test_endpoint "/api/shopify/webhooks/status" "GET" "" "200" "Webhook Status"

# Test 11: Test Webhook Processing
test_endpoint "/api/shopify/webhooks/test" "POST" "{\"event\":\"orders/create\"}" "200" "Webhook Test Processing"

echo ""
print_info "📱 Widget Tests"

# Test 12: Widget Configuration
test_endpoint "/api/shopify/widgets/config" "GET" "" "200" "Shopify Widget Configuration"

echo ""
print_info "👁️ Prescription Upload Tests"

# Test 13: Prescription Upload Endpoint
test_endpoint "/api/shopify/prescriptions/upload" "POST" "{\"orderId\":\"test\"}" "401" "Prescription Upload (expected 401 without auth)"

echo ""
print_info "🧪 Manual Testing Instructions"

cat << 'EOF'

To test Shopify integration functionality manually:

1. **Test Shopify API Connection**:
   curl -X POST https://your-app.railway.app/api/shopify/test-connection \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"shopDomain": "your-store.myshopify.com"}'

2. **Test Product Synchronization**:
   curl -X POST https://your-app.railway.app/api/shopify/sync/products \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"fullSync": true, "categories": ["lenses", "frames"]}'

3. **Test Order Synchronization**:
   curl -X POST https://your-app.railway.app/api/shopify/sync/orders \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"dateRange": "7d", "status": "all"}'

4. **Test Webhook Processing**:
   curl -X POST https://your-app.railway.app/api/shopify/webhooks/orders \
     -H "Content-Type: application/json" \
     -H "X-Shopify-Hmac-Sha256: webhooks_signature" \
     -d '{
       "id": 123456789,
       "email": "customer@example.com",
       "financial_status": "paid",
       "line_items": [
         {
           "product_id": 987654321,
           "quantity": 1,
           "price": 99.99
         }
       ]
     }'

5. **Test Prescription Upload**:
   curl -X POST https://your-app.railway.app/api/shopify/prescriptions/upload \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "file=@prescription.jpg" \
     -F "orderId=12345" \
     -F "customerId=67890"

6. **Test Widget Rendering**:
   # Access your Shopify store with widgets installed
   # https://your-store.myshopify.com/products/sample-lens

EOF

print_info "🔧 Shopify Store Testing"

cat << 'EOF'

To test the full integration in your Shopify store:

1. **Create Test Order**:
   • Go to your Shopify store
   • Add prescription lenses to cart
   • Upload test prescription image
   • Complete checkout process

2. **Verify Order Sync**:
   • Check ILS admin dashboard
   • Verify order appears in system
   • Check prescription data is linked

3. **Test Prescription Processing**:
   • Access ECP dashboard
   • Review uploaded prescription
   • Approve or request changes
   • Verify order moves to production

4. **Test Inventory Updates**:
   • Update product inventory in Shopify
   • Verify sync to ILS system
   • Check inventory levels match

5. **Test Customer Data Sync**:
   • Create new customer in Shopify
   • Verify customer appears in ILS
   • Check data mapping is correct

EOF

print_info "📊 Integration Monitoring"

cat << 'EOF'

Monitor your Shopify integration with these endpoints:

1. **Integration Health**:
   curl https://your-app.railway.app/api/shopify/health

2. **Sync Statistics**:
   curl https://your-app.railway.app/api/shopify/sync/stats

3. **Error Logs**:
   curl https://your-app.railway.app/api/shopify/errors

4. **Performance Metrics**:
   curl https://your-app.railway.app/api/shopify/metrics

5. **Webhook Logs**:
   curl https://your-app.railway.app/api/shopify/webhooks/logs

EOF

print_info "🚨 Troubleshooting Common Issues"

cat << 'EOF'

❌ API Connection Failed:
  • Verify SHOPIFY_ACCESS_TOKEN is correct
  • Check SHOPIFY_SHOP_DOMAIN matches your store
  • Ensure app has proper permissions

❌ Product Sync Not Working:
  • Check product categories are mapped
  • Verify API permissions include products read/write
  • Review sync logs for specific errors

❌ Webhook Not Received:
  • Verify webhook URL is accessible
  • Check webhook secret matches configuration
  • Test webhook delivery in Shopify admin

❌ Prescription Upload Failing:
  • Check S3 storage configuration
  • Verify file size limits
  • Test AI OCR service integration

❌ Order Sync Issues:
  • Verify order webhooks are configured
  • Check order status mapping
  • Review error logs for failed orders

EOF

print_success "Shopify integration testing guide ready!"
echo ""

print_info "📋 Expected Results:"
echo ""
echo "✅ API Connection: Should authenticate successfully"
echo "✅ Product Sync: Should sync products and variants"
echo "✅ Order Sync: Should import orders and line items"
echo "✅ Customer Sync: Should sync customer data"
echo "✅ Inventory Sync: Should update inventory levels"
echo "✅ Webhooks: Should process Shopify events"
echo "✅ Prescription Upload: Should handle file uploads"
echo "✅ Widgets: Should render in store frontend"
echo ""

print_warning "Prerequisites:"
echo ""
echo "• Shopify development store created"
echo "• Custom app with proper permissions"
echo "• Environment variables configured"
echo "• Webhooks set up and tested"
echo "• Products and categories configured"
echo ""

print_info "🔗 Testing URLs:"
echo ""
echo "• Shopify Admin: https://your-store.myshopify.com/admin"
echo "• ILS Shopify Integration: https://your-app.railway.app/admin/shopify"
echo "• Shopify Partner Dashboard: https://partners.shopify.com"
echo ""

echo "🛒 Your Shopify e-commerce integration is ready for testing!"
