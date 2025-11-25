# Multi-Tenant AI System — Missing Features Implementation Plan

**Date:** November 25, 2025
**Status:** 🚧 Planning Phase
**Related Docs:**
- `/docs/MULTITENANT_AI_VERIFICATION_REPORT.md` - Discrepancies identified
- `/docs/MULTITENANT_AI_CORRECTIONS.md` - Technical corrections needed

---

## Overview

This document provides a detailed implementation plan for the three critical features that are documented but not yet implemented in ILS 2.0:

1. **JWT Authentication** (Priority: Medium | Effort: 1-2 weeks)
2. **pgvector & Vector Embeddings** (Priority: High | Effort: 2-3 weeks)
3. **Python RAG Service** (Priority: High | Effort: 3-4 weeks)

**Recommended Implementation Order:**
1. Start with **pgvector** (highest ROI, enables better AI capabilities)
2. Then **Python RAG Service** (depends on pgvector)
3. Finally **JWT Authentication** (optional, can run in parallel)

---

## Feature 1: pgvector & Vector Embeddings

### Priority: 🔴 HIGH
**Why:** Foundation for semantic search, 10-100x faster than Jaccard similarity, required for RAG

### Effort Estimate: 2-3 weeks
- Database setup: 2-3 days
- Schema migration: 3-4 days
- Query updates: 4-5 days
- Testing & validation: 3-4 days

### Current State
```typescript
// ❌ Current: JSONB storage with Jaccard similarity
export const aiKnowledgeBase = pgTable("ai_knowledge_base", {
  embeddings: jsonb("embeddings"), // JSON array
  // ...
});

// Simple word overlap
private calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  return intersection.size / union.size; // Jaccard
}
```

### Target State
```typescript
// ✅ Target: Vector storage with cosine similarity
export const aiKnowledgeBase = pgTable("ai_knowledge_base", {
  embedding: vector("embedding", { dimensions: 1536 }), // OpenAI ada-002
  // ...
});

// Vector cosine similarity
const results = await db.select()
  .from(aiKnowledgeBase)
  .where(eq(aiKnowledgeBase.companyId, companyId))
  .orderBy(sql`embedding <=> ${embedding}`) // Cosine distance
  .limit(5);
```

### Implementation Steps

#### Phase 1: Database Setup (2-3 days)

**Step 1.1: Install pgvector Extension**

```sql
-- migrations/001_install_pgvector.sql
-- Run as superuser
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

**Step 1.2: Add Vector Column**

```sql
-- migrations/002_add_vector_column.sql
-- Add new vector column (don't drop JSONB yet - we'll migrate data)
ALTER TABLE ai_knowledge_base
ADD COLUMN embedding vector(1536);

-- Create index for fast similarity search
CREATE INDEX ai_knowledge_embedding_idx
  ON ai_knowledge_base
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- For more accurate but slower search, use HNSW:
-- CREATE INDEX ai_knowledge_embedding_idx
--   ON ai_knowledge_base
--   USING hnsw (embedding vector_cosine_ops);
```

**Step 1.3: Test pgvector Installation**

```typescript
// scripts/test-pgvector.ts
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function testPgvector() {
  try {
    // Test vector operations
    const result = await db.execute(sql`
      SELECT '[1,2,3]'::vector <=> '[4,5,6]'::vector AS distance
    `);
    console.log('✅ pgvector working! Distance:', result.rows[0].distance);
  } catch (error) {
    console.error('❌ pgvector test failed:', error);
  }
}

testPgvector();
```

#### Phase 2: Schema Migration (3-4 days)

**Step 2.1: Update Drizzle Schema**

```typescript
// shared/schema.ts
import { vector } from 'drizzle-orm/pg-core'; // Add this import

export const aiKnowledgeBase = pgTable("ai_knowledge_base", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),

  // Content
  filename: text("filename").notNull(),
  content: text("content"),

  // NEW: Vector embedding (replaces JSONB)
  embedding: vector("embedding", { dimensions: 1536 }),

  // KEEP for backward compatibility during migration
  embeddings: jsonb("embeddings"), // Will be removed after migration

  // Metadata
  category: varchar("category"),
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_knowledge_company").on(table.companyId),
  index("idx_ai_knowledge_embedding").using("ivfflat", table.embedding, sql`vector_cosine_ops`),
]);
```

**Step 2.2: Create Data Migration Script**

```typescript
// scripts/migrate-embeddings-to-vector.ts
import { db } from '../server/db';
import { aiKnowledgeBase } from '../shared/schema';
import { eq, isNotNull } from 'drizzle-orm';

async function migrateEmbeddings() {
  console.log('Starting embedding migration to pgvector...');

  // Get all records with JSONB embeddings
  const records = await db.select()
    .from(aiKnowledgeBase)
    .where(isNotNull(aiKnowledgeBase.embeddings));

  console.log(`Found ${records.length} records to migrate`);

  let migrated = 0;
  let failed = 0;

  for (const record of records) {
    try {
      const embeddingArray = record.embeddings as number[];

      if (!Array.isArray(embeddingArray) || embeddingArray.length !== 1536) {
        console.warn(`Skipping invalid embedding for record ${record.id}`);
        failed++;
        continue;
      }

      // Update with vector type
      await db.update(aiKnowledgeBase)
        .set({
          embedding: embeddingArray, // Drizzle will convert to vector
          updatedAt: new Date()
        })
        .where(eq(aiKnowledgeBase.id, record.id));

      migrated++;

      if (migrated % 100 === 0) {
        console.log(`Migrated ${migrated}/${records.length} records...`);
      }
    } catch (error) {
      console.error(`Failed to migrate record ${record.id}:`, error);
      failed++;
    }
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   Migrated: ${migrated}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${records.length}`);
}

migrateEmbeddings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
```

**Step 2.3: Run Migration**

```bash
# 1. Push new schema (adds vector column)
npm run db:push

# 2. Run data migration
npx tsx scripts/migrate-embeddings-to-vector.ts

# 3. Verify migration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM ai_knowledge_base WHERE embedding IS NOT NULL;"

# 4. After verification, drop old JSONB column (optional)
# ALTER TABLE ai_knowledge_base DROP COLUMN embeddings;
```

#### Phase 3: Update Query Methods (4-5 days)

**Step 3.1: Create Embedding Service**

```typescript
// server/services/EmbeddingService.ts
import OpenAI from 'openai';
import { createLogger } from '../utils/logger';

const logger = createLogger('EmbeddingService');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class EmbeddingService {
  /**
   * Generate embedding for text using OpenAI ada-002
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('Failed to generate embedding:', error);
      throw new Error('Embedding generation failed');
    }
  }

  /**
   * Generate embeddings for multiple texts (batch processing)
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texts, // OpenAI supports batch up to 2048 texts
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      logger.error('Failed to generate embeddings:', error);
      throw new Error('Batch embedding generation failed');
    }
  }
}

export const embeddingService = new EmbeddingService();
```

**Step 3.2: Update Storage Layer**

```typescript
// server/storage.ts

/**
 * Search knowledge base using vector similarity
 */
async searchKnowledgeBaseByEmbedding(
  companyId: string,
  queryEmbedding: number[],
  options: { limit?: number; threshold?: number } = {}
): Promise<Array<AiKnowledgeBase & { similarity: number }>> {
  const limit = options.limit || 5;
  const threshold = options.threshold || 0.7; // Cosine similarity threshold

  const results = await db.execute(sql`
    SELECT
      *,
      1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
    FROM ai_knowledge_base
    WHERE
      company_id = ${companyId}
      AND is_active = true
      AND embedding IS NOT NULL
      AND (1 - (embedding <=> ${queryEmbedding}::vector)) > ${threshold}
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT ${limit}
  `);

  return results.rows as Array<AiKnowledgeBase & { similarity: number }>;
}

/**
 * Store knowledge with embedding
 */
async createKnowledgeBaseEntry(data: {
  companyId: string;
  uploadedBy: string;
  filename: string;
  content: string;
  embedding?: number[];
  category?: string;
}): Promise<AiKnowledgeBase> {
  const [entry] = await db.insert(aiKnowledgeBase).values({
    id: crypto.randomUUID(),
    companyId: data.companyId,
    uploadedBy: data.uploadedBy,
    filename: data.filename,
    content: data.content,
    embedding: data.embedding, // Vector type
    category: data.category,
    isActive: true,
    processingStatus: 'completed',
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  return entry;
}
```

**Step 3.3: Update MasterAI Service**

```typescript
// server/services/MasterAIService.ts
import { embeddingService } from './EmbeddingService';

export class MasterAIService {
  // ... existing code ...

  /**
   * Handle knowledge queries using vector similarity (NEW!)
   */
  private async handleKnowledgeQuery(
    query: MasterAIQuery,
    company: any,
    startTime: number,
    learningProgress: number
  ): Promise<MasterAIResponse> {
    try {
      // 1. Generate query embedding
      const queryEmbedding = await embeddingService.generateEmbedding(query.message);

      // 2. Search knowledge base using vector similarity
      const knowledgeSources = await this.storage.searchKnowledgeBaseByEmbedding(
        query.companyId,
        queryEmbedding,
        { limit: 5, threshold: 0.7 }
      );

      // 3. Build context from retrieved documents
      const context = knowledgeSources
        .map(doc => `[${doc.filename}] ${doc.content}`)
        .join('\n\n');

      // 4. Generate response with context
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: `You are an AI assistant for an optical practice. Use the following knowledge base to answer questions:\n\n${context}`
        },
        {
          role: 'user',
          content: query.message
        }
      ];

      const aiResponse = await this.externalAI.chat(messages, {
        preferredProvider: 'openai',
        model: 'gpt-4'
      });

      return {
        answer: aiResponse.content,
        conversationId: query.conversationId || crypto.randomUUID(),
        sources: knowledgeSources.map(doc => ({
          type: 'company_document' as const,
          reference: doc.filename,
          confidence: doc.similarity
        })),
        toolsUsed: ['vector_search', 'knowledge_base'],
        confidence: 0.85,
        isRelevant: true,
        metadata: {
          responseTime: Date.now() - startTime,
          queryType: 'knowledge',
          learningProgress,
          usedExternalAI: true
        }
      };
    } catch (error) {
      this.logger.error('Knowledge query failed:', error);
      throw error;
    }
  }

  // Remove old Jaccard similarity method
  // private calculateSimilarity() { ... } ❌ DELETE THIS
}
```

#### Phase 4: Testing & Validation (3-4 days)

**Step 4.1: Create Test Suite**

```typescript
// test/integration/pgvector.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { db } from '../../server/db';
import { storage } from '../../server/storage';
import { embeddingService } from '../../server/services/EmbeddingService';

describe('pgvector Integration Tests', () => {
  const testCompanyId = 'test-company-123';
  const testUserId = 'test-user-123';

  beforeAll(async () => {
    // Create test knowledge entries
    const documents = [
      'Progressive lenses are ideal for presbyopia patients over 40',
      'Single vision lenses correct myopia or hyperopia',
      'Blue light blocking coatings reduce eye strain from screens'
    ];

    for (const doc of documents) {
      const embedding = await embeddingService.generateEmbedding(doc);
      await storage.createKnowledgeBaseEntry({
        companyId: testCompanyId,
        uploadedBy: testUserId,
        filename: `test-${doc.slice(0, 20)}.txt`,
        content: doc,
        embedding,
        category: 'test'
      });
    }
  });

  it('should find relevant documents using vector similarity', async () => {
    const query = 'What lenses are best for older patients?';
    const queryEmbedding = await embeddingService.generateEmbedding(query);

    const results = await storage.searchKnowledgeBaseByEmbedding(
      testCompanyId,
      queryEmbedding,
      { limit: 3, threshold: 0.5 }
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].content).toContain('Progressive lenses');
    expect(results[0].similarity).toBeGreaterThan(0.5);
  });

  it('should return results sorted by similarity', async () => {
    const query = 'presbyopia';
    const queryEmbedding = await embeddingService.generateEmbedding(query);

    const results = await storage.searchKnowledgeBaseByEmbedding(
      testCompanyId,
      queryEmbedding,
      { limit: 5 }
    );

    // Check that results are sorted descending by similarity
    for (let i = 1; i < results.length; i++) {
      expect(results[i-1].similarity).toBeGreaterThanOrEqual(results[i].similarity);
    }
  });

  it('should respect tenant isolation', async () => {
    const otherCompanyId = 'other-company-456';
    const query = 'lenses';
    const queryEmbedding = await embeddingService.generateEmbedding(query);

    const results = await storage.searchKnowledgeBaseByEmbedding(
      otherCompanyId,
      queryEmbedding,
      { limit: 10 }
    );

    expect(results.length).toBe(0); // No results from other company
  });

  afterAll(async () => {
    // Cleanup test data
    await db.delete(aiKnowledgeBase)
      .where(eq(aiKnowledgeBase.companyId, testCompanyId));
  });
});
```

**Step 4.2: Performance Benchmarks**

```typescript
// scripts/benchmark-vector-search.ts
import { performance } from 'perf_hooks';
import { embeddingService } from '../server/services/EmbeddingService';
import { storage } from '../server/storage';

async function benchmark() {
  const companyId = 'test-company';
  const query = 'What are progressive lenses?';
  const iterations = 100;

  console.log('Benchmarking vector similarity search...\n');

  // Generate query embedding once
  const queryEmbedding = await embeddingService.generateEmbedding(query);

  // Benchmark vector search
  const startVector = performance.now();
  for (let i = 0; i < iterations; i++) {
    await storage.searchKnowledgeBaseByEmbedding(companyId, queryEmbedding, { limit: 5 });
  }
  const endVector = performance.now();
  const vectorTime = (endVector - startVector) / iterations;

  console.log(`✅ Vector Search (pgvector):`);
  console.log(`   Average time: ${vectorTime.toFixed(2)}ms`);
  console.log(`   Throughput: ${(1000 / vectorTime).toFixed(0)} queries/sec`);

  // Compare with old Jaccard similarity (if still available)
  // ...

  console.log(`\n🎯 Performance improvement: ~${(oldTime / vectorTime).toFixed(0)}x faster`);
}

benchmark();
```

### Rollback Plan

If issues arise:

```sql
-- 1. Keep old JSONB column during migration
-- 2. Test thoroughly before dropping JSONB
-- 3. If needed, rollback:
ALTER TABLE ai_knowledge_base DROP COLUMN embedding;
-- Old JSONB embeddings still intact
```

---

## Feature 2: Python RAG Service

### Priority: 🔴 HIGH
**Why:** Dedicated microservice for AI, better performance, separation of concerns

### Effort Estimate: 3-4 weeks
**Dependencies:** Requires Feature 1 (pgvector) to be completed first

### Implementation Steps

#### Phase 1: Service Setup (1 week)

**Step 1.1: Create Python RAG Service Structure**

```bash
# Create new service directory
mkdir -p python-rag-service
cd python-rag-service

# Initialize Python project
python -m venv venv
source venv/bin/activate

# Create project structure
mkdir -p {api,services,models,utils,tests}
touch api/__init__.py services/__init__.py models/__init__.py utils/__init__.py
```

**Step 1.2: Install Dependencies**

```bash
# python-rag-service/requirements.txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.0
python-dotenv==1.0.0

# PostgreSQL & pgvector
psycopg2-binary==2.9.9
pgvector==0.2.4

# Embeddings & NLP
sentence-transformers==2.3.1
transformers==4.36.0
torch==2.1.2

# OpenAI (optional, for ada-002)
openai==1.10.0

# Utilities
numpy==1.26.3
pandas==2.1.4
redis==5.0.1

# Development
pytest==7.4.4
pytest-asyncio==0.23.3
httpx==0.26.0
```

**Step 1.3: Create FastAPI Application**

```python
# python-rag-service/api/main.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="ILS RAG Service",
    description="Retrieval-Augmented Generation microservice for multi-tenant AI",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("BACKEND_URL", "http://localhost:5000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class EmbeddingRequest(BaseModel):
    text: str
    model: str = "all-MiniLM-L6-v2"  # or "text-embedding-ada-002"

class EmbeddingResponse(BaseModel):
    embedding: List[float]
    model: str
    dimensions: int

class RAGSearchRequest(BaseModel):
    query: str
    company_id: str
    limit: int = 5
    threshold: float = 0.7

class RAGSearchResult(BaseModel):
    id: str
    content: str
    filename: str
    category: Optional[str]
    similarity: float

class RAGSearchResponse(BaseModel):
    query: str
    results: List[RAGSearchResult]
    total_found: int

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "rag-service",
        "version": "2.0.0"
    }

# Root
@app.get("/")
async def root():
    return {
        "message": "ILS RAG Service",
        "endpoints": [
            "/health",
            "/api/embeddings/generate",
            "/api/rag/search",
            "/api/rag/index-document"
        ]
    }
```

#### Phase 2: Embedding Service (1 week)

```python
# python-rag-service/services/embedding_service.py
from sentence_transformers import SentenceTransformer
from typing import List, Union
import numpy as np
import logging

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        # Load model (all-MiniLM-L6-v2: 384 dims, fast, good quality)
        # Alternative: all-mpnet-base-v2 (768 dims, slower, better quality)
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.dimensions = 384
        logger.info(f"Loaded embedding model with {self.dimensions} dimensions")

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for single text"""
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts (batch processing)"""
        embeddings = self.model.encode(texts, convert_to_numpy=True, show_progress_bar=True)
        return embeddings.tolist()

    def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between two embeddings"""
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)

        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return float(dot_product / (norm1 * norm2))

# Singleton instance
embedding_service = EmbeddingService()
```

#### Phase 3: RAG Search Service (1 week)

```python
# python-rag-service/services/rag_service.py
import psycopg2
from psycopg2.extras import RealDictCursor
from pgvector.psycopg2 import register_vector
from typing import List, Dict, Any
import os
import logging

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self):
        self.conn = None
        self.connect()

    def connect(self):
        """Connect to PostgreSQL with pgvector"""
        try:
            self.conn = psycopg2.connect(
                os.getenv("DATABASE_URL"),
                cursor_factory=RealDictCursor
            )
            register_vector(self.conn)
            logger.info("Connected to PostgreSQL with pgvector")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise

    def search_knowledge_base(
        self,
        company_id: str,
        query_embedding: List[float],
        limit: int = 5,
        threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """Search knowledge base using vector similarity"""
        try:
            cursor = self.conn.cursor()

            # Vector similarity search with tenant isolation
            query = """
                SELECT
                    id,
                    filename,
                    content,
                    category,
                    1 - (embedding <=> %s::vector) AS similarity
                FROM ai_knowledge_base
                WHERE
                    company_id = %s
                    AND is_active = true
                    AND embedding IS NOT NULL
                    AND (1 - (embedding <=> %s::vector)) > %s
                ORDER BY embedding <=> %s::vector
                LIMIT %s
            """

            cursor.execute(query, (
                query_embedding,
                company_id,
                query_embedding,
                threshold,
                query_embedding,
                limit
            ))

            results = cursor.fetchall()
            cursor.close()

            return [dict(row) for row in results]

        except Exception as e:
            logger.error(f"RAG search failed: {e}")
            raise

    def index_document(
        self,
        company_id: str,
        user_id: str,
        filename: str,
        content: str,
        embedding: List[float],
        category: str = None
    ) -> str:
        """Index a new document in the knowledge base"""
        try:
            cursor = self.conn.cursor()

            query = """
                INSERT INTO ai_knowledge_base (
                    id, company_id, uploaded_by, filename, content,
                    embedding, category, is_active, processing_status,
                    created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), %s, %s, %s, %s, %s, %s, true, 'completed', NOW(), NOW()
                )
                RETURNING id
            """

            cursor.execute(query, (
                company_id, user_id, filename, content, embedding, category
            ))

            doc_id = cursor.fetchone()['id']
            self.conn.commit()
            cursor.close()

            logger.info(f"Indexed document {doc_id} for company {company_id}")
            return doc_id

        except Exception as e:
            self.conn.rollback()
            logger.error(f"Document indexing failed: {e}")
            raise

# Singleton
rag_service = RAGService()
```

#### Phase 4: API Endpoints (3-4 days)

```python
# python-rag-service/api/main.py (continued)
from services.embedding_service import embedding_service
from services.rag_service import rag_service

@app.post("/api/embeddings/generate", response_model=EmbeddingResponse)
async def generate_embedding(request: EmbeddingRequest):
    """Generate embedding for text"""
    try:
        embedding = embedding_service.generate_embedding(request.text)

        return EmbeddingResponse(
            embedding=embedding,
            model=request.model,
            dimensions=len(embedding)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rag/search", response_model=RAGSearchResponse)
async def search_rag(request: RAGSearchRequest):
    """Search knowledge base using RAG"""
    try:
        # Generate query embedding
        query_embedding = embedding_service.generate_embedding(request.query)

        # Search knowledge base
        results = rag_service.search_knowledge_base(
            company_id=request.company_id,
            query_embedding=query_embedding,
            limit=request.limit,
            threshold=request.threshold
        )

        return RAGSearchResponse(
            query=request.query,
            results=[
                RAGSearchResult(
                    id=r['id'],
                    content=r['content'],
                    filename=r['filename'],
                    category=r.get('category'),
                    similarity=r['similarity']
                ) for r in results
            ],
            total_found=len(results)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rag/index-document")
async def index_document(
    company_id: str,
    user_id: str,
    filename: str,
    content: str,
    category: str = None
):
    """Index a new document"""
    try:
        # Generate embedding
        embedding = embedding_service.generate_embedding(content)

        # Index document
        doc_id = rag_service.index_document(
            company_id=company_id,
            user_id=user_id,
            filename=filename,
            content=content,
            embedding=embedding,
            category=category
        )

        return {"document_id": doc_id, "status": "indexed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

#### Phase 5: Integration with Node.js (3-4 days)

```typescript
// server/services/PythonRAGService.ts
import { createLogger } from '../utils/logger';

const logger = createLogger('PythonRAGService');
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8001';

export class PythonRAGService {
  /**
   * Generate embedding using Python service
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${RAG_SERVICE_URL}/api/embeddings/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`RAG service error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      logger.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  /**
   * Search knowledge base using RAG
   */
  async searchKnowledge(
    query: string,
    companyId: string,
    options: { limit?: number; threshold?: number } = {}
  ) {
    try {
      const response = await fetch(`${RAG_SERVICE_URL}/api/rag/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          company_id: companyId,
          limit: options.limit || 5,
          threshold: options.threshold || 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`RAG search error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('RAG search failed:', error);
      throw error;
    }
  }
}

export const pythonRAGService = new PythonRAGService();
```

---

## Feature 3: JWT Authentication

### Priority: 🟡 MEDIUM
**Why:** Improves scalability, can run in parallel with other features

### Effort Estimate: 1-2 weeks

### Implementation Steps

#### Phase 1: Install Dependencies (1 day)

```bash
npm install jsonwebtoken @types/jsonwebtoken
```

#### Phase 2: JWT Service (2-3 days)

```typescript
// server/services/JWTService.ts
import jwt from 'jsonwebtoken';
import { createLogger } from '../utils/logger';

const logger = createLogger('JWTService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  companyId: string;
  email: string;
  role: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export class JWTService {
  /**
   * Generate JWT token
   */
  generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    try {
      return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'ils-platform',
        audience: 'ils-api'
      });
    } catch (error) {
      logger.error('Failed to generate JWT:', error);
      throw new Error('Token generation failed');
    }
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, JWT_SECRET, {
        issuer: 'ils-platform',
        audience: 'ils-api'
      }) as JWTPayload;

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Refresh token (generate new token with extended expiry)
   */
  refreshToken(oldToken: string): string {
    try {
      const payload = this.verifyToken(oldToken);

      // Remove iat and exp from payload
      const { iat, exp, ...tokenData } = payload;

      return this.generateToken(tokenData);
    } catch (error) {
      logger.error('Failed to refresh token:', error);
      throw new Error('Token refresh failed');
    }
  }
}

export const jwtService = new JWTService();
```

#### Phase 3: Update Authentication Middleware (2-3 days)

```typescript
// server/middleware/auth-jwt.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { jwtService } from '../services/JWTService';
import { createLogger } from '../utils/logger';

const logger = createLogger('auth-jwt');

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  companyId: string;
  permissions: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticateJWT: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    const payload = jwtService.verifyToken(token);

    // Attach user to request
    (req as AuthenticatedRequest).user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      companyId: payload.companyId,
      permissions: payload.permissions
    };

    next();
  } catch (error: any) {
    logger.error('JWT authentication failed:', error);

    if (error.message === 'Token expired') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }

    return res.status(401).json({ error: 'Invalid authentication token' });
  }
};
```

#### Phase 4: Update Login Endpoint (1-2 days)

```typescript
// server/routes/auth.ts
import { jwtService } from '../services/JWTService';

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate credentials (existing logic)
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user permissions
    const permissions = getUserPermissions(user.role);

    // Generate JWT token
    const token = jwtService.generateToken({
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role,
      permissions
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      }
    });
  } catch (error) {
    logger.error('Login failed:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Token refresh endpoint
app.post('/api/auth/refresh', authenticateJWT, async (req, res) => {
  try {
    const oldToken = req.headers.authorization?.split(' ')[1];
    if (!oldToken) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const newToken = jwtService.refreshToken(oldToken);
    res.json({ token: newToken });
  } catch (error) {
    logger.error('Token refresh failed:', error);
    res.status(401).json({ error: 'Token refresh failed' });
  }
});
```

#### Phase 5: Frontend Updates (2-3 days)

```typescript
// client/src/lib/api.ts

// Store JWT in localStorage
export function setAuthToken(token: string) {
  localStorage.setItem('auth_token', token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function clearAuthToken() {
  localStorage.removeItem('auth_token');
}

// Add token to all requests
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });

  // Handle token expiration
  if (response.status === 401) {
    const data = await response.json();
    if (data.code === 'TOKEN_EXPIRED') {
      // Try to refresh token
      await refreshToken();
      // Retry original request
      return apiRequest(endpoint, options);
    }
    clearAuthToken();
    window.location.href = '/login';
  }

  return response;
}

async function refreshToken() {
  const token = getAuthToken();
  if (!token) return;

  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.ok) {
    const data = await response.json();
    setAuthToken(data.token);
  }
}
```

---

## Implementation Timeline

### Recommended Sequence

**Week 1-3: Feature 1 - pgvector**
- Week 1: Database setup, schema migration
- Week 2: Update query methods, integrate with services
- Week 3: Testing, validation, performance tuning

**Week 4-7: Feature 2 - Python RAG Service**
- Week 4: Service setup, embedding service
- Week 5: RAG search service, database integration
- Week 6: API endpoints, Node.js integration
- Week 7: Testing, deployment

**Week 8-9: Feature 3 - JWT Authentication** (Parallel with Feature 2)
- Week 8: JWT service, middleware updates
- Week 9: Frontend integration, testing

### Parallel Development Strategy

- **Developer 1:** Focus on pgvector (Weeks 1-3)
- **Developer 2:** Start JWT after Week 1 (Weeks 2-3, parallel)
- **Developer 3:** Python RAG service (Weeks 4-7, depends on pgvector)

---

## Testing Strategy

### Unit Tests
- Embedding generation accuracy
- Vector similarity calculations
- JWT token generation/verification
- Tenant isolation

### Integration Tests
- End-to-end RAG search
- Multi-tenant knowledge base queries
- Authentication flow with JWT
- Service communication (Node.js ↔ Python)

### Performance Tests
- Vector search latency
- Embedding generation throughput
- JWT verification overhead
- Concurrent query handling

---

## Deployment Considerations

### Environment Variables

```bash
# .env
# pgvector
DATABASE_URL=postgresql://...  # Must have pgvector extension

# Python RAG Service
RAG_SERVICE_URL=http://python-rag:8001

# JWT Authentication
JWT_SECRET=<256-bit-random-string>
JWT_EXPIRES_IN=7d

# OpenAI (optional)
OPENAI_API_KEY=sk-...
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  db:
    image: pgvector/pgvector:pg15
    environment:
      POSTGRES_DB: ils
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  python-rag:
    build: ./python-rag-service
    ports:
      - "8001:8001"
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/ils
    depends_on:
      - db

  node-backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/ils
      RAG_SERVICE_URL: http://python-rag:8001
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - db
      - python-rag
```

---

## Success Criteria

### Feature 1: pgvector ✅
- [ ] pgvector extension installed and working
- [ ] All JSONB embeddings migrated to vector type
- [ ] Vector similarity search 10x+ faster than Jaccard
- [ ] 100% tenant isolation maintained
- [ ] Tests passing with >90% coverage

### Feature 2: Python RAG Service ✅
- [ ] Python service deployed and accessible
- [ ] Embedding generation API functional
- [ ] RAG search returns relevant results
- [ ] Integration with Node.js backend complete
- [ ] Performance benchmarks met (<100ms per search)

### Feature 3: JWT Authentication ✅
- [ ] JWT tokens generated on login
- [ ] Token verification working in middleware
- [ ] Token refresh mechanism implemented
- [ ] Frontend updated to use JWT
- [ ] No breaking changes for existing users

---

## Risk Mitigation

### Risks & Mitigation Strategies

| Risk | Impact | Mitigation |
|------|--------|------------|
| pgvector migration fails | High | Keep JSONB column during migration, test thoroughly |
| Python service downtime | Medium | Implement fallback to Node.js embedding service |
| JWT breaks existing sessions | High | Deploy JWT alongside session auth, gradual migration |
| Performance degradation | Medium | Benchmark continuously, optimize indexes |
| Data loss during migration | Critical | Full database backup before migration |

---

## Next Steps

Choose which feature to implement first:

1. **Recommended:** Start with pgvector (foundation for RAG)
2. **Parallel:** JWT authentication (independent feature)
3. **After pgvector:** Python RAG service (depends on vector search)

**Ready to start? Let me know which feature you'd like to implement first!**
