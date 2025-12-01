# AI Services Analysis

**Generated:** December 1, 2025
**Scope:** ILS 2.0 AI Service Consolidation Analysis

---

## Executive Summary

The ILS 2.0 codebase contains **7 AI-related route files** and **12+ AI services** with significant overlap and duplication. This analysis maps all AI capabilities and recommends consolidation into a unified architecture.

---

## 1. AI Route Files

### 1.1 master-ai.ts
**Path:** `server/routes/master-ai.ts`
**Service:** `MasterAIService`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/master-ai/chat` | POST | Main conversational interface |
| `/api/master-ai/conversations` | GET | List user's conversations |
| `/api/master-ai/conversations/:id` | GET | Get conversation with messages |
| `/api/master-ai/conversations/:id` | DELETE | Delete conversation |
| `/api/master-ai/upload-document` | POST | Upload knowledge documents |
| `/api/master-ai/learning-progress` | GET | Get AI learning progress |

**Core Functionality:**
- Natural language chat with topic validation (optometry only)
- Conversation history management
- Document upload for knowledge base
- Learning progress tracking
- Hybrid intelligence (Python RAG + GPT-4 + database tools)

**Database Tables:**
- `ai_conversations`
- `ai_messages`
- `ai_knowledge_base`
- `ai_learning_data`

---

### 1.2 platform-ai.ts
**Path:** `server/routes/platform-ai.ts`
**Service:** `PlatformAIService`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/platform-ai/command` | POST | Process AI command (query/action/analysis) |
| `/api/platform-ai/insights` | GET | Get proactive insights |
| `/api/platform-ai/alerts` | GET | Get predictive alerts |
| `/api/platform-ai/quick-actions` | GET | Get context-aware actions |
| `/api/platform-ai/search` | POST | AI-powered search |
| `/api/platform-ai/conversations` | GET | List conversations |

**Core Functionality:**
- Command processing (queries, actions, analysis, predictions)
- Proactive insights generation
- Predictive alerts
- Context-aware quick actions
- AI-powered search

**Dependencies:**
- `ExternalAIService`
- `storage` (IStorage)

---

### 1.3 ai-notifications.ts
**Path:** `server/routes/ai-notifications.ts`
**Service:** `ProactiveInsightsService`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai-notifications` | GET | List AI notifications |
| `/api/ai-notifications/unread-count` | GET | Get unread count |
| `/api/ai-notifications/:id/read` | PATCH | Mark as read |
| `/api/ai-notifications/:id/dismiss` | PATCH | Dismiss notification |
| `/api/ai-notifications/generate` | POST | Generate new insights |

**Core Functionality:**
- AI-generated notification management
- Proactive insights delivery
- Read/dismiss tracking

**Database Tables:**
- `ai_notifications`

---

### 1.4 ai-purchase-orders.ts
**Path:** `server/routes/ai-purchase-orders.ts`
**Service:** `AutonomousPurchasingService`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai-purchase-orders` | GET | List AI-generated POs |
| `/api/ai-purchase-orders/:id` | GET | Get specific draft PO |
| `/api/ai-purchase-orders/:id/approve` | POST | Approve draft PO |
| `/api/ai-purchase-orders/:id/reject` | POST | Reject draft PO |
| `/api/ai-purchase-orders/:id/edit` | PATCH | Edit draft PO |
| `/api/ai-purchase-orders/generate` | POST | Generate new draft POs |

**Core Functionality:**
- AI-generated purchase order drafts
- Approval/rejection workflow
- Inventory-based recommendations

**Database Tables:**
- `ai_purchase_orders`
- `ai_purchase_order_items`

---

### 1.5 demand-forecasting.ts
**Path:** `server/routes/demand-forecasting.ts`
**Service:** `DemandForecastingService`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/demand-forecasting/generate` | POST | Generate forecasts |
| `/api/demand-forecasting/forecasts` | GET | Get forecasts |
| `/api/demand-forecasting/accuracy` | GET | Get accuracy metrics |
| `/api/demand-forecasting/patterns` | GET | Get seasonal patterns |

**Core Functionality:**
- Demand prediction and forecasting
- Seasonal pattern detection
- Forecast accuracy tracking

**Database Tables:**
- `demand_forecasts`
- `seasonal_patterns`
- `forecast_accuracy_metrics`

---

### 1.6 ai-ml.ts
**Path:** `server/routes/ai-ml.ts`
**Services:** Multiple (ClinicalDecisionSupport, PredictiveAnalytics, NLPImageAnalysis, MLModelManagement)

| Endpoint Group | Description |
|----------------|-------------|
| `/api/ai-ml/drugs/*` | Drug search, interactions, allergies |
| `/api/ai-ml/guidelines/*` | Clinical guidelines, recommendations |
| `/api/ai-ml/treatment-recommendations` | Generate treatment plans |
| `/api/ai-ml/diagnostic-suggestions` | Diagnostic assistance |
| `/api/ai-ml/risk-scores/*` | Patient risk scoring |
| `/api/ai-ml/predictions/*` | Health predictions |
| `/api/ai-ml/image-analysis/*` | Image/OCR processing |
| `/api/ai-ml/models/*` | ML model lifecycle |
| `/api/ai-ml/deployments/*` | Model deployment management |

**Core Functionality:**
- Clinical decision support
- Drug interaction checking
- Risk scoring and predictions
- Image/OCR analysis
- ML model management

**Database Tables:**
- `drugs`, `drug_interactions`
- `clinical_guidelines`, `clinical_alerts`
- `treatment_recommendations`, `diagnostic_suggestions`
- `risk_scores`, `predictive_analyses`
- `ml_models`, `ml_model_versions`, `model_deployments`

---

### 1.7 ophthalamicAI.ts
**Path:** `server/routes/ophthalamicAI.ts`
**Service:** `OphthalamicAIService`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ophthalmic-ai/query` | POST | General ophthalmic queries |
| `/api/ophthalmic-ai/lens-recommendations` | POST | Lens recommendations |
| `/api/ophthalmic-ai/contact-lens-recommendations` | POST | Contact lens recs |
| `/api/ophthalmic-ai/explain-prescription` | POST | Prescription explanation |
| `/api/ophthalmic-ai/nhs-guidance` | POST | NHS-specific guidance |
| `/api/ophthalmic-ai/business-insights` | POST | Practice insights |

**Core Functionality:**
- Ophthalmic-specific AI queries
- Lens recommendation engine (Good/Better/Best)
- Prescription explanations
- NHS guidance integration
- Business intelligence

---

## 2. AI Services

### 2.1 Core Services

| Service | File | Description |
|---------|------|-------------|
| `MasterAIService` | `MasterAIService.ts` | Unified tenant intelligence (consolidates multiple services) |
| `PlatformAIService` | `PlatformAIService.ts` | Proactive insights, alerts, quick actions |
| `OphthalamicAIService` | `OphthalamicAIService.ts` | Ophthalmic-specific AI |
| `ExternalAIService` | `ExternalAIService.ts` | External AI provider abstraction (OpenAI, Anthropic, Ollama) |
| `AIAssistantService` | `AIAssistantService.ts` | Chat and learning capabilities |
| `AIDataAccess` | `AIDataAccess.ts` | Database tools for AI queries |

### 2.2 AI-ML Services

| Service | File | Description |
|---------|------|-------------|
| `ClinicalDecisionSupportService` | `ai-ml/ClinicalDecisionSupportService.ts` | Drug interactions, guidelines |
| `PredictiveAnalyticsService` | `ai-ml/PredictiveAnalyticsService.ts` | Risk scores, predictions |
| `NLPImageAnalysisService` | `ai-ml/NLPImageAnalysisService.ts` | OCR and image analysis |
| `MLModelManagementService` | `ai-ml/MLModelManagementService.ts` | Model lifecycle |

### 2.3 Specialized Services

| Service | File | Description |
|---------|------|-------------|
| `DemandForecastingService` | `DemandForecastingService.ts` | Demand prediction |
| `AutonomousPurchasingService` | `AutonomousPurchasingService.ts` | Auto PO generation |
| `ProactiveInsightsService` | `ProactiveInsightsService.ts` | Insight generation |
| `ForecastingAI` | `ai/ForecastingAI.ts` | Forecasting engine |

---

## 3. Overlap Analysis

### 3.1 Duplicate Functionality

| Capability | Found In | Recommendation |
|------------|----------|----------------|
| Chat/Query | MasterAI, PlatformAI, OphthalamicAI | Consolidate to UnifiedAI |
| Insights | PlatformAI, ProactiveInsights | Merge into UnifiedAI |
| Conversation History | MasterAI, PlatformAI | Single conversation store |
| Context Extraction | All routes (getUserInfo duplicated) | Use tenant context middleware |
| External AI Calls | ExternalAI used by multiple services | Single provider abstraction |

### 3.2 Service Dependencies

```
MasterAIService
├── ExternalAIService
├── AIDataAccess
├── PythonRAGService
└── storage

PlatformAIService
├── ExternalAIService
└── storage

OphthalamicAIService
├── ExternalAIService
└── storage

ai-ml services
└── storage (direct DB access)
```

---

## 4. Consolidation Recommendations

### 4.1 Unified AI Service Architecture

```
UnifiedAIService
├── Chat Module (from MasterAI, PlatformAI, OphthalamicAI)
├── Insights Module (from ProactiveInsights, PlatformAI)
├── Predictions Module (from DemandForecasting, PredictiveAnalytics)
├── Actions Module (from AutonomousPurchasing)
├── Clinical Module (from ClinicalDecisionSupport)
└── Tools Module (from AIDataAccess)
```

### 4.2 Unified Route Structure

```
/api/ai/
├── /chat                 - Conversational interface
├── /conversations        - Conversation management
├── /briefing            - Daily insights briefing
├── /predictions/:type   - Demand/stockout/staffing
├── /actions             - Execute autonomous actions
├── /quick-actions       - Suggested actions
├── /feedback            - AI feedback submission
├── /clinical/           - Clinical decision support
│   ├── /drugs
│   ├── /guidelines
│   └── /recommendations
└── /models/             - ML model management
```

### 4.3 Deprecation Plan

| Current Route | Status | Unified Route |
|---------------|--------|---------------|
| `/api/master-ai/*` | Deprecate | `/api/ai/*` |
| `/api/platform-ai/*` | Deprecate | `/api/ai/*` |
| `/api/ophthalmic-ai/*` | Deprecate | `/api/ai/*` |
| `/api/ai-notifications/*` | Deprecate | `/api/ai/notifications/*` |
| `/api/ai-purchase-orders/*` | Deprecate | `/api/ai/actions/*` |
| `/api/demand-forecasting/*` | Deprecate | `/api/ai/predictions/*` |
| `/api/ai-ml/*` | Keep (clinical domain) | `/api/ai/clinical/*` |

---

## 5. Database Table Usage

### Tables by AI Route

| Table | Routes Using |
|-------|-------------|
| `ai_conversations` | master-ai |
| `ai_messages` | master-ai |
| `ai_knowledge_base` | master-ai |
| `ai_learning_data` | master-ai |
| `ai_notifications` | ai-notifications |
| `ai_purchase_orders` | ai-purchase-orders |
| `ai_purchase_order_items` | ai-purchase-orders |
| `demand_forecasts` | demand-forecasting |
| `seasonal_patterns` | demand-forecasting |
| `drugs` | ai-ml |
| `drug_interactions` | ai-ml |
| `clinical_guidelines` | ai-ml |
| `ml_models` | ai-ml |

---

## 6. External AI Provider Usage

### Current Providers

| Provider | Service | Configuration |
|----------|---------|---------------|
| OpenAI | ExternalAIService | `OPENAI_API_KEY` |
| Anthropic | ExternalAIService | `ANTHROPIC_API_KEY` |
| Ollama | ExternalAIService | `OLLAMA_BASE_URL` |

### Recommended: Anthropic-First

Given the codebase uses `@anthropic-ai/sdk`, recommend:
1. Primary: Anthropic Claude for all AI operations
2. Fallback: OpenAI for specific use cases
3. Remove: Ollama dependency (not production-ready)

---

## 7. Implementation Priority

### Phase 1: Core Unification
1. Create `UnifiedAIService` with chat module
2. Create `ToolRegistry` for database operations
3. Create unified `/api/ai/*` routes

### Phase 2: Feature Migration
1. Migrate insights from ProactiveInsights
2. Migrate predictions from DemandForecasting
3. Migrate actions from AutonomousPurchasing

### Phase 3: Deprecation
1. Add deprecation headers to old routes
2. Set 30-day sunset period
3. Update client code to use new routes

### Phase 4: Cleanup
1. Remove deprecated routes
2. Remove unused services
3. Consolidate AI database tables

---

## 8. Security Considerations

### Current Issues
1. `getUserInfo` duplicated across routes - inconsistent tenant handling
2. Direct DB queries without tenant middleware
3. Missing rate limiting on some AI endpoints

### Recommended Security
1. Use `setTenantContext` middleware for all AI routes
2. Apply `aiQueryLimiter` to all AI endpoints
3. Audit log all AI queries with PHI access
4. Implement AI query quotas per company

---

## 9. Migration Guide

### Sunset Schedule

All legacy AI routes are deprecated and will be removed after **March 1, 2025**.

| Legacy Route | New Route | Sunset Date |
|--------------|-----------|-------------|
| `/api/master-ai/*` | `/api/ai/chat`, `/api/ai/conversations` | 2025-03-01 |
| `/api/platform-ai/*` | `/api/ai/*` | 2025-03-01 |
| `/api/ai-notifications/*` | `/api/ai/briefing` | 2025-03-01 |
| `/api/ai-purchase-orders/*` | `/api/ai/actions` | 2025-03-01 |
| `/api/demand-forecasting/*` | `/api/ai/predictions/demand` | 2025-03-01 |
| `/api/ai-ml/*` | `/api/ai/clinical/*` | 2025-03-01 |
| `/api/ophthalmic-ai/*` | `/api/ai/chat` | 2025-03-01 |

### Deprecation Headers

Legacy routes return these HTTP headers:
- `Deprecation: true`
- `Sunset: <ISO date>`
- `Link: <new-route>; rel="successor-version"`
- `Warning: 299 - "This AI endpoint is deprecated..."`

### Migration Steps

#### Step 1: Chat & Conversations

**Before (master-ai):**
```typescript
// POST /api/master-ai/chat
fetch('/api/master-ai/chat', {
  method: 'POST',
  body: JSON.stringify({ query: 'What are progressive lenses?' })
});

// GET /api/master-ai/conversations
fetch('/api/master-ai/conversations');
```

**After (unified):**
```typescript
// POST /api/ai/chat
fetch('/api/ai/chat', {
  method: 'POST',
  body: JSON.stringify({ message: 'What are progressive lenses?' })
});

// GET /api/ai/conversations
fetch('/api/ai/conversations');
```

#### Step 2: Insights & Briefing

**Before (ai-notifications):**
```typescript
// GET /api/ai-notifications
fetch('/api/ai-notifications');
```

**After (unified):**
```typescript
// GET /api/ai/briefing
fetch('/api/ai/briefing');
```

#### Step 3: Autonomous Actions

**Before (ai-purchase-orders):**
```typescript
// GET /api/ai-purchase-orders
fetch('/api/ai-purchase-orders');

// POST /api/ai-purchase-orders/:id/approve
fetch('/api/ai-purchase-orders/po-123/approve', { method: 'POST' });
```

**After (unified):**
```typescript
// POST /api/ai/actions
fetch('/api/ai/actions', {
  method: 'POST',
  body: JSON.stringify({
    type: 'create_purchase_order',
    params: { ... }
  })
});
```

#### Step 4: Predictions

**Before (demand-forecasting):**
```typescript
// POST /api/demand-forecasting/generate
fetch('/api/demand-forecasting/generate', {
  method: 'POST',
  body: JSON.stringify({ productIds: [...] })
});
```

**After (unified):**
```typescript
// GET /api/ai/predictions/demand
fetch('/api/ai/predictions/demand');
```

#### Step 5: Clinical Decision Support

**Before (ai-ml):**
```typescript
// GET /api/ai-ml/drugs?query=aspirin
fetch('/api/ai-ml/drugs?query=aspirin');

// POST /api/ai-ml/drugs/interactions
fetch('/api/ai-ml/drugs/interactions', {
  method: 'POST',
  body: JSON.stringify({ drugIds: ['drug-1', 'drug-2'] })
});
```

**After (unified):**
```typescript
// GET /api/ai/clinical/drugs?query=aspirin
fetch('/api/ai/clinical/drugs?query=aspirin');

// POST /api/ai/clinical/drugs/interactions
fetch('/api/ai/clinical/drugs/interactions', {
  method: 'POST',
  body: JSON.stringify({ drugIds: ['drug-1', 'drug-2'] })
});
```

### Response Format Changes

The unified API uses a consistent response format:

```typescript
// Success response
{
  success: true,
  data: { ... }
}

// Error response
{
  success: false,
  error: "Error message",
  details?: [...]
}
```

### Rate Limiting

All `/api/ai/*` routes are subject to rate limiting via `aiQueryLimiter`:
- Default: 60 requests per minute per user
- Burst: 10 requests per second

### Authentication

All `/api/ai/*` routes require authentication via the `secureRoute()` middleware chain:
- Valid JWT token required
- Tenant context automatically set
- User context enriched after authentication

---

*This analysis provides the foundation for AI service consolidation in Phase 2.*
