# AI Service Integration Guide

## Quick Start

This guide explains how to integrate the AI service with your existing IntegratedLensSystem application.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    IntegratedLensSystem                         │
│                    (Main Application)                           │
│                    Port: 5000                                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ HTTP Requests with JWT
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI Service API                               │
│                    (FastAPI)                                    │
│                    Port: 8080                                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  JWT Authentication & Tenant Isolation                   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────┐              ┌─────────────────────────────┐│
│  │ Fine-Tuned   │              │   RAG Query Engine          ││
│  │ LLaMA Model  │              │                             ││
│  │              │              │  ┌──────────┐ ┌──────────┐ ││
│  │ Ophthalmic   │              │  │ Sales DB │ │ Inventory│ ││
│  │ Knowledge    │              │  └──────────┘ └──────────┘ ││
│  │              │              │  ┌──────────────────────┐  ││
│  │              │              │  │ Anonymized Patient DB│  ││
│  │              │              │  └──────────────────────┘  ││
│  └──────────────┘              └─────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                     │
                     │ Queries (read-only)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                          │
│                    (Tenant-Isolated)                            │
└─────────────────────────────────────────────────────────────────┘
```

## Installation

### 1. Install Python Dependencies

```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

Create `.env` file in `ai-service/` directory:

```env
# JWT Configuration
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=60

# Model Configuration
MODEL_PATH=~/.cache/llama-models/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf

# Tenant Database Connections (Example for tenant: demo_clinic_001)
TENANT_demo_clinic_001_SALES_DB=postgresql://user:pass@localhost:5432/ils_demo_sales
TENANT_demo_clinic_001_PATIENT_DB=postgresql://user:pass@localhost:5432/ils_demo_patients_anon
TENANT_demo_clinic_001_INVENTORY_DB=postgresql://user:pass@localhost:5432/ils_demo_inventory
```

### 3. Start LLaMA Server (if not already running)

```bash
python -m llama_cpp.server \
  --model ~/.cache/llama-models/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf \
  --host 0.0.0.0 \
  --port 8000 \
  --n_ctx 2048 \
  --n_gpu_layers -1
```

### 4. Start AI Service API

```bash
cd ai-service
source venv/bin/activate
python api/main.py
```

The API will be available at: `http://localhost:8080`

## Integration with Main Application

### Option 1: HTTP Client Integration (Recommended)

Add to your existing TypeScript/Node.js application:

```typescript
// server/services/aiService.ts

interface AIQueryRequest {
  question: string;
  query_type: 'sales' | 'inventory' | 'patient_analytics';
}

interface AIQueryResponse {
  answer: string;
  metadata: Record<string, any>;
  success: boolean;
  error?: string;
}

export class AIService {
  private baseUrl = process.env.AI_SERVICE_URL || 'http://localhost:8080';
  
  async query(
    request: AIQueryRequest,
    jwtToken: string
  ): Promise<AIQueryResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`AI Service error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getOphthalmicKnowledge(
    question: string,
    jwtToken: string,
    context?: string
  ): Promise<{ answer: string; model: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}/api/v1/ophthalmic-knowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ question, context }),
    });
    
    if (!response.ok) {
      throw new Error(`AI Service error: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

### Option 2: Add AI Routes to Express

```typescript
// server/routes/ai.ts

import express from 'express';
import { AIService } from '../services/aiService';
import { requireAuth } from '../middleware/auth';

const router = express.Router();
const aiService = new AIService();

// Query sales, inventory, or patient analytics
router.post('/query', requireAuth, async (req, res) => {
  try {
    const { question, query_type } = req.body;
    
    // Get JWT token from request (assuming it's in req.user.token)
    const jwtToken = req.headers.authorization?.split(' ')[1];
    
    if (!jwtToken) {
      return res.status(401).json({ error: 'No authentication token' });
    }
    
    const result = await aiService.query(
      { question, query_type },
      jwtToken
    );
    
    res.json(result);
  } catch (error) {
    console.error('AI query error:', error);
    res.status(500).json({ error: 'AI query failed' });
  }
});

// Get ophthalmic knowledge
router.post('/knowledge', requireAuth, async (req, res) => {
  try {
    const { question, context } = req.body;
    
    const jwtToken = req.headers.authorization?.split(' ')[1];
    
    if (!jwtToken) {
      return res.status(401).json({ error: 'No authentication token' });
    }
    
    const result = await aiService.getOphthalmicKnowledge(
      question,
      jwtToken,
      context
    );
    
    res.json(result);
  } catch (error) {
    console.error('Knowledge query error:', error);
    res.status(500).json({ error: 'Knowledge query failed' });
  }
});

export default router;
```

Add to your main server file:

```typescript
// server/index.ts

import aiRoutes from './routes/ai';

// ... existing code ...

app.use('/api/ai', aiRoutes);
```

## Frontend Integration

### React Component Example

```tsx
// client/src/components/AIAssistant.tsx

import React, { useState } from 'react';

interface AIAssistantProps {
  queryType: 'sales' | 'inventory' | 'patient_analytics';
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ queryType }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleQuery = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          question,
          query_type: queryType,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAnswer(data.answer);
      } else {
        setAnswer(`Error: ${data.error}`);
      }
    } catch (error) {
      setAnswer('Failed to get answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="ai-assistant">
      <h3>AI Assistant - {queryType}</h3>
      
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question..."
        rows={3}
      />
      
      <button onClick={handleQuery} disabled={loading || !question.trim()}>
        {loading ? 'Thinking...' : 'Ask'}
      </button>
      
      {answer && (
        <div className="answer">
          <strong>Answer:</strong>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};
```

## Database Setup

### 1. Create Anonymized Patient Database

Run the anonymization script:

```bash
cd ai-service
source venv/bin/activate
python data/anonymize_patient_data.py
```

This creates a HIPAA-compliant, de-identified copy of patient data.

**Important:** The LLM never accesses the original patient database - only the anonymized copy.

### 2. Configure Read-Only Database Access

For PostgreSQL, create a read-only user for the AI service:

```sql
-- Create read-only role
CREATE ROLE ai_service_readonly;

-- Grant SELECT on specific tables
GRANT SELECT ON sales, products, transactions TO ai_service_readonly;
GRANT SELECT ON inventory, stock_levels, suppliers TO ai_service_readonly;
GRANT SELECT ON anonymized_patients, purchase_history TO ai_service_readonly;

-- Create user for AI service
CREATE USER ai_service_user WITH PASSWORD 'secure_password';
GRANT ai_service_readonly TO ai_service_user;

-- Ensure read-only connection
ALTER USER ai_service_user SET default_transaction_read_only = on;
```

## Security Checklist

- [ ] JWT secret key set to strong random value
- [ ] Database credentials stored in secure secrets manager (AWS Secrets Manager, Azure Key Vault)
- [ ] Read-only database access configured
- [ ] Patient data anonymization script runs on schedule (nightly)
- [ ] API rate limiting configured
- [ ] HTTPS enabled in production
- [ ] CORS configured with specific origins
- [ ] Audit logging enabled
- [ ] Tenant isolation tested

## Fine-Tuning the Model

To fine-tune LLaMA on ophthalmic knowledge:

```bash
cd ai-service
source venv/bin/activate

# Add more training data to data/training_data.jsonl
# Then run training
python training/train_ophthalmic_model.py \
  --data_path data/training_data.jsonl \
  --output_dir ./fine_tuned_model \
  --num_epochs 3 \
  --batch_size 4
```

After fine-tuning, update `MODEL_PATH` to point to the fine-tuned model.

## Testing

### 1. Generate Test JWT Token

```bash
curl -X POST http://localhost:8080/api/v1/admin/generate-token \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "demo_clinic_001",
    "user_id": "test_user"
  }'
```

Save the returned token.

### 2. Test Sales Query

```bash
curl -X POST http://localhost:8080/api/v1/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "question": "What were our top 3 selling products last month?",
    "query_type": "sales"
  }'
```

### 3. Test Ophthalmic Knowledge

```bash
curl -X POST http://localhost:8080/api/v1/ophthalmic-knowledge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "question": "What is the difference between single vision and progressive lenses?"
  }'
```

## Deployment

### Production Considerations

1. **Use Production Database**: Replace SQLite with PostgreSQL
2. **Secure Secrets**: Use AWS Secrets Manager or Azure Key Vault
3. **Enable HTTPS**: Use SSL/TLS certificates
4. **Add Rate Limiting**: Implement rate limiting middleware
5. **Monitor Performance**: Set up logging and monitoring
6. **Scale Horizontally**: Deploy multiple API instances behind load balancer
7. **Use GPU Server**: For production, run model on GPU server (NVIDIA A100, etc.)

### Docker Deployment (Optional)

Create `ai-service/Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "api/main.py"]
```

Build and run:

```bash
docker build -t ils-ai-service .
docker run -p 8080:8080 --env-file .env ils-ai-service
```

## Troubleshooting

### Issue: "Model not found"
**Solution**: Ensure `MODEL_PATH` points to correct model file. Download model if needed:
```bash
huggingface-cli download TheBloke/Llama-2-7B-Chat-GGUF llama-2-7b-chat.Q4_K_M.gguf --local-dir ~/.cache/llama-models/
```

### Issue: "Database connection failed"
**Solution**: Check connection strings in `.env` file. Ensure PostgreSQL is running and credentials are correct.

### Issue: "JWT verification failed"
**Solution**: Ensure JWT token is valid and not expired. Check that `JWT_SECRET_KEY` matches between main app and AI service.

## Next Steps

1. ✅ Start AI Service: `python api/main.py`
2. ✅ Test with curl commands
3. ✅ Integrate with main application
4. ✅ Add frontend UI components
5. ✅ Run anonymization script
6. ✅ Fine-tune model on your data
7. ✅ Deploy to production

## Support

For issues or questions:
- Review `AI_IMPLEMENTATION_ROADMAP.md` for detailed implementation plan
- Check logs: `tail -f /tmp/llama-server.log`
- API documentation: `http://localhost:8080/docs` (FastAPI auto-generated)

