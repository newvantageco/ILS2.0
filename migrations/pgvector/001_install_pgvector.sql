-- Migration: Install pgvector Extension
-- Date: 2025-11-25
-- Description: Install pgvector extension for vector similarity search
-- Requires: PostgreSQL 11+ with pgvector extension compiled

-- Install pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
    ) THEN
        RAISE EXCEPTION 'pgvector extension installation failed';
    END IF;

    RAISE NOTICE 'pgvector extension installed successfully';
END $$;

-- Test basic vector operations
DO $$
DECLARE
    test_distance FLOAT;
BEGIN
    -- Test cosine distance operator
    SELECT '[1,2,3]'::vector <=> '[4,5,6]'::vector INTO test_distance;
    RAISE NOTICE 'pgvector test successful. Distance: %', test_distance;
END $$;

-- Display version info
SELECT extversion FROM pg_extension WHERE extname = 'vector';
