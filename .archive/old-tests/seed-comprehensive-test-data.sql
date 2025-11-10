-- ================================================
-- COMPREHENSIVE TEST DATA FOR INTEGRATED LENS SYSTEM
-- ================================================
-- This script adds extensive test data including:
-- - Multiple companies (ECPs and Labs)
-- - Products (lenses, frames, contact lenses, accessories)
-- - Patients with complete records
-- - Eye examinations and prescriptions
-- - Orders and inventory
-- - Equipment and suppliers
-- ================================================
-- Run with: psql postgres://neon:npg@localhost:5432/ils_db -f seed-comprehensive-test-data.sql

\echo '🌱 Starting comprehensive test data seeding...'
\echo ''

-- ================================================
-- 1. ADDITIONAL TEST COMPANIES
-- ================================================
\echo '🏢 Adding test companies...'

-- Create additional ECP companies
INSERT INTO companies (
  id, name, type, status, email, phone, website, 
  address, registration_number, goc_number, subscription_plan,
  subscription_start_date, has_ecp_access, ai_enabled, created_at, updated_at
)
VALUES 
  (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Vision Care London',
    'ecp',
    'active',
    'info@visioncarelondon.co.uk',
    '02071234567',
    'https://visioncarelondon.co.uk',
    '{"street":"123 High Street","city":"London","postcode":"SW1A 1AA","country":"UK"}'::jsonb,
    'VCL-001',
    'GOC-12345',
    'full',
    now() - interval '6 months',
    true,
    true,
    now(),
    now()
  ),
  (
    'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
    'Manchester Optical Centre',
    'ecp',
    'active',
    'contact@manchesteroptical.co.uk',
    '01619998877',
    'https://manchesteroptical.co.uk',
    '{"street":"45 Market Street","city":"Manchester","postcode":"M1 1WR","country":"UK"}'::jsonb,
    'MOC-002',
    'GOC-23456',
    'full',
    now() - interval '1 year',
    true,
    true,
    now(),
    now()
  ),
  (
    'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
    'Precision Lens Laboratory',
    'lab',
    'active',
    'orders@precisionlens.co.uk',
    '01215554444',
    'https://precisionlens.co.uk',
    '{"street":"Industrial Estate Unit 5","city":"Birmingham","postcode":"B2 4BJ","country":"UK"}'::jsonb,
    'PLL-003',
    'LAB-34567',
    'full',
    now() - interval '2 years',
    false,
    true,
    now(),
    now()
  ),
  (
    'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8g',
    'Edinburgh Eye Clinic',
    'ecp',
    'active',
    'admin@edinburgheye.co.uk',
    '01315557788',
    'https://edinburgheye.co.uk',
    '{"street":"78 Princes Street","city":"Edinburgh","postcode":"EH2 2ER","country":"UK"}'::jsonb,
    'EEC-004',
    'GOC-45678',
    'full',
    now() - interval '3 months',
    true,
    true,
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

\echo '✅ Added 4 test companies'

-- ================================================
-- 2. COMPREHENSIVE PRODUCT CATALOG
-- ================================================
\echo '📦 Adding comprehensive product catalog...'

-- Use the existing company: f86ea164-525c-432e-b86f-0b598d09d12d (New Vantage Co)
-- And new companies for variety

INSERT INTO products (
  id, company_id, ecp_id, product_type, sku, brand, model, name, 
  description, category, unit_price, cost, stock_quantity, 
  low_stock_threshold, is_active, created_at, updated_at
)
VALUES
  -- SINGLE VISION LENSES
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'SVL-001', 'Essilor', 'Orma 1.5', 'Standard Single Vision Lens 1.5', 'Standard CR-39 single vision lens with basic coating', 'Single Vision', 45.00, 20.00, 150, 30, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'SVL-002', 'Essilor', 'Airwear 1.59', 'Polycarbonate Single Vision', 'Lightweight polycarbonate lens with UV protection', 'Single Vision', 65.00, 30.00, 120, 25, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'SVL-003', 'Zeiss', 'Single Vision 1.67', 'High Index Single Vision', 'Ultra-thin high index lens for strong prescriptions', 'Single Vision', 95.00, 45.00, 80, 20, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'SVL-004', 'Hoya', 'Hi-Vision 1.74', 'Premium High Index', 'Thinnest available lens with anti-reflective coating', 'Single Vision', 145.00, 70.00, 50, 15, true, now(), now()),
  
  -- PROGRESSIVE LENSES
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'PROG-001', 'Essilor', 'Varilux Comfort', 'Progressive Lens Standard', 'Standard progressive lens with wide viewing zones', 'Progressive', 125.00, 60.00, 90, 20, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'PROG-002', 'Essilor', 'Varilux X Series', 'Premium Progressive Lens', 'Advanced progressive design with extended vision', 'Progressive', 195.00, 95.00, 60, 15, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'PROG-003', 'Zeiss', 'Progressive Individual 2', 'Customized Progressive', 'Fully personalized progressive lens', 'Progressive', 245.00, 120.00, 40, 10, true, now(), now()),
  
  -- BIFOCAL LENSES
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'BIF-001', 'Essilor', 'Standard Bifocal', 'Bifocal Lens - Flat Top', 'Traditional flat-top bifocal lens', 'Bifocal', 75.00, 35.00, 70, 15, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'BIF-002', 'Hoya', 'Executive Bifocal', 'Executive Bifocal Lens', 'Full width reading segment bifocal', 'Bifocal', 95.00, 45.00, 50, 12, true, now(), now()),
  
  -- METAL FRAMES
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'FRAME-M-001', 'Ray-Ban', 'RB6489', 'Classic Metal Frame - Gold', 'Timeless aviator-style metal frame', 'Metal Frames', 129.00, 60.00, 45, 10, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'FRAME-M-002', 'Ray-Ban', 'RB6489', 'Classic Metal Frame - Silver', 'Elegant silver metal frame', 'Metal Frames', 129.00, 60.00, 50, 10, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'FRAME-M-003', 'Oakley', 'OX3218', 'Sport Metal Frame - Black', 'Lightweight titanium sport frame', 'Metal Frames', 165.00, 80.00, 35, 8, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'FRAME-M-004', 'Silhouette', 'SPX-1914', 'Rimless Titanium Frame', 'Ultra-lightweight rimless design', 'Metal Frames', 245.00, 120.00, 25, 5, true, now(), now()),
  
  -- ACETATE/PLASTIC FRAMES
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'FRAME-A-001', 'Gucci', 'GG0844O', 'Designer Acetate Frame - Tortoise', 'Premium acetate with tortoise shell pattern', 'Acetate Frames', 295.00, 145.00, 30, 6, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'FRAME-A-002', 'Prada', 'VPR 17W', 'Luxury Acetate Frame - Black', 'Bold black acetate frame', 'Acetate Frames', 275.00, 135.00, 28, 6, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'FRAME-A-003', 'Tom Ford', 'FT5626-B', 'Premium Square Frame - Blue', 'Modern square acetate in blue', 'Acetate Frames', 320.00, 160.00, 20, 5, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'FRAME-A-004', 'Persol', 'PO3007V', 'Classic Acetate - Havana', 'Iconic Persol design in havana', 'Acetate Frames', 235.00, 115.00, 32, 8, true, now(), now()),
  
  -- CHILDREN'S FRAMES
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'FRAME-K-001', 'Ray-Ban Junior', 'RJ9506S', 'Kids Sport Frame - Red', 'Flexible sport frame for children', 'Kids Frames', 75.00, 35.00, 40, 10, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'FRAME-K-002', 'Disney', 'DFROZEN32', 'Kids Frame - Frozen Theme', 'Colorful kids frame with Disney design', 'Kids Frames', 65.00, 30.00, 50, 12, true, now(), now()),
  
  -- CONTACT LENSES
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'contact_lens', 'CL-DAILY-30', 'Acuvue', 'Oasys 1-Day', 'Daily Disposable (30 pack)', 'Premium daily disposable contact lenses with UV protection', 'Contact Lenses', 38.00, 19.00, 250, 50, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'contact_lens', 'CL-DAILY-90', 'Acuvue', 'Oasys 1-Day', 'Daily Disposable (90 pack)', 'Premium daily disposable contact lenses - 3 month supply', 'Contact Lenses', 95.00, 48.00, 180, 40, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'contact_lens', 'CL-MONTH-6', 'Air Optix', 'Aqua', 'Monthly Lenses (6 pack)', 'Monthly replacement silicone hydrogel lenses', 'Contact Lenses', 42.00, 21.00, 200, 40, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'contact_lens', 'CL-TORIC-30', 'Acuvue', 'Oasys for Astigmatism', 'Toric Daily (30 pack)', 'Daily disposable toric lenses for astigmatism', 'Contact Lenses', 58.00, 29.00, 150, 30, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'contact_lens', 'CL-MULTI-6', 'Bausch + Lomb', 'Ultra Multifocal', 'Multifocal Monthly (6 pack)', 'Monthly multifocal lenses for presbyopia', 'Contact Lenses', 65.00, 33.00, 120, 25, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'contact_lens', 'CL-COLOR-30', 'FreshLook', 'Colorblends', 'Colored Contact Lenses', 'Monthly colored contact lenses - various colors', 'Contact Lenses', 45.00, 22.00, 100, 20, true, now(), now()),
  
  -- ACCESSORIES & CARE PRODUCTS
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'solution', 'ACC-SOL-360', 'Bausch + Lomb', 'Biotrue', 'Multi-Purpose Solution 360ml', 'Complete contact lens care solution', 'Care Products', 12.00, 6.00, 400, 80, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'solution', 'ACC-SOL-120', 'Opti-Free', 'PureMoist', 'Travel Size Solution 120ml', 'Travel-friendly lens solution', 'Care Products', 6.00, 3.00, 300, 60, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'service', 'ACC-CASE-001', 'Generic', 'Hard Case', 'Protective Hard Glasses Case', 'Durable hard case for glasses protection', 'Accessories', 8.00, 3.50, 350, 70, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'service', 'ACC-CASE-002', 'Designer', 'Leather Case', 'Premium Leather Glasses Case', 'Luxury leather case with soft lining', 'Accessories', 25.00, 12.00, 150, 30, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'service', 'ACC-CLOTH-001', 'Zeiss', 'Microfiber', 'Premium Cleaning Cloth', 'High-quality microfiber cloth', 'Accessories', 5.00, 2.00, 600, 120, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'solution', 'ACC-SPRAY-100', 'Zeiss', 'Lens Spray', 'Lens Cleaning Spray 100ml', 'Professional lens cleaning spray', 'Accessories', 8.00, 4.00, 250, 50, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'service', 'ACC-CHAIN-001', 'Fashion', 'Chain Gold', 'Glasses Chain - Gold', 'Decorative glasses chain in gold finish', 'Accessories', 15.00, 7.00, 100, 20, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'service', 'ACC-STRAP-001', 'Sport', 'Sport Strap', 'Sport Glasses Strap', 'Secure sport strap for active wear', 'Accessories', 10.00, 4.50, 150, 30, true, now(), now()),
  
  -- SUNGLASSES
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'SUN-001', 'Ray-Ban', 'Aviator RB3025', 'Classic Aviator Sunglasses', 'Iconic aviator style with polarized lenses', 'Sunglasses', 165.00, 80.00, 60, 15, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'SUN-002', 'Ray-Ban', 'Wayfarer RB2140', 'Wayfarer Sunglasses', 'Classic wayfarer design', 'Sunglasses', 155.00, 75.00, 55, 12, true, now(), now()),
  (gen_random_uuid(), 'f86ea164-525c-432e-b86f-0b598d09d12d', 'dc438435-7e60-4a20-a17f-0c1f71e881fb', 'frame', 'SUN-003', 'Oakley', 'Frogskins', 'Sport Sunglasses', 'Performance sport sunglasses with Prizm lenses', 'Sunglasses', 185.00, 90.00, 45, 10, true, now(), now())
ON CONFLICT (id) DO NOTHING;

\echo '✅ Added 40+ products across all categories'

-- ================================================
-- 3. COMPREHENSIVE PATIENT RECORDS
-- ================================================
\echo '👥 Adding detailed patient records...'

-- Store patient IDs for later use in examinations
DO $$
DECLARE
  patient1_id varchar := gen_random_uuid();
  patient2_id varchar := gen_random_uuid();
  patient3_id varchar := gen_random_uuid();
  patient4_id varchar := gen_random_uuid();
  patient5_id varchar := gen_random_uuid();
  patient6_id varchar := gen_random_uuid();
  patient7_id varchar := gen_random_uuid();
  patient8_id varchar := gen_random_uuid();
  exam1_id varchar := gen_random_uuid();
  exam2_id varchar := gen_random_uuid();
  exam3_id varchar := gen_random_uuid();
  exam4_id varchar := gen_random_uuid();
  exam5_id varchar := gen_random_uuid();
BEGIN
  -- Insert patients
  INSERT INTO patients (
    id, customer_number, company_id, name, date_of_birth, email, 
    nhs_number, full_address, ecp_id, previous_optician, gp_name,
    emergency_contact_name, emergency_contact_phone, 
    vdu_user, driving_requirement, contact_lens_wearer,
    marketing_consent, data_sharing_consent, created_at
  )
  VALUES 
    (
      patient1_id, 'CUST-001', 'f86ea164-525c-432e-b86f-0b598d09d12d',
      'John Smith', '1985-01-15', 'john.smith@example.com',
      'NHS123456789',
      '{"street":"123 Main Street","city":"London","postcode":"SW1A 1AA","country":"UK"}'::jsonb,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      'Specsavers London',
      'Dr. Sarah Williams',
      'Emma Smith',
      '07700900123',
      true, true, false,
      true, true, now()
    ),
    (
      patient2_id, 'CUST-002', 'f86ea164-525c-432e-b86f-0b598d09d12d',
      'Jane Doe', '1990-03-22', 'jane.doe@example.com',
      'NHS987654321',
      '{"street":"456 Oak Avenue","city":"Manchester","postcode":"M1 1AA","country":"UK"}'::jsonb,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      'Vision Express Manchester',
      'Dr. John Brown',
      'Robert Doe',
      '07700900456',
      false, false, true,
      true, true, now()
    ),
    (
      patient3_id, 'CUST-003', 'f86ea164-525c-432e-b86f-0b598d09d12d',
      'Bob Johnson', '1978-07-10', 'bob.johnson@example.com',
      'NHS456789123',
      '{"street":"789 Pine Road","city":"Birmingham","postcode":"B1 1AA","country":"UK"}'::jsonb,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      NULL,
      'Dr. Emily Davis',
      'Lisa Johnson',
      '07700900789',
      true, true, false,
      true, true, now()
    ),
    (
      patient4_id, 'CUST-004', 'f86ea164-525c-432e-b86f-0b598d09d12d',
      'Sarah Williams', '1995-11-30', 'sarah.williams@example.com',
      'NHS789123456',
      '{"street":"321 Elm Street","city":"Edinburgh","postcode":"EH1 1AA","country":"UK"}'::jsonb,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      'Boots Opticians Edinburgh',
      'Dr. Michael Thompson',
      'James Williams',
      '07700900321',
      true, false, true,
      true, true, now()
    ),
    (
      patient5_id, 'CUST-005', 'f86ea164-525c-432e-b86f-0b598d09d12d',
      'Michael Brown', '1982-05-18', 'michael.brown@example.com',
      'NHS321654987',
      '{"street":"654 Maple Drive","city":"Glasgow","postcode":"G1 1AA","country":"UK"}'::jsonb,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      'Vision Care Glasgow',
      'Dr. Anna Wilson',
      'Rachel Brown',
      '07700900654',
      false, true, false,
      true, true, now()
    ),
    (
      patient6_id, 'CUST-006', 'f86ea164-525c-432e-b86f-0b598d09d12d',
      'Emily Thompson', '1988-09-25', 'emily.thompson@example.com',
      'NHS147258369',
      '{"street":"100 Park Lane","city":"Leeds","postcode":"LS1 1AA","country":"UK"}'::jsonb,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      NULL,
      'Dr. David Miller',
      'Thomas Thompson',
      '07700900100',
      true, true, false,
      true, true, now()
    ),
    (
      patient7_id, 'CUST-007', 'f86ea164-525c-432e-b86f-0b598d09d12d',
      'David Martinez', '2005-12-10', 'david.martinez@example.com',
      'NHS963852741',
      '{"street":"25 School Road","city":"Bristol","postcode":"BS1 1AA","country":"UK"}'::jsonb,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      'Optical Express Bristol',
      'Dr. Lisa Anderson',
      'Maria Martinez',
      '07700900025',
      false, false, false,
      true, true, now()
    ),
    (
      patient8_id, 'CUST-008', 'f86ea164-525c-432e-b86f-0b598d09d12d',
      'Olivia Garcia', '1975-04-08', 'olivia.garcia@example.com',
      'NHS852963741',
      '{"street":"77 Queens Road","city":"Liverpool","postcode":"L1 1AA","country":"UK"}'::jsonb,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      'Specsavers Liverpool',
      'Dr. Richard White',
      'Carlos Garcia',
      '07700900077',
      true, true, true,
      true, true, now()
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✅ Added 8 patients with detailed records';

  -- ================================================
  -- 4. EYE EXAMINATIONS
  -- ================================================
  RAISE NOTICE '👁️  Adding eye examinations...';

  INSERT INTO eye_examinations (
    id, company_id, patient_id, ecp_id, examination_date,
    status, reason_for_visit, medical_history, visual_acuity,
    refraction, binocular_vision, eye_health, finalized,
    notes, created_at, updated_at
  )
  VALUES
    (
      exam1_id,
      'f86ea164-525c-432e-b86f-0b598d09d12d',
      patient1_id,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      now() - interval '2 weeks',
      'completed',
      'Routine eye examination',
      '{"diabetes": false, "hypertension": false, "allergies": "None", "current_medications": "None"}'::jsonb,
      '{"od_unaided": "6/12", "od_aided": "6/6", "os_unaided": "6/9", "os_aided": "6/6", "binocular": "6/6"}'::jsonb,
      '{"od": {"sphere": "-1.50", "cylinder": "-0.50", "axis": "180"}, "os": {"sphere": "-1.75", "cylinder": "-0.25", "axis": "90"}}'::jsonb,
      '{"cover_test": "Orthophoric", "npc": "8cm", "stereopsis": "40 arc seconds"}'::jsonb,
      '{"od": {"optic_disc": "Healthy", "macula": "Normal", "vessels": "Normal"}, "os": {"optic_disc": "Healthy", "macula": "Normal", "vessels": "Normal"}}'::jsonb,
      true,
      'Patient reports clearer vision needed for computer work. Single vision lenses recommended for distance.',
      now() - interval '2 weeks',
      now() - interval '2 weeks'
    ),
    (
      exam2_id,
      'f86ea164-525c-432e-b86f-0b598d09d12d',
      patient2_id,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      now() - interval '1 week',
      'completed',
      'Contact lens fitting',
      '{"diabetes": false, "hypertension": false, "allergies": "Pollen", "current_medications": "Antihistamines"}'::jsonb,
      '{"od_unaided": "6/36", "od_aided": "6/6", "os_unaided": "6/36", "os_aided": "6/6"}'::jsonb,
      '{"od": {"sphere": "-3.00", "cylinder": "0.00", "axis": "0"}, "os": {"sphere": "-3.25", "cylinder": "0.00", "axis": "0"}}'::jsonb,
      '{"cover_test": "Orthophoric", "npc": "6cm"}'::jsonb,
      '{"od": {"optic_disc": "Healthy", "macula": "Normal"}, "os": {"optic_disc": "Healthy", "macula": "Normal"}}'::jsonb,
      true,
      'Contact lens fitting successful. Patient prefers daily disposables. Trial lenses provided.',
      now() - interval '1 week',
      now() - interval '1 week'
    ),
    (
      exam3_id,
      'f86ea164-525c-432e-b86f-0b598d09d12d',
      patient3_id,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      now() - interval '3 days',
      'completed',
      'Difficulty reading - first time presbyopia',
      '{"diabetes": false, "hypertension": true, "allergies": "None", "current_medications": "Ramipril"}'::jsonb,
      '{"od_distance": "6/6", "os_distance": "6/6", "od_near": "N8", "os_near": "N8"}'::jsonb,
      '{"od": {"sphere": "-0.50", "cylinder": "0.00", "axis": "0", "add": "+1.50"}, "os": {"sphere": "-0.75", "cylinder": "0.00", "axis": "0", "add": "+1.50"}}'::jsonb,
      '{"cover_test": "Orthophoric at distance and near"}'::jsonb,
      '{"od": {"optic_disc": "0.3 C/D ratio", "macula": "Healthy", "vessels": "Grade 1 AV nipping"}, "os": {"optic_disc": "0.3 C/D ratio", "macula": "Healthy", "vessels": "Grade 1 AV nipping"}}'::jsonb,
      true,
      'First prescription for reading addition. Progressive lenses recommended for all-distance vision.',
      now() - interval '3 days',
      now() - interval '3 days'
    ),
    (
      exam4_id,
      'f86ea164-525c-432e-b86f-0b598d09d12d',
      patient4_id,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      now() - interval '5 days',
      'completed',
      'Annual check-up with contact lenses',
      '{"diabetes": false, "hypertension": false, "allergies": "None", "current_medications": "None"}'::jsonb,
      '{"od_unaided": "6/24", "od_aided": "6/5", "os_unaided": "6/24", "os_aided": "6/5"}'::jsonb,
      '{"od": {"sphere": "-2.50", "cylinder": "-0.75", "axis": "175"}, "os": {"sphere": "-2.75", "cylinder": "-0.50", "axis": "5"}}'::jsonb,
      '{"cover_test": "Orthophoric", "npc": "7cm"}'::jsonb,
      '{"od": {"optic_disc": "Healthy", "macula": "Normal"}, "os": {"optic_disc": "Healthy", "macula": "Normal"}}'::jsonb,
      true,
      'Contact lens wearer for 3 years. Toric lenses for astigmatism. Eyes healthy, continue current lens type.',
      now() - interval '5 days',
      now() - interval '5 days'
    ),
    (
      exam5_id,
      'f86ea164-525c-432e-b86f-0b598d09d12d',
      patient5_id,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      now() - interval '10 days',
      'completed',
      'New glasses for driving',
      '{"diabetes": false, "hypertension": false, "allergies": "None", "current_medications": "None"}'::jsonb,
      '{"od_unaided": "6/18", "od_aided": "6/6", "os_unaided": "6/18", "os_aided": "6/6"}'::jsonb,
      '{"od": {"sphere": "-1.25", "cylinder": "-0.75", "axis": "15"}, "os": {"sphere": "-1.00", "cylinder": "-0.50", "axis": "165"}}'::jsonb,
      '{"cover_test": "Orthophoric"}'::jsonb,
      '{"od": {"optic_disc": "Healthy", "macula": "Normal"}, "os": {"optic_disc": "Healthy", "macula": "Normal"}}'::jsonb,
      true,
      'Patient needs glasses for driving. Anti-reflective coating recommended for night driving.',
      now() - interval '10 days',
      now() - interval '10 days'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✅ Added 5 detailed eye examinations';

  -- ================================================
  -- 5. PRESCRIPTIONS
  -- ================================================
  RAISE NOTICE '📋 Adding prescriptions...';

  INSERT INTO prescriptions (
    id, company_id, examination_id, patient_id, ecp_id,
    issue_date, expiry_date,
    od_sphere, od_cylinder, od_axis, od_add,
    os_sphere, os_cylinder, os_axis, os_add,
    binocular_pd, prescription_type, prescriber_name,
    prescriber_goc_number, goc_compliant, is_signed,
    signed_by_ecp_id, signed_at, created_at
  )
  VALUES
    (
      gen_random_uuid(),
      'f86ea164-525c-432e-b86f-0b598d09d12d',
      exam1_id,
      patient1_id,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      now() - interval '2 weeks',
      now() + interval '2 years',
      '-1.50', '-0.50', '180', NULL,
      '-1.75', '-0.25', '90', NULL,
      63.0,
      'Distance',
      'Saban - New Vantage Co',
      'GOC-12345',
      true, true,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      now() - interval '2 weeks',
      now() - interval '2 weeks'
    ),
    (
      gen_random_uuid(),
      'f86ea164-525c-432e-b86f-0b598d09d12d',
      exam2_id,
      patient2_id,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      now() - interval '1 week',
      now() + interval '2 years',
      '-3.00', '0.00', '0', NULL,
      '-3.25', '0.00', '0', NULL,
      62.0,
      'Distance',
      'Saban - New Vantage Co',
      'GOC-12345',
      true, true,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      now() - interval '1 week',
      now() - interval '1 week'
    ),
    (
      gen_random_uuid(),
      'f86ea164-525c-432e-b86f-0b598d09d12d',
      exam3_id,
      patient3_id,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      now() - interval '3 days',
      now() + interval '2 years',
      '-0.50', '0.00', '0', '+1.50',
      '-0.75', '0.00', '0', '+1.50',
      64.0,
      'Progressive',
      'Saban - New Vantage Co',
      'GOC-12345',
      true, true,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      now() - interval '3 days',
      now() - interval '3 days'
    ),
    (
      gen_random_uuid(),
      'f86ea164-525c-432e-b86f-0b598d09d12d',
      exam4_id,
      patient4_id,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      now() - interval '5 days',
      now() + interval '2 years',
      '-2.50', '-0.75', '175', NULL,
      '-2.75', '-0.50', '5', NULL,
      61.0,
      'Contact Lenses',
      'Saban - New Vantage Co',
      'GOC-12345',
      true, true,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      now() - interval '5 days',
      now() - interval '5 days'
    ),
    (
      gen_random_uuid(),
      'f86ea164-525c-432e-b86f-0b598d09d12d',
      exam5_id,
      patient5_id,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      now() - interval '10 days',
      now() + interval '2 years',
      '-1.25', '-0.75', '15', NULL,
      '-1.00', '-0.50', '165', NULL,
      65.0,
      'Distance - Driving',
      'Saban - New Vantage Co',
      'GOC-12345',
      true, true,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      now() - interval '10 days',
      now() - interval '10 days'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✅ Added 5 prescriptions';

  -- ================================================
  -- 6. ORDERS
  -- ================================================
  RAISE NOTICE '📦 Adding orders...';

  INSERT INTO orders (
    id, order_number, company_id, patient_id, ecp_id,
    status, od_sphere, od_cylinder, od_axis, od_add,
    os_sphere, os_cylinder, os_axis, os_add, pd,
    lens_type, lens_material, coating, frame_type,
    notes, order_date, due_date
  )
  VALUES
    (
      gen_random_uuid(),
      'ORD-' || to_char(now(), 'YYYYMMDD') || '-001',
      'f86ea164-525c-432e-b86f-0b598d09d12d',
      patient1_id,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      'in_production',
      '-1.50', '-0.50', '180', NULL,
      '-1.75', '-0.25', '90', NULL,
      '63.0',
      'Single Vision',
      'Polycarbonate 1.59',
      'Anti-reflective + Scratch resistant',
      'Metal - Gold',
      'Standard single vision for computer work',
      now() - interval '2 weeks',
      now() + interval '1 week'
    ),
    (
      gen_random_uuid(),
      'ORD-' || to_char(now(), 'YYYYMMDD') || '-002',
      'f86ea164-525c-432e-b86f-0b598d09d12d',
      patient3_id,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      'pending',
      '-0.50', '0.00', '0', '+1.50',
      '-0.75', '0.00', '0', '+1.50',
      '64.0',
      'Progressive',
      'High Index 1.67',
      'Premium anti-reflective + Blue light filter',
      'Acetate - Tortoise',
      'Progressive lenses for all-distance vision',
      now() - interval '3 days',
      now() + interval '2 weeks'
    ),
    (
      gen_random_uuid(),
      'ORD-' || to_char(now(), 'YYYYMMDD') || '-003',
      'f86ea164-525c-432e-b86f-0b598d09d12d',
      patient5_id,
      'dc438435-7e60-4a20-a17f-0c1f71e881fb',
      'shipped',
      '-1.25', '-0.75', '15', NULL,
      '-1.00', '-0.50', '165', NULL,
      '65.0',
      'Single Vision',
      'Polycarbonate 1.59',
      'Anti-reflective + Scratch resistant',
      'Metal - Silver',
      'For driving - anti-reflective coating essential',
      now() - interval '10 days',
      now() - interval '3 days'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✅ Added 3 orders in various stages';

END $$;

-- ================================================
-- 7. EQUIPMENT
-- ================================================
\echo '🔬 Adding examination equipment...';

INSERT INTO equipment (
  id, company_id, name, manufacturer, model, serial_number,
  status, purchase_date, last_calibration_date, next_calibration_date,
  specifications, created_at, updated_at
)
VALUES
  (
    gen_random_uuid(),
    'f86ea164-525c-432e-b86f-0b598d09d12d',
    'Phoropter',
    'Topcon',
    'VT-10',
    'TOP-VT10-2022-001',
    'operational',
    '2022-03-15',
    now() - interval '3 months',
    now() + interval '9 months',
    '{"type": "Manual Phoropter", "features": ["Cross cylinder", "Rotary prisms", "PD adjustment"]}'::jsonb,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'f86ea164-525c-432e-b86f-0b598d09d12d',
    'Auto-Refractor',
    'Nidek',
    'AR-F',
    'NID-ARF-2021-002',
    'operational',
    '2021-06-20',
    now() - interval '6 months',
    now() + interval '6 months',
    '{"type": "Auto-Refractor/Keratometer", "features": ["Automatic measurement", "Pupil distance", "Keratometry"]}'::jsonb,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'f86ea164-525c-432e-b86f-0b598d09d12d',
    'Tonometer',
    'Reichert',
    'Tono-Vera',
    'REI-TV-2023-003',
    'operational',
    '2023-01-10',
    now() - interval '2 months',
    now() + interval '10 months',
    '{"type": "Non-contact Tonometer", "measurement_range": "5-50 mmHg"}'::jsonb,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'f86ea164-525c-432e-b86f-0b598d09d12d',
    'Slit Lamp',
    'Haag-Streit',
    'BM 900',
    'HAG-BM900-2020-004',
    'operational',
    '2020-09-05',
    now() - interval '4 months',
    now() + interval '8 months',
    '{"type": "Slit Lamp Biomicroscope", "magnification": ["6x", "10x", "16x", "25x", "40x"]}'::jsonb,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'f86ea164-525c-432e-b86f-0b598d09d12d',
    'OCT Scanner',
    'Zeiss',
    'Cirrus 5000',
    'ZEI-CIR5000-2022-005',
    'operational',
    '2022-11-20',
    now() - interval '5 months',
    now() + interval '7 months',
    '{"type": "Optical Coherence Tomography", "scan_types": ["Macula", "Optic Disc", "Glaucoma Analysis"]}'::jsonb,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'f86ea164-525c-432e-b86f-0b598d09d12d',
    'Visual Field Analyzer',
    'Humphrey',
    'HFA3',
    'HUM-HFA3-2021-006',
    'operational',
    '2021-08-15',
    now() - interval '7 months',
    now() + interval '5 months',
    '{"type": "Automated Perimeter", "test_strategies": ["SITA Standard", "SITA Fast", "SITA Faster"]}'::jsonb,
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

\echo '✅ Added 6 pieces of examination equipment';

-- ================================================
-- 8. SUMMARY AND VERIFICATION
-- ================================================
\echo '';
\echo '═══════════════════════════════════════════════';
\echo '✅ COMPREHENSIVE TEST DATA SEEDING COMPLETE!';
\echo '═══════════════════════════════════════════════';
\echo '';
\echo '📊 Data Summary:';
\echo '─────────────────────────────────────────────';

-- Count all added records
SELECT 
  (SELECT COUNT(*) FROM companies WHERE id IN (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
    'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
    'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8g'
  )) as new_companies,
  (SELECT COUNT(*) FROM products WHERE company_id = 'f86ea164-525c-432e-b86f-0b598d09d12d') as total_products,
  (SELECT COUNT(*) FROM patients WHERE company_id = 'f86ea164-525c-432e-b86f-0b598d09d12d') as patients,
  (SELECT COUNT(*) FROM eye_examinations WHERE company_id = 'f86ea164-525c-432e-b86f-0b598d09d12d') as examinations,
  (SELECT COUNT(*) FROM prescriptions WHERE company_id = 'f86ea164-525c-432e-b86f-0b598d09d12d') as prescriptions,
  (SELECT COUNT(*) FROM orders WHERE company_id = 'f86ea164-525c-432e-b86f-0b598d09d12d') as orders,
  (SELECT COUNT(*) FROM equipment WHERE company_id = 'f86ea164-525c-432e-b86f-0b598d09d12d') as equipment;

\echo '';
\echo '📦 Product Categories:';
SELECT 
  category,
  COUNT(*) as count,
  SUM(stock_quantity) as total_stock
FROM products 
WHERE company_id = 'f86ea164-525c-432e-b86f-0b598d09d12d'
GROUP BY category
ORDER BY count DESC;

\echo '';
\echo '🎉 System is now loaded with comprehensive test data!';
\echo '';
\echo '🔑 Login Details:';
\echo '   Email: saban@newvantageco.com';
\echo '   URL: http://localhost:3000';
\echo '';
\echo '✨ You can now:';
\echo '   • View patients with complete records';
\echo '   • Browse extensive product catalog';
\echo '   • Review eye examinations and prescriptions';
\echo '   • Track orders in various statuses';
\echo '   • Manage equipment and calibrations';
\echo '';
