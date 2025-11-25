# Multi-Tenant AI System — Documentation Corrections

**Date:** November 25, 2025
**Original Documentation:** `/docs/MULTITENANT_AI_SYSTEM.md`
**Verification Report:** `/docs/MULTITENANT_AI_VERIFICATION_REPORT.md`

---

## Overview

This document provides specific corrections to align the Multi-Tenant AI System documentation with the actual ILS 2.0 implementation. Use this as a reference when updating the main documentation.

---

## Section 5: Authentication & Authorization

### 5.1 JWT Token Structure ❌ REMOVE THIS SECTION

**Current (Incorrect):**
```typescript
interface JWTPayload {
  userId: string;
  companyId: string;
  role: UserRole;
  permissions: string[];
  iat: number;
  exp: number;
}
```

**Replace With:**

### 5.1 Session-Based Authentication

ILS 2.0 uses **session-based authentication** with Passport.js, not JWT tokens. Bearer tokens in API requests are **session identifiers** that are validated against the database.

**Session Token Structure:**

```typescript
// Authentication header
Authorization: Bearer <session-id>

// The session ID is looked up in the database
// server/middleware/auth.ts
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: typeof roleEnum.enumValues[number];
  companyId?: string;  // Tenant identifier
  claims?: {
    sub?: string;
    email?: string;
    role?: string;
  };
}
```

**Authentication Flow:**

```
Client sends request with Bearer token
        ↓
Extract session ID from Authorization header
        ↓
Query database: sessions JOIN users
        ↓
Validate:
  - Session exists (sessions.sid = token)
  - User is active (users.isActive = true)
  - User is verified (users.isVerified = true)
        ↓
Attach user context to request (with companyId)
        ↓
Continue to route handler
```

**Implementation:**

```typescript
// server/middleware/auth.ts
export const authenticateUser: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const token = authHeader.split(' ')[1]; // Session ID
    const user = await validateToken(token);

    if (!user || !user.email || !user.role) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId || undefined // Tenant context!
    };
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

async function validateToken(token: string) {
  try {
    const [session] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        companyId: users.companyId
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(
        eq(sessions.sid, token), // Session lookup, not JWT verification!
        eq(users.isActive, true),
        eq(users.isVerified, true)
      ));

    return session || null;
  } catch (error) {
    logger.error('Token validation error:', error);
    return null;
  }
}
```

**Dependencies:**

```json
{
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "passport-local": "^1.0.0",
  "express-session": "^1.18.1"
}
```

**Note:** No JWT library (`jsonwebtoken` or `jose`) is used in the current implementation.

---

## Section 6: AI Workflow

### 6.3 Tenant-Specific Memory and Embeddings

**Current (Partially Incorrect):**
```typescript
// Generate embeddings using OpenAI
const embeddingResponse = await openai.embeddings.create({
  model: 'text-embedding-ada-002',
  input: document.content,
});

const embedding = embeddingResponse.data[0].embedding;

// Store in tenant's knowledge base
await storage.createEmbedding({
  companyId,
  content: document.content,
  embedding, // Stored as vector for similarity search ❌ INCORRECT
  metadata: document.metadata,
});

// Search using vector similarity (cosine) ❌ NOT IMPLEMENTED
const results = await db.select()
  .from(embeddingsTable)
  .where(eq(embeddingsTable.companyId, companyId))
  .orderBy(sql`embedding <=> ${embedding}`)
  .limit(5);
```

**Replace With:**

### 6.3 Tenant-Specific Knowledge Base (Current Implementation)

ILS 2.0 stores knowledge base content and embeddings in the `ai_knowledge_base` table. Embeddings are stored as **JSONB arrays**, not as vector types. Similarity search uses **Jaccard similarity** (word overlap), not vector cosine similarity.

**Schema:**

```typescript
// shared/schema.ts
export const aiKnowledgeBase = pgTable("ai_knowledge_base", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),

  // Document details
  filename: text("filename").notNull(),
  fileType: varchar("file_type").notNull(), // pdf, docx, csv, json, etc.
  fileSize: integer("file_size"), // bytes
  fileUrl: text("file_url"), // Storage URL

  // Processed content
  content: text("content"), // Extracted text content
  summary: text("summary"), // AI-generated summary
  tags: jsonb("tags"), // Extracted tags/keywords
  embeddings: jsonb("embeddings"), // ⚠️ JSONB array, not vector type!

  // Metadata
  category: varchar("category"), // pricing, procedures, policies, etc.
  isActive: boolean("is_active").default(true),
  processingStatus: varchar("processing_status").default("pending"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_knowledge_company").on(table.companyId),
  index("idx_ai_knowledge_category").on(table.category),
]);
```

**Similarity Search (Current Implementation):**

```typescript
// server/services/MasterAIService.ts
/**
 * Calculate text similarity using Jaccard index (word overlap)
 *
 * NOTE: This is a simple similarity metric. For production,
 * consider implementing vector cosine similarity with pgvector.
 */
private calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size; // Jaccard similarity
}

/**
 * Search learned knowledge for similar questions
 */
private async searchLearnedKnowledge(query: string, companyId: string) {
  const allLearning = await this.storage.getAiLearningDataByCompany(companyId);

  let bestMatch = { confidence: 0, answer: '', learning: null as any };

  for (const learning of allLearning) {
    if (learning.question) {
      const similarity = this.calculateSimilarity(
        query.toLowerCase(),
        learning.question.toLowerCase()
      );

      const confidence = similarity * parseFloat(learning.confidence || '0.5');

      if (confidence > bestMatch.confidence) {
        bestMatch = { confidence, answer: learning.answer || '', learning };
      }
    }
  }

  return bestMatch;
}
```

**Storage Layer:**

```typescript
// server/storage.ts
async getAiKnowledgeBaseByCompany(companyId: string): Promise<AiKnowledgeBase[]> {
  return await db
    .select()
    .from(aiKnowledgeBase)
    .where(and(
      eq(aiKnowledgeBase.companyId, companyId), // Tenant isolation
      eq(aiKnowledgeBase.isActive, true)
    ))
    .orderBy(desc(aiKnowledgeBase.createdAt));
}
```

**Future Enhancement: pgvector**

To implement proper vector similarity search:

```sql
-- 1. Install pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add vector column
ALTER TABLE ai_knowledge_base ADD COLUMN embedding vector(1536);

-- 3. Create vector index
CREATE INDEX ai_knowledge_embedding_idx
  ON ai_knowledge_base
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 4. Query with cosine similarity
SELECT * FROM ai_knowledge_base
WHERE company_id = '<tenant-id>'
ORDER BY embedding <=> '[embedding-vector]'
LIMIT 5;
```

---

## Section 8: Deployment

### 8.3 Kubernetes Deployment

**Add Note:**

⚠️ **Important:** When deploying with Kubernetes, ensure you do NOT use JWT-based authentication in the documentation examples. The current implementation uses session-based auth with a database-backed session store.

Update the secrets configuration:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ils-secrets
type: Opaque
stringData:
  database-url: postgresql://...
  session-secret: <random-256-bit-string>  # For express-session
  openai-api-key: sk-...
  # NO JWT_SECRET needed - not used in current implementation
```

---

## Section 13: Performance & Scaling

### 13.4 AI Model Optimization

**Update "Embedding Caching" Section:**

**Current (Incorrect):**
```typescript
// Cache embeddings to reduce API calls
async function getCachedEmbedding(text: string): Promise<number[]> {
  // ... implementation
}
```

**Replace With:**

```typescript
// Cache embeddings to reduce API calls
// NOTE: Current implementation stores embeddings as JSONB
async function getCachedEmbedding(text: string): Promise<number[]> {
  const hash = crypto.createHash('sha256').update(text).digest('hex');
  const cacheKey = `embedding:${hash}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached); // Parse JSONB array
  }

  // Generate embedding (if OpenAI is available)
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });

  const embedding = response.data[0].embedding;
  await redis.setex(cacheKey, 86400, JSON.stringify(embedding)); // 24 hours

  return embedding;
}

// Store in database as JSONB (current implementation)
await db.insert(aiKnowledgeBase).values({
  companyId,
  content: text,
  embeddings: embedding, // Drizzle will convert array to JSONB
  // ...
});
```

---

## New Section: Current Architecture vs. Future Architecture

Add this section after "Section 11: Multi-Tenant Modes"

---

## 12. Current vs. Future Architecture

### Current Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Multi-tenancy (companyId) | ✅ Implemented | All tables properly isolated |
| Session-based Authentication | ✅ Implemented | Passport.js + express-session |
| AI Services (MasterAI, OphthalmicAI) | ✅ Implemented | Topic validation, multi-tenant |
| Storage Layer Isolation | ✅ Implemented | All methods filter by companyId |
| AI Conversations & Logs | ✅ Implemented | Full audit trail per tenant |
| Knowledge Base Storage | ✅ Implemented | JSONB embeddings, text content |
| Jaccard Similarity Search | ✅ Implemented | Word overlap for matching |
| JWT Authentication | ❌ Not Implemented | Uses sessions instead |
| Vector Embeddings (pgvector) | ❌ Not Implemented | Uses JSONB instead |
| Vector Cosine Similarity | ❌ Not Implemented | Uses Jaccard similarity |
| Python RAG Service | ❌ Not Implemented | Python service does analytics only |

### Roadmap: Future Enhancements

#### Phase 1: Enhanced Search (Estimated: 2-3 weeks)

**Goal:** Implement proper vector similarity search

**Tasks:**
1. Install pgvector extension in PostgreSQL
2. Add `embedding vector(1536)` column to `ai_knowledge_base`
3. Create IVFFlat or HNSW index on embedding column
4. Update storage layer to use cosine similarity operator (`<=>`)
5. Migrate existing JSONB embeddings to vector type
6. Update MasterAIService to use vector search

**Benefits:**
- 10-100x faster similarity search
- More accurate semantic matching
- Scalable to millions of documents

#### Phase 2: JWT Authentication (Estimated: 1-2 weeks)

**Goal:** Replace session-based auth with JWT

**Tasks:**
1. Install `jsonwebtoken` or `jose` library
2. Update `authenticateUser` middleware to verify JWTs
3. Generate JWTs on login with tenant claims
4. Remove session database table (optional)
5. Update frontend to store JWTs in localStorage/cookies

**Benefits:**
- Stateless authentication (no database lookup per request)
- Easier horizontal scaling
- Better for microservices architecture

#### Phase 3: Python RAG Service (Estimated: 3-4 weeks)

**Goal:** Build dedicated RAG microservice in Python

**Tasks:**
1. Create FastAPI endpoints for RAG queries
2. Implement sentence-transformers for embeddings
3. Add vector database integration (pgvector, Pinecone, or Weaviate)
4. Build document processing pipeline
5. Add tenant isolation and rate limiting
6. Integrate with Node.js backend

**Benefits:**
- Faster embedding generation
- Advanced NLP capabilities (summarization, entity extraction)
- Separation of concerns (analytics vs. RAG)

### Migration Guide: Session Auth → JWT

If you decide to implement JWT authentication:

```typescript
// 1. Install dependencies
npm install jsonwebtoken @types/jsonwebtoken

// 2. Generate JWT on login
import jwt from 'jsonwebtoken';

function generateJWT(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      permissions: getUserPermissions(user.role),
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
}

// 3. Update authentication middleware
async function validateToken(token: string) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Optional: Check if user still exists and is active
    const user = await db.select()
      .from(users)
      .where(and(
        eq(users.id, payload.userId),
        eq(users.isActive, true)
      ));

    if (!user) return null;

    return payload;
  } catch (error) {
    return null;
  }
}

// 4. Remove session dependency
// - Remove express-session
// - Remove session table from database
// - Update frontend to use JWT storage
```

---

## Appendix: File-by-File Corrections

### `/docs/MULTITENANT_AI_SYSTEM.md`

**Lines to Update:**

- **Line ~200-250:** Section 5.1 "JWT Token Structure" → Replace with "Session-Based Authentication"
- **Line ~450-500:** Section 6.3 "Tenant-Specific Memory and Embeddings" → Update to reflect JSONB storage
- **Line ~900-950:** Section 13.4 "Embedding Caching" → Update code examples
- **Add after line ~1100:** New Section 12 "Current vs. Future Architecture"

### Create New Warning Callouts

Add these warning boxes throughout the document:

```markdown
> ⚠️ **Current Implementation Note**
>
> ILS 2.0 uses session-based authentication, not JWT. Bearer tokens are session IDs
> that are validated against the database. See Section 5.1 for details.

> ⚠️ **Current Implementation Note**
>
> Embeddings are stored as JSONB arrays, not pgvector types. Similarity search uses
> Jaccard index (word overlap). For production-scale semantic search, consider
> implementing pgvector. See Section 12 for roadmap.

> ⚠️ **Current Implementation Note**
>
> The Python service provides analytics endpoints only. RAG functionality is handled
> in the Node.js MasterAIService. See Section 12 for future RAG service plans.
```

---

## Summary

**Critical Corrections:**
1. ✅ Remove/replace JWT authentication sections
2. ✅ Update vector embeddings to reflect JSONB storage
3. ✅ Remove Python RAG service references
4. ✅ Add "Current vs. Future Architecture" section

**Next Steps:**
1. Update `/docs/MULTITENANT_AI_SYSTEM.md` with corrections
2. Review verification report with team
3. Decide: Document current state OR implement missing features
4. Update DOCUMENTATION_INDEX.md to reference verification report

---

**Author:** Claude (AI Assistant)
**Date:** November 25, 2025
**Related Files:**
- `/docs/MULTITENANT_AI_SYSTEM.md` (original documentation)
- `/docs/MULTITENANT_AI_VERIFICATION_REPORT.md` (detailed findings)
