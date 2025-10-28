# API Quick Reference Guide

## Base URL
`http://localhost:3000/api`

## Authentication
All endpoints require authentication via session cookies (handled automatically by browser).

---

## 🧠 AI Assistant APIs

### Ask Question
```http
POST /ai-assistant/ask
Content-Type: application/json

{
  "question": "What are my top selling products?",
  "conversationId": "optional-uuid" // omit for new conversation
}

Response:
{
  "data": {
    "conversationId": "uuid",
    "messageId": "uuid",
    "answer": "Based on your data...",
    "confidence": 0.85,
    "usedExternalAi": false,
    "sources": [
      {
        "type": "learned|document|external",
        "reference": "source reference",
        "relevance": 0.92
      }
    ],
    "suggestions": ["Follow-up question 1"],
    "learningOpportunity": false
  }
}
```

### List Conversations
```http
GET /ai-assistant/conversations

Response:
{
  "data": [
    {
      "id": "uuid",
      "title": "Sales Report Discussion",
      "status": "active",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Conversation Messages
```http
GET /ai-assistant/conversations/:id

Response:
{
  "data": {
    "conversation": {
      "id": "uuid",
      "title": "Sales Report Discussion",
      "status": "active"
    },
    "messages": [
      {
        "id": "uuid",
        "role": "user|assistant|system",
        "content": "Message content",
        "usedExternalAi": false,
        "confidence": "0.85",
        "metadata": {},
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

### Upload Knowledge Document
```http
POST /ai-assistant/knowledge/upload
Content-Type: multipart/form-data

FormData:
- file: [PDF, DOCX, DOC, TXT, CSV, JSON] (max 10MB)

Response:
{
  "data": {
    "id": "uuid",
    "filename": "document.pdf",
    "contentType": "application/pdf",
    "size": 1024000,
    "category": "general",
    "extractedText": "Document content...",
    "metadata": {},
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### List Knowledge Base
```http
GET /ai-assistant/knowledge

Response:
{
  "data": [
    {
      "id": "uuid",
      "filename": "product_catalog.pdf",
      "category": "products",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Get Learning Progress
```http
GET /ai-assistant/learning-progress

Response:
{
  "data": {
    "progress": 45.5,
    "status": "learning|early_learning|mostly_autonomous|fully_autonomous",
    "useExternalAi": true,
    "stats": {
      "learnedQA": 125,
      "documents": 15,
      "conversations": 42,
      "avgConfidence": 0.78
    }
  }
}
```

### Get Usage Statistics
```http
GET /ai-assistant/stats

Response:
{
  "data": {
    "totalConversations": 42,
    "totalMessages": 256,
    "localAnswers": 145,
    "externalAnswers": 111,
    "autonomyRate": 56.64,
    "avgUserRating": 4.2,
    "knowledgeBaseSize": 15,
    "learnedQACount": 125
  }
}
```

### Submit Feedback
```http
POST /ai-assistant/conversations/:conversationId/feedback
Content-Type: application/json

{
  "messageId": "uuid",
  "rating": 5,
  "helpful": true,
  "accurate": true,
  "comment": "Great answer!"
}

Response:
{
  "data": {
    "id": "uuid",
    "feedbackType": "rating",
    "rating": 5,
    "helpful": true,
    "accurate": true
  }
}
```

---

## 🏢 Company Management APIs

### Get Company Details
```http
GET /companies/:id

Response:
{
  "data": {
    "id": "uuid",
    "name": "Acme Optical",
    "type": "dispenser|supplier|manufacturer|other",
    "registrationNumber": "REG-12345",
    "address": "123 Main St",
    "contactEmail": "contact@acme.com",
    "contactPhone": "+1234567890",
    "status": "active|inactive|suspended",
    "settings": {},
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Update Company
```http
PATCH /companies/:id
Content-Type: application/json

{
  "name": "Acme Optical Updated",
  "contactEmail": "new@acme.com",
  "address": "456 New St"
}

Response:
{
  "data": {
    "id": "uuid",
    "name": "Acme Optical Updated",
    // ... updated fields
  }
}
```

### List Supplier Relationships (as Dispenser)
```http
GET /companies/relationships/suppliers

Response:
{
  "data": [
    {
      "id": "uuid",
      "supplierId": "uuid",
      "dispenserId": "uuid",
      "status": "pending|approved|rejected",
      "supplierCompany": {
        "id": "uuid",
        "name": "Lens Supplier Co",
        "contactEmail": "supplier@example.com"
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### List Dispenser Relationships (as Supplier)
```http
GET /companies/relationships/dispensers

Response:
{
  "data": [
    {
      "id": "uuid",
      "supplierId": "uuid",
      "dispenserId": "uuid",
      "status": "pending|approved|rejected",
      "dispenserCompany": {
        "id": "uuid",
        "name": "Eye Care Clinic",
        "contactEmail": "clinic@example.com"
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Create Relationship
```http
POST /companies/relationships
Content-Type: application/json

{
  "supplierId": "uuid"
}

Response:
{
  "data": {
    "id": "uuid",
    "supplierId": "uuid",
    "dispenserId": "uuid",
    "status": "pending",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### Update Relationship Status
```http
PATCH /companies/relationships/:id
Content-Type: application/json

{
  "status": "approved|rejected"
}

Response:
{
  "data": {
    "id": "uuid",
    "status": "approved",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

## 📊 Business Intelligence APIs

### Get Dashboard KPIs
```http
GET /ai-intelligence/dashboard

Response:
{
  "data": {
    "kpis": [
      {
        "metric": "Total Orders",
        "value": 1250,
        "change": 15.3,
        "trend": "up",
        "period": "last month"
      },
      {
        "metric": "Revenue",
        "value": 125000,
        "change": -5.2,
        "trend": "down",
        "period": "last month"
      }
    ]
  }
}
```

### Get AI Insights
```http
GET /ai-intelligence/insights

Response:
{
  "data": {
    "insights": [
      {
        "type": "success|warning|info|error",
        "category": "sales|inventory|operations",
        "title": "Insight Title",
        "description": "Detailed insight description",
        "impact": "high|medium|low",
        "actionable": true,
        "metadata": {}
      }
    ]
  }
}
```

### Get Growth Opportunities
```http
GET /ai-intelligence/opportunities

Response:
{
  "data": {
    "opportunities": [
      {
        "type": "cross_sell|upsell|efficiency",
        "title": "Opportunity Title",
        "description": "Opportunity description",
        "estimatedImpact": "+15% revenue",
        "priority": "high|medium|low",
        "actionItems": [
          "Action 1",
          "Action 2"
        ]
      }
    ]
  }
}
```

### Get Active Alerts
```http
GET /ai-intelligence/alerts

Response:
{
  "data": {
    "alerts": [
      {
        "severity": "critical|warning|info",
        "category": "inventory|quality|operations",
        "message": "Alert message",
        "timestamp": "2024-01-15T10:00:00Z",
        "resolved": false
      }
    ]
  }
}
```

### Generate Demand Forecast
```http
POST /ai-intelligence/forecast
Content-Type: application/json

{
  "productId": "uuid",
  "periods": 30
}

Response:
{
  "data": {
    "productId": "uuid",
    "forecast": [
      {
        "date": "2024-02-01",
        "predicted": 45,
        "lower": 38,
        "upper": 52,
        "confidence": 0.85
      }
    ],
    "accuracy": {
      "mape": 8.5,
      "rmse": 3.2
    },
    "trend": "increasing",
    "seasonality": "detected"
  }
}
```

### Detect Anomalies
```http
POST /ai-intelligence/anomalies
Content-Type: application/json

{
  "metric": "sales|inventory|quality",
  "timeRange": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  }
}

Response:
{
  "data": {
    "anomalies": [
      {
        "timestamp": "2024-01-15T10:00:00Z",
        "value": 150,
        "expected": 100,
        "deviation": 50,
        "severity": "high",
        "method": "z-score|iqr|seasonal|trend"
      }
    ],
    "summary": {
      "totalAnomalies": 5,
      "criticalCount": 2,
      "period": "30 days"
    }
  }
}
```

---

## 🔒 Authorization & Data Isolation

All endpoints automatically:
- Extract user's `companyId` from session
- Filter queries by `company_id`
- Ensure data isolation between companies
- Return 403 if accessing other company's data

## 📝 Common Query Parameters

```http
?page=1           # Pagination
?limit=20         # Items per page
?sort=createdAt   # Sort field
?order=desc       # Sort order
?search=keyword   # Search filter
```

## 🚨 Error Responses

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## 🧪 Testing with cURL

```bash
# Ask AI question
curl -X POST http://localhost:3000/api/ai-assistant/ask \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"question": "What are my sales trends?"}'

# Upload document
curl -X POST http://localhost:3000/api/ai-assistant/knowledge/upload \
  -b cookies.txt \
  -F "file=@document.pdf"

# Get company details
curl http://localhost:3000/api/companies/YOUR_COMPANY_ID \
  -b cookies.txt

# Get BI dashboard
curl http://localhost:3000/api/ai-intelligence/dashboard \
  -b cookies.txt
```

## 📦 Postman Collection

Import `ILS_API_Tests.postman_collection.json` for pre-configured requests.

## 🔗 Related Documentation

- [Frontend Integration Guide](./FRONTEND_INTEGRATION_COMPLETE.md)
- [Test Scenarios](./TEST_SCENARIOS.md)
- [AI Implementation](./AI_ASSISTANT_IMPLEMENTATION.md)
- [Architecture](./docs/architecture.md)
