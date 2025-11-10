-- AI Test Queries
-- These queries demonstrate what the AI can answer using the test data

-- Query 1: Get business intelligence data for AI context
SELECT 
  'Business Summary for AI' as context_type,
  json_build_object(
    'total_patients', (SELECT COUNT(*) FROM patients WHERE company_id = 'f86ea164-525c-432e-b86f-0b598d09d12d'),
    'total_products', (SELECT COUNT(*) FROM products WHERE company_id = 'f86ea164-525c-432e-b86f-0b598d09d12d'),
    'product_categories', (SELECT json_agg(DISTINCT category) FROM products WHERE company_id = 'f86ea164-525c-432e-b86f-0b598d09d12d' AND category IS NOT NULL),
    'total_stock_value', (SELECT SUM(unit_price * stock_quantity) FROM products WHERE company_id = 'f86ea164-525c-432e-b86f-0b598d09d12d'),
    'equipment_count', (SELECT COUNT(*) FROM equipment WHERE company_id = 'f86ea164-525c-432e-b86f-0b598d09d12d')
  ) as ai_context;

-- Query 2: Patient demographics for AI analysis
SELECT 
  'Patient Demographics' as context_type,
  json_build_object(
    'age_distribution', json_agg(
      json_build_object(
        'name', name,
        'age', EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth::date)),
        'contact_lens_wearer', contact_lens_wearer,
        'vdu_user', vdu_user
      )
    )
  ) as patient_data
FROM patients 
WHERE company_id = 'f86ea164-525c-432e-b86f-0b598d09d12d';

-- Query 3: Product inventory for AI recommendations
SELECT 
  category,
  brand,
  COUNT(*) as product_count,
  SUM(stock_quantity) as total_stock,
  ROUND(AVG(unit_price), 2) as avg_price,
  json_agg(
    json_build_object(
      'name', name,
      'sku', sku,
      'price', unit_price,
      'stock', stock_quantity
    )
  ) as products
FROM products 
WHERE company_id = 'f86ea164-525c-432e-b86f-0b598d09d12d'
  AND category IS NOT NULL
GROUP BY category, brand
ORDER BY category, brand
LIMIT 10;

-- Query 4: Low stock alerts for AI proactive insights
SELECT 
  'Low Stock Alert' as alert_type,
  json_agg(
    json_build_object(
      'product', name,
      'sku', sku,
      'category', category,
      'current_stock', stock_quantity,
      'threshold', low_stock_threshold,
      'unit_price', unit_price
    )
  ) as low_stock_products
FROM products 
WHERE company_id = 'f86ea164-525c-432e-b86f-0b598d09d12d'
  AND stock_quantity <= low_stock_threshold
  AND stock_quantity > 0;

-- Query 5: Equipment calibration schedule for AI maintenance reminders
SELECT 
  'Equipment Maintenance' as context_type,
  json_agg(
    json_build_object(
      'equipment', name,
      'manufacturer', manufacturer,
      'status', status,
      'last_calibration', last_calibration_date,
      'next_calibration', next_calibration_date,
      'days_until_due', next_calibration_date - CURRENT_DATE
    )
  ) as equipment_schedule
FROM equipment 
WHERE company_id = 'f86ea164-525c-432e-b86f-0b598d09d12d'
ORDER BY next_calibration_date
LIMIT 5;
