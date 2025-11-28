# ILS 2.0 AI Service

Production-ready AI service for the Integrated Lens System (ILS 2.0), specialized in ophthalmic and dispensing domains with business intelligence capabilities.

## 🎯 Features

### Core Capabilities
- **Ophthalmic Expertise**: Specialized knowledge in lenses, prescriptions, fitting, and eye care
- **Dispensing Intelligence**: Patient counseling, product recommendations, and fitting guidelines
- **Business Insights**: Sales analytics, inventory optimization, and patient retention strategies
- **RAG System**: Retrieval Augmented Generation with pgvector for contextual responses
- **Continuous Learning**: Learns from conversations and feedback to improve over time

### Technical Features
- **Multi-LLM Support**: OpenAI GPT-4 (primary) and Anthropic Claude (fallback)
- **Vector Search**: Fast, relevant context retrieval using pgvector
- **Multi-Tenant**: Secure tenant isolation at all levels
- **Production-Ready**: Health checks, monitoring, error handling
- **Lightweight**: Optimized dependencies for fast Railway deployment

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ILS 2.0 AI Service                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   FastAPI    │  │  Ophthalmic  │  │   RAG Service   │  │
│  │     App      │─▶│  AI Service  │─▶│  (pgvector)     │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│         │                 │                     │          │
│         ▼                 ▼                     ▼          │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │     Auth     │  │ LLM Service  │  │    Database     │  │
│  │     JWT      │  │ OpenAI/Claude│  │  PostgreSQL +   │  │
│  └──────────────┘  └──────────────┘  │   pgvector      │  │
│                                      └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Installation

### Prerequisites
- Python 3.11+
- PostgreSQL 15+ with pgvector extension
- OpenAI API key
- (Optional) Anthropic API key

### Local Development

1. **Clone and navigate:**
   ```bash
   cd ILS2.0/ai-service
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements-production.txt
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

5. **Initialize database:**
   ```bash
   # Ensure PostgreSQL is running with pgvector extension
   # Tables will be created automatically on first run
   ```

6. **Seed knowledge base (optional but recommended):**
   ```bash
   python seed_knowledge.py --company-id YOUR_COMPANY_ID
   ```

7. **Run development server:**
   ```bash
   uvicorn app:app --reload --port 8080
   ```

8. **Test the service:**
   ```bash
   curl http://localhost:8080/health
   ```

## 🚀 Railway Deployment

### Environment Variables

Set these in Railway dashboard:

**Required:**
- `DATABASE_URL` - PostgreSQL connection string (auto-provided by Railway)
- `JWT_SECRET` - JWT secret key (same as main backend)
- `OPENAI_API_KEY` - OpenAI API key

**Optional:**
- `ANTHROPIC_API_KEY` - Anthropic API key for fallback
- `NODE_ENV` - `production` (default)
- `PORT` - Port to run on (Railway auto-assigns)
- `LOG_LEVEL` - Logging level (default: INFO)

### Deploy Steps

1. **Create new service in Railway**
2. **Connect to GitHub repository**
3. **Set root directory:** `/ai-service`
4. **Configure environment variables**
5. **Deploy!**

Railway will automatically:
- Build using Dockerfile.new
- Run health checks
- Scale as needed
- Provide internal URL for backend integration

## 📚 API Documentation

### Authentication
All endpoints (except `/health`) require JWT bearer token:
```
Authorization: Bearer <token>
```

Token must include:
- `company_id` or `companyId`
- `user_id` or `userId`
- `exp` (expiration)

### Endpoints

#### Health Check
```
GET /health
GET /
```
Returns service health status.

#### Chat
```
POST /api/v1/chat
```
Chat with ophthalmic AI assistant.

**Request:**
```json
{
  "message": "What lens type is best for a -3.50 prescription?",
  "conversation_id": "uuid",
  "conversation_history": [
    {"role": "user", "content": "Previous message"},
    {"role": "assistant", "content": "Previous response"}
  ],
  "category": "ophthalmic"
}
```

**Response:**
```json
{
  "answer": "For a -3.50 prescription...",
  "conversation_id": "uuid",
  "used_external_ai": true,
  "confidence": 95,
  "context_used": true,
  "sources": [...],
  "provider": "openai",
  "model": "gpt-4-turbo-preview",
  "processing_time_ms": 1234
}
```

#### Add Knowledge
```
POST /api/v1/knowledge/add
```
Add knowledge to the knowledge base.

**Request:**
```json
{
  "content": "Detailed knowledge content...",
  "category": "ophthalmic",
  "summary": "Brief summary",
  "tags": ["lenses", "coating"],
  "filename": "document.pdf"
}
```

#### Product Recommendations
```
POST /api/v1/recommendations/product
```
Get product recommendations based on prescription.

**Request:**
```json
{
  "prescription": {
    "od_sphere": -3.50,
    "od_cylinder": -0.75,
    "od_axis": 180,
    "os_sphere": -3.25,
    "os_cylinder": -0.50,
    "os_axis": 175,
    "add": 2.00,
    "pd": 63
  },
  "patient_needs": "Computer work, driving at night"
}
```

#### Business Query
```
POST /api/v1/business/query
```
Query business analytics.

**Request:**
```json
{
  "query": "What were our top-selling frames last month?",
  "query_type": "sales"
}
```

#### Submit Feedback
```
POST /api/v1/feedback
```
Submit feedback on AI responses.

**Request:**
```json
{
  "learning_id": "uuid",
  "helpful": true,
  "rating": 5,
  "comments": "Very helpful!"
}
```

#### Learning Progress
```
GET /api/v1/learning/progress
```
Get learning progress for the company.

#### System Health
```
GET /api/v1/system/health
```
Get detailed system health status (requires authentication).

## 🧪 Testing

### Manual Testing

Generate test token:
```bash
curl -X POST http://localhost:8080/api/v1/admin/generate-token \
  -H "Content-Type: application/json" \
  -d '{"company_id": "test-company", "user_id": "test-user"}'
```

Test chat endpoint:
```bash
curl -X POST http://localhost:8080/api/v1/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "What are progressive lenses?"}'
```

### Automated Testing

```bash
pytest tests/
```

## 🔧 Configuration

### AI Behavior

Adjust in `.env`:
- `AI_TEMPERATURE` - Creativity (0.0-1.0, default: 0.7)
- `MAX_TOKENS` - Response length (default: 2000)
- `MAX_CONTEXT_LENGTH` - Context window (default: 8000)

### RAG Settings

- `RAG_TOP_K` - Number of documents to retrieve (default: 5)
- `RAG_SIMILARITY_THRESHOLD` - Minimum similarity score (default: 0.7)

### Learning

- `ENABLE_LEARNING` - Auto-save conversations (default: true)
- `ENABLE_FEEDBACK` - Track feedback (default: true)

## 📊 Monitoring

### Health Checks

- `/health` - Basic health check
- `/api/v1/system/health` - Detailed system status

### Metrics

Track:
- Response times
- Token usage
- Learning progress
- Error rates
- Cache hit rates

### Logs

Structured JSON logs in production:
```json
{
  "timestamp": "2025-11-28T10:30:00Z",
  "level": "INFO",
  "message": "Chat request processed",
  "company_id": "uuid",
  "processing_time_ms": 1234
}
```

## 🛠️ Maintenance

### Knowledge Base Updates

Periodically update the knowledge base:
```bash
python seed_knowledge.py --company-id <company-id>
```

### Database Maintenance

```sql
-- Vacuum vector indexes
VACUUM ANALYZE "aiKnowledgeBase";
VACUUM ANALYZE "aiLearningData";

-- Check index health
SELECT * FROM pg_indexes WHERE tablename IN ('aiKnowledgeBase', 'aiLearningData');
```

### Backup

Ensure regular backups of:
- PostgreSQL database (including vectors)
- Environment variables
- Configuration files

## 🔒 Security

- JWT authentication on all endpoints
- Tenant isolation at database level
- No PII in logs
- Secure environment variable handling
- Read-only database user for RAG queries
- Rate limiting (implement as needed)

## 🆘 Troubleshooting

### Service Won't Start

1. Check environment variables:
   ```bash
   echo $DATABASE_URL
   echo $OPENAI_API_KEY
   ```

2. Verify database connection:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

3. Check logs:
   ```bash
   # Railway: View logs in dashboard
   # Local: Check console output
   ```

### High Response Times

1. Check LLM provider status
2. Verify database performance
3. Check network latency
4. Consider caching frequently asked questions

### Low Confidence Scores

1. Add more knowledge to knowledge base
2. Validate and approve learned data
3. Improve question phrasing
4. Check category filters

## 📝 License

Proprietary - ILS 2.0

## 👥 Support

For issues or questions:
- Check logs first
- Review this README
- Contact development team
