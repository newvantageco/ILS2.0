-- Add customer_number column to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS customer_number VARCHAR(20) UNIQUE;

-- Create a sequence for customer numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS patient_customer_number_seq START 1001;

-- Create function to generate customer number
CREATE OR REPLACE FUNCTION generate_customer_number()
RETURNS VARCHAR AS $$
DECLARE
  next_num INTEGER;
  customer_num VARCHAR(20);
BEGIN
  next_num := nextval('patient_customer_number_seq');
  customer_num := 'CUST-' || LPAD(next_num::TEXT, 6, '0');
  RETURN customer_num;
END;
$$ LANGUAGE plpgsql;

-- Update existing patients without customer numbers
UPDATE patients 
SET customer_number = generate_customer_number()
WHERE customer_number IS NULL;

-- Make customer_number NOT NULL after populating
ALTER TABLE patients ALTER COLUMN customer_number SET NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_patients_customer_number ON patients(customer_number);
