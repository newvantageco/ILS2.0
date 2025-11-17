# 👁️ ILS 2.0 - AI OCR Prescription Testing Guide

## **OVERVIEW**

Test and validate GPT-4 Vision OCR functionality for accurate prescription data extraction from uploaded images. This ensures automated prescription processing while maintaining clinical accuracy and HIPAA compliance.

---

## **🎯 OCR PROCESSING ARCHITECTURE**

### **Multi-Stage Processing Pipeline**
```
Prescription Image Upload
├── Image Validation
│   ├── File format check
│   ├── Size limits
│   └── Quality assessment
├── OCR Processing
│   ├── Text extraction (GPT-4 Vision)
│   ├── Layout analysis
│   └── Confidence scoring
├── Data Parsing
│   ├── Prescription field identification
│   ├── Numerical value extraction
│   ├── Medical terminology parsing
│   └── Structured data generation
├── Clinical Validation
│   ├── Prescription completeness check
│   ├── Value range validation
│   ├── Cross-reference verification
│   └── ECP review requirement
└── Integration
    ├── Database storage
    ├── ECP notification
    └── Order processing trigger
```

---

## **🚀 QUICK TESTING**

### **Prerequisites**
```bash
✅ AI Service deployed (Hugging Face Spaces)
✅ OpenAI API key configured
✅ Main application running
✅ S3 storage configured
✅ Test prescription images available
```

### **Basic Testing**
```bash
# Test AI service health
curl https://your-ai-service.hf.space/health

# Test OCR endpoint
curl -X POST https://your-ai-service.hf.space/api/v1/ocr/prescription \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://example.com/prescription.jpg"}'

# Run comprehensive test suite
./scripts/test-ai-ocr.sh
```

---

## **🔧 ENVIRONMENT CONFIGURATION**

### **Required Environment Variables**
```bash
# OpenAI Configuration (AI Service)
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4-vision-preview
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.1

# OCR Processing Settings
OCR_CONFIDENCE_THRESHOLD=0.85
OCR_MAX_FILE_SIZE=10485760  # 10MB
OCR_SUPPORTED_FORMATS=jpg,jpeg,png,pdf,tiff
OCR_TIMEOUT=30000  # 30 seconds

# Validation Settings
VALIDATION_ENABLED=true
VALIDATION_STRICT_MODE=false
VALIDATION_REQUIRE_ECP_REVIEW=true

# Performance Settings
OCR_CACHE_ENABLED=true
OCR_CACHE_TTL=3600  # 1 hour
OCR_CONCURRENT_LIMIT=5
```

---

## **📋 PRESCRIPTION IMAGE REQUIREMENTS**

### **Image Specifications**
```bash
# Supported Formats
• JPEG (.jpg, .jpeg) - Recommended
• PNG (.png) - High quality
• PDF (.pdf) - Multi-page documents
• TIFF (.tiff) - High resolution scans

# Resolution Requirements
• Minimum: 300 DPI
• Recommended: 600 DPI
• Maximum: 1200 DPI

# File Size Limits
• Minimum: 10KB
• Maximum: 10MB
• Recommended: 1-5MB

# Image Quality
• Clear, well-lit images
• No glare or shadows
• Text clearly visible
• Complete prescription visible
```

### **Prescription Content Requirements**
```bash
# Required Fields
• Patient name and/or ID
• Prescription date
• Doctor signature/license
• Right eye (OD) measurements
• Left eye (OS) measurements

# Optional but Recommended
• Pupillary distance (PD)
• Add power (for bifocal/progressive)
• Prism correction
• Notes/remarks
• Expiration date

# Measurement Format
• Sphere: -20.00 to +20.00
• Cylinder: -6.00 to 0
• Axis: 0 to 180
• Add: +0.75 to +3.50
• PD: 50mm to 80mm
```

---

## **🧪 OCR TESTING SCENARIOS**

### **Test Case Categories**

#### **1. Clear Printed Prescriptions**
```javascript
// Expected accuracy: >98%
const testCases = [
  {
    type: "laser_printed",
    quality: "excellent",
    expectedAccuracy: 0.98,
    description: "Standard printed prescription form"
  },
  {
    type: "typewritten",
    quality: "excellent", 
    expectedAccuracy: 0.97,
    description: "Typewritten prescription details"
  }
];
```

#### **2. Handwritten Prescriptions**
```javascript
// Expected accuracy: >90%
const testCases = [
  {
    type: "neat_handwriting",
    quality: "good",
    expectedAccuracy: 0.92,
    description: "Clear, legible doctor handwriting"
  },
  {
    type: "messy_handwriting",
    quality: "fair",
    expectedAccuracy: 0.85,
    description: "Challenging handwriting requiring ECP review"
  }
];
```

#### **3. Digital Prescriptions**
```javascript
// Expected accuracy: >99%
const testCases = [
  {
    type: "electronic_prescription",
    quality: "perfect",
    expectedAccuracy: 0.99,
    description: "Digital/EHR generated prescription"
  },
  {
    type: "fax_received",
    quality: "good",
    expectedAccuracy: 0.95,
    description: "Fax transmission with some degradation"
  }
];
```

---

## **📊 ACCURACY METRICS**

### **Performance Indicators**
```javascript
interface OCRMetrics {
  // Text Extraction
  textExtractionAccuracy: number;    // >95% target
  characterRecognitionRate: number;  // >98% target
  
  // Prescription Parsing
  fieldDetectionAccuracy: number;    // >90% target
  numericalAccuracy: number;         // >95% target
  medicalTerminologyAccuracy: number; // >92% target
  
  // Confidence Scoring
  confidenceReliability: number;     // >85% target
  falsePositiveRate: number;         // <5% target
  falseNegativeRate: number;         // <3% target
  
  // Processing Performance
  processingSpeed: number;           // <5 seconds target
  throughputPerMinute: number;       // >12 prescriptions target
  errorRecoveryTime: number;         // <2 seconds target
}
```

### **Validation Rules**
```javascript
const validationRules = {
  sphere: { min: -20.00, max: 20.00, precision: 0.25 },
  cylinder: { min: -6.00, max: 0, precision: 0.25 },
  axis: { min: 0, max: 180, integer: true },
  add: { min: 0.75, max: 3.50, precision: 0.25 },
  pd: { min: 50, max: 80, integer: true }
};
```

---

## **🔍 TESTING PROCEDURES**

### **Step 1: Health Check**
```bash
# Verify AI service is running
curl https://your-ai-service.hf.space/health

# Check OpenAI API connectivity
curl -X POST https://your-ai-service.hf.space/api/v1/test/openai \
  -H "Content-Type: application/json" \
  -d '{"message": "test connection"}'

# Verify main app integration
curl https://your-app.railway.app/api/ai/ocr/status
```

### **Step 2: Basic OCR Test**
```bash
# Test with sample prescription image
curl -X POST https://your-ai-service.hf.space/api/v1/ocr/prescription \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/sample-prescription.jpg",
    "extract_text": true,
    "parse_prescription": true,
    "validate_data": true,
    "include_confidence": true
  }'
```

### **Step 3: Integration Test**
```bash
# Upload prescription through main app
curl -X POST https://your-app.railway.app/api/prescriptions/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@./test-prescription.jpg" \
  -F "patientId=12345" \
  -F "processWithAI=true" \
  -F "validateData=true"
```

### **Step 4: Batch Processing Test**
```bash
# Test multiple prescriptions
curl -X POST https://your-ai-service.hf.space/api/v1/ocr/batch \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      "https://example.com/prescription1.jpg",
      "https://example.com/prescription2.jpg",
      "https://example.com/prescription3.jpg"
    ],
    "parse_prescription": true,
    "validate_data": true
  }'
```

---

## **🚨 ERROR HANDLING TESTS**

### **Common Error Scenarios**

#### **Image Quality Issues**
```bash
# Test with low resolution image
curl -X POST https://your-ai-service.hf.space/api/v1/ocr/prescription \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://example.com/low-resolution.jpg"}'

# Expected response: Low confidence score, recommend rescan
```

#### **Invalid Prescription Format**
```bash
# Test with non-prescription image
curl -X POST https://your-ai-service.hf.space/api/v1/ocr/prescription \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://example.com/not-prescription.jpg"}'

# Expected response: No prescription data detected
```

#### **Corrupted or Missing Data**
```bash
# Test with incomplete prescription
curl -X POST https://your-ai-service.hf.space/api/v1/ocr/prescription \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://example.com/incomplete.jpg"}'

# Expected response: Partial data with missing field warnings
```

---

## **📈 PERFORMANCE TESTING**

### **Load Testing**
```bash
# Concurrent processing test
for i in {1..10}; do
  curl -X POST https://your-ai-service.hf.space/api/v1/ocr/prescription \
    -H "Content-Type: application/json" \
    -d '{"image_url": "https://example.com/test.jpg"}' &
done
wait

# Measure response times
time curl -X POST https://your-ai-service.hf.space/api/v1/ocr/prescription \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://example.com/performance-test.jpg"}'
```

### **Stress Testing**
```bash
# High volume test (100 prescriptions)
for i in {1..100}; do
  curl -X POST https://your-ai-service.hf.space/api/v1/ocr/prescription \
    -H "Content-Type: application/json" \
    -d "{\"image_url\": \"https://example.com/test${i}.jpg\"}" &
done
wait

# Monitor resource usage
curl https://your-ai-service.hf.space/metrics
```

---

## **🔒 COMPLIANCE & SECURITY**

### **HIPAA Compliance**
```bash
# Data Encryption
• All images encrypted at rest (S3)
• All API calls encrypted in transit (HTTPS)
• Prescription data encrypted in database

# Access Control
• Authenticated API access only
• Role-based prescription access
• Audit logging for all access

# Data Retention
• Automatic cleanup of temporary files
• Configurable retention periods
• Secure data deletion
```

### **Security Testing**
```bash
# Test authentication
curl -X POST https://your-app.railway.app/api/prescriptions/upload \
  -F "file=@test.jpg"  # Should fail without auth

# Test file size limits
curl -X POST https://your-ai-service.hf.space/api/v1/ocr/prescription \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://example.com/huge-file.jpg"}'

# Test malicious files
curl -X POST https://your-ai-service.hf.space/api/v1/ocr/prescription \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://example.com/malicious.exe"}'
```

---

## **📊 MONITORING DASHBOARD**

### **Key Metrics**
```bash
# OCR Performance Metrics
curl https://your-app.railway.app/admin/ai-analytics

# Processing Statistics
curl https://your-ai-service.hf.space/api/v1/ocr/stats

# Error Analysis
curl https://your-ai-service.hf.space/api/v1/ocr/errors

# Cost Tracking
curl https://your-app.railway.app/api/ai/cost-usage
```

### **Alert Thresholds**
```javascript
const alertThresholds = {
  accuracyDrop: 0.85,        // Alert if accuracy drops below 85%
  processingTime: 10000,    // Alert if processing >10 seconds
  errorRate: 0.10,          // Alert if error rate >10%
  costSpike: 50.0,          // Alert if daily cost >$50
  queueDepth: 100           // Alert if >100 prescriptions queued
};
```

---

## **🎯 SUCCESS CRITERIA**

Your AI OCR testing is successful when:

✅ **Text Extraction Accuracy**: >95% for clear images  
✅ **Prescription Parsing**: >90% field detection accuracy  
✅ **Confidence Scoring**: Reliable threshold detection  
✅ **Processing Speed**: <5 seconds per prescription  
✅ **Error Handling**: Graceful failure for invalid inputs  
✅ **Integration**: Seamless workflow with main application  
✅ **Compliance**: HIPAA requirements met  
✅ **Performance**: Handles concurrent load effectively  

---

## **🚀 NEXT STEPS**

1. **Configure Environment**: Set OpenAI API key and OCR settings
2. **Prepare Test Images**: Collect various prescription samples
3. **Run Basic Tests**: Verify OCR endpoint functionality
4. **Validate Accuracy**: Test with real prescription images
5. **Performance Testing**: Test load and stress scenarios
6. **Integration Testing**: Test end-to-end workflow
7. **Monitor & Optimize**: Track metrics and adjust thresholds

---

## **📞 SUPPORT**

- **OpenAI API Docs**: [platform.openai.com/docs](https://platform.openai.com/docs)
- **GPT-4 Vision Guide**: [platform.openai.com/docs/guides/vision](https://platform.openai.com/docs/guides/vision)
- **AI Service Repo**: `./ai-service/`
- **Main App Integration**: `./server/routes/ai.ts`
- **Testing Scripts**: `./scripts/test-ai-ocr.sh`

---

**👁️ Your AI OCR prescription processing system is ready for comprehensive testing!**
