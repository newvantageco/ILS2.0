# 🛒 ILS 2.0 - Shopify Widgets Testing Guide

## **OVERVIEW**

Test and deploy ILS 2.0 Shopify widgets to enable seamless prescription upload and AI-powered lens recommendations directly on your Shopify storefront. This ensures customers can easily upload prescriptions and receive personalized lens suggestions without leaving your store.

---

## **🎯 WIDGET ARCHITECTURE**

### **Widget Components**
```
ILS Shopify Widgets
├── Prescription Upload Widget
│   ├── File Upload Interface
│   ├── AI OCR Processing
│   ├── Data Validation
│   └── Customer Confirmation
├── Lens Recommendation Widget
│   ├── Lifestyle Questionnaire
│   ├── AI Recommendation Engine
│   ├── Product Integration
│   └── Add to Cart Functionality
└── Shared Components
    ├── Responsive Design
    ├── Theme Integration
    ├── Error Handling
    └── Performance Optimization
```

---

## **🚀 QUICK SETUP**

### **Prerequisites**
```bash
✅ Shopify development store created
✅ ILS 2.0 Shopify integration configured
✅ Custom app installed with proper permissions
✅ API credentials configured
✅ SSL certificate active on store
```

### **Basic Installation**
```bash
# Test widget accessibility
curl -I https://your-app.railway.app/shopify-widgets/prescription-upload-widget.js

# Run comprehensive widget tests
./scripts/test-shopify-widgets.sh

# Install on development store
./scripts/install-shopify-widgets.sh
```

---

## **🔧 WIDGET CONFIGURATION**

### **Environment Variables**
```bash
# Shopify Widget Configuration
SHOPIFY_WIDGETS_ENABLED=true
SHOPIFY_WIDGETS_DOMAIN=https://your-app.railway.app
SHOPIFY_WIDGETS_VERSION=2.0
SHOPIFY_WIDGETS_CACHE_TTL=3600

# Widget Security
WIDGET_JWT_SECRET=your-widget-jwt-secret
WIDGET_RATE_LIMIT=100  # requests per hour
WIDGET_MAX_FILE_SIZE=10485760  # 10MB

# Widget Features
PRESCRIPTION_UPLOAD_ENABLED=true
LENS_RECOMMENDATIONS_ENABLED=true
AI_PROCESSING_ENABLED=true
MOBILE_OPTIMIZED=true
```

### **Widget Settings**
```javascript
const widgetConfig = {
  // API Configuration
  apiUrl: 'https://your-app.railway.app',
  storeId: 'your-shopify-store-id',
  widgetToken: 'your-widget-jwt-token',
  
  // Prescription Upload Settings
  prescriptionUpload: {
    enabled: true,
    maxFileSize: 10485760,  // 10MB
    allowedFormats: ['jpg', 'jpeg', 'png'],
    requireConfirmation: true,
    autoProcess: true
  },
  
  // Lens Recommendation Settings
  lensRecommendations: {
    enabled: true,
    showPrices: true,
    allowCustomization: true,
    addToCartEnabled: true,
    recommendationLimit: 5
  },
  
  // UI Settings
  ui: {
    theme: 'auto',  // auto, light, dark
    language: 'en',
    currency: 'USD',
    showProgressBar: true,
    animationsEnabled: true
  }
};
```

---

## **📋 WIDGET TESTING SCENARIOS**

### **1. Prescription Upload Widget**

#### **Core Functionality Tests**
```javascript
const prescriptionTests = [
  {
    name: "File Upload Validation",
    test: () => {
      // Test valid file upload
      const validFile = new File([''], 'prescription.jpg', { type: 'image/jpeg' });
      return widget.uploadFile(validFile);
    },
    expected: "File accepted and processing started"
  },
  {
    name: "Invalid File Rejection", 
    test: () => {
      // Test invalid file upload
      const invalidFile = new File([''], 'document.pdf', { type: 'application/pdf' });
      return widget.uploadFile(invalidFile);
    },
    expected: "File rejected with appropriate error message"
  },
  {
    name: "Oversized File Handling",
    test: () => {
      // Test oversized file
      const largeFile = new File(['x'.repeat(15000000)], 'large.jpg', { type: 'image/jpeg' });
      return widget.uploadFile(largeFile);
    },
    expected: "File rejected due to size limit"
  },
  {
    name: "AI OCR Processing",
    test: () => {
      // Test OCR processing
      return widget.processPrescription('test-image-data');
    },
    expected: "Extracted prescription data returned"
  }
];
```

#### **Expected OCR Results**
```json
{
  "success": true,
  "prescriptionData": {
    "rightEye": {
      "sphere": "-2.50",
      "cylinder": "-0.75", 
      "axis": "180",
      "add": null
    },
    "leftEye": {
      "sphere": "-2.25",
      "cylinder": "-1.00",
      "axis": "175", 
      "add": null
    },
    "pd": "64",
    "doctor": "Dr. Smith",
    "date": "2024-01-15",
    "confidence": 0.92
  },
  "processingTime": 3.2,
  "recommendations": ["progressive_lenses", "anti_reflective_coating"]
}
```

### **2. Lens Recommendation Widget**

#### **Recommendation Engine Tests**
```javascript
const recommendationTests = [
  {
    name: "Basic Recommendations",
    input: {
      prescription: { sphere: -2.50, cylinder: -0.75, axis: 180 },
      lifestyle: "office_work",
      budget: "medium"
    },
    expectedOutput: {
      recommendations: [
        {
          product: "digital_progressive_lenses",
          score: 0.95,
          reason: "Matches prescription complexity and computer use"
        }
      ]
    }
  },
  {
    name: "Sports Recommendations",
    input: {
      prescription: { sphere: -1.50, cylinder: 0, axis: 0 },
      lifestyle: "sports",
      budget: "premium"
    },
    expectedOutput: {
      recommendations: [
        {
          product: "polycarbonate_sports_lenses",
          score: 0.92,
          reason: "Impact-resistant for sports activities"
        }
      ]
    }
  }
];
```

#### **Product Integration Tests**
```javascript
const productIntegrationTests = [
  {
    name: "Add to Cart Functionality",
    test: async () => {
      const recommendation = await widget.getRecommendations(testData);
      const result = await widget.addToCart(recommendation[0]);
      return result.success;
    },
    expected: true
  },
  {
    name: "Product Data Synchronization",
    test: async () => {
      const products = await widget.getAvailableProducts();
      return products.length > 0 && products[0].price > 0;
    },
    expected: true
  }
];
```

---

## **📊 PERFORMANCE TESTING**

### **Load Testing Scenarios**
```bash
# Test concurrent widget loads
for i in {1..20}; do
  curl -s https://your-app.railway.app/shopify-widgets/prescription-upload-widget.js > /dev/null &
done
wait

# Test API response times
time curl -X POST https://your-app.railway.app/api/shopify/widgets/recommendations \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Test file upload speeds
time curl -X POST https://your-app.railway.app/api/shopify/widgets/prescription/upload \
  -F "file=@test-prescription.jpg" \
  -F "storeId=test"
```

### **Performance Benchmarks**
```javascript
const performanceBenchmarks = {
  widgetLoad: {
    target: 2000,      // 2 seconds
    acceptable: 3000   // 3 seconds
  },
  apiResponse: {
    target: 1500,      // 1.5 seconds
    acceptable: 3000   // 3 seconds  
  },
  fileUpload: {
    target: 5000,      // 5 seconds for 5MB
    acceptable: 10000  // 10 seconds
  },
  mobileLoad: {
    target: 3000,      // 3 seconds
    acceptable: 5000   // 5 seconds
  }
};
```

---

## **🔍 TESTING PROCEDURES**

### **Step 1: Widget Accessibility**
```bash
# Test widget file availability
curl -I https://your-app.railway.app/shopify-widgets/prescription-upload-widget.js
curl -I https://your-app.railway.app/shopify-widgets/lens-recommendation-widget.js  
curl -I https://your-app.railway.app/shopify-widgets/shopify-widget-styles.css

# Expected: 200 OK for all files
```

### **Step 2: Widget Initialization**
```javascript
// Test in browser console
document.addEventListener('DOMContentLoaded', function() {
  try {
    const uploadWidget = new ILSPrescriptionUpload({
      container: '#test-container',
      api_url: 'https://your-app.railway.app',
      store_id: 'test-store'
    });
    console.log('✅ Upload widget initialized');
  } catch (error) {
    console.error('❌ Upload widget failed:', error);
  }
});
```

### **Step 3: API Integration Testing**
```bash
# Test prescription upload API
curl -X POST https://your-app.railway.app/api/shopify/widgets/prescription/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test-prescription.jpg" \
  -F "storeId=test-store" \
  -F "customerEmail=test@example.com"

# Test recommendation API
curl -X POST https://your-app.railway.app/api/shopify/widgets/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "test-store",
    "prescription": {"sphere": -2.50, "cylinder": -0.75, "axis": 180},
    "lifestyle": "office_work",
    "budget": "medium"
  }'
```

### **Step 4: Cross-browser Testing**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Widget Cross-browser Test</title>
  <link rel="stylesheet" href="https://your-app.railway.app/shopify-widgets/shopify-widget-styles.css">
</head>
<body>
  <div id="widget-test-container"></div>
  
  <script src="https://your-app.railway.app/shopify-widgets/prescription-upload-widget.js"></script>
  <script>
    // Test widget initialization
    const widget = new ILSPrescriptionUpload({
      container: '#widget-test-container',
      api_url: 'https://your-app.railway.app'
    });
  </script>
</body>
</html>
```

---

## **🚨 ERROR HANDLING TESTS**

### **Common Error Scenarios**

#### **Network Errors**
```javascript
// Test offline functionality
navigator.onLine = false;
widget.uploadFile(testFile);
// Expected: Graceful offline message

// Test API timeout
widget.setApiTimeout(100);  // 100ms timeout
widget.getRecommendations(testData);
// Expected: Timeout error with retry option
```

#### **Validation Errors**
```javascript
// Test invalid prescription data
widget.validatePrescription({
  sphere: "invalid",
  cylinder: -10.00,  // Out of range
  axis: 200         // Out of range
});
// Expected: Detailed validation errors

// Test file format validation
widget.uploadFile(new File([''], 'test.txt'));
// Expected: File format error
```

#### **Integration Errors**
```javascript
// Test missing store configuration
widget.init({ storeId: null });
// Expected: Configuration error

// Test API authentication failure
widget.setApiToken('invalid-token');
widget.getRecommendations(testData);
// Expected: Authentication error
```

---

## **📱 MOBILE TESTING**

### **Responsive Design Tests**
```css
/* Test viewport sizes */
@media (max-width: 480px) { /* Mobile */ }
@media (max-width: 768px) { /* Tablet */ }
@media (min-width: 769px) { /* Desktop */ }

/* Test touch interactions */
.widget-button {
  min-height: 44px;  /* iOS touch target */
  min-width: 44px;
}
```

### **Mobile Performance Tests**
```bash
# Test mobile page load with widgets
curl -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" \
  https://your-store.myshopify.com/products/test-product

# Test mobile API calls
curl -H "User-Agent: Mobile Safari" \
  -X POST https://your-app.railway.app/api/shopify/widgets/recommendations \
  -d '{"mobile": true, "test": true}'
```

---

## **🔒 SECURITY TESTING**

### **Input Validation Tests**
```javascript
// Test XSS prevention
const xssPayload = '<script>alert("xss")</script>';
widget.uploadFile(xssPayload);
// Expected: Input sanitized/rejected

// Test SQL injection prevention
const sqlPayload = "'; DROP TABLE users; --";
widget.validatePrescription({ sphere: sqlPayload });
// Expected: Input sanitized
```

### **File Upload Security**
```bash
# Test malicious file upload
curl -X POST https://your-app.railway.app/api/shopify/widgets/prescription/upload \
  -F "file=@malicious.exe" \
  -F "storeId=test"
# Expected: File rejected

# Test file size limit enforcement
curl -X POST https://your-app.railway.app/api/shopify/widgets/prescription/upload \
  -F "file=@oversized.jpg" \
  -F "storeId=test"
# Expected: Size limit error
```

---

## **📊 MONITORING DASHBOARD**

### **Widget Analytics**
```javascript
const widgetAnalytics = {
  usage: {
    dailyUploads: 150,
    dailyRecommendations: 320,
    conversionRate: 0.23,
    averageProcessingTime: 2.8
  },
  performance: {
    averageLoadTime: 1.2,
    errorRate: 0.02,
    uptime: 0.998,
    mobilePerformance: 0.95
  },
  userBehavior: {
    completionRate: 0.87,
    abandonmentRate: 0.13,
    mostUsedFeatures: ["upload", "recommendations"],
    deviceBreakdown: {
      mobile: 0.65,
      desktop: 0.35
    }
  }
};
```

### **Real-time Monitoring**
```bash
# Widget health check
curl https://your-app.railway.app/api/shopify/widgets/health

# Usage statistics
curl https://your-app.railway.app/api/shopify/widgets/analytics

# Error monitoring
curl https://your-app.railway.app/api/shopify/widgets/errors
```

---

## **🎯 SUCCESS CRITERIA**

Your Shopify widgets testing is successful when:

✅ **Widget Loading**: All widgets load in <2 seconds  
✅ **File Upload**: Prescription images upload and process correctly  
✅ **AI Processing**: OCR extracts data with >90% accuracy  
✅ **Recommendations**: Relevant lens suggestions provided  
✅ **Mobile Responsive**: Perfect functionality on all devices  
✅ **Cross-browser**: Works on Chrome, Firefox, Safari, Edge  
✅ **Performance**: Fast loading and smooth interactions  
✅ **Security**: Input validation and file security enforced  
✅ **Integration**: Seamless Shopify theme integration  
✅ **Error Handling**: Graceful failure with helpful messages  

---

## **🚀 DEPLOYMENT CHECKLIST**

### **Pre-deployment**
```bash
✅ All widget tests passing
✅ Performance benchmarks met
✅ Security validation complete
✅ Cross-browser compatibility verified
✅ Mobile responsiveness tested
✅ API integration confirmed
✅ Error handling validated
✅ Documentation updated
```

### **Production Deployment**
```bash
# 1. Upload widgets to production
./scripts/deploy-shopify-widgets.sh

# 2. Update production configuration
./scripts/update-widget-config.sh

# 3. Run production tests
./scripts/test-production-widgets.sh

# 4. Monitor deployment
curl https://your-app.railway.app/api/shopify/widgets/health
```

---

## **📞 SUPPORT**

- **Widget Documentation**: `./client/shopify-widgets/README.md`
- **API Documentation**: `./SHOPIFY_INTEGRATION_GUIDE.md`
- **Testing Scripts**: `./scripts/test-shopify-widgets.sh`
- **Installation Guide**: `./scripts/install-shopify-widgets.sh`
- **Support Dashboard**: `https://your-app.railway.app/admin/shopify-widgets`

---

**🛒 Your comprehensive Shopify widgets testing system is ready!**
