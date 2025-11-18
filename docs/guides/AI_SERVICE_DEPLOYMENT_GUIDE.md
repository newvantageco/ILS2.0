# 🤖 ILS 2.0 - AI Service Deployment Guide

## **OVERVIEW**

Deploy the ILS 2.0 AI Service to Hugging Face Spaces with GPU support for optimal performance with GPT-4 Vision and Claude 3 integration.

---

## **🎯 DEPLOYMENT OPTIONS**

### **Option A: Hugging Face Spaces (Recommended)**
✅ **GPU Support** - NVIDIA T4 acceleration  
✅ **Free Tier** - No cost for basic usage  
✅ **Global CDN** - Fast worldwide access  
✅ **SSL Included** - Automatic HTTPS  
✅ **Easy Scaling** - Automatic load balancing  

### **Option B: Railway (Alternative)**
✅ **Same Platform** - Manage with main app  
✅ **Shared Environment** - Easier configuration  
❌ **No GPU** - CPU-only processing  
❌ **Higher Cost** - Additional service charges  

---

## **🚀 HUGGING FACE DEPLOYMENT (RECOMMENDED)**

### **Step 1: Prepare Hugging Face Account**
1. Go to [huggingface.co](https://huggingface.co)
2. Create free account
3. Verify email address
4. Generate access token:
   - Go to **Settings → Access Tokens**
   - Click **New token**
   - Select **Write** permissions
   - Copy token for CLI login

### **Step 2: Login to Hugging Face CLI**
```bash
# Install huggingface_hub
pip install huggingface_hub

# Login with your token
huggingface-cli login

# Verify login
huggingface-cli whoami
```

### **Step 3: Deploy AI Service**
```bash
# Run the deployment script
./scripts/deploy-ai-service.sh
```

### **Step 4: Configure Environment Variables**
In your Hugging Face Space settings, add:

```bash
# AI Model APIs
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# Security
JWT_SECRET_KEY=your-jwt-secret-key-here
ENCRYPTION_KEY=your-encryption-key-here

# CORS (your Railway app URL)
CORS_ORIGIN=https://your-app.railway.app

# Optional: Database Connection
DATABASE_URL=postgresql://user:pass@host:port/db
```

### **Step 5: Test Deployment**
```bash
# Test the AI service
./scripts/test-ai-service.sh https://your-space.hf.space
```

---

## **🔧 CONFIGURATION DETAILS**

### **Required API Keys**

#### **OpenAI API Key**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Navigate to **API Keys**
3. Click **Create new secret key**
4. Copy key: `sk-...`

#### **Anthropic API Key**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Navigate to **API Keys**
3. Click **Create Key**
4. Copy key: `sk-ant-...`

### **Security Configuration**

#### **JWT Secret Key**
```bash
# Generate secure JWT secret
openssl rand -hex 32
# Example: 1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2
```

#### **Encryption Key**
```bash
# Generate encryption key for sensitive data
openssl rand -hex 16
# Example: 1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6
```

---

## **📡 API ENDPOINTS**

### **Health & Status**
```bash
GET /health                    # Service health check
GET /                          # Service information
```

### **Authentication**
```bash
POST /api/v1/auth/token        # Generate JWT token
{
  "tenant_id": "company123",
  "user_id": "user456"
}
```

### **AI Query & Analysis**
```bash
POST /api/v1/query             # Natural language database queries
{
  "query": "Show me recent orders for patient John Doe",
  "tenant_id": "company123"
}

POST /api/v1/ophthalmic-knowledge  # Clinical AI queries
{
  "question": "What are the treatment options for glaucoma?",
  "tenant_id": "company123"
}

POST /api/v1/prescription/analyze   # Prescription OCR
{
  "image_data": "base64_encoded_image",
  "tenant_id": "company123"
}
```

---

## **🧪 TESTING THE SERVICE**

### **Health Check**
```bash
curl https://your-space.hf.space/health
```

### **Get Authentication Token**
```bash
curl -X POST https://your-space.hf.space/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "test", "user_id": "test"}'
```

### **Test AI Query**
```bash
# First get token
TOKEN=$(curl -s -X POST https://your-space.hf.space/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "test", "user_id": "test"}' | \
  grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# Then test query
curl -X POST https://your-space.hf.space/api/v1/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "Show me recent orders", "tenant_id": "test"}'
```

---

## **🔗 INTEGRATION WITH MAIN APP**

### **Update Railway Environment Variables**
In your Railway project settings, add:
```bash
AI_SERVICE_URL=https://your-space.hf.space
```

### **Test Integration**
```bash
# Test from your main Railway app
curl https://your-app.railway.app/api/verification/ai-ml
```

---

## **📊 MONITORING & LOGS**

### **Built-in Monitoring**
- **Health Endpoint**: `/health`
- **Metrics**: `/metrics` (Prometheus format)
- **Logs**: Available in Hugging Face Space console

### **Performance Metrics**
- Response time tracking
- Request count monitoring
- Error rate tracking
- GPU utilization (if available)

---

## **🔒 SECURITY FEATURES**

### **Authentication**
- JWT-based authentication
- Token expiration handling
- Tenant isolation

### **Data Protection**
- Encryption of sensitive data
- PII anonymization
- Secure file handling

### **Access Control**
- Rate limiting
- CORS protection
- Input validation

---

## **🚨 TROUBLESHOOTING**

### **Common Issues**

#### **Service Not Responding**
```bash
# Check space status
curl https://your-space.hf.space/health

# Check logs in Hugging Face Space console
```

#### **Authentication Failures**
```bash
# Verify JWT secret is set
# Check token generation endpoint
# Validate token format
```

#### **API Key Errors**
```bash
# Verify OpenAI API key is valid
# Check Anthropic API key format
# Test API key directly:
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-your-key"
```

#### **CORS Issues**
```bash
# Verify CORS_ORIGIN includes your Railway URL
# Check browser console for CORS errors
```

---

## **📈 SCALING & PERFORMANCE**

### **GPU Usage**
- Automatic GPU detection
- Fallback to CPU if GPU unavailable
- Optimized for NVIDIA T4

### **Scaling Options**
- **Free Tier**: Limited CPU/GPU time
- **Pro Tier**: Higher limits, faster GPUs
- **Enterprise**: Dedicated resources

### **Performance Optimization**
- Model caching
- Request batching
- Connection pooling

---

## **💰 COST ESTIMATES**

### **Hugging Face Spaces**
- **Free Tier**: $0/month (with limits)
- **Pro Tier**: ~$20/month (GPU access)
- **Enterprise**: Custom pricing

### **API Costs**
- **OpenAI GPT-4**: ~$0.03-0.06 per 1K tokens
- **Claude 3**: ~$0.015-0.075 per 1K tokens
- **Estimated Monthly**: $50-200 depending on usage

---

## **🎯 SUCCESS CRITERIA**

Your AI service is successfully deployed when:

✅ **Health Check**: Returns 200 OK  
✅ **Authentication**: JWT tokens generated successfully  
✅ **AI Queries**: GPT-4 and Claude 3 responding  
✅ **Integration**: Main app can communicate with AI service  
✅ **Performance**: Response times <2 seconds  
✅ **Security**: All endpoints properly authenticated  

---

## **🚀 NEXT STEPS**

1. **Deploy AI Service**: Run `./scripts/deploy-ai-service.sh`
2. **Configure Environment**: Add API keys to Space settings
3. **Test Integration**: Run `./scripts/test-ai-service.sh`
4. **Update Main App**: Set AI_SERVICE_URL in Railway
5. **Verify Full Stack**: Test end-to-end AI functionality

---

## **📞 SUPPORT**

- **Hugging Face Docs**: [huggingface.co/docs/hub/spaces](https://huggingface.co/docs/hub/spaces)
- **OpenAI API**: [platform.openai.com](https://platform.openai.com)
- **Anthropic API**: [console.anthropic.com](https://console.anthropic.com)
- **ILS Documentation**: `./docs/`

---

**🎉 Your AI Service will be providing intelligent healthcare insights in minutes!**
