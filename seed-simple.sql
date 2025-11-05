-- ================================================
-- SIMPLE SAMPLE DATA SEEDING (CORRECTED)
-- ================================================
-- Run with: psql postgres://neon:npg@localhost:5432/ils_db -f seed-simple.sql

\echo '🌱 Adding sample data...'

-- Company ID to use
-- f86ea164-525c-432e-b86f-0b598d09d12d = "New Vantage Co"

-- User ID for ecp_id
-- dc438435-7e60-4a20-a17f-0c1f71e881fb = saban@newvantageco.com

-- ================================================
-- SAMPLE PATIENTS (using correct schema)
-- ================================================
\echo '👥 Adding patients...'

INSERT INTO patients (
  id, name, date_of_birth, email, nhs_number, 
  full_address, ecp_id, company_id, customer_number,
  created_at
)
VALUES 
  (
    gen_random_uuid(), 
    'John Smith', 
    '1985-01-15', 
    'john.smith@example.com', 
    'NHS123456789',
    '{"street":"123 Main Street","city":"London","postcode":"SW1A 1AA"}'::jsonb,
    'dc438435-7e60-4a20-a17f-0c1f71e881fb',
    'f86ea164-525c-432e-b86f-0b598d09d12d',
    'CUST-001',
    now()
  ),
  (
    gen_random_uuid(), 
    'Jane Doe', 
    '1990-03-22', 
    'jane.doe@example.com', 
    'NHS987654321',
    '{"street":"456 Oak Avenue","city":"Manchester","postcode":"M1 1AA"}'::jsonb,
    'dc438435-7e60-4a20-a17f-0c1f71e881fb',
    'f86ea164-525c-432e-b86f-0b598d09d12d',
    'CUST-002',
    now()
  ),
  (
    gen_random_uuid(), 
    'Bob Johnson', 
    '1978-07-10', 
    'bob.johnson@example.com', 
    'NHS456789123',
    '{"street":"789 Pine Road","city":"Birmingham","postcode":"B1 1AA"}'::jsonb,
    'dc438435-7e60-4a20-a17f-0c1f71e881fb',
    'f86ea164-525c-432e-b86f-0b598d09d12d',
    'CUST-003',
    now()
  ),
  (
    gen_random_uuid(), 
    'Sarah Williams', 
    '1995-11-30', 
    'sarah.williams@example.com', 
    'NHS789123456',
    '{"street":"321 Elm Street","city":"Edinburgh","postcode":"EH1 1AA"}'::jsonb,
    'dc438435-7e60-4a20-a17f-0c1f71e881fb',
    'f86ea164-525c-432e-b86f-0b598d09d12d',
    'CUST-004',
    now()
  ),
  (
    gen_random_uuid(), 
    'Michael Brown', 
    '1982-05-18', 
    'michael.brown@example.com', 
    'NHS321654987',
    '{"street":"654 Maple Drive","city":"Glasgow","postcode":"G1 1AA"}'::jsonb,
    'dc438435-7e60-4a20-a17f-0c1f71e881fb',
    'f86ea164-525c-432e-b86f-0b598d09d12d',
    'CUST-005',
    now()
  )
ON CONFLICT (id) DO NOTHING;

\echo '✅ Sample data added!'
\echo ''
\echo '📊 Summary:'
SELECT COUNT(*) as total_patients 
FROM patients 
WHERE company_id = 'f86ea164-525c-432e-b86f-0b598d09d12d';

\echo ''
\echo '🎉 Ready! Log in at http://localhost:3000'
\echo '   Email: saban@newvantageco.com'
