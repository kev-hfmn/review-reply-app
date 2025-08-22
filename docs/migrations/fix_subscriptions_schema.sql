-- Fix subscriptions table schema to match webhook expectations
-- This migration adds the missing stripe_price_id column and updates the schema

-- Add stripe_price_id column (rename existing price_id)
ALTER TABLE public.subscriptions
RENAME COLUMN price_id TO stripe_price_id;

-- Ensure all expected columns exist with proper types
-- (These should already exist but adding IF NOT EXISTS for safety)

-- Add any missing columns that the webhook expects
DO $$
BEGIN
    -- Check if columns exist and add them if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'subscriptions' AND column_name = 'stripe_price_id') THEN
        ALTER TABLE public.subscriptions ADD COLUMN stripe_price_id TEXT;
    END IF;
END $$;

-- Update any existing records to ensure data consistency
-- (This is safe to run even if no data exists)
UPDATE public.subscriptions
SET updated_at = NOW()
WHERE updated_at IS NULL;

-- Add index for better performance on stripe_price_id lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_price_id
ON public.subscriptions(stripe_price_id);

-- Add index for stripe_subscription_id lookups (used in webhook)
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id
ON public.subscriptions(stripe_subscription_id);

-- Add index for stripe_customer_id lookups (used in webhook)
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id
ON public.subscriptions(stripe_customer_id);

-- Verify the schema is correct
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;
