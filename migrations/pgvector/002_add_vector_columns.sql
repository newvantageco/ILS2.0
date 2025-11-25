-- Migration: Add Vector Columns to AI Tables
-- Date: 2025-11-25
-- Description: Add vector columns for embeddings with proper indexing
-- Dependencies: 001_install_pgvector.sql

-- Add vector column to ai_knowledge_base
ALTER TABLE ai_knowledge_base
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create comment explaining the column
COMMENT ON COLUMN ai_knowledge_base.embedding IS
'Vector embedding (1536 dimensions for OpenAI text-embedding-ada-002). Used for semantic similarity search.';

-- Create IVFFlat index for fast similarity search
-- IVFFlat is faster for large datasets but requires training
-- lists = 100 is a good starting point (adjust based on data size)
CREATE INDEX IF NOT EXISTS ai_knowledge_embedding_ivfflat_idx
ON ai_knowledge_base
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Alternative: HNSW index (more accurate but slower to build)
-- Uncomment if you need higher accuracy at the cost of build time:
-- CREATE INDEX IF NOT EXISTS ai_knowledge_embedding_hnsw_idx
-- ON ai_knowledge_base
-- USING hnsw (embedding vector_cosine_ops)
-- WITH (m = 16, ef_construction = 64);

-- Add index for combined filtering (company_id + vector search)
-- This helps when filtering by company before similarity search
CREATE INDEX IF NOT EXISTS ai_knowledge_company_active_idx
ON ai_knowledge_base (company_id, is_active)
WHERE embedding IS NOT NULL;

-- Display migration summary
DO $$
DECLARE
    total_rows INTEGER;
    rows_with_embedding INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_rows FROM ai_knowledge_base;
    SELECT COUNT(*) INTO rows_with_embedding FROM ai_knowledge_base WHERE embedding IS NOT NULL;

    RAISE NOTICE '=== Migration Summary ===';
    RAISE NOTICE 'Total rows: %', total_rows;
    RAISE NOTICE 'Rows with embeddings: %', rows_with_embedding;
    RAISE NOTICE 'Rows pending migration: %', total_rows - rows_with_embedding;
    RAISE NOTICE '========================';
END $$;

-- Verify index creation
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'ai_knowledge_base'
AND indexname LIKE '%embedding%';
