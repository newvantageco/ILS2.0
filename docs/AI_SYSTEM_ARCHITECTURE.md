# AI System Architecture & Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                              │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ AI Assistant Page (http://localhost:3000/ecp/ai-assistant)       │  │
│  │                                                                    │  │
│  │ ┌────────────┐ ┌───────────┐ ┌──────────┐ ┌─────────────────┐  │  │
│  │ │ Learning   │ │Conversations│ │  Chat    │ │ Knowledge Base  │  │  │
│  │ │ Progress   │ │  Sidebar   │ │Interface │ │  & Upload       │  │  │
│  │ └────────────┘ └───────────┘ └──────────┘ └─────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                       React Query + Fetch API
                       ├─ GET /api/ai-assistant/conversations
                       ├─ POST /api/ai-assistant/ask
                       ├─ POST /api/ai-assistant/knowledge/upload
                       └─ GET /api/ai-assistant/learning-progress
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND API LAYER                                │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Express Routes: /routes/aiAssistant.ts                           │  │
│  │                                                                    │  │
│  │ • Authentication middleware (isAuthenticated)                    │  │
│  │ • Request validation (zod schemas)                               │  │
│  │ • Company context injection                                      │  │
│  │ • File upload handling (multer)                                  │  │
│  └────────────────────────────┬──────────────────────────────────────┘  │
└─────────────────────────────────┼──────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      AI ASSISTANT SERVICE LAYER                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ AIAssistantService (server/services/AIAssistantService.ts)       │  │
│  │                                                                    │  │
│  │ 1. Analyze Question                                              │  │
│  │ 2. Check Neural Network (if trained)                            │  │
│  │ 3. Search Knowledge Base                                         │  │
│  │ 4. Query External AI if needed                                   │  │
│  │ 5. Learn from interaction                                        │  │
│  │ 6. Update learning progress                                      │  │
│  └────────────────────────────┬──────────────────────────────────────┘  │
└─────────────────────────────────┼──────────────────────────────────────┘
                                  │
                  ┌───────────────┼───────────────┐
                  ▼               ▼               ▼
         ┌────────────────┐ ┌─────────────┐ ┌────────────────┐
         │ Neural Network │ │  Knowledge  │ │    Database    │
         │    Service     │ │     Base    │ │   (Postgres)   │
         └────────────────┘ └─────────────┘ └────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL AI SERVICE LAYER                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ ExternalAIService (server/services/ExternalAIService.ts)         │  │
│  │                                                                    │  │
│  │ ┌──────────────────────────────────────────────────────────────┐ │  │
│  │ │ PROVIDER SELECTION LOGIC (Smart Fallback)                   │ │  │
│  │ │                                                               │ │  │
│  │ │ if (USE_LOCAL_AI === 'true') {                              │ │  │
│  │ │   Try: Ollama → Anthropic → OpenAI                          │ │  │
│  │ │ } else {                                                     │ │  │
│  │ │   Try: Primary Provider → Fallback → Ollama                 │ │  │
│  │ │ }                                                            │ │  │
│  │ └──────────────────────────────────────────────────────────────┘ │  │
│  │                                                                    │  │
│  │ Features:                                                         │  │
│  │ • API key validation                                             │  │
│  │ • Token usage tracking                                           │  │
│  │ • Cost calculation                                               │  │
│  │ • Tool/function calling                                          │  │
│  │ • Error handling & retries                                       │  │
│  └────────────────────────────┬──────────────────────────────────────┘  │
└─────────────────────────────────┼──────────────────────────────────────┘
                                  │
                  ┌───────────────┼───────────────┐
                  │               │               │
                  ▼               ▼               ▼
         ┌────────────────┐ ┌─────────────┐ ┌────────────────┐
         │     Ollama     │ │   OpenAI    │ │   Anthropic    │
         │    (Local)     │ │   (Cloud)   │ │    (Cloud)     │
         ├────────────────┤ ├─────────────┤ ├────────────────┤
         │ llama3.1:8b    │ │   GPT-4     │ │ Claude 3 Opus  │
         │ llama2:7b      │ │ GPT-3.5     │ │ Claude Sonnet  │
         │ mistral:7b     │ │ GPT-4-turbo │ │ Claude Haiku   │
         │ codellama      │ │             │ │                │
         ├────────────────┤ ├─────────────┤ ├────────────────┤
         │ Port: 11434    │ │ REST API    │ │ REST API       │
         │ FREE           │ │ $$$ Cost    │ │ $$$$ Cost      │
         │ 100% Private   │ │ Cloud Data  │ │ Cloud Data     │
         │ Offline OK     │ │ Internet    │ │ Internet       │
         └────────────────┘ └─────────────┘ └────────────────┘
```

---

## Request Flow Example

### Example 1: User Asks "What is sphere in a prescription?"

```
Step 1: User Input
─────────────────────────────────────────────────
User types in chat interface → Click Send

Step 2: Frontend Processing
─────────────────────────────────────────────────
• React state updated
• useMutation hook triggered
• POST /api/ai-assistant/ask
• Body: { question: "What is sphere in a prescription?" }

Step 3: Backend Route Handler
─────────────────────────────────────────────────
• Authentication check (session/cookie)
• Get user's companyId
• Validate request (zod schema)
• Call AIAssistantService.ask()

Step 4: AI Assistant Service
─────────────────────────────────────────────────
• Check learning progress for company
• Try neural network (if confidence > 70%)
  ❌ Not confident enough
• Search knowledge base
  ❌ No relevant documents
• Decision: Use External AI
• Call ExternalAIService.generateResponse()

Step 5: External AI Service (Provider Selection)
─────────────────────────────────────────────────
USE_LOCAL_AI = true, so try Ollama first:

Attempt 1: Ollama
  ├─ Check if Ollama client initialized
  ├─ Send request to http://localhost:11434/v1/chat/completions
  ├─ If Ollama NOT running → Catch error
  └─ Fallback to next provider

Attempt 2: Anthropic (if configured)
  ├─ Check if Anthropic client initialized
  ├─ Check if API key valid
  ├─ Send request to Anthropic API
  ├─ If API key invalid → Catch error
  └─ Fallback to next provider

Attempt 3: OpenAI (if configured)
  ├─ Check if OpenAI client initialized
  ├─ Check if API key valid
  ├─ Send request to OpenAI API
  ├─ If successful → Return response
  └─ If all fail → Throw error

Step 6: Process AI Response
─────────────────────────────────────────────────
• Extract answer from AI response
• Calculate confidence score
• Track token usage and cost
• Identify sources used
• Format response object

Step 7: Learning & Storage
─────────────────────────────────────────────────
• Save conversation to database
• Extract Q&A pair for learning
• Update company learning progress
• Store in knowledge base
• Update statistics

Step 8: Return to Frontend
─────────────────────────────────────────────────
Response:
{
  answer: "Sphere (SPH) is the lens power needed to correct...",
  confidence: 0.95,
  usedExternalAi: true,
  provider: "openai",
  model: "gpt-4",
  sources: [{ type: "external", relevance: 1.0 }],
  tokensUsed: { prompt: 45, completion: 120, total: 165 },
  estimatedCost: 0.00495
}

Step 9: Frontend Display
─────────────────────────────────────────────────
• Append to conversation
• Show provider badge
• Display confidence score
• Show cost (if applicable)
• Add to conversation history
• Scroll to latest message
```

---

## Provider Selection Decision Tree

```
User sends question
        │
        ▼
Check USE_LOCAL_AI
        │
    ┌───┴───┐
    │       │
  true    false
    │       │
    ▼       ▼
┌─────┐   ┌─────────────┐
│LOCAL│   │CLOUD FIRST  │
│FIRST│   │(config.     │
└──┬──┘   │provider)    │
   │      └──────┬───────┘
   │             │
   ▼             ▼
┌──────────┐  ┌──────────┐
│Try Ollama│  │Try Primary│
│localhost │  │ (OpenAI/ │
│:11434    │  │Anthropic)│
└────┬─────┘  └────┬─────┘
     │             │
  Success?      Success?
     │             │
   ┌─┴─┐         ┌─┴─┐
  Yes  No       Yes  No
   │   │         │   │
   ▼   ▼         ▼   ▼
Return Try      Return Try
Result Anthropic Result Alternate
       │                Cloud
       ▼                │
   ┌────────┐           ▼
   │Try     │       ┌────────┐
   │OpenAI  │       │Try     │
   └───┬────┘       │Ollama  │
       │            └───┬────┘
    Success?           │
       │            Success?
     ┌─┴─┐            │
    Yes  No         ┌─┴─┐
     │   │         Yes  No
     ▼   ▼          │   │
   Return Error    Return Error
   Result Message  Result Message
```

---

## Data Flow Diagram

```
┌───────────────────────────────────────────────────────────┐
│                     DATA SOURCES                          │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  User Questions  →  Stored in conversations table        │
│                                                           │
│  AI Responses    →  Stored in ai_messages table          │
│                                                           │
│  Uploaded Docs   →  Stored in ai_knowledge_base table    │
│                                                           │
│  Learning Data   →  Stored in ai_learning_data table     │
│                                                           │
│  User Feedback   →  Updates confidence scores            │
│                                                           │
└───────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│                   PROCESSING PIPELINE                     │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  1. Question Analysis                                    │
│     └─ Extract intent, entities, context                │
│                                                           │
│  2. Knowledge Base Search                                │
│     └─ Vector similarity search                          │
│     └─ Relevance scoring                                 │
│                                                           │
│  3. Neural Network Prediction (if trained)               │
│     └─ Pattern matching                                  │
│     └─ Confidence calculation                            │
│                                                           │
│  4. External AI Query (if needed)                        │
│     └─ Provider selection                                │
│     └─ API call with context                             │
│                                                           │
│  5. Response Generation                                  │
│     └─ Combine sources                                   │
│     └─ Format answer                                     │
│                                                           │
│  6. Learning Update                                      │
│     └─ Store successful Q&A                              │
│     └─ Update progress metrics                           │
│                                                           │
└───────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│                      OUTPUTS                              │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  • Answer text                                           │
│  • Confidence score (0-100%)                             │
│  • Provider used (ollama/openai/anthropic)               │
│  • Sources (learned/document/external)                   │
│  • Token usage & cost                                    │
│  • Suggestions for follow-up                             │
│  • Learning opportunities identified                     │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Configuration Impact

### With USE_LOCAL_AI=true (Current Setting)

```
Priority Order: Ollama → Anthropic → OpenAI

Benefits:
  ✓ Minimizes costs (Ollama is free)
  ✓ Maximizes privacy (local processing)
  ✓ Faster responses (no network latency)
  ✓ Works offline

Requirements:
  • Ollama installed and running
  • Model downloaded (llama3.1:latest)
  • ~8GB RAM minimum
  • ~5GB disk space per model
```

### With USE_LOCAL_AI=false

```
Priority Order: Primary Provider → Alternate Cloud → Ollama

Benefits:
  ✓ More consistent quality
  ✓ Better for complex queries
  ✓ No local hardware requirements

Requirements:
  • Valid API keys
  • Internet connection
  • Billing/credits configured
```

---

## Learning & Improvement

```
Initial State (0% Progress)
───────────────────────────
• All queries use external AI
• No company knowledge
• High costs
• Generic responses

                │
                ▼
       User Interactions
       ─────────────────
       • Questions asked
       • Documents uploaded
       • Feedback provided
                │
                ▼
       Learning Process
       ────────────────
       • Extract Q&A pairs
       • Index documents
       • Train neural network
       • Build knowledge base
                │
                ▼
    Growing Progress (25-75%)
    ─────────────────────────
    • Mix of local + external
    • Company-specific knowledge
    • Reduced costs
    • More relevant answers
                │
                ▼
       Mature State (75-100%)
       ──────────────────────
       • Mostly autonomous
       • External AI for edge cases
       • Minimal costs
       • Highly relevant responses
```

---

## Database Schema

```sql
-- Conversations
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  title TEXT,
  status TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Messages
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL,
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  used_external_ai BOOLEAN,
  confidence DECIMAL,
  metadata JSONB,
  created_at TIMESTAMP
);

-- Knowledge Base
CREATE TABLE ai_knowledge_base (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  filename TEXT,
  content TEXT,
  content_type TEXT,
  file_size INTEGER,
  category TEXT,
  metadata JSONB,
  created_at TIMESTAMP
);

-- Learning Data
CREATE TABLE ai_learning_data (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  confidence DECIMAL,
  feedback_rating INTEGER,
  was_helpful BOOLEAN,
  source_type TEXT,
  created_at TIMESTAMP
);
```

---

This architecture ensures:
- ✅ Scalability (handles multiple companies)
- ✅ Privacy (local AI option)
- ✅ Cost control (free local models)
- ✅ Reliability (multiple providers)
- ✅ Learning (improves over time)
- ✅ Flexibility (easy to add providers)
