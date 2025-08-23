-- Add customer support contact fields to businesses table
-- Migration: add_contact_fields.sql
-- Date: 2025-08-23

ALTER TABLE businesses 
ADD COLUMN customer_support_email VARCHAR(255),
ADD COLUMN customer_support_phone VARCHAR(50);

-- Add indexes for potential filtering/searching
CREATE INDEX idx_businesses_support_email ON businesses(customer_support_email);
CREATE INDEX idx_businesses_support_phone ON businesses(customer_support_phone);

-- Add comments for documentation
COMMENT ON COLUMN businesses.customer_support_email IS 'Customer support email address for inclusion in AI-generated replies to low-rated reviews';
COMMENT ON COLUMN businesses.customer_support_phone IS 'Customer support phone number for inclusion in AI-generated replies to low-rated reviews';
