-- Migration: Add custom_instruction field to business_settings table
-- Execute this in your Supabase SQL Editor if you have an existing database

-- Add the custom_instruction column to business_settings table
ALTER TABLE business_settings 
ADD COLUMN IF NOT EXISTS custom_instruction TEXT;

-- Update the column comment for documentation
COMMENT ON COLUMN business_settings.custom_instruction IS 'Custom instructions for AI reply generation to ensure brand consistency';
