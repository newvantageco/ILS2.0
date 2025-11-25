-- pgvector Installation Script
-- Run this as a PostgreSQL superuser

-- Step 1: Install pgvector extension
-- This requires the pgvector package to be installed on the database server
-- See: https://github.com/pgvector/pgvector#installation

CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Verify installation
SELECT extname, extversion
FROM pg_extension
WHERE extname = 'vector';

-- Step 3: Test vector operations
SELECT '[1,2,3]'::vector <=> '[4,5,6]'::vector AS cosine_distance;

-- Step 4: Show vector functions available
\df *vector*

-- Expected output:
-- extname | extversion
-- --------+-----------
-- vector  | 0.5.1 (or higher)
--
-- cosine_distance
-- ----------------
-- 0.025368... (some small number)
--
-- Functions list should include:
-- - vector_in, vector_out (I/O functions)
-- - vector_send, vector_recv (binary I/O)
-- - vector_dims (get dimensions)
-- - Operators: <->, <=>, <#> (L2, cosine, inner product distances)
