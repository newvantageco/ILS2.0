# AI Services Audit & Consolidation Plan

## Current AI Services (7 Different Services!)

### 1. **AIService** (`/server/services/aiService.ts`)
**Purpose:** Client for Python FastAPI AI service (RAG)
- Connects to `http://localhost:8080` Python service
- Handles JWT authentication for tenant isolation
- Methods:
  - `queryOphthalmicKnowledge()` - Queries fine-tuned LLM
  - `querySales()` - RAG queries for sales data
  - `queryInventory()` - RAG queries for inventory
  - `queryPatientAnalytics()` - Anonymized patient data queries
- **Used by:** `/server/routes/ai.ts`
- **Status:** ⚠️ Requires Python service running on port 8080

### 2. **ExternalAIService** (`/server/services/ExternalAIService.ts`)
**Purpose:** OpenAI & Anthropic integration
- Connects to OpenAI GPT-4, GPT-3.5-turbo
- Connects to Anthropic Claude 3 (Opus, Sonnet, Haiku)
- Supports function calling/tools (just added)
- Automatic fallback between providers
- Token usage tracking and cost estimation
- **Used by:** AIAssistantService, ProprietaryAIService
- **Status:** ✅ Working - needs API keys

### 3. **AIAssistantService** (`/server/services/AIAssistantService.ts`)
**Purpose:** Progressive learning AI assistant
- Company-specific AI that learns over time
- Stores learned knowledge in database
- Reduces reliance on external AI as it learns
- Document processing and knowledge extraction
- Neural network training (optional)
- Conversation management
- **Used by:** `/server/routes/aiAssistant.ts`
- **Status:** ✅ Working - but not using tools yet

### 4. **ProprietaryAIService** (`/server/services/ProprietaryAIService.ts`)
**Purpose:** Domain-specific AI (Optometry & Spectacle Dispensing only)
- Topic validation (rejects off-topic questions)
- Optometry/eye care focused responses
- Keyword filtering for relevant topics
- Progressive learning from external AI
- Company-specific knowledge isolation
- **Used by:** `/server/routes/proprietaryAi.ts`
- **Status:** ✅ Working

### 5. **AIToolsService** (`/server/services/AITools.ts`)
**Purpose:** Tool definitions and execution for function calling
- Defines available tools (search_patients, check_inventory, etc.)
- Executes tool calls from AI
- **Status:** ⚠️ Just created - has compilation errors, not integrated yet

### 6. **AiEngineSynapse** (`/server/services/aiEngine/aiEngineSynapse.ts`)
**Purpose:** AI engine coordinator
- NLP processing
- ECP catalog integration
- LIMS integration
- **Used by:** `/server/routes/aiEngine.ts`
- **Status:** ❓ Need to check usage

### 7. **ForecastingAI** (`/server/services/ai/ForecastingAI.ts`)
**Purpose:** Demand forecasting and predictions
- Sales forecasting
- Inventory predictions
- **Used by:** `/server/routes/aiIntelligence.ts`
- **Status:** ✅ Specialized purpose

---

## The Problem: Confusion & Overlap

### Overlapping Functionality

1. **Three ways to query AI:**
   - `AIService` → Python FastAPI → LLaMA model
   - `ExternalAIService` → OpenAI/Claude
   - `ProprietaryAIService` → OpenAI/Claude with domain filtering

2. **Two learning systems:**
   - `AIAssistantService` - Progressive learning
   - `ProprietaryAIService` - Progressive learning with topic filtering

3. **Multiple entry points:**
   - `/api/ai/query` → AIService (RAG)
   - `/api/ai-assistant/ask` → AIAssistantService
   - `/api/proprietary-ai/ask` → ProprietaryAIService

### Data Access Issues

- **AIService** queries Python service which has RAG database access
- **AIAssistantService** queries external AI but no database access
- **ProprietaryAIService** queries external AI but no database access
- **None** are using the new function calling/tools I just added!

---

## Recommended Architecture: Unified AI Stack

### Layer 1: Foundation Services (Keep Separate)
```
┌─────────────────────────────────────────────────────────┐
│  ExternalAIService                                      │
│  - OpenAI/Anthropic API clients                        │
│  - Function calling support                             │
│  - Token tracking                                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  AIService (Python Client)                              │
│  - RAG queries to Python service                        │
│  - Fine-tuned model access                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ForecastingAI                                          │
│  - Specialized forecasting/predictions                  │
└─────────────────────────────────────────────────────────┘
```

### Layer 2: Unified AI Assistant (Merge These!)
```
┌─────────────────────────────────────────────────────────┐
│  UnifiedAIAssistant                                     │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 1. Topic Validation (from ProprietaryAI)         │ │
│  │    - Optometry/eye care only                     │ │
│  │    - Reject off-topic questions                  │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 2. Query Router                                   │ │
│  │    ├─→ Python RAG (AIService) for knowledge     │ │
│  │    ├─→ External AI with Tools for data queries  │ │
│  │    └─→ Learned knowledge from database          │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 3. Tool Execution                                 │ │
│  │    - get_patient_info                            │ │
│  │    - check_inventory                             │ │
│  │    - get_sales_data                              │ │
│  │    - search_orders                               │ │
│  │    - get_examination_records                     │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 4. Learning System                               │ │
│  │    - Store successful Q&A pairs                  │ │
│  │    - Document processing                         │ │
│  │    - Progressive autonomy                        │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 5. Conversation Management                       │ │
│  │    - Thread tracking                             │ │
│  │    - Context preservation                        │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Layer 3: Single API Endpoint
```
POST /api/ai/chat
{
  "message": "What patients need follow-up?",
  "conversationId": "optional-uuid",
  "context": {}
}

Response:
{
  "answer": "Here are 3 patients needing follow-up...",
  "sources": [
    { "type": "database", "tool": "get_patient_info" },
    { "type": "learned_knowledge", "confidence": 0.95 }
  ],
  "usedTools": ["get_patient_info"],
  "confidence": 0.92,
  "conversationId": "uuid"
}
```

---

## Step-by-Step Consolidation Plan

### Phase 1: Create Unified Service (1-2 hours)

1. **Create `/server/services/UnifiedAIService.ts`**
   - Merge best parts of AIAssistantService + ProprietaryAIService
   - Add topic validation from ProprietaryAI
   - Add learning system from AIAssistant
   - Integrate ExternalAIService with tools
   - Integrate AIService (Python RAG) for knowledge queries

2. **Implement Smart Query Router**
```typescript
async processQuery(query: string, companyId: string) {
  // 1. Validate topic
  const topicCheck = this.validateTopic(query);
  if (!topicCheck.isRelevant) {
    return this.rejectOffTopic(topicCheck.reason);
  }

  // 2. Check learned knowledge first
  const learned = await this.searchLearnedKnowledge(query, companyId);
  if (learned.confidence > 0.8) {
    return this.generateFromLearned(learned);
  }

  // 3. Determine query type
  const queryType = this.classifyQuery(query);
  
  // 4. Route to appropriate service
  switch (queryType) {
    case 'knowledge':
      // Use Python RAG service (fine-tuned model)
      return await this.aiService.queryOphthalmicKnowledge(query);
    
    case 'data':
      // Use External AI with tools (database queries)
      return await this.queryWithTools(query, companyId);
    
    case 'hybrid':
      // Combine both approaches
      const knowledge = await this.aiService.queryOphthalmicKnowledge(query);
      const data = await this.queryWithTools(query, companyId);
      return this.mergeResponses(knowledge, data);
  }
}
```

3. **Add Tool Execution**
```typescript
private async queryWithTools(query: string, companyId: string) {
  const tools = this.externalAI.getAvailableTools();
  
  const onToolCall = async (toolName: string, args: any) => {
    // Execute database queries
    return await this.executeToolCall(toolName, args, companyId);
  };

  const messages = [
    { role: 'system', content: this.buildSystemPrompt() },
    { role: 'user', content: query }
  ];

  return await this.externalAI.generateResponse(messages, {
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    tools,
    onToolCall
  });
}
```

### Phase 2: Update Routes (30 mins)

**Consolidate into single route:**
```typescript
// /server/routes/ai.ts
import { UnifiedAIService } from '../services/UnifiedAIService';

app.post('/api/ai/chat', isAuthenticated, async (req, res) => {
  const { message, conversationId, context } = req.body;
  const user = await getAuthenticatedUser(req);
  
  const aiService = new UnifiedAIService(storage);
  
  const response = await aiService.processQuery(
    message,
    user.companyId,
    {
      userId: user.id,
      conversationId,
      context
    }
  );
  
  res.json(response);
});
```

**Mark old routes as deprecated:**
- `/api/ai/query` → Redirect to `/api/ai/chat`
- `/api/ai-assistant/ask` → Redirect to `/api/ai/chat`
- `/api/proprietary-ai/ask` → Redirect to `/api/ai/chat`

### Phase 3: Update Frontend (15 mins)

**Single API call in `AIAssistant.tsx`:**
```typescript
const handleSendQuery = async () => {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message: inputQuery,
      conversationId: currentConversationId,
      context: {}
    })
  });
  
  const data = await response.json();
  // Display answer, sources, tools used, etc.
};
```

---

## Benefits of Consolidation

### Before (Current State)
- ❌ 7 different AI services with overlapping functionality
- ❌ 3 different API endpoints for asking questions
- ❌ AI can't access database (only Python service can)
- ❌ Confusion about which service to use
- ❌ Duplicate code for learning, conversations, validation
- ❌ No function calling integration

### After (Unified)
- ✅ 1 unified AI service with clear architecture
- ✅ 1 API endpoint: `/api/ai/chat`
- ✅ AI can access database through tools
- ✅ Python RAG for knowledge, External AI for data
- ✅ Automatic topic validation
- ✅ Progressive learning system
- ✅ Full function calling support
- ✅ Better conversation management
- ✅ Clear source attribution

---

## Migration Checklist

### Immediate (Do Now)
- [ ] Create `UnifiedAIService.ts` with merged functionality
- [ ] Fix AITools.ts compilation errors
- [ ] Add tool execution methods
- [ ] Test with simple queries

### Short Term (This Week)
- [ ] Update frontend to use `/api/ai/chat`
- [ ] Deprecate old endpoints (keep for backward compatibility)
- [ ] Add comprehensive logging
- [ ] Monitor token usage across all services

### Long Term (Next Sprint)
- [ ] Remove deprecated endpoints
- [ ] Delete redundant services
- [ ] Optimize Python service usage
- [ ] Add advanced analytics

---

## Service Roles After Consolidation

### Keep & Use
1. **UnifiedAIService** (New) - Main AI interface
2. **ExternalAIService** - OpenAI/Claude client with tools
3. **AIService** - Python RAG client (knowledge queries)
4. **ForecastingAI** - Specialized forecasting

### Archive/Remove
1. ~~AIAssistantService~~ - Merged into UnifiedAI
2. ~~ProprietaryAIService~~ - Merged into UnifiedAI
3. ~~AIToolsService~~ - Integrated into UnifiedAI

---

## Query Flow Examples

### Example 1: Knowledge Question
**Q:** "What are progressive lenses?"
```
User → UnifiedAI
  → validateTopic() ✓ (optometry-related)
  → classifyQuery() → "knowledge"
  → AIService (Python)
    → Fine-tuned LLaMA model
    → "Progressive lenses are multifocal lenses that..."
  → Store in learned knowledge
  → Return answer
```

### Example 2: Data Question
**Q:** "Show me patients who need follow-up"
```
User → UnifiedAI
  → validateTopic() ✓ (patient data)
  → classifyQuery() → "data"
  → ExternalAI with tools
    → AI decides to call: get_patient_info({ needsFollowUp: true })
    → Tool executes: storage.getCustomers({ companyId, followUpNeeded: true })
    → Returns: [{patient data}]
    → AI formats response naturally
  → Store in conversation
  → Return answer
```

### Example 3: Hybrid Question
**Q:** "What lens type should I recommend for a 45-year-old office worker?"
```
User → UnifiedAI
  → validateTopic() ✓ (optometry + product recommendation)
  → classifyQuery() → "hybrid"
  → AIService (knowledge about lens types)
  → ExternalAI with tools (check available inventory)
  → Merge responses
  → Return comprehensive recommendation
```

---

## Next Steps

1. **Review this document**
2. **Decide on approach:**
   - Option A: Full consolidation (recommended)
   - Option B: Keep separate but clarify roles
3. **If consolidating:**
   - I'll create UnifiedAIService.ts
   - Fix tool integration
   - Update routes
   - Test thoroughly
4. **Document the final architecture**

**Estimated Time:** 3-4 hours for full consolidation  
**Impact:** High - Will eliminate confusion and unlock full AI capabilities
