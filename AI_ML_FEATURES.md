# AI/ML Features Documentation

Complete guide to all AI and Machine Learning features in the ILS 2.0 platform.

## 🎯 Overview

This platform includes a comprehensive suite of AI and ML features powered by:
- **Anthropic Claude** (claude-3-5-sonnet-20241022)
- **OpenAI GPT-4**
- **Statistical ML models** for forecasting and anomaly detection
- **Real-time data analytics** with intelligent insights

---

## 🤖 AI Features

### 1. Daily Briefing Generation

**Purpose:** Automatically generate daily business intelligence reports

**Features:**
- Real-time metrics aggregation (orders, patients, revenue)
- AI-powered summary and insights using Claude/GPT
- Actionable recommendations based on daily performance
- Automated scheduling via cron jobs

**Data Sources:**
- POS transactions (sales and revenue)
- Eye examinations (patient volume)
- Historical comparison

**Example Output:**
```json
{
  "date": "2025-01-15",
  "companyId": "company-123",
  "companyName": "Acme Optometry",
  "summary": "Strong sales performance today with 15% increase in transactions...",
  "highlights": [
    "Processed 42 orders today",
    "Examined 38 patients",
    "Generated $3,245.50 in revenue"
  ],
  "recommendations": [
    "Review pending orders for follow-up",
    "Check inventory levels for popular products"
  ],
  "metrics": {
    "ordersToday": 42,
    "patientsToday": 38,
    "revenueToday": 3245.50
  }
}
```

**Usage:**
```typescript
import { scheduleAIJob } from './queue/aiQueue';

// Schedule daily briefing
await scheduleAIJob({
  type: 'daily-briefing',
  companyId: 'company-123',
  date: '2025-01-15'
});
```

---

### 2. Demand Forecasting (ML)

**Purpose:** Predict future product demand using historical sales data

**Algorithm:**
- **Moving Average** with standard deviation
- **Confidence Scoring** based on data variability
- **90-day historical window** for pattern recognition
- Trend analysis and seasonality detection

**Features:**
- Product-specific forecasts
- Confidence intervals (0-100%)
- Automated reorder recommendations
- Historical average comparison

**Data Sources:**
- POS transaction items (90-day history)
- Product sales velocity
- Seasonal trends

**Example Output:**
```json
{
  "companyId": "company-123",
  "forecastDays": 7,
  "predictions": [
    {
      "productId": "prod-456",
      "productName": "Progressive Lenses",
      "historicalAverage": 45,
      "predictedDemand": 52,
      "confidence": 0.87,
      "recommendation": "High demand expected - consider ordering 57 units"
    }
  ],
  "summary": "Forecast generated for 7 days ahead based on 127 historical data points"
}
```

**Usage:**
```typescript
await scheduleAIJob({
  type: 'demand-forecast',
  companyId: 'company-123',
  productIds: ['prod-456', 'prod-789'], // Optional: specific products
  forecastDays: 7
});
```

---

### 3. Anomaly Detection (Statistical ML)

**Purpose:** Detect unusual patterns in business metrics

**Algorithm:**
- **Z-Score Analysis** (statistical outlier detection)
- **2-standard deviation** threshold for anomalies
- **Severity scoring** (high, medium, low)
- Automatic baseline calculation

**Supported Metrics:**
- Revenue
- Order volume
- Inventory levels
- Patient volume

**Time Ranges:**
- Daily (7-day analysis)
- Weekly (14-day analysis)
- Monthly (30-day analysis)

**Example Output:**
```json
{
  "companyId": "company-123",
  "metricType": "revenue",
  "timeRange": "daily",
  "anomaliesDetected": [
    {
      "date": "2025-01-14",
      "value": 4523.50,
      "zScore": 2.34,
      "isAnomaly": true,
      "severity": "medium"
    }
  ],
  "statistics": {
    "mean": 2145.75,
    "standardDeviation": 512.30,
    "dataPoints": 30
  },
  "summary": "Detected 1 anomaly in revenue over the daily period"
}
```

**Usage:**
```typescript
await scheduleAIJob({
  type: 'anomaly-detection',
  companyId: 'company-123',
  metricType: 'revenue',
  timeRange: 'daily'
});
```

---

### 4. Insight Generation (AI-Powered)

**Purpose:** Generate actionable business insights using AI

**Features:**
- Context-aware analysis
- Priority-ranked insights
- Actionable recommendations
- Multi-category support

**Insight Categories:**
- Revenue optimization
- Inventory management
- Patient care improvements
- Operational efficiency

**AI Models:**
- Claude 3.5 Sonnet (primary)
- GPT-4 (fallback)

**Example Output:**
```json
{
  "companyId": "company-123",
  "insightType": "revenue",
  "periodStart": "2025-01-01",
  "periodEnd": "2025-01-15",
  "insights": [
    {
      "title": "Revenue Growth Opportunity",
      "description": "Average transaction value decreased by 8% compared to previous period...",
      "priority": "high",
      "actionable": true,
      "recommendation": "Implement upselling training for staff on premium lens coatings"
    }
  ]
}
```

**Usage:**
```typescript
await scheduleAIJob({
  type: 'insight-generation',
  companyId: 'company-123',
  insightType: 'revenue',
  periodStart: '2025-01-01',
  periodEnd: '2025-01-15'
});
```

---

### 5. AI Chat Assistant

**Purpose:** Intelligent conversational assistant for practice management

**Features:**
- Optometry-specific knowledge
- Practice operations support
- Real-time responses
- Multi-turn conversations

**AI Models:**
- Anthropic Claude 3.5 Sonnet (primary)
- OpenAI GPT-4 (fallback)

**System Prompts:**
```
You are an AI assistant for an optometry practice management system.
Provide helpful, accurate information about optometry, eye care,
inventory management, patient records, and practice operations.
Be concise, professional, and actionable.
```

**Example Output:**
```json
{
  "conversationId": "conv-789",
  "userId": "user-123",
  "companyId": "company-123",
  "message": "How should I handle low inventory for progressive lenses?",
  "response": "For low inventory on progressive lenses, I recommend: 1) Check your demand forecast...",
  "timestamp": "2025-01-15T10:30:00Z",
  "provider": "anthropic"
}
```

**Usage:**
```typescript
await scheduleAIJob({
  type: 'chat-response',
  userId: 'user-123',
  companyId: 'company-123',
  conversationId: 'conv-789',
  message: 'How should I handle low inventory for progressive lenses?'
});
```

---

## 📊 Technical Implementation

### AI Worker Architecture

```
┌─────────────────────────────────────────┐
│         AI Job Queue (BullMQ)           │
│  - Redis-based queue system             │
│  - Priority scheduling                  │
│  - Concurrency: 2 workers               │
│  - Rate limit: 10 jobs/minute           │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         AI Worker (aiWorker.ts)         │
│  - Job dispatcher                       │
│  - Error handling                       │
│  - Retry logic                          │
│  - Timeout: 2 minutes                   │
└────────────────┬────────────────────────┘
                 │
     ┌───────────┴───────────┐
     ▼                       ▼
┌─────────┐           ┌──────────────┐
│ Claude  │           │  PostgreSQL  │
│   API   │           │   Database   │
└─────────┘           └──────────────┘
```

### Database Queries

**Real-time Data Sources:**
- `posTransactions` - Sales and revenue data
- `posTransactionItems` - Product-level sales
- `eyeExaminations` - Patient examination records
- `products` - Inventory levels

**Optimizations:**
- Indexed date ranges for fast queries
- Aggregation functions (COUNT, SUM, AVG)
- Company-level data isolation
- Efficient joins with proper indexes

---

## 🚀 Setup & Configuration

### 1. Environment Variables

Add to your `.env` file:

```bash
# AI Service Configuration
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Redis (required for AI workers)
REDIS_URL=redis://localhost:6379
```

### 2. Install Dependencies

Already included in `package.json`:
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.68.0",
    "openai": "^6.7.0",
    "bullmq": "^5.63.0",
    "ioredis": "^5.8.2"
  }
}
```

### 3. Start AI Workers

AI workers start automatically with the application:

```typescript
// server/index.ts
import './workers/aiWorker';  // Auto-starts on app launch
```

### 4. Schedule AI Jobs

**Using Cron Jobs:**
```typescript
// Daily briefing at 8 AM
cron.schedule('0 8 * * *', async () => {
  await scheduleAIJob({
    type: 'daily-briefing',
    companyId: company.id,
    date: new Date().toISOString()
  });
});
```

**Manual Trigger:**
```typescript
import { scheduleAIJob } from './queue/aiQueue';

const result = await scheduleAIJob({
  type: 'demand-forecast',
  companyId: 'company-123',
  forecastDays: 7
});
```

---

## 📈 Performance & Scaling

### Concurrency

```typescript
{
  concurrency: 2,  // Max 2 AI jobs simultaneously
  lockDuration: 120000,  // 2-minute timeout
  limiter: {
    max: 10,  // Max 10 jobs
    duration: 60000  // Per minute
  }
}
```

### Cost Management

**Anthropic Claude:**
- Model: claude-3-5-sonnet-20241022
- ~$0.003 per 1K input tokens
- ~$0.015 per 1K output tokens
- Average: $0.02-0.05 per AI task

**OpenAI GPT-4:**
- Model: gpt-4
- ~$0.03 per 1K input tokens
- ~$0.06 per 1K output tokens
- Average: $0.05-0.10 per AI task

**Optimization Tips:**
1. Cache frequent queries
2. Use smaller models for simple tasks
3. Batch similar requests
4. Rate limit job scheduling

### Monitoring

**Worker Health:**
```typescript
worker.on('completed', (job) => {
  console.log(`✅ AI job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ AI job ${job?.id} failed:`, err);
});
```

**Queue Metrics:**
- Job completion rate
- Average processing time
- Error rate
- Queue depth

---

## 🔧 Troubleshooting

### Common Issues

**1. AI Worker Not Starting**
```
⚠️  AI worker not started - Redis not available
```
**Solution:** Ensure Redis is running and `REDIS_URL` is configured

**2. API Key Errors**
```
Anthropic API error: Invalid API key
```
**Solution:** Verify `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` in `.env`

**3. Database Query Errors**
```
error: relation "examinations" does not exist
```
**Solution:** Use correct table names:
- `posTransactions` (not `orders`)
- `eyeExaminations` (not `examinations`)
- `posTransactionItems` (not `orderItems`)

**4. Job Timeout**
```
AI job timeout after 2 minutes
```
**Solution:** Increase `lockDuration` for complex queries or optimize database queries

---

## 🎓 Best Practices

### 1. Error Handling

```typescript
try {
  const result = await processDailyBriefing(data);
  return { success: true, result };
} catch (error) {
  console.error('AI job failed:', error);
  // Log to monitoring service
  // Retry with exponential backoff
  throw error;
}
```

### 2. Data Validation

```typescript
if (!company) {
  throw new Error(`Company ${companyId} not found`);
}

if (!anthropicClient && !openaiClient) {
  return fallbackResponse();
}
```

### 3. Graceful Degradation

```typescript
// Use AI if available, fallback to simple logic
const insights = aiInsights.length > 0
  ? aiInsights
  : generateBasicInsights(contextData);
```

### 4. Rate Limiting

```typescript
{
  limiter: {
    max: 10,  // Prevent API quota exhaustion
    duration: 60000  // Spread load over time
  }
}
```

---

## 📚 API Reference

### Job Types

| Type | Purpose | Required Fields | Optional Fields |
|------|---------|----------------|-----------------|
| `daily-briefing` | Daily business report | companyId, date | userIds |
| `demand-forecast` | Inventory predictions | companyId, forecastDays | productIds |
| `anomaly-detection` | Outlier detection | companyId, metricType, timeRange | - |
| `insight-generation` | AI insights | companyId, insightType, periodStart, periodEnd | - |
| `chat-response` | AI assistant | userId, companyId, conversationId, message | - |

### Metric Types

- `revenue` - Transaction amounts
- `orders` - Transaction counts
- `inventory` - Stock levels
- `patients` - Examination volume

### Time Ranges

- `daily` - 7-day analysis window
- `weekly` - 14-day analysis window
- `monthly` - 30-day analysis window

---

## 🔐 Security

### API Key Management

- Store keys in environment variables (never in code)
- Use separate keys for dev/staging/production
- Rotate keys regularly
- Monitor usage for anomalies

### Data Privacy

- All AI processing uses company-scoped data
- No cross-company data leakage
- PII is never sent to AI providers
- Audit logs for all AI operations

### Rate Limiting

- Per-company rate limits
- Queue-based throttling
- Graceful degradation
- Cost controls

---

## 📊 Monitoring & Analytics

### Key Metrics

1. **Job Success Rate**
   - Target: >95%
   - Alert if <90%

2. **Average Processing Time**
   - Daily briefing: <30s
   - Demand forecast: <60s
   - Anomaly detection: <45s
   - Insight generation: <90s
   - Chat response: <10s

3. **AI API Cost**
   - Track per-company
   - Set budget alerts
   - Optimize prompts

4. **Queue Depth**
   - Target: <10 pending jobs
   - Alert if >50

---

## 🚀 Future Enhancements

### Planned Features

1. **Advanced ML Models**
   - TensorFlow.js integration
   - Custom neural networks
   - Enhanced forecasting algorithms

2. **Real-time Insights**
   - Stream processing
   - Live anomaly alerts
   - Dynamic recommendations

3. **Multi-modal AI**
   - Image analysis (frame fitting)
   - Document OCR (prescriptions)
   - Voice interactions

4. **Predictive Analytics**
   - Customer churn prediction
   - Revenue forecasting
   - Inventory optimization

---

## 📝 Changelog

### Version 2.0.0 (2025-01-15)

**Added:**
- ✅ Daily briefing with real data and AI
- ✅ ML-based demand forecasting
- ✅ Statistical anomaly detection
- ✅ AI-powered insight generation
- ✅ Chat assistant with Claude/GPT

**Fixed:**
- ✅ All placeholder TODOs removed
- ✅ Database queries use correct schema
- ✅ TypeScript compilation errors resolved
- ✅ AI client initialization

**Improved:**
- ✅ Error handling and logging
- ✅ Graceful degradation
- ✅ Rate limiting
- ✅ Documentation

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review server logs for errors
3. Verify environment configuration
4. Check Redis and database connectivity
5. Open GitHub issue with details

---

**🎉 All AI/ML features are now fully implemented and production-ready!**
