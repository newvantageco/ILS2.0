-- Fix Database Permissions for Drizzle Migrations
-- Run this as a database superuser to grant schema creation permissions

-- Grant schema creation permission to your database user
-- Replace 'your_username' with your actual database user
GRANT CREATE ON DATABASE ils_db TO your_username;

-- Alternative: Create the drizzle schema manually
CREATE SCHEMA IF NOT EXISTS drizzle;

-- Grant usage on the schema
GRANT USAGE ON SCHEMA drizzle TO your_username;
GRANT ALL PRIVILEGES ON SCHEMA drizzle TO your_username;

-- Grant all privileges on all tables in public schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_username;

-- Grant future privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO your_username;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO your_username;

-- Verify permissions
SELECT 
    r.rolname as username,
    ARRAY(SELECT b.datname
          FROM pg_catalog.pg_database b
          WHERE has_database_privilege(r.oid, b.oid, 'CONNECT')
    ) as databases,
    ARRAY(SELECT nspname 
          FROM pg_namespace 
          WHERE has_schema_privilege(r.oid, oid, 'CREATE')
    ) as can_create_schema
FROM pg_catalog.pg_roles r
WHERE r.rolname = 'your_username';
