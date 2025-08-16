-- Daily Review Sync Automation Setup for RepliFast
-- This SQL sets up automated daily review syncing using Supabase pg_cron
-- Execute this in your Supabase SQL Editor

-- Enable required extensions for scheduling and HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add automated sync settings to business_settings table
ALTER TABLE business_settings 
ADD COLUMN IF NOT EXISTS auto_sync_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_sync_time text DEFAULT '12:00',
ADD COLUMN IF NOT EXISTS auto_sync_timezone text DEFAULT 'UTC';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_settings_auto_sync 
ON business_settings (auto_sync_enabled) 
WHERE auto_sync_enabled = true;

-- For activities table, we'll use existing enum values and cast text to avoid enum issues
-- The activities will be stored with the enum type but we'll handle sync activities specially

-- Update activities table to allow NULL business_id for system-level activities
ALTER TABLE activities 
ALTER COLUMN business_id DROP NOT NULL;

-- Create function to trigger daily review sync via Edge Function
CREATE OR REPLACE FUNCTION trigger_daily_review_sync()
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
    edge_function_url := 'https://tanxlkgdefjsdynwqend.supabase.co/functions/v1/daily-review-sync';
    
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
        'Daily automated review sync triggered via pg_cron',
        jsonb_build_object(
            'trigger_time', NOW(),
            'function_url', edge_function_url,
            'source', 'pg_cron',
            'timezone', 'UTC',
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
                'trigger_time', NOW()
            )
        );
    
    -- Log that the request was sent (response will be handled asynchronously)
    INSERT INTO activities (business_id, type, description, metadata)
    VALUES (
        NULL,
        'settings_updated'::activity_type,
        'HTTP request sent to daily review sync Edge Function',
        jsonb_build_object(
            'request_id', request_id,
            'function_url', edge_function_url,
            'timestamp', NOW(),
            'activity_subtype', 'review_sync_request_sent'
        )
    );
    
    RAISE NOTICE 'Daily review sync triggered with request ID: %', request_id;
    
EXCEPTION WHEN OTHERS THEN
    -- Log any errors
    INSERT INTO activities (business_id, type, description, metadata)
    VALUES (
        NULL,
        'settings_updated'::activity_type,
        'Failed to trigger daily review sync: ' || SQLERRM,
        jsonb_build_object(
            'error', SQLERRM,
            'error_state', SQLSTATE,
            'timestamp', NOW(),
            'source', 'pg_cron_function',
            'activity_subtype', 'review_sync_error'
        )
    );
    
    RAISE NOTICE 'Error triggering daily review sync: %', SQLERRM;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION trigger_daily_review_sync() TO postgres;

-- Create the scheduled job for daily execution at 12:00 PM UTC
-- Note: This uses UTC time. The Edge Function can handle timezone conversion if needed.
SELECT cron.schedule(
    'daily-review-sync',
    '0 12 * * *',  -- Every day at 12:00 PM UTC
    'SELECT trigger_daily_review_sync();'
);

-- Add a manual trigger function for testing
CREATE OR REPLACE FUNCTION manual_review_sync_test()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Call the trigger function
    PERFORM trigger_daily_review_sync();
    
    -- Return status
    result := jsonb_build_object(
        'success', true,
        'message', 'Manual review sync test triggered',
        'timestamp', NOW(),
        'note', 'Check activities table for execution details'
    );
    
    RETURN result;
END;
$$;

-- Grant execute permission on the test function
GRANT EXECUTE ON FUNCTION manual_review_sync_test() TO authenticated, anon;

-- Create a view to monitor scheduled jobs
CREATE OR REPLACE VIEW scheduled_jobs AS
SELECT 
    jobname,
    schedule,
    active,
    command
FROM cron.job
WHERE jobname = 'daily-review-sync';

-- Grant access to the view
GRANT SELECT ON scheduled_jobs TO authenticated, anon;

-- Create a view to monitor sync activities
CREATE OR REPLACE VIEW sync_activities AS
SELECT 
    id,
    business_id,
    type,
    description,
    metadata,
    created_at,
    metadata->>'activity_subtype' as sync_type
FROM activities
WHERE metadata->>'activity_subtype' IN (
    'review_sync_automated',
    'review_sync_scheduled', 
    'review_sync_error',
    'review_sync_request_sent'
)
OR description ILIKE '%review sync%'
ORDER BY created_at DESC
LIMIT 50;

-- Grant access to the sync activities view
GRANT SELECT ON sync_activities TO authenticated, anon;

-- Create function to get businesses eligible for auto sync
CREATE OR REPLACE FUNCTION get_auto_sync_businesses()
RETURNS TABLE (
    business_id uuid,
    business_name text,
    user_id uuid,
    google_business_id text,
    last_review_sync timestamptz,
    auto_sync_enabled boolean,
    auto_sync_time text
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
        bs.auto_sync_time
    FROM businesses b
    INNER JOIN business_settings bs ON b.id = bs.business_id
    WHERE bs.auto_sync_enabled = true
      AND b.google_business_id IS NOT NULL
      AND b.google_access_token IS NOT NULL;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_auto_sync_businesses() TO authenticated, anon;

-- Add RLS policies for the new columns
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Update existing RLS policy for business_settings if it exists
DROP POLICY IF EXISTS "Users can manage their business settings" ON business_settings;

CREATE POLICY "Users can manage their business settings" ON business_settings
    FOR ALL USING (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
        )
    );

-- Add comments for documentation
COMMENT ON FUNCTION trigger_daily_review_sync() IS 'Triggers the daily review sync by calling the Supabase Edge Function via HTTP request';
COMMENT ON FUNCTION manual_review_sync_test() IS 'Manual test function to trigger review sync for testing purposes';
COMMENT ON FUNCTION get_auto_sync_businesses() IS 'Returns list of businesses with auto sync enabled and valid Google credentials';
COMMENT ON VIEW scheduled_jobs IS 'View to monitor the status of scheduled review sync jobs';
COMMENT ON VIEW sync_activities IS 'View to monitor recent sync-related activities and their status';

-- Display setup completion message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ Daily Review Sync Setup Complete!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What was created:';
    RAISE NOTICE '  • pg_cron extension enabled';
    RAISE NOTICE '  • pg_net extension enabled';
    RAISE NOTICE '  • Auto sync columns added to business_settings';
    RAISE NOTICE '  • Daily cron job scheduled for 12:00 PM UTC';
    RAISE NOTICE '  • Edge Function trigger system created';
    RAISE NOTICE '  • Monitoring views and test functions added';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 To test the setup:';
    RAISE NOTICE '  SELECT manual_review_sync_test();';
    RAISE NOTICE '';
    RAISE NOTICE '📊 To monitor:';
    RAISE NOTICE '  SELECT * FROM scheduled_jobs;';
    RAISE NOTICE '  SELECT * FROM sync_activities;';
    RAISE NOTICE '  SELECT * FROM get_auto_sync_businesses();';
    RAISE NOTICE '  SELECT * FROM cron.job WHERE jobname = ''daily-review-sync'';';
    RAISE NOTICE '';
    RAISE NOTICE '⚙️ Next steps:';
    RAISE NOTICE '  1. Deploy the Edge Function to Supabase';
    RAISE NOTICE '  2. Enable auto_sync_enabled in Settings UI';
    RAISE NOTICE '  3. Test with manual_review_sync_test()';
    RAISE NOTICE '';
END $$;