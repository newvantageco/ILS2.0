-- Add color_options field to products table
ALTER TABLE products 
ADD COLUMN color_options jsonb DEFAULT '[]'::jsonb;

-- Update the column comment
COMMENT ON COLUMN products.color_options IS 'Array of available color options for the product';
