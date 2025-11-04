# Quick Migration Guide - AI Consolidation

## For Frontend/API Consumers

### Master AI (Chat & Assistance)

**OLD ENDPOINTS (DEPRECATED):**
```
POST /api/ai/chat
POST /api/ai-assistant/query  
POST /api/unified-ai/process
GET  /api/ai-assistant/conversations
```

**NEW ENDPOINT (USE THIS):**
```typescript
// Main chat interface
POST /api/master-ai/chat
{
  "query": "Show me all patients with progressive lenses",
  "conversationId": "optional_conv_id",
  "context": {}
}

// Get conversations
GET /api/master-ai/conversations

// Get specific conversation
GET /api/master-ai/conversations/:id

// Upload document to knowledge base
POST /api/master-ai/documents
{
  "fileName": "pricing-guide.pdf",
  "content": "base64 or text content",
  "metadata": { "category": "pricing" }
}

// Get knowledge base
GET /api/master-ai/knowledge-base

// Get usage statistics  
GET /api/master-ai/stats

// Submit feedback
POST /api/master-ai/feedback
{
  "messageId": "msg_123",
  "rating": 5,
  "feedback": "Very helpful!"
}
```

### Platform AI (Analytics & Predictions)

**OLD ENDPOINTS (DEPRECATED):**
```
GET /api/ai-insights/sales
GET /api/ai-insights/inventory
GET /api/ai-insights/bookings
```

**NEW ENDPOINTS (USE THESE):**
```typescript
// Sales trend analysis & 7-day forecasting
GET /api/platform-ai/sales?startDate=2025-01-01&endDate=2025-01-31&companyId=xxx

// Inventory performance & optimization alerts
GET /api/platform-ai/inventory?startDate=2025-01-01&endDate=2025-01-31&companyId=xxx

// Booking pattern analysis & utilization
GET /api/platform-ai/bookings?startDate=2025-01-01&endDate=2025-01-31&companyId=xxx

// Comparative benchmarking (0-100 scoring)
GET /api/platform-ai/comparative?startDate=2025-01-01&endDate=2025-01-31&companyId=xxx

// Comprehensive insights (all areas combined)
GET /api/platform-ai/comprehensive?startDate=2025-01-01&endDate=2025-01-31&companyId=xxx

// Clear cache (admin only)
POST /api/platform-ai/clear-cache

// Platform-wide summary (admin only)
GET /api/platform-ai/platform-summary?startDate=2025-01-01&endDate=2025-01-31
```

## Quick Find & Replace

**In your codebase, run these find/replace operations:**

1. **Replace AI Insights endpoints:**
   ```
   Find:    /api/ai-insights/
   Replace: /api/platform-ai/
   ```

2. **Replace unified AI endpoints:**
   ```
   Find:    /api/ai/chat
   Replace: /api/master-ai/chat
   ```

3. **Replace assistant endpoints:**
   ```
   Find:    /api/ai-assistant/
   Replace: /api/master-ai/
   ```

4. **Update service imports:**
   ```typescript
   // OLD
   import { AIInsightsService } from '../services/AIInsightsService';
   
   // NEW
   import { PlatformAIService } from '../services/PlatformAIService';
   ```

5. **Update route imports:**
   ```typescript
   // OLD
   import { registerAIInsightsRoutes } from './routes/ai-insights';
   
   // NEW
   import { registerPlatformAIRoutes } from './routes/platform-ai';
   ```

## Response Format Changes

### Master AI Response Format:

```typescript
interface MasterAIResponse {
  answer: string;                    // The AI's response text
  conversationId: string;            // Conversation ID for context
  sources: Array<{                   // Where the answer came from
    type: 'python_rag' | 'external_ai' | 'learned_knowledge' | 'database_tool' | 'company_document';
    reference?: string;
    toolName?: string;
    confidence?: number;
  }>;
  toolsUsed: string[];               // Which tools were executed
  confidence: number;                // 0-1 confidence score
  isRelevant: boolean;               // Is this an optometry question?
  rejectionReason?: string;          // Why rejected (if off-topic)
  suggestions?: string[];            // Suggested questions
  metadata: {
    tokensUsed?: number;
    responseTime: number;
    queryType: 'knowledge' | 'data' | 'hybrid' | 'learned';
    learningProgress: number;        // 0-100 company learning %
    usedExternalAI: boolean;         // Did we use OpenAI/Claude?
  };
}
```

### Platform AI Response Format:

Response formats are **UNCHANGED** - same structure as before, just new endpoint paths.

## Testing Your Updates

### 1. Test Master AI:
```bash
# Test chat endpoint
curl -X POST http://localhost:5000/api/master-ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "What is myopia?"
  }'

# Test off-topic rejection
curl -X POST http://localhost:5000/api/master-ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "What is the weather today?"
  }'

# Should return: isRelevant: false, rejectionReason: "off-topic"
```

### 2. Test Platform AI:
```bash
# Test sales insights
curl "http://localhost:5000/api/platform-ai/sales?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test inventory analysis
curl "http://localhost:5000/api/platform-ai/inventory?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Frontend Component Updates

### React Example:

**OLD:**
```typescript
// OLD - Multiple AI services
const chatWithAI = async (message: string) => {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  return response.json();
};

const getInsights = async (startDate: string, endDate: string) => {
  const response = await fetch(
    `/api/ai-insights/sales?startDate=${startDate}&endDate=${endDate}`
  );
  return response.json();
};
```

**NEW:**
```typescript
// NEW - Unified Master AI
const chatWithMasterAI = async (query: string, conversationId?: string) => {
  const response = await fetch('/api/master-ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      query,
      conversationId,
      context: {}
    })
  });
  return response.json();
};

// NEW - Platform AI (just path change)
const getPlatformInsights = async (startDate: string, endDate: string) => {
  const response = await fetch(
    `/api/platform-ai/sales?startDate=${startDate}&endDate=${endDate}`
  );
  return response.json();
};
```

## Breaking Changes

### 1. Master AI Query Field:
- **OLD:** `message` field
- **NEW:** `query` field
- **Action:** Update request bodies from `{ message: "..." }` to `{ query: "..." }`

### 2. Conversation ID Field:
- **OLD:** May have been optional or named differently
- **NEW:** `conversationId` is consistently used
- **Action:** Update to use `conversationId` field

### 3. Response Metadata:
- **NEW:** Added `learningProgress`, `queryType`, `usedExternalAI` fields
- **Action:** Update TypeScript interfaces if using typed responses

### 4. Error Responses:
- **Consistent Format:** All endpoints now return consistent error format:
  ```json
  {
    "error": "Error category",
    "message": "Detailed error message"
  }
  ```

## Rollback Plan

If issues arise, you can temporarily rollback by:

1. **Revert routes.ts changes** - restore old route registrations
2. **Keep old service files** - don't delete until fully validated
3. **Use feature flags** - toggle between old/new endpoints

**NOTE:** We recommend **NOT** rolling back. The new system is cleaner and fully functional. Address issues as they arise rather than reverting.

## Support

### Common Issues:

**Issue:** "Cannot find module 'server/routes/master-ai'"  
**Solution:** Make sure file was created: `server/routes/master-ai.ts`

**Issue:** "Property 'query' does not exist"  
**Solution:** Update request body from `message` to `query`

**Issue:** "401 Unauthorized"  
**Solution:** Ensure authentication token is included in headers

**Issue:** "Invalid date format"  
**Solution:** Use ISO 8601 format: `YYYY-MM-DD`

### Need Help?

1. Check `AI_CONSOLIDATION_IMPLEMENTATION_COMPLETE.md` for full details
2. Check `AI_CONSOLIDATION_STRATEGY.md` for technical architecture
3. Test endpoints using Postman or curl
4. Check server logs for detailed error messages

## Timeline

- **Implementation:** ✅ COMPLETE
- **Frontend Migration:** Start immediately
- **Testing Phase:** 1-2 days
- **Production Deployment:** After testing passes
- **Old Endpoint Deprecation:** 30 days after deployment

## Files Modified

**New Files Created:**
- `server/services/MasterAIService.ts` (1,050 lines)
- `server/routes/master-ai.ts` (280 lines)
- `AI_CONSOLIDATION_IMPLEMENTATION_COMPLETE.md`
- `AI_CONSOLIDATION_QUICK_MIGRATION.md` (this file)

**Files Renamed:**
- `server/services/AIInsightsService.ts` → `server/services/PlatformAIService.ts`
- `server/routes/ai-insights.ts` → `server/routes/platform-ai.ts`

**Files Modified:**
- `server/routes.ts` (updated route registrations)

**Files Ready for Deprecation (after testing):**
- `server/services/AIAssistantService.ts`
- `server/services/UnifiedAIService.ts`
- `server/services/ProprietaryAIService.ts`
- `server/routes/aiEngine.ts`
- `server/routes/aiIntelligence.ts`
- `server/routes/aiAssistant.ts`
- `server/routes/unified-ai.ts`
- `server/routes/masterAi.ts`
- `server/routes/proprietaryAi.ts`

---

**Questions?** Check the full documentation or test the endpoints directly!
