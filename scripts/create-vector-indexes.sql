-- Create Vector Indexes for ai_knowledge_base
-- Run after pgvector extension is installed and vector column exists

-- Note: These indexes should be created AFTER data is migrated to vector column
-- For best performance, create index after bulk loading data

-- Option 1: IVFFlat Index (Faster to build, good for most use cases)
-- Recommended for datasets with 10k-1M vectors
CREATE INDEX CONCURRENTLY IF NOT EXISTS ai_knowledge_embedding_ivfflat_idx
  ON ai_knowledge_base
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- lists parameter guide:
-- - lists = sqrt(row_count) for small datasets (< 100k rows)
-- - lists = row_count / 1000 for medium datasets (100k - 1M rows)
-- - lists = 1000 for large datasets (> 1M rows)

-- Option 2: HNSW Index (Slower to build, best recall)
-- Recommended for datasets requiring highest accuracy
-- Uncomment if you need maximum recall at the cost of build time:
/*
CREATE INDEX CONCURRENTLY IF NOT EXISTS ai_knowledge_embedding_hnsw_idx
  ON ai_knowledge_base
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
*/

-- HNSW parameters guide:
-- - m: Max connections per node (16 is good default, higher = better recall but slower)
-- - ef_construction: Size of dynamic candidate list (64-200, higher = better index quality)

-- Verify indexes were created
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'ai_knowledge_base'
  AND indexname LIKE '%embedding%';

-- Check index size
SELECT
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes
WHERE tablename = 'ai_knowledge_base'
  AND indexname LIKE '%embedding%';

-- Test query performance (replace with actual embedding values)
EXPLAIN ANALYZE
SELECT
  id,
  filename,
  1 - (embedding <=> '[0.1, 0.2, 0.3, ...]'::vector) AS similarity
FROM ai_knowledge_base
WHERE company_id = 'test-company'
  AND embedding IS NOT NULL
ORDER BY embedding <=> '[0.1, 0.2, 0.3, ...]'::vector
LIMIT 10;

-- Expected: Index scan (not Seq Scan) should be used
