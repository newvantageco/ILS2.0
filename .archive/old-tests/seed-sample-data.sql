-- ================================================
-- INTEGRATED LENS SYSTEM - SAMPLE DATA SEEDING
-- ================================================
-- This script adds sample data to demonstrate all platform features
-- Run with: psql postgres://neon:npg@localhost:5432/ils_db -f seed-sample-data.sql

-- Use the existing company
-- f86ea164-525c-432e-b86f-0b598d09d12d = "New Vantage Co"

\echo '🌱 Starting sample data seeding...'

-- ================================================
-- 1. SAMPLE PATIENTS
-- ================================================
\echo '👥 Adding sample patients...'

INSERT INTO patients (id, company_id, first_name, last_name, email, phone, date_of_birth, address, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'John', 'Smith', 'john.smith@example.com', '02071234567', '1985-01-15', '{"street":"123 Main Street","city":"London","postcode":"SW1A 1AA","country":"UK"}'::jsonb, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Jane', 'Doe', 'jane.doe@example.com', '01619876543', '1990-03-22', '{"street":"456 Oak Avenue","city":"Manchester","postcode":"M1 1AA","country":"UK"}'::jsonb, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Bob', 'Johnson', 'bob.johnson@example.com', '01215551234', '1978-07-10', '{"street":"789 Pine Road","city":"Birmingham","postcode":"B1 1AA","country":"UK"}'::jsonb, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Sarah', 'Williams', 'sarah.williams@example.com', '01315554321', '1995-11-30', '{"street":"321 Elm Street","city":"Edinburgh","postcode":"EH1 1AA","country":"UK"}'::jsonb, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Michael', 'Brown', 'michael.brown@example.com', '01415559876', '1982-05-18', '{"street":"654 Maple Drive","city":"Glasgow","postcode":"G1 1AA","country":"UK"}'::jsonb, now(), now())
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- 2. SAMPLE PRODUCTS/INVENTORY
-- ================================================
\echo '📦 Adding sample products...'

INSERT INTO products (id, company_id, name, sku, category, price, cost, stock_quantity, reorder_level, description, is_active, created_at, updated_at)
VALUES
  -- Lenses
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Standard Single Vision Lens', 'SVL-001', 'Lenses', 45.00, 20.00, 100, 20, 'High-quality single vision lens with standard coating', true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Premium Single Vision Lens', 'SVL-002', 'Lenses', 65.00, 30.00, 75, 15, 'Premium single vision lens with anti-glare and scratch resistance', true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Progressive Lens - Standard', 'PROG-001', 'Lenses', 125.00, 60.00, 50, 10, 'Standard progressive lens with wide viewing zones', true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Progressive Lens - Premium', 'PROG-002', 'Lenses', 175.00, 85.00, 35, 8, 'Premium progressive lens with digital surfacing', true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Bifocal Lens', 'BIF-001', 'Lenses', 85.00, 40.00, 40, 10, 'Traditional bifocal lens', true, now(), now()),
  
  -- Frames
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Classic Metal Frame - Gold', 'FRAME-001', 'Frames', 85.00, 35.00, 75, 15, 'Timeless metal frame in gold finish', true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Classic Metal Frame - Silver', 'FRAME-002', 'Frames', 85.00, 35.00, 60, 15, 'Timeless metal frame in silver finish', true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Designer Acetate Frame', 'FRAME-003', 'Frames', 145.00, 65.00, 40, 10, 'Premium acetate frame with designer styling', true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Rimless Frame', 'FRAME-004', 'Frames', 120.00, 55.00, 30, 8, 'Modern rimless design', true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Sport Frame', 'FRAME-005', 'Frames', 95.00, 40.00, 50, 12, 'Durable sport frame with rubberized grips', true, now(), now()),
  
  -- Contact Lenses
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Daily Disposable Contact Lenses (30pk)', 'CL-DAILY-30', 'Contact Lenses', 35.00, 18.00, 200, 50, 'Comfortable daily disposable contact lenses', true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Monthly Contact Lenses (6pk)', 'CL-MONTH-6', 'Contact Lenses', 45.00, 22.00, 150, 30, 'Monthly replacement contact lenses', true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Toric Contact Lenses for Astigmatism (30pk)', 'CL-TORIC-30', 'Contact Lenses', 55.00, 28.00, 100, 25, 'Daily toric lenses for astigmatism correction', true, now(), now()),
  
  -- Accessories
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Cleaning Solution (360ml)', 'ACC-CLEAN-360', 'Accessories', 12.00, 5.00, 300, 50, 'Multi-purpose contact lens solution', true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Glasses Case - Hard', 'ACC-CASE-001', 'Accessories', 8.00, 3.00, 250, 50, 'Protective hard case for glasses', true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Microfiber Cleaning Cloth', 'ACC-CLOTH-001', 'Accessories', 3.00, 1.00, 500, 100, 'Lint-free microfiber cleaning cloth', true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- 3. SAMPLE SUPPLIERS
-- ================================================
\echo '🏢 Adding sample suppliers...'

INSERT INTO suppliers (id, company_id, name, email, phone, address, contact_person, payment_terms, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Vision Lens Labs Ltd', 'orders@visionlenslabs.co.uk', '02078901234', '{"street":"45 Industrial Park","city":"London","postcode":"E1 6AN","country":"UK"}'::jsonb, 'David Wilson', '{"terms":"Net 30","discount":"2% if paid within 10 days"}'::jsonb, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'Frame Masters International', 'sales@framemasters.com', '01619998877', '{"street":"12 Commerce Way","city":"Manchester","postcode":"M3 3FH","country":"UK"}'::jsonb, 'Emma Thompson', '{"terms":"Net 30"}'::jsonb, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'ClearVision Contacts', 'info@clearvisioncontacts.co.uk', '01215554444', '{"street":"78 Medical Plaza","city":"Birmingham","postcode":"B5 4AA","country":"UK"}'::jsonb, 'James Miller', '{"terms":"Net 45","discount":"5% for orders over £500"}'::jsonb, now(), now())
ON CONFLICT (id) DO NOTHING;

\echo '✅ Sample data seeded successfully!'
\echo ''
\echo '📊 Summary:'
SELECT 
  (SELECT COUNT(*) FROM patients WHERE company_id = 'f86ea164-525c-432e-b86f-0b598d09d12d') as patients,
  (SELECT COUNT(*) FROM products WHERE company_id = 'f86ea164-525c-432e-b86f-0b598d09d12d') as products,
  (SELECT COUNT(*) FROM suppliers WHERE company_id = 'f86ea164-525c-432e-b86f-0b598d09d12d') as suppliers;

\echo ''
\echo '🎉 Ready to use! Log in and explore the platform with sample data.'
\echo '   Login: saban@newvantageco.com'
\echo '   URL: http://localhost:3000'
