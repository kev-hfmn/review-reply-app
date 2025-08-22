-- =====================================
-- LEMON SQUEEZY MIGRATION SCRIPT (SIMPLIFIED)
-- =====================================
-- Purpose: Add Lemon Squeezy support while maintaining Stripe compatibility
-- Status: Ready for manual execution - Compatible with all PostgreSQL versions
-- 
-- Execute this script manually in your Supabase database
-- =====================================

-- Step 1: Add Lemon Squeezy columns to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS lemonsqueezy_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS lemonsqueezy_customer_id TEXT,
ADD COLUMN IF NOT EXISTS lemonsqueezy_order_id TEXT,
ADD COLUMN IF NOT EXISTS lemonsqueezy_variant_id TEXT,
ADD COLUMN IF NOT EXISTS lemonsqueezy_product_id TEXT,
ADD COLUMN IF NOT EXISTS payment_processor TEXT DEFAULT 'stripe';

-- Step 2: Create webhook events table for Lemon Squeezy
CREATE TABLE IF NOT EXISTS lemonsqueezy_webhook_events_processed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_name TEXT NOT NULL,
  processed_at TIMESTAMP DEFAULT NOW(),
  subscription_id TEXT,
  metadata JSONB
);

-- Step 3: Add indexes (without CONCURRENTLY for compatibility)
-- Create indexes one by one to avoid conflicts

-- Unique constraint for Lemon Squeezy subscriptions
DROP INDEX IF EXISTS unique_lemonsqueezy_subscription;
CREATE UNIQUE INDEX unique_lemonsqueezy_subscription 
ON subscriptions (lemonsqueezy_subscription_id) WHERE lemonsqueezy_subscription_id IS NOT NULL;

-- Index for payment processor filtering  
DROP INDEX IF EXISTS idx_payment_processor;
CREATE INDEX idx_payment_processor ON subscriptions (payment_processor);

-- Index for webhook event lookups
DROP INDEX IF EXISTS idx_lemonsqueezy_webhook_event_id;
CREATE INDEX idx_lemonsqueezy_webhook_event_id 
ON lemonsqueezy_webhook_events_processed (event_id);

-- Index for webhook event processing timestamps
DROP INDEX IF EXISTS idx_lemonsqueezy_webhook_processed_at;
CREATE INDEX idx_lemonsqueezy_webhook_processed_at 
ON lemonsqueezy_webhook_events_processed (processed_at);

-- Step 4: Enable RLS on new table
ALTER TABLE lemonsqueezy_webhook_events_processed ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policy (drop first if exists)
DROP POLICY IF EXISTS "Service role can manage webhook events" ON lemonsqueezy_webhook_events_processed;
CREATE POLICY "Service role can manage webhook events" 
ON lemonsqueezy_webhook_events_processed
FOR ALL USING (auth.role() = 'service_role');

-- Step 6: Add helpful comments
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
-- Run these after migration to verify success:

-- 1. Verify new columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
AND (column_name LIKE 'lemonsqueezy_%' OR column_name = 'payment_processor');

-- 2. Verify new table was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'lemonsqueezy_webhook_events_processed';

-- 3. Verify indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('subscriptions', 'lemonsqueezy_webhook_events_processed')
AND (indexname LIKE '%lemonsqueezy%' OR indexname LIKE '%payment_processor%');

-- 4. Verify RLS policy
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'lemonsqueezy_webhook_events_processed';

-- =====================================
-- MIGRATION COMPLETE
-- =====================================