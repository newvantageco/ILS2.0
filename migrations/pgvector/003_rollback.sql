-- Migration Rollback: Remove Vector Columns and Extension
-- Date: 2025-11-25
-- Description: Rollback script to safely remove pgvector changes
-- WARNING: This will delete all vector embeddings!

-- Drop indexes first
DROP INDEX IF EXISTS ai_knowledge_embedding_ivfflat_idx;
DROP INDEX IF EXISTS ai_knowledge_embedding_hnsw_idx;
DROP INDEX IF EXISTS ai_knowledge_company_active_idx;

-- Drop vector column (keeps JSONB embeddings column as backup)
ALTER TABLE ai_knowledge_base DROP COLUMN IF EXISTS embedding;

-- Optionally remove pgvector extension
-- WARNING: This will fail if other tables/functions depend on it
-- DROP EXTENSION IF EXISTS vector CASCADE;

RAISE NOTICE 'Rollback complete. JSONB embeddings column retained as backup.';
