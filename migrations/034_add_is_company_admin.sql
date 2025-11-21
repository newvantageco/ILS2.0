-- Add is_company_admin column to users table
-- This separates functional roles from company administration privileges

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_company_admin BOOLEAN DEFAULT FALSE;

-- Migrate existing company_admin role users to keep their functional role
-- and set the is_company_admin flag
UPDATE users 
SET is_company_admin = TRUE 
WHERE role = 'company_admin';

-- Comment for clarity
COMMENT ON COLUMN users.is_company_admin IS 'Indicates if user has company admin privileges. Functional role remains in role column.';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_is_company_admin ON users(is_company_admin) WHERE is_company_admin = TRUE;

-- Verification query (commented out, for reference)
-- SELECT email, role, is_company_admin, company_id FROM users WHERE is_company_admin = TRUE;
