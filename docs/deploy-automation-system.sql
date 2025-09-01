-- ====================================================================
-- REPLIFAST AUTOMATION SYSTEM DEPLOYMENT SCRIPT
-- ====================================================================
-- This script deploys the complete automated review sync and AI reply system
-- Execute this in your Supabase SQL Editor to fix all automation issues
--
-- CRITICAL: Read docs/automated-sync-setup.md first for context
--
-- Expected Execution Time: ~2-3 minutes
-- Risk Level: LOW (uses safe IF NOT EXISTS patterns)
-- ====================================================================

BEGIN;

-- ====================================================================
-- PHASE 1: INFRASTRUCTURE SETUP
-- ====================================================================

-- Enable required extensions for scheduling and HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Verify extensions are enabled
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        RAISE EXCEPTION 'ERROR: pg_cron extension failed to install. Contact Supabase support.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        RAISE EXCEPTION 'ERROR: pg_net extension failed to install. Contact Supabase support.';
    END IF;

    RAISE NOTICE '✅ Extensions pg_cron and pg_net are enabled';
END $$;

-- ====================================================================
-- PHASE 2: DATABASE SCHEMA UPDATES
-- ====================================================================

-- Add automation columns to business_settings table (safe if they already exist)
DO $$
BEGIN
    -- Check if automation columns exist, add them if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'business_settings' AND column_name = 'auto_sync_enabled') THEN
        ALTER TABLE business_settings ADD COLUMN auto_sync_enabled boolean DEFAULT false;
        RAISE NOTICE '✅ Added auto_sync_enabled column';
    ELSE
        RAISE NOTICE '⏭️ auto_sync_enabled column already exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'business_settings' AND column_name = 'auto_reply_enabled') THEN
        ALTER TABLE business_settings ADD COLUMN auto_reply_enabled boolean DEFAULT false;
        RAISE NOTICE '✅ Added auto_reply_enabled column';
    ELSE
        RAISE NOTICE '⏭️ auto_reply_enabled column already exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'business_settings' AND column_name = 'auto_post_enabled') THEN
        ALTER TABLE business_settings ADD COLUMN auto_post_enabled boolean DEFAULT false;
        RAISE NOTICE '✅ Added auto_post_enabled column';
    ELSE
        RAISE NOTICE '⏭️ auto_post_enabled column already exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'business_settings' AND column_name = 'email_notifications_enabled') THEN
        ALTER TABLE business_settings ADD COLUMN email_notifications_enabled boolean DEFAULT true;
        RAISE NOTICE '✅ Added email_notifications_enabled column';
    ELSE
        RAISE NOTICE '⏭️ email_notifications_enabled column already exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'business_settings' AND column_name = 'auto_sync_slot') THEN
        ALTER TABLE business_settings ADD COLUMN auto_sync_slot text DEFAULT 'slot_1'
            CHECK (auto_sync_slot IN ('slot_1', 'slot_2'));
        RAISE NOTICE '✅ Added auto_sync_slot column';
    ELSE
        RAISE NOTICE '⏭️ auto_sync_slot column already exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'business_settings' AND column_name = 'last_automation_run') THEN
        ALTER TABLE business_settings ADD COLUMN last_automation_run timestamptz;
        RAISE NOTICE '✅ Added last_automation_run column';
    ELSE
        RAISE NOTICE '⏭️ last_automation_run column already exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'business_settings' AND column_name = 'automation_errors') THEN
        ALTER TABLE business_settings ADD COLUMN automation_errors jsonb DEFAULT '[]'::jsonb;
        RAISE NOTICE '✅ Added automation_errors column';
    ELSE
        RAISE NOTICE '⏭️ automation_errors column already exists';
    END IF;
END $$;

-- Add automation columns to reviews table (safe if they already exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'reviews' AND column_name = 'automated_reply') THEN
        ALTER TABLE reviews ADD COLUMN automated_reply boolean DEFAULT false;
        RAISE NOTICE '✅ Added automated_reply column to reviews';
    ELSE
        RAISE NOTICE '⏭️ automated_reply column already exists in reviews';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'reviews' AND column_name = 'automation_failed') THEN
        ALTER TABLE reviews ADD COLUMN automation_failed boolean DEFAULT false;
        RAISE NOTICE '✅ Added automation_failed column to reviews';
    ELSE
        RAISE NOTICE '⏭️ automation_failed column already exists in reviews';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'reviews' AND column_name = 'automation_error') THEN
        ALTER TABLE reviews ADD COLUMN automation_error text;
        RAISE NOTICE '✅ Added automation_error column to reviews';
    ELSE
        RAISE NOTICE '⏭️ automation_error column already exists in reviews';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'reviews' AND column_name = 'auto_approved') THEN
        ALTER TABLE reviews ADD COLUMN auto_approved boolean DEFAULT false;
        RAISE NOTICE '✅ Added auto_approved column to reviews';
    ELSE
        RAISE NOTICE '⏭️ auto_approved column already exists in reviews';
    END IF;
END $$;

-- Ensure activities table allows NULL business_id for system-level activities
DO $$
BEGIN
    -- Check if business_id column is NOT NULL, modify if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'activities'
               AND column_name = 'business_id'
               AND is_nullable = 'NO') THEN
        ALTER TABLE activities ALTER COLUMN business_id DROP NOT NULL;
        RAISE NOTICE '✅ Modified activities.business_id to allow NULL for system activities';
    ELSE
        RAISE NOTICE '⏭️ activities.business_id already allows NULL';
    END IF;
END $$;

-- ====================================================================
-- PHASE 3: INDEXES FOR PERFORMANCE
-- ====================================================================

-- Add indexes for automation queries
CREATE INDEX IF NOT EXISTS idx_business_settings_auto_sync
ON business_settings (auto_sync_enabled, auto_sync_slot)
WHERE auto_sync_enabled = true;

CREATE INDEX IF NOT EXISTS idx_reviews_automation
ON reviews (business_id, status, automated_reply, automation_failed)
WHERE automated_reply = false AND automation_failed = false;

DO $$
BEGIN
    RAISE NOTICE '✅ Performance indexes created';
END $$;

-- ====================================================================
-- PHASE 4: DATABASE FUNCTIONS
-- ====================================================================

-- Create function to trigger daily review sync via Edge Function
CREATE OR REPLACE FUNCTION trigger_daily_review_sync(slot_id text DEFAULT 'slot_1')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    edge_function_url text;
    request_id bigint;
    service_role_key text;
BEGIN
    -- Set the Edge Function URL (update with your project reference)
    edge_function_url := 'https://nysjjhupnvnshizudfnn.supabase.co/functions/v1/daily-review-sync';

    -- Get service role key from environment (this will be set by Supabase)
    service_role_key := current_setting('app.supabase_service_role_key', true);

    -- If service role key is not set, use a placeholder that the Edge Function will handle
    IF service_role_key IS NULL OR service_role_key = '' THEN
        service_role_key := 'CRON_JOB_TRIGGER';
    END IF;

    -- Log the sync attempt
    INSERT INTO activities (business_id, type, description, metadata)
    VALUES (
        NULL,
        'settings_updated'::activity_type,
        'Daily automated review sync triggered via pg_cron for ' || slot_id,
        jsonb_build_object(
            'trigger_time', NOW(),
            'function_url', edge_function_url,
            'source', 'pg_cron',
            'slot_id', slot_id,
            'activity_subtype', 'review_sync_scheduled'
        )
    );

    -- Make HTTP request to Edge Function using pg_net
    SELECT INTO request_id
        net.http_post(
            url := edge_function_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || service_role_key
            ),
            body := jsonb_build_object(
                'trigger_source', 'pg_cron',
                'trigger_time', NOW(),
                'slot_id', slot_id
            )
        );

    -- Log that the request was sent (response will be handled asynchronously)
    INSERT INTO activities (business_id, type, description, metadata)
    VALUES (
        NULL,
        'settings_updated'::activity_type,
        'HTTP request sent to daily review sync Edge Function for ' || slot_id,
        jsonb_build_object(
            'request_id', request_id,
            'function_url', edge_function_url,
            'timestamp', NOW(),
            'slot_id', slot_id,
            'activity_subtype', 'review_sync_request_sent'
        )
    );

    RAISE NOTICE 'Daily review sync triggered for % with request ID: %', slot_id, request_id;

EXCEPTION WHEN OTHERS THEN
    -- Log any errors
    INSERT INTO activities (business_id, type, description, metadata)
    VALUES (
        NULL,
        'settings_updated'::activity_type,
        'Failed to trigger daily review sync for ' || slot_id || ': ' || SQLERRM,
        jsonb_build_object(
            'error', SQLERRM,
            'error_state', SQLSTATE,
            'timestamp', NOW(),
            'source', 'pg_cron_function',
            'slot_id', slot_id,
            'activity_subtype', 'review_sync_error'
        )
    );

    RAISE NOTICE 'Error triggering daily review sync for %: %', slot_id, SQLERRM;
END;
$$;

-- Create manual test function
CREATE OR REPLACE FUNCTION manual_review_sync_test(slot_id text DEFAULT 'slot_1')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Validate slot_id
    IF slot_id NOT IN ('slot_1', 'slot_2') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid slot_id. Must be slot_1 or slot_2',
            'timestamp', NOW()
        );
    END IF;

    -- Call the trigger function
    PERFORM trigger_daily_review_sync(slot_id);

    -- Return status
    result := jsonb_build_object(
        'success', true,
        'message', 'Manual review sync test triggered for ' || slot_id,
        'slot_id', slot_id,
        'timestamp', NOW(),
        'note', 'Check activities table for execution details'
    );

    RETURN result;
END;
$$;

-- Create function to get businesses eligible for auto sync
CREATE OR REPLACE FUNCTION get_auto_sync_businesses(slot_filter text DEFAULT NULL)
RETURNS TABLE (
    business_id uuid,
    business_name text,
    user_id uuid,
    google_business_id text,
    last_review_sync timestamptz,
    auto_sync_enabled boolean,
    auto_sync_slot text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id,
        b.name,
        b.user_id,
        b.google_business_id,
        b.last_review_sync,
        bs.auto_sync_enabled,
        bs.auto_sync_slot
    FROM businesses b
    INNER JOIN business_settings bs ON b.id = bs.business_id
    WHERE bs.auto_sync_enabled = true
      AND b.google_business_id IS NOT NULL
      AND b.google_access_token IS NOT NULL
      AND (slot_filter IS NULL OR bs.auto_sync_slot = slot_filter);
END;
$$;

DO $$
BEGIN
    RAISE NOTICE '✅ Database functions created successfully';
END $$;

-- ====================================================================
-- PHASE 5: MONITORING VIEWS
-- ====================================================================

-- Create a view to monitor scheduled jobs
CREATE OR REPLACE VIEW scheduled_jobs AS
SELECT
    jobname,
    schedule,
    active,
    command,
    database
FROM cron.job
WHERE jobname LIKE 'daily-review-sync%';

-- Create a view to monitor sync activities
CREATE OR REPLACE VIEW sync_activities AS
SELECT
    id,
    business_id,
    type,
    description,
    metadata,
    created_at,
    metadata->>'activity_subtype' as sync_type,
    metadata->>'slot_id' as slot_id,
    metadata->>'request_id' as request_id
FROM activities
WHERE metadata->>'activity_subtype' IN (
    'review_sync_automated',
    'review_sync_scheduled',
    'review_sync_error',
    'review_sync_request_sent'
)
OR description ILIKE '%review sync%'
ORDER BY created_at DESC
LIMIT 100;

DO $$
BEGIN
    RAISE NOTICE '✅ Monitoring views created';
END $$;

-- ====================================================================
-- PHASE 6: PERMISSIONS AND SECURITY
-- ====================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION trigger_daily_review_sync() TO postgres;
GRANT EXECUTE ON FUNCTION manual_review_sync_test() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_auto_sync_businesses() TO authenticated, anon;

-- Grant access to monitoring views
GRANT SELECT ON scheduled_jobs TO authenticated, anon;
GRANT SELECT ON sync_activities TO authenticated, anon;

-- Ensure RLS is enabled on business_settings
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Update RLS policy for business_settings (safe to drop and recreate)
DROP POLICY IF EXISTS "Users can manage their business settings" ON business_settings;

CREATE POLICY "Users can manage their business settings" ON business_settings
    FOR ALL USING (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
        )
    );

DO $$
BEGIN
    RAISE NOTICE '✅ Permissions and RLS policies configured';
END $$;

-- ====================================================================
-- PHASE 7: CRON JOB SCHEDULING
-- ====================================================================

-- Remove existing cron jobs if they exist (safe cleanup)
SELECT cron.unschedule('daily-review-sync-slot-1') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'daily-review-sync-slot-1'
);
SELECT cron.unschedule('daily-review-sync-slot-2') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'daily-review-sync-slot-2'
);

-- Create two scheduled jobs for different time slots
-- Slot 1: 12:00 PM UTC (good for Europe/Africa business hours)
SELECT cron.schedule(
    'daily-review-sync-slot-1',
    '0 12 * * *',  -- Every day at 12:00 PM UTC
    'SELECT trigger_daily_review_sync(''slot_1'');'
);

-- Slot 2: 12:00 AM UTC (good for Americas/Asia business hours)
SELECT cron.schedule(
    'daily-review-sync-slot-2',
    '0 0 * * *',   -- Every day at 12:00 AM UTC (midnight)
    'SELECT trigger_daily_review_sync(''slot_2'');'
);

DO $$
BEGIN
    RAISE NOTICE '✅ Cron jobs scheduled successfully';
END $$;

-- ====================================================================
-- PHASE 8: VERIFICATION AND TESTING
-- ====================================================================

-- Verify cron jobs were created
DO $$
DECLARE
    cron_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO cron_count
    FROM cron.job
    WHERE jobname LIKE 'daily-review-sync%';

    IF cron_count = 2 THEN
        RAISE NOTICE '✅ SUCCESS: Both cron jobs (slot_1 and slot_2) are scheduled';
    ELSE
        RAISE WARNING '⚠️ WARNING: Expected 2 cron jobs, found %', cron_count;
    END IF;
END $$;

-- Verify automation columns exist
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'business_settings'
    AND column_name IN ('auto_sync_enabled', 'auto_reply_enabled', 'auto_post_enabled', 'auto_sync_slot');

    IF column_count = 4 THEN
        RAISE NOTICE '✅ SUCCESS: All automation columns exist in business_settings';
    ELSE
        RAISE WARNING '⚠️ WARNING: Expected 4 automation columns, found %', column_count;
    END IF;
END $$;

-- Verify database functions exist
DO $$
DECLARE
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO function_count
    FROM pg_proc
    WHERE proname IN ('trigger_daily_review_sync', 'manual_review_sync_test', 'get_auto_sync_businesses');

    IF function_count >= 3 THEN
        RAISE NOTICE '✅ SUCCESS: All database functions created';
    ELSE
        RAISE WARNING '⚠️ WARNING: Expected 3+ functions, found %', function_count;
    END IF;
END $$;

-- Enable automation for test business (optional - uncomment to activate)
/*
UPDATE business_settings
SET
    auto_sync_enabled = true,
    auto_reply_enabled = true,
    auto_post_enabled = true,
    email_notifications_enabled = true,
    auto_sync_slot = 'slot_1',
    updated_at = NOW()
WHERE business_id IN (
    SELECT id FROM businesses WHERE name ILIKE '%quiksilver%'
);
*/

COMMIT;

-- ====================================================================
-- DEPLOYMENT COMPLETE - SUMMARY
-- ====================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '🎉 REPLIFAST AUTOMATION SYSTEM DEPLOYMENT COMPLETE!';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ What was deployed:';
    RAISE NOTICE '   • pg_cron and pg_net extensions enabled';
    RAISE NOTICE '   • Automation columns added to business_settings and reviews';
    RAISE NOTICE '   • Database functions for sync triggering and testing';
    RAISE NOTICE '   • Two cron jobs scheduled (slot_1: 12PM UTC, slot_2: 12AM UTC)';
    RAISE NOTICE '   • Monitoring views for job and activity tracking';
    RAISE NOTICE '   • Security permissions and RLS policies';
    RAISE NOTICE '   • Performance indexes for automation queries';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 IMMEDIATE TESTING:';
    RAISE NOTICE '   SELECT manual_review_sync_test(''slot_1'');';
    RAISE NOTICE '   SELECT manual_review_sync_test(''slot_2'');';
    RAISE NOTICE '';
    RAISE NOTICE '📊 MONITORING QUERIES:';
    RAISE NOTICE '   SELECT * FROM scheduled_jobs;';
    RAISE NOTICE '   SELECT * FROM sync_activities;';
    RAISE NOTICE '   SELECT * FROM get_auto_sync_businesses();';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ NEXT STEPS REQUIRED:';
    RAISE NOTICE '   1. Deploy Edge Function: supabase functions deploy daily-review-sync';
    RAISE NOTICE '   2. Set NEXT_PUBLIC_APP_URL in Edge Function environment';
    RAISE NOTICE '   3. Enable automation for businesses in Settings UI';
    RAISE NOTICE '   4. Test complete pipeline with manual trigger';
    RAISE NOTICE '';
    RAISE NOTICE '📖 Full documentation: docs/automated-sync-setup.md';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '';
END $$;
