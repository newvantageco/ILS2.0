-- Migration: Add generate_customer_number function
-- This function generates unique customer numbers in format CUST-000001

CREATE OR REPLACE FUNCTION generate_customer_number()
RETURNS VARCHAR AS $$
DECLARE
    next_num INTEGER;
    customer_num VARCHAR;
BEGIN
    -- Get the next number from sequence or count
    SELECT COALESCE(MAX(CAST(SUBSTRING(customer_number FROM '[0-9]+') AS INTEGER)), 0) + 1 
    INTO next_num
    FROM patients
    WHERE customer_number ~ '^[A-Z]+-[0-9]+$';
    
    -- Generate customer number in format 'CUST-000001'
    customer_num := 'CUST-' || LPAD(next_num::TEXT, 6, '0');
    
    RETURN customer_num;
END;
$$ LANGUAGE plpgsql;
