# ILS 2.0 - AI Services Complete Guide

Complete guide to the AI and ML capabilities in ILS 2.0, their configuration, deployment, and usage.

## 📋 Table of Contents

1. [AI Architecture Overview](#ai-architecture-overview)
2. [AI Services Inventory](#ai-services-inventory)
3. [Service Descriptions](#service-descriptions)
4. [Environment Variables](#environment-variables)
5. [Railway Deployment](#railway-deployment)
6. [Testing & Verification](#testing--verification)
7. [AI Features](#ai-features)
8. [Usage Examples](#usage-examples)
9. [Troubleshooting](#troubleshooting)

---

## 🏗️ AI Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     ILS 2.0 AI ECOSYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Node.js AI Services (Server)                │  │
│  │                                                            │  │
│  │  ┌─────────────────┐  ┌──────────────────────────────┐  │  │
│  │  │ MasterAIService │  │ AI Assistant Service         │  │  │
│  │  │ (Orchestrator)  │  │ (Progressive Learning)       │  │  │
│  │  └────────┬────────┘  └──────────────────────────────┘  │  │
│  │           │                                               │  │
│  │           │                                               │  │
│  │  ┌────────┴────────────────────────────────────────────┐ │  │
│  │  │                                                       │ │  │
│  │  │  External AI Service                                 │ │  │
│  │  │  ├─ OpenAI (GPT-4, GPT-3.5-turbo, Vision)           │ │  │
│  │  │  ├─ Anthropic (Claude 3 Opus, Sonnet, Haiku)        │ │  │
│  │  │  └─ Ollama (Local Llama 3.1)                        │ │  │
│  │  │                                                       │ │  │
│  │  └───────────────────────────────────────────────────────┘ │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ Ophthalmic AI Service                                │  │  │
│  │  │ (Domain-specific knowledge)                          │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ AI/ML Specialized Services                           │  │  │
│  │  │ ├─ Clinical Decision Support                         │  │  │
│  │  │ ├─ NLP & Image Analysis                              │  │  │
│  │  │ ├─ Predictive Analytics                              │  │  │
│  │  │ ├─ ML Model Management                               │  │  │
│  │  │ └─ Forecasting AI                                    │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Python AI Services (FastAPI)                │  │
│  │                                                            │  │
│  │  ┌──────────────────────┐  ┌─────────────────────────┐  │  │
│  │  │  AI Service          │  │ Analytics Service        │  │  │
│  │  │  (Port 8080)         │  │ (Port 8000)              │  │  │
│  │  │                      │  │                          │  │  │
│  │  │  ├─ Multi-tenant RAG │  │  ├─ Order Analytics     │  │  │
│  │  │  ├─ OCR (Vision)     │  │  ├─ ML Predictions      │  │  │
│  │  │  ├─ ML Models        │  │  ├─ QC Analysis         │  │  │
│  │  │  └─ Knowledge Base   │  │  └─ Batch Reports       │  │  │
│  │  └──────────────────────┘  └─────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌──────────────────────┐                                 │  │
│  │  │  RAG Service         │                                 │  │
│  │  │  (Port 8001)         │                                 │  │
│  │  │                      │                                 │  │
│  │  │  ├─ Vector Search    │                                 │  │
│  │  │  ├─ Embeddings       │                                 │  │
│  │  │  └─ Semantic Search  │                                 │  │
│  │  └──────────────────────┘                                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  External AI APIs                         │  │
│  │  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐  │  │
│  │  │  OpenAI    │  │  Anthropic  │  │  Qdrant (Vector) │  │  │
│  │  │  GPT-4     │  │  Claude 3   │  │  Database        │  │  │
│  │  └────────────┘  └─────────────┘  └──────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 AI Services Inventory

### Node.js AI Services (Backend)

| Service | File | Purpose |
|---------|------|---------|
| **MasterAIService** | `server/services/MasterAIService.ts` | Main orchestrator - routes queries, manages context |
| **AIAssistantService** | `server/services/AIAssistantService.ts` | Progressive learning AI assistant |
| **ExternalAIService** | `server/services/ExternalAIService.ts` | Integration with OpenAI, Anthropic, Ollama |
| **OphthalamicAIService** | `server/services/OphthalamicAIService.ts` | Domain-specific ophthalmic knowledge |
| **AIDataAccess** | `server/services/AIDataAccess.ts` | Database query tools for AI |
| **AI Service** | `server/services/aiService.ts` | Legacy AI service wrapper |
| **Clinical Decision Support** | `server/services/ai-ml/ClinicalDecisionSupportService.ts` | Clinical recommendations |
| **NLP & Image Analysis** | `server/services/ai-ml/NLPImageAnalysisService.ts` | Text and image processing |
| **Predictive Analytics** | `server/services/ai-ml/PredictiveAnalyticsService.ts` | Forecasting and predictions |
| **ML Model Management** | `server/services/ai-ml/MLModelManagementService.ts` | Model lifecycle management |
| **Forecasting AI** | `server/services/ai/ForecastingAI.ts` | Demand forecasting |

### Python AI Services (FastAPI)

| Service | Port | Directory | Purpose |
|---------|------|-----------|---------|
| **AI Service** | 8080 | `ai-service/` | Multi-tenant RAG, OCR, ML models |
| **Analytics Service** | 8000 | `python-service/` | Analytics, ML predictions, QC |
| **RAG Service** | 8001 | `python-rag-service/` | Vector similarity search |

---

## 🔍 Service Descriptions

### 1. MasterAIService (Node.js)

**Location:** `server/services/MasterAIService.ts`

**Purpose:**
Unified tenant intelligence orchestrator that consolidates all AI capabilities.

**Key Features:**
- Chat interface with natural language processing
- Topic validation (optometry/eyecare ONLY)
- Intelligent query routing (knowledge vs data vs hybrid)
- Database tool execution (patients, orders, inventory)
- Progressive learning from interactions
- Document upload and knowledge extraction
- Multi-tenant isolation

**Environment Variables:**
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...
```

**Usage:**
```typescript
const masterAI = new MasterAIService(storage);
const response = await masterAI.chat({
  message: "What are my top-selling frames this month?",
  companyId: "company-123",
  userId: "user-456"
});
```

---

### 2. ExternalAIService (Node.js)

**Location:** `server/services/ExternalAIService.ts`

**Purpose:**
Integration layer for external AI providers with automatic fallback.

**Supported Providers:**
- **OpenAI**: GPT-4, GPT-4-turbo, GPT-3.5-turbo, GPT-4-Vision
- **Anthropic**: Claude 3 Opus, Sonnet, Haiku
- **Ollama**: Local Llama 3.1 (self-hosted)

**Environment Variables:**
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview

ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-opus-20240229

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:latest
USE_LOCAL_AI=false
```

**Features:**
- Automatic provider selection
- Fallback if primary provider fails
- Token usage tracking
- Cost estimation
- Tool/function calling support

---

### 3. AI Service (Python - Port 8080)

**Location:** `ai-service/`

**Purpose:**
Multi-tenant AI service with RAG, OCR, and ML capabilities.

**Capabilities:**

#### a) RAG (Retrieval-Augmented Generation)
- Tenant-isolated knowledge base
- Sales, inventory, and patient data queries
- Ophthalmic knowledge base

#### b) OCR (Optical Character Recognition)
- Prescription image analysis using GPT-4 Vision
- Batch OCR processing
- Structured prescription data extraction

#### c) ML Models
- Custom ophthalmic models
- Fine-tuned LLMs
- Model health monitoring

**Environment Variables:**
```env
PORT=8080
DATABASE_URL=postgresql://...
JWT_SECRET_KEY=<secret>
OPENAI_API_KEY=sk-...
MODEL_PATH=~/.cache/llama-models/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf

# Tenant-specific
TENANT_{tenant_id}_SALES_DB=postgresql://...
TENANT_{tenant_id}_INVENTORY_DB=postgresql://...
TENANT_{tenant_id}_PATIENT_DB=postgresql://...
TENANT_{tenant_id}_RATE_LIMIT=60
TENANT_{tenant_id}_SUBSCRIPTION_TIER=professional
```

**Endpoints:**
```
GET  /health
GET  /api/v1/models/health
POST /api/v1/rag/query
POST /api/v1/ocr/analyze
POST /api/v1/ocr/batch
POST /api/v1/models/test
POST /api/v1/models/batch-test
```

---

### 4. Analytics Service (Python - Port 8000)

**Location:** `python-service/`

**Purpose:**
Real-time analytics, ML predictions, and data science.

**Capabilities:**
- Order trend analysis
- Production time prediction
- Quality control analysis
- Batch reporting
- Statistical analysis

**Environment Variables:**
```env
PORT=8000
DATABASE_URL=postgresql://...
BACKEND_URL=http://localhost:5000
```

**Endpoints:**
```
GET  /health
GET  /api/v1/analytics/order-trends
POST /api/v1/ml/predict-production-time
POST /api/v1/qc/analyze
POST /api/v1/analytics/batch-report
```

---

### 5. RAG Service (Python - Port 8001)

**Location:** `python-rag-service/`

**Purpose:**
Vector similarity search and semantic embeddings.

**Capabilities:**
- Text embedding generation
- Vector similarity search
- Semantic document search
- Knowledge base queries

**Environment Variables:**
```env
PORT=8001
DATABASE_URL=postgresql://...
BACKEND_URL=http://localhost:5000
EMBEDDING_MODEL=all-MiniLM-L6-v2
EMBEDDING_DIMENSIONS=384
OPENAI_API_KEY=sk-...  # optional
LOG_LEVEL=INFO
```

**Endpoints:**
```
GET  /health
POST /api/embed
POST /api/search
POST /api/query
```

---

### 6. Clinical Decision Support (Node.js)

**Location:** `server/services/ai-ml/ClinicalDecisionSupportService.ts`

**Purpose:**
AI-powered clinical recommendations for eye care professionals.

**Features:**
- Prescription analysis and validation
- Clinical recommendations
- Risk assessment
- Treatment suggestions
- Anomaly detection

---

### 7. NLP & Image Analysis (Node.js)

**Location:** `server/services/ai-ml/NLPImageAnalysisService.ts`

**Purpose:**
Natural language processing and computer vision.

**Features:**
- Document text extraction
- Entity recognition
- Sentiment analysis
- Image classification
- OCR for prescriptions

---

### 8. Predictive Analytics (Node.js)

**Location:** `server/services/ai-ml/PredictiveAnalyticsService.ts`

**Purpose:**
ML-based forecasting and predictions.

**Features:**
- Demand forecasting
- Production time prediction
- Quality prediction
- Anomaly detection
- Trend analysis

---

## 🔐 Environment Variables

### Required for AI Features

```env
# ================================
# EXTERNAL AI PROVIDERS
# ================================

# OpenAI (Recommended)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_VISION_MODEL=gpt-4-vision-preview
OPENAI_MAX_TOKENS=4000
OPENAI_TEMPERATURE=0.7

# Anthropic Claude (Optional)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-opus-20240229
ANTHROPIC_MAX_TOKENS=4000

# ================================
# LOCAL AI (OPTIONAL)
# ================================

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:latest
USE_LOCAL_AI=false

# Local Model Path
MODEL_PATH=~/.cache/llama-models/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf

# ================================
# INTERNAL AI SERVICES
# ================================

# Python AI Service (RAG, OCR, ML)
AI_SERVICE_URL=http://localhost:8080
# Or Railway: http://ils-ai-service.railway.internal:8080

# Python Analytics Service
PYTHON_SERVICE_URL=http://localhost:8000
ANALYTICS_SERVICE_URL=http://localhost:8000
# Or Railway: http://ils-analytics-service.railway.internal:8000

# Python RAG Service
RAG_SERVICE_URL=http://localhost:8001
# Or Railway: http://ils-rag-service.railway.internal:8001

# ================================
# AI FEATURE FLAGS
# ================================

ENABLE_AI_FEATURES=true
ENABLE_AI_PRESCRIPTIONS=true
ENABLE_AI_CLINICAL_SUPPORT=true
ENABLE_AI_ASSISTANT=true
ENABLE_AI_ANALYTICS=true

# ================================
# JWT FOR AI SERVICE AUTH
# ================================

JWT_SECRET=<same-as-main-app>
JWT_EXPIRES_IN=7d

# ================================
# VECTOR DATABASE (OPTIONAL)
# ================================

QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=<your-key>
```

---

## 🚀 Railway Deployment

### Step 1: Deploy All Services

```bash
# Deploy all AI services at once
npm run railway:deploy:all
```

This deploys:
1. Main application (with Node.js AI services)
2. AI Service (Python - port 8080)
3. Analytics Service (Python - port 8000)
4. RAG Service (Python - port 8001)

### Step 2: Set Environment Variables

In Railway dashboard for **Main Application**:

```env
# External AI
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Internal service URLs (Railway internal networking)
AI_SERVICE_URL=http://ils-ai-service.railway.internal:8080
ANALYTICS_SERVICE_URL=http://ils-analytics-service.railway.internal:8000
RAG_SERVICE_URL=http://ils-rag-service.railway.internal:8001

# Feature flags
ENABLE_AI_FEATURES=true
ENABLE_AI_PRESCRIPTIONS=true
ENABLE_AI_CLINICAL_SUPPORT=true
```

In Railway dashboard for **AI Service** (port 8080):

```env
PORT=8080
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET_KEY=<same-as-main-app>
OPENAI_API_KEY=sk-...
```

In Railway dashboard for **Analytics Service** (port 8000):

```env
PORT=8000
DATABASE_URL=${{Postgres.DATABASE_URL}}
BACKEND_URL=http://ils-main-app.railway.internal:5000
```

In Railway dashboard for **RAG Service** (port 8001):

```env
PORT=8001
DATABASE_URL=${{Postgres.DATABASE_URL}}
BACKEND_URL=http://ils-main-app.railway.internal:5000
```

---

## ✅ Testing & Verification

### 1. Test Health Endpoints

```bash
# Main app
curl https://your-app.railway.app/api/health

# AI Service
railway run curl http://ils-ai-service.railway.internal:8080/api/v1/models/health

# Analytics Service
railway run curl http://ils-analytics-service.railway.internal:8000/health

# RAG Service
railway run curl http://ils-rag-service.railway.internal:8001/health
```

### 2. Test AI Features

#### Test MasterAI Chat

```bash
curl -X POST https://your-app.railway.app/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "message": "What are the top 5 lens types ordered this month?",
    "conversationId": null
  }'
```

#### Test OCR (Prescription Analysis)

```bash
curl -X POST http://localhost:8080/api/v1/ocr/analyze \
  -H "Authorization: Bearer <jwt-token>" \
  -F "file=@prescription.jpg" \
  -F "tenant_id=company-123"
```

#### Test Analytics

```bash
curl http://localhost:8000/api/v1/analytics/order-trends?days=30
```

#### Test RAG Search

```bash
curl -X POST http://localhost:8001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "progressive lenses",
    "limit": 5
  }'
```

### 3. Verify AI Providers

Check logs to ensure AI providers are initialized:

```bash
railway logs --service ils-main-app | grep "AI"
```

Look for:
```
OpenAI client initialized
Anthropic client initialized
Available AI providers: openai, anthropic
Master AI initialized with providers: openai, anthropic
```

---

## 🎯 AI Features

### 1. AI Chat Assistant

**Route:** `/api/ai/chat`

**Features:**
- Natural language queries about business data
- Ophthalmic knowledge queries
- Progressive learning (reduces reliance on external AI over time)
- Context-aware responses
- Multi-turn conversations

### 2. Prescription OCR

**Route:** `/api/ai/prescriptions/analyze`

**Features:**
- Extract prescription data from images
- Validate prescription values
- Support for multiple prescription formats
- Batch processing

### 3. Clinical Decision Support

**Features:**
- Real-time clinical recommendations
- Prescription validation
- Risk assessment
- Treatment suggestions

### 4. Predictive Analytics

**Features:**
- Production time prediction
- Demand forecasting
- Quality prediction
- Anomaly detection

### 5. Intelligent Search

**Features:**
- Semantic search across documents
- Vector similarity search
- Multi-modal search (text + images)

---

## 💡 Usage Examples

### Example 1: Query Business Data with AI

```typescript
import { MasterAIService } from './server/services/MasterAIService';

const masterAI = new MasterAIService(storage);

const response = await masterAI.chat({
  message: "Show me the top 5 customers by revenue this quarter",
  companyId: "company-123",
  userId: "user-456"
});

console.log(response.answer);
// "Based on your sales data, here are your top 5 customers..."
```

### Example 2: Analyze Prescription Image

```typescript
// Upload prescription image
const formData = new FormData();
formData.append('file', prescriptionImage);

const response = await fetch(`${AI_SERVICE_URL}/api/v1/ocr/analyze`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  },
  body: formData
});

const prescription = await response.json();
/*
{
  sphere: -2.50,
  cylinder: -0.75,
  axis: 180,
  add: +2.00,
  pd: 64
}
*/
```

### Example 3: Get Production Time Prediction

```typescript
const response = await fetch(`${ANALYTICS_SERVICE_URL}/api/v1/ml/predict-production-time`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    lens_type: 'progressive',
    lens_material: 'polycarbonate',
    coating: 'anti-reflective',
    complexity_score: 3
  })
});

const prediction = await response.json();
// { estimated_hours: 24, confidence: 0.92 }
```

---

## 🔧 Troubleshooting

### Issue: AI Service Returns 503

**Cause:** AI service not accessible or not deployed.

**Solution:**
```bash
# Check if AI service is running
railway logs --service ils-ai-service

# Verify environment variable
railway variables | grep AI_SERVICE_URL

# Should be: http://ils-ai-service.railway.internal:8080
```

### Issue: "No AI providers available"

**Cause:** API keys not set or invalid.

**Solution:**
```bash
# Verify API keys are set
railway variables | grep OPENAI_API_KEY
railway variables | grep ANTHROPIC_API_KEY

# Keys should start with:
# OpenAI: sk-...
# Anthropic: sk-ant-...
```

### Issue: OCR Fails

**Cause:** OpenAI API key not set for AI service.

**Solution:**
Set `OPENAI_API_KEY` in the AI service (port 8080) variables in Railway dashboard.

### Issue: High AI Costs

**Solution:**
1. Enable progressive learning to reduce external API usage
2. Use Anthropic Claude Haiku for cheaper queries
3. Configure Ollama for local LLM (free)
4. Set up caching for repeated queries

### Issue: Slow AI Responses

**Cause:** External API latency or complex queries.

**Solutions:**
1. Use streaming responses where possible
2. Implement request queuing with BullMQ
3. Cache common queries
4. Use faster models (GPT-3.5-turbo instead of GPT-4)

---

## 📊 AI Service Monitoring

### Metrics to Track

1. **Response Time:** Average time for AI responses
2. **Token Usage:** Monitor OpenAI/Anthropic token consumption
3. **Cost:** Track AI API costs
4. **Learning Progress:** Monitor progressive learning percentage
5. **Error Rate:** Failed AI requests
6. **Cache Hit Rate:** Percentage of cached responses

### Logging

All AI services log to:
- **Development:** Console
- **Production:** Structured JSON logs

View logs:
```bash
railway logs --service ils-main-app | grep MasterAI
railway logs --service ils-ai-service
railway logs --service ils-analytics-service
```

---

## 🎓 Best Practices

### 1. API Key Management

- ✅ Store keys in Railway environment variables
- ✅ Use different keys for development and production
- ✅ Rotate keys periodically
- ❌ Never commit keys to version control

### 2. Cost Optimization

- Use GPT-3.5-turbo for simple queries
- Use Claude Haiku for cost-effective responses
- Enable caching for common queries
- Monitor token usage daily

### 3. Performance

- Implement request queuing for batch operations
- Use streaming for long responses
- Cache AI responses when appropriate
- Use background jobs for non-urgent AI tasks

### 4. Security

- Validate all user inputs before sending to AI
- Sanitize AI responses before displaying
- Implement rate limiting per user/tenant
- Log all AI interactions for audit

### 5. Progressive Learning

- Upload company documents to AI knowledge base
- Review and approve AI-generated responses
- Provide feedback on AI responses
- Monitor learning progress percentage

---

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Claude Documentation](https://docs.anthropic.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Ollama Documentation](https://ollama.ai/docs)
- [Railway AI Service Deployment](./RAILWAY_DEPLOYMENT.md)

---

**Last Updated:** 2024-01-15
**Version:** 2.0.0
**Maintained By:** ILS 2.0 AI Team
