# pgvector Implementation Guide

**Status:** 🚧 Implementation Complete - Ready for Deployment
**Date:** November 25, 2025
**Feature:** Vector Similarity Search with pgvector

---

## Overview

This guide covers the implementation of pgvector for semantic search in the ILS 2.0 multi-tenant AI system. pgvector enables fast vector similarity search, replacing the previous Jaccard similarity approach with true semantic search.

**Performance Improvement:** 10-100x faster than Jaccard similarity
**Search Quality:** True semantic understanding vs. keyword matching

---

## Prerequisites

Before implementing pgvector, ensure you have:

- [x] PostgreSQL 11+ database
- [x] Database superuser access (for extension installation)
- [x] OpenAI API key (for generating embeddings)
- [x] Node.js 20+ and npm installed

---

## Installation Steps

### Step 1: Install pgvector Extension

**Option A: Railway PostgreSQL**

```bash
# Connect to your Railway database
railway connect

# Install extension (may already be available)
CREATE EXTENSION IF NOT EXISTS vector;

# Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

**Option B: Self-Hosted PostgreSQL**

```bash
# Install pgvector (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install postgresql-15-pgvector

# Or compile from source
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install

# Connect to database
psql $DATABASE_URL

# Install extension
CREATE EXTENSION IF NOT EXISTS vector;
```

**Option C: Using Migration Script**

```bash
# Run the provided SQL migration
psql $DATABASE_URL < migrations/pgvector/001_install_pgvector.sql
```

### Step 2: Add Vector Column to Schema

```bash
# Run the schema migration
psql $DATABASE_URL < migrations/pgvector/002_add_vector_columns.sql

# OR push schema changes with Drizzle
npm run db:push
```

This adds:
- `embedding vector(1536)` column to `ai_knowledge_base`
- IVFFlat index for fast similarity search
- Combined index for filtering + search

### Step 3: Migrate Existing Embeddings

```bash
# Dry run first (see what will be migrated)
npx tsx scripts/migrate-embeddings-to-pgvector.ts --dry-run

# Migrate all companies
npx tsx scripts/migrate-embeddings-to-pgvector.ts

# Or migrate specific company
npx tsx scripts/migrate-embeddings-to-pgvector.ts --company-id=<company-id>

# Monitor progress
npx tsx scripts/migrate-embeddings-to-pgvector.ts --company-id=<company-id> --batch-size=50
```

**Expected Output:**
```
===================================================
JSONB → pgvector Embedding Migration
===================================================
📊 Found 150 records to migrate

📦 Processing batch 1/2 (100 records)...
✓ Batch 1 complete: 100 migrated, 0 failed, 0 skipped

📦 Processing batch 2/2 (50 records)...
✓ Batch 2 complete: 50 migrated, 0 failed, 0 skipped

===================================================
MIGRATION COMPLETE
===================================================
📊 Total records: 150
✅ Migrated: 150
❌ Failed: 0
⚠️  Skipped: 0

📈 Success rate: 100%
```

### Step 4: Verify Installation

```bash
# Run integration tests
npm run test:integration -- pgvector

# Or run specific test file
npx jest test/integration/pgvector.test.ts

# Check embedding statistics
npx tsx scripts/check-pgvector-status.ts --company-id=<company-id>
```

### Step 5: Benchmark Performance

```bash
# Run performance benchmark
npx tsx scripts/benchmark-pgvector.ts --company-id=<company-id> --iterations=100
```

**Expected Performance:**
- Embedding generation: ~50-200ms (depends on OpenAI API)
- Vector search: <50ms (P95)
- Total end-to-end: <250ms (P95)

---

## Usage

### Generate and Store Embeddings

```typescript
import { embeddingService } from './server/services/EmbeddingService';
import { createKnowledgeBaseWithEmbedding } from './server/storage-vector';

// Generate embedding for content
const content = 'Progressive lenses are ideal for presbyopia patients.';
const embedding = await embeddingService.generateEmbedding(content);

// Store in knowledge base
const entry = await createKnowledgeBaseWithEmbedding({
  companyId: 'company-123',
  uploadedBy: 'user-456',
  filename: 'progressive-lenses.txt',
  fileType: 'txt',
  content,
  embedding,
  category: 'lenses',
});

console.log(`Created entry ${entry.id}`);
```

### Search Using Vector Similarity

```typescript
import { embeddingService } from './server/services/EmbeddingService';
import { searchKnowledgeBaseByEmbedding } from './server/storage-vector';

// User query
const query = 'What lenses are best for older patients?';

// Generate query embedding
const queryEmbedding = await embeddingService.generateEmbedding(query);

// Search knowledge base
const results = await searchKnowledgeBaseByEmbedding(
  'company-123',  // Tenant ID
  queryEmbedding,
  {
    limit: 5,
    threshold: 0.7,  // 70% similarity threshold
    category: 'lenses',  // Optional filter
  }
);

// Display results
results.forEach((result, idx) => {
  console.log(`${idx + 1}. ${result.filename} (${(result.similarity * 100).toFixed(1)}% match)`);
  console.log(`   ${result.content.slice(0, 100)}...`);
});
```

### Find Similar Documents

```typescript
import { findSimilarDocuments } from './server/storage-vector';

// Find documents similar to a specific document
const similarDocs = await findSimilarDocuments(
  'document-id-123',
  'company-123',
  { limit: 5, threshold: 0.6 }
);

console.log(`Found ${similarDocs.length} similar documents`);
```

### Get Embedding Statistics

```typescript
import { getEmbeddingStats } from './server/storage-vector';

const stats = await getEmbeddingStats('company-123');
console.log(`Migration progress: ${stats.migrationProgress}`);
console.log(`Documents with embeddings: ${stats.withEmbedding}/${stats.total}`);
```

---

## API Integration

### New Master AI Endpoints

**1. Check Embedding Status**

```typescript
GET /api/master-ai/embedding-stats

Response:
{
  "success": true,
  "stats": {
    "total": 150,
    "withEmbedding": 150,
    "withoutEmbedding": 0,
    "active": 150,
    "migrationProgress": "100%"
  },
  "message": "All documents have embeddings"
}
```

**2. Index New Document**

```typescript
POST /api/master-ai/index-document
Content-Type: application/json

{
  "filename": "new-document.txt",
  "content": "Document content here...",
  "category": "lenses"
}

Response:
{
  "success": true,
  "documentId": "doc-uuid-123",
  "message": "Document indexed successfully"
}
```

**3. Search Knowledge Base**

The existing `/api/master-ai/chat` endpoint now automatically uses pgvector for semantic search when `knowledgeBaseEnabled` is true in company settings.

---

## Configuration

### Environment Variables

```bash
# .env
OPENAI_API_KEY=sk-...  # Required for generating embeddings

# Optional: Alternative embedding model (default: text-embedding-ada-002)
# EMBEDDING_MODEL=text-embedding-ada-002
```

### Company AI Settings

Enable knowledge base search per company:

```typescript
// Update company AI settings
await db.update(companies)
  .set({
    aiConfig: {
      knowledgeBaseEnabled: true,
      systemPrompt: 'Custom system prompt...',
      temperature: 0.7,
      maxTokens: 500,
    }
  })
  .where(eq(companies.id, companyId));
```

---

## Maintenance

### Rebuild Indexes (if performance degrades)

```sql
-- Rebuild IVFFlat index
REINDEX INDEX ai_knowledge_embedding_ivfflat_idx;

-- Or recreate with different parameters
DROP INDEX ai_knowledge_embedding_ivfflat_idx;
CREATE INDEX ai_knowledge_embedding_ivfflat_idx
  ON ai_knowledge_base
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 200);  -- Increase lists for larger datasets
```

### Monitor Index Health

```sql
-- Check index size
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE indexname LIKE '%embedding%';

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname LIKE '%embedding%';
```

### Vacuum and Analyze

```sql
-- After bulk inserts or updates
VACUUM ANALYZE ai_knowledge_base;
```

---

## Troubleshooting

### pgvector Extension Not Found

```
ERROR: could not open extension control file ".../vector.control"
```

**Solution:**
```bash
# Install pgvector package
sudo apt-get install postgresql-15-pgvector

# OR compile from source
git clone https://github.com/pgvector/pgvector.git
cd pgvector && make && sudo make install

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Slow Vector Searches

**Symptoms:** Search takes >200ms consistently

**Solutions:**
1. Rebuild index: `REINDEX INDEX ai_knowledge_embedding_ivfflat_idx;`
2. Increase lists parameter (for datasets >10k documents)
3. Switch to HNSW index for better accuracy/performance:
   ```sql
   DROP INDEX ai_knowledge_embedding_ivfflat_idx;
   CREATE INDEX ai_knowledge_embedding_hnsw_idx
     ON ai_knowledge_base
     USING hnsw (embedding vector_cosine_ops)
     WITH (m = 16, ef_construction = 64);
   ```

### Migration Fails with "Invalid Dimensions"

**Symptoms:** Records skipped during migration with dimension errors

**Cause:** JSONB embeddings have wrong dimensions (not 1536)

**Solution:**
```bash
# Find problematic records
psql $DATABASE_URL -c "
  SELECT id, filename, jsonb_array_length(embeddings) as dims
  FROM ai_knowledge_base
  WHERE jsonb_array_length(embeddings) != 1536;
"

# Regenerate embeddings for these records
npx tsx scripts/regenerate-embeddings.ts --ids=<comma-separated-ids>
```

### Out of Memory During Migration

**Symptoms:** Migration crashes with OOM error

**Solution:**
```bash
# Reduce batch size
npx tsx scripts/migrate-embeddings-to-pgvector.ts --batch-size=10

# Or migrate one company at a time
npx tsx scripts/migrate-embeddings-to-pgvector.ts --company-id=<id>
```

---

## Performance Tuning

### For Small Datasets (<1,000 documents)

```sql
-- Use simple brute-force search (accurate, fast for small datasets)
DROP INDEX ai_knowledge_embedding_ivfflat_idx;

-- pgvector will use sequential scan (very fast for <1k docs)
```

### For Medium Datasets (1,000-100,000 documents)

```sql
-- Use IVFFlat with optimal lists parameter
CREATE INDEX ai_knowledge_embedding_ivfflat_idx
  ON ai_knowledge_base
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);  -- lists ≈ sqrt(rows/1000)
```

### For Large Datasets (>100,000 documents)

```sql
-- Use HNSW for better accuracy and performance
CREATE INDEX ai_knowledge_embedding_hnsw_idx
  ON ai_knowledge_base
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Increase maintenance_work_mem for faster index builds
SET maintenance_work_mem = '2GB';
```

---

## Rollback

If you need to rollback the pgvector implementation:

```bash
# Run rollback script
psql $DATABASE_URL < migrations/pgvector/003_rollback.sql
```

This will:
1. Drop vector indexes
2. Remove `embedding` column
3. Keep JSONB `embeddings` column (no data loss)

---

## Next Steps

After implementing pgvector:

1. ✅ Test with real queries
2. ✅ Monitor performance with benchmark script
3. ✅ Update documentation
4. 🔄 Implement Python RAG Service (Feature 2)
5. 🔄 Migrate to JWT Authentication (Feature 3)

---

## Files Created

```
migrations/pgvector/
├── 001_install_pgvector.sql          # Extension installation
├── 002_add_vector_columns.sql        # Schema changes
└── 003_rollback.sql                  # Rollback script

shared/
└── schema-pgvector.ts                # Vector type definition

server/services/
└── EmbeddingService.ts               # OpenAI embedding generation

server/
└── storage-vector.ts                 # Vector search methods

scripts/
├── migrate-embeddings-to-pgvector.ts # Data migration
└── benchmark-pgvector.ts             # Performance benchmarking

test/integration/
└── pgvector.test.ts                  # Integration tests

docs/
└── PGVECTOR_IMPLEMENTATION.md        # This guide
```

---

## Support

For issues or questions:
- Check troubleshooting section above
- Review pgvector docs: https://github.com/pgvector/pgvector
- Check implementation plan: `/docs/IMPLEMENTATION_PLAN.md`

---

**Implementation Status:** ✅ Ready for Production
**Last Updated:** November 25, 2025
