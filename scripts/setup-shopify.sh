#!/bin/bash

# ILS 2.0 - Shopify Integration Setup Script
# Configures Shopify store integration for e-commerce functionality

set -e

echo "🛒 ILS 2.0 - Shopify Integration Setup"
echo "====================================="

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

print_header "SHOPIFY INTEGRATION ARCHITECTURE"

echo ""
print_info "Shopify integration will enable:"
echo "  • E-commerce store for prescription lenses"
echo "  • Order synchronization between Shopify and ILS"
echo "  • Customer data management"
echo "  • Prescription upload and verification"
echo "  • Inventory management"
echo "  • Payment processing"
echo "  • Shipping and fulfillment"
echo ""

print_header "SHOPIFY DEVELOPMENT STORE SETUP"

echo ""
print_info "Step 1: Create Shopify Development Store"
echo ""

cat << 'EOF'
1. **Create Shopify Partner Account**:
   • Go to partners.shopify.com
   • Sign up for free partner account
   • Verify your email address

2. **Create Development Store**:
   • Login to Shopify Partner Dashboard
   • Click "Stores" → "Add store" → "Development store"
   • Store name: "ILS 2.0 Test Store"
   • Store URL: ils-test-[your-name].myshopify.com
   • Password: Generate secure password
   • Purpose: "App development"

3. **Install Sample Data** (Optional):
   • Add sample products
   • Create test customer accounts
   • Set up payment gateway (Shopify Payments test mode)

EOF

print_info "Step 2: Create Shopify App"
echo ""

cat << 'EOF'
1. **Create Custom App**:
   • In Partner Dashboard → Select your store
   • Click "Apps" → "Create app" → "Create app manually"
   • App name: "ILS 2.0 Integration"
   • App developer: Your name/company

2. **Configure App Permissions**:
   • Read access: Products, Orders, Customers, Inventory
   • Write access: Orders, Products, Inventory
   • Webhooks: Orders/create, Orders/updated, Products/updated

3. **Install App**:
   • Click "Install app"
   • Copy API credentials
   • Store them securely

EOF

print_header "ENVIRONMENT CONFIGURATION"

echo ""
print_info "Add these environment variables to Railway:"
echo ""

cat << 'EOF'
# Shopify Configuration
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
SHOPIFY_API_VERSION=2024-01
SHOPIFY_ACCESS_TOKEN=shpat_your-access-token-here
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret-here

# Shopify App Credentials (if using custom app)
SHOPIFY_API_KEY=your-api-key
SHOPIFY_API_SECRET=your-api-secret

# Integration Settings
SHOPIFY_SYNC_ENABLED=true
SHOPIFY_WEBHOOK_ENABLED=true
SHOPIFY_ORDER_SYNC_ENABLED=true
SHOPIFY_INVENTORY_SYNC_ENABLED=true
SHOPIFY_CUSTOMER_SYNC_ENABLED=true

# Prescription Verification
SHOPIFY_PRESCRIPTION_REQUIRED=true
SHOPIFY_PRESCRIPTION_UPLOAD_ENABLED=true
SHOPIFY_PRESCRIPTION_VERIFICATION_ENABLED=true

# Product Configuration
SHOPIFY_PRODUCT_SYNC_ENABLED=true
SHOPIFY_LENS_CATEGORY_ID=your-lens-category-id
SHOPIFY_FRAME_CATEGORY_ID=your-frame-category-id

EOF

print_header "SHOPIFY PRODUCTS SETUP"

echo ""
print_info "📋 Product Categories and Types:"
echo ""

cat << 'EOF'
👓 Prescription Lenses:
   • Single Vision Lenses
   • Bifocal Lenses
   • Progressive Lenses
   • Toric Lenses (Astigmatism)
   • Blue Light Filtering
   • Photochromic (Transition)
   • High Index Materials
   • Anti-Reflective Coating

👓 Frames:
   • Full-Rim Frames
   • Semi-Rimless Frames
   • Rimless Frames
   • Kids Frames
   • Sports Frames
   • Sunglasses

📦 Accessories:
   • Lens Cleaning Kits
   • Repair Kits
   • Cases and Cloths
   • Contact Lens Solutions

EOF

print_info "🔧 Product Attributes Setup:"
echo ""

cat << 'EOF'
For each product, configure these attributes:

👓 Lens Products:
   • Sphere Power Range: -10.00 to +10.00
   • Cylinder Power Range: -6.00 to 0
   • Axis: 0 to 180
   • Add Power: +0.75 to +3.50
   • Material: Plastic, Polycarbonate, High Index
   • Coatings: Anti-Reflective, UV, Scratch Resistant

👓 Frame Products:
   • Frame Size: Small, Medium, Large
   • Frame Width: 48mm to 60mm
   • Bridge Width: 16mm to 22mm
   • Temple Length: 130mm to 150mm
   • Material: Metal, Plastic, Titanium
   • Color: Various options

EOF

print_header "SHOPIFY WEBHOOKS CONFIGURATION"

echo ""
print_info "🔗 Required Webhooks:"
echo ""

cat << 'EOF'
1. **Order Created**:
   • Event: orders/create
   • URL: https://your-app.railway.app/api/shopify/webhooks/orders
   • Purpose: Sync new orders to ILS system

2. **Order Updated**:
   • Event: orders/updated
   • URL: https://your-app.railway.app/api/shopify/webhooks/orders
   • Purpose: Update order status in ILS system

3. **Product Updated**:
   • Event: products/updated
   • URL: https://your-app.railway.app/api/shopify/webhooks/products
   • Purpose: Sync product changes

4. **Inventory Updated**:
   • Event: inventory_levels/update
   • URL: https://your-app.railway.app/api/shopify/webhooks/inventory
   • Purpose: Update inventory levels

EOF

print_info "🔧 Webhook Setup Instructions:"
echo ""

cat << 'EOF'
1. In Shopify Admin → Settings → Notifications → Webhooks
2. Click "Add webhook"
3. Select event type and enter URL
4. Set API version to match your app
5. Copy webhook secret for verification
6. Test webhook delivery

EOF

print_header "PRESCRIPTION UPLOAD WORKFLOW"

echo ""
print_info "👁️ Prescription Upload Process:"
echo ""

cat << 'EOF'
1. **Customer Uploads Prescription**:
   • During checkout, customer uploads prescription image
   • Image is stored in S3 and linked to order
   • AI OCR processes prescription for validation

2. **ECP Verification**:
   • Eye Care Professional reviews prescription
   • Verifies accuracy and completeness
   • Approves or requests clarification

3. **Order Processing**:
   • Once prescription is verified, order moves to production
   • Lenses are manufactured according to prescription
   • Order is fulfilled and shipped

EOF

print_info "🔒 Security and Compliance:"
echo ""

cat << 'EOF'
• HIPAA Compliance: All prescription data encrypted
• Access Control: Only authorized ECPs can view prescriptions
• Data Retention: Prescriptions stored according to regulations
• Audit Trail: All access to prescription data logged
• Secure Storage: Images stored in encrypted S3 bucket

EOF

print_header "TESTING SHOPIFY INTEGRATION"

echo ""
print_info "🧪 Test the Shopify integration:"
echo ""

cat << 'EOF'
1. **Test API Connection**:
   curl -X POST https://your-app.railway.app/api/shopify/test-connection \
     -H "Content-Type: application/json" \
     -d '{"shopDomain": "your-store.myshopify.com"}'

2. **Test Product Sync**:
   curl -X POST https://your-app.railway.app/api/shopify/sync/products \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"

3. **Test Order Sync**:
   curl -X POST https://your-app.railway.app/api/shopify/sync/orders \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"

4. **Test Webhook Processing**:
   curl -X POST https://your-app.railway.app/api/shopify/webhooks/test \
     -H "Content-Type: application/json" \
     -d '{"event": "orders/create", "data": {...}}'

EOF

print_header "SHOPIFY WIDGETS INSTALLATION"

echo ""
print_info "📱 Install Shopify Widgets:"
echo ""

cat << 'EOF'
1. **Lens Recommendation Widget**:
   • Add to product pages
   • Helps customers choose right lenses
   • Integrates with prescription data

2. **Prescription Upload Widget**:
   • Add to cart/checkout page
   • Allows customers to upload prescriptions
   • Validates prescription format

3. **Frame Fitting Widget**:
   • Add to product pages
   • Virtual try-on functionality
   - Size recommendations

EOF

print_info "🔧 Widget Installation:"
echo ""

cat << 'EOF'
1. Copy widget files from client/shopify-widgets/
2. Add to Shopify theme: Assets → Add new asset
3. Include in theme.liquid or specific templates
4. Configure widget settings in theme customizer
5. Test widget functionality

EOF

print_header "MONITORING SHOPIFY INTEGRATION"

echo ""
print_info "📊 Monitor Shopify integration health:"
echo ""

cat << 'EOF'
1. **Integration Status**:
   curl https://your-app.railway.app/api/shopify/status

2. **Sync Statistics**:
   curl https://your-app.railway.app/api/shopify/sync/stats

3. **Webhook Logs**:
   curl https://your-app.railway.app/api/shopify/webhooks/logs

4. **Error Monitoring**:
   curl https://your-app.railway.app/api/shopify/errors

EOF

print_success "Shopify integration setup guide completed!"
echo ""

print_info "📋 Next Steps:"
echo "1. Create Shopify development store"
echo "2. Create custom app with proper permissions"
echo "3. Configure environment variables in Railway"
echo "4. Set up webhooks for order/product sync"
echo "5. Test integration with sample data"
echo "6. Install widgets in Shopify theme"
echo ""

print_info "🔗 Important URLs:"
echo ""
echo "• Shopify Partner Dashboard: partners.shopify.com"
echo "• Your Development Store: https://your-store.myshopify.com"
echo "• Shopify App Dashboard: partners.shopify.com/stores"
echo "• ILS Shopify Admin: https://your-app.railway.app/admin/shopify"
echo ""

print_info "📋 Testing Checklist:"
echo ""
echo "✅ API connection to Shopify"
echo "✅ Product synchronization"
echo "✅ Order synchronization"
echo "✅ Webhook processing"
echo "✅ Prescription upload workflow"
echo "✅ Widget functionality"
echo "✅ Error handling and logging"
echo ""

echo "🛒 Your Shopify e-commerce integration is ready for setup!"
