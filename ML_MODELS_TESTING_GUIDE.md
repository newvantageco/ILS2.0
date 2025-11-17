# 🤖 ILS 2.0 - ML Models Testing Guide

## **OVERVIEW**

Test and validate all machine learning models in the ILS 2.0 platform to ensure accurate predictions, recommendations, and insights with real-world data. This covers ophthalmic knowledge, predictive analytics, and business intelligence models.

---

## **🎯 ML MODELS ARCHITECTURE**

### **Multi-Model AI Ecosystem**
```
ILS 2.0 ML Platform
├── Knowledge Models
│   ├── Ophthalmic LLM (Fine-tuned Llama)
│   ├── Clinical Guidelines Engine
│   └── Product Knowledge Base
├── Predictive Models
│   ├── Sales Forecasting (Time Series)
│   ├── Inventory Prediction (Demand)
│   ├── Revenue Forecasting (Financial)
│   └── Market Trend Analysis
├── Analytics Models
│   ├── Patient Segmentation (Clustering)
│   ├── Customer Lifetime Value (Regression)
│   ├── Risk Stratification (Classification)
│   └── Churn Prediction (Classification)
└── Recommendation Models
    ├── Product Recommendations (Collaborative Filtering)
    ├── Lens Recommendations (Rule-Based + ML)
    └── Personalized Suggestions (Content-Based)
```

---

## **🚀 QUICK TESTING**

### **Prerequisites**
```bash
✅ AI service deployed with fine-tuned models
✅ Main application running with ML endpoints
✅ Database with sample data for testing
✅ Authentication tokens for API access
✅ OpenAI API key for GPT-4 integration
```

### **Basic Testing**
```bash
# Test AI service health
curl https://your-ai-service.hf.space/health

# Test ophthalmic knowledge
curl -X POST https://your-ai-service.hf.space/api/v1/ophthalmic-knowledge \
  -H "Content-Type: application/json" \
  -d '{"question": "What are progressive lenses?"}'

# Run comprehensive test suite
./scripts/test-ml-models.sh
```

---

## **🔧 ENVIRONMENT CONFIGURATION**

### **Required Environment Variables**
```bash
# AI Service Configuration
MODEL_PATH=~/.cache/llama-models/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4-vision-preview

# ML Model Settings
ML_MODELS_ENABLED=true
FORECASTING_CONFIDENCE=0.95
RECOMMENDATION_LIMIT=10
PREDICTION_HORIZON=90  # days

# Performance Settings
ML_CACHE_ENABLED=true
ML_CACHE_TTL=3600  # 1 hour
ML_BATCH_SIZE=32
ML_MAX_CONCURRENT=5

# Analytics Settings
PATIENT_SEGMENTATION_ENABLED=true
RISK_ASSESSMENT_ENABLED=true
CLV_PREDICTION_ENABLED=true
TREND_ANALYSIS_ENABLED=true
```

---

## **📋 MODEL TESTING SCENARIOS**

### **1. Ophthalmic Knowledge LLM**

#### **Test Categories**
```javascript
const knowledgeTests = [
  {
    category: "Basic Knowledge",
    questions: [
      "What is the difference between single vision and progressive lenses?",
      "What materials are used for high-index lenses?",
      "How do anti-reflective coatings work?"
    ],
    expectedAccuracy: 0.95
  },
  {
    category: "Clinical Recommendations",
    questions: [
      "What lens would you recommend for a -6.00 prescription?",
      "When should you recommend photochromic lenses?",
      "What are the indications for prism correction?"
    ],
    expectedAccuracy: 0.90
  },
  {
    category: "Technical Specifications",
    questions: [
      "What are the fitting guidelines for progressive lenses?",
      "How do you calculate decentration for high prescriptions?",
      "What are the ANSI standards for lens thickness?"
    ],
    expectedAccuracy: 0.85
  }
];
```

#### **Expected Responses**
```json
{
  "answer": "Progressive lenses are multifocal lenses that provide seamless vision correction for distance, intermediate, and near vision in a single lens without visible lines...",
  "confidence": 0.92,
  "sources": ["clinical_guidelines_2024", "lens_manufacturer_specs"],
  "related_topics": ["bifocal_lenses", "trifocal_lenses", "lens_fitting"],
  "processing_time": 1.2
}
```

### **2. Sales Forecasting Models**

#### **Test Scenarios**
```javascript
const forecastingTests = [
  {
    type: "short_term_forecast",
    period: "7d",
    product_category: "lenses",
    expected_mape: 0.10  // Mean Absolute Percentage Error
  },
  {
    type: "medium_term_forecast", 
    period: "30d",
    product_category: "frames",
    expected_mape: 0.15
  },
  {
    type: "long_term_forecast",
    period: "90d",
    product_category: "all",
    expected_mape: 0.20
  }
];
```

#### **Expected Output**
```json
{
  "forecast": {
    "period": "30d",
    "predicted_sales": 1250,
    "confidence_interval": {
      "lower": 1100,
      "upper": 1400
    },
    "accuracy": 0.87,
    "trend": "increasing",
    "seasonality_factor": 1.15
  },
  "model_performance": {
    "mape": 0.12,
    "rmse": 45.2,
    "training_data_points": 1095
  }
}
```

### **3. Inventory Prediction Models**

#### **Test Cases**
```javascript
const inventoryTests = [
  {
    scenario: "high_demand_product",
    product_id: "lens_progressive_premium",
    current_stock: 150,
    predicted_demand: 200,
    reorder_recommendation: true
  },
  {
    scenario: "seasonal_demand",
    product_id: "frame_sunglasses",
    current_stock: 300,
    predicted_demand: 450,
    seasonal_factor: 1.5
  },
  {
    scenario: "slow_moving",
    product_id: "lens_single_vision_basic",
    current_stock: 500,
    predicted_demand: 100,
    overstock_alert: true
  }
];
```

### **4. Patient Analytics Models**

#### **Segmentation Tests**
```javascript
const segmentationTests = [
  {
    algorithm: "kmeans",
    features: ["purchase_frequency", "avg_order_value", "prescription_complexity"],
    n_clusters: 5,
    expected_silhouette_score: 0.65
  },
  {
    algorithm: "hierarchical",
    features: ["visit_frequency", "compliance_score", "product_mix"],
    linkage_method: "ward",
    expected_clusters: 4
  }
];
```

#### **CLV Prediction Tests**
```javascript
const clvTests = [
  {
    patient_profile: {
      "age": 45,
      "prescription_stability": 0.8,
      "purchase_frequency": 1.2,  // per year
      "avg_order_value": 450,
      "years_as_patient": 3
    },
    predicted_clv: 5400,
    confidence: 0.82,
    time_horizon: "5y"
  }
];
```

### **5. Recommendation Systems**

#### **Product Recommendation Tests**
```javascript
const recommendationTests = [
  {
    input: {
      "prescription": {"sphere": -2.50, "cylinder": -0.75, "axis": 180},
      "budget": "medium",
      "lifestyle": "office_work",
      "previous_purchases": ["progressive_lenses", "anti_reflective"]
    },
    expected_recommendations: [
      {
        "product_id": "lens_progressive_digital",
        "score": 0.92,
        "reason": "matches prescription complexity and lifestyle"
      }
    ]
  }
];
```

---

## **📊 ACCURACY METRICS**

### **Model Performance Benchmarks**
```javascript
const performanceBenchmarks = {
  // Knowledge Models
  knowledge_accuracy: {
    min_threshold: 0.85,
    target: 0.92,
    measurement: "semantic_similarity"
  },
  
  // Forecasting Models
  forecasting_accuracy: {
    mape_threshold: 0.20,  // 20% max error
    target: 0.12,          // 12% target error
    confidence_threshold: 0.80
  },
  
  // Classification Models
  classification_accuracy: {
    min_threshold: 0.80,
    target: 0.88,
    metrics: ["precision", "recall", "f1_score"]
  },
  
  // Recommendation Models
  recommendation_quality: {
    precision_at_k: 0.75,
    recall_at_k: 0.65,
    diversity_score: 0.70
  },
  
  // Performance Metrics
  response_time: {
    knowledge_queries: 2.0,    // seconds
    predictions: 1.5,          // seconds
    recommendations: 1.0       // seconds
  }
};
```

### **Validation Procedures**
```bash
# Cross-validation for forecasting models
curl -X POST https://your-app.railway.app/api/analytics/models/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "model": "sales_forecast",
    "validation_method": "time_series_cross_validation",
    "folds": 5
  }'

# Backtesting for predictive models
curl -X POST https://your-app.railway.app/api/analytics/models/backtest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "model": "inventory_prediction",
    "test_period": "30d",
    "metrics": ["mape", "rmse", "mae"]
  }'
```

---

## **🔍 TESTING PROCEDURES**

### **Step 1: Health Check**
```bash
# Verify all models are loaded
curl https://your-ai-service.hf.space/api/v1/models/status

# Check model performance metrics
curl https://your-app.railway.app/api/analytics/models/health

# Validate data connections
curl https://your-app.railway.app/api/analytics/data/quality
```

### **Step 2: Knowledge Model Testing**
```bash
# Test basic knowledge
curl -X POST https://your-ai-service.hf.space/api/v1/ophthalmic-knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the benefits of high-index lenses?",
    "context": "patient_education"
  }'

# Test clinical reasoning
curl -X POST https://your-ai-service.hf.space/api/v1/ophthalmic-knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "question": "When would you recommend polycarbonate lenses for children?",
    "context": "clinical_recommendation"
  }'
```

### **Step 3: Predictive Model Testing**
```bash
# Test sales forecasting
curl -X POST https://your-app.railway.app/api/analytics/forecast/sales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "period": "30d",
    "product_category": "progressive_lenses",
    "confidence": 0.95
  }'

# Test inventory prediction
curl -X POST https://your-app.railway.app/api/analytics/forecast/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "product_ids": ["12345", "67890"],
    "period": "60d",
    "include_seasonality": true
  }'
```

### **Step 4: Analytics Model Testing**
```bash
# Test patient segmentation
curl -X POST https://your-app.railway.app/api/analytics/patients/segment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "features": ["purchase_history", "prescription_complexity"],
    "n_clusters": 5
  }'

# Test CLV prediction
curl -X POST https://your-app.railway.app/api/analytics/patients/clv/predict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "patient_id": "12345",
    "time_horizon": "365d"
  }'
```

---

## **🚨 ERROR HANDLING TESTS**

### **Common Error Scenarios**

#### **Input Validation Errors**
```bash
# Test with invalid prescription data
curl -X POST https://your-app.railway.app/api/recommendations/lenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "prescription": {
      "sphere": "invalid_value",
      "cylinder": -10.00  # Out of range
    }
  }'

# Expected: 400 Bad Request with validation errors
```

#### **Model Unavailable Errors**
```bash
# Test when model is not loaded
curl -X POST https://your-ai-service.hf.space/api/v1/ophthalmic-knowledge \
  -H "Content-Type: application/json" \
  -d '{"question": "test"}'

# Expected: 503 Service Unavailable
```

#### **Data Quality Issues**
```bash
# Test with insufficient training data
curl -X POST https://your-app.railway.app/api/analytics/forecast/sales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "period": "365d",
    "product_category": "new_category_with_no_data"
  }'

# Expected: Warning about insufficient data
```

---

## **📈 PERFORMANCE TESTING**

### **Load Testing Scenarios**
```bash
# Concurrent knowledge queries
for i in {1..20}; do
  curl -X POST https://your-ai-service.hf.space/api/v1/ophthalmic-knowledge \
    -H "Content-Type: application/json" \
    -d '{"question": "What are anti-reflective coatings?"}' &
done
wait

# Batch predictions
curl -X POST https://your-app.railway.app/api/analytics/batch/forecast \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "requests": [
      {"type": "sales", "period": "7d"},
      {"type": "inventory", "product_id": "12345"},
      {"type": "revenue", "period": "30d"}
    ]
  }'
```

### **Stress Testing**
```bash
# High volume recommendation requests
for i in {1..100}; do
  curl -X POST https://your-app.railway.app/api/recommendations/products \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer JWT_TOKEN" \
    -d '{"patient_id": "12345", "limit": 5}' &
done
wait

# Monitor performance
curl https://your-app.railway.app/api/analytics/models/performance
```

---

## **📊 MONITORING DASHBOARD**

### **Real-time Metrics**
```bash
# Model performance metrics
curl https://your-app.railway.app/api/analytics/models/metrics

# Prediction accuracy tracking
curl https://your-app.railway.app/api/analytics/models/accuracy

# Usage statistics
curl https://your-app.railway.app/api/analytics/models/usage

# Error rates and alerts
curl https://your-app.railway.app/api/analytics/models/errors
```

### **Alert Thresholds**
```javascript
const alertThresholds = {
  accuracyDrop: 0.80,        // Alert if accuracy drops below 80%
  responseTime: 5000,        // Alert if response >5 seconds
  errorRate: 0.05,           // Alert if error rate >5%
  queueDepth: 50,            # Alert if >50 requests queued
  modelDrift: 0.15           // Alert if model drift >15%
};
```

---

## **🎯 SUCCESS CRITERIA**

Your ML models testing is successful when:

✅ **Knowledge Models**: >90% accuracy for clinical responses  
✅ **Forecasting Models**: <15% MAPE for sales predictions  
✅ **Inventory Models**: >85% accuracy for demand forecasting  
✅ **Patient Analytics**: Meaningful segments with >0.6 silhouette score  
✅ **Recommendations**: >75% precision for product suggestions  
✅ **Risk Models**: >80% accuracy for risk stratification  
✅ **Performance**: <2 second response times for all models  
✅ **Scalability**: Handle 50+ concurrent requests without degradation  

---

## **🚀 NEXT STEPS**

1. **Configure Environment**: Set ML model variables and thresholds
2. **Load Test Data**: Prepare sample data for model validation
3. **Run Basic Tests**: Verify all models respond correctly
4. **Validate Accuracy**: Test against known outcomes
5. **Performance Testing**: Test load and stress scenarios
6. **Monitor Production**: Track model performance in real-time
7. **Retrain Models**: Update models with new data periodically

---

## **📞 SUPPORT**

- **AI Service Docs**: `./ai-service/README.md`
- **Model Training**: `./ai-service/training/`
- **Analytics Service**: `./server/services/analytics/`
- **Testing Scripts**: `./scripts/test-ml-models.sh`
- **ML Dashboard**: `https://your-app.railway.app/admin/ml-models`

---

**🤖 Your comprehensive ML models testing system is ready!**
