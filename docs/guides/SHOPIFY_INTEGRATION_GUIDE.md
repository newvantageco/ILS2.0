# 🛒 ILS 2.0 - Shopify Integration Guide

## **OVERVIEW**

Configure comprehensive Shopify integration to enable e-commerce functionality, prescription lens sales, and order synchronization between your ILS 2.0 platform and Shopify stores.

---

## **🎯 INTEGRATION ARCHITECTURE**

### **Multi-Channel E-Commerce**
```
ILS 2.0 Platform
├── Shopify Store Frontend
│   ├── Product Catalog
│   ├── Shopping Cart
│   ├── Prescription Upload
│   └── Checkout Process
├── Order Management
│   ├── Order Synchronization
│   ├── Prescription Verification
│   ├── Production Workflow
│   └── Fulfillment Tracking
└── Data Synchronization
    ├── Products & Inventory
    ├── Customer Data
    ├── Order Status
    └── Analytics
```

---

## **🚀 QUICK SETUP**

### **Option 1: Development Store (Recommended)**
1. **Create Partner Account**: Sign up at partners.shopify.com
2. **Create Development Store**: Free development store for testing
3. **Create Custom App**: Configure with proper permissions
4. **Set Up Webhooks**: Configure order/product sync
5. **Install Widgets**: Add prescription upload functionality

### **Option 2: Production Store**
1. **Create Custom App**: In your existing Shopify store
2. **Configure Permissions**: Read/write access for orders, products
3. **Set Up Webhooks**: Production webhook endpoints
4. **Install Widgets**: Add to your live theme
5. **Test Integration**: Verify all functionality works

---

## **🔧 ENVIRONMENT CONFIGURATION**

### **Required Environment Variables**
```bash
# Shopify Store Configuration
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
SHOPIFY_API_VERSION=2024-01
SHOPIFY_ACCESS_TOKEN=shpat_your-access-token-here
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret-here

# Shopify App Credentials
SHOPIFY_API_KEY=your-api-key
SHOPIFY_API_SECRET=your-api-secret

# Integration Settings
SHOPIFY_SYNC_ENABLED=true
SHOPIFY_WEBHOOK_ENABLED=true
SHOPIFY_ORDER_SYNC_ENABLED=true
SHOPIFY_INVENTORY_SYNC_ENABLED=true
SHOPIFY_CUSTOMER_SYNC_ENABLED=true

# Prescription Management
SHOPIFY_PRESCRIPTION_REQUIRED=true
SHOPIFY_PRESCRIPTION_UPLOAD_ENABLED=true
SHOPIFY_PRESCRIPTION_VERIFICATION_ENABLED=true

# Product Configuration
SHOPIFY_PRODUCT_SYNC_ENABLED=true
SHOPIFY_LENS_CATEGORY_ID=your-lens-category-id
SHOPIFY_FRAME_CATEGORY_ID=your-frame-category-id
```

---

## **🛒 SHOPIFY STORE SETUP**

### **Step 1: Create Development Store**
```bash
1. Go to partners.shopify.com
2. Sign up for free partner account
3. Click "Stores" → "Add store" → "Development store"
4. Store name: "ILS 2.0 Test Store"
5. Store URL: ils-test-[your-name].myshopify.com
6. Purpose: "App development"
7. Generate secure password
```

### **Step 2: Create Custom App**
```bash
1. In Partner Dashboard → Select your store
2. Click "Apps" → "Create app" → "Create app manually"
3. App name: "ILS 2.0 Integration"
4. Configure Admin API access:
   • Read access: Products, Orders, Customers, Inventory
   • Write access: Orders, Products, Inventory
5. Configure Web API subscriptions:
   • orders/create, orders/updated
   • products/updated, inventory_levels/update
6. Install app and copy credentials
```

### **Step 3: Configure Products**
```bash
# Lens Products
• Single Vision Lenses
• Bifocal Lenses  
• Progressive Lenses
• Toric Lenses (Astigmatism)
• Blue Light Filtering
• Photochromic (Transition)
• High Index Materials
• Anti-Reflective Coating

# Frame Products
• Full-Rim Frames
• Semi-Rimless Frames
• Rimless Frames
• Kids Frames
• Sports Frames
• Sunglasses

# Product Attributes
• Sphere Power: -10.00 to +10.00
• Cylinder Power: -6.00 to 0
• Axis: 0 to 180
• Add Power: +0.75 to +3.50
• Material: Plastic, Polycarbonate, High Index
```

---

## **🔗 WEBHOOK CONFIGURATION**

### **Required Webhooks**
```bash
1. Order Created:
   • Event: orders/create
   • URL: https://your-app.railway.app/api/shopify/webhooks/orders
   • Purpose: Sync new orders to ILS system

2. Order Updated:
   • Event: orders/updated
   • URL: https://your-app.railway.app/api/shopify/webhooks/orders
   • Purpose: Update order status in ILS system

3. Product Updated:
   • Event: products/updated
   • URL: https://your-app.railway.app/api/shopify/webhooks/products
   • Purpose: Sync product changes

4. Inventory Updated:
   • Event: inventory_levels/update
   • URL: https://your-app.railway.app/api/shopify/webhooks/inventory
   • Purpose: Update inventory levels
```

### **Webhook Setup Instructions**
```bash
1. Shopify Admin → Settings → Notifications → Webhooks
2. Click "Add webhook"
3. Select event type and enter URL
4. Set API version to match your app
5. Copy webhook secret for verification
6. Test webhook delivery with sample data
```

---

## **📱 SHOPIFY WIDGETS**

### **Available Widgets**
```javascript
// Lens Recommendation Widget
<script src="https://your-app.railway.app/shopify-widgets/lens-recommendation-widget.js"></script>
<div id="ils-lens-recommendation"></div>

// Prescription Upload Widget  
<script src="https://your-app.railway.app/shopify-widgets/prescription-upload-widget.js"></script>
<div id="ils-prescription-upload"></div>

// Frame Fitting Widget
<script src="https://your-app.railway.app/shopify-widgets/frame-fitting-widget.js"></script>
<div id="ils-frame-fitting"></div>
```

### **Widget Installation**
```bash
1. Copy widget files from client/shopify-widgets/
2. Add to Shopify theme: Assets → Add new asset
3. Include in theme.liquid:
   {{ 'lens-recommendation-widget.js' | asset_url | script_tag }}
4. Add to product templates:
   <div id="ils-lens-recommendation"></div>
5. Configure in theme customizer
```

---

## **👁️ PRESCRIPTION WORKFLOW**

### **Upload Process**
```javascript
// Customer uploads prescription during checkout
const prescriptionUpload = {
  file: 'prescription.jpg',
  orderId: 'SHOPIFY_ORDER_ID',
  customerId: 'SHOPIFY_CUSTOMER_ID',
  uploadTime: '2024-01-01T12:00:00Z',
  status: 'pending_verification'
};

// AI OCR processes prescription
const ocrResult = {
  sphere: -2.50,
  cylinder: -0.75,
  axis: 180,
  addPower: +1.25,
  confidence: 0.95,
  requiresVerification: true
};
```

### **Verification Process**
```bash
1. Customer uploads prescription image
2. AI OCR extracts prescription data
3. ECP reviews and verifies prescription
4. Order moves to production once verified
5. Customer notified of verification status
```

---

## **📊 API ENDPOINTS**

### **Shopify Integration API**
```bash
# Connection Testing
POST /api/shopify/test-connection
{
  "shopDomain": "your-store.myshopify.com"
}

# Product Synchronization
POST /api/shopify/sync/products
{
  "fullSync": true,
  "categories": ["lenses", "frames"]
}

# Order Synchronization
POST /api/shopify/sync/orders
{
  "dateRange": "7d",
  "status": "all"
}

# Customer Synchronization
POST /api/shopify/sync/customers
{
  "fullSync": true,
  "dateRange": "30d"
}

# Inventory Synchronization
POST /api/shopify/sync/inventory
{
  "locationIds": ["123456789"],
  "productIds": ["987654321"]
}

# Webhook Processing
POST /api/shopify/webhooks/orders
POST /api/shopify/webhooks/products
POST /api/shopify/webhooks/inventory

# Prescription Upload
POST /api/shopify/prescriptions/upload
Content-Type: multipart/form-data
- file: prescription.jpg
- orderId: SHOPIFY_ORDER_ID
- customerId: SHOPIFY_CUSTOMER_ID
```

---

## **🧪 TESTING & VALIDATION**

### **Connection Testing**
```bash
# Test Shopify API connection
curl -X POST https://your-app.railway.app/api/shopify/test-connection \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{"shopDomain": "your-store.myshopify.com"}'
```

### **Sync Testing**
```bash
# Test product synchronization
curl -X POST https://your-app.railway.app/api/shopify/sync/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{"fullSync": true}'

# Test order synchronization
curl -X POST https://your-app.railway.app/api/shopify/sync/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{"dateRange": "7d"}'
```

### **Webhook Testing**
```bash
# Test order webhook
curl -X POST https://your-app.railway.app/api/shopify/webhooks/orders \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Hmac-Sha256: webhook_signature" \
  -d '{
    "id": 123456789,
    "email": "customer@example.com",
    "financial_status": "paid"
  }'
```

---

## **🔒 SECURITY & COMPLIANCE**

### **HIPAA Compliance**
```bash
• Data Encryption: All prescription data encrypted at rest and in transit
• Access Control: Only authorized ECPs can access prescription data
• Audit Logging: All access to prescription data logged
• Data Retention: Prescriptions stored according to regulatory requirements
• Secure Storage: Images stored in encrypted S3 bucket
```

### **API Security**
```bash
• Authentication: JWT tokens for all API requests
• Rate Limiting: Prevent API abuse and control costs
• Webhook Verification: HMAC signature verification for webhooks
• Data Validation: Input validation and sanitization
• Error Handling: Secure error responses without data leakage
```

---

## **📈 MONITORING & ANALYTICS**

### **Integration Monitoring**
```bash
# Integration health check
GET /api/shopify/health

# Sync statistics
GET /api/shopify/sync/stats

# Error logs
GET /api/shopify/errors

# Performance metrics
GET /api/shopify/metrics

# Webhook logs
GET /api/shopify/webhooks/logs
```

### **Business Analytics**
```bash
# Sales performance
GET /api/shopify/analytics/sales

# Product performance
GET /api/shopify/analytics/products

# Customer analytics
GET /api/shopify/analytics/customers

# Prescription processing stats
GET /api/shopify/analytics/prescriptions
```

---

## **🚨 TROUBLESHOOTING**

### **Common Issues**

#### **API Connection Failed**
```bash
# Check credentials
echo $SHOPIFY_ACCESS_TOKEN
echo $SHOPIFY_SHOP_DOMAIN

# Verify app permissions
curl -X GET "https://$SHOPIFY_SHOP_DOMAIN/admin/api/2024-01/shop.json" \
  -H "X-Shopify-Access-Token: $SHOPIFY_ACCESS_TOKEN"
```

#### **Webhook Not Received**
```bash
# Test webhook endpoint
curl -X POST https://your-app.railway.app/api/shopify/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{"event": "orders/create"}'

# Check webhook logs
curl https://your-app.railway.app/api/shopify/webhooks/logs
```

#### **Sync Failures**
```bash
# Check sync status
curl https://your-app.railway.app/api/shopify/sync/status

# Review error logs
curl https://your-app.railway.app/api/shopify/errors
```

---

## **🎯 SUCCESS CRITERIA**

Your Shopify integration is successful when:

✅ **API Connection**: Authenticates with Shopify successfully  
✅ **Product Sync**: Products and variants synchronized  
✅ **Order Sync**: Orders imported and tracked  
✅ **Customer Sync**: Customer data synchronized  
✅ **Inventory Sync**: Inventory levels updated  
✅ **Webhooks**: Processing Shopify events correctly  
✅ **Prescription Upload**: Files uploaded and processed  
✅ **Widgets**: Rendering in store frontend  
✅ **Compliance**: HIPAA requirements met  

---

## **🚀 NEXT STEPS**

1. **Create Development Store**: Set up free Shopify development store
2. **Create Custom App**: Configure with proper permissions
3. **Configure Environment**: Add Shopify variables to Railway
4. **Set Up Webhooks**: Configure order/product sync webhooks
5. **Test Integration**: Run `./scripts/test-shopify.sh`
6. **Install Widgets**: Add to Shopify theme
7. **Go Live**: Configure production store integration

---

## **📞 SUPPORT**

- **Shopify Partner Docs**: [partners.shopify.com/docs](https://partners.shopify.com/docs)
- **Shopify API Docs**: [shopify.dev/docs](https://shopify.dev/docs)
- **ILS Shopify Admin**: `https://your-app.railway.app/admin/shopify`
- **Integration Testing**: `./scripts/test-shopify.sh`

---

**🛒 Your comprehensive Shopify e-commerce integration is ready!**
