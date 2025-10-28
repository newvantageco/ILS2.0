-- Migration: Add payment method to invoices table
-- Created: 2025-10-28
-- Description: Adds payment_method enum and column to support cash/card payment tracking

-- Create payment method enum type
DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cash', 'card', 'mixed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add payment_method column to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS payment_method payment_method;

-- Add comment for documentation
COMMENT ON COLUMN invoices.payment_method IS 'Payment method used for the invoice: cash, card, or mixed';
