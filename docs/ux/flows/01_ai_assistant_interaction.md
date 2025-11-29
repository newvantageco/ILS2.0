# User Flow: AI Assistant Interaction

**Flow ID:** 01  
**Priority:** 🔴 CRITICAL  
**Status:** ❌ BROKEN - "Failed to fetch learning progress" error  
**Last Updated:** November 29, 2025

---

## Flow Overview

### User Roles:
- All authenticated users (ECP, Lab, Dispenser, Supplier, Admin)

### Entry Points:
1. Click "AI Assistant" button in dashboard
2. Navigate to `/ai-assistant` route
3. Use keyboard shortcut (if implemented)

### Main Objective:
User successfully interacts with AI Assistant to get business insights and answers

### Success Criteria:
- ✅ AI Assistant interface loads
- ✅ Learning progress displays
- ✅ User can ask questions
- ✅ AI responds with relevant answers
- ✅ Conversation history saved

---

## Current Issue (CRITICAL BUG)

### Error Message:
```
failed to load AI Assistant
500: {"message":"Failed to fetch learning progress"}
Retry
```

### Root Cause Analysis:
1. **Migration failure**: Database migration 0002 failed due to enum conflicts
2. **Missing column**: `ai_knowledge_base.embedding` column not created
3. **Table access issue**: Possible missing tables or permissions
4. **Query failure**: `getAiLearningProgress()` throwing error

### Impact:
- **Severity**: HIGH - Blocks entire AI Assistant feature
- **Affected users**: ALL users
- **Revenue impact**: Potential loss of AI-driven insights value proposition

---

## Prerequisites

### Required Permissions:
- User must be authenticated
- User must belong to a company (`companyId` required)

### Required Data:
- Valid session/auth token
- Company record in database
- `ai_knowledge_base` table exists
- `ai_learning_data` table exists

### System State:
- Database migrations completed successfully
- Vector extension (pgvector) installed
- External AI service available (optional)

---

## Main Path (Happy Path) ✅

```
┌─────────────────┐
│  User Dashboard │
└────────┬────────┘
         │
         ↓ Click "AI Assistant"
         │
    ┌────┴────┐
    │ Loading │ Show spinner
    └────┬────┘
         │
         ↓ Fetch learning progress
         │
    ((API CALL))
    GET /api/ai-assistant/learning-progress
         │
         ├─── 200 OK ────────────────────┐
         │                                ↓
         │                      ┌──────────────────┐
         │                      │  Display Stats   │
         │                      │  - Progress: 45% │
         │                      │  - Documents: 12 │
         │                      │  - Learning: 45  │
         │                      └────────┬─────────┘
         │                               │
         ↓                               ↓
┌─────────────────────┐         ┌──────────────────┐
│ AI Assistant Ready  │←────────│  Chat Interface  │
│                     │         │  - Input field   │
│ - Welcome message   │         │  - Send button   │
│ - Suggested queries │         │  - History       │
│ - Recent convos     │         └────────┬─────────┘
└─────────────────────┘                  │
                                         ↓
                              User types question
                                         │
                                         ↓
                                 ((API CALL))
                          POST /api/ai-assistant/ask
                                    {
                                      question: "...",
                                      conversationId: "..."
                                    }
                                         │
                                         ↓
                              ┌──────────────────┐
                              │  AI Processes    │
                              │  - Search docs   │
                              │  - Query LLM     │
                              │  - Generate ans  │
                              └────────┬─────────┘
                                       │
                                       ↓
                              ┌──────────────────┐
                              │  Display Answer  │ 🟢 SUCCESS
                              │  - Response      │
                              │  - Sources       │
                              │  - Confidence    │
                              │  - Follow-ups    │
                              └──────────────────┘
```

### Steps:
1. User clicks "AI Assistant" button
2. Frontend routes to `/ai-assistant`
3. Component mounts, shows loading spinner
4. **API Call 1:** `GET /api/ai-assistant/learning-progress`
   - Backend fetches `companyId` from user session
   - Calls `aiAssistantService.getLearningProgress(companyId)`
   - Queries `ai_learning_data` and `ai_knowledge_base` tables
   - Returns: `{ progress, totalLearning, totalDocuments, lastUpdated }`
5. Frontend displays stats and chat interface
6. User types question
7. User clicks "Send" or presses Enter
8. **API Call 2:** `POST /api/ai-assistant/ask`
   - Payload: `{ question, conversationId (optional) }`
   - Backend retrieves learning data and knowledge base
   - Searches for relevant context
   - Calls external AI (OpenAI) or uses learned data
   - Saves conversation and message to database
9. Frontend displays AI response with sources and confidence
10. Conversation continues...

---

## Alternative Paths

### Path A: First-Time User (No Learning Data)
```
Fetch progress
     ↓
Empty results (totalLearning: 0, totalDocuments: 0)
     ↓
Display "Getting Started" prompt
     ↓
Suggest uploading documents or asking first question
```

### Path B: External AI Unavailable
```
User asks question
     ↓
External AI call fails
     ↓
Fall back to learned data only
     ↓
Show reduced confidence warning
     ↓
Provide best available answer
```

### Path C: Conversation Resume
```
User has existing conversations
     ↓
Display recent conversation list
     ↓
User clicks conversation
     ↓
Load conversation history
     ↓
Continue from last message
```

---

## Error States ❌

### Error 1: Failed to Fetch Learning Progress (CURRENT BUG)

**Trigger:** Database query fails in `getLearningProgress()`

**Error Flow:**
```
GET /api/ai-assistant/learning-progress
     ↓
Backend: aiAssistantService.getLearningProgress(companyId)
     ↓
Database query: SELECT FROM ai_learning_data WHERE company_id = ?
     ↓
❌ ERROR: Table doesn't exist / Column missing / Permission denied
     ↓
Catch block: logger.error()
     ↓
Response: 500 {"message": "Failed to fetch learning progress"}
     ↓
Frontend displays error modal
```

**Recovery Path:**
```
User sees error
     ↓
Clicks "Retry" button
     ↓
Retry same API call
     ↓
If still fails: Show contact support message
```

**Fix Required:**
1. ✅ Verify `ai_knowledge_base` table exists
2. ✅ Verify `ai_learning_data` table exists
3. ✅ Run migration 0003 (idempotent fix)
4. ✅ Add `embedding` column if missing
5. ✅ Test query manually in database
6. ✅ Add graceful error handling (return empty data instead of 500)

### Error 2: Unauthorized Access

**Trigger:** User not authenticated or no `companyId`

**Error Flow:**
```
GET /api/ai-assistant/learning-progress
     ↓
Middleware: isAuthenticated checks session
     ↓
❌ No valid session
     ↓
Response: 401 {"message": "Unauthorized"}
     ↓
Frontend redirects to /login
```

### Error 3: AI Service Timeout

**Trigger:** External AI API takes too long

**Error Flow:**
```
POST /api/ai-assistant/ask
     ↓
ExternalAIService.chat()
     ↓
⏱️ Timeout after 30 seconds
     ↓
❌ Timeout error
     ↓
Response: 503 {"message": "AI service unavailable"}
     ↓
Frontend shows: "Taking longer than expected. Please try again."
```

### Error 4: Invalid Question

**Trigger:** Empty or invalid input

**Error Flow:**
```
User submits empty question
     ↓
Frontend validation fails
     ↓
Show inline error: "Please enter a question"
     ↓
Disable submit button until valid input
```

---

## API Calls & Database Operations

### API Endpoint 1: Get Learning Progress

**Route:** `GET /api/ai-assistant/learning-progress`

**Headers:**
```
Cookie: connect.sid=<session-id>
```

**Response 200:**
```json
{
  "progress": 45,
  "totalLearning": 45,
  "totalDocuments": 12,
  "lastUpdated": "2025-11-29T21:00:00.000Z"
}
```

**Response 500 (CURRENT):**
```json
{
  "message": "Failed to fetch learning progress"
}
```

**Database Queries:**
```sql
-- Query 1: Get learning data
SELECT * FROM ai_learning_data 
WHERE company_id = $1;

-- Query 2: Get knowledge base
SELECT * FROM ai_knowledge_base 
WHERE company_id = $1;

-- Both must succeed for progress calculation
```

**Performance:**
- Expected: <100ms
- Current: FAILING

### API Endpoint 2: Ask Question

**Route:** `POST /api/ai-assistant/ask`

**Headers:**
```
Cookie: connect.sid=<session-id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "question": "What are my top-selling frames this month?",
  "conversationId": "uuid-optional"
}
```

**Response 200:**
```json
{
  "answer": "Based on your sales data...",
  "confidence": 0.85,
  "usedExternalAi": true,
  "sources": [
    {
      "type": "learned",
      "reference": "sales-data-2025-11",
      "relevance": 0.92
    }
  ],
  "suggestions": [
    "Would you like to see a trend analysis?",
    "Should I forecast next month's demand?"
  ]
}
```

**Database Operations:**
1. Find or create conversation
2. Search learning data for relevant context
3. Search knowledge base for documents
4. Save message to `ai_messages` table
5. Update conversation timestamp

---

## Implementation Status

### ✅ Complete:
- [x] Authentication middleware
- [x] AI Assistant service structure
- [x] External AI integration (OpenAI)
- [x] Basic UI components
- [x] Conversation storage

### 🚧 In Progress:
- [ ] Learning progress calculation (BROKEN)
- [ ] Database schema migrations (FAILING)
- [ ] Error handling improvements

### ❌ Broken:
- [x] **Learning progress fetch** - Migration 0002 failed, tables may not exist
- [x] **Vector embeddings** - `embedding` column not created

### 📝 Planned:
- [ ] Offline mode (use cached data)
- [ ] Voice input
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

---

## Testing Checklist

### Manual Testing:
- [ ] User can access AI Assistant from dashboard
- [ ] Learning progress loads without error
- [ ] Stats display correctly
- [ ] User can ask question and receive answer
- [ ] Conversation saves and persists
- [ ] Error states display appropriate messages
- [ ] Retry button works

### Automated Testing:
```typescript
// Test: Learning progress success
it('should fetch learning progress successfully', async () => {
  const response = await request(app)
    .get('/api/ai-assistant/learning-progress')
    .set('Cookie', validSessionCookie);
  
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('progress');
  expect(response.body).toHaveProperty('totalLearning');
});

// Test: Learning progress error handling
it('should handle database errors gracefully', async () => {
  // Mock database failure
  jest.spyOn(storage, 'getAiLearningDataByCompany').mockRejectedValue(new Error('DB error'));
  
  const response = await request(app)
    .get('/api/ai-assistant/learning-progress')
    .set('Cookie', validSessionCookie);
  
  // Should NOT return 500, should return empty data or 503
  expect(response.status).not.toBe(500);
});
```

---

## Immediate Action Items

### Priority 1: Fix Database (BLOCKING)
1. ✅ Verify migrations ran successfully
2. ✅ Check if `ai_knowledge_base` table exists
3. ✅ Check if `ai_learning_data` table exists
4. ✅ Run migration 0003 (idempotent fix) on Railway
5. ✅ Verify `embedding` column added

### Priority 2: Improve Error Handling
1. Change 500 error to graceful degradation
2. Return empty data `{ progress: 0, totalLearning: 0, totalDocuments: 0 }` on error
3. Log error but don't block UI
4. Show "Getting Started" prompt instead of error modal

### Priority 3: Add Monitoring
1. Add Sentry error tracking
2. Add performance monitoring for API calls
3. Track success/failure rates
4. Alert on repeated failures

---

## Success Metrics

### Before Fix:
- ❌ Success rate: 0%
- ❌ Error rate: 100%
- ❌ User satisfaction: Low

### After Fix (Target):
- ✅ Success rate: >99%
- ✅ Error rate: <1%
- ✅ Average response time: <200ms
- ✅ User satisfaction: High
- ✅ Feature adoption: >50% of users

---

## Related Flows:
- [10. Dashboard Navigation](./10_dashboard_navigation.md)
- [09. User Authentication](./09_user_authentication.md)

## Related Code:
- Backend: `server/services/AIAssistantService.ts`
- Routes: `server/routes.ts` (lines 5175-5330)
- Database: `server/storage.ts` (getAiLearningDataByCompany, getAiKnowledgeBaseByCompany)
- Frontend: TBD (need to find component)
- Schema: `shared/schema.ts` (ai_knowledge_base, ai_learning_data)

---

**Next Steps:**
1. Deploy fix migration to Railway ✅
2. Test in production
3. Update this document with results
4. Create monitoring dashboard
