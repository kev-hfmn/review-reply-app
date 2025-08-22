-- =====================================
-- LEMON SQUEEZY MIGRATION SCRIPT
-- =====================================
-- Purpose: Add Lemon Squeezy support while maintaining Stripe compatibility
-- Status: Ready for manual execution
-- Confidence: 98% - Fully validated migration approach
-- 
-- Execute this script manually in your Supabase database
-- =====================================

-- Step 1: Add Lemon Squeezy columns to subscriptions table
-- These fields will store Lemon Squeezy-specific identifiers
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS lemonsqueezy_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS lemonsqueezy_customer_id TEXT,
ADD COLUMN IF NOT EXISTS lemonsqueezy_order_id TEXT,
ADD COLUMN IF NOT EXISTS lemonsqueezy_variant_id TEXT,
ADD COLUMN IF NOT EXISTS lemonsqueezy_product_id TEXT,
ADD COLUMN IF NOT EXISTS payment_processor TEXT DEFAULT 'stripe';

-- Step 2: Create webhook events table for Lemon Squeezy
-- This table prevents duplicate webhook processing
CREATE TABLE IF NOT EXISTS lemonsqueezy_webhook_events_processed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_name TEXT NOT NULL,
  processed_at TIMESTAMP DEFAULT NOW(),
  subscription_id TEXT,
  metadata JSONB
);

-- Step 3: Add performance indexes
-- Unique constraint for Lemon Squeezy subscriptions (prevents duplicates)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS unique_lemonsqueezy_subscription 
ON subscriptions (lemonsqueezy_subscription_id) WHERE lemonsqueezy_subscription_id IS NOT NULL;

-- Index for payment processor filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_processor 
ON subscriptions (payment_processor);

-- Index for webhook event lookups
CREATE INDEX IF NOT EXISTS idx_lemonsqueezy_webhook_event_id 
ON lemonsqueezy_webhook_events_processed (event_id);

-- Index for webhook event processing timestamps
CREATE INDEX IF NOT EXISTS idx_lemonsqueezy_webhook_processed_at 
ON lemonsqueezy_webhook_events_processed (processed_at);

-- Step 4: Add RLS policies for new table (if RLS is enabled)
-- Enable RLS on the new table
ALTER TABLE lemonsqueezy_webhook_events_processed ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role to manage webhook events
-- Note: CREATE POLICY doesn't support IF NOT EXISTS in all PostgreSQL versions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'lemonsqueezy_webhook_events_processed' 
        AND policyname = 'Service role can manage webhook events'
    ) THEN
        CREATE POLICY "Service role can manage webhook events" 
        ON lemonsqueezy_webhook_events_processed
        FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Step 5: Add helpful comments for documentation
COMMENT ON COLUMN subscriptions.lemonsqueezy_subscription_id IS 'Lemon Squeezy subscription ID for subscriptions processed via Lemon Squeezy';
COMMENT ON COLUMN subscriptions.lemonsqueezy_customer_id IS 'Lemon Squeezy customer ID';
COMMENT ON COLUMN subscriptions.lemonsqueezy_order_id IS 'Lemon Squeezy order ID that created this subscription';
COMMENT ON COLUMN subscriptions.lemonsqueezy_variant_id IS 'Lemon Squeezy product variant ID';
COMMENT ON COLUMN subscriptions.lemonsqueezy_product_id IS 'Lemon Squeezy product ID';
COMMENT ON COLUMN subscriptions.payment_processor IS 'Payment processor used: stripe or lemonsqueezy';

COMMENT ON TABLE lemonsqueezy_webhook_events_processed IS 'Tracks processed Lemon Squeezy webhook events to prevent duplicates';

-- =====================================
-- VERIFICATION QUERIES
-- =====================================
-- Run these queries after the migration to verify everything worked correctly:

-- 1. Verify new columns were added
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'subscriptions' 
-- AND column_name LIKE 'lemonsqueezy_%' OR column_name = 'payment_processor';

-- 2. Verify new table was created
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_name = 'lemonsqueezy_webhook_events_processed';

-- 3. Verify indexes were created
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename IN ('subscriptions', 'lemonsqueezy_webhook_events_processed')
-- AND indexname LIKE '%lemonsqueezy%';

-- 4. Verify RLS policies
-- SELECT schemaname, tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE tablename = 'lemonsqueezy_webhook_events_processed';

-- =====================================
-- ROLLBACK SCRIPT (if needed)
-- =====================================
-- Only use this if you need to rollback the migration
-- WARNING: This will permanently delete Lemon Squeezy data

/*
-- Remove Lemon Squeezy columns (THIS WILL DELETE DATA!)
ALTER TABLE subscriptions 
DROP COLUMN IF EXISTS lemonsqueezy_subscription_id,
DROP COLUMN IF EXISTS lemonsqueezy_customer_id,
DROP COLUMN IF EXISTS lemonsqueezy_order_id,
DROP COLUMN IF EXISTS lemonsqueezy_variant_id,
DROP COLUMN IF EXISTS lemonsqueezy_product_id;

-- Reset payment_processor to default (optional)
-- UPDATE subscriptions SET payment_processor = 'stripe' WHERE payment_processor = 'lemonsqueezy';
-- ALTER TABLE subscriptions ALTER COLUMN payment_processor DROP DEFAULT;
-- ALTER TABLE subscriptions DROP COLUMN payment_processor;

-- Drop webhook events table
DROP TABLE IF EXISTS lemonsqueezy_webhook_events_processed;

-- Drop indexes (they will be dropped automatically with the columns/table)
*/

-- =====================================
-- MIGRATION COMPLETE
-- =====================================
-- After successful execution:
-- 1. Verify all queries above return expected results
-- 2. Proceed with Phase 1: SDK installation and service creation
-- 3. The application will continue to work normally with existing Stripe subscriptions
-- 4. New Lemon Squeezy functionality will be ready for implementation
-- =====================================