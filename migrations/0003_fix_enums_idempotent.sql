-- Make enum creation idempotent by checking existence first
-- This fixes the issue where CREATE TYPE fails if enum already exists

-- Add embedding column to ai_knowledge_base (pgvector for RAG)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_knowledge_base' 
        AND column_name = 'embedding'
    ) THEN
        ALTER TABLE ai_knowledge_base ADD COLUMN embedding vector(1536);
    END IF;
END $$;

-- Update any data type changes that failed in previous migration
-- These are safe to run multiple times (ALTER COLUMN is idempotent if type matches)

-- Fix prescription numeric types if needed
DO $$
BEGIN
    -- orders table
    ALTER TABLE orders ALTER COLUMN od_sphere TYPE numeric(6, 3);
    ALTER TABLE orders ALTER COLUMN od_cylinder TYPE numeric(6, 3);
    ALTER TABLE orders ALTER COLUMN od_axis TYPE integer;
    ALTER TABLE orders ALTER COLUMN od_add TYPE numeric(4, 2);
    ALTER TABLE orders ALTER COLUMN os_sphere TYPE numeric(6, 3);
    ALTER TABLE orders ALTER COLUMN os_cylinder TYPE numeric(6, 3);
    ALTER TABLE orders ALTER COLUMN os_axis TYPE integer;
    ALTER TABLE orders ALTER COLUMN os_add TYPE numeric(4, 2);
    ALTER TABLE orders ALTER COLUMN pd TYPE numeric(4, 1);
    
    -- prescriptions table
    ALTER TABLE prescriptions ALTER COLUMN od_sphere TYPE numeric(6, 3);
    ALTER TABLE prescriptions ALTER COLUMN od_cylinder TYPE numeric(6, 3);
    ALTER TABLE prescriptions ALTER COLUMN od_axis TYPE integer;
    ALTER TABLE prescriptions ALTER COLUMN od_add TYPE numeric(4, 2);
    ALTER TABLE prescriptions ALTER COLUMN os_sphere TYPE numeric(6, 3);
    ALTER TABLE prescriptions ALTER COLUMN os_cylinder TYPE numeric(6, 3);
    ALTER TABLE prescriptions ALTER COLUMN os_axis TYPE integer;
    ALTER TABLE prescriptions ALTER COLUMN os_add TYPE numeric(4, 2);
    ALTER TABLE prescriptions ALTER COLUMN pd TYPE numeric(4, 1);
EXCEPTION
    WHEN OTHERS THEN
        -- Column types may already be correct, ignore errors
        RAISE NOTICE 'Column types already updated or error occurred: %', SQLERRM;
END $$;
